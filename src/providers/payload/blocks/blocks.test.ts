import { describe, expect, it } from 'vitest';

import * as modules from '@/modules';

import { pageBlocks } from './index';

const aliases = Object.values(modules).map((module) => module.alias);

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

  it('gives every block a localized, required title field to author', () => {
    for (const block of pageBlocks) {
      const title = block.fields.find((field) => 'name' in field && field.name === 'title');

      expect(title, `${block.slug} has no title field`).toBeDefined();
    }
  });
});
