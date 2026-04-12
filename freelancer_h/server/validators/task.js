import { z } from 'zod';

export const createTaskSchema = z.object({
  milestoneId: z.string().min(1, 'Milestone ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(3).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  assignedToId: z.string().optional(),
});

export const taskStatusSchema = z.object({
  status: z.enum(['in-progress']),
});

export const taskSubmitSchema = z.object({
  submissionNote: z.string().max(2000).trim().optional(),
  submissionFileUrl: z.string().optional(),
});

export const taskApproveSchema = z.object({
  status: z.enum(['approved', 'revision-requested']),
});
