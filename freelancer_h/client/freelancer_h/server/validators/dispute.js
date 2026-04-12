import { z } from 'zod';

export const createDisputeSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  reason: z.string().min(5).max(5000).trim(),
});

export const resolveDisputeSchema = z.object({
  resolution: z.enum(['refund', 'release', 'split']),
  adminNote: z.string().max(5000).trim().optional(),
});
