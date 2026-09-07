import { Certification } from '../models/Certification.js';
import { ApiError } from '../utils/ApiError.js';

export async function getAll({ category, featured } = {}) {
  const query = {};
  if (category) query.category = category;
  if (featured !== undefined) query.featured = featured === 'true';
  return Certification.find(query).sort({ order: 1, issueDate: -1 }).lean();
}

export async function create(data) {
  return Certification.create(data);
}

export async function update(id, data) {
  const cert = await Certification.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
  if (!cert) throw new ApiError(404, 'Certification not found');
  return cert;
}

export async function remove(id) {
  const cert = await Certification.findByIdAndDelete(id);
  if (!cert) throw new ApiError(404, 'Certification not found');
}
