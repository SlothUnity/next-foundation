import { z } from 'zod';

import { heroSchema } from './Hero.schema';

export type HeroProps = z.infer<typeof heroSchema>;
