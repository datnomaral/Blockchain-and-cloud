import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🛡️ Bắt đầu khởi tạo tài khoản Admin...');

    const email = 'admin@rental.com';
    const password = 'admin';

    // 1. Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email }
    });

    if (existingAdmin) {
        console.log(`⚠️ Admin với email ${email} đã tồn tại!`);
        return;
    }

    // 2. Create Password Hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create Admin
    await prisma.user.create({
        data: {
            email: email,
            passwordHash: hashedPassword,
            fullName: 'Quản trị viên Hệ thống',
            phone: '0999999999',
            role: 'ADMIN',
            isVerified: true,
        },
    });

    console.log('✅ Đã tạo thành công tài khoản Admin!');
    console.log('----------------------------------------');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Pass : ${password}`);
    console.log('----------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
