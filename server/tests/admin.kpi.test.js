process.env.NODE_ENV = 'test';

jest.mock('../src/models/ExamTimetable', () => ({
  findOneAndUpdate: jest.fn(),
}));
jest.mock('../src/models/AuditLog', () => ({ create: jest.fn().mockResolvedValue({ _id: 'audit-1' }) }));
jest.mock('../src/models/User', () => ({ countDocuments: jest.fn() }));
jest.mock('../src/models/Session', () => ({ countDocuments: jest.fn() }));
jest.mock('../src/models/FeedbackForm', () => ({ find: jest.fn() }));
jest.mock('../src/models/EthicsFlag', () => ({ countDocuments: jest.fn() }));
jest.mock('../src/models/HallucinationReport', () => ({ countDocuments: jest.fn() }));
jest.mock('../src/models/PracticeAttempt', () => ({ distinct: jest.fn() }));

const ExamTimetable = require('../src/models/ExamTimetable');
const AuditLog = require('../src/models/AuditLog');
const { unlockTimetable, getDashboard } = require('../src/controllers/admin.controller');

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const flushController = () => new Promise((resolve) => setImmediate(resolve));

describe('admin EPIC-10 controls', () => {
  beforeEach(() => jest.clearAllMocks());

  test('manually unlocks one student subject and writes an audit entry', async () => {
    const timetable = { _id: 'exam-1', department: 'CS', student_id: 'student-1', subject: 'DBMS', is_manually_unlocked: true };
    ExamTimetable.findOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(timetable) });
    const response = makeResponse();

    await unlockTimetable({ params: { student_id: 'student-1', subject: 'DBMS' }, body: { reason: 'Approved accommodation' }, user: { id: 'admin-1', role: 'admin' }, ip: '127.0.0.1', get: () => 'test-agent' }, response, jest.fn());
    await flushController();

    expect(ExamTimetable.findOneAndUpdate).toHaveBeenCalledWith({ student_id: 'student-1', subject: 'DBMS' }, { $set: { is_manually_unlocked: true } }, { new: true });
    expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ actor: 'admin-1', action: 'exam_lockout_manual_unlock', metadata: expect.objectContaining({ student_id: 'student-1', subject: 'DBMS', reason: 'Approved accommodation' }) }));
    expect(response.json).toHaveBeenCalledWith({ success: true, data: timetable });
  });

  test('aggregates dashboard KPIs from the backing collections', async () => {
    require('../src/models/Session').countDocuments.mockResolvedValue(4);
    require('../src/models/User').countDocuments.mockResolvedValue(10);
    require('../src/models/PracticeAttempt').distinct.mockResolvedValue(['student-1', 'student-2']);
    require('../src/models/EthicsFlag').countDocuments.mockResolvedValue(3);
    require('../src/models/HallucinationReport').countDocuments.mockResolvedValue(2);
    require('../src/models/FeedbackForm').find.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([{ ratings: [{ score: 4 }, { score: 5 }], createdAt: new Date() }]) });
    const response = makeResponse();

    await getDashboard({ query: {}, user: { role: 'admin' } }, response, jest.fn());
    await flushController();

    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.objectContaining({ active_sessions: 4, engagement_percent: 20, open_ethics_flags: 3, hallucination_reports: 2, average_feedback_rating: 4.5, weekly_trends: expect.any(Array) }) }));
  });
});
