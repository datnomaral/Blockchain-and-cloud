import { Router } from 'express';
import {
    createProperty,
    getProperties,
    getMyProperties,
    getPropertyById,
    updateProperty,
    deleteProperty,
    searchProperties,
} from '../controllers/property.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/properties
 * @desc    Create new property listing
 * @access  Private (Landlord only)
 */
router.post('/', authMiddleware, createProperty);

/**
 * @route   GET /api/properties/my
 * @desc    Get all properties of current user (including PENDING/REJECTED)
 * @access  Private
 */
router.get('/my', authMiddleware, getMyProperties);

/**
 * @route   GET /api/properties
 * @desc    Get all properties
 * @access  Public
 */
router.get('/', getProperties);

/**
 * @route   GET /api/properties/search
 * @desc    Search properties with filters
 * @access  Public
 */
router.get('/search', searchProperties);

/**
 * @route   GET /api/properties/:id
 * @desc    Get property by ID
 * @access  Public
 */
router.get('/:id', getPropertyById);

/**
 * @route   PUT /api/properties/:id
 * @desc    Update property
 * @access  Private (Owner only)
 */
router.put('/:id', authMiddleware, updateProperty);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete property
 * @access  Private (Owner only)
 */
router.delete('/:id', authMiddleware, deleteProperty);

export default router;
