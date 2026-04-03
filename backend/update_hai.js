const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.update({
      where: { email: 'hai@gmail.com' },
      data: { walletAddress: '0x2Bf2F6c089E97EE887b614770a424e7F2F1c7881' }
    });
    console.log(`THÀNH CÔNG: Đã cập nhật ví thật cho Hải (${user.fullName})`);
  } catch (e) {
    console.error('Lỗi khi cập nhật database:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
