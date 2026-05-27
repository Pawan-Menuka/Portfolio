import { Router } from 'express';
import {
  createMessage, getMessages, markRead, deleteMessage,
} from '../controllers/message.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMessageSchema } from '../validators/message.validator.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many messages sent. Please wait before trying again.' },
});

router.post('/', contactLimiter, validate(createMessageSchema), createMessage);

router.get('/', protect, adminOnly, getMessages);
router.patch('/:id/read', protect, adminOnly, markRead);
router.delete('/:id', protect, adminOnly, deleteMessage);

export default router;
