# Convenções

## Nomes de ficheiro

**`<Assunto>.<papel>.<ext>`** — o prefixo diz o assunto, o sufixo diz o papel. Sem sufixo é a implementação.

| Sufixo           | Papel                      | Exemplo                          |
| ---------------- | -------------------------- | -------------------------------- |
| _(nenhum)_       | implementação              | `Hero.tsx`, `PageSource.ts`      |
| `.types.ts`      | apenas tipos e interfaces  | `Page.types.ts`, `Hero.types.ts` |
| `.schema.ts`     | validação de runtime (zod) | `Hero.schema.ts`                 |
| `.definition.ts` | registo de módulo          | `Hero.definition.ts`             |
| `.test.ts(x)`    | testes                     | `ModuleRenderer.test.tsx`        |

O vocabulário é fechado. Um sufixo novo só entra se representar um papel genuinamente distinto — cinco papéis são legíveis, quinze são ruído.

### Capitalização

- **PascalCase** para ficheiros que exportam uma classe, um componente ou um conjunto de tipos de um domínio: `PageSource.ts`, `Hero.tsx`, `Page.types.ts`.
- **camelCase** para ficheiros que exportam funções: `createPagePath.ts`, `mapPayloadPage.ts`, `resolveRoute.ts`.

**O ficheiro chama-se como o seu export principal.** Um `PayloadPageMapper.ts` que exporta `mapPayloadPage` obriga a abrir o ficheiro para saber o que lá está.

### Tipos ficam junto de quem os define

Não existe uma pasta `src/types/`. O `PageDefinition` vive em [core/pages/Page.types.ts](../../src/core/pages/Page.types.ts), ao lado do `PageSource.ts` que o usa. Uma árvore de tipos paralela à árvore de código obriga a manter duas estruturas em sincronia, e elas divergem sempre.

O sufixo `.types.ts` é o que torna isto legível: ao olhar para uma pasta vê-se logo o que é contrato e o que é implementação.

#### Que tipos vão para o `.types.ts`

Nem todos. O critério é se o tipo **viaja**:

- **Atravessa camadas → `.types.ts`.** `PageDefinition`, `Meta`, `SiteDefinition`, `Foundation`, `Provider`, os tipos de `Module`. São contratos: mais do que um sítio depende deles, e ter um ficheiro só para eles é o que permite importá-los sem arrastar implementação atrás.
- **Descreve o input ou o output de uma função → fica ao lado dela.** `GetPageOptions` em [PageSource.ts](../../src/core/pages/PageSource.ts), `ResolvedRoute` em [resolveRoute.ts](../../src/core/routing/resolveRoute.ts), `ResolvedPage` em `resolvePage.ts`, `PageRequestContext` em `createPageRequest.ts`. Exilá-los para um `.types.ts` separava-os da única coisa que lhes dá sentido.

Um teste rápido: se o tipo só é mencionado na assinatura de uma função e por quem a chama, fica com a função. Se é a forma de um dado que passa de mão em mão, é um contrato e leva ficheiro próprio.

### Dois sistemas de nome, e quando se usa cada um

Isto costuma confundir à primeira leitura, porque em `core/site/` os dois aparecem lado a lado:

```
core/site/
├── Site.types.ts    → SiteDefinition   (contrato)
└── SiteSource.ts    → class SiteSource  (coisa)
```

Parece incoerente e não é — são dois sistemas, cada um para o seu caso:

| Sistema                | Para                                     | Exemplos                                                |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------- |
| `<Assunto>.<papel>.ts` | ficheiros que **descrevem** um assunto   | `Site.types.ts`, `Hero.schema.ts`, `Hero.definition.ts` |
| `<NomeDoExport>.ts`    | ficheiros que **são** uma coisa com nome | `SiteSource.ts`, `Registry.ts`, `createSlug.ts`         |
| `<colectivo>.ts`       | um punhado de ajudantes irmãos           | `locales.ts`, `normalize.ts`                            |

