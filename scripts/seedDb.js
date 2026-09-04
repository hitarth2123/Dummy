/**
 * scripts/seedDb.js
 * Seeds the database with initial data for development.
 * Usage: node scripts/seedDb.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

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

  const hash = await bcrypt.hash('Password@123', 12);

  // ── Seed Users ──
  const users = await User.insertMany([
    { name: 'Admin User',   email: 'admin@seed.dev',   password_hash: hash, role: 'admin',   department: 'Administration' },
    { name: 'HOD CS',       email: 'hod@seed.dev',     password_hash: hash, role: 'hod',     department: 'Computer Science' },
    { name: 'Faculty CS',   email: 'faculty@seed.dev', password_hash: hash, role: 'faculty', department: 'Computer Science', subject_expertise: ['DBMS', 'OS'] },
    { name: 'Student One',  email: 'student@seed.dev', password_hash: hash, role: 'student', department: 'Computer Science', semester: 5, enrolled_subjects: ['DBMS', 'CN', 'OS'] },
  ]);
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
