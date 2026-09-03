import type { MetadataRoute } from 'next';

import { requestOrigin } from '@/app/_lib/requestOrigin';
import { foundation } from '@/core/foundation/foundation';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!foundation.page.listPaths) {
    throw new Error(
      'This route builds the sitemap from the content source, and the source cannot list its paths. Either implement listPaths on your PageSource, or say where the sitemap lives in src/app/_lib/sitemapLocation.ts and delete this route.',
    );
  }

  const [origin, paths] = await Promise.all([requestOrigin(), foundation.page.listPaths()]);

  return paths.map((entry) => ({
    url: `${origin}${entry.path}`,
    lastModified: entry.updatedAt,
  }));
}
