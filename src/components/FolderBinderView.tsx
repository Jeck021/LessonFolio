import { useState } from 'react';
import Markdown from 'react-markdown';
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FolderOpen,
  MessageSquarePlus,
  Pencil,
  Printer,
  Search,
  Trash2,
} from 'lucide-react';
import type { TranslationBundle } from '../i18n/translations';
import type { LessonFolder, SavedResource } from '../types';

interface FolderBinderViewProps {
  folder: LessonFolder | null;
  allFolders: LessonFolder[];
  resources: SavedResource[];
  labels: TranslationBundle['binder'];
  onEditFolder: (folder: LessonFolder) => void;
  onUpdateNotes: (resourceId: string, notes: string) => void;
  onMoveResource: (resourceId: string, targetFolderId: string) => void;
  onDeleteResource: (resourceId: string) => void;
  onGoToDiscover: () => void;
  onOpenPrintPacket: () => void;
  onAskAssistant: (prompt: string) => void;
}

export function FolderBinderView({
  folder,
  allFolders,
  resources,
  labels,
  onEditFolder,
  onUpdateNotes,
  onMoveResource,
  onDeleteResource,
  onGoToDiscover,
  onOpenPrintPacket,
  onAskAssistant,
}: FolderBinderViewProps) {
  const [expandedGuides, setExpandedGuides] = useState<Record<string, boolean>>({});
  const [filterText, setFilterText] = useState('');

  if (!folder) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
        <FolderOpen className="h-10 w-10 text-[#78716C]" aria-hidden="true" />
        <h2 className="font-display mt-4 text-2xl font-semibold text-[#1C1917]">
          {labels.emptySelectTitle}
        </h2>
        <p className="mt-2 text-sm text-[#57534E]">{labels.emptySelectDesc}</p>
        <button
          type="button"
          onClick={onGoToDiscover}
          className="mt-5 cursor-pointer rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D6A4F]"
        >
          {labels.discoverBtn}
        </button>
      </div>
    );
  }

  const normalizedQuery = filterText.trim().toLowerCase();
  const visibleResources = normalizedQuery
    ? resources.filter(
        (r) =>
          r.title.toLowerCase().includes(normalizedQuery) ||
          r.summary.toLowerCase().includes(normalizedQuery) ||
          r.teacherNotes.toLowerCase().includes(normalizedQuery)
      )
    : resources;

  const toggleGuide = (id: string) => {
    setExpandedGuides((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <header className="rounded-xl border border-[#E5E2DC] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
              <span>{folder.gradeBand}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{resources.length}</span>
              <span aria-hidden="true">·</span>
              <span>{new Date(folder.updatedAt).toLocaleDateString()}</span>
            </div>
            <h1 className="font-display mt-1.5 text-2xl font-semibold text-[#1C1917] sm:text-3xl [text-wrap:balance]">
              {folder.name}
            </h1>
            {folder.description && (
              <p className="mt-2 text-sm leading-relaxed text-[#57534E]">{folder.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEditFolder(folder)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] px-3 py-2 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#F3F1EC]"
            >
              <Pencil className="h-3.5 w-3.5 text-[#57534E]" aria-hidden="true" />
              <span>{labels.editFolder}</span>
            </button>
            <button
              type="button"
              onClick={onOpenPrintPacket}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] px-3 py-2 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#F3F1EC]"
            >
              <Printer className="h-3.5 w-3.5 text-[#57534E]" aria-hidden="true" />
              <span>{labels.printPacket}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onAskAssistant(
                  `Look at my "${folder.name}" folder (${folder.gradeBand}). Suggest 2 complementary activities or an exit ticket to strengthen this unit and save them into "${folder.name}".`
                )
              }
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1B4332] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#2D6A4F]"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{labels.enrichAssistant}</span>
            </button>
          </div>
        </div>

        {resources.length > 0 && (
          <div className="mt-5 border-t border-[#E5E2DC] pt-4">
            <div className="relative max-w-sm">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#78716C]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder={labels.filterPlaceholder}
                aria-label={labels.filterPlaceholder}
                className="w-full rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] py-2 pr-3 pl-8 text-xs text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B4332] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        )}
      </header>

      {resources.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#D6D3CD] bg-white p-10 text-center">
          <FolderOpen className="mx-auto h-9 w-9 text-[#78716C]" aria-hidden="true" />
          <h2 className="font-display mt-3 text-xl font-semibold text-[#1C1917]">
            {labels.emptyFolderTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#57534E]">{labels.emptyFolderDesc}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onGoToDiscover}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D6A4F]"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>{labels.discoverBtn}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onAskAssistant(
                  `Find 3 practical classroom resources for my folder "${folder.name}" (${folder.gradeBand}) and save them directly into it.`
                )
              }
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] px-4 py-2 text-sm font-medium text-[#1C1917] hover:bg-[#F3F1EC]"
            >
              <MessageSquarePlus className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
              <span>{labels.populateAssistant}</span>
            </button>
          </div>
        </div>
      ) : visibleResources.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#E5E2DC] bg-white p-8 text-center text-sm text-[#57534E]">
          No saved items match "{filterText}".
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {visibleResources.map((res) => {
            const isExpanded = Boolean(expandedGuides[res.id]);
            const otherFolders = allFolders.filter((f) => f.id !== folder.id);

            return (
              <article key={res.id} className="rounded-xl border border-[#E5E2DC] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
                      <span>{res.gradeBand}</span>
                      <span aria-hidden="true">·</span>
                      <span>{res.resourceType}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{res.estimatedTime}</span>
                      {res.sourceDomain && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{res.sourceDomain}</span>
                        </>
                      )}
                      {res.addedBy === 'assistant' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-[#B45309]">
                            {labels.savedByAssistant}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="font-display mt-1.5 text-lg font-semibold text-[#1C1917]">
                      {res.url ? (
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-baseline gap-1.5 hover:text-[#1B4332] hover:underline"
                        >
                          <span>{res.title}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        </a>
                      ) : (
                        res.title
                      )}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteResource(res.id)}
                    aria-label={`Remove ${res.title}`}
                    className="cursor-pointer rounded-lg p-1.5 text-[#78716C] transition-colors hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-[#44403C]">{res.summary}</p>

                {res.keyTakeaways && res.keyTakeaways.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-[#57534E]">
                    {res.keyTakeaways.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#1B4332]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {res.fullGuideMarkdown && (
                  <div className="mt-3 border-t border-[#F3F1EC] pt-3">
                    <button
                      type="button"
                      onClick={() => toggleGuide(res.id)}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#1B4332] hover:underline"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{labels.hideGuide}</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{labels.showGuide}</span>
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] p-4 text-sm leading-relaxed text-[#1C1917] [&_h3]:font-display [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2">
                        <Markdown>{res.fullGuideMarkdown}</Markdown>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 border-t border-[#E5E2DC] pt-3.5">
                  <label
                    htmlFor={`notes-${res.id}`}
                    className="block text-xs font-medium text-[#57534E]"
                  >
                    {labels.teacherNotesLabel}
                  </label>
                  <textarea
                    id={`notes-${res.id}`}
                    rows={2}
                    value={res.teacherNotes}
                    onChange={(e) => onUpdateNotes(res.id, e.target.value)}
                    placeholder={labels.teacherNotesPlaceholder}
                    className="mt-1.5 w-full resize-y rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] px-3 py-2 text-xs leading-relaxed text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B4332] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      onAskAssistant(
                        `Help me adapt "${res.title}" from my "${folder.name}" folder. Suggest differentiation strategies, timing tips, and a quick check-for-understanding question.`
                      )
                    }
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2DC] bg-white px-3 py-1.5 text-xs font-medium text-[#1C1917] transition-colors hover:border-[#1B4332]/40 hover:text-[#1B4332]"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                    <span>{labels.adaptAssistant}</span>
                  </button>

                  {otherFolders.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-[#57534E]">
                      <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      <select
                        aria-label={`Move ${res.title} to another folder`}
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            onMoveResource(res.id, e.target.value);
                          }
                        }}
                        className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] px-2.5 py-1.5 text-xs text-[#1C1917] focus:border-[#1B4332] focus:outline-none"
                      >
                        <option value="">{labels.moveToFolder}</option>
                        {otherFolders.map((target) => (
                          <option key={target.id} value={target.id}>
                            {target.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