`SiteSource` é uma coisa — uma classe, com nome próprio, que se instancia e se estende. `SiteDefinition` é a forma de um dado, e o ficheiro existe para a descrever. Daí `SiteSource.ts` e não `Site.source.ts`: o vocabulário de sufixos é fechado, e `source` não entra nele.

A mesma leitura explica o resto do `core`: `PageSource.ts`, `ModuleRegistry.ts`, `PageRenderer.tsx` são coisas; `Page.types.ts`, `Module.types.ts`, `Foundation.types.ts` descrevem.

O terceiro caso é a excepção honesta: quando um ficheiro junta um punhado de ajudantes irmãos e **nenhum domina**, dá-se-lhe um nome colectivo em vez de escolher um export ao acaso ou criar um ficheiro por função. É o caso do [locales.ts](../../src/providers/payload/locales.ts) (a lista, o tipo derivado, o adaptador e o type guard, todos sobre locales) e do [normalize.ts](../../src/providers/api/mappers/normalize.ts) (`optionalText`, `optionalFlag`, `optionalList`). Usa-o com parcimónia: se o ficheiro começar a juntar coisas sem relação entre si, o nome colectivo passa a ser uma desculpa.

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

A excepção é o que os testes **partilham**: [src/testing/](../../src/testing) para helpers usados por testes de camadas diferentes. Um helper vive ao lado do teste enquanto só um o usa; quando o segundo aparece, sobe para lá, pela mesma regra das pastas logo abaixo.

**O que deliberadamente não tem teste.** Um ficheiro sem teste ao lado não é uma lacuna por omissão, e vale distinguir para ninguém «corrigir» o que está certo. No `core` são cinco casos, e cada um por uma razão diferente:

| Não tem                          | Porque                                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| os `.types.ts`                   | um teste ali afirmava o compilador, que já corre no portão                                                                   |
| `PageSource.ts`, `SiteSource.ts` | classes abstractas: só assinaturas. O contrato é exercido pelo teste de cada origem que o cumpre                             |
| `defineModule.ts`                | é `return module`. Existe para a inferência de tipos, e é o `tsc` que a verifica                                             |
| `registerModules.ts`             | exercido pelo `createFoundation.test.ts`, que afirma que o `hero` fica registado                                             |
| `foundation.ts`                  | é o singleton: `createFoundation` com o provider real. Testá-lo era testar a composição, e essa corre em cada teste do `app` |

O contrário também vale: **um ficheiro de teste tem de testar o que o nome dele diz.** Houve aqui um `ModuleErrorFallback.test.tsx` cujo `describe` se chamava `ModuleRenderer` e que nunca importava o `ModuleErrorFallback` — três dos seus cinco testes eram cópias do ficheiro ao lado. Um nome desses é pior do que nenhum teste: conta-se na cobertura e não cobre nada.

**Dois testes têm um limite de tempo explícito, e a razão é medível.** O [createProvider.test.ts](../../src/providers/createProvider.test.ts) corre com `timeout: 60_000` porque importar o `createProvider` arrasta o grafo inteiro do Payload — o adaptador de Postgres, o `sharp`, os plugins — e o `switch` tem os três providers em imports **estáticos**, logo o ramo `mock` paga o mesmo carregamento que o `payload`.

Medido: isolados, os dois testes levam 1,9 s e 2,4 s; **dentro da suite completa, 8,0 s e 7,5 s**, porque competem por CPU com os outros 64 ficheiros. O terceiro teste mais lento do repositório leva 372 ms, portanto não há mais nada perto de limite nenhum.

Isso é o que torna o limite necessário e não cerimonial: a primeira corrida do CI chumbou neste passo, numa máquina com **4 cores** contra os 20 da máquina onde foi escrito. Um teste que leva 8 s numa máquina rápida não pode ter um orçamento de 20 s onde o CI corre. O passo do CI usa `--reporter=verbose` precisamente para o próximo caso destes se nomear a si mesmo.

