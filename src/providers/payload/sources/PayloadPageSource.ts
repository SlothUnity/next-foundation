import type { PageDefinition } from '@/core/pages';

import { PageSource } from '@/core/pages/PageSource';
import type { GetPageOptions } from '@/core/pages/PageSource';

import { getPayloadClient } from '@/providers/payload/getPayloadClient';
import { isSupportedLocale, type SupportedLocale } from '@/providers/payload/locales';

import { mapPayloadPage } from '@/providers/payload/mappers/mapPayloadPage';
import { mapPayloadSite } from '@/providers/payload/mappers/mapPayloadSite';
import { resolvePayloadPage } from '@/providers/payload/sources/resolvePayloadPage';

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

    const payload = await getPayloadClient();

    const page = await resolvePayloadPage(payload, path, payloadLocale, options?.draft ?? false);

    if (!page) {
      return undefined;
    }

    return mapPayloadPage(page, payloadLocale);
  }

  /**
   * Só corre quando quem chama omite o locale — o frontend passa-o sempre, vindo do
   * `resolveRoute`. É por isso que vale a consulta extra em vez de partilhar estado
   * com o `PayloadSiteSource`: acoplá-los pagava um custo em todos os pedidos para
   * poupar num que quase não acontece.
   */
  private async getDefaultLocale(): Promise<string> {
    const payload = await getPayloadClient();

    const site = await payload.findGlobal({ slug: 'site', depth: 0 });

    return mapPayloadSite(site).defaultLocale;
  }
}
