jest.mock('../src/models/EthicsFlag', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));
jest.mock('../src/models/User', () => ({ find: jest.fn() }));
jest.mock('../src/services/mailer.service', () => ({ sendEthicsEscalation: jest.fn() }));

const EthicsFlag = require('../src/models/EthicsFlag');
const User = require('../src/models/User');
const { sendEthicsEscalation } = require('../src/services/mailer.service');
const { dispatchE04 } = require('../src/jobs/ethicsEscalation.worker');

describe('E-04 ethics escalation worker', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sends only student ID and category, then stores notification timestamp', async () => {
    EthicsFlag.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'flag-1', hod_notified_at: null }) });
    User.find.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ email: 'hod@example.test' }]) }) });
    sendEthicsEscalation.mockResolvedValue(undefined);

    await expect(dispatchE04({ data: { flagId: 'flag-1', department: 'CS', category: 'plagiarism', studentId: 'student-1' } }))
      .resolves.toMatchObject({ delivered: true });

    expect(sendEthicsEscalation).toHaveBeenCalledWith('hod@example.test', expect.objectContaining({
      STUDENT_ID: 'student-1',
      CATEGORY: 'plagiarism',
    }));
    expect(sendEthicsEscalation.mock.calls[0][1]).not.toHaveProperty('TRIGGER_CONTENT');
    expect(EthicsFlag.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'flag-1', hod_notified_at: null },
      expect.objectContaining({ hod_notified_by: 'email', resolution_status: 'escalated' }),
    );
  });
});
