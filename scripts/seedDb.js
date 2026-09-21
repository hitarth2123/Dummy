/**
 * scripts/seedDb.js
 * Seeds the database with comprehensive initial data for development.
 * Usage: node scripts/seedDb.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });
process.env.SEED_MODE = 'true';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { env }  = require('../server/src/config/env');

const User                = require('../server/src/models/User');
const EthicsConfig        = require('../server/src/models/EthicsConfig');
const EmergencyContact    = require('../server/src/models/EmergencyContact');
const QuestionBank        = require('../server/src/models/QuestionBank');
const LearningPath        = require('../server/src/models/LearningPath');
const ExamTimetable       = require('../server/src/models/ExamTimetable');
const FacultyAvailability = require('../server/src/models/FacultyAvailability');
const ForumPost           = require('../server/src/models/ForumPost');

const KnowledgeChunk       = require('../server/src/models/KnowledgeChunk');

const seed = async () => {
  await mongoose.connect(env.MONGO_URI, { dbName: env.DB_NAME });
  console.log('[Seed] Connected to MongoDB');

  // ── Clear existing seed data ──
  await User.deleteMany({ email: { $regex: /@seed\.dev$/ } });
  await EthicsConfig.deleteMany({ department: { $in: ['Computer Science', 'Electronics and Communication'] } });
  await EmergencyContact.deleteMany({});
  await QuestionBank.deleteMany({});
  await LearningPath.deleteMany({});
  await ExamTimetable.deleteMany({});
  await FacultyAvailability.deleteMany({});
  await ForumPost.deleteMany({});
  await KnowledgeChunk.deleteMany({});
  console.log('[Seed] Cleared existing seed collections');

  // ── 1. Seed Users ──
  const seedUsers = [
    { name: 'Admin User', email: 'admin@seed.dev', password: 'Admin@12345', role: 'admin', department: 'Administration' },
    { name: 'HOD CS', email: 'hod@seed.dev', password: 'Hod@12345', role: 'hod', department: 'Computer Science', subject_expertise: ['DBMS', 'OS'] },
    { name: 'Faculty CS', email: 'faculty@seed.dev', password: 'Faculty@12345', role: 'faculty', department: 'Computer Science', subject_expertise: ['DBMS', 'OS'] },
    { name: 'Faculty ECE', email: 'faculty.ece@seed.dev', password: 'FacultyEce@12345', role: 'faculty', department: 'Electronics and Communication', subject_expertise: ['Networks', 'Embedded Systems'] },
    { name: 'Student One', email: 'student@seed.dev', password: 'Student@12345', role: 'student', department: 'Computer Science', semester: 5, enrolled_subjects: ['DBMS', 'Computer Networks', 'Operating Systems'] },
    { name: 'Student Two', email: 'student.two@seed.dev', password: 'StudentTwo@12345', role: 'student', department: 'Electronics and Communication', semester: 3, enrolled_subjects: ['Networks', 'Digital Logic'] },
  ];

  const users = await User.insertMany(await Promise.all(seedUsers.map(async ({ password, ...user }) => ({
    ...user,
    password_hash: await bcrypt.hash(password, 12),
  }))));
  console.log(`[Seed] Created ${users.length} users`);

  const hodCS = users.find((u) => u.email === 'hod@seed.dev');
  const facultyCS = users.find((u) => u.email === 'faculty@seed.dev');
  const facultyECE = users.find((u) => u.email === 'faculty.ece@seed.dev');
  const studentOne = users.find((u) => u.email === 'student@seed.dev');
  const adminUser = users.find((u) => u.email === 'admin@seed.dev');

  // ── 2. Seed Ethics Config ──
  await EthicsConfig.create({
    department: 'Computer Science',
    version: 1,
    prohibited_categories: ['academic_dishonesty', 'plagiarism', 'hate_speech', 'self_harm'],
    auto_escalate_severity: 'high',
    created_by: hodCS._id,
  });
  console.log('[Seed] Created ethics config for CS');

  // ── 3. Seed Emergency Contacts ──
  await EmergencyContact.create({
    campus: 'Main Campus',
    hospital: [{ name: 'City Hospital', phone: '0800-123-456' }],
    police:   [{ name: 'Local Police',  phone: '100' }],
    fire:     [{ name: 'Fire Station',  phone: '101' }],
    ambulance:[{ name: 'Ambulance',     phone: '102' }],
    updated_by: adminUser._id,
  });
  console.log('[Seed] Created emergency contacts');

  // ── 4. Seed Question Bank ──
  const sampleQuestions = [
    {
      question_text: 'Which normal form eliminates partial functional dependency?',
      options: [
        { label: 'A', text: 'First Normal Form (1NF)' },
        { label: 'B', text: 'Second Normal Form (2NF)' },
        { label: 'C', text: 'Third Normal Form (3NF)' },
        { label: 'D', text: 'Boyce-Codd Normal Form (BCNF)' },
      ],
      correct_answer: 'B',
      explanation: '2NF removes partial functional dependencies by ensuring all non-key attributes are fully dependent on the primary key.',
      department: 'Computer Science',
      subject: 'DBMS',
      topic: 'Database normalization',
      year: 2023,
      difficulty: 'medium',
      is_verified: true,
      created_by: facultyCS._id,
    },
    {
      question_text: 'What is the worst-case time complexity of QuickSort?',
      options: [
        { label: 'A', text: 'O(N log N)' },
        { label: 'B', text: 'O(N)' },
        { label: 'C', text: 'O(N^2)' },
        { label: 'D', text: 'O(log N)' },
      ],
      correct_answer: 'C',
      explanation: 'QuickSort exhibits O(N^2) time complexity when the pivot chosen is consistently the smallest or largest element.',
      department: 'Computer Science',
      subject: 'Data Structures',
      topic: 'Sorting algorithms',
      year: 2022,
      difficulty: 'easy',
      is_verified: true,
      created_by: facultyCS._id,
    },
    {
      question_text: 'Which scheduling algorithm can cause starvation?',
      options: [
        { label: 'A', text: 'Round Robin' },
        { label: 'B', text: 'First-Come, First-Served (FCFS)' },
        { label: 'C', text: 'Priority Scheduling' },
        { label: 'D', text: 'Shortest Remaining Time First' },
      ],
      correct_answer: 'C',
      explanation: 'Priority scheduling can cause low priority processes to wait indefinitely (starvation) unless aging is applied.',
      department: 'Computer Science',
      subject: 'Operating Systems',
      topic: 'CPU Scheduling',
      year: 2023,
      difficulty: 'medium',
      is_verified: true,
      created_by: facultyCS._id,
    },
    {
      question_text: 'What layer in the OSI model is responsible for end-to-end packet delivery?',
      options: [
        { label: 'A', text: 'Data Link Layer' },
        { label: 'B', text: 'Network Layer' },
        { label: 'C', text: 'Transport Layer' },
        { label: 'D', text: 'Session Layer' },
      ],
      correct_answer: 'C',
      explanation: 'The Transport layer (Layer 4) provides end-to-end communication services for applications.',
      department: 'Computer Science',
      subject: 'Computer Networks',
      topic: 'OSI Model',
      year: 2024,
      difficulty: 'easy',
      is_verified: true,
      created_by: facultyCS._id,
    },
    {
      question_text: 'What logic gate produces a HIGH output only when both inputs are different?',
      options: [
        { label: 'A', text: 'AND' },
        { label: 'B', text: 'OR' },
        { label: 'C', text: 'XOR' },
        { label: 'D', text: 'NAND' },
      ],
      correct_answer: 'C',
      explanation: 'XOR (Exclusive OR) outputs TRUE (1) only when the two binary inputs differ.',
      department: 'Electronics and Communication',
      subject: 'Digital Logic',
      topic: 'Logic Gates',
      year: 2023,
      difficulty: 'easy',
      is_verified: true,
      created_by: facultyECE._id,
    },
  ];
  await QuestionBank.insertMany(sampleQuestions);
  console.log('[Seed] Created question bank entries');

  // ── 5. Seed Learning Path ──
  await LearningPath.create({
    student: studentOne._id,
    department: 'Computer Science',
    subject: 'DBMS',
    semester: 5,
    overall_progress_pct: 35,
    generated_by: 'ai',
    topics: [
      { topic: 'Database normalization', subject: 'DBMS', order: 1, status: 'in_progress', score: 60 },
      { topic: 'B-Trees and Indexing', subject: 'DBMS', order: 2, status: 'pending', score: null },
      { topic: 'Transaction Isolation Levels', subject: 'DBMS', order: 3, status: 'pending', score: null },
      { topic: 'CPU Scheduling', subject: 'Operating Systems', order: 4, status: 'completed', score: 90 },
      { topic: 'OSI Model', subject: 'Computer Networks', order: 5, status: 'completed', score: 85 },
    ],
  });
  console.log('[Seed] Created initial learning path');

  // ── 6. Seed Exam Timetable ──
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  await ExamTimetable.create([
    {
      department: 'Computer Science',
      semester: 5,
      academic_year: '2025-26',
      exam_type: 'mid_sem',
      subject: 'Database Management Systems',
      subject_code: 'CS501',
      exam_date: nextWeek,
      start_time: '09:30',
      end_time: '11:30',
      venue: 'Hall A - Block 3',
      lockout_start: new Date(nextWeek.getTime() - 15 * 60 * 1000),
      lockout_end: new Date(nextWeek.getTime() + 120 * 60 * 1000),
      created_by: hodCS._id,
    },
    {
      department: 'Computer Science',
      semester: 5,
      academic_year: '2025-26',
      exam_type: 'mid_sem',
      subject: 'Computer Networks',
      subject_code: 'CS502',
      exam_date: twoWeeks,
      start_time: '14:00',
      end_time: '16:00',
      venue: 'Hall B - Block 3',
      lockout_start: new Date(twoWeeks.getTime() - 15 * 60 * 1000),
      lockout_end: new Date(twoWeeks.getTime() + 120 * 60 * 1000),
      created_by: hodCS._id,
    },
  ]);
  console.log('[Seed] Created exam timetable');

  // ── 7. Seed Faculty Availability ──
  await FacultyAvailability.create([
    {
      faculty: facultyCS._id,
      department: 'Computer Science',
      is_available: true,
      max_sessions_per_week: 5,
      slots: [
        { day_of_week: 'Monday', start_time: '10:00', end_time: '11:00', is_booked: false },
        { day_of_week: 'Wednesday', start_time: '14:00', end_time: '15:00', is_booked: false },
        { day_of_week: 'Friday', start_time: '11:30', end_time: '12:30', is_booked: false },
      ],
      notes: 'Available for DBMS and OS doubt sessions.',
    },
    {
      faculty: facultyECE._id,
      department: 'Electronics and Communication',
      is_available: true,
      max_sessions_per_week: 4,
      slots: [
        { day_of_week: 'Tuesday', start_time: '11:00', end_time: '12:00', is_booked: false },
        { day_of_week: 'Thursday', start_time: '15:00', end_time: '16:00', is_booked: false },
      ],
      notes: 'Available for Networks & Embedded doubts.',
    },
  ]);
  console.log('[Seed] Created faculty availability slots');

  // ── 8. Seed Forum Posts ──
  await ForumPost.create([
    {
      author: studentOne._id,
      department: 'Computer Science',
      type: 'question',
      title: 'How to understand BCNF vs 3NF decomposition?',
      body: 'I am struggling with functional dependencies when checking if a relation is in BCNF. Can anyone explain with an example?',
      tags: ['DBMS', 'Normalization', 'Exams'],
      subject: 'DBMS',
      upvotes: [facultyCS._id],
      upvote_count: 1,
    },
    {
      author: facultyCS._id,
      department: 'Computer Science',
      type: 'announcement',
      title: 'DBMS Mid-Sem Revision Session Schedule',
      body: 'We will hold a live doubt clearing session this Friday at 11:30 AM in Hall A. Please prepare your queries in advance.',
      tags: ['Announcement', 'DBMS'],
      subject: 'DBMS',
      is_pinned: true,
      upvote_count: 4,
    },
  ]);
  console.log('[Seed] Created forum discussion threads');

  // ── 9. Seed Knowledge Chunks for RAG ──
  const dummyEmbedding = Array(768).fill(0.01);
  await KnowledgeChunk.insertMany([
    {
      content: 'Database Management Systems (DBMS) organize data into structured tables using Relational Model principles. Normalization is the systematic process of decomposing tables to minimize data redundancy and prevent insertion, update, and deletion anomalies. First Normal Form (1NF) requires atomic values. Second Normal Form (2NF) eliminates partial functional dependencies. Third Normal Form (3NF) eliminates transitive dependencies, and Boyce-Codd Normal Form (BCNF) strictly requires every determinant to be a super key.',
      embedding: dummyEmbedding,
      source_document: 'DBMS_Course_Notes.pdf',
      source_type: 'pdf',
      department: 'Computer Science',
      subject: 'DBMS',
      topic: 'Database normalization',
      chunk_index: 0,
      token_count: 75,
    },
    {
      content: 'Operating Systems manage hardware resources and provide execution environments for programs. CPU scheduling algorithms include First-Come First-Served (FCFS), Shortest Job First (SJF), Priority Scheduling, and Round Robin (RR). Preemptive scheduling can interrupt running processes. Starvation occurs when low priority processes are indefinitely deferred, which is resolved using aging techniques.',
      embedding: dummyEmbedding,
      source_document: 'OS_Syllabus_Guide.pdf',
      source_type: 'pdf',
      department: 'Computer Science',
      subject: 'Operating Systems',
      topic: 'CPU Scheduling',
      chunk_index: 0,
      token_count: 65,
    },
    {
      content: 'The Open Systems Interconnection (OSI) model standardizes network communication into seven distinct layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application. The Network Layer (Layer 3) handles IP routing and packet forwarding across network boundaries, while the Transport Layer (Layer 4) ensures end-to-end reliability using TCP or UDP protocols.',
      embedding: dummyEmbedding,
      source_document: 'Networking_Fundamentals.pdf',
      source_type: 'pdf',
      department: 'Computer Science',
      subject: 'Computer Networks',
      topic: 'OSI Model',
      chunk_index: 0,
      token_count: 68,
    },
    {
      content: 'Data Structures structure data efficiently in memory. Sorting algorithms like QuickSort use divide-and-conquer strategy with an average time complexity of O(N log N) and a worst-case time complexity of O(N^2) when poor pivot selection occurs.',
      embedding: dummyEmbedding,
      source_document: 'Data_Structures_Overview.pdf',
      source_type: 'pdf',
      department: 'Computer Science',
      subject: 'Data Structures',
      topic: 'Sorting algorithms',
      chunk_index: 0,
      token_count: 45,
    },
    {
      content: 'Digital Logic design relies on fundamental logic gates including AND, OR, NOT, NAND, NOR, XOR, and XNOR. An XOR (Exclusive-OR) gate produces a logic HIGH output (1) if and only if the binary inputs differ.',
      embedding: dummyEmbedding,
      source_document: 'Digital_Electronics_Guide.pdf',
      source_type: 'pdf',
      department: 'Electronics and Communication',
      subject: 'Digital Logic',
      topic: 'Logic Gates',
      chunk_index: 0,
      token_count: 42,
    },
  ]);
  console.log('[Seed] Created RAG Knowledge Chunks');

  await mongoose.disconnect();
  console.log('[Seed] ✅ Done! Database successfully seeded with all function fixtures.');
};

seed().catch((err) => {
  console.error('[Seed] ❌ Failed:', err.message);
  process.exit(1);
});
