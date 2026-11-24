import { getCurrentIdToken, handleExpiredSession } from './authService.ts';
import type { Task, TaskFormValues } from '../types/studyflow.ts';

interface ValidateResponse<T> {
  valid: boolean;
  sanitized?: T;
  errors?: Record<string, string>;
  error?: string;
}

async function authorizedFetch(
  input: string,
  init: RequestInit,
  missingAuthMessage: string,
): Promise<Response> {
  const token = await getCurrentIdToken();
  if (!token) throw new Error(missingAuthMessage);

  const buildHeaders = (authToken: string) => ({
    ...(init.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${authToken}`,
  });

  let response = await fetch(input, { ...init, headers: buildHeaders(token) });
  if (response.status === 401) {
    const refreshedToken = await getCurrentIdToken(true);
    if (!refreshedToken) {
      await handleExpiredSession();
      throw new Error('Your session has expired. Please sign in again.');
    }
    response = await fetch(input, { ...init, headers: buildHeaders(refreshedToken) });
    if (response.status === 401) {
      await handleExpiredSession();
      throw new Error('Your session has expired. Please sign in again.');
    }
  }
  return response;
}

export async function validateTaskOnServer(values: TaskFormValues): Promise<TaskFormValues> {
  const response = await authorizedFetch(
    '/api/tasks/validate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    },
    'You must be signed in to save tasks.',
  );

  const data = (await response.json()) as ValidateResponse<TaskFormValues>;
  if (!response.ok || !data.valid || !data.sanitized) {
    const firstFieldError = data.errors ? Object.values(data.errors)[0] : undefined;
    throw new Error(firstFieldError || data.error || 'Task validation failed.');
  }
  return data.sanitized;
}

export async function validateAcademicEntityOnServer<T>(
  entity:
    | 'assignment'
    | 'studySession'
    | 'exam'
    | 'timetable'
    | 'note'
    | 'goal'
    | 'calendarEvent',
  values: unknown,
): Promise<T> {
  const response = await authorizedFetch(
    `/api/academic/validate/${entity}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    },
    'You must be signed in to save data.',
  );

  const data = (await response.json()) as ValidateResponse<T>;
  if (!response.ok || !data.valid || !data.sanitized) {
    const firstFieldError = data.errors ? Object.values(data.errors)[0] : undefined;
    throw new Error(firstFieldError || data.error || 'Validation failed.');
  }
  return data.sanitized;
}

export async function exportTasksCsv(tasks: Task[]): Promise<void> {
  const response = await authorizedFetch(
    '/api/tasks/export',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: tasks.map((task) => ({
          userId: task.userId,
          title: task.title,
          category: task.category,
          subject: task.subject,
          description: task.description,
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          priority: task.priority,
          status: task.status,
          createdAtIso: task.createdAt ? task.createdAt.toISOString() : '',
        })),
      }),
    },
    'You must be signed in to export tasks.',
  );

  if (!response.ok) {
    const errBody = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || 'Failed to export tasks.');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `studyflow-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
