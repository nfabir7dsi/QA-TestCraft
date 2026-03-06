import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  updateProjectTemplate,
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Project CRUD routes
router.route('/')
  .get(getProjects)
  .post(createProject);

router.get('/stats', getProjectStats);

// Template route (must be before /:id route for proper matching)
router.put('/:id/template', updateProjectTemplate);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

export default router;
