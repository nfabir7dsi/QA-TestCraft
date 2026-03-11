import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  deleteDocument,
  getProjectStats,
  updateProjectTemplate,
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';
import { uploadDocuments } from '../middleware/upload.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Project CRUD routes
router.route('/')
  .get(getProjects)
  .post(uploadDocuments, createProject);

router.get('/stats', getProjectStats);

// Template route (must be before /:id route for proper matching)
router.put('/:id/template', updateProjectTemplate);

// Document deletion (must be before /:id route)
router.delete('/:id/documents/:docIndex', deleteDocument);

router.route('/:id')
  .get(getProjectById)
  .put(uploadDocuments, updateProject)
  .delete(deleteProject);

export default router;
