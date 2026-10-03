const { PrismaClient } = require('@prisma/client');

const rawPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

const prisma = rawPrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        let retries = 3;
        while (retries > 0) {
          try {
            return await query(args);
          } catch (error) {
            retries--;
            const isConnError =
              error.message?.includes("Can't reach database server") ||
              error.message?.includes('connection') ||
              error.message?.includes('ConnectionReset') ||
              error.code === 'P1001' ||
              error.code === 'P2024';

            if (isConnError && retries > 0) {
              await new Promise((r) => setTimeout(r, 800));
              try {
                await rawPrisma.$connect();
              } catch (_) {}
              continue;
            }
            throw error;
          }
        }
      },
    },
  },
});

module.exports = prisma;
