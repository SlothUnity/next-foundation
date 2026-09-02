import type { Payload, Where } from 'payload';

import type { Page } from '@payload-types';
import type { SupportedLocale } from '@/providers/payload/locales';

/**
 * A consulta partilhada pelas duas resoluções: a do caminho e a da página de erro.
 *
 * O `_status: 'published'` só entra fora do modo rascunho, e é ele — e não o access
 * control, que o `overrideAccess: true` desliga — que impede um rascunho de aparecer
 * a um visitante.
 */
async function findPage(
  payload: Payload,
  match: Where,
  locale: SupportedLocale,
  draft: boolean,
): Promise<Page | undefined> {
  const where: Where = draft ? match : { and: [match, { _status: { equals: 'published' } }] };

  const result = await payload.find({
    collection: 'pages',
    locale,
    fallbackLocale: false,
    draft,
    overrideAccess: true,
    where,
    limit: 1,
    depth: 2,
  });

  return result.docs[0];
}

export async function resolvePayloadPage(
  payload: Payload,
  path: string,
  locale: SupportedLocale,
  draft = false,
): Promise<Page | undefined> {
  const byPath: Where = !path
    ? { isHome: { equals: true } }
    : { 'breadcrumbs.url': { equals: `/${path}` } };

  return findPage(payload, byPath, locale, draft);
}

/**
 * A página que o editor marcou como `is404`, se existir alguma.
 *
 * Devolver `undefined` aqui é um estado legítimo e não um erro: um site acabado de
 * instalar ainda não tem página de erro, e nesse caso a aplicação desenha o
 * fallback mínimo com um aviso no log. A marca garante que não há mais do que uma,
 * nunca que há uma.
 *
 * O `draft` é o do pedido que falhou. Em pré-visualização, um editor que abra um
 * caminho inexistente vê o rascunho da sua página de erro — que é o que ele está a
 * escrever.
 */
export async function resolvePayloadNotFoundPage(
  payload: Payload,
  locale: SupportedLocale,
  draft = false,
): Promise<Page | undefined> {
  return findPage(payload, { is404: { equals: true } }, locale, draft);
}
