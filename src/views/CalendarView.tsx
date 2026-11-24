import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Eye,
  Flag,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type { PriorityLevel, Task, TaskStatus } from '../types/studyflow.ts';
import {
  formatDateStr,
  formatDisplayDate,
  formatTime12h,
  getTodayStr,
  parseLocalDate,
} from '../utils/dateUtils.ts';

interface CalendarViewProps {
  tasks: Task[];
  onAddTaskForDate: (dateStr: string) => void;
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onToast: (type: 'success' | 'error', message: string) => void;
}

const PRIORITY_CHIP_STYLES: Record<PriorityLevel, string> = {
  High: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100',
  Medium: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
  Low: 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100',
};

const PRIORITY_DOT_STYLES: Record<PriorityLevel, string> = {
  High: 'bg-red-500',
  Medium: 'bg-amber-500',
  Low: 'bg-sky-500',
};

export function CalendarView({
  tasks,
  onAddTaskForDate,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskStatus,
  onToast,
}: CalendarViewProps) {
  const today = getTodayStr();
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = parseLocalDate(today);
    return formatDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [selectedDate, setSelectedDate] = useState(today);
  const [busyId, setBusyId] = useState<string | null>(null);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const arr = map.get(task.dueDate) ?? [];
      arr.push(task);
      map.set(task.dueDate, arr);
    }
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => {
        if ((a.status === 'Completed') !== (b.status === 'Completed')) {
          return a.status === 'Completed' ? 1 : -1;
        }
        return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
      });
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const monthGridDays = useMemo(() => {
    const ref = parseLocalDate(monthCursor);
    const firstOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - startOffset);

    const days: { dateStr: string; dayNum: number; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push({
        dateStr: formatDateStr(d),
        dayNum: d.getDate(),
        inMonth: d.getMonth() === ref.getMonth(),
      });
    }
    return days;
  }, [monthCursor]);

  const headerLabel = useMemo(() => {
    const d = parseLocalDate(monthCursor);
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d);
  }, [monthCursor]);

  const selectedDateTasks = tasksByDate.get(selectedDate) ?? [];

  const handleStepMonth = (delta: -1 | 1) => {
    const d = parseLocalDate(monthCursor);
    const next = new Date(d.getFullYear(), d.getMonth() + delta, 1);
    setMonthCursor(formatDateStr(next));
  };

  const handleGoToday = () => {
    const now = parseLocalDate(today);
    setMonthCursor(formatDateStr(new Date(now.getFullYear(), now.getMonth(), 1)));
    setSelectedDate(today);
  };

  const handleToggle = async (task: Task) => {
    setBusyId(task.id);
    const nextStatus: TaskStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await onToggleTaskStatus(task.id, nextStatus);
      onToast('success', `Task marked as ${nextStatus}.`);
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Unable to update task status.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Month Navigation & Priority Legend */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => handleStepMonth(-1)}
              aria-label="Previous month"
              className="p-2 hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleGoToday}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 border-x border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleStepMonth(1)}
              aria-label="Next month"
              className="p-2 hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <h2 className="font-display text-base sm:text-lg font-semibold text-slate-900">
            {headerLabel}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            {(['High', 'Medium', 'Low'] as PriorityLevel[]).map((prio) => (
              <span key={prio} className="inline-flex items-center gap-1.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${PRIORITY_DOT_STYLES[prio]}`}
                  aria-hidden="true"
                />
                <span>{prio}</span>
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onAddTaskForDate(selectedDate)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add Task
          </button>
        </div>
      </div>

      {/* Monthly Grid + Selected Date Side Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-600">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
            {monthGridDays.map((cell) => {
              const dayTasks = tasksByDate.get(cell.dateStr) ?? [];
              const isToday = cell.dateStr === today;
              const isSelected = cell.dateStr === selectedDate;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`min-h-[104px] p-1.5 sm:p-2 flex flex-col transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/50 ring-1 ring-inset ring-indigo-400'
                      : cell.inMonth
                        ? 'bg-white hover:bg-slate-50/70'
                        : 'bg-slate-50/60 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`h-6 w-6 rounded-full text-xs font-mono tabular-nums flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white font-semibold'
                          : isSelected
                            ? 'bg-indigo-100 text-indigo-800 font-semibold'
                            : cell.inMonth
                              ? 'text-slate-700'
                              : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(cell.dateStr);
                        onAddTaskForDate(cell.dateStr);
                      }}
                      title={`Add task on ${cell.dateStr}`}
                      aria-label={`Add task on ${cell.dateStr}`}
                      className="p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-100/70 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => {
                      const isDone = task.status === 'Completed';
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(cell.dateStr);
                            onViewTask(task);
                          }}
                          className={`w-full text-left px-1.5 py-0.5 rounded border text-[11px] font-medium truncate transition-colors cursor-pointer ${
                            PRIORITY_CHIP_STYLES[task.priority]
                          } ${isDone ? 'opacity-60 line-through' : ''}`}
                        >
                          {task.title}
                        </button>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <span className="block text-[11px] font-medium text-indigo-600 pl-1">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Agenda Panel */}
        <aside
          aria-label="Selected date scheduled tasks"
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <p className="text-xs font-medium text-indigo-600">
                {selectedDate === today ? 'Today' : 'Selected Date'}
              </p>
              <h3 className="font-display text-base font-semibold text-slate-900 mt-0.5">
                {formatDisplayDate(selectedDate)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {selectedDateTasks.length} scheduled task{selectedDateTasks.length === 1 ? '' : 's'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onAddTaskForDate(selectedDate)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add Task
            </button>
          </div>

          {selectedDateTasks.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">No tasks scheduled for this date.</p>
              <button
                type="button"
                onClick={() => onAddTaskForDate(selectedDate)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Schedule a Task
              </button>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {selectedDateTasks.map((task) => {
                const isDone = task.status === 'Completed';
                return (
                  <li
                    key={task.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      isDone ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          disabled={busyId === task.id}
                          onClick={() => void handleToggle(task)}
                          aria-label={isDone ? `Mark "${task.title}" pending` : `Mark "${task.title}" completed`}
                          className="mt-0.5 text-slate-400 hover:text-indigo-600 shrink-0 cursor-pointer"
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                          ) : task.status === 'In Progress' ? (
                            <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />
                          ) : (
                            <Circle className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onViewTask(task)}
                            className="text-left max-w-full cursor-pointer"
                          >
                            <p
                              className={`text-sm font-medium break-words hover:text-indigo-700 ${
                                isDone ? 'line-through text-slate-500' : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </p>
                          </button>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                task.priority === 'High'
                                  ? 'text-red-700'
                                  : task.priority === 'Medium'
                                    ? 'text-amber-700'
                                    : 'text-sky-700'
                              }`}
                            >
                              <Flag className="h-2.5 w-2.5" aria-hidden="true" />
                              {task.priority}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{task.category}</span>
                            {task.dueTime && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">
                                  {formatTime12h(task.dueTime)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewTask(task)}
                        aria-label={`View ${task.title}`}
                        className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        aria-label={`Edit ${task.title}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task)}
                        aria-label={`Delete ${task.title}`}
                        className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
