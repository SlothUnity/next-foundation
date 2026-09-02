import { z } from 'zod';

export const imageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});
