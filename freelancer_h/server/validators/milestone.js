import { z } from 'zod';

export const createMilestoneSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  amount: z.number().min(0),
  dueDate: z.string().optional(),
});

export const milestoneStatusSchema = z.object({
  status: z.enum(['pending', 'in-progress', 'submitted', 'approved', 'rejected']),
});
