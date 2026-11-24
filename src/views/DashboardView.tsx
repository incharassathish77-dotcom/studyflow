import { useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  Plus,
} from 'lucide-react';
import type { NavSection, Task, TaskFilterMode, TaskStatus } from '../types/studyflow.ts';
import {
  daysBetween,
  formatDisplayDate,
  formatTime12h,
  getTodayStr,
} from '../utils/dateUtils.ts';

interface DashboardViewProps {
  tasks: Task[];
  loading: boolean;
  onQuickAddTask: () => void;
  onViewTask: (task: Task) => void;
  onToggleTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onNavigate: (section: NavSection, filter?: TaskFilterMode) => void;
}

export function DashboardView({
  tasks,
  loading,
  onQuickAddTask,
  onViewTask,
  onToggleTaskStatus,
  onNavigate,
}: DashboardViewProps) {
  const today = getTodayStr();

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'Completed').length;
    const upcomingDeadlines = tasks.filter(
      (t) => t.status !== 'Completed' && Boolean(t.dueDate) && t.dueDate >= today,
    ).length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      upcomingDeadlines,
      completionRate,
    };
  }, [tasks, today]);

  const upcomingDeadlinesList = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'Completed' && Boolean(t.dueDate))
      .sort((a, b) => {
        const dateCmp = a.dueDate.localeCompare(b.dueDate);
        if (dateCmp !== 0) return dateCmp;
        return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
      })
      .slice(0, 6);
  }, [tasks]);

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => {
        const ta = a.updatedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
        const tb = b.updatedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
        return tb - ta;
      })
      .slice(0, 6);
  }, [tasks]);

  const summaryCards: {
    label: string;
    value: number;
    section: NavSection;
    filter?: TaskFilterMode;
    color: string;
  }[] = [
    { label: 'Total Tasks', value: stats.totalTasks, section: 'tasks', filter: 'all', color: 'text-slate-900' },
    { label: 'Completed Tasks', value: stats.completedTasks, section: 'tasks', filter: 'Completed', color: 'text-emerald-700' },
    { label: 'Pending Tasks', value: stats.pendingTasks, section: 'tasks', filter: 'Pending', color: 'text-indigo-700' },
    { label: 'Upcoming Deadlines', value: stats.upcomingDeadlines, section: 'calendar', color: 'text-amber-700' },
  ];

  const priorityAccent = (priority: Task['priority']) => {
    if (priority === 'High') return 'text-red-700';
    if (priority === 'Medium') return 'text-amber-700';
    return 'text-sky-700';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Add */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 text-balance">
            Welcome to STUDYFLOW
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Organize your coursework, track deadlines, and stay on top of every task.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            Open Calendar
          </button>
          <button
            type="button"
            onClick={onQuickAddTask}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Quick Add Task
          </button>
        </div>
      </section>

      {/* 4 Summary Metric Cards */}
      <section aria-label="Task summary metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => onNavigate(card.section, card.filter)}
            className="text-left bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-5 transition-colors cursor-pointer"
          >
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            {loading ? (
              <div className="mt-2 h-8 w-14 bg-slate-100 rounded animate-pulse" />
            ) : (
              <p className={`mt-1.5 font-mono text-3xl font-semibold tabular-nums ${card.color}`}>
                {card.value}
              </p>
            )}
          </button>
        ))}
      </section>

      {/* Overall Task Progress */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Overall Completion Progress
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {stats.completedTasks} of {stats.totalTasks} task{stats.totalTasks === 1 ? '' : 's'} completed
            </p>
          </div>
          <span className="font-mono text-base font-semibold tabular-nums text-indigo-700">
            {stats.completionRate}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-200"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </section>

      {/* Upcoming Deadlines & Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Upcoming Deadlines
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              View Calendar
            </button>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : upcomingDeadlinesList.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No upcoming deadlines. Add a task with a due date to track it here.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingDeadlinesList.map((task) => {
                const daysLeft = daysBetween(today, task.dueDate);
                const isOverdue = daysLeft < 0;
                const dueLabel = isOverdue
                  ? `Overdue by ${Math.abs(daysLeft)}d`
                  : daysLeft === 0
                    ? 'Due today'
                    : daysLeft === 1
                      ? 'Tomorrow'
                      : `In ${daysLeft}d`;

                return (
                  <li key={task.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => void onToggleTaskStatus(task.id, 'Completed')}
                        aria-label={`Mark "${task.title}" completed`}
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 shrink-0 cursor-pointer"
                      >
                        {task.status === 'In Progress' ? (
                          <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />
                        ) : (
                          <Circle className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewTask(task)}
                        className="text-left min-w-0 flex-1 cursor-pointer group"
                      >
                        <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-700 truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span>{task.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`inline-flex items-center gap-1 font-medium ${priorityAccent(task.priority)}`}>
                            <Flag className="h-3 w-3" aria-hidden="true" />
                            {task.priority}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {formatDisplayDate(task.dueDate)}
                            {task.dueTime ? ` ${formatTime12h(task.dueTime)}` : ''}
                          </span>
                        </p>
                      </button>
                    </div>

                    <span
                      className={`text-xs font-mono tabular-nums font-medium whitespace-nowrap shrink-0 ${
                        isOverdue ? 'text-red-600' : daysLeft <= 1 ? 'text-amber-700' : 'text-slate-600'
                      }`}
                    >
                      {dueLabel}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-slate-900">Recent Tasks</h3>
            <button
              type="button"
              onClick={() => onNavigate('tasks', 'all')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              View All Tasks
            </button>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No tasks yet. Click &ldquo;Quick Add Task&rdquo; to create your first task.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentTasks.map((task) => {
                const isCompleted = task.status === 'Completed';
                return (
                  <li key={task.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() =>
                          void onToggleTaskStatus(task.id, isCompleted ? 'Pending' : 'Completed')
                        }
                        aria-label={isCompleted ? `Mark "${task.title}" pending` : `Mark "${task.title}" completed`}
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 shrink-0 cursor-pointer"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                        ) : task.status === 'In Progress' ? (
                          <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />
                        ) : (
                          <Circle className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewTask(task)}
                        className="text-left min-w-0 flex-1 cursor-pointer group"
                      >
                        <p
                          className={`text-sm font-medium truncate ${
                            isCompleted
                              ? 'line-through text-slate-500'
                              : 'text-slate-900 group-hover:text-indigo-700'
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span>{task.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`font-medium ${priorityAccent(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {formatDisplayDate(task.dueDate)}
                              </span>
                            </>
                          )}
                        </p>
                      </button>
                    </div>

                    <span
                      className={`text-xs font-medium whitespace-nowrap shrink-0 ${
                        isCompleted
                          ? 'text-emerald-700'
                          : task.status === 'In Progress'
                            ? 'text-amber-700'
                            : 'text-slate-500'
                      }`}
                    >
                      {task.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
