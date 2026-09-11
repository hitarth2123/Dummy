require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });

const mongoose = require('mongoose');
const definition = require('../server/src/config/vector-index.json');

const createVectorIndex = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
    serverSelectionTimeoutMS: 10000,
  });

  const collection = mongoose.connection.db.collection('knowledgechunks');
  const indexes = await collection.listSearchIndexes().toArray();
  const existing = indexes.find((index) => index.name === definition.name);

  if (existing) {
    console.log(`[VectorDB] Index "${definition.name}" already exists with status: ${existing.status || 'unknown'}`);
  } else {
    await collection.createSearchIndex({
      name: definition.name,
      type: definition.type,
      definition: definition.definition,
    });
    console.log(`[VectorDB] Created index "${definition.name}" on ai_buddy.knowledgechunks`);
  }

  await mongoose.disconnect();
};

createVectorIndex().catch(async (error) => {
  console.error(`[VectorDB] Failed to create index: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
