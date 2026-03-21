import { Router } from 'express';
import { getUserById, updateUser } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authMiddleware, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private
 */
router.put('/:id', authMiddleware, updateUser);

export default router;
