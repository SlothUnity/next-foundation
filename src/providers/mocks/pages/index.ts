import type { MockPage } from '../definePage';

import { home } from './home';
import { notFound } from './notFound';

export type { MockRedirect } from './redirects';
export { mockRedirects } from './redirects';

/**
 * Todas as páginas que o provider `mocks` serve.
 *
 * A lista é escrita à mão, e não varrida do disco: uma página só aparece no site depois
 * de alguém a pôr aqui, e é aqui que se vê de uma vez o que os mocks servem. Acrescentar
 * uma página são duas linhas — o import e a entrada.
 */
export const mockPages: MockPage[] = [...home];

/**
 * A página de erro, por idioma. Fora do `mockPages` de propósito: não é alcançável
 * por URL, é o que se serve quando nenhum caminho bate certo.
 */
export const mockNotFoundPages: MockPage[] = [...notFound];
