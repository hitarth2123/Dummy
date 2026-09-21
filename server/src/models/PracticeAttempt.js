const mongoose = require('mongoose');

const { Schema } = mongoose;

const practiceAttemptSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, trim: true, default: '' },
  subject: { type: String, trim: true, default: '' },
  topic: { type: String, required: true, trim: true },
  score: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 1 },
  score_pct: { type: Number, required: true, min: 0, max: 100 },
}, { timestamps: true });

practiceAttemptSchema.index({ student: 1, createdAt: -1 });
practiceAttemptSchema.index({ student: 1, topic: 1 });

module.exports = mongoose.model('PracticeAttempt', practiceAttemptSchema);
