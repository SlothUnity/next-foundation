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
 * os inclui, e o `keyParts` serve de prefixo. Sem `revalidate`, a entrada dura até
 * um hook chamar `revalidateTag` — o conteúdo não envelhece sozinho, muda quando o
 * editor o muda.
 *
 * Um caminho que não existe também fica em cache, como `{ status: 'notFound' }`. É
 * o que se quer: um 404 repetido não deve custar uma consulta, e publicar a página
 * nova invalida a mesma tag.
 *
 * ⚠️ **A chave tem de mudar sempre que o formato do valor guardado mudar.**
 *
 * O `unstable_cache` constrói a chave a partir dos argumentos e do texto da função
 * que envolve — **não** do que essa função chama por dentro. Quando o
 * `loadPayloadPage` passou a devolver um `PageResponse` em vez de um
 * `PageDefinition`, a chave ficou igual e as entradas antigas continuaram a ser
 * servidas com a forma errada: a homepage caiu no fallback de 404 e um caminho
 * inexistente devolveu 500. Sem `revalidate` isso não se corrige sozinho.
 *
 * Por isso o prefixo nomeia o formato e não só a entidade. Mudou o formato, muda o
 * sufixo — as entradas velhas deixam de ser encontradas e morrem de velhice.
 *
 * Nota de migração: em Next 16 o `unstable_cache` está declarado como substituído
 * pela directiva `use cache`, que exige `cacheComponents: true` — ver
 * [docs/payload.md](../../../../docs/payload.md).
 */
export const getCachedPage = unstable_cache(
  (path: string, locale: SupportedLocale) => loadPayloadPage(path, locale, false),
  ['payload:page:response'],
  { tags: [PAGES_TAG] },
);
