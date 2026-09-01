import type { MockLocale } from '../mockSite';

export interface MockRedirect {
  /** O caminho antigo, sem locale e sem barra inicial — como o `path` de uma página. */
  path: string;

  locale: MockLocale;

  /** O destino, já com barra inicial e com prefixo de idioma se for preciso. */
  to: string;

  /** 308 quando `true`, 307 quando não. Ver o contrato em `PageSource`. */
  permanent?: boolean;
}

/**
 * Redirects, para o terceiro ramo do `PageResponse` existir de facto.
 *
 * Uma entrada por idioma, porque um slug traduz-se: `pagina-antiga` em português
 * não é o mesmo URL que `old-page` em inglês.
 *
 * Num CMS a sério isto viria de uma collection de redirects. Aqui é uma lista à
 * mão, pelo mesmo motivo de todo o resto dos mocks: para se ver o mecanismo sem
 * base de dados nenhuma.
 */
export const mockRedirects: MockRedirect[] = [
  {
    path: 'pagina-antiga',
    locale: 'pt-PT',
    to: '/',
    permanent: true,
  },

  {
    path: 'old-page',
    locale: 'en-GB',
    to: '/en',
    permanent: true,
  },
];
