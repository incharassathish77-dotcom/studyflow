import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  STUDYFLOW_LIMITS,
  type Assignment,
  type AssignmentFormValues,
  type AssignmentStatus,
} from '../types/studyflow.ts';
import { daysBetween, formatDisplayDate, getTodayStr } from '../utils/dateUtils.ts';

interface AssignmentsViewProps {
  assignments: Assignment[];
  subjects: string[];
  onAdd: () => void;
  onEdit: (item: Assignment) => void;
  onDelete: (item: Assignment) => void;
  onQuickStatus: (id: string, values: AssignmentFormValues) => Promise<void>;
  onToast: (type: 'success' | 'error', message: string) => void;
}

export function AssignmentsView({
  assignments,
  subjects,
  onAdd,
  onEdit,
  onDelete,
  onQuickStatus,
  onToast,
}: AssignmentsViewProps) {
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AssignmentStatus>('all');
  const today = getTodayStr();

  const availableSubjects = useMemo(() => {
    const set = new Set<string>(subjects);
    assignments.forEach((a) => set.add(a.subject));
    return Array.from(set);
  }, [subjects, assignments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignments
      .filter((a) => {
        if (q && !a.title.toLowerCase().includes(q) && !a.subject.toLowerCase().includes(q)) {
          return false;
        }
        if (subjectFilter !== 'all' && a.subject !== subjectFilter) return false;
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [assignments, search, subjectFilter, statusFilter]);

  const handleStatusChange = async (item: Assignment, nextStatus: AssignmentStatus) => {
    try {
      await onQuickStatus(item.id, {
        title: item.title,
        subject: item.subject,
        description: item.description,
        assignedDate: item.assignedDate,
        dueDate: item.dueDate,
        priority: item.priority,
        status: nextStatus,
      });
      onToast('success', `Assignment marked as ${nextStatus}.`);
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Unable to update status.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assignments..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <select
            aria-label="Filter by subject"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            aria-label="Filter by submission status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | AssignmentStatus)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="all">All Statuses</option>
            {STUDYFLOW_LIMITS.ASSIGNMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add Assignment
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-base font-semibold text-slate-900">No assignments found</p>
          <p className="mt-1 text-sm text-slate-500">
            Track course submissions, deadlines, and priority levels here.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const diff = daysBetween(today, item.dueDate);
            const isOverdue = item.status !== 'Submitted' && diff < 0;
            const isSubmitted = item.status === 'Submitted';

            return (
              <article
                key={item.id}
                className={`bg-white border rounded-xl p-5 flex flex-col justify-between gap-4 ${
                  isOverdue ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-indigo-700">{item.subject}</span>
                      <h3 className="font-display text-base font-semibold text-slate-900 mt-0.5">
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        aria-label={`Edit ${item.title}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        aria-label={`Delete ${item.title}`}
                        className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {item.description && (
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                    <span
                      className={`font-medium ${
                        item.priority === 'High'
                          ? 'text-red-700'
                          : item.priority === 'Medium'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                      }`}
                    >
                      {item.priority} Priority
                    </span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">
                      Deadline {formatDisplayDate(item.dueDate)}
                    </span>
                    <span>·</span>
                    {isSubmitted ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Submitted
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center gap-1 text-red-700 font-medium font-mono tabular-nums">
                        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Overdue by {Math.abs(diff)} day(s)
                      </span>
                    ) : (
                      <span className="font-mono tabular-nums text-indigo-700 font-medium">
                        {diff === 0 ? 'Due today' : `${diff} day(s) remaining`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    {item.assignedDate ? `Assigned ${formatDisplayDate(item.assignedDate)}` : 'Active'}
                  </span>
                  <select
                    aria-label={`Submission status for ${item.title}`}
                    value={item.status}
                    onChange={(e) => void handleStatusChange(item, e.target.value as AssignmentStatus)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-800 cursor-pointer"
                  >
                    {STUDYFLOW_LIMITS.ASSIGNMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
