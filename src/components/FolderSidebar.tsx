import { useRef } from 'react';
import {
  Download,
  FolderOpen,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import type { TranslationBundle } from '../i18n/translations';
import type { FolderColor, LessonFolder, SavedResource } from '../types';

interface FolderSidebarProps {
  folders: LessonFolder[];
  resources: SavedResource[];
  activeFolderId: string | null;
  labels: TranslationBundle['sidebar'];
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: LessonFolder) => void;
  onDeleteFolder: (folderId: string) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetStarter: () => void;
}

const FOLDER_SWATCH_HEX: Record<FolderColor, string> = {
  sage: '#1B4332',
  ochre: '#B45309',
  slate: '#334155',
  plum: '#6B21A8',
  teal: '#0F766E',
};

export function FolderSidebar({
  folders,
  resources,
  activeFolderId,
  labels,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onExportJson,
  onImportJson,
  onResetStarter,
}: FolderSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const countForFolder = (folderId: string) =>
    resources.filter((r) => r.folderId === folderId).length;

  return (
    <aside
      aria-label={labels.title}
      className="no-print flex h-full w-full flex-col border-r border-[#E5E2DC] bg-[#F3F1EC] lg:w-[272px] lg:shrink-0"
    >
      <div className="flex items-center justify-between border-b border-[#E5E2DC] px-4 py-3.5">
        <div>
          <h2 className="font-display text-base font-semibold text-[#1C1917]">{labels.title}</h2>
          <p className="font-mono-tabular text-xs text-[#57534E]">
            {folders.length} {folders.length === 1 ? labels.folderWord : labels.foldersWord} ·{' '}
            {resources.length} {labels.savedWord}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateFolder}
          title={labels.createFirst}
          aria-label={labels.createFirst}
          className="cursor-pointer rounded-lg border border-[#E5E2DC] bg-white p-1.5 text-[#1C1917] transition-colors hover:border-[#1B4332] hover:text-[#1B4332]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {folders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#D6D3CD] bg-[#FAF9F6] p-4 text-center">
            <FolderOpen className="mx-auto h-6 w-6 text-[#78716C]" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-[#1C1917]">{labels.noFoldersTitle}</p>
            <p className="mt-1 text-xs text-[#57534E]">{labels.noFoldersDesc}</p>
            <button
              type="button"
              onClick={onCreateFolder}
              className="mt-3 cursor-pointer rounded-lg bg-[#1B4332] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2D6A4F]"
            >
              {labels.createFirst}
            </button>
          </div>
        ) : (
          folders.map((folder) => {
            const isActive = folder.id === activeFolderId;
            const count = countForFolder(folder.id);
            const swatch = FOLDER_SWATCH_HEX[folder.colorTag] ?? '#1B4332';

            return (
              <div
                key={folder.id}
                className={`group flex items-start justify-between gap-2 rounded-lg border px-3 py-2.5 transition-colors duration-150 ${
                  isActive
                    ? 'border-[#1B4332]/30 bg-white shadow-xs'
                    : 'border-transparent hover:border-[#E5E2DC] hover:bg-[#FAF9F6]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectFolder(folder.id)}
                  className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-[#1B4332]"
                >
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: swatch }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[#1C1917]">{folder.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#57534E]">
                      <span>{folder.gradeBand}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        {count} {count === 1 ? labels.itemWord : labels.itemsWord}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-0.5 opacity-80 transition-opacity group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEditFolder(folder)}
                    aria-label={`Edit ${folder.name}`}
                    className="cursor-pointer rounded p-1 text-[#57534E] hover:bg-[#F3F1EC] hover:text-[#1C1917]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteFolder(folder.id)}
                    aria-label={`Delete ${folder.name}`}
                    className="cursor-pointer rounded p-1 text-[#57534E] hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-[#E5E2DC] bg-[#ECEAE3]/60 px-4 py-3">
        <div className="flex items-center justify-between gap-2 text-xs text-[#57534E]">
          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex cursor-pointer items-center gap-1.5 font-medium hover:text-[#1C1917]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{labels.exportBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex cursor-pointer items-center gap-1.5 font-medium hover:text-[#1C1917]"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{labels.importBtn}</span>
          </button>

          <button
            type="button"
            onClick={onResetStarter}
            className="inline-flex cursor-pointer items-center gap-1 font-medium hover:text-[#1C1917]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{labels.starterBtn}</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onImportJson(file);
              e.target.value = '';
            }
          }}
        />
      </div>
    </aside>
  );
}
