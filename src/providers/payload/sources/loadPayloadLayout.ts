import type { Payload } from 'payload';

import type { ModuleInstance } from '@/core/modules';

import type { SupportedLocale } from '@/providers/payload/locales';
import { mapPayloadBlocks, type PayloadBlock } from '@/providers/payload/mappers/mapPayloadPage';

export interface PayloadLayout {
  navigation?: ModuleInstance[];
  footer?: ModuleInstance[];
}

async function loadRegion(
  payload: Payload,
  slug: 'navigation' | 'footer',
  locale: SupportedLocale,
): Promise<ModuleInstance[]> {
  const global = await payload.findGlobal({
    slug,
    locale,
    fallbackLocale: false,
    overrideAccess: true,
    depth: 2,
  });

  return mapPayloadBlocks(global.modules as PayloadBlock[] | null | undefined);
}

export async function loadPayloadLayout(
  payload: Payload,
  locale: SupportedLocale,
): Promise<PayloadLayout> {
  const [navigation, footer] = await Promise.all([
    loadRegion(payload, 'navigation', locale),
    loadRegion(payload, 'footer', locale),
  ]);

  return {
    ...(navigation.length > 0 ? { navigation } : {}),
    ...(footer.length > 0 ? { footer } : {}),
  };
}
