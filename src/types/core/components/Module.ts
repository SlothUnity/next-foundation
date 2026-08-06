import type { ReactNode } from 'react';

export type ModuleProps = Record<string, unknown>;

export type ModuleComponent = (props: ModuleProps) => ReactNode;
