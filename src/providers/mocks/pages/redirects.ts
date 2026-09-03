import type { MockLocale } from '../mockSite';

export interface MockRedirect {
  path: string;

  locale: MockLocale;

  to: string;

  permanent?: boolean;
}

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
