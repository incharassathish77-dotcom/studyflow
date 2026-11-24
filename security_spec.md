# STUDYFLOW Security Specification (Phase 0)

## 1. Data Invariants

1. **Authentication & Provider Isolation**: All mutations across all 11 collections (`users`, `tasks`, `assignments`, `studySessions`, `exams`, `timetable`, `notes`, `goals`, `focusSessions`, `notifications`, `calendarEvents`) require an authenticated Firebase session (`email_verified == true`, `password`, or `anonymous` guest demo session) with strict `request.auth.uid` ownership checks.
2. **Strict Ownership Isolation**: Every document is scoped to `request.auth.uid` via `userId` (or `uid` on `/users/{userId}`). Cross-user `get`, `list`, `create`, `update`, and `delete` operations are denied. `/users/{userId}` forbids `list` queries entirely to prevent user enumeration/PII scraping.
3. **Immutable Ownership & Creation Timestamps**: `userId`/`uid` and `createdAt` cannot be modified after creation. Server timestamps (`request.time`) are enforced on `createdAt` and `updatedAt`.
4. **Strict Key & Volumetric Bounds**: Every collection enforces exact `keys().hasAll(...)` + `keys().hasOnly(...)` allowlists, bounded string lengths, enum checks, and `affectedKeys().hasOnly(...)` action branches on updates.
5. **Bounded Arrays**: `users.subjects` is bounded to max 30 string entries (<= 80 chars).

## 2. The "Dirty Dozen" Adversarial Payloads

1. Unauthenticated read or write on any collection.
2. Unverified email create on `/tasks/{taskId}`.
3. User ID spoofing (`userId: "other_uid"`) on `/assignments/{id}` or `/notes/{id}`.
4. Listing `/users` collection to scrape emails.
5. Shadow field injection (`isAdmin: true`) on `/users/{uid}` or `/tasks/{id}`.
6. Oversized `content` (> 5000 chars) on `/notes/{id}`.
7. Invalid enum values (e.g., `status: "Deleted"` on `/tasks/{id}` or `cadence: "Yearly"` on `/goals/{id}`).
8. Client-spoofed `createdAt` / `completedAt` on `/focusSessions/{id}`.
9. Attempting `update` on immutable `/focusSessions/{id}`.
10. Cross-user `list` query without `where("userId", "==", request.auth.uid)`.
11. Altering `userId` or `createdAt` during an `update` on `/exams/{id}`.
12. Cross-user `delete` on `/timetable/{id}` or `/calendarEvents/{id}`.
