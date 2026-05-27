import { Router } from 'express';
import {
  getCertifications, createCertification, updateCertification, deleteCertification,
} from '../controllers/certification.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCertificationSchema, updateCertificationSchema } from '../validators/certification.validator.js';

const router = Router();

router.get('/', getCertifications);
router.post('/', protect, adminOnly, validate(createCertificationSchema), createCertification);
router.patch('/:id', protect, adminOnly, validate(updateCertificationSchema), updateCertification);
router.delete('/:id', protect, adminOnly, deleteCertification);

export default router;
