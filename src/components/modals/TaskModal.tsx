import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  STUDYFLOW_LIMITS,
  type PriorityLevel,
  type Task,
  type TaskCategory,
  type TaskFormValues,
  type TaskStatus,
} from '../../types/studyflow.ts';
import { getTodayStr } from '../../utils/dateUtils.ts';

interface TaskModalProps {
  isOpen: boolean;
  editingTask: Task | null;
  subjects: string[];
  defaultDate?: string;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}

export function TaskModal({
  isOpen,
  editingTask,
  subjects,
  defaultDate,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Academic');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setCategory(editingTask.category);
      setSubject(editingTask.subject);
      setDueDate(editingTask.dueDate);
      setDueTime(editingTask.dueTime);
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Academic');
      setSubject(subjects[0] ?? '');
      setDueDate(defaultDate ?? getTodayStr());
      setDueTime('');
      setPriority('Medium');
      setStatus('Pending');
    }
    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
  }, [isOpen, editingTask, subjects, defaultDate]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Task title is required.';
    else if (title.trim().length > STUDYFLOW_LIMITS.TITLE_MAX) {
      errors.title = `Max ${STUDYFLOW_LIMITS.TITLE_MAX} characters.`;
    }
    if (description.trim().length > STUDYFLOW_LIMITS.DESCRIPTION_MAX) {
      errors.description = `Max ${STUDYFLOW_LIMITS.DESCRIPTION_MAX} characters.`;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validate()) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        subject: subject.trim(),
        dueDate: dueDate.trim(),
        dueTime: dueTime.trim(),
        priority,
        status,
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-heading"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 id="task-modal-heading" className="font-display text-lg font-semibold text-slate-900">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 overflow-y-auto">
          {submitError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div>
            <label htmlFor="sf-task-title" className="block text-sm font-medium text-slate-700 mb-1">
              Task Title <span className="text-red-600">*</span>
            </label>
            <input
              id="sf-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Implement B+ Tree Indexing Lab"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
              autoFocus
            />
            {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
          </div>

          <div>
            <label htmlFor="sf-task-desc" className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="sf-task-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes, subtasks, or deliverables..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sf-task-cat" className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                id="sf-task-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
              >
                {STUDYFLOW_LIMITS.CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sf-task-subj" className="block text-sm font-medium text-slate-700 mb-1">
                Subject
              </label>
              <input
                id="sf-task-subj"
                list="studyflow-subjects-list"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Select or type subject"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
              <datalist id="studyflow-subjects-list">
                {subjects.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sf-task-date" className="block text-sm font-medium text-slate-700 mb-1">
                Due Date
              </label>
              <input
                id="sf-task-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="sf-task-time" className="block text-sm font-medium text-slate-700 mb-1">
                Due Time
              </label>
              <input
                id="sf-task-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sf-task-prio" className="block text-sm font-medium text-slate-700 mb-1">
                Priority
              </label>
              <select
                id="sf-task-prio"
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
              >
                {STUDYFLOW_LIMITS.PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sf-task-status" className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                id="sf-task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
              >
                {STUDYFLOW_LIMITS.TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
