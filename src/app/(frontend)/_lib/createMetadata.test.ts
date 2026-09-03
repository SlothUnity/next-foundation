import { describe, expect, it } from 'vitest';

import type { Meta } from '@/core/pages';

import { createMetadata } from './createMetadata';

function meta(overrides: Partial<Meta> = {}): Meta {
  return { locale: 'pt-PT', title: 'Sobre nós', description: 'Quem somos', ...overrides };
}

describe('createMetadata', () => {
  it('declares the canonical URL, which is what mitigates a duplicated path', () => {
    const result = createMetadata({ meta: meta(), canonical: '/sobre-nos' });

    expect(result.alternates?.canonical).toBe('/sobre-nos');
    expect(result.openGraph).toMatchObject({ url: '/sobre-nos' });
  });

  it('emits hreflang from the paths the provider resolved per locale', () => {
    const result = createMetadata({
      meta: meta({ alternates: { 'pt-PT': '/sobre-nos', 'en-GB': '/en/about-us' } }),
      canonical: '/sobre-nos',
    });

    expect(result.alternates?.languages).toEqual({
      'pt-PT': '/sobre-nos',
      'en-GB': '/en/about-us',
    });
  });

  it('leaves hreflang out when the provider cannot answer it', () => {
    const result = createMetadata({ meta: meta(), canonical: '/sobre-nos' });

    expect(result.alternates?.languages).toBeUndefined();
  });

  it('carries the CMS image into Open Graph and Twitter, with its dimensions', () => {
    const result = createMetadata({
      meta: meta({ image: { url: '/media/capa.png', alt: 'A capa', width: 1200, height: 630 } }),
      canonical: '/',
    });

    expect(result.openGraph).toMatchObject({
      images: [{ url: '/media/capa.png', alt: 'A capa', width: 1200, height: 630 }],
    });

    expect(result.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('falls back to the summary card when there is no image', () => {
    expect(createMetadata({ meta: meta(), canonical: '/' }).twitter).toMatchObject({
      card: 'summary',
    });
  });

  it('prefers the Open Graph overrides when the editor filled them', () => {
    const result = createMetadata({
      meta: meta({ ogTitle: 'Partilha', ogDescription: 'Para redes sociais' }),
      canonical: '/',
    });

    expect(result.openGraph).toMatchObject({
      title: 'Partilha',
      description: 'Para redes sociais',
    });

    expect(result.title).toBe('Sobre nós');
  });

  it('turns the two SEO checkboxes into robots directives', () => {
    expect(createMetadata({ meta: meta({ noIndex: true }), canonical: '/' }).robots).toMatchObject({
      index: false,
      follow: true,
    });

    expect(createMetadata({ meta: meta({ noFollow: true }), canonical: '/' }).robots).toMatchObject(
      {
        index: true,
        follow: false,
      },
    );
  });
});
