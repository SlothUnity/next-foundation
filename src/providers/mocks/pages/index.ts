import type { MockPage } from '../definePage';

import { home } from './home';

/**
 * Todas as páginas que o provider `mocks` serve.
 *
 * A lista é escrita à mão, e não varrida do disco: uma página só aparece no site depois
 * de alguém a pôr aqui, e é aqui que se vê de uma vez o que os mocks servem. Acrescentar
 * uma página são duas linhas — o import e a entrada.
 */
export const mockPages: MockPage[] = [...home];
