const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { fullName: { contains: 'Thành Việt' } }
    });
    if (user) {
      console.log('NGƯỜI THUÊ:', user.fullName);
      console.log('EMAIL:', user.email);
      console.log('VÍ TRONG DB:', user.walletAddress);
    } else {
      console.log('Không tìm thấy người dùng Nguyễn Thành Việt');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
