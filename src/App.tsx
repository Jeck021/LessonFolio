import { useEffect, useMemo, useState } from 'react';
import {
  FolderOpen,
  Globe,
  HelpCircle,
  MessageSquare,
  RotateCcw,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { DiscoverWorkspace } from './components/DiscoverWorkspace';
import { FolderBinderView } from './components/FolderBinderView';
import { FolderModal } from './components/FolderModal';
import { FolderSidebar } from './components/FolderSidebar';
import { PrintPacketView } from './components/PrintPacketView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { TeachingAssistantPanel } from './components/TeachingAssistantPanel';
import { TopBar, type WorkspaceView } from './components/TopBar';
import { TutorialModal } from './components/TutorialModal';
import { useBinderStore } from './hooks/useBinderStore';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  detectLanguageFromEnvironment,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  type LanguageCode,
} from './i18n/translations';
import type { FolderColor, GradeBand, LessonFolder, SearchResult } from './types';

const LANG_STORAGE_KEY = 'lessonfolio_language_pref_v1';

type LanguagePreference = 'auto' | LanguageCode;

function loadLanguagePreference(): LanguagePreference {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (
      saved === 'auto' ||
      SUPPORTED_LANGUAGES.some((l) => l.code === saved)
    ) {
      return saved as LanguagePreference;
    }
  } catch {
    // Ignore storage issues
  }
  return 'auto';
}

