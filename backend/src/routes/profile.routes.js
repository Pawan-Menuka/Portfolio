import { Router } from 'express';
import { getProfile, patchProfile, postResume } from '../controllers/profile.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/profile.validator.js';
import { uploadResume } from '../middleware/upload.js';

const router = Router();

router.get('/', getProfile);
router.patch('/', protect, adminOnly, validate(updateProfileSchema), patchProfile);
router.post('/resume', protect, adminOnly, uploadResume, postResume);

export default router;
