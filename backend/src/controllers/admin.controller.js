import { asyncHandler } from '../utils/asyncHandler.js';
import * as projectService from '../services/project.service.js';
import * as postService from '../services/post.service.js';

export const getAdminProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getAllAdmin(req.query);
  res.json({ success: true, ...result });
});

export const getAdminProject = asyncHandler(async (req, res) => {
  const project = await projectService.getByIdAdmin(req.params.id);
  res.json({ success: true, data: project });
});

export const getAdminPosts = asyncHandler(async (req, res) => {
  const result = await postService.getAllAdmin(req.query);
  res.json({ success: true, ...result });
});

export const getAdminPost = asyncHandler(async (req, res) => {
  const post = await postService.getByIdAdmin(req.params.id);
  res.json({ success: true, data: post });
});
