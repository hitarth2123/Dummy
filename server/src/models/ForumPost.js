const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * ForumPost Schema
 * General forum post that may also function as a grievance.
 * Supports threading (parent_post), hiding, and grievance linkage.
 */
const forumPostSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'author is required'],
    },
    department: {
      type: String,
      required: [true, 'department is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'type is required'],
      enum: {
        values: ['question', 'discussion', 'announcement', 'grievance', 'resource'],
        message: 'Invalid post type',
      },
    },
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      maxlength: [300, 'title must be at most 300 characters'],
    },
    body: {
      type: String,
      required: [true, 'body is required'],
      trim: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    tags: {
      type: [String],
      default: [],
    },
    subject: {
      type: String,
      trim: true,
    },
    // Threading
    parent_post: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost',
      default: null,
    },
    // Grievance linkage
    is_grievance: {
      type: Boolean,
      default: false,
    },
    grievance_ref: {
      type: Schema.Types.ObjectId,
      ref: 'Grievance',
      default: null,
    },
    // Moderation
    is_hidden: {
      type: Boolean,
      default: false,
    },
    hidden_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    hidden_reason: {
      type: String,
      trim: true,
      default: null,
    },
    // Engagement
    upvotes: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    upvote_count: {
      type: Number,
      default: 0,
    },
    is_anonymous: {
      type: Boolean,
      default: false,
    },
    is_pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

forumPostSchema.index({ department: 1, type: 1, createdAt: -1 });
forumPostSchema.index({ department: 1, visibility: 1, createdAt: -1 });
forumPostSchema.index({ is_grievance: 1 });
forumPostSchema.index({ parent_post: 1 });
forumPostSchema.index({ author: 1 });
forumPostSchema.index({ title: 'text', body: 'text', tags: 'text' });

module.exports = mongoose.model('ForumPost', forumPostSchema);
