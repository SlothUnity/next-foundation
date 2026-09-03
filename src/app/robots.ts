import type { MetadataRoute } from 'next';

import { requestOrigin } from '@/app/_lib/requestOrigin';
import { sitemapLocation } from '@/app/_lib/sitemapLocation';
import { foundation } from '@/core/foundation/foundation';

async function sitemapReference(): Promise<string | undefined> {
  if (sitemapLocation.kind === 'none') {
    return undefined;
  }

  if (sitemapLocation.kind === 'external') {
    return sitemapLocation.url.trim() || undefined;
  }

  if (sitemapLocation.kind === 'source') {
    const { sitemapUrl } = await foundation.site.getSite();

    return sitemapUrl?.trim() || undefined;
  }

  return `${await requestOrigin()}/sitemap.xml`;
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/next/'],
    },

    sitemap: await sitemapReference(),
  };
}
