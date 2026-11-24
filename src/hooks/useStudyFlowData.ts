import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  validateAcademicEntityOnServer,
  validateTaskOnServer,
} from '../services/apiService.ts';
import {
  createAssignmentDoc,
  createCalendarEventDoc,
  createExamDoc,
  createFocusSessionDoc,
  createGoalDoc,
  createNoteDoc,
  createNotificationDoc,
  createStudySessionDoc,
  createTaskDoc,
  createTimetableDoc,
  deleteAssignmentDoc,
  deleteCalendarEventDoc,
  deleteExamDoc,
  deleteFocusSessionDoc,
  deleteGoalDoc,
  deleteNoteDoc,
  deleteNotificationDoc,
  deleteStudySessionDoc,
  deleteTaskDoc,
  deleteTimetableDoc,
  ensureUserProfile,
  markNotificationReadDoc,
  subscribeAssignments,
  subscribeCalendarEvents,
  subscribeExams,
  subscribeFocusSessions,
  subscribeGoals,
  subscribeNotes,
  subscribeNotifications,
  subscribeStudySessions,
  subscribeTasks,
  subscribeTimetable,
  subscribeUserProfile,
  toggleNotePinDoc,
  updateAssignmentDoc,
  updateCalendarEventDoc,
  updateExamDoc,
  updateGoalDoc,
  updateNoteDoc,
  updateStudySessionDoc,
  updateTaskDoc,
  updateTaskStatusDoc,
  updateTimetableDoc,
  updateUserProfile,
} from '../services/firestoreService.ts';
import {
  DEFAULT_SUBJECTS,
  type AppNotification,
  type Assignment,
  type AssignmentFormValues,
  type CalendarEvent,
  type CalendarEventFormValues,
  type Exam,
  type ExamFormValues,
  type FocusMode,
  type FocusSession,
  type Goal,
  type GoalFormValues,
  type Note,
  type NoteFormValues,
  type NotificationType,
  type StudySession,
  type StudySessionFormValues,
  type Task,
  type TaskFormValues,
  type TaskStatus,
  type TimetableEntry,
  type TimetableFormValues,
  type UserProfile,
} from '../types/studyflow.ts';
import { daysBetween, getTodayStr } from '../utils/dateUtils.ts';

function parseError(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  try {
    const parsed = JSON.parse(err.message) as { error?: string };
    if (parsed?.error) {
      if (parsed.error.includes('Quota exceeded')) {
        return 'Daily Firestore free-tier quota exceeded. Please try again tomorrow.';
      }
      if (parsed.error.includes('Missing or insufficient permissions')) {
        return 'Permission denied while accessing your workspace data.';
      }
      return parsed.error;
    }
  } catch {
    // Plain error
  }
  return err.message || fallback;
}

