import { unstable_cache } from 'next/cache';

import { loadPayloadRedirects } from '@/providers/payload/sources/loadPayloadRedirects';

import { REDIRECTS_TAG } from './tags';

/**
 * A tabela de redirects de um idioma, guardada entre pedidos.
 *
 * É consultada **antes de cada página**, e é por isso que se guarda o mapa inteiro e
 * não uma resposta por caminho: uma entrada por idioma serve o site todo, e a
 * alternativa era uma entrada de cache por URL visitado.
 *
 * Tag própria, e não a das páginas. Um redirect e uma página são coisas diferentes a
 * mudar por motivos diferentes — publicar um artigo não deve deitar fora a tabela de
 * redirects, nem o contrário.
 *
 * ⚠️ Com uma excepção que a tag não cobre: os destinos por referência trazem o URL da
 * página apontada, portanto **mudar o slug de uma página deixa esta entrada velha**.
 * É a razão de os hooks da `Pages` invalidarem também esta tag — ver `cache/hooks.ts`.
 *
 * O `defaultLocale` entra por argumento, e por isso entra na chave. Lido dentro do
 * loader, mudar o idioma por omissão do site deixava entradas com prefixos errados
 * sem nada que as invalidasse.
 *
 * ⚠️ Como o `getCachedPage`, a chave nomeia o formato do valor. Mudou a forma do que
 * se guarda, muda o sufixo — ver [getCachedPage.ts](./getCachedPage.ts).
 */
export const getCachedRedirects = unstable_cache(loadPayloadRedirects, ['payload:redirects:map'], {
  tags: [REDIRECTS_TAG],
});
