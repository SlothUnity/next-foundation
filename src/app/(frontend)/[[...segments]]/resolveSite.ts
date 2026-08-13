import { cache } from 'react';

import { foundation } from '@/core/foundation/foundation';
import type { SiteDefinition } from '@/core/site';

/**
 * O site é preciso em dois sítios independentes — o `resolvePage`, para saber que
 * locales existem, e o layout, para o `lang` do `<html>` mesmo quando a página não
 * resolve. O `cache()` do React garante que continua a ser uma consulta por pedido.
 */
export const resolveSite = cache(async (): Promise<SiteDefinition> => {
  return foundation.site.getSite();
});