**O `vitest.setup.ts` desmonta o DOM entre testes**, com um `afterEach(cleanup)`. Isto não é cerimónia: o auto-cleanup do testing-library só se registra quando o Vitest corre com `globals: true`, e esta configuração não corre. Sem ele os renders acumulavam-se no `document.body` dentro de cada ficheiro, e um `screen.getByRole(...)` podia encontrar o elemento do teste anterior — um teste a passar pela razão errada, que é pior do que um teste a faltar. Provado com dois testes num ficheiro: o segundo via **dois** cabeçalhos.

## Pastas

**Uma pasta justifica-se a partir de dois ficheiros.** Criar `components/` para um componente ou `types/` para um tipo é custo sem retorno — a pasta nasce quando o segundo ficheiro aparecer.

O módulo Hero é o exemplo: quatro ficheiros achatados, e um `components/` quando existirem sub-componentes.

```
modules/Hero/
├── Hero.tsx
├── Hero.types.ts
├── Hero.schema.ts
├── Hero.definition.ts
└── index.ts
```

### Quando a pasta cresce, o nome da subpasta é o trabalho que faz

Um provider é o caso onde isto se vê melhor, porque há dois para comparar. Cada subpasta tem o nome do **papel** que os ficheiros lá dentro desempenham, e na raiz fica só o que é do provider inteiro:

```
providers/api/                      providers/payload/
├── client/     falar HTTP          ├── access/       quem pode o quê
├── requests/   montar o pedido     ├── collections/  o modelo de conteúdo
├── mappers/    traduzir a resposta ├── cache/        invalidação
├── sources/    cumprir o contrato  ├── mappers/  sources/  …
├── errors/                         │
├── Api.types.ts                    ├── locales.ts
├── apiEnv.ts                       ├── payloadEnv.ts
└── provider.ts                     └── provider.ts
```

O `api` teve sete ficheiros achatados até deixar de os ter, e o sintoma foi este: **duas pastas para o mesmo tipo de coisa, com densidades diferentes.** Se um provider precisa de onze subpastas e o outro de nenhuma, ou os problemas são diferentes ou um dos dois está a esconder a estrutura. Eram sete módulos com três papéis distintos — cliente, pedido, tradução — e nada a dizê-lo.

**Os `.types.ts` sobem quando servem duas subpastas.** O `Api.types.ts` fica na raiz do provider e não no `client/`, porque o `requests/` também devolve um `ApiRequest`. Um tipo partilhado por duas pastas pertence ao nível acima delas.

### Dentro de `app/`, só ficheiros de rota

Em `src/app/` uma pasta é um segmento de rota e certos nomes de ficheiro são convenções do Next (`page`, `layout`, `route`, `error`, `not-found`, `global-error`). Um `.ts` qualquer no meio deles não se distingue à vista de uma convenção cujo nome ainda não reconheces.

A regra é: **em `app/` só ficheiros de rota; o resto vai para uma pasta com `_`.** O prefixo `_` é o mecanismo do próprio Next para tirar uma pasta do router.

```
app/(frontend)/
├── _components/         ← componentes que não são páginas
│   └── MissingNotFoundPage.tsx
├── _lib/                ← funções
│   ├── createMetadata.ts
│   ├── resolvePage.ts
│   └── resolveSite.ts
├── layout.tsx
├── error.tsx
├── global-error.tsx
├── [[...segments]]/page.tsx
└── next/preview/route.ts
```

São **duas** pastas e não uma porque guardam coisas diferentes: `_lib` são funções, `_components` são componentes React. É a mesma separação que os providers já fazem — o provider payload tem um [components/](../../src/providers/payload/components) ao lado dos `utils/` e dos `mappers/`. Com uma pasta só, o segundo componente a aparecer transforma o `_lib` numa gaveta.

