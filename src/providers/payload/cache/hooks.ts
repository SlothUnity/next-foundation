import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload';

import { revalidatePayloadTag } from './revalidatePayloadTag';
import { PAGES_TAG, REDIRECTS_TAG, SITE_TAG } from './tags';

interface Versioned {
  _status?: ('draft' | 'published') | null;
}

/**
 * Só o que está publicado chega à cache: o `resolvePayloadPage` filtra por
 * `_status: 'published'` e o `getCachedPage` nunca corre em modo rascunho.
 *
 * Sem esta guarda, o autosave a 375ms invalidava a cache do site a cada tecla que
 * um editor escrevesse. Com ela, um rascunho de uma página nunca publicada não toca
 * em nada.
 *
 * O `previousDoc` conta tanto como o `doc` por causa do despublicar: a versão nova
 * é rascunho, mas a antiga estava em cache e tem de sair.
 */
function touchesPublished(...docs: (Versioned | undefined)[]): boolean {
  return docs.some((doc) => doc?._status === 'published');
}

/**
 * Uma página gravada invalida **as duas** tags, e a segunda não é excesso de zelo.
 *
 * O destino de um redirect por referência é o URL da página apontada, derivado dos
 * breadcrumbs no momento da leitura e guardado no mapa. Mudar o slug de uma página —
 * ou despublicá-la — deixa esse mapa a apontar para um URL que já não existe, e a tag
 * dos redirects sozinha nunca o saberia.
 *
 * O contrário não é verdade: gravar um redirect não toca em página nenhuma.
 */
function revalidatePages(): void {
  revalidatePayloadTag(PAGES_TAG);
  revalidatePayloadTag(REDIRECTS_TAG);
}

export const revalidatePagesOnChange: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  if (touchesPublished(doc, previousDoc)) {
    revalidatePages();
  }

  return doc;
};

export const revalidatePagesOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  if (touchesPublished(doc)) {
    revalidatePages();
  }

  return doc;
};

/**
 * A `Redirects` não tem versões — não há rascunho de um redirect — portanto não leva
 * a guarda do `touchesPublished`: qualquer gravação é uma publicação.
 */
export const revalidateRedirectsOnChange: CollectionAfterChangeHook = ({ doc }) => {
  revalidatePayloadTag(REDIRECTS_TAG);

  return doc;
};

export const revalidateRedirectsOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidatePayloadTag(REDIRECTS_TAG);

  return doc;
};

/**
 * O global `Site` não tem versões, portanto qualquer gravação é uma publicação.
 */
export const revalidateSiteOnChange: GlobalAfterChangeHook = ({ doc }) => {
  revalidatePayloadTag(SITE_TAG);

  return doc;
};
