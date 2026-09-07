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

// See project.validator.js for why the defaulted fields need re-declaring
// here — `.partial()` alone would still reset `tags`/`status` to their
// create-time defaults whenever a PATCH omits them.
export const updatePostSchema = createPostSchema.partial().extend({
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
});
