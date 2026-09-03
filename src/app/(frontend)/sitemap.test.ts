import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SitemapLocation } from '@/app/_lib/sitemapLocation';
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

const location: { current: SitemapLocation } = { current: { kind: 'app' } };

vi.mock('@/app/_lib/sitemapLocation', () => ({
  get sitemapLocation() {
    return location.current;
  },
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

const { default: sitemap } = await import('./sitemap');

describe('sitemap', () => {
  beforeEach(() => {
    page.listPaths = listPaths;
    listPaths.mockReset();
    location.current = { kind: 'app' };
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

  it('leaves out a page the CMS marked as not indexable, which the meta tag also refuses', async () => {
    listPaths.mockResolvedValue([
      { path: '/', locale: 'pt-PT' },
      { path: '/obrigado', locale: 'pt-PT', noIndex: true },
      { path: '/contactos', locale: 'pt-PT', noIndex: false },
    ]);

    const entries = await sitemap();

    expect(entries.map((entry) => entry.url)).toEqual([
      'https://exemplo.pt/',
      'https://exemplo.pt/contactos',
    ]);
  });

  it.each([
    { kind: 'none' } as const,
    { kind: 'external', url: 'https://cms.exemplo.pt/sitemap.xml' } as const,
  ])('answers 404 when this app is not the one that serves it (%o)', async (declared) => {
    location.current = declared;

    await expect(sitemap()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(listPaths).not.toHaveBeenCalled();
  });

  it('refuses to answer at all when the source cannot list, instead of serving an empty urlset', async () => {
    delete page.listPaths;

    await expect(sitemap()).rejects.toThrow(/listPaths|sitemapLocation/);
  });
});
