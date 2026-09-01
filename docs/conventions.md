# Convenções

## Nomes de ficheiro

**`<Assunto>.<papel>.<ext>`** — o prefixo diz o assunto, o sufixo diz o papel. Sem sufixo é a implementação.

| Sufixo        | Papel                      | Exemplo                          |
| ------------- | -------------------------- | -------------------------------- |
| _(nenhum)_    | implementação              | `Hero.tsx`, `PageSource.ts`      |
| `.types.ts`   | apenas tipos e interfaces  | `Page.types.ts`, `Hero.types.ts` |
| `.schema.ts`  | validação de runtime (zod) | `Hero.schema.ts`                 |
| `.module.ts`  | registo de módulo          | `Hero.module.ts`                 |
| `.test.ts(x)` | testes                     | `ModuleRenderer.test.tsx`        |

O vocabulário é fechado. Um sufixo novo só entra se representar um papel genuinamente distinto — cinco papéis são legíveis, quinze são ruído.

### Capitalização

- **PascalCase** para ficheiros que exportam uma classe, um componente ou um conjunto de tipos de um domínio: `PageSource.ts`, `Hero.tsx`, `Page.types.ts`.
- **camelCase** para ficheiros que exportam funções: `createPagePath.ts`, `mapPayloadPage.ts`, `resolveRoute.ts`.

**O ficheiro chama-se como o seu export principal.** Um `PayloadPageMapper.ts` que exporta `mapPayloadPage` obriga a abrir o ficheiro para saber o que lá está.

### Tipos ficam junto de quem os define

Não existe uma pasta `src/types/`. O `PageDefinition` vive em [core/pages/Page.types.ts](../src/core/pages/Page.types.ts), ao lado do `PageSource.ts` que o usa. Uma árvore de tipos paralela à árvore de código obriga a manter duas estruturas em sincronia, e elas divergem sempre.

O sufixo `.types.ts` é o que torna isto legível: ao olhar para uma pasta vê-se logo o que é contrato e o que é implementação.

#### Que tipos vão para o `.types.ts`

Nem todos. O critério é se o tipo **viaja**:

- **Atravessa camadas → `.types.ts`.** `PageDefinition`, `Meta`, `SiteDefinition`, `Foundation`, `Provider`, os tipos de `Module`. São contratos: mais do que um sítio depende deles, e ter um ficheiro só para eles é o que permite importá-los sem arrastar implementação atrás.
- **Descreve o input ou o output de uma função → fica ao lado dela.** `GetPageOptions` em [PageSource.ts](../src/core/pages/PageSource.ts), `ResolvedRoute` em [resolveRoute.ts](../src/core/routing/resolveRoute.ts), `ResolvedPage` em `resolvePage.ts`, `PageRequestContext` em `createPageRequest.ts`. Exilá-los para um `.types.ts` separava-os da única coisa que lhes dá sentido.

Um teste rápido: se o tipo só é mencionado na assinatura de uma função e por quem a chama, fica com a função. Se é a forma de um dado que passa de mão em mão, é um contrato e leva ficheiro próprio.

### Dois sistemas de nome, e quando se usa cada um

Isto costuma confundir à primeira leitura, porque em `core/site/` os dois aparecem lado a lado:

```
core/site/
├── Site.types.ts    → SiteDefinition   (contrato)
└── SiteSource.ts    → class SiteSource  (coisa)
```

Parece incoerente e não é — são dois sistemas, cada um para o seu caso:

| Sistema                | Para                                     | Exemplos                                            |
| ---------------------- | ---------------------------------------- | --------------------------------------------------- |
| `<Assunto>.<papel>.ts` | ficheiros que **descrevem** um assunto   | `Site.types.ts`, `Hero.schema.ts`, `Hero.module.ts` |
| `<NomeDoExport>.ts`    | ficheiros que **são** uma coisa com nome | `SiteSource.ts`, `Registry.ts`, `createSlug.ts`     |
| `<colectivo>.ts`       | um punhado de ajudantes irmãos           | `locales.ts`, `normalize.ts`                        |

`SiteSource` é uma coisa — uma classe, com nome próprio, que se instancia e se estende. `SiteDefinition` é a forma de um dado, e o ficheiro existe para a descrever. Daí `SiteSource.ts` e não `Site.source.ts`: o vocabulário de sufixos é fechado, e `source` não entra nele.

A mesma leitura explica o resto do `core`: `PageSource.ts`, `ModuleRegistry.ts`, `PageRenderer.tsx` são coisas; `Page.types.ts`, `Module.types.ts`, `Foundation.types.ts` descrevem.

O terceiro caso é a excepção honesta: quando um ficheiro junta um punhado de ajudantes irmãos e **nenhum domina**, dá-se-lhe um nome colectivo em vez de escolher um export ao acaso ou criar um ficheiro por função. É o caso do [locales.ts](../src/providers/payload/locales.ts) (a lista, o tipo derivado, o adaptador e o type guard, todos sobre locales) e do [normalize.ts](../src/providers/api/mappers/normalize.ts) (`optionalText`, `optionalFlag`, `optionalList`). Usa-o com parcimónia: se o ficheiro começar a juntar coisas sem relação entre si, o nome colectivo passa a ser uma desculpa.

