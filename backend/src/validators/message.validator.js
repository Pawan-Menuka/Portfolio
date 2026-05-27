import { z } from 'zod';

export const createMessageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').toLowerCase(),
  subject: z.string().max(200).optional().default('No subject'),
  body: z.string().min(10, 'Message too short').max(3000),
  website: z.string().optional(),
});
