# AI Buddy

AI Buddy is an institutional learning workspace for B.Tech students, faculty, HODs, and administrators. It combines role-based academic operations with an AI tutor grounded in course content, question-bank practice, learning paths, faculty support sessions, and academic feedback workflows.

The project is a JavaScript monorepo:

```text
ai-buddy/
├── client/                 React + Vite student/faculty/admin interface
├── server/                 Express API, MongoDB models, RAG and AI services
├── shared/                 Shared schemas, constants and validation helpers
├── data/                   Source learning material for ingestion
├── scripts/                Seeding, ingestion, validation and port utilities
├── docs/                   Project documentation
├── docker-compose.yml      Optional DevDocs service
└── package.json            Workspace scripts and orchestration
```

## What The Project Provides

### Student workspace

- Dashboard with semester progress, agenda, exams, weak topics, and academic path.
- Course hierarchy: `B.Tech -> semester -> specialization -> subject -> topic`.
- Curriculum catalog for semesters 1 through 8.
- Specialization branches for semesters 6, 7, and 8:
  - Cybersecurity
  - AI and ML
  - AR/VR
- AI Tutor with streamed responses, conversation memory, RAG references, and markdown-style rendering.
- Question bank with subject, topic, year, difficulty, paper-set, search, and bookmark filters.
- Practice MCQs and generated mock tests.
- Learning paths with topic completion and progress tracking.
- Faculty discovery and doubt-session booking.
- Student forum and feedback/reporting workflows.

### Faculty, HOD and admin workflows

- Faculty dashboard for department-scoped academic support and student sessions.
- HOD tools for department operations, timetable and oversight workflows.
- Admin tools for users, feedback, audit records and system-level management.
- Role-based access control is enforced in the API and reflected in the frontend routes.

## Academic Curriculum Model

The canonical curriculum is defined in [`server/src/constants/curriculum.js`](server/src/constants/curriculum.js). Each entry follows this structure:

```text
B.Tech
└── Semester
    └── Specialization
        └── Subject
            └── Topic
```

Semesters 1–5 contain common computer-science and engineering foundations. Semesters 6–8 contain specialization-specific subjects, projects, internships, and seminars for Cybersecurity, AI and ML, and AR/VR.

Student records store the selected academic identity using:

- `course`, for example `B.Tech`
- `department`, for example `Computer Science`
- `semester`, from 1 to 8
- `specialization`, for example `Cybersecurity` or `AI and ML`
- `enrolled_subjects`
- `weak_topics`

Authenticated students can retrieve the complete catalog and their active academic selection from:

```text
GET /api/student/curriculum
```

## AI Tutor And RAG Flow

The AI Tutor request follows this path:

```text
Student message
    ↓
Client: POST /api/llm/tutor/chat
    ↓
Authentication, student role, lockout and ethics guards
    ↓
Question classification: subject, topic, subtopic
    ↓
MongoDB vector search + optional DevDocs lookup for coding questions
    ↓
Stored grounded answer, weather response, or Groq-generated answer
    ↓
Server-sent event stream to the client
    ↓
Conversation persistence and optional knowledge capture
```

### AI services

- **Groq** handles normal conversation, academic explanations, coding answers, and generated learning content.
- **MongoDB Atlas Vector Search** retrieves grounded academic knowledge from `knowledgechunks`.
- **DevDocs** provides local documentation context for coding and API questions.
- **Local embeddings** generate 768-dimensional vectors without an external embedding API.

Generated tutor answers are stored in two different places for different purposes:

- `tutorconversations`: the complete conversation history, including every user and assistant turn.
- `knowledgechunks`: generated or ingested knowledge that is eligible for future semantic retrieval.

This distinction means every answer should appear in `tutorconversations`, while only captured knowledge appears in `knowledgechunks`.

## Main MongoDB Collections

| Collection | Purpose |
|---|---|
| `users` | Students, faculty, HODs and administrators |
| `sessions` | Refresh-token and access-session tracking |
| `tutorconversations` | AI Tutor conversation titles, messages and timestamps |
| `knowledgechunks` | RAG content and 768-dimensional embeddings |
| `questionbanks` | Verified questions, topics, paper sets and answers |
| `learningpaths` | Student subject roadmaps and topic completion |
| `mocktests` | Generated and submitted mock tests |
| `doubtsessions` | Student-faculty support bookings |
| `auditlogs` | Security and academic activity records |
| `feedbackforms` | Feedback and follow-up workflows |

Mongoose pluralizes model names. For example, the `TutorConversation` model is visible in Atlas as `tutorconversations`.

## Technology Stack

### Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- Axios
- Lucide React icons

### Backend

- Node.js
- Express
- MongoDB Atlas with Mongoose
- JWT access and refresh tokens
- Zod environment validation
- Nodemailer
- Jest
- Nodemon for development

### Supporting services

- Groq-compatible chat API
- MongoDB Atlas Vector Search
- DevDocs container on port `9292`

## Requirements

- Node.js 20 or newer
- npm 9 or newer
- MongoDB Atlas or a compatible MongoDB deployment
- A Groq API key for generated tutor responses
- Docker, only if using the optional DevDocs service

## Setup

Install all workspace dependencies from the repository root:

```bash
npm install
```

Create the server environment file:

```bash
cp server/.env.example server/.env
```

At minimum, configure the required values in `server/.env`:

