import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  StickyNote,
  Table2,
  Target,
  Timer,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { NavSection } from '../types/studyflow.ts';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  user: User;
  displayName: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  badges: {
    tasks: number;
    assignments: number;
    exams: number;
  };
}

const NAV_ITEMS: {
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
  badgeKey?: 'tasks' | 'assignments' | 'exams';
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badgeKey: 'tasks' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'assignments', label: 'Assignments', icon: FileText, badgeKey: 'assignments' },
  { id: 'study-planner', label: 'Study Planner', icon: BookOpen },
  { id: 'exam-planner', label: 'Exam Planner', icon: GraduationCap, badgeKey: 'exams' },
  { id: 'timetable', label: 'Timetable', icon: Table2 },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'focus-timer', label: 'Focus Timer', icon: Timer },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  activeSection,
  onSelectSection,
  user,
  displayName,
  collapsed,
  onToggleCollapse,
  onLogout,
  isLoggingOut,
  isOpenMobile,
  onCloseMobile,
  badges,
}: SidebarProps) {
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
                  Academic Planner
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
        <nav aria-label="Main navigation" className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const count = item.badgeKey ? badges[item.badgeKey] : undefined;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={isCompact ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center ${
                  isCompact ? 'justify-center px-2' : 'justify-between px-3'
                } py-2 rounded-lg text-sm transition-colors cursor-pointer ${
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
                {!isCompact && typeof count === 'number' && count > 0 && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-slate-200 space-y-2 shrink-0">
          {!isCompact && (
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center justify-center shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{displayName}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user.email || (user.isAnonymous ? 'Guest Demo Mode' : 'Student Account')}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            title={isCompact ? 'Logout' : undefined}
            className={`w-full flex items-center ${
              isCompact ? 'justify-center px-2' : 'gap-3 px-3'
            } py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50 cursor-pointer`}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!isCompact && <span>{isLoggingOut ? 'Signing out...' : 'Logout'}</span>}
          </button>
        </div>
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
