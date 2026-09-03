import type { ImageData } from '@/core/media';
import type { ModuleInstance } from '@/core/modules';

export interface Meta {
  locale: string;

  title?: string;
  description?: string;

  ogTitle?: string;
  ogDescription?: string;
  image?: ImageData;

  alternates?: Record<string, string>;

  noIndex?: boolean;
  noFollow?: boolean;
}

export interface PageDefinition {
  meta: Meta;
  navigation?: ModuleInstance;
  main: ModuleInstance[];
  footer?: ModuleInstance;
}

export type PageQuery = Record<string, string | string[]>;

export interface PagePath {
  path: string;
  locale: string;
  updatedAt?: string;
  noIndex?: boolean;
}

export type PageResponse =
  | { status: 'ok'; page: PageDefinition }
  | { status: 'notFound'; page?: PageDefinition }
  | { status: 'redirect'; to: string; permanent?: boolean };
