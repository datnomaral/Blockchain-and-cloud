import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createPropertySchema = z.object({
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
    images: z.array(z.string()).optional(),
    amenities: z.array(z.string()).optional(),
});

/**
 * Create new property listing
 */
export const createProperty = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const role = (req as any).user.role;

        if (role !== 'LANDLORD') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ chủ nhà mới có thể đăng phòng',
            });
        }

        const propertyData = createPropertySchema.parse(req.body);

        const property = await prisma.property.create({
            data: {
                ...propertyData,
                ownerId: userId,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        facebook: true,
                        zalo: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Đăng tin thành công',
            data: { property },
        });
    } catch (error: any) {
        console.error('Create property error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi đăng tin',
        });
    }
};

/**
 * Get all properties
 */
export const getProperties = async (req: Request, res: Response) => {
    try {
        const { city, type, minPrice, maxPrice, available } = req.query;

        const where: any = {};

        if (city) where.city = city as string;
        if (type) where.type = type;
        if (available !== undefined) where.available = available === 'true';

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice as string);
            if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
        }

        const properties = await prisma.property.findMany({
            where,
            include: {
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        facebook: true,
                        zalo: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: { properties, count: properties.length },
        });
    } catch (error: any) {
        console.error('Get properties error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách',
        });
    }
};

export const searchProperties = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;

        const properties = await prisma.property.findMany({
            where: {
                OR: [
                    { title: { contains: query as string, mode: 'insensitive' } },
                    { address: { contains: query as string, mode: 'insensitive' } },
                    { city: { contains: query as string, mode: 'insensitive' } },
                ],
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        facebook: true,
                        zalo: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            data: { properties, count: properties.length },
        });
    } catch (error: any) {
        console.error('Search properties error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tìm kiếm',
        });
    }
};

export const getPropertyById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const property = await prisma.property.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        facebook: true,
                        zalo: true,
                    },
                },
            },
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng',
            });
        }

        res.json({
            success: true,
            data: { property },
        });
    } catch (error: any) {
        console.error('Get property error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy thông tin',
        });
    }
};

export const updateProperty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const property = await prisma.property.findUnique({
            where: { id },
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng',
            });
        }

        if (property.ownerId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền chỉnh sửa',
            });
        }

        // Block sửa phòng khi đang có hợp đồng ACTIVE
        const activeContract = await prisma.contract.findFirst({
            where: { propertyId: id, status: { in: ['ACTIVE', 'SIGNED'] } },
        });

        if (activeContract) {
            return res.status(400).json({
                success: false,
                message: 'Không thể chỉnh sửa phòng đang có hợp đồng hiệu lực. Vui lòng hủy hợp đồng trước.',
            });
        }

        const updatedProperty = await prisma.property.update({
            where: { id },
            data: req.body,
        });

        res.json({
            success: true,
            message: 'Cập nhật thành công',
            data: { property: updatedProperty },
        });
    } catch (error: any) {
        console.error('Update property error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật',
        });
    }
};

export const deleteProperty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const property = await prisma.property.findUnique({
            where: { id },
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng',
            });
        }

        if (property.ownerId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa',
            });
        }

        // Block xóa phòng khi đang có hợp đồng ACTIVE
        const activeContract = await prisma.contract.findFirst({
            where: { propertyId: id, status: { in: ['ACTIVE', 'SIGNED'] } },
        });

        if (activeContract) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa phòng đang có hợp đồng hiệu lực.',
            });
        }

        await prisma.property.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Xóa thành công',
        });
    } catch (error: any) {
        console.error('Delete property error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xóa',
        });
    }
};
