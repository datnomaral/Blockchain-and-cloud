const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { fullName: 'Nguy\u1ec5n Nh\u1eadt H\u1ea3i' }
    });
    console.log('NGƯỜI THUÊ:', user.fullName);
    console.log('EMAIL:', user.email);
    console.log('VÍ TRONG DB:', user.walletAddress);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
