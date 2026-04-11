import { z } from 'zod';

// Payments are auto-created when milestones are created.
// No manual payment creation validators needed.

export const paymentStatusSchema = z.object({
  status: z.enum(['held', 'released', 'refunded']),
});
