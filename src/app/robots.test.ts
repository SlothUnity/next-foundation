import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SitemapLocation } from './_lib/sitemapLocation';

const location: { current: SitemapLocation } = { current: { kind: 'app' } };

vi.mock('next/headers', () => ({
  headers: () =>
    Promise.resolve({ get: (name: string) => (name === 'host' ? 'exemplo.pt' : null) }),
}));

vi.mock('./_lib/sitemapLocation', () => ({
  get sitemapLocation() {
    return location.current;
  },
}));

const { default: robots } = await import('./robots');

describe('robots.txt', () => {
  beforeEach(() => {
    location.current = { kind: 'app' };
  });

  it('keeps the CMS and the framework routes out of the index', async () => {
    const { rules } = await robots();

    expect(rules).toMatchObject({ disallow: ['/admin', '/api', '/next/'] });
  });

  it('points at our own sitemap when this app builds it', async () => {
    await expect(robots()).resolves.toMatchObject({
      sitemap: 'https://exemplo.pt/sitemap.xml',
    });
  });

  it('points at the content source when the sitemap lives there', async () => {
    location.current = { kind: 'external', url: 'https://cms.exemplo.pt/sitemap.xml' };

    await expect(robots()).resolves.toMatchObject({
      sitemap: 'https://cms.exemplo.pt/sitemap.xml',
    });
  });

  it('says nothing at all when there is no sitemap, rather than naming an empty one', async () => {
    location.current = { kind: 'none' };

    const { sitemap } = await robots();

    expect(sitemap).toBeUndefined();
  });

  it('treats a declared-but-unfilled external URL as no sitemap', async () => {
    location.current = { kind: 'external', url: '   ' };

    const { sitemap } = await robots();

    expect(sitemap).toBeUndefined();
  });
});
