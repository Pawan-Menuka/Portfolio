import { asyncHandler } from '../utils/asyncHandler.js';
import * as skillService from '../services/skill.service.js';

export const getSkills = asyncHandler(async (req, res) => {
  const skills = await skillService.getAll(req.query);
  res.json({ success: true, data: skills });
});

export const createSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.create(req.body);
  res.status(201).json({ success: true, data: skill });
});

export const updateSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.update(req.params.id, req.body);
  res.json({ success: true, data: skill });
});

export const deleteSkill = asyncHandler(async (req, res) => {
  await skillService.remove(req.params.id);
  res.json({ success: true, message: 'Skill deleted' });
});
