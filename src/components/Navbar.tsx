import { Menu, Plus } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface NavbarProps {
  pageTitle: string;
  onAddTask: () => void;
  onOpenMobileMenu: () => void;
}

export function Navbar({ pageTitle, onAddTask, onOpenMobileMenu }: NavbarProps) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <h1 className="font-display text-lg sm:text-xl font-semibold text-slate-900 truncate">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <time
            dateTime={new Date().toISOString().slice(0, 10)}
            className="hidden sm:block text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap"
          >
            {formattedDate}
          </time>

          <PWAInstallButton compact />

          <button
            type="button"
            onClick={onAddTask}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Add Task</span>
          </button>
        </div>
      </div>
    </header>
  );
}
