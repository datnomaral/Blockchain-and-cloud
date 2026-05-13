const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Kiểm tra raw SQL
  const rows = await p.$queryRawUnsafe('SELECT id, full_name, status, ban_reason FROM users LIMIT 5');
  console.log('Raw DB values:');
  rows.forEach(r => console.log(r));

  // Thử update tất cả user chưa có status
  const updated = await p.$executeRawUnsafe(
    "UPDATE users SET status = 'ACTIVE' WHERE status IS NULL OR status = ''"
  );
  console.log('\nUpdated rows:', updated);

  // Kiểm tra lại
  const rows2 = await p.$queryRawUnsafe('SELECT id, full_name, status FROM users LIMIT 5');
  console.log('\nAfter fix:');
  rows2.forEach(r => console.log(r));
}

main().catch(console.error).finally(() => p.$disconnect());
