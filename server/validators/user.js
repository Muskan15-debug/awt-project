import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  title: z.string().max(200).trim().optional(),
  bio: z.string().max(2000).trim().optional(),
  skills: z.array(z.string().trim()).optional(),
  hourlyRate: z.number().min(0).optional(),
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'expert']).optional(),
  availability: z.enum(['available', 'busy', 'unavailable']).optional(),
  location: z.object({
    city: z.string().trim().optional(),
    country: z.string().trim().optional(),
  }).optional(),
  profilePhoto: z.string().optional(),
  portfolioLinks: z.array(z.string()).optional(),
  avatar: z.string().optional(),
});
