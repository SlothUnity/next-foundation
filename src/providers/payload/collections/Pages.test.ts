import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Pages } from './Pages';

const SITE = { enabledLocales: ['pt-PT', 'en-GB'] };

function createReq(site: unknown = SITE) {
  const error = vi.fn();

  return {
    payload: {
      findGlobal: vi.fn().mockResolvedValue(site),
      logger: { error },
    },
    error,
  };
}

function previewUrl(req: ReturnType<typeof createReq>, locale = 'pt-PT') {
  const livePreview = Pages.admin?.livePreview;

  if (typeof livePreview?.url !== 'function') {
    throw new Error('Pages has no livePreview.url');
  }

  return livePreview.url({
    data: { breadcrumbs: [{ url: '/sobre-nos' }] },
    locale: { code: locale },
    req,
  } as never);
}

describe('Pages livePreview.url', () => {
  beforeEach(() => {
    process.env.PREVIEW_SECRET = 'segredo';
  });

  afterEach(() => {
    delete process.env.PREVIEW_SECRET;
    vi.restoreAllMocks();
  });

  it('builds a preview link for the document being edited', async () => {
    const url = await previewUrl(createReq());

    expect(String(url)).toContain('/next/preview?');

    // O segredo assina o caminho, não viaja no URL.
    expect(String(url)).not.toContain('segredo');
    expect(String(url)).toContain('token=');
  });

  it('keeps working when the site global has no locales', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Antes devolvia undefined e o preview desaparecia sem dizer porquê. O locale
    // por omissão é resposta do mapPayloadSite, que resolve sempre.
    const url = await previewUrl(createReq({ enabledLocales: [] }));

    expect(String(url)).toContain('/next/preview?');
  });

  it('disables the preview and says why when the secret is missing', async () => {
    delete process.env.PREVIEW_SECRET;

    const req = createReq();

    await expect(previewUrl(req)).resolves.toBeUndefined();

    expect(req.error).toHaveBeenCalledWith(expect.stringContaining('PREVIEW_SECRET'));
  });

  it('does not even ask the database when the secret is missing', async () => {
    delete process.env.PREVIEW_SECRET;

    const req = createReq();

    await previewUrl(req);

    expect(req.payload.findGlobal).not.toHaveBeenCalled();
  });
});
