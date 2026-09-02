import type { PagePath, PageResponse } from '@/core/pages';

import { PageSource } from '@/core/pages/PageSource';
import type { GetPageOptions } from '@/core/pages/PageSource';

import { getCachedPage } from '@/providers/payload/cache/getCachedPage';
import { getCachedPaths } from '@/providers/payload/cache/getCachedPaths';
import { getCachedRedirects } from '@/providers/payload/cache/getCachedRedirects';
import { getCachedSite } from '@/providers/payload/cache/getCachedSite';
import { isSupportedLocale, type SupportedLocale } from '@/providers/payload/locales';
import { loadPayloadPage } from '@/providers/payload/sources/loadPayloadPage';

export class PayloadPageSource extends PageSource {
  async getPage(path: string, locale?: string, options?: GetPageOptions): Promise<PageResponse> {
    const requested = locale ?? (await this.getDefaultLocale());

    if (!isSupportedLocale(requested)) {
      console.warn(
        `Locale "${requested}" is enabled in the CMS but missing from availableLocales in locales.ts. Every page in it will 404.`,
      );

      return { status: 'notFound' };
    }

    const payloadLocale: SupportedLocale = requested;

    const { locales, defaultLocale } = await getCachedSite();

    if (options?.draft) {
      return loadPayloadPage(path, payloadLocale, true, locales, defaultLocale);
    }

    const redirect = await this.resolveRedirect(path, payloadLocale);

    if (redirect) {
      return redirect;
    }

    return getCachedPage(path, payloadLocale, locales, defaultLocale);
  }

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

  async listPaths(): Promise<PagePath[]> {
    const { locales, defaultLocale } = await getCachedSite();

    return getCachedPaths(locales, defaultLocale);
  }

  private async getDefaultLocale(): Promise<string> {
    const site = await getCachedSite();

    return site.defaultLocale;
  }
}
