import { useMemo, useState, type FormEvent } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  STUDYFLOW_LIMITS,
  type Assignment,
  type CalendarEvent,
  type CalendarEventFormValues,
  type CalendarEventType,
  type Exam,
  type StudySession,
  type Task,
} from '../types/studyflow.ts';
import {
  addDaysStr,
  formatDateStr,
  formatDisplayDate,
  formatTime12h,
  getTodayStr,
  getWeekStartDateStr,
  parseLocalDate,
} from '../utils/dateUtils.ts';

interface CalendarViewProps {
  tasks: Task[];
  assignments: Assignment[];
  exams: Exam[];
  studySessions: StudySession[];
  calendarEvents: CalendarEvent[];
  onAddCalendarEvent: (values: CalendarEventFormValues) => Promise<void>;
  onEditCalendarEvent: (id: string, values: CalendarEventFormValues) => Promise<void>;
  onDeleteCalendarEvent: (id: string) => Promise<void>;
  onToast: (type: 'success' | 'error', message: string) => void;
}

type CalendarMode = 'month' | 'week' | 'day';

interface UnifiedEvent {
  id: string;
  source: 'calendarEvent' | 'task' | 'assignment' | 'exam' | 'studySession';
  title: string;
  description: string;
  date: string;
  timeLabel: string;
  type: CalendarEventType;
  badgeStyle: string;
  dotStyle: string;
  rawCalendarEvent?: CalendarEvent;
}

