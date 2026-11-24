import { useCallback, useState } from 'react';
import type { User } from 'firebase/auth';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { Navbar } from '../components/Navbar.tsx';
import { Sidebar } from '../components/Sidebar.tsx';
import { ToastContainer } from '../components/ToastContainer.tsx';
import { AssignmentModal } from '../components/modals/AssignmentModal.tsx';
import { ExamModal } from '../components/modals/ExamModal.tsx';
import { NoteModal } from '../components/modals/NoteModal.tsx';
import { StudySessionModal } from '../components/modals/StudySessionModal.tsx';
import { TaskModal } from '../components/modals/TaskModal.tsx';
import { useStudyFlowData } from '../hooks/useStudyFlowData.ts';
import { logoutUser } from '../services/authService.ts';
import {
  type Assignment,
  type AssignmentFormValues,
  type Exam,
  type ExamFormValues,
  type Goal,
  type NavSection,
  type Note,
  type NoteFormValues,
  type StudySession,
  type StudySessionFormValues,
  type Task,
  type TaskFormValues,
  type TimetableEntry,
  type ToastMessage,
} from '../types/studyflow.ts';
import { AnalyticsView } from '../views/AnalyticsView.tsx';
import { AssignmentsView } from '../views/AssignmentsView.tsx';
import { CalendarView } from '../views/CalendarView.tsx';
import { DashboardView } from '../views/DashboardView.tsx';
import { ExamPlannerView } from '../views/ExamPlannerView.tsx';
import { FocusTimerView } from '../views/FocusTimerView.tsx';
import { GoalsView } from '../views/GoalsView.tsx';
import { NotesView } from '../views/NotesView.tsx';
import { SettingsView } from '../views/SettingsView.tsx';
import { StudyPlannerView } from '../views/StudyPlannerView.tsx';
import { TasksView } from '../views/TasksView.tsx';
import { TimetableView } from '../views/TimetableView.tsx';

interface DashboardProps {
  user: User;
  onExitGuestToSignup?: () => Promise<void>;
}

const PAGE_TITLES: Record<NavSection, string> = {
  dashboard: 'Dashboard',
  tasks: 'My Tasks',
  calendar: 'Calendar',
  assignments: 'Assignments',
  'study-planner': 'Study Planner',
  'exam-planner': 'Exam Planner',
  timetable: 'Weekly Timetable',
  notes: 'Academic Notes',
  goals: 'Goals & Habits',
  'focus-timer': 'Focus Timer',
  analytics: 'Productivity Analytics',
  settings: 'Settings',
};

type PendingDelete =
  | { type: 'task'; item: Task }
  | { type: 'assignment'; item: Assignment }
  | { type: 'studySession'; item: StudySession }
  | { type: 'exam'; item: Exam }
  | { type: 'timetable'; item: TimetableEntry }
  | { type: 'note'; item: Note }
  | { type: 'goal'; item: Goal };

