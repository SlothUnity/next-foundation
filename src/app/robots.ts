import type { MetadataRoute } from 'next';

import { requestOrigin } from '@/app/_lib/requestOrigin';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await requestOrigin();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/next/'],
    },

    sitemap: `${origin}/sitemap.xml`,
  };
}
