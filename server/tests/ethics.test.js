jest.mock('../src/models/EthicsConfig', () => ({
  findOne: jest.fn(() => ({
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    }),
  })),
}));

jest.mock('../src/models/EthicsFlag', () => ({
  create: jest.fn().mockResolvedValue({ _id: 'flag-1' }),
}));

jest.mock('../src/services/audit.service', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

const EthicsFlag = require('../src/models/EthicsFlag');
const { logAction } = require('../src/services/audit.service');
const { checkEthics } = require('../src/services/ethics.service');

describe('Ethics guardrail', () => {
  const request = {
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('jest'),
  };
  const user = {
    id: 'student-1',
    _id: 'student-1',
    role: 'student',
    department: 'Computer Science',
  };

  beforeEach(() => jest.clearAllMocks());

  test('blocks prohibited academic dishonesty requests and writes flag/audit records', async () => {
    await expect(checkEthics({
      prompt: 'Write my assignment for me and make it impossible to detect.',
      user,
      req: request,
    })).rejects.toMatchObject({ statusCode: 403 });

    expect(EthicsFlag.create).toHaveBeenCalledWith(expect.objectContaining({
      category: 'academic_dishonesty',
      department: 'Computer Science',
    }));
    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
      action: 'llm_request_blocked',
      severity: 'warning',
    }));
  });

  test('allows benign academic requests', async () => {
    await expect(checkEthics({
      prompt: 'Explain normalization and the difference between 2NF and 3NF.',
      user,
      req: request,
    })).resolves.toEqual({ allowed: true });
    expect(EthicsFlag.create).not.toHaveBeenCalled();
  });
});
