import { describe, expect, it } from 'vitest';

import { imageSchema } from './Image.schema';

const URL = 'https://cdn.exemplo.pt/hero.jpg';

describe('imageSchema', () => {
  it('requires a url and an alt, which is what makes an image expressible', () => {
    expect(imageSchema.safeParse({ url: URL, alt: 'Uma vista' }).success).toBe(true);

    expect(imageSchema.safeParse({ url: URL }).success).toBe(false);
    expect(imageSchema.safeParse({ alt: 'Uma vista' }).success).toBe(false);
  });

  it('accepts an empty alt, because a decorative image is a real case', () => {
    expect(imageSchema.safeParse({ url: URL, alt: '' }).success).toBe(true);
  });

  it('treats the dimensions as optional, because not every source reports them', () => {
    expect(imageSchema.safeParse({ url: URL, alt: 'a' }).success).toBe(true);

    expect(imageSchema.safeParse({ url: URL, alt: 'a', width: 1600, height: 900 }).success).toBe(
      true,
    );
  });

  it('refuses dimensions that are not numbers, so next/image never gets a string', () => {
    expect(imageSchema.safeParse({ url: URL, alt: 'a', width: '1600' }).success).toBe(false);
  });

  it('strips what it does not declare, so nothing extra crosses the RSC boundary', () => {
    const parsed = imageSchema.parse({ url: URL, alt: 'a', focalX: 50 });

    expect(Object.keys(parsed).sort()).toEqual(['alt', 'url']);
  });
});