**Porque é que não ficam na raiz do grupo, ao lado do `error.tsx`.** É tentador: o `MissingNotFoundPage` até se parece com um boundary. Mas o `error.tsx` e o `global-error.tsx` são **convenções do Next** — é o Next que os encontra pelo nome e os monta. O `MissingNotFoundPage` é um componente normal, importado à mão pelo `page.tsx`. Pô-lo lado a lado sugeria que o Next também o monta, e é exactamente o mal-entendido que esta regra existe para evitar.

O que é puro e não depende do Next não fica em nenhuma das duas — sai de `app/` de vez. Foi o caso do `isSafeRedirectPath`, que é uma função sobre caminhos e por isso vive em [core/routing/](../../src/core/routing), ao lado do `createPagePath` e do `resolveRoute`.

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

Aliases disponíveis ([tsconfig.json](../../tsconfig.json)):

| Alias             | Aponta para                 |
| ----------------- | --------------------------- |
| `@/*`             | `src/*`                     |
| `@payload-config` | `payload.config.ts`         |
| `@payload-types`  | `payload-types.ts` (gerado) |

Usa sempre `import type` para tipos. É apagado na compilação, o que evita arrastar módulos para o bundle só por causa de uma anotação.

## Cuidado com o que o TypeScript não vê

Alguns caminhos vivem em strings e o `typecheck` passa por eles sem os validar:

- **Componentes de admin do Payload** — `Field: '/providers/payload/components/PageUrl#default'` em [Pages.ts](../../src/providers/payload/collections/Pages.ts). Se o caminho ficar desalinhado, o campo desaparece do admin sem um único erro.
- **[importMap.js](<../../src/app/(payload)/admin/importMap.js>)** — gerado a partir dessas strings. Corre `pnpm payload:generate` depois de mover qualquer componente de admin.

Sempre que renomeares algo dentro de `src/providers/payload/`, procura o nome antigo em strings antes de assumir que o `typecheck` verde significa que está feito.

## Comentários

**Não há comentários no código.** O raciocínio vive em `docs/`, em duas vertentes: `start/` lê-se de seguida uma vez, `reference/` consulta-se sempre. O índice está em [docs/README.md](../README.md), e a diferença entre as duas não é o assunto — é a pergunta que respondem.

**Os nomes de ficheiro e de pasta são em inglês, o conteúdo é em português.** Vale para todo o repositório, `docs/` incluído: quem lê um caminho num stack trace, num `git log` ou num import lê inglês, e quem lê uma explicação lê português.

Não é aversão a explicar — é o contrário. Este projecto tinha 229 comentários, muitos deles com o porquê de uma decisão, e o porquê de uma decisão é a coisa que mais depressa fica desactualizada num ficheiro que alguém edita por outro motivo. Um docblock a explicar uma medição que já não é verdade é pior do que nenhum: parece autoridade.

Nos documentos o mesmo raciocínio é revisível, pesquisável, e liga-se ao resto. E há um verificador de links a apanhar as referências que apodrecem.

Esta última frase esteve muito tempo a ser falsa em todos os clones menos um: o verificador existia como script solto **fora** do repositório, portanto era verdade na máquina de quem o escreveu e mentira em qualquer cópia. Agora é o [`pnpm check:links`](../../scripts/links/run.ts), corre no hook de pre-commit, e chumba: percorre os `.md` do repositório, confirma que cada ficheiro referenciado existe e que cada âncora corresponde a um título real.

**Não está no `pnpm build`, e é de propósito.** O `build` é o caminho de deploy, e uma frase desactualizada não pode derrubar um deploy. Isso tem uma consequência visível logo depois do `setup:provider`: num projecto `api` ou `mock` o `docs/reference/payload.md` e o `src/providers/payload/` desaparecem, e a prosa que lhes aponta passa a estar quebrada — dezenas de ligações. O comando avisa e diz para correr este verificador, que dá a lista exacta a podar. O primeiro commit fica bloqueado até isso ser feito; o deploy não.

