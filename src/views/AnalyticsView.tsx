import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  Assignment,
  FocusSession,
  StudySession,
  Task,
} from '../types/studyflow.ts';
import { addDaysStr, getLastNDays, getTodayStr, parseLocalDate } from '../utils/dateUtils.ts';

interface AnalyticsViewProps {
  tasks: Task[];
  assignments: Assignment[];
  studySessions: StudySession[];
  focusSessions: FocusSession[];
}

const CHART_COLORS = ['#4F46E5', '#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899'];

export function AnalyticsView({
  tasks,
  assignments,
  studySessions,
  focusSessions,
}: AnalyticsViewProps) {
  const today = getTodayStr();

  const kpis = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalAsg = assignments.length;
    const submittedAsg = assignments.filter((a) => a.status === 'Submitted').length;
    const assignmentRate = totalAsg > 0 ? Math.round((submittedAsg / totalAsg) * 100) : 0;

    const focusCompleted = focusSessions.filter((f) => f.mode === 'focus').length;
    const totalStudyMinutes =
      studySessions
        .filter((s) => s.status === 'Completed')
        .reduce((sum, s) => sum + s.durationMinutes, 0) +
      focusSessions
        .filter((f) => f.mode === 'focus')
        .reduce((sum, f) => sum + f.durationMinutes, 0);

    return {
      taskRate,
      completedTasks,
      totalTasks,
      assignmentRate,
      submittedAsg,
      totalAsg,
      focusCompleted,
      totalStudyHours: Math.round((totalStudyMinutes / 60) * 10) / 10,
    };
  }, [tasks, assignments, studySessions, focusSessions]);

  // 1. Daily Task Completion & Study Hours (Last 7 days)
  const dailyData = useMemo(() => {
    return getLastNDays(7).map((dateStr) => {
      const label = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(parseLocalDate(dateStr));

      const tasksCompleted = tasks.filter(
        (t) =>
          t.status === 'Completed' &&
          ((t.completedAt && t.completedAt.slice(0, 10) === dateStr) ||
            (!t.completedAt && t.dueDate === dateStr)),
      ).length;

      const mins =
        studySessions
          .filter((s) => s.status === 'Completed' && s.date === dateStr)
          .reduce((sum, s) => sum + s.durationMinutes, 0) +
        focusSessions
          .filter((f) => f.mode === 'focus' && f.date === dateStr)
          .reduce((sum, f) => sum + f.durationMinutes, 0);

      return {
        date: label,
        tasksCompleted,
        studyHours: Math.round((mins / 60) * 10) / 10,
      };
    });
  }, [tasks, studySessions, focusSessions]);

  // 2. Weekly Task Completion (Last 4 weeks)
  const weeklyData = useMemo(() => {
    const weeks: { label: string; completed: number }[] = [];
    for (let w = 3; w >= 0; w -= 1) {
      const end = addDaysStr(today, -w * 7);
      const start = addDaysStr(end, -6);
      const count = tasks.filter((t) => {
        if (t.status !== 'Completed') return false;
        const d = (t.completedAt && t.completedAt.slice(0, 10)) || t.dueDate;
        return Boolean(d && d >= start && d <= end);
      }).length;
      weeks.push({
        label: w === 0 ? 'This Week' : `${w}w Ago`,
        completed: count,
      });
    }
    return weeks;
  }, [tasks, today]);

  // 3. Monthly Productivity (Last 6 months)
  const monthlyData = useMemo(() => {
    const now = parseLocalDate(today);
    const months: { month: string; completedTasks: number; studyHours: number }[] = [];
    for (let m = 5; m >= 0; m -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);

      const completedTasks = tasks.filter((t) => {
        if (t.status !== 'Completed') return false;
        const ref = (t.completedAt && t.completedAt.slice(0, 7)) || (t.dueDate && t.dueDate.slice(0, 7));
        return ref === ym;
      }).length;

      const studyMins =
        studySessions
          .filter((s) => s.status === 'Completed' && s.date.startsWith(ym))
          .reduce((sum, s) => sum + s.durationMinutes, 0) +
        focusSessions
          .filter((f) => f.mode === 'focus' && f.date.startsWith(ym))
          .reduce((sum, f) => sum + f.durationMinutes, 0);

      months.push({
        month: label,
        completedTasks,
        studyHours: Math.round((studyMins / 60) * 10) / 10,
      });
    }
    return months;
  }, [tasks, studySessions, focusSessions, today]);

  // 4. Subject-wise Study Distribution
  const subjectDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of studySessions) {
      if (s.status === 'Completed') {
        map.set(s.subject, (map.get(s.subject) ?? 0) + s.durationMinutes);
      }
    }
    for (const f of focusSessions) {
      if (f.mode === 'focus' && f.subject) {
        map.set(f.subject, (map.get(f.subject) ?? 0) + f.durationMinutes);
      }
    }
    return Array.from(map.entries())
      .map(([name, mins]) => ({
        name,
        hours: Math.round((mins / 60) * 10) / 10,
      }))
      .filter((x) => x.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [studySessions, focusSessions]);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Task Completion Rate</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-indigo-700">
            {kpis.taskRate}%
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {kpis.completedTasks} of {kpis.totalTasks} tasks completed
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Assignment Completion Rate</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-emerald-700">
            {kpis.assignmentRate}%
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {kpis.submittedAsg} of {kpis.totalAsg} submitted
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Study Hours Logged</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-violet-700">
            {kpis.totalStudyHours} hrs
          </p>
          <p className="mt-1 text-xs text-slate-500">Study sessions &amp; focus blocks</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Focus Sessions Completed</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {kpis.focusCompleted}
          </p>
          <p className="mt-1 text-xs text-slate-500">Recorded Pomodoro blocks</p>
        </div>
      </div>

      {/* Daily Task Completion & Study Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-display text-base font-semibold text-slate-900 mb-1">
            Daily Task Completion
          </h2>
          <p className="text-xs text-slate-500 mb-4">Completed tasks across the last 7 days</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="tasksCompleted" name="Completed Tasks" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-display text-base font-semibold text-slate-900 mb-1">
            Daily Study Hours
          </h2>
          <p className="text-xs text-slate-500 mb-4">Hours logged from completed study &amp; focus sessions</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="studyHours" name="Study Hours" stroke="#7C3AED" fill="#EDE9FE" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Weekly Completion, Monthly Productivity & Subject Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-display text-base font-semibold text-slate-900 mb-1">
            Weekly Task Completion
          </h2>
          <p className="text-xs text-slate-500 mb-4">4-week comparison</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="completed" name="Tasks Completed" fill="#0EA5E9" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-display text-base font-semibold text-slate-900 mb-1">
            Monthly Productivity
          </h2>
          <p className="text-xs text-slate-500 mb-4">6-month tasks &amp; study hours</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="completedTasks" name="Tasks" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="studyHours" name="Study Hrs" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-display text-base font-semibold text-slate-900 mb-1">
            Subject-Wise Study Distribution
          </h2>
          <p className="text-xs text-slate-500 mb-3">Hours by academic subject</p>
          {subjectDistribution.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-500 text-center">
              Complete study or focus sessions to populate subject distribution.
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    dataKey="hours"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {subjectDistribution.map((entry, idx) => (
                      <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
