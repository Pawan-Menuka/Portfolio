import { Router } from 'express';
import {
  getProjects, getProject, createProject, updateProject, deleteProject,
} from '../controllers/project.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';

const router = Router();

router.get('/', getProjects);
router.get('/:slug', getProject);

router.post('/', protect, adminOnly, validate(createProjectSchema), createProject);
router.patch('/:id', protect, adminOnly, validate(updateProjectSchema), updateProject);
router.delete('/:id', protect, adminOnly, deleteProject);

export default router;
