export type NavSection = 'dashboard' | 'tasks' | 'calendar';

export type TaskCategory =
  | 'Academic'
  | 'Personal'
  | 'Projects'
  | 'Coding Practice'
  | 'College Activities'
  | 'Other';

export type PriorityLevel = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export type TaskFilterMode =
  | 'all'
  | 'Pending'
  | 'Completed'
  | 'High'
  | 'Medium'
  | 'Low';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  dueDate: string;
  dueTime: string;
  priority: PriorityLevel;
  status: TaskStatus;
  completedAt: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface TaskFormValues {
  title: string;
  description: string;
  category: TaskCategory;
  dueDate: string;
  dueTime: string;
  priority: PriorityLevel;
  status: TaskStatus;
  completedAt?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export const STUDYFLOW_LIMITS = {
  TITLE_MAX: 140,
  DESCRIPTION_MAX: 1200,
  CATEGORIES: [
    'Academic',
    'Personal',
    'Projects',
    'Coding Practice',
    'College Activities',
    'Other',
  ] as const,
  PRIORITIES: ['Low', 'Medium', 'High'] as const,
  TASK_STATUSES: ['Pending', 'In Progress', 'Completed'] as const,
};
