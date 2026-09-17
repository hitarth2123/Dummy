/**
 * server/tests/schemas.test.js
 * Mongoose schema validation tests for EPIC-02.
 *
 * Uses jest + mongoose-memory-server (mongodb-memory-server) so no Atlas needed.
 * Install deps: npm install --save-dev jest mongodb-memory-server mongoose
 *
 * Run: npx jest server/tests/schemas.test.js
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// ── Models ──────────────────────────────────────────────────────────────────
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const QuestionBank = require('../src/models/QuestionBank');
const KnowledgeChunk = require('../src/models/KnowledgeChunk');
const LearningPath = require('../src/models/LearningPath');
const MockTest = require('../src/models/MockTest');
const AuditLog = require('../src/models/AuditLog');
const EthicsFlag = require('../src/models/EthicsFlag');
const EthicsConfig = require('../src/models/EthicsConfig');
const DoubtSession = require('../src/models/DoubtSession');
const FacultyAvailability = require('../src/models/FacultyAvailability');
const ForumPost = require('../src/models/ForumPost');
const Grievance = require('../src/models/Grievance');
const FeedbackForm = require('../src/models/FeedbackForm');
const EmergencyContact = require('../src/models/EmergencyContact');
const ExamTimetable = require('../src/models/ExamTimetable');
const HallucinationReport = require('../src/models/HallucinationReport');

// ── Test Setup ──────────────────────────────────────────────────────────────
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'test_aibuddy' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeObjectId = () => new mongoose.Types.ObjectId();

const validUser = () => ({
  name: 'Test Student',
  email: `student_${Date.now()}@test.com`,
  password_hash: 'hashed_password',
  role: 'student',
  department: 'Computer Science',
});

// ── USER ────────────────────────────────────────────────────────────────────
describe('User Schema', () => {
  it('saves a valid user', async () => {
    const user = await User.create(validUser());
    expect(user._id).toBeDefined();
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  it('rejects missing required field: name', async () => {
    const data = validUser();
    delete data.name;
    await expect(User.create(data)).rejects.toThrow(/name is required/);
  });

  it('rejects missing required field: email', async () => {
    const data = validUser();
    delete data.email;
    await expect(User.create(data)).rejects.toThrow(/email is required/);
  });

  it('rejects invalid role enum', async () => {
    await expect(User.create({ ...validUser(), role: 'superadmin' })).rejects.toThrow(/role must be/);
  });

  it('has timestamps', async () => {
    const user = await User.create(validUser());
    expect(user.createdAt).toBeInstanceOf(Date);
  });
});

// ── SESSION ─────────────────────────────────────────────────────────────────
describe('Session Schema', () => {
  it('saves a valid session', async () => {
    const user = await User.create(validUser());
    const session = await Session.create({
      user: user._id,
      refresh_token: 'valid.refresh.token',
      refresh_token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    expect(session._id).toBeDefined();
    expect(session.createdAt).toBeDefined();
  });

  it('rejects missing user reference', async () => {
    await expect(
      Session.create({ refresh_token: 'tok', refresh_token_expires_at: new Date() })
    ).rejects.toThrow(/user is required/);
  });
});

// ── QUESTION BANK ───────────────────────────────────────────────────────────
describe('QuestionBank Schema', () => {
  const validQ = () => ({
    question_text: 'What is 2+2?',
    options: [
      { label: 'A', text: '3' },
      { label: 'B', text: '4' },
      { label: 'C', text: '5' },
      { label: 'D', text: '6' },
    ],
    correct_answer: 'B',
    department: 'Mathematics',
    subject: 'Arithmetic',
    topic: 'Addition',
    year: 2023,
    difficulty: 'easy',
  });

  it('saves a valid question', async () => {
    const q = await QuestionBank.create(validQ());
    expect(q._id).toBeDefined();
  });

  it('rejects invalid difficulty enum', async () => {
    await expect(QuestionBank.create({ ...validQ(), difficulty: 'extreme' })).rejects.toThrow(
      /difficulty must be/
    );
  });

  it('rejects invalid correct_answer enum', async () => {
    await expect(QuestionBank.create({ ...validQ(), correct_answer: 'E' })).rejects.toThrow(
      /correct_answer must be/
    );
  });

  it('rejects missing required field: question_text', async () => {
    const data = validQ();
    delete data.question_text;
    await expect(QuestionBank.create(data)).rejects.toThrow(/question_text is required/);
  });
});

// ── KNOWLEDGE CHUNK ─────────────────────────────────────────────────────────
describe('KnowledgeChunk Schema', () => {
  it('saves a valid chunk with 768-dim embedding', async () => {
    const chunk = await KnowledgeChunk.create({
      content: 'Some lecture content',
      embedding: Array(768).fill(0.1),
      source_document: 'lecture1.pdf',
      source_type: 'pdf',
      department: 'CS',
      subject: 'AI',
    });
    expect(chunk._id).toBeDefined();
  });

  it('rejects embedding shorter than 768', async () => {
    await expect(
      KnowledgeChunk.create({
        content: 'text',
        embedding: Array(100).fill(0.1),
        source_document: 'doc.pdf',
        source_type: 'pdf',
        department: 'CS',
        subject: 'AI',
      })
    ).rejects.toThrow(/embedding must be an array of exactly 768 numbers/);
  });

  it('rejects invalid source_type enum', async () => {
    await expect(
      KnowledgeChunk.create({
        content: 'text',
        embedding: Array(768).fill(0.1),
        source_document: 'doc.pdf',
        source_type: 'word_doc',
        department: 'CS',
        subject: 'AI',
      })
    ).rejects.toThrow(/source_type must be/);
  });
});

// ── AUDIT LOG ────────────────────────────────────────────────────────────────
describe('AuditLog Schema — Immutability', () => {
  it('saves a new audit log', async () => {
    const user = await User.create(validUser());
    const log = await AuditLog.create({
      actor: user._id,
      actor_role: 'student',
      action: 'login',
      resource_type: 'auth',
    });
    expect(log._id).toBeDefined();
  });

  it('blocks re-save (update via .save())', async () => {
    const user = await User.create(validUser());
    const log = await AuditLog.create({
      actor: user._id,
      actor_role: 'student',
      action: 'login',
      resource_type: 'auth',
    });
    log.action = 'tampered';
    await expect(log.save()).rejects.toThrow(/AuditLog is immutable/);
  });

  it('blocks updateOne', async () => {
    await expect(
      AuditLog.updateOne({}, { action: 'tampered' })
    ).rejects.toThrow(/AuditLog is immutable/);
  });

  it('blocks deleteOne', async () => {
    await expect(AuditLog.deleteOne({})).rejects.toThrow(/AuditLog is immutable/);
  });

  it('rejects invalid actor_role enum', async () => {
    await expect(
      AuditLog.create({ actor: makeObjectId(), actor_role: 'superadmin', action: 'x', resource_type: 'y' })
    ).rejects.toThrow(/actor_role must be/);
  });
});

// ── ETHICS FLAG ──────────────────────────────────────────────────────────────
describe('EthicsFlag Schema', () => {
  it('saves a valid ethics flag', async () => {
    const user = await User.create(validUser());
    const flag = await EthicsFlag.create({
      student: user._id,
      department: 'CS',
      category: 'plagiarism',
      severity: 'medium',
      description: 'Student copied assignment',
    });
    expect(flag._id).toBeDefined();
    expect(flag.hod_notified_at).toBeNull();
  });

  it('rejects invalid severity enum', async () => {
    const user = await User.create(validUser());
    await expect(
      EthicsFlag.create({ student: user._id, department: 'CS', category: 'plagiarism', severity: 'extreme', description: 'x' })
    ).rejects.toThrow(/severity must be/);
  });

  it('rejects invalid category enum', async () => {
    const user = await User.create(validUser());
    await expect(
      EthicsFlag.create({ student: user._id, department: 'CS', category: 'bribery', severity: 'low', description: 'x' })
    ).rejects.toThrow(/Invalid ethics category/);
  });
});

// ── EXAM TIMETABLE ───────────────────────────────────────────────────────────
describe('ExamTimetable Schema', () => {
  it('saves with lockout_start and lockout_end', async () => {
    const now = new Date();
    const exam = await ExamTimetable.create({
      department: 'CS',
      semester: 5,
      academic_year: '2024-25',
      exam_type: 'end_sem',
      subject: 'DBMS',
      student_id: 'student-1',
      exam_date: now,
      start_time: '09:00',
      end_time: '12:00',
      lockout_start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      lockout_end: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    });
    expect(exam.lockout_start).toBeDefined();
    expect(exam.lockout_end).toBeDefined();
  });

  it('rejects invalid exam_type enum', async () => {
    const now = new Date();
    await expect(
      ExamTimetable.create({
        department: 'CS',
        semester: 5,
        academic_year: '2024-25',
        exam_type: 'quiz',
        subject: 'DBMS',
        student_id: 'student-1',
        exam_date: now,
        start_time: '09:00',
        end_time: '12:00',
        lockout_start: now,
        lockout_end: now,
      })
    ).rejects.toThrow(/Invalid exam_type/);
  });
});

// ── GRIEVANCE ────────────────────────────────────────────────────────────────
describe('Grievance Schema', () => {
  it('auto-generates reference_number', async () => {
    const user = await User.create(validUser());
    const g = await Grievance.create({
      student: user._id,
      department: 'CS',
      category: 'academic',
      subject: 'Grade issue',
      description: 'My grade was incorrectly recorded',
    });
    expect(g.reference_number).toMatch(/^GRV-/);
  });

  it('rejects invalid category enum', async () => {
    const user = await User.create(validUser());
    await expect(
      Grievance.create({ student: user._id, department: 'CS', category: 'unknown', subject: 'x', description: 'y' })
    ).rejects.toThrow(/Invalid grievance category/);
  });
});

// ── FEEDBACK FORM ────────────────────────────────────────────────────────────
describe('FeedbackForm Schema', () => {
  it('saves a valid feedback form', async () => {
    const user = await User.create(validUser());
    const fb = await FeedbackForm.create({
      student: user._id,
      department: 'CS',
      week_number: 5,
      academic_year: '2024-25',
      semester: 3,
      ratings: [{ category: 'overall', score: 4 }],
    });
    expect(fb._id).toBeDefined();
  });

  it('rejects duplicate submission for same student+week+year', async () => {
    const user = await User.create(validUser());
    const data = {
      student: user._id,
      department: 'CS',
      week_number: 10,
      academic_year: '2024-25',
      semester: 3,
      ratings: [{ category: 'overall', score: 3 }],
    };
    await FeedbackForm.create(data);
    await expect(FeedbackForm.create(data)).rejects.toThrow();
  });

  it('rejects invalid rating category enum', async () => {
    const user = await User.create(validUser());
    await expect(
      FeedbackForm.create({
        student: user._id,
        department: 'CS',
        week_number: 6,
        academic_year: '2024-25',
        semester: 3,
        ratings: [{ category: 'random_metric', score: 4 }],
      })
    ).rejects.toThrow(/Invalid rating category/);
  });
});

// ── HALLUCINATION REPORT ─────────────────────────────────────────────────────
describe('HallucinationReport Schema', () => {
  it('saves a valid report', async () => {
    const user = await User.create(validUser());
    const auditLog = await AuditLog.create({
      actor: user._id,
      actor_role: 'student',
      action: 'llm_query',
      resource_type: 'llm',
    });
    const report = await HallucinationReport.create({
      reported_by: user._id,
      department: 'CS',
      audit_log_ref: auditLog._id,
      original_prompt: 'Explain quicksort',
      hallucinated_response: 'Quicksort was invented in 2020',
      category: 'factual_error',
      severity: 'medium',
    });
    expect(report.vendor_notified).toBe(false);
    expect(report.review_status).toBe('pending');
  });

  it('rejects invalid category enum', async () => {
    const user = await User.create(validUser());
    const al = await AuditLog.create({ actor: user._id, actor_role: 'student', action: 'x', resource_type: 'y' });
    await expect(
      HallucinationReport.create({
        reported_by: user._id,
        department: 'CS',
        audit_log_ref: al._id,
        original_prompt: 'prompt',
        hallucinated_response: 'resp',
        category: 'wrong_tone',
        severity: 'low',
      })
    ).rejects.toThrow(/Invalid hallucination category/);
  });
});
