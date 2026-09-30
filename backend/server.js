require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log('');
    console.log('🏥  MedCore HMS API');
    console.log(`🚀  Server running on http://localhost:${PORT}`);
    console.log(`🌍  Environment : ${process.env.NODE_ENV}`);
    console.log(`🔗  Health check: http://localhost:${PORT}/api/health`);
    console.log('');
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
