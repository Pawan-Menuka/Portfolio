import { z } from 'zod';

export const createCertificationSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(100),
  category: z.enum(['software', 'blockchain', 'engineering', 'other']).default('software'),
  issueDate: z.string().datetime().or(z.string()),
  expiryDate: z.string().datetime().optional().or(z.string().optional()),
  credentialId: z.string().optional().default(''),
  verifyUrl: z.string().url().optional().or(z.literal('')),
  badgeImage: z.object({ url: z.string(), publicId: z.string() }).optional(),
  featured: z.boolean().optional().default(false),
  order: z.number().optional().default(0),
});

export const updateCertificationSchema = createCertificationSchema.partial();
