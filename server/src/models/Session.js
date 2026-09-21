const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Session Schema
 * Stores JWT metadata and refresh token state per user login.
 */
const sessionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user is required'],
    },
    refresh_token: {
      type: String,
      required: [true, 'refresh_token is required'],
    },
    refresh_token_expires_at: {
      type: Date,
      required: [true, 'refresh_token_expires_at is required'],
    },
    access_token_jti: {
      // JWT ID of the latest issued access token (for revocation)
      type: String,
    },
    ip_address: {
      type: String,
      trim: true,
    },
    user_agent: {
      type: String,
      trim: true,
    },
    is_revoked: {
      type: Boolean,
      default: false,
    },
    revoked_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1 });
sessionSchema.index({ refresh_token: 1 }, { unique: true });
sessionSchema.index({ refresh_token_expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model('Session', sessionSchema);
