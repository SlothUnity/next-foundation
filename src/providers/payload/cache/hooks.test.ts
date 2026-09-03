import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  revalidatePagesOnChange,
  revalidatePagesOnDelete,
  revalidateRedirectsOnChange,
  revalidateRedirectsOnDelete,
  revalidateSiteOnChange,
} from './hooks';
import { PAGES_TAG, REDIRECTS_TAG, SITE_TAG } from './tags';

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

  it('invalidates the redirects too, because their targets are page URLs', () => {
    change('published', 'published');

    expect(revalidatePayloadTag).toHaveBeenCalledWith(REDIRECTS_TAG);
  });

  it('invalidates the pages when a published one is unpublished', () => {
    change('draft', 'published');

    expect(revalidatePayloadTag).toHaveBeenCalledWith(PAGES_TAG);
  });

  it('ignores a draft of a page that was never published', () => {
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

describe('revalidateRedirectsOnChange', () => {
  beforeEach(() => {
    revalidatePayloadTag.mockReset();
  });

  it('invalidates the redirects on any save, because they have no drafts', () => {
    revalidateRedirectsOnChange({ doc: { from: '/a' } } as never);

    expect(revalidatePayloadTag).toHaveBeenCalledWith(REDIRECTS_TAG);
  });

  it('leaves the pages alone, because the dependency only runs one way', () => {
    revalidateRedirectsOnChange({ doc: { from: '/a' } } as never);

    expect(revalidatePayloadTag).not.toHaveBeenCalledWith(PAGES_TAG);
  });

  it('invalidates them on delete too, or the old URL kept redirecting', () => {
    revalidateRedirectsOnDelete({ doc: { from: '/a' } } as never);

    expect(revalidatePayloadTag).toHaveBeenCalledWith(REDIRECTS_TAG);
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
