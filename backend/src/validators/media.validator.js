import { z } from 'zod';

export const deleteMediaQuerySchema = z.object({
  publicId: z.string().min(1, 'publicId is required'),
});
