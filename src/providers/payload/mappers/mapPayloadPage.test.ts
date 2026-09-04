import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Page } from '@payload-types';

import { mapPayloadPage } from './mapPayloadPage';

afterEach(() => {
  vi.restoreAllMocks();
});

function createPage(page: Partial<Page> = {}): Page {
  return { id: 1, title: 'Sobre nós', ...page } as Page;
}

function createBlock(block: Record<string, unknown> = {}) {
  return { id: 'block-1', blockType: 'hero', ...block };
}

function mapBlocks(...blocks: Record<string, unknown>[]) {
  return mapPayloadPage(createPage({ main: blocks as unknown as Page['main'] }), 'pt-PT').main;
}

describe('mapPayloadPage', () => {
  describe('meta', () => {
    it('carries the locale it was resolved with', () => {
      expect(mapPayloadPage(createPage(), 'en-GB').meta.locale).toBe('en-GB');
    });

    it('turns the nulls Payload stores into the undefined the contract expects', () => {
      const page = createPage({
        meta: { title: null, description: null, ogTitle: null, ogDescription: null },
      } as Partial<Page>);

      const { meta } = mapPayloadPage(page, 'pt-PT');

      expect(meta.title).toBeUndefined();
      expect(meta.description).toBeUndefined();
      expect(meta.ogTitle).toBeUndefined();
      expect(meta.ogDescription).toBeUndefined();
    });

    it('treats an unanswered robots flag as a no', () => {
      const { meta } = mapPayloadPage(createPage(), 'pt-PT');

      expect(meta.noIndex).toBe(false);
      expect(meta.noFollow).toBe(false);
    });

    it('keeps the values an editor did fill in', () => {
      const page = createPage({
        meta: { title: 'Sobre nós', ogTitle: 'Sobre', noIndex: true },
      } as Partial<Page>);

      const { meta } = mapPayloadPage(page, 'pt-PT');

      expect(meta).toMatchObject({ title: 'Sobre nós', ogTitle: 'Sobre', noIndex: true });
    });
  });

  describe('blocks', () => {
    it('gives a page with no blocks an empty main', () => {
      expect(mapPayloadPage(createPage(), 'pt-PT').main).toEqual([]);
    });

    it('uses the block type as the alias the registry looks up', () => {
      expect(mapBlocks(createBlock())[0]).toMatchObject({ id: 'block-1', alias: 'hero' });
    });

    it('prefers the name the editor gave the block', () => {
      expect(mapBlocks(createBlock({ blockName: 'Hero da homepage' }))[0]?.name).toBe(
        'Hero da homepage',
      );
    });

    it('falls back to the block type when the editor named nothing', () => {
      expect(mapBlocks(createBlock({ blockName: null }))[0]?.name).toBe('hero');
    });

    it('keeps the editable fields as the module data', () => {
      const [module] = mapBlocks(createBlock({ title: 'Olá', subtitle: 'Mundo' }));

      expect(module?.data).toEqual({ title: 'Olá', subtitle: 'Mundo' });
    });

    it('drops a block without an id, because the key would not be stable', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      expect(mapBlocks(createBlock({ id: undefined }))).toEqual([]);
    });

    it('keeps the rest of the page when one block has no id', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const modules = mapBlocks(createBlock({ id: undefined }), createBlock({ id: 'ok' }));

      expect(modules).toHaveLength(1);
      expect(modules[0]?.id).toBe('ok');
    });

    it('says which block type it dropped, because the id is not in the CMS UI', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      mapBlocks(createBlock({ id: undefined }));

      expect(String(warn.mock.calls[0]?.[0])).toContain('hero');
    });
  });

  describe('null stripping', () => {
    it('drops empty fields, which zod would reject as null', () => {
      const [module] = mapBlocks(createBlock({ title: 'Olá', subtitle: null }));

      expect(module?.data).toEqual({ title: 'Olá' });
      expect(module?.data).not.toHaveProperty('subtitle');
    });

    it('drops empty fields nested in an object', () => {
      const [module] = mapBlocks(createBlock({ cta: { label: 'Ver', href: null } }));

      expect(module?.data).toEqual({ cta: { label: 'Ver' } });
    });

    it('drops empty fields nested inside array items', () => {
      const [module] = mapBlocks(
        createBlock({ items: [{ label: 'Um', icon: null }, { label: 'Dois' }] }),
      );

      expect(module?.data).toEqual({ items: [{ label: 'Um' }, { label: 'Dois' }] });
    });

    it('drops null entries in an array', () => {
      const [module] = mapBlocks(createBlock({ items: [null, { label: 'Um' }] }));

      expect(module?.data).toEqual({ items: [{ label: 'Um' }] });
    });

    it('keeps false and zero, which are answers and not absences', () => {
      const [module] = mapBlocks(createBlock({ featured: false, order: 0 }));

      expect(module?.data).toEqual({ featured: false, order: 0 });
    });
  });
});
