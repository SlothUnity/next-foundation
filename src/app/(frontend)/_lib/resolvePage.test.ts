import { beforeEach, describe, expect, it, vi } from 'vitest';

import { callArg } from '@/testing/callArg';

const getPage = vi.fn();
const getSite = vi.fn();

vi.mock('next/headers', () => ({
  draftMode: () => Promise.resolve({ isEnabled: false }),
}));

vi.mock('@/core/foundation/foundation', () => ({
  foundation: {
    page: {
      getPage: (path: string, locale?: string, options?: unknown) => getPage(path, locale, options),
    },
    site: {
      getSite: () => getSite(),
    },
  },
}));

const { resolvePage } = await import('./resolvePage');

describe('resolvePage', () => {
  beforeEach(() => {
    getPage.mockReset();
    getSite.mockReset();

    getSite.mockResolvedValue({
      name: 'Test Site',
      locales: ['pt-PT', 'en-GB'],
      defaultLocale: 'pt-PT',
    });

    getPage.mockResolvedValue({ status: 'notFound' });
  });

  it('hands the query to the provider, so a module can answer it', async () => {
    await resolvePage(['noticias'], { page: '2', tag: ['a', 'b'] });

    expect(getPage).toHaveBeenCalledWith('noticias', 'pt-PT', {
      draft: false,
      query: { page: '2', tag: ['a', 'b'] },
    });
  });

  it('normalises the query before the provider sees it', async () => {
    await resolvePage([], { sort: 'date', page: '2', empty: undefined });

    expect(callArg<{ query: unknown }>(getPage, 2).query).toEqual({ page: '2', sort: 'date' });
  });

  it('asks for an empty query when the request had none', async () => {
    await resolvePage(['sobre-nos']);

    expect(callArg<{ query: unknown }>(getPage, 2).query).toEqual({});
  });

  it('still resolves the locale from the first segment', async () => {
    await resolvePage(['en', 'about-us']);

    expect(getPage).toHaveBeenCalledWith('about-us', 'en-GB', expect.anything());
  });
});
