import { createModuleComponent, defineModule } from '@/core/modules';

import { Hero } from './components/Hero';
import { heroSchema } from './Hero.schema';

export const heroModule = defineModule({
  alias: 'hero',
  name: 'Hero',
  schema: heroSchema,
  component: createModuleComponent(Hero),
});
