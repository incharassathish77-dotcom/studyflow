# STUDYFLOW Security Specification (Simplified Student Task Manager)

## 1. Data Invariants

1. **Direct Classroom Access (No Login)**: Per explicit user specification for a login-free classroom reference project, `/tasks/{taskId}` permits direct application-level read, create, update, and delete operations without requiring user authentication.
2. **Global Deny-All Safety Net**: Every other collection path in Firestore is explicitly denied (`match /{document=**} { allow read, write: if false; }`).
3. **Strict Schema & Key Allowlisting**: Every `/tasks/{taskId}` document enforces exact `keys().hasAll(...)` and `keys().hasOnly(...)` allowlists (`title`, `description`, `category`, `dueDate`, `dueTime`, `priority`, `status`, `completedAt`, `createdAt`, `updatedAt`) to prevent shadow field injection.
4. **Immutable Creation Timestamp & Server Time Enforcement**: `createdAt == request.time` and `updatedAt == request.time` are enforced on creation; `createdAt == existing().createdAt` and `updatedAt == request.time` are enforced on update, with `affectedKeys().hasOnly(...)` restricting mutable fields.
5. **Typed Bounds & Enum Validation**: `title` (1..140 chars), `description` (<=1200 chars), `category`, `priority` (`Low`/`Medium`/`High`), `status` (`Pending`/`In Progress`/`Completed`), `dueDate` (`YYYY-MM-DD` or empty), and `dueTime` (`HH:MM` or empty) are strictly validated.

## 2. Adversarial Validation Cases

1. Malformed `taskId` (contains invalid characters or exceeds 128 chars).
2. Missing required fields on task create.
3. Shadow field injection (`isAdmin: true` or arbitrary extra keys) on task create or update.
4. Empty or oversized `title` (>140 chars).
5. Oversized `description` (>1200 chars).
6. Invalid `category` enum.
7. Invalid `priority` enum (e.g., `Urgent`).
8. Invalid `status` enum (e.g., `Deleted`).
9. Malformed `dueDate` (not `YYYY-MM-DD` or empty).
10. Client-spoofed `createdAt` or `updatedAt` timestamp on create.
11. Altering `createdAt` during task update.
12. Accessing any collection outside `/tasks/{taskId}` (e.g., `/users/{id}`, `/notes/{id}`).
