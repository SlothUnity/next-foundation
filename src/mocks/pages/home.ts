import type { PageDefinition } from '@/types';

const homePage: PageDefinition = {
  meta: {
    locale: 'pt-pt',
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
