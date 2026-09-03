import type { Payload } from 'payload';
import { describe, expect, it, vi } from 'vitest';

import { loadPayloadLayout } from './loadPayloadLayout';

type Region = { modules?: unknown[] };

function fakePayload(regions: Record<'navigation' | 'footer', Region>) {
  const findGlobal = vi.fn(async ({ slug }: { slug: 'navigation' | 'footer' }) => regions[slug]);

  return { payload: { findGlobal } as unknown as Payload, findGlobal };
}

function heroBlock(id: string, title: string) {
  return { id, blockType: 'hero', blockName: null, title };
}

describe('loadPayloadLayout', () => {
  it('maps each global into the region the renderer draws', async () => {
    const { payload } = fakePayload({
      navigation: { modules: [heroBlock('nav-1', 'Menu')] },
      footer: { modules: [heroBlock('foot-1', 'Contacts')] },
    });

    await expect(loadPayloadLayout(payload, 'pt-PT')).resolves.toEqual({
      navigation: [{ id: 'nav-1', name: 'hero', alias: 'hero', data: { title: 'Menu' } }],
      footer: [{ id: 'foot-1', name: 'hero', alias: 'hero', data: { title: 'Contacts' } }],
    });
  });

  it('keeps the authored order, because a banner above a menu is the point of an array', async () => {
    const { payload } = fakePayload({
      navigation: { modules: [heroBlock('a', 'Banner'), heroBlock('b', 'Menu')] },
      footer: {},
    });

    const { navigation } = await loadPayloadLayout(payload, 'pt-PT');

    expect(navigation?.map((module) => (module.data as { title: string }).title)).toEqual([
      'Banner',
      'Menu',
    ]);
  });

  it('omits a region nobody authored, so the renderer skips the landmark', async () => {
    const { payload } = fakePayload({ navigation: { modules: [] }, footer: {} });

    await expect(loadPayloadLayout(payload, 'pt-PT')).resolves.toEqual({});
  });

  it('asks for the requested locale and refuses to fall back to another language', async () => {
    const { payload, findGlobal } = fakePayload({ navigation: {}, footer: {} });

    await loadPayloadLayout(payload, 'en-GB');

    expect(findGlobal).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'en-GB', fallbackLocale: false }),
    );
  });
});
