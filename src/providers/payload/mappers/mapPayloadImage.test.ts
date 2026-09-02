import { describe, expect, it } from 'vitest';

import { isPayloadUpload, mapPayloadImage } from './mapPayloadImage';

const UPLOAD = {
  id: 7,
  url: '/api/media/file/logo.png',
  filename: 'logo.png',
  mimeType: 'image/png',
  alt: 'O logótipo',
  width: 1200,
  height: 630,
};

describe('isPayloadUpload', () => {
  it('recognises a populated upload by its url and filename', () => {
    expect(isPayloadUpload(UPLOAD)).toBe(true);
  });

  it('refuses an unpopulated relationship, which is just an id', () => {
    expect(isPayloadUpload(7)).toBe(false);
  });

  it('refuses an ordinary object that happens to have a url', () => {
    expect(isPayloadUpload({ url: '/sobre-nos' })).toBe(false);
  });

  it('refuses arrays, so a blocks list is never mistaken for an upload', () => {
    expect(isPayloadUpload([UPLOAD])).toBe(false);
  });

  it('refuses null and undefined', () => {
    expect(isPayloadUpload(null)).toBe(false);
    expect(isPayloadUpload(undefined)).toBe(false);
  });
});

describe('mapPayloadImage', () => {
  it('keeps only what a renderer needs', () => {
    expect(mapPayloadImage(UPLOAD)).toEqual({
      url: '/api/media/file/logo.png',
      alt: 'O logótipo',
      width: 1200,
      height: 630,
    });
  });

  it('answers an empty alt rather than undefined, so a decorative image is expressible', () => {
    expect(mapPayloadImage({ ...UPLOAD, alt: null }).alt).toBe('');
  });

  it('drops dimensions it does not know, because a PDF has none', () => {
    const mapped = mapPayloadImage({ ...UPLOAD, width: null, height: null });

    expect(mapped.width).toBeUndefined();
    expect(mapped.height).toBeUndefined();
  });
});
