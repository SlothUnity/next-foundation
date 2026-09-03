import type { BlocksField, GlobalConfig } from 'payload';
import { describe, expect, it } from 'vitest';

import { isEditor } from '@/providers/payload/access';
import { pageBlocks } from '@/providers/payload/blocks';
import { revalidateLayoutOnChange } from '@/providers/payload/cache';

import { Footer } from './Footer';
import { Navigation } from './Navigation';

const REGIONS: [string, GlobalConfig][] = [
  ['navigation', Navigation],
  ['footer', Footer],
];

function modulesField(global: GlobalConfig): BlocksField {
  const field = global.fields[0];

  if (!field || field.type !== 'blocks') {
    throw new Error(`${global.slug} has no blocks field`);
  }

  return field;
}

describe.each(REGIONS)('the %s global', (slug, global) => {
  it('is the region the renderer draws, under that slug', () => {
    expect(global.slug).toBe(slug);
  });

  it('offers exactly the blocks a page offers, so any module can serve here', () => {
    expect(modulesField(global).blocks).toBe(pageBlocks);
  });

  it('is content, so an editor can change it without an administrator', () => {
    expect(global.access?.read).toBe(isEditor);
    expect(global.access?.update).toBe(isEditor);
  });

  it('invalidates the page cache when it changes, because it is part of every page', () => {
    expect(global.hooks?.afterChange).toEqual([revalidateLayoutOnChange]);
  });

  it('sits in the same admin group as the rest of the website', () => {
    expect(global.admin?.group).toBe('Website');
  });
});
