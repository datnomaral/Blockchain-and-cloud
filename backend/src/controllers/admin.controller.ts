import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ==================== THỐNG KÊ ====================

/**
 * GET /api/admin/stats
 * Thống kê tổng quan hệ thống
 */
export const getStats = async (req: Request, res: Response) => {
    try {
        const [
            totalProperties,
            availableProperties,
            totalUsers,
            landlordCount,
            tenantCount,
            totalContracts,
            activeContracts,
            signedContracts,
            draftContracts,
        ] = await Promise.all([
            prisma.property.count(),
            prisma.property.count({ where: { available: true } }),
            prisma.user.count(),
            prisma.user.count({ where: { role: 'LANDLORD' } }),
            prisma.user.count({ where: { role: 'TENANT' } }),
            prisma.contract.count(),
            prisma.contract.count({ where: { status: 'ACTIVE' } }),
            prisma.contract.count({ where: { status: 'SIGNED' } }),
            prisma.contract.count({ where: { status: 'DRAFT' } }),
        ]);

        // Tổng doanh thu từ các hợp đồng đang hoạt động (monthlyRent * 12 ước tính)
        const activeContractData = await prisma.contract.findMany({
            where: { status: { in: ['ACTIVE', 'SIGNED'] } },
            select: { monthlyRent: true },
        });
        const totalRevenue = activeContractData.reduce((sum, c) => sum + c.monthlyRent, 0);

        // Hợp đồng mới trong 30 ngày qua
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newContractsThisMonth = await prisma.contract.count({
            where: { createdAt: { gte: thirtyDaysAgo } },
        });

        // Người dùng mới trong 30 ngày qua
        const newUsersThisMonth = await prisma.user.count({
            where: { createdAt: { gte: thirtyDaysAgo } },
        });

        // Phân bố loại phòng
        const propertyTypes = await prisma.property.groupBy({
            by: ['type'],
            _count: { type: true },
        });

        // Hợp đồng theo tháng (6 tháng gần nhất)
        const contractsByMonth = await getContractsByMonth();

        res.json({
            success: true,
            data: {
                properties: {
                    total: totalProperties,
                    available: availableProperties,
                    rented: totalProperties - availableProperties,
                },
                users: {
                    total: totalUsers,
                    landlords: landlordCount,
                    tenants: tenantCount,
                    newThisMonth: newUsersThisMonth,
                },
                contracts: {
                    total: totalContracts,
                    active: activeContracts,
                    signed: signedContracts,
                    draft: draftContracts,
                    newThisMonth: newContractsThisMonth,
                },
                revenue: {
                    monthlyTotal: totalRevenue,
                    annualEstimate: totalRevenue * 12,
                },
                charts: {
                    propertyTypes: propertyTypes.map((pt) => ({
                        type: pt.type,
                        count: pt._count.type,
                    })),
                    contractsByMonth,
                },
            },
        });
    } catch (error: any) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: error.message || 'Lỗi khi lấy thống kê' });
    }
};

async function getContractsByMonth() {
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        const count = await prisma.contract.count({
            where: { createdAt: { gte: start, lte: end } },
        });
        months.push({
            month: start.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
            count,
        });
    }
    return months;
}

// ==================== QUẢN LÝ PHÒNG ====================

/**
 * GET /api/admin/properties
 * Lấy tất cả phòng (admin view) với tìm kiếm & lọc
 */
