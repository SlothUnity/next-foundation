import type { Metadata } from 'next';

import type { Meta } from '@/core/pages';

export interface CreateMetadataOptions {
  meta: Meta;
  canonical: string;
}

export function createMetadata({ meta, canonical }: CreateMetadataOptions): Metadata {
  const openGraphTitle = meta.ogTitle ?? meta.title;

  const openGraphDescription = meta.ogDescription ?? meta.description;

  const images = meta.image
    ? [
        {
          url: meta.image.url,
          alt: meta.image.alt,
          width: meta.image.width,
          height: meta.image.height,
        },
      ]
    : undefined;

  return {
    title: meta.title,
    description: meta.description,

    alternates: {
      canonical,
      languages: meta.alternates,
    },

    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      url: canonical,
      images,
    },

    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: openGraphTitle,
      description: openGraphDescription,
      images,
    },

    robots: {
      index: !meta.noIndex,
      follow: !meta.noFollow,
    },
  };
}
