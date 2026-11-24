import { useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Plus,
  StickyNote,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  Assignment,
  CalendarEvent,
  Exam,
  FocusSession,
  NavSection,
  StudySession,
  Task,
  UserProfile,
} from '../types/studyflow.ts';
import {
  daysBetween,
  formatDisplayDate,
  formatTime12h,
  getLastNDays,
  getTodayStr,
  getWeekStartDateStr,
  parseLocalDate,
} from '../utils/dateUtils.ts';

interface DashboardViewProps {
  displayName: string;
  profile: UserProfile | null;
  tasks: Task[];
  assignments: Assignment[];
  studySessions: StudySession[];
  exams: Exam[];
  focusSessions: FocusSession[];
  calendarEvents: CalendarEvent[];
  loading: boolean;
  onQuickAddTask: () => void;
  onQuickAddAssignment: () => void;
  onQuickAddStudy: () => void;
  onQuickAddExam: () => void;
  onQuickAddNote: () => void;
  onNavigate: (section: NavSection) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardView({
  displayName,
  profile,
  tasks,
  assignments,
  studySessions,
  exams,
  focusSessions,
  calendarEvents,
  loading,
  onQuickAddTask,
  onQuickAddAssignment,
  onQuickAddStudy,
  onQuickAddExam,
  onQuickAddNote,
  onNavigate,
}: DashboardViewProps) {
  const today = getTodayStr();
  const weekStart = getWeekStartDateStr(today);
  const firstName = displayName.split(' ')[0] || 'Student';

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'Completed').length;
    const upcomingAssignments = assignments.filter(
      (a) => a.status !== 'Submitted' && a.dueDate >= today,
    ).length;
    const upcomingExams = exams.filter((e) => e.examDate >= today).length;

    const studyMinutesFromSessions = studySessions
      .filter((s) => s.status === 'Completed' && s.date >= weekStart && s.date <= today)
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    const focusMinutesThisWeek = focusSessions
      .filter((f) => f.mode === 'focus' && f.date >= weekStart && f.date <= today)
      .reduce((acc, f) => acc + f.durationMinutes, 0);

    const studyHoursThisWeek =
      Math.round(((studyMinutesFromSessions + focusMinutesThisWeek) / 60) * 10) / 10;

    const weeklyGoalHours = profile?.weeklyStudyGoalHours ?? 14;
    const studyGoalPercent = Math.min(
      100,
      Math.round((studyHoursThisWeek / Math.max(1, weeklyGoalHours)) * 100),
    );

