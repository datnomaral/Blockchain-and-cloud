const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Kiểm tra kiểu dữ liệu của cột status
  const colInfo = await p.$queryRawUnsafe(`
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'status'
  `);
  console.log('Column info:', colInfo);

  // Kiểm tra enum types
  const enumInfo = await p.$queryRawUnsafe(`
    SELECT typname, enumlabel 
    FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE typname LIKE '%tatus%' OR typname LIKE '%user%'
    ORDER BY typname, enumsortorder
  `);
  console.log('Enum types:', enumInfo);
}

main().catch(console.error).finally(() => p.$disconnect());
