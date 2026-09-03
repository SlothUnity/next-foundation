import { unstable_cache } from 'next/cache';

import { loadPayloadRedirects } from '@/providers/payload/sources/loadPayloadRedirects';

import { REDIRECTS_TAG } from './tags';

export const getCachedRedirects = unstable_cache(loadPayloadRedirects, ['payload:redirects:map'], {
  tags: [REDIRECTS_TAG],
});
