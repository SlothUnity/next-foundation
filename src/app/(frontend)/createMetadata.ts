import type { Metadata } from 'next';

import type { Meta } from '@/core/pages';

export function createMetadata(meta: Meta): Metadata {
  const openGraphTitle = meta.ogTitle ?? meta.title;

  const openGraphDescription = meta.ogDescription ?? meta.description;

  return {
    title: meta.title,
    description: meta.description,

    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
    },

    robots: {
      index: !meta.noIndex,
      follow: !meta.noFollow,
    },
  };
}
