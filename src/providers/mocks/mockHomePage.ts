import type { PageDefinition } from '@/core/pages';

export const mockHomePage: PageDefinition = {
  meta: {
    locale: 'pt-PT',
  },
  main: [
    {
      id: 'hero-1',
      alias: 'hero',
      data: {
        title: 'Next Foundation',
        subtitle: 'Primeiro render 🎉',
      },
    },
  ],
};
