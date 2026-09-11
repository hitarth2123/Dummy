/**
 * shared/schemas/schemas.test.js
 * Tests that shared Zod schemas reject/accept payloads identically
 * regardless of import context (simulates both client and server usage).
 *
 * Run: npx jest shared/schemas/schemas.test.js
 * Or via server workspace: npm test --workspace=server (if jest is configured there)
 */

const {
  mcqSchema,
  createMcqSchema,
  questionBankSchema,
  feedbackSchema,
  registerSchema,
  loginSchema,
  updateProfileSchema,
} = require('./index');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const valid   = (schema, data)   => expect(schema.safeParse(data).success).toBe(true);
const invalid = (schema, data, field) => {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
  if (field) {
    const paths = result.error.issues.map((i) => i.path.join('.'));
    expect(paths.some((p) => p.includes(field))).toBe(true);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MCQ Schema (SRD Sec 5.5)
// ─────────────────────────────────────────────────────────────────────────────
describe('mcqSchema (SRD Sec 5.5)', () => {
  const validMcq = {
    question_id:  '123e4567-e89b-12d3-a456-426614174000',
    dept:         'BTech',
    subject:      'DBMS',
    topic:        'Normalization',
    stem:         'Which normal form eliminates partial dependencies?',
    options:      { A: '1NF', B: '2NF', C: '3NF', D: 'BCNF' },
    correct:      'B',
    explanation:  '2NF removes partial dependencies.',
    difficulty:   'easy',
    generated_at: new Date().toISOString(),
    rag_sources:  [],
  };

  it('accepts a fully valid MCQ', () => valid(mcqSchema, validMcq));

  it('rejects stem longer than 300 characters', () => {
    invalid(mcqSchema, { ...validMcq, stem: 'x'.repeat(301) }, 'stem');
  });

  it('rejects invalid correct answer', () => {
    invalid(mcqSchema, { ...validMcq, correct: 'E' }, 'correct');
  });

  it('rejects invalid difficulty', () => {
    invalid(mcqSchema, { ...validMcq, difficulty: 'extreme' }, 'difficulty');
  });

  it('rejects missing question_id', () => {
    const { question_id, ...rest } = validMcq;
    invalid(mcqSchema, rest, 'question_id');
  });

  it('rejects invalid UUID for question_id', () => {
    invalid(mcqSchema, { ...validMcq, question_id: 'not-a-uuid' }, 'question_id');
  });

  it('rejects malformed generated_at', () => {
    invalid(mcqSchema, { ...validMcq, generated_at: '2024/01/01' }, 'generated_at');
  });

  it('accepts rag_sources with valid entries', () => {
    valid(mcqSchema, {
      ...validMcq,
      rag_sources: [{ chunk_id: 'abc', source_doc: 'lecture.pdf', score: 0.92 }],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createMcqSchema (omits question_id + generated_at)
// ─────────────────────────────────────────────────────────────────────────────
describe('createMcqSchema', () => {
  const payload = {
    dept:        'MCA',
    subject:     'Data Structures',
    topic:       'Sorting',
    stem:        'What is the worst case of QuickSort?',
    options:     { A: 'O(n)', B: 'O(n log n)', C: 'O(n²)', D: 'O(log n)' },
    correct:     'C',
    difficulty:  'medium',
  };

  it('accepts payload without question_id/generated_at', () => valid(createMcqSchema, payload));

  it('rejects when stem is missing', () => invalid(createMcqSchema, { ...payload, stem: '' }, 'stem'));
});

// ─────────────────────────────────────────────────────────────────────────────
// QuestionBank Schema (label-array format)
// ─────────────────────────────────────────────────────────────────────────────
describe('questionBankSchema', () => {
  const validQB = {
    question_text:  'Which SQL clause filters groups?',
    options:        [
      { label: 'A', text: 'WHERE' },
      { label: 'B', text: 'HAVING' },
      { label: 'C', text: 'ORDER BY' },
      { label: 'D', text: 'GROUP BY' },
    ],
    correct_answer: 'B',
    department:     'BTech',
    subject:        'DBMS',
    topic:          'SQL Queries',
    year:           2022,
    difficulty:     'easy',
  };

  it('accepts a valid QuestionBank entry', () => valid(questionBankSchema, validQB));

  it('rejects options array with fewer than 4 entries', () => {
    invalid(questionBankSchema, { ...validQB, options: validQB.options.slice(0, 3) }, 'options');
  });

  it('rejects invalid correct_answer', () => {
    invalid(questionBankSchema, { ...validQB, correct_answer: 'E' }, 'correct_answer');
  });

  it('rejects year below 2000', () => {
    invalid(questionBankSchema, { ...validQB, year: 1999 }, 'year');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feedback Schema
// ─────────────────────────────────────────────────────────────────────────────
describe('feedbackSchema', () => {
  const validFeedback = {
    week_number:   10,
    academic_year: '2024-25',
    semester:      5,
    ratings: [
      { category: 'teaching_quality',   score: 4 },
      { category: 'content_clarity',    score: 5 },
      { category: 'ai_helpfulness',     score: 3 },
      { category: 'platform_usability', score: 4 },
      { category: 'overall',            score: 4 },
    ],
    comments: 'Great session this week!',
  };

  it('accepts a fully valid feedback form', () => valid(feedbackSchema, validFeedback));

  it('rejects academic_year in wrong format', () => {
    invalid(feedbackSchema, { ...validFeedback, academic_year: '2024-2025' }, 'academic_year');
  });

  it('rejects score out of range', () => {
    const badRatings = [{ category: 'overall', score: 6 }];
    invalid(feedbackSchema, { ...validFeedback, ratings: badRatings }, 'ratings');
  });

  it('rejects invalid rating category', () => {
    const badRatings = [{ category: 'food_quality', score: 3 }];
    invalid(feedbackSchema, { ...validFeedback, ratings: badRatings }, 'ratings');
  });

  it('rejects empty ratings array', () => {
    invalid(feedbackSchema, { ...validFeedback, ratings: [] }, 'ratings');
  });

  it('accepts optional subject_id and faculty_id', () => {
    valid(feedbackSchema, { ...validFeedback, subject_id: 'abc123', faculty_id: 'def456' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// User / Auth Schemas
// ─────────────────────────────────────────────────────────────────────────────
describe('registerSchema', () => {
  const validUser = {
    name:       'Alice Smith',
    email:      'alice@example.com',
    password:   'SecurePass1',
    role:       'student',
    department: 'BTech',
    semester:   5,
  };

  it('accepts a valid student registration', () => valid(registerSchema, validUser));

  it('rejects missing semester for student', () => {
    const { semester, ...noSemester } = validUser;
    invalid(registerSchema, noSemester, 'semester');
  });

  it('accepts faculty without semester', () => {
    valid(registerSchema, { ...validUser, role: 'faculty', semester: undefined });
  });

  it('rejects invalid email', () => {
    invalid(registerSchema, { ...validUser, email: 'not-an-email' }, 'email');
  });

  it('rejects password without uppercase', () => {
    invalid(registerSchema, { ...validUser, password: 'weakpass1' }, 'password');
  });

  it('rejects password without number', () => {
    invalid(registerSchema, { ...validUser, password: 'WeakPassword' }, 'password');
  });

  it('rejects invalid role', () => {
    invalid(registerSchema, { ...validUser, role: 'superadmin' }, 'role');
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    valid(loginSchema, { email: 'test@test.com', password: 'anything' });
  });

  it('rejects empty password', () => {
    invalid(loginSchema, { email: 'test@test.com', password: '' }, 'password');
  });

  it('rejects invalid email', () => {
    invalid(loginSchema, { email: 'bad', password: '123456' }, 'email');
  });
});

describe('updateProfileSchema', () => {
  it('accepts partial updates', () => {
    valid(updateProfileSchema, { name: 'Bob' });
    valid(updateProfileSchema, { department: 'MCA', semester: 3 });
    valid(updateProfileSchema, {});
  });

  it('rejects unknown fields', () => {
    invalid(updateProfileSchema, { role: 'admin' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-context parity: same schema rejects same invalid payload from both
// "client" and "server" require paths (simulated by using the same module)
// ─────────────────────────────────────────────────────────────────────────────
describe('Schema parity — client vs server import', () => {
  it('mcqSchema rejects identically regardless of import path', () => {
    // Simulate client import
    const clientSchema = require('./mcqSchema').mcqSchema;
    // Simulate server import (same module via shared/)
    const serverSchema = require('./index').mcqSchema;

    const badPayload = { question_id: 'bad-uuid', stem: 'X', correct: 'Z', difficulty: 'extreme' };

    const clientResult = clientSchema.safeParse(badPayload);
    const serverResult = serverSchema.safeParse(badPayload);

    expect(clientResult.success).toBe(false);
    expect(serverResult.success).toBe(false);

    // Both should report same number of issues
    expect(clientResult.error.issues.length).toBe(serverResult.error.issues.length);
  });
});
