export type LanguageCode = 'en' | 'tl' | 'es' | 'fr' | 'ja' | 'id' | 'pt';

export interface LanguageOption {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  regionHint: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', regionHint: 'US / UK / Global' },
  { code: 'tl', nativeName: 'Tagalog', englishName: 'Tagalog (Filipino)', regionHint: 'Philippines' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', regionHint: 'Spain / LatAm' },
  { code: 'fr', nativeName: 'Français', englishName: 'French', regionHint: 'France / Global' },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese', regionHint: 'Japan' },
  { code: 'id', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian', regionHint: 'Indonesia' },
  { code: 'pt', nativeName: 'Português', englishName: 'Portuguese', regionHint: 'Brazil / Portugal' },
];

export function detectLanguageFromEnvironment(): {
  code: LanguageCode;
  sourceLabel: string;
} {
  if (typeof navigator === 'undefined') {
    return { code: 'en', sourceLabel: 'Default' };
  }

  const tz =
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || '' : '';
  const locales = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language || 'en'];

  for (const rawLocale of locales) {
    const lower = rawLocale.toLowerCase();
    if (lower.startsWith('tl') || lower.startsWith('fil') || lower === 'en-ph') {
      return { code: 'tl', sourceLabel: 'Philippines' };
    }
    if (lower.startsWith('es')) return { code: 'es', sourceLabel: rawLocale };
    if (lower.startsWith('fr')) return { code: 'fr', sourceLabel: rawLocale };
    if (lower.startsWith('ja')) return { code: 'ja', sourceLabel: rawLocale };
    if (lower.startsWith('id') || lower.startsWith('ms')) {
      return { code: 'id', sourceLabel: rawLocale };
    }
    if (lower.startsWith('pt')) return { code: 'pt', sourceLabel: rawLocale };
    if (lower.startsWith('en')) {
      // Check timezone for Philippines even if browser UI is English
      if (tz === 'Asia/Manila') {
        return { code: 'tl', sourceLabel: 'Philippines (Asia/Manila)' };
      }
      return { code: 'en', sourceLabel: rawLocale };
    }
  }

  if (tz === 'Asia/Manila') {
    return { code: 'tl', sourceLabel: 'Philippines (Asia/Manila)' };
  }

