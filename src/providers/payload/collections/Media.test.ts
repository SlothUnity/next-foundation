import { describe, expect, it } from 'vitest';

import type { Field, TextField } from 'payload';

import { allowedMediaMimeTypes, Media } from './Media';

function altField(): TextField {
  const match = Media.fields.find(
    (field: Field): field is TextField => 'name' in field && field.name === 'alt',
  );

  if (!match) {
    throw new Error('Media has no alt field');
  }

  return match;
}

describe('Media — the upload allowlist', () => {
  it('is an allowlist and not a blocklist, so a new format is refused until it is added', () => {
    expect(Media.upload).toMatchObject({ mimeTypes: allowedMediaMimeTypes });
  });

  it('refuses SVG, which would execute script on the site origin', () => {
    expect(allowedMediaMimeTypes).not.toContain('image/svg+xml');
  });

  it('refuses HTML for the same reason', () => {
    expect(allowedMediaMimeTypes).not.toContain('text/html');
  });

  it('accepts the formats a content site actually uses', () => {
    expect(allowedMediaMimeTypes).toEqual(
      expect.arrayContaining(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    );
  });
});

describe('Media — alternative text', () => {
  it('exists, because otherwise an accessible image is not expressible at all', () => {
    expect(altField().type).toBe('text');
  });

  it('is required, so it cannot be skipped by accident', () => {
    expect(altField().required).toBe(true);
  });

  it('is localised, because the description of an image is prose', () => {
    expect(altField().localized).toBe(true);
  });
});