```dotenv
NODE_ENV=development
PORT=5012
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
DB_NAME=ai_buddy
JWT_SECRET=<at-least-32-characters>
JWT_REFRESH_SECRET=<at-least-32-characters>
CLIENT_URL=http://localhost:3000
GROQ_API_KEY=<groq-api-key>
# Preferred names for the parallel MCQ key pool. Add up to four keys.
GROQ_API_KEY_1=<groq-api-key-1>
GROQ_API_KEY_2=<groq-api-key-2>
GROQ_API_KEY_3=<groq-api-key-3>
GROQ_API_KEY_4=<groq-api-key-4>
```

The environment validator also requires SMTP settings unless `SEED_MODE=true`. See [`server/.env.example`](server/.env.example) for the complete list, including SSO, mailer, DevDocs, vector-provider and development-login settings.

Validate the environment before starting:

```bash
npm run validate:env
```

## Seed Development Data

Seed users and development fixtures after configuring the server environment:

```bash
npm run seed
```

Development accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@seed.dev` | `Admin@12345` |
| HOD | `hod@seed.dev` | `Hod@12345` |
| Faculty, Computer Science | `faculty@seed.dev` | `Faculty@12345` |
| Faculty, ECE | `faculty.ece@seed.dev` | `FacultyEce@12345` |
| Student, Computer Science | `student@seed.dev` | `Student@12345` |
| Student, ECE | `student.two@seed.dev` | `StudentTwo@12345` |

These accounts are local development fixtures only. Do not use them in production.

## Run The Application

Run both frontend and backend from the repository root:

```bash
npm run dev
```

The services use these ports:

| Service | URL | Purpose |
|---|---|---|
| Client | http://localhost:3000 | React/Vite application |
| API | http://localhost:5012 | Express backend |
| Health check | http://localhost:5012/health | Backend health status |
| DevDocs | http://localhost:9292 | Optional coding documentation service |

Run them independently when needed:

```bash
npm run dev:server
npm run dev:client
```

The server development watcher ignores runtime-generated files under `server/src/dataset` and `server/src/config` so conversation persistence and vector-index updates do not cause unnecessary restarts.

## Optional DevDocs Service

Start DevDocs with Docker Compose:

```bash
docker compose up -d devdocs
```

Or run it directly:

```bash
docker run --name devdocs -d -p 9292:9292 ghcr.io/freecodecamp/devdocs:latest
```

Coding questions continue to work through Groq if DevDocs is unavailable.

## Content Ingestion And Vector Search

Source content belongs under `data/`, organized by course and subject. For example:

```text
data/
└── BTech/
    └── DBMS/
        └── normalization.txt
```

Ingest a document into MongoDB:

```bash
npm run ingest -- \
  --file ./data/BTech/DBMS/normalization.txt \
  --dept BTech \
  --subject DBMS \
  --topic Normalization \
  --subtopic 3NF
```

Create or refresh the Atlas Vector Search index when required:

```bash
npm run vector:index
```

The expected index name is `vector_index`, and the embedding dimension is `768`.

## Important API Areas

### Authentication

```text
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

### Student academic data

```text
GET /api/student/dashboard
GET /api/student/curriculum
GET /api/student/subjects
GET /api/student/learning-path
GET /api/student/question-bank
GET /api/student/question-bank/sets
```

### AI and practice

```text
POST /api/llm/tutor/chat
POST /api/llm/chat
POST /api/llm/mcq/generate
POST /api/llm/mock-test/generate
POST /api/llm/mock-test/:id/submit
```

### Support and community

```text
GET  /api/student/faculty
POST /api/student/sessions/book
GET  /api/student/sessions
GET  /api/forum
POST /api/forum
POST /api/feedback
```

All protected student endpoints require a valid access token and the `student` role. Department-scoped routes use the authenticated user's department.

## Testing And Validation

Run the complete workspace test suite:

```bash
npm test
```

Run server tests directly:

```bash
npm run test --workspace=server
```

Run schema tests:

```bash
npm run test:schemas
```

Build the production client:

```bash
npm run build --workspace=client
```

Lint the client:

```bash
npm run lint --workspace=client
```

## Project Conventions

- Keep domain logic in server services and controllers rather than in route files.
- Add new MongoDB fields to the relevant Mongoose model and authentication claims when the frontend needs them.
- Add curriculum changes to `server/src/constants/curriculum.js` instead of duplicating subject lists in pages.
- Use `api.service.js` for normal client API calls so authentication, refresh handling and request logging remain consistent.
- Keep generated runtime JSON out of nodemon's watch path.
- Treat development seed credentials and `.env` files as local-only secrets.

## Troubleshooting

### Tutor shows an empty JSON parsing error

The client reads failed responses as text before attempting JSON parsing. Check the API response status and the server log for the request ID. A `500` generally indicates a server-side dependency or configuration failure.

### Server restarts after a tutor response

Ensure the server is using the current `dev` script, which ignores runtime-generated dataset and config files. Nodemon should not restart when `generatedKnowledge.json`, `tutorConversations.json`, or the vector index changes.

### Tutor data is not visible where expected in Atlas

Check both collections:

- `tutorconversations` contains every persisted tutor turn.
- `knowledgechunks` contains only RAG-ingestible or captured knowledge.

Both collections belong to the database configured by `DB_NAME`, normally `ai_buddy` for local development.

### SMTP verification fails in development

The mailer logs the failure and continues by default. Set `MAILER_STRICT_STARTUP=true` only when SMTP verification must block startup.

## Security Notes

- Never commit `server/.env`, access tokens, refresh tokens, API keys, or production credentials.
- Use institutional SSO in production where available.
- Keep `DEV_LOGIN_ENABLED=false` in production.
- Configure `MAILER_STRICT_STARTUP=true` in environments where email delivery is required for startup correctness.
- Review audit logs and role restrictions before exposing new routes.
