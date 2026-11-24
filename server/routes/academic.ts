import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { isValidCalendarDate, isValidTime24 } from './tasks.ts';

const router = Router();

const VALID_PRIORITIES = ['Low', 'Medium', 'High'] as const;
const ASSIGNMENT_STATUSES = ['Not Started', 'In Progress', 'Submitted'] as const;
const STUDY_STATUSES = ['Scheduled', 'Completed'] as const;
const EXAM_TYPES = ['Midterm', 'Final', 'Quiz', 'Practical', 'Viva', 'Other'] as const;
const EXAM_PREP_STATUSES = ['Not Started', 'In Progress', 'Ready'] as const;
const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
const GOAL_CADENCES = ['Daily', 'Weekly'] as const;
const GOAL_STATUSES = ['Active', 'Completed'] as const;
const CALENDAR_EVENT_TYPES = [
  'Personal Event',
  'Study Session',
  'Task',
  'Assignment',
  'Exam',
] as const;

function str(val: unknown): string {
  return typeof val === 'string' ? val.trim() : '';
}

function calcDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

router.post('/validate/:entity', requireAuth, (req: AuthenticatedRequest, res) => {
  const { entity } = req.params;
  const body = req.body as Record<string, unknown> | null;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({ valid: false, error: 'Request body must be an object.' });
    return;
  }

  const errors: Record<string, string> = {};

  switch (entity) {
    case 'assignment': {
      const title = str(body.title);
      const subject = str(body.subject);
      const description = str(body.description);
      const assignedDate = str(body.assignedDate);
      const dueDate = str(body.dueDate);
      const priority = str(body.priority) || 'Medium';
      const status = str(body.status) || 'Not Started';

      if (!title || title.length > 140) errors.title = 'Title is required (max 140 chars).';
      if (!subject || subject.length > 80) errors.subject = 'Subject is required (max 80 chars).';
      if (description.length > 1200) errors.description = 'Description max 1200 chars.';
      if (!isValidCalendarDate(assignedDate, true)) errors.assignedDate = 'Invalid assigned date.';
      if (!dueDate || !isValidCalendarDate(dueDate, false)) errors.dueDate = 'Valid submission deadline is required.';
      if (!VALID_PRIORITIES.includes(priority as (typeof VALID_PRIORITIES)[number])) errors.priority = 'Invalid priority.';
      if (!ASSIGNMENT_STATUSES.includes(status as (typeof ASSIGNMENT_STATUSES)[number])) errors.status = 'Invalid status.';

      if (Object.keys(errors).length > 0) {
        res.status(400).json({ valid: false, errors });
        return;
      }
      res.json({
        valid: true,
        sanitized: { title, subject, description, assignedDate, dueDate, priority, status },
      });
      return;
    }

    case 'studySession': {
      const subject = str(body.subject);
      const title = str(body.title);
      const description = str(body.description);
      const date = str(body.date);
      const startTime = str(body.startTime);
      const endTime = str(body.endTime);
      const studyGoal = str(body.studyGoal);
      const status = str(body.status) || 'Scheduled';

      if (!subject || subject.length > 80) errors.subject = 'Subject is required.';
      if (!title || title.length > 140) errors.title = 'Session title is required.';
      if (description.length > 1000) errors.description = 'Description max 1000 chars.';
      if (!date || !isValidCalendarDate(date, false)) errors.date = 'Valid study date is required.';
      if (!isValidTime24(startTime, false)) errors.startTime = 'Valid start time is required.';
      if (!isValidTime24(endTime, false)) errors.endTime = 'Valid end time is required.';
      const durationMinutes =
        isValidTime24(startTime, false) && isValidTime24(endTime, false)
          ? calcDurationMinutes(startTime, endTime)
          : 0;
      if (durationMinutes < 1 || durationMinutes > 720) {
        errors.endTime = 'End time must be after start time (up to 12 hours).';
      }
      if (studyGoal.length > 200) errors.studyGoal = 'Study goal max 200 chars.';
      if (!STUDY_STATUSES.includes(status as (typeof STUDY_STATUSES)[number])) errors.status = 'Invalid status.';

      if (Object.keys(errors).length > 0) {
        res.status(400).json({ valid: false, errors });
        return;
      }
      res.json({
        valid: true,
        sanitized: {
          subject,
          title,
          description,
          date,
          startTime,
          endTime,
          durationMinutes,
          studyGoal,
          status,
        },
      });
      return;
    }

    case 'exam': {
      const examName = str(body.examName);
      const subject = str(body.subject);
      const examDate = str(body.examDate);
      const examTime = str(body.examTime);
      const examType = str(body.examType) || 'Midterm';
      const preparationStatus = str(body.preparationStatus) || 'Not Started';
      const importantTopics = str(body.importantTopics);
      const notes = str(body.notes);

      if (!examName || examName.length > 140) errors.examName = 'Exam name is required.';
      if (!subject || subject.length > 80) errors.subject = 'Subject is required.';
      if (!examDate || !isValidCalendarDate(examDate, false)) errors.examDate = 'Valid exam date is required.';
      if (!isValidTime24(examTime, true)) errors.examTime = 'Invalid exam time.';
      if (!EXAM_TYPES.includes(examType as (typeof EXAM_TYPES)[number])) errors.examType = 'Invalid exam type.';
      if (!EXAM_PREP_STATUSES.includes(preparationStatus as (typeof EXAM_PREP_STATUSES)[number])) errors.preparationStatus = 'Invalid preparation status.';
      if (importantTopics.length > 1000) errors.importantTopics = 'Important topics max 1000 chars.';
      if (notes.length > 1000) errors.notes = 'Notes max 1000 chars.';

      if (Object.keys(errors).length > 0) {
        res.status(400).json({ valid: false, errors });
        return;
      }
      res.json({
        valid: true,
        sanitized: {
          examName,
          subject,
          examDate,
          examTime,
          examType,
          preparationStatus,
          importantTopics,
          notes,
        },
      });
      return;
    }

    case 'timetable': {
      const dayOfWeek = str(body.dayOfWeek);
      const startTime = str(body.startTime);
      const endTime = str(body.endTime);
      const subject = str(body.subject);
      const faculty = str(body.faculty);
      const classroom = str(body.classroom);

      if (!DAYS_OF_WEEK.includes(dayOfWeek as (typeof DAYS_OF_WEEK)[number])) errors.dayOfWeek = 'Select a day of the week.';
      if (!isValidTime24(startTime, false)) errors.startTime = 'Valid start time is required.';
      if (!isValidTime24(endTime, false)) errors.endTime = 'Valid end time is required.';
      if (isValidTime24(startTime, false) && isValidTime24(endTime, false) && calcDurationMinutes(startTime, endTime) <= 0) {
        errors.endTime = 'End time must be after start time.';
      }
      if (!subject || subject.length > 80) errors.subject = 'Subject name is required.';
      if (faculty.length > 100) errors.faculty = 'Faculty name max 100 chars.';
      if (classroom.length > 60) errors.classroom = 'Classroom max 60 chars.';

      if (Object.keys(errors).length > 0) {
        res.status(400).json({ valid: false, errors });
        return;
      }
      res.json({
        valid: true,
        sanitized: { dayOfWeek, startTime, endTime, subject, faculty, classroom },
      });
      return;
    }

    case 'note': {
      const title = str(body.title);
      const subject = str(body.subject);
      const content = str(body.content);
      const isPinned = Boolean(body.isPinned);

      if (!title || title.length > 140) errors.title = 'Note title is required (max 140 chars).';
      if (!subject || subject.length > 80) errors.subject = 'Subject is required.';
      if (!content || content.length > 5000) errors.content = 'Note content is required (max 5000 chars).';

      if (Object.keys(errors).length > 0) {
        res.status(400).json({ valid: false, errors });
        return;
      }
      res.json({
        valid: true,
        sanitized: { title, subject, content, isPinned },
      });
      return;
    }

    case 'goal': {
      const title = str(body.title);
      const description = str(body.description);
      const cadence = str(body.cadence) || 'Daily';
      const targetValue = Number(body.targetValue);
      const currentValue = Number(body.currentValue ?? 0);
      const unit = str(body.unit) || 'tasks';
      const status =
        currentValue >= targetValue
          ? 'Completed'
          : GOAL_STATUSES.includes(str(body.status) as (typeof GOAL_STATUSES)[number])
            ? str(body.status)
            : 'Active';
      const completedAt =
        status === 'Completed'
          ? str(body.completedAt) || new Date().toISOString()
          : '';

      if (!title || title.length > 140) errors.title = 'Goal title is required.';
      if (description.length > 600) errors.description = 'Description max 600 chars.';
      if (!GOAL_CADENCES.includes(cadence as (typeof GOAL_CADENCES)[number])) errors.cadence = 'Invalid goal cadence.';
      if (!Number.isFinite(targetValue) || targetValue < 1 || targetValue > 10000) {
        errors.targetValue = 'Target must be between 1 and 10000.';
      }
      if (!Number.isFinite(currentValue) || currentValue < 0 || currentValue > 10000) {
        errors.currentValue = 'Current progress must be 0 or greater.';
      }
      if (!unit || unit.length > 30) errors.unit = 'Unit is required (max 30 chars).';

      if (Object.keys(errors).length > 0) {
        res.status(400).json({ valid: false, errors });
        return;
      }
      res.json({
        valid: true,
        sanitized: {
          title,
          description,
          cadence,
          targetValue,
          currentValue,
          unit,
          status,
          completedAt,
        },
      });
      return;
    }

    case 'calendarEvent': {
      const title = str(body.title);
      const description = str(body.description);
      const date = str(body.date);
      const startTime = str(body.startTime);
      const endTime = str(body.endTime);
      const eventType = str(body.eventType) || 'Personal Event';

      if (!title || title.length > 140) errors.title = 'Event title is required.';
      if (description.length > 800) errors.description = 'Description max 800 chars.';
      if (!date || !isValidCalendarDate(date, false)) errors.date = 'Valid date is required.';
      if (!isValidTime24(startTime, true)) errors.startTime = 'Invalid start time.';
      if (!isValidTime24(endTime, true)) errors.endTime = 'Invalid end time.';
      if (!CALENDAR_EVENT_TYPES.includes(eventType as (typeof CALENDAR_EVENT_TYPES)[number])) {
        errors.eventType = 'Invalid event type.';
      }

      if (Object.keys(errors).length > 0) {
        res.status(400).json({ valid: false, errors });
        return;
      }
      res.json({
        valid: true,
        sanitized: { title, description, date, startTime, endTime, eventType },
      });
      return;
    }

    default:
      res.status(404).json({ valid: false, error: 'Unknown academic entity type.' });
  }
});

export default router;
