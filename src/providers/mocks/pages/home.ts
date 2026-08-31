import { heroModule } from '@/modules';

import { block, definePage } from '../definePage';

export const home = definePage({
  'pt-PT': {
    path: '',

    meta: {
      title: 'Next Foundation',
      description: 'Um esqueleto de site em Next.js com a origem do conteúdo substituível.',
    },

    main: [
      block(heroModule, {
        title: 'Next Foundation',
        subtitle: 'Primeiro render 🎉',
      }),
    ],
  },

  'en-GB': {
    path: '',

    meta: {
      title: 'Next Foundation',
      description: 'A Next.js site skeleton with a swappable content source.',
    },

    main: [
      block(heroModule, {
        title: 'Next Foundation',
        subtitle: 'First render 🎉',
      }),
    ],
  },
});
