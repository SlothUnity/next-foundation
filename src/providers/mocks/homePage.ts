import type { PageDefinition } from '@/core/pages';

const homePage: PageDefinition = {
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

export default homePage;
