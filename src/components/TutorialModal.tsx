import { ArrowRight, X } from 'lucide-react';
import type { TranslationBundle } from '../i18n/translations';

interface TutorialModalProps {
  isOpen: boolean;
  labels: TranslationBundle['tutorial'];
  onClose: () => void;
  onJumpTo: (target: 'discover' | 'binder' | 'assistant' | 'print') => void;
}

export function TutorialModal({ isOpen, labels, onClose, onJumpTo }: TutorialModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#E5E2DC] bg-[#FAF9F6] shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E2DC] bg-white px-6 py-5">
          <div>
            <h2
              id="tutorial-modal-title"
              className="font-display text-2xl font-semibold text-[#1C1917] [text-wrap:balance]"
            >
              {labels.title}
            </h2>
            <p className="mt-1 text-sm text-[#57534E]">{labels.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.closeBtn}
            className="cursor-pointer rounded-lg p-1.5 text-[#57534E] transition-colors hover:bg-[#F3F1EC] hover:text-[#1C1917]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 divide-y divide-[#E5E2DC] overflow-y-auto px-6 py-2">
          {labels.steps.map((step) => (
            <div key={step.number} className="py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold text-[#1C1917]">
                    <span className="font-mono-tabular mr-2 text-sm font-medium text-[#1B4332]">
                      {step.number}
                    </span>
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#44403C]">
                    {step.description}
                  </p>
                  <p className="mt-2 rounded-lg border border-[#E5E2DC] bg-white px-3 py-2 text-xs text-[#57534E]">
                    {step.tip}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onJumpTo(step.actionTarget);
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2DC] bg-white px-3 py-1.5 text-xs font-medium text-[#1B4332] transition-colors hover:border-[#1B4332]/40 hover:bg-[#EDF3EF] whitespace-nowrap shrink-0"
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end border-t border-[#E5E2DC] bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-[#1B4332] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2D6A4F]"
          >
            {labels.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
