import { Router } from 'express';
import {
  getPosts, getPost, createPost, updatePost, deletePost,
} from '../controllers/post.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createPostSchema, updatePostSchema } from '../validators/post.validator.js';

const router = Router();

router.get('/', getPosts);
router.get('/:slug', getPost);
router.post('/', protect, adminOnly, validate(createPostSchema), createPost);
router.patch('/:id', protect, adminOnly, validate(updatePostSchema), updatePost);
router.delete('/:id', protect, adminOnly, deletePost);

export default router;
