import { Router } from 'express';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import postRoutes from './post.routes.js';
import messageRoutes from './message.routes.js';
import mediaRoutes from './media.routes.js';
import certificationRoutes from './certification.routes.js';
import skillRoutes from './skill.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/posts', postRoutes);
router.use('/messages', messageRoutes);
router.use('/media', mediaRoutes);
router.use('/certifications', certificationRoutes);
router.use('/skills', skillRoutes);

export default router;
