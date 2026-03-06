import express from 'express';
import {
  generateTestCasesHandler,
  saveTestCases,
  getTestCases,
  updateTestCase,
  deleteTestCase,
  duplicateTestCase,
  bulkDeleteTestCases,
  bulkUpdateStatus,
} from '../controllers/testCaseController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// AI generation
router.post('/generate', generateTestCasesHandler);

// Bulk operations (must be before /:id routes)
router.post('/bulk-delete', bulkDeleteTestCases);
router.post('/bulk-status', bulkUpdateStatus);

// CRUD
router.route('/').get(getTestCases).post(saveTestCases);

// Single test case operations
router.post('/:id/duplicate', duplicateTestCase);
router.route('/:id').put(updateTestCase).delete(deleteTestCase);

export default router;
