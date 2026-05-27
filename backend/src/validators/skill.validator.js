import { z } from 'zod';

export const createSkillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['software', 'blockchain', 'engineering', 'creative']),
  level: z.number().int().min(1).max(5),
  icon: z.string().optional().default(''),
  yearsOfExperience: z.number().optional().default(0),
  description: z.string().optional().default(''),
  order: z.number().optional().default(0),
});

export const updateSkillSchema = createSkillSchema.partial();
