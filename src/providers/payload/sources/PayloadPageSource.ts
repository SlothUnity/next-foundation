import type { PageDefinition } from '@/core/pages';

import { PageSource } from '@/core/pages/PageSource';
import type { GetPageOptions } from '@/core/pages/PageSource';

import { getCachedPage } from '@/providers/payload/cache/getCachedPage';
import { getCachedSite } from '@/providers/payload/cache/getCachedSite';
import { isSupportedLocale, type SupportedLocale } from '@/providers/payload/locales';
import { loadPayloadPage } from '@/providers/payload/sources/loadPayloadPage';

export class PayloadPageSource extends PageSource {
  async getPage(
    path: string,
    locale?: string,
    options?: GetPageOptions,
  ): Promise<PageDefinition | undefined> {
    // Sem locale, o default é resposta desta origem — não motivo para desistir.
    const requested = locale ?? (await this.getDefaultLocale());

    if (!isSupportedLocale(requested)) {
      return undefined;
    }

    const payloadLocale: SupportedLocale = requested;

    // O rascunho nunca passa pela cache. Não é só desperdício: o que o editor está a
    // ver é a versão dele, e guardá-la arriscava servi-la a um visitante.
    if (options?.draft) {
      return loadPayloadPage(path, payloadLocale, true);
    }

    return getCachedPage(path, payloadLocale);
  }

  /**
   * Só corre quando quem chama omite o locale — o frontend passa-o sempre, vindo do
   * `resolveRoute`. Lê pela mesma cache que o `PayloadSiteSource`, portanto o custo
   * extra é o de uma entrada já quente e não o de uma consulta.
   */
  private async getDefaultLocale(): Promise<string> {
    const site = await getCachedSite();

    return site.defaultLocale;
  }
}
