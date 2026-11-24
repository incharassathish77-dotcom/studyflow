import { useMemo, useState, type FormEvent } from 'react';
import { Loader2, MapPin, Pencil, Plus, Trash2, User as UserIcon, X } from 'lucide-react';
import {
  STUDYFLOW_LIMITS,
  type DayOfWeek,
  type TimetableEntry,
  type TimetableFormValues,
} from '../types/studyflow.ts';
import { calcDurationMinutes, formatTime12h } from '../utils/dateUtils.ts';

interface TimetableViewProps {
  entries: TimetableEntry[];
  subjects: string[];
  onAdd: (values: TimetableFormValues) => Promise<void>;
  onEdit: (id: string, values: TimetableFormValues) => Promise<void>;
  onDelete: (entry: TimetableEntry) => void;
  onToast: (type: 'success' | 'error', message: string) => void;
}

export function TimetableView({
  entries,
  subjects,
  onAdd,
  onEdit,
  onDelete,
  onToast,
}: TimetableViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TimetableEntry | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [subject, setSubject] = useState('');
  const [faculty, setFaculty] = useState('');
  const [classroom, setClassroom] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const todayWeekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

  const grouped = useMemo(() => {
    const map = new Map<DayOfWeek, TimetableEntry[]>();
    STUDYFLOW_LIMITS.DAYS_OF_WEEK.forEach((d) => map.set(d, []));
    for (const item of entries) {
      const arr = map.get(item.dayOfWeek) ?? [];
      arr.push(item);
      map.set(item.dayOfWeek, arr);
    }
    for (const [day, list] of map.entries()) {
      map.set(
        day,
        [...list].sort((a, b) => a.startTime.localeCompare(b.startTime)),
      );
    }
    return map;
  }, [entries]);

  const openAdd = (defaultDay: DayOfWeek = 'Monday') => {
    setEditing(null);
    setDayOfWeek(defaultDay);
    setStartTime('09:00');
    setEndTime('10:00');
    setSubject(subjects[0] ?? 'Computer Science');
    setFaculty('');
    setClassroom('');
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (entry: TimetableEntry) => {
    setEditing(entry);
    setDayOfWeek(entry.dayOfWeek);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setSubject(entry.subject);
    setFaculty(entry.faculty);
    setClassroom(entry.classroom);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!subject.trim()) {
      setError('Subject name is required.');
      return;
    }
    if (calcDurationMinutes(startTime, endTime) <= 0) {
      setError('End time must be after start time.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const payload: TimetableFormValues = {
        dayOfWeek,
        startTime,
        endTime,
        subject: subject.trim(),
        faculty: faculty.trim(),
        classroom: classroom.trim(),
      };
      if (editing) {
        await onEdit(editing.id, payload);
        onToast('success', 'Class schedule updated.');
      } else {
        await onAdd(payload);
        onToast('success', 'Class added to timetable.');
      }
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save timetable entry.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Weekly College Timetable
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize your weekly classes from Monday through Sunday ({entries.length} classes scheduled)
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAdd('Monday')}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
        {STUDYFLOW_LIMITS.DAYS_OF_WEEK.map((day) => {
          const list = grouped.get(day) ?? [];
          const isToday = day === todayWeekday;

          return (
            <section
              key={day}
              className={`bg-white border rounded-xl p-3.5 flex flex-col min-h-[260px] ${
                isToday ? 'border-indigo-400 ring-1 ring-indigo-500/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                <div>
                  <h3 className={`text-sm font-semibold ${isToday ? 'text-indigo-700' : 'text-slate-900'}`}>
                    {day}
                  </h3>
                  {isToday && <span className="text-[11px] font-medium text-indigo-600">Today</span>}
                </div>
                <button
                  type="button"
                  onClick={() => openAdd(day)}
                  aria-label={`Add class on ${day}`}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {list.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400 text-center py-6">
                  No classes
                </div>
              ) : (
                <div className="space-y-2.5">
                  {list.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 space-y-1"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold text-slate-900 leading-snug">
                          {entry.subject}
                        </p>
                        <div className="flex items-center shrink-0">
                          <button
                            type="button"
                            onClick={() => openEdit(entry)}
                            aria-label={`Edit ${entry.subject}`}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(entry)}
                            aria-label={`Delete ${entry.subject}`}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] font-mono tabular-nums text-indigo-700 font-medium">
                        {formatTime12h(entry.startTime)} – {formatTime12h(entry.endTime)}
                      </p>
                      {entry.faculty && (
                        <p className="text-[11px] text-slate-600 flex items-center gap-1 truncate">
                          <UserIcon className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
                          <span className="truncate">{entry.faculty}</span>
                        </p>
                      )}
                      {entry.classroom && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
                          <span className="truncate">{entry.classroom}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-display text-base font-semibold text-slate-900">
                {editing ? 'Edit Class Entry' : 'Add Class to Timetable'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
                >
                  {STUDYFLOW_LIMITS.DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject Name <span className="text-red-600">*</span>
                </label>
                <input
                  list="tt-subjects"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <datalist id="tt-subjects">
                  {subjects.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Faculty (Optional)
                  </label>
                  <input
                    type="text"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    placeholder="Prof. Sharma"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Classroom (Optional)
                  </label>
                  <input
                    type="text"
                    value={classroom}
                    onChange={(e) => setClassroom(e.target.value)}
                    placeholder="Room 304 / Lab B"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60 cursor-pointer"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {editing ? 'Save Class' : 'Add Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
