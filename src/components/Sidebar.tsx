import {
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  X,
} from 'lucide-react';
import type { NavSection } from '../types/studyflow.ts';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingTaskCount: number;
}

const NAV_ITEMS: {
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
  showCount?: boolean;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'My Tasks', icon: CheckSquare, showCount: true },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
];

export function Sidebar({
  activeSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
  pendingTaskCount,
}: SidebarProps) {
  const handleNavClick = (section: NavSection) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const renderSidebarInner = (isMobileDrawer: boolean) => {
    const isCompact = !isMobileDrawer && collapsed;
    return (
      <div
        className={`flex h-full flex-col bg-white border-r border-slate-200 transition-all duration-150 ${
          isCompact ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Logo & Collapse Button */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            {!isCompact && (
              <div className="min-w-0">
                <span className="font-display text-base font-bold tracking-tight text-slate-900 block leading-none">
                  STUDYFLOW
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
                  Student Task Manager
                </span>
              </div>
            )}
          </div>

          {isMobileDrawer ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav aria-label="Main navigation" className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={isCompact ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center ${
                  isCompact ? 'justify-center px-2' : 'justify-between px-3'
                } py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  {!isCompact && <span className="truncate">{item.label}</span>}
                </span>
                {!isCompact && item.showCount && pendingTaskCount > 0 && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  >
                    {pendingTaskCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {!isCompact && (
          <div className="px-4 py-3 border-t border-slate-100 text-[11px] text-slate-400">
            Plan Smarter. Study Better.
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen">
        {renderSidebarInner(false)}
      </aside>

      {isOpenMobile && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 flex h-full">{renderSidebarInner(true)}</aside>
        </div>
      )}
    </>
  );
}
