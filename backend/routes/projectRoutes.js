import express from 'express';
import { getProjects, createProject, updateProject, deleteProject } from '../controllers/projectController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
const router = express.Router();
router.route('/').get(protect, getProjects).post(protect, createProject);
router.route('/:id').patch(protect, updateProject).delete(protect, admin, deleteProject);
export default router;
