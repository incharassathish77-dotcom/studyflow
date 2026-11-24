import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  label = 'Loading TaskFlow...',
  fullScreen = false,
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2.5 py-8 text-slate-600">
      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
