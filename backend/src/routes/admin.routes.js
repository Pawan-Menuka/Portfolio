import { Router } from 'express';
import {
  getAdminProjects, getAdminProject, getAdminPosts, getAdminPost,
} from '../controllers/admin.controller.js';

// protect + adminOnly are applied once, where this router is mounted
// (routes/index.js), so every route added here is guarded by construction.
const router = Router();

router.get('/projects', getAdminProjects);
router.get('/projects/:id', getAdminProject);
router.get('/posts', getAdminPosts);
router.get('/posts/:id', getAdminPost);

export default router;
