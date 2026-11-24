import type { GradeBand, ResourceType, SavedResource, SearchResult } from '../types';

const SEARCH_CACHE_KEY = 'lessonfolio_search_cache_v1';

export interface OfflineCurriculumEntry {
  id: string;
  title: string;
  titleTl?: string;
  domain: string;
  snippet: string;
  snippetTl?: string;
  gradeBand: GradeBand;
  resourceType: ResourceType;
  estimatedTime: string;
  keywords: string[];
  keyTakeaways: string[];
  keyTakeawaysTl?: string[];
  fullGuideMarkdown: string;
  fullGuideMarkdownTl?: string;
}

export const OFFLINE_CURRICULUM_BANK: OfflineCurriculumEntry[] = [
  {
    id: 'off-fractions-manipulatives',
    title: 'Visual Fractions Lab with Paper Folding & Area Models',
    titleTl: 'Gawain sa Fractions Gamit ang Pagtupi ng Papel at Area Models',
    domain: 'Offline Curriculum Bank',
    snippet:
      'Hands-on concrete-to-pictorial fraction lab where students fold paper strips into halves, quarters, and eighths to compare equivalent fractions.',
    snippetTl:
      'Praktikal na gawain kung saan nagtutupi ang mga mag-aaral ng papel upang makita at maihambing ang magkatumbas na fractions.',
    gradeBand: '3-5',
    resourceType: 'Activity',
    estimatedTime: '45 min',
    keywords: ['fractions', 'math', 'manipulatives', 'equivalent', 'grade 4', 'baitang 4', 'hatimbilang'],
    keyTakeaways: [
      'Zero tech required — uses only colored paper strips',
      'Builds concrete intuition for equivalent fractions (1/2 = 2/4 = 4/8)',
      'Includes partner check-in and exit ticket',
    ],
    keyTakeawaysTl: [
      'Hindi nangangailangan ng internet o kagamitang elektroniko',
      'Malinaw na naipapakita ang magkatumbas na fractions (1/2 = 2/4)',
      'May kasamang gawaing pang-pares at exit ticket',
    ],
    fullGuideMarkdown: `### Learning Objective
Students will represent and compare equivalent fractions using folded paper strip area models.

### Warm-Up (5 min)
Ask students: *"If two friends share one bibingka or pizza equally, and four friends share another identical pizza, how can two slices equal one slice?"*

### Guided Paper-Strip Activity (25 min)
1. Give each student 4 equal-length paper strips.
2. Leave Strip 1 whole (**1 whole**).
3. Fold Strip 2 in half and label each part **1/2**.
4. Fold Strip 3 into fourths (**1/4**) and Strip 4 into eighths (**1/8**).
5. Align strips vertically to discover equivalent lengths (**1/2 = 2/4 = 4/8**).

### Differentiation
- **Visual/ELL Support**: Pre-label a reference anchor strip and color-code denominators.
- **Extension**: Challenge pairs to test whether **2/3** matches any fourths or eighths strip and explain why.

### Exit Ticket (5 min)
Draw and shade two different fraction bars that prove **3/4** is greater than **5/8**.`,
    fullGuideMarkdownTl: `### Layunin ng Aralin
Maipapakita at maihahambing ng mga mag-aaral ang magkatumbas na fractions gamit ang tinuping piraso ng papel.

### Pambungad (5 min)
Itanong sa klase: *"Kung hinati sa 2 ang isang bibingka at kumuha ka ng 1 piraso, pareho ba ito ng 2 piraso mula sa hinati sa 4?"*

### Gawain sa Pagtupi ng Papel (25 min)
1. Bigyan ang bawat mag-aaral ng 4 na magkakasinghabang papel.
2. Panatilihing buo ang unang papel (**1 buo**).
3. Itupi ang ikalawa sa gitna (**1/2**), ikatlo sa apat (**1/4**), at ikaapat sa walo (**1/8**).
4. Pagtabi-tabihin ang mga papel upang makita ang magkatumbas na sukat (**1/2 = 2/4 = 4/8**).

### Pagtataya (Exit Ticket)
Iguhit ang dalawang fraction bar na nagpapakita na mas malaki ang **3/4** kaysa sa **5/8**.`,
  },
  {
    id: 'off-photosynthesis-lab',
    title: 'Photosynthesis Energy Flow & Leaf Stomata Inquiry',
    titleTl: 'Pagsisiyasat sa Photosynthesis at Daloy ng Enerhiya ng Halaman',
    domain: 'Offline Curriculum Bank',
    snippet:
      'Guided inquiry exploring sunlight, water, and carbon dioxide inputs alongside glucose and oxygen outputs using everyday classroom observations.',
    snippetTl:
      'Gawain sa agham na nagpapakita kung paano ginagamit ng halaman ang sikat ng araw, tubig, at carbon dioxide upang makagawa ng pagkain at oxygen.',
    gradeBand: '6-8',
    resourceType: 'Lesson Plan',
    estimatedTime: '50 min',
    keywords: ['photosynthesis', 'science', 'agham', 'plants', 'halaman', 'ngss', 'biology', 'grade 7'],
    keyTakeaways: [
      'Clarifies common misconception that plants get food from soil alone',
      'Includes diagram labeling + claim-evidence-reasoning prompt',
      'Works with or without microscopes',
    ],
    keyTakeawaysTl: [
      'Nililinaw na sa photosynthesis galing ang pagkain ng halaman, hindi lang sa lupa',
      'May gabay na dayagram at Claim-Evidence-Reasoning',
      'Pwedeng gawin kahit walang mikroskopyo',
    ],
    fullGuideMarkdown: `### Learning Objective
Construct a scientific explanation based on evidence for the role of photosynthesis in cycling matter and flowing energy (NGSS MS-LS1-6).

### Misconception Check (5 min)
Ask: *"Where does most of a giant tree’s wood mass come from—soil, water, or air?"* (Most comes from carbon dioxide in the air!)

### Core Investigation (30 min)
1. Place fresh green leaves submerged in a clear cup of water near a sunny window (or lamp).
2. After 15 minutes, observe tiny oxygen bubbles forming on leaf surfaces.
3. Students map inputs (**Light + Water + CO2**) and outputs (**Glucose + O2**) in a T-chart.

### Exit Ticket
Write a 3-sentence Claim-Evidence-Reasoning summary explaining why the bubbles appeared.`,
  },
  {
    id: 'off-solar-system-scale',
    title: 'Pocket Solar System: Proportional Distance Model',
    titleTl: 'Pocket Solar System: Modelo ng Layo ng mga Planeta',
    domain: 'Offline Curriculum Bank',
    snippet:
      'Memorable 1-meter paper-folding activity helping students grasp the vast spacing between inner rocky planets and outer gas giants.',
    snippetTl:
      'Masayang pagtupi ng 1-metrong papel upang maunawaan ng klase ang tunay na layo ng mga planeta sa Sistemang Solar.',
    gradeBand: '6-8',
    resourceType: 'Activity',
    estimatedTime: '40 min',
    keywords: ['solar system', 'sistemang solar', 'planets', 'planeta', 'astronomy', 'space', 'grade 6', 'baitang 6'],
    keyTakeaways: [
      'Demonstrates why outer planets are spaced much farther apart than inner planets',
      'Requires only adding-machine tape or long paper strips',
      'Great anchor activity for Earth & Space Science units',
    ],
    fullGuideMarkdown: `### Objective
Model the relative distances of planets from the Sun using a 1-meter paper strip.

### Steps (30 min)
1. Label one end **Sun** and the far end **Kuiper Belt / Neptune**.
2. Fold in half -> mark **Uranus**.
3. Fold Neptune to Uranus -> mark **Saturn**.
4. Fold Sun to Uranus -> mark **Jupiter**.
5. Fold Sun to Jupiter -> **Asteroid Belt**, then **Mars**, **Earth**, **Venus**, and **Mercury** tucked close to the Sun!`,
  },
  {
    id: 'off-reading-phonics-k2',
    title: 'Interactive Read-Aloud & Word-Building Literacy Stations (K–2)',
    titleTl: 'Masayang Pagbabasa at Pagbuo ng Salita (K–2)',
    domain: 'Offline Curriculum Bank',
    snippet:
      'Three rotating early-literacy centers combining phoneme blending, story sequencing cards, and partner echo reading.',
    snippetTl:
      'Tatlong estasyon sa pagbasa na pinagsasama ang tunog ng titik, pagkakasunod-sunod ng kuwento, at sabayang pagbasa.',
    gradeBand: 'K-2',
    resourceType: 'Lesson Plan',
    estimatedTime: '40 min',
    keywords: ['phonics', 'reading', 'pagbasa', 'literacy', 'kindergarten', 'k-2', 'stories', 'kuwento'],
    keyTakeaways: [
      'Structured 10-minute station rotations keep early learners engaged',
      'Adaptable to English or Tagalog/Filipino syllabic reading (Marungko / Claveria)',
      'Includes quick teacher observation checklist',
    ],
    fullGuideMarkdown: `### Station 1: Sound Blending Tiles (10 min)
Use letter or syllable cards (*ba, be, bi, bo, bu* or CVC words) to build and read 6 words aloud with a partner.

### Station 2: Story Sequence Cards (10 min)
Arrange 4 picture cards into **Beginning, Middle, End** and retell the story in one sentence per card.

### Station 3: Teacher Guided Echo Reading (10 min)
Track print with a finger while practicing expression and punctuation pauses.`,
  },
  {
    id: 'off-araling-panlipunan-primary',
    title: 'Primary Source Detective: Analyzing Historical Letters & Speeches',
    titleTl: 'Detektib ng Kasaysayan: Pagsusuri ng mga Liham at Talumpati',
    domain: 'Offline Curriculum Bank',
    snippet:
      'Source-analysis protocol (Sourcing, Contextualizing, Corroborating) guiding middle and high school students through historical documents.',
    snippetTl:
      'Gabay na hakbang sa pagsusuri ng mga dokumentong pangkasaysayan (pinagmulan, konteksto, at ebidensya) para sa hayskul.',
    gradeBand: '9-12',
    resourceType: 'Assessment',
    estimatedTime: '50 min',
    keywords: ['history', 'kasaysayan', 'araling panlipunan', 'primary source', 'civil rights', 'rizal', 'essays'],
    keyTakeaways: [
      'Teaches critical historical thinking over memorization',
      'Includes 4-question document analysis graphic organizer',
      'Ready to pair with any primary source excerpt',
    ],
    fullGuideMarkdown: `### Historical Thinking Protocol
1. **Source**: Who wrote this, when, and for what audience?
2. **Context**: What major events were happening at that moment?
3. **Close Read**: Highlight 2 phrases that reveal the author’s core argument or emotion.
4. **Corroborate**: What other perspective would help verify or challenge this account?`,
  },
  {
    id: 'off-exit-ticket-rubric-pack',
    title: 'Formative Check-In & 4-Point Analytical Rubric Template',
    titleTl: 'Mabilisang Pagtataya at 4-Antas na Rubrik sa Klase',
    domain: 'Offline Curriculum Bank',
    snippet:
      'Versatile formative assessment toolkit featuring 3-2-1 exit slips, error-analysis prompts, and a customizable 4-level classroom rubric.',
    snippetTl:
      'Mga handang kagamitan sa pagtataya tulad ng 3-2-1 exit slip at malinaw na 4-antas na rubrik para sa mga proyekto.',
    gradeBand: 'All K-12',
    resourceType: 'Assessment',
    estimatedTime: '15 min',
    keywords: ['rubric', 'rubrik', 'exit ticket', 'assessment', 'pagtataya', 'quiz', 'pagsusulit'],
    keyTakeaways: [
      'Works across all grade levels and subject areas',
      'Helps teachers sort student work into 3 actionable next-day groups',
      'Clear student-friendly rubric descriptors',
    ],
    fullGuideMarkdown: `### 3-2-1 Exit Slip
- **3** key ideas I learned today
- **2** examples or pieces of evidence I can explain
- **1** question I still want answered tomorrow

### 4-Point Rubric Criteria
- **4 (Exemplary)**: Accurate, well-evidenced, clearly explained in own words.
- **3 (Proficient)**: Demonstrates solid understanding with minor omissions.
- **2 (Developing)**: Partial understanding; needs guided practice on key step.
- **1 (Beginning)**: Misconception present; schedule 5-minute small-group reteach.`,
  },
];

