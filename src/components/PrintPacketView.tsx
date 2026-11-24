import Markdown from 'react-markdown';
import { ArrowLeft, Printer } from 'lucide-react';
import type { TranslationBundle } from '../i18n/translations';
import type { LessonFolder, SavedResource } from '../types';

interface PrintPacketViewProps {
  folder: LessonFolder | null;
  resources: SavedResource[];
  labels: TranslationBundle['print'];
  onBackToBinder: () => void;
}

export function PrintPacketView({
  folder,
  resources,
  labels,
  onBackToBinder,
}: PrintPacketViewProps) {
  if (!folder) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="font-display text-2xl font-semibold text-[#1C1917]">
          {labels.noFolderTitle}
        </h2>
        <p className="mt-2 text-sm text-[#57534E]">{labels.noFolderDesc}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E5E2DC] bg-white px-5 py-3.5">
        <button
          type="button"
          onClick={onBackToBinder}
          className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-[#57534E] hover:text-[#1C1917]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{labels.backToBinder}</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2D6A4F]"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          <span>{labels.printPdf}</span>
        </button>
      </div>

      <article className="print-only-container rounded-xl border border-[#E5E2DC] bg-white p-8 sm:p-10">
        <header className="border-b border-[#E5E2DC] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#57534E]">
            <span>{labels.packetHeader}</span>
            <span className="font-mono-tabular">
              {folder.gradeBand} · {resources.length}
            </span>
          </div>
          <h1 className="font-display mt-2 text-3xl font-semibold text-[#1C1917]">{folder.name}</h1>
          {folder.description && (
            <p className="mt-2.5 text-sm leading-relaxed text-[#44403C]">{folder.description}</p>
          )}
        </header>

        {resources.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#57534E]">{labels.emptyResources}</p>
        ) : (
          <div className="divide-y divide-[#E5E2DC]">
            {resources.map((res, index) => (
              <section key={res.id} className="py-6">
                <div className="text-xs text-[#57534E]">
                  <span className="font-mono-tabular font-medium">
                    {String(index + 1).padStart(2, '0')}.
                  </span>{' '}
                  <span>{res.resourceType}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{res.gradeBand}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono-tabular">{res.estimatedTime}</span>
                </div>

                <h2 className="font-display mt-1 text-xl font-semibold text-[#1C1917]">
                  {res.title}
                </h2>

                {res.url && <p className="mt-1 break-all text-xs text-[#1B4332]">{res.url}</p>}

                <p className="mt-2.5 text-sm leading-relaxed text-[#1C1917]">{res.summary}</p>

                {res.keyTakeaways && res.keyTakeaways.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-[#44403C]">
                    {res.keyTakeaways.map((point, idx) => (
                      <li key={idx} className="list-inside list-disc">
                        {point}
                      </li>
                    ))}
                  </ul>
                )}

                {res.fullGuideMarkdown && (
                  <div className="mt-4 rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] p-4 text-sm leading-relaxed text-[#1C1917] [&_h3]:font-display [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2">
                    <Markdown>{res.fullGuideMarkdown}</Markdown>
                  </div>
                )}

                {res.teacherNotes && (
                  <div className="mt-4 rounded-lg border border-[#E5E2DC] bg-[#F3F1EC]/50 px-4 py-3">
                    <div className="text-xs font-semibold text-[#57534E]">
                      {labels.teacherNotesHeading}
                    </div>
                    <p className="mt-1 text-sm text-[#1C1917]">{res.teacherNotes}</p>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
