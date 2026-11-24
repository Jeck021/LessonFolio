import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  label: string;
}

export function PWAInstallButton({ label }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#1B4332]/30 bg-white px-2.5 py-1 text-xs font-medium text-[#1B4332] transition-colors hover:bg-[#EDF3EF] whitespace-nowrap shrink-0"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2DC] bg-white px-2.5 py-1 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#F3F1EC] whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
          <span>{label}</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/40 p-4"
          >
            <div className="w-full max-w-sm rounded-xl border border-[#E5E2DC] bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-semibold text-[#1C1917]">
                  Install LessonFolio on iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close"
                  className="cursor-pointer rounded p-1 text-[#57534E] hover:bg-[#F3F1EC]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-[#57534E]">
                1. Tap the <strong>Share</strong> icon in Safari’s toolbar.
                <br />
                2. Scroll down and tap <strong>Add to Home Screen</strong> so LessonFolio works
                offline anytime.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full cursor-pointer rounded-lg bg-[#1B4332] py-2 text-sm font-medium text-white hover:bg-[#2D6A4F]"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