export function cacheSearchResults(results: SearchResult[]): void {
  if (!results.length) return;
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY);
    const existing: SearchResult[] = raw ? JSON.parse(raw) : [];
    const byTitle = new Map<string, SearchResult>();
    for (const item of [...results, ...existing]) {
      byTitle.set(`${item.title}::${item.url}`, item);
    }
    const trimmed = Array.from(byTitle.values()).slice(0, 40);
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota issues
  }
}

export function loadCachedSearchResults(): SearchResult[] {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function searchOfflineResources(params: {
  query: string;
  gradeBand: GradeBand;
  resourceType: 'All' | ResourceType;
  savedResources: SavedResource[];
  languageCode: string;
  allowGenericFallback?: boolean;
}): SearchResult[] {
  const {
    query,
    gradeBand,
    resourceType,
    savedResources,
    languageCode,
    allowGenericFallback = true,
  } = params;
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  const isTagalog = languageCode === 'tl';

  const scoreMatch = (haystack: string, itemGrade: GradeBand, itemType: ResourceType): number => {
    let score = 0;
    const lower = haystack.toLowerCase();
    for (const term of terms) {
      if (lower.includes(term)) score += 3;
    }
    if (gradeBand === 'All K-12' || itemGrade === gradeBand || itemGrade === 'All K-12') {
      score += 1;
    } else {
      score -= 1;
    }
    if (resourceType === 'All' || itemType === resourceType) {
      score += 1;
    }
    return score;
  };

  const candidates: { score: number; result: SearchResult }[] = [];

  // 1. Saved binder items
  for (const res of savedResources) {
    const haystack = `${res.title} ${res.summary} ${res.teacherNotes} ${res.resourceType} ${res.gradeBand}`;
    const score = scoreMatch(haystack, res.gradeBand, res.resourceType);
    if (terms.length === 0 || score >= 2) {
      candidates.push({
        score: score + 1,
        result: {
          id: `offline-saved-${res.id}`,
          title: res.title,
          url: res.url ?? '',
          domain: res.sourceDomain || 'Saved in Your Binder',
          snippet: res.summary,
          gradeBand: res.gradeBand,
          resourceType: res.resourceType,
          estimatedTime: res.estimatedTime,
          keyTakeaways: res.keyTakeaways ?? [],
        },
      });
    }
  }

  // 2. Cached online search results
  for (const cached of loadCachedSearchResults()) {
    const haystack = `${cached.title} ${cached.snippet} ${cached.domain} ${cached.gradeBand}`;
    const score = scoreMatch(haystack, cached.gradeBand, cached.resourceType);
    if (terms.length === 0 || score >= 2) {
      candidates.push({ score, result: cached });
    }
  }

  // 3. Built-in offline curriculum library
  for (const entry of OFFLINE_CURRICULUM_BANK) {
    const title = isTagalog && entry.titleTl ? entry.titleTl : entry.title;
    const snippet = isTagalog && entry.snippetTl ? entry.snippetTl : entry.snippet;
    const takeaways =
      isTagalog && entry.keyTakeawaysTl ? entry.keyTakeawaysTl : entry.keyTakeaways;
    const haystack = `${entry.title} ${entry.titleTl ?? ''} ${entry.snippet} ${entry.snippetTl ?? ''} ${entry.keywords.join(' ')}`;
    const score = scoreMatch(haystack, entry.gradeBand, entry.resourceType);

    if (terms.length === 0 || score >= 2) {
      candidates.push({
        score,
        result: {
          id: entry.id,
          title,
          url: '',
          domain: entry.domain,
          snippet,
          gradeBand: entry.gradeBand,
          resourceType: entry.resourceType,
          estimatedTime: entry.estimatedTime,
          keyTakeaways: takeaways,
        },
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  // Deduplicate by title
  const seen = new Set<string>();
  const finalResults: SearchResult[] = [];
  for (const item of candidates) {
    const key = item.result.title.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      finalResults.push(item.result);
    }
    if (finalResults.length >= 6) break;
  }

  // Always show relevant curriculum entries on offline fallback if query matched nothing specific
  if (finalResults.length === 0 && allowGenericFallback) {
    return OFFLINE_CURRICULUM_BANK.slice(0, 4).map((entry) => ({
      id: entry.id,
      title: isTagalog && entry.titleTl ? entry.titleTl : entry.title,
      url: '',
      domain: entry.domain,
      snippet: isTagalog && entry.snippetTl ? entry.snippetTl : entry.snippet,
      gradeBand: entry.gradeBand,
      resourceType: entry.resourceType,
      estimatedTime: entry.estimatedTime,
      keyTakeaways:
        isTagalog && entry.keyTakeawaysTl ? entry.keyTakeawaysTl : entry.keyTakeaways,
    }));
  }

  return finalResults;
}
