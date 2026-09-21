jest.mock('../src/models/ForumPost', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock('../src/models/Grievance', () => ({ create: jest.fn() }));
jest.mock('../src/models/User', () => ({ find: jest.fn() }));
jest.mock('../src/services/mailer.service', () => ({ sendMail: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../src/services/audit.service', () => ({ logAction: jest.fn().mockResolvedValue(undefined) }));

const ForumPost = require('../src/models/ForumPost');
const { listPosts, createPost } = require('../src/services/forum.service');

describe('Forum service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('lists only the authenticated department with pagination', async () => {
    const query = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'post-1', department: 'CS' }]),
    };
    ForumPost.find.mockReturnValue(query);
    ForumPost.countDocuments.mockResolvedValue(1);

    const result = await listPosts({
      user: { role: 'student', id: 'student-1', department: 'CS' },
      department: 'CS',
      query: { page: '2' },
    });

    expect(ForumPost.find).toHaveBeenCalledWith(expect.objectContaining({ department: 'CS', is_hidden: false }));
    expect(query.skip).toHaveBeenCalledWith(20);
    expect(result.pagination).toMatchObject({ page: 2, limit: 20, total: 1 });
  });

  test('rejects announcements from students', async () => {
    await expect(createPost({
      user: { id: 'student-1', role: 'student' },
      department: 'CS',
      body: { type: 'announcement', title: 'Notice', body: 'Body' },
    })).rejects.toMatchObject({ statusCode: 403 });
  });

  test('limits private posts to their author for students', async () => {
    const query = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    ForumPost.find.mockReturnValue(query);
    ForumPost.countDocuments.mockResolvedValue(0);

    await listPosts({
      user: { role: 'student', id: 'student-1', department: 'CS' },
      department: 'CS',
      query: {},
    });

    expect(ForumPost.find).toHaveBeenCalledWith(expect.objectContaining({
      $or: [
        { visibility: { $ne: 'private' } },
        { author: 'student-1' },
      ],
    }));
  });

  test('allows faculty and HOD to see private department posts', async () => {
    const query = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    ForumPost.find.mockReturnValue(query);
    ForumPost.countDocuments.mockResolvedValue(0);

    await listPosts({
      user: { role: 'faculty', id: 'faculty-1', department: 'CS' },
      department: 'CS',
      query: {},
    });

    expect(ForumPost.find).toHaveBeenCalledWith(expect.objectContaining({
      $or: [
        { visibility: { $ne: 'private' } },
        { author: 'faculty-1' },
        { visibility: 'private' },
      ],
    }));
  });
});
