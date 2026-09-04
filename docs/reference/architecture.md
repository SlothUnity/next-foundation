# Arquitectura

## A ideia

Uma página não é código — é dados. O CMS produz um documento, um adaptador traduz esse documento para um contrato interno fixo (`PageDefinition`), e o renderer resolve cada bloco desses dados para um componente React através de um registry.

Nada no caminho de renderização sabe que CMS está por baixo.

Este documento diz **como as camadas se relacionam**. Para **o que acontece em execução**, na ordem em que acontece e com o ficheiro de cada passo, ver [flows.md](../start/flows.md).

## Camadas

```
┌─────────────────────────────────────────────┐
│  app/ + proxy   Next.js: routing, metadata, │
│                 draftMode, 404              │
└──────────────────────┬──────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌──────────────┐              ┌─────────────────┐
│  core/       │◄─────────────│  providers/     │
│  domínio     │              │  adaptadores    │
│              │              │  de CMS         │
│  PageSource  │              │  ┌───────────┐  │
│  SiteSource  │              │  │  payload  │  │
│  Registry    │              │  │  api      │  │
│  Renderer    │              │  │  mocks    │  │
│  Routing     │              │  └───────────┘  │
└──────▲───────┘              └─────────────────┘
       │
┌──────┴───────┐
│  modules/    │  componentes de conteúdo
└──────────────┘
```

**A direcção das dependências é a regra mais importante do projecto:** tudo aponta para o `core`, e o `core` não aponta para ninguém.

| Camada       | Conhece                      | Não pode conhecer                   |
| ------------ | ---------------------------- | ----------------------------------- |
| `core/`      | nada além de React           | Next.js, Payload, módulos concretos |
| `providers/` | `core` + o SDK do CMS        | `app`                               |
| `modules/`   | `core`                       | providers, CMS                      |
| `app/`       | `core`, `providers`, Next.js | estrutura interna do CMS            |

Se um dia `core/` precisar de importar de `providers/`, é sinal de que um conceito está na camada errada.

### A regra é imposta, não revista

Cada linha da tabela acima é um bloco de `no-restricted-imports` no [eslint.config.mjs](../../eslint.config.mjs), e cada mensagem diz o que fazer em vez de só recusar. As regras cobrem as duas formas de atravessar uma camada: o alias (`@/providers/…`) e o relativo que o contornaria (`../../providers/…`), porque uma regra que só olha para a primeira é uma regra que se contorna sem dar por isso.

Junto com elas, o `pnpm lint` corre com `--max-warnings=0`. O `no-unused-vars` é um aviso por omissão, portanto código morto não chumbava o lint, nem o hook, nem o build — agora chumba os três.

**Duas excepções, nomeadas em vez de escondidas.** O [foundation.ts](../../src/core/foundation/foundation.ts) importa `@/providers/provider` e o [registerModules.ts](../../src/core/setup/registerModules.ts) importa `@/modules`. São a **raiz de composição**: o sítio onde as peças abstractas se ligam às concretas, e esse sítio tem por definição de conhecer as duas. Estão listadas nos `ignores` do bloco do core, o que as torna visíveis a quem ler a config.

Isso não as absolve. Pela tabela, quem compõe é o `app`, e é lá que estes dois ficheiros pertencem — mover o singleton `foundation` mexe em todos os seus consumidores, portanto é uma mudança de arquitectura e não um ajuste de lint. Fica escrito aqui para não ser esquecido: **duas excepções são o preço de a regra valer para tudo o resto, não uma decisão fechada.**

## Fluxo de um pedido

A versão curta. Os dez fluxos — pedido, 404, redirect, pré-visualização, publicação, arranque, render de um módulo, gerador — estão em [flows.md](../start/flows.md).