O que ele **não** faz é ir à internet — só responde pelo repositório. E as duas partes que decidem (extrair as ligações de um texto, e transformar um título numa âncora como o GitHub faz) [têm testes](../../scripts/links/parse.test.ts), porque uma ferramenta que julga o resto tem de ser julgada primeiro. Ambos os testes existem por erro meu: a primeira versão partia as ligações envolvidas em `<>` com parênteses no caminho, e comia o `_` de um `unstable_cache` num título.

### Onde é que o raciocínio vai parar

| O que o comentário dizia               | Onde passa a viver                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| o que esta função faz                  | no nome dela; se não couber no nome, a função é grande                         |
| porque é que está escrita assim        | o documento do assunto — [payload.md](payload.md), [routing.md](routing.md), … |
| por onde passa isto em execução        | [flows.md](../start/flows.md)                                                  |
| que decisão isto fecha, e o que custou | [guide.md](guide.md), nos blocos de decisão                                    |
| o que aqui esteve e saiu               | [guide.md](guide.md), nos blocos de correcção                                  |
| um caso de fronteira que não é óbvio   | o **nome de um teste**                                                         |

A última linha é a que mais trabalho poupa. Um `it('keeps unpublished pages off the public site')` diz o mesmo que um comentário e **falha** quando deixa de ser verdade.

### As duas excepções

```ts
// plop: import
// plop: block
```

Vivem em [blocks/index.ts](../../src/providers/payload/blocks/index.ts) e são **funcionais**: o gerador procura-as por regex para saber onde inserir. Apagá-las parte o `pnpm generate` sem partir nem o `typecheck` nem os testes.

Os quatro ficheiros em `src/app/(payload)/` são gerados pelo Payload e trazem o cabeçalho dele. Não se editam.

### Se mesmo assim precisares de um

Precisas de escrever um comentário quando o código faz uma coisa que parece errada e não é — uma ordem de operações que importa, um contorno de um bug de biblioteca. Nesse caso, o comentário é uma linha e diz **porquê**, não o quê. E depois pergunta-te se não é antes um teste com um nome bom.

## Finais de linha

[.gitattributes](../../.gitattributes) declara `* text=auto eol=lf`, e as duas metades fazem coisas diferentes: o `text=auto` normaliza para LF **no que o Git guarda**, e o `eol=lf` força LF **no disco**.

É a segunda que resolve o problema real. O repositório já guardava LF, mas com `core.autocrlf=true` — o default de muitas instalações do Git em Windows — o checkout escrevia CRLF, e o Prettier (que corre com `endOfLine: "lf"`) reprovava seis ficheiros que ninguém tinha editado. A única forma de os «corrigir» era um commit de ruído que o próximo checkout desfazia.

Com isto no repositório, a decisão deixa de depender da configuração de cada máquina.

## Ficheiros gerados

Dois ficheiros são escritos pelo Payload e não por nós:

| Ficheiro                                                     | Quem o escreve               |
| ------------------------------------------------------------ | ---------------------------- |
| [payload-types.ts](../../payload-types.ts)                   | `payload generate:types`     |
| [importMap.js](<../../src/app/(payload)/admin/importMap.js>) | `payload generate:importmap` |

Estão os dois no [.prettierignore](../../.prettierignore), e a razão é operacional: **o `next dev` com o `withPayload` reescreve-os a cada recompilação**, sem o Prettier deste projecto. Formatá-los não é só inútil — com o dev server a correr é um ciclo, porque o Prettier escreve, o watcher vê a alteração e regenera.

A alternativa tentada — um `prettier --write` a seguir ao `payload:generate` — funciona, mas só para quem corre o script à mão. Ficam de fora, e o `pnpm format:check` volta a dizer a verdade sobre os ficheiros que alguém escreve.

Nenhum dos dois se edita à mão. Se algum ficar desalinhado, a correção é correr `pnpm payload:generate`.
