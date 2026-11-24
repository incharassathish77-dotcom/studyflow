import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, Menu, Plus, Trash2 } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { AppNotification } from '../types/studyflow.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface NavbarProps {
  pageTitle: string;
  user: User;
  displayName: string;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string, isRead: boolean) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
  onAddTask: () => void;
  onOpenMobileMenu: () => void;
}

export function Navbar({
  pageTitle,
  user,
  displayName,
  notifications,
  onMarkNotificationRead,
  onMarkAllRead,
  onDeleteNotification,
  onAddTask,
  onOpenMobileMenu,
}: NavbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [notifOpen]);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    const ta = a.createdAt ? a.createdAt.getTime() : 0;
    const tb = b.createdAt ? b.createdAt.getTime() : 0;
    return tb - ta;
  });

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
            className="hidden md:block text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap"
          >
            {formattedDate}
          </time>

          <PWAInstallButton compact />

          {/* In-App Notification Center */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label={`Notifications (${unreadCount} unread)`}
              aria-expanded={notifOpen}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                role="dialog"
                aria-label="Notification Center"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Reminders</h2>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void onMarkAllRead()}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {sortedNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      No active reminders. Upcoming deadlines, exams, and scheduled sessions appear
                      here.
                    </div>
                  ) : (
                    sortedNotifications.map((item) => (
                      <div
                        key={item.id}
                        className={`px-4 py-3 flex items-start justify-between gap-3 ${
                          item.isRead ? 'bg-white' : 'bg-indigo-50/40'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                            <span className="capitalize text-indigo-700">{item.type}</span>
                            {item.dueDate && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">{item.dueDate}</span>
                              </>
                            )}
                          </div>
                          <p
                            className={`text-xs font-medium mt-0.5 ${
                              item.isRead ? 'text-slate-600' : 'text-slate-900'
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                            {item.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!item.isRead && (
                            <button
                              type="button"
                              onClick={() => void onMarkNotificationRead(item.id, true)}
                              title="Mark as read"
                              aria-label="Mark notification as read"
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void onDeleteNotification(item.id)}
                            title="Dismiss"
                            aria-label="Delete notification"
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center justify-center">
                {initials}
              </div>
            )}
          </div>

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
