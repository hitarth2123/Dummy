/**
 * shared/schemas/feedbackSchema.js
 * Zod schema for weekly student feedback form.
 */
const { z } = require('zod');

const RATING_CATEGORIES = ['teaching_quality', 'content_clarity', 'ai_helpfulness', 'platform_usability', 'overall'];

const ratingSchema = z.object({
  category: z.enum(RATING_CATEGORIES),
  score:    z.number().int().min(1).max(5),
});

const feedbackSchema = z.object({
  week_number:   z.number().int().min(1).max(53),
  academic_year: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-YY'),
  semester:      z.number().int().min(1).max(8),
  ratings:       z.array(ratingSchema).min(1, 'At least one rating required'),
  comments:      z.string().max(1000).optional(),
});

module.exports = { feedbackSchema, RATING_CATEGORIES };
