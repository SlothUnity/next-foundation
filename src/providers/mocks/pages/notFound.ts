import { heroModule } from '@/modules';

import { block, definePage } from '../definePage';

/**
 * A página servida quando o caminho não existe.
 *
 * É uma página como as outras — escrita com o mesmo `definePage`, com os mesmos
 * módulos. É esse o ponto: o 404 é **conteúdo do provider**, não um ficheiro do
 * `app/`, e por isso renderiza pela árvore normal e chega ao HTML servido.
 *
 * O `path` é ignorado — esta página não é alcançável por URL, o `MockPageSource`
 * escolhe-a pelo idioma. Fica `404` por ser o nome menos surpreendente para quem
 * abrir o ficheiro.
 *
 * O `noIndex` é o que substitui a `<meta robots>` que o Next injectava sozinho
 * quando isto passava pelo `notFound()`. A aplicação força-o na mesma, mas
 * escrevê-lo aqui deixa a intenção visível a quem edite a página.
 */
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
