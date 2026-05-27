import { Message } from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';

export async function create(data) {
  if (data.website && data.website.length > 0) {
    return null;
  }
  return Message.create(data);
}

export async function getAll({ read, page = 1, limit = 20 } = {}) {
  const query = {};
  if (read !== undefined) query.read = read === 'true';

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Message.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Message.countDocuments(query),
  ]);

  return { data, meta: { page: Number(page), limit: Number(limit), total } };
}

export async function markRead(id) {
  const message = await Message.findByIdAndUpdate(
    id,
    { read: true },
    { new: true }
  );
  if (!message) throw new ApiError(404, 'Message not found');
  return message;
}

export async function remove(id) {
  const message = await Message.findByIdAndDelete(id);
  if (!message) throw new ApiError(404, 'Message not found');
}
