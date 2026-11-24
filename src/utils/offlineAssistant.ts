import { OFFLINE_CURRICULUM_BANK, searchOfflineResources } from '../data/offlineLibrary';
import type { LanguageCode } from '../i18n/translations';
import type { FolderAction, GradeBand, LessonFolder, SavedResource } from '../types';

interface OfflineAssistantInput {
  prompt: string;
  language: LanguageCode;
  folders: LessonFolder[];
  activeFolder: LessonFolder | null;
  activeFolderResources: SavedResource[];
  allResources: SavedResource[];
}

interface OfflineAssistantOutput {
  reply: string;
  folderActions: FolderAction[];
}

function detectGradeFromPrompt(prompt: string, fallback: GradeBand): GradeBand {
  const lower = prompt.toLowerCase();
  if (/\b(k|kinder|kindergarten|grade\s*[12]|baitang\s*[12]|k-2)\b/.test(lower)) return 'K-2';
  if (/\b(grade\s*[345]|baitang\s*[345]|3-5|elementary)\b/.test(lower)) return '3-5';
  if (/\b(grade\s*[678]|baitang\s*[678]|6-8|middle school)\b/.test(lower)) return '6-8';
  if (/\b(grade\s*(9|10|11|12)|baitang\s*(9|10|11|12)|9-12|high school|hayskul)\b/.test(lower))
    return '9-12';
  return fallback;
}

