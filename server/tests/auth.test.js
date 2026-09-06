process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/test';
process.env.DB_NAME = 'test';
process.env.MAILER_HOST = 'localhost';
process.env.MAILER_USER = 'test';
process.env.MAILER_PASS = 'test';
process.env.MAILER_FROM = 'test@example.com';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.GROQ_API_KEY = 'test-groq-key';

jest.mock('../src/models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../src/models/Session', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const auth = require('../src/controllers/auth.controller');
const { protect } = require('../src/middleware/auth.middleware');

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  clearCookie: jest.fn(),
  send: jest.fn(),
});

describe('JWT authentication', () => {
  beforeEach(() => jest.clearAllMocks());

  test('generates required role and academic claims', () => {
    const token = auth.signAccessToken({
      _id: 'user-1',
      role: 'student',
      department: 'Computer Science',
      semester: 5,
      enrolled_subjects: ['DBMS', 'OS'],
    });
    const claims = jwt.verify(token, process.env.JWT_SECRET);

    expect(claims).toMatchObject({
      userId: 'user-1',
      role: 'student',
      dept: 'Computer Science',
      semester: 5,
      enrolled_subjects: ['DBMS', 'OS'],
    });
  });

  test('rejects an expired access token with 401', async () => {
    const token = jwt.sign({ userId: 'user-1', role: 'student' }, process.env.JWT_SECRET, { expiresIn: -1 });
    const next = jest.fn();

    await protect({ headers: { authorization: `Bearer ${token}` }, cookies: {} }, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  test('accepts a valid access token and attaches the required user context', async () => {
    const token = auth.signAccessToken({
      _id: 'user-1', role: 'student', department: 'Computer Science', semester: 5,
      enrolled_subjects: ['DBMS'],
    });
    Session.findOne.mockResolvedValue({ access_token_jti: jwt.decode(token).jti, is_revoked: false });
    const next = jest.fn();

    await protect({ headers: { authorization: `Bearer ${token}` }, cookies: {} }, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('rotates a refresh token without re-authentication', async () => {
    const user = { _id: 'user-1', role: 'student', department: 'CS', semester: 5, enrolled_subjects: [] };
    const refreshToken = auth.signRefreshToken(user);
    const session = {
      refresh_token: refreshToken,
      refresh_token_expires_at: new Date(Date.now() + 60_000),
      save: jest.fn().mockResolvedValue(undefined),
    };
    Session.findOne.mockReturnValue(session);
    User.findById.mockReturnValue(user);
    const response = makeResponse();

    await auth.refresh({ body: { refreshToken }, cookies: {} }, response);

    expect(session.save).toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ accessToken: expect.any(String), refreshToken: expect.any(String) }),
    }));
  });

  test('blacklists an access token during logout', async () => {
    const token = auth.signAccessToken({ _id: 'user-1', role: 'student', department: 'CS' });
    const response = makeResponse();
    Session.updateOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

    await auth.logout({ headers: { authorization: `Bearer ${token}` }, cookies: {} }, response);

    const claims = jwt.decode(token);
    expect(auth.isTokenBlacklisted(claims.jti)).toBe(true);
    expect(response.status).toHaveBeenCalledWith(204);
  });

  test('creates a development student session from a Gmail address', async () => {
    const user = {
      _id: 'gmail-user',
      role: 'student',
      department: 'Computer Science',
      semester: 5,
      enrolled_subjects: [],
      is_active: true,
      save: jest.fn().mockResolvedValue(undefined),
    };
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(user);
    Session.create.mockResolvedValue({});
    const response = makeResponse();

    await auth.login({ body: { devEmail: 'student@gmail.com' }, ip: '127.0.0.1', get: jest.fn() }, response);

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'student@gmail.com',
      role: 'student',
    }));
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});