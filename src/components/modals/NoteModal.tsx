import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Pin, X } from 'lucide-react';
import type { Note, NoteFormValues } from '../../types/studyflow.ts';

interface NoteModalProps {
  isOpen: boolean;
  editingItem: Note | null;
  subjects: string[];
  onClose: () => void;
  onSubmit: (values: NoteFormValues) => Promise<void>;
}

export function NoteModal({
  isOpen,
  editingItem,
  subjects,
  onClose,
  onSubmit,
}: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setTitle(editingItem.title);
      setSubject(editingItem.subject);
      setContent(editingItem.content);
      setIsPinned(editingItem.isPinned);
    } else {
      setTitle('');
      setSubject(subjects[0] ?? 'Computer Science');
      setContent('');
      setIsPinned(false);
    }
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, editingItem, subjects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!title.trim()) {
      setError('Note title is required.');
      return;
    }
    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }
    if (!content.trim()) {
      setError('Note content cannot be empty.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        subject: subject.trim(),
        content: content.trim(),
        isPinned,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
    >
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="note-modal-title" className="font-display text-lg font-semibold text-slate-900">
            {editingItem ? 'Edit Note' : 'Create Study Note'}
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
            <label htmlFor="nt-title" className="block text-sm font-medium text-slate-700 mb-1">
              Note Title <span className="text-red-600">*</span>
            </label>
            <input
              id="nt-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Dijkstra vs Bellman-Ford Complexity Notes"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label htmlFor="nt-subject" className="block text-sm font-medium text-slate-700 mb-1">
                Subject <span className="text-red-600">*</span>
              </label>
              <input
                id="nt-subject"
                list="nt-subjects-list"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
              <datalist id="nt-subjects-list">
                {subjects.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <button
              type="button"
              onClick={() => setIsPinned((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                isPinned
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Pin className="h-4 w-4" aria-hidden="true" />
              <span>{isPinned ? 'Pinned Note' : 'Pin Note'}</span>
            </button>
          </div>

          <div>
            <label htmlFor="nt-content" className="block text-sm font-medium text-slate-700 mb-1">
              Content <span className="text-red-600">*</span>
            </label>
            <textarea
              id="nt-content"
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write lecture takeaways, key formulas, code snippets, or exam revision summaries..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 leading-relaxed"
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
              {editingItem ? 'Save Note' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
