import { z } from 'zod';

// Projects are auto-created from invites, so no create/update validators needed.
// Keeping this file for potential future use.

export const projectStatusSchema = z.object({
  status: z.enum(['active', 'completed', 'disputed', 'cancelled']),
});
