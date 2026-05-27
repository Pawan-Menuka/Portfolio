import { Router } from 'express';
import {
  getSkills, createSkill, updateSkill, deleteSkill,
} from '../controllers/skill.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createSkillSchema, updateSkillSchema } from '../validators/skill.validator.js';

const router = Router();

router.get('/', getSkills);
router.post('/', protect, adminOnly, validate(createSkillSchema), createSkill);
router.patch('/:id', protect, adminOnly, validate(updateSkillSchema), updateSkill);
router.delete('/:id', protect, adminOnly, deleteSkill);

export default router;
