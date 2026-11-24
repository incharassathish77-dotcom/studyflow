import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import type {
  PriorityLevel,
  Task,
  TaskCategory,
  TaskFormValues,
  TaskStatus,
} from '../types/studyflow.ts';

function toDate(val: unknown): Date | null {
  return val instanceof Timestamp ? val.toDate() : null;
}

function mapTaskDoc(id: string, d: Record<string, unknown>): Task {
  return {
    id,
    title: String(d.title ?? ''),
    description: String(d.description ?? ''),
    category: (d.category as TaskCategory) ?? 'Academic',
    dueDate: String(d.dueDate ?? ''),
    dueTime: String(d.dueTime ?? ''),
    priority: (d.priority as PriorityLevel) ?? 'Medium',
    status: (d.status as TaskStatus) ?? 'Pending',
    completedAt: String(d.completedAt ?? ''),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export function subscribeTasks(
  onData: (items: Task[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(db, 'tasks'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) =>
        mapTaskDoc(docSnap.id, docSnap.data() as Record<string, unknown>),
      );
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'tasks');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

export async function fetchTasksOnce(): Promise<Task[]> {
  try {
    const snapshot = await getDocs(query(collection(db, 'tasks')));
    return snapshot.docs.map((docSnap) =>
      mapTaskDoc(docSnap.id, docSnap.data() as Record<string, unknown>),
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'tasks');
  }
}

export async function createTaskDoc(values: TaskFormValues): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'tasks'), {
      title: values.title.trim().slice(0, 140),
      description: values.description.trim().slice(0, 1200),
      category: values.category,
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

export async function updateTaskPriorityDoc(
  taskId: string,
  priority: PriorityLevel,
): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      priority,
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
