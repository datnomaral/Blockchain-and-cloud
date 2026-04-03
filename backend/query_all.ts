
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- KHỞI TẠO TRUY VẤN DỮ LIỆU ---');

    console.log('\n[1] DANH SÁCH NGƯỜI DÙNG (USERS):');
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            walletAddress: true
        }
    });
    console.table(users);

    console.log('\n[2] DANH SÁCH BẤT ĐỘNG SẢN (PROPERTIES):');
    const properties = await prisma.property.findMany({
        select: {
            id: true,
            title: true,
            price: true,
            address: true,
            available: true
        }
    });
    console.table(properties);

    console.log('\n[3] DANH SÁCH HỢP ĐỒNG (CONTRACTS):');
    const contracts = await prisma.contract.findMany({
        select: {
            id: true,
            contractHash: true,
            status: true,
            monthlyRent: true,
            signedAt: true
        }
    });
    console.table(contracts);
}

main()
    .catch((e) => {
        console.error('Lỗi khi truy vấn:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
