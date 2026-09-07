import { z } from 'zod';

const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string(),
});

const socialsSchema = z.object({
  github: z.string().optional(),
  linkedin: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
});

const availabilitySchema = z.object({
  available: z.boolean().optional(),
  text: z.string().optional(),
});

const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ogImage: imageSchema.optional(),
});

// .strict() at the top level: an attempt to set `resume` (or any other
// unrecognized field) here is a 400, not a silently-ignored no-op — resume
// is admin-write-only via POST /profile/resume (Phase 5).
export const updateProfileSchema = z.object({
  name: z.string().optional(),
  headline: z.string().optional(),
  shortBio: z.string().optional(),
  bio: z.string().optional(),
  roles: z.array(z.string()).optional(),
  location: z.string().optional(),
  avatar: imageSchema.optional(),
  socials: socialsSchema.optional(),
  availability: availabilitySchema.optional(),
  seo: seoSchema.optional(),
}).strict();
