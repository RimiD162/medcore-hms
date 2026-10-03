require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/config/prisma');

const PORT = process.env.PORT || 5000;

async function connectWithRetry(maxRetries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ PostgreSQL database connected successfully.');
      return;
    } catch (err) {
      console.warn(`⚠️ DB connection attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function startServer() {
  try {
    // Verify DB connectivity with retry
    await connectWithRetry();

    const server = app.listen(PORT, () => {
      console.log(`🚀 MedCore HMS Backend running on http://localhost:${PORT}`);
      console.log(`🩺 Doctor API ready at http://localhost:${PORT}/api/v1/doctor`);
      console.log(`💚 Health endpoint at http://localhost:${PORT}/api/v1/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, gracefully shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Database disconnected. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ Failed to start server after retries:', err);
    process.exit(1);
  }
}

startServer();
