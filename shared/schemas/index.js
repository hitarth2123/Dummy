/**
 * shared/schemas/index.js
 * Barrel export for all shared Zod schemas.
 * Import from both client and server:
 *   const { mcqSchema, feedbackSchema, registerSchema } = require('ai-buddy-shared/schemas');
 */

const {
  mcqSchema,
  createMcqSchema,
  questionBankSchema,
  optionsObjectSchema,
  ragSourceSchema,
  OPTION_LABELS,
  DIFFICULTIES,
  DEPARTMENTS,
} = require('./mcqSchema');

const {
  feedbackSchema,
  ratingSchema,
  RATING_CATEGORIES,
} = require('./feedbackSchema');

const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  ROLES,
} = require('./userSchema');

module.exports = {
  // MCQ / Question Bank
  mcqSchema,
  createMcqSchema,
  questionBankSchema,
  optionsObjectSchema,
  ragSourceSchema,

  // Feedback
  feedbackSchema,
  ratingSchema,

  // User / Auth
  registerSchema,
  loginSchema,
  updateProfileSchema,

  // Constants
  OPTION_LABELS,
  DIFFICULTIES,
  DEPARTMENTS,
  RATING_CATEGORIES,
  ROLES,
};
