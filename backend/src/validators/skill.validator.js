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

// See project.validator.js for why the defaulted fields need re-declaring
// here — `.partial()` alone would still reset them to their create-time
// defaults whenever a PATCH omits them.
export const updateSkillSchema = createSkillSchema.partial().extend({
  icon: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
});
