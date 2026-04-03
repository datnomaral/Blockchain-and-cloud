const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const contractId = '70fff7b8-d52f-45ab-bcb2-7d19af6ba81c';
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        landlord: true,
        tenant: true
      }
    });

    if (!contract) {
      console.log('KHÔNG TÌM THẤY HỢP ĐỒNG!');
      return;
    }

    console.log('=== THÔNG TIN HỢP ĐỒNG ===');
    console.log('ID:', contract.id);
    console.log('Status:', contract.status);
    console.log('Contract Hash:', contract.contractHash);
    console.log('Blockchain TX Hash:', contract.blockchainTxHash);
    console.log('Landlord Signature:', contract.landlordSignature ? 'Đã ký' : 'Chưa ký');
    console.log('Tenant Signature:', contract.tenantSignature ? 'Đã ký' : 'Chưa ký');
    console.log('Landlord Wallet (DB):', contract.landlord.walletAddress);
    console.log('Tenant Wallet (DB):', contract.tenant.walletAddress);

  } catch (e) {
    console.error('Lỗi khi kiểm tra database:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
