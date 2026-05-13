import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                walletAddress: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        res.json({
            success: true,
            data: { user },
        });
    } catch (error: any) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy thông tin',
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        if (id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật',
            });
        }

        const { fullName, phone, bankAccount, bankName } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { fullName, phone, bankAccount, bankName },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                walletAddress: true,
                bankAccount: true,
                bankName: true,
                role: true,
            },
        });

        res.json({
            success: true,
            message: 'Cập nhật thành công',
            data: { user },
        });
    } catch (error: any) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật',
        });
    }
};
