import { useCallback, useEffect, useState } from 'react';
import { STARTER_FOLDERS, STARTER_RESOURCES } from '../data/starterBinder';
import type {
  AppliedActionReceipt,
  BinderExportData,
  FolderAction,
  FolderColor,
  GradeBand,
  LessonFolder,
  ResourceType,
  SavedResource,
} from '../types';

const STORAGE_KEY = 'lessonfolio_binder_v1';

interface StoredBinder {
  folders: LessonFolder[];
  resources: SavedResource[];
}

export interface ToastNotice {
  id: string;
  message: string;
  tone: 'success' | 'info' | 'error';
  undoAction?: () => void;
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function loadInitialBinder(): StoredBinder {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { folders: STARTER_FOLDERS, resources: STARTER_RESOURCES };
    }
    const parsed = JSON.parse(raw) as Partial<StoredBinder>;
    if (Array.isArray(parsed.folders) && Array.isArray(parsed.resources)) {
      return { folders: parsed.folders, resources: parsed.resources };
    }
  } catch {
    // Fall back cleanly if localStorage is corrupted or unavailable
  }
  return { folders: STARTER_FOLDERS, resources: STARTER_RESOURCES };
}

export function useBinderStore() {
  const [binder, setBinder] = useState<StoredBinder>(loadInitialBinder);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(() => {
    const initial = loadInitialBinder();
    return initial.folders[0]?.id ?? null;
  });
  const [toast, setToast] = useState<ToastNotice | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(binder));
    } catch {
      // Ignore quota errors gracefully
    }
  }, [binder]);

  const showToast = useCallback(
    (message: string, tone: 'success' | 'info' | 'error' = 'success', undoAction?: () => void) => {
      const id = generateId('toast');
      setToast({ id, message, tone, undoAction });
      window.setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, 5000);
    },
    []
  );

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const createFolder = useCallback(
    (input: {
      name: string;
      gradeBand: GradeBand;
      description: string;
      colorTag: FolderColor;
    }): LessonFolder => {
      const now = new Date().toISOString();
      const newFolder: LessonFolder = {
        id: generateId('folder'),
        name: input.name.trim() || 'Untitled Lesson Folder',
        description: input.description.trim(),
        gradeBand: input.gradeBand,
        colorTag: input.colorTag,
        createdAt: now,
        updatedAt: now,
      };
      setBinder((prev) => ({
        ...prev,
        folders: [newFolder, ...prev.folders],
      }));
      setActiveFolderId(newFolder.id);
      showToast(`Created folder "${newFolder.name}"`, 'success');
      return newFolder;
    },
    [showToast]
  );

  const updateFolder = useCallback(
    (
      folderId: string,
      updates: Partial<Pick<LessonFolder, 'name' | 'description' | 'gradeBand' | 'colorTag'>>
    ) => {
      setBinder((prev) => ({
        ...prev,
        folders: prev.folders.map((folder) =>
          folder.id === folderId
            ? {
                ...folder,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : folder
        ),
      }));
      showToast('Folder updated', 'success');
    },
    [showToast]
  );

  const deleteFolder = useCallback(
    (folderId: string) => {
      const snapshot = binder;
      const target = binder.folders.find((f) => f.id === folderId);
      if (!target) return;

      setBinder((prev) => {
        const nextFolders = prev.folders.filter((f) => f.id !== folderId);
        const nextResources = prev.resources.filter((r) => r.folderId !== folderId);
        return { folders: nextFolders, resources: nextResources };
      });

      setActiveFolderId((prevActive) => {
        if (prevActive !== folderId) return prevActive;
        const remaining = binder.folders.filter((f) => f.id !== folderId);
        return remaining[0]?.id ?? null;
      });

      showToast(`Deleted "${target.name}"`, 'info', () => {
        setBinder(snapshot);
        setActiveFolderId(folderId);
      });
    },
    [binder, showToast]
  );

  const saveResource = useCallback(
    (input: {
      folderId: string;
      title: string;
      url?: string;
      sourceDomain?: string;
      resourceType: ResourceType;
      gradeBand: GradeBand;
      estimatedTime: string;
      summary: string;
      fullGuideMarkdown?: string;
      keyTakeaways?: string[];
      teacherNotes?: string;
      addedBy?: 'user' | 'assistant';
    }): SavedResource => {
      const snapshot = binder;
      const folder = binder.folders.find((f) => f.id === input.folderId);
      const resource: SavedResource = {
        id: generateId('res'),
        folderId: input.folderId,
        title: input.title.trim(),
        url: input.url?.trim() || undefined,
        sourceDomain: input.sourceDomain?.trim() || undefined,
        resourceType: input.resourceType,
        gradeBand: input.gradeBand,
        estimatedTime: input.estimatedTime.trim() || '30 min',
        summary: input.summary.trim(),
        fullGuideMarkdown: input.fullGuideMarkdown,
        keyTakeaways: input.keyTakeaways,
        teacherNotes: input.teacherNotes?.trim() || '',
        addedBy: input.addedBy ?? 'user',
        savedAt: new Date().toISOString(),
      };

      setBinder((prev) => ({
        folders: prev.folders.map((f) =>
          f.id === input.folderId ? { ...f, updatedAt: new Date().toISOString() } : f
        ),
        resources: [resource, ...prev.resources],
      }));

      showToast(
        `Saved to "${folder?.name ?? 'Folder'}"`,
        'success',
        () => setBinder(snapshot)
      );
      return resource;
    },
    [binder, showToast]
  );

  const updateResourceNotes = useCallback((resourceId: string, teacherNotes: string) => {
    setBinder((prev) => ({
      ...prev,
      resources: prev.resources.map((res) =>
        res.id === resourceId ? { ...res, teacherNotes } : res
      ),
    }));
  }, []);

  const moveResource = useCallback(
    (resourceId: string, targetFolderId: string) => {
      const targetFolder = binder.folders.find((f) => f.id === targetFolderId);
      setBinder((prev) => ({
        folders: prev.folders.map((f) =>
          f.id === targetFolderId ? { ...f, updatedAt: new Date().toISOString() } : f
        ),
        resources: prev.resources.map((res) =>
          res.id === resourceId ? { ...res, folderId: targetFolderId } : res
        ),
      }));
      if (targetFolder) {
        showToast(`Moved to "${targetFolder.name}"`, 'success');
      }
    },
    [binder.folders, showToast]
  );

  const deleteResource = useCallback(
    (resourceId: string) => {
      const snapshot = binder;
      const target = binder.resources.find((r) => r.id === resourceId);
      setBinder((prev) => ({
        ...prev,
        resources: prev.resources.filter((r) => r.id !== resourceId),
      }));
      if (target) {
        showToast(`Removed "${target.title}"`, 'info', () => setBinder(snapshot));
      }
    },
    [binder, showToast]
  );

  const applyAgentActions = useCallback(
    (actions: FolderAction[]): AppliedActionReceipt[] => {
      if (!actions.length) return [];
      const snapshot = binder;
      const receipts: AppliedActionReceipt[] = [];
      let nextFolders = [...binder.folders];
      let nextResources = [...binder.resources];
      let latestCreatedFolderId: string | null = null;
      const now = new Date().toISOString();

      for (const action of actions) {
        if (action.type === 'create_folder') {
          const existing = nextFolders.find(
            (f) => f.name.toLowerCase() === action.folderName.trim().toLowerCase()
          );
          if (existing) {
            receipts.push({
              id: generateId('rcpt'),
              type: 'create_folder',
              folderId: existing.id,
              folderName: existing.name,
            });
            latestCreatedFolderId = existing.id;
          } else {
            const newFolder: LessonFolder = {
              id: generateId('folder'),
              name: action.folderName.trim(),
              description: action.description.trim(),
              gradeBand: action.gradeBand,
              colorTag: action.colorTag,
              createdAt: now,
              updatedAt: now,
            };
            nextFolders = [newFolder, ...nextFolders];
            latestCreatedFolderId = newFolder.id;
            receipts.push({
              id: generateId('rcpt'),
              type: 'create_folder',
              folderId: newFolder.id,
              folderName: newFolder.name,
            });
          }
        } else if (action.type === 'save_resource') {
          let targetFolder = nextFolders.find(
            (f) => f.name.toLowerCase() === action.folderName.trim().toLowerCase()
          );
          if (!targetFolder) {
            targetFolder = {
              id: generateId('folder'),
              name: action.folderName.trim() || 'Assistant Saved Resources',
              description: 'Created automatically by your AI Teaching Assistant.',
              gradeBand: action.gradeBand,
              colorTag: 'sage',
              createdAt: now,
              updatedAt: now,
            };
            nextFolders = [targetFolder, ...nextFolders];
            latestCreatedFolderId = targetFolder.id;
          }

          const newRes: SavedResource = {
            id: generateId('res'),
            folderId: targetFolder.id,
            title: action.title.trim(),
            url: action.url?.trim() || undefined,
            sourceDomain:
              action.sourceDomain?.trim() ||
              (action.url ? safeDomain(action.url) : 'LessonFolio AI Guide'),
            resourceType: action.resourceType,
            gradeBand: action.gradeBand,
            estimatedTime: action.estimatedTime || '30 min',
            summary: action.summary.trim(),
            fullGuideMarkdown: action.fullGuideMarkdown,
            keyTakeaways: action.keyTakeaways,
            teacherNotes: action.teacherNotes?.trim() || '',
            addedBy: 'assistant',
            savedAt: now,
          };

          nextResources = [newRes, ...nextResources];
          nextFolders = nextFolders.map((f) =>
            f.id === targetFolder!.id ? { ...f, updatedAt: now } : f
          );
          receipts.push({
            id: generateId('rcpt'),
            type: 'save_resource',
            folderId: targetFolder.id,
            folderName: targetFolder.name,
            resourceTitle: newRes.title,
          });
        }
      }

      setBinder({ folders: nextFolders, resources: nextResources });
      if (latestCreatedFolderId) {
        setActiveFolderId(latestCreatedFolderId);
      }

      const savedCount = receipts.filter((r) => r.type === 'save_resource').length;
      const folderCount = receipts.filter((r) => r.type === 'create_folder').length;
      if (savedCount > 0 || folderCount > 0) {
        const parts: string[] = [];
        if (folderCount > 0) parts.push(`${folderCount} folder${folderCount > 1 ? 's' : ''}`);
        if (savedCount > 0) parts.push(`${savedCount} resource${savedCount > 1 ? 's' : ''}`);
        showToast(`Assistant updated ${parts.join(' and ')}`, 'success', () =>
          setBinder(snapshot)
        );
      }

      return receipts;
    },
    [binder, showToast]
  );

  const exportBinderJson = useCallback(() => {
    const payload: BinderExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      folders: binder.folders,
      resources: binder.resources,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lessonfolio-binder-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported lesson binder backup', 'success');
  }, [binder, showToast]);

  const importBinderJson = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as Partial<BinderExportData>;
        if (!Array.isArray(parsed.folders) || !Array.isArray(parsed.resources)) {
          showToast('Invalid LessonFolio backup file', 'error');
          return;
        }
        setBinder({ folders: parsed.folders, resources: parsed.resources });
        setActiveFolderId(parsed.folders[0]?.id ?? null);
        showToast(`Imported ${parsed.folders.length} folders`, 'success');
      } catch {
        showToast('Could not read backup JSON file', 'error');
      }
    },
    [showToast]
  );

  const resetStarterBinder = useCallback(() => {
    const snapshot = binder;
    setBinder({ folders: STARTER_FOLDERS, resources: STARTER_RESOURCES });
    setActiveFolderId(STARTER_FOLDERS[0].id);
    showToast('Restored starter lesson folders', 'info', () => setBinder(snapshot));
  }, [binder, showToast]);

  return {
    folders: binder.folders,
    resources: binder.resources,
    activeFolderId,
    setActiveFolderId,
    toast,
    dismissToast,
    showToast,
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
  };
}

function safeDomain(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '');
  } catch {
    return 'web-resource';
  }
}
