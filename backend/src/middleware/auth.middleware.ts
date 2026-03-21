import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực',
            });
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET!
            ) as JwtPayload;

            (req as any).user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn',
            });
        }
    } catch (error: any) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xác thực',
        });
    }
};
