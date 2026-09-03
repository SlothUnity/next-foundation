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

function touchesPublished(...docs: (Versioned | undefined)[]): boolean {
  return docs.some((doc) => doc?._status === 'published');
}

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

export const revalidateRedirectsOnChange: CollectionAfterChangeHook = ({ doc }) => {
  revalidatePayloadTag(REDIRECTS_TAG);

  return doc;
};

export const revalidateRedirectsOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidatePayloadTag(REDIRECTS_TAG);

  return doc;
};

export const revalidateSiteOnChange: GlobalAfterChangeHook = ({ doc }) => {
  revalidatePayloadTag(SITE_TAG);

  return doc;
};

export const revalidateLayoutOnChange: GlobalAfterChangeHook = ({ doc }) => {
  revalidatePayloadTag(PAGES_TAG);

  return doc;
};
