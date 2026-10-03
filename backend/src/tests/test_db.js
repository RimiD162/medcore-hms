const { PrismaClient } = require('@prisma/client');

async function testConnection(url) {
  console.log('Testing URL:', url.replace(/:[^:@]+@/, ':***@'));
  const client = new PrismaClient({
    datasources: {
      db: { url }
    }
  });

  try {
    const result = await client.$queryRaw`SELECT 1 as connected`;
    console.log('-> Success!', result);
    await client.$disconnect();
    return true;
  } catch (err) {
    console.log('-> Error:', err.message);
    await client.$disconnect();
    return false;
  }
}

async function main() {
  const base5432 = "postgresql://postgres.japdihgjaoifsklqqtqt:r%40i%40m%40i%40162@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";
  const base6543 = "postgresql://postgres.japdihgjaoifsklqqtqt:r%40i%40m%40i%40162@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const withParams5432 = "postgresql://postgres.japdihgjaoifsklqqtqt:r%40i%40m%40i%40162@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?connection_limit=5&pool_timeout=20";

  await testConnection(base5432);
  await testConnection(base6543);
  await testConnection(withParams5432);
}

main();
