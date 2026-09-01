import type { ModuleInstance } from '@/core/modules';

export interface Meta {
  locale?: string;

  title?: string;
  description?: string;

  ogTitle?: string;
  ogDescription?: string;

  noIndex?: boolean;
  noFollow?: boolean;
}

export interface PageDefinition {
  meta: Meta;
  navigation?: ModuleInstance;
  main: ModuleInstance[];
  footer?: ModuleInstance;
}

/**
 * O que uma origem responde sobre um caminho.
 *
 * É um envelope à volta do `PageDefinition` e não um campo dentro dele, por três
 * razões: o `PageDefinition` é o que o renderer consome e não deve carregar
 * informação de transporte; um redirect não tem página nenhuma, logo não caberia
 * num campo; e assim nenhum mock, mapper ou teste tem de escrever um status que é
 * quase sempre o mesmo.
 *
 * Substitui o `PageDefinition | undefined` que aqui esteve. O `undefined` dizia
 * «não existe», mas também «não sei este locale» e «a configuração está errada» —
 * e foi essa ambiguidade que gerou as falhas silenciosas que este projecto andou a
 * fechar.
 */
export type PageResponse =
  | { status: 'ok'; page: PageDefinition }
  | { status: 'notFound'; page?: PageDefinition }
  | { status: 'redirect'; to: string; permanent?: boolean };
