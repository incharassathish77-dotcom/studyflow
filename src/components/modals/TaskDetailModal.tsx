import { useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  FolderOpen,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import type { Task, TaskStatus } from '../../types/studyflow.ts';
import { formatDisplayDate, formatTime12h, getTodayStr } from '../../utils/dateUtils.ts';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleStatus: (taskId: string, status: TaskStatus) => Promise<void>;
}

export function TaskDetailModal({
  task,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus,
}: TaskDetailModalProps) {
  useEffect(() => {
    if (!task) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, onClose]);

  if (!task) return null;

  const today = getTodayStr();
  const isCompleted = task.status === 'Completed';
  const isOverdue = Boolean(task.dueDate && task.dueDate < today && !isCompleted);

  const priorityColor =
    task.priority === 'High'
      ? 'text-red-700'
      : task.priority === 'Medium'
        ? 'text-amber-700'
        : 'text-sky-700';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-heading"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 font-medium text-indigo-700">
                <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
                {task.category}
              </span>
              <span aria-hidden="true">·</span>
              <span className={`inline-flex items-center gap-1 font-medium ${priorityColor}`}>
                <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                {task.priority} Priority
              </span>
            </div>
            <h2
              id="task-detail-heading"
              className={`font-display text-lg font-semibold mt-1 break-words ${
                isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
              }`}
            >
              {task.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close task details"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-3.5 py-2.5">
              <p className="text-xs font-medium text-slate-500">Status</p>
              <p className="mt-1 inline-flex items-center gap-1.5 font-medium text-slate-900">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                ) : task.status === 'In Progress' ? (
                  <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400" aria-hidden="true" />
                )}
                {task.status}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-3.5 py-2.5">
              <p className="text-xs font-medium text-slate-500">Due Schedule</p>
              <p
                className={`mt-1 inline-flex items-center gap-1.5 font-mono text-xs tabular-nums ${
                  isOverdue ? 'text-red-600 font-semibold' : 'text-slate-900'
                }`}
              >
                <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {task.dueDate
                  ? `${isOverdue ? 'Overdue: ' : ''}${formatDisplayDate(task.dueDate)}${
                      task.dueTime ? ` · ${formatTime12h(task.dueTime)}` : ''
                    }`
                  : 'No due date'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Description</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[72px]">
              {task.description || 'No description provided for this task.'}
            </div>
          </div>

          {task.createdAt && (
            <p className="text-xs text-slate-400 font-mono tabular-nums">
              Created {task.createdAt.toLocaleDateString()}
              {task.updatedAt ? ` · Updated ${task.updatedAt.toLocaleDateString()}` : ''}
            </p>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              const nextStatus: TaskStatus = isCompleted ? 'Pending' : 'Completed';
              void onToggleStatus(task.id, nextStatus);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(task);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
