const catchAsync = require('../utils/catchAsync');
const forumService = require('../services/forum.service');

const list = catchAsync(async (req, res) => res.json({ success: true, data: await forumService.listPosts(req) }));
const create = catchAsync(async (req, res) => res.status(201).json({ success: true, data: await forumService.createPost(req) }));
const get = catchAsync(async (req, res) => {
  const post = await forumService.getPost(req);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  return res.json({ success: true, data: post });
});
const reply = catchAsync(async (req, res) => {
  const post = await forumService.replyToPost(req);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  return res.status(201).json({ success: true, data: post });
});
const remove = catchAsync(async (req, res) => {
  const post = await forumService.hidePost(req);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  return res.json({ success: true, data: post });
});
const flagGrievance = catchAsync(async (req, res) => {
  const grievance = await forumService.flagGrievance(req);
  if (!grievance) return res.status(404).json({ success: false, message: 'Post not found' });
  return res.status(201).json({ success: true, data: {
    reference_number: grievance.reference_number,
    status: grievance.status,
  } });
});

module.exports = { list, create, get, reply, remove, flagGrievance };
