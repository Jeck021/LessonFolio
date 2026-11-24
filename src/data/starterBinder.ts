import type { LessonFolder, SavedResource } from '../types';

export const STARTER_FOLDERS: LessonFolder[] = [
  {
    id: 'folder-ecosystems-5',
    name: '5th Grade Ecosystems & Food Webs',
    description:
      'Hands-on NGSS 5-LS2-1 activities exploring producers, consumers, decomposers, and matter cycling.',
    gradeBand: '3-5',
    colorTag: 'sage',
    createdAt: '2026-10-14T09:00:00.000Z',
    updatedAt: '2026-10-18T14:30:00.000Z',
  },
  {
    id: 'folder-persuasive-8',
    name: '8th Grade Persuasive Writing',
    description:
      'Mentor texts, claim-evidence-reasoning scaffolds, and peer-review rubrics for argumentative essays.',
    gradeBand: '6-8',
    colorTag: 'ochre',
    createdAt: '2026-10-16T11:15:00.000Z',
    updatedAt: '2026-10-19T16:00:00.000Z',
  },
  {
    id: 'folder-linear-alg1',
    name: 'Algebra I: Linear Functions',
    description:
      'Slope-intercept visualizers, real-world modeling stations, and formative exit tickets.',
    gradeBand: '9-12',
    colorTag: 'slate',
    createdAt: '2026-10-20T08:45:00.000Z',
    updatedAt: '2026-10-21T10:20:00.000Z',
  },
];

export const STARTER_RESOURCES: SavedResource[] = [
  {
    id: 'res-ecosystem-yarn-web',
    folderId: 'folder-ecosystems-5',
    title: 'Classroom Yarn Food Web Simulation',
    url: 'https://www.nationalgeographic.org/activity/food-web/',
    sourceDomain: 'nationalgeographic.org',
    resourceType: 'Activity',
    gradeBand: '3-5',
    estimatedTime: '45 min',
    summary:
      'Students take on organism roles and pass a ball of yarn to physically model energy transfer and ecosystem interdependence—then observe what happens when a species is removed.',
    keyTakeaways: [
      'Demonstrates direct and indirect food-web dependencies',
      'Requires only role cards and one skein of yarn',
      'Includes built-in discussion prompts on invasive species',
    ],
    teacherNotes:
      'Use for Tuesday Block 2. Pair struggling readers with visual organism cards; ask table groups to sketch their web in science notebooks afterward.',
    addedBy: 'user',
    savedAt: '2026-10-14T09:15:00.000Z',
  },
  {
    id: 'res-decomposer-guide',
    folderId: 'folder-ecosystems-5',
    title: 'Decomposers & Matter Cycling Mini-Lab Guide',
    sourceDomain: 'LessonFolio AI Guide',
    resourceType: 'AI Guide',
    gradeBand: '3-5',
    estimatedTime: '35 min',
    summary:
      'A 3-station observation lab comparing composted soil, leaf litter, and dry sand to show how fungi and worms return nutrients to plants.',
    fullGuideMarkdown: `### Learning Objective
Students will explain how decomposers break down dead plant and animal matter and return nutrients to the soil (NGSS 5-LS2-1).

### Quick Warm-Up (5 min)
Show a photo of a fallen log covered in bracket fungi. Ask: *"Where does the wood go over five years?"*

### 3-Station Lab (20 min)
1. **Hand-Lens Observation**: Inspect damp leaf litter in clear trays. Sketch 2 living organisms and 2 signs of decay.
2. **Moisture & Warmth Prediction**: Compare sealed dry bread vs. misted soil cup observations (pre-prepared 5 days earlier).
3. **Soil Nutrient Chain**: Sequence cards from *Sun -> Oak Leaf -> Beetle/Fungi -> Rich Humus -> New Sprout*.

### Differentiation
- **ELL / Visual Support**: Provide bilingual word bank (*decomposer, nutrient, cycle, humus*).
- **Extension**: Predict what would happen to forest floor depth if all fungi vanished for one year.

### Exit Ticket (5 min)
*"In two sentences, explain why decomposers are just as important to a forest as sunlight."*`,
    keyTakeaways: [
      'Ready-to-run 3-station format',
      'Includes ELL vocabulary bank & extension prompt',
      'Aligns directly to NGSS 5-LS2-1',
    ],
    teacherNotes: 'Print station cards on cardstock and laminate before Friday.',
    addedBy: 'assistant',
    savedAt: '2026-10-18T14:30:00.000Z',
  },
  {
    id: 'res-cer-writing-scaffold',
    folderId: 'folder-persuasive-8',
    title: 'Claim-Evidence-Reasoning (CER) Peer Workshop',
    url: 'https://www.edutopia.org/article/teaching-argument-writing/',
    sourceDomain: 'edutopia.org',
    resourceType: 'Lesson Plan',
    gradeBand: '6-8',
    estimatedTime: '50 min',
    summary:
      'Structured peer-feedback protocol where students highlight claims, evidence, and counterargument rebuttals in partner drafts using color-coded margin checks.',
    keyTakeaways: [
      'Trains students to distinguish opinion from cited evidence',
      'Includes sentence stems for respectful counterarguments',
      'Works across ELA and Social Studies topics',
    ],
    teacherNotes: 'Great before final essay submission next Thursday.',
    addedBy: 'user',
    savedAt: '2026-10-16T11:20:00.000Z',
  },
  {
    id: 'res-slope-desmos',
    folderId: 'folder-linear-alg1',
    title: 'Desmos: Land the Plane (Linear Equations)',
    url: 'https://teacher.desmos.com/',
    sourceDomain: 'teacher.desmos.com',
    resourceType: 'Activity',
    gradeBand: '9-12',
    estimatedTime: '40 min',
    summary:
      'Interactive graphing challenge where students write slope-intercept equations to guide planes safely onto a runway, building intuition for rate of change and y-intercept.',
    keyTakeaways: [
      'Immediate visual feedback on slope and y-intercept shifts',
      'Self-paced with teacher pacing controls',
      'Ideal bridge from tables to y = mx + b',
    ],
    teacherNotes: 'Assign Chromebooks at start of period; pause at Slide 6 to discuss negative slopes.',
    addedBy: 'user',
    savedAt: '2026-10-20T09:00:00.000Z',
  },
];