const EVENT_COLORS: Record<CalendarEventType, { badge: string; dot: string }> = {
  Task: { badge: 'bg-indigo-50 text-indigo-800 border-indigo-200', dot: 'bg-indigo-600' },
  Assignment: { badge: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-600' },
  Exam: { badge: 'bg-red-50 text-red-800 border-red-200', dot: 'bg-red-600' },
  'Study Session': { badge: 'bg-violet-50 text-violet-800 border-violet-200', dot: 'bg-violet-600' },
  'Personal Event': { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-600' },
};

export function CalendarView({
  tasks,
  assignments,
  exams,
  studySessions,
  calendarEvents,
  onAddCalendarEvent,
  onEditCalendarEvent,
  onDeleteCalendarEvent,
  onToast,
}: CalendarViewProps) {
  const today = getTodayStr();
  const [mode, setMode] = useState<CalendarMode>('month');
  const [cursorDate, setCursorDate] = useState(today);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCalEvent, setEditingCalEvent] = useState<CalendarEvent | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDate, setFormDate] = useState(today);
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formType, setFormType] = useState<CalendarEventType>('Personal Event');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const allEvents = useMemo(() => {
    const list: UnifiedEvent[] = [];

    for (const t of tasks) {
      if (!t.dueDate) continue;
      list.push({
        id: `t-${t.id}`,
        source: 'task',
        title: t.title,
        description: `${t.category}${t.subject ? ` · ${t.subject}` : ''} · Priority: ${t.priority} · Status: ${t.status}${t.description ? `\n${t.description}` : ''}`,
        date: t.dueDate,
        timeLabel: t.dueTime ? formatTime12h(t.dueTime) : 'Task Due',
        type: 'Task',
        badgeStyle: EVENT_COLORS.Task.badge,
        dotStyle: EVENT_COLORS.Task.dot,
      });
    }

    for (const a of assignments) {
      list.push({
        id: `a-${a.id}`,
        source: 'assignment',
        title: a.title,
        description: `Subject: ${a.subject} · Priority: ${a.priority} · Status: ${a.status}${a.description ? `\n${a.description}` : ''}`,
        date: a.dueDate,
        timeLabel: 'Deadline',
        type: 'Assignment',
        badgeStyle: EVENT_COLORS.Assignment.badge,
        dotStyle: EVENT_COLORS.Assignment.dot,
      });
    }

    for (const ex of exams) {
      list.push({
        id: `e-${ex.id}`,
        source: 'exam',
        title: ex.examName,
        description: `Subject: ${ex.subject} · ${ex.examType} · Prep: ${ex.preparationStatus}${ex.importantTopics ? `\nTopics: ${ex.importantTopics}` : ''}`,
        date: ex.examDate,
        timeLabel: ex.examTime ? formatTime12h(ex.examTime) : 'Exam Day',
        type: 'Exam',
        badgeStyle: EVENT_COLORS.Exam.badge,
        dotStyle: EVENT_COLORS.Exam.dot,
      });
    }

    for (const s of studySessions) {
      list.push({
        id: `s-${s.id}`,
        source: 'studySession',
        title: s.title,
        description: `Subject: ${s.subject} · Status: ${s.status}${s.studyGoal ? `\nGoal: ${s.studyGoal}` : ''}`,
        date: s.date,
        timeLabel: `${formatTime12h(s.startTime)}–${formatTime12h(s.endTime)}`,
        type: 'Study Session',
        badgeStyle: EVENT_COLORS['Study Session'].badge,
        dotStyle: EVENT_COLORS['Study Session'].dot,
      });
    }

    for (const ce of calendarEvents) {
      const style = EVENT_COLORS[ce.eventType] ?? EVENT_COLORS['Personal Event'];
      list.push({
        id: `c-${ce.id}`,
        source: 'calendarEvent',
        title: ce.title,
        description: ce.description || `${ce.eventType} scheduled on ${formatDisplayDate(ce.date)}`,
        date: ce.date,
        timeLabel: ce.startTime
          ? `${formatTime12h(ce.startTime)}${ce.endTime ? `–${formatTime12h(ce.endTime)}` : ''}`
          : 'All day',
        type: ce.eventType,
        badgeStyle: style.badge,
        dotStyle: style.dot,
        rawCalendarEvent: ce,
      });
    }

    return list;
  }, [tasks, assignments, exams, studySessions, calendarEvents]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, UnifiedEvent[]>();
    for (const ev of allEvents) {
      const arr = map.get(ev.date) ?? [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    return map;
  }, [allEvents]);

  const monthGridDays = useMemo(() => {
    const ref = parseLocalDate(cursorDate);
    const firstOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - startOffset);

    const days: { dateStr: string; dayNum: number; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push({
        dateStr: formatDateStr(d),
        dayNum: d.getDate(),
        inMonth: d.getMonth() === ref.getMonth(),
      });
    }
    return days;
  }, [cursorDate]);

  const weekDays = useMemo(() => {
    const start = getWeekStartDateStr(cursorDate);
    return Array.from({ length: 7 }, (_, i) => addDaysStr(start, i));
  }, [cursorDate]);

  const handleStep = (direction: -1 | 1) => {
    if (mode === 'month') {
      const d = parseLocalDate(cursorDate);
      d.setMonth(d.getMonth() + direction);
      setCursorDate(formatDateStr(d));
    } else if (mode === 'week') {
      setCursorDate(addDaysStr(cursorDate, direction * 7));
    } else {
      setCursorDate(addDaysStr(cursorDate, direction));
    }
  };

  const openCreateModal = (dateStr: string) => {
    setEditingCalEvent(null);
    setFormTitle('');
    setFormDesc('');
    setFormDate(dateStr);
    setFormStart('10:00');
    setFormEnd('11:00');
    setFormType('Personal Event');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (ev: CalendarEvent) => {
    setSelectedEvent(null);
    setEditingCalEvent(ev);
    setFormTitle(ev.title);
    setFormDesc(ev.description);
    setFormDate(ev.date);
    setFormStart(ev.startTime);
    setFormEnd(ev.endTime);
    setFormType(ev.eventType);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!formTitle.trim()) {
      setFormError('Event title is required.');
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      const payload: CalendarEventFormValues = {
        title: formTitle.trim(),
        description: formDesc.trim(),
        date: formDate,
        startTime: formStart.trim(),
        endTime: formEnd.trim(),
        eventType: formType,
      };
      if (editingCalEvent) {
        await onEditCalendarEvent(editingCalEvent.id, payload);
        onToast('success', 'Calendar event updated.');
      } else {
        await onAddCalendarEvent(payload);
        onToast('success', 'Calendar event added.');
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save event.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await onDeleteCalendarEvent(id);
      setSelectedEvent(null);
      onToast('success', 'Calendar event deleted.');
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Unable to delete event.');
    }
  };

  const headerLabel = useMemo(() => {
    const d = parseLocalDate(cursorDate);
    if (mode === 'month') {
      return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d);
    }
    if (mode === 'week') {
      return `${formatDisplayDate(weekDays[0])} – ${formatDisplayDate(weekDays[6])}`;
    }
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  }, [cursorDate, mode, weekDays]);

  return (
    <div className="space-y-5">
      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              aria-label="Previous period"
              className="p-2 hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setCursorDate(today)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 border-x border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleStep(1)}
              aria-label="Next period"
              className="p-2 hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <h2 className="font-display text-base sm:text-lg font-semibold text-slate-900">
            {headerLabel}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['month', 'week', 'day'] as CalendarMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize cursor-pointer ${
                  mode === m ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => openCreateModal(cursorDate)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add Event
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-slate-600">
        {STUDYFLOW_LIMITS.CALENDAR_EVENT_TYPES.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${EVENT_COLORS[t].dot}`} aria-hidden="true" />
            <span>{t}</span>
          </span>
        ))}
      </div>

      {/* Month View */}
      {mode === 'month' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-600">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
            {monthGridDays.map((cell) => {
              const dayEvents = eventsByDate.get(cell.dateStr) ?? [];
              const isToday = cell.dateStr === today;
              return (
                <div
                  key={cell.dateStr}
                  className={`min-h-[104px] p-1.5 sm:p-2 flex flex-col ${
                    cell.inMonth ? 'bg-white' : 'bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCursorDate(cell.dateStr);
                        setMode('day');
                      }}
                      className={`h-6 w-6 rounded-full text-xs font-mono tabular-nums flex items-center justify-center cursor-pointer ${
                        isToday
                          ? 'bg-indigo-600 text-white font-semibold'
                          : cell.inMonth
                            ? 'text-slate-700 hover:bg-slate-100'
                            : 'text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {cell.dayNum}
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreateModal(cell.dateStr)}
                      title={`Add event on ${cell.dateStr}`}
                      aria-label={`Add event on ${cell.dateStr}`}
                      className="p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-20">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setSelectedEvent(ev)}
                        className={`w-full text-left px-1.5 py-0.5 rounded border text-[11px] font-medium truncate cursor-pointer ${ev.badgeStyle}`}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCursorDate(cell.dateStr);
                          setMode('day');
                        }}
                        className="text-[11px] font-medium text-indigo-600 pl-1 cursor-pointer"
                      >
                        +{dayEvents.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {mode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((dateStr) => {
            const d = parseLocalDate(dateStr);
            const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
            const dayEvents = eventsByDate.get(dateStr) ?? [];
            const isToday = dateStr === today;

            return (
              <div
                key={dateStr}
                className={`bg-white border rounded-xl p-3 flex flex-col min-h-[240px] ${
                  isToday ? 'border-indigo-400 ring-1 ring-indigo-500/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">{dayName}</span>
                    <span
                      className={`font-mono text-sm font-semibold tabular-nums ${
                        isToday ? 'text-indigo-700' : 'text-slate-900'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreateModal(dateStr)}
                    aria-label={`Add event on ${dateStr}`}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-1.5 flex-1">
                  {dayEvents.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No events</p>
                  ) : (
                    dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setSelectedEvent(ev)}
                        className={`w-full text-left p-2 rounded-lg border text-xs cursor-pointer ${ev.badgeStyle}`}
                      >
                        <span className="font-medium block truncate">{ev.title}</span>
                        <span className="text-[11px] opacity-80 block mt-0.5">{ev.timeLabel}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day View */}
      {mode === 'day' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Schedule for {formatDisplayDate(cursorDate)}
            </h3>
            <button
              type="button"
              onClick={() => openCreateModal(cursorDate)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add Event Here
            </button>
          </div>

          {(eventsByDate.get(cursorDate) ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No tasks, deadlines, exams, or events scheduled for this date.
            </p>
          ) : (
            <div className="space-y-2.5">
              {(eventsByDate.get(cursorDate) ?? []).map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setSelectedEvent(ev)}
                  className="w-full text-left border border-slate-200 hover:border-indigo-300 rounded-xl p-4 flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-1">
                      <span className={`h-2 w-2 rounded-full ${ev.dotStyle}`} aria-hidden="true" />
                      <span>{ev.type}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{ev.timeLabel}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{ev.title}</p>
                    <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{ev.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-indigo-700">{selectedEvent.type}</span>
                <h3 className="font-display text-lg font-semibold text-slate-900 mt-0.5">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event details"
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 text-xs font-mono tabular-nums text-slate-500">
              {formatDisplayDate(selectedEvent.date)} · {selectedEvent.timeLabel}
            </p>
            <p className="mt-3 text-sm text-slate-600 whitespace-pre-line leading-relaxed">
              {selectedEvent.description}
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              {selectedEvent.rawCalendarEvent && (
                <>
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedEvent.rawCalendarEvent!)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteEvent(selectedEvent.rawCalendarEvent!.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Delete
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Calendar Event Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-display text-base font-semibold text-slate-900">
                {editingCalEvent ? 'Edit Calendar Event' : 'New Calendar Event'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Event Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Lab Group Sync or Revision Block"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CalendarEventType)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
                  >
                    {STUDYFLOW_LIMITS.CALENDAR_EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
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
                  {editingCalEvent ? 'Save Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
