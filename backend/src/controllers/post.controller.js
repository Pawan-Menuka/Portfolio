import { asyncHandler } from '../utils/asyncHandler.js';
import * as postService from '../services/post.service.js';

export const getPosts = asyncHandler(async (req, res) => {
  const result = await postService.getAll(req.query);
  res.json({ success: true, ...result });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await postService.getBySlug(req.params.slug);
  res.json({ success: true, data: post });
});

export const createPost = asyncHandler(async (req, res) => {
  const post = await postService.create(req.body);
  res.status(201).json({ success: true, data: post });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await postService.update(req.params.id, req.body);
  res.json({ success: true, data: post });
});

export const deletePost = asyncHandler(async (req, res) => {
  await postService.remove(req.params.id);
  res.json({ success: true, message: 'Post deleted' });
});
