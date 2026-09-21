# EPIC-09 Architecture Review

Date: 2026-09-20
Owner: Hitarth Patel
Scope: ethics escalation, AI provider resilience, retrieval/prompt performance

## Completion Matrix

| Slice | Status | Evidence |
| --- | --- | --- |
| S1 secondary ethics classifier | Implemented | `server/src/services/ethics.service.js`, `server/src/services/groqEthics.service.js`, `server/tests/ethics.classifier.test.js` |
| S1 department-versioned rules | Implemented | Active highest-version `EthicsConfig` is selected before classification |
| S1 dual audit records | Implemented | Layer 1 and layer 2 decisions are written through `audit.service.js` |
| S2 BullMQ E-04 queue | Implemented when `REDIS_URL` is configured | `server/src/jobs/ethicsEscalation.queue.js` |
| S2 HOD worker and retry | Implemented | `server/src/jobs/ethicsEscalation.worker.js`, exponential backoff, 8 attempts, persistent failed jobs |
| S2 PII-safe E-04 | Implemented | HTML/TXT templates contain student ID, category, and department only |
| S2 `hod_notified_at` | Implemented | Set only after successful mail delivery |
| S3 retrieval/prompt hardening | Implemented | Bounded vector oversampling, 12-history-message cap, 4,000-character history cap, 12,000-character RAG context cap |
| S3 provider usage | Implemented | Groq is the active LLM and secondary ethics classifier provider; existing Apinex fallback remains supported |
| S3 peak load P95 | Harness implemented, production result pending | `server/tests/performance.test.js`; requires a running server and performance token |
| S4 architecture review | Recorded here | RBAC, provider fallback, mailer, queue, and audit paths reviewed |

## Runtime Requirements

- Configure `GROQ_API_KEY` or one of the configured Groq key-pool variables to enable layer-2 classification.
- Set `REDIS_URL` to enable BullMQ enqueueing and the E-04 worker.
- Run a dedicated worker process with `node src/jobs/ethicsEscalation.worker.js` in production, or use the server startup hook.
- Configure SMTP and active department HOD users for delivery.

Without Redis, the API remains available but confirmed flags cannot meet the E-04 SLA. The queue logs this configuration gap explicitly instead of falsely marking a notification as delivered.

## Performance Measurement

Run the real peak test with:

```sh
PERFORMANCE_BASE_URL=http://localhost:5012 \
PERFORMANCE_ACCESS_TOKEN='<student access token>' \
PERFORMANCE_CONCURRENCY=10 \
PERFORMANCE_ITERATIONS=20 \
npm test -- --runInBand tests/performance.test.js
```

The test reports P95 for MCQ generation, mock-test generation, and AI Tutor. It is intentionally skipped when the external server/token are absent; no synthetic result is presented as a production measurement.

## Review Findings

- Redis availability is a deployment prerequisite for the five-minute E-04 objective.
- HOD routing is department-scoped because no explicit faculty-in-charge assignment is currently modeled.
- E-04 excludes prompt content by design. Full trigger content remains protected in `EthicsFlag` for authorized application review.
- Atlas Vector Search requires the `vector_index` definition documented in `server/src/config/vectorDb.js`; startup checks and warns when it is missing.
- Existing full-suite failures outside EPIC-09 must be triaged separately; EPIC-09 focused tests are the acceptance gate for this change.