```
URL /en/servicos/consultoria
        │
        ▼
provider.site.getSite()                      → SiteDefinition
        │  { locales, defaultLocale }
        ▼
resolveRoute({ segments, locales, defaultLocale })    app → core
        │  { locale: 'en-GB', path: 'servicos/consultoria' }
        ▼
provider.page.getPage(path, locale, { draft })
        │
        │   ┌─────────────────────────────┐
        │   │ PayloadPageSource           │  providers
        │   │  resolvePayloadPage() ─ find │
        │   │  mapPayloadPage()   ─ traduz │
        │   └─────────────────────────────┘
        ▼
PageResponse
        │
        ├── redirect → redirect() / permanentRedirect()   app
        │
        ├── notFound → a página de erro da origem,
        │              ou um fallback mínimo
        │
        ▼
PageRenderer                                 core
        │  navigation? / main[] / footer?
        ▼
ModuleRenderer  (por instância)
        │  registry.getByAlias(alias)
        │  schema.parse(data)
        ▼
Componente React                             modules
```

## Princípios

### 1. O CMS não define a arquitectura interna

O CMS fornece dados externos; o contrato interno é fixo e é o `core` que o define.

```
documento do CMS  →  mapper  →  PageDefinition
```

Nunca o inverso. Se um campo do Payload não encaixa no `PageDefinition`, é o mapper que se adapta — não o contrato.

### 2. O routing pertence à aplicação

O `PageSource` recebe um `path` e um `locale` e diz **o que há ali**: uma página, um redirect, ou nada. Não conhece Next.js, não chama `notFound()`, não sabe o que é um segmento de URL — traduzir o status numa resposta HTTP é trabalho da aplicação.

```ts
const { response } = await resolvePage(segments);

if (response.status === 'redirect') {
  return response.permanent ? permanentRedirect(response.to) : redirect(response.to);
}

return <PageRenderer page={response.page} foundation={foundation} />;
```

Repara em que o `notFound` e o `ok` seguem o **mesmo** caminho de render. Uma página de erro é conteúdo como outro qualquer — ver [routing.md](routing.md#o-404-é-conteúdo).

### 3. Os módulos são descobertos por alias

Uma `ModuleInstance` traz `alias`, e o renderer pergunta ao registry quem responde a esse alias. Não existe lista de módulos no `PageRenderer`.

### 4. Nada é obrigatório

```ts
navigation?: ModuleInstance[];
main: ModuleInstance[];      // pode ser vazio
footer?: ModuleInstance[];
```

Uma página sem navegação, sem footer e sem módulos é válida.

### 5. A validação é uma fronteira de runtime

O TypeScript garante tipos em desenvolvimento; o schema valida os dados **reais** que vêm do CMS. São problemas diferentes e ambos precisam de resposta.

```
ModuleInstance.data → schema.parse() → dados validados → componente
```

Em desenvolvimento um erro é lançado, para o vermos. Em produção cai num fallback, para não derrubar a página inteira por causa de um bloco mal preenchido.

### 6. Os barrels não podem ter efeitos secundários

O `core/foundation/foundation.ts` instancia o provider — e portanto o Payload — no momento do import. Por isso **não está no barrel**:

```ts
// core/foundation/index.ts — só coisas puras
export * from './createFoundation';
export * from './Foundation.types';
```

Quem quer o singleton importa-o pelo caminho explícito, e assume a consequência:

```ts
import { foundation } from '@/core/foundation/foundation';
```

Isto não é cosmética. Enquanto o singleton estava no barrel, os testes unitários do renderer carregavam o `payload.config.ts` só por importarem `createFoundation` — duplicando a duração da suite.

## Foundation

A `Foundation` agrega o que a aplicação precisa para renderizar:

```ts src/core/foundation/Foundation.types.ts
export interface Foundation {
  modules: ModuleRegistry;
  page: PageSource;
  site: SiteSource;
}
```

Repara no que **não** está aqui: nada de preview, nada de CMS, nada de Next.js. A `Foundation` é o contrato de domínio. Funcionalidades específicas de um provider (como o Live Preview do Payload) vivem no contrato `Provider` — ver [providers.md](providers.md).

```ts
// core/foundation/foundation.ts
export const foundation = createFoundation({
  page: provider.page,
  site: provider.site,
});
```

O `createFoundation` cria o registry e corre o `registerModules`, que registra tudo o que [src/modules/index.ts](../../src/modules/index.ts) exportar.
