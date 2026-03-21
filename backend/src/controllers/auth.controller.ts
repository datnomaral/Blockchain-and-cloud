import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    phone: z.string().optional(),
    role: z.enum(['LANDLORD', 'TENANT']).optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

/**
 * Register new user
 */
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, fullName, phone, role } = registerSchema.parse(req.body);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng',
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                phone,
                role: role || 'TENANT',
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                walletAddress: true,
                createdAt: true,
            },
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
        );

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: { user, token },
        });
    } catch (error: any) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi đăng ký',
        });
    }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
        );

        const { passwordHash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: { user: userWithoutPassword, token },
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi đăng nhập',
        });
    }
};

/**
 * Connect wallet to account
 */
export const connectWallet = async (req: Request, res: Response) => {
    try {
        const { walletAddress } = req.body;
        const userId = (req as any).user.userId;

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Địa chỉ ví không hợp lệ',
            });
        }

        // Check if wallet is already connected
        const existingWallet = await prisma.user.findUnique({
            where: { walletAddress },
        });

        if (existingWallet && existingWallet.id !== userId) {
            return res.status(400).json({
                success: false,
                message: 'Ví này đã được kết nối với tài khoản khác',
            });
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: userId },
            data: { walletAddress },
            select: {
                id: true,
                email: true,
                fullName: true,
                walletAddress: true,
                role: true,
            },
        });

        res.json({
            success: true,
            message: 'Kết nối ví thành công',
            data: { user },
        });
    } catch (error: any) {
        console.error('Connect wallet error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi kết nối ví',
        });
    }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                walletAddress: true,
                role: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
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
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy thông tin',
        });
    }
};
