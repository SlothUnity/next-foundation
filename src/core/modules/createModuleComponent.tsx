import type { ModuleComponent, ModuleProps, RuntimeModuleComponent } from '@/types';

export function createModuleComponent<TProps extends ModuleProps>(
  Component: ModuleComponent<TProps>,
): RuntimeModuleComponent {
  return function ModuleComponentAdapter(props: ModuleProps) {
    return <Component {...(props as TProps)} />;
  };
}
