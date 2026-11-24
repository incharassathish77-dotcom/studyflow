import { useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import type { StudySession, StudySessionFormValues } from '../types/studyflow.ts';
import { formatDisplayDate, formatTime12h, getTodayStr, getWeekStartDateStr } from '../utils/dateUtils.ts';

interface StudyPlannerViewProps {
  studySessions: StudySession[];
  subjects: string[];
  onAddSubject: (subjectName: string) => Promise<void>;
  onAddSession: () => void;
  onEditSession: (session: StudySession) => void;
  onDeleteSession: (session: StudySession) => void;
  onToggleComplete: (id: string, values: StudySessionFormValues) => Promise<void>;
  onToast: (type: 'success' | 'error', message: string) => void;
}

export function StudyPlannerView({
  studySessions,
  subjects,
  onAddSubject,
  onAddSession,
  onEditSession,
  onDeleteSession,
  onToggleComplete,
  onToast,
}: StudyPlannerViewProps) {
  const [newSubject, setNewSubject] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);

  const today = getTodayStr();
  const weekStart = getWeekStartDateStr(today);

  const metrics = useMemo(() => {
    const todaysSessions = studySessions
      .filter((s) => s.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const upcomingSessions = studySessions
      .filter((s) => s.date > today && s.status === 'Scheduled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

    const completedSessions = studySessions
      .filter((s) => s.status === 'Completed')
      .sort((a, b) => b.date.localeCompare(a.date));

    const weeklyHours =
      Math.round(
        (studySessions
          .filter((s) => s.status === 'Completed' && s.date >= weekStart && s.date <= today)
          .reduce((sum, s) => sum + s.durationMinutes, 0) /
          60) *
          10,
      ) / 10;

    const subjectBreakdown = new Map<string, number>();
    for (const s of studySessions) {
      if (s.status === 'Completed') {
        subjectBreakdown.set(s.subject, (subjectBreakdown.get(s.subject) ?? 0) + s.durationMinutes);
      }
    }

    return {
      todaysSessions,
      upcomingSessions,
      completedSessions,
      weeklyHours,
      subjectRows: Array.from(subjectBreakdown.entries())
        .map(([subject, mins]) => ({ subject, hours: Math.round((mins / 60) * 10) / 10 }))
        .sort((a, b) => b.hours - a.hours),
    };
  }, [studySessions, today, weekStart]);

  const handleCreateSubject = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newSubject.trim();
    if (!trimmed || addingSubject) return;
    if (subjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      onToast('error', 'That subject already exists.');
      return;
    }
    setAddingSubject(true);
    try {
      await onAddSubject(trimmed);
      setNewSubject('');
      onToast('success', `Subject "${trimmed}" added.`);
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Unable to add subject.');
    } finally {
      setAddingSubject(false);
    }
  };

  const handleMarkCompleted = async (s: StudySession) => {
    const nextStatus = s.status === 'Completed' ? 'Scheduled' : 'Completed';
    try {
      await onToggleComplete(s.id, {
        subject: s.subject,
        title: s.title,
        description: s.description,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: s.durationMinutes,
        studyGoal: s.studyGoal,
        status: nextStatus,
      });
      onToast('success', `Study session marked as ${nextStatus}.`);
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Unable to update session.');
    }
  };

  const renderSessionRow = (s: StudySession) => (
    <div
      key={s.id}
      className="border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4 bg-white"
    >
      <div className="flex items-start gap-3 min-w-0">
        <button
          type="button"
          onClick={() => void handleMarkCompleted(s)}
          aria-label={s.status === 'Completed' ? 'Mark scheduled' : 'Mark completed'}
          className="mt-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer shrink-0"
        >
          <CheckCircle2
            className={`h-5 w-5 ${s.status === 'Completed' ? 'text-emerald-600' : 'text-slate-300'}`}
            aria-hidden="true"
          />
        </button>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${s.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
            {s.title}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="font-medium text-indigo-700">{s.subject}</span> ·{' '}
            <span className="font-mono tabular-nums">
              {formatDisplayDate(s.date)} ({formatTime12h(s.startTime)}–{formatTime12h(s.endTime)})
            </span>{' '}
            · <span className="font-mono tabular-nums">{s.durationMinutes} min</span>
          </p>
          {s.studyGoal && <p className="text-xs text-slate-600 mt-1">Goal: {s.studyGoal}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onEditSession(s)}
          aria-label={`Edit ${s.title}`}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteSession(s)}
          aria-label={`Delete ${s.title}`}
          className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Bar: Summary + Add Subject + Schedule Session */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Weekly Study Hours</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-indigo-700">
              {metrics.weeklyHours} hrs
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {metrics.completedSessions.length} completed sessions total
            </p>
          </div>
          <button
            type="button"
            onClick={onAddSession}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Schedule Session
          </button>
        </div>

        <form
          onSubmit={handleCreateSubject}
          className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label htmlFor="new-subject-input" className="text-xs font-medium text-slate-700">
              Your Academic Subjects ({subjects.length})
            </label>
            <div className="flex items-center gap-2">
              <input
                id="new-subject-input"
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Add new subject (e.g., Computer Networks)"
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 w-60"
              />
              <button
                type="submit"
                disabled={addingSubject || !newSubject.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Add Subject
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {subjects.join(' · ')}
          </p>
        </form>
      </div>

      {/* Today's Study Schedule & Subject-wise Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Today&apos;s Study Schedule
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {metrics.todaysSessions.length} session(s)
            </span>
          </div>
          {metrics.todaysSessions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              No study sessions scheduled for today.
            </div>
          ) : (
            <div className="space-y-2.5">{metrics.todaysSessions.map(renderSessionRow)}</div>
          )}

          <h2 className="font-display text-base font-semibold text-slate-900 pt-3">
            Upcoming Study Sessions
          </h2>
          {metrics.upcomingSessions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              No upcoming sessions scheduled.
            </div>
          ) : (
            <div className="space-y-2.5">{metrics.upcomingSessions.map(renderSessionRow)}</div>
          )}
        </section>

        <section className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-display text-base font-semibold text-slate-900 mb-3">
              Subject-Wise Study Time
            </h2>
            {metrics.subjectRows.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                Complete a scheduled study session to see subject-wise hours.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {metrics.subjectRows.map((row) => (
                  <li key={row.subject} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 truncate pr-2">{row.subject}</span>
                    <span className="font-mono text-xs font-semibold tabular-nums text-indigo-700">
                      {row.hours} hrs
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h2 className="font-display text-base font-semibold text-slate-900">
                Completed Sessions
              </h2>
            </div>
            {metrics.completedSessions.length === 0 ? (
              <p className="text-xs text-slate-500">No completed sessions yet.</p>
            ) : (
              <div className="space-y-2">
                {metrics.completedSessions.slice(0, 5).map((s) => (
                  <div key={s.id} className="text-xs border-b border-slate-100 pb-2 last:border-b-0">
                    <p className="font-medium text-slate-800">{s.title}</p>
                    <p className="text-slate-500 font-mono tabular-nums">
                      {s.subject} · {formatDisplayDate(s.date)} · {s.durationMinutes}m
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
