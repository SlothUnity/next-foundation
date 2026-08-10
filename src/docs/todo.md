# TODO

## Estado atual

### Foundation

- [x] `Foundation`
- [x] `createFoundation`
- [x] `ModuleRegistry`
- [x] `PageSource`
- [x] `MockPageSource`

### Modules

- [x] `ModuleProps`
- [x] `ModuleComponent`
- [x] `Module`
- [x] `ModuleSchema`
- [x] `defineModule`
- [x] `createModuleComponent`
- [x] schemas de módulos
- [x] registo automático dos módulos

### Rendering

- [x] `PageRenderer`
- [x] `ModuleRenderer`
- [x] `ModuleErrorFallback`
- [x] validação runtime com schema
- [x] tratamento dev/prod
- [x] testes do renderer

### Pages

- [x] `PageDefinition`
- [x] `Meta`
- [x] `ModuleInstance`
- [x] `PageSource`
- [x] `MockPageSource`
- [x] página inexistente representada por `undefined`
- [x] `notFound()` tratado na camada Next.js

### Testing

- [x] `Registry`
- [x] `ModuleRegistry`
- [x] `ModuleRenderer`
- [x] `PageRenderer`
- [x] `ModuleErrorFallback`
- [x] `MockPageSource`
- [x] isolamento entre testes
- [x] typecheck verde
- [x] suite de testes verde

## Próximos passos

### 1. Payload

- [ ] Pesquisar a arquitetura atual do Payload.
- [ ] Integrar Payload no projeto.
- [ ] Criar collection `pages`.
- [ ] Definir campos de página.
- [ ] Definir como o Payload representa `navigation`, `main` e `footer`.
- [ ] Definir os blocos/módulos disponíveis.
- [ ] Configurar localization.
- [ ] Configurar publicação/drafts conforme necessário.

### 2. Adapter Payload

Criar uma implementação de:

```ts
class PayloadPageSource extends PageSource
```

Responsabilidades:

- receber `slug`;
- receber `locale`;
- consultar Payload;
- transformar o resultado externo em `PageDefinition`;
- devolver `undefined` quando a página não existir.

Não deve:

- chamar `notFound()`;
- conhecer `PageRenderer`;
- conhecer o router;
- alterar o contrato `PageDefinition`.

### 3. Transformação de dados

- [ ] Definir o tipo dos documentos externos do Payload.
- [ ] Criar transformação Payload → `PageDefinition`.
- [ ] Testar a transformação isoladamente.
- [ ] Testar páginas sem navigation.
- [ ] Testar páginas sem footer.
- [ ] Testar `main` vazio.
- [ ] Testar módulos diferentes dentro de `main`.
- [ ] Testar alias de módulos desconhecidos.

### 4. Routing

- [x] Tratar `undefined` com `notFound()` na aplicação.
- [ ] Criar rota dinâmica para páginas vindas do CMS.
- [ ] Extrair slug da rota.
- [ ] Integrar locale da rota/request.
- [ ] Criar `not-found.tsx` quando a camada visual do 404 for definida.

### 5. Qualidade

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm format:check`
- [ ] `pnpm exec vitest run`
- [ ] manter todos verdes antes de avançar para a próxima alteração estrutural.

## Decisões arquiteturais fechadas

### PageDefinition não usa `regions`

Mantemos:

```ts
export interface PageDefinition {
  meta: Meta;
  navigation?: ModuleInstance;
  main: ModuleInstance[];
  footer?: ModuleInstance;
}
```

O CMS deve adaptar os seus dados para este contrato.

### O core não conhece Payload

Payload será uma implementação de `PageSource`.

### O core não conhece Next.js

`notFound()` pertence à aplicação.

### O sistema não assume módulos específicos

Não existe dependência obrigatória de `hero`, `navigation`, `gallery` ou qualquer outro módulo concreto.

### Página inexistente não é erro do renderer

`PageSource` devolve:

```ts
undefined;
```

e a aplicação decide apresentar 404.

## Comandos de validação

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm exec vitest run
```
