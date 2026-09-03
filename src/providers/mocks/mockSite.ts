import type { SiteDefinition } from '@/core/site';

export const mockLocales = ['pt-PT', 'en-GB'] as const;

export type MockLocale = (typeof mockLocales)[number];

export const mockDefaultLocale: MockLocale = 'pt-PT';

export const mockSite: SiteDefinition = {
  name: 'Next Foundation',
  locales: [...mockLocales],
  defaultLocale: mockDefaultLocale,
};
