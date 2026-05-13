const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const cols = await p.$queryRawUnsafe(`
    SELECT table_name, column_name, data_type, udt_name, column_default
    FROM information_schema.columns 
    WHERE table_name IN ('properties','contracts')
    AND column_name IN ('approval_status','terminate_reason','terminated_at')
  `);
  console.log('New columns:', JSON.stringify(cols, null, 2));
}

main().catch(console.error).finally(() => p.$disconnect());
