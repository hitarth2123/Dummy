jest.mock('../src/models/EthicsConfig', () => ({
  findOne: jest.fn(() => ({
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    }),
  })),
}));
jest.mock('../src/models/EthicsFlag', () => ({ create: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../src/services/audit.service', () => ({ logAction: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../src/services/groqEthics.service', () => ({ classifyEthics: jest.fn() }));
jest.mock('../src/jobs/ethicsEscalation.queue', () => ({ enqueueEthicsEscalation: jest.fn().mockResolvedValue(null) }));

const EthicsFlag = require('../src/models/EthicsFlag');
const { logAction } = require('../src/services/audit.service');
const { classifyEthics } = require('../src/services/groqEthics.service');
const { checkEthics } = require('../src/services/ethics.service');

const user = { id: 'student-1', role: 'student', department: 'CS' };
const req = { ip: '127.0.0.1', get: jest.fn().mockReturnValue('jest') };

describe('Layered ethics classifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    EthicsFlag.create.mockResolvedValue({ _id: 'flag-1' });
  });

  test('uses Groq only for an inconclusive layer-one result and allows benign content', async () => {
    classifyEthics.mockResolvedValue({ decision: 'BENIGN', provider: 'groq' });

    await expect(checkEthics({ prompt: 'Can you explain academic integrity?', user, req })).resolves.toEqual({ allowed: true });

    expect(classifyEthics).toHaveBeenCalledWith({ prompt: 'Can you explain academic integrity?', category: 'other' });
    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'ethics_layer1_classified' }));
    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
      action: 'ethics_layer2_classified',
      metadata: expect.objectContaining({ decision: 'BENIGN' }),
    }));
    expect(EthicsFlag.create).not.toHaveBeenCalled();
  });

  test('blocks a Groq-confirmed violation and records both classifier decisions', async () => {
    classifyEthics.mockResolvedValue({ decision: 'VIOLATION', provider: 'groq' });

    await expect(checkEthics({ prompt: 'I need help with something questionable', user, req }))
      .rejects.toMatchObject({ statusCode: 403 });

    expect(EthicsFlag.create).toHaveBeenCalledWith(expect.objectContaining({ category: 'other' }));
    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'ethics_layer2_classified' }));
  });
});