    const todayTasks = tasks.filter((t) => t.dueDate === today);
    const todayCompleted = tasks.filter(
      (t) =>
        t.status === 'Completed' &&
        (t.dueDate === today || (t.completedAt && t.completedAt.slice(0, 10) === today)),
    ).length;
    const todayRemaining = todayTasks.filter((t) => t.status !== 'Completed').length;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      upcomingAssignments,
      upcomingExams,
      studyHoursThisWeek,
      weeklyGoalHours,
      studyGoalPercent,
      todayCompleted,
      todayRemaining,
    };
  }, [tasks, assignments, exams, studySessions, focusSessions, profile, today, weekStart]);

  const todaysSchedule = useMemo(() => {
    const items: {
      id: string;
      time: string;
      title: string;
      kind: string;
      meta: string;
      accent: string;
    }[] = [];

    for (const s of studySessions) {
      if (s.date === today) {
        items.push({
          id: `study-${s.id}`,
          time: s.startTime || '09:00',
          title: s.title,
          kind: 'Study Session',
          meta: `${s.subject} · ${formatTime12h(s.startTime)}–${formatTime12h(s.endTime)}`,
          accent: 'text-indigo-700',
        });
      }
    }
    for (const t of tasks) {
      if (t.dueDate === today) {
        items.push({
          id: `task-${t.id}`,
          time: t.dueTime || '23:59',
          title: t.title,
          kind: 'Task',
          meta: `${t.category}${t.dueTime ? ` · ${formatTime12h(t.dueTime)}` : ''} · ${t.status}`,
          accent: t.status === 'Completed' ? 'text-emerald-700' : 'text-slate-700',
        });
      }
    }
    for (const a of assignments) {
      if (a.dueDate === today) {
        items.push({
          id: `asg-${a.id}`,
          time: '23:59',
          title: a.title,
          kind: 'Assignment',
          meta: `${a.subject} · Due Today · ${a.status}`,
          accent: 'text-amber-700',
        });
      }
    }
    for (const e of exams) {
      if (e.examDate === today) {
        items.push({
          id: `exam-${e.id}`,
          time: e.examTime || '09:00',
          title: e.examName,
          kind: 'Exam',
          meta: `${e.subject} · ${e.examType}${e.examTime ? ` · ${formatTime12h(e.examTime)}` : ''}`,
          accent: 'text-red-700',
        });
      }
    }
    for (const ev of calendarEvents) {
      if (ev.date === today) {
        items.push({
          id: `cal-${ev.id}`,
          time: ev.startTime || '12:00',
          title: ev.title,
          kind: ev.eventType,
          meta: ev.startTime ? formatTime12h(ev.startTime) : 'All day',
          accent: 'text-violet-700',
        });
      }
    }

    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [studySessions, tasks, assignments, exams, calendarEvents, today]);

  const upcomingDeadlines = useMemo(() => {
    const combined: {
      id: string;
      title: string;
      subject: string;
      dueDate: string;
      kind: 'Assignment' | 'Task';
      status: string;
      daysLeft: number;
    }[] = [];

    for (const a of assignments) {
      if (a.status !== 'Submitted') {
        combined.push({
          id: `a-${a.id}`,
          title: a.title,
          subject: a.subject,
          dueDate: a.dueDate,
          kind: 'Assignment',
          status: a.status,
          daysLeft: daysBetween(today, a.dueDate),
        });
      }
    }
    for (const t of tasks) {
      if (t.status !== 'Completed' && t.dueDate) {
        combined.push({
          id: `t-${t.id}`,
          title: t.title,
          subject: t.subject || t.category,
          dueDate: t.dueDate,
          kind: 'Task',
          status: t.status,
          daysLeft: daysBetween(today, t.dueDate),
        });
      }
    }

    return combined.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);
  }, [assignments, tasks, today]);

  const weeklyChartData = useMemo(() => {
    const days = getLastNDays(7);
    return days.map((dateStr) => {
      const label = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(
        parseLocalDate(dateStr),
      );
      const completedCount = tasks.filter(
        (t) =>
          t.status === 'Completed' &&
          ((t.completedAt && t.completedAt.slice(0, 10) === dateStr) ||
            (!t.completedAt && t.dueDate === dateStr)),
      ).length;
      return { day: label, completed: completedCount };
    });
  }, [tasks]);

  const summaryCards = [
    { label: 'Total Tasks', value: stats.totalTasks, section: 'tasks' as NavSection, color: 'text-slate-900' },
    { label: 'Completed Tasks', value: stats.completedTasks, section: 'tasks' as NavSection, color: 'text-emerald-700' },
    { label: 'Pending Tasks', value: stats.pendingTasks, section: 'tasks' as NavSection, color: 'text-indigo-700' },
    { label: 'Upcoming Assignments', value: stats.upcomingAssignments, section: 'assignments' as NavSection, color: 'text-amber-700' },
    { label: 'Upcoming Exams', value: stats.upcomingExams, section: 'exam-planner' as NavSection, color: 'text-red-700' },
    { label: 'Study Hours This Week', value: `${stats.studyHoursThisWeek}h`, section: 'study-planner' as NavSection, color: 'text-violet-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting & Quick Actions */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 text-balance">
            {getGreeting()}, {firstName}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Plan Smarter. Study Better. Achieve More.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onQuickAddTask}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add Task
          </button>
          <button
            type="button"
            onClick={onQuickAddAssignment}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
            Add Assignment
          </button>
          <button
            type="button"
            onClick={onQuickAddStudy}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-violet-600" aria-hidden="true" />
            Schedule Study Session
          </button>
          <button
            type="button"
            onClick={onQuickAddExam}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <GraduationCap className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
            Add Exam
          </button>
          <button
            type="button"
            onClick={onQuickAddNote}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <StickyNote className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            Add Note
          </button>
        </div>
      </section>

      {/* 6 Dynamic Summary Cards */}
      <section aria-label="Academic summary metrics" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => onNavigate(card.section)}
            className="text-left bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 transition-colors cursor-pointer"
          >
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            {loading ? (
              <div className="mt-2 h-7 w-12 bg-slate-100 rounded animate-pulse" />
            ) : (
              <p className={`mt-1.5 font-mono text-2xl font-semibold tabular-nums ${card.color}`}>
                {card.value}
              </p>
            )}
          </button>
        ))}
      </section>

      {/* Today's Focus + Study Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-slate-900">Today&apos;s Focus</h3>
            <span className="text-xs font-mono tabular-nums text-slate-500">{formatDisplayDate(today)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="rounded-lg bg-emerald-50/70 border border-emerald-100 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Completed Today</span>
              </div>
              <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-emerald-700">
                {stats.todayCompleted}
              </p>
            </div>
            <div className="rounded-lg bg-indigo-50/70 border border-indigo-100 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-800">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>Remaining Today</span>
              </div>
              <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-indigo-700">
                {stats.todayRemaining}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">Study Progress</h3>
              <p className="text-xs text-slate-500 mt-0.5">Weekly study &amp; focus hours against goal</p>
            </div>
            <span className="font-mono text-sm font-semibold tabular-nums text-indigo-700">
              {stats.studyHoursThisWeek}h / {stats.weeklyGoalHours}h
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>Weekly Goal Attainment</span>
              <span className="font-mono tabular-nums font-medium text-slate-700">
                {stats.studyGoalPercent}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-200"
                style={{ width: `${stats.studyGoalPercent}%` }}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Today's Schedule & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-slate-900">Today&apos;s Schedule</h3>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Open Calendar
            </button>
          </div>
          {todaysSchedule.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Nothing scheduled for today yet. Add a task or schedule a study session to organize your day.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {todaysSchedule.map((item) => (
                <li key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.meta}</p>
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap shrink-0 ${item.accent}`}>
                    {item.kind}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-slate-900">Upcoming Deadlines</h3>
            <button
              type="button"
              onClick={() => onNavigate('assignments')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              View Assignments
            </button>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No upcoming deadlines. Keep up the great momentum!
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingDeadlines.map((item) => {
                const isOverdue = item.daysLeft < 0;
                const dueLabel = isOverdue
                  ? `Overdue by ${Math.abs(item.daysLeft)}d`
                  : item.daysLeft === 0
                    ? 'Due today'
                    : `In ${item.daysLeft}d`;
                return (
                  <li key={item.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.kind} · {item.subject} ·{' '}
                        <span className="font-mono tabular-nums">{formatDisplayDate(item.dueDate)}</span>
                      </p>
                    </div>
                    <span
                      className={`text-xs font-mono tabular-nums font-medium whitespace-nowrap shrink-0 ${
                        isOverdue ? 'text-red-600' : item.daysLeft <= 2 ? 'text-amber-700' : 'text-slate-600'
                      }`}
                    >
                      {dueLabel}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Weekly Productivity Chart */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">Weekly Productivity</h3>
            <p className="text-xs text-slate-500 mt-0.5">Daily completed tasks over the past 7 days</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('analytics')}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            Full Analytics
          </button>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="completed" name="Tasks Completed" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
