import assert from 'node:assert';

export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'get' | 'list' | 'update' | 'delete';
  auth: { uid: string; email_verified: boolean } | null;
  expected: 'PERMISSION_DENIED';
}

export const STUDYFLOW_DIRTY_DOZEN: DirtyDozenCase[] = [
  { id: 1, name: 'Unauthenticated create task', collection: 'tasks', operation: 'create', auth: null, expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified email create assignment', collection: 'assignments', operation: 'create', auth: { uid: 'alice', email_verified: false }, expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'User ID spoofing on note', collection: 'notes', operation: 'create', auth: { uid: 'alice', email_verified: true }, expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'PII scraping via users list', collection: 'users', operation: 'list', auth: { uid: 'alice', email_verified: true }, expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Shadow field injection on user profile', collection: 'users', operation: 'update', auth: { uid: 'alice', email_verified: true }, expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Oversized note content (>5000 chars)', collection: 'notes', operation: 'create', auth: { uid: 'alice', email_verified: true }, expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Invalid status enum on task', collection: 'tasks', operation: 'create', auth: { uid: 'alice', email_verified: true }, expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Client-spoofed completedAt on focusSessions', collection: 'focusSessions', operation: 'create', auth: { uid: 'alice', email_verified: true }, expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Mutation attempt on append-only focusSessions', collection: 'focusSessions', operation: 'update', auth: { uid: 'alice', email_verified: true }, expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Unfiltered list query across users', collection: 'exams', operation: 'list', auth: { uid: 'bob', email_verified: true }, expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Immutable createdAt tampering on goal update', collection: 'goals', operation: 'update', auth: { uid: 'alice', email_verified: true }, expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Cross-user delete on timetable', collection: 'timetable', operation: 'delete', auth: { uid: 'bob', email_verified: true }, expected: 'PERMISSION_DENIED' },
];

assert.strictEqual(STUDYFLOW_DIRTY_DOZEN.length, 12);