export default function App() {
  const {
    folders,
    resources,
    activeFolderId,
    setActiveFolderId,
    toast,
    dismissToast,
    createFolder,
    updateFolder,
    deleteFolder,
    saveResource,
    updateResourceNotes,
    moveResource,
    deleteResource,
    applyAgentActions,
    exportBinderJson,
    importBinderJson,
    resetStarterBinder,
  } = useBinderStore();

  const isOnline = useOnlineStatus();
  const [languagePref, setLanguagePref] = useState<LanguagePreference>(loadLanguagePreference);
  const detectedInfo = useMemo(() => detectLanguageFromEnvironment(), []);
  const activeLanguage: LanguageCode =
    languagePref === 'auto' ? detectedInfo.code : languagePref;
  const t = TRANSLATIONS[activeLanguage];

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, languagePref);
    } catch {
      // Ignore storage issues
    }
  }, [languagePref]);

  useEffect(() => {
    document.documentElement.lang = activeLanguage;
  }, [activeLanguage]);

  const [activeView, setActiveView] = useState<WorkspaceView>('discover');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<LessonFolder | null>(null);
  const [pendingSearchSave, setPendingSearchSave] = useState<{
    result: SearchResult;
    fullGuideMarkdown?: string;
  } | null>(null);
  const [queuedPrompt, setQueuedPrompt] = useState<{ id: string; text: string } | null>(null);

  const [mobileFoldersOpen, setMobileFoldersOpen] = useState(false);
  const [mobileAssistantOpen, setMobileAssistantOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === activeFolderId) ?? folders[0] ?? null,
    [folders, activeFolderId]
  );

  const activeFolderResources = useMemo(() => {
    if (!activeFolder) return [];
    return resources.filter((r) => r.folderId === activeFolder.id);
  }, [resources, activeFolder]);

  const handleOpenNewFolder = () => {
    setEditingFolder(null);
    setPendingSearchSave(null);
    setIsFolderModalOpen(true);
  };

  const handleEditFolder = (folder: LessonFolder) => {
    setEditingFolder(folder);
    setPendingSearchSave(null);
    setIsFolderModalOpen(true);
  };

  const handleCreateFolderFromSearch = (result: SearchResult, fullGuideMarkdown?: string) => {
    setEditingFolder(null);
    setPendingSearchSave({ result, fullGuideMarkdown });
    setIsFolderModalOpen(true);
  };

  const handleSaveFolderModal = (data: {
    name: string;
    gradeBand: GradeBand;
    description: string;
    colorTag: FolderColor;
  }) => {
    if (editingFolder) {
      updateFolder(editingFolder.id, data);
    } else {
      const created = createFolder(data);
      if (pendingSearchSave) {
        const { result, fullGuideMarkdown } = pendingSearchSave;
        saveResource({
          folderId: created.id,
          title: result.title,
          url: result.url || undefined,
          sourceDomain: result.domain,
          resourceType: result.resourceType,
          gradeBand: result.gradeBand,
          estimatedTime: result.estimatedTime,
          summary: result.snippet,
          fullGuideMarkdown,
          keyTakeaways: result.keyTakeaways,
          addedBy: 'user',
        });
        setPendingSearchSave(null);
      } else {
        setActiveView('binder');
      }
    }
  };

  const handleSaveSearchResult = (
    result: SearchResult,
    folderId: string,
    fullGuideMarkdown?: string
  ) => {
    saveResource({
      folderId,
      title: result.title,
      url: result.url || undefined,
      sourceDomain: result.domain,
      resourceType: result.resourceType,
      gradeBand: result.gradeBand,
      estimatedTime: result.estimatedTime,
      summary: result.snippet,
      fullGuideMarkdown,
      keyTakeaways: result.keyTakeaways,
      addedBy: 'user',
    });
  };

  const handleAskAssistant = (prompt: string) => {
    setQueuedPrompt({ id: `qp-${Date.now()}`, text: prompt });
    setMobileAssistantOpen(true);
  };

  const handleSelectFolder = (folderId: string) => {
    setActiveFolderId(folderId);
    setActiveView('binder');
    setMobileFoldersOpen(false);
  };

  const detectedLangOption = SUPPORTED_LANGUAGES.find((l) => l.code === detectedInfo.code);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F6] text-[#1C1917] lg:h-screen lg:overflow-hidden">
      <TopBar
        activeView={activeView}
        labels={t.nav}
        onSelectView={setActiveView}
        onOpenNewFolder={handleOpenNewFolder}
      />

      {/* Workspace Utility Bar (Connectivity Status, Language Switcher, PWA Install, Mobile Drawers) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2DC] bg-[#F3F1EC] px-4 py-2 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Mobile Drawer Toggles */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => {
                setMobileFoldersOpen(true);
                setMobileAssistantOpen(false);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2DC] bg-white px-2.5 py-1 text-xs font-medium text-[#1C1917]"
            >
              <FolderOpen className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
              <span>
                {t.nav.foldersLabel} ({folders.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileAssistantOpen(true);
                setMobileFoldersOpen(false);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1B4332] px-2.5 py-1 text-xs font-medium text-white"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.nav.assistantLabel}</span>
            </button>
          </div>

          {/* Connectivity Status (Icon + Text Label) */}
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              isOnline ? 'text-[#1B4332]' : 'text-[#B45309]'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t.status.online}</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {t.status.offline} · {t.status.offlineDetail}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Language Selector (Auto-detected by region + manual override) */}
          <div className="inline-flex items-center gap-1.5 text-xs text-[#57534E]">
            <Globe className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
            <label htmlFor="language-select" className="sr-only">
              {t.status.languageLabel}
            </label>
            <select
              id="language-select"
              value={languagePref}
              onChange={(e) => setLanguagePref(e.target.value as LanguagePreference)}
              className="cursor-pointer rounded-lg border border-[#E5E2DC] bg-white px-2.5 py-1 text-xs font-medium text-[#1C1917] focus:border-[#1B4332] focus:outline-none"
            >
              <option value="auto">
                {t.status.autoDetected} ({detectedLangOption?.nativeName ?? 'English'} ·{' '}
                {detectedInfo.sourceLabel})
              </option>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} — {lang.regionHint}
                </option>
              ))}
            </select>
          </div>

          <PWAInstallButton label={t.status.installApp} />

          <button
            type="button"
            onClick={() => setIsTutorialOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2DC] bg-white px-2.5 py-1 text-xs font-medium text-[#1C1917] transition-colors hover:border-[#1B4332]/40 hover:text-[#1B4332] whitespace-nowrap shrink-0"
          >
            <HelpCircle className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
            <span>{t.tutorial.buttonLabel}</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Editorial Workspace */}
      <div className="relative flex flex-1 overflow-hidden">
        <div className="hidden lg:flex">
          <FolderSidebar
            folders={folders}
            resources={resources}
            activeFolderId={activeFolder?.id ?? null}
            labels={t.sidebar}
            onSelectFolder={handleSelectFolder}
            onCreateFolder={handleOpenNewFolder}
            onEditFolder={handleEditFolder}
            onDeleteFolder={deleteFolder}
            onExportJson={exportBinderJson}
            onImportJson={importBinderJson}
            onResetStarter={resetStarterBinder}
          />
        </div>

        {mobileFoldersOpen && (
          <div className="no-print fixed inset-0 z-40 flex lg:hidden">
            <div
              className="fixed inset-0 bg-[#1C1917]/30"
              onClick={() => setMobileFoldersOpen(false)}
            />
            <div className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col bg-[#F3F1EC] shadow-xl">
              <div className="flex items-center justify-between border-b border-[#E5E2DC] px-4 py-2.5">
                <span className="text-xs font-semibold text-[#57534E]">{t.sidebar.title}</span>
                <button
                  type="button"
                  onClick={() => setMobileFoldersOpen(false)}
                  aria-label="Close folders drawer"
                  className="rounded p-1 text-[#57534E]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <FolderSidebar
                  folders={folders}
                  resources={resources}
                  activeFolderId={activeFolder?.id ?? null}
                  labels={t.sidebar}
                  onSelectFolder={handleSelectFolder}
                  onCreateFolder={() => {
                    setMobileFoldersOpen(false);
                    handleOpenNewFolder();
                  }}
                  onEditFolder={handleEditFolder}
                  onDeleteFolder={deleteFolder}
                  onExportJson={exportBinderJson}
                  onImportJson={importBinderJson}
                  onResetStarter={resetStarterBinder}
                />
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-[#FAF9F6]">
          {activeView === 'discover' && (
            <DiscoverWorkspace
              folders={folders}
              savedResources={resources}
              activeFolderId={activeFolder?.id ?? null}
              language={activeLanguage}
              isOnline={isOnline}
              labels={t.discover}
              onSaveResultToFolder={handleSaveSearchResult}
              onCreateFolderFromSearch={handleCreateFolderFromSearch}
              onAskAssistantDeeper={handleAskAssistant}
              onOpenFolder={handleSelectFolder}
            />
          )}

          {activeView === 'binder' && (
            <FolderBinderView
              folder={activeFolder}
              allFolders={folders}
              resources={activeFolderResources}
              labels={t.binder}
              onEditFolder={handleEditFolder}
              onUpdateNotes={updateResourceNotes}
              onMoveResource={moveResource}
              onDeleteResource={deleteResource}
              onGoToDiscover={() => setActiveView('discover')}
              onOpenPrintPacket={() => setActiveView('print')}
              onAskAssistant={handleAskAssistant}
            />
          )}

          {activeView === 'print' && (
            <PrintPacketView
              folder={activeFolder}
              resources={activeFolderResources}
              labels={t.print}
              onBackToBinder={() => setActiveView('binder')}
            />
          )}
        </main>

        <div className="hidden lg:flex">
          <TeachingAssistantPanel
            folders={folders}
            allResources={resources}
            activeFolder={activeFolder}
            activeFolderResources={activeFolderResources}
            language={activeLanguage}
            isOnline={isOnline}
            labels={t.assistant}
            queuedPrompt={queuedPrompt}
            onClearQueuedPrompt={() => setQueuedPrompt(null)}
            onApplyAgentActions={applyAgentActions}
            onNavigateToFolder={handleSelectFolder}
          />
        </div>

        {mobileAssistantOpen && (
          <div className="no-print fixed inset-0 z-40 flex justify-end lg:hidden">
            <div
              className="fixed inset-0 bg-[#1C1917]/30"
              onClick={() => setMobileAssistantOpen(false)}
            />
            <div className="relative z-10 flex h-full w-96 max-w-[92vw] flex-col bg-[#FAF9F6] shadow-xl">
              <div className="flex items-center justify-between border-b border-[#E5E2DC] bg-white px-4 py-2.5">
                <span className="text-xs font-semibold text-[#57534E]">{t.assistant.title}</span>
                <button
                  type="button"
                  onClick={() => setMobileAssistantOpen(false)}
                  aria-label="Close assistant drawer"
                  className="rounded p-1 text-[#57534E]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <TeachingAssistantPanel
                  folders={folders}
                  allResources={resources}
                  activeFolder={activeFolder}
                  activeFolderResources={activeFolderResources}
                  language={activeLanguage}
                  isOnline={isOnline}
                  labels={t.assistant}
                  queuedPrompt={queuedPrompt}
                  onClearQueuedPrompt={() => setQueuedPrompt(null)}
                  onApplyAgentActions={applyAgentActions}
                  onNavigateToFolder={(id) => {
                    setMobileAssistantOpen(false);
                    handleSelectFolder(id);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <FolderModal
        isOpen={isFolderModalOpen}
        editingFolder={editingFolder}
        labels={t.modal}
        onClose={() => {
          setIsFolderModalOpen(false);
          setPendingSearchSave(null);
        }}
        onSave={handleSaveFolderModal}
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        labels={t.tutorial}
        onClose={() => setIsTutorialOpen(false)}
        onJumpTo={(target) => {
          if (target === 'assistant') {
            setMobileAssistantOpen(true);
          } else {
            setActiveView(target);
          }
        }}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-[#E5E2DC] bg-[#1C1917] px-4 py-2.5 text-xs text-white shadow-lg"
        >
          <span>{toast.message}</span>
          {toast.undoAction && (
            <button
              type="button"
              onClick={() => {
                toast.undoAction?.();
                dismissToast();
              }}
              className="inline-flex cursor-pointer items-center gap-1 font-semibold text-[#FEF3C7] hover:underline"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Undo</span>
            </button>
          )}
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="cursor-pointer text-white/70 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
