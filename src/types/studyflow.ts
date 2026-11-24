export type NavSection =
  | 'dashboard'
  | 'tasks'
  | 'calendar'
  | 'assignments'
  | 'study-planner'
  | 'exam-planner'
  | 'timetable'
  | 'notes'
  | 'goals'
  | 'focus-timer'
  | 'analytics'
  | 'settings';

export type TaskCategory =
  | 'Academic'
  | 'Personal'
  | 'Projects'
  | 'Coding Practice'
  | 'College Activities'
  | 'Other';

export type PriorityLevel = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type AssignmentStatus = 'Not Started' | 'In Progress' | 'Submitted';
export type StudySessionStatus = 'Scheduled' | 'Completed';
export type ExamType = 'Midterm' | 'Final' | 'Quiz' | 'Practical' | 'Viva' | 'Other';
export type ExamPrepStatus = 'Not Started' | 'In Progress' | 'Ready';
export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';
export type GoalCadence = 'Daily' | 'Weekly';
export type GoalStatus = 'Active' | 'Completed';
export type FocusMode = 'focus' | 'shortBreak' | 'longBreak';
export type NotificationType = 'assignment' | 'exam' | 'task' | 'study';
export type CalendarEventType =
  | 'Personal Event'
  | 'Study Session'
  | 'Task'
  | 'Assignment'
  | 'Exam';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  weeklyStudyGoalHours: number;
  defaultFocusMinutes: number;
  defaultShortBreakMinutes: number;
  defaultLongBreakMinutes: number;
  subjects: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: TaskCategory;
  subject: string;
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
  subject: string;
  dueDate: string;
  dueTime: string;
  priority: PriorityLevel;
  status: TaskStatus;
  completedAt?: string;
}

export interface Assignment {
  id: string;
  userId: string;
  title: string;
  subject: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  priority: PriorityLevel;
  status: AssignmentStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface AssignmentFormValues {
  title: string;
  subject: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  priority: PriorityLevel;
  status: AssignmentStatus;
}

export interface StudySession {
  id: string;
  userId: string;
  subject: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  studyGoal: string;
  status: StudySessionStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface StudySessionFormValues {
  subject: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  studyGoal: string;
  status: StudySessionStatus;
}

export interface Exam {
  id: string;
  userId: string;
  examName: string;
  subject: string;
  examDate: string;
  examTime: string;
  examType: ExamType;
  preparationStatus: ExamPrepStatus;
  importantTopics: string;
  notes: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ExamFormValues {
  examName: string;
  subject: string;
  examDate: string;
  examTime: string;
  examType: ExamType;
  preparationStatus: ExamPrepStatus;
  importantTopics: string;
  notes: string;
}

export interface TimetableEntry {
  id: string;
  userId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: string;
  faculty: string;
  classroom: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface TimetableFormValues {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: string;
  faculty: string;
  classroom: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  subject: string;
  content: string;
  isPinned: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface NoteFormValues {
  title: string;
  subject: string;
  content: string;
  isPinned: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  cadence: GoalCadence;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: GoalStatus;
  completedAt: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface GoalFormValues {
  title: string;
  description: string;
  cadence: GoalCadence;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: GoalStatus;
  completedAt?: string;
}

export interface FocusSession {
  id: string;
  userId: string;
  mode: FocusMode;
  durationMinutes: number;
  subject: string;
  date: string;
  completedAt: Date | null;
  createdAt: Date | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  sourceKey: string;
  type: NotificationType;
  title: string;
  message: string;
  dueDate: string;
  isRead: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  eventType: CalendarEventType;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CalendarEventFormValues {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  eventType: CalendarEventType;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export const DEFAULT_SUBJECTS = [
  'Computer Science',
  'Database Systems',
  'Algorithms & Data Structures',
  'Operating Systems',
  'Mathematics',
  'Software Engineering',
];

export const STUDYFLOW_LIMITS = {
  TITLE_MAX: 140,
  DESCRIPTION_MAX: 1200,
  NOTE_CONTENT_MAX: 5000,
  SUBJECT_MAX: 80,
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
  ASSIGNMENT_STATUSES: ['Not Started', 'In Progress', 'Submitted'] as const,
  STUDY_STATUSES: ['Scheduled', 'Completed'] as const,
  EXAM_TYPES: ['Midterm', 'Final', 'Quiz', 'Practical', 'Viva', 'Other'] as const,
  EXAM_PREP_STATUSES: ['Not Started', 'In Progress', 'Ready'] as const,
  DAYS_OF_WEEK: [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ] as const,
  GOAL_CADENCES: ['Daily', 'Weekly'] as const,
  CALENDAR_EVENT_TYPES: [
    'Personal Event',
    'Study Session',
    'Task',
    'Assignment',
    'Exam',
  ] as const,
};
