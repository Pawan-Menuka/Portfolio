import { Project } from '../models/Project.js';
import { ApiError } from '../utils/ApiError.js';
import * as mediaService from './media.service.js';

export async function getAll({ section, featured, page = 1, limit = 12 } = {}) {
  const query = { status: 'published' };

  if (section) query.section = section;
  if (featured !== undefined) query.featured = featured === 'true';

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Project.find(query)
      .sort({ featured: -1, order: 1, publishedAt: -1 })
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

export async function getAllAdmin({ section, status, page = 1, limit = 20 } = {}) {
  const query = {};
  if (section) query.section = section;
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

export async function getByIdAdmin(id) {
  const project = await Project.findById(id).lean();
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
}

export async function create(data) {
  const project = await Project.create(data);
  return project;
}

export async function update(id, data) {
  const project = await Project.findById(id);
  if (!project) throw new ApiError(404, 'Project not found');

  // findByIdAndUpdate is query middleware only — it never fires the
  // pre('save') hook that sets publishedAt on publish. Assign + save so
  // create and update share the same document-hook path.
  Object.assign(project, data);
  await project.save();
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
