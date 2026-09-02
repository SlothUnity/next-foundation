import type { PageResponse } from '@/core/pages';

import { getPayloadClient } from '@/providers/payload/getPayloadClient';
import type { SupportedLocale } from '@/providers/payload/locales';
import { mapPayloadPage } from '@/providers/payload/mappers/mapPayloadPage';
import {
  resolvePayloadNotFoundPage,
  resolvePayloadPage,
} from '@/providers/payload/sources/resolvePayloadPage';

/**
 * A leitura de uma página sem cache nenhuma: consulta e mapeamento.
 *
 * É o mapeamento — e não o documento cru do Payload — que vale a pena guardar. O
 * documento vem com `depth: 2`, portanto arrasta media e relações inteiras; o
 * `PageDefinition` é o que o renderer precisa e nada mais, e é JSON puro, que é o
 * que o `unstable_cache` sabe serializar. O `PageResponse` inteiro também o é.
 *
 * Quando o caminho não encaixa, procura-se a página marcada com `is404` no CMS. É a
 * segunda consulta, e só acontece no caminho de falha — que fica em cache como
 * qualquer outro, portanto um 404 repetido não a repete.
 *
 * Um site acabado de instalar não tem nenhuma página marcada, e aí o `notFound` sai
 * daqui sem `page` e a aplicação desenha o fallback mínimo com um aviso. Degrada,
 * mas com voz.
 *
 * Os redirects não passam por aqui: vivem noutra collection, resolvem-se antes de se
 * procurar página nenhuma, e a decisão está na `PayloadPageSource`.
 */
export async function loadPayloadPage(
  path: string,
  locale: SupportedLocale,
  draft: boolean,
): Promise<PageResponse> {
  const payload = await getPayloadClient();

  const page = await resolvePayloadPage(payload, path, locale, draft);

  if (page) {
    return { status: 'ok', page: mapPayloadPage(page, locale) };
  }

  const notFound = await resolvePayloadNotFoundPage(payload, locale, draft);

  return {
    status: 'notFound',
    page: notFound ? mapPayloadPage(notFound, locale) : undefined,
  };
}
