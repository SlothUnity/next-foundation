import type { PageResponse } from '@/core/pages';

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
 * que o `unstable_cache` sabe serializar. O `PageResponse` inteiro também o é.
 *
 * ⚠️ **Duas costuras por ligar, e são de projecto e não da foundation:**
 *
 * - **a página de erro.** O `notFound` sai daqui sem `page`, e por isso a aplicação
 *   desenha um fallback mínimo. Para o 404 ser editável, acrescenta um campo à
 *   collection `Pages` — um `is404` a espelhar o `isHome`, que já lá tem a validação
 *   de unicidade feita — e devolve-a aqui.
 * - **os redirects.** Nunca se devolve `{ status: 'redirect' }`. De onde vêm é
 *   decisão de quem monta o site: uma collection própria, o plugin de redirects do
 *   Payload, ou nada.
 */
export async function loadPayloadPage(
  path: string,
  locale: SupportedLocale,
  draft: boolean,
): Promise<PageResponse> {
  const payload = await getPayloadClient();

  const page = await resolvePayloadPage(payload, path, locale, draft);

  if (!page) {
    return { status: 'notFound' };
  }

  return { status: 'ok', page: mapPayloadPage(page, locale) };
}
