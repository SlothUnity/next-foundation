import { describe, expect, it, vi } from 'vitest';

import * as projectModules from '@/modules';

import { TestPageSource, TestSiteSource } from '@/testing/testSources';

import { createFoundation } from './createFoundation';

function build(reportError?: Parameters<typeof createFoundation>[0]['reportError']) {
  return createFoundation({
    page: new TestPageSource(),
    site: new TestSiteSource(),
    reportError,
  });
}

describe('createFoundation', () => {
  it('hands back the sources it was given, unwrapped', () => {
    const page = new TestPageSource();
    const site = new TestSiteSource();

    const foundation = createFoundation({ page, site });

    expect(foundation.page).toBe(page);
    expect(foundation.site).toBe(site);
  });

  it('registers every module the project exports, so the renderer can find them by alias', () => {
    const foundation = build();

    for (const exported of Object.values(projectModules)) {
      expect(foundation.modules.getByAlias(exported.alias)).toBe(exported);
    }
  });

  it('answers undefined for an alias nobody registered, instead of throwing', () => {
    expect(build().modules.getByAlias('inexistente')).toBeUndefined();
  });

  it('defaults to a reporter that speaks, because silence was the defect', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    build().reportError({ alias: 'hero', failure: 'invalid-data' });

    expect(error).toHaveBeenCalledOnce();
    expect(String(error.mock.calls[0]?.[0])).toContain('hero');

    error.mockRestore();
  });

  it('takes a reporter from the composition root, and does not call it on its own', () => {
    const reportError = vi.fn();

    const foundation = build(reportError);

    expect(reportError).not.toHaveBeenCalled();

    foundation.reportError({ alias: 'hero', failure: 'not-registered' });

    expect(reportError).toHaveBeenCalledWith({ alias: 'hero', failure: 'not-registered' });
  });

  it('gives each call its own registry, so one test cannot leak into the next', () => {
    expect(build().modules).not.toBe(build().modules);
  });
});
