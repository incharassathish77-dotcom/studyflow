import assert from 'node:assert';

export interface SecurityInvariantCase {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'get' | 'list' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
}

export const STUDYFLOW_TASK_SECURITY_CASES: SecurityInvariantCase[] = [
  { id: 1, name: 'Malformed taskId rejected', collection: 'tasks', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Missing required fields on task create', collection: 'tasks', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Shadow field injection on task create', collection: 'tasks', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Empty or oversized task title (>140 chars)', collection: 'tasks', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Oversized task description (>1200 chars)', collection: 'tasks', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Invalid category enum on task', collection: 'tasks', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Invalid priority enum on task', collection: 'tasks', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Invalid status enum on task', collection: 'tasks', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Malformed dueDate format on task', collection: 'tasks', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Client-spoofed createdAt timestamp on create', collection: 'tasks', operation: 'create', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Immutable createdAt tampering on update', collection: 'tasks', operation: 'update', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Access to retired collections denied by safety net', collection: 'users', operation: 'get', expected: 'PERMISSION_DENIED' },
];

assert.strictEqual(STUDYFLOW_TASK_SECURITY_CASES.length, 12);