export function useStudyFlowData(user: User) {
  const userId = user.uid;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const syncedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void ensureUserProfile(user).catch((err) => {
      if (active) setError(parseError(err, 'Failed to initialize user profile.'));
    });

    const loadedFlags = new Set<string>();
    const markLoaded = (name: string) => {
      loadedFlags.add(name);
      if (loadedFlags.size >= 3 && active) {
        setLoading(false);
      }
    };

    const handleErr = (err: Error) => {
      if (active) {
        setError(parseError(err, 'Unable to load workspace data.'));
        setLoading(false);
      }
    };

    const unsubs = [
      subscribeUserProfile(userId, (p) => { setProfile(p); markLoaded('profile'); }, handleErr),
      subscribeTasks(userId, (items) => { setTasks(items); markLoaded('tasks'); }, handleErr),
      subscribeAssignments(userId, (items) => { setAssignments(items); markLoaded('assignments'); }, handleErr),
      subscribeStudySessions(userId, (items) => { setStudySessions(items); markLoaded('studySessions'); }, handleErr),
      subscribeExams(userId, (items) => { setExams(items); markLoaded('exams'); }, handleErr),
      subscribeTimetable(userId, (items) => { setTimetable(items); markLoaded('timetable'); }, handleErr),
      subscribeNotes(userId, (items) => { setNotes(items); markLoaded('notes'); }, handleErr),
      subscribeGoals(userId, (items) => { setGoals(items); markLoaded('goals'); }, handleErr),
      subscribeFocusSessions(userId, (items) => { setFocusSessions(items); markLoaded('focus'); }, handleErr),
      subscribeNotifications(userId, (items) => { setNotifications(items); markLoaded('notif'); }, handleErr),
      subscribeCalendarEvents(userId, (items) => { setCalendarEvents(items); markLoaded('cal'); }, handleErr),
    ];

    return () => {
      active = false;
      unsubs.forEach((unsub) => unsub());
    };
  }, [user, userId]);

  // Sync in-app reminders to Firestore notifications collection (deduplicated by sourceKey)
  useEffect(() => {
    if (loading) return;
    const today = getTodayStr();
    const existingKeys = new Set(notifications.map((n) => n.sourceKey));
    const candidates: {
      sourceKey: string;
      type: NotificationType;
      title: string;
      message: string;
      dueDate: string;
    }[] = [];

    for (const task of tasks) {
      if (task.status !== 'Completed' && task.dueDate && task.dueDate < today) {
        candidates.push({
          sourceKey: `task-overdue-${task.id}-${task.dueDate}`,
          type: 'task',
          title: `Overdue Task: ${task.title}`,
          message: `Due on ${task.dueDate}${task.subject ? ` (${task.subject})` : ''}.`,
          dueDate: task.dueDate,
        });
      }
    }

    for (const assignment of assignments) {
      if (assignment.status !== 'Submitted') {
        const diff = daysBetween(today, assignment.dueDate);
        if (diff <= 3) {
          candidates.push({
            sourceKey: `assignment-due-${assignment.id}-${assignment.dueDate}-${diff < 0 ? 'over' : 'soon'}`,
            type: 'assignment',
            title:
              diff < 0
                ? `Overdue Assignment: ${assignment.title}`
                : `Upcoming Assignment: ${assignment.title}`,
            message:
              diff < 0
                ? `${assignment.subject} submission was due ${Math.abs(diff)} day(s) ago.`
                : diff === 0
                  ? `${assignment.subject} assignment is due today.`
                  : `${assignment.subject} assignment is due in ${diff} day(s).`,
            dueDate: assignment.dueDate,
          });
        }
      }
    }

    for (const exam of exams) {
      if (exam.preparationStatus !== 'Ready') {
        const diff = daysBetween(today, exam.examDate);
        if (diff >= 0 && diff <= 7) {
          candidates.push({
            sourceKey: `exam-soon-${exam.id}-${exam.examDate}`,
            type: 'exam',
            title: `Exam Approaching: ${exam.examName}`,
            message:
              diff === 0
                ? `${exam.subject} exam is today!`
                : `${exam.subject} (${exam.examType}) is in ${diff} day(s).`,
            dueDate: exam.examDate,
          });
        }
      }
    }

    for (const session of studySessions) {
      if (session.status === 'Scheduled' && session.date === today) {
        candidates.push({
          sourceKey: `study-today-${session.id}-${session.date}`,
          type: 'study',
          title: `Study Session Today: ${session.title}`,
          message: `${session.subject} from ${session.startTime} to ${session.endTime}.`,
          dueDate: session.date,
        });
      }
    }

    for (const item of candidates) {
      if (!existingKeys.has(item.sourceKey) && !syncedKeysRef.current.has(item.sourceKey)) {
        syncedKeysRef.current.add(item.sourceKey);
        void createNotificationDoc(userId, item).catch(() => {
          syncedKeysRef.current.delete(item.sourceKey);
        });
      }
    }
  }, [loading, tasks, assignments, exams, studySessions, notifications, userId]);

  const subjects = useMemo(
    () => (profile?.subjects && profile.subjects.length > 0 ? profile.subjects : DEFAULT_SUBJECTS),
    [profile],
  );

  // --- CRUD Actions ---
  const addTask = useCallback(
    async (values: TaskFormValues) => {
      try {
        const clean = await validateTaskOnServer(values);
        await createTaskDoc(userId, clean);
      } catch (err) {
        throw new Error(parseError(err, 'Failed to create task.'));
      }
    },
    [userId],
  );

  const editTask = useCallback(async (taskId: string, values: TaskFormValues) => {
    try {
      const clean = await validateTaskOnServer(values);
      await updateTaskDoc(taskId, clean);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to update task.'));
    }
  }, []);

  const setTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatusDoc(taskId, status);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to update task status.'));
    }
  }, []);

  const removeTask = useCallback(async (taskId: string) => {
    try {
      await deleteTaskDoc(taskId);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to delete task.'));
    }
  }, []);

  const addAssignment = useCallback(
    async (values: AssignmentFormValues) => {
      try {
        const clean = await validateAcademicEntityOnServer<AssignmentFormValues>(
          'assignment',
          values,
        );
        await createAssignmentDoc(userId, clean);
      } catch (err) {
        throw new Error(parseError(err, 'Failed to create assignment.'));
      }
    },
    [userId],
  );

  const editAssignment = useCallback(async (id: string, values: AssignmentFormValues) => {
    try {
      const clean = await validateAcademicEntityOnServer<AssignmentFormValues>(
        'assignment',
        values,
      );
      await updateAssignmentDoc(id, clean);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to update assignment.'));
    }
  }, []);

  const removeAssignment = useCallback(async (id: string) => {
    try {
      await deleteAssignmentDoc(id);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to delete assignment.'));
    }
  }, []);

  const addStudySession = useCallback(
    async (values: StudySessionFormValues) => {
      try {
        const clean = await validateAcademicEntityOnServer<
          StudySessionFormValues & { durationMinutes: number }
        >('studySession', values);
        await createStudySessionDoc(userId, clean);
      } catch (err) {
        throw new Error(parseError(err, 'Failed to schedule study session.'));
      }
    },
    [userId],
  );

  const editStudySession = useCallback(
    async (id: string, values: StudySessionFormValues) => {
      try {
        const clean = await validateAcademicEntityOnServer<
          StudySessionFormValues & { durationMinutes: number }
        >('studySession', values);
        await updateStudySessionDoc(id, clean);
      } catch (err) {
        throw new Error(parseError(err, 'Failed to update study session.'));
      }
    },
    [],
  );

  const removeStudySession = useCallback(async (id: string) => {
    try {
      await deleteStudySessionDoc(id);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to delete study session.'));
    }
  }, []);

  const addExam = useCallback(
    async (values: ExamFormValues) => {
      try {
        const clean = await validateAcademicEntityOnServer<ExamFormValues>('exam', values);
        await createExamDoc(userId, clean);
      } catch (err) {
        throw new Error(parseError(err, 'Failed to add exam.'));
      }
    },
    [userId],
  );

  const editExam = useCallback(async (id: string, values: ExamFormValues) => {
    try {
      const clean = await validateAcademicEntityOnServer<ExamFormValues>('exam', values);
      await updateExamDoc(id, clean);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to update exam.'));
    }
  }, []);

  const removeExam = useCallback(async (id: string) => {
    try {
      await deleteExamDoc(id);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to delete exam.'));
    }
  }, []);

  const addTimetableEntry = useCallback(
    async (values: TimetableFormValues) => {
      try {
        const clean = await validateAcademicEntityOnServer<TimetableFormValues>(
          'timetable',
          values,
        );
        await createTimetableDoc(userId, clean);
      } catch (err) {
        throw new Error(parseError(err, 'Failed to add timetable class.'));
      }
    },
    [userId],
  );

  const editTimetableEntry = useCallback(async (id: string, values: TimetableFormValues) => {
    try {
      const clean = await validateAcademicEntityOnServer<TimetableFormValues>(
        'timetable',
        values,
      );
      await updateTimetableDoc(id, clean);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to update timetable class.'));
    }
  }, []);

  const removeTimetableEntry = useCallback(async (id: string) => {
    try {
      await deleteTimetableDoc(id);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to delete timetable class.'));
    }
  }, []);

  const addNote = useCallback(
    async (values: NoteFormValues) => {
      try {
        const clean = await validateAcademicEntityOnServer<NoteFormValues>('note', values);
        await createNoteDoc(userId, clean);
      } catch (err) {
        throw new Error(parseError(err, 'Failed to create note.'));
      }
    },
    [userId],
  );

  const editNote = useCallback(async (id: string, values: NoteFormValues) => {
    try {
      const clean = await validateAcademicEntityOnServer<NoteFormValues>('note', values);
      await updateNoteDoc(id, clean);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to update note.'));
    }
  }, []);

  const toggleNotePin = useCallback(async (id: string, isPinned: boolean) => {
    try {
      await toggleNotePinDoc(id, isPinned);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to pin/unpin note.'));
    }
  }, []);

  const removeNote = useCallback(async (id: string) => {
    try {
      await deleteNoteDoc(id);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to delete note.'));
    }
  }, []);

  const addGoal = useCallback(
    async (values: GoalFormValues) => {
      try {
        const clean = await validateAcademicEntityOnServer<GoalFormValues>('goal', values);
        await createGoalDoc(userId, clean);
      } catch (err) {
        throw new Error(parseError(err, 'Failed to create goal.'));
      }
    },
    [userId],
  );

  const editGoal = useCallback(async (id: string, values: GoalFormValues) => {
    try {
      const clean = await validateAcademicEntityOnServer<GoalFormValues>('goal', values);
      await updateGoalDoc(id, clean);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to update goal.'));
    }
  }, []);

  const removeGoal = useCallback(async (id: string) => {
    try {
      await deleteGoalDoc(id);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to delete goal.'));
    }
  }, []);

  const logFocusSession = useCallback(
    async (payload: { mode: FocusMode; durationMinutes: number; subject: string }) => {
      try {
        await createFocusSessionDoc(userId, {
          ...payload,
          date: getTodayStr(),
        });
      } catch (err) {
        throw new Error(parseError(err, 'Failed to record focus session.'));
      }
    },
    [userId],
  );

  const removeFocusSession = useCallback(async (id: string) => {
    try {
      await deleteFocusSessionDoc(id);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to delete focus session.'));
    }
  }, []);

  const addCalendarEvent = useCallback(
    async (values: CalendarEventFormValues) => {
      try {
        const clean = await validateAcademicEntityOnServer<CalendarEventFormValues>(
          'calendarEvent',
          values,
        );
        await createCalendarEventDoc(userId, clean);
      } catch (err) {
        throw new Error(parseError(err, 'Failed to create calendar event.'));
      }
    },
    [userId],
  );

  const editCalendarEvent = useCallback(async (id: string, values: CalendarEventFormValues) => {
    try {
      const clean = await validateAcademicEntityOnServer<CalendarEventFormValues>(
        'calendarEvent',
        values,
      );
      await updateCalendarEventDoc(id, clean);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to update calendar event.'));
    }
  }, []);

  const removeCalendarEvent = useCallback(async (id: string) => {
    try {
      await deleteCalendarEventDoc(id);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to delete calendar event.'));
    }
  }, []);

  const saveSettings = useCallback(
    async (
      updates: Partial<
        Pick<
          UserProfile,
          | 'displayName'
          | 'weeklyStudyGoalHours'
          | 'defaultFocusMinutes'
          | 'defaultShortBreakMinutes'
          | 'defaultLongBreakMinutes'
          | 'subjects'
        >
      >,
    ) => {
      try {
        await updateUserProfile(userId, updates);
      } catch (err) {
        throw new Error(parseError(err, 'Failed to save settings.'));
      }
    },
    [userId],
  );

  const markNotificationRead = useCallback(async (id: string, isRead = true) => {
    try {
      await markNotificationReadDoc(id, isRead);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to update notification.'));
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(unread.map((n) => markNotificationReadDoc(n.id, true)));
  }, [notifications]);

  const removeNotification = useCallback(async (id: string) => {
    try {
      await deleteNotificationDoc(id);
    } catch (err) {
      throw new Error(parseError(err, 'Failed to delete notification.'));
    }
  }, []);

  return {
    profile,
    subjects,
    tasks,
    assignments,
    studySessions,
    exams,
    timetable,
    notes,
    goals,
    focusSessions,
    notifications,
    calendarEvents,
    loading,
    error,
    addTask,
    editTask,
    setTaskStatus,
    removeTask,
    addAssignment,
    editAssignment,
    removeAssignment,
    addStudySession,
    editStudySession,
    removeStudySession,
    addExam,
    editExam,
    removeExam,
    addTimetableEntry,
    editTimetableEntry,
    removeTimetableEntry,
    addNote,
    editNote,
    toggleNotePin,
    removeNote,
    addGoal,
    editGoal,
    removeGoal,
    logFocusSession,
    removeFocusSession,
    addCalendarEvent,
    editCalendarEvent,
    removeCalendarEvent,
    saveSettings,
    markNotificationRead,
    markAllNotificationsRead,
    removeNotification,
  };
}
