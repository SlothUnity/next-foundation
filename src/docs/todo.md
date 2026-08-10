# TODO

## Current Architecture

- [x] Foundation criada
- [x] ModuleRegistry criado
- [x] Registry genérico criado
- [x] Module definitions com `alias`, `name` e `component`
- [x] Module instances com `id`, `alias` e `data`
- [x] Module component adapter criado
- [x] PageDefinition criada
- [x] PageSource criada e integrada na Foundation
- [x] Mock PageSource implementada
- [x] PageRenderer criado
- [x] ModuleRenderer criado
- [x] Navigation separado do `main`
- [x] Footer separado do `main`
- [x] `module.id` utilizado como React key
- [x] Registry resolve módulos através do `alias`
- [x] Módulos podem ser repetidos na mesma página
- [x] Schema opcional adicionado ao contrato `Module`
- [x] `ModuleSchema` criado sem acoplar o Core ao Zod
- [x] Primeiro schema implementado no Hero
- [x] `HeroProps` derivado do schema
- [x] Dados do CMS validados antes do render
- [x] `ModuleValidationError` criado
- [x] `ModuleRenderError` criado
- [x] Fallback para módulos inválidos/desconhecidos
- [x] Erros detalhados em development
- [x] Módulos inválidos não interrompem a página em production
- [x] Convenção de nomes dos ficheiros uniformizada

---

# Next Steps

## 1. Type Safety

### Module Props

- [ ] Rever `ModuleProps = Record<string, unknown>`
- [ ] Remover a index signature das props específicas dos módulos
- [ ] Tornar `ModuleComponent` genérico
- [ ] Manter o type erasure apenas no boundary do Registry/Renderer
- [ ] Garantir que props inválidas como `subtitel` são detetadas pelo TypeScript
- [ ] Garantir que módulos tipados continuam compatíveis com o Registry

### Module Definition

- [ ] Rever os generics de `Module`
- [ ] Associar `schema`, `component` e `data` através do mesmo tipo
- [ ] Evitar casts `unknown as ...`

---

## 2. PageSource / CMS Boundary

- [x] Criar `PageSource`
- [x] Expor `PageSource` através da Foundation
- [x] Criar implementação Mock
- [ ] Definir contrato final da resposta da API
- [ ] Separar claramente API DTOs de `PageDefinition`
- [ ] Criar adapter entre resposta do CMS e `PageDefinition`
- [ ] Preparar implementação futura para Payload CMS
- [ ] Definir tratamento de páginas inexistentes
- [ ] Definir tratamento de erros da API

### API Response

A resposta do CMS deverá conseguir fornecer:

- [ ] Page metadata
- [ ] SEO
- [ ] Locale
- [ ] Theme, se necessário
- [ ] Navigation
- [ ] Main modules
- [ ] Footer
- [ ] Module instances
- [ ] Module `id`
- [ ] Module `alias`
- [ ] Module `data`

---

## 3. Renderer

- [x] Resolver módulo através do alias
- [x] Validar `data` através do schema
- [x] Renderizar componente correspondente
- [x] Suportar módulos repetidos
- [x] Navigation fora do `main`
- [x] Footer fora do `main`
- [x] Fallback de módulos inválidos
- [ ] Avaliar suporte a carregamento lazy/dynamic dos módulos
- [ ] Evitar carregar todos os módulos em todas as páginas
- [ ] Definir estratégia de code splitting

---

## 4. Module Registry

- [x] Registry genérico
- [x] ModuleRegistry
- [x] Registo por alias
- [x] Deteção de aliases duplicados
- [x] Lookup por alias
- [ ] Substituir `Object.values(modules)` por lista explícita e tipada
- [ ] Garantir que apenas `Module` pode ser registado
- [ ] Avaliar estratégia de lazy module loading

---

## 5. Error Handling

- [x] `ModuleRenderError`
- [x] `ModuleValidationError`
- [x] Development com erros explícitos
- [x] Production com fallback
- [ ] Criar sistema de logging da Foundation
- [ ] Não utilizar `console.error` diretamente no Core
- [ ] Integrar logging com serviço externo no futuro
- [ ] Criar `error.tsx`
- [ ] Criar `not-found.tsx`
- [ ] Definir tratamento de erros do PageSource

---

## 6. SEO / Metadata

