require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/config/prisma');
const { initDemoCache } = require('./src/middleware/auth');

const PORT = process.env.PORT || 5000;

async function connectWithRetry(maxRetries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ PostgreSQL database connected successfully.');
      await initDemoCache();
      return;
    } catch (err) {
      console.warn(`⚠️ DB connection attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt === maxRetries) {
        console.warn('⚠️ Will retry connecting on next incoming request.');
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`🚀 MedCore HMS Backend running on http://localhost:${PORT}`);
    console.log(`🩺 Doctor API ready at http://localhost:${PORT}/api/v1/doctor`);
    console.log(`💉 Nurse API ready at http://localhost:${PORT}/api/v1/nurse`);
    console.log(`💚 Health endpoint at http://localhost:${PORT}/api/v1/health`);
  });

  // Verify DB connectivity in background
  connectWithRetry();

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}, gracefully shutting down...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
      } catch (_) {}
      console.log('✅ Database disconnected. Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

startServer();
