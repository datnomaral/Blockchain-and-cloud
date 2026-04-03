const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      where: {
        walletAddress: null
      }
    });
    console.log('Tìm thấy ' + users.length + ' người dùng chưa có ví.');
    for (let i = 0; i < users.length; i++) {
      const dummyAddress = '0x' + (i + 1).toString().padStart(40, '0');
      await prisma.user.update({
        where: { id: users[i].id },
        data: { walletAddress: dummyAddress }
      });
      console.log('Đã cập nhật ví ảo cho: ' + users[i].fullName);
    }
    console.log('Hoàn tất!');
  } catch (e) {
    console.error('Lỗi:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();