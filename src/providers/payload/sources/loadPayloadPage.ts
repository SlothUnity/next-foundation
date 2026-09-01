import type { PageDefinition } from '@/core/pages';

import { getPayloadClient } from '@/providers/payload/getPayloadClient';
import type { SupportedLocale } from '@/providers/payload/locales';
import { mapPayloadPage } from '@/providers/payload/mappers/mapPayloadPage';
import { resolvePayloadPage } from '@/providers/payload/sources/resolvePayloadPage';

/**
 * A leitura de uma página sem cache nenhuma: consulta e mapeamento.
 *
 * É o mapeamento — e não o documento cru do Payload — que vale a pena guardar. O
 * documento vem com `depth: 2`, portanto arrasta media e relações inteiras; o
 * `PageDefinition` é o que o renderer precisa e nada mais, e é JSON puro, que é o
 * que o `unstable_cache` sabe serializar.
 */
export async function loadPayloadPage(
  path: string,
  locale: SupportedLocale,
  draft: boolean,
): Promise<PageDefinition | undefined> {
  const payload = await getPayloadClient();

  const page = await resolvePayloadPage(payload, path, locale, draft);

  if (!page) {
    return undefined;
  }

  return mapPayloadPage(page, locale);
}
