import { heroModule } from '@/modules';

import { block, definePage } from '../definePage';

export const notFound = definePage({
  'pt-PT': {
    path: '404',

    meta: {
      title: 'Página não encontrada',
      description: 'A página que procuras não existe ou foi movida.',
      noIndex: true,
    },

    main: [
      block(heroModule, {
        title: 'Página não encontrada',
        subtitle: 'A página que procuras não existe ou foi movida.',
      }),
    ],
  },

  'en-GB': {
    path: '404',

    meta: {
      title: 'Page not found',
      description: 'The page you are looking for does not exist or has moved.',
      noIndex: true,
    },

    main: [
      block(heroModule, {
        title: 'Page not found',
        subtitle: 'The page you are looking for does not exist or has moved.',
      }),
    ],
  },
});
