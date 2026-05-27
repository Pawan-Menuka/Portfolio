import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().optional(),
  excerpt: z.string().min(1, 'Excerpt is required').max(400),
  content: z.string().min(1, 'Content is required'),
  coverImage: z.object({ url: z.string(), publicId: z.string() }).optional(),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

export const updatePostSchema = createPostSchema.partial();
