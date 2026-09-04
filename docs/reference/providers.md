# Providers

Um provider é um adaptador entre uma fonte de conteúdo e os contratos do `core`. É a única camada que conhece o CMS.

## O contrato

[providers/Provider.types.ts](../../src/providers/Provider.types.ts)

```ts
export interface Provider {
  page: PageSource;
  site: SiteSource;
  preview?: ComponentType;
}
```

O `preview` é opcional e é o que distingue este contrato da `Foundation`: um mecanismo de pré-visualização é específico do CMS (o do Payload usa `postMessage` e um componente cliente), logo não pertence ao domínio. Um provider que não tenha preview simplesmente não o declara, e a aplicação não renderiza nada — sem condicionais espalhadas.

## A cache é do provider, não do core

O `core` não sabe o que é uma cache, e é assim que deve ficar: a `PageSource` é uma classe abstracta com um método, e quem a implementa decide se guarda alguma coisa e onde.

Cada provider resolve-o com o mecanismo que a sua origem lhe dá: o `api` recebe-o de graça no `fetch` do Next; o `payload` teve de o construir sobre `unstable_cache`, porque a Local API fala directamente com o Postgres e não passa por `fetch` nenhum — ver [payload.md](payload.md#cache). O `mocks` não tem nada em memória para guardar.

Uma regra atravessa os três: **o rascunho nunca entra na cache.** O que o editor está a ver é a versão dele, e guardá-la arriscava servi-la a um visitante anónimo.

## O provider é dono dos seus locales

Duas regras atravessam todos os providers, e vale a pena lê-las juntas porque são a mesma decisão vista de dois lados.

**O `SiteDefinition` declara o locale por omissão.**

```ts
export interface SiteDefinition {
  name: string;
  locales: string[];
  defaultLocale: string;
}
```

Antes o default era `locales[0]` por convenção não escrita, lida em sítios espalhados que podiam divergir entre si. Agora é a origem que o declara, e cada provider responde o seu: o `payload` tira-o do global `Site` (o campo é ordenável e o admin promete que o primeiro é o default), o `mocks` tem-no fixo, o `api` há-de tirá-lo da resposta.

**Omitir o `locale` no `getPage` significa «usa o teu default».**

```ts
abstract getPage(
  path: string,
  locale?: string,
  options?: GetPageOptions,
): Promise<PageResponse>;
```

Não significa «desiste», que era o que o `PayloadPageSource` fazia. Quem chama nem sempre sabe que locales a origem serve; a origem sabe sempre. Um locale que ela não conheça responde `notFound` — é um pedido a uma página que ali não existe.

## O provider diz o status, não só o conteúdo

```ts
type PageResponse =
  | { status: 'ok'; page: PageDefinition }
  | { status: 'notFound'; page?: PageDefinition }
  | { status: 'redirect'; to: string; permanent?: boolean };
```

Aqui esteve um `PageDefinition | undefined`, e o `undefined` acumulava três significados: «não existe», «não sei este locale» e «a configuração está errada». O `app` traduzia os três num 404 mudo.

Duas coisas mudam para quem escreve um provider:

- **a página de erro é conteúdo.** Se a origem tiver uma, devolve-a no `page` do `notFound` e ela renderiza como qualquer outra — ver [routing.md](routing.md#o-404-é-conteúdo). Se não tiver, omite-o e a aplicação desenha um fallback com aviso no log.
- **os redirects passam a caber no contrato.** É a segunda coisa que um CMS precisa de dizer sobre um URL, e até agora não havia como.

O `mocks` e o `payload` preenchem os dois — o primeiro com listas à mão, o segundo com o CMS (a marca `is404` e a collection `Redirects`, ver [payload.md](payload.md)). No `api` ficam marcados como costura, como o `mapApiPage`, porque quem desenhou a API é que sabe como ela diz «isto mudou de sítio».

A consequência prática está no [routing.md](routing.md): como o default vive no provider e o provider corre no servidor, o `proxy` não precisa de o saber e portanto não reescreve URLs.

## Resolução

[providers/createProvider.ts](../../src/providers/createProvider.ts) escolhe pela variável `PROVIDER`:

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

Falha alto num valor desconhecido, em vez de cair no default e deixar alguém a perguntar-se porque é que o site mostra dados de teste.

[providers/provider.ts](../../src/providers/provider.ts) é o singleton:

```ts
export const provider = createProvider();
```

Importa-se sempre daqui, nunca chamando `createProvider()` outra vez — senão criam-se instâncias paralelas de sources.

## Cada provider expõe o seu bundle

```
providers/
├── Provider.types.ts
├── createProvider.ts        ← o switch
├── provider.ts              ← o singleton
├── payload/
│   └── provider.ts          ← export const payloadProvider
├── api/
│   └── provider.ts          ← export const apiProvider
└── mocks/
    └── provider.ts          ← export const mockProvider
```

```ts
// providers/payload/provider.ts
export const payloadProvider: Provider = {
  page: new PayloadPageSource(),
  site: new PayloadSiteSource(),
  preview: PayloadLivePreview,
};
```

Assim o `createProvider` fica só com a decisão, e cada pasta de provider é autodescritiva.

Nota: os bundles são `const` de módulo, logo **todos** são instanciados quando o `createProvider` é importado. Hoje é irrelevante — os sources não guardam estado, o `getPayload({ config })` memoiza internamente, e o provider `api` só lê o ambiente dentro do pedido, precisamente para que importar o bundle não rebente quando o `PROVIDER` activo é outro. Se um provider passar a abrir conexões no construtor, converte-os em factories (`createPayloadProvider()`) chamadas dentro do `case`.

## Adicionar um provider

**1. Criar a pasta** `src/providers/<nome>/`.

**2. Implementar as duas sources**, estendendo as classes abstractas do core:

```ts
export class ContentfulPageSource extends PageSource {
  async getPage(path: string, locale?: string, options?: GetPageOptions): Promise<PageResponse> {
    // 1. sem locale, resolver o default desta origem
    // 2. validar/normalizar o locale
    // 3. se o caminho for um redirect, devolver { status: 'redirect', to }
    // 4. consultar o CMS (usando options?.draft se suportado)
    // 5. não existe → { status: 'notFound', page: a página de erro, se houver }
    // 6. existe → { status: 'ok', page: traduzido para PageDefinition }
  }
}
```

A `SiteSource` tem de devolver `defaultLocale` além de `name` e `locales`.

**3. Escrever o mapper.** É aqui que vive a tradução, e é a parte que importa: o formato do CMS nunca deve chegar ao `core`.

```ts
export function mapContentfulPage(entry: Entry, locale: string): PageDefinition {
  return {
    meta: { locale, title: … },
    main: entry.blocks.map(mapBlock),
  };
}
```

Cada bloco tem de produzir uma `ModuleInstance` com `alias` igual ao `alias` de um módulo registado:

```ts
{
  id: block.sys.id,
  alias: block.contentType,   // === alias do módulo
  data: { … },
}
```

**4. Exportar o bundle** em `<nome>/provider.ts` e acrescentar o `case` ao `createProvider`.

O core não muda. O renderer não muda. Os módulos não mudam.

## Remover o Payload

Esta foundation traz o Payload montado, mas ele é **um** provider e não a fundação. Se o
conteúdo vier de outro lado, o Payload sai — e sair inteiro é preciso, porque enquanto
houver uma rota a importar o `payload.config.ts` estaticamente o build exige
`PAYLOAD_SECRET` e `DATABASE_URL` **mesmo com `PROVIDER=api`**. São duas: a
`/api/[...slug]` do grupo `(payload)`, e a `next/preview`, que está no `(frontend)` — o
`payload.config.ts` valida o ambiente ao carregar, e o `next build` compila todas as rotas.

**Isto já não se faz à mão.** O comando

```bash
pnpm setup:provider
```

pergunta qual dos três providers este projecto usa e apaga o resto — incluindo tudo o que
está nesta secção. Ele recusa arrancar com a árvore suja, para o resultado inteiro caber
num `git diff`; tem `--dry-run`; e pára em voz alta se algum dos ficheiros abaixo tiver
sido personalizado, em vez de o editar à sorte. Depois de correr, apaga-se.

A lista continua aqui porque é a documentação do **acoplamento**, e é ela que explica
porque é que sair pela metade não funciona.

O que apagar:

|                                                             |                                                                                                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/(payload)/`                                        | o admin e a API REST                                                                                                                       |
| [src/app/(frontend)/next/](<../../src/app/(frontend)/next>) | `preview` e `exit-preview`, que autenticam com `payload.auth()`                                                                            |
| `src/providers/payload/`                                    | as sources, o mapper, as collections, a cache                                                                                              |
| `payload.config.ts`                                         | e os caminhos `@payload-config` e `@payload-types` no [tsconfig.json](../../tsconfig.json) e no [vitest.config.ts](../../vitest.config.ts) |

E depois duas edições:

- o `case 'payload'` do [createProvider.ts](../../src/providers/createProvider.ts) e o import
  no topo — os três providers são importados estaticamente, portanto um que deixe de
  existir parte a compilação;
- os scripts `payload:*` e `dev:payload` do `package.json`, o `withPayload` do
  [next.config.ts](../../next.config.ts), e as dependências `payload`, `@payloadcms/*`.

O `setup:provider` vai um passo mais longe do que estas duas edições, e de propósito: com
um provider só, o `switch` e a variável `PROVIDER` são código morto. Ele apaga o
`createProvider.ts` e o teste dele, e reescreve o [provider.ts](../../src/providers/provider.ts)
como um re-export directo do provider escolhido. O contrato em
[Provider.types.ts](../../src/providers/Provider.types.ts) fica intacto — é ele que permite
voltar a acrescentar um provider mais tarde.

Além de apagar, o comando **reescreve quatro ficheiros**, porque há verdades que mudam com
a escolha e não podem ficar a afirmar o que era verdade noutro projecto:

| Ficheiro                                                    | O que passa a dizer                                                          |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [provider.ts](../../src/providers/provider.ts)              | um re-export directo do provider escolhido                                   |
| `.env.example`                                              | só as variáveis que este provider lê                                         |
| [imageHosts.ts](../../src/app/_lib/imageHosts.ts)           | de onde vêm as imagens — o Blob no `payload`, nada nos outros dois           |
| [sitemapLocation.ts](../../src/app/_lib/sitemapLocation.ts) | quem serve o sitemap — esta app no `payload` e nos `mocks`, ninguém no `api` |

Os quatro já existem na foundation: o comando substitui-lhes o conteúdo, não os cria. As
duas últimas estão explicadas em [routing.md](routing.md#sitemap-e-robots) — e no fim o
comando **diz-te o que ficou por decidir**, em vez de deixar um default a parecer uma
escolha.

Fica o `core`, os `modules`, o `app/(frontend)` e os providers `api` e `mocks`. O
[gerador](modules.md) já conta com isto: sem `src/providers/payload/blocks/index.ts` não
escreve bloco nenhum, escreve só o módulo.

Com o Payload fora, o `PageResponse` continua a exprimir 404 e redirects — quem os
preenche passa a ser o `mapApiPage`.

## O provider api

[providers/api/](../../src/providers/api) serve conteúdo de uma API HTTP externa, escrita por alguém que não conhece esta estrutura.

O pedido vai a cru — `API_URL` mais o caminho onde estamos — e a resposta, que não se sabe qual é, é traduzida para o contrato interno. São duas costuras, uma por direcção, e são os únicos ficheiros a editar:

| Direcção | Ficheiro                                                                      |
| -------- | ----------------------------------------------------------------------------- |
| Sai      | [createPageRequest.ts](../../src/providers/api/requests/createPageRequest.ts) |
| Entra    | [mappers/mapApiPage.ts](../../src/providers/api/mappers/mapApiPage.ts)        |

O `createPageRequest` recebe `path`, `locale` e `draft`. O `locale` chega já resolvido — o `ApiPageSource` pergunta o default à sua `SiteSource` quando ninguém o indica — mas a implementação por omissão ainda não o põe no pedido: é uma das costuras por escrever.

O `mapApiPage` está por escrever, e **fica assim**: o formato da resposta é de quem desenhou a API, e um mapper genérico seria um palpite. Arranca com `PROVIDER=api` e o erro do primeiro pedido diz as chaves que a API devolveu.

Não declara `preview`, por isso é — como o `mocks` — um caso de teste do `preview` opcional.

**Documentação completa: [api.md](api.md).**

## O provider mock

[providers/mocks/](../../src/providers/mocks) serve páginas escritas à mão, sem base de dados.

```
mocks/
├── provider.ts
├── index.ts             ← o barrel: a única porta para fora
├── definePage.ts        ← como se escreve uma página
├── mockSite.ts          ← o site e os locales que os mocks servem
├── pages/
│   ├── index.ts         ← a lista do que é servido
│   ├── home.ts          ← uma página, em todos os idiomas
│   ├── notFound.ts      ← a página de erro, em todos os idiomas
│   └── redirects.ts     ← caminhos que mudaram de sítio
└── sources/
    ├── MockPageSource.ts
    └── MockSiteSource.ts
```

Arranca com `PROVIDER=mock pnpm dev`. Serve três propósitos: desenvolver o frontend sem o CMS a correr, ter testes rápidos que não tocam no Payload, e provar que a abstracção funciona — se o mock deixar de conseguir servir o site, a abstracção está a vazar.

Não declara `preview`, por isso é também o caso de teste do `preview` opcional.

**É o único provider que exercita os três ramos do `PageResponse`**, e é para isso que serve: o `payload` e o `api` deixam o 404 e os redirects como costura por ligar, portanto é aqui que se vê o contrato inteiro a funcionar.

```ts
// MockPageSource — a ordem é a de qualquer CMS
const redirect = mockRedirects.find(/* … */);
if (redirect) return { status: 'redirect', to: redirect.to, permanent: redirect.permanent };

const match = mockPages.find(/* … */);
if (match) return { status: 'ok', page: match.page };

const notFound = mockNotFoundPages.find(/* … */);
return { status: 'notFound', page: notFound?.page };
```

O redirect vem antes da página de propósito: se um caminho tiver as duas coisas ganha o redirect, que é o que permite substituir uma página sem a apagar.

A `notFound.ts` é escrita com o mesmo `definePage` e os mesmos módulos que qualquer outra página — é esse o ponto. Traduzida, e com `noIndex: true` na meta.

Os redirects têm uma entrada por idioma, porque um slug traduz-se: `/pagina-antiga` e `/en/old-page` são URLs diferentes.

### Escrever uma página

```ts
import { heroModule } from '@/modules';

import { block, definePage } from '../definePage';

export const home = definePage({
  'pt-PT': {
    path: '',
    meta: { title: 'Next Foundation' },
    main: [block(heroModule, { title: 'Next Foundation', subtitle: 'Primeiro render 🎉' })],
  },

  'en-GB': {
    path: '',
    meta: { title: 'Next Foundation' },
    main: [block(heroModule, { title: 'Next Foundation', subtitle: 'First render 🎉' })],
  },
});
```

Depois junta-se a `home` à lista em [pages/index.ts](../../src/providers/mocks/pages/index.ts). A lista é escrita à mão, e não varrida do disco: uma página só aparece no site depois de alguém a pôr lá, e é aí que se vê de uma vez o que os mocks servem.

Três decisões que fazem esta forma valer a pena:

**As traduções entram juntas, com o locale por chave.** Acrescentar um idioma é acrescentar uma chave, não criar um ficheiro com um sufixo no nome e lembrar-se de o registar. As duas versões ficam lado a lado, onde se vê logo se uma ficou para trás.

**O `path` vive dentro de cada tradução.** Um slug traduz-se como qualquer outro conteúdo: `sobre-nos` em português é `about-us` em inglês. Ao lado das traduções, ficarias preso ao mesmo caminho nos dois idiomas.

**O `block()` recebe a definição do módulo, não o alias em texto.** É a diferença entre um erro de escrita rebentar no editor e rebentar em runtime como «Module "heor" is not registered» — e dá autocomplete ao `data`, verificado contra o tipo desse módulo.

O que o compilador passa a apanhar: uma chave de locale que não existe (`mockLocales` é um tuplo `as const`, como o `availableLocales` do provider payload), um `path` esquecido, um campo mal escrito no `data`, e um `locale` escrito na `meta` — esse já é a chave, e não se escreve duas vezes.

Os `id` das `ModuleInstance` são derivados da **região**, do alias e da posição (`main-hero-1`, `main-hero-2`) em vez de escritos à mão: o `ModuleRenderer` exige-os únicos dentro da página, e dois `hero-1` colados por copy-paste davam uma key repetida em React, que falha em silêncio.

O prefixo da região não é decoração. Sem ele, o mesmo módulo no cabeçalho e no corpo produzia `hero-1` duas vezes na mesma página — que é precisamente a colisão que os `id` existem para evitar.

### As três regiões

O `main` é obrigatório; a `navigation` e o `footer` são opcionais, e **as três são listas**:

```ts
export const home = definePage({
  'pt-PT': {
    path: '',
    navigation: [block(siteHeaderModule, { … })],
    main: [block(heroModule, { title: 'Next Foundation' })],
    footer: [block(siteFooterModule, { … })],
  },
});
```

Uma região que não esteja lá simplesmente não é desenhada — o renderer não emite o landmark vazio ([renderer.md](renderer.md)). E como são listas, uma barra de anúncios acima do menu são dois blocos na `navigation`, e não um módulo composto inventado para os agrupar.

**Nenhuma página de fixture as usa hoje**, e é deliberado: as fixtures são conteúdo de demonstração, e acrescentar-lhes um cabeçalho era acrescentar mais demonstração para um projecto apagar. No provider `payload` o equivalente são dois globals — ver [payload.md § Navigation e Footer](payload.md#navigation-e-footer).
