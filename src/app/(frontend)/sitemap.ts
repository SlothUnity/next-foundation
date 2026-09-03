import type { MetadataRoute } from 'next';

import { notFound } from 'next/navigation';

import { requestOrigin } from '@/app/_lib/requestOrigin';
import { sitemapLocation } from '@/app/_lib/sitemapLocation';
import { foundation } from '@/core/foundation/foundation';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (sitemapLocation.kind !== 'app') {
    notFound();
  }

  if (!foundation.page.listPaths) {
    throw new Error(
      'src/app/_lib/sitemapLocation.ts says this app builds the sitemap, and the content source cannot list its paths. Implement listPaths on your PageSource, or say where the sitemap really lives.',
    );
  }

  const [origin, paths] = await Promise.all([requestOrigin(), foundation.page.listPaths()]);

  return paths
    .filter((entry) => entry.noIndex !== true)
    .map((entry) => ({
      url: `${origin}${entry.path}`,
      lastModified: entry.updatedAt,
    }));
}
