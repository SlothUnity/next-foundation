import type { MetadataRoute } from 'next';

import { requestOrigin } from '@/app/_lib/requestOrigin';
import { foundation } from '@/core/foundation/foundation';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!foundation.page.listPaths) {
    console.warn(
      'The content source cannot list its paths, so the sitemap is empty. Implement listPaths on your PageSource.',
    );

    return [];
  }

  const [origin, paths] = await Promise.all([requestOrigin(), foundation.page.listPaths()]);

  return paths.map((entry) => ({
    url: `${origin}${entry.path}`,
    lastModified: entry.updatedAt,
  }));
}
