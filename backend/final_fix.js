const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const contractId = '70fff7b8-d52f-45ab-bcb2-7d19af6ba81c';
    const realLandlordWallet = '0xB6eD69faf0B0eA2ee22a4Ac77Ba74786CB99d87F';
    const realTxHash = '0x78af6455fb325e1d1f3868e43ac1558b8fa424da7bdd5eb0d4404a5dc968007b';

    // 1. Cập nhật ví thật cho Bà Chủ (Landlord) bằng updateMany vì fullName không là unique
    await prisma.user.updateMany({
      where: { fullName: 'bà chủ' },
      data: { walletAddress: realLandlordWallet }
    });

    // 2. Cập nhật Transaction Hash cho hợp đồng
    await prisma.contract.update({
      where: { id: contractId },
      data: { blockchainTxHash: realTxHash }
    });

    console.log('=== FIX HOÀN TẤT ===');
    console.log('1. Đã cập nhật ví thật cho Landlord.');
    console.log('2. Đã gắn Transaction Hash cho hợp đồng.');
    console.log('Bây giờ bạn hãy F5 trang web và cho người thuê Hải ký lại nhé!');

  } catch (e) {
    console.error('Lỗi khi fix:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
