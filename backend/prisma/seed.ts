import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Bắt đầu tạo dữ liệu mẫu...');

    // 1. Clean database
    await prisma.blockchainTransaction.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Đã xóa dữ liệu cũ');

    // 2. Create Password Hash
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 3. Create Users
    const landlord = await prisma.user.create({
        data: {
            email: 'chunha@demo.com',
            passwordHash: hashedPassword,
            fullName: 'Nguyễn Văn Chủ',
            phone: '0365986732',
            facebook: 'https://facebook.com/chunha.demo',
            zalo: '0365986732',
            role: 'LANDLORD',
            isVerified: true,
        },
    });

    const tenant1 = await prisma.user.create({
        data: {
            email: 'nguoithue@demo.com',
            passwordHash: hashedPassword,
            fullName: 'Trần Thị Người Thuê',
            phone: '0909876543',
            role: 'TENANT',
            isVerified: true,
        },
    });

    const tenant2 = await prisma.user.create({
        data: {
            email: 'sinhvien@demo.com',
            passwordHash: hashedPassword,
            fullName: 'Lê Văn Sinh Viên',
            phone: '0912345678',
            role: 'TENANT',
            isVerified: true,
        },
    });

    console.log('👤 Đã tạo 3 người dùng');

    // 4. Create Properties  
    const prop1 = await prisma.property.create({
        data: {
            ownerId: landlord.id,
            title: 'Căn hộ cao cấp Landmark 81',
            description: 'Căn hộ 2 phòng ngủ, view sông, đầy đủ nội thất cao cấp. Tiện ích hồ bơi, gym.',
            address: '208 Nguyễn Hữu Cảnh',
            city: 'Hồ Chí Minh',
            district: 'Bình Thạnh',
            ward: 'Phường 22',
            type: 'APARTMENT',
            price: 15000000,
            deposit: 30000000,
            area: 80,
            bedrooms: 2,
            bathrooms: 2,
            images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
            amenities: ['Wifi', 'Điều hòa', 'Bể bơi', 'Gym', 'Bãi đậu xe'],
            available: true,
        },
    });

    const prop2 = await prisma.property.create({
        data: {
            ownerId: landlord.id,
            title: 'Phòng trọ sinh viên Làng Đại học',
            description: 'Phòng mới xây, thoáng mát, gần trường ĐH KHTN. Giờ giấc tự do.',
            address: 'Khu phố 6',
            city: 'Hồ Chí Minh',
            district: 'Thủ Đức',
            ward: 'Linh Trung',
            type: 'ROOM',
            price: 3000000,
            deposit: 3000000,
            area: 25,
            bedrooms: 1,
            bathrooms: 1,
            images: ['https://images.unsplash.com/photo-1596276020587-8044fe049813?auto=format&fit=crop&w=800&q=80'],
            amenities: ['Wifi', 'Bãi đậu xe', 'Bảo vệ'],
            available: true,
        },
    });

    const prop3 = await prisma.property.create({
        data: {
            ownerId: landlord.id,
            title: 'Nhà nguyên căn Gò Vấp',
            description: 'Nhà 1 trệt 1 lầu, hẻm xe hơi, phù hợp gia đình hoặc nhóm bạn.',
            address: '123 Phan Văn Trị',
            city: 'Hồ Chí Minh',
            district: 'Gò Vấp',
            ward: 'Phường 5',
            type: 'HOUSE',
            price: 10000000,
            deposit: 20000000,
            area: 100,
            bedrooms: 3,
            bathrooms: 2,
            images: ['https://images.unsplash.com/photo-1600596542815-2495db98dada?auto=format&fit=crop&w=800&q=80'],
            amenities: ['Wifi', 'Bếp', 'Sân vườn'],
            available: true,
        },
    });

    console.log('🏠 Đã tạo 3 bất động sản');

    // 5. Create Contracts
    const contract1 = await prisma.contract.create({
        data: {
            propertyId: prop1.id,
            landlordId: landlord.id,
            tenantId: tenant1.id,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2025-02-01'),
            monthlyRent: 15000000,
            deposit: 30000000,
            paymentDay: 5,
            terms: 'Hợp đồng thuê căn hộ 1 năm. Thanh toán tiền nhà vào ngày 5 hàng tháng.',
            contractHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            status: 'SIGNED',
            signedAt: new Date(),
            landlordSignature: '0xsignature1',
            tenantSignature: '0xsignature2',
        },
    });

    const contract2 = await prisma.contract.create({
        data: {
            propertyId: prop2.id,
            landlordId: landlord.id,
            tenantId: tenant2.id,
            startDate: new Date('2024-03-01'),
            endDate: new Date('2024-09-01'),
            monthlyRent: 3000000,
            deposit: 3000000,
            paymentDay: 1,
            terms: 'Hợp đồng thuê phòng trọ 6 tháng.',
            contractHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            status: 'PENDING',
        },
    });

    console.log('📄 Đã tạo 2 hợp đồng mẫu');
    console.log('✅ Hoàn tất seeding!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
