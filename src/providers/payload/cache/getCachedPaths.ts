import { unstable_cache } from 'next/cache';

import { loadPayloadPaths } from '@/providers/payload/sources/loadPayloadPaths';

import { PAGES_TAG } from './tags';

export const getCachedPaths = unstable_cache(loadPayloadPaths, ['payload:paths'], {
  tags: [PAGES_TAG],
});
