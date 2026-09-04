/**
 * shared/schemas/userSchema.js
 * Zod schema for user data — shared between client (form validation) and server (API validation).
 */
const { z } = require('zod');

const ROLES = ['student', 'faculty', 'hod', 'admin'];

const registerSchema = z.object({
  name:       z.string().min(2, 'Name must be at least 2 characters'),
  email:      z.string().email('Invalid email address'),
  password:   z.string().min(8, 'Password must be at least 8 characters'),
  role:       z.enum(ROLES, { errorMap: () => ({ message: 'Invalid role' }) }),
  department: z.string().min(1, 'Department is required'),
  semester:   z.number().int().min(1).max(8).optional(),
});

const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema, ROLES };
