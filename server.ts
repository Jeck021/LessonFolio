import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { Content, FunctionDeclaration, GenerateContentResponse, Part } from '@google/genai';

const PORT = Number(process.env.PORT) || 3000;
const PRIMARY_MODEL = 'gemini-4-hydrogen';
const LITE_MODEL = 'gemini-3.1-flash-lite';
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const UNHEALTHY_COOLDOWN_MS = 90 * 1000;
const SEARCH_TIMEOUT_MS = 6500;
const CHAT_TIMEOUT_MS = 9000;

interface CachedSearchEntry {
  expiresAt: number;
  payload: {
    summaryNote: string;
    results: SearchResultPayload[];
    webSources: GroundCitation[];
  };
}

const searchResponseCache = new Map<string, CachedSearchEntry>();
const unhealthyRouteUntil = new Map<string, number>();

function routeKey(model: string, useSearch: boolean): string {
  return `${model}::${useSearch ? 'search' : 'plain'}`;
}

function getOrderedAttempts(preferFast = false): { model: string; useSearch: boolean }[] {
  const base: { model: string; useSearch: boolean }[] = preferFast
    ? [
        { model: LITE_MODEL, useSearch: true },
        { model: PRIMARY_MODEL, useSearch: true },
        { model: LITE_MODEL, useSearch: false },
        { model: PRIMARY_MODEL, useSearch: false },
      ]
    : [
        { model: PRIMARY_MODEL, useSearch: true },
        { model: LITE_MODEL, useSearch: true },
        { model: PRIMARY_MODEL, useSearch: false },
        { model: LITE_MODEL, useSearch: false },
      ];
  const now = Date.now();
  const healthy = base.filter((a) => (unhealthyRouteUntil.get(routeKey(a.model, a.useSearch)) ?? 0) <= now);
  if (healthy.length > 0) {
    return healthy;
  }
  // All routes are in cooldown: probe only the single route closest to recovery
  const oldestCooling = [...base].sort(
    (a, b) =>
      (unhealthyRouteUntil.get(routeKey(a.model, a.useSearch)) ?? 0) -
      (unhealthyRouteUntil.get(routeKey(b.model, b.useSearch)) ?? 0)
  )[0];
  return oldestCooling ? [oldestCooling] : base.slice(0, 1);
}

function markRouteUnhealthy(model: string, useSearch: boolean) {
  unhealthyRouteUntil.set(routeKey(model, useSearch), Date.now() + UNHEALTHY_COOLDOWN_MS);
}

function markRouteHealthy(model: string, useSearch: boolean) {
  unhealthyRouteUntil.delete(routeKey(model, useSearch));
}

function withTimeout<T>(promise: Promise<T>, ms = SEARCH_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('503 Request timed out')), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

const VALID_GRADES = ['All K-12', 'K-2', '3-5', '6-8', '9-12'] as const;
const VALID_TYPES = [
  'Lesson Plan',
  'Activity',
  'Video & Media',
  'Assessment',
  'Reading',
  'AI Guide',
] as const;
const VALID_COLORS = ['sage', 'ochre', 'slate', 'plum', 'teal'] as const;

type GradeBand = (typeof VALID_GRADES)[number];
type ResourceType = (typeof VALID_TYPES)[number];
type FolderColor = (typeof VALID_COLORS)[number];

interface GroundCitation {
  title: string;
  uri: string;
}

interface SearchResultPayload {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  gradeBand: GradeBand;
  resourceType: ResourceType;
  estimatedTime: string;
  keyTakeaways: string[];
}

interface FolderActionPayload {
  type: 'create_folder' | 'save_resource';
  folderName: string;
  gradeBand: GradeBand;
  description?: string;
  colorTag?: FolderColor;
  title?: string;
  url?: string;
  sourceDomain?: string;
  resourceType?: ResourceType;
  estimatedTime?: string;
  summary?: string;
  fullGuideMarkdown?: string;
  keyTakeaways?: string[];
  teacherNotes?: string;
}

function createAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isRateLimitOrQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('RESOURCE_EXHAUSTED') ||
    /"code"\s*:\s*429/.test(msg) ||
    /\b429\b/.test(msg)
  );
}

function isServiceBusyError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('503') ||
    msg.includes('500') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand') ||
    msg.includes('fetch failed')
  );
}

function normalizeGrade(value: unknown, fallback: GradeBand = 'All K-12'): GradeBand {
  if (typeof value === 'string') {
    const match = VALID_GRADES.find((g) => g.toLowerCase() === value.trim().toLowerCase());
    if (match) return match;
  }
  return fallback;
}

function normalizeResourceType(
  value: unknown,
  fallback: ResourceType = 'Lesson Plan'
): ResourceType {
  if (typeof value === 'string') {
    const match = VALID_TYPES.find((t) => t.toLowerCase() === value.trim().toLowerCase());
    if (match) return match;
  }
  return fallback;
}

function normalizeColor(value: unknown): FolderColor {
  if (typeof value === 'string') {
    const match = VALID_COLORS.find((c) => c.toLowerCase() === value.trim().toLowerCase());
    if (match) return match;
  }
  return 'sage';
}

function extractDomain(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '');
  } catch {
    return 'web-resource';
  }
}

function extractCitations(response: GenerateContentResponse): GroundCitation[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];
  const seen = new Set<string>();
  const citations: GroundCitation[] = [];
  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    const title = chunk.web?.title;
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      citations.push({
        title: title?.trim() || extractDomain(uri),
        uri,
      });
    }
  }
  return citations;
}

function parseJsonFromModelText(rawText: string): Record<string, unknown> | null {
  const cleaned = rawText.trim();
  const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : cleaned;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  try {
    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function formatApiError(error: unknown): { status: number; message: string; code: string } {
  const raw = error instanceof Error ? error.message : String(error);
  console.error('[LessonFolio Gemini Error]:', raw);
  if (raw.includes('GEMINI_API_KEY')) {
    return { status: 500, code: 'MISSING_KEY', message: raw };
  }
  if (raw.includes('PERMISSION_DENIED') || raw.includes('403') || raw.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      code: 'AUTH_ERROR',
      message:
        'Gemini API access was denied or the key is invalid. Please check your API key in the Settings > Secrets panel.',
    };
  }
  if (isRateLimitOrQuotaError(error)) {
    return {
      status: 429,
      code: 'RATE_LIMIT',
      message:
        'Gemini API rate limit or free-tier quota was reached. You can check your key in Settings > Secrets, or continue using Offline Search & Offline Assistant.',
    };
  }
  if (isServiceBusyError(error)) {
    return {
      status: 503,
      code: 'MODEL_BUSY',
      message:
        'Gemini API is temporarily experiencing high demand. Please try again shortly, or continue using Offline Search & Offline Assistant.',
    };
  }
  return {
    status: 500,
    code: 'UPSTREAM_ERROR',
    message: raw || 'An unexpected error occurred while contacting the Gemini assistant.',
  };
}

const createLessonFolderDecl: FunctionDeclaration = {
  name: 'createLessonFolder',
  description:
    'Create a new personalized lesson folder in the teacher binder for organizing resources and lesson plans.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'Clear, descriptive folder title, e.g., "7th Grade Photosynthesis Unit".',
      },
      gradeBand: {
        type: Type.STRING,
        description: 'One of: "All K-12", "K-2", "3-5", "6-8", "9-12".',
      },
      description: {
        type: Type.STRING,
        description: 'One-sentence summary of the unit goals or topics covered in this folder.',
      },
      colorTag: {
        type: Type.STRING,
        description: 'One of: "sage", "ochre", "slate", "plum", "teal".',
      },
    },
    required: ['name', 'gradeBand', 'description'],
  },
};

