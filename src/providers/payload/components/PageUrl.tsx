import type { UIFieldServerProps } from 'payload';

import { createPagePath } from '@/core/routing';
import { mapPayloadSite } from '@/providers/payload/mappers/mapPayloadSite';

interface Breadcrumb {
  url?: string | null;
}

/**
 * Mostra ao editor o URL público da página.
 *
 * **Corre só no servidor, e não faz pedido nenhum à API.** Um componente de campo
 * de servidor recebe nas props o documento (`data`), o locale escolhido no admin
 * (`req.locale`), a origem do pedido (`req.origin`) e o cliente do Payload — tudo
 * o que este campo precisa. Já foi um componente cliente com um `useEffect` a
 * buscar o global e a página por REST a partir de dentro do próprio Payload, e
 * trazia com isso quatro `return` mudos, uma corrida por abortar e uma promise
 * descartada. Nada disso tem onde existir aqui.
 *
 * Vir tudo do mesmo render também elimina uma inconsistência que a versão cliente
 * tinha: o `useLocale()` mudava de imediato ao trocar de idioma, mas os
 * breadcrumbs vinham de um pedido separado, e entre os dois havia um instante com
 * o prefixo de um idioma e o caminho do outro.
 */
export default async function PageUrl({ data, req }: UIFieldServerProps) {
  const breadcrumbs = (data?.breadcrumbs ?? null) as Breadcrumb[] | null;
  const lastBreadcrumb = breadcrumbs?.[breadcrumbs.length - 1];

  // Uma página por gravar não tem breadcrumbs nem URL. Dizê-lo é melhor do que o
  // campo desaparecer, que era o que acontecia antes.
  if (typeof lastBreadcrumb?.url !== 'string') {
    return (
      <div>
        <span>Page URL: </span>
        <span>save the page to get its URL.</span>
      </div>
    );
  }

  const site = await req.payload.findGlobal({ slug: 'site', depth: 0 });

  // O locale por omissão é resposta do mapPayloadSite, a única definição da regra.
  // O `'all'` é um valor legítimo de `req.locale` que aqui não faz sentido.
  const { defaultLocale } = mapPayloadSite(site);
  const locale = !req.locale || req.locale === 'all' ? defaultLocale : req.locale;

  const url = `${req.origin}${createPagePath({ path: lastBreadcrumb.url, locale, defaultLocale })}`;

  return (
    <div>
      <span>Page URL: </span>

      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    </div>
  );
}
