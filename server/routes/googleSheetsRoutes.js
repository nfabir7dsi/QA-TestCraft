import express from 'express';
import {
  getAuthUrl,
  handleCallback,
  getConnectionStatus,
  createSheetForProject,
  connectExistingSheet,
  syncToSheet,
  disconnectSheet,
} from '../controllers/googleSheetsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public route (Google redirects here with no Bearer token)
router.get('/callback', handleCallback);

// All other routes are protected
router.use(protect);

router.get('/auth-url', getAuthUrl);
router.get('/status', getConnectionStatus);
router.post('/:projectId/create', createSheetForProject);
router.post('/:projectId/connect', connectExistingSheet);
router.post('/:projectId/sync', syncToSheet);
router.post('/:projectId/disconnect', disconnectSheet);

export default router;
