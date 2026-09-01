import type { SiteDefinition } from '@/core/site';

import { getPayloadClient } from '@/providers/payload/getPayloadClient';
import { mapPayloadSite } from '@/providers/payload/mappers/mapPayloadSite';

/**
 * O global `Site` sem cache. `depth: 0` porque o `mapPayloadSite` só lê escalares —
 * o `name` e o `enabledLocales` — e não há nada para popular.
 */
export async function loadPayloadSite(): Promise<SiteDefinition> {
  const payload = await getPayloadClient();

  const site = await payload.findGlobal({ slug: 'site', depth: 0 });

  return mapPayloadSite(site);
}
