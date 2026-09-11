const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * AuditLog Schema — IMMUTABLE
 * No update or delete operations are permitted on this collection.
 * Pre-save hook blocks any re-save of an existing document.
 */
const auditLogSchema = new Schema(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'actor is required'],
    },
    actor_role: {
      type: String,
      required: [true, 'actor_role is required'],
      enum: {
        values: ['student', 'faculty', 'hod', 'admin', 'system'],
        message: 'actor_role must be student, faculty, hod, admin, or system',
      },
    },
    action: {
      type: String,
      required: [true, 'action is required'],
      trim: true,
    },
    resource_type: {
      type: String,
      required: [true, 'resource_type is required'],
      trim: true,
    },
    resource_id: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    ip_address: {
      type: String,
      trim: true,
    },
    user_agent: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    severity: {
      type: String,
      enum: {
        values: ['info', 'warning', 'critical'],
        message: 'severity must be info, warning, or critical',
      },
      default: 'info',
    },
  },
  {
    timestamps: true,
    // Prevent .save() from updating existing docs
  }
);

// ── IMMUTABILITY GUARDS ──────────────────────────────────────────────────────

// Block update operations at query level
const BLOCKED_OPS = ['update', 'updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'];
BLOCKED_OPS.forEach((op) => {
  auditLogSchema.pre(op, function blockUpdate() {
    throw new Error('AuditLog is immutable: update operations are not permitted');
  });
});

// Block re-save of an existing document
auditLogSchema.pre('save', function blockResave(next) {
  if (!this.isNew) {
    return next(new Error('AuditLog is immutable: update via save() is not permitted'));
  }
  return next();
});

// Block delete operations
const BLOCKED_DELETE_OPS = ['deleteOne', 'deleteMany', 'findOneAndDelete'];
BLOCKED_DELETE_OPS.forEach((op) => {
  auditLogSchema.pre(op, function blockDelete() {
    throw new Error('AuditLog is immutable: delete operations are not permitted');
  });
});

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ department: 1, createdAt: -1 });
auditLogSchema.index({ resource_type: 1, resource_id: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
