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

### Barrels

Um `index.ts` por fronteira pública — `core/pages`, `core/modules`, `providers/payload/plugins`. Serve para o resto do projecto importar de um sítio estável.

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
