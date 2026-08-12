# Architecture

## Visão geral

O projeto separa aquisição de conteúdo, contrato interno, registry e renderização.

```text
Next.js App Router
        │
        ▼
   Foundation
   ┌────┴────┐
   │         │
 PageSource Modules
   │         │
   ▼         ▼
 CMS/Mock  Registry
   │         │
   └────┬────┘
        ▼
 PageDefinition
        │
        ▼
 PageRenderer
        │
        ▼
 ModuleRenderer
        │
        ▼
 React Module
```

## Princípios

### 1. O CMS não define a arquitetura interna

O CMS fornece dados externos.

A Foundation define o contrato que o frontend utiliza.

```text
CMS document
    ↓
adapter
    ↓
PageDefinition
```

Isto permite trocar Payload por outra fonte sem alterar `PageRenderer` ou `ModuleRenderer`.

### 2. O routing pertence à aplicação

`PageSource` não sabe o que é Next.js.

Uma página inexistente retorna:

```ts
undefined;
```

A aplicação trata isso:

```ts
if (!page) {
  notFound();
}
```

### 3. Módulos são descobertos pelo alias

Uma `ModuleInstance` contém:

```text
id
alias
data
```

O renderer usa `alias` para consultar o `ModuleRegistry`.

Não existe uma lista hardcoded de módulos no `PageRenderer`.

### 4. Módulos são opcionais

Uma página não precisa de ter Hero, Navigation ou Footer.

O contrato suporta:

```ts
navigation?: ModuleInstance;
main: ModuleInstance[];
footer?: ModuleInstance;
```

O `main` pode conter zero ou vários módulos.

### 5. Validação acontece no renderer

O registry guarda a definição do módulo.

Se existir schema:

```text
ModuleInstance.data
       ↓
schema.parse()
       ↓
dados validados
       ↓
component
```

Em desenvolvimento, erros são lançados para facilitar diagnóstico.

Em produção, erros de módulo podem usar o fallback definido pelo renderer.

## Foundation

A criação da Foundation centraliza as implementações:

```ts
export function createFoundation(): Foundation {
  const foundation: Foundation = {
    modules: new ModuleRegistry(),
    page: new MockPageSource(),
  };

  registerModules(foundation);

  return foundation;
}
```

A implementação concreta de `page` poderá posteriormente ser substituída por `PayloadPageSource`.

## Estado atual

Já existem:

- `Foundation`
- `PageSource`
- `MockPageSource`
- `ModuleRegistry`
- `PageRenderer`
- `ModuleRenderer`
- `ModuleErrorFallback`
- schemas de módulos
- testes de registry e renderer

## Payload

O Payload será tratado como infraestrutura/adaptador.

A intenção é:

```text
Payload
  ↓
PayloadPageSource
  ↓
transformação
  ↓
PageDefinition
```

Não devemos alterar `PageDefinition` para imitar o Payload.
