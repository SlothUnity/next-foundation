import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiSiteSource } from './ApiSiteSource';

afterEach(() => {
  vi.restoreAllMocks();
});

function getSite() {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  return { site: new ApiSiteSource().getSite(), warn };
}

describe('ApiSiteSource', () => {
  it('answers a usable shape, so the site renders while the mapping is unwritten', async () => {
    const { site } = getSite();

    await expect(site).resolves.toEqual({
      name: 'Site',
      locales: ['pt-PT'],
      defaultLocale: 'pt-PT',
    });
  });

  it('says the values are placeholders, because nothing else would', async () => {
    const { site, warn } = getSite();

    await site;

    expect(warn).toHaveBeenCalledOnce();
  });

  it('names the file to write, like mapApiPage does when it throws', async () => {
    const { site, warn } = getSite();

    await site;

    expect(String(warn.mock.calls[0]?.[0])).toContain('ApiSiteSource.ts');
  });

  it('says what the placeholder name is visible as, since it reaches the browser', async () => {
    const { site, warn } = getSite();

    await site;

    expect(String(warn.mock.calls[0]?.[0])).toContain('og:site_name');
  });

  it('warns about the single locale, which silently disables the language prefixes', async () => {
    const { site, warn } = getSite();

    await site;

    expect(String(warn.mock.calls[0]?.[0])).toContain('resolveRoute');
  });
});
