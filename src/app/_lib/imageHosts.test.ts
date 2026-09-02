import { describe, expect, it } from 'vitest';

import { imageSourceDirective, remoteImageHosts } from './imageHosts';

describe('the image sources this project declares', () => {
  it('always covers same-origin, so an image committed to the repo needs nothing declared', () => {
    expect(imageSourceDirective).toContain("img-src 'self'");
  });

  it('turns every declared host into an https source', () => {
    for (const host of remoteImageHosts) {
      expect(imageSourceDirective).toContain(`https://${host}`);
    }
  });

  it('names no host that was not declared', () => {
    const hosts = imageSourceDirective
      .split(' ')
      .filter((part) => part.startsWith('https://'))
      .map((part) => part.replace('https://', ''));

    expect(hosts).toEqual(remoteImageHosts);
  });
});