export function Dashboard({ user, onExitGuestToSignup }: DashboardProps) {
  const data = useStudyFlowData(user);
  const displayName =
    data.profile?.displayName ||
    user.displayName ||
    (user.isAnonymous ? 'Faculty Guest' : user.email?.split('@')[0]) ||
    'Student';

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal states
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const [studyModalOpen, setStudyModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<StudySession | null>(null);

  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Unable to log out.');
      setIsLoggingOut(false);
    }
  };

  // --- Modal Submit Handlers ---
  const handleTaskSubmit = async (values: TaskFormValues) => {
    if (editingTask) {
      await data.editTask(editingTask.id, values);
      showToast('success', 'Task updated successfully.');
    } else {
      await data.addTask(values);
      showToast('success', 'Task created successfully.');
    }
  };

  const handleAssignmentSubmit = async (values: AssignmentFormValues) => {
    if (editingAssignment) {
      await data.editAssignment(editingAssignment.id, values);
      showToast('success', 'Assignment updated successfully.');
    } else {
      await data.addAssignment(values);
      showToast('success', 'Assignment added successfully.');
    }
  };

  const handleStudySubmit = async (values: StudySessionFormValues) => {
    if (editingStudy) {
      await data.editStudySession(editingStudy.id, values);
      showToast('success', 'Study session updated.');
    } else {
      await data.addStudySession(values);
      showToast('success', 'Study session scheduled.');
    }
  };

  const handleExamSubmit = async (values: ExamFormValues) => {
    if (editingExam) {
      await data.editExam(editingExam.id, values);
      showToast('success', 'Exam updated.');
    } else {
      await data.addExam(values);
      showToast('success', 'Exam added to planner.');
    }
  };

  const handleNoteSubmit = async (values: NoteFormValues) => {
    if (editingNote) {
      await data.editNote(editingNote.id, values);
      showToast('success', 'Note updated.');
    } else {
      await data.addNote(values);
      showToast('success', 'Note saved.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      switch (pendingDelete.type) {
        case 'task':
          await data.removeTask(pendingDelete.item.id);
          showToast('success', 'Task deleted.');
          break;
        case 'assignment':
          await data.removeAssignment(pendingDelete.item.id);
          showToast('success', 'Assignment deleted.');
          break;
        case 'studySession':
          await data.removeStudySession(pendingDelete.item.id);
          showToast('success', 'Study session deleted.');
          break;
        case 'exam':
          await data.removeExam(pendingDelete.item.id);
          showToast('success', 'Exam deleted.');
          break;
        case 'timetable':
          await data.removeTimetableEntry(pendingDelete.item.id);
          showToast('success', 'Class removed from timetable.');
          break;
        case 'note':
          await data.removeNote(pendingDelete.item.id);
          showToast('success', 'Note deleted.');
          break;
        case 'goal':
          await data.removeGoal(pendingDelete.item.id);
          showToast('success', 'Goal deleted.');
          break;
      }
      setPendingDelete(null);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Unable to delete item.');
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteMessage = (() => {
    if (!pendingDelete) return '';
    switch (pendingDelete.type) {
      case 'task':
        return `Permanently delete task "${pendingDelete.item.title}"?`;
      case 'assignment':
        return `Permanently delete assignment "${pendingDelete.item.title}"?`;
      case 'studySession':
        return `Permanently delete study session "${pendingDelete.item.title}"?`;
      case 'exam':
        return `Permanently delete exam "${pendingDelete.item.examName}"?`;
      case 'timetable':
        return `Remove "${pendingDelete.item.subject}" (${pendingDelete.item.dayOfWeek}) from timetable?`;
      case 'note':
        return `Permanently delete note "${pendingDelete.item.title}"?`;
      case 'goal':
        return `Permanently delete goal "${pendingDelete.item.title}"?`;
    }
  })();

  const handleAddSubject = async (name: string) => {
    const next = [...data.subjects, name];
    await data.saveSettings({ subjects: next });
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        user={user}
        displayName={displayName}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        badges={{
          tasks: data.tasks.filter((t) => t.status !== 'Completed').length,
          assignments: data.assignments.filter((a) => a.status !== 'Submitted').length,
          exams: data.exams.length,
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          pageTitle={PAGE_TITLES[activeSection]}
          user={user}
          displayName={displayName}
          notifications={data.notifications}
          onMarkNotificationRead={data.markNotificationRead}
          onMarkAllRead={data.markAllNotificationsRead}
          onDeleteNotification={data.removeNotification}
          onAddTask={() => {
            setEditingTask(null);
            setTaskModalOpen(true);
          }}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {user.isAnonymous && (
            <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs sm:text-sm text-indigo-950">
                <span className="font-semibold">Guest Demo Mode</span>
                <span className="text-indigo-800">
                  {' '}
                  — You are exploring an isolated sample workspace. Your demo edits do not affect
                  any other user&apos;s records.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onExitGuestToSignup && (
                  <button
                    type="button"
                    onClick={() => void onExitGuestToSignup()}
                    disabled={isLoggingOut}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Create Account
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Exit Demo
                </button>
              </div>
            </div>
          )}

          {data.error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
            >
              {data.error}
            </div>
          )}

          {activeSection === 'dashboard' && (
            <DashboardView
              displayName={displayName}
              profile={data.profile}
              tasks={data.tasks}
              assignments={data.assignments}
              studySessions={data.studySessions}
              exams={data.exams}
              focusSessions={data.focusSessions}
              calendarEvents={data.calendarEvents}
              loading={data.loading}
              onQuickAddTask={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              onQuickAddAssignment={() => {
                setEditingAssignment(null);
                setAssignmentModalOpen(true);
              }}
              onQuickAddStudy={() => {
                setEditingStudy(null);
                setStudyModalOpen(true);
              }}
              onQuickAddExam={() => {
                setEditingExam(null);
                setExamModalOpen(true);
              }}
              onQuickAddNote={() => {
                setEditingNote(null);
                setNoteModalOpen(true);
              }}
              onNavigate={setActiveSection}
            />
          )}

          {activeSection === 'tasks' && (
            <TasksView
              tasks={data.tasks}
              loading={data.loading}
              onAddTask={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              onEditTask={(t) => {
                setEditingTask(t);
                setTaskModalOpen(true);
              }}
              onDeleteTask={(t) => setPendingDelete({ type: 'task', item: t })}
              onUpdateStatus={data.setTaskStatus}
              onToast={showToast}
            />
          )}

          {activeSection === 'calendar' && (
            <CalendarView
              tasks={data.tasks}
              assignments={data.assignments}
              exams={data.exams}
              studySessions={data.studySessions}
              calendarEvents={data.calendarEvents}
              onAddCalendarEvent={data.addCalendarEvent}
              onEditCalendarEvent={data.editCalendarEvent}
              onDeleteCalendarEvent={data.removeCalendarEvent}
              onToast={showToast}
            />
          )}

          {activeSection === 'assignments' && (
            <AssignmentsView
              assignments={data.assignments}
              subjects={data.subjects}
              onAdd={() => {
                setEditingAssignment(null);
                setAssignmentModalOpen(true);
              }}
              onEdit={(a) => {
                setEditingAssignment(a);
                setAssignmentModalOpen(true);
              }}
              onDelete={(a) => setPendingDelete({ type: 'assignment', item: a })}
              onQuickStatus={data.editAssignment}
              onToast={showToast}
            />
          )}

          {activeSection === 'study-planner' && (
            <StudyPlannerView
              studySessions={data.studySessions}
              subjects={data.subjects}
              onAddSubject={handleAddSubject}
              onAddSession={() => {
                setEditingStudy(null);
                setStudyModalOpen(true);
              }}
              onEditSession={(s) => {
                setEditingStudy(s);
                setStudyModalOpen(true);
              }}
              onDeleteSession={(s) => setPendingDelete({ type: 'studySession', item: s })}
              onToggleComplete={data.editStudySession}
              onToast={showToast}
            />
          )}

          {activeSection === 'exam-planner' && (
            <ExamPlannerView
              exams={data.exams}
              onAddExam={() => {
                setEditingExam(null);
                setExamModalOpen(true);
              }}
              onEditExam={(ex) => {
                setEditingExam(ex);
                setExamModalOpen(true);
              }}
              onDeleteExam={(ex) => setPendingDelete({ type: 'exam', item: ex })}
              onUpdatePrep={data.editExam}
              onToast={showToast}
            />
          )}

          {activeSection === 'timetable' && (
            <TimetableView
              entries={data.timetable}
              subjects={data.subjects}
              onAdd={data.addTimetableEntry}
              onEdit={data.editTimetableEntry}
              onDelete={(entry) => setPendingDelete({ type: 'timetable', item: entry })}
              onToast={showToast}
            />
          )}

          {activeSection === 'notes' && (
            <NotesView
              notes={data.notes}
              subjects={data.subjects}
              onAddNote={() => {
                setEditingNote(null);
                setNoteModalOpen(true);
              }}
              onEditNote={(n) => {
                setEditingNote(n);
                setNoteModalOpen(true);
              }}
              onDeleteNote={(n) => setPendingDelete({ type: 'note', item: n })}
              onTogglePin={data.toggleNotePin}
              onToast={showToast}
            />
          )}

          {activeSection === 'goals' && (
            <GoalsView
              goals={data.goals}
              onAddGoal={data.addGoal}
              onEditGoal={data.editGoal}
              onDeleteGoal={(g) => setPendingDelete({ type: 'goal', item: g })}
              onToast={showToast}
            />
          )}

          {activeSection === 'focus-timer' && (
            <FocusTimerView
              profile={data.profile}
              subjects={data.subjects}
              focusSessions={data.focusSessions}
              onLogSession={data.logFocusSession}
              onDeleteSession={data.removeFocusSession}
              onToast={showToast}
            />
          )}

          {activeSection === 'analytics' && (
            <AnalyticsView
              tasks={data.tasks}
              assignments={data.assignments}
              studySessions={data.studySessions}
              focusSessions={data.focusSessions}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsView
              profile={data.profile}
              subjects={data.subjects}
              onSaveSettings={data.saveSettings}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Creation & Edit Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        editingTask={editingTask}
        subjects={data.subjects}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
      />

      <AssignmentModal
        isOpen={assignmentModalOpen}
        editingItem={editingAssignment}
        subjects={data.subjects}
        onClose={() => {
          setAssignmentModalOpen(false);
          setEditingAssignment(null);
        }}
        onSubmit={handleAssignmentSubmit}
      />

      <StudySessionModal
        isOpen={studyModalOpen}
        editingItem={editingStudy}
        subjects={data.subjects}
        onClose={() => {
          setStudyModalOpen(false);
          setEditingStudy(null);
        }}
        onSubmit={handleStudySubmit}
      />

      <ExamModal
        isOpen={examModalOpen}
        editingItem={editingExam}
        subjects={data.subjects}
        onClose={() => {
          setExamModalOpen(false);
          setEditingExam(null);
        }}
        onSubmit={handleExamSubmit}
      />

      <NoteModal
        isOpen={noteModalOpen}
        editingItem={editingNote}
        subjects={data.subjects}
        onClose={() => {
          setNoteModalOpen(false);
          setEditingNote(null);
        }}
        onSubmit={handleNoteSubmit}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Confirm Deletion"
        message={deleteMessage}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
