# Guia comentado do next-foundation

Este guia explica o projeto peça a peça: o que cada coisa faz e, sobretudo, **porque está lá**. Não é documentação de referência — para isso existem os outros ficheiros em `docs/`. É um percurso, feito para se ler de uma ponta à outra com o editor aberto ao lado.

No fim deves conseguir abrir qualquer ficheiro do `src/` e explicar o que lá está a alguém.

## Como ler este guia

**Para quem é.** Para quem sabe JavaScript mas olha para este projeto e não percebe o vocabulário: porquê classes nuns sítios e funções noutros, o que é uma classe abstrata, para que serve um `Registry` genérico, porque é que há um ficheiro que exporta uma variável já criada. O Capítulo 0 dá esse vocabulário todo antes de o percurso começar.

**Como acompanhar.** Guia num lado, editor no outro. Cada bloco de código citado traz o caminho e a linha — `src/core/registry/Registry.ts:4` — para abrires o ficheiro e veres o contexto à volta. Cito só o excerto relevante, nunca o ficheiro inteiro; o ficheiro inteiro tens tu.

**A ordem.** O guia segue um pedido real do princípio ao fim: alguém escreve `https://osite.pt/en/sobre-nos` no browser, e nós seguimos esse pedido até sair HTML do outro lado. Cada peça é explicada no momento em que o pedido lhe bate. É por isso que o guia não segue a estrutura de pastas — seguir pastas obriga a explicar coisas antes de se perceber para que servem.

### Quatro marcas que vais encontrar

Ao longo do texto há quatro avisos com significado fixo. Valem a pena porque distinguem coisas que, lidas no código, parecem todas iguais.

> 📐 **Imposto pelo Next.js** / **pelo Payload**

Isto não foi decidido por ninguém aqui — o framework obriga. Não vale a pena procurar-lhe intenção, e não se pode mudar. Saber o que é imposto e o que é escolhido é metade do que falta para ler o projeto com confiança.

> 🎯 **Decisão**

Alguém escolheu isto, e havia alternativas. Explico qual foi a alternativa e porque não foi tomada. É aqui que está o valor deste guia.

> ⚠ **Lapso, não decisão**

Isto está errado, ou é lixo esquecido. Marco-o para não o aprenderes como se fosse um padrão a seguir. Um guia que explica bugs como se fossem intenção é pior do que guia nenhum.

> ✅ **Corrigido**

Isto **esteve** errado e já não está. Fica registado por duas razões: a explicação do problema continua a ensinar alguma coisa, e saber que já foi tratado evita que alguém o «volte a corrigir» ou o reintroduza. Se vires um `⚠`, é um problema vivo; se vires um `✅`, é história.

---

## Índice

