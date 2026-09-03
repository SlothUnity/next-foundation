import type { z } from 'zod';

import type { imageSchema } from './Image.schema';

export type ImageData = z.infer<typeof imageSchema>;
