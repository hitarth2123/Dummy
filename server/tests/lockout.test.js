process.env.NODE_ENV = 'test';

jest.mock('../src/models/ExamTimetable', () => ({
  findOne: jest.fn(),
}));

const ExamTimetable = require('../src/models/ExamTimetable');
const { lockout } = require('../src/middleware/lockout.middleware');

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('exam lockout middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 423 with the timetable unlock timestamp for the matching student and subject', async () => {
    const unlocksAt = new Date(Date.now() + 30 * 60 * 1000);
    const query = { select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({ lockout_end: unlocksAt }) };
    ExamTimetable.findOne.mockReturnValue(query);
    const response = makeResponse();
    const next = jest.fn();

    await lockout({
      originalUrl: '/api/llm/chat',
      body: { subject: 'DBMS' },
      query: {},
      params: {},
      user: { id: 'student-1' },
    }, response, next);

    expect(ExamTimetable.findOne).toHaveBeenCalledWith(expect.objectContaining({ student_id: 'student-1', subject: 'DBMS' }));
    expect(response.status).toHaveBeenCalledWith(423);
    expect(response.json).toHaveBeenCalledWith({ message: 'AI features locked during your exam', unlocks_at: unlocksAt.toISOString() });
    expect(next).not.toHaveBeenCalled();
  });

  test('allows emergency routes without consulting the timetable', async () => {
    const next = jest.fn();
    await lockout({ originalUrl: '/api/student/emergency', body: {}, query: {}, params: {}, user: { id: 'student-1' } }, makeResponse(), next);
    expect(ExamTimetable.findOne).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  test('allows requests after lockout_end', async () => {
    const query = { select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(null) };
    ExamTimetable.findOne.mockReturnValue(query);
    const next = jest.fn();
    await lockout({ originalUrl: '/api/llm/chat', body: { subject: 'DBMS' }, query: {}, params: {}, user: { id: 'student-1' } }, makeResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });
});
