import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload';

import { revalidatePayloadTag } from './revalidatePayloadTag';
import { PAGES_TAG, SITE_TAG } from './tags';

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

export const revalidatePagesOnChange: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  if (touchesPublished(doc, previousDoc)) {
    revalidatePayloadTag(PAGES_TAG);
  }

  return doc;
};

export const revalidatePagesOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  if (touchesPublished(doc)) {
    revalidatePayloadTag(PAGES_TAG);
  }

  return doc;
};

/**
 * O global `Site` não tem versões, portanto qualquer gravação é uma publicação.
 */
export const revalidateSiteOnChange: GlobalAfterChangeHook = ({ doc }) => {
  revalidatePayloadTag(SITE_TAG);

  return doc;
};
