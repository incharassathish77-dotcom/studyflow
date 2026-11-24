import { useCallback, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { Navbar } from '../components/Navbar.tsx';
import { Sidebar } from '../components/Sidebar.tsx';
import { ToastContainer } from '../components/ToastContainer.tsx';
import { TaskDetailModal } from '../components/modals/TaskDetailModal.tsx';
import { TaskModal } from '../components/modals/TaskModal.tsx';
import { useTasks } from '../hooks/useTasks.ts';
import type {
  NavSection,
  Task,
  TaskFilterMode,
  TaskFormValues,
  ToastMessage,
} from '../types/studyflow.ts';
import { CalendarView } from '../views/CalendarView.tsx';
import { DashboardView } from '../views/DashboardView.tsx';
import { TasksView } from '../views/TasksView.tsx';

const PAGE_TITLES: Record<NavSection, string> = {
  dashboard: 'Dashboard',
  tasks: 'My Tasks',
  calendar: 'Calendar',
};

export function Dashboard() {
  const {
    tasks,
    loading,
    error,
    addTask,
    editTask,
    setTaskStatus,
    setTaskPriority,
    removeTask,
  } = useTasks();

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [taskFilter, setTaskFilter] = useState<TaskFilterMode>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTaskDate, setDefaultTaskDate] = useState<string | undefined>(undefined);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [pendingDeleteTask, setPendingDeleteTask] = useState<Task | null>(null);
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

  const openAddTask = useCallback((dateStr?: string) => {
    setEditingTask(null);
    setDefaultTaskDate(dateStr);
    setTaskModalOpen(true);
  }, []);

  const openEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setDefaultTaskDate(undefined);
    setTaskModalOpen(true);
  }, []);

  const handleNavigate = useCallback((section: NavSection, filter?: TaskFilterMode) => {
    if (filter) {
      setTaskFilter(filter);
    }
    setActiveSection(section);
  }, []);

  const handleTaskSubmit = async (values: TaskFormValues) => {
    if (editingTask) {
      await editTask(editingTask.id, values);
      showToast('success', 'Task updated successfully.');
    } else {
      await addTask(values);
      showToast('success', 'Task created successfully.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteTask || isDeleting) return;
    setIsDeleting(true);
    try {
      await removeTask(pendingDeleteTask.id);
      showToast('success', 'Task deleted.');
      setPendingDeleteTask(null);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Unable to delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  const pendingTaskCount = tasks.filter((t) => t.status !== 'Completed').length;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={(sec) => handleNavigate(sec)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        pendingTaskCount={pendingTaskCount}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          pageTitle={PAGE_TITLES[activeSection]}
          onAddTask={() => openAddTask()}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          {activeSection === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              loading={loading}
              onQuickAddTask={() => openAddTask()}
              onViewTask={(task) => setViewingTask(task)}
              onToggleTaskStatus={async (id, status) => {
                await setTaskStatus(id, status);
                showToast('success', `Task marked as ${status}.`);
              }}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'tasks' && (
            <TasksView
              tasks={tasks}
              loading={loading}
              initialFilter={taskFilter}
              onAddTask={() => openAddTask()}
              onViewTask={(task) => setViewingTask(task)}
              onEditTask={openEditTask}
              onDeleteTask={(task) => setPendingDeleteTask(task)}
              onUpdateStatus={setTaskStatus}
              onUpdatePriority={setTaskPriority}
              onToast={showToast}
            />
          )}

          {activeSection === 'calendar' && (
            <CalendarView
              tasks={tasks}
              onAddTaskForDate={(dateStr) => openAddTask(dateStr)}
              onViewTask={(task) => setViewingTask(task)}
              onEditTask={openEditTask}
              onDeleteTask={(task) => setPendingDeleteTask(task)}
              onToggleTaskStatus={setTaskStatus}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      <TaskModal
        isOpen={taskModalOpen}
        editingTask={editingTask}
        defaultDate={defaultTaskDate}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
          setDefaultTaskDate(undefined);
        }}
        onSubmit={handleTaskSubmit}
      />

      <TaskDetailModal
        task={viewingTask}
        onClose={() => setViewingTask(null)}
        onEdit={openEditTask}
        onDelete={(task) => setPendingDeleteTask(task)}
        onToggleStatus={async (id, status) => {
          await setTaskStatus(id, status);
          showToast('success', `Task marked as ${status}.`);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteTask)}
        title="Delete Task"
        message={
          pendingDeleteTask
            ? `Are you sure you want to permanently delete "${pendingDeleteTask.title}"?`
            : ''
        }
        confirmLabel="Delete Task"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setPendingDeleteTask(null);
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
