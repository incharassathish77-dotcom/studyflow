import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  STUDYFLOW_LIMITS,
  type Assignment,
  type AssignmentFormValues,
  type AssignmentStatus,
  type PriorityLevel,
} from '../../types/studyflow.ts';
import { addDaysStr, getTodayStr } from '../../utils/dateUtils.ts';

interface AssignmentModalProps {
  isOpen: boolean;
  editingItem: Assignment | null;
  subjects: string[];
  onClose: () => void;
  onSubmit: (values: AssignmentFormValues) => Promise<void>;
}

export function AssignmentModal({
  isOpen,
  editingItem,
  subjects,
  onClose,
  onSubmit,
}: AssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [assignedDate, setAssignedDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [status, setStatus] = useState<AssignmentStatus>('Not Started');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setTitle(editingItem.title);
      setSubject(editingItem.subject);
      setDescription(editingItem.description);
      setAssignedDate(editingItem.assignedDate);
      setDueDate(editingItem.dueDate);
      setPriority(editingItem.priority);
      setStatus(editingItem.status);
    } else {
      const today = getTodayStr();
      setTitle('');
      setSubject(subjects[0] ?? 'Computer Science');
      setDescription('');
      setAssignedDate(today);
      setDueDate(addDaysStr(today, 5));
      setPriority('High');
      setStatus('Not Started');
    }
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, editingItem, subjects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!title.trim()) {
      setError('Assignment title is required.');
      return;
    }
    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }
    if (!dueDate) {
      setError('Submission deadline is required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        assignedDate: assignedDate.trim(),
        dueDate: dueDate.trim(),
        priority,
        status,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assignment-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="assignment-modal-title" className="font-display text-lg font-semibold text-slate-900">
            {editingItem ? 'Edit Assignment' : 'Add Assignment'}
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
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="asg-title" className="block text-sm font-medium text-slate-700 mb-1">
              Assignment Title <span className="text-red-600">*</span>
            </label>
            <input
              id="asg-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Normalization & ER Diagram Report"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="asg-subject" className="block text-sm font-medium text-slate-700 mb-1">
              Subject <span className="text-red-600">*</span>
            </label>
            <input
              id="asg-subject"
              list="asg-subjects-list"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Database Systems"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
            />
            <datalist id="asg-subjects-list">
              {subjects.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="asg-desc" className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="asg-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Requirements, rubric notes, or submission link..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="asg-assigned" className="block text-sm font-medium text-slate-700 mb-1">
                Assigned Date
              </label>
              <input
                id="asg-assigned"
                type="date"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="asg-due" className="block text-sm font-medium text-slate-700 mb-1">
                Submission Deadline <span className="text-red-600">*</span>
              </label>
              <input
                id="asg-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="asg-prio" className="block text-sm font-medium text-slate-700 mb-1">
                Priority
              </label>
              <select
                id="asg-prio"
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
              <label htmlFor="asg-status" className="block text-sm font-medium text-slate-700 mb-1">
                Submission Status
              </label>
              <select
                id="asg-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
              >
                {STUDYFLOW_LIMITS.ASSIGNMENT_STATUSES.map((s) => (
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
              {editingItem ? 'Save Assignment' : 'Add Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
