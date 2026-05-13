import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import {
    getInvoices,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    getRevenueStats,
    getAdminRevenueStats
} from '../controllers/invoice.controller';

const router = Router();

router.use(authMiddleware);

// Admin-only: thống kê toàn hệ thống (phải đặt TRƯỚC /:id để tránh conflict)
router.get('/admin-stats', adminMiddleware, getAdminRevenueStats);

router.get('/stats', getRevenueStats);
router.get('/', getInvoices);
router.post('/', createInvoice);
router.put('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);

export default router;
