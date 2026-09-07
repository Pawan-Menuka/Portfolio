import { Router } from 'express';
import { uploadMedia, deleteMedia, deleteMediaByQuery } from '../controllers/media.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadSingle } from '../middleware/upload.js';
import { deleteMediaQuerySchema } from '../validators/media.validator.js';

const router = Router();

router.post('/upload', protect, adminOnly, uploadSingle, uploadMedia);
router.delete('/', protect, adminOnly, validate(deleteMediaQuerySchema, 'query'), deleteMediaByQuery);
router.delete('/:publicId', protect, adminOnly, deleteMedia);

export default router;
