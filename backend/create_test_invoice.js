const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTestInvoice() {
  try {
    // Tìm một hợp đồng ACTIVE hoặc SIGNED
    const contract = await prisma.contract.findFirst({
      where: { OR: [{ status: 'ACTIVE' }, { status: 'SIGNED' }] }
    });

    if (!contract) {
      console.log('Không tìm thấy hợp đồng nào đang hoạt động để tạo hóa đơn!');
      return;
    }

    // Tạo hóa đơn giả lập cho tháng 5
    const invoice = await prisma.invoice.create({
      data: {
        contractId: contract.id,
        amount: contract.monthlyRent,
        description: 'Tiền thuê tháng 5 (Được tạo tự động để test)',
        month: 5,
        year: 2026,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 5)), // Hạn chót: 5 ngày tới
        status: 'UNPAID'
      }
    });

    console.log(`Đã tạo Hóa đơn test thành công:`, invoice);
  } catch (error) {
    console.error('Lỗi tạo hóa đơn:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestInvoice();