  return { code: 'en', sourceLabel: 'Global' };
}

export interface TranslationBundle {
  nav: {
    discover: string;
    binder: string;
    printPacket: string;
    newFolder: string;
    foldersLabel: string;
    assistantLabel: string;
  };
  status: {
    online: string;
    offline: string;
    offlineDetail: string;
    languageLabel: string;
    autoDetected: string;
    installApp: string;
  };
  discover: {
    kicker: string;
    headline: string;
    subheadline: string;
    searchPlaceholder: string;
    searchButton: string;
    searchingButton: string;
    gradeBandLabel: string;
    formatLabel: string;
    allFormats: string;
    trySearchHeading: string;
    groundedLabel: string;
    activeFolderPrefix: string;
    saveToPrefix: string;
    savedToPrefix: string;
    chooseFolder: string;
    createNewFolderOption: string;
    askDeeper: string;
    groundedSourcesTitle: string;
    offlineSearchBanner: string;
    quickTopics: { label: string; query: string; grade: 'K-2' | '3-5' | '6-8' | '9-12' }[];
  };
  sidebar: {
    title: string;
    folderWord: string;
    foldersWord: string;
    savedWord: string;
    noFoldersTitle: string;
    noFoldersDesc: string;
    createFirst: string;
    itemWord: string;
    itemsWord: string;
    exportBtn: string;
    importBtn: string;
    starterBtn: string;
  };
  binder: {
    emptySelectTitle: string;
    emptySelectDesc: string;
    discoverBtn: string;
    editFolder: string;
    printPacket: string;
    enrichAssistant: string;
    filterPlaceholder: string;
    emptyFolderTitle: string;
    emptyFolderDesc: string;
    populateAssistant: string;
    savedByAssistant: string;
    showGuide: string;
    hideGuide: string;
    teacherNotesLabel: string;
    teacherNotesPlaceholder: string;
    adaptAssistant: string;
    moveToFolder: string;
  };
  print: {
    backToBinder: string;
    printPdf: string;
    packetHeader: string;
    noFolderTitle: string;
    noFolderDesc: string;
    emptyResources: string;
    teacherNotesHeading: string;
  };
  assistant: {
    title: string;
    contextPrefix: string;
    subtitleDefault: string;
    offlineReady: string;
    welcomeMessage: string;
    askToLabel: string;
    starterPrompts: string[];
    thinkingOnline: string;
    thinkingOffline: string;
    placeholder: string;
    sourcesLabel: string;
    openAction: string;
    createdFolderPrefix: string;
    savedResourcePrefix: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    gradeLabel: string;
    descLabel: string;
    descPlaceholder: string;
    colorLabel: string;
    cancel: string;
    createBtn: string;
    saveBtn: string;
  };
  tutorial: {
    buttonLabel: string;
    title: string;
    subtitle: string;
    closeBtn: string;
    steps: {
      number: string;
      title: string;
      description: string;
      tip: string;
      actionLabel: string;
      actionTarget: 'discover' | 'binder' | 'assistant' | 'print';
    }[];
  };
}

const EN_BUNDLE: TranslationBundle = {
  nav: {
    discover: 'Discover',
    binder: 'Lesson Binder',
    printPacket: 'Print Packet',
    newFolder: 'New Folder',
    foldersLabel: 'Folders',
    assistantLabel: 'Teaching Assistant',
  },
  status: {
    online: 'Online',
    offline: 'Offline Mode',
    offlineDetail: 'Saved folders, local search & offline assistant active',
    languageLabel: 'Language',
    autoDetected: 'Auto',
    installApp: 'Install App',
  },
  discover: {
    kicker: 'K–12 Curriculum Discovery · Grounded & Offline-Ready',
    headline: 'Find anything for tomorrow’s lesson, save it in one click.',
    subheadline:
      'Search across lesson plans, hands-on labs, readings, and assessments. File your favorites into personalized folders or ask the Teaching Assistant to adapt them—online or offline.',
    searchPlaceholder: 'Search any topic, standard, lab, reading, or classroom activity...',
    searchButton: 'Search Resources',
    searchingButton: 'Searching...',
    gradeBandLabel: 'Grade Band:',
    formatLabel: 'Format:',
    allFormats: 'All Formats',
    trySearchHeading: 'Try a classroom search',
    groundedLabel: 'Web-grounded search',
    activeFolderPrefix: 'Active folder:',
    saveToPrefix: 'Save to',
    savedToPrefix: 'Saved to',
    chooseFolder: 'Choose Folder',
    createNewFolderOption: 'Create new folder...',
    askDeeper: 'Ask Assistant to Go Deeper',
    groundedSourcesTitle: 'Grounded Web Sources',
    offlineSearchBanner:
      'Offline search active — showing matches from your saved binder, cached searches, and built-in curriculum library.',
    quickTopics: [
      {
        label: 'Hands-on fractions lesson (4th grade)',
        query: 'hands-on fractions lesson plan with manipulatives 4th grade',
        grade: '3-5',
      },
      {
        label: 'NGSS photosynthesis lab (7th grade)',
        query: 'NGSS photosynthesis lab classroom activity 7th grade',
        grade: '6-8',
      },
      {
        label: 'Primary sources: Civil Rights Movement',
        query: 'primary source documents Civil Rights Movement lesson plan high school',
        grade: '9-12',
      },
      {
        label: 'Phonics & read-aloud centers (K–2)',
        query: 'phonics literacy center activities kindergarten first grade',
        grade: 'K-2',
      },
    ],
  },
  sidebar: {
    title: 'Lesson Folders',
    folderWord: 'folder',
    foldersWord: 'folders',
    savedWord: 'saved',
    noFoldersTitle: 'No folders yet',
    noFoldersDesc:
      'Create a folder for a unit or ask your AI assistant to organize one for you.',
    createFirst: 'Create First Folder',
    itemWord: 'item',
    itemsWord: 'items',
    exportBtn: 'Export',
    importBtn: 'Import',
    starterBtn: 'Starter',
  },
  binder: {
    emptySelectTitle: 'Select or create a lesson folder',
    emptySelectDesc:
      'Choose a folder from the sidebar to review saved resources, add teaching notes, or print a lesson packet.',
    discoverBtn: 'Discover Resources',
    editFolder: 'Edit Folder',
    printPacket: 'Print Packet',
    enrichAssistant: 'Enrich with Assistant',
    filterPlaceholder: 'Filter saved items or teacher notes...',
    emptyFolderTitle: 'This folder is ready for your lesson materials',
    emptyFolderDesc:
      'Search for articles, labs, or videos to save here, or ask the Teaching Assistant to research and populate this folder for you.',
    populateAssistant: 'Ask Assistant to Populate Folder',
    savedByAssistant: 'Saved by Assistant',
    showGuide: 'Read Full Teaching Guide',
    hideGuide: 'Hide Full Teaching Guide',
    teacherNotesLabel: 'Teacher Notes & Classroom Prep',
    teacherNotesPlaceholder:
      'Jot down bell-ringer ideas, materials needed, or pacing adjustments...',
    adaptAssistant: 'Adapt with Assistant',
    moveToFolder: 'Move to folder...',
  },
  print: {
    backToBinder: 'Back to Folder Binder',
    printPdf: 'Print / Save as PDF',
    packetHeader: 'LessonFolio Curriculum Packet',
    noFolderTitle: 'No lesson folder selected',
    noFolderDesc: 'Select a folder in the sidebar to preview and print its lesson packet.',
    emptyResources: 'This folder currently has no saved resources.',
    teacherNotesHeading: 'Teacher Notes',
  },
  assistant: {
    title: 'Teaching Assistant',
    contextPrefix: 'Context:',
    subtitleDefault: 'Web-grounded & offline-ready assistant',
    offlineReady: 'Offline Assistant Ready (Local Binder & Curriculum Engine)',
    welcomeMessage:
      'Hello! I am your **LessonFolio Teaching Assistant**. Ask me to explain concepts more deeply, differentiate lessons for your students, search for activities, or automatically create folders and save resources right into your binder—even when offline.',
    askToLabel: 'Ask the assistant to:',
    starterPrompts: [
      'Create a new folder for 6th Grade Solar System and save 3 interactive activities into it',
      'Suggest 3 differentiation strategies for teaching fractions to ELL students',
      'Draft a 45-minute inquiry lesson guide with an exit ticket and save it to my current folder',
    ],
    thinkingOnline: 'Researching & organizing response...',
    thinkingOffline: 'Preparing offline teaching guide...',
    placeholder:
      'Ask for deeper explanations, differentiation, or tell me to save resources to a folder...',
    sourcesLabel: 'Sources',
    openAction: 'Open',
    createdFolderPrefix: 'Created folder:',
    savedResourcePrefix: 'Saved',
  },
  modal: {
    createTitle: 'Create Lesson Folder',
    editTitle: 'Edit Lesson Folder',
    subtitle: 'Organize lesson plans, readings, and teaching notes for a unit or class period.',
    nameLabel: 'Folder Name',
    namePlaceholder: 'e.g., 6th Grade Earth Science: Plate Tectonics',
    gradeLabel: 'Grade Band',
    descLabel: 'Unit Notes or Description',
    descPlaceholder: 'Standards, pacing notes, or key learning objectives for this folder...',
    colorLabel: 'Folder Color Tab',
    cancel: 'Cancel',
    createBtn: 'Create Folder',
    saveBtn: 'Save Changes',
  },
  tutorial: {
    buttonLabel: 'How to Use',
    title: 'How to Use LessonFolio in 4 Easy Steps',
    subtitle: 'Everything saves automatically in your browser—no login needed, works online and offline.',
    closeBtn: 'Got it, Start Planning',
    steps: [
      {
        number: '01.',
        title: 'Search Anything You Need to Teach',
        description:
          'Type any topic, grade level, or activity idea into the Discover search bar (for example, "hands-on fractions 4th grade").',
        tip: 'Tip: Pick a Grade Band or Format filter to narrow results fast, or click one of the ready-made sample searches.',
        actionLabel: 'Go to Search',
        actionTarget: 'discover',
      },
      {
        number: '02.',
        title: 'Save Resources Into Your Lesson Folders',
        description:
          'Click "Save to [Folder]" on any search card, or choose "Create new folder..." to organize materials by subject, grade, or week.',
        tip: 'Tip: Your folders live on the left sidebar and save automatically in your browser. Use Export anytime to back up a copy.',
        actionLabel: 'Open My Binder',
        actionTarget: 'binder',
      },
      {
        number: '03.',
        title: 'Ask the AI Teaching Assistant to Go Deeper',
        description:
          'Chat with the Assistant on the right to get deeper explanations, ELL/SPED differentiation ideas, exit tickets, or ask it to create folders and save lessons automatically.',
        tip: 'Try typing: "Create a folder for 6th Grade Solar System and save 3 activities into it." Works offline too!',
        actionLabel: 'Try Assistant',
        actionTarget: 'assistant',
      },
      {
        number: '04.',
        title: 'Add Teacher Notes & Print Your Lesson Packet',
        description:
          'Inside any folder, write your own classroom reminders under each saved item. When ready for class, switch to Print Packet to print or save as PDF.',
        tip: 'Tip: Switch languages (including Tagalog) anytime in the top utility bar, or click Install App to use offline.',
        actionLabel: 'Preview Print Packet',
        actionTarget: 'print',
      },
    ],
  },
};

const TL_BUNDLE: TranslationBundle = {
  nav: {
    discover: 'Maghanap',
    binder: 'Aking Binder',
    printPacket: 'I-print ang Packet',
    newFolder: 'Bagong Folder',
    foldersLabel: 'Mga Folder',
    assistantLabel: 'Katulong na AI',
  },
  status: {
    online: 'Online',
    offline: 'Offline Mode',
    offlineDetail: 'Gumagana nang offline ang mga folder, paghahanap, at AI assistant',
    languageLabel: 'Wika',
    autoDetected: 'Auto',
    installApp: 'I-install ang App',
  },
  discover: {
    kicker: 'K–12 Pagtuklas ng Aralin · Gumagana Online at Offline',
    headline: 'Maghanap ng kahit anong aralin, at i-save sa isang click.',
    subheadline:
      'Maghanap ng banghay-aralin, gawain, babasahin, at pagtataya. Ayusin sa sariling mga folder o magpatulong sa Teaching Assistant—kahit walang internet.',
    searchPlaceholder: 'Maghanap ng paksa, aralin, gawain sa klase, o pamantayan...',
    searchButton: 'Maghanap',
    searchingButton: 'Naghahanap...',
    gradeBandLabel: 'Baitang:',
    formatLabel: 'Uri:',
    allFormats: 'Lahat ng Uri',
    trySearchHeading: 'Subukan ang halimbawang paghahanap',
    groundedLabel: 'May gabay sa web',
    activeFolderPrefix: 'Aktibong folder:',
    saveToPrefix: 'I-save sa',
    savedToPrefix: 'Na-save sa',
    chooseFolder: 'Pumili ng Folder',
    createNewFolderOption: 'Gumawa ng bagong folder...',
    askDeeper: 'Magtanong nang Mas Malalim sa AI',
    groundedSourcesTitle: 'Mga Pinagmulan sa Web',
    offlineSearchBanner:
      'Naka-offline — ipinapakita ang mga tugma mula sa iyong binder, naka-cache na paghahanap, at offline curriculum library.',
    quickTopics: [
      {
        label: 'Aralin sa Fractions gamit ang manipulatives (Baitang 4)',
        query: 'fractions lesson plan manipulatives grade 4',
        grade: '3-5',
      },
      {
        label: 'Photosynthesis lab sa Agham (Baitang 7)',
        query: 'photosynthesis lab classroom activity grade 7',
        grade: '6-8',
      },
      {
        label: 'Kasaysayan at Primary Sources (Sekondarya)',
        query: 'kasaysayan primary sources lesson plan high school',
        grade: '9-12',
      },
      {
        label: 'Pagbasa at Phonics para sa K–2',
        query: 'phonics reading literacy activities kindergarten grade 1',
        grade: 'K-2',
      },
    ],
  },
  sidebar: {
    title: 'Mga Lesson Folder',
    folderWord: 'folder',
    foldersWord: 'mga folder',
    savedWord: 'naka-save',
    noFoldersTitle: 'Wala pang folder',
    noFoldersDesc:
      'Gumawa ng folder para sa isang yunit o utusan ang AI assistant na gumawa para sa iyo.',
    createFirst: 'Gumawa ng Unang Folder',
    itemWord: 'materyal',
    itemsWord: 'materyales',
    exportBtn: 'I-export',
    importBtn: 'I-import',
    starterBtn: 'Starter',
  },
  binder: {
    emptySelectTitle: 'Pumili o gumawa ng lesson folder',
    emptySelectDesc:
      'Pumili ng folder sa kaliwa upang tingnan ang naka-save na aralin, magdagdag ng tala, o mag-print ng packet.',
    discoverBtn: 'Maghanap ng Materyales',
    editFolder: 'I-edit ang Folder',
    printPacket: 'I-print ang Packet',
    enrichAssistant: 'Palawakin gamit ang AI',
    filterPlaceholder: 'Salain ang naka-save na aralin o tala ng guro...',
    emptyFolderTitle: 'Handa na ang folder na ito para sa iyong mga aralin',
    emptyFolderDesc:
      'Maghanap ng babasahin o gawain upang i-save dito, o hilingin sa Teaching Assistant na punan ang folder.',
    populateAssistant: 'Hilingin sa AI na Punan ang Folder',
    savedByAssistant: 'Na-save ng AI Assistant',
    showGuide: 'Basahin ang Buong Gabay sa Pagtuturo',
    hideGuide: 'Itago ang Gabay sa Pagtuturo',
    teacherNotesLabel: 'Mga Tala ng Guro at Paghahanda sa Klase',
    teacherNotesPlaceholder:
      'Isulat ang mga kagamitan, pambungad na tanong, o paalala sa klase...',
    adaptAssistant: 'Iangkop gamit ang AI',
    moveToFolder: 'Ilipat sa folder...',
  },
  print: {
    backToBinder: 'Bumalik sa Folder Binder',
    printPdf: 'I-print / I-save bilang PDF',
    packetHeader: 'LessonFolio Curriculum Packet',
    noFolderTitle: 'Walang napiling folder',
    noFolderDesc: 'Pumili ng folder sa sidebar upang i-preview at i-print.',
    emptyResources: 'Wala pang naka-save na materyales sa folder na ito.',
    teacherNotesHeading: 'Mga Tala ng Guro',
  },
  assistant: {
    title: 'Katulong na AI ng Guro',
    contextPrefix: 'Konteksto:',
    subtitleDefault: 'Handa sa pananaliksik online at offline',
    offlineReady: 'Aktibo ang Offline Assistant (Lokal na Binder at Curriculum Engine)',
    welcomeMessage:
      'Kumusta, Ma’am/Sir! Ako ang iyong **LessonFolio Teaching Assistant**. Magtanong para sa mas malalim na paliwanag, pag-angkop ng aralin para sa mag-aaral, paghahanap ng mga gawain, o awtomatikong paggawa ng folder at pag-save ng aralin—gumagana rin ito kahit offline!',
    askToLabel: 'Subukan itanong sa assistant:',
    starterPrompts: [
      'Gumawa ng bagong folder para sa Baitang 6 Solar System at mag-save ng aralin at gawain dito',
      'Magbigay ng 3 estratehiya sa pagtuturo ng fractions para sa mga batang nahihirapan sa pagbasa',
      'Gumawa ng 45-minutong gabay sa aralin na may exit ticket at i-save sa kasalukuyang folder',
    ],
    thinkingOnline: 'Nagsasaliksik at nag-aayos ng sagot...',
    thinkingOffline: 'Inihahanda ang offline na gabay sa pagtuturo...',
    placeholder:
      'Magtanong ng mas malalim na paliwanag, o utusan akong mag-save sa folder...',
    sourcesLabel: 'Mga Pinagmulan',
    openAction: 'Buksan',
    createdFolderPrefix: 'Nagawa ang folder:',
    savedResourcePrefix: 'Na-save:',
  },
  modal: {
    createTitle: 'Gumawa ng Lesson Folder',
    editTitle: 'I-edit ang Lesson Folder',
    subtitle: 'Ayusin ang mga banghay-aralin, babasahin, at tala ng guro para sa isang paksa.',
    nameLabel: 'Pangalan ng Folder',
    namePlaceholder: 'hal., Agham Baitang 6: Sistemang Solar',
    gradeLabel: 'Antas / Baitang',
    descLabel: 'Paglalarawan o Layunin ng Yunit',
    descPlaceholder: 'Mga pamantayan, layunin, o paalala para sa folder na ito...',
    colorLabel: 'Kulay ng Tab',
    cancel: 'Kanselahin',
    createBtn: 'Gumawa ng Folder',
    saveBtn: 'I-save ang Pagbabago',
  },
  tutorial: {
    buttonLabel: 'Paano Gamitin',
    title: 'Paano Gamitin ang LessonFolio sa 4 na Madaling Hakbang',
    subtitle: 'Awtomatikong nase-save sa iyong browser—hindi kailangan mag-login, gumagana online at offline.',
    closeBtn: 'Naintindihan, Magsimula Na',
    steps: [
      {
        number: '01.',
        title: 'Maghanap ng Kahit Anong Aralin o Gawain',
        description:
          'I-type ang paksa o baitang sa search bar sa "Maghanap" (halimbawa: "fractions lesson" o "photosynthesis lab").',
        tip: 'Payo: Piliin ang Baitang (K–12) o Uri ng materyal upang mas mabilis mahanap ang kailangan mo.',
        actionLabel: 'Pumunta sa Paghahanap',
        actionTarget: 'discover',
      },
      {
        number: '02.',
        title: 'I-save sa Iyong mga Lesson Folder',
        description:
          'I-click ang "I-save sa [Folder]" sa kahit anong resulta, o pumili ng "Gumawa ng bagong folder..." upang maayos ang mga aralin ayon sa paksa o linggo.',
        tip: 'Payo: Makikita ang lahat ng folder sa kaliwang bahagi. Pwede ring mag-Export para may backup file ka.',
        actionLabel: 'Buksan ang Binder',
        actionTarget: 'binder',
      },
      {
        number: '03.',
        title: 'Magpatulong sa AI Teaching Assistant',
        description:
          'Kausapin ang Katulong na AI sa kanan para sa mas malalim na paliwanag, estratehiya sa pagtuturo, exit ticket, o utusan itong gumawa ng folder at mag-save ng aralin para sa iyo.',
        tip: 'Subukan itong i-type: "Gumawa ng folder para sa Baitang 6 Solar System at mag-save ng gawain dito." Gumagana kahit offline!',
        actionLabel: 'Subukan ang AI Assistant',
        actionTarget: 'assistant',
      },
      {
        number: '04.',
        title: 'Magsulat ng Tala at I-print ang Lesson Packet',
        description:
          'Sa loob ng bawat folder, magsulat ng sariling paalala sa pagtuturo. Kapag handa na, i-click ang "I-print ang Packet" para ma-print o ma-save bilang PDF.',
        tip: 'Payo: Pwedeng pumili ng wika (Tagalog, English, at iba pa) sa itaas, at i-install ang app para magamit nang walang internet.',
        actionLabel: 'Tingnan ang Print Packet',
        actionTarget: 'print',
      },
    ],
  },
};

const ES_BUNDLE: TranslationBundle = {
  ...EN_BUNDLE,
  nav: {
    discover: 'Explorar',
    binder: 'Carpeta de Clases',
    printPacket: 'Imprimir Paquete',
    newFolder: 'Nueva Carpeta',
    foldersLabel: 'Carpetas',
    assistantLabel: 'Asistente IA',
  },
  status: {
    online: 'En línea',
    offline: 'Modo sin conexión',
    offlineDetail: 'Carpetas, búsqueda local y asistente sin conexión activos',
    languageLabel: 'Idioma',
    autoDetected: 'Auto',
    installApp: 'Instalar App',
  },
  discover: {
    ...EN_BUNDLE.discover,
    kicker: 'Exploración K–12 · Búsqueda Web y Sin Conexión',
    headline: 'Encuentra recursos para tu próxima clase y guárdalos en un clic.',
    subheadline:
      'Busca planes de clase, laboratorios, lecturas y evaluaciones. Organízalos en carpetas personalizadas o pídele ayuda al Asistente Docente incluso sin internet.',
    searchPlaceholder: 'Busca un tema, actividad, lectura o estándar educativo...',
    searchButton: 'Buscar Recursos',
    searchingButton: 'Buscando...',
    gradeBandLabel: 'Nivel:',
    formatLabel: 'Formato:',
    allFormats: 'Todos los formatos',
    trySearchHeading: 'Prueba una búsqueda',
    saveToPrefix: 'Guardar en',
    savedToPrefix: 'Guardado en',
    chooseFolder: 'Elegir Carpeta',
    createNewFolderOption: 'Crear nueva carpeta...',
    askDeeper: 'Profundizar con el Asistente',
    offlineSearchBanner:
      'Modo sin conexión activo — mostrando resultados de tu carpeta local, búsquedas en caché y biblioteca integrada.',
  },
  assistant: {
    ...EN_BUNDLE.assistant,
    title: 'Asistente Docente',
    contextPrefix: 'Contexto:',
    offlineReady: 'Asistente sin conexión activo (Motor local)',
    welcomeMessage:
      '¡Hola! Soy tu **Asistente Docente de LessonFolio**. Pídeme explicaciones más profundas, adaptaciones para tus estudiantes, o que cree carpetas y guarde guías directamente en tu carpeta—incluso sin conexión.',
    placeholder: 'Pide ideas, adaptaciones o guarda recursos en una carpeta...',
    openAction: 'Abrir',
  },
};

const FR_BUNDLE: TranslationBundle = {
  ...EN_BUNDLE,
  nav: {
    discover: 'Découvrir',
    binder: 'Classeur',
    printPacket: 'Imprimer',
    newFolder: 'Nouveau Dossier',
    foldersLabel: 'Dossiers',
    assistantLabel: 'Assistant IA',
  },
  status: {
    online: 'En ligne',
    offline: 'Mode hors ligne',
    offlineDetail: 'Dossiers, recherche locale et assistant hors ligne actifs',
    languageLabel: 'Langue',
    autoDetected: 'Auto',
    installApp: 'Installer',
  },
  discover: {
    ...EN_BUNDLE.discover,
    headline: 'Trouvez des ressources pour votre prochain cours et enregistrez-les en un clic.',
    searchPlaceholder: 'Rechercher une leçon, activité, lecture ou évaluation...',
    searchButton: 'Rechercher',
    searchingButton: 'Recherche...',
    saveToPrefix: 'Enregistrer dans',
    savedToPrefix: 'Enregistré dans',
    chooseFolder: 'Choisir un dossier',
    askDeeper: 'Approfondir avec l’Assistant',
    offlineSearchBanner:
      'Mode hors ligne actif — résultats issus de votre classeur local et de la bibliothèque intégrée.',
  },
  assistant: {
    ...EN_BUNDLE.assistant,
    title: 'Assistant Pédagogique',
    offlineReady: 'Assistant hors ligne actif',
    welcomeMessage:
      'Bonjour ! Je suis votre **Assistant Pédagogique LessonFolio**. Demandez-moi des explications approfondies, des adaptations ou la création automatique de dossiers—même hors ligne.',
    placeholder: 'Posez une question ou demandez d’enregistrer dans un dossier...',
    openAction: 'Ouvrir',
  },
};

const JA_BUNDLE: TranslationBundle = {
  ...EN_BUNDLE,
  nav: {
    discover: '探す',
    binder: '授業バインダー',
    printPacket: '印刷用パケット',
    newFolder: '新しいフォルダ',
    foldersLabel: 'フォルダ',
    assistantLabel: 'AIアシスタント',
  },
  status: {
    online: 'オンライン',
    offline: 'オフラインモード',
    offlineDetail: '保存済みフォルダ・ローカル検索・オフラインAIが利用可能',
    languageLabel: '言語',
    autoDetected: '自動',
    installApp: 'アプリをインストール',
  },
  discover: {
    ...EN_BUNDLE.discover,
    headline: '明日の授業教材を見つけて、ワンクリックで保存。',
    searchPlaceholder: '教科、単元、実験、ワークシートなどを検索...',
    searchButton: '教材を検索',
    searchingButton: '検索中...',
    saveToPrefix: '保存先:',
    savedToPrefix: '保存済み:',
    chooseFolder: 'フォルダを選択',
    askDeeper: 'AIアシスタントで深掘りする',
    offlineSearchBanner:
      'オフラインモード — 保存済みバインダー、キャッシュ、内蔵教材ライブラリから検索しています。',
  },
  assistant: {
    ...EN_BUNDLE.assistant,
    title: '授業アシスタント',
    offlineReady: 'オフラインアシスタント稼働中',
    welcomeMessage:
      'こんにちは！**LessonFolio 授業アシスタント**です。教材の深掘り、個別最適化の工夫、フォルダ作成や教材の自動保存まで—オフラインでもお手伝いします。',
    placeholder: '詳しい解説や、フォルダへの保存を依頼してください...',
    openAction: '開く',
  },
};

const ID_BUNDLE: TranslationBundle = {
  ...EN_BUNDLE,
  nav: {
    discover: 'Jelajahi',
    binder: 'Folder Ajar',
    printPacket: 'Cetak Paket',
    newFolder: 'Folder Baru',
    foldersLabel: 'Folder',
    assistantLabel: 'Asisten AI',
  },
  status: {
    online: 'Online',
    offline: 'Mode Offline',
    offlineDetail: 'Folder tersimpan, pencarian lokal & asisten offline aktif',
    languageLabel: 'Bahasa',
    autoDetected: 'Otomatis',
    installApp: 'Instal Aplikasi',
  },
  discover: {
    ...EN_BUNDLE.discover,
    headline: 'Temukan materi untuk pelajaran besok, simpan dalam satu klik.',
    searchPlaceholder: 'Cari topik, RPP, aktivitas kelas, atau asesmen...',
    searchButton: 'Cari Materi',
    searchingButton: 'Mencari...',
    saveToPrefix: 'Simpan ke',
    savedToPrefix: 'Tersimpan di',
    chooseFolder: 'Pilih Folder',
    askDeeper: 'Tanya Asisten Lebih Dalam',
    offlineSearchBanner:
      'Mode offline aktif — menampilkan hasil dari folder lokal dan perpustakaan materi bawaan.',
  },
  assistant: {
    ...EN_BUNDLE.assistant,
    title: 'Asisten Mengajar',
    offlineReady: 'Asisten Offline Aktif',
    welcomeMessage:
      'Halo! Saya **Asisten Mengajar LessonFolio**. Tanyakan strategi belajar, diferensiasi, atau minta saya membuat folder dan menyimpan panduan langsung—bahkan saat offline.',
    placeholder: 'Minta penjelasan mendalam atau simpan materi ke folder...',
    openAction: 'Buka',
  },
};

const PT_BUNDLE: TranslationBundle = {
  ...EN_BUNDLE,
  nav: {
    discover: 'Descobrir',
    binder: 'Fichário',
    printPacket: 'Imprimir Pacote',
    newFolder: 'Nova Pasta',
    foldersLabel: 'Pastas',
    assistantLabel: 'Assistente IA',
  },
  status: {
    online: 'Online',
    offline: 'Modo Offline',
    offlineDetail: 'Pastas salvas, busca local e assistente offline ativos',
    languageLabel: 'Idioma',
    autoDetected: 'Auto',
    installApp: 'Instalar App',
  },
  discover: {
    ...EN_BUNDLE.discover,
    headline: 'Encontre qualquer material para a aula de amanhã e salve em um clique.',
    searchPlaceholder: 'Pesquise qualquer tema, atividade, leitura ou avaliação...',
    searchButton: 'Buscar Recursos',
    searchingButton: 'Buscando...',
    saveToPrefix: 'Salvar em',
    savedToPrefix: 'Salvo em',
    chooseFolder: 'Escolher Pasta',
    askDeeper: 'Aprofundar com o Assistente',
    offlineSearchBanner:
      'Modo offline ativo — exibindo resultados das suas pastas locais e biblioteca integrada.',
  },
  assistant: {
    ...EN_BUNDLE.assistant,
    title: 'Assistente Pedagógico',
    offlineReady: 'Assistente Offline Ativo',
    welcomeMessage:
      'Olá! Sou seu **Assistente Pedagógico LessonFolio**. Peça explicações aprofundadas, adaptações de aula ou criação automática de pastas—mesmo offline.',
    placeholder: 'Peça ideias, adaptações ou salve recursos em uma pasta...',
    openAction: 'Abrir',
  },
};

export const TRANSLATIONS: Record<LanguageCode, TranslationBundle> = {
  en: EN_BUNDLE,
  tl: TL_BUNDLE,
  es: ES_BUNDLE,
  fr: FR_BUNDLE,
  ja: JA_BUNDLE,
  id: ID_BUNDLE,
  pt: PT_BUNDLE,
};
