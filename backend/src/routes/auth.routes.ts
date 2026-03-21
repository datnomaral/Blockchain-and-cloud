import { Router } from 'express';
import { register, login, connectWallet, getProfile } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/connect-wallet
 * @desc    Connect MetaMask wallet to account
 * @access  Private
 */
router.post('/connect-wallet', authMiddleware, connectWallet);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authMiddleware, getProfile);

export default router;
