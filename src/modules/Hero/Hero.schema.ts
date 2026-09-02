import { z } from 'zod';

import { imageSchema } from '@/core/media';

export const heroSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  image: imageSchema.optional(),
});
