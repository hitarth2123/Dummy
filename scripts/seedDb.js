/**
 * scripts/seedDb.js
 * Seeds the database with initial data for development.
 * Usage: node scripts/seedDb.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });
process.env.SEED_MODE = 'true';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { env }  = require('../server/src/config/env');

const User             = require('../server/src/models/User');
const EthicsConfig     = require('../server/src/models/EthicsConfig');
const EmergencyContact = require('../server/src/models/EmergencyContact');

const seed = async () => {
  await mongoose.connect(env.MONGO_URI, { dbName: env.DB_NAME });
  console.log('[Seed] Connected to MongoDB');

  // ── Clear existing seed data ──
  await User.deleteMany({ email: { $regex: /@seed\.dev$/ } });
  console.log('[Seed] Cleared existing seed users');

  // ── Seed Users ──
  const seedUsers = [
    { name: 'Admin User', email: 'admin@seed.dev', password: 'Admin@12345', role: 'admin', department: 'Administration' },
    { name: 'HOD CS', email: 'hod@seed.dev', password: 'Hod@12345', role: 'hod', department: 'Computer Science', subject_expertise: ['DBMS', 'OS'] },
    { name: 'Faculty CS', email: 'faculty@seed.dev', password: 'Faculty@12345', role: 'faculty', department: 'Computer Science', subject_expertise: ['DBMS', 'OS'] },
    { name: 'Faculty ECE', email: 'faculty.ece@seed.dev', password: 'FacultyEce@12345', role: 'faculty', department: 'Electronics and Communication', subject_expertise: ['Networks', 'Embedded Systems'] },
    { name: 'Student One', email: 'student@seed.dev', password: 'Student@12345', role: 'student', department: 'Computer Science', semester: 5, enrolled_subjects: ['DBMS', 'CN', 'OS'] },
    { name: 'Student Two', email: 'student.two@seed.dev', password: 'StudentTwo@12345', role: 'student', department: 'Electronics and Communication', semester: 3, enrolled_subjects: ['Networks', 'Digital Logic'] },
  ];
  const users = await User.insertMany(await Promise.all(seedUsers.map(async ({ password, ...user }) => ({
    ...user,
    password_hash: await bcrypt.hash(password, 12),
  }))));
  console.log(`[Seed] Created ${users.length} users`);

  // ── Seed Ethics Config ──
  const hod = users.find(u => u.role === 'hod');
  await EthicsConfig.create({
    department: 'Computer Science',
    version: 1,
    prohibited_categories: ['academic_dishonesty', 'plagiarism', 'hate_speech', 'self_harm'],
    auto_escalate_severity: 'high',
    created_by: hod._id,
  });
  console.log('[Seed] Created ethics config for CS');

  // ── Seed Emergency Contacts ──
  await EmergencyContact.create({
    campus: 'Main Campus',
    hospital: [{ name: 'City Hospital', phone: '0800-123-456' }],
    police:   [{ name: 'Local Police',  phone: '100' }],
    fire:     [{ name: 'Fire Station',  phone: '101' }],
    ambulance:[{ name: 'Ambulance',     phone: '102' }],
    updated_by: users.find(u => u.role === 'admin')._id,
  });
  console.log('[Seed] Created emergency contacts');

  await mongoose.disconnect();
  console.log('[Seed] ✅ Done');
};

seed().catch((err) => {
  console.error('[Seed] ❌ Failed:', err.message);
  process.exit(1);
});
