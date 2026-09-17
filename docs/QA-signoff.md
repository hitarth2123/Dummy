# EPIC-10 QA Sign-off

**Release gate:** EPIC-10 Exam Lockout Enforcement, Admin KPIs and Release QA
**Owner:** Om Pandey
**Review date:** 2026-09-20
**Status:** Conditional; final release sign-off is blocked by unrelated pre-existing regression failures.

## Implemented and verified

- Exam timetable CSV rows persist `student_id`, lockout windows, and manual unlock state.
- Lockout sweep is scheduled every 15 minutes and queries active timetable windows without mutating unrelated student accounts.
- Lockout middleware returns HTTP 423 with the exact `message` and ISO8601 `unlocks_at` payload for the matching student and subject.
- Lockout naturally clears after `lockout_end`; manual unlock bypasses the matching timetable entry immediately.
- `/api/llm/*`, `/api/student/practice/*`, and student mock-test routes are protected.
- Emergency routes are excluded from lockout enforcement.
- Manual admin unlock writes an immutable `AuditLog` entry containing admin, student, subject, reason, and timestamp metadata.
- Admin dashboard aggregates active sessions, engagement, uptime, ethics flags, hallucination reports, feedback rating, and weekly trends.
- Admin dashboard UI includes KPI cards, refresh/error/loading states, and weekly trend visualization.

## Executed checks

| Check | Result |
|---|---|
| `tests/lockout.test.js` | PASS: 3 tests |
| `tests/admin.kpi.test.js` | PASS: 2 tests |
| `tests/schemas.test.js` | PASS: 31 tests |
| Client `npm run build` | PASS; existing chunk-size warning |
| Full server Jest suite | 11 suites passed, 2 failed, 1 skipped |

## Release blockers

The full server suite currently fails in unrelated existing tests:

- `tests/auth.test.js`: JWT `expiresIn` receives an invalid environment value.
- `tests/llm.test.js`: question classification returns different topic/subtopic metadata than the existing expectation.

The repository does not currently contain automated browser coverage for all 28 pages, all 103 RBAC combinations, or end-to-end verification of all eight email triggers and the ethics/distress SLA timers. Those remain required manual or CI checks before changing this document to **Approved**.

**QA sign-off:** Pending resolution of the listed blockers and completion of the remaining release-gate checks.
