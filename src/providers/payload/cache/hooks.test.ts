import { beforeEach, describe, expect, it, vi } from 'vitest';

import { revalidatePagesOnChange, revalidatePagesOnDelete, revalidateSiteOnChange } from './hooks';
import { PAGES_TAG, SITE_TAG } from './tags';

const revalidatePayloadTag = vi.hoisted(() => vi.fn());

vi.mock('./revalidatePayloadTag', () => ({ revalidatePayloadTag }));

type Status = 'draft' | 'published';

function change(status?: Status, previousStatus?: Status) {
  const args = {
    doc: status ? { _status: status } : {},
    previousDoc: previousStatus ? { _status: previousStatus } : {},
  };

  return revalidatePagesOnChange(args as never);
}

describe('revalidatePagesOnChange', () => {
  beforeEach(() => {
    revalidatePayloadTag.mockReset();
  });

  it('invalidates the pages when one is published', () => {
    change('published', 'draft');

    expect(revalidatePayloadTag).toHaveBeenCalledWith(PAGES_TAG);
  });

  it('invalidates the pages when a published one is unpublished', () => {
    change('draft', 'published');

    expect(revalidatePayloadTag).toHaveBeenCalledWith(PAGES_TAG);
  });

  it('ignores a draft of a page that was never published', () => {
    // O autosave grava de 375 em 375ms. Sem esta guarda, escrever um rascunho
    // invalidava a cache do site inteiro a cada tecla.
    change('draft', 'draft');

    expect(revalidatePayloadTag).not.toHaveBeenCalled();
  });

  it('returns the document, as an afterChange hook must', () => {
    const doc = { _status: 'published' as const };

    expect(revalidatePagesOnChange({ doc, previousDoc: doc } as never)).toBe(doc);
  });
});

describe('revalidatePagesOnDelete', () => {
  beforeEach(() => {
    revalidatePayloadTag.mockReset();
  });

  it('invalidates the pages when a published one is deleted', () => {
    revalidatePagesOnDelete({ doc: { _status: 'published' } } as never);

    expect(revalidatePayloadTag).toHaveBeenCalledWith(PAGES_TAG);
  });

  it('ignores a deleted draft', () => {
    revalidatePagesOnDelete({ doc: { _status: 'draft' } } as never);

    expect(revalidatePayloadTag).not.toHaveBeenCalled();
  });
});

describe('revalidateSiteOnChange', () => {
  beforeEach(() => {
    revalidatePayloadTag.mockReset();
  });

  it('invalidates the site on any save, because the global has no drafts', () => {
    revalidateSiteOnChange({ doc: { name: 'Foundation' } } as never);

    expect(revalidatePayloadTag).toHaveBeenCalledWith(SITE_TAG);
  });
});
