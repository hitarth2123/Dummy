const mongoose = require('mongoose');
const { env } = require('./env');

const logger = console; // Replace with winston/pino in a later epic

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1 second base for exponential backoff

let retryCount = 0;

const isDatabaseReady = () => mongoose.connection.readyState === 1;

/**
 * Connects to MongoDB Atlas with exponential backoff retry logic.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI, {
      dbName: env.DB_NAME,
      // Mongoose 6+ defaults are good; explicit opts kept for clarity
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    retryCount = 0; // Reset on successful connection
    logger.info(`[DB] Connected to MongoDB Atlas — db: ${env.DB_NAME}`);
  } catch (err) {
    retryCount += 1;

    if (retryCount > MAX_RETRIES) {
      logger.error(
        `[DB] Connection failed after ${MAX_RETRIES} retries. Last error: ${err.message}`
      );
      process.exit(1); // Clear failure — let process manager restart
    }

    const delay = BASE_DELAY_MS * 2 ** (retryCount - 1); // Exponential: 1s, 2s, 4s, 8s, 16s
    logger.warn(
      `[DB] Connection attempt ${retryCount}/${MAX_RETRIES} failed. Retrying in ${delay}ms… Error: ${err.message}`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
    return connectDB(); // Recursive retry
  }
};

// ── Event Listeners ──────────────────────────────────────────────────────────

mongoose.connection.on('connected', () => {
  logger.info('[DB] Mongoose connection established');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('[DB] Mongoose disconnected from Atlas');
});

mongoose.connection.on('reconnected', () => {
  logger.info('[DB] Mongoose reconnected to Atlas');
});

mongoose.connection.on('error', (err) => {
  logger.error(`[DB] Mongoose connection error: ${err.message}`);
});

// ── Graceful Shutdown ────────────────────────────────────────────────────────

const gracefulShutdown = async (signal) => {
  logger.info(`[DB] ${signal} received — closing MongoDB connection`);
  await mongoose.connection.close();
  logger.info('[DB] MongoDB connection closed. Exiting.');
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = { connectDB, isDatabaseReady };
