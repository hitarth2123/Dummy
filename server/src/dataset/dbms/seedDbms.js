/**
 * seedDbms.js
 * Seeds the QuestionBank collection with DBMS previous year questions from the JSON dataset.
 * Idempotent — skips if questions for a set already exist.
 *
 * Usage: node server/src/dataset/dbms/seedDbms.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_buddy';
const DB_NAME = process.env.DB_NAME || 'ai_buddy';

async function seed() {
  console.log('🌱 DBMS Seeder — Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, {
    dbName: DB_NAME,
    serverSelectionTimeoutMS: 10000,
  });
  console.log('✅ Connected to MongoDB');

  // Require model AFTER connection
  const QuestionBank = require('../../models/QuestionBank');

  const dataset = require('./dbms_question_bank.json');
  const { subject, department, sets } = dataset;

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const set of sets) {
    const { set_name, year, questions } = set;
    console.log(`\n📦 Processing: ${set_name} (${year}) — ${questions.length} questions`);

    // Check if this set is already seeded (by matching set_name + subject)
    const existingCount = await QuestionBank.countDocuments({ subject, set_name });
    if (existingCount >= questions.length) {
      console.log(`   ⏭️  Skipped — ${existingCount} questions already exist for ${set_name}`);
      totalSkipped += existingCount;
      continue;
    }

    // If partially seeded, check each question individually
    const docs = [];
    for (const q of questions) {
      const exists = await QuestionBank.findOne({
        subject,
        question_text: q.question_text,
      }).lean();

      if (exists) {
        totalSkipped += 1;
        continue;
      }

      docs.push({
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        department,
        subject,
        topic: q.topic,
        year,
        difficulty: q.difficulty || 'medium',
        source: 'pyq',
        set_name,
        is_verified: true,
      });
    }

    if (docs.length > 0) {
      await QuestionBank.insertMany(docs);
      console.log(`   ✅ Inserted ${docs.length} new questions`);
      totalInserted += docs.length;
    } else {
      console.log(`   ⏭️  All questions already exist`);
    }
  }

  console.log(`\n🎉 Seeding complete! Inserted: ${totalInserted}, Skipped: ${totalSkipped}`);
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('❌ Seeder failed:', err.message);
  process.exit(1);
});
