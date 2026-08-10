import type { ReactNode } from 'react';

export type ModuleProps = object;

export type ModuleComponent<TProps extends ModuleProps = ModuleProps> = (
  props: TProps,
) => ReactNode;

export type RuntimeModuleComponent = (props: ModuleProps) => ReactNode;