- [Cap. 0 — O vocabulário, antes do percurso](#cap-0--o-vocabulário-antes-do-percurso)
  - [0.1 Classe ou função? A regra deste projeto](#01-classe-ou-função-a-regra-deste-projeto)
  - [0.2 Classe abstrata: o contrato que obriga](#02-classe-abstrata-o-contrato-que-obriga)
  - [0.3 `extends` e polimorfismo](#03-extends-e-polimorfismo)
  - [0.4 Generics: `<TKey, TValue>`](#04-generics-tkey-tvalue)
  - [0.5 `protected`, `private`, `readonly`](#05-protected-private-readonly)
  - [0.6 `type` ou `interface`?](#06-type-ou-interface)
  - [0.7 `import type` e porque desaparece](#07-import-type-e-porque-desaparece)
  - [0.8 Módulos ESM: importar é executar (e o singleton)](#08-módulos-esm-importar-é-executar-e-o-singleton)
  - [0.9 Barrels (`index.ts`) e a regra dos efeitos secundários](#09-barrels-indexts-e-a-regra-dos-efeitos-secundários)
  - [0.10 Injeção de dependências](#010-injeção-de-dependências)
  - [0.11 Server Components e Client Components](#011-server-components-e-client-components)
  - [0.12 Se o TypeScript já valida tipos, para que serve o zod?](#012-se-o-typescript-já-valida-tipos-para-que-serve-o-zod)

- [Cap. 1 — Chega o pedido](#cap-1--chega-o-pedido)
  - [1.1 O mapa do `src/app/`](#11-o-mapa-do-srcapp)
  - [1.2 Route groups: pastas entre parênteses](#12-route-groups-pastas-entre-parênteses)
  - [1.3 `[[...segments]]`: uma rota para o site inteiro](#13-segments-uma-rota-para-o-site-inteiro)
  - [1.4 `layout.tsx`, linha a linha](#14-layouttsx-linha-a-linha)
  - [1.5 `page.tsx`, linha a linha](#15-pagetsx-linha-a-linha)
  - [1.6 `proxy.ts`: o caminho até ao layout](#16-proxyts-o-caminho-até-ao-layout)
- [Cap. 2 — `resolvePage` e o `cache()` do React](#cap-2--resolvepage-e-o-cache-do-react)
  - [2.1 O problema: vários sítios, a mesma pergunta](#21-o-problema-vários-sítios-a-mesma-pergunta)
  - [2.2 O que o `cache()` garante — e o que não garante](#22-o-que-o-cache-garante--e-o-que-não-garante)
  - [2.3 Porque há duas funções e não uma](#23-porque-há-duas-funções-e-não-uma)
  - [2.4 A forma do `ResolvedPage`](#24-a-forma-do-resolvedpage)
- [Cap. 3 — `resolveRoute`: da URL para `{locale, path}`](#cap-3--resolveroute-da-url-para-locale-path)
  - [3.1 A função, linha a linha](#31-a-função-linha-a-linha)
  - [3.2 `getLocaleSegment`: de `pt-PT` para `pt`](#32-getlocalesegment-de-pt-pt-para-pt)
  - [3.3 O locale por omissão é declarado, não adivinhado](#33-o-locale-por-omissão-é-declarado-não-adivinhado)

- [Cap. 4 — `Foundation`, o centro de composição](#cap-4--foundation-o-centro-de-composição)
  - [4.1 O objeto de três campos](#41-o-objeto-de-três-campos)
  - [4.2 Fábrica e instância, em ficheiros separados](#42-fábrica-e-instância-em-ficheiros-separados)
  - [4.3 `registerModules`: registo por convenção](#43-registermodules-registo-por-convenção)
- [Cap. 5 — `Registry` e `ModuleRegistry`](#cap-5--registry-e-moduleregistry)
  - [5.1 `Registry`, membro a membro](#51-registry-membro-a-membro)
  - [5.2 Porque rebenta em vez de sobrescrever](#52-porque-rebenta-em-vez-de-sobrescrever)
  - [5.3 `ModuleRegistry`: mecanismo e política](#53-moduleregistry-mecanismo-e-política)
- [Cap. 6 — Módulos](#cap-6--módulos)
  - [6.1 Definição e instância: a distinção central](#61-definição-e-instância-a-distinção-central)
  - [6.2 Os tipos, um a um](#62-os-tipos-um-a-um)
  - [6.3 `defineModule`: a função que não faz nada](#63-definemodule-a-função-que-não-faz-nada)
  - [6.4 `createModuleComponent`: o adaptador, e onde ele mente](#64-createmodulecomponent-o-adaptador-e-onde-ele-mente)
  - [6.5 O `hero`, ficheiro a ficheiro](#65-o-hero-ficheiro-a-ficheiro)
  - [6.6 O `alias` é a cola](#66-o-alias-é-a-cola)

- [Cap. 7 — Sair do `core`: o `Provider`](#cap-7--sair-do-core-o-provider)
  - [7.1 O contrato](#71-o-contrato)
  - [7.2 `createProvider`: escolher por variável de ambiente](#72-createprovider-escolher-por-variável-de-ambiente)
  - [7.3 As três implementações](#73-as-três-implementações)
- [Cap. 8 — Provider Payload, lado do frontend](#cap-8--provider-payload-lado-do-frontend)
  - [8.1 `locales.ts`: uma lista, três formas](#81-localests-uma-lista-três-formas)
  - [8.2 `PayloadSiteSource` e a Local API](#82-payloadsitesource-e-a-local-api)
  - [8.3 `PayloadPageSource.getPage`](#83-payloadpagesourcegetpage)
  - [8.4 `resolvePayloadPage`, opção a opção](#84-resolvepayloadpage-opção-a-opção)
  - [8.5 `mapPayloadPage`: onde os dados mudam de forma](#85-mappayloadpage-onde-os-dados-mudam-de-forma)
  - [8.6 A cache: o que sobrevive ao pedido](#86-a-cache-o-que-sobrevive-ao-pedido)
- [Cap. 9 — Provider Payload, lado do CMS](#cap-9--provider-payload-lado-do-cms)
  - [9.1 `payload.config.ts`, opção a opção](#91-payloadconfigts-opção-a-opção)
  - [9.2 A collection `Pages`](#92-a-collection-pages)
  - [9.3 `Media`, `Users` e o global `Site`](#93-media-users-e-o-global-site)
  - [9.4 Os plugins: `nestedDocs` e `seo`](#94-os-plugins-nesteddocs-e-seo)
  - [9.5 O circuito do Live Preview](#95-o-circuito-do-live-preview)

- [Cap. 10 — De volta ao render](#cap-10--de-volta-ao-render)
  - [10.1 `PageRenderer`: as três regiões](#101-pagerenderer-as-três-regiões)
  - [10.2 `ModuleRenderer`, linha a linha](#102-modulerenderer-linha-a-linha)
  - [10.3 A assimetria dev/prod](#103-a-assimetria-devprod)
  - [10.4 As classes de erro e o `cause`](#104-as-classes-de-erro-e-o-cause)
- [Cap. 11 — O que sustenta tudo](#cap-11--o-que-sustenta-tudo)
  - [11.1 `package.json`, script a script](#111-packagejson-script-a-script)
  - [11.2 `tsconfig.json`, opção a opção](#112-tsconfigjson-opção-a-opção)
  - [11.3 `next.config.ts`](#113-nextconfigts)
  - [11.4 Testes, lint e o hook de pre-commit](#114-testes-lint-e-o-hook-de-pre-commit)
  - [11.5 As variáveis de ambiente, uma a uma](#115-as-variáveis-de-ambiente-uma-a-uma)
  - [11.6 As convenções de ficheiros](#116-as-convenções-de-ficheiros)
    - [Porque é que `SiteSource.ts` não é `Site.source.ts`](#porque-é-que-sitesourcets-não-é-sitesourcets)
- [Cap. 12 — O provider `api`](#cap-12--o-provider-api)
- [Apêndice A — Mapa de um pedido](#apêndice-a--mapa-de-um-pedido)
- [Apêndice B — Adicionar um módulo do zero](#apêndice-b--adicionar-um-módulo-do-zero)
- [Apêndice C — Glossário](#apêndice-c--glossário)

---

# Cap. 0 — O vocabulário, antes do percurso

Este capítulo não fala do projeto. Fala das ferramentas de TypeScript que o projeto usa. É deliberadamente o primeiro: sem ele, o percurso dos capítulos seguintes obrigaria a parar de dez em dez linhas para explicar uma palavra.

Cada secção tem a mesma forma: **o que é**, **como aparece neste projeto**, **porquê**.

## 0.1 Classe ou função? A regra deste projeto

Esta é provavelmente a pergunta que mais incomoda quem vem de JavaScript: o projeto tem funções por todo o lado e, de repente, classes. Parece arbitrário. Não é.

Faz o exercício de listar todas as classes que existem no `src/`. São estas, e mais nenhuma:

| Classe                                                                              | Onde                                            | Categoria                  |
| ----------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------- |
| `Registry<TKey, TValue>`, `ModuleRegistry`                                          | `src/core/registry/`                            | guarda estado              |
| `PageSource`, `SiteSource`                                                          | `src/core/pages/`, `src/core/site/`             | contrato abstrato          |
| `PayloadPageSource`, `ApiPageSource`, `MockPageSource` (e os `*SiteSource`)         | `src/providers/*/sources/`                      | implementações do contrato |
| `ApiClient`                                                                         | `src/providers/api/`                            | guarda configuração        |
| `ModuleRenderError`, `ModuleValidationError`, `ApiRequestError`, `ApiContractError` | `src/core/errors/`, `src/providers/api/errors/` | identidade para `catch`    |

Tudo o resto no projeto — e é a esmagadora maioria — são funções: `resolveRoute`, `createFoundation`, `mapPayloadPage`, `defineModule`, `createPagePath`, os componentes React todos.

A regra que daí sai, e que deves aplicar quando acrescentares código:

**Usa-se uma classe quando há uma das três coisas:**

1. **Um contrato com várias implementações trocáveis.** `PageSource` diz «uma fonte de páginas sabe responder a `getPage`». Há três maneiras diferentes de o fazer (Payload, API, mocks) e o resto do código não pode saber qual está a correr. Ver [0.2](#02-classe-abstrata-o-contrato-que-obriga).
2. **Estado que persiste entre chamadas.** O `Registry` tem um `Map` lá dentro que vai crescendo. Uma função não guarda nada entre invocações; um objeto guarda.
3. **Identidade para apanhar em `catch`.** `catch (e) { if (e instanceof ApiRequestError) ... }` só funciona com classes. Um objeto de erro qualquer não dá para distinguir.

**Usa-se uma função em todos os outros casos** — e «todos os outros casos» aqui quer dizer: transformar dados de entrada em dados de saída sem guardar nada. `mapPayloadPage(page, locale)` recebe um documento do Payload e devolve um `PageDefinition`. Não tem estado, não tem alternativas trocáveis, não precisa de `instanceof`. Fazer disto uma classe `PayloadPageMapper` com um método `map()` seria escrever mais código para obter exatamente o mesmo — o padrão a que às vezes se chama, com pouco carinho, «classe que é só um sítio para pôr uma função».

> 🎯 **Decisão**
>
> O projeto não usa classes para «organizar» código. Usa-as só onde a linguagem dá alguma coisa que funções não dão: herança de contrato, estado, ou `instanceof`. Se estiveres a criar uma classe e nenhuma das três se aplica, é uma função.

## 0.2 Classe abstrata: o contrato que obriga

**O que é.** Uma classe que não pode ser instanciada (`new PageSource()` dá erro) e que declara métodos sem corpo. Quem herdar dela é **obrigado** a escrever esses métodos, senão o TypeScript não compila.

**Como aparece.** `src/core/pages/PageSource.ts:7`:

```ts
export abstract class PageSource {
  abstract getPage(
    path: string,
    locale?: string,
    options?: GetPageOptions,
  ): Promise<PageDefinition | undefined>;
}
```

É o ficheiro inteiro. Não tem implementação nenhuma — é só a promessa. O irmão dele, `src/core/site/SiteSource.ts:3`, é ainda mais curto:

```ts
export abstract class SiteSource {
  abstract getSite(): Promise<SiteDefinition>;
}
```

**Porquê.** Lê a assinatura com atenção, porque ela é o coração do projeto:

- `path: string` — o caminho **sem locale** (`sobre-nos`, não `/en/sobre-nos`). Quem chama já separou as duas coisas.
- `locale?: string` — opcional, e é um `string` genérico, não uma lista de locales concretos. O core não sabe que locales existem neste site.
- `options?: GetPageOptions` — hoje só tem `draft?: boolean`. É um objeto em vez de um quarto parâmetro solto porque objetos crescem sem partir chamadas existentes; parâmetros posicionais não.
- `Promise<PageDefinition | undefined>` — devolve uma página ou nada. **Não devolve um documento do Payload.** Devolve o tipo interno do projeto. É aqui que a fronteira é desenhada.
- E repara no que **não** está aqui: nenhuma menção a Payload, a SQL, a `fetch`, a CMS nenhum. Uma pessoa que leia só este ficheiro não consegue adivinhar que o projeto usa Payload.

**Porquê classe abstrata e não uma `interface`?** Uma interface daria quase o mesmo e o TypeScript verificava-a na mesma. A diferença prática é que a classe abstrata existe em tempo de execução: pode-se fazer `extends`, pode-se verificar `instanceof`, e — o que mais conta aqui — quando amanhã for preciso pôr comportamento partilhado por todas as fontes (um cache, um log, uma normalização de `path`), há onde o pôr sem tocar em nenhuma das três implementações. Com uma interface teria de se repetir esse comportamento nas três.

## 0.3 `extends` e polimorfismo

**O que é.** `extends` liga uma classe a outra: a filha herda o que a mãe tem e é obrigada a preencher o que a mãe deixou por preencher. «Polimorfismo» é a palavra grande para a consequência: quem recebe a mãe pode receber qualquer filha, sem saber qual.

**Como aparece.** `src/providers/payload/sources/PayloadPageSource.ts:13`:

```ts
export class PayloadPageSource extends PageSource {
  async getPage(path, locale?, options?): Promise<PageDefinition | undefined> {
```

E, exatamente da mesma forma, `ApiPageSource extends PageSource` e `MockPageSource extends PageSource`.

**Porquê.** Segue a consequência até ao fim, porque é ela que explica o projeto todo:

1. `Foundation` (`src/core/foundation/Foundation.types.ts:7`) declara `page: PageSource` — o tipo da **mãe**.
2. Lá dentro, em execução, está uma `PayloadPageSource`, ou uma `ApiPageSource`, ou uma `MockPageSource`.
3. Quem escreve `foundation.page.getPage(...)` **não sabe qual é** e não tem como descobrir sem fazer batota.

O resultado é a propriedade que o projeto anda a perseguir: trocar de CMS é trocar a classe que se põe ali dentro. Nem uma linha do `core`, dos módulos ou dos componentes muda. E não é uma promessa teórica — o provider `mocks` corre o site inteiro sem base de dados nenhuma, o que prova que a abstração não está a vazar (se vazasse, o `mocks` não funcionaria).

## 0.4 Generics: `<TKey, TValue>`

**O que é.** Um parâmetro de uma classe ou função que é um **tipo**, não um valor. Escreve-se uma vez e serve para muitos tipos, sem perder a verificação.

**Como aparece.** `src/core/registry/Registry.ts:1`:

```ts
export class Registry<TKey, TValue> {
  protected readonly items = new Map<TKey, TValue>();
```

E depois, em `src/core/registry/ModuleRegistry.ts:5`:

```ts
export class ModuleRegistry extends Registry<string, Module> {
```

**Porquê.** Lê a segunda linha como uma chamada: `Registry` é uma fábrica de tipos, e `ModuleRegistry` chama-a com `TKey = string` e `TValue = Module`. A partir daí, e sem se escrever mais nada, o TypeScript sabe que `this.items` é um `Map<string, Module>`, que `get()` devolve `Module | undefined`, e que passar um número como chave é erro.

A alternativa era escrever `Registry` com `Map<string, unknown>` e andar a fazer casts (`as Module`) de cada vez que se tirasse alguma coisa de lá. Cada cast desses é uma afirmação por verificar — funciona até ao dia em que não funciona, e nessa altura rebenta longe de onde foi escrito.

**Convenção de nomes:** o prefixo `T` (`TKey`, `TValue`, `TProps`, `TData`) marca «isto é um parâmetro de tipo, não um tipo real». O projeto usa-a de forma consistente; segue-a.

## 0.5 `protected`, `private`, `readonly`

**O que é.** Marcadores de visibilidade e de mutabilidade nos membros de uma classe. Existem só em TypeScript: no JavaScript compilado desaparecem por completo (`private` do TS não é o mesmo que os campos `#privados` do JavaScript, esses sim reais em execução).

**Como aparece.** Os dois primeiros membros do `Registry` (`src/core/registry/Registry.ts:2` e `:4`):

```ts
protected readonly items = new Map<TKey, TValue>();

protected add(key: TKey, value: TValue): void {
```

E o método público que os usa, em `ModuleRegistry.ts:6`:

```ts
register<TProps extends ModuleProps>(module: Module<TProps>): void {
  this.add(module.alias, module);
}
```

**Porquê.** Isto é mais subtil do que parece e vale a pena parar.

- `readonly items` — a referência do `Map` não pode ser substituída (`this.items = new Map()` é erro). O conteúdo do `Map` continua a mudar à vontade. Protege contra alguém trocar o registo inteiro a meio da vida do objeto.
- `protected items` — as subclasses veem, o mundo lá fora não. Sem isto, qualquer sítio do código podia fazer `foundation.modules.items.set('hero', outraCoisa)` e furar todas as regras de registo.
- **`protected add`** — esta é a decisão interessante. `add` sabe adicionar com uma chave, mas _não decide qual é a chave_. Quem decide é a subclasse: o `ModuleRegistry` sabe que a chave de um módulo é o `alias` dele. Por isso `add` fica escondido e `register` é a porta pública, com uma assinatura de domínio (recebe um `Module`, não um par chave/valor) que torna impossível registar um módulo debaixo da chave errada.

> 🎯 **Decisão**
>
> `Registry` é o mecanismo (guardar, procurar, apagar); `ModuleRegistry` é a política (a chave é o `alias`). A visibilidade é o que mantém os dois separados — se `add` fosse público, a política era só uma sugestão.

O mesmo padrão aparece em `getByAlias(alias)` (`ModuleRegistry.ts:10`), que é literalmente `return this.get(alias)`. Não acrescenta comportamento nenhum, acrescenta **nome**: no sítio da chamada lê-se `getByAlias`, e fica claro que a string que vai ali é um alias de módulo e não uma chave qualquer.

## 0.6 `type` ou `interface`?

**O que é.** Duas formas de dar nome a um tipo. Para descrever a forma de um objeto, fazem quase o mesmo.

**Como aparece.** O projeto mistura as duas, mas não ao acaso. `src/core/modules/Module.types.ts`:

```ts
export type ModuleProps = object;                                    // :3
export type ModuleComponent<TProps extends ModuleProps = ModuleProps> = (props: TProps) => ReactNode;  // :5
export interface Module<TProps extends ModuleProps = ModuleProps> {  // :15
  alias: string;
  ...
}
```

**Porquê.** A regra observável é simples:

- **`interface`** para a forma de um objeto: `Module`, `ModuleInstance`, `PageDefinition`, `Meta`, `Foundation`, `ResolvedRoute`.
- **`type`** para tudo o que não é um objeto: um alias (`ModuleProps = object`), uma assinatura de função (`ModuleComponent`), uma união (`SupportedLocale`).

Há uma diferença técnica que justifica preferir `interface` no primeiro caso: interfaces com o mesmo nome no mesmo ficheiro **fundem-se** em silêncio (chama-se _declaration merging_), enquanto dois `type` com o mesmo nome dão erro logo. Isto é útil para estender tipos de bibliotecas, mas é uma armadilha quando não se quer:

> ✅ **Corrigido**
>
> O `src/core/routing/createPagePath.ts` chegou a ter a `interface CreatePagePathOptions` declarada **duas vezes, idêntica**. Deviam dar erro; não davam, porque o declaration merging as fundia numa só — e por isso ninguém reparou. Guarda o caso mesmo já não estando lá: é a demonstração perfeita de porque é que este comportamento do TypeScript morde.

Repara também no `= ModuleProps` em `Module<TProps extends ModuleProps = ModuleProps>`: é um **valor por omissão para o parâmetro de tipo**. Quer dizer que se pode escrever `Module` sem os `<>` e o TypeScript entende `Module<ModuleProps>`. É o que permite ao `ModuleRegistry` guardar `Module` (sem props concretas) enquanto quem define um módulo escreve `Module<HeroProps>`.

## 0.7 `import type` e porque desaparece

**O que é.** Um import que traz **só o tipo**, e que é apagado quando o TypeScript compila para JavaScript. No bundle final não fica lá nada.

**Como aparece.** Por todo o lado, e de forma disciplinada. `src/core/renderer/PageRenderer.tsx:1-6`:

```ts
import { Fragment } from 'react';

import type { Foundation } from '@/core/foundation';
import type { PageDefinition } from '@/core/pages';

import { ModuleRenderer } from './ModuleRenderer';
```

`Fragment` e `ModuleRenderer` são usados em execução, logo são imports normais. `Foundation` e `PageDefinition` só aparecem em anotações de tipo, logo são `import type`.

**Porquê.** Duas razões, e a segunda é a que interessa neste projeto:

1. **Bundle.** O que é `import type` não entra no ficheiro final. Não custa bytes ao utilizador.
2. **Não cria dependência real.** E é isto que importa: um `import type` não puxa o módulo para o grafo de execução. Se `PageRenderer.tsx` fizesse um import normal de `@/core/foundation`, importar o renderer passava a importar tudo o que o barrel do foundation arrasta atrás. Com `import type`, a seta existe para o TypeScript e não existe para o Node.

Este detalhe volta a aparecer no capítulo seguinte e no [0.9](#09-barrels-indexts-e-a-regra-dos-efeitos-secundários) — é uma das ferramentas que mantém o `core` leve.

## 0.8 Módulos ESM: importar é executar (e o singleton)

**O que é.** Um ficheiro `.ts`/`.js` com `import`/`export` é um _módulo ESM_. A regra que muita gente não interioriza: **o corpo de um módulo corre uma vez, na primeira vez que alguém o importa**, e o resultado fica guardado. Quem importar a seguir recebe o mesmo. Não é uma escolha do projeto — é como a linguagem funciona.

Daí sai o padrão _singleton_: uma instância única, partilhada por toda a aplicação, criada pelo simples facto de o ficheiro ser importado.

**Como aparece.** Duas vezes, e são os dois pontos mais importantes do arranque. `src/core/foundation/foundation.ts` (o ficheiro inteiro):

```ts
import { provider } from '@/providers/provider';

import { createFoundation } from './createFoundation';

export const foundation = createFoundation({
  page: provider.page,
  site: provider.site,
});
```

E `src/providers/provider.ts`, com a mesma forma: `export const provider = createProvider();`.

**Porquê.** Repara na separação, que é deliberada e aparece duas vezes:

| Ficheiro              | Papel                                                                   |
| --------------------- | ----------------------------------------------------------------------- |
| `createFoundation.ts` | a **fábrica** — uma função pura, dá-se-lhe as peças e devolve um objeto |
| `foundation.ts`       | a **instância** — chama a fábrica uma vez, com as peças reais           |
| `createProvider.ts`   | a fábrica                                                               |
| `provider.ts`         | a instância                                                             |

Porquê dois ficheiros para o que podia ser um? Porque os testes precisam da fábrica sem a instância. Um teste do renderer quer uma `Foundation` de brincar, com um registo vazio e umas fontes falsas — chama `createFoundation({ page: fake, site: fake })` e tem-na. Se só existisse o singleton, importá-lo arrastava a aplicação verdadeira (e a ligação à base de dados) para dentro do teste.

O reverso também é verdade e é onde isto morde: **importar `foundation.ts` põe a aplicação inteira de pé**. A cadeia é `foundation.ts` → `provider.ts` → `createProvider.ts` → os três providers → `PayloadPageSource.ts` → `@payload-config` → a config do Payload e o adapter de Postgres. Um `import` aparentemente inocente traz tudo isso atrás. É exatamente por causa disto que existe a regra da secção seguinte.

## 0.9 Barrels (`index.ts`) e a regra dos efeitos secundários

**O que é.** Um _barrel_ é um `index.ts` que reexporta o conteúdo de uma pasta, para quem consome poder escrever `from '@/core/registry'` em vez de `from '@/core/registry/ModuleRegistry'`.

**Como aparece.** `src/core/foundation/index.ts` — e o que interessa aqui é o que **não** está lá:

```ts
export * from './createFoundation';
export * from './Foundation.types';
```

A pasta tem três ficheiros. O `foundation.ts` — a instância — está deliberadamente de fora. Por isso é que, em `src/app/(frontend)/[[...segments]]/page.tsx:5`, o import é o caminho completo:

```ts
import { foundation } from '@/core/foundation/foundation';
```

Fica mais feio. É de propósito.

**Porquê.** Junta o [0.8](#08-módulos-esm-importar-é-executar-e-o-singleton) com o `export *`: se o barrel exportasse o `foundation.ts`, então **qualquer** import a partir de `@/core/foundation` — mesmo um inocentíssimo `import type { Foundation }` para uma anotação de tipo — instanciava a aplicação inteira. Isto não é hipotético: aconteceu, os testes unitários começaram a carregar o `payload.config.ts` e a suite demorava o dobro do tempo.

> 🎯 **Decisão**
>
> A regra do projeto, escrita em `docs/conventions.md`, é: **um barrel nunca exporta um singleton**, e nunca tem efeitos secundários. Importar um barrel deve ser gratuito. O preço é escrever o caminho completo nos poucos sítios que querem mesmo a instância — e esse caminho mais comprido é um sinal útil, porque marca visualmente onde é que a aplicação real está a ser tocada.

A outra metade da regra: **nunca há barrel na raiz de uma camada**. Não existe `src/core/index.ts`. Se existisse, um import ao `core` puxava o `core` inteiro, e a árvore de dependências deixava de dizer alguma coisa.

## 0.10 Injeção de dependências

**O que é.** Nome pomposo para uma ideia simples: em vez de um componente ir buscar aquilo de que precisa, recebe-o de fora.

**Como aparece.** `src/core/renderer/PageRenderer.tsx:8-13`:

```ts
interface PageRendererProps {
  page: PageDefinition;
  foundation: Foundation;
}

export function PageRenderer({ page, foundation }: PageRendererProps) {
```

O `PageRenderer` precisa do registo de módulos para saber que componente desenhar. Podia importá-lo — `import { foundation } from '@/core/foundation/foundation'` — e não recebia nada por props. Não o faz: recebe-o. E passa-o a seguir ao `ModuleRenderer` (`PageRenderer.tsx:21`), que também o recebe em vez de o importar.

Quem faz a ligação é a camada de cima, em `page.tsx:38`:

```tsx
return <PageRenderer page={resolved.page} foundation={foundation} />;
```

**Porquê.** Três consequências, por ordem de importância:

1. **O `core` continua a não conhecer a aplicação.** Se o `PageRenderer` importasse o singleton, o `core` passava a depender do `providers`, e a regra de ouro do projeto — _tudo aponta para o `core`, o `core` não aponta para nada_ — caía. O `PageRenderer` conhece o **tipo** `Foundation`, via `import type`, e mais nada.
2. **Testar deixa de ser um problema.** Os testes do renderer constroem uma `Foundation` com dois módulos de mentira e passam-na por props. Sem mocks, sem manipular imports, sem base de dados.
3. **Fica explícito.** Lendo a assinatura sabe-se tudo o que o componente precisa. Uma dependência importada lá dentro é invisível de fora.

Isto é o mesmo princípio do [0.8](#08-módulos-esm-importar-é-executar-e-o-singleton), visto de outro ângulo: **quem cria as coisas é a fronteira da aplicação; quem as usa recebe-as**.

## 0.11 Server Components e Client Components

**O que é.** No App Router do Next.js, um componente corre **no servidor por omissão**: executa durante o pedido, pode ser `async`, pode ir à base de dados, e o que chega ao browser é o resultado — o código do componente não vai. Para um componente correr no browser, o ficheiro tem de começar com `'use client'`.

> 📐 **Imposto pelo Next.js**
>
> O default é server. Não há nada a configurar e não é escolha do projeto.

**Como aparece.** Em todo o `src/`, há exatamente **dois** ficheiros com `'use client'`:

- `src/providers/payload/components/PayloadLivePreview.tsx`
- `src/providers/payload/components/PageUrl.tsx`

Ambos são componentes do **admin do Payload** — precisam de `useState`/`useEffect` e do contexto da UI do Payload, coisas que só existem no browser. Nem um único componente do site público é client.

**Porquê.** É o que permite ao `PayloadPageSource` falar diretamente com a base de dados (Cap. 8): não há `fetch`, não há endpoint, não há JSON a viajar. O componente corre no servidor, ao lado da base de dados, e envia HTML.

Duas consequências práticas para quando escreveres um módulo novo:

- Um módulo pode ser `async` e ir buscar dados. Não precisa de `useEffect` para nada.
- Assim que um módulo precisar de interatividade (um carrossel, um acordeão), põe-se `'use client'` **só no ficheiro mais pequeno possível** — a parte interativa — e deixa-se o resto no servidor. `'use client'` num ficheiro contamina tudo o que ele importa.

## 0.12 Se o TypeScript já valida tipos, para que serve o zod?

Se ficares só com uma ideia deste capítulo, que seja esta. É a que destranca metade do projeto.

**O TypeScript desaparece.** Todas as anotações de tipo são apagadas na compilação. Em execução não existe nenhuma verificação — nenhuma. O TypeScript verifica o **código que escreveste**, antes de correr; não verifica os **dados que chegam**, durante a execução.

Ou seja: dizer `const page: Page = await payload.find(...)` não verifica coisa nenhuma em execução. É uma afirmação de confiança. Se a base de dados devolver outra coisa, o TypeScript não dá por nada e a aplicação parte mais à frente, longe da causa.

E os dados deste projeto **vêm todos de fora**: de uma base de dados que um editor preencheu, ou de uma API de terceiros. Um editor pode apagar o título de um hero. Um campo pode ter sido acrescentado no CMS e ainda não existir nas linhas antigas. Nada disso o TypeScript apanha.

**O zod verifica em execução.** `src/modules/hero/Hero.schema.ts` (o ficheiro inteiro):

```ts
import { z } from 'zod';

export const heroSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
});
```

E o sítio onde isto é usado, `src/core/renderer/ModuleRenderer.tsx:28`:

```ts
data = definition.schema.parse(module.data);
```

O `.parse()` corre de verdade, com os dados reais na mão. Se o `title` não for uma string, atira.

**Dividir as águas:**

|                  | TypeScript           | zod                          |
| ---------------- | -------------------- | ---------------------------- |
| Quando           | ao escrever/compilar | em execução, com dados reais |
| Verifica         | o código             | os dados                     |
| Existe no bundle | não                  | sim                          |
| Serve para       | erros do programador | dados de fora                |

**Onde traçar a linha.** A regra do projeto é: **valida-se na fronteira, uma vez**. Os dados entram por `ModuleRenderer`, são validados ali, e daí para dentro confia-se — o `Hero.tsx` não volta a verificar se o `title` existe. Validar em todo o lado seria ruído; não validar de todo seria esperar que rebentasse.

Há uma peça engenhosa nisto, e vale a pena vê-la agora. O `core` **não conhece o zod**. Olha para `src/core/modules/Module.types.ts:11`:

```ts
export interface ModuleSchema<TData extends ModuleProps = ModuleProps> {
  parse(data: unknown): TData;
}
```

O core não pede um `z.ZodType`. Pede «uma coisa qualquer que tenha um método `parse`». Por acaso um schema do zod tem, e encaixa sem ninguém dizer nada — é o que se chama tipagem estrutural: em TypeScript, o que conta é a forma, não o nome. Se amanhã o projeto trocar de biblioteca de validação, o `core` não muda uma linha. É a mesma ideia do [0.2](#02-classe-abstrata-o-contrato-que-obriga), aplicada a uma dependência externa em vez de a um CMS.

> 🎯 **Decisão**
>
> O `core` define o mínimo de que precisa (`parse`) em vez de importar o tipo da biblioteca. Uma linha de código a mais, uma dependência a menos.

Duas notas antes de seguir, porque vão voltar:

- O `schema` é **opcional** em `Module` (`Module.types.ts:19` — repara no `?`). Um módulo registado sem schema não é validado de todo, e nesse caso o `data` chega ao componente sem ninguém ter confirmado nada. Voltamos a isto no Cap. 6.
- O que o `.parse()` faz quando falha depende de estarmos em desenvolvimento ou em produção, e essa assimetria é uma das melhores decisões do projeto. Cap. 10.

---

_Fim do Capítulo 0. Daqui para a frente é percurso: um pedido a entrar, e nós atrás dele._

---

# Cap. 1 — Chega o pedido

O percurso começa aqui. Alguém escreveu `https://osite.pt/en/sobre-nos` no browser. O Next.js recebe o pedido e tem de decidir que ficheiro o trata.

## 1.1 O mapa do `src/app/`

No App Router, **a estrutura de pastas é o routing**. Não há ficheiro de rotas nenhum: o caminho da pasta é o caminho da URL. Vale a pena ter o mapa todo à frente, porque é pequeno:

```
src/
├── proxy.ts                        ← corre antes de tudo; ver 1.6
└── app/
    ├── (frontend)/                     ← o site público
    │   ├── favicon.ico
    │   ├── layout.tsx                  ← o <html> do site
    │   ├── not-found.tsx               ← o 404
    │   ├── error.tsx                   ← erro dentro da página
    │   ├── global-error.tsx            ← erro no próprio layout
    │   ├── _lib/                       ← não são rotas
    │   │   ├── createMetadata.ts
    │   │   ├── resolvePage.ts
    │   │   └── resolveSite.ts
    │   ├── next/
    │   │   ├── preview/route.ts        ← liga o modo rascunho
    │   │   └── exit-preview/route.ts   ← desliga
    │   └── [[...segments]]/
    │       └── page.tsx                ← a página
    └── (payload)/                      ← o admin do CMS (gerado)
        ├── layout.tsx
        ├── custom.scss
        ├── admin/
        │   ├── [[...segments]]/page.tsx, not-found.tsx
        │   └── importMap.js
        └── api/[...slug]/route.ts      ← a API REST do Payload
```

Só ficheiros com **nomes especiais** viram rotas: `page.tsx` (uma página), `layout.tsx` (o invólucro), `route.ts` (um endpoint sem UI), mais os três boundaries `not-found`, `error` e `global-error`.

> 🎯 **Decisão**
>
> Os helpers estão numa pasta `_lib/`, e o prefixo `_` é o mecanismo do Next para tirar uma pasta do router. A alternativa era deixá-los soltos ao lado dos ficheiros de rota, que foi como estiveram — e o problema é que um `.ts` qualquer no meio das rotas não se distingue à vista de uma convenção do Next cujo nome ainda não reconheces. A regra passou a ser: **em `app/` só ficheiros de rota; o resto em `_lib/`**.
>
> O que é puro e não depende do Next não fica sequer no `_lib` — sai de `app/` de vez. Foi o caso do `isSafeRedirectPath`, que hoje vive em `core/routing/` ao lado das outras funções sobre caminhos.

> 📐 **Imposto pelo Next.js**
>
> Tudo em 1.1, 1.2 e 1.3 é convenção do framework. Não há aqui decisões do projeto — há o projeto a usar bem o que o Next impõe.

## 1.2 Route groups: pastas entre parênteses

`(frontend)` e `(payload)` são _route groups_. A regra é simples: **uma pasta entre parênteses não entra na URL**. O `page.tsx` que está em `(frontend)/[[...segments]]/` responde a `/en/sobre-nos`, não a `/frontend/en/sobre-nos`.

Servem para agrupar sem afetar o endereço. E aqui há uma razão bem concreta para os haver: **cada grupo tem o seu próprio `layout.tsx`**. O site e o admin do Payload não podem partilhar o mesmo `<html>` — o admin traz o seu CSS, a sua estrutura, o seu contexto. Com dois grupos, cada um manda no seu.

A pasta `(payload)` inteira é **gerada** pelo Payload e não se edita à mão. Se algo lá dentro parecer estranho, a resposta é «foi o Payload que escreveu assim».

## 1.3 `[[...segments]]`: uma rota para o site inteiro

Três formas parecidas, com significados diferentes:

| Pasta             | Chama-se               | Apanha                                     |
| ----------------- | ---------------------- | ------------------------------------------ |
| `[slug]`          | segmento dinâmico      | exatamente um segmento (`/sobre`)          |
| `[...slug]`       | catch-all              | um ou mais (`/a`, `/a/b`) — **não a raiz** |
| `[[...segments]]` | catch-all **opcional** | tudo, **incluindo a raiz** (`/`)           |

Os duplos parênteses retos são o que faz o `/` entrar. Sem eles era preciso um `page.tsx` à parte só para a homepage.

Para `/en/sobre-nos`, o Next entrega `segments = ['en', 'sobre-nos']`. Para `/`, entrega `undefined` — daí o `= []` que vais ver já a seguir.

> 🎯 **Decisão**
>
> Uma única rota trata o site inteiro. A alternativa era criar pastas no `app/` a espelhar as páginas do CMS — e isso é impossível de manter, porque as páginas nascem no CMS, não no repositório. Um editor cria uma página nova e ela funciona, sem deploy nenhum. É a consequência direta da ideia central do projeto: **uma página é descrita por dados, não por código**.

## 1.4 `layout.tsx`, linha a linha

`src/app/(frontend)/layout.tsx` — o layout de raiz do grupo. Antes de o ler, é preciso perceber **porque está onde está**, porque já esteve noutro sítio e a mudança custou o desenho de duas outras peças.

### Porque é que o layout está no topo do grupo

> 📐 **Imposto pelo Next.js**
>
> Quando se usam route groups como raízes separadas, o Next só monta o boundary do `not-found` e do `error` se encontrar um layout de raiz **no topo do grupo**.

O layout viveu durante algum tempo dentro do `[[...segments]]`, para poder ler os `params` e tirar de lá o idioma. Funcionava para as páginas — e não funcionava para mais nada: um 404 respondia com o invólucro interno do Next, `<html id="__next_error__">`, em vez do nosso. O `not-found.tsx` estava escrito e nunca aparecia.

Subir o layout resolve os boundaries e cria um problema: **a este nível não há `params`**. Um layout acima de qualquer segmento dinâmico não sabe que caminho está a ser servido, e portanto não sabe que idioma declarar no `<html lang>`.

A saída está em 1.6, e é um `proxy` que põe o caminho num header.

### O ficheiro

```tsx
interface LayoutProps {
  children: React.ReactNode;
}
```

- **`children`** — o que o Next injeta cá dentro. O tipo `React.ReactNode` cobre tudo o que se pode desenhar (elementos, texto, `null`, listas). Repara que não há `import React` no ficheiro: os tipos do React declaram um namespace `React` global, por isso `React.ReactNode` resolve sem import — o `jsx: 'react-jsx'` do `tsconfig` trata do resto.
- **Não há `params`.** É a consequência de estar no topo do grupo.

Agora o corpo:

```tsx
export default async function RootLayout({ children }: LayoutProps) {
  const { isEnabled: isDraft } = await draftMode();

  const site = await resolveSite();

  const pathname = (await headers()).get(PATHNAME_HEADER) ?? '';
```

- **`async function`** — um Server Component pode ser assíncrono ([0.11](#011-server-components-e-client-components)). Um componente de browser não pode.
- **`const { isEnabled: isDraft } = await draftMode()`** — destructuring **com renomeação**: tira-se `isEnabled` e passa a chamar-se `isDraft` cá dentro. É só legibilidade: `isDraft` diz o que é; `isEnabled`, sozinho, não diz de quê. O modo rascunho é o que faz a diferença entre ver o site publicado e ver o que está por publicar (Cap. 9).

  > 📐 **Imposto pelo Next.js**
  >
  > A partir do Next 15, `params`, `searchParams`, `cookies()`, `headers()` e `draftMode()` são assíncronos. A razão é o streaming: o Next quer começar a mandar HTML antes de saber tudo sobre o pedido.

- **`headers().get(PATHNAME_HEADER)`** — o caminho do pedido, posto lá pelo `proxy`. O `?? ''` cobre o caso de o header não existir, que acontece se alguém mexer no `matcher`.

E o que sai:

```tsx
const { locale } = resolveRoute({
  segments: pathname.split('/').filter(Boolean),
  locales: site.locales,
  defaultLocale: site.defaultLocale,
});

const Preview = provider.preview;

return (
  <html lang={locale}>
    <body>
      {children}

      {isDraft && Preview ? <Preview /> : null}
    </body>
  </html>
);
```

- **`const Preview = provider.preview`** — e repara na **maiúscula**. Não é estética: em JSX, `<preview />` seria interpretado como uma etiqueta HTML chamada `preview`, e `<Preview />` como um componente. Guardar numa variável com maiúscula é a forma de renderizar um componente que se recebeu como dado. O `provider.preview` é opcional — só o provider do Payload traz um (Cap. 7).
- **`{isDraft && Preview ? <Preview /> : null}`** — o componente de live preview só entra em modo rascunho, e só se o provider tiver um. Em produção, para um visitante normal, não vai nada disto para o HTML.

> 🎯 **Decisão**
>
> **O `lang` vem do locale da rota, não da página.** O layout podia chamar o `resolvePage` e usar `meta.locale`, que foi o que fez enquanto viveu dentro do segmento. Mas o `resolveRoute` é uma função pura sobre dados que o `resolveSite()` já trouxe — e assim o layout não paga uma consulta à página só para escrever um atributo.
>
> Há um segundo motivo, e é o que fecha a questão: quando a página **não** resolve, o que se desenha é o `not-found.tsx`. Não há `meta.locale` nenhum, e o locale da rota continua a descrever correctamente a página que o visitante pediu. Um `<html>` sem `lang` deixa um leitor de ecrã sem saber em que língua ler (WCAG 3.1.1), exatamente nas páginas mais indexadas.

Repara no que **não** se usa aqui: o cabeçalho `Accept-Language` do visitante. É uma tentação, e está errada — o `lang` descreve a língua **do conteúdo**, não a preferência de quem visita. Dizer `lang="en"` a um visitante inglês por causa de um cabeçalho faria o leitor de ecrã ler texto português com voz inglesa. (O `Accept-Language` tem um uso legítimo — negociar para que idioma **redirecionar** — mas isso é routing, e vive noutro sítio.)

O `resolveSite()` está envolvido no `cache()` do React ([2.2](#22-o-que-o-cache-garante--e-o-que-não-garante)) e é o mesmo que o `resolvePage` usa por dentro, portanto este `await` não custa uma segunda consulta.

Há aqui um custo que vale a pena nomear já: **`draftMode()` e `headers()` tornam todas as rotas dinâmicas**. O Next não pode gerar nada estaticamente se o resultado depende de um cookie ou de um header. Guarda a ideia — voltamos a ela em [2.2](#22-o-que-o-cache-garante--e-o-que-não-garante).

### Os três boundaries

Ao lado do layout estão os três ficheiros que só funcionam por ele estar ali:

| Ficheiro           | Apanha                                |
| ------------------ | ------------------------------------- |
| `not-found.tsx`    | o `notFound()` chamado pela página    |
| `error.tsx`        | um erro dentro da página              |
| `global-error.tsx` | um erro no **próprio layout de raiz** |

O `global-error.tsx` é a única excepção à regra de que só o layout de raiz emite `<html>`: quando o layout rebenta, não há `<html>` onde desenhar o fallback, portanto ele traz o seu.

## 1.5 `page.tsx`, linha a linha

`src/app/(frontend)/[[...segments]]/page.tsx` exporta **duas** coisas. O Next chama as duas, para o mesmo pedido.

**Primeira — os metadados**, para o `<head>`:

```tsx
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { segments = [] } = await params;

  const resolved = await resolvePage(segments);

  if (!resolved) {
    return {};
  }

  return createMetadata(resolved.page.meta);
}
```

`generateMetadata` é um nome reservado. O `return {}` quando não resolve deixa o Next usar os valores por omissão — não vale a pena inventar título para uma página que não existe.

O `createMetadata` (`src/app/(frontend)/_lib/createMetadata.ts`) é a tradução entre o vocabulário do projeto e o do Next:

```ts
const openGraphTitle = meta.ogTitle ?? meta.title;
const openGraphDescription = meta.ogDescription ?? meta.description;

return {
  title: meta.title,
  description: meta.description,
  openGraph: { title: openGraphTitle, description: openGraphDescription },
  robots: { index: !meta.noIndex, follow: !meta.noFollow },
};
```

Três coisas a reter. O `??` (_nullish coalescing_) só entra se o lado esquerdo for `null` ou `undefined` — ao contrário do `||`, que também entra com `''` ou `0`; aqui isso importa, porque um `ogTitle` vazio deve cair para o `title` mas não deve ser confundido com um título legítimo. O padrão `ogTitle ?? title` é a regra editorial: quem preenche o campo de Open Graph manda; quem não preenche herda. E `robots: { index: !meta.noIndex }` é uma **inversão deliberada** — no CMS o campo é `noIndex` (marcar para esconder, que é como o editor pensa), no Next é `index` (afirmar que se quer indexar). Este ficheiro existe para essa tradução, e é por isso que o tipo `Meta` do projeto ([`src/core/pages/Page.types.ts:3`](../src/core/pages/Page.types.ts)) não precisa de se parecer com o `Metadata` do Next.

**Segunda — a página**:

```tsx
export default async function Page({ params }: PageProps) {
  const { segments = [] } = await params;

  const resolved = await resolvePage(segments);

  if (!resolved) {
    notFound();
  }

  return <PageRenderer page={resolved.page} foundation={foundation} />;
}
```

- **`notFound()`** vem do `next/navigation` e **atira uma exceção** — nunca devolve. É por isso que a linha a seguir pode usar `resolved.page` sem `?`: o TypeScript sabe, pela assinatura (`never`), que o código só chega ali se `resolved` existir. Não é preciso `else`.
- **`foundation`** é importado do caminho completo (`@/core/foundation/foundation`), não do barrel — é aqui que a aplicação real é tocada, exatamente como explicado em [0.9](#09-barrels-indexts-e-a-regra-dos-efeitos-secundários).
- E é aqui que se vê a [injeção de dependências](#010-injeção-de-dependências) em ação: o `page.tsx` é a fronteira que conhece o singleton e o entrega ao `PageRenderer`, que a partir daí não sabe de onde veio.

Repara no que acabámos de ver: **`resolvePage(segments)` foi chamado duas vezes** para o mesmo pedido — uma no `generateMetadata`, outra no `Page`. E o `resolveSite()`, que o `resolvePage` usa por dentro, foi chamado uma terceira vez pelo layout. É o assunto do próximo capítulo.

## 1.6 `proxy.ts`: o caminho até ao layout

`src/proxy.ts` — o ficheiro que resolve o problema que 1.4 deixou em aberto.

> 📐 **Imposto pelo Next.js**
>
> Em Next 16 a convenção `middleware` está **depreciada**. O ficheiro chama-se `proxy` e exporta uma função `proxy`. O Next avisa no arranque e oferece um codemod.

```ts
export const PATHNAME_HEADER = 'x-pathname';

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);

  headers.set(PATHNAME_HEADER, request.nextUrl.pathname);

  return NextResponse.next({ request: { headers } });
}
```

Cinco linhas, e o que importa é o que **não** faz.

> 🎯 **Decisão**
>
> **O proxy não reescreve nem redirecciona.** A solução clássica para um site multilingue é reescrever `/sobre-nos` para `/pt/sobre-nos` e pôr o locale como segmento real de rota — assim o layout de raiz recebe-o em `params` e nada disto era preciso.
>
> Não foi o caminho escolhido, e a razão é o contrato dos providers: **o locale por omissão é uma resposta do provider** (Cap. 7). Para reescrever, o proxy teria de saber qual é — e teria de o saber sem perguntar ao provider, porque uma reescrita acontece antes de qualquer coisa correr. Isso obrigaria a lista de locales a sair do CMS para uma constante de build.
>
> Ao não decidir nada, o proxy não precisa de saber nada. O default continua a viver no provider, as URLs ficam como estão, e o `createPagePath` e os seus testes sobrevivem intactos.

O `matcher` exclui o admin, a API do Payload, as rotas `next/`, os assets e os ficheiros com extensão. Como não se reescreve nada, apanhar o resto seria inofensivo — mas é trabalho por pedido a troco de nada.

**A armadilha a conhecer:** se a exclusão de `next/` desaparecer do `matcher`, as rotas de preview passam a ser tocadas pelo proxy e o Live Preview deixa de funcionar sem dizer porquê.

---

# Cap. 2 — `resolvePage` e o `cache()` do React

Ficheiro: `src/app/(frontend)/_lib/resolvePage.ts`.

## 2.1 O problema: vários sítios, a mesma pergunta

O Next chama o `layout.tsx`, o `generateMetadata` e o `Page` de forma independente. Não há forma de lhes passar um valor de um para o outro: não são pai e filho, são entradas separadas que o framework invoca.

Só que precisam todos das mesmas respostas. O `generateMetadata` e o `Page` querem a página; o layout quer o site. Sem defesa, seriam várias idas à base de dados por pedido — e mais do que parece, porque cada resolução de página faz duas consultas: o site e a página. Para desenhar uma página.

São por isso **duas** funções em cache, e não uma: o [resolveSite](<../src/app/(frontend)/_lib/resolveSite.ts>), que o layout usa sozinho, e o [resolvePage](<../src/app/(frontend)/_lib/resolvePage.ts>), que o usa por dentro.

A solução, `resolvePage.ts:19`:

```ts
const resolve = cache(async (path: string): Promise<ResolvedPage | undefined> => {
```

`cache` vem do **React**, não do Next (`import { cache } from 'react'`, linha 1). Embrulha uma função e memoriza o resultado por argumentos.

Dentro dela está o percurso completo da resolução:

```ts
const { isEnabled: isDraft } = await draftMode();

const site = await foundation.site.getSite();

const route = resolveRoute({
  segments: path ? path.split('/') : [],
  locales: site.locales,
  defaultLocale: site.defaultLocale,
});

const page = await foundation.page.getPage(route.path, route.locale, { draft: isDraft });

if (!page) {
  return undefined;
}

return { page, route, site };
```

A ordem não é arbitrária, e é a coisa mais importante deste ficheiro: **é preciso saber o site antes de conseguir ler a URL**. Para perceber que `/en/sobre-nos` quer dizer «locale `en-GB`, caminho `sobre-nos`», é preciso saber que locales é que este site tem, e qual deles não leva prefixo. Essas duas respostas estão no CMS. Daí `getSite()` primeiro, `resolveRoute` depois, `getPage()` no fim.

> ✅ **Corrigido**
>
> Houve aqui um segundo `if (!route) return undefined`. O `resolveRoute` devolvia `undefined` quando a lista de locales vinha vazia, e isso traduzia-se num 404 — indistinguível de «esta página não existe». Bastava o global do CMS estar por preencher para o **site inteiro** responder 404 em silêncio.
>
> Hoje o `resolveRoute` resolve sempre. Um locale que a origem não sirva falha à frente, no `getPage`, onde a falha é legível.

## 2.2 O que o `cache()` garante — e o que não garante

Esta distinção é fácil de trocar e as consequências são grandes.

**Garante:** dentro de **um pedido HTTP**, chamar `resolve('en/sobre-nos')` duas vezes executa a função uma vez. A segunda recebe a mesma Promise. Duas chamadas, uma consulta. O mesmo vale para o `resolveSite`, que é chamado pelo layout e por dentro do `resolvePage`.

**Não garante nada entre pedidos.** O próximo visitante começa do zero. Não é um cache de dados — é uma deduplicação com o tempo de vida de um pedido.

Vale a pena dizer o que isto significa em conjunto com o que vimos em [1.4](#14-layouttsx-linha-a-linha): como o `layout.tsx` chama `draftMode()` **e** `headers()`, todas as rotas são dinâmicas. Não há uma única página estática no frontend, e o `cache()` do React não muda isso — impede que as consultas sejam mais de duas por pedido, não impede que sejam duas.

O que impede é a camada abaixo. O provider do Payload guarda o resultado entre pedidos com `unstable_cache`, e é por isso que a segunda visita não volta ao Postgres — ver [8.6](#86-a-cache-o-que-sobrevive-ao-pedido). São dois mecanismos com nomes parecidos e âmbitos diferentes: o `cache()` do React dura um pedido, o `unstable_cache` do Next dura até alguém invalidar a tag.

> 🎯 **Decisão**
>
> **O frontend é SSR, e isso está decidido.** A alternativa — pôr o locale como segmento real de rota e pré-construir as páginas com `generateStaticParams` — foi ponderada e rejeitada: obrigava o locale por omissão a levar prefixo na URL.
>
> A consequência é que o desempenho se resolve com cache **ao nível dos dados**, e não com HTML pré-construído.

## 2.3 Porque há duas funções e não uma

No fim do ficheiro, `resolvePage.ts:39`:

```ts
export function resolvePage(segments: string[]): Promise<ResolvedPage | undefined> {
  return resolve(segments.join('/'));
}
```

A função em cache é `resolve` e recebe uma **string**. A exportada é `resolvePage` e recebe um **array**. Parece burocracia. Não é — é a única coisa que faz o cache funcionar.

O `cache()` do React compara os argumentos por **identidade** (como `===`). E dois arrays com o mesmo conteúdo não são o mesmo array:

```js
['en', 'sobre-nos'] === ['en', 'sobre-nos']; // false
```

O `layout.tsx` faz o seu `await params` e obtém um array. O `page.tsx` faz o dele e obtém **outro** array, com o mesmo conteúdo mas referência diferente. Se a função em cache recebesse o array diretamente, o React via dois argumentos diferentes e executava tudo duas vezes. O cache existia e nunca acertava.

Ao juntar em `'en/sobre-nos'`, a chave passa a ser uma string — e strings comparam-se por valor. `'en/sobre-nos' === 'en/sobre-nos'` é `true`, venha de onde vier.

> 🎯 **Decisão**
>
> A camada exterior existe para **normalizar a chave do cache**. É o tipo de detalhe que, apagado por engano num refactor, não parte teste nenhum e nunca dá erro — só triplica as consultas em silêncio. Se mexeres aqui, mexe com cuidado.

## 2.4 A forma do `ResolvedPage`

```ts
export interface ResolvedPage {
  page: PageDefinition;
  route: ResolvedRoute;
  site: SiteDefinition;
}
```

Devolve os três resultados intermédios, não só a página. A razão prática é que já estão calculados: quem quiser o locale ativo (para um seletor de idioma) ou o nome do site (para o título) tem-nos ali, sem pedir nada de novo.

Sendo honesto sobre o estado atual: **hoje ninguém usa o `route` nem o `site`**. Só o `page` é consumido, no layout e no `page.tsx`. Não é código morto — é a forma certa para o que aí vem (a navegação e o rodapé, previstos no `PageDefinition` e ainda por implementar) — mas convém saberes que, neste momento, dois dos três campos estão à espera.

---

# Cap. 3 — `resolveRoute`: da URL para `{locale, path}`

Ficheiro: `src/core/routing/resolveRoute.ts`. Repara na pasta: estamos no **`core`**. Esta função não sabe o que é o Next, o que é uma URL, nem o que é um CMS. Recebe um array de strings, uma lista de locales e o locale por omissão, e devolve um objeto. Podia correr num script de linha de comandos.

## 3.1 A função, linha a linha

O que entra e o que sai:

```ts
interface ResolveRouteOptions {
  segments: string[];
  locales: string[];
  defaultLocale: string;
}

export interface ResolvedRoute {
  locale: string;
  path: string;
}
```

Um único parâmetro em forma de objeto, em vez de três soltos. É o mesmo raciocínio do `GetPageOptions` ([0.2](#02-classe-abstrata-o-contrato-que-obriga)): no sítio da chamada lê-se `resolveRoute({ segments, locales, defaultLocale })` e não há dúvida sobre qual é qual; e acrescentar um campo amanhã não parte as chamadas de hoje. O `defaultLocale` foi precisamente um campo acrescentado assim.

O corpo:

```ts
const [firstSegment, ...rest] = segments;

const requestedLocale = locales.find(
  (locale) => getLocaleSegment(locale) === firstSegment?.toLowerCase(),
);

if (requestedLocale) {
  return {
    locale: requestedLocale,
    path: rest.join('/'),
  };
}

return {
  locale: defaultLocale,
  path: segments.join('/'),
};
```

- **`const [firstSegment, ...rest] = segments`** — destructuring de array: o primeiro elemento para um lado, os restantes para outro. Com `['en', 'sobre-nos']` fica `firstSegment = 'en'` e `rest = ['sobre-nos']`.
- **`firstSegment?.toLowerCase()`** — o `?.` protege contra `segments` estar vazio (a raiz). Sem ele, `/` rebentava.
- **A pergunta central:** o primeiro segmento é um locale? Percorre-se a lista de locales do site e vê-se se algum, reduzido à sua forma curta, bate certo com ele.
- **Se é** (`/en/sobre-nos`): o locale é o que se encontrou, e o caminho é o **resto** — `sobre-nos`. O locale é retirado do caminho.
- **Se não é** (`/sobre-nos`): usa-se o locale por omissão, e o caminho são **todos** os segmentos.

O detalhe que faz isto encaixar com o resto do sistema: o `path` que sai daqui **nunca tem locale**. É o que a assinatura do `PageSource.getPage(path, locale)` pede — o caminho e o idioma como duas coisas separadas ([0.2](#02-classe-abstrata-o-contrato-que-obriga)). A URL mistura-os; esta função desmistura-os; daí para dentro, ninguém volta a lidar com a mistura.

## 3.2 `getLocaleSegment`: de `pt-PT` para `pt`

`src/core/routing/getLocaleSegment.ts` — três linhas:

```ts
export function getLocaleSegment(locale: string): string {
  return locale.split('-')[0].toLowerCase();
}
```

Existe porque os locales têm duas formas. Internamente e no Payload são códigos BCP 47 completos: `pt-PT`, `en-GB`. Nos URLs quer-se a forma curta: `/pt/`, `/en/`. Esta função converte de uma para a outra, e é a **única** que o faz — assim a regra vive num sítio só, e mudar de ideias (usar `pt-pt` no URL, por exemplo) é mudar aqui.

O `createPagePath` — a outra função de routing, que constrói caminhos em vez de os ler — chama esta. Vale a pena saber porque isso é digno de nota:

> ✅ **Corrigido**
>
> O `createPagePath` tinha a mesma expressão escrita à mão (`locale.split('-')[0]?.toLowerCase() ?? ''`), com uma guarda a mais, em vez de chamar o `getLocaleSegment`. Nenhuma das duas versões estava errada — `split()` devolve sempre pelo menos um elemento, logo o `[0]` nunca é `undefined` em execução — mas ter a mesma regra escrita em dois sítios com formas diferentes é precisamente o que esta função existia para evitar. Se um dia mudar a forma dos segmentos de locale no URL, agora muda-se num sítio só.

(Se algum dia se ligar a opção `noUncheckedIndexedAccess` no `tsconfig` — está no [`TODO.md`](TODO.md) —, o TypeScript passa a exigir a guarda também aqui.)

## 3.3 O locale por omissão é declarado, não adivinhado

O `defaultLocale` entra como argumento, e vem do `SiteDefinition` — ou seja, do provider. É o único locale que não leva prefixo no URL. Num site `['pt-PT', 'en-GB']` com `defaultLocale: 'pt-PT'`, o `/sobre-nos` é português e o `/en/sobre-nos` é inglês. Não existe `/pt/sobre-nos`.

> ✅ **Corrigido**
>
> Esta função fazia `const defaultLocale = locales[0]` e, se a lista viesse vazia, devolvia `undefined` — que o `resolvePage` traduzia num 404. Resultado: bastava o global do CMS estar por preencher para **o site inteiro responder 404, em silêncio**, de forma indistinguível de «esta página não existe». Era o pior sítio onde se podia estar quando algo assim acontece em produção.
>
> Duas coisas mudaram. O `SiteDefinition` passou a **declarar** o `defaultLocale` em vez de o esconder atrás da convenção `locales[0]` — que era lida em quatro sítios diferentes, livres de divergir entre si. E esta função deixou de poder falhar: resolve sempre, e um locale que a origem não sirva falha à frente no `getPage`, onde a falha é legível.

Continua a haver uma consequência a que convém estar atento: no provider Payload o `defaultLocale` **é** derivado da primeira posição de `enabledLocales`, que é um campo ordenável no admin. **Reordenar os locales no CMS muda todos os URLs do site.** É uma decisão razoável — a ordem é visível a quem edita, e o campo diz que o primeiro é o default — mas paga-se em SEO se alguém a mexer sem saber. A diferença face a antes é que agora isso é uma escolha declarada de um provider, e não uma regra escondida no `core`.

Chegámos ao fim da resolução da rota. Temos `{ locale: 'en-GB', path: 'sobre-nos' }` e uma pergunta por responder: quem é o `foundation` a quem o `resolvePage` pediu o site e a página?

---

# Cap. 4 — `Foundation`, o centro de composição

O `resolvePage` chamou `foundation.site.getSite()` e `foundation.page.getPage(...)`. Está na altura de abrir a caixa.

## 4.1 O objeto de três campos

`src/core/foundation/Foundation.types.ts` — o ficheiro inteiro:

```ts
export interface Foundation {
  modules: ModuleRegistry;
  page: PageSource;
  site: SiteSource;
}
```

É tudo. A aplicação inteira, do ponto de vista do `core`, são três coisas:

- **`modules`** — o catálogo de blocos que este site sabe desenhar (Cap. 5).
- **`page`** — de onde vêm as páginas. Do tipo **abstrato** `PageSource`, não de uma implementação concreta ([0.2](#02-classe-abstrata-o-contrato-que-obriga)).
- **`site`** — de onde vêm as definições globais (nome, locales).

Este tipo é o sítio onde a regra de ouro do projeto se torna verificável. Lê os imports do ficheiro: `ModuleRegistry`, `PageSource`, `SiteSource`. Todos do `core`. **Não há aqui nem uma palavra sobre Payload, Postgres ou Next.js** — e como é este o objeto que atravessa a aplicação toda, nada disso pode entrar no `core` por esta porta.

Ao padrão de reunir as dependências de uma aplicação num só objeto chama-se _composition root_ — a raiz onde tudo é composto. Tudo o resto recebe-o já montado ([0.10](#010-injeção-de-dependências)).

## 4.2 Fábrica e instância, em ficheiros separados

`src/core/foundation/createFoundation.ts`:

```ts
interface CreateFoundationOptions {
  page: PageSource;
  site: SiteSource;
}

export function createFoundation({ page, site }: CreateFoundationOptions): Foundation {
  const foundation: Foundation = {
    modules: new ModuleRegistry(),
    page,
    site,
  };

  registerModules(foundation);

  return foundation;
}
```

Repara na assimetria: **`page` e `site` são recebidos; `modules` é criado aqui.** Não é descuido. As fontes de dados dependem do CMS escolhido, e o `core` não pode decidir isso — têm de vir de fora. O registo de módulos, esse, é sempre um `ModuleRegistry` vazio a preencher; não há por onde variar.

A seguir, `src/core/foundation/foundation.ts` — quatro linhas de código:

```ts
import { provider } from '@/providers/provider';

import { createFoundation } from './createFoundation';

export const foundation = createFoundation({
  page: provider.page,
  site: provider.site,
});
```

É aqui, e só aqui, que o `core` e o mundo real se encontram. A função `createFoundation` continua pura — dá-se-lhe peças, devolve um objeto. Este ficheiro é que decide quais são as peças reais.

Já vimos o porquê da separação em [0.8](#08-módulos-esm-importar-é-executar-e-o-singleton): os testes precisam da fábrica sem a instância. Vale a pena ver agora o outro lado — o preço. Importar este ficheiro desencadeia isto:

```
foundation.ts
  └─ provider.ts               → cria o provider (singleton)
      └─ createProvider.ts
          ├─ payload/provider.ts   → new PayloadPageSource(), new PayloadSiteSource()
          │   └─ @payload-config   → a config toda, o adapter de Postgres, as collections
          ├─ api/provider.ts
          └─ mocks/provider.ts
  └─ createFoundation.ts
      └─ registerModules()     → import * as modules → todos os módulos
```

Um `import` de uma linha põe a aplicação inteira de pé. E há aqui um pormenor que só se percebe olhando para o `createProvider.ts`: os **três** providers são importados, sempre, mesmo que só um vá ser usado. Correr com `PROVIDER=mock` continua a carregar a config do Payload e o adapter de Postgres, porque o import é estático. Voltamos a isto no Cap. 7.

E é por causa desta cascata que o `foundation.ts` está **fora do barrel** ([0.9](#09-barrels-indexts-e-a-regra-dos-efeitos-secundários)). Se estivesse dentro, um `import type { Foundation }` inocente arrastava isto tudo.

## 4.3 `registerModules`: registo por convenção

`src/core/setup/registerModules.ts` — nove linhas, e é uma das partes mais engenhosas do projeto:

```ts
import * as modules from '@/modules';

export function registerModules(foundation: Foundation): void {
  Object.values(modules).forEach((module) => {
    foundation.modules.register(module);
  });
}
```

- **`import * as modules`** — o _namespace import_: em vez de trazer nomes específicos, traz **um objeto com tudo o que aquele ficheiro exporta**. Se `src/modules/index.ts` exporta `heroModule`, então `modules` é `{ heroModule: {...} }`.
- **`Object.values(modules)`** — as exportações como array.
- **`.forEach(... register(module))`** — todas registadas.

O resultado é que **acrescentar um módulo é acrescentar uma linha a um barrel**. Não há um sítio central onde se listem módulos, não há um `register()` a chamar à mão, e não é preciso tocar no renderer nem no `core`. `src/modules/index.ts` é, hoje, isto:

```ts
export { heroModule } from './hero';
```

> 🎯 **Decisão**
>
> Registo por convenção em vez de configuração explícita. O custo é que o mecanismo é implícito — quem não conhecer esta função não percebe como é que o `heroModule` foi lá parar. O ganho é que acrescentar um módulo nunca obriga a mexer em código partilhado, e portanto nunca gera conflitos de merge nem tentações de meter um `if` no renderer.

**Um pormenor que parece estilo e é estrutural.** Repara que o barrel dos módulos usa uma exportação **nomeada** (`export { heroModule }`) e não `export *`. Compara com o barrel de dentro do hero, `src/modules/hero/index.ts`, que usa `export *`:

```ts
export * from './Hero';
export * from './Hero.module';
export * from './Hero.types';
```

Se `src/modules/index.ts` fizesse `export * from './hero'`, o objeto `modules` passava a conter **também** a função `Hero` (o componente React) além do `heroModule`. E o `Object.values` entregava-a ao `register()`, que ia ler `module.alias` de um componente React, obter `undefined`, e registar um módulo com a chave `undefined` — ou rebentar de forma confusa no arranque, sem dizer porquê.

O `register` não tem qualquer verificação a proteger disto. A única coisa que separa o projeto desse erro é aquele `export { heroModule }` ser nomeado. Quando acrescentares o segundo módulo, **exporta só o `*Module`**.

---

# Cap. 5 — `Registry` e `ModuleRegistry`

Duas classes, 48 linhas ao todo, e são o motor do sistema de módulos. Já usámos partes delas no Capítulo 0 para explicar generics e visibilidade; agora vemo-las inteiras.

## 5.1 `Registry`, membro a membro

`src/core/registry/Registry.ts`:

```ts
export class Registry<TKey, TValue> {
  protected readonly items = new Map<TKey, TValue>();
```

**Porquê um `Map` e não um objeto normal?** Um `{}` em JavaScript aceita só strings e símbolos como chave, e vem com bagagem herdada do `Object.prototype` — uma chave chamada `constructor` ou `toString` dá resultados absurdos. Um `Map` aceita qualquer tipo de chave, não tem heranças, tem `size`, e itera pela ordem de inserção. Para um registo genérico em que a chave é um parâmetro de tipo (`TKey`), é a estrutura certa.

O `protected readonly` está explicado em [0.5](#05-protected-private-readonly).

```ts
  protected add(key: TKey, value: TValue): void {
    if (this.items.has(key)) {
      throw new Error(`Registry already contains key "${String(key)}".`);
    }

    this.items.set(key, value);
  }
```

O `String(key)` na mensagem existe porque `TKey` pode ser qualquer coisa — pôr um valor arbitrário dentro de uma template string podia rebentar (um `Symbol`, por exemplo, atira se for convertido implicitamente). `String()` converte sempre, sem atirar.

E os métodos públicos:

```ts
  get(key: TKey): TValue | undefined
  has(key: TKey): boolean
  remove(key: TKey): void      // atira se a chave não existir
  clear(): void
  getAll(): TValue[]           // return [...this.items.values()]
```

Duas observações. O `get` devolve `TValue | undefined` — **não atira**. Quem chama tem de lidar com a ausência, e o TypeScript obriga-o a isso. É a decisão certa: um módulo em falta não deve derrubar a aplicação, deve ser tratado (Cap. 10). Já o `remove` **atira**, porque apagar uma coisa que não existe é sempre um erro de programação, nunca um caso normal.

O `getAll` devolve `[...this.items.values()]` — um array **novo**, por espalhamento. Se devolvesse o iterador do `Map`, quem recebesse podia consumi-lo uma vez só, e mexer nele mexia no registo. Copiar é mais seguro e, com dezenas de módulos, o custo é irrelevante.

## 5.2 Porque rebenta em vez de sobrescrever

Volta à linha do `throw` no `add`. Havia três hipóteses:

1. **Sobrescrever em silêncio** — o comportamento normal de um `Map`. Dois módulos com o mesmo alias: ganha o último. O primeiro desaparece e ninguém dá por nada.
2. **Ignorar o segundo** — ganha o primeiro. Mesmo problema, ao contrário.
3. **Atirar** — foi o escolhido.

> 🎯 **Decisão**
>
> Falha no arranque, alto e claro. Dois módulos com o mesmo `alias` é sempre um erro — ou é copy-paste, ou é uma colisão de nomes que ia dar bugs impossíveis de perceber (uma página desenharia o módulo errado, dependendo da ordem de importação). E como o registo acontece no arranque, o erro aparece assim que a aplicação sobe, não a meio de um pedido de um utilizador. É a diferença entre um deploy que falha e um site que desenha coisas erradas em silêncio.

## 5.3 `ModuleRegistry`: mecanismo e política

`src/core/registry/ModuleRegistry.ts` — treze linhas:

```ts
export class ModuleRegistry extends Registry<string, Module> {
  register<TProps extends ModuleProps>(module: Module<TProps>): void {
    this.add(module.alias, module);
  }

  getByAlias(alias: string): Module | undefined {
    return this.get(alias);
  }
}
```

A linha do `extends` fixa os generics: as chaves são `string`, os valores são `Module` ([0.4](#04-generics-tkey-tvalue)).

**`register` é o coração da divisão de responsabilidades.** O `Registry` sabe guardar pares chave/valor. Não sabe — e não deve saber — que a chave de um módulo é o `alias` dele. Isso é conhecimento de domínio, e vive aqui. Como o `add` é `protected` ([0.5](#05-protected-private-readonly)), **não há maneira** de registar um módulo debaixo de outra chave. A regra não é uma convenção que se possa esquecer; é uma impossibilidade.

O `<TProps extends ModuleProps>` na assinatura permite passar um `Module<HeroProps>` (concreto) onde se guarda um `Module` (genérico), sem casts e sem queixas do TypeScript.

**`getByAlias` não faz nada** que o `get` já não fizesse. Existe pelo nome. No sítio da chamada, em `ModuleRenderer.tsx:14`, lê-se:

```ts
const definition = foundation.modules.getByAlias(module.alias);
```

com `get(...)` leria-se igualmente bem, mas `getByAlias` diz que aquela string não é uma chave qualquer — é um alias de módulo, o mesmo alias que vem do CMS. Um método de uma linha a pagar-se em legibilidade.

---

# Cap. 6 — Módulos

Chegámos ao conceito central. Um **módulo** é um bloco de conteúdo: um hero, um carrossel, um formulário. O CMS diz que blocos é que uma página tem e com que dados; o registo diz que componente React corresponde a cada um.

## 6.1 Definição e instância: a distinção central

Se houver uma confusão a evitar neste projeto, é esta. Há **dois** tipos com nomes parecidos e papéis opostos:

|                 | `Module`                               | `ModuleInstance`                           |
| --------------- | -------------------------------------- | ------------------------------------------ |
| O que é         | a **definição** do tipo de bloco       | uma **ocorrência** concreta numa página    |
| Quantos existem | um por tipo (um `hero`, um `carousel`) | tantos quantos os blocos das páginas todas |
| Onde nasce      | no código, em `Hero.module.ts`         | nos dados, vindo do CMS                    |
| Onde vive       | no `ModuleRegistry`                    | dentro de um `PageDefinition`              |
| Tem             | `alias`, `name`, `component`, `schema` | `id`, `alias`, `name?`, `data`             |
| Sabe desenhar?  | sim — tem o componente                 | não — só tem os dados                      |

Uma analogia que costuma ajudar: `Module` é a receita, `ModuleInstance` é o prato. Há uma receita de hero; pode haver dezenas de heros pelo site fora, todos com textos diferentes.

O que os liga é o **`alias`**, presente nos dois. O `ModuleRenderer` recebe uma instância, lê-lhe o `alias`, procura a definição com esse alias no registo, e junta as duas metades: os dados de uma, o componente da outra. É literalmente isto que o Cap. 10 vai mostrar.

## 6.2 Os tipos, um a um

`src/core/modules/Module.types.ts` — 27 linhas que definem o contrato todo.

```ts
export type ModuleProps = object;
```

Um alias para «qualquer coisa que não seja um primitivo». É o mínimo que se pode exigir de props de um componente. Serve de limite superior nos generics — `<TProps extends ModuleProps>` quer dizer «TProps tem de ser um objeto».

É também **o ponto mais fraco da tipagem do projeto**, e mais vale saberes já: `object` aceita praticamente tudo. Não há aqui nenhuma garantia de que os dados que chegam correspondem ao que o componente espera. Quem dá essa garantia é o zod, em execução ([0.12](#012-se-o-typescript-já-valida-tipos-para-que-serve-o-zod)). Guarda a ideia para [6.4](#64-createmodulecomponent-o-adaptador-e-onde-ele-mente).

```ts
export type ModuleComponent<TProps extends ModuleProps = ModuleProps> = (
  props: TProps,
) => ReactNode;

export type RuntimeModuleComponent = (props: ModuleProps) => ReactNode;
```

Duas assinaturas de componente, e a diferença entre elas é a razão de existir do adaptador de [6.4](#64-createmodulecomponent-o-adaptador-e-onde-ele-mente):

- **`ModuleComponent<HeroProps>`** — o que tu escreves. Recebe props concretas e tipadas.
- **`RuntimeModuleComponent`** — o que o registo guarda. Recebe `ModuleProps`, ou seja, um objeto qualquer.

Tem de ser assim porque o registo guarda módulos de tipos diferentes na mesma estrutura. Um `Map<string, Module<HeroProps>>` não podia guardar um `Module<CarouselProps>`. Ao nível do registo, as props têm de ser genéricas.

```ts
export interface ModuleSchema<TData extends ModuleProps = ModuleProps> {
  parse(data: unknown): TData;
}
```

O contrato mínimo de um validador — já discutido em [0.12](#012-se-o-typescript-já-valida-tipos-para-que-serve-o-zod). O `core` não importa o zod; descreve a forma de que precisa e deixa o zod encaixar sozinho. Repara no `data: unknown`: **não** é `any`. `unknown` obriga quem recebe a verificar antes de usar; `any` desliga o TypeScript. Aqui é exatamente o que se quer, porque nesta fronteira não se sabe mesmo o que vem.

```ts
export interface Module<TProps extends ModuleProps = ModuleProps> {
  alias: string;
  name: string;
  component: RuntimeModuleComponent;
  schema?: ModuleSchema<TProps>;
}
```

Campo a campo:

- **`alias`** — a chave. Tem de ser igual ao `slug` do bloco no Payload. É a cola ([6.6](#66-o-alias-é-a-cola)).
- **`name`** — nome legível, para mensagens de erro e ferramentas. Não é usado para procurar nada.
- **`component`** — a versão de runtime, já adaptada.
- **`schema?`** — **opcional**. Este `?` merece atenção: um módulo sem schema é registado na mesma e os dados chegam-lhe **sem validação nenhuma**. O `ModuleRenderer` só valida se houver schema (`ModuleRenderer.tsx:26`). Na prática o hero tem schema e a convenção é tê-lo sempre; mas nada o obriga, e um módulo distraído passa sem rede.

```ts
export interface ModuleInstance<TData extends ModuleProps = ModuleProps> {
  id: string;
  name?: string;
  alias: string;
  data: TData;
}
```

- **`id`** — identificador único **desta** ocorrência. Vem do Payload e serve de `key` no React ([Cap. 10](#cap-10--de-volta-ao-render)).
- **`name?`** — o nome que o editor deu a este bloco no CMS, se deu. Só ajuda a depurar.
- **`alias`** — que tipo de bloco é.
- **`data`** — o conteúdo. É isto que vai ser validado e entregue ao componente.

## 6.3 `defineModule`: a função que não faz nada

`src/core/modules/defineModule.ts` — o ficheiro inteiro:

```ts
export function defineModule<TProps extends ModuleProps>(module: Module<TProps>): Module<TProps> {
  return module;
}
```

Recebe uma coisa e devolve essa coisa. Em execução, é literalmente nada. A pergunta óbvia é: então para que serve?

Serve para **mover o erro para o sítio certo**. Compara as duas formas de escrever a mesma coisa:

```ts
// sem defineModule
export const heroModule = {
  alias: 'hero',
  nome: 'Hero',        // ← erro de escrita: devia ser "name"
  component: ...,
};
```

Isto compila sem uma queixa. É um objeto válido. O erro só aparece **mais tarde**, quando o `register()` for buscar `module.name` e encontrar `undefined` — longe daqui, com uma mensagem que não aponta para este ficheiro.

```ts
// com defineModule
export const heroModule = defineModule({
  alias: 'hero',
  nome: 'Hero',        // ← erro AQUI, sublinhado a vermelho no editor
  component: ...,
});
```

Ao passar pelo parâmetro tipado `Module<TProps>`, o TypeScript verifica o objeto no momento em que ele é escrito. O erro aparece na linha errada, não três camadas abaixo.

E há um segundo benefício, mais subtil: a **inferência**. Como `TProps` é inferido a partir do que se passa, o editor completa os campos e verifica que o `schema` e o `component` são compatíveis um com o outro.

> 🎯 **Decisão**
>
> A alternativa era anotar à mão: `const heroModule: Module<HeroProps> = { ... }`. Dá quase o mesmo, mas obriga a escrever o tipo explicitamente em cada módulo, e o TypeScript infere pior em casos com generics. Este padrão (funções `defineX` que só existem para tipar) é comum em ferramentas modernas — o `defineConfig` do Vite e do Vitest é exatamente isto. Custo em runtime: uma chamada de função por módulo, no arranque.

## 6.4 `createModuleComponent`: o adaptador, e onde ele mente

`src/core/modules/createModuleComponent.tsx`:

```tsx
export function createModuleComponent<TProps extends ModuleProps>(
  Component: ModuleComponent<TProps>,
): RuntimeModuleComponent {
  return function ModuleComponentAdapter(props: ModuleProps) {
    return <Component {...(props as TProps)} />;
  };
}
```

Isto resolve a incompatibilidade de [6.2](#62-os-tipos-um-a-um): tu escreves um componente que recebe `HeroProps`; o registo precisa de um que receba `ModuleProps`. Esta função converte um no outro.

O `props as TProps` é uma **asserção de tipo** — o programador a dizer ao TypeScript «confia, eu sei o que isto é». O TypeScript aceita e **não verifica nada**. Não há aqui verificação nenhuma em execução: se o objeto não tiver a forma certa, o componente recebe-o na mesma e o erro aparece lá dentro (`title` a ser `undefined`, um `.map()` sobre algo que não é array).

Vale a pena dizer isto sem rodeios: **esta linha é uma promessa por cumprir, e quem a cumpre é o zod**. O `ModuleRenderer` valida os dados _antes_ de chegarem aqui ([Cap. 10](#cap-10--de-volta-ao-render)). Se o módulo tiver schema, a asserção é verdadeira quando chega a este ponto. Se **não** tiver schema — e o `schema` é opcional ([6.2](#62-os-tipos-um-a-um)) — a asserção é uma afirmação sem nada por trás.

Daí a regra prática: **põe sempre schema nos módulos**. Não é uma preferência de estilo; é o que torna verdadeira uma linha que o TypeScript não consegue verificar.

Nota de detalhe: a função devolvida tem nome (`ModuleComponentAdapter`) em vez de ser anónima. É só para as React DevTools e os stack traces mostrarem alguma coisa útil em vez de `anonymous`.

## 6.5 O `hero`, ficheiro a ficheiro

`src/modules/Hero/` tem seis ficheiros. Cada um com um papel, e a separação é a convenção que todos os módulos seguintes vão seguir.

**`Hero.schema.ts`** — a forma dos dados, validável em execução:

```ts
export const heroSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
});
```

**`Hero.types.ts`** — e aqui está a peça mais elegante do módulo:

```ts
export type HeroProps = z.infer<typeof heroSchema>;
```

O tipo **não é escrito à mão**: é extraído do schema. O `typeof heroSchema` dá o tipo do objeto zod; o `z.infer<>` extrai dele o tipo dos dados validados. O resultado é exatamente `{ title: string; subtitle?: string }`.

> 🎯 **Decisão**
>
> Uma só fonte de verdade. Se escrevesses o schema e a interface em separado, mais cedo ou mais tarde divergiam — acrescentavas um campo ao schema e esquecias-te do tipo, e passavas a ter dados validados que o componente não sabe que existem. Com `z.infer`, **é impossível divergirem**. Segue este padrão em todos os módulos novos.

**`Hero.tsx`** — o componente, e repara em como é banal:

```tsx
export function Hero({ title, subtitle }: HeroProps) {
  return (
    <section>
      <h1>{title}</h1>

      {subtitle && <p>{subtitle}</p>}
    </section>
  );
}
```

Nenhuma validação (já foi feita), nenhum `useState` (é um Server Component, [0.11](#011-server-components-e-client-components)), nenhum conhecimento de CMS. Recebe props e devolve JSX. É este o objetivo de toda a maquinaria à volta: que os componentes sejam aborrecidos.

O `{subtitle && <p>...</p>}` é o padrão normal de renderização condicional. Funciona bem com strings opcionais; se algum dia condicionares por um **número**, cuidado com o `0`, que desenharia um `0` no ecrã — nesse caso usa-se `x != null &&` ou um ternário.

> 🎯 **Decisão**
>
> O `<h1>` é incondicional, e o `Hero` é um exemplo — existe para provar que o mecanismo funciona, não para ser copiado neste ponto. Dois heros na mesma página dariam dois `<h1>`, o que é incorreto em HTML.
>
> **O nível do título é responsabilidade de quem escreve o módulo, não da foundation.** Ela não tem como adivinhar em que página o módulo vai cair. É por isso que o gerador emite `<h2>`, que é o que costuma estar certo. Um projecto que precise de o resolver a sério tem de dar ao módulo a sua posição na página, e isso **altera o contrato dos módulos** — ver [modules.md](modules.md#o-que-a-foundation-não-decide-por-ti).
>
> A mesma leitura vale para o `<section>`: sem nome acessível não conta como _landmark_, e dar-lhe um `aria-labelledby` implica um `id` único que vive na instância, não no componente.

**`Hero.style.scss`** — os estilos, importados pelo componente com um `import './Hero.style.scss'` e mais nada:

```scss
h1 {
  color: red;
}
```

Vermelho porque é um exemplo, e serve só para se ver que o `.scss` compila. Há duas coisas a reter, e nenhuma é o vermelho.

A primeira é o **nome**. É `.style.scss` e não `.module.scss`, o sufixo habitual de CSS Modules em Next. A razão é local a este projeto: `Hero.module.ts` é a **definição do módulo**, e um `Hero.module.scss` na mesma pasta tornava a palavra «module» ambígua — ora bloco de conteúdo, ora ficheiro com scope de CSS.

A segunda é o que **não** existe. Não há sistema de tema: nem variáveis, nem tokens, nem reset, nem escala tipográfica. Não é um esquecimento — é a mesma linha que separa o nível do título acima. A foundation garante onde os estilos de um módulo vivem e como se chamam; o que lá dentro se escreve é decisão de quem monta o site.

O `sass` é uma devDependency declarada. Chegou a compilar sem estar no `package.json`, por vir por arrasto do `@payloadcms/ui` — o tipo de dependência que funciona até alguém actualizar a de cima.

**`Hero.module.ts`** — a definição, a juntar as peças:

```ts
export const heroModule = defineModule({
  alias: 'hero',
  name: 'Hero',
  schema: heroSchema,
  component: createModuleComponent(Hero),
});
```

Quatro linhas onde tudo o que vimos neste capítulo se encontra.

⚠️ Atenção ao nome do ficheiro: `.module.ts` aqui quer dizer **«definição de módulo do projeto»**, e não CSS Module. É uma armadilha à espera — se um dia se adotarem CSS Modules, aparece um `Hero.module.css` ao lado e a convenção passa a ler-se mal. Vale a pena decidir isto antes de acontecer.

**`index.ts`** — o barrel do módulo:

```ts
export * from './Hero';
export * from './Hero.module';
export * from './Hero.types';
```

Aqui o `export *` é seguro, porque é consumido por `src/modules/index.ts`, que reexporta **só** o `heroModule`. A razão pela qual isso importa está em [4.3](#43-registermodules-registo-por-convenção) — se não a leste, lê, porque é o tipo de coisa que rebenta de forma incompreensível.

**Porquê cinco ficheiros para um `<h1>` e um `<p>`?** Porque cada um tem um leitor diferente: o schema é a fronteira de validação, os tipos são derivados dele, o componente é o que se estiliza, a definição é o que o registo consome, e o barrel é a porta. Num hero parece exagero; num módulo com quinze campos, três variantes e media, é o que evita um ficheiro de 300 linhas. A convenção existe para ser uniforme, não para ser mínima em cada caso.

## 6.6 O `alias` é a cola

Vale a pena ver os dois lados ao mesmo tempo. No CMS, `src/providers/payload/blocks/HeroBlock.ts`:

```ts
export const HeroBlock: Block = {
  slug: 'hero',                    // ←──────┐
  interfaceName: 'HeroBlock',      //        │
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'subtitle', type: 'textarea', localized: true },
  ],
};                                 //        │
                                   //        │  têm de ser iguais
export const heroModule = defineModule({ //  │
  alias: 'hero',                   // ←──────┘
  ...
});
```

Quando um editor mete um hero numa página, o Payload guarda um bloco com `blockType: 'hero'`. O mapeador copia esse valor para `alias` (Cap. 8), e o renderer usa-o para procurar no registo (Cap. 10).

Repara também no paralelo dos campos: `title` obrigatório no Payload (`required: true`) e `z.string()` no schema; `subtitle` opcional dos dois lados. Os dois lados descrevem a mesma forma, em linguagens diferentes.

**Nada verifica que estes dois lados batem certo.** Nem o TypeScript, nem os testes, nem o arranque. Se escreveres `slug: 'hero'` e `alias: 'heros'`, tudo compila e tudo arranca — e depois, em produção, o `ModuleRenderer` não encontra o módulo e desenha um espaço vazio ([Cap. 10](#cap-10--de-volta-ao-render)). É o erro mais provável ao criar um módulo novo, e é a primeira coisa a verificar quando um bloco não aparece.

(O `interfaceName: 'HeroBlock'` é outra coisa: diz ao gerador de tipos do Payload como chamar a interface deste bloco no `payload-types.ts`. Sem ele, o tipo gerado teria um nome automático e pouco legível.)

---

# Cap. 7 — Sair do `core`: o `Provider`

Até aqui esteve tudo dentro do `core` — sem CMS, sem base de dados, sem Next. Agora atravessamos a fronteira.

## 7.1 O contrato

`src/providers/Provider.types.ts` — o ficheiro inteiro:

```ts
export interface Provider {
  page: PageSource;
  site: SiteSource;
  preview?: ComponentType;
}
```

Um provider é um pacote com tudo o que é preciso para servir um site a partir de uma origem de dados:

- **`page`** e **`site`** — as duas fontes, dos tipos abstratos do `core` ([0.2](#02-classe-abstrata-o-contrato-que-obriga)).
- **`preview?`** — opcional, um componente React. Só faz sentido se a origem tiver pré-visualização em direto; uma API REST de terceiros não tem. `ComponentType` é o tipo do React para «um componente qualquer».

Compara com a `Foundation` ([4.1](#41-o-objeto-de-três-campos)): esta tem `modules`, aquela tem `preview`. Não são a mesma coisa. O `Provider` é «de onde vêm os dados»; a `Foundation` é «a aplicação montada». O `foundation.ts` pega num e faz o outro.

## 7.2 `createProvider`: escolher por variável de ambiente

`src/providers/createProvider.ts`:

```ts
export function createProvider(): Provider {
  const name = process.env.PROVIDER ?? 'payload';

  switch (name) {
    case 'api':
      return apiProvider;

    case 'mock':
      return mockProvider;

    case 'payload':
      return payloadProvider;

    default:
      throw new Error(`Unsupported PROVIDER "${name}".`);
  }
}
```

Três coisas a reter:

- **`?? 'payload'`** — sem configuração nenhuma, o projeto corre com Payload. É o caso normal.
- **O `default` atira.** Se escreveres `PROVIDER=payloadd`, a aplicação **não arranca**. A alternativa seria cair no Payload em silêncio, e aí passavas uma tarde a perceber porque é que a variável «não faz nada». Falhar alto no arranque é sempre melhor do que ignorar configuração errada — é a mesma decisão do `register()` em [5.2](#52-porque-rebenta-em-vez-de-sobrescrever).
- **`process.env.PROVIDER` é lido no servidor.** Não tem prefixo `NEXT_PUBLIC_`, portanto nunca chega ao browser (ver [11.5](#115-as-variáveis-de-ambiente-uma-a-uma)).

E ao lado, `src/providers/provider.ts` — uma linha: `export const provider = createProvider();`. O mesmo par fábrica/instância do `foundation` ([0.8](#08-módulos-esm-importar-é-executar-e-o-singleton)).

> ⚠ **Lapso, não decisão**
>
> Os três providers são importados **estaticamente** no topo do `createProvider.ts` (linhas 3-5), e cada `provider.ts` cria as suas fontes no momento do import (`new PayloadPageSource()` etc.). Como o `PayloadPageSource.ts:3` importa `@payload-config`, **correr com `PROVIDER=mock` continua a carregar a config do Payload inteira e o adapter de Postgres**. O `mocks` existe precisamente para poder correr o site sem base de dados, e este detalhe estraga metade do ganho. A correção é um `await import()` dinâmico dentro de cada `case`.

## 7.3 As três implementações

Os três ficheiros têm a mesma forma. `src/providers/payload/provider.ts`:

```ts
export const payloadProvider: Provider = {
  page: new PayloadPageSource(),
  site: new PayloadSiteSource(),
  preview: PayloadLivePreview,
};
```

E `mocks/provider.ts` e `api/provider.ts` idênticos, sem o `preview`.

A anotação `: Provider` é o que garante que os três são intermutáveis: se faltar um campo obrigatório, o TypeScript queixa-se ali.

| Provider  | Para quê                                                                                    |
| --------- | ------------------------------------------------------------------------------------------- |
| `payload` | o caso real: CMS próprio, Postgres, live preview                                            |
| `api`     | consumir uma API externa. O transporte está feito, o mapeamento está por escrever (Cap. 12) |
| `mock`    | correr o site inteiro sem base de dados nenhuma                                             |

**Porque é que o `mocks` merece existir.** Não é só para testes. É a **prova viva de que a abstração não vaza**: se algum dia alguém puser conhecimento de Payload no `core` ou nos módulos, o `mocks` deixa de funcionar. É um detetor de fugas que custa meia dúzia de ficheiros pequenos.

E porque as páginas dele são escritas à mão, tem uma camada de autoria própria:

```ts
export const home = definePage({
  'pt-PT': {
    path: '',
    main: [block(heroModule, { title: 'Next Foundation', subtitle: 'Primeiro render 🎉' })],
  },

  'en-GB': {
    path: '',
    main: [block(heroModule, { title: 'Next Foundation', subtitle: 'First render 🎉' })],
  },
});
```

> 🎯 **Decisão**
>
> **As traduções entram juntas, com o locale por chave.** Houve uma versão em que cada idioma era um ficheiro com um sufixo no nome (`mockHomePageEn.ts`) e mais uma entrada na lista. Acrescentar um idioma passou a ser acrescentar uma chave, e as duas versões ficam lado a lado, onde se vê logo se uma ficou para trás.
>
> **O `path` vive dentro de cada tradução** porque um slug traduz-se como qualquer outro conteúdo: `sobre-nos` em português é `about-us` em inglês.
>
> **O `block()` recebe a definição do módulo, não o alias em texto.** É a diferença entre um erro de escrita rebentar no editor e rebentar em runtime como «Module "heor" is not registered» — e dá autocomplete ao `data`, verificado contra o tipo desse módulo. Os `id` são derivados do alias e da posição (`hero-1`, `hero-2`), porque dois `hero-1` colados por copy-paste davam uma key repetida em React, que falha em silêncio.

---

# Cap. 8 — Provider Payload, lado do frontend

Estamos de volta ao percurso. O `resolvePage` chamou `foundation.site.getSite()` e `foundation.page.getPage('sobre-nos', 'en-GB', { draft: false })`. Vamos ver o que acontece lá dentro.

## 8.1 `locales.ts`: uma lista, três formas

`src/providers/payload/locales.ts` — 21 linhas, e são um bom exemplo de TypeScript a trabalhar.

```ts
export const availableLocales = [
  { label: 'Português', value: 'pt-PT' },
  { label: 'English', value: 'en-GB' },
] as const;
```

O **`as const`** é o que faz a magia. Sem ele, o TypeScript infere `Array<{label: string, value: string}>`. Com ele, infere um tuplo `readonly` com os valores **literais** — `'pt-PT'` e `'en-GB'` passam a ser tipos, não apenas strings.

```ts
export type SupportedLocale = (typeof availableLocales)[number]['value'];
```

Lê-se de dentro para fora: `typeof availableLocales` é o tipo do array; `[number]` é «o tipo de um elemento qualquer» (indexar um array por um número); `['value']` é o campo `value` desse elemento. Resultado: `'pt-PT' | 'en-GB'`.

> 🎯 **Decisão**
>
> A união de locales é **derivada** da lista, não escrita à mão. Acrescentar `'fr-FR'` ao array atualiza o tipo sozinho, e todos os sítios que fazem `switch` sobre locales passam a acusar o caso em falta. É exatamente o mesmo princípio do `z.infer` no hero ([6.5](#65-o-hero-ficheiro-a-ficheiro)): uma fonte de verdade, tudo o resto derivado.

```ts
export const payloadLocales = availableLocales.map(({ label, value }) => ({
  label,
  code: value,
}));
```

Uma adaptação de forma: o campo `select` do global `Site` quer `{ label, value }`, e o `localization` do Payload quer `{ label, code }`. Mesma informação, dois consumidores com vocabulários diferentes. Em vez de manter duas listas que podem divergir, mantém-se uma e converte-se.

```ts
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return availableLocales.some(({ value }) => value === locale);
}
```

O `locale is SupportedLocale` no lugar do tipo de retorno faz disto um **type predicate** (ou _type guard_). É uma promessa ao TypeScript: «se eu devolver `true`, podes tratar o argumento como `SupportedLocale` daí para a frente».

Sem ele, a função devolvia `boolean` e o compilador não aprendia nada — dentro do `if` o `locale` continuava a ser `string`. Com ele, o tipo estreita-se sozinho. É o que permite a linha seguinte funcionar sem cast nenhum.

## 8.2 `PayloadSiteSource` e a Local API

`src/providers/payload/sources/PayloadSiteSource.ts` hoje é uma linha:

```ts
export class PayloadSiteSource extends SiteSource {
  async getSite(): Promise<SiteDefinition> {
    return getCachedSite();
  }
}
```

A consulta em si mudou-se para `loadPayloadSite.ts`, para que a versão com cache e a versão sem cache partilhem o mesmo código — voltamos a isso em [8.6](#86-a-cache-o-que-sobrevive-ao-pedido). É essa a leitura que interessa aqui:

```ts
export async function loadPayloadSite(): Promise<SiteDefinition> {
  const payload = await getPayloadClient();

  const site = await payload.findGlobal({ slug: 'site', depth: 0 });

  return mapPayloadSite(site);
}
```

**`getPayloadClient()` é a peça a compreender.** Por dentro é `getPayload({ config })`, com o config importado dinamicamente. Não abre uma ligação HTTP a lado nenhum. Inicializa o Payload **dentro deste processo** e devolve um objeto com métodos que falam diretamente com a base de dados. É a chamada _Local API_.

Compara os dois caminhos possíveis:

```
REST:       componente → fetch → HTTP → route handler → Payload → Postgres
Local API:  componente → payload.find() → Postgres
```

Sem HTTP, sem serialização para JSON e outra vez para objeto, sem um segundo processo. Só é possível porque estamos num **Server Component** ([0.11](#011-server-components-e-client-components)) — do browser isto seria impensável, porque implicaria expor a base de dados.

O `getPayload` guarda a instância em cache internamente, portanto chamá-lo em vários sítios não cria várias ligações.

E o mapeador, `mapPayloadSite.ts`:

```ts
export function mapPayloadSite(site: Site): SiteDefinition {
  const locales = site.enabledLocales ?? [];

  if (locales.length === 0) {
    console.warn('The `site` global has no enabledLocales. Falling back to …');
  }

  return {
    name: site.name,
    locales,
    defaultLocale: locales[0] ?? payloadDefaultLocale,
  };
}
```

Faz a tradução do vocabulário do CMS (`enabledLocales`) para o do projeto (`locales`). O `?? []` protege contra o campo estar por preencher. O `depth: 0` da consulta existe porque este mapeador só lê escalares — não há relação nenhuma para popular.

E é aqui que este provider **responde** qual é o seu locale por omissão. O campo `enabledLocales` é ordenável no admin e a sua descrição promete que o primeiro é o default — é essa promessa que esta linha cumpre. Com o global por preencher não há resposta possível vinda dos dados, e cai-se no `payloadDefaultLocale`, a constante que o `payload.config.ts` também usa.

O aviso existe porque a queda é razoável mas não é normal: o site passa a servir um idioma que ninguém escolheu, e sem uma linha no log a única pista era o `PageUrl` deixar de renderizar no admin. Repara onde ele está — dentro da função em cache, portanto sai uma vez por entrada e não uma vez por pedido.

**Esta é também a única definição da regra.** Havia uma cópia dela na collection `Pages`, a decidir o locale do Live Preview, e a cópia não tinha a queda — ver [9.2](#92-a-collection-pages).

## 8.3 `PayloadPageSource.getPage`

`src/providers/payload/sources/PayloadPageSource.ts`:

```ts
export class PayloadPageSource extends PageSource {
  async getPage(
    path: string,
    locale?: string,
    options?: GetPageOptions,
  ): Promise<PageDefinition | undefined> {
    const requested = locale ?? (await this.getDefaultLocale());

    if (!isSupportedLocale(requested)) {
      return undefined;
    }

    const payloadLocale: SupportedLocale = requested;

    // O rascunho nunca passa pela cache.
    if (options?.draft) {
      return loadPayloadPage(path, payloadLocale, true);
    }

    return getCachedPage(path, payloadLocale);
  }
}
```

A assinatura é **exatamente** a da classe abstrata — não podia ser outra ([0.3](#03-extends-e-polimorfismo)).

**Sem locale, a origem responde o seu.** O `getDefaultLocale` lê o global `Site` pelo mesmo `getCachedSite` que a `PayloadSiteSource` usa — é a mesma entrada de cache, portanto não é uma segunda consulta. Isto é o contrato do `PageSource`: omitir o locale significa «usa o teu default», não «desiste».

> ✅ **Corrigido**
>
> A primeira linha era `if (!locale || !isSupportedLocale(locale)) return undefined`. Um `getPage` sem locale desistia — o que fazia desta source a única que não sabia responder à pergunta mais simples que se lhe pode fazer. Hoje resolve.
>
> Quando isto foi escrito, a leitura do global custava mesmo uma consulta extra, e argumentou-se que valia a pena por só acontecer num caminho que o frontend nunca percorre. Com a cache, o argumento deixou de ser preciso: o custo é o de uma entrada já quente.

**A guarda de locale** é o sítio onde o type predicate de [8.1](#81-localests-uma-lista-três-formas) se paga. O `core` fala em `locale?: string` (qualquer string); o Payload só aceita os locales que conhece. Depois do `if`, o TypeScript já sabe que `requested` é um `SupportedLocale`, e a linha seguinte compila sem cast nenhum. Sem o predicate, era preciso escrever `requested as SupportedLocale`, uma afirmação por verificar.

**E um locale desconhecido avisa antes de desistir.** Continua a devolver `undefined`, que acaba em 404 — mas com um `console.warn` que nomeia o locale.

Vale a pena perceber porque é que o aviso não faz barulho à toa. Um visitante que escreva `/xx/sobre-nos` **não chega aqui**: o `resolveRoute` só reconhece como locale um segmento que esteja em `site.locales`, e `xx` não está, portanto `xx/sobre-nos` vira caminho e dá 404 normal, sem passar por esta guarda. O único caminho até aqui é o CMS ter um locale seleccionado que o `availableLocales` do `locales.ts` já não tem — alguém apagou um idioma do código com ele ainda escolhido no admin.

Isso não é uma página que falta, é configuração partida, e o efeito é todas as páginas desse idioma responderem 404. Sem o aviso, as duas coisas eram indistinguíveis nos logs.

**A bifurcação do rascunho** é a linha com mais consequência do ficheiro, e está explicada em [8.6](#86-a-cache-o-que-sobrevive-ao-pedido). Em duas palavras: o que o editor vê no Live Preview é a versão dele, e guardá-la arriscava servi-la a um visitante anónimo.

## 8.4 `resolvePayloadPage`, opção a opção

`src/providers/payload/sources/resolvePayloadPage.ts` — 30 linhas, e são as mais importantes do projeto do ponto de vista de segurança.

```ts
const byPath: Where = !path
  ? { isHome: { equals: true } }
  : { 'breadcrumbs.url': { equals: `/${path}` } };
```

Duas maneiras de encontrar uma página:

- **Caminho vazio** (a raiz) → procura a página marcada como homepage. Não se procura por URL, porque a homepage não tem URL própria.
- **Caminho com conteúdo** → procura pelo `breadcrumbs.url`. O `breadcrumbs` é um campo mantido pelo plugin `nestedDocs` ([9.4](#94-os-plugins-nesteddocs-e-seo)) com o caminho completo da página na hierarquia. A crase constrói `/sobre-nos` a partir de `sobre-nos` — o `path` que vem do `resolveRoute` não tem barra inicial, e o guardado tem.

O tipo `Where` é o do Payload para consultas. A forma é `{ campo: { operador: valor } }` — aqui `equals`, mas há `not_equals`, `in`, `greater_than`, `contains`, etc.

```ts
const where: Where = draft ? byPath : { and: [byPath, { _status: { equals: 'published' } }] };
```

**Esta é a linha mais sensível do projeto inteiro.**

- Em **modo rascunho**, procura só pelo caminho — devolve o que houver, publicado ou não. É o que um editor precisa de ver.
- Fora do modo rascunho, junta uma segunda condição com `and`: o `_status` tem de ser `published`. O `_status` é um campo que o Payload cria sozinho quando se ligam versões e rascunhos ([9.2](#92-a-collection-pages)).

Agora a consulta:

```ts
const result = await payload.find({
  collection: 'pages',
  locale,
  fallbackLocale: false,
  draft,
  overrideAccess: true,
  where,
  limit: 1,
  depth: 2,
});

return result.docs[0];
```

Opção a opção:

| Opção                   | O que faz                                         | Porquê assim                                                       |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| `collection: 'pages'`   | em que collection procurar                        | o `slug` definido em `Pages.ts`                                    |
| `locale`                | em que idioma devolver os campos localizados      | vem já validado de [8.3](#83-payloadpagesourcegetpage)             |
| `fallbackLocale: false` | **não** cair para outro idioma se faltar tradução | uma página sem tradução deve dar 404, não aparecer meia traduzida  |
| `draft`                 | incluir versões por publicar                      | espelha o `draftMode()` do Next                                    |
| `overrideAccess: true`  | **ignorar as regras de acesso do Payload**        | ver abaixo — é o ponto crítico                                     |
| `where`                 | o filtro construído acima                         |                                                                    |
| `limit: 1`              | trazer no máximo um documento                     | só queremos uma página; sem isto o Payload traz 10 por omissão     |
| `depth: 2`              | **quantos níveis de relações preencher**          | ver abaixo                                                         |
| `result.docs[0]`        | o primeiro (e único) resultado                    | `undefined` se não houver nenhum, que é o que a assinatura promete |

**`overrideAccess: true` merece parar.** O Payload, por omissão, aplica as regras de acesso de cada collection a todas as consultas. E as regras deste projeto exigem utilizador autenticado ([9.3](#93-media-users-e-o-global-site)). Como o site público não tem utilizador nenhum, sem esta opção **nenhuma página apareceria a um visitante anónimo**.

A consequência é a que tens de interiorizar:

> 🎯 **Decisão, com uma responsabilidade anexa**
>
> Com `overrideAccess: true`, o Payload deixa de filtrar seja o que for. **A única coisa que impede o site público de mostrar rascunhos é o `{ _status: { equals: 'published' } }` da linha 16.** Se alguém apagar essa condição num refactor, o site passa a servir conteúdo por publicar e não há teste nenhum a apanhar isso — não existem testes para este ficheiro. É o primeiro sítio onde eu escreveria um.

**`depth: 2`** controla até que ponto o Payload segue relações. Com `depth: 0`, um campo de relação vem só com o `id` (`{ image: 42 }`). Com `depth: 1`, vem o documento inteiro (`{ image: { id: 42, url: '...', alt: '...' } }`). Com `depth: 2`, também as relações **dentro** desse documento são preenchidas. É o suficiente para um bloco com uma imagem, ou com uma ligação para outra página. Cada nível a mais é mais consultas — por isso não se põe um número grande «por precaução».

## 8.5 `mapPayloadPage`: onde os dados mudam de forma

`src/providers/payload/mappers/mapPayloadPage.ts`. É aqui que um documento do Payload deixa de ser um documento do Payload e passa a ser um `PageDefinition` — a fronteira depois da qual mais nada no projeto sabe que existe um CMS.

```ts
export function mapPayloadPage(page: Page, locale: string): PageDefinition {
  return {
    meta: {
      locale,
      title: page.meta?.title ?? undefined,
      description: page.meta?.description ?? undefined,
      ogTitle: page.meta?.ogTitle ?? undefined,
      ogDescription: page.meta?.ogDescription ?? undefined,
      noIndex: page.meta?.noIndex ?? false,
      noFollow: page.meta?.noFollow ?? false,
    },

    main: (page.main ?? []).map(mapBlock),
  };
}
```

O padrão repetido `?? undefined` parece redundante e não é: o Payload devolve **`null`** para campos vazios (é o que a base de dados guarda), e o contrato do projeto usa **`undefined`** (é o que o TypeScript usa para «opcional»). Sem esta conversão, `title?: string` receberia `null`, o que o tipo não prevê. Os dois booleanos caem para `false` em vez de `undefined`, porque «não sei» e «não» são a mesma coisa neste caso.

E o bloco a bloco:

```ts
function mapBlock(block: PayloadPageBlock): ModuleInstance {
  if (!block.id) {
    throw new Error(`Payload block "${block.blockType}" is missing an id.`);
  }

  const { id, blockType, blockName, ...data } = block;

  return {
    id,
    name: blockName || blockType,
    alias: blockType,
    data: removeNullValues(data),
  };
}
```

A linha do destructuring faz o trabalho todo: tira os três campos de **metadados** do bloco e junta **todo o resto** em `data` (é o _rest_, o oposto do spread). Tudo o que o editor preencheu — `title`, `subtitle`, o que for — fica em `data`, sem ser preciso listar campo a campo. É o que permite acrescentar um módulo novo sem tocar aqui.

Depois: o `blockType` do Payload vira o `alias` do projeto — é a cola de [6.6](#66-o-alias-é-a-cola) a ser aplicada. E `blockName || blockType` usa o nome que o editor deu ao bloco, ou o tipo, se não deu nenhum (aqui `||` está certo, porque uma string vazia deve cair para o `blockType`).

O `throw` quando falta `id` é defensável — sem `id` não há `key` estável para o React — mas repara que ele **rebenta a página inteira**, ao contrário do `ModuleRenderer`, que isola o problema a um módulo ([Cap. 10](#cap-10--de-volta-ao-render)). Um bloco estragado derruba tudo.

Por fim:

```ts
function cleanValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null).map(cleanValue);
  }

  if (value && typeof value === 'object') {
    return removeNullValues(value as Record<string, unknown>);
  }

  return value;
}

function removeNullValues(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => [key, cleanValue(value)]),
  );
}
```

Serve o mesmo propósito do `?? undefined` acima, mas para os dados dos blocos, cujos campos não são conhecidos de antemão. Percorre o objeto, deita fora as chaves com valor `null`, e desce recursivamente aos objetos e arrays aninhados. Importa porque `z.string().optional()` aceita `undefined` mas **rejeita `null`** — sem esta limpeza, um `subtitle` vazio no CMS fazia o `heroSchema.parse()` falhar.

O `Object.entries` / `Object.fromEntries` é o par idiomático para transformar um objeto: para array de pares, transforma-se, volta a objeto. As duas funções são mutuamente recursivas — o `cleanValue` decide o que fazer com **um** valor, o `removeNullValues` trata de **um objeto inteiro** — e é essa separação que faz os três casos (array, objeto, primitivo) ficarem legíveis.

> ✅ **Corrigido**
>
> A versão original tinha um `!Array.isArray(value)` na condição, e portanto a recursão **não entrava em arrays**: um `null` dentro de um item de array sobrevivia à limpeza e fazia o `parse` falhar. Não se notava porque nenhum módulo tem arrays ainda — ia aparecer no primeiro módulo com uma lista, como um bloco que desaparece em produção sem explicação. Hoje o `cleanValue` trata os três casos (array, objeto, primitivo) e há testes de regressão em `mapPayloadPage.test.ts`.

## 8.6 A cache: o que sobrevive ao pedido

Em [2.2](#22-o-que-o-cache-garante--e-o-que-não-garante) ficou dito que o `cache()` do React morre com o pedido. Esta secção é a outra metade: o que fica.

### Porque era preciso

O frontend é SSR. Não há uma única página estática, e por isso cada visita a cada página fazia duas consultas ao Postgres — uma ao global `Site` para o `<html lang>`, outra à página. Numa base de dados remota, medido num servidor de produção: **133 ms**. Com cache, a mesma página serve em **~20 ms**.

### Duas camadas com nomes parecidos

|               | `cache()` do React                      | `unstable_cache` do Next                       |
| ------------- | --------------------------------------- | ---------------------------------------------- |
| de onde vem   | `react`                                 | `next/cache`                                   |
| tempo de vida | um pedido HTTP                          | até alguém invalidar a tag                     |
| o que resolve | o layout e a página perguntarem o mesmo | o segundo visitante não voltar à base de dados |
| onde vive     | `app/(frontend)/_lib/`                  | `providers/payload/cache/`                     |

São complementares, não alternativas. O primeiro é uma deduplicação; o segundo é um cache de dados.

### O par carregar / guardar

Cada leitura existe em duas versões, e a razão é o rascunho:

```
loadPayloadPage(path, locale, draft)   ← consulta + mapeamento, sem cache
        ↑
getCachedPage(path, locale)            ← o mesmo, com o draft fixo em false
```

O `getCachedPage` não recebe `draft`. Não é esquecimento — é a garantia. **Não há forma de um rascunho entrar na cache**, porque o argumento não existe na assinatura. Quem precisa do rascunho chama o `loadPayloadPage` directamente, e é isso que o `if (options?.draft)` do `getPage` faz.

Porquê tanto cuidado? Porque o que o editor vê no Live Preview é a versão dele, por publicar. Se essa versão entrasse na cache partilhada, o visitante seguinte via-a.

### O que se guarda é o mapeamento

Guarda-se o `PageDefinition`, não o documento cru do Payload. Três razões: o documento vem com `depth: 2` e arrasta media e relações inteiras; o `PageDefinition` é exactamente o que o renderer precisa; e é JSON puro, que é o que o `unstable_cache` sabe serializar — por dentro faz `JSON.stringify` e `JSON.parse`.

O `path` e o `locale` entram na chave por serem **argumentos** — o `unstable_cache` inclui os argumentos por si, e o array que se lhe passa (`['payload:page']`) é só um prefixo. Cada idioma tem a sua entrada; o global `Site` tem uma só, partilhada por todas as rotas.

Inspeccionado em produção, o `.next/cache/fetch-cache` fica assim:

```
["payload:site"]   {"name":"Teste","locales":["pt-PT","en-GB"],"defaultLocale":"pt-PT"}
["payload:pages"]  {"meta":{"locale":"pt-PT",…},"main":[…]}
["payload:pages"]  {"meta":{"locale":"en-GB",…},"main":[…]}
["payload:pages"]  undefined
```

A última entrada é uma página que não existe. **O 404 também se guarda**, e é de propósito: um caminho inexistente pedido em ciclo não deve custar uma consulta por pedido, e publicar a página nova invalida a mesma tag.

### As tags são grosseiras de propósito

Duas tags: `payload:pages` para todas as páginas, `payload:site` para o global.

Uma tag por página seria mais eficiente, e a tentação é grande. Não é de confiança aqui: o `nestedDocs` reescreve os breadcrumbs dos filhos quando um pai muda de slug, e nesse caminho não há garantia de que o `afterChange` de cada filho dispare. Uma tag por página deixaria os filhos com o URL antigo em cache, sem nada que os invalidasse.

Invalidar a mais custa uma consulta. Invalidar a menos serve um URL errado durante horas. A escolha faz-se sozinha.

### Quem invalida

Os hooks do Payload, em `cache/hooks.ts`, ligados na collection `Pages` e no global `Site`:

```ts
hooks: {
  afterChange: [revalidatePagesOnChange],
  afterDelete: [revalidatePagesOnDelete],
},
```

E o hook das páginas tem uma guarda que não é opcional:

```ts
if (doc?._status !== 'published' && previousDoc?._status !== 'published') return;
```

**Sem ela, o autosave a 375ms invalidava a cache do site inteiro a cada tecla que um editor escrevesse.** Um rascunho de uma página nunca publicada não está em cache nenhuma — o `resolvePayloadPage` filtra por `_status: 'published'` — portanto não há nada para invalidar.

O `previousDoc` conta tanto como o `doc` por causa do despublicar: a versão nova é rascunho, mas a antiga estava em cache e tem de sair.

### Duas armadilhas do `revalidateTag`

O `revalidatePayloadTag` embrulha o `revalidateTag` do Next por duas razões, e nenhuma é cosmética.

**A primeira é o segundo argumento.** Em Next 16 a forma de um só argumento está depreciada, e o valor que a documentação recomenda é `'max'`. `'max'` marca a entrada como velha e serve o conteúdo antigo enquanto revalida em fundo — óptimo para um catálogo, errado para um CMS: quem carrega em publicar e vai ver a página veria a versão antiga à primeira. Usa-se `{ expire: 0 }`, que expira já.

**A segunda é que os hooks também correm fora do Next.** Um script de seed, uma migração ou o CLI do Payload chamam o mesmo `afterChange`, e aí o `revalidateTag` atira — não encontra o contexto do pedido. Nesse caso não há cache nenhuma para invalidar, portanto engolir é a resposta certa. Mas só desse erro, identificado pelo código `E263` que o Next põe no objeto e não pela mensagem, que muda com a expressão que falhou.

> ⚠️ **Dívida assumida**
>
> O `unstable_cache` está declarado em Next 16 como **substituído** pela directiva `use cache`. Não se migrou, e a razão está registada em [TODO.md](TODO.md): o `use cache` exige `cacheComponents: true`, que não é uma troca de API — liga o PPR por omissão, muda a navegação para `<Activity>`, e obriga todo o acesso a APIs de runtime a viver dentro de um `<Suspense>`. Isso inclui o `headers()` do layout de raiz, de onde sai o `<html lang>`, e inclui o admin do Payload, que partilha o mesmo `app/`. É uma ronda própria.

---

---

# Cap. 9 — Provider Payload, lado do CMS

Os capítulos anteriores viram o Payload como fonte de dados. Este vê-o como aplicação: as collections, os campos, o admin. Nada disto é conhecido pelo `core` — vive todo dentro de `src/providers/payload/`.

## 9.1 `payload.config.ts`, opção a opção

Está na **raiz** do projeto, não no `src/`, porque o Payload e o Next esperam-no aí (é o que o alias `@payload-config` do `tsconfig` aponta).

```ts
export default buildConfig({
  secret: requireEnv('PAYLOAD_SECRET', 'Payload to sign session tokens'),
```

**`secret`** — a chave com que o Payload assina os tokens de sessão. Quem a tiver, forja logins.

> ✅ **Corrigido**
>
> A versão original era `process.env.PAYLOAD_SECRET || ''`, e a `connectionString` mais abaixo tinha o mesmo padrão: faltando a variável, a aplicação **arrancava com uma chave de assinatura vazia** em vez de falhar, e os tokens de sessão passavam a ser trivialmente forjáveis sem um único aviso.
>
> Hoje as duas usam o `requireEnv` de `src/providers/requireEnv.ts`, que atira com uma mensagem que diz o nome da variável e quem precisa dela. O `createApiClient` (Cap. 12) foi passado a usar o mesmo helper, para haver uma só forma de exigir configuração.

```ts
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
```

**`serverURL`** — o endereço público. O Payload usa-o para construir URLs absolutos (media, links de email, live preview). O fallback para localhost é conveniente em desenvolvimento.

```ts
  localization: {
    locales: payloadLocales,
    defaultLocale: 'pt-PT',
    fallback: false,

    filterAvailableLocales: async ({ locales, req }) => {
      const site = await req.payload.findGlobal({ slug: 'site', req });
      const enabledLocales = (site.enabledLocales ?? []) as string[];

      if (!enabledLocales.length) {
        return locales;
      }

      return locales.filter((locale) => enabledLocales.includes(locale.code));
    },
  },
```

- **`locales`** — a lista técnica, vinda do `locales.ts` ([8.1](#81-localests-uma-lista-três-formas)). São os idiomas que o **código** suporta.
- **`defaultLocale: 'pt-PT'`** — em que idioma o Payload guarda quando não lhe dizem outro.
- **`fallback: false`** — sem tradução, o campo vem vazio; não empresta o valor de outro idioma. É o par do `fallbackLocale: false` da consulta ([8.4](#84-resolvepayloadpage-opção-a-opção)), e a intenção é a mesma: nunca mostrar conteúdo meio traduzido.
- **`filterAvailableLocales`** — a parte interessante. Separa **o que o código sabe fazer** do **que este site usa**. A lista técnica tem `pt-PT` e `en-GB`; o global `Site` diz quais estão ligados; esta função cruza as duas, e o admin só mostra ao editor os idiomas em uso. Se o global ainda não estiver preenchido, devolve tudo — evita ficar sem idioma nenhum numa instalação nova.

  Repara no `req` passado ao `findGlobal`: reutiliza o contexto do pedido em curso (transação, utilizador), em vez de abrir um novo.

```ts
  admin: {
    user: Users.slug,

    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },

    importMap: {
      baseDir: path.resolve(dirname, 'src'),
    },
  },
```

- **`user: Users.slug`** — que collection guarda os utilizadores do admin. Usa-se `Users.slug` em vez de `'users'` para não haver duas strings a poderem divergir.
- **`livePreview.breakpoints`** — os tamanhos de ecrã no seletor da pré-visualização. Puramente visual.
- **`importMap.baseDir`** — o Payload permite substituir componentes do admin, mas as referências são **strings** (ver [9.2](#92-a-collection-pages)). Este `baseDir` diz a partir de onde essas strings se resolvem. O `dirname` das linhas 16-17 é reconstruído a partir de `import.meta.url`, porque num projeto ESM (`"type": "module"`) não existe `__dirname`.

```ts
  collections: [Users, Pages, Media],
  globals: [Site],

  db: postgresAdapter({
    pool: { connectionString: requireEnv('DATABASE_URL', 'the Postgres adapter') },
  }),

  plugins: [nestedDocs, seo],
});
```

**Collection vs global:** uma collection tem muitos documentos (páginas, utilizadores, ficheiros); um global tem **um só** (as definições do site). O Payload gera interfaces diferentes para cada caso — uma lista para collections, um formulário único para globals.

O `postgresAdapter` é o que torna o Payload agnóstico de base de dados: trocar por `mongooseAdapter` mudaria esta linha e mais nada. Note-se que o Payload **gera o esquema SQL a partir das collections** — não se escreve SQL nem migrações à mão.

## 9.2 A collection `Pages`

`src/providers/payload/collections/Pages.ts` — a peça mais densa do lado do CMS.

```ts
export const Pages: CollectionConfig = {
  slug: 'pages',

  hooks: {
    afterChange: [revalidatePagesOnChange],
    afterDelete: [revalidatePagesOnDelete],
  },

  versions: {
    drafts: {
      autosave: { interval: 375 },
    },
  },
```

- **`slug: 'pages'`** — o identificador. É o que aparece no URL do admin e o que se usa em `payload.find({ collection: 'pages' })`.
- **`hooks`** — o único sítio do projeto onde o CMS fala com o cache do Next. Sempre que uma página é gravada ou apagada, a tag `payload:pages` é invalidada e a leitura seguinte volta ao Postgres. A implementação está em [8.6](#86-a-cache-o-que-sobrevive-ao-pedido) — vale a pena lê-la antes de mexer aqui, porque a interação com o `autosave` logo abaixo não é inocente.
- **`versions.drafts`** — liga o histórico de versões e o modo rascunho. É isto que **cria o campo `_status`** de que a consulta depende ([8.4](#84-resolvepayloadpage-opção-a-opção)). Sem esta opção, aquele filtro não faria sentido nenhum.
- **`autosave.interval: 375`** — grava sozinho 375 ms depois de o editor parar de escrever. O número é pequeno de propósito: é o que faz o live preview parecer instantâneo. Cada gravação é uma versão nova na base de dados, por isso é um compromisso entre fluidez e volume.

  E é aqui que as duas opções se cruzam: **cada autosave dispara o `afterChange`**. Sem a guarda de `_status` que o hook tem, escrever um parágrafo neste editor invalidava a cache do site inteiro umas dezenas de vezes.

```ts
  admin: {
    group: 'Content',
    useAsTitle: 'title',

    livePreview: {
      url: async ({ data, locale, req }) => {
        const previewSecret = process.env.PREVIEW_SECRET;

        if (!previewSecret) {
          req.payload.logger.error(
            'PREVIEW_SECRET is not set: Live Preview is disabled. Add it to .env.local.',
          );

          return undefined;
        }

        const site = await req.payload.findGlobal({ slug: 'site', depth: 0 });

        return getLivePreviewUrl({
          breadcrumbs: data?.breadcrumbs,
          locale: locale.code,
          defaultLocale: mapPayloadSite(site).defaultLocale,
          previewSecret,
        });
      },
    },
  },
```

- **`group: 'Content'`** — agrupa no menu lateral do admin. Só arrumação.
- **`useAsTitle: 'title'`** — que campo mostrar nas listagens para identificar o documento.
- **`livePreview.url`** — dado o documento em edição, que endereço deve o iframe abrir. O `depth: 0` na consulta ao global é uma otimização: só se quer o array `enabledLocales`, não relações nenhumas.

  **Há aqui dois `return undefined`, e só um deles é uma decisão.** Vale a pena perceber a diferença, porque é o exemplo mais nítido do projeto.

  O locale por omissão sai do `mapPayloadSite`, que resolve sempre ([8.2](#82-payloadsitesource-e-a-local-api)). Antes esta função lia `enabledLocales?.[0]` por sua conta e desistia com a lista vazia — a mesma regra escrita em dois sítios, e a cópia sem a rede de segurança do original. Bastava o global estar por preencher para a pré-visualização desaparecer do admin sem explicação. Não se acrescentou aviso nenhum: **eliminou-se a duplicação, e com ela a falha.**

  O `return undefined` que ficou é diferente. Sem `PREVIEW_SECRET`, o link que se gerasse levava um segredo vazio e a rota respondia 403 dentro do iframe — o editor via uma caixa cinzenta e mais nada. Agora o separador simplesmente não aparece, e o servidor regista `PREVIEW_SECRET is not set`. Continua a devolver `undefined`, mas **de propósito e com voz**, que é a distinção que interessa: o problema não é desligar uma funcionalidade, é desligá-la sem dizer.

> 🎯 **Decisão**
>
> Reparar uma falha silenciosa tem duas saídas, e a ordem importa. A primeira é **fazer o caso desaparecer** — foi o que aconteceu ao locale, deduplicando a regra. Só quando o caso é mesmo irredutível (falta configuração obrigatória, não há nada a servir) é que se passa à segunda: **degradar com voz**, nomeando a variável ou o campo que falta.

Os campos, dentro de duas `tabs`:

```ts
{
  name: 'isHome',
  type: 'checkbox',
  label: 'Root Page',
  defaultValue: false,

  admin: { description: 'Use this page as the homepage of the website.' },

  validate: async (value, { id, req }) => {
    if (!value) return true;

    const existingHomepages = await req.payload.find({
      collection: 'pages',
      where: {
        and: [
          { isHome: { equals: true } },
          ...(id ? [{ id: { not_equals: id } }] : []),
        ],
      },
      limit: 1,
    });

    if (existingHomepages.docs.length > 0) {
      return 'A homepage already exists.';
    }

    return true;
  },
}
```

Uma **validação assíncrona que consulta a base de dados**: só pode haver uma homepage. A convenção do Payload é devolver `true` se está bem, ou uma **string com a mensagem de erro** se não está.

O detalhe mais interessante é o `...(id ? [{ id: { not_equals: id } }] : [])`. É espalhamento condicional dentro de um array: se houver `id` (documento existente), acrescenta a condição «excluindo eu próprio»; se não houver (documento novo), acrescenta um array vazio, que desaparece. Sem isto, gravar a homepage existente daria erro contra ela mesma.

> 🎯 **Decisão**
>
> A regra vive no CMS, não no frontend. É o sítio certo: a integridade dos dados é responsabilidade de quem os guarda, e assim a garantia vale para qualquer forma de escrita (admin, API REST, import), não só para o site.

Os restantes campos:

```ts
{ name: 'title', type: 'text', label: 'Title', required: true, localized: true },

breadcrumbsField,

{
  name: 'pageUrl',
  type: 'ui',
  admin: {
    components: { Field: '/providers/payload/components/PageUrl#default' },
  },
},
```

- **`localized: true`** no `title` — este campo tem um valor por idioma. É o que faz o Payload guardar «Sobre nós» e «About us» na mesma página.
- **`breadcrumbsField`** — importado de `plugins/breadcrumbsField.ts` e escondido do admin (`admin: { hidden: true }`). É preenchido pelo plugin, não pelo editor. Nota importante: o `createBreadcrumbsField` do plugin já define **`localized: true`** por omissão, e é isso que permite a cada idioma ter o seu próprio `breadcrumbs.url` — sem isso, a consulta de [8.4](#84-resolvepayloadpage-opção-a-opção) não conseguiria distinguir `/sobre-nos` de `/about-us`.
- **`type: 'ui'`** — um campo que **não guarda nada**. Só desenha alguma coisa no formulário; aqui, o URL público da página, com uma ligação para abrir.

> 📐 **Imposto pelo Payload**
>
> `Field: '/providers/payload/components/PageUrl#default'` é uma **string**, não um import. Tem de ser: o admin do Payload é um bundle separado, e o servidor não pode importar componentes de browser diretamente. O `#default` indica que se quer a exportação por omissão.
>
> A consequência é que **o TypeScript não verifica isto**. Se renomeares o ficheiro, nada acusa — nem o `tsc`, nem o ESLint, nem os testes. O erro aparece em tempo de execução, no admin. O ficheiro `src/app/(payload)/admin/importMap.js` é gerado (`pnpm generate:importMap`) para ligar estas strings aos módulos reais, e **tem de ser regenerado sempre que se mexe nestes caminhos**.

E a segunda tab, que é onde tudo o que vimos no Cap. 6 se liga:

```ts
{
  label: 'Modules',
  fields: [
    { name: 'main', type: 'blocks', label: 'Modules', blocks: pageBlocks },
  ],
}
```

O `type: 'blocks'` é o campo que dá ao editor um construtor de páginas: escolher blocos de uma lista, ordená-los, preenchê-los. O `pageBlocks` vem de `blocks/index.ts` e é hoje `[HeroBlock]`.

O nome do campo — **`main`** — é o mesmo do `PageDefinition.main`. Não é coincidência; é o que faz o mapeamento ser quase uma cópia ([8.5](#85-mappayloadpage-onde-os-dados-mudam-de-forma)).

> ✅ **Corrigido**
>
> O comentário dizia `// Tabls`. Trivial, mas estava lá.

## 9.3 `Media`, `Users` e o global `Site`

**`Media`** — a collection de ficheiros:

```ts
export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: () => true },
  labels: { singular: 'Asset', plural: 'Media' },
  admin: { group: 'Content' },
  upload: true,
  fields: [],
};
```

- **`upload: true`** — transforma a collection num repositório de ficheiros. O Payload trata do armazenamento, das miniaturas e dos metadados sozinho, e é por isso que `fields: []` chega.
- **`access: { read: () => true }`** — a **única** regra de acesso explícita do projeto, e é uma abertura. Sem ela, as imagens do site não carregavam no browser: um `<img src="/api/media/...">` é um pedido anónimo.

  Vale a pena saber o que isto abre além dos ficheiros: torna também a **listagem** legível, ou seja, `/api/media` devolve a lista de assets a quem a pedir. Não é um problema aqui; seria se algum dia houvesse ficheiros com nomes sensíveis.

**`Users`** — `auth: true` e mais nada de relevante. Essa única opção acrescenta email, password, sessões, recuperação de conta e as rotas de login. `useAsTitle: 'email'` mostra o email nas listagens.

**A regra de acesso geral.** As collections `Pages` e `Users` **não declaram `access`**. Isso não quer dizer «aberto» — quer dizer que vale a omissão do Payload, que é «só utilizadores autenticados». Daí o modelo do projeto:

```
Rede (anónimo)   →  Pages: ✗   Users: ✗   Site: ✗   Media: ✓ (leitura)
Local API        →  tudo, porque overrideAccess: true
```

O frontend não é «autorizado»; **passa ao lado** do sistema de acesso, porque lê pela Local API ([8.2](#82-payloadsitesource-e-a-local-api)). Por isso é que o filtro `_status` é indispensável ([8.4](#84-resolvepayloadpage-opção-a-opção)).

**O global `Site`:**

```ts
{
  name: 'enabledLocales',
  type: 'select',
  label: 'Languages',
  hasMany: true,
  required: true,
  options: [...availableLocales],
  admin: {
    description: 'Select the languages available on the site. The first language is the default.',
    isSortable: true,
  },
}
```

- **`hasMany: true`** — escolha múltipla, e o valor é um array.
- **`options: [...availableLocales]`** — as opções vêm da lista técnica ([8.1](#81-localests-uma-lista-três-formas)), no formato `{label, value}` que o `select` espera. O espalhamento é preciso porque `availableLocales` é `readonly` (por causa do `as const`) e o Payload quer um array mutável.
- **`isSortable: true`** — e aqui está a peça que fecha o círculo: **a ordem é editável, e a ordem tem significado**. O primeiro locale é o por omissão ([3.3](#33-o-locale-por-omissão-é-declarado-não-adivinhado)), aquele que não leva prefixo no URL. A `description` diz isso ao editor, que é a única defesa que existe — arrastar um idioma para cima muda todos os URLs do site.

O global tem também um hook, pela mesma razão que a collection `Pages`:

```ts
hooks: {
  afterChange: [revalidateSiteOnChange],
},
```

Sem guarda nenhuma, ao contrário do das páginas: um global não tem versões nem rascunhos, portanto qualquer gravação é uma publicação. E é uma gravação que tem de invalidar mesmo — mudar a ordem dos idiomas muda o locale por omissão, e o `<html lang>` de todas as páginas com ele.

## 9.4 Os plugins: `nestedDocs` e `seo`

**`nestedDocs`** dá hierarquia às páginas: uma página pode ter uma página-mãe, e daí sai o caminho completo.

```ts
export const nestedDocs = nestedDocsPlugin({
  collections: ['pages'],
  breadcrumbsFieldSlug: 'breadcrumbs',

  generateLabel: (_, doc) => (typeof doc.title === 'string' ? doc.title : ''),

  generateURL: (docs) => {
    const segments = docs
      .filter((doc) => !doc.isHome)
      .map((doc) => (typeof doc.title !== 'string' ? '' : createSlug(doc.title)))
      .filter(Boolean);

    return `/${segments.join('/')}`;
  },
});
```

O `generateURL` recebe a cadeia de antepassados, da raiz até ao documento, e devolve o caminho. Três passos:

1. **`.filter((doc) => !doc.isHome)`** — a homepage não contribui com segmento nenhum. É por isso que uma página filha da homepage fica em `/sobre-nos` e não em `/homepage/sobre-nos`. E é também por isso que o `breadcrumbs.url` da própria homepage acaba por ser `/`.
2. **`.map(... createSlug(doc.title))`** — cada título vira um slug.
3. **`.filter(Boolean)`** — deita fora as strings vazias. O `Boolean` como função de filtro é o idiom para «tira os valores falsos».

Os `typeof doc.title === 'string'` existem porque o plugin entrega os documentos com tipos frouxos; é defesa, não paranoia.

O **`createSlug`** merece uma leitura, porque cada passo resolve um problema concreto:

```ts
value
  .normalize('NFD') // "ç" → "c" + cedilha, como dois caracteres
  .replace(/[\u0300-\u036f]/g, '') // deita fora os acentos isolados
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-') // tudo o que não é letra/número vira hífen
  .replace(/^-+|-+$/g, ''); // tira hífens do princípio e do fim
```

Os dois primeiros passos são o truque para tirar acentos: o `NFD` separa a letra do acento, e a gama Unicode `\u0300-\u036f` é exatamente a das marcas diacríticas. «Ação» fica `acao`, «Sobre Nós» fica `sobre-nos`. Sem isto, um título com acentos daria um URL codificado com `%C3%A7`.

**`seo`** acrescenta a tab de SEO às páginas. Duas partes valem nota:

```ts
fields: ({ defaultFields }) => [
  ...defaultFields.map((field) => {
    if ('name' in field && ['title', 'description', 'image'].includes(field.name)) {
      return { ...field, required: false };
    }
    return field;
  }),
  // ogTitle, ogDescription, noIndex, noFollow
],
```

A função recebe os campos que o plugin traz e devolve a lista final. Aqui, os campos por omissão são **tornados opcionais** (o `'name' in field` é preciso porque nem todos os campos do Payload têm `name` — os de layout não têm), e acrescentam-se quatro campos próprios: os dois de Open Graph e os dois de robots. São exatamente os campos que o `Meta` do projeto declara e que o `createMetadata` traduz ([1.5](#15-pagetsx-linha-a-linha)).

## 9.5 O circuito do Live Preview

O live preview é a funcionalidade que atravessa mais camadas do projeto. Vale a pena vê-lo como um circuito completo:

```
1. Editor abre uma página no admin
2. Payload chama Pages.admin.livePreview.url({ data, locale, req })
3. → getLivePreviewUrl() devolve  /next/preview?path=/en/sobre-nos&previewSecret=XXX
4. O iframe do admin abre esse endereço
5. → route handler /next/preview:
      valida o previewSecret
      valida que o path é seguro
      valida a sessão com payload.auth()
      draft.enable()  → grava um cookie
      redirect(path)
6. O site abre em /en/sobre-nos, agora com draftMode ligado
7. → layout.tsx vê isDraft e injeta <PayloadLivePreview />
8. O editor escreve; o autosave grava aos 375 ms
9. → RefreshRouteOnSave ouve o Payload e chama router.refresh()
10. O servidor volta a desenhar, agora com draft: true na consulta
```

**`getLivePreviewUrl`** (passo 3):

```ts
const lastBreadcrumb = breadcrumbs?.[breadcrumbs.length - 1];

const path = typeof lastBreadcrumb?.url !== 'string' ? '/' : lastBreadcrumb.url;

const params = new URLSearchParams({
  path: createPagePath({ path, locale, defaultLocale }),
  previewSecret: process.env.PREVIEW_SECRET ?? '',
});

return `/next/preview?${params.toString()}`;
```

O **último** breadcrumb é o caminho da própria página (os anteriores são os antepassados). O `createPagePath` — a função do `core` ([3.2](#32-getlocalesegment-de-pt-pt-para-pt)) — acrescenta o prefixo de idioma quando é preciso. O `URLSearchParams` trata da codificação, o que evita partir tudo com um caminho que tenha caracteres especiais.

> ⚠ **Lapso, não decisão**
>
> **Por resolver:** o `PREVIEW_SECRET` vai na **query string**, e portanto fica no DOM do admin, no histórico do browser e em qualquer cabeçalho `Referer` que a página previsualizada envie. Um token curto e assinado seria melhor. Ficou deliberadamente de fora por exigir desenho novo, e porque o passo 5 valida também a sessão com `payload.auth()` — está registado no [`TODO.md`](TODO.md). O `?? ''` também faz com que, sem a variável definida, se gere um link que dá sempre 403 sem qualquer aviso.
>
> ✅ **Corrigido**
>
> A função recebia ainda um parâmetro `isHome` que era redundante: como o `generateURL` já exclui a homepage ([9.4](#94-os-plugins-nesteddocs-e-seo)), o `breadcrumbs.url` dela já é `/`. Não fazia mal, mas sugeria uma regra que não existe.

**A rota `/next/preview`** (passo 5) — `src/app/(frontend)/next/preview/route.ts`. Um `route.ts` exporta funções com o nome do método HTTP; aqui, `GET`. As validações estão pela ordem certa (barato primeiro, caro depois):

```ts
if (!previewSecret || previewSecret !== process.env.PREVIEW_SECRET) {
  return new Response('Invalid preview secret', { status: 403 });
}

if (!isSafeRedirectPath(path)) {
  return new Response('Invalid path', { status: 400 });
}

const payload = await getPayload({ config });
const { user } = await payload.auth({ headers: request.headers });

if (!user) {
  return new Response('Unauthorized', { status: 401 });
}

const draft = await draftMode();
draft.enable();

redirect(path);
```

A segunda validação existe para prevenir um **open redirect**: sem ela, `?path=https://sitemau.com` fazia o teu domínio reencaminhar visitantes para outro lado — útil para phishing.

Vale a pena abrir o `isSafeRedirectPath` (em `src/core/routing/`), porque a armadilha não é óbvia:

```ts
if (!path || !path.startsWith('/')) return false;

// "//host" e "/\host" — ambos saem da origem.
if (/^\/[\\/]/.test(path)) return false;

return new URL(path, PROBE_ORIGIN).origin === PROBE_ORIGIN;
```

Rejeitar `//` não chega. Para esquemas especiais (`http`, `https`), a norma do WHATWG manda tratar `\` como `/` — portanto `/\sitemau.com` é normalizado por vários browsers para `//sitemau.com` e saía do domínio. A última linha é o cinto e os suspensórios: resolve o caminho contra uma origem de teste e confirma que a origem não mudou; se mudou, o caminho não era relativo.

Está numa função à parte por dois motivos: fica testável sem levantar a rota (`isSafeRedirectPath.test.ts`), e a regra passa a ter um nome.

E está no `core/routing` e não ao lado da rota porque é o mesmo género de coisa que o `createPagePath` e o `resolveRoute`: pura, sem dependências, sobre caminhos. O único consumidor é o preview, mas a regra não é sobre preview.

Boa prática a notar: valida o segredo **e** a sessão (`payload.auth`). Nenhum dos dois sozinho chegaria; um segredo que vaza deixa de bastar se também for preciso ter sessão iniciada no admin.

**`PayloadLivePreview`** (passo 7) — um dos dois únicos componentes de browser do projeto ([0.11](#011-server-components-e-client-components)):

```tsx
'use client';

export default function PayloadLivePreview() {
  const router = useRouter();

  return (
    <RefreshRouteOnSave
      refresh={() => router.refresh()}
      serverURL={process.env.NEXT_PUBLIC_SERVER_URL ?? ''}
    />
  );
}
```

O `RefreshRouteOnSave` ouve as mensagens que o admin do Payload envia quando grava, e chama o `refresh`. O `router.refresh()` do Next volta a pedir a página **ao servidor** e substitui o HTML, mantendo o estado do lado do cliente.

> 🎯 **Decisão**
>
> É live preview **server-side**: em vez de o browser reconstruir a página com os dados novos (o que exigiria duplicar a lógica de renderização em JavaScript de cliente), pede-se ao servidor que a volte a desenhar. Mais simples, e garante que a pré-visualização é exatamente igual ao resultado final.

Nota sobre o `NEXT_PUBLIC_SERVER_URL`: o prefixo é obrigatório porque este código corre no browser ([11.5](#115-as-variáveis-de-ambiente-uma-a-uma)).

**A saída** — `next/exit-preview/route.ts` é curta:

```ts
export async function POST(): Promise<Response> {
  const draft = await draftMode();
  draft.disable();

  return new Response('Draft mode disabled');
}

export async function GET(): Promise<Response> {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST' },
  });
}
```

> 🎯 **Decisão**
>
> É `POST`, e não `GET`, porque desligar o modo rascunho **muda estado**. Enquanto era um `GET` anónimo, qualquer site podia incluir `<img src="https://oteusite.pt/next/exit-preview">` e desligar o modo rascunho a um editor que por lá passasse — CSRF num GET. O impacto era baixo (um incómodo, não uma fuga), mas a regra geral é boa e vale a pena tê-la interiorizada: **um GET não deve ter efeitos**. O `GET` fica a responder 405 com o cabeçalho `Allow`, para quem chamar o endereço à mão perceber o que fazer.
>
> Se acrescentares um botão de «sair da pré-visualização», tem de fazer `fetch('/next/exit-preview', { method: 'POST' })` — um `<a href>` já não serve.

**O campo `PageUrl`** é o companheiro disto no admin: mostra ao editor o URL público da página. E é o melhor exemplo do projeto de uma correcção que se faz a **apagar** código.

A versão original era um único componente cliente com um `useEffect` que fazia dois `fetch` sequenciais à API REST do Payload — o global `Site`, para saber o locale por omissão, e depois a própria página, para os breadcrumbs. Tinha quatro problemas:

|                       |                                                                               |
| --------------------- | ----------------------------------------------------------------------------- |
| quatro `return` mudos | uma resposta sem `ok` desistia sem dizer nada ao editor nem ao log            |
| sem `AbortController` | trocar de idioma a meio de um pedido escrevia estado de uma resposta obsoleta |
| `void loadData()`     | a promise era descartada, e uma falha de rede virava _unhandled rejection_    |
| `enabledLocales?.[0]` | a terceira cópia da regra do locale por omissão, sem a queda do original      |

A tentação é corrigi-los um a um: apanhar a promise, pôr o `AbortController`, mostrar um estado de erro. Todos legítimos, e todos a tratar o sintoma.

**A pergunta certa é porque é que um componente dentro do admin do Payload está a pedir dados ao Payload por HTTP.** Não estava, por escolha — estava porque era cliente, e um componente cliente não tem Local API.

A correcção foi deixar de ser cliente. Um componente de campo **de servidor** recebe nas props tudo o que este campo precisa:

```
PageUrl.tsx   data          → os breadcrumbs do documento
              req.locale    → o idioma escolhido no admin
              req.origin    → a origem do pedido
              req.payload   → a Local API, para o global Site
```

**Zero pedidos, e zero JavaScript no browser.** Os quatro problemas não foram corrigidos — deixaram de ter onde existir. Não há resposta para vir sem `ok`, não há corrida para abortar, não há promise para apanhar. A quarta linha resolve-se pelo `mapPayloadSite`, que é onde a regra mora ([8.2](#82-payloadsitesource-e-a-local-api)).

Houve um passo intermédio que vale a pena contar, porque é um erro fácil: o campo chegou a ficar partido em dois — um componente de servidor a ler o global e a passar valores por prop a um componente cliente que lia os breadcrumbs pelo `useDocumentInfo()`. Funcionava, mas a divisão não se justificava: bastou olhar para o tipo `ServerComponentProps` para ver que o servidor já recebia o `data` e o `req.locale`, e a metade cliente ficou sem razão de existir.

E vir tudo do mesmo render fecha uma inconsistência que a versão em duas metades não conseguia evitar: o `useLocale()` muda de imediato ao trocar de idioma, mas os breadcrumbs chegariam noutro momento — e entre os dois há um instante com o prefixo de um idioma e o caminho do outro.

> 🎯 **Decisão**
>
> Havia ainda um `window.location.origin` lido durante o render. Só não rebentava em SSR **por acidente**: o `useEffect` fazia o componente devolver `null` no primeiro render, e nessa altura o `window` não chegava a ser tocado. Tirado o `useEffect`, o acidente deixava de proteger — e num componente de servidor o `window` nem existe. A origem passou a vir do `req.origin`, que é onde ela é conhecida sem adivinhar.
>
> Vale a pena guardar o padrão: quando uma correcção óbvia é adicionar defesas (`AbortController`, `try/catch`, estado de erro), pergunta primeiro se o caminho que precisa de defesas tinha de existir.

---

# Cap. 10 — De volta ao render

Voltemos ao percurso. O `page.tsx` tem um `PageDefinition` e chamou `<PageRenderer page={...} foundation={...} />`. Faltam duas peças até sair HTML.

## 10.1 `PageRenderer`: as três regiões

`src/core/renderer/PageRenderer.tsx`:

```tsx
export function PageRenderer({ page, foundation }: PageRendererProps) {
  return (
    <>
      {page.navigation && (
        <nav>
          <ModuleRenderer module={page.navigation} foundation={foundation} />
        </nav>
      )}

      <main>
        {page.main.map((module) => (
          <Fragment key={module.id}>
            <ModuleRenderer module={module} foundation={foundation} />
          </Fragment>
        ))}
      </main>

      {page.footer && (
        <footer>
          <ModuleRenderer module={page.footer} foundation={foundation} />
        </footer>
      )}
    </>
  );
}
```

O componente **não sabe o que é um hero**. Sabe que uma página tem três regiões e que cada uma se desenha com um `ModuleRenderer`. É esta ignorância que faz o sistema funcionar: acrescentar módulos nunca obriga a tocar aqui.

- **`<>...</>`** é a forma curta de `<Fragment>` — agrupa elementos sem acrescentar um `<div>` ao HTML.
- **`page.navigation &&`** e **`page.footer &&`** — são opcionais no contrato ([6.2](#62-os-tipos-um-a-um)). Hoje **nenhum provider os preenche**, portanto na prática só o `<main>` é desenhado. A estrutura está pronta e à espera.
- **`key={module.id}`** — o `key` é como o React identifica cada item entre re-renders, para saber o que mudou. Tem de ser **estável e único**. O `module.id` vem do Payload e cumpre as duas condições. Usar o índice do array seria um erro clássico: reordenar dois módulos no CMS faria o React pensar que o conteúdo mudou em vez de a ordem, e o estado dos componentes ia parar aos sítios errados.
- **Porquê o `Fragment` explícito à volta**, se o `ModuleRenderer` já é um elemento só? Porque o `key` tem de estar no elemento de topo do `.map()`. Podia estar diretamente no `<ModuleRenderer key={...}>`; envolver num `Fragment` deixa espaço para acrescentar um wrapper por módulo depois sem mexer na chave. É uma questão de gosto.

> 🎯 **Decisão**
>
> As três regiões trazem o seu _landmark_ do HTML — `<nav>`, `<main>`, `<footer>`. Antes só o `<main>` o tinha, e a navegação e o rodapé eram desenhados como módulos soltos: a estrutura de acessibilidade ficava dependente de cada módulo se lembrar de a fazer, e nada o verificava. Aqui é garantido uma vez, para todos.
>
> Consequência para quem escreve módulos: **um módulo de navegação não deve trazer o seu próprio `<nav>`**, senão ficam dois encaixados. O invólucro é responsabilidade do renderer.

## 10.2 `ModuleRenderer`, linha a linha

`src/core/renderer/ModuleRenderer.tsx` — 43 linhas, e é o coração do sistema.

```tsx
const definition = foundation.modules.getByAlias(module.alias);

if (!definition) {
  if (process.env.NODE_ENV === 'development') {
    throw new ModuleRenderError(`Module "${module.alias}" is not registered.`);
  }

  return <ModuleErrorFallback alias={module.alias} />;
}
```

**Passo 1 — juntar as duas metades.** Chega uma `ModuleInstance` (dados, vindos do CMS) e procura-se a `Module` correspondente (o componente, vindo do código). É a ligação de [6.1](#61-definição-e-instância-a-distinção-central) a acontecer.

Falhar aqui quer dizer que o CMS tem um bloco que o código não conhece — tipicamente, o `alias` e o `slug` não batem certo ([6.6](#66-o-alias-é-a-cola)), ou alguém se esqueceu de exportar o módulo no barrel.

```tsx
let data = module.data;

if (!definition.schema && process.env.NODE_ENV === 'development') {
  console.warn(
    `Module "${module.alias}" has no schema: its data reaches the component unvalidated.`,
  );
}

if (definition.schema) {
  try {
    data = definition.schema.parse(module.data);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      throw new ModuleValidationError(`Module "${module.alias}" data validation failed.`, {
        cause: error,
      });
    }

    return <ModuleErrorFallback alias={module.alias} />;
  }
}
```

**Passo 2 — validar.** É aqui que o zod entra ([0.12](#012-se-o-typescript-já-valida-tipos-para-que-serve-o-zod)), e é este `parse` que torna verdadeira a asserção de tipo do `createModuleComponent` ([6.4](#64-createmodulecomponent-o-adaptador-e-onde-ele-mente)).

Repara no `let data = module.data` seguido de reatribuição: o `parse` do zod **devolve** os dados validados, e não são necessariamente os mesmos objetos — o zod pode aplicar transformações, valores por omissão, coerções. Usa-se sempre o valor devolvido, nunca o original.

E repara no `if (definition.schema)`: **sem schema, não há validação nenhuma** e o `data` passa em bruto. É a razão pela qual a regra prática é «põe sempre schema».

> 🎯 **Decisão**
>
> O `schema` continua **opcional** no contrato ([6.2](#62-os-tipos-um-a-um)), mas um módulo sem ele passa a gritar em desenvolvimento. Torná-lo obrigatório era a alternativa, e mais rígida — a razão para não o fazer é que há usos legítimos de um módulo sem schema (um bloco sem campos nenhuns, um protótipo), e um aviso visível resolve o problema real, que era ser **silencioso**.
>
> Repara que este `console.warn` é intencional e diz alguma coisa — ao contrário do `console.error(process.env.NODE_ENV === 'development')` que existiu no `ModuleErrorFallback` e imprimia um booleano solto. A diferença entre um log útil e lixo esquecido é exatamente esta.

```tsx
const Component = definition.component;

return <Component {...data} />;
```

**Passo 3 — desenhar.** A variável tem de começar por maiúscula, pela mesma razão do `Preview` em [1.4](#14-layouttsx-linha-a-linha). O `{...data}` espalha o objeto validado como props.

Todo o sistema de módulos existe para estas três linhas: procurar, validar, desenhar.

## 10.3 A assimetria dev/prod

O padrão repete-se nos dois blocos e é uma das melhores decisões do projeto:

```
desenvolvimento  →  throw   (a página inteira rebenta, com o erro em cima)
produção         →  fallback (o módulo desaparece, o resto da página sobrevive)
```

E o fallback, `src/core/renderer/ModuleErrorFallback.tsx`, faz o mesmo em espelho: em desenvolvimento mostra uma caixa com o alias em falta; em produção devolve `null`.

> 🎯 **Decisão**
>
> As duas audiências querem coisas opostas. **Em desenvolvimento** o pior resultado é um erro silencioso: um módulo que desaparece e ninguém repara até estar em produção. Por isso rebenta com estrondo — é impossível ignorar. **Em produção** o pior resultado é uma página em branco por causa de um bloco: um editor mete um valor inesperado e o site inteiro cai. Por isso degrada — perde-se um módulo, salva-se a página.
>
> Isto chama-se degradação graciosa, e o detalhe importante é que a decisão é tomada **por módulo**, não pela página. É a razão de existir do `ModuleRenderer` como componente separado do `PageRenderer`.

Vale notar o contraste com o `mapPayloadPage`, que atira um `Error` normal quando falta um `id` ([8.5](#85-mappayloadpage-onde-os-dados-mudam-de-forma)) — aí não há isolamento nenhum, e um bloco estragado derruba a página toda, em produção também. As duas fronteiras deviam tratar o problema da mesma maneira.

**A jusante, quem apanha o que escapa.** Um `throw` em desenvolvimento — ou um erro da base de dados em produção — sobe acima do `ModuleRenderer`, e para isso existem dois ficheiros no segmento dinâmico:

- **`error.tsx`** apanha qualquer erro lançado ao desenhar a página. Tem de ser Client Component (`'use client'`) porque recebe um `reset()` que se liga a um botão — é exigência do Next, não escolha. Em produção o Next **não** envia a mensagem do erro para o browser; envia um `digest`, e é por ele que se encontra o stack trace real nos logs do servidor. Daí o guia mostrá-lo na página.
- **`not-found.tsx`** é o que o `notFound()` de [1.5](#15-pagetsx-linha-a-linha) desenha. Sem ele, um 404 caía na página genérica do Next, **fora** do layout do site.

Ambos ficam dentro de `[[...segments]]/`, ao lado do `layout.tsx`.

> ⚠ **Estes dois ficheiros existem mas ainda não são usados**
>
> Verificado a correr: um pedido a uma rota inexistente responde 404 com `<html id="__next_error__">` — o invólucro interno do Next —, não com o `not-found.tsx` deste projeto.
>
> A causa é estrutural. Quando se usam **route groups como raízes separadas**, o Next exige o layout de raiz **no topo do grupo**. O `(payload)` cumpre (`app/(payload)/layout.tsx`); o `(frontend)` **não tem** `app/(frontend)/layout.tsx` — o seu layout está um nível abaixo, dentro de `[[...segments]]`. Sem layout de raiz no grupo, o boundary do not-found não tem `<html>` onde renderizar, e o Next cai no seu próprio.
>
> É o preço concreto da decisão descrita em [1.4](#14-layouttsx-linha-a-linha) — pôr o `<html>` dentro do segmento dinâmico para o `lang` poder vir da página. Resolver implica escolher: subir o `<html>` para o topo do grupo e perder o `lang` por página, ou passar o locale a segmento real de rota (`app/[locale]/`), que é como a maioria dos projetos multilingues em Next o faz. Está no [`TODO.md`](TODO.md).

Continua a não haver uso de `<Suspense>` nem `loading.tsx`: cada pedido bloqueia na consulta completa antes de emitir HTML. Como o `PageRenderer` já isola os módulos, Suspense por região encaixa naturalmente quando isso passar a doer.

> ✅ **Corrigido**
>
> O `ModuleErrorFallback` tinha, como primeira instrução, um `console.error(process.env.NODE_ENV === 'development');` que imprimia um booleano solto de cada vez que um módulo falhava — debug esquecido. Desenhava também um `<h1>`, que acrescentava um segundo título de primeiro nível à página; hoje é um `<p><strong>`.

## 10.4 As classes de erro e o `cause`

`src/core/errors/ModuleRenderError.ts`:

```ts
export class ModuleRenderError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ModuleRenderError';
  }
}
```

O `ModuleValidationError` é idêntico. São o terceiro caso da regra de [0.1](#01-classe-ou-função-a-regra-deste-projeto): classes porque só com classes se pode fazer `catch (e) { if (e instanceof ModuleValidationError) ... }`.

O `this.name` é o que faz a consola escrever `ModuleValidationError: ...` em vez de `Error: ...`. Sem ele, a subclasse herdava o nome da mãe e o stack trace ficava mudo sobre o tipo real.

O **`options`** é `ErrorOptions`, o tipo padrão do JavaScript, e o que interessa lá dentro é o `cause` — usado em `ModuleRenderer.tsx:31`:

```ts
throw new ModuleValidationError(`Module "${module.alias}" data validation failed.`, {
  cause: error,
});
```

O `cause` **encadeia** erros: guarda o erro original (aqui, o do zod, com a lista exata dos campos que falharam) dentro do erro novo. Ficam os dois níveis de informação — «o módulo hero não validou» _e_ «porque o `title` era `null`». Sem `cause`, ou se perdia o contexto do zod, ou se perdia o do módulo.

É JavaScript padrão desde o ES2022, e o `ApiRequestError` do provider `api` usa exatamente o mesmo padrão.

---

# Cap. 11 — O que sustenta tudo

O percurso está fechado — de `GET /en/sobre-nos` até HTML. Este capítulo é a infraestrutura à volta.

## 11.1 `package.json`, script a script

```json
"type": "module",
```

O projeto é **ESM**: `import`/`export`, não `require`. Consequência prática que já apareceu duas vezes: **não existe `__dirname`**, e é por isso que o `payload.config.ts:16-17` o reconstrói a partir de `import.meta.url`.

```json
"dev": "pnpm lint && pnpm typecheck && next dev",
```

Corre lint e verificação de tipos **antes** de arrancar. É invulgar — o normal é `next dev` e nada mais — e custa alguns segundos de cada vez. O ganho é apanhar erros de imediato em vez de os descobrir no commit.

| Script                    | O que faz                                                                |
| ------------------------- | ------------------------------------------------------------------------ |
| `dev`                     | lint + typecheck + servidor de desenvolvimento                           |
| `dev:payload`             | regenera os tipos e o importMap do Payload e depois faz `dev`            |
| `build` / `start`         | build de produção / servir o build                                       |
| `lint`                    | `eslint .`                                                               |
| `typecheck`               | `tsc --noEmit` — verifica tipos sem gerar ficheiros                      |
| `test`                    | `vitest` em modo de observação. Uma só passagem: `pnpm test --run`       |
| `format` / `format:check` | prettier a escrever / só a verificar                                     |
| `generate:types`          | regenera o `payload-types.ts` a partir das collections                   |
| `generate:importMap`      | regenera o mapa dos componentes de admin ([9.2](#92-a-collection-pages)) |
| `generate:payload`        | os dois acima                                                            |
| `prepare`                 | instala os hooks do husky (corre sozinho depois do `install`)            |

**Quando é preciso correr o `generate:payload`:** sempre que mexeres em collections, globals, blocos ou campos — os tipos gerados deixam de bater certo — e sempre que mexeres em caminhos de componentes de admin. É o passo esquecido mais comum, e o sintoma é o TypeScript a queixar-se de campos que tu juraste ter criado.

O `cross-env` nos scripts de geração existe para a variável `PAYLOAD_CONFIG_PATH` funcionar igual em Windows e em Unix.

## 11.2 `tsconfig.json`, opção a opção

| Opção                                                      | O que faz                                                                                                                                      |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `"strict": true`                                           | liga todas as verificações rigorosas de uma vez (`strictNullChecks`, `noImplicitAny`, etc.). É a única linha realmente importante do ficheiro. |
| `"target": "ES2017"`                                       | nível de JavaScript gerado                                                                                                                     |
| `"lib": ["dom", "dom.iterable", "esnext"]`                 | que APIs existem: DOM (browser) e as mais recentes da linguagem                                                                                |
| `"module": "esnext"` + `"moduleResolution": "bundler"`     | deixa o bundler resolver imports; permite omitir extensões e usar `exports` dos pacotes                                                        |
| `"jsx": "react-jsx"`                                       | a transformação moderna de JSX — é por isto que não é preciso `import React` em cada ficheiro                                                  |
| `"noEmit": true`                                           | o TypeScript só verifica; quem compila é o Next                                                                                                |
| `"isolatedModules": true`                                  | cada ficheiro tem de ser compilável isoladamente (exigência do SWC/esbuild)                                                                    |
| `"skipLibCheck": true`                                     | não verifica os tipos dentro do `node_modules` — mais rápido, e evita erros de bibliotecas que não são teus                                    |
| `"esModuleInterop": true`                                  | permite `import x from 'pacote-commonjs'`                                                                                                      |
| `"resolveJsonModule": true`                                | permite importar `.json`                                                                                                                       |
| `"incremental": true`                                      | guarda cache entre execuções do `tsc`                                                                                                          |
| `"plugins": [{ "name": "next" }]`                          | dá ao editor as verificações específicas do Next                                                                                               |
| `"types": ["vitest/globals", "@testing-library/jest-dom"]` | põe `describe`/`it`/`expect` e os matchers do jest-dom disponíveis sem import ([11.4](#114-testes-lint-e-o-hook-de-pre-commit))                |

E os **`paths`**, que são os que vês em todos os imports do projeto:

```json
"@/*": ["./src/*"],
"@payload-config": ["./payload.config.ts"],
"@payload-types": ["./payload-types.ts"]
```

O `@/` evita cadeias de `../../../`. Os outros dois são exigidos pelo Payload, que espera encontrar a config e os tipos gerados por estes nomes exatos.

**Uma opção que não está lá e faria diferença:** `noUncheckedIndexedAccess`. Sem ela, `array[0]` tem o tipo do elemento; com ela, tem `elemento | undefined`, o que obriga a tratar o caso de o array estar vazio. É a razão pela qual `locales[0]` ([3.3](#33-o-locale-por-omissão-é-declarado-não-adivinhado)), `docs[0]` ([8.4](#84-resolvepayloadpage-opção-a-opção)) e `split('-')[0]` ([3.2](#32-getlocalesegment-de-pt-pt-para-pt)) compilam sem guardas. Ligá-la agora obrigaria a algumas correções, mas apanhava exatamente a classe de bugs que este projeto mais tem.

## 11.3 `next.config.ts`

Oito linhas:

```ts
const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default withPayload(nextConfig);
```

- **`reactCompiler: true`** — liga o React Compiler, que memoriza componentes automaticamente em tempo de compilação. Na prática: deixa de ser preciso escrever `useMemo`, `useCallback` e `React.memo` à mão. Num projeto quase todo de Server Components tem pouco efeito hoje; passa a contar quando aparecerem módulos interativos.
- **`withPayload(...)`** — o Payload precisa de acrescentar as suas próprias configurações (aliases, `serverExternalPackages`, tratamento de ficheiros). Este _wrapper_ pega na tua config e devolve-a completada. É por isso que o `export default` é a chamada e não o objeto.

## 11.4 Testes, lint e o hook de pre-commit

**`vitest.config.ts`:**

```ts
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => ({
  resolve: { alias: { '@': path.resolve(dirname, './src') } },
  test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'] },
}));
```

O alias `@` tem de ser repetido aqui, porque o Vitest não lê o `tsconfig`. O `environment: 'jsdom'` simula um DOM em Node, para se poder renderizar componentes nos testes.

> ✅ **Corrigido**
>
> A config usava `__dirname`, que não existe num projeto `"type": "module"` — funcionava só porque o Vite pré-processa o ficheiro, e o próprio Vite já avisava que o futuro `configLoader: 'native'` deixaria de o suportar. Hoje deriva de `import.meta.url`, como o `payload.config.ts` sempre fez.

**O estado dos testes.** São 17 ficheiros e 113 casos, colocados ao lado do código que testam (sem pasta `__tests__/`). Cobrem o `core` (registry, renderer, routing), o transporte do provider `api`, e a fronteira do provider Payload: o `resolvePayloadPage` e o `mapPayloadPage`.

Vale a pena saber o que o `resolvePayloadPage.test.ts` está lá a fazer, porque não é cobertura por cobertura: com `overrideAccess: true`, o filtro `_status: 'published'` é a única coisa que mantém rascunhos fora do site público ([8.4](#84-resolvepayloadpage-opção-a-opção)). Há dois testes só para essa condição — um a confirmar que ela existe fora do modo rascunho, outro a confirmar que desaparece dentro dele. Se alguém a apagar num refactor, os testes falham em vez de o site passar a servir conteúdo por publicar em silêncio.

Continua a não haver testes para `src/modules` nem para os componentes de admin, e não há cobertura configurada nem E2E.

**O hook de pre-commit** (`.husky/pre-commit`):

```
pnpm lint-staged
pnpm lint
pnpm typecheck
pnpm test --run
```

A ordem é do mais barato para o mais caro, para falhar cedo. O `lint-staged` corre o prettier só nos ficheiros em staging.

**Onde estão os portões.** Não existe CI neste repositório, e o deploy vai para o Vercel. Como um `git commit --no-verify` contorna o hook por inteiro, o `build` foi feito portão explícito:

```json
"build": "pnpm lint && pnpm typecheck && pnpm test --run && next build"
```

Assim nada chega a produção sem passar eslint, TypeScript e a suite de testes — independentemente do que o `next build` verifique por sua conta. O preço são alguns segundos por deploy.

| Momento      | O que corre                                              |
| ------------ | -------------------------------------------------------- |
| `pnpm dev`   | `lint`, `typecheck`                                      |
| pre-commit   | `lint-staged`, `lint`, `typecheck`, `test --run`         |
| `pnpm build` | `lint`, `typecheck`, `test --run`, e depois `next build` |

## 11.5 As variáveis de ambiente, uma a uma

| Variável                 | Quem a usa                                            | Obrigatória           | Nota                                                                         |
| ------------------------ | ----------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------- |
| `PROVIDER`               | `createProvider.ts:8`                                 | não                   | `payload` (omissão), `api` ou `mock`. Valor desconhecido derruba o arranque. |
| `DATABASE_URL`           | `payload.config.ts`                                   | **sim**               | ligação ao Postgres. Via `requireEnv` — sem ela a aplicação não arranca.     |
| `PAYLOAD_SECRET`         | `payload.config.ts`                                   | **sim**               | assina as sessões. Também via `requireEnv`.                                  |
| `NEXT_PUBLIC_SERVER_URL` | `payload.config.ts:24`, `PayloadLivePreview.tsx:13`   | não                   | o URL público. Sem ela, `http://localhost:3000`.                             |
| `PREVIEW_SECRET`         | `getLivePreviewUrl.ts:26`, `next/preview/route.ts:13` | para live preview     | ver ⚠ em [9.5](#95-o-circuito-do-live-preview).                              |
| `API_URL`                | `createApiClient.ts`                                  | só com `PROVIDER=api` | também via `requireEnv`.                                                     |
| `API_TOKEN`              | `createApiClient.ts`                                  | não                   | vira `Authorization: Bearer ...`.                                            |
| `API_REVALIDATE`         | `createApiClient.ts:6`                                | não                   | segundos de cache; 60 por omissão. Atira se não for um inteiro não-negativo. |

As três obrigatórias passam pelo mesmo `requireEnv` de `src/providers/requireEnv.ts`, que atira com o nome da variável e quem precisa dela. Configuração em falta derruba o arranque em vez de degradar em silêncio — há um `.env.example` na raiz para copiar.

**O prefixo `NEXT_PUBLIC_` é a única coisa aqui que tens mesmo de interiorizar.** No Next.js:

- Sem prefixo → a variável **só existe no servidor**. O valor é substituído no código de servidor e nunca chega ao browser.
- Com `NEXT_PUBLIC_` → o valor é **embebido no JavaScript enviado ao browser**, em texto simples, visível a qualquer pessoa que abra as ferramentas de programador.

Por isso `PAYLOAD_SECRET` e `DATABASE_URL` **nunca** podem levar o prefixo, e `NEXT_PUBLIC_SERVER_URL` leva-o porque o `PayloadLivePreview` corre no browser ([9.5](#95-o-circuito-do-live-preview)) e precisa dele.

> ⚠ **Nota de segurança**
>
> O `.env.local` não está versionado (o `.gitignore` cobre `.env*`), mas contém credenciais reais — a ligação de Postgres com password, o `PAYLOAD_SECRET` e o `PREVIEW_SECRET`. **Convém rodá-las** e guardá-las nas variáveis de ambiente do Vercel, não em disco.
>
> O `.env.example` já existe e é a lista do que é preciso configurar. Repara na exceção `!.env.example` no `.gitignore` — sem ela o padrão `.env*` também o apanhava, e o ficheiro nunca chegava ao repositório.

## 11.6 As convenções de ficheiros

O projeto usa um **vocabulário fechado** de sufixos. Está em [`conventions.md`](conventions.md); resumo do essencial:

| Sufixo        | Contém                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------ |
| `.types.ts`   | só tipos e interfaces                                                                      |
| `.schema.ts`  | um schema de validação                                                                     |
| `.module.ts`  | uma definição de módulo (**não** é CSS Module — ver [6.5](#65-o-hero-ficheiro-a-ficheiro)) |
| `.test.ts(x)` | testes, ao lado do código testado                                                          |
| sem sufixo    | implementação                                                                              |

E as regras à volta:

- **PascalCase** para ficheiros cuja exportação principal é uma classe, um componente ou um tipo (`Registry.ts`, `Hero.tsx`, `Page.types.ts`). **camelCase** para funções (`resolveRoute.ts`, `createSlug.ts`).
- **O ficheiro chama-se como a sua exportação principal.** Procurar `mapPayloadPage` no explorador encontra o ficheiro.
- **Não existe uma pasta `src/types/`.** Os tipos vivem ao lado de quem os usa.
- **Uma pasta justifica-se a partir de dois ficheiros.** É por isso que não há `src/components/`.
- **Barrels:** um por fronteira pública, nunca na raiz de uma camada, nunca a exportar um singleton ([0.9](#09-barrels-indexts-e-a-regra-dos-efeitos-secundários)).
- **Ordem dos imports:** externos → alias `@/` → relativos, separados por linha em branco.

Vale a pena segui-las mesmo quando parecem excessivas: a razão de o projeto se ler bem com 100 ficheiros é não haver duas maneiras de fazer a mesma coisa.

### Porque é que `SiteSource.ts` não é `Site.source.ts`

É a pergunta que a pasta `core/site/` levanta a quem chega, porque tem os dois sistemas lado a lado:

```
core/site/
├── Site.types.ts    → SiteDefinition   (contrato)
└── SiteSource.ts    → class SiteSource  (coisa)
```

Não é incoerência — são dois sistemas com âmbitos diferentes. **`<Assunto>.<papel>.ts`** é para ficheiros que _descrevem_ um assunto (`Site.types.ts`, `Hero.schema.ts`). **`<NomeDoExport>.ts`** é para ficheiros que _são_ uma coisa com nome próprio (`SiteSource.ts`, `Registry.ts`, `createSlug.ts`). `SiteSource` é uma classe que se instancia e se estende; `SiteDefinition` é a forma de um dado. Papéis diferentes, sistemas diferentes. E `source` não entra no vocabulário de sufixos, que é fechado de propósito.

A mesma pergunta aparece nos tipos: **porque é que uns estão em `.types.ts` e outros não?** O critério é se o tipo **viaja**. `PageDefinition`, `SiteDefinition`, `Foundation`, `Provider` atravessam camadas — são contratos, e têm ficheiro próprio. `GetPageOptions`, `ResolvedRoute`, `ResolvedPage`, `PageRequestContext` descrevem só o input ou o output de **uma** função, e ficam ao lado dela: separá-los da função tirava-lhes o contexto que lhes dá sentido.

Há ainda um terceiro caso, mais raro: um ficheiro que junta ajudantes irmãos sem que nenhum domine leva um nome colectivo — `locales.ts`, `normalize.ts`. É excepção, não porta aberta.

> ⚠ **Uma armadilha do Windows que parte o build no Vercel**
>
> O git corre aqui com `core.ignorecase = true`. Consequência: **renomear um ficheiro só na caixa não é detectado**. O disco fica `Foo.ts`, o índice do git continua `foo.ts`, e localmente corre tudo bem — mas o Linux do Vercel faz checkout de `foo.ts`, o `import './Foo'` não resolve, e o build parte sem nada ter avisado antes.
>
> Já aconteceu duas vezes neste repositório (`foundation.ts` e `createModuleComponent.tsx`). Corrige-se forçando o índice, não renomeando:
>
> ```sh
> git rm --cached src/caminho/Antigo.ts
> git add src/caminho/antigo.ts
> ```
>
> Para detectar, compara `git ls-files` com os nomes reais da árvore — **a comparação tem de ser sensível a maiúsculas**, senão não vês nada.

---

# Cap. 12 — O provider `api`

Um caminho alternativo, para quando os dados vêm de uma API externa em vez de um CMS próprio. **O transporte está feito e testado; o mapeamento está deliberadamente por escrever.** Vale a pena ler mesmo que nunca o uses, porque tem decisões que contrastam bem com as do lado do Payload.

**`ApiClient`** (`src/providers/api/ApiClient.ts`) — uma classe com um método público:

```ts
export class ApiClient {
  constructor(private readonly config: ApiConfig) {}

  async get(path: string, options: ApiRequestOptions = {}): Promise<unknown> {
```

O `private readonly config` no construtor é atalho do TypeScript: declara a propriedade e atribui-a numa só linha. E é o segundo caso da regra de [0.1](#01-classe-ou-função-a-regra-deste-projeto) — uma classe porque guarda estado (a configuração) entre chamadas.

O retorno é **`unknown`**, de propósito: o cliente não sabe nem quer saber o que a API devolve. Quem sabe é o mapeador. `unknown` obriga quem recebe a verificar antes de usar ([6.2](#62-os-tipos-um-a-um)).

O tratamento de erros distingue quatro situações, e a distinção é o que faz um cliente utilizável:

| Situação                     | Resultado                                        |
| ---------------------------- | ------------------------------------------------ |
| A rede falha (`fetch` atira) | `ApiRequestError` com o erro original em `cause` |
| Resposta 404                 | **`undefined`** — não é erro, é «não existe»     |
| Outro estado não-2xx         | `ApiRequestError` com o `status`                 |
| Corpo que não é JSON         | `ApiRequestError` a dizê-lo                      |

O 404 devolver `undefined` alinha com o contrato do `PageSource` ([0.2](#02-classe-abstrata-o-contrato-que-obriga)), que promete `PageDefinition | undefined`. Tem um senão: um `API_URL` mal escrito produz 404 em tudo, e o site responde 404 em silêncio em vez de dizer que a configuração está errada.

**O cache**, em `createInit`:

```ts
if (draft) {
  return { headers, cache: 'no-store' };
}

return { headers, next: { revalidate: this.config.revalidate, tags } };
```

Em rascunho nunca se guarda nada; fora dele, usa-se o cache do Next com revalidação por tempo e com **tags** para invalidação seletiva. A regra do rascunho é a mesma do provider do Payload ([8.6](#86-a-cache-o-que-sobrevive-ao-pedido)) — a diferença é o mecanismo: aqui vem de graça com o `fetch` do Next, lá foi preciso o `unstable_cache`, porque a Local API não passa por `fetch` nenhum.

Duas notas honestas sobre o estado atual: **nada no projeto chama `revalidateTag`**, portanto as tags ainda não servem para nada; e as tags (`ApiPageSource.ts:34`) **não incluem o locale**, o que numa API multilingue faria idiomas diferentes partilharem a mesma entrada de cache.

**`createApiClient`** faz o que o `payload.config.ts` devia fazer:

```ts
const url = process.env.API_URL;

if (!url) {
  throw new Error('Missing API_URL. It is required by the "api" provider.');
}
```

Atira. Nada de `|| ''`. É o mesmo problema resolvido bem — e é útil ter os dois lado a lado para veres a diferença ([9.1](#91-payloadconfigts-opção-a-opção)).

Faltam ao cliente um `AbortSignal`/timeout (um upstream pendurado pendura o render) e qualquer retentativa. O `ApiPageSource.ts:28` também cria um `ApiClient` novo a cada `getPage`, relendo o ambiente de cada vez.

**A costura por escrever** — `mappers/mapApiPage.ts`:

```ts
export function mapApiPage(raw: unknown): PageDefinition {
  throw new ApiContractError(
    [
      'mapApiPage() has no mapping yet, so the page cannot be built.',
      `The API returned ${describeBody(raw)}.`,
      'Write the translation in src/providers/api/mappers/mapApiPage.ts',
      '— see docs/api.md.',
    ].join(' '),
  );
}
```

> 🎯 **Decisão**
>
> Não é código por acabar — é um **stub que se explica**. Arranca-se com `PROVIDER=api`, faz-se um pedido, e o erro diz que chaves a API devolveu e onde escrever a tradução. É a alternativa a inventar um mapeamento para uma API que ainda não se conhece. Se precisares de contexto no pedido (cabeçalhos, parâmetros), esse é o outro ponto editável: o `createPageRequest`.

Uma coisa por fazer que convém saber antes de pegares nisto: o `createPageRequest` recebe `path`, `locale` e `draft`, mas a implementação por omissão **só usa o `path`**. O locale já lá chega resolvido — o `ApiPageSource` pergunta o default à sua `SiteSource` quando ninguém o indica — mas não se sabe como é que a API o quer (query string? header? caminho?), e por isso a decisão fica na costura, que é o sítio de quem ligar a API.

---

# Apêndice A — Mapa de um pedido

```
GET /en/sobre-nos
│
├─ src/proxy.ts
│     x-pathname = '/en/sobre-nos'
│
├─ src/app/(frontend)/layout.tsx
│     await draftMode()       → isDraft
│     resolveSite()           → { locales, defaultLocale }
│     headers()               → x-pathname
│     resolveRoute(...)       → <html lang="en-GB">
│
├─ page.tsx generateMetadata     as duas chamadas partilham
│     resolvePage(segments) ──┐  UMA execução, via cache() do React
│                             │
├─ page.tsx Page              │
│     resolvePage(segments) ──┘
│                             │
│     ┌───────────────────────┘
│     ▼
│  _lib/resolvePage.ts  (cache() do React, chave = 'en/sobre-nos')
│     │
│     ├─ foundation.site.getSite()          (também em cache: o layout já o pediu)
│     │     └─ PayloadSiteSource → getPayloadClient() → findGlobal('site')
│     │           └─ mapPayloadSite  →  { name, locales, defaultLocale }
│     │
│     ├─ resolveRoute({ segments, locales, defaultLocale })
│     │     'en' é locale?  sim  →  { locale: 'en-GB', path: 'sobre-nos' }
│     │
│     └─ foundation.page.getPage('sobre-nos', 'en-GB', { draft })
│           └─ PayloadPageSource
│                 ├─ isSupportedLocale('en-GB')            ✓
│                 ├─ getPayload({ config })                 (Local API)
│                 ├─ resolvePayloadPage(...)
│                 │     payload.find({
│                 │       collection: 'pages',
│                 │       where: { and: [
│                 │         { 'breadcrumbs.url': { equals: '/sobre-nos' } },
│                 │         { _status: { equals: 'published' } }  ← guarda os rascunhos
│                 │       ]},
│                 │       locale, fallbackLocale: false, draft,
│                 │       overrideAccess: true, limit: 1, depth: 2,
│                 │     })
│                 └─ mapPayloadPage(page, locale)
│                       null → undefined,  blockType → alias
│                       → PageDefinition { meta, main: [ModuleInstance] }
│
└─ <PageRenderer page foundation />
      └─ <main> … <ModuleRenderer module foundation /> …
            ├─ foundation.modules.getByAlias('hero')   → Module
            ├─ heroSchema.parse(module.data)           → HeroProps
            └─ <Hero title subtitle />                 → HTML
```

Onde as coisas costumam partir, por ordem de probabilidade:

| Sintoma                                | Suspeito                                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| O módulo não aparece                   | `alias` ≠ `slug` do bloco ([6.6](#66-o-alias-é-a-cola)) ou falta o export em `src/modules/index.ts`  |
| 404 numa página que existe             | `breadcrumbs.url` diferente do esperado, ou `_status` ainda em rascunho                              |
| O site inteiro dá 404                  | `enabledLocales` vazio no global `Site` ([3.3](#33-o-locale-por-omissão-é-declarado-não-adivinhado)) |
| Erro de validação num módulo           | schema e bloco do Payload divergem; ver a mensagem do zod no `cause`                                 |
| O TypeScript não conhece um campo novo | falta correr `pnpm generate:payload`                                                                 |

---

# Apêndice B — Adicionar um módulo do zero

A receita completa, com um módulo `cta` (uma chamada à ação com título e link) como exemplo. Se conseguires segui-la sem voltar atrás, o guia cumpriu o seu objetivo.

**1. O bloco no Payload** — `src/providers/payload/blocks/CtaBlock.ts`:

```ts
import type { Block } from 'payload';

export const CtaBlock: Block = {
  slug: 'cta', // ← guarda este valor
  interfaceName: 'CtaBlock',
  labels: { singular: 'CTA', plural: 'CTAs' },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'href', type: 'text', required: true },
  ],
};
```

**2. Disponibilizá-lo às páginas** — `src/providers/payload/blocks/index.ts`:

```ts
export const pageBlocks = [HeroBlock, CtaBlock];
```

**3. Regenerar os tipos** — `pnpm generate:payload`. Sem isto o `payload-types.ts` não conhece o bloco e o mapeamento não compila.

**4. O módulo** — cinco ficheiros em `src/modules/cta/`:

```ts
// Cta.schema.ts
export const ctaSchema = z.object({
  title: z.string(),
  href: z.string(),
});

// Cta.types.ts
export type CtaProps = z.infer<typeof ctaSchema>; // nunca escrito à mão

// Cta.tsx
export function Cta({ title, href }: CtaProps) {
  return <a href={href}>{title}</a>;
}

// Cta.module.ts
export const ctaModule = defineModule({
  alias: 'cta', // ← igual ao slug do passo 1
  name: 'CTA',
  schema: ctaSchema, // ← sempre
  component: createModuleComponent(Cta),
});

// index.ts
export * from './Cta';
export * from './Cta.module';
export * from './Cta.types';
```

**5. Registá-lo** — `src/modules/index.ts`, com exportação **nomeada**:

```ts
export { heroModule } from './hero';
export { ctaModule } from './cta'; // NÃO uses export * aqui — ver 4.3
```

**6. Verificar** — `pnpm typecheck && pnpm test --run`, depois `pnpm dev`, criar uma página no admin com o bloco e ver se aparece.

**A lista dos quatro erros que toda a gente comete:**

1. `alias` ≠ `slug` → o módulo não aparece, sem erro em produção.
2. `export *` em `src/modules/index.ts` → falha estranha no arranque ([4.3](#43-registermodules-registo-por-convenção)).
3. Esquecer o `generate:payload` → o TypeScript não conhece o bloco.
4. Esquecer o `schema` → sem validação, e a asserção de tipo do adaptador passa a ser uma mentira ([6.4](#64-createmodulecomponent-o-adaptador-e-onde-ele-mente)).

Não é preciso tocar em: `PageRenderer`, `ModuleRenderer`, `Registry`, `mapPayloadPage`, `Pages.ts` nem em nada do `core`. Se te vires a mexer num destes para acrescentar um módulo, alguma coisa está errada no desenho.

---

# Apêndice C — Glossário

| Termo                       | Uma linha                                                  | Onde                                                              |
| --------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| **alias**                   | a string que liga um bloco do CMS a um componente          | [6.6](#66-o-alias-é-a-cola)                                       |
| **barrel**                  | um `index.ts` que reexporta uma pasta                      | [0.9](#09-barrels-indexts-e-a-regra-dos-efeitos-secundários)      |
| **catch-all opcional**      | `[[...segments]]`, a rota que apanha tudo incluindo a raiz | [1.3](#13-segments-uma-rota-para-o-site-inteiro)                  |
| **classe abstrata**         | contrato que obriga as subclasses a implementar            | [0.2](#02-classe-abstrata-o-contrato-que-obriga)                  |
| **composition root**        | o sítio onde as dependências da aplicação são montadas     | [4.1](#41-o-objeto-de-três-campos)                                |
| **Foundation**              | o objeto com `modules`, `page` e `site`                    | [Cap. 4](#cap-4--foundation-o-centro-de-composição)               |
| **generic**                 | parâmetro de tipo, `<TKey, TValue>`                        | [0.4](#04-generics-tkey-tvalue)                                   |
| **injeção de dependências** | receber por props em vez de importar                       | [0.10](#010-injeção-de-dependências)                              |
| **Local API**               | falar com o Payload no mesmo processo, sem HTTP            | [8.2](#82-payloadsitesource-e-a-local-api)                        |
| **Module**                  | a **definição** de um tipo de bloco                        | [6.1](#61-definição-e-instância-a-distinção-central)              |
| **ModuleInstance**          | uma **ocorrência** de um bloco numa página                 | [6.1](#61-definição-e-instância-a-distinção-central)              |
| **PageDefinition**          | o contrato interno de uma página                           | [6.2](#62-os-tipos-um-a-um)                                       |
| **provider**                | adaptador para uma origem de dados                         | [Cap. 7](#cap-7--sair-do-core-o-provider)                         |
| **registry**                | o catálogo de módulos conhecidos                           | [Cap. 5](#cap-5--registry-e-moduleregistry)                       |
| **route group**             | pasta entre parênteses, fora da URL                        | [1.2](#12-route-groups-pastas-entre-parênteses)                   |
| **Server Component**        | componente que corre no servidor (o normal aqui)           | [0.11](#011-server-components-e-client-components)                |
| **singleton**               | instância única criada ao importar o módulo                | [0.8](#08-módulos-esm-importar-é-executar-e-o-singleton)          |
| **type predicate**          | `x is T`, ensina o TypeScript a estreitar tipos            | [8.1](#81-localests-uma-lista-três-formas)                        |
| **zod**                     | validação **em execução**, o que o TypeScript não faz      | [0.12](#012-se-o-typescript-já-valida-tipos-para-que-serve-o-zod) |
