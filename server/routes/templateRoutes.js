import express from 'express';
import { getDefaultTemplates } from '../controllers/templateController.js';

const router = express.Router();

// @route   GET /api/templates/defaults
// @desc    Get default template library
// @access  Public (no authentication required)
router.get('/defaults', getDefaultTemplates);

export default router;