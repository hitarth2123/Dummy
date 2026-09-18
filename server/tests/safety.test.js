jest.mock('../src/services/audit.service', () => ({ logAction: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../src/models/User', () => ({
  findById: jest.fn(),
  find: jest.fn(),
}));
jest.mock('../src/services/mailer.service', () => ({ sendDistressAlert: jest.fn().mockResolvedValue(undefined) }));

const { logAction } = require('../src/services/audit.service');
const User = require('../src/models/User');
const { sendDistressAlert } = require('../src/services/mailer.service');
const { scanDistress, escalateDistress, isDistressPrompt, getDistressSeverity } = require('../src/services/safety.service');

describe('Distress safety scan', () => {
  beforeEach(() => jest.clearAllMocks());

  test('logs a distress keyword without blocking', async () => {
    const result = await scanDistress({
      prompt: 'I want to hurt myself',
      user: { id: 'student-1', role: 'student', department: 'CS' },
      req: { ip: '127.0.0.1', get: () => 'test' },
    });
    expect(result.flagged).toBe(true);
    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'distress_keyword_detected' }));
  });

  test('leaves benign tutor prompts unchanged', async () => {
    await expect(scanDistress({ prompt: 'Explain normalization', user: { id: 'student-1' } })).resolves.toEqual({ flagged: false });
    expect(logAction).not.toHaveBeenCalled();
  });

  test('flags shame and family-disgrace language as acute distress', () => {
    expect(isDistressPrompt('I am gonna disgrace my family with this low grade')).toBeTruthy();
    expect(isDistressPrompt('I cannot face my family after this result')).toBeTruthy();
  });

  test('classifies exam difficulty as warning and imminent-risk language as critical', async () => {
    expect(isDistressPrompt('Is the exam too tough?')).toBeTruthy();
    expect(getDistressSeverity('Is the exam too tough?')).toBe('warning');
    await expect(scanDistress({ prompt: 'I am feeling exam pressure', user: { id: 'student-1' }, req: {} })).resolves.toMatchObject({ flagged: true, severity: 'warning' });
    expect(getDistressSeverity('I am gonna disgrace my family with this low grade')).toBe('critical');
  });

  test('immediately emails department faculty/HOD and admins with the full chat context', async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'student-1', name: 'Student One', email: 'student@example.com', department: 'CS', semester: 5 }) }) });
    User.find.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ email: 'hod@cs.edu' }, { email: 'faculty@cs.edu' }, { email: 'admin@institution.edu' }]) }) });

    const result = await escalateDistress({
      prompt: 'I am feeling exam pressure and might do something drastic.',
      response: 'I am sorry you are under pressure. Please contact a trusted person now.',
      user: { id: 'student-1', role: 'student', department: 'CS' },
      req: { ip: '127.0.0.1', get: () => 'test' },
      confirmed: true,
    });

    expect(result).toMatchObject({ flagged: true, notified: true, recipient_count: 3 });
    expect(sendDistressAlert).toHaveBeenCalledWith('hod@cs.edu,faculty@cs.edu,admin@institution.edu', expect.objectContaining({
      STUDENT_NAME: 'Student One',
      PROMPT: 'I am feeling exam pressure and might do something drastic.',
      AI_RESPONSE: 'I am sorry you are under pressure. Please contact a trusted person now.',
    }));
    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'distress_escalated', severity: 'critical', metadata: expect.objectContaining({ student_message: expect.any(String), ai_response: expect.any(String) }) }));
  });
});
