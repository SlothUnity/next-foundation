import { unstable_cache } from 'next/cache';

import { loadPayloadSite } from '@/providers/payload/sources/loadPayloadSite';

import { SITE_TAG } from './tags';

/**
 * O global `Site` guardado entre pedidos.
 *
 * É lido em todos os pedidos — o layout de raiz precisa dele para o `<html lang>` —
 * e muda raramente, portanto é o candidato mais óbvio a cache de todo o projecto.
 */
export const getCachedSite = unstable_cache(loadPayloadSite, ['payload:site'], {
  tags: [SITE_TAG],
});
