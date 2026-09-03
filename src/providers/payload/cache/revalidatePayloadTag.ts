import { revalidateTag } from 'next/cache';

const MISSING_REQUEST_CONTEXT = 'E263';

function isOutsideRequest(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    '__NEXT_ERROR_CODE' in error &&
    (error as { __NEXT_ERROR_CODE?: unknown }).__NEXT_ERROR_CODE === MISSING_REQUEST_CONTEXT
  );
}

export function revalidatePayloadTag(tag: string): void {
  try {
    revalidateTag(tag, { expire: 0 });
  } catch (error) {
    if (isOutsideRequest(error)) {
      return;
    }

    throw error;
  }
}
