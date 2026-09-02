import { unstable_cache } from 'next/cache';

import { loadPayloadSite } from '@/providers/payload/sources/loadPayloadSite';

import { SITE_TAG } from './tags';

export const getCachedSite = unstable_cache(loadPayloadSite, ['payload:site'], {
  tags: [SITE_TAG],
});
