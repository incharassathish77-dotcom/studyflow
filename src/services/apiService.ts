import type { Task, TaskFormValues } from '../types/studyflow.ts';

interface ValidateResponse<T> {
  valid: boolean;
  sanitized?: T;
  errors?: Record<string, string>;
  error?: string;
}

export async function validateTaskOnServer(values: TaskFormValues): Promise<TaskFormValues> {
  const response = await fetch('/api/tasks/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });

  const data = (await response.json()) as ValidateResponse<TaskFormValues>;
  if (!response.ok || !data.valid || !data.sanitized) {
    const firstFieldError = data.errors ? Object.values(data.errors)[0] : undefined;
    throw new Error(firstFieldError || data.error || 'Task validation failed.');
  }
  return data.sanitized;
}

export async function exportTasksCsv(tasks: Task[]): Promise<void> {
  const response = await fetch('/api/tasks/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tasks: tasks.map((task) => ({
        title: task.title,
        category: task.category,
        description: task.description,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        priority: task.priority,
        status: task.status,
        createdAtIso: task.createdAt ? task.createdAt.toISOString() : '',
      })),
    }),
  });

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