### Cuidado com a caixa dos nomes em Windows

O `core.ignorecase` do git está a `true` em Windows, o que significa que **renomear um ficheiro só na caixa não é detectado**: o disco fica com `Foo.ts`, o índice do git continua com `foo.ts`, e localmente tudo funciona. Num sistema de ficheiros sensível a maiúsculas — o Linux do CI ou do Vercel — o `import` deixa de resolver e o build parte, sem que nada tenha avisado antes.

Já aconteceu duas vezes neste repositório. Para corrigir, força o índice em vez de renomear:

```sh
git rm --cached src/caminho/Antigo.ts
git add src/caminho/antigo.ts
```

Para confirmar que o disco e o git concordam, compara `git ls-files` com os nomes reais da árvore — a comparação tem de ser sensível a maiúsculas.

### Testes ficam colocados

Ao lado do que testam, não numa pasta `__tests__/`. Ler uma unidade não deve obrigar a navegar duas árvores, e o `.test` no nome já os distingue à vista.

## Pastas

**Uma pasta justifica-se a partir de dois ficheiros.** Criar `components/` para um componente ou `types/` para um tipo é custo sem retorno — a pasta nasce quando o segundo ficheiro aparecer.

O módulo hero é o exemplo: quatro ficheiros achatados, e um `components/` quando existirem sub-componentes.

```
modules/hero/
├── Hero.tsx
├── Hero.types.ts
├── Hero.schema.ts
├── Hero.module.ts
└── index.ts
```

### Dentro de `app/`, só ficheiros de rota

Em `src/app/` uma pasta é um segmento de rota e certos nomes de ficheiro são convenções do Next (`page`, `layout`, `route`, `error`, `not-found`, `global-error`). Um `.ts` qualquer no meio deles não se distingue à vista de uma convenção cujo nome ainda não reconheces.

A regra é: **em `app/` só ficheiros de rota; o resto vai para `_lib/`.** O prefixo `_` é o mecanismo do próprio Next para tirar uma pasta do router.

```
app/(frontend)/
├── _lib/                ← não é rota
│   ├── createMetadata.ts
│   ├── resolvePage.ts
│   └── resolveSite.ts
├── layout.tsx
├── not-found.tsx
├── error.tsx
├── global-error.tsx
├── [[...segments]]/page.tsx
└── next/preview/route.ts
```

O que é puro e não depende do Next não fica no `_lib` — sai de `app/` de vez. Foi o caso do `isSafeRedirectPath`, que é uma função sobre caminhos e por isso vive em [core/routing/](../src/core/routing/), ao lado do `createPagePath` e do `resolveRoute`.

O que fica no `_lib` é o que **só** faz sentido dentro de um pedido do Next: o `resolvePage` e o `resolveSite` usam `draftMode()` e o singleton `foundation`, e o `createMetadata` fala o vocabulário do Next. Nenhum deles pode ser importado pelo `core` ou pelos `providers` — se fossem parar a um `utils/` partilhado, um dia seriam.

### Barrels

Um `index.ts` por fronteira pública — `core/pages`, `core/modules`, `providers/payload/plugins`, `providers/payload/cache`. Serve para o resto do projecto importar de um sítio estável.

Duas regras:

- **Nunca um barrel na raiz de uma camada.** Um `src/core/index.ts` que reexporta tudo transforma qualquer import numa dependência de tudo.
- **Nunca um barrel que exporte um singleton.** Ver o caso do `foundation.ts` em [architecture.md](architecture.md#6-os-barrels-não-podem-ter-efeitos-secundários).

## Imports

Ordem, separada por linhas em branco:

```ts
import { draftMode } from 'next/headers'; // 1. externos

import { PageSource } from '@/core/pages'; // 2. internos por alias

import { mapPayloadPage } from '../mappers/mapPayloadPage'; // 3. relativos
```

**Alias `@/` para cruzar camadas, relativo dentro da mesma pasta.** Um `import config from '../../../../payload.config'` não diz nada sobre o que está a importar; `@payload-config` diz.

Aliases disponíveis ([tsconfig.json](../tsconfig.json)):

| Alias             | Aponta para                 |
| ----------------- | --------------------------- |
| `@/*`             | `src/*`                     |
| `@payload-config` | `payload.config.ts`         |
| `@payload-types`  | `payload-types.ts` (gerado) |

Usa sempre `import type` para tipos. É apagado na compilação, o que evita arrastar módulos para o bundle só por causa de uma anotação.

## Cuidado com o que o TypeScript não vê

Alguns caminhos vivem em strings e o `typecheck` passa por eles sem os validar:

- **Componentes de admin do Payload** — `Field: '/providers/payload/components/PageUrl#default'` em [Pages.ts](../src/providers/payload/collections/Pages.ts). Se o caminho ficar desalinhado, o campo desaparece do admin sem um único erro.
- **[importMap.js](<../src/app/(payload)/admin/importMap.js>)** — gerado a partir dessas strings. Corre `pnpm generate:payload` depois de mover qualquer componente de admin.

Sempre que renomeares algo dentro de `src/providers/payload/`, procura o nome antigo em strings antes de assumir que o `typecheck` verde significa que está feito.
