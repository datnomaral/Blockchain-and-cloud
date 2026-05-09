import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lấy danh sách hóa đơn (có thể lọc theo chủ nhà, người thuê, tháng, năm, trạng thái)
export const getInvoices = async (req: Request, res: Response) => {
    try {
        const { landlordId, tenantId, status, month, year, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};

        // Lọc theo thông tin hợp đồng
        if (landlordId || tenantId) {
            where.contract = {};
            if (landlordId) where.contract.landlordId = String(landlordId);
            if (tenantId) where.contract.tenantId = String(tenantId);
        }

        if (status) where.status = String(status);
        if (month) where.month = Number(month);
        if (year) where.year = Number(year);

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                include: {
                    contract: {
                        include: {
                            property: { select: { title: true, city: true } },
                            tenant: { select: { fullName: true, email: true, phone: true } },
                            landlord: { select: { fullName: true } }
                        }
                    }
                },
                orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
                skip,
                take: Number(limit)
            }),
            prisma.invoice.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                invoices,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách hóa đơn' });
    }
};

// Tạo hóa đơn mới (Chủ nhà hoặc hệ thống tự tạo cho Hợp đồng)
export const createInvoice = async (req: Request, res: Response) => {
    try {
        const { contractId, amount, description, month, year, dueDate } = req.body;

        const contract = await prisma.contract.findUnique({ where: { id: contractId } });
        if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });

        const invoice = await prisma.invoice.create({
            data: {
                contractId,
                amount: Number(amount),
                description,
                month: Number(month),
                year: Number(year),
                dueDate: new Date(dueDate)
            }
        });

        res.json({ success: true, data: invoice, message: 'Tạo hóa đơn thành công' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi tạo hóa đơn' });
    }
};

// Cập nhật trạng thái hóa đơn (VD: Chủ nhà xác nhận đã nhận tiền)
export const updateInvoiceStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const invoice = await prisma.invoice.update({
            where: { id },
            data: {
                status,
                paidAt: status === 'PAID' ? new Date() : null
            }
        });

        res.json({ success: true, data: invoice, message: 'Cập nhật trạng thái hóa đơn thành công' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật hóa đơn' });
    }
};

// Xóa hóa đơn
export const deleteInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.invoice.delete({ where: { id } });
        res.json({ success: true, message: 'Xóa hóa đơn thành công' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi xóa hóa đơn' });
    }
};

// THỐNG KÊ DOANH THU THEO THÁNG CỦA CHỦ NHÀ
export const getRevenueStats = async (req: Request, res: Response) => {
    try {
        const { landlordId, year } = req.query;
        if (!landlordId) return res.status(400).json({ success: false, message: 'Thiếu landlordId' });

        const y = year ? Number(year) : new Date().getFullYear();

        const invoices = await prisma.invoice.findMany({
            where: {
                year: y,
                contract: { landlordId: String(landlordId) }
            }
        });

        const stats = {
            totalExpected: 0,
            totalCollected: 0,
            totalUnpaid: 0,
            monthlyData: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, expected: 0, collected: 0 }))
        };

        invoices.forEach((inv: any) => {
            const mIdx = inv.month - 1;
            stats.totalExpected += inv.amount;
            stats.monthlyData[mIdx].expected += inv.amount;

            if (inv.status === 'PAID') {
                stats.totalCollected += inv.amount;
                stats.monthlyData[mIdx].collected += inv.amount;
            } else {
                stats.totalUnpaid += inv.amount;
            }
        });

        res.json({ success: true, data: stats });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê doanh thu' });
    }
};
