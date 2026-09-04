require('dotenv').config({ path: require('path').join(__dirname, '.env') });


const { env }             = require('./src/config/env');
const { connectDB }       = require('./src/config/db');
const { checkIndexExists }= require('./src/config/vectorDb');
const app                 = require('./app');

// ── Cron Jobs ─────────────────────────────────────────────────────────────────
require('./src/jobs/lockoutCron');
require('./src/jobs/feedbackCron');

const start = async () => {
  await connectDB();
  await checkIndexExists();   // non-blocking warning if index missing


  const PORT = env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[Server] 🚀 Running on port ${PORT} in ${env.NODE_ENV} mode`);
  });
};

start();
