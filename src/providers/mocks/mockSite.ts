import type { SiteDefinition } from '@/core/site';

/**
 * Os locales que os mocks servem, como tuplo constante para deles sair um tipo.
 *
 * É o mesmo par lista/tipo que o provider payload tem em `locales.ts`: dá autocomplete
 * às chaves do `definePage` e transforma um `pt-TP` trocado num erro de compilação em
 * vez de numa página que nunca aparece.
 */
export const mockLocales = ['pt-PT', 'en-GB'] as const;

export type MockLocale = (typeof mockLocales)[number];

export const mockDefaultLocale: MockLocale = 'pt-PT';

export const mockSite: SiteDefinition = {
  name: 'Next Foundation',
  locales: [...mockLocales],
  defaultLocale: mockDefaultLocale,
};
