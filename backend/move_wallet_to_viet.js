const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Chuyển ví của Hải sang một ví ảo khác để tránh lỗi trùng lặp (Unique constraint)
    await prisma.user.update({
      where: { email: 'hai@gmail.com' },
      data: { walletAddress: '0x0000000000000000000000000000000000000999' }
    });

    // 2. Gán ví thật (Account 2) cho Việt
    await prisma.user.update({
      where: { email: 'viet@gmail.com' },
      data: { walletAddress: '0x2Bf2F6c089E97EE887b614770a424e7F2F1c7881' }
    });

    console.log('=== THÀNH CÔNG ===');
    console.log('1. Đã giải phóng ví thật khỏi tài khoản Hải.');
    console.log('2. Đã gán ví thật cho tài khoản Việt (viet@gmail.com).');
    console.log('Bây giờ bạn hãy tạo hợp đồng mới cho Việt nhé!');
  } catch (e) {
    console.error('Lỗi khi cập nhật:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
