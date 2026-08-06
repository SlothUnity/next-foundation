import { createModuleComponent, defineModule } from '@/core/modules';

import { Hero } from './components/Hero';

export const heroModule = defineModule({
  alias: 'hero',
  name: 'Hero',
  component: createModuleComponent(Hero),
});
