import type { Payload } from 'payload';

import type { Redirect } from '@payload-types';
import { createPagePath, isSafeRedirectPath } from '@/core/routing';
import { getPayloadClient } from '@/providers/payload/getPayloadClient';
import type { SupportedLocale } from '@/providers/payload/locales';

/**
 * Quantos redirects se lêem de uma vez.
 *
 * A tabela inteira vem numa consulta só, e é por isso que resolver um redirect antes
 * de cada página não custa uma consulta por pedido. O limite existe para o dia em que
 * uma migração despeja dezenas de milhares de linhas aqui dentro: mais vale servir os
 * primeiros mil e dizer em voz alta que há mais do que carregar a tabela toda para
 * memória em silêncio.
 */
const REDIRECT_LIMIT = 1000;

export interface PayloadRedirect {
  to: string;
  permanent: boolean;
}

/**
 * A chave do mapa, na mesma forma que o `path` que chega ao provider.
 *
 * O editor escreve `/pagina-antiga` — com barra inicial, como os breadcrumbs — e o
 * `resolveRoute` entrega `pagina-antiga`, sem ela e já sem prefixo de idioma. Tirar
 * as barras das duas pontas faz os dois encontrarem-se, e trata a raiz (`/`) como a
 * cadeia vazia, que é como a homepage chega aqui.
 */
export function normalizeRedirectPath(from: string): string {
  return from.trim().replace(/^\/+/, '').replace(/\/+$/, '');
}

/**
 * Os URLs das páginas apontadas, num só `find`.
 *
 * É a razão de o `find` dos redirects correr com `depth: 0`. Com `depth: 1` o Payload
 * populava o documento inteiro de cada página apontada — blocos, media, relações — só
 * para se lhe ler o breadcrumb. Aqui vêm os ids, e depois **uma** consulta traz só o
 * campo que interessa, para todas as páginas de uma vez.
 *
 * Só páginas publicadas. Um redirect para uma página por publicar mandava o visitante
 * a um 404 — e sendo 308, o browser guardava esse caminho e continuava a ir lá mesmo
 * depois de o problema estar resolvido. É pior do que não haver redirect nenhum.
 */
async function resolveTargets(
  payload: Payload,
  ids: Set<number | string>,
  locale: SupportedLocale,
  defaultLocale: string,
): Promise<Map<number | string, string>> {
  const targets = new Map<number | string, string>();

  if (ids.size === 0) {
    return targets;
  }

  const result = await payload.find({
    collection: 'pages',
    locale,
    fallbackLocale: false,
    overrideAccess: true,
    where: {
      and: [{ id: { in: [...ids] } }, { _status: { equals: 'published' } }],
    },
    limit: ids.size,
    depth: 0,
    select: { breadcrumbs: true },
  });

  for (const page of result.docs) {
    // O último breadcrumb é o caminho completo da página na hierarquia. A homepage
    // tem `/`, que o createPagePath transforma em `/` ou `/en` conforme o idioma.
    const url = page.breadcrumbs?.at(-1)?.url;

    if (!url) {
      continue;
    }

    targets.set(
      page.id,
      createPagePath({ path: normalizeRedirectPath(url), locale, defaultLocale }),
    );
  }

  return targets;
}

/**
 * A tabela de redirects de um idioma, como mapa de caminho antigo para destino.
 *
 * Um mapa e não uma lista, e a tabela inteira e não uma consulta por caminho, porque
 * isto corre **antes de cada página**. Guardado, é uma entrada de cache por idioma
 * partilhada por todas as rotas; consultado por caminho, seria uma entrada por URL do
 * site e uma consulta a frio em cada um deles.
 *
 * Duas consultas a frio, no total, para o site inteiro: uma à tabela e uma às páginas
 * apontadas. A segunda desaparece se nenhum redirect apontar para uma página.
 *
 * O `defaultLocale` entra por argumento e não por leitura de dentro — assim faz parte
 * da chave da cache. Lido aqui dentro, mudar o idioma por omissão do site deixava
 * entradas com prefixos errados sem nada que as invalidasse.
 *
 * Um `from` por preencher num idioma não é um erro — com `fallbackLocale: false` é
 * só a ausência desse redirect nesse idioma.
 */
export async function loadPayloadRedirects(
  locale: SupportedLocale,
  defaultLocale: string,
): Promise<Record<string, PayloadRedirect>> {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: 'redirects',
    locale,
    fallbackLocale: false,
    overrideAccess: true,
    limit: REDIRECT_LIMIT,
    depth: 0,
  });

  if (result.totalDocs > result.docs.length) {
    console.warn(
      `Only the first ${REDIRECT_LIMIT} of ${result.totalDocs} redirects are served. The rest answer 404 — raise REDIRECT_LIMIT in loadPayloadRedirects.ts, or prune the table.`,
    );
  }

  const referenced = new Set<number | string>();

  for (const doc of result.docs) {
    if (
      doc.type !== 'custom' &&
      (typeof doc.reference === 'number' || typeof doc.reference === 'string')
    ) {
      referenced.add(doc.reference);
    }
  }

  const targets = await resolveTargets(payload, referenced, locale, defaultLocale);

  const map: Record<string, PayloadRedirect> = {};

  for (const doc of result.docs) {
    if (!doc.from) {
      continue;
    }

    const to = resolveDestination(doc, targets);

    if (!to) {
      continue;
    }

    map[normalizeRedirectPath(doc.from)] = { to, permanent: doc.permanent ?? false };
  }

  return map;
}

/**
 * Para onde vai este redirect, ou `undefined` se não for para lado nenhum de jeito.
 *
 * Cada saída em falso avisa e nomeia o `from`, porque um redirect que não redirecciona
 * é invisível: o caminho antigo responde 404 e nada distingue isso de nunca ter havido
 * redirect nenhum.
 */
function resolveDestination(
  doc: Redirect,
  targets: Map<number | string, string>,
): string | undefined {
  if (doc.type === 'custom') {
    // A validação do campo já recusa um destino que saia da origem. Isto apanha as
    // linhas que não passaram por ela — uma migração, um seed, a REST API — e que de
    // outra forma davam um open redirect assinado pelo nosso domínio.
    if (!doc.custom || !isSafeRedirectPath(doc.custom)) {
      console.warn(`Redirect "${doc.from}" has no usable custom path and was ignored.`);

      return undefined;
    }

    return doc.custom;
  }

  const id = typeof doc.reference === 'object' && doc.reference ? doc.reference.id : doc.reference;

  if (id === null || id === undefined) {
    console.warn(`Redirect "${doc.from}" points at no page and was ignored.`);

    return undefined;
  }

  const to = targets.get(id);

  if (!to) {
    console.warn(
      `Redirect "${doc.from}" points at page ${id}, which is unpublished, untranslated or gone. Ignored, so the browser does not cache a redirect to a 404.`,
    );

    return undefined;
  }

  return to;
}
