import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Plus, Save, X } from 'lucide-react';
import type { UserProfile } from '../types/studyflow.ts';

interface SettingsViewProps {
  profile: UserProfile | null;
  subjects: string[];
  onSaveSettings: (updates: Partial<UserProfile>) => Promise<void>;
  onToast: (type: 'success' | 'error', message: string) => void;
}

export function SettingsView({
  profile,
  subjects,
  onSaveSettings,
  onToast,
}: SettingsViewProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [weeklyGoal, setWeeklyGoal] = useState(String(profile?.weeklyStudyGoalHours ?? 14));
  const [focusMins, setFocusMins] = useState(String(profile?.defaultFocusMinutes ?? 25));
  const [shortBreakMins, setShortBreakMins] = useState(String(profile?.defaultShortBreakMinutes ?? 5));
  const [longBreakMins, setLongBreakMins] = useState(String(profile?.defaultLongBreakMinutes ?? 15));
  const [subjectList, setSubjectList] = useState<string[]>(subjects);
  const [newSubject, setNewSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setWeeklyGoal(String(profile.weeklyStudyGoalHours));
      setFocusMins(String(profile.defaultFocusMinutes));
      setShortBreakMins(String(profile.defaultShortBreakMinutes));
      setLongBreakMins(String(profile.defaultLongBreakMinutes));
      setSubjectList(profile.subjects);
    }
  }, [profile]);

  const handleAddSubject = () => {
    const trimmed = newSubject.trim();
    if (!trimmed) return;
    if (subjectList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      onToast('error', 'Subject already exists.');
      return;
    }
    if (subjectList.length >= 30) {
      onToast('error', 'Maximum of 30 subjects reached.');
      return;
    }
    setSubjectList((prev) => [...prev, trimmed]);
    setNewSubject('');
  };

  const handleRemoveSubject = (target: string) => {
    setSubjectList((prev) => prev.filter((s) => s !== target));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const wGoal = Math.max(1, Math.min(100, Number(weeklyGoal) || 14));
    const fMin = Math.max(5, Math.min(120, Number(focusMins) || 25));
    const sMin = Math.max(1, Math.min(60, Number(shortBreakMins) || 5));
    const lMin = Math.max(5, Math.min(90, Number(longBreakMins) || 15));

    setIsSaving(true);
    try {
      await onSaveSettings({
        displayName: displayName.trim() || 'Student',
        weeklyStudyGoalHours: wGoal,
        defaultFocusMinutes: fMin,
        defaultShortBreakMinutes: sMin,
        defaultLongBreakMinutes: lMin,
        subjects: subjectList,
      });
      onToast('success', 'Settings saved to Firestore.');
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Student Profile &amp; Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="set-name" className="block text-sm font-medium text-slate-700 mb-1">
              Display Name
            </label>
            <input
              id="set-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="set-email" className="block text-sm font-medium text-slate-700 mb-1">
              Account Email
            </label>
            <input
              id="set-email"
              type="text"
              disabled
              value={profile?.email ?? ''}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div>
            <label htmlFor="set-wgoal" className="block text-xs font-medium text-slate-700 mb-1">
              Weekly Goal (hrs)
            </label>
            <input
              id="set-wgoal"
              type="number"
              min={1}
              max={100}
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label htmlFor="set-focus" className="block text-xs font-medium text-slate-700 mb-1">
              Focus (min)
            </label>
            <input
              id="set-focus"
              type="number"
              min={5}
              max={120}
              value={focusMins}
              onChange={(e) => setFocusMins(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label htmlFor="set-short" className="block text-xs font-medium text-slate-700 mb-1">
              Short Break
            </label>
            <input
              id="set-short"
              type="number"
              min={1}
              max={60}
              value={shortBreakMins}
              onChange={(e) => setShortBreakMins(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label htmlFor="set-long" className="block text-xs font-medium text-slate-700 mb-1">
              Long Break
            </label>
            <input
              id="set-long"
              type="number"
              min={5}
              max={90}
              value={longBreakMins}
              onChange={(e) => setLongBreakMins(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
            />
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Academic Subjects
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Add a course or subject..."
            className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddSubject}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </button>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
          {subjectList.map((subj) => (
            <div key={subj} className="px-3.5 py-2 flex items-center justify-between text-sm">
              <span className="text-slate-800">{subj}</span>
              <button
                type="button"
                onClick={() => handleRemoveSubject(subj)}
                aria-label={`Remove ${subj}`}
                className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60 cursor-pointer"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          Save Settings
        </button>
      </div>
    </form>
  );
}
