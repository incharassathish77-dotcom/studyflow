import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Pause, Play, RotateCcw, Trash2 } from 'lucide-react';
import type { FocusMode, FocusSession, UserProfile } from '../types/studyflow.ts';
import { formatDisplayDate, getTodayStr } from '../utils/dateUtils.ts';

interface FocusTimerViewProps {
  profile: UserProfile | null;
  subjects: string[];
  focusSessions: FocusSession[];
  onLogSession: (payload: {
    mode: FocusMode;
    durationMinutes: number;
    subject: string;
  }) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  onToast: (type: 'success' | 'error', message: string) => void;
}

function playSoftChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Ignore audio restriction errors
  }
}

export function FocusTimerView({
  profile,
  subjects,
  focusSessions,
  onLogSession,
  onDeleteSession,
  onToast,
}: FocusTimerViewProps) {
  const [durations, setDurations] = useState<Record<FocusMode, number>>({
    focus: profile?.defaultFocusMinutes ?? 25,
    shortBreak: profile?.defaultShortBreakMinutes ?? 5,
    longBreak: profile?.defaultLongBreakMinutes ?? 15,
  });
  const [mode, setMode] = useState<FocusMode>('focus');
  const [subject, setSubject] = useState(subjects[0] ?? 'Computer Science');
  const [secondsLeft, setSecondsLeft] = useState(durations.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const completedLockRef = useRef(false);

  const today = getTodayStr();

  const handleSelectMode = (nextMode: FocusMode) => {
    setIsRunning(false);
    setHasStarted(false);
    setMode(nextMode);
    setSecondsLeft(durations[nextMode] * 60);
    completedLockRef.current = false;
  };

  const handleDurationChange = (targetMode: FocusMode, val: number) => {
    const clamped = Math.max(1, Math.min(120, val || 1));
    setDurations((prev) => ({ ...prev, [targetMode]: clamped }));
    if (mode === targetMode && !isRunning) {
      setSecondsLeft(clamped * 60);
    }
  };

  const completeAndSaveSession = useCallback(async () => {
    if (completedLockRef.current) return;
    completedLockRef.current = true;
    setIsRunning(false);
    setHasStarted(false);
    playSoftChime();

    try {
      await onLogSession({
        mode,
        durationMinutes: durations[mode],
        subject: mode === 'focus' ? subject : '',
      });
      onToast(
        'success',
        mode === 'focus'
          ? `Completed ${durations[mode]}m focus session and saved to Firestore.`
          : `Completed ${durations[mode]}m break.`,
      );
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Unable to save focus session.');
    }
  }, [mode, durations, subject, onLogSession, onToast]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          void completeAndSaveSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning, completeAndSaveSession]);

  const handleStartOrResume = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(durations[mode] * 60);
    }
    completedLockRef.current = false;
    setHasStarted(true);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHasStarted(false);
    completedLockRef.current = false;
    setSecondsLeft(durations[mode] * 60);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const totalSecs = durations[mode] * 60;
  const progressPct = Math.round(((totalSecs - secondsLeft) / Math.max(1, totalSecs)) * 100);

  const stats = useMemo(() => {
    const completedFocus = focusSessions.filter((s) => s.mode === 'focus');
    const todayFocusCount = completedFocus.filter((s) => s.date === today).length;
    const todayMinutes = completedFocus
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    return {
      totalFocusCount: completedFocus.length,
      todayFocusCount,
      todayMinutes,
      recent: [...focusSessions]
        .sort((a, b) => {
          const ta = a.completedAt ? a.completedAt.getTime() : 0;
          const tb = b.completedAt ? b.completedAt.getTime() : 0;
          return tb - ta;
        })
        .slice(0, 8),
    };
  }, [focusSessions, today]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Timer Card */}
      <section className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-8">
          {(
            [
              { id: 'focus', label: 'Focus (25m)' },
              { id: 'shortBreak', label: 'Short Break (5m)' },
              { id: 'longBreak', label: 'Long Break (15m)' },
            ] as { id: FocusMode; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectMode(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                mode === tab.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full max-w-xs mb-6">
          <div className="font-mono text-6xl sm:text-7xl font-bold tracking-tight tabular-nums text-slate-900">
            {mins}:{secs}
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {mode === 'focus' && (
          <div className="w-full max-w-xs mb-6 text-left">
            <label htmlFor="focus-subject" className="block text-xs font-medium text-slate-600 mb-1">
              Studying Subject
            </label>
            <select
              id="focus-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isRunning}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-500"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {!isRunning ? (
            <button
              type="button"
              onClick={handleStartOrResume}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              {hasStarted ? 'Resume' : 'Start Session'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-slate-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg cursor-pointer"
            >
              <Pause className="h-4 w-4" aria-hidden="true" />
              Pause
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>

          {hasStarted && (
            <button
              type="button"
              onClick={() => void completeAndSaveSession()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Finish &amp; Log
            </button>
          )}
        </div>

        {/* Custom Duration Controls */}
        <div className="mt-8 pt-6 border-t border-slate-100 w-full max-w-md grid grid-cols-3 gap-3 text-left">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Focus (min)</label>
            <input
              type="number"
              min={1}
              max={120}
              disabled={isRunning}
              value={durations.focus}
              onChange={(e) => handleDurationChange('focus', Number(e.target.value))}
              className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Short Break</label>
            <input
              type="number"
              min={1}
              max={60}
              disabled={isRunning}
              value={durations.shortBreak}
              onChange={(e) => handleDurationChange('shortBreak', Number(e.target.value))}
              className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Long Break</label>
            <input
              type="number"
              min={1}
              max={90}
              disabled={isRunning}
              value={durations.longBreak}
              onChange={(e) => handleDurationChange('longBreak', Number(e.target.value))}
              className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200"
            />
          </div>
        </div>
      </section>

      {/* Session Counter & History */}
      <aside className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Sessions Today</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-indigo-700">
              {stats.todayFocusCount}
            </p>
            <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
              {stats.todayMinutes} min focused
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Completed</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {stats.totalFocusCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">All-time focus blocks</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-display text-sm font-semibold text-slate-900 mb-3">
            Recorded Focus History
          </h3>
          {stats.recent.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              Complete a timer session to record it in Firestore.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.recent.map((item) => (
                <li key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {item.mode === 'focus' ? item.subject || 'Focus Session' : item.mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
                    </p>
                    <p className="text-[11px] font-mono tabular-nums text-slate-500">
                      {formatDisplayDate(item.date)} · {item.durationMinutes} min
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onDeleteSession(item.id)}
                    aria-label="Delete session record"
                    className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
