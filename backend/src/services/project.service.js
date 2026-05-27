import { Project } from '../models/Project.js';
import { ApiError } from '../utils/ApiError.js';
import * as mediaService from './media.service.js';

export async function getAll({ category, status, featured, page = 1, limit = 12 } = {}) {
  const query = {};

  if (category) query.category = category;
  if (status) query.status = status;
  if (featured !== undefined) query.featured = featured === 'true';

  if (!query.status) query.status = 'published';

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Project.find(query)
      .sort({ order: 1, publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Project.countDocuments(query),
  ]);

  return {
    data,
    meta: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  };
}

export async function getAllAdmin({ category, status, page = 1, limit = 20 } = {}) {
  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Project.find(query).sort({ order: 1, updatedAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Project.countDocuments(query),
  ]);

  return { data, meta: { page: Number(page), limit: Number(limit), total } };
}

export async function getBySlug(slug) {
  const project = await Project.findOne({ slug, status: 'published' }).lean();
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
}

export async function create(data) {
  const project = await Project.create(data);
  return project;
}

export async function update(id, data) {
  const project = await Project.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
}

export async function remove(id) {
  const project = await Project.findById(id);
  if (!project) throw new ApiError(404, 'Project not found');

  const imagesToDelete = [
    project.coverImage,
    ...project.gallery,
    ...project.models3d,
  ].filter(Boolean);

  await Promise.all(
    imagesToDelete.map((img) => mediaService.destroy(img.publicId).catch(() => {}))
  );

  await project.deleteOne();
}
