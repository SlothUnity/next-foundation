/**
 * As tags são o contrato entre quem lê (as origens) e quem escreve (os hooks do
 * Payload). Vivem num sítio só porque uma divergência entre os dois lados não dá
 * erro nenhum — dá conteúdo velho, que é bem mais difícil de notar.
 *
 * São propositadamente grosseiras: uma tag para todas as páginas, outra para o
 * global `Site`. Uma tag por página seria mais eficiente mas não é de confiança
 * aqui — o `nestedDocs` reescreve os breadcrumbs dos filhos quando um pai muda de
 * slug, e nesse caminho não há garantia de que o `afterChange` de cada filho
 * dispare. Invalidar a mais custa uma consulta; invalidar a menos serve um URL
 * errado durante horas.
 */
export const PAGES_TAG = 'payload:pages';

export const SITE_TAG = 'payload:site';

/**
 * Separada da das páginas de propósito: um redirect e uma página mudam por motivos
 * diferentes, e publicar um artigo não tem que deitar fora a tabela de redirects.
 */
export const REDIRECTS_TAG = 'payload:redirects';