- [ ] Ligar `PageDefinition.meta` ao Next.js Metadata API
- [ ] Implementar `generateMetadata`
- [ ] Definir `<html lang>`
- [ ] Suportar title
- [ ] Suportar description
- [ ] Suportar canonical
- [ ] Suportar Open Graph
- [ ] Suportar robots
- [ ] Definir estratégia para metadata por locale

---

## 7. Routing

- [ ] Definir estrutura final do App Router
- [ ] Avaliar `app/[locale]/[[...slug]]/page.tsx`
- [ ] Resolver locale através do routing
- [ ] Resolver slug através do PageSource
- [ ] Implementar `generateStaticParams`
- [ ] Implementar páginas inexistentes com `notFound()`
- [ ] Testar home
- [ ] Testar páginas internas
- [ ] Testar páginas multilingues

---

## 8. Testes

### Registry

- [ ] Registar módulo
- [ ] Obter módulo por alias
- [ ] Verificar existência
- [ ] Remover módulo
- [ ] Limpar registry
- [ ] Alias duplicado deve lançar erro

### ModuleRenderer

- [ ] Renderizar módulo através do alias
- [ ] Renderizar módulo com `data`
- [ ] Renderizar módulo repetido
- [ ] Alias desconhecido em development
- [ ] Alias desconhecido em production
- [ ] Schema válido
- [ ] Schema inválido
- [ ] Fallback em production

### PageRenderer

- [ ] Renderizar Navigation
- [ ] Renderizar todos os módulos do Main
- [ ] Renderizar Footer
- [ ] Respeitar `module.id` como key
- [ ] Renderizar múltiplas instâncias do mesmo alias

### PageSource

- [ ] Obter página existente
- [ ] Página inexistente
- [ ] Erro da source
- [ ] Locale

---

## 9. CI / Quality

- [ ] Criar GitHub Actions
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm format:check`
- [ ] `pnpm build`
- [ ] Executar testes no CI
- [ ] Garantir que PRs não passam com erros de typecheck
- [ ] Garantir que PRs não passam com testes falhados

---

## 10. TypeScript / Tooling

- [ ] Rever `target`
- [ ] Avaliar `ES2022`
- [ ] Remover `allowJs` se não necessário
- [ ] Ativar `noUncheckedIndexedAccess`
- [ ] Ativar `noImplicitOverride`
- [ ] Ativar `verbatimModuleSyntax`
- [ ] Rever alias `@types/*`
- [ ] Avaliar `eslint-plugin-simple-import-sort`
- [ ] Avaliar regras type-checked do `@typescript-eslint`

---

# Architecture Decisions

## Module Identity

Cada módulo possui:

```ts
{
  id: string;
  alias: string;
  data: ...
}
```

`alias` identifica a definição do módulo.

`id` identifica a instância do módulo dentro da página.

O mesmo `alias` pode aparecer várias vezes na mesma página.

---

## Module Resolution

O Renderer não importa módulos diretamente.

O fluxo é:

```text
ModuleInstance
      │
      ▼
ModuleRegistry
      │
      │ alias
      ▼
Module Definition
      │
      ├── schema
      └── component
```

---

## Data Validation

Os dados provenientes do CMS são considerados não confiáveis.

O fluxo é:

```text
CMS
 │
 ▼
ModuleInstance.data
 │
 ▼
ModuleSchema.parse()
 │
 ├── válido ──► ModuleComponent
 │
 └── inválido
       ├── development → error
       └── production  → fallback
```

---

## Schema Dependency

O Core não depende diretamente do Zod.

O Core conhece apenas:

```ts
interface ModuleSchema<TData> {
  parse(data: unknown): TData;
}
```

O módulo pode utilizar Zod como implementação.

No futuro poderá ser substituído por outra biblioteca compatível.

---

# Current Sprint

## Sprint: CMS-driven rendering foundation

### Completed

- Foundation
- Registry
- ModuleRegistry
- Module definitions
- Module instances
- PageSource
- Mock PageSource
- PageRenderer
- ModuleRenderer
- Module schema contract
- Zod integration
- Hero schema
- Runtime validation
- Module errors
- Production fallback
- Naming convention

### Next

**Primeiro objetivo: corrigir a type safety de `ModuleProps` e `ModuleComponent` sem voltar a introduzir casts inseguros.**

Depois:

1. Melhorar o contrato `Module`
2. Criar testes do Registry/Renderer
3. Criar CI
4. Definir o contrato final da API/CMS
5. Integrar SEO/metadata
6. Implementar routing dinâmico
7. Preparar Payload CMS
8. Code splitting / dynamic modules
