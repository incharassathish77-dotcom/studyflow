import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Download,
  Flag,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { exportTasksCsv } from '../services/apiService.ts';
import {
  STUDYFLOW_LIMITS,
  type PriorityLevel,
  type Task,
  type TaskCategory,
  type TaskStatus,
} from '../types/studyflow.ts';
import { formatDisplayDate, formatTime12h, getTodayStr } from '../utils/dateUtils.ts';

interface TasksViewProps {
  tasks: Task[];
  loading: boolean;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onToast: (type: 'success' | 'error', message: string) => void;
}

const PRIORITY_WEIGHT: Record<PriorityLevel, number> = { High: 3, Medium: 2, Low: 1 };

export function TasksView({
  tasks,
  loading,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateStatus,
  onToast,
}: TasksViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TaskCategory>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'newest' | 'oldest' | 'priority'>('dueDate');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const today = getTodayStr();

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) {
          return false;
        }
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const ta = a.createdAt ? a.createdAt.getTime() : 0;
        const tb = b.createdAt ? b.createdAt.getTime() : 0;
        if (sortBy === 'newest') return tb - ta;
        if (sortBy === 'oldest') return ta - tb;
        if (sortBy === 'priority') return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        if (!a.dueDate && !b.dueDate) return tb - ta;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [tasks, search, categoryFilter, priorityFilter, statusFilter, sortBy]);

  const handleToggleComplete = async (task: Task) => {
    setBusyId(task.id);
    const nextStatus: TaskStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await onUpdateStatus(task.id, nextStatus);
      onToast('success', `Task marked as ${nextStatus}.`);
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Unable to update task status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleExport = async () => {
    if (isExporting || filteredTasks.length === 0) return;
    setIsExporting(true);
    try {
      await exportTasksCsv(filteredTasks);
      onToast('success', 'Tasks exported to CSV.');
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title or description..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || filteredTasks.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={onAddTask}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              New Task
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'all' | TaskCategory)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {STUDYFLOW_LIMITS.CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | PriorityLevel)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            {STUDYFLOW_LIMITS.PRIORITIES.map((p) => (
              <option key={p} value={p}>{p} Priority</option>
            ))}
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | TaskStatus)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            {STUDYFLOW_LIMITS.TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            aria-label="Sort tasks"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="dueDate">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-base font-semibold text-slate-900">No tasks found</p>
          <p className="mt-1 text-sm text-slate-500">
            {tasks.length === 0
              ? 'Create your first task to start organizing your academic schedule.'
              : 'Try adjusting your search or filter selections.'}
          </p>
          <button
            type="button"
            onClick={onAddTask}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Task
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'Completed';
            const isOverdue = Boolean(task.dueDate && task.dueDate < today && !isCompleted);

            return (
              <article
                key={task.id}
                className={`bg-white border rounded-xl p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  isCompleted ? 'border-slate-200/70 bg-slate-50/40' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <button
                    type="button"
                    disabled={busyId === task.id}
                    onClick={() => void handleToggleComplete(task)}
                    aria-label={isCompleted ? 'Mark task pending' : 'Mark task completed'}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 shrink-0 cursor-pointer"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                    ) : task.status === 'In Progress' ? (
                      <Clock className="h-5 w-5 text-amber-600" aria-hidden="true" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <h3
                      className={`text-base font-medium break-words ${
                        isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="mt-1 text-sm text-slate-600 break-words">{task.description}</p>
                    )}

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                      <span className="font-medium text-indigo-700">{task.category}</span>
                      {task.subject && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{task.subject}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          task.priority === 'High'
                            ? 'text-red-700'
                            : task.priority === 'Medium'
                              ? 'text-amber-700'
                              : 'text-slate-600'
                        }`}
                      >
                        <Flag className="h-3 w-3" aria-hidden="true" />
                        {task.priority}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-mono tabular-nums ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                        {task.dueDate
                          ? `${isOverdue ? 'Overdue: ' : 'Due '}${formatDisplayDate(task.dueDate)}${
                              task.dueTime ? ` at ${formatTime12h(task.dueTime)}` : ''
                            }`
                          : 'No due date'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className={isCompleted ? 'text-emerald-700 font-medium' : 'text-slate-600'}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditTask(task)}
                    aria-label={`Edit ${task.title}`}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTask(task)}
                    aria-label={`Delete ${task.title}`}
                    className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
