import { useMemo } from 'react';
import { Calendar, GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  STUDYFLOW_LIMITS,
  type Exam,
  type ExamFormValues,
  type ExamPrepStatus,
} from '../types/studyflow.ts';
import { daysBetween, formatDisplayDate, formatTime12h, getTodayStr } from '../utils/dateUtils.ts';

interface ExamPlannerViewProps {
  exams: Exam[];
  onAddExam: () => void;
  onEditExam: (exam: Exam) => void;
  onDeleteExam: (exam: Exam) => void;
  onUpdatePrep: (id: string, values: ExamFormValues) => Promise<void>;
  onToast: (type: 'success' | 'error', message: string) => void;
}

export function ExamPlannerView({
  exams,
  onAddExam,
  onEditExam,
  onDeleteExam,
  onUpdatePrep,
  onToast,
}: ExamPlannerViewProps) {
  const today = getTodayStr();

  const sortedExams = useMemo(
    () => [...exams].sort((a, b) => a.examDate.localeCompare(b.examDate)),
    [exams],
  );

  const readyCount = exams.filter((e) => e.preparationStatus === 'Ready').length;

  const handlePrepChange = async (exam: Exam, nextPrep: ExamPrepStatus) => {
    try {
      await onUpdatePrep(exam.id, {
        examName: exam.examName,
        subject: exam.subject,
        examDate: exam.examDate,
        examTime: exam.examTime,
        examType: exam.examType,
        preparationStatus: nextPrep,
        importantTopics: exam.importantTopics,
        notes: exam.notes,
      });
      onToast('success', `Preparation status updated to ${nextPrep}.`);
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Failed to update exam status.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Examination Schedule &amp; Readiness
            </h2>
            <p className="text-xs text-slate-500 tabular-nums">
              {readyCount} of {exams.length} exam{exams.length === 1 ? '' : 's'} marked Ready
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddExam}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add Exam
        </button>
      </div>

      {sortedExams.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-base font-semibold text-slate-900">No examinations scheduled</p>
          <p className="mt-1 text-sm text-slate-500">
            Add midterms, finals, or quizzes to track countdowns and important revision topics.
          </p>
          <button
            type="button"
            onClick={onAddExam}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedExams.map((exam) => {
            const diff = daysBetween(today, exam.examDate);
            const countdownLabel =
              diff < 0
                ? 'Completed / Past'
                : diff === 0
                  ? 'Exam Today'
                  : diff === 1
                    ? 'Tomorrow'
                    : `${diff} days left`;

            return (
              <article
                key={exam.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
                        <span>{exam.subject}</span>
                        <span>·</span>
                        <span>{exam.examType}</span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-slate-900 mt-0.5">
                        {exam.examName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditExam(exam)}
                        aria-label={`Edit ${exam.examName}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteExam(exam)}
                        aria-label={`Delete ${exam.examName}`}
                        className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    <span>
                      {formatDisplayDate(exam.examDate)}
                      {exam.examTime ? ` at ${formatTime12h(exam.examTime)}` : ''}
                    </span>
                    <span>·</span>
                    <span
                      className={`font-semibold ${
                        diff >= 0 && diff <= 3
                          ? 'text-red-700'
                          : diff > 3 && diff <= 7
                            ? 'text-amber-700'
                            : 'text-indigo-700'
                      }`}
                    >
                      {countdownLabel}
                    </span>
                  </div>

                  {exam.importantTopics && (
                    <div className="mt-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Key Topics: </span>
                      {exam.importantTopics}
                    </div>
                  )}
                  {exam.notes && (
                    <p className="mt-1.5 text-xs text-slate-500">{exam.notes}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Preparation Status</span>
                  <select
                    aria-label={`Preparation status for ${exam.examName}`}
                    value={exam.preparationStatus}
                    onChange={(e) => void handlePrepChange(exam, e.target.value as ExamPrepStatus)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-800 cursor-pointer"
                  >
                    {STUDYFLOW_LIMITS.EXAM_PREP_STATUSES.map((s) => (
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
