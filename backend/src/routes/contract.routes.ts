import { Router } from 'express';
import {
    createContract,
    getContracts,
    getContractById,
    signContract,
    verifyContract,
    generateContractPDF,
} from '../controllers/contract.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/contracts
 * @desc    Create new rental contract
 * @access  Private
 */
router.post('/', authMiddleware, createContract);

/**
 * @route   GET /api/contracts
 * @desc    Get all contracts for current user
 * @access  Private
 */
router.get('/', authMiddleware, getContracts);

/**
 * @route   GET /api/contracts/verify/:hash
 * @desc    Verify contract by hash
 * @access  Public
 * IMPORTANT: Must be defined BEFORE /:id to avoid Express matching "verify" as an id
 */
router.get('/verify/:hash', verifyContract);

/**
 * @route   GET /api/contracts/:id
 * @desc    Get contract by ID
 * @access  Private
 */
router.get('/:id', authMiddleware, getContractById);

/**
 * @route   POST /api/contracts/:id/sign
 * @desc    Sign contract with blockchain
 * @access  Private
 */
router.post('/:id/sign', authMiddleware, signContract);

/**
 * @route   GET /api/contracts/:id/pdf
 * @desc    Generate and download contract PDF
 * @access  Private
 */
router.get('/:id/pdf', authMiddleware, generateContractPDF);

export default router;
