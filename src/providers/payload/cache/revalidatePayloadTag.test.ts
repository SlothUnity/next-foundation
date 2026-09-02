import { beforeEach, describe, expect, it, vi } from 'vitest';

import { revalidatePayloadTag } from './revalidatePayloadTag';

const revalidateTag = vi.hoisted(() => vi.fn());

vi.mock('next/cache', () => ({ revalidateTag }));

function nextError(code: string): Error {
  const error = new Error(`Invariant: whatever (${code})`);

  Object.defineProperty(error, '__NEXT_ERROR_CODE', { value: code });

  return error;
}

describe('revalidatePayloadTag', () => {
  beforeEach(() => {
    revalidateTag.mockReset();
  });

  it('expires the tag immediately instead of serving it stale', () => {
    revalidatePayloadTag('payload:pages');

    expect(revalidateTag).toHaveBeenCalledWith('payload:pages', { expire: 0 });
  });

  it('stays quiet when there is no request to revalidate in', () => {
    revalidateTag.mockImplementation(() => {
      throw nextError('E263');
    });

    expect(() => revalidatePayloadTag('payload:pages')).not.toThrow();
  });

  it('lets any other failure through', () => {
    revalidateTag.mockImplementation(() => {
      throw nextError('E7');
    });

    expect(() => revalidatePayloadTag('payload:pages')).toThrow();
  });

  it('lets a plain error through', () => {
    revalidateTag.mockImplementation(() => {
      throw new Error('boom');
    });

    expect(() => revalidatePayloadTag('payload:pages')).toThrow('boom');
  });
});
