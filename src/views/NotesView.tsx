import { useMemo, useState } from 'react';
import { Pencil, Pin, Plus, Search, Trash2 } from 'lucide-react';
import type { Note } from '../types/studyflow.ts';

interface NotesViewProps {
  notes: Note[];
  subjects: string[];
  onAddNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onTogglePin: (id: string, isPinned: boolean) => Promise<void>;
  onToast: (type: 'success' | 'error', message: string) => void;
}

export function NotesView({
  notes,
  subjects,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onTogglePin,
  onToast,
}: NotesViewProps) {
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const availableSubjects = useMemo(() => {
    const set = new Set<string>(subjects);
    notes.forEach((n) => set.add(n.subject));
    return Array.from(set);
  }, [subjects, notes]);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes
      .filter((n) => {
        if (
          q &&
          !n.title.toLowerCase().includes(q) &&
          !n.content.toLowerCase().includes(q) &&
          !n.subject.toLowerCase().includes(q)
        ) {
          return false;
        }
        if (subjectFilter !== 'all' && n.subject !== subjectFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        const ta = a.updatedAt ? a.updatedAt.getTime() : 0;
        const tb = b.updatedAt ? b.updatedAt.getTime() : 0;
        return tb - ta;
      });
  }, [notes, search, subjectFilter]);

  const handlePin = async (note: Note) => {
    try {
      await onTogglePin(note.id, !note.isPinned);
      onToast('success', note.isPinned ? 'Note unpinned.' : 'Note pinned to top.');
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Unable to update pin state.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes by title, content, or subject..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <select
            aria-label="Filter notes by subject"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onAddNote}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New Note
        </button>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-base font-semibold text-slate-900">No study notes found</p>
          <p className="mt-1 text-sm text-slate-500">
            Capture lecture summaries, formulas, and revision notes organized by subject.
          </p>
          <button
            type="button"
            onClick={onAddNote}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <article
              key={note.id}
              className={`bg-white border rounded-xl p-5 flex flex-col justify-between gap-4 ${
                note.isPinned ? 'border-indigo-300 bg-indigo-50/15' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-indigo-700">{note.subject}</span>
                    <h3 className="font-display text-base font-semibold text-slate-900 mt-0.5 break-words">
                      {note.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handlePin(note)}
                      aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
                      title={note.isPinned ? 'Unpin' : 'Pin to top'}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        note.isPinned
                          ? 'text-indigo-600 bg-indigo-50'
                          : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                      }`}
                    >
                      <Pin className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditNote(note)}
                      aria-label={`Edit ${note.title}`}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note)}
                      aria-label={`Delete ${note.title}`}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-600 whitespace-pre-line line-clamp-6 leading-relaxed">
                  {note.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                <span>{note.isPinned ? 'Pinned' : 'Note'}</span>
                <span>
                  {note.updatedAt
                    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
                        note.updatedAt,
                      )
                    : 'Just now'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
