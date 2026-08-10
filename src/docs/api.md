# API

## Objetivo

Este documento descreve os contratos públicos da Foundation e as fronteiras entre a aplicação, a fonte de páginas e o sistema de módulos.

## PageSource

`PageSource` é a abstração responsável por obter uma página.

```ts
export abstract class PageSource {
  abstract getPage(slug: string, locale?: string): Promise<PageDefinition | undefined>;
}
```

### Regras

- O `PageSource` não conhece Next.js.
- O `PageSource` não chama `notFound()`.
- O `PageSource` não conhece o router.
- A fonte pode ser um mock, Payload ou outro CMS.
- Uma página inexistente é representada por `undefined`.

## PageDefinition

O contrato interno de página é fixo:

```ts
export interface PageDefinition {
  meta: Meta;
  navigation?: ModuleInstance;
  main: ModuleInstance[];
  footer?: ModuleInstance;
}
```

Não usamos `regions`. O CMS deve ser adaptado para produzir este formato.

## ModuleInstance

```ts
export interface ModuleInstance<TData extends ModuleProps = ModuleProps> {
  id: string;
  alias: string;
  data: TData;
}
```

`alias` identifica o módulo no registry e `data` contém os dados específicos desse módulo.

## Module

```ts
export interface Module<TProps extends ModuleProps = ModuleProps> {
  alias: string;
  name: string;
  component: ModuleComponent<TProps>;
  schema?: ModuleSchema<TProps>;
}
```

O módulo pode declarar um schema para validar os dados antes da renderização.

## Foundation

A Foundation agrega os serviços usados pela aplicação:

```ts
export interface Foundation {
  modules: ModuleRegistry;
  page: PageSource;
}
```

A aplicação obtém uma `Foundation` e não precisa conhecer a implementação concreta do CMS.

## 404

A responsabilidade é da camada da aplicação:

```ts
const page = await foundation.page.getPage(slug, locale);

if (!page) {
  notFound();
}
```

O core devolve `undefined`; o Next.js decide como apresentar o 404.

## Fonte externa

A implementação futura do Payload deverá transformar os dados externos em `PageDefinition`.

```text
Payload
  ↓
PayloadPageSource
  ↓
PageDefinition | undefined
```

A Foundation não deve depender da estrutura interna do Payload.