export const adminGetProperties = async (req: Request, res: Response) => {
    try {
        const { search, type, available, city, page = '1', limit = '10' } = req.query;

        const where: any = {};

        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { address: { contains: search as string, mode: 'insensitive' } },
                { city: { contains: search as string, mode: 'insensitive' } },
            ];
        }
        if (type) where.type = type;
        if (city) where.city = { contains: city as string, mode: 'insensitive' };
        if (available !== undefined) where.available = available === 'true';

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where,
                include: {
                    owner: { select: { id: true, fullName: true, email: true, phone: true } },
                    _count: { select: { contracts: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit as string),
            }),
            prisma.property.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                properties,
                pagination: {
                    total,
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    totalPages: Math.ceil(total / parseInt(limit as string)),
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/admin/properties/:id
 */
export const adminGetPropertyById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const property = await prisma.property.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, fullName: true, email: true, phone: true } },
                contracts: {
                    include: {
                        tenant: { select: { id: true, fullName: true, email: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!property) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
        }

        res.json({ success: true, data: { property } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const propertySchema = z.object({
    title: z.string().min(5),
    description: z.string().optional(),
    address: z.string().min(5),
    city: z.string(),
    district: z.string(),
    ward: z.string(),
    type: z.enum(['ROOM', 'APARTMENT', 'HOUSE', 'HOTEL']),
    price: z.number().positive(),
    deposit: z.number().positive(),
    area: z.number().positive().optional(),
    bedrooms: z.number().int().positive().optional(),
    bathrooms: z.number().int().positive().optional(),
    available: z.boolean().optional(),
});

/**
 * POST /api/admin/properties
 */
export const adminCreateProperty = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const data = propertySchema.parse(req.body);

        const property = await prisma.property.create({
            data: { ...data, ownerId: userId },
            include: { owner: { select: { id: true, fullName: true, email: true } } },
        });

        res.status(201).json({ success: true, message: 'Tạo phòng thành công', data: { property } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PUT /api/admin/properties/:id
 */
export const adminUpdateProperty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existing = await prisma.property.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
        }

        const property = await prisma.property.update({
            where: { id },
            data: req.body,
            include: { owner: { select: { id: true, fullName: true, email: true } } },
        });

        res.json({ success: true, message: 'Cập nhật phòng thành công', data: { property } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/admin/properties/:id
 */
export const adminDeleteProperty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existing = await prisma.property.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
        }

        await prisma.property.delete({ where: { id } });
        res.json({ success: true, message: 'Xóa phòng thành công' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== QUẢN LÝ KHÁCH HÀNG ====================

/**
 * GET /api/admin/users
 */
export const adminGetUsers = async (req: Request, res: Response) => {
    try {
        const { search, role, page = '1', limit = '10' } = req.query;

        const where: any = {};

        if (search) {
            where.OR = [
                { fullName: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
                { phone: { contains: search as string, mode: 'insensitive' } },
            ];
        }
        if (role) where.role = role;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    role: true,
                    walletAddress: true,
                    createdAt: true,
                    _count: {
                        select: {
                            ownedProperties: true,
                            landlordContracts: true,
                            tenantContracts: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit as string),
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    totalPages: Math.ceil(total / parseInt(limit as string)),
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/admin/users/:id
 */
export const adminGetUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                walletAddress: true,
                facebook: true,
                zalo: true,
                createdAt: true,
                updatedAt: true,
                ownedProperties: {
                    select: { id: true, title: true, address: true, price: true, available: true },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
                landlordContracts: {
                    select: {
                        id: true,
                        status: true,
                        monthlyRent: true,
                        startDate: true,
                        endDate: true,
                        tenant: { select: { fullName: true, email: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
                tenantContracts: {
                    select: {
                        id: true,
                        status: true,
                        monthlyRent: true,
                        startDate: true,
                        endDate: true,
                        landlord: { select: { fullName: true, email: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        res.json({ success: true, data: { user } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PUT /api/admin/users/:id
 */
export const adminUpdateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { fullName, phone, role } = req.body;

        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        const user = await prisma.user.update({
            where: { id },
            data: { fullName, phone, role },
            select: {
                id: true, fullName: true, email: true, phone: true, role: true, walletAddress: true,
            },
        });

        res.json({ success: true, message: 'Cập nhật người dùng thành công', data: { user } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/admin/users/:id
 */
export const adminDeleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const requesterId = (req as any).user.userId;

        if (id === requesterId) {
            return res.status(400).json({ success: false, message: 'Không thể xóa chính mình' });
        }

        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        await prisma.user.delete({ where: { id } });
        res.json({ success: true, message: 'Xóa người dùng thành công' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== QUẢN LÝ HỢP ĐỒNG ====================

/**
 * GET /api/admin/contracts
 */
export const adminGetContracts = async (req: Request, res: Response) => {
    try {
        const { search, status, page = '1', limit = '10' } = req.query;

        const where: any = {};

        if (status) where.status = status;

        if (search) {
            where.OR = [
                { id: { contains: search as string, mode: 'insensitive' } },
                { contractHash: { contains: search as string, mode: 'insensitive' } },
                { landlord: { fullName: { contains: search as string, mode: 'insensitive' } } },
                { tenant: { fullName: { contains: search as string, mode: 'insensitive' } } },
                { property: { title: { contains: search as string, mode: 'insensitive' } } },
            ];
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const [contracts, total] = await Promise.all([
            prisma.contract.findMany({
                where,
                include: {
                    property: { select: { id: true, title: true, address: true, city: true } },
                    landlord: { select: { id: true, fullName: true, email: true } },
                    tenant: { select: { id: true, fullName: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit as string),
            }),
            prisma.contract.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                contracts,
                pagination: {
                    total,
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    totalPages: Math.ceil(total / parseInt(limit as string)),
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/admin/contracts/:id
 */
export const adminGetContractById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                property: true,
                landlord: { select: { id: true, fullName: true, email: true, phone: true, walletAddress: true } },
                tenant: { select: { id: true, fullName: true, email: true, phone: true, walletAddress: true } },
            },
        });

        if (!contract) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });
        }

        res.json({ success: true, data: { contract } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PUT /api/admin/contracts/:id/status
 * Cập nhật trạng thái hợp đồng (admin override)
 */
export const adminUpdateContractStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['DRAFT', 'PENDING', 'SIGNED', 'ACTIVE', 'EXPIRED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        const existing = await prisma.contract.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });
        }

        const contract = await prisma.contract.update({
            where: { id },
            data: { status },
            include: {
                property: { select: { title: true } },
                landlord: { select: { fullName: true } },
                tenant: { select: { fullName: true } },
            },
        });

        res.json({ success: true, message: 'Cập nhật trạng thái hợp đồng thành công', data: { contract } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/admin/contracts/:id
 */
export const adminDeleteContract = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existing = await prisma.contract.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });
        }

        await prisma.contract.delete({ where: { id } });
        res.json({ success: true, message: 'Xóa hợp đồng thành công' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
