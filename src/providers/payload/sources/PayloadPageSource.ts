import type { PageResponse } from '@/core/pages';

import { PageSource } from '@/core/pages/PageSource';
import type { GetPageOptions } from '@/core/pages/PageSource';

import { getCachedPage } from '@/providers/payload/cache/getCachedPage';
import { getCachedRedirects } from '@/providers/payload/cache/getCachedRedirects';
import { getCachedSite } from '@/providers/payload/cache/getCachedSite';
import { isSupportedLocale, type SupportedLocale } from '@/providers/payload/locales';
import { loadPayloadPage } from '@/providers/payload/sources/loadPayloadPage';

export class PayloadPageSource extends PageSource {
  async getPage(path: string, locale?: string, options?: GetPageOptions): Promise<PageResponse> {
    // Sem locale, o default é resposta desta origem — não motivo para desistir.
    const requested = locale ?? (await this.getDefaultLocale());

    if (!isSupportedLocale(requested)) {
      // Um visitante não chega aqui: o `resolveRoute` só devolve locales que o
      // global `Site` declara. Isto é divergência de configuração — um locale
      // escolhido no CMS que o `locales.ts` já não tem — e sem o aviso ficava
      // indistinguível de uma página que não existe.
      console.warn(
        `Locale "${requested}" is enabled in the CMS but missing from availableLocales in locales.ts. Every page in it will 404.`,
      );

      return { status: 'notFound' };
    }

    const payloadLocale: SupportedLocale = requested;

    // O rascunho nunca passa pela cache. Não é só desperdício: o que o editor está a
    // ver é a versão dele, e guardá-la arriscava servi-la a um visitante.
    //
    // Sai antes dos redirects de propósito. O editor pediu **este** documento; um
    // redirect a apanhar o caminho dele partia a pré-visualização da própria página
    // que ele está a escrever.
    if (options?.draft) {
      return loadPayloadPage(path, payloadLocale, true);
    }

    const redirect = await this.resolveRedirect(path, payloadLocale);

    if (redirect) {
      return redirect;
    }

    return getCachedPage(path, payloadLocale);
  }

  /**
   * O redirect ganha à página, como em qualquer CMS: é o que permite substituir um
   * URL sem apagar o conteúdo que estava nele.
   *
   * Não vive dentro do `getCachedPage` — e essa é a parte que interessa. Se vivesse,
   * a decisão de redireccionar ficava guardada dentro da entrada da página, com a
   * tag das páginas, e mudar um redirect não a invalidava. Aqui são duas caches com
   * duas tags, cada uma a expirar pelo seu motivo.
   *
   * Custa duas leituras de cache por pedido, não consultas: o global `Site` é o
   * mesmo que o layout de raiz já pediu, e o mapa de redirects é um só por idioma,
   * partilhado por todas as rotas.
   */
  private async resolveRedirect(
    path: string,
    locale: SupportedLocale,
  ): Promise<PageResponse | undefined> {
    const { defaultLocale } = await getCachedSite();

    const redirects = await getCachedRedirects(locale, defaultLocale);

    const match = redirects[path];

    if (!match) {
      return undefined;
    }

    return { status: 'redirect', to: match.to, permanent: match.permanent };
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
