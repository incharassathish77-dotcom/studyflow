import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
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

function toDate(val: unknown): Date | null {
  return val instanceof Timestamp ? val.toDate() : null;
}

function subscribeUserCollection<T>(
  collectionName: string,
  userId: string,
  mapper: (id: string, data: Record<string, unknown>) => T,
  onData: (items: T[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(db, collectionName), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) =>
        mapper(docSnap.id, docSnap.data() as Record<string, unknown>),
      );
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

const profileInitInFlight = new Map<string, Promise<void>>();

function formatOffsetDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function seedGuestDemoWorkspace(userId: string): Promise<void> {
  const today = formatOffsetDate(0);
  const tomorrow = formatOffsetDate(1);
  const inTwoDays = formatOffsetDate(2);
  const inFourDays = formatOffsetDate(4);
  const inSixDays = formatOffsetDate(6);
  const inTenDays = formatOffsetDate(10);
  const yesterday = formatOffsetDate(-1);

  await Promise.all([
    createTaskDoc(userId, {
      title: 'Review B+ Tree indexing & query optimization notes',
      description: 'Summarize page split rules and clustered vs. non-clustered indexes for lab.',
      category: 'Academic',
      subject: 'Database Systems',
      dueDate: today,
      dueTime: '17:00',
      priority: 'High',
      status: 'In Progress',
      completedAt: '',
    }),
    createTaskDoc(userId, {
      title: 'Implement Dijkstra shortest path visualizer',
      description: 'Write priority-queue implementation and test weighted directed graph cases.',
      category: 'Coding Practice',
      subject: 'Algorithms & Data Structures',
      dueDate: tomorrow,
      dueTime: '20:00',
      priority: 'High',
      status: 'Pending',
      completedAt: '',
    }),
    createTaskDoc(userId, {
      title: 'Draft UML sequence diagram for semester project',
      description: 'Outline authentication, submission, and grading API sequences.',
      category: 'Projects',
      subject: 'Software Engineering',
      dueDate: inTwoDays,
      dueTime: '15:30',
      priority: 'Medium',
      status: 'Pending',
      completedAt: '',
    }),
    createTaskDoc(userId, {
      title: 'Complete Linear Algebra problem set #4',
      description: 'Eigenvalues, diagonalization proofs, and orthogonality exercises.',
      category: 'Academic',
      subject: 'Mathematics',
      dueDate: yesterday,
      dueTime: '18:00',
      priority: 'Medium',
      status: 'Completed',
      completedAt: new Date().toISOString(),
    }),
    createAssignmentDoc(userId, {
      title: 'Relational Schema Normalization Report',
      subject: 'Database Systems',
      description: 'Convert ER diagram to 3NF/BCNF and document functional dependencies.',
      assignedDate: yesterday,
      dueDate: inTwoDays,
      priority: 'High',
      status: 'In Progress',
    }),
    createAssignmentDoc(userId, {
      title: 'Process Scheduling Simulator (Lab 3)',
      subject: 'Operating Systems',
      description: 'Compare FCFS, SJF, and Round Robin average turnaround times.',
      assignedDate: yesterday,
      dueDate: inFourDays,
      priority: 'Medium',
      status: 'Not Started',
    }),
    createAssignmentDoc(userId, {
      title: 'Asymptotic Complexity Analysis Worksheet',
      subject: 'Algorithms & Data Structures',
      description: 'Master theorem recurrences and amortized cost proofs.',
      assignedDate: formatOffsetDate(-5),
      dueDate: yesterday,
      priority: 'Low',
      status: 'Submitted',
    }),
    createStudySessionDoc(userId, {
      subject: 'Database Systems',
      title: 'SQL Joins & Transaction Isolation Deep Dive',
      description: 'Practice phantom read scenarios and ACID isolation levels.',
      date: today,
      startTime: '18:00',
      endTime: '19:30',
      durationMinutes: 90,
      studyGoal: 'Complete 12 query tuning exercises',
      status: 'Scheduled',
    }),
    createStudySessionDoc(userId, {
      subject: 'Operating Systems',
      title: 'Deadlock Avoidance & Banker Algorithm',
      description: 'Work through resource allocation graphs and safety sequence examples.',
      date: tomorrow,
      startTime: '16:00',
      endTime: '17:30',
      durationMinutes: 90,
      studyGoal: 'Solve 5 past midterm questions',
      status: 'Scheduled',
    }),
    createStudySessionDoc(userId, {
      subject: 'Algorithms & Data Structures',
      title: 'Dynamic Programming Patterns Review',
      description: 'Knapsack, LCS, and DAG shortest paths.',
      date: yesterday,
      startTime: '19:00',
      endTime: '20:30',
      durationMinutes: 90,
      studyGoal: 'Master state transition tables',
      status: 'Completed',
    }),
    createExamDoc(userId, {
      examName: 'Database Systems Midterm',
      subject: 'Database Systems',
      examDate: inSixDays,
      examTime: '09:30',
      examType: 'Midterm',
      preparationStatus: 'In Progress',
      importantTopics: 'Relational Algebra, BCNF Normalization, B+ Trees, Two-Phase Locking',
      notes: 'Bring non-programmable calculator and review Lecture 4-8 slides.',
    }),
    createExamDoc(userId, {
      examName: 'Algorithms Quiz #2',
      subject: 'Algorithms & Data Structures',
      examDate: inTenDays,
      examTime: '14:00',
      examType: 'Quiz',
      preparationStatus: 'Not Started',
      importantTopics: 'Greedy proofs, Dijkstra, Bellman-Ford, Topological Sort',
      notes: 'Closed book, 45 minutes.',
    }),
    createTimetableDoc(userId, {
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:30',
      subject: 'Database Systems',
      faculty: 'Dr. R. Nair',
      classroom: 'Hall B-204',
    }),
    createTimetableDoc(userId, {
      dayOfWeek: 'Tuesday',
      startTime: '11:00',
      endTime: '12:30',
      subject: 'Algorithms & Data Structures',
      faculty: 'Prof. S. Menon',
      classroom: 'CS-102',
    }),
    createTimetableDoc(userId, {
      dayOfWeek: 'Wednesday',
      startTime: '14:00',
      endTime: '15:30',
      subject: 'Operating Systems',
      faculty: 'Dr. A. Kapoor',
      classroom: 'Lab C-301',
    }),
    createTimetableDoc(userId, {
      dayOfWeek: 'Thursday',
      startTime: '10:00',
      endTime: '11:30',
      subject: 'Software Engineering',
      faculty: 'Prof. M. Iyer',
      classroom: 'Room 408',
    }),
    createNoteDoc(userId, {
      title: 'ACID Properties & Concurrency Control Cheatsheet',
      subject: 'Database Systems',
      content:
        'Atomicity (undo logs), Consistency (constraints), Isolation (2PL / MVCC), Durability (redo WAL).\n\nStrict 2PL prevents cascading aborts by holding exclusive locks until commit.',
      isPinned: true,
    }),
    createNoteDoc(userId, {
      title: 'Graph Traversal Time Complexities',
      subject: 'Algorithms & Data Structures',
      content:
        'BFS / DFS: O(V + E)\nDijkstra (binary heap): O((V + E) log V)\nBellman-Ford: O(V * E)\nFloyd-Warshall: O(V^3)',
      isPinned: false,
    }),
    createGoalDoc(userId, {
      title: 'Weekly Deep Study Hours',
      description: 'Maintain consistent focused study blocks ahead of midterms.',
      cadence: 'Weekly',
      targetValue: 14,
      currentValue: 8,
      unit: 'hours',
      status: 'Active',
      completedAt: '',
    }),
    createGoalDoc(userId, {
      title: 'Daily Coding Practice Problems',
      description: 'Solve graph and DP problems every day.',
      cadence: 'Daily',
      targetValue: 3,
      currentValue: 2,
      unit: 'problems',
      status: 'Active',
      completedAt: '',
    }),
    createFocusSessionDoc(userId, {
      mode: 'focus',
      durationMinutes: 25,
      subject: 'Database Systems',
      date: today,
    }),
    createFocusSessionDoc(userId, {
      mode: 'focus',
      durationMinutes: 50,
      subject: 'Algorithms & Data Structures',
      date: yesterday,
    }),
    createCalendarEventDoc(userId, {
      title: 'Faculty Project Milestone Review',
      description: 'Present system architecture and database schema in CS Lab.',
      date: inTwoDays,
      startTime: '11:00',
      endTime: '12:00',
      eventType: 'Personal Event',
    }),
  ]);
}

// --- 1. User Profile ---
export async function ensureUserProfile(user: User, explicitDisplayName?: string): Promise<void> {
  const existingPromise = profileInitInFlight.get(user.uid);
  if (existingPromise) {
    await existingPromise;
    return;
  }

  const task = (async () => {
    const path = `users/${user.uid}`;
    const ref = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(ref);
      const resolvedName = (
        explicitDisplayName ||
        user.displayName ||
        (user.isAnonymous ? 'Faculty Guest' : user.email?.split('@')[0]) ||
        'Student'
      )
        .trim()
        .slice(0, 100);

      if (!snap.exists()) {
        await setDoc(ref, {
          uid: user.uid,
          displayName: resolvedName,
          email: (user.email || '').slice(0, 160),
          photoURL: (user.photoURL || '').slice(0, 500),
          weeklyStudyGoalHours: 14,
          defaultFocusMinutes: 25,
          defaultShortBreakMinutes: 5,
          defaultLongBreakMinutes: 15,
          subjects: DEFAULT_SUBJECTS,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (user.isAnonymous) {
          await seedGuestDemoWorkspace(user.uid);
        }
      } else if (explicitDisplayName && explicitDisplayName.trim()) {
        const currentName = String(snap.data().displayName ?? '').trim();
        if (!currentName || currentName === 'Student') {
          await updateDoc(ref, {
            displayName: resolvedName,
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  })();

  profileInitInFlight.set(user.uid, task);
  try {
    await task;
  } finally {
    profileInitInFlight.delete(user.uid);
  }
}

export function subscribeUserProfile(
  userId: string,
  onData: (profile: UserProfile | null) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, 'users', userId),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const d = snap.data();
      onData({
        uid: String(d.uid ?? userId),
        displayName: String(d.displayName ?? 'Student'),
        email: String(d.email ?? ''),
        photoURL: String(d.photoURL ?? ''),
        weeklyStudyGoalHours: Number(d.weeklyStudyGoalHours ?? 14),
        defaultFocusMinutes: Number(d.defaultFocusMinutes ?? 25),
        defaultShortBreakMinutes: Number(d.defaultShortBreakMinutes ?? 5),
        defaultLongBreakMinutes: Number(d.defaultLongBreakMinutes ?? 15),
        subjects: Array.isArray(d.subjects) ? d.subjects.map(String) : DEFAULT_SUBJECTS,
        createdAt: toDate(d.createdAt),
        updatedAt: toDate(d.updatedAt),
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

export async function updateUserProfile(
  userId: string,
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
): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- 2. Tasks ---
export function subscribeTasks(
  userId: string,
  onData: (items: Task[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return subscribeUserCollection(
    'tasks',
    userId,
    (id, d) => ({
      id,
      userId: String(d.userId ?? ''),
      title: String(d.title ?? ''),
      description: String(d.description ?? ''),
      category: (d.category as Task['category']) ?? 'Academic',
      subject: String(d.subject ?? ''),
      dueDate: String(d.dueDate ?? ''),
      dueTime: String(d.dueTime ?? ''),
      priority: (d.priority as Task['priority']) ?? 'Medium',
      status: (d.status as TaskStatus) ?? 'Pending',
      completedAt: String(d.completedAt ?? ''),
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    }),
    onData,
    onError,
  );
}

export async function createTaskDoc(userId: string, values: TaskFormValues): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'tasks'), {
      userId,
      title: values.title.trim().slice(0, 140),
      description: values.description.trim().slice(0, 1200),
      category: values.category,
      subject: values.subject.trim().slice(0, 80),
      dueDate: values.dueDate.trim(),
      dueTime: values.dueTime.trim(),
      priority: values.priority,
      status: values.status,
      completedAt:
        values.status === 'Completed' ? values.completedAt || new Date().toISOString() : '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'tasks');
  }
}

export async function updateTaskDoc(taskId: string, values: TaskFormValues): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      title: values.title.trim().slice(0, 140),
      description: values.description.trim().slice(0, 1200),
      category: values.category,
      subject: values.subject.trim().slice(0, 80),
      dueDate: values.dueDate.trim(),
      dueTime: values.dueTime.trim(),
      priority: values.priority,
      status: values.status,
      completedAt:
        values.status === 'Completed' ? values.completedAt || new Date().toISOString() : '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateTaskStatusDoc(taskId: string, status: TaskStatus): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      status,
      completedAt: status === 'Completed' ? new Date().toISOString() : '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTaskDoc(taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
  }
}

// --- 3. Assignments ---
export function subscribeAssignments(
  userId: string,
  onData: (items: Assignment[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return subscribeUserCollection(
    'assignments',
    userId,
    (id, d) => ({
      id,
      userId: String(d.userId ?? ''),
      title: String(d.title ?? ''),
      subject: String(d.subject ?? ''),
      description: String(d.description ?? ''),
      assignedDate: String(d.assignedDate ?? ''),
      dueDate: String(d.dueDate ?? ''),
      priority: (d.priority as Assignment['priority']) ?? 'Medium',
      status: (d.status as Assignment['status']) ?? 'Not Started',
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    }),
    onData,
    onError,
  );
}

export async function createAssignmentDoc(
  userId: string,
  values: AssignmentFormValues,
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'assignments'), {
      userId,
      ...values,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'assignments');
  }
}

export async function updateAssignmentDoc(
  assignmentId: string,
  values: AssignmentFormValues,
): Promise<void> {
  const path = `assignments/${assignmentId}`;
  try {
    await updateDoc(doc(db, 'assignments', assignmentId), {
      ...values,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAssignmentDoc(assignmentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'assignments', assignmentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `assignments/${assignmentId}`);
  }
}

// --- 4. Study Sessions ---
export function subscribeStudySessions(
  userId: string,
  onData: (items: StudySession[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return subscribeUserCollection(
    'studySessions',
    userId,
    (id, d) => ({
      id,
      userId: String(d.userId ?? ''),
      subject: String(d.subject ?? ''),
      title: String(d.title ?? ''),
      description: String(d.description ?? ''),
      date: String(d.date ?? ''),
      startTime: String(d.startTime ?? ''),
      endTime: String(d.endTime ?? ''),
      durationMinutes: Number(d.durationMinutes ?? 60),
      studyGoal: String(d.studyGoal ?? ''),
      status: (d.status as StudySession['status']) ?? 'Scheduled',
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    }),
    onData,
    onError,
  );
}

export async function createStudySessionDoc(
  userId: string,
  values: StudySessionFormValues & { durationMinutes: number },
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'studySessions'), {
      userId,
      ...values,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'studySessions');
  }
}

export async function updateStudySessionDoc(
  sessionId: string,
  values: StudySessionFormValues & { durationMinutes: number },
): Promise<void> {
  const path = `studySessions/${sessionId}`;
  try {
    await updateDoc(doc(db, 'studySessions', sessionId), {
      ...values,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStudySessionDoc(sessionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'studySessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `studySessions/${sessionId}`);
  }
}

// --- 5. Exams ---
export function subscribeExams(
  userId: string,
  onData: (items: Exam[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return subscribeUserCollection(
    'exams',
    userId,
    (id, d) => ({
      id,
      userId: String(d.userId ?? ''),
      examName: String(d.examName ?? ''),
      subject: String(d.subject ?? ''),
      examDate: String(d.examDate ?? ''),
      examTime: String(d.examTime ?? ''),
      examType: (d.examType as Exam['examType']) ?? 'Midterm',
      preparationStatus: (d.preparationStatus as Exam['preparationStatus']) ?? 'Not Started',
      importantTopics: String(d.importantTopics ?? ''),
      notes: String(d.notes ?? ''),
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    }),
    onData,
    onError,
  );
}

export async function createExamDoc(userId: string, values: ExamFormValues): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'exams'), {
      userId,
      ...values,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'exams');
  }
}

export async function updateExamDoc(examId: string, values: ExamFormValues): Promise<void> {
  try {
    await updateDoc(doc(db, 'exams', examId), {
      ...values,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `exams/${examId}`);
  }
}

export async function deleteExamDoc(examId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'exams', examId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `exams/${examId}`);
  }
}

// --- 6. Timetable ---
export function subscribeTimetable(
  userId: string,
  onData: (items: TimetableEntry[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return subscribeUserCollection(
    'timetable',
    userId,
    (id, d) => ({
      id,
      userId: String(d.userId ?? ''),
      dayOfWeek: (d.dayOfWeek as TimetableEntry['dayOfWeek']) ?? 'Monday',
      startTime: String(d.startTime ?? ''),
      endTime: String(d.endTime ?? ''),
      subject: String(d.subject ?? ''),
      faculty: String(d.faculty ?? ''),
      classroom: String(d.classroom ?? ''),
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    }),
    onData,
    onError,
  );
}

export async function createTimetableDoc(
  userId: string,
  values: TimetableFormValues,
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'timetable'), {
      userId,
      ...values,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'timetable');
  }
}

export async function updateTimetableDoc(
  entryId: string,
  values: TimetableFormValues,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'timetable', entryId), {
      ...values,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `timetable/${entryId}`);
  }
}

export async function deleteTimetableDoc(entryId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'timetable', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `timetable/${entryId}`);
  }
}

// --- 7. Notes ---
export function subscribeNotes(
  userId: string,
  onData: (items: Note[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return subscribeUserCollection(
    'notes',
    userId,
    (id, d) => ({
      id,
      userId: String(d.userId ?? ''),
      title: String(d.title ?? ''),
      subject: String(d.subject ?? ''),
      content: String(d.content ?? ''),
      isPinned: Boolean(d.isPinned),
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    }),
    onData,
    onError,
  );
}

export async function createNoteDoc(userId: string, values: NoteFormValues): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'notes'), {
      userId,
      ...values,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'notes');
  }
}

export async function updateNoteDoc(noteId: string, values: NoteFormValues): Promise<void> {
  try {
    await updateDoc(doc(db, 'notes', noteId), {
      ...values,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notes/${noteId}`);
  }
}

export async function toggleNotePinDoc(noteId: string, isPinned: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'notes', noteId), {
      isPinned,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notes/${noteId}`);
  }
}

export async function deleteNoteDoc(noteId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notes/${noteId}`);
  }
}

// --- 8. Goals ---
export function subscribeGoals(
  userId: string,
  onData: (items: Goal[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return subscribeUserCollection(
    'goals',
    userId,
    (id, d) => ({
      id,
      userId: String(d.userId ?? ''),
      title: String(d.title ?? ''),
      description: String(d.description ?? ''),
      cadence: (d.cadence as Goal['cadence']) ?? 'Daily',
      targetValue: Number(d.targetValue ?? 1),
      currentValue: Number(d.currentValue ?? 0),
      unit: String(d.unit ?? 'tasks'),
      status: (d.status as Goal['status']) ?? 'Active',
      completedAt: String(d.completedAt ?? ''),
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    }),
    onData,
    onError,
  );
}

export async function createGoalDoc(userId: string, values: GoalFormValues): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'goals'), {
      userId,
      ...values,
      completedAt:
        values.status === 'Completed' ? values.completedAt || new Date().toISOString() : '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'goals');
  }
}

export async function updateGoalDoc(goalId: string, values: GoalFormValues): Promise<void> {
  try {
    await updateDoc(doc(db, 'goals', goalId), {
      ...values,
      completedAt:
        values.status === 'Completed' ? values.completedAt || new Date().toISOString() : '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `goals/${goalId}`);
  }
}

export async function deleteGoalDoc(goalId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'goals', goalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `goals/${goalId}`);
  }
}

// --- 9. Focus Sessions ---
export function subscribeFocusSessions(
  userId: string,
  onData: (items: FocusSession[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return subscribeUserCollection(
    'focusSessions',
    userId,
    (id, d) => ({
      id,
      userId: String(d.userId ?? ''),
      mode: (d.mode as FocusMode) ?? 'focus',
      durationMinutes: Number(d.durationMinutes ?? 25),
      subject: String(d.subject ?? ''),
      date: String(d.date ?? ''),
      completedAt: toDate(d.completedAt),
      createdAt: toDate(d.createdAt),
    }),
    onData,
    onError,
  );
}

export async function createFocusSessionDoc(
  userId: string,
  payload: { mode: FocusMode; durationMinutes: number; subject: string; date: string },
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'focusSessions'), {
      userId,
      mode: payload.mode,
      durationMinutes: payload.durationMinutes,
      subject: payload.subject.trim().slice(0, 80),
      date: payload.date,
      completedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'focusSessions');
  }
}

export async function deleteFocusSessionDoc(focusId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'focusSessions', focusId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `focusSessions/${focusId}`);
  }
}

// --- 10. Notifications ---
export function subscribeNotifications(
  userId: string,
  onData: (items: AppNotification[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return subscribeUserCollection(
    'notifications',
    userId,
    (id, d) => ({
      id,
      userId: String(d.userId ?? ''),
      sourceKey: String(d.sourceKey ?? ''),
      type: (d.type as NotificationType) ?? 'task',
      title: String(d.title ?? ''),
      message: String(d.message ?? ''),
      dueDate: String(d.dueDate ?? ''),
      isRead: Boolean(d.isRead),
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    }),
    onData,
    onError,
  );
}

export async function createNotificationDoc(
  userId: string,
  payload: {
    sourceKey: string;
    type: NotificationType;
    title: string;
    message: string;
    dueDate: string;
  },
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'notifications'), {
      userId,
      sourceKey: payload.sourceKey.slice(0, 128),
      type: payload.type,
      title: payload.title.slice(0, 140),
      message: payload.message.slice(0, 400),
      dueDate: payload.dueDate.slice(0, 10),
      isRead: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'notifications');
  }
}

export async function markNotificationReadDoc(
  notificationId: string,
  isRead: boolean,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export async function deleteNotificationDoc(notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notifications/${notificationId}`);
  }
}

// --- 11. Calendar Events ---
export function subscribeCalendarEvents(
  userId: string,
  onData: (items: CalendarEvent[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return subscribeUserCollection(
    'calendarEvents',
    userId,
    (id, d) => ({
      id,
      userId: String(d.userId ?? ''),
      title: String(d.title ?? ''),
      description: String(d.description ?? ''),
      date: String(d.date ?? ''),
      startTime: String(d.startTime ?? ''),
      endTime: String(d.endTime ?? ''),
      eventType: (d.eventType as CalendarEvent['eventType']) ?? 'Personal Event',
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    }),
    onData,
    onError,
  );
}

export async function createCalendarEventDoc(
  userId: string,
  values: CalendarEventFormValues,
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'calendarEvents'), {
      userId,
      ...values,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'calendarEvents');
  }
}

export async function updateCalendarEventDoc(
  eventId: string,
  values: CalendarEventFormValues,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'calendarEvents', eventId), {
      ...values,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `calendarEvents/${eventId}`);
  }
}

export async function deleteCalendarEventDoc(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'calendarEvents', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `calendarEvents/${eventId}`);
  }
}
