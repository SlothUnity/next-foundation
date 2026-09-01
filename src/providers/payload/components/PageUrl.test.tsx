import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import PageUrl from './PageUrl';

const ORIGIN = 'https://exemplo.pt';

interface ShowOptions {
  breadcrumbs?: unknown;
  locale?: string;
  enabledLocales?: string[];
}

function createReq({ locale = 'pt-PT', enabledLocales = ['pt-PT', 'en-GB'] }: ShowOptions) {
  return {
    origin: ORIGIN,
    locale,
    payload: { findGlobal: vi.fn().mockResolvedValue({ name: 'Foundation', enabledLocales }) },
  };
}

async function show(options: ShowOptions = {}) {
  const req = createReq(options);

  const data = 'breadcrumbs' in options ? { breadcrumbs: options.breadcrumbs } : {};

  render(await PageUrl({ data, req } as never));

  return req;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PageUrl', () => {
  it('links to the page, on the origin the request came from', async () => {
    await show({ breadcrumbs: [{ url: '/sobre-nos' }] });

    expect(screen.getByRole('link')).toHaveAttribute('href', `${ORIGIN}/sobre-nos`);
  });

  it('uses the last breadcrumb, which is the deepest one', async () => {
    await show({ breadcrumbs: [{ url: '/servicos' }, { url: '/servicos/consultoria' }] });

    expect(screen.getByRole('link')).toHaveAttribute('href', `${ORIGIN}/servicos/consultoria`);
  });

  it('prefixes the path outside the default locale', async () => {
    await show({ breadcrumbs: [{ url: '/about-us' }], locale: 'en-GB' });

    expect(screen.getByRole('link')).toHaveAttribute('href', `${ORIGIN}/en/about-us`);
  });

  it('falls back to the default locale when the admin asks for all of them', async () => {
    await show({ breadcrumbs: [{ url: '/sobre-nos' }], locale: 'all' });

    expect(screen.getByRole('link')).toHaveAttribute('href', `${ORIGIN}/sobre-nos`);
  });

  it('still resolves a locale when the site global is empty', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Antes lia enabledLocales[0] por sua conta e o campo desaparecia do admin.
    await show({ breadcrumbs: [{ url: '/sobre-nos' }], enabledLocales: [] });

    expect(screen.getByRole('link')).toHaveAttribute('href', `${ORIGIN}/sobre-nos`);
  });

  it('says why there is no url yet instead of vanishing', async () => {
    await show();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/save the page/i)).toBeInTheDocument();
  });

  it('does not even ask the database before there is a url to build', async () => {
    const req = await show({ breadcrumbs: [] });

    expect(screen.getByText(/save the page/i)).toBeInTheDocument();
    expect(req.payload.findGlobal).not.toHaveBeenCalled();
  });

  it('reads the global without populating relations', async () => {
    const req = await show({ breadcrumbs: [{ url: '/sobre-nos' }] });

    expect(req.payload.findGlobal).toHaveBeenCalledWith({ slug: 'site', depth: 0 });
  });

  it('opens in a new tab without leaking the referrer', async () => {
    await show({ breadcrumbs: [{ url: '/sobre-nos' }] });

    expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
