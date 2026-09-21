const mongoose = require('mongoose');

const { Schema } = mongoose;

const EMBEDDING_DIM = 768;

/**
 * KnowledgeChunk Schema
 * Stores RAG knowledge chunks with 768-dim embeddings.
 */
const knowledgeChunkSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, 'content is required'],
      trim: true,
    },
    embedding: {
      type: [Number],
      required: [true, 'embedding is required'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === EMBEDDING_DIM,
        message: `embedding must be an array of exactly ${EMBEDDING_DIM} numbers`,
      },
    },
    source_document: {
      type: String,
      required: [true, 'source_document is required'],
      trim: true,
    },
    source_type: {
      type: String,
      required: [true, 'source_type is required'],
      enum: {
        values: ['pdf', 'video_transcript', 'url', 'manual'],
        message: 'source_type must be pdf, video_transcript, url, or manual',
      },
    },
    department: {
      type: String,
      required: [true, 'department is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'subject is required'],
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    subtopic: {
      type: String,
      trim: true,
    },
    chunk_index: {
      type: Number,
      default: 0,
    },
    token_count: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

knowledgeChunkSchema.index({ department: 1, subject: 1 });
knowledgeChunkSchema.index({ source_document: 1 });

module.exports = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
