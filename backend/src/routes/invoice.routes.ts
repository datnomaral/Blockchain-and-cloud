import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
    getInvoices,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    getRevenueStats
} from '../controllers/invoice.controller';

const router = Router();

// Phải đăng nhập mới được gọi các API này
router.use(authMiddleware);

router.get('/', getInvoices);
router.post('/', createInvoice);
router.put('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);
router.get('/stats', getRevenueStats);

export default router;
