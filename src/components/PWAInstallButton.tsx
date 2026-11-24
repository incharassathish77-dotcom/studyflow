import { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export function PWAInstallButton({ compact = false }: PWAInstallButtonProps) {
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
        title="Install STUDYFLOW Web App"
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs sm:text-sm'
        }`}
      >
        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="Install STUDYFLOW on iPhone or iPad"
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs'
          }`}
        >
          <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          >
            <div className="w-full max-w-sm rounded-xl bg-white border border-slate-200 p-6 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <h3
                  id="ios-install-title"
                  className="font-display text-base font-semibold text-slate-900"
                >
                  Install STUDYFLOW on iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close instructions"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-slate-600 list-decimal list-inside">
                <li>
                  Tap the <span className="font-semibold text-slate-800">Share</span> button in
                  Safari&apos;s toolbar.
                </li>
                <li>
                  Scroll down and tap{' '}
                  <span className="font-semibold text-slate-800">Add to Home Screen</span>.
                </li>
                <li>
                  Tap <span className="font-semibold text-slate-800">Add</span> to launch STUDYFLOW
                  as a standalone web app.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer"
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
