import { z } from 'zod';

export const heroSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
});
