jest.mock('../src/services/audit.service', () => ({ logAction: jest.fn().mockResolvedValue(undefined) }));

const { logAction } = require('../src/services/audit.service');
const { scanDistress } = require('../src/services/safety.service');

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
});
