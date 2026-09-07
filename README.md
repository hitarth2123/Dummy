# AI Buddy

## Local Development Accounts

Run `node scripts/seedDb.js` after configuring the server `.env` file. These accounts are development fixtures only and must not be used in production.

| Type of user | Username | User password |
|---|---|---|
| Admin | `admin@seed.dev` | `Admin@12345` |
| HOD | `hod@seed.dev` | `Hod@12345` |
| Faculty / teacher (Computer Science) | `faculty@seed.dev` | `Faculty@12345` |
| Faculty / teacher (ECE) | `faculty.ece@seed.dev` | `FacultyEce@12345` |
| Student (Computer Science) | `student@seed.dev` | `Student@12345` |
| Student (ECE) | `student.two@seed.dev` | `StudentTwo@12345` |

In Vite development mode, enter one of these accounts in the local development login form. The seeded role controls the dashboard and navigation shown after login.

### Seed MongoDB Atlas

1. Copy `server/.env.example` to `server/.env` and fill in `MONGO_URI`, `DB_NAME`, JWT values, LLM keys, and SMTP values.
2. Run `npm run seed` from the repository root.
3. Start the backend with `npm run dev:server` and the frontend with `npm run dev:client`.

The seed script removes only existing `@seed.dev` users before recreating these fixtures. It does not delete normal user records.

## RAG and LLM Worker

Run the complete local stack with:

```bash
npm run dev
```

This starts:

| Process | Port | Purpose |
|---|---:|---|
| Client | 3000 | React/Vite frontend |
| Backend | 5012 | Auth, ethics, API gateway |
| LLM worker | 7031 | Embeddings, Atlas Vector Search, MCQs, tutor responses |

The frontend calls `/api/llm/...` on the backend. The backend forwards heavy LLM work to `http://127.0.0.1:7031` and returns the response to the client.

Check the worker directly with:

```bash
curl http://localhost:7031/health
```

Ingest RAG data into Atlas with:

```bash
npm run ingest -- --file ./data/BTech/DBMS/notes.pdf --dept BTech --subject DBMS --topic Normalization
```

The ingestion command stores text chunks and 768-dimension embeddings in the `knowledgechunks` collection. Create the Atlas Vector Search index named `vector_index` before querying.
