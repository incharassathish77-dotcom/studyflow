import { useCallback, useEffect, useState } from 'react';
import { validateTaskOnServer } from '../services/apiService.ts';
import {
  createTaskDoc,
  deleteTaskDoc,
  fetchTasksOnce,
  subscribeTasks,
  updateTaskDoc,
  updateTaskPriorityDoc,
  updateTaskStatusDoc,
} from '../services/firestoreService.ts';
import type {
  PriorityLevel,
  Task,
  TaskFormValues,
  TaskStatus,
} from '../types/studyflow.ts';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeTasks(
      (items) => {
        setTasks(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      const items = await fetchTasksOnce();
      setTasks(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh tasks.');
    }
  }, []);

  const addTask = useCallback(async (values: TaskFormValues) => {
    const sanitized = await validateTaskOnServer(values);
    await createTaskDoc(sanitized);
  }, []);

  const editTask = useCallback(async (taskId: string, values: TaskFormValues) => {
    const sanitized = await validateTaskOnServer(values);
    await updateTaskDoc(taskId, sanitized);
  }, []);

  const setTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    await updateTaskStatusDoc(taskId, status);
  }, []);

  const setTaskPriority = useCallback(async (taskId: string, priority: PriorityLevel) => {
    await updateTaskPriorityDoc(taskId, priority);
  }, []);

  const removeTask = useCallback(async (taskId: string) => {
    await deleteTaskDoc(taskId);
  }, []);

  return {
    tasks,
    loading,
    error,
    refreshTasks,
    addTask,
    editTask,
    setTaskStatus,
    setTaskPriority,
    removeTask,
  };
}
