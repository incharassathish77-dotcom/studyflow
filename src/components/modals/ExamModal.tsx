import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  STUDYFLOW_LIMITS,
  type Exam,
  type ExamFormValues,
  type ExamPrepStatus,
  type ExamType,
} from '../../types/studyflow.ts';
import { addDaysStr, getTodayStr } from '../../utils/dateUtils.ts';

interface ExamModalProps {
  isOpen: boolean;
  editingItem: Exam | null;
  subjects: string[];
  onClose: () => void;
  onSubmit: (values: ExamFormValues) => Promise<void>;
}

export function ExamModal({
  isOpen,
  editingItem,
  subjects,
  onClose,
  onSubmit,
}: ExamModalProps) {
  const [examName, setExamName] = useState('');
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('09:30');
  const [examType, setExamType] = useState<ExamType>('Midterm');
  const [preparationStatus, setPreparationStatus] = useState<ExamPrepStatus>('Not Started');
  const [importantTopics, setImportantTopics] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setExamName(editingItem.examName);
      setSubject(editingItem.subject);
      setExamDate(editingItem.examDate);
      setExamTime(editingItem.examTime);
      setExamType(editingItem.examType);
      setPreparationStatus(editingItem.preparationStatus);
      setImportantTopics(editingItem.importantTopics);
      setNotes(editingItem.notes);
    } else {
      setExamName('');
      setSubject(subjects[0] ?? 'Computer Science');
      setExamDate(addDaysStr(getTodayStr(), 10));
      setExamTime('09:30');
      setExamType('Midterm');
      setPreparationStatus('Not Started');
      setImportantTopics('');
      setNotes('');
    }
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, editingItem, subjects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!examName.trim()) {
      setError('Exam name is required.');
      return;
    }
    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }
    if (!examDate) {
      setError('Exam date is required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        examName: examName.trim(),
        subject: subject.trim(),
        examDate,
        examTime: examTime.trim(),
        examType,
        preparationStatus,
        importantTopics: importantTopics.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save exam.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="exam-modal-title" className="font-display text-lg font-semibold text-slate-900">
            {editingItem ? 'Edit Exam' : 'Add Examination'}
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
            <label htmlFor="ex-name" className="block text-sm font-medium text-slate-700 mb-1">
              Exam Name <span className="text-red-600">*</span>
            </label>
            <input
              id="ex-name"
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g., DBMS Midterm Assessment"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ex-subj" className="block text-sm font-medium text-slate-700 mb-1">
                Subject <span className="text-red-600">*</span>
              </label>
              <input
                id="ex-subj"
                list="ex-subjects-list"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
              <datalist id="ex-subjects-list">
                {subjects.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="ex-type" className="block text-sm font-medium text-slate-700 mb-1">
                Exam Type
              </label>
              <select
                id="ex-type"
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamType)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
              >
                {STUDYFLOW_LIMITS.EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="ex-date" className="block text-sm font-medium text-slate-700 mb-1">
                Exam Date <span className="text-red-600">*</span>
              </label>
              <input
                id="ex-date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="ex-time" className="block text-sm font-medium text-slate-700 mb-1">
                Exam Time
              </label>
              <input
                id="ex-time"
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="ex-prep" className="block text-sm font-medium text-slate-700 mb-1">
                Preparation
              </label>
              <select
                id="ex-prep"
                value={preparationStatus}
                onChange={(e) => setPreparationStatus(e.target.value as ExamPrepStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
              >
                {STUDYFLOW_LIMITS.EXAM_PREP_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ex-topics" className="block text-sm font-medium text-slate-700 mb-1">
              Important Topics
            </label>
            <textarea
              id="ex-topics"
              rows={2}
              value={importantTopics}
              onChange={(e) => setImportantTopics(e.target.value)}
              placeholder="e.g., BCNF, Transactions, Deadlock Prevention, Indexing"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="ex-notes" className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              id="ex-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Exam room, allowed calculator, past paper links..."
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
              {editingItem ? 'Save Exam' : 'Add Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