function extractFolderNameFromPrompt(prompt: string): string | null {
  const quoted = prompt.match(/["“]([^"”]{2,60})["”]/);
  if (quoted) return quoted[1].trim();

  const patterns = [
    /(?:folder\s+(?:called|named|for|para sa)\s+)([a-zA-Z0-9À-ÿ\s:\-&]{3,48}?)(?:\s+(?:and|at|with|that|na|then|$))/i,
    /(?:gumawa ng (?:bagong )?folder (?:para sa|tungkol sa)\s+)([a-zA-Z0-9À-ÿ\s:\-&]{3,48}?)(?:\s+(?:at|na|with|and|$))/i,
    /(?:create a (?:new )?folder for\s+)([a-zA-Z0-9À-ÿ\s:\-&]{3,48}?)(?:\s+(?:and|with|that|$))/i,
  ];

  for (const regex of patterns) {
    const match = prompt.match(regex);
    if (match?.[1]) {
      return match[1].trim().replace(/[.,!?]+$/, '');
    }
  }
  return null;
}

function buildTopicSlug(prompt: string): string {
  const cleaned = prompt
    .replace(
      /(create|make|new|folder|save|add|draft|write|suggest|find|gumawa|maghanap|mag-save|i-save|ng|para sa|tungkol sa|my current folder|kasalukuyang folder|lesson|plan|guide|activities|activity|differentiate|strategies|rubric|exit ticket)/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length >= 3) {
    return cleaned.slice(0, 48);
  }
  return 'Classroom Unit';
}

export function runOfflineTeachingAssistant(input: OfflineAssistantInput): OfflineAssistantOutput {
  const { prompt, language, folders, activeFolder, activeFolderResources, allResources } = input;
  const lower = prompt.toLowerCase();
  const isTl = language === 'tl';

  const wantsFolderCreate =
    /(create.*folder|new folder|make.*folder|gumawa.*folder|bagong folder|crear.*carpeta|nouveau dossier)/i.test(
      prompt
    );
  const wantsSave =
    /(save|add to|populate|file into|i-save|ilagay|punan|guardar|enregistrer)/i.test(prompt);
  const wantsDifferentiation =
    /(differentiate|ell|sped|struggling|adapt|iangkop|nahihirapan|estratehiya|strategies)/i.test(
      prompt
    );
  const wantsExitTicketOrRubric =
    /(exit ticket|rubric|rubrik|quiz|assessment|pagtataya|pagsusulit)/i.test(prompt);

  const detectedGrade = detectGradeFromPrompt(
    prompt,
    activeFolder?.gradeBand ?? 'All K-12'
  );
  const actions: FolderAction[] = [];

  // Determine target folder
  let targetFolderName = activeFolder?.name ?? 'Offline Lesson Plans';
  if (wantsFolderCreate) {
    const extractedName = extractFolderNameFromPrompt(prompt);
    const topicTitle = extractedName || `${detectedGrade} ${buildTopicSlug(prompt)}`.trim();
    targetFolderName = topicTitle;
    actions.push({
      type: 'create_folder',
      folderName: targetFolderName,
      gradeBand: detectedGrade,
      description: isTl
        ? `Ginawa nang offline para sa ${targetFolderName} (${detectedGrade}).`
        : `Created offline for ${targetFolderName} (${detectedGrade}).`,
      colorTag: 'sage',
    });
  } else {
    // Check if user named an existing folder
    const matchedExisting = folders.find((f) => lower.includes(f.name.toLowerCase()));
    if (matchedExisting) {
      targetFolderName = matchedExisting.name;
    }
  }

  // Search offline library & user's saved binder for matching content
  const matchedResources = searchOfflineResources({
    query: prompt,
    gradeBand: detectedGrade,
    resourceType: 'All',
    savedResources: allResources,
    languageCode: language,
  });

  const matchedBankEntries = OFFLINE_CURRICULUM_BANK.filter((entry) => {
    const hay = `${entry.title} ${entry.titleTl ?? ''} ${entry.keywords.join(' ')}`.toLowerCase();
    return prompt
      .toLowerCase()
      .split(/\s+/)
      .some((word) => word.length > 3 && hay.includes(word));
  });

  const topicLabel = extractFolderNameFromPrompt(prompt) || buildTopicSlug(prompt);

  // If the teacher asked to save, populate, or draft a guide/exit ticket, create & save real offline resources!
  if (wantsSave || wantsFolderCreate || /draft|lesson guide|banghay/i.test(prompt)) {
    if (matchedBankEntries.length > 0) {
      for (const entry of matchedBankEntries.slice(0, 2)) {
        const title = isTl && entry.titleTl ? entry.titleTl : entry.title;
        const summary = isTl && entry.snippetTl ? entry.snippetTl : entry.snippet;
        const guide =
          isTl && entry.fullGuideMarkdownTl ? entry.fullGuideMarkdownTl : entry.fullGuideMarkdown;

        actions.push({
          type: 'save_resource',
          folderName: targetFolderName,
          title,
          sourceDomain: 'Offline Curriculum Bank',
          resourceType: entry.resourceType,
          gradeBand: entry.gradeBand,
          estimatedTime: entry.estimatedTime,
          summary,
          fullGuideMarkdown: guide,
          keyTakeaways: isTl && entry.keyTakeawaysTl ? entry.keyTakeawaysTl : entry.keyTakeaways,
          teacherNotes: isTl
            ? 'Naka-save mula sa offline curriculum library.'
            : 'Saved from built-in offline curriculum library.',
        });
      }
    }

    // Also synthesize a bespoke structured guide for the teacher's exact topic
    const customTitle = isTl
      ? `Gabay sa Aralin: ${topicLabel}`
      : `Classroom Lesson Guide: ${topicLabel}`;
    const customMarkdown = isTl
      ? `### Layunin ng Aralin (${detectedGrade})
Mauunawaan at mailalapat ng mga mag-aaral ang pangunahing konsepto ng **${topicLabel}** sa pamamagitan ng gabay na gawain at talakayan.

### Pambungad / Warm-Up (5–8 min)
- Magpakita ng isang konkretong halimbawa o tanong tungkol sa **${topicLabel}**.
- Hayaang magbahagi ng paunang ideya sa katabi (*Think-Pair-Share*).

### Pangunahing Gawain (25 min)
1. **Modelong Pagtuturo (10 min)**: Talakayin ang 2–3 pangunahing ideya gamit ang biswal na tsart o halimbawa sa pisara.
2. **Pangkatang Gawain (15 min)**: Hatiin ang klase sa maliliit na grupo upang magsanay at gumawa ng maikling paliwanag o dayagram.

### Pag-angkop (Differentiation)
- **Para sa nangangailangan ng gabay**: Magbigay ng *word bank* at halimbawang pangungusap.
- **Para sa mas mabilis matuto**: Magdagdag ng bukas na tanong na nag-uugnay sa totoong buhay.

### Exit Ticket (5 min)
*"Magbigay ng isang bagong bagay na natutunan mo tungkol sa ${topicLabel} at isang tanong na nais mo pang malaman."*`
      : `### Learning Objective (${detectedGrade})
Students will explore, explain, and apply core concepts of **${topicLabel}** through guided modeling and collaborative practice.

### Warm-Up / Hook (5–8 min)
- Present a real-world prompt or visual phenomenon connected to **${topicLabel}**.
- Run a 2-minute *Think-Pair-Share* to surface prior knowledge and misconceptions.

### Main Classroom Sequence (25 min)
1. **Mini-Lesson & Modeling (10 min)**: Walk through 2 worked examples using clear visual anchors.
2. **Collaborative Station / Partner Practice (15 min)**: Pairs complete a structured practice task while you circulate for quick formative check-ins.

### Differentiation & Scaffolds
- **ELL / Developing Readers**: Provide sentence stems, labeled visuals, and key vocabulary cards.
- **Extension Challenge**: Ask early finishers to design one real-world application problem or counterexample.

### Exit Ticket (5 min)
*"Write two sentences summarizing the key idea of ${topicLabel} and one question you still have."*`;

    actions.push({
      type: 'save_resource',
      folderName: targetFolderName,
      title: customTitle,
      sourceDomain: 'Offline Teaching Assistant',
      resourceType: 'AI Guide',
      gradeBand: detectedGrade,
      estimatedTime: '45 min',
      summary: isTl
        ? `Kompletong 45-minutong gabay sa aralin para sa ${topicLabel} na may pambungad, gawain, differentiation, at exit ticket.`
        : `Complete 45-minute lesson guide for ${topicLabel} including warm-up, guided practice, differentiation, and an exit ticket.`,
      fullGuideMarkdown: customMarkdown,
      teacherNotes: isTl
        ? 'Ginawa ng Offline Teaching Assistant.'
        : 'Generated offline by LessonFolio Teaching Assistant.',
    });
  }

  // Construct detailed, friendly offline response
  const sections: string[] = [];

  if (isTl) {
    sections.push(
      `*(Offline Teaching Assistant — gumagana nang walang internet gamit ang iyong lokal na binder at curriculum engine)*`
    );

    if (actions.length > 0) {
      sections.push(
        `Naihanda at na-save ko na ang mga materyales sa folder na **"${targetFolderName}"** (${detectedGrade}).`
      );
    }

    if (wantsDifferentiation) {
      sections.push(`### Mga Estratehiya sa Differentiation
1. **Biswal at Word Bank**: Maglagay ng mga larawan at 4–6 na pangunahing salita sa pisara na may maikling kahulugan.
2. **Chunking at Sentence Stems**: Hatiin ang gawain sa 10-minutong bahagi at magbigay ng gabay na simula ng pangungusap (*"Napansin ko na..."*, *"Ang ebidensya ko ay..."*).
3. **Flexible Grouping**: Ipares ang mag-aaral na nangangailangan ng suporta sa kamag-aral na mahusay magpaliwanag.`);
    } else if (wantsExitTicketOrRubric) {
      sections.push(`### Handang Exit Ticket at 4-Antas na Rubrik
- **Tanong 1 (Pag-unawa)**: Ipaliwanag sa sariling salita ang pangunahing ideya ngayong araw.
- **Tanong 2 (Paglalapat)**: Magbigay ng isang halimbawa o solusyon.
- **Mabilisang Rubrik**: **4** (Kompleto at malinaw) · **3** (Tama ang diwa) · **2** (Kulang ng halimbawa) · **1** (Kailangan ng gabay).`);
    } else {
      sections.push(`### Gabay sa Pagtuturo para sa "${topicLabel}" (${detectedGrade})
- **Pambungad (5 min)**: Magtanong ng nakakaengganyong sitwasyon sa totoong buhay bago ipakilala ang aralin.
- **Aktibong Gawain (20–25 min)**: Gumamit ng *Think-Pair-Share* o maliliit na estasyon upang aktibong makalahok ang lahat.
- **Pagsusuri ng Pag-unawa (5 min)**: Gumamit ng *3-2-1 Exit Slip* bago matapos ang klase.`);
    }

    if (activeFolder && activeFolderResources.length > 0) {
      sections.push(
        `#### Kaugnay sa iyong kasalukuyang folder (${activeFolder.name}):\nMayroon kang **${activeFolderResources.length}** naka-save na materyal dito—maaari mo akong utusang *"Gumawa ng exit ticket para sa kasalukuyang folder"* anumang oras.`
      );
    } else if (matchedResources.length > 0) {
      sections.push(
        `#### Mga Tugma sa Lokal na Library:\n${matchedResources
          .slice(0, 2)
          .map((r) => `- **${r.title}** (${r.gradeBand} · ${r.estimatedTime})`)
          .join('\n')}`
      );
    }
  } else {
    sections.push(
      `*(Offline Teaching Assistant — running locally from your saved binder and built-in curriculum engine)*`
    );

    if (actions.length > 0) {
      sections.push(
        `I created and saved your materials directly into **"${targetFolderName}"** (${detectedGrade}). Open the receipt below to inspect or print them.`
      );
    }

    if (wantsDifferentiation) {
      sections.push(`### Classroom Differentiation Strategies
1. **Visual Anchors & Tiered Word Bank**: Pair key academic vocabulary with quick sketches or bilingual cognates on an anchor chart.
2. **Scaffolded Sentence Frames**: Give developing writers structured starters (*"My claim is… because the evidence shows…"*).
3. **Chunked Checkpoints**: Break complex tasks into 10-minute milestones with a 60-second partner check between steps.`);
    } else if (wantsExitTicketOrRubric) {
      sections.push(`### Ready-to-Use Exit Ticket & 4-Point Rubric
- **Prompt 1 (Concept Check)**: Explain today's main takeaway in 1–2 sentences without using notes.
- **Prompt 2 (Transfer)**: Apply today's skill to one new example.
- **Quick Sort Rubric**: **4** (Clear + evidenced) · **3** (Solid grasp) · **2** (Partial step missing) · **1** (Pull for 5-min small-group reteach).`);
    } else {
      sections.push(`### Deep Teaching Notes: ${topicLabel} (${detectedGrade})
- **Anticipate Misconceptions**: Open with a quick true/false poll before direct instruction so students surface assumptions early.
- **Active Practice (20–25 min)**: Shift from teacher modeling (*"I do"*) to paired reasoning (*"We do"*) before independent exit checks (*"You do"*).
- **Wrap-Up**: Close with a 3-minute *3-2-1* reflection or partner summary.`);
    }

    if (activeFolder && activeFolderResources.length > 0) {
      sections.push(
        `#### Active Folder Context (${activeFolder.name}):\nYou have **${activeFolderResources.length}** saved items here. Tell me *"Draft an exit ticket and save it to my current folder"* to add one offline right now.`
      );
    } else if (matchedResources.length > 0) {
      sections.push(
        `#### Matching Local Curriculum Items:\n${matchedResources
          .slice(0, 2)
          .map((r) => `- **${r.title}** (${r.gradeBand} · ${r.estimatedTime})`)
          .join('\n')}`
      );
    }
  }

  return {
    reply: sections.join('\n\n'),
    folderActions: actions,
  };
}
