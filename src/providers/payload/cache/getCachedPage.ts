import { unstable_cache } from 'next/cache';

import type { SupportedLocale } from '@/providers/payload/locales';
import { loadPayloadPage } from '@/providers/payload/sources/loadPayloadPage';

import { PAGES_TAG } from './tags';

/**
 * A leitura pública de uma página, guardada entre pedidos.
 *
 * Só serve o caminho publicado — o `draft` está fixo em `false` de propósito, para
 * não haver forma de um rascunho entrar aqui por engano. Quem precisa do rascunho
 * chama o `loadPayloadPage` directamente.
 *
 * O `path` e o `locale` entram na chave por serem argumentos: o `unstable_cache` já
 * os inclui, e o `keyParts` serve só de prefixo. Sem `revalidate`, a entrada dura
 * até um hook chamar `revalidateTag` — o conteúdo não envelhece sozinho, muda
 * quando o editor o muda.
 *
 * Uma página que não existe também fica em cache, como `undefined`. É o que se
 * quer: um 404 repetido não deve custar uma consulta, e publicar a página nova
 * invalida a mesma tag.
 *
 * Nota de migração: em Next 16 o `unstable_cache` está declarado como substituído
 * pela directiva `use cache`, que exige `cacheComponents: true` — ver
 * [docs/TODO.md](../../../../docs/TODO.md).
 */
export const getCachedPage = unstable_cache(
  (path: string, locale: SupportedLocale) => loadPayloadPage(path, locale, false),
  ['payload:page'],
  { tags: [PAGES_TAG] },
);
