import type { ReactNode } from 'react';

export type ModuleProps = object;

export type ModuleComponent<TProps extends ModuleProps = ModuleProps> = (
  props: TProps,
) => ReactNode;

export type RuntimeModuleComponent = (props: ModuleProps) => ReactNode;

export interface ModuleSchema<TData extends ModuleProps = ModuleProps> {
  parse(data: unknown): TData;
}

export interface Module<TProps extends ModuleProps = ModuleProps> {
  alias: string;
  name: string;
  component: RuntimeModuleComponent;
  schema?: ModuleSchema<TProps>;
}

export interface ModuleInstance<TData extends ModuleProps = ModuleProps> {
  id: string;
  name?: string;
  alias: string;
  data: TData;
}
