import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  STUDYFLOW_LIMITS,
  type StudySession,
  type StudySessionFormValues,
  type StudySessionStatus,
} from '../../types/studyflow.ts';
import { calcDurationMinutes, getTodayStr } from '../../utils/dateUtils.ts';

interface StudySessionModalProps {
  isOpen: boolean;
  editingItem: StudySession | null;
  subjects: string[];
  defaultDate?: string;
  onClose: () => void;
  onSubmit: (values: StudySessionFormValues) => Promise<void>;
}

export function StudySessionModal({
  isOpen,
  editingItem,
  subjects,
  defaultDate,
  onClose,
  onSubmit,
}: StudySessionModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:30');
  const [studyGoal, setStudyGoal] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<StudySessionStatus>('Scheduled');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setTitle(editingItem.title);
      setSubject(editingItem.subject);
      setDate(editingItem.date);
      setStartTime(editingItem.startTime);
      setEndTime(editingItem.endTime);
      setStudyGoal(editingItem.studyGoal);
      setDescription(editingItem.description);
      setStatus(editingItem.status);
    } else {
      setTitle('');
      setSubject(subjects[0] ?? 'Computer Science');
      setDate(defaultDate ?? getTodayStr());
      setStartTime('16:00');
      setEndTime('17:30');
      setStudyGoal('');
      setDescription('');
      setStatus('Scheduled');
    }
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, editingItem, subjects, defaultDate]);

  if (!isOpen) return null;

  const durationMinutes = calcDurationMinutes(startTime, endTime);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!title.trim()) {
      setError('Session title is required.');
      return;
    }
    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }
    if (!date) {
      setError('Study date is required.');
      return;
    }
    if (durationMinutes <= 0 || durationMinutes > 720) {
      setError('End time must be after start time (max 12 hours).');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        subject: subject.trim(),
        date,
        startTime,
        endTime,
        durationMinutes,
        studyGoal: studyGoal.trim(),
        description: description.trim(),
        status,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save study session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="study-modal-title" className="font-display text-lg font-semibold text-slate-900">
            {editingItem ? 'Edit Study Session' : 'Schedule Study Session'}
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
            <label htmlFor="st-title" className="block text-sm font-medium text-slate-700 mb-1">
              Session Title <span className="text-red-600">*</span>
            </label>
            <input
              id="st-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Practice SQL Joins & Normalization"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="st-subject" className="block text-sm font-medium text-slate-700 mb-1">
                Subject <span className="text-red-600">*</span>
              </label>
              <input
                id="st-subject"
                list="st-subjects-list"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
              <datalist id="st-subjects-list">
                {subjects.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="st-date" className="block text-sm font-medium text-slate-700 mb-1">
                Study Date <span className="text-red-600">*</span>
              </label>
              <input
                id="st-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="st-start" className="block text-sm font-medium text-slate-700 mb-1">
                Start Time
              </label>
              <input
                id="st-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="st-end" className="block text-sm font-medium text-slate-700 mb-1">
                End Time
              </label>
              <input
                id="st-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="st-status" className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                id="st-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StudySessionStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
              >
                {STUDYFLOW_LIMITS.STUDY_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs font-mono tabular-nums text-slate-500">
            Calculated duration: {durationMinutes > 0 ? `${durationMinutes} minutes` : 'Invalid time range'}
          </p>

          <div>
            <label htmlFor="st-goal" className="block text-sm font-medium text-slate-700 mb-1">
              Study Goal
            </label>
            <input
              id="st-goal"
              type="text"
              value={studyGoal}
              onChange={(e) => setStudyGoal(e.target.value)}
              placeholder="e.g., Solve 10 practice queries & review Chapter 4"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="st-desc" className="block text-sm font-medium text-slate-700 mb-1">
              Session Description
            </label>
            <textarea
              id="st-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Resources, textbook chapters, or key focus points..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
            />
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
              {editingItem ? 'Save Session' : 'Schedule Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
