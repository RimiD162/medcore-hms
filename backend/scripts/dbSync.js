const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

process.env.CHECKPOINT_DISABLE = '1';
process.env.PRISMA_TELEMETRY_INFORMATION_COLLECTION = 'false';
process.env.CI = '1';

console.log('🔄 Generating Prisma Client...');
try {
  const genOutput = execSync('node ./node_modules/prisma/build/index.js generate', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, CHECKPOINT_DISABLE: '1', PRISMA_TELEMETRY_INFORMATION_COLLECTION: 'false', CI: '1' },
    stdio: 'pipe'
  });
  console.log(genOutput.toString());
} catch (err) {
  console.error('Error generating client:', err.stderr ? err.stderr.toString() : err.message);
}

console.log('🔄 Pushing DB Schema to Postgres...');
try {
  const pushOutput = execSync('node ./node_modules/prisma/build/index.js db push --accept-data-loss', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, CHECKPOINT_DISABLE: '1', PRISMA_TELEMETRY_INFORMATION_COLLECTION: 'false', CI: '1' },
    stdio: 'pipe'
  });
  console.log(pushOutput.toString());
} catch (err) {
  console.error('Error pushing schema:', err.stderr ? err.stderr.toString() : err.message);
}
