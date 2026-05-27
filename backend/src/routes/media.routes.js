import { Router } from 'express';
import { uploadMedia, deleteMedia } from '../controllers/media.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = Router();

router.post('/upload', protect, adminOnly, uploadSingle, uploadMedia);
router.delete('/:publicId', protect, adminOnly, deleteMedia);

export default router;
