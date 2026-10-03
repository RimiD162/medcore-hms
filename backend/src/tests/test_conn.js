const { PrismaClient } = require('@prisma/client');

async function test(url) {
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const res = await p.user.findFirst();
    console.log('SUCCESS with URL:', url.replace(/:[^:@]+@/, ':***@'), 'User:', res?.email);
    await p.$disconnect();
  } catch (err) {
    console.log('FAIL with URL:', url.replace(/:[^:@]+@/, ':***@'), 'Err:', err.message);
    await p.$disconnect();
  }
}

async function main() {
  const base = "postgresql://postgres.japdihgjaoifsklqqtqt:r%40i%40m%40i%40162@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";
  await test(base);
  await test(base + "?connection_limit=3");
  await test(base + "?connection_limit=3&connect_timeout=30");
}

main();
