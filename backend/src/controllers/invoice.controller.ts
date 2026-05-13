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
                            landlord: { select: { fullName: true, bankAccount: true, bankName: true } }
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

// Tạo hóa đơn mới (Chủ nhà tạo cho hợp đồng của mình)
export const createInvoice = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { contractId, amount, description, month, year, dueDate } = req.body;

        const contract = await prisma.contract.findUnique({ where: { id: contractId } });
        if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });

        // Chỉ chủ nhà của hợp đồng mới được tạo hóa đơn
        if (contract.landlordId !== userId) {
            return res.status(403).json({ success: false, message: 'Chỉ chủ nhà mới có thể tạo hóa đơn' });
        }

        // Kiểm tra trùng tháng
        const existing = await prisma.invoice.findFirst({
            where: { contractId, month: Number(month), year: Number(year) }
        });
        if (existing) {
            return res.status(400).json({ success: false, message: `Đã có hóa đơn tháng ${month}/${year} cho hợp đồng này` });
        }

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

// Cập nhật trạng thái hóa đơn
export const updateInvoiceStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (req as any).user.userId;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { contract: { select: { landlordId: true, tenantId: true } } }
        });
        if (!invoice) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });

        // Chủ nhà hoặc người thuê của hợp đồng mới được cập nhật
        const isLandlord = invoice.contract.landlordId === userId;
        const isTenant   = invoice.contract.tenantId   === userId;
        if (!isLandlord && !isTenant) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật hóa đơn này' });
        }

        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                status,
                paidAt: status === 'PAID' ? new Date() : null
            }
        });

        res.json({ success: true, data: updated, message: 'Cập nhật trạng thái hóa đơn thành công' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật hóa đơn' });
    }
};

// Xóa hóa đơn (chỉ chủ nhà)
export const deleteInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { contract: { select: { landlordId: true } } }
        });
        if (!invoice) return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });

        if (invoice.contract.landlordId !== userId) {
            return res.status(403).json({ success: false, message: 'Chỉ chủ nhà mới có thể xóa hóa đơn' });
        }

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
        const userId = (req as any).user.userId;

        // Chỉ cho phép xem stats của chính mình (hoặc admin)
        const targetId = landlordId ? String(landlordId) : userId;
        if (targetId !== userId) {
            return res.status(403).json({ success: false, message: 'Không có quyền xem thống kê của người khác' });
        }

        const y = year ? Number(year) : new Date().getFullYear();

        const invoices = await prisma.invoice.findMany({
            where: {
                year: y,
                contract: { landlordId: targetId }
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

// THỐNG KÊ TỔNG HỢP TOÀN HỆ THỐNG (ADMIN)
export const getAdminRevenueStats = async (req: Request, res: Response) => {
    try {
        const { year } = req.query;
        const y = year ? Number(year) : new Date().getFullYear();

        const invoices = await prisma.invoice.findMany({
            where: { year: y },
            include: {
                contract: {
                    select: {
                        landlordId: true,
                        landlord: { select: { id: true, fullName: true, email: true } },
                        property: { select: { title: true } }
                    }
                }
            }
        });

        // Tổng hợp toàn hệ thống
        const overall = {
            totalExpected: 0,
            totalCollected: 0,
            totalUnpaid: 0,
            totalOverdue: 0,
            monthlyData: Array.from({ length: 12 }, (_, i) => ({
                month: i + 1,
                expected: 0,
                collected: 0,
                unpaid: 0
            }))
        };

        // Tổng hợp theo từng chủ nhà
        const landlordMap: Record<string, any> = {};

        invoices.forEach((inv: any) => {
            const mIdx = inv.month - 1;
            overall.totalExpected += inv.amount;
            overall.monthlyData[mIdx].expected += inv.amount;

            if (inv.status === 'PAID') {
                overall.totalCollected += inv.amount;
                overall.monthlyData[mIdx].collected += inv.amount;
            } else {
                overall.totalUnpaid += inv.amount;
                overall.monthlyData[mIdx].unpaid += inv.amount;
                if (inv.status === 'OVERDUE') overall.totalOverdue += inv.amount;
            }

            // Theo chủ nhà
            const lid = inv.contract?.landlordId;
            if (lid) {
                if (!landlordMap[lid]) {
                    landlordMap[lid] = {
                        landlord: inv.contract.landlord,
                        totalExpected: 0,
                        totalCollected: 0,
                        totalUnpaid: 0,
                        invoiceCount: 0,
                        paidCount: 0,
                        unpaidCount: 0,
                        monthlyData: Array.from({ length: 12 }, (_, i) => ({
                            month: i + 1,
                            expected: 0,
                            collected: 0,
                            unpaid: 0,
                        })),
                    };
                }
                const mIdx = inv.month - 1;
                landlordMap[lid].totalExpected += inv.amount;
                landlordMap[lid].invoiceCount += 1;
                landlordMap[lid].monthlyData[mIdx].expected += inv.amount;
                if (inv.status === 'PAID') {
                    landlordMap[lid].totalCollected += inv.amount;
                    landlordMap[lid].paidCount += 1;
                    landlordMap[lid].monthlyData[mIdx].collected += inv.amount;
                } else {
                    landlordMap[lid].totalUnpaid += inv.amount;
                    landlordMap[lid].unpaidCount += 1;
                    landlordMap[lid].monthlyData[mIdx].unpaid += inv.amount;
                }
            }
        });

        const byLandlord = Object.values(landlordMap).sort(
            (a: any, b: any) => b.totalExpected - a.totalExpected
        );

        res.json({
            success: true,
            data: { year: y, overall, byLandlord }
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê admin' });
    }
};
