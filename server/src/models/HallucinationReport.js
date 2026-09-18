const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * HallucinationReport Schema
 * Links an AuditLog entry, captures the hallucinated response,
 * and tracks vendor notification status.
 */
const hallucinationReportSchema = new Schema(
  {
    reported_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'reported_by is required'],
    },
    department: {
      type: String,
      required: [true, 'department is required'],
      trim: true,
    },
    audit_log_ref: {
      type: Schema.Types.ObjectId,
      ref: 'AuditLog',
      default: null,
    },
    // Prompt that triggered the hallucination
    original_prompt: {
      type: String,
      required: [true, 'original_prompt is required'],
      trim: true,
    },
    // The hallucinated AI response
    hallucinated_response: {
      type: String,
      required: [true, 'hallucinated_response is required'],
      trim: true,
    },
    // Correct/expected answer if known
    correct_response: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      required: [true, 'category is required'],
      enum: {
        values: ['factual_error', 'fabricated_reference', 'out_of_scope', 'misleading', 'other'],
        message: 'Invalid hallucination category',
      },
    },
    severity: {
      type: String,
      required: [true, 'severity is required'],
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'severity must be low, medium, or high',
      },
    },
    subject: {
      type: String,
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    llm_model: {
      type: String,
      trim: true,
    },
    // Vendor notification
    vendor_notified: {
      type: Boolean,
      default: false,
    },
    vendor_notified_at: {
      type: Date,
      default: null,
    },
    screenshot_url: { type: String, trim: true, default: null },
    screenshot_name: { type: String, trim: true, default: null },
    vendor_ticket_id: {
      type: String,
      trim: true,
      default: null,
    },
    // Internal review
    review_status: {
      type: String,
      enum: {
        values: ['pending', 'verified', 'dismissed', 'fixed'],
        message: 'Invalid review_status',
      },
      default: 'pending',
    },
    reviewed_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
    review_notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

hallucinationReportSchema.index({ department: 1, review_status: 1 });
hallucinationReportSchema.index({ reported_by: 1 });
hallucinationReportSchema.index({ audit_log_ref: 1 });
hallucinationReportSchema.index({ vendor_notified: 1, createdAt: -1 });

module.exports = mongoose.model('HallucinationReport', hallucinationReportSchema);
