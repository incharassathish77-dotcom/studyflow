import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

export const TASK_LIMITS = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 140,
  DESCRIPTION_MAX_LENGTH: 1200,
  SUBJECT_MAX_LENGTH: 80,
  CATEGORIES: [
    'Academic',
    'Personal',
    'Projects',
    'Coding Practice',
    'College Activities',
    'Other',
  ] as const,
  PRIORITIES: ['Low', 'Medium', 'High'] as const,
  STATUSES: ['Pending', 'In Progress', 'Completed'] as const,
};

export function isValidCalendarDate(dateStr: string, allowEmpty = true): boolean {
  if (dateStr === '') return allowEmpty;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function isValidTime24(timeStr: string, allowEmpty = true): boolean {
  if (timeStr === '') return allowEmpty;
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return false;
  const [hStr, mStr] = timeStr.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function escapeCsvCell(value: unknown): string {
  const str = typeof value === 'string' ? value : String(value ?? '');
  const trimmed = str.replace(/\r?\n/g, ' ');
  const neutralized = /^[=+\-@\t\r]/.test(trimmed) ? `'${trimmed}` : trimmed;
  if (/[",]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

router.get('/session', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    authenticated: true,
    user: req.user,
    limits: TASK_LIMITS,
  });
});

router.post('/validate', requireAuth, (req: AuthenticatedRequest, res) => {
  const body = req.body as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({ valid: false, error: 'Request body must be a JSON object.' });
    return;
  }

  const errors: Record<string, string> = {};

  const rawTitle = body.title;
  const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
  if (typeof rawTitle !== 'string' || title.length < TASK_LIMITS.TITLE_MIN_LENGTH) {
    errors.title = 'Task title is required.';
  } else if (title.length > TASK_LIMITS.TITLE_MAX_LENGTH) {
    errors.title = `Task title must be ${TASK_LIMITS.TITLE_MAX_LENGTH} characters or fewer.`;
  }

  const rawDescription = body.description ?? '';
  if (typeof rawDescription !== 'string') {
    errors.description = 'Description must be text.';
  }
  const description = typeof rawDescription === 'string' ? rawDescription.trim() : '';
  if (description.length > TASK_LIMITS.DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${TASK_LIMITS.DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }

  const category = body.category ?? 'Academic';
  if (
    typeof category !== 'string' ||
    !TASK_LIMITS.CATEGORIES.includes(category as (typeof TASK_LIMITS.CATEGORIES)[number])
  ) {
    errors.category = 'Please choose a valid task category.';
  }

  const rawSubject = body.subject ?? '';
  if (typeof rawSubject !== 'string') {
    errors.subject = 'Subject must be text.';
  }
  const subject = typeof rawSubject === 'string' ? rawSubject.trim() : '';
  if (subject.length > TASK_LIMITS.SUBJECT_MAX_LENGTH) {
    errors.subject = `Subject must be ${TASK_LIMITS.SUBJECT_MAX_LENGTH} characters or fewer.`;
  }

  const rawDueDate = body.dueDate ?? '';
  if (typeof rawDueDate !== 'string') {
    errors.dueDate = 'Due date must be a string.';
  }
  const dueDate = typeof rawDueDate === 'string' ? rawDueDate.trim() : '';
  if (!isValidCalendarDate(dueDate, true)) {
    errors.dueDate = 'Please enter a valid due date.';
  }

  const rawDueTime = body.dueTime ?? '';
  if (typeof rawDueTime !== 'string') {
    errors.dueTime = 'Due time must be a string.';
  }
  const dueTime = typeof rawDueTime === 'string' ? rawDueTime.trim() : '';
  if (!isValidTime24(dueTime, true)) {
    errors.dueTime = 'Please enter a valid 24-hour time (HH:MM).';
  }

  const priority = body.priority;
  if (
    typeof priority !== 'string' ||
    !TASK_LIMITS.PRIORITIES.includes(priority as (typeof TASK_LIMITS.PRIORITIES)[number])
  ) {
    errors.priority = 'Priority must be Low, Medium, or High.';
  }

  const status = body.status ?? 'Pending';
  if (
    typeof status !== 'string' ||
    !TASK_LIMITS.STATUSES.includes(status as (typeof TASK_LIMITS.STATUSES)[number])
  ) {
    errors.status = 'Status must be Pending, In Progress, or Completed.';
  }

  const completedAt =
    status === 'Completed'
      ? typeof body.completedAt === 'string' && body.completedAt
        ? body.completedAt.slice(0, 32)
        : new Date().toISOString()
      : '';

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ valid: false, errors });
    return;
  }

  res.json({
    valid: true,
    sanitized: {
      title,
      description,
      category,
      subject,
      dueDate,
      dueTime,
      priority,
      status,
      completedAt,
    },
  });
});

router.post('/export', requireAuth, (req: AuthenticatedRequest, res) => {
  const body = req.body as { tasks?: unknown } | null;
  if (!body || !Array.isArray(body.tasks)) {
    res.status(400).json({ error: 'Tasks array is required for export.' });
    return;
  }
  if (body.tasks.length > 1000) {
    res.status(400).json({ error: 'Export is limited to 1000 tasks per request.' });
    return;
  }

  const header = [
    'Title',
    'Category',
    'Subject',
    'Description',
    'Due Date',
    'Due Time',
    'Priority',
    'Status',
    'Created At',
  ].join(',');
  const rows: string[] = [header];

  for (const item of body.tasks) {
    if (!item || typeof item !== 'object') continue;
    const task = item as Record<string, unknown>;
    if (task.userId !== req.user?.uid) {
      res.status(403).json({ error: 'Cannot export tasks belonging to another user.' });
      return;
    }

    rows.push(
      [
        escapeCsvCell(task.title),
        escapeCsvCell(task.category || 'Academic'),
        escapeCsvCell(task.subject || ''),
        escapeCsvCell(task.description),
        escapeCsvCell(task.dueDate || 'No due date'),
        escapeCsvCell(task.dueTime || ''),
        escapeCsvCell(task.priority),
        escapeCsvCell(task.status),
        escapeCsvCell(task.createdAtIso || ''),
      ].join(','),
    );
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="studyflow-tasks.csv"');
  res.send(rows.join('\n'));
});

export default router;
