import { z } from 'zod';

const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string(),
});

const linksSchema = z.object({
  github: z.string().url().optional().or(z.literal('')),
  live: z.string().url().optional().or(z.literal('')),
  demo: z.string().url().optional().or(z.literal('')),
}).optional();

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  slug: z.string().min(1).optional(),
  section: z.enum(['full-stack', 'blockchain', 'systems', 'hardware', 'creative']),
  summary: z.string().min(1, 'Summary is required').max(300),
  description: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  coverImage: imageSchema.optional(),
  gallery: z.array(imageSchema).optional().default([]),
  models3d: z.array(imageSchema).optional().default([]),
  links: linksSchema,
  meta: z.record(z.unknown()).optional().default({}),
  featured: z.boolean().optional().default(false),
  order: z.number().optional().default(0),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

// `.partial()` alone is not enough: a field with `.default(x)` still fires
// that default whenever the client omits it, which would silently reset it
// on every partial update (e.g. PATCHing just `featured` would reset
// `status` back to 'draft'). Re-declare every defaulted field here as plain
// `.optional()` with no default, so an omitted key stays omitted.
export const updateProjectSchema = createProjectSchema.partial().extend({
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  gallery: z.array(imageSchema).optional(),
  models3d: z.array(imageSchema).optional(),
  meta: z.record(z.unknown()).optional(),
  featured: z.boolean().optional(),
  order: z.number().optional(),
  status: z.enum(['draft', 'published']).optional(),
});
