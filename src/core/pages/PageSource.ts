import type { PageResponse } from './Page.types';

export interface GetPageOptions {
  draft?: boolean;
}

export abstract class PageSource {
  /**
   * Responde o que há neste caminho: a página, um redirect, ou nada.
   *
   * **Omitir o `locale` significa «usa o teu default», não «desiste».** Cada origem
   * declara o seu no `SiteDefinition.defaultLocale`.
   *
   * A resposta é sempre um `PageResponse` — nunca `undefined`. Uma origem que não
   * saiba responder devolve `{ status: 'notFound' }`, e se tiver uma página de erro
   * para servir devolve-a junto.
   *
   * O `permanent` de um redirect mapeia para os helpers do Next — `redirect` dá 307,
   * `permanentRedirect` dá 308. Não são 301/302: esses exigiriam produzir a resposta
   * no proxy.
   */
  abstract getPage(path: string, locale?: string, options?: GetPageOptions): Promise<PageResponse>;
}
