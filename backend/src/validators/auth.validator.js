import { z } from 'zod';

// V2: Zod v4 renamed the { required_error } option to { error } — the old
// name is silently ignored (not a build-time error), so this previously
// fell back to a generic "Invalid input: expected string, received
// undefined" instead of the intended message below.
export const loginSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email format')
    .toLowerCase(),
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required'),
});
