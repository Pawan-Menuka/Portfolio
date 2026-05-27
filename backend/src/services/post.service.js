import { Post } from '../models/Post.js';
import { ApiError } from '../utils/ApiError.js';
import * as mediaService from './media.service.js';

export async function getAll({ status = 'published', tag, page = 1, limit = 10 } = {}) {
  const query = { status };
  if (tag) query.tags = tag;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Post.find(query)
      .select('-content')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Post.countDocuments(query),
  ]);

  return { data, meta: { page: Number(page), limit: Number(limit), total } };
}

export async function getBySlug(slug) {
  const post = await Post.findOne({ slug, status: 'published' }).lean();
  if (!post) throw new ApiError(404, 'Post not found');
  return post;
}

export async function create(data) {
  return Post.create(data);
}

export async function update(id, data) {
  const post = await Post.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!post) throw new ApiError(404, 'Post not found');
  return post;
}

export async function remove(id) {
  const post = await Post.findById(id);
  if (!post) throw new ApiError(404, 'Post not found');
  if (post.coverImage?.publicId) {
    await mediaService.destroy(post.coverImage.publicId).catch(() => {});
  }
  await post.deleteOne();
}
