# Modules

## Objetivo

Módulos são componentes de UI registáveis e identificados por `alias`.

A página não conhece diretamente o componente React. Guarda apenas uma instância:

```ts
{
  id: 'hero-1',
  alias: 'hero',
  data: {
    title: 'Next Foundation',
    subtitle: '...'
  }
}
```

## ModuleProps

```ts
export type ModuleProps = Record<string, unknown>;
```

É o contrato genérico usado pela infraestrutura.

## ModuleComponent

```ts
export type ModuleComponent<TProps extends ModuleProps = ModuleProps> = (
  props: TProps,
) => ReactNode;
```

Cada módulo pode ter os seus próprios props.

## ModuleSchema

```ts
export interface ModuleSchema<TData extends ModuleProps = ModuleProps> {
  parse(data: unknown): TData;
}
```

O schema é uma fronteira de runtime.

O TypeScript garante tipos durante desenvolvimento; o schema valida os dados reais recebidos em runtime.

## Module

```ts
export interface Module<TProps extends ModuleProps = ModuleProps> {
  alias: string;
  name: string;
  component: ModuleComponent<TProps>;
  schema?: ModuleSchema<TProps>;
}
```

Um módulo define:

- `alias`: identificador usado pelas páginas.
- `name`: nome legível do módulo.
- `component`: componente React.
- `schema`: validação opcional.

## defineModule

A função `defineModule` mantém a criação de módulos simples:

```ts
export function defineModule(module: Module): Module {
  return module;
}
```

Não devemos criar tipos paralelos que obriguem a repetir todas as propriedades do módulo sempre que adicionarmos uma nova propriedade.

## createModuleComponent

Quando necessário, um componente específico pode ser adaptado para o contrato genérico da infraestrutura:

```ts
export function createModuleComponent<TProps extends ModuleProps>(
  Component: (props: TProps) => ReactNode,
): ModuleComponent {
  return function ModuleComponentAdapter(props: ModuleProps) {
    return <Component {...(props as TProps)} />;
  };
}
```

## Registry

Os módulos são registados no `ModuleRegistry`.

O registry não deve conhecer módulos concretos.

```text
module.alias
     ↓
ModuleRegistry
     ↓
Module definition
```

Isto permite adicionar ou remover módulos sem alterar o renderer.

## Módulos opcionais

O sistema não assume que existe um `hero`.

Uma página pode ter:

```text
main:
  - hero
  - gallery
  - cta
```

ou:

```text
main:
  - gallery
  - text
```

ou qualquer combinação de módulos que estejam registados.

O contrato de página não deve importar tipos concretos de módulos.

## Regra importante

Adicionar um módulo novo deve significar:

1. Criar o módulo.
2. Definir o schema, se necessário.
3. Registá-lo.

Não devemos ter de alterar `PageRenderer` ou `ModuleRenderer`.
