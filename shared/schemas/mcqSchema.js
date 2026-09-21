/**
 * shared/schemas/mcqSchema.js
 * Zod schema for MCQ question data — shared between client and server.
 */
const { z } = require('zod');

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const DIFFICULTIES  = ['easy', 'medium', 'hard'];

const optionSchema = z.object({
  label: z.enum(OPTION_LABELS),
  text:  z.string().min(1, 'Option text is required'),
});

const mcqSchema = z.object({
  question_text:  z.string().min(5, 'Question must be at least 5 characters'),
  options:        z.array(optionSchema).length(4, 'Must have exactly 4 options'),
  correct_answer: z.enum(OPTION_LABELS),
  explanation:    z.string().optional(),
  department:     z.string().min(1, 'Department is required'),
  subject:        z.string().min(1, 'Subject is required'),
  topic:          z.string().min(1, 'Topic is required'),
  year:           z.number().int().min(2000),
  difficulty:     z.enum(DIFFICULTIES),
});

module.exports = { mcqSchema, OPTION_LABELS, DIFFICULTIES };
