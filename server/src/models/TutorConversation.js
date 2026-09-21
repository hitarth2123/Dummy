const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, trim: true },
  created_at: { type: Date, default: Date.now },
}, { _id: false });

const tutorConversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  topic: { type: String, required: true, trim: true },
  subtopic: { type: String, required: true, trim: true },
  messages: { type: [messageSchema], default: [] },
  last_sequence: { type: Number, default: 0 },
}, { timestamps: true });

tutorConversationSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('TutorConversation', tutorConversationSchema);
