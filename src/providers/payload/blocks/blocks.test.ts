import type { Block } from 'payload';
import { describe, expect, it } from 'vitest';

import * as modules from '@/modules';

import { pageBlocks } from './index';

const aliases = Object.values(modules).map((module) => module.alias);

function titleField(block: Block): Partial<Record<'required' | 'localized', boolean>> | undefined {
  const field = block.fields.find((entry) => 'name' in entry && entry.name === 'title');

  return field as Partial<Record<'required' | 'localized', boolean>> | undefined;
}

describe('the blocks the CMS offers an editor', () => {
  it('is not empty, because a page with no blocks cannot be authored', () => {
    expect(pageBlocks.length).toBeGreaterThan(0);
  });

  it.each(pageBlocks.map((block) => block.slug))(
    'block "%s" has a module with the same alias to render it',
    (slug) => {
      expect(aliases).toContain(slug);
    },
  );

  it('has no two blocks sharing a slug', () => {
    const slugs = pageBlocks.map((block) => block.slug);

    expect(slugs).toEqual([...new Set(slugs)]);
  });

  it('gives every block a title field to author', () => {
    for (const block of pageBlocks) {
      expect(titleField(block), `${block.slug} has no title field`).toBeDefined();
    }
  });

  it('makes that title required, so a block cannot render with nothing in it', () => {
    for (const block of pageBlocks) {
      expect(titleField(block)?.required, `${block.slug}.title is not required`).toBe(true);
    }
  });

  it('makes that title localized, because the site is multilingual', () => {
    for (const block of pageBlocks) {
      expect(titleField(block)?.localized, `${block.slug}.title is not localized`).toBe(true);
    }
  });
});
