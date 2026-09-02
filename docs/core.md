# Core — contratos

O `core/` define o vocabulário do projecto. Não conhece Next.js, não conhece CMS, não conhece módulos concretos.

## PageSource

Abstracção de obtenção de páginas. [core/pages/PageSource.ts](../src/core/pages/PageSource.ts)

```ts
export interface GetPageOptions {
  draft?: boolean;
  query?: PageQuery;
}

export abstract class PageSource {
  abstract getPage(path: string, locale?: string, options?: GetPageOptions): Promise<PageResponse>;

  listPaths?(): Promise<PagePath[]>;
}
```

- `path` é o caminho **sem** prefixo de locale — `''` para a homepage, `'servicos/consultoria'` para uma página aninhada.
- `locale` é o código completo (`'pt-PT'`), não o segmento de URL (`'pt'`). **Omiti-lo significa «usa o teu locale por omissão»**, não «desiste»: quem chama nem sempre sabe que locales a origem serve, e é a origem que responde qual é o seu default.
- `options.draft` pede a versão de rascunho. É um conceito de domínio, não do Payload: qualquer CMS headless tem publicado/rascunho. Implementações que não o suportem ignoram-no.
- `options.query` é a query string do pedido, normalizada. Ver [A query do pedido](#a-query-do-pedido).
- `listPaths` é **opcional na abstracção**, não abstracto. Ver [Listar caminhos](#listar-caminhos).
- **A resposta é sempre um `PageResponse`.** Nunca `undefined`, nunca uma excepção, nunca um `notFound()`.

### A query do pedido

```ts
export type PageQuery = Record<string, string | string[]>;
```

Sem isto, **nenhum módulo conseguia reagir a uma query string**: não havia `?page=2`, filtros, ordenação nem pesquisa, porque o `page.tsx` declarava só `params`. É a origem que recebe a query, porque é a origem que possui os dados — um módulo é um componente que recebe `data`, não um sítio de onde se vai buscar.

A parte que decide o desenho é a cache. O `resolvePage` está envolvido no `cache()` do React, que compara os argumentos **por identidade** — logo passar a query como objecto falhava a cache em todos os pedidos, e deixá-la fora dos argumentos servia os dados da primeira query à segunda. A chave é por isso a query serializada, e a função em cache volta a parsear a string. Esse ida-e-volta não é enfeite: é o que torna demonstrável que o valor que a origem vê é o mesmo que a chave codifica.

O [normalizeQuery](../src/core/routing/normalizeQuery.ts) ordena as chaves, para `?a=1&b=2` e `?b=2&a=1` partilharem uma entrada, e **preserva a ordem dos valores repetidos**, porque essa ordem tem significado.

### Listar caminhos

```ts
export interface PagePath {
  path: string;
  locale: string;
  updatedAt?: string;
}
```

O `path` é o caminho final do site, já com o prefixo de locale quando há um — é o que um sitemap precisa.

É **opcional** no contrato, e não abstracto, para o provider `api` poder continuar a não responder: o formato do índice de um CMS remoto é de quem desenhou a API, exactamente como o `mapApiPage`. Quem não implementa não quebra; quem consome verifica antes de chamar.

Isto abria dois buracos ao mesmo tempo — sem forma de enumerar os próprios URLs não havia sitemap nem paginação. Ver [routing.md](routing.md#sitemap-e-robots).

### PageResponse

```ts
export type PageResponse =
  | { status: 'ok'; page: PageDefinition }
  | { status: 'notFound'; page?: PageDefinition }
  | { status: 'redirect'; to: string; permanent?: boolean };
```

Aqui esteve um `PageDefinition | undefined`. O `undefined` dizia «esta página não existe», mas também «não sei este locale» e «a configuração está errada» — e o `app` traduzia qualquer um deles num 404 mudo. Foi essa ambiguidade que gerou a série de falhas silenciosas que este projecto andou a fechar.

O status vive **num envelope à volta do `PageDefinition`, não num campo dentro dele**, por três razões:

- o `PageDefinition` é o que o renderer consome, e não deve carregar informação de transporte;
- um redirect não tem página nenhuma, logo não caberia num campo;
- e assim nenhum mock, mapper ou teste tem de escrever um status que é quase sempre o mesmo.

O `page` opcional no `notFound` é o que torna a página de erro **conteúdo**: a origem devolve-a se a tiver, e ela renderiza como qualquer outra. É isso que faz um 404 chegar inteiro ao HTML servido — ver [routing.md](routing.md#o-404-é-conteúdo).

O `permanent` mapeia para os helpers do Next: `redirect` dá 307, `permanentRedirect` dá 308. Não são 301/302 — esses exigiriam produzir a resposta no proxy.

## SiteSource

Configuração global do site. [core/site/SiteSource.ts](../src/core/site/SiteSource.ts)

```ts
export abstract class SiteSource {
  abstract getSite(): Promise<SiteDefinition>;
}
```

## PageDefinition

O contrato interno de página. [core/pages/Page.types.ts](../src/core/pages/Page.types.ts)

```ts
export interface PageDefinition {
  meta: Meta;
  navigation?: ModuleInstance;
  main: ModuleInstance[];
  footer?: ModuleInstance;
}
```

Três regiões: uma navegação opcional, uma lista de módulos, um footer opcional. É deliberadamente pequeno — o CMS adapta-se a ele.

## Meta

```ts
export interface Meta {
  locale: string;

  title?: string;
  description?: string;

  ogTitle?: string;
  ogDescription?: string;

  noIndex?: boolean;
  noFollow?: boolean;
}
```

Todos os campos são opcionais, incluindo o `locale`. A tradução para o formato do Next acontece na camada `app` — ver [routing.md](routing.md#metadata).

O `locale` opcional é uma decisão por fechar: hoje nenhum consumidor depende dele — o `<html lang>` passou a sair do locale da rota, não da página — mas todos os mappers o preenchem. Torná-lo obrigatório está no [TODO.md](TODO.md).

## SiteDefinition

[core/site/Site.types.ts](../src/core/site/Site.types.ts)

```ts
export interface SiteDefinition {
  name: string;
  locales: string[];
  defaultLocale: string;
}
```

**O locale por omissão é declarado, não inferido.** Era `locales[0]` por convenção não escrita, lida em quatro sítios que podiam divergir entre si; agora é a origem que responde qual é. É ele que não recebe prefixo nas URLs, e é contra ele que o `resolveRoute` decide.

A ordem de `locales` continua a ser a que a origem declara, e o provider payload continua a usar a primeira posição para derivar o seu default — mas isso é uma escolha desse provider, não uma regra do contrato.

## Tipos de módulo

[core/modules/Module.types.ts](../src/core/modules/Module.types.ts)

```ts
export type ModuleProps = object;

export type ModuleComponent<TProps extends ModuleProps = ModuleProps> = (
  props: TProps,
) => ReactNode;

export type RuntimeModuleComponent = (props: ModuleProps) => ReactNode;

export interface ModuleSchema<TData extends ModuleProps = ModuleProps> {
  parse(data: unknown): TData;
}

export interface Module<TProps extends ModuleProps = ModuleProps> {
  alias: string;
  name: string;
  component: RuntimeModuleComponent;
  schema?: ModuleSchema<TProps>;
}

export interface ModuleInstance<TData extends ModuleProps = ModuleProps> {
  id: string;
  name?: string;
  alias: string;
  data: TData;
}
```

`Module` é a **definição** (o que sabe renderizar um alias); `ModuleInstance` é a **ocorrência** numa página (que dados, que id). O registry guarda definições; a `PageDefinition` guarda instâncias.

`ModuleSchema` é uma interface estrutural, não um tipo do zod. Qualquer objecto com `parse(data): TData` serve — o zod é uma escolha, não uma dependência do contrato.

## Registry

[core/registry/Registry.ts](../src/core/registry/Registry.ts) — um `Map` com invariantes.

```ts
class Registry<TKey, TValue> {
  protected add(key, value): void; // lança se a chave já existir
  get(key): TValue | undefined;
  has(key): boolean;
  remove(key): void; // lança se a chave não existir
  clear(): void;
  getAll(): TValue[];
}
```

O `add` é `protected`: as subclasses decidem como se deriva a chave. Falhar com chave duplicada é intencional — dois módulos com o mesmo alias é um erro de programação, não uma situação a resolver em silêncio.

```ts
class ModuleRegistry extends Registry<string, Module> {
  register(module): void; // add(module.alias, module)
  getByAlias(alias): Module | undefined;
}
```

## Routing

[core/routing/](../src/core/routing/) junta as funções puras sobre caminhos: `resolveRoute`, `createPagePath`, `getLocaleSegment` e `isSafeRedirectPath`. Nenhuma toca em Next nem em IO, e todas têm testes.

Documentadas em [routing.md](routing.md).

## Foundation

```ts
export interface Foundation {
  modules: ModuleRegistry;
  page: PageSource;
  site: SiteSource;
}
```

Construída por [createFoundation](../src/core/foundation/createFoundation.ts), que cria o registry e corre o `registerModules`. O singleton está em `foundation.ts` e **fora do barrel** — ver [architecture.md](architecture.md#6-os-barrels-não-podem-ter-efeitos-secundários).

## Erros

[core/errors/](../src/core/errors/)

| Erro                    | Quando                                                   |
| ----------------------- | -------------------------------------------------------- |
| `ModuleRenderError`     | alias não registado                                      |
| `ModuleValidationError` | `schema.parse()` falhou (com o erro original em `cause`) |

Só são lançados em desenvolvimento. Ver [renderer.md](renderer.md#erros).