const saveResourceToFolderDecl: FunctionDeclaration = {
  name: 'saveResourceToFolder',
  description:
    'Save a real, verified web resource or classroom material discovered via search into a specific lesson folder.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      folderName: {
        type: Type.STRING,
        description:
          'Exact name of the existing or newly created folder where this resource should be saved.',
      },
      title: {
        type: Type.STRING,
        description: 'Clear title of the classroom resource or lesson activity.',
      },
      url: {
        type: Type.STRING,
        description: 'Real source URL discovered from Google Search grounding.',
      },
      resourceType: {
        type: Type.STRING,
        description:
          'One of: "Lesson Plan", "Activity", "Video & Media", "Assessment", "Reading", "AI Guide".',
      },
      gradeBand: {
        type: Type.STRING,
        description: 'One of: "All K-12", "K-2", "3-5", "6-8", "9-12".',
      },
      estimatedTime: {
        type: Type.STRING,
        description: 'Estimated classroom duration, e.g., "45 min" or "2 class periods".',
      },
      summary: {
        type: Type.STRING,
        description: 'Concise 2-sentence teacher-facing description of how to use this resource.',
      },
      keyTakeaways: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '2-3 brief bullet highlights for the teacher.',
      },
      teacherNotes: {
        type: Type.STRING,
        description: 'Optional helpful prep tip or differentiation note.',
      },
    },
    required: ['folderName', 'title', 'resourceType', 'gradeBand', 'summary'],
  },
};

const createDetailedTeachingGuideDecl: FunctionDeclaration = {
  name: 'createDetailedTeachingGuide',
  description:
    'Draft a rich custom teaching guide (lesson outline, differentiation plan, lab instructions, or rubric/exit ticket) and save it directly into a lesson folder.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      folderName: {
        type: Type.STRING,
        description: 'Target folder name to save this custom guide into.',
      },
      title: {
        type: Type.STRING,
        description: 'Title of the teaching guide or classroom activity.',
      },
      gradeBand: {
        type: Type.STRING,
        description: 'One of: "All K-12", "K-2", "3-5", "6-8", "9-12".',
      },
      estimatedTime: {
        type: Type.STRING,
        description: 'Estimated duration, e.g., "45 min".',
      },
      summary: {
        type: Type.STRING,
        description: 'One-sentence overview of the guide.',
      },
      fullGuideMarkdown: {
        type: Type.STRING,
        description:
          'Complete structured Markdown teaching guide with Objectives, Warm-Up, Main Activity, Differentiation (ELL/SPED/Extension), and Exit Ticket.',
      },
      teacherNotes: {
        type: Type.STRING,
        description: 'Brief classroom prep checklist note.',
      },
    },
    required: ['folderName', 'title', 'gradeBand', 'summary', 'fullGuideMarkdown'],
  },
};

const app = express();
app.use(express.json({ limit: '2mb' }));

const LANGUAGE_PROMPT_NAMES: Record<string, string> = {
  en: 'English',
  tl: 'Tagalog (Filipino)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  ja: 'Japanese (日本語)',
  id: 'Indonesian (Bahasa Indonesia)',
  pt: 'Portuguese (Português)',
};

