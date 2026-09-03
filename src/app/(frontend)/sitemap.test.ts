import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PagePath } from '@/core/pages';

const listPaths = vi.fn<() => Promise<PagePath[]>>();

const page: { listPaths?: () => Promise<PagePath[]> } = { listPaths };

vi.mock('next/headers', () => ({
  headers: () =>
    Promise.resolve({ get: (name: string) => (name === 'host' ? 'exemplo.pt' : null) }),
}));

vi.mock('@/core/foundation/foundation', () => ({
  foundation: { page },
}));

const { default: sitemap } = await import('./sitemap');

describe('sitemap', () => {
  beforeEach(() => {
    page.listPaths = listPaths;
    listPaths.mockReset();
  });

  it('makes every path absolute against the host that served the request', async () => {
    listPaths.mockResolvedValue([
      { path: '/', locale: 'pt-PT', updatedAt: '2026-01-01T00:00:00.000Z' },
      { path: '/en/about-us', locale: 'en-GB' },
    ]);

    await expect(sitemap()).resolves.toEqual([
      { url: 'https://exemplo.pt/', lastModified: '2026-01-01T00:00:00.000Z' },
      { url: 'https://exemplo.pt/en/about-us', lastModified: undefined },
    ]);
  });

  it('refuses to answer at all when the source cannot list, instead of serving an empty urlset', async () => {
    delete page.listPaths;

    await expect(sitemap()).rejects.toThrow(/listPaths|sitemapLocation/);
  });
});
