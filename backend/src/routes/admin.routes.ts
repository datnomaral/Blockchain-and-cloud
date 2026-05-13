import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import {
    getStats,
    adminGetProperties,
    adminGetPropertyById,
    adminCreateProperty,
    adminUpdateProperty,
    adminDeleteProperty,
    adminApproveProperty,
    adminRejectProperty,
    adminGetUsers,
    adminGetUserById,
    adminUpdateUser,
    adminBanUser,
    adminUnbanUser,
    adminDeleteUser,
    adminGetLandlords,
    adminGetTenants,
    adminGetContracts,
    adminGetContractById,
    adminUpdateContractStatus,
    adminTerminateContract,
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
router.post('/properties/:id/approve', adminApproveProperty);
router.post('/properties/:id/reject', adminRejectProperty);

// ── Khách hàng (tổng hợp) ───────────────────────────────
router.get('/users', adminGetUsers);
router.get('/users/:id', adminGetUserById);
router.put('/users/:id', adminUpdateUser);
router.post('/users/:id/ban', adminBanUser);
router.post('/users/:id/unban', adminUnbanUser);
router.delete('/users/:id', adminDeleteUser);

// ── Chủ nhà (phân cấp) ──────────────────────────────────
router.get('/landlords', adminGetLandlords);

// ── Người thuê ──────────────────────────────────────────
router.get('/tenants', adminGetTenants);

// ── Hợp đồng ────────────────────────────────────────────
router.get('/contracts', adminGetContracts);
router.get('/contracts/:id', adminGetContractById);
router.put('/contracts/:id/status', adminUpdateContractStatus);
router.post('/contracts/:id/terminate', adminTerminateContract);
router.delete('/contracts/:id', adminDeleteContract);

export default router;