app.post('/api/search', async (req, res) => {
  try {
    const {
      query,
      gradeBand = 'All K-12',
      resourceType = 'All',
      language = 'en',
    } = req.body ?? {};
    if (typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Please enter a topic or resource query to search.' });
      return;
    }

    const cacheKey = `${query.trim().toLowerCase()}::${gradeBand}::${resourceType}::${language}`;
    const cached = searchResponseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.json(cached.payload);
      return;
    }

    const ai = createAiClient();
    const targetLangName = LANGUAGE_PROMPT_NAMES[String(language)] || 'English';
    const formatInstruction =
      resourceType && resourceType !== 'All'
        ? `Prioritize "${resourceType}" resources.`
        : 'Include a helpful mix of Lesson Plans, Activities, Videos/Media, Readings, and Assessments.';

    const prompt = `Search for high-quality K-12 classroom resources matching:
Query: "${query.trim()}"
Grade: ${gradeBand}
Language: ${targetLangName}
Format: ${formatInstruction}

Return ONLY valid JSON:
{
  "summaryNote": "1-2 sentence overview for the teacher.",
  "results": [
    {
      "title": "Resource title",
      "url": "Exact verified https URL",
      "snippet": "Concise 1-2 sentence classroom summary.",
      "gradeBand": "All K-12 | K-2 | 3-5 | 6-8 | 9-12",
      "resourceType": "Lesson Plan | Activity | Video & Media | Assessment | Reading",
      "estimatedTime": "e.g. 45 min",
      "keyTakeaways": ["Takeaway 1", "Takeaway 2"]
    }
  ]
}
Provide 4 to 5 concise, classroom-ready resources.`;

    let response: GenerateContentResponse;
    let usedWebGrounding = true;

    const searchAttempts = getOrderedAttempts(true);

    let lastSearchError: unknown = null;
    let succeededResponse: GenerateContentResponse | null = null;

    for (const attempt of searchAttempts) {
      try {
        const resAttempt = await withTimeout(
          ai.models.generateContent({
            model: attempt.model,
            contents: prompt,
            config: {
              ...(attempt.model === PRIMARY_MODEL
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
              systemInstruction: `You are a fast, practical K-12 curriculum librarian. Write summaryNote, snippet, and keyTakeaways in ${targetLangName} (keeping JSON keys and gradeBand/resourceType enum values in English). ${
                attempt.useSearch
                  ? 'Ground results in Google Search and return valid JSON.'
                  : 'Only include established educational domains (phet.colorado.edu, khanacademy.org, nationalgeographic.org, edutopia.org, deped.gov.ph) or leave url empty, and return valid JSON.'
              }`,
              ...(attempt.useSearch ? { tools: [{ googleSearch: {} }] } : {}),
            },
          })
        );
        markRouteHealthy(attempt.model, attempt.useSearch);
        succeededResponse = resAttempt;
        usedWebGrounding = attempt.useSearch;
        break;
      } catch (err) {
        lastSearchError = err;
        markRouteUnhealthy(attempt.model, attempt.useSearch);
        console.warn(
          `[Search fallback] ${attempt.model} (search=${attempt.useSearch}) failed:`,
          err instanceof Error ? err.message : String(err)
        );
        if (!isRateLimitOrQuotaError(err) && !isServiceBusyError(err)) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes('404') && !msg.includes('NOT_FOUND') && !msg.includes('400')) {
            throw err;
          }
        }
      }
    }

    if (!succeededResponse) {
      throw lastSearchError ?? new Error('All Gemini search attempts failed.');
    }
    response = succeededResponse;

    const webSources = usedWebGrounding ? extractCitations(response) : [];
    const rawText = response.text ?? '';
    const parsed = parseJsonFromModelText(rawText);
    const rawResults = Array.isArray(parsed?.results) ? parsed.results : [];

    const results: SearchResultPayload[] = rawResults.map((item, idx) => {
      const record = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      const fallbackSource = webSources[idx] ?? webSources[0];
      const urlCandidate =
        typeof record.url === 'string' && record.url.startsWith('http')
          ? record.url
          : fallbackSource?.uri ?? '';

      const takeaways = Array.isArray(record.keyTakeaways)
        ? record.keyTakeaways.filter((t): t is string => typeof t === 'string').slice(0, 4)
        : [];

      return {
        id: `sr-${Date.now()}-${idx}`,
        title:
          typeof record.title === 'string' && record.title.trim()
            ? record.title.trim()
            : fallbackSource?.title ?? `Classroom Resource ${idx + 1}`,
        url: urlCandidate,
        domain: urlCandidate ? extractDomain(urlCandidate) : 'educational-web',
        snippet:
          typeof record.snippet === 'string' && record.snippet.trim()
            ? record.snippet.trim()
            : 'Classroom resource discovered via live search.',
        gradeBand: normalizeGrade(record.gradeBand, normalizeGrade(gradeBand)),
        resourceType: normalizeResourceType(record.resourceType, 'Lesson Plan'),
        estimatedTime:
          typeof record.estimatedTime === 'string' && record.estimatedTime.trim()
            ? record.estimatedTime.trim()
            : '45 min',
        keyTakeaways: takeaways,
      };
    });

    // If model returned prose instead of parseable JSON, fall back gracefully to grounded citations
    if (results.length === 0 && webSources.length > 0) {
      webSources.slice(0, 6).forEach((src, idx) => {
        results.push({
          id: `sr-fallback-${Date.now()}-${idx}`,
          title: src.title,
          url: src.uri,
          domain: extractDomain(src.uri),
          snippet: rawText.slice(0, 220) || 'Grounded web resource for your classroom search.',
          gradeBand: normalizeGrade(gradeBand),
          resourceType: 'Lesson Plan',
          estimatedTime: '45 min',
          keyTakeaways: [],
        });
      });
    }

    const summaryNote =
      typeof parsed?.summaryNote === 'string' && parsed.summaryNote.trim()
        ? parsed.summaryNote.trim()
        : `Found ${results.length} classroom resources for "${query.trim()}".`;

    const payload = {
      summaryNote,
      results,
      webSources,
    };

    if (results.length > 0) {
      searchResponseCache.set(cacheKey, {
        expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
        payload,
      });
    }

    res.json(payload);
  } catch (error) {
    const formatted = formatApiError(error);
    res.status(formatted.status).json({ error: formatted.message, code: formatted.code });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages = [],
      folders = [],
      activeFolderId = null,
      activeFolderResources = [],
      language = 'en',
    } = req.body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    const ai = createAiClient();
    const targetLangName = LANGUAGE_PROMPT_NAMES[String(language)] || 'English';

    const folderSummary = Array.isArray(folders)
      ? folders
          .map(
            (f: Record<string, unknown>) =>
              `- "${f.name}" (Grade: ${f.gradeBand}, ID: ${f.id}${
                f.id === activeFolderId ? ', CURRENTLY OPEN' : ''
              }): ${f.description || 'No description'}`
          )
          .join('\n')
      : 'None yet';

    const activeItemsSummary = Array.isArray(activeFolderResources)
      ? activeFolderResources
          .slice(0, 8)
          .map(
            (r: Record<string, unknown>) =>
              `  * ${r.title} [${r.resourceType}, ${r.gradeBand}]${r.url ? ` (${r.url})` : ''}`
          )
          .join('\n')
      : '';

    const systemInstruction = `You are LessonFolio's warm, deeply knowledgeable AI Teaching Assistant and Curriculum Coach.
Your mission is to help K-12 teachers go deeper on any teaching topic, adapt lessons for diverse learners (ELL, SPED, gifted), find real trustworthy web resources using Google Search, and actively organize materials into the teacher's personalized folders.

Preferred Teacher Language: ${targetLangName}
Respond warmly in ${targetLangName} (and write saved guide summaries/content in ${targetLangName} unless the teacher writes in another language and asks for that language). Keep tool parameter enum values like gradeBand and resourceType in their exact English schema values.

Current Teacher Folders:
${folderSummary || '(No folders created yet)'}

${activeItemsSummary ? `Resources inside the currently open folder:\n${activeItemsSummary}` : ''}

How to behave:
1. Be warm, encouraging, practical, and deeply informative—give concrete classroom strategies, timing, discussion questions, misconceptions to watch for, and differentiation tips.
2. When teachers ask for links, articles, videos, primary sources, or external materials, ALWAYS use Google Search grounding so every URL you cite or save is real.
3. When the teacher asks you to create a folder, organize a unit, or save/add resources to a folder (or when you proactively create a helpful folder/guide as requested), call your tools:
   - \`createLessonFolder\` to make a new folder
   - \`saveResourceToFolder\` to file real web resources you found
   - \`createDetailedTeachingGuide\` to save a complete custom lesson outline, lab sheet, rubric, or differentiated guide directly into a folder
4. If the teacher says "save this to my current folder" or doesn't name a folder, save into the folder marked CURRENTLY OPEN (or create a fitting new folder if none exist).
5. Use clear Markdown headings and concise bullet points in your reply so busy teachers can scan it effortlessly.
6. Keep replies focused and crisp (roughly 200-350 words unless writing a full lesson guide) so teachers get fast, actionable answers.`;

    const conversationContents: Content[] = messages
      .slice(-8)
      .filter(
        (m: unknown): m is { role: string; content: string } =>
          Boolean(m) &&
          typeof m === 'object' &&
          typeof (m as { content?: unknown }).content === 'string'
      )
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const allCitations: GroundCitation[] = [];
    const seenUris = new Set<string>();
    const folderActions: FolderActionPayload[] = [];
    let finalReplyText = '';

    let activeModel = getOrderedAttempts(false)[0]?.model ?? PRIMARY_MODEL;
    let includeGoogleSearch = getOrderedAttempts(false)[0]?.useSearch ?? true;

    for (let round = 0; round < 3; round++) {
      let response: GenerateContentResponse | null = null;
      let roundError: unknown = null;

      const ordered = getOrderedAttempts(false);
      const chatAttempts = [
        { model: activeModel, useSearch: includeGoogleSearch },
        ...ordered.filter(
          (a) => !(a.model === activeModel && a.useSearch === includeGoogleSearch)
        ),
      ];

      for (const attempt of chatAttempts) {
        try {
          const attemptTools = attempt.useSearch
            ? [
                { googleSearch: {} },
                {
                  functionDeclarations: [
                    createLessonFolderDecl,
                    saveResourceToFolderDecl,
                    createDetailedTeachingGuideDecl,
                  ],
                },
              ]
            : [
                {
                  functionDeclarations: [
                    createLessonFolderDecl,
                    saveResourceToFolderDecl,
                    createDetailedTeachingGuideDecl,
                  ],
                },
              ];

          response = await withTimeout(
            ai.models.generateContent({
              model: attempt.model,
              contents: conversationContents,
              config: {
                ...(attempt.model === PRIMARY_MODEL
                  ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                  : {}),
                systemInstruction,
                tools: attemptTools,
                ...(attempt.useSearch
                  ? { toolConfig: { includeServerSideToolInvocations: true } }
                  : {}),
              },
            }),
            CHAT_TIMEOUT_MS
          );
          markRouteHealthy(attempt.model, attempt.useSearch);
          activeModel = attempt.model;
          includeGoogleSearch = attempt.useSearch;
          break;
        } catch (err) {
          roundError = err;
          markRouteUnhealthy(attempt.model, attempt.useSearch);
          console.warn(
            `[Chat fallback] ${attempt.model} (search=${attempt.useSearch}) failed:`,
            err instanceof Error ? err.message : String(err)
          );
          if (!isRateLimitOrQuotaError(err) && !isServiceBusyError(err)) {
            const msg = err instanceof Error ? err.message : String(err);
            if (!msg.includes('404') && !msg.includes('NOT_FOUND') && !msg.includes('400')) {
              throw err;
            }
          }
        }
      }

      if (!response) {
        throw roundError ?? new Error('Unable to reach Gemini assistant.');
      }

      for (const c of extractCitations(response)) {
        if (!seenUris.has(c.uri)) {
          seenUris.add(c.uri);
          allCitations.push(c);
        }
      }

      const candidateContent = response.candidates?.[0]?.content;
      const functionCalls = response.functionCalls;

      if (!functionCalls || functionCalls.length === 0) {
        finalReplyText = response.text ?? '';
        break;
      }

      if (candidateContent) {
        conversationContents.push(candidateContent);
      }

      const functionResponseParts: Part[] = [];

      for (const call of functionCalls) {
        const args = (call.args ?? {}) as Record<string, unknown>;
        let toolResult: Record<string, unknown> = { ok: true };

        if (call.name === 'createLessonFolder') {
          const folderName =
            typeof args.name === 'string' && args.name.trim()
              ? args.name.trim()
              : 'New Lesson Folder';
          const gradeBand = normalizeGrade(args.gradeBand, 'All K-12');
          const description =
            typeof args.description === 'string' ? args.description.trim() : '';
          const colorTag = normalizeColor(args.colorTag);

          folderActions.push({
            type: 'create_folder',
            folderName,
            gradeBand,
            description,
            colorTag,
          });
          toolResult = {
            success: true,
            folderName,
            message: `Folder "${folderName}" created and ready in the teacher's binder.`,
          };
        } else if (call.name === 'saveResourceToFolder') {
          const folderName =
            typeof args.folderName === 'string' && args.folderName.trim()
              ? args.folderName.trim()
              : 'Assistant Saved Resources';
          const title =
            typeof args.title === 'string' && args.title.trim()
              ? args.title.trim()
              : 'Saved Classroom Resource';
          const url = typeof args.url === 'string' && args.url.startsWith('http') ? args.url : undefined;
          const resourceType = normalizeResourceType(args.resourceType, 'Lesson Plan');
          const gradeBand = normalizeGrade(args.gradeBand, 'All K-12');
          const estimatedTime =
            typeof args.estimatedTime === 'string' && args.estimatedTime.trim()
              ? args.estimatedTime.trim()
              : '35 min';
          const summary =
            typeof args.summary === 'string' && args.summary.trim()
              ? args.summary.trim()
              : 'Curated classroom resource.';
          const keyTakeaways = Array.isArray(args.keyTakeaways)
            ? args.keyTakeaways.filter((t): t is string => typeof t === 'string')
            : undefined;
          const teacherNotes =
            typeof args.teacherNotes === 'string' ? args.teacherNotes.trim() : '';

          folderActions.push({
            type: 'save_resource',
            folderName,
            title,
            url,
            sourceDomain: url ? extractDomain(url) : 'LessonFolio Assistant',
            resourceType,
            gradeBand,
            estimatedTime,
            summary,
            keyTakeaways,
            teacherNotes,
          });
          toolResult = {
            success: true,
            folderName,
            title,
            message: `Saved "${title}" into folder "${folderName}".`,
          };
        } else if (call.name === 'createDetailedTeachingGuide') {
          const folderName =
            typeof args.folderName === 'string' && args.folderName.trim()
              ? args.folderName.trim()
              : 'Assistant Teaching Guides';
          const title =
            typeof args.title === 'string' && args.title.trim()
              ? args.title.trim()
              : 'Custom Teaching Guide';
          const gradeBand = normalizeGrade(args.gradeBand, 'All K-12');
          const estimatedTime =
            typeof args.estimatedTime === 'string' && args.estimatedTime.trim()
              ? args.estimatedTime.trim()
              : '45 min';
          const summary =
            typeof args.summary === 'string' && args.summary.trim()
              ? args.summary.trim()
              : 'Custom classroom guide created by LessonFolio Assistant.';
          const fullGuideMarkdown =
            typeof args.fullGuideMarkdown === 'string' ? args.fullGuideMarkdown : '';
          const teacherNotes =
            typeof args.teacherNotes === 'string' ? args.teacherNotes.trim() : '';

          folderActions.push({
            type: 'save_resource',
            folderName,
            title,
            sourceDomain: 'LessonFolio AI Guide',
            resourceType: 'AI Guide',
            gradeBand,
            estimatedTime,
            summary,
            fullGuideMarkdown,
            teacherNotes,
          });
          toolResult = {
            success: true,
            folderName,
            title,
            message: `Teaching guide "${title}" saved into folder "${folderName}".`,
          };
        }

        functionResponseParts.push({
          functionResponse: {
            id: call.id,
            name: call.name ?? 'unknownTool',
            response: toolResult,
          },
        });
      }

      conversationContents.push({
        role: 'user',
        parts: functionResponseParts,
      });
    }

    if (!finalReplyText.trim() && folderActions.length > 0) {
      finalReplyText =
        'I have updated your lesson binder with those folders and resources. You can open them from your sidebar anytime!';
    }

    res.json({
      reply: finalReplyText,
      citations: allCitations,
      folderActions,
    });
  } catch (error) {
    const formatted = formatApiError(error);
    res.status(formatted.status).json({ error: formatted.message, code: formatted.code });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LessonFolio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
