import type { ReactNode } from 'react';

import type { ModuleComponent, ModuleProps } from '@/types';

/**
 * Adapts a typed module component into the untyped contract the Registry
 * stores and the Renderer calls.
 *
 * The Renderer only ever sees `ModuleProps` (the raw `data` object coming from
 * the CMS), so the cast to the module's own props type happens here — once —
 * instead of inside every module.
 */
export function createModuleComponent<TProps extends ModuleProps>(
  Component: (props: TProps) => ReactNode,
): ModuleComponent {
  return function ModuleComponentAdapter(props: ModuleProps) {
    return <Component {...(props as TProps)} />;
  };
}
