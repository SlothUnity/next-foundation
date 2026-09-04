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

const getSite = vi.fn<() => Promise<{ sitemapUrl?: string }>>();

vi.mock('@/core/foundation/foundation', () => ({
  foundation: { site: { getSite } },
}));

const { default: robots } = await import('./robots');

describe('robots.txt', () => {
  beforeEach(() => {
    location.current = { kind: 'app' };
    getSite.mockReset();
    getSite.mockResolvedValue({});
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

  it('asks the content source where it is, for an API that knows and a host that varies', async () => {
    location.current = { kind: 'source' };

    getSite.mockResolvedValue({ sitemapUrl: 'https://cms.exemplo.pt/sitemap.xml' });

    await expect(robots()).resolves.toMatchObject({
      sitemap: 'https://cms.exemplo.pt/sitemap.xml',
    });
  });

  it('says nothing when the source was asked and does not know', async () => {
    location.current = { kind: 'source' };

    getSite.mockResolvedValue({});

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { sitemap } = await robots();

    expect(sitemap).toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('names the file to change when the source does not know, because no provider writes that field', async () => {
    location.current = { kind: 'source' };

    getSite.mockResolvedValue({});

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await robots();

    expect(String(warn.mock.calls[0]?.[0])).toContain('sitemapLocation.ts');
  });

  it('never asks the source when the project already said where it is', async () => {
    location.current = { kind: 'external', url: 'https://cms.exemplo.pt/sitemap.xml' };

    await robots();

    expect(getSite).not.toHaveBeenCalled();
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
