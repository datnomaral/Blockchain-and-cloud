import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import {
    getStats,
    adminGetProperties,
    adminGetPropertyById,
    adminCreateProperty,
    adminUpdateProperty,
    adminDeleteProperty,
    adminGetUsers,
    adminGetUserById,
    adminUpdateUser,
    adminDeleteUser,
    adminGetContracts,
    adminGetContractById,
    adminUpdateContractStatus,
    adminDeleteContract,
} from '../controllers/admin.controller';

const router = Router();

// Tất cả các route admin đều yêu cầu xác thực và phải là ADMIN
router.use(authMiddleware);
router.use(adminMiddleware);

// ── Thống kê ────────────────────────────────────────────
router.get('/stats', getStats);

// ── Phòng ───────────────────────────────────────────────
router.get('/properties', adminGetProperties);
router.get('/properties/:id', adminGetPropertyById);
router.post('/properties', adminCreateProperty);
router.put('/properties/:id', adminUpdateProperty);
router.delete('/properties/:id', adminDeleteProperty);

// ── Khách hàng ──────────────────────────────────────────
router.get('/users', adminGetUsers);
router.get('/users/:id', adminGetUserById);
router.put('/users/:id', adminUpdateUser);
router.delete('/users/:id', adminDeleteUser);

// ── Hợp đồng ────────────────────────────────────────────
router.get('/contracts', adminGetContracts);
router.get('/contracts/:id', adminGetContractById);
router.put('/contracts/:id/status', adminUpdateContractStatus);
router.delete('/contracts/:id', adminDeleteContract);

export default router;
