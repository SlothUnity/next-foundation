import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Site } from '@payload-types';

import { payloadDefaultLocale } from '@/providers/payload/locales';

import { mapPayloadSite } from './mapPayloadSite';

function site(enabledLocales: Site['enabledLocales']): Site {
  return { id: 1, name: 'Foundation', enabledLocales, updatedAt: '', createdAt: '' } as Site;
}

describe('mapPayloadSite', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('takes the first enabled locale as the default', () => {
    expect(mapPayloadSite(site(['en-GB', 'pt-PT'])).defaultLocale).toBe('en-GB');
  });

  it('falls back to the Payload default when the global is empty', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(mapPayloadSite(site([])).defaultLocale).toBe(payloadDefaultLocale);
  });

  it('says out loud that the global is empty', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mapPayloadSite(site([]));

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('enabledLocales'));
  });

  it('stays quiet when the global is filled in', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mapPayloadSite(site(['pt-PT']));

    expect(warn).not.toHaveBeenCalled();
  });
});
