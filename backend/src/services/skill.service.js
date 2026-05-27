import { Skill } from '../models/Skill.js';
import { ApiError } from '../utils/ApiError.js';

export async function getAll({ category } = {}) {
  const query = category ? { category } : {};
  return Skill.find(query).sort({ category: 1, order: 1, level: -1 }).lean();
}

export async function create(data) {
  return Skill.create(data);
}

export async function update(id, data) {
  const skill = await Skill.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!skill) throw new ApiError(404, 'Skill not found');
  return skill;
}

export async function remove(id) {
  const skill = await Skill.findByIdAndDelete(id);
  if (!skill) throw new ApiError(404, 'Skill not found');
}
