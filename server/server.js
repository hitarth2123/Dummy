require('dotenv').config({ path: require('path').join(__dirname, '.env') });


const { env }             = require('./src/config/env');
const { connectDB }       = require('./src/config/db');
const { checkIndexExists }= require('./src/config/vectorDb');
const { verifyMailer }     = require('./src/config/mailer');
const app                 = require('./app');
const { startEmailWorker } = require('./src/jobs/email.worker');

// ── Cron Jobs ─────────────────────────────────────────────────────────────────
require('./src/jobs/lockoutCron');
require('./src/jobs/feedbackCron');
require('./src/jobs/ethicsEscalation.worker').startEthicsEscalationWorker();

const start = async () => {
  await verifyMailer();
  await connectDB();
  await checkIndexExists();   // non-blocking warning if index missing
  startEmailWorker();


  const PORT = env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`[Server] 🚀 Running on port ${PORT} in ${env.NODE_ENV} mode`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} is already in use. Stop the existing server or use another PORT.`);
      process.exit(1);
    }
    throw error;
  });
};

start().catch((error) => {
  console.error(`[Server] Startup failed: ${error.message}`);
  process.exit(1);
});
