const ForumPost = require('../models/ForumPost');
const Grievance = require('../models/Grievance');
const User = require('../models/User');
const { sendMail } = require('./mailer.service');
const { logAction } = require('./audit.service');

const buildScope = (req) => {
  const department = req.department || req.user?.dept || req.user?.department;
  return department ? { department } : {};
};

const visibleFilter = (req) => ({
  ...buildScope(req),
  is_hidden: req.user?.role === 'student' ? false : { $in: [false, true] },
});

const listPosts = async (req) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 20;
  const filter = { ...visibleFilter(req), parent_post: null };
  if (req.query.mine === 'true') filter.author = req.user.id || req.user._id;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const [posts, total] = await Promise.all([
    ForumPost.find(filter)
      .populate('author', 'name role department')
      .sort({ is_pinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ForumPost.countDocuments(filter),
  ]);
  return { posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const createPost = async (req) => {
  const { type, title, body, tags, subject, is_anonymous } = req.body;
  if (type === 'announcement' && !['faculty', 'hod'].includes(req.user.role)) {
    const error = new Error('Only faculty and HOD users can create announcements.');
    error.statusCode = 403;
    throw error;
  }
  const post = await ForumPost.create({
    author: req.user.id || req.user._id,
    department: req.department,
    type,
    title,
    body,
    tags,
    subject,
    is_anonymous: Boolean(is_anonymous),
    is_grievance: type === 'grievance',
  });
  return ForumPost.findById(post._id).populate('author', 'name role department').lean();
};

const getPost = async (req) => {
  const post = await ForumPost.findOne({ _id: req.params.id, ...visibleFilter(req) })
    .populate('author', 'name role department')
    .lean();
  if (!post) return null;
  post.replies = await ForumPost.find({ parent_post: post._id, ...visibleFilter(req) })
    .populate('author', 'name role department')
    .sort({ createdAt: 1 })
    .lean();
  return post;
};

const replyToPost = async (req) => {
  const parent = await ForumPost.findOne({ _id: req.params.id, ...visibleFilter(req) });
  if (!parent) return null;
  const reply = await ForumPost.create({
    author: req.user.id || req.user._id,
    department: req.department,
    type: 'discussion',
    title: `Reply to: ${parent.title}`,
    body: req.body.body,
    parent_post: parent._id,
    subject: parent.subject,
  });
  return ForumPost.findById(reply._id).populate('author', 'name role department').lean();
};

const hidePost = async (req) => ForumPost.findOneAndUpdate(
  { _id: req.params.id, department: req.department },
  { is_hidden: true, hidden_by: req.user.id || req.user._id, hidden_reason: req.body.reason || 'Moderated by staff' },
  { new: true }
).lean();

const flagGrievance = async (req) => {
  const post = await ForumPost.findOne({ _id: req.params.id, ...visibleFilter(req) });
  if (!post) return null;
  const grievance = await Grievance.create({
    student: req.user.id || req.user._id,
    department: req.department,
    category: req.body.category || 'other',
    subject: post.title,
    description: req.body.description || post.body,
    forum_post_ref: post._id,
    is_anonymous: Boolean(req.body.is_anonymous),
  });
  post.is_grievance = true;
  post.grievance_ref = grievance._id;
  await post.save();

  const recipients = await User.find({ role: { $in: ['admin', 'hod'] }, ...(req.user.role === 'student' ? { department: req.department } : {}) }).select('email');
  const addresses = [...new Set([
    process.env.GRIEVANCE_RECIPIENT_EMAIL || 'caper.pvt.ltd@example.com',
    ...recipients.map((recipient) => recipient.email),
  ])].filter(Boolean).join(',');
  if (addresses) {
    await sendMail(addresses, `Grievance ${grievance.reference_number}`, `<p>New grievance: <strong>${grievance.reference_number}</strong></p><p>${grievance.description}</p>`, `New grievance ${grievance.reference_number}: ${grievance.description}`);
  }
  await logAction({
    actor: req.user.id || req.user._id,
    actor_role: req.user.role,
    action: 'grievance_created',
    resource_type: 'grievance',
    resource_id: String(grievance._id),
    department: req.department,
    metadata: { reference_number: grievance.reference_number },
  });
  return grievance;
};

module.exports = { listPosts, createPost, getPost, replyToPost, hidePost, flagGrievance, buildScope };
