import { useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Pencil, Plus, Target, Trash2, X } from 'lucide-react';
import {
  STUDYFLOW_LIMITS,
  type Goal,
  type GoalCadence,
  type GoalFormValues,
} from '../types/studyflow.ts';

interface GoalsViewProps {
  goals: Goal[];
  onAddGoal: (values: GoalFormValues) => Promise<void>;
  onEditGoal: (id: string, values: GoalFormValues) => Promise<void>;
  onDeleteGoal: (goal: Goal) => void;
  onToast: (type: 'success' | 'error', message: string) => void;
}

export function GoalsView({
  goals,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onToast,
}: GoalsViewProps) {
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cadence, setCadence] = useState<GoalCadence>('Daily');
  const [targetValue, setTargetValue] = useState('5');
  const [currentValue, setCurrentValue] = useState('0');
  const [unit, setUnit] = useState('problems');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'Active'), [goals]);
  const completedGoals = useMemo(
    () =>
      goals
        .filter((g) => g.status === 'Completed')
        .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || '')),
    [goals],
  );

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setCadence('Daily');
    setTargetValue('5');
    setCurrentValue('0');
    setUnit('problems');
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setTitle(goal.title);
    setDescription(goal.description);
    setCadence(goal.cadence);
    setTargetValue(String(goal.targetValue));
    setCurrentValue(String(goal.currentValue));
    setUnit(goal.unit);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const tVal = Number(targetValue);
    const cVal = Number(currentValue);
    if (!title.trim()) {
      setError('Goal title is required.');
      return;
    }
    if (!Number.isFinite(tVal) || tVal < 1) {
      setError('Target must be at least 1.');
      return;
    }
    if (!Number.isFinite(cVal) || cVal < 0) {
      setError('Current progress must be 0 or greater.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const isDone = cVal >= tVal;
      const payload: GoalFormValues = {
        title: title.trim(),
        description: description.trim(),
        cadence,
        targetValue: tVal,
        currentValue: cVal,
        unit: unit.trim() || 'tasks',
        status: isDone ? 'Completed' : 'Active',
        completedAt: isDone ? new Date().toISOString() : '',
      };
      if (editing) {
        await onEditGoal(editing.id, payload);
        onToast('success', 'Goal updated.');
      } else {
        await onAddGoal(payload);
        onToast('success', 'Goal created.');
      }
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save goal.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepProgress = async (goal: Goal, delta: number) => {
    const nextVal = Math.max(0, goal.currentValue + delta);
    const completed = nextVal >= goal.targetValue;
    try {
      await onEditGoal(goal.id, {
        title: goal.title,
        description: goal.description,
        cadence: goal.cadence,
        targetValue: goal.targetValue,
        currentValue: nextVal,
        unit: goal.unit,
        status: completed ? 'Completed' : 'Active',
        completedAt: completed ? new Date().toISOString() : '',
      });
      if (completed && goal.status !== 'Completed') {
        onToast('success', `Goal "${goal.title}" completed!`);
      }
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Unable to update progress.');
    }
  };

  const handleMarkComplete = async (goal: Goal) => {
    const nextDone = goal.status !== 'Completed';
    try {
      await onEditGoal(goal.id, {
        title: goal.title,
        description: goal.description,
        cadence: goal.cadence,
        targetValue: goal.targetValue,
        currentValue: nextDone ? goal.targetValue : 0,
        unit: goal.unit,
        status: nextDone ? 'Completed' : 'Active',
        completedAt: nextDone ? new Date().toISOString() : '',
      });
      onToast('success', nextDone ? 'Goal marked completed!' : 'Goal reactivated.');
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Unable to update goal.');
    }
  };

  const visibleList = tab === 'active' ? activeGoals : completedGoals;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
              tab === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Active Goals ({activeGoals.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
              tab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Completion History ({completedGoals.length})
          </button>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New Goal
        </button>
      </div>

      {visibleList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Target className="h-8 w-8 text-slate-400 mx-auto mb-3" aria-hidden="true" />
          <p className="text-base font-semibold text-slate-900">
            {tab === 'active' ? 'No active goals yet' : 'No completed goals yet'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Set daily or weekly targets like solving 5 coding problems or studying DBMS for 2 hours.
          </p>
          {tab === 'active' && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleList.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 100));
            const isCompleted = goal.status === 'Completed';

            return (
              <article
                key={goal.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-medium text-indigo-700">{goal.cadence} Goal</span>
                      <h3 className="font-display text-base font-semibold text-slate-900 mt-0.5">
                        {goal.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(goal)}
                        aria-label={`Edit ${goal.title}`}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(goal)}
                        aria-label={`Delete ${goal.title}`}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {goal.description && (
                    <p className="mt-1.5 text-sm text-slate-600">{goal.description}</p>
                  )}

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono tabular-nums text-slate-700 font-medium">
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500">{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${
                          isCompleted ? 'bg-emerald-600' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleStepProgress(goal, -1)}
                      disabled={goal.currentValue <= 0}
                      className="px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleStepProgress(goal, 1)}
                      className="px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                    >
                      +1 {goal.unit}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleMarkComplete(goal)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {isCompleted ? 'Completed' : 'Mark Completed'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-display text-base font-semibold text-slate-900">
                {editing ? 'Edit Goal' : 'Create Study Goal'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Goal Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Complete 5 coding problems"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cadence</label>
                  <select
                    value={cadence}
                    onChange={(e) => setCadence(e.target.value as GoalCadence)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
                  >
                    {STUDYFLOW_LIMITS.GOAL_CADENCES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="problems / hours / pages"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current</label>
                  <input
                    type="number"
                    min={0}
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target</label>
                  <input
                    type="number"
                    min={1}
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details or milestones..."
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
                  {editing ? 'Save Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
