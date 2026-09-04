import type { Payload } from 'payload';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadPayloadAlternates } from './loadPayloadAlternates';

afterEach(() => {
  vi.restoreAllMocks();
});

function fakePayload(breadcrumbs: unknown) {
  const findByID = vi.fn().mockResolvedValue({ breadcrumbs });

  return { payload: { findByID } as unknown as Payload, findByID };
}

const LOCALES = ['pt-PT', 'en-GB'];

function crumbs(...urls: string[]) {
  return urls.map((url) => ({ url }));
}

describe('loadPayloadAlternates', () => {
  it('answers the path of the same page in each language', async () => {
    const { payload } = fakePayload({
      'pt-PT': crumbs('/sobre-nos'),
      'en-GB': crumbs('/about-us'),
    });

    await expect(loadPayloadAlternates(payload, 1, LOCALES, 'pt-PT', 'pt-PT')).resolves.toEqual({
      'pt-PT': '/sobre-nos',
      'en-GB': '/en/about-us',
    });
  });

  it('reads every locale in one query, without access control', async () => {
    const { payload, findByID } = fakePayload({ 'pt-PT': crumbs('/x') });

    await loadPayloadAlternates(payload, 7, LOCALES, 'pt-PT', 'pt-PT');

    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, locale: 'all', overrideAccess: true }),
    );
  });

  it('answers nothing when the page has no breadcrumbs', async () => {
    const { payload } = fakePayload(undefined);

    await expect(loadPayloadAlternates(payload, 1, LOCALES, 'pt-PT', 'pt-PT')).resolves.toEqual({});
  });

  it('skips a locale that has no breadcrumb at all', async () => {
    const { payload } = fakePayload({ 'pt-PT': crumbs('/sobre-nos'), 'en-GB': null });

    await expect(loadPayloadAlternates(payload, 1, LOCALES, 'pt-PT', 'pt-PT')).resolves.toEqual({
      'pt-PT': '/sobre-nos',
    });
  });
});

describe('an untranslated page must not advertise an alternate', () => {
  it('leaves out a locale whose URL collapsed to the root', async () => {
    const { payload } = fakePayload({ 'pt-PT': crumbs('/sobre-nos'), 'en-GB': crumbs('/') });

    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const alternates = await loadPayloadAlternates(payload, 1, LOCALES, 'pt-PT', 'pt-PT');

    expect(alternates).toEqual({ 'pt-PT': '/sobre-nos' });
  });

  it('leaves out a locale whose URL is a shorter path, which belongs to the parent', async () => {
    const { payload } = fakePayload({
      'pt-PT': crumbs('/servicos', '/servicos/consultoria'),
      'en-GB': crumbs('/servicos', '/servicos'),
    });

    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const alternates = await loadPayloadAlternates(payload, 1, LOCALES, 'pt-PT', 'pt-PT');

    expect(alternates['en-GB']).toBeUndefined();
  });

  it('names the language that is missing a title', async () => {
    const { payload } = fakePayload({ 'pt-PT': crumbs('/sobre-nos'), 'en-GB': crumbs('/') });

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await loadPayloadAlternates(payload, 1, LOCALES, 'pt-PT', 'pt-PT');

    expect(String(warn.mock.calls[0]?.[0])).toContain('en-GB');
  });

  it('keeps the root of a real homepage, where every locale is the root', async () => {
    const { payload } = fakePayload({ 'pt-PT': crumbs('/'), 'en-GB': crumbs('/') });

    await expect(loadPayloadAlternates(payload, 1, LOCALES, 'pt-PT', 'pt-PT')).resolves.toEqual({
      'pt-PT': '/',
      'en-GB': '/en',
    });
  });

  it('keeps a translated path of the same depth, even when the slugs differ', async () => {
    const { payload } = fakePayload({
      'pt-PT': crumbs('/servicos', '/servicos/consultoria'),
      'en-GB': crumbs('/services', '/services/consulting'),
    });

    const alternates = await loadPayloadAlternates(payload, 1, LOCALES, 'pt-PT', 'pt-PT');

    expect(alternates['en-GB']).toBe('/en/services/consulting');
  });

  it('emits every locale when the resolved one is unknown, because there is nothing to compare against', async () => {
    const { payload } = fakePayload({ 'pt-PT': crumbs('/sobre-nos'), 'en-GB': crumbs('/') });

    const alternates = await loadPayloadAlternates(payload, 1, LOCALES, 'pt-PT');

    expect(Object.keys(alternates)).toEqual(LOCALES);
  });
});
