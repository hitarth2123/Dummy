process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/test';
process.env.DB_NAME = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32';
process.env.MAILER_HOST = 'smtp.institution.edu';
process.env.MAILER_PORT = '587';
process.env.MAILER_USER = 'mailer';
process.env.MAILER_PASS = 'password';
process.env.MAILER_FROM = 'ai-buddy@institution.edu';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.GEMINI_API_KEY = 'gemini';
process.env.GROQ_API_KEY = 'groq';

const mockTransporter = {
  verify: jest.fn(),
  sendMail: jest.fn(),
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

const { transporter, verifyMailer } = require('../src/config/mailer');
const { sendMail } = require('../src/services/mailer.service');

describe('Mailer service', () => {
  beforeEach(() => {
    mockTransporter.verify.mockClear();
    mockTransporter.sendMail.mockClear();
  });

  test('creates a STARTTLS transporter with TLS 1.2 minimum', () => {
    const nodemailer = require('nodemailer');
    const options = nodemailer.createTransport.mock.calls[0][0];
    expect(options).toMatchObject({
      port: 587,
      secure: false,
      requireTLS: true,
      tls: { minVersion: 'TLSv1.2' },
    });
  });

  test('sends generic HTML and text mail through the institution sender', async () => {
    mockTransporter.sendMail.mockResolvedValue({ messageId: 'message-1' });

    await expect(sendMail('student@institution.edu', 'Welcome', '<p>Hello</p>', 'Hello')).resolves.toEqual({ messageId: 'message-1' });
    expect(mockTransporter.sendMail).toHaveBeenCalledWith({
      from: 'ai-buddy@institution.edu',
      to: 'student@institution.edu',
      subject: 'Welcome',
      html: '<p>Hello</p>',
      text: 'Hello',
    });
  });

  test('rejects incomplete messages', async () => {
    await expect(sendMail('', 'Subject', '<p>Body</p>')).rejects.toThrow('to, subject, and html or text are required');
  });

  test('verifies SMTP successfully', async () => {
    mockTransporter.verify.mockResolvedValue(true);
    await expect(verifyMailer()).resolves.toBeUndefined();
  });

  test('exits when SMTP verification fails', async () => {
    mockTransporter.verify.mockRejectedValue(new Error('invalid SMTP credentials'));
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);

    await verifyMailer();

    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
  });
});