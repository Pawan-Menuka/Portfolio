import { asyncHandler } from '../utils/asyncHandler.js';
import * as projectService from '../services/project.service.js';

export const getProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getAll(req.query);
  res.json({ success: true, ...result });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getBySlug(req.params.slug);
  res.json({ success: true, data: project });
});

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.create(req.body);
  res.status(201).json({ success: true, data: project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.update(req.params.id, req.body);
  res.json({ success: true, data: project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.remove(req.params.id);
  res.json({ success: true, message: 'Project deleted' });
});
