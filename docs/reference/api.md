# Provider API

Serve conteúdo de uma API HTTP externa. Vive em [src/providers/api/](../../src/providers/api) e arranca com `PROVIDER=api`.

Existe para o caso em que o CMS não corre dentro desta aplicação e foi escrito por alguém que não conhece esta estrutura. É a diferença de fundo em relação ao [provider Payload](payload.md): ali o formato é nosso, e um bloco que não encaixa corrige-se na collection. Aqui o formato é de outra pessoa, e a única coisa que se pode fazer é traduzi-lo.

## A ideia

**Vai a cru, e o que volta é mapeado.**

```
API_URL + o caminho onde estamos          →   resposta desconhecida
                                              → mapear para PageDefinition
```

O pedido, por omissão, é o `API_URL` mais o caminho da página e nada mais: sem query string e sem headers. O provider não assume que a API precisa de contexto, porque a maioria não precisa. O locale **chega** ao `createPageRequest` já resolvido, mas é essa função que decide se entra no pedido e como — ver [Idiomas](#idiomas).

O que volta não se sabe. Olha-se para a resposta verdadeira, e traduz-se para o contrato interno que já está montado. Esse é o único trabalho que sobra.

Duas costuras, uma por direcção, e são ficheiros feitos para editar:

| Direcção | Ficheiro                                                                      | Decide                                           |
| -------- | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| Sai      | [createPageRequest.ts](../../src/providers/api/requests/createPageRequest.ts) | caminho, e o que mais a API vier a precisar      |
| Entra    | [mappers/mapApiPage.ts](../../src/providers/api/mappers/mapApiPage.ts)        | a resposta → `PageDefinition` **(por escrever)** |

Tudo o resto — transporte, cache, erros, 404, testes — está feito, e não se toca para ligar uma API nova.

```
providers/api/
├── provider.ts               ← o bundle: page, site
├── createPageRequest.ts      ← ⚠️ o que sai
├── mappers/
│   ├── mapApiPage.ts         ← ⚠️ o que entra
│   ├── normalize.ts          ← null / "" / ausente → undefined
│   └── describeBody.ts       ← descreve um corpo desconhecido
├── ApiClient.ts              ← fetch, auth, cache, 404 → undefined
├── Api.types.ts              ← config e tipos de pedido
├── createApiClient.ts        ← lê o ambiente
├── errors/
│   ├── ApiRequestError.ts    ← o pedido falhou
│   └── ApiContractError.ts   ← o corpo não é o esperado
└── sources/
    ├── ApiPageSource.ts      ← junta as duas costuras
    └── ApiSiteSource.ts      ← nome e idiomas do site, sem chamar a API
```

## Fluxo de um pedido

```
getPage('en/about-us', locale, { draft })
        │                 └─ ausente → o default da ApiSiteSource
        ▼
createPageRequest({ path, locale, draft })            ⚠️ costura
        │  { endpoint: '/en/about-us' }
        ▼
ApiClient.get(endpoint, { params, headers, draft, tags })
        │  GET {API_URL}/en/about-us
        │
        ├── 404 .............................→ { status: 'notFound' }
        ├── rede / 5xx / não-JSON ...............→ ApiRequestError
        │
        ▼
corpo JSON (unknown)
        │
        ▼
mapApiPage(raw)                                       ⚠️ costura
        │
        ├── fora do contrato ....................→ ApiContractError
        ▼
PageDefinition
```

O [ApiClient](../../src/providers/api/client/ApiClient.ts) devolve `unknown` de propósito: não conhece páginas, módulos nem idiomas. Interpretar a resposta é trabalho do mapper, e é a única fronteira onde o formato externo existe.

## Configuração

Só o transporte é que é configurável por ambiente. Tudo o que tenha a ver com o formato da API vive em código, porque é código que se escreve depois de olhar para ela.

| Variável         | Obrigatória | Efeito                                                    |
| ---------------- | ----------- | --------------------------------------------------------- |
| `API_URL`        | sim         | base da API. Ex.: `https://cms.exemplo.pt/api/v1/content` |
| `API_TOKEN`      | não         | enviado como `Authorization: Bearer …`                    |
| `API_REVALIDATE` | não         | segundos de cache do Next (`60` por omissão, `0` desliga) |

Sem `API_URL` o provider falha no primeiro pedido, com a variável nomeada na mensagem — não serve uma página vazia. Um `API_REVALIDATE` que não seja um inteiro não-negativo é um erro, não um valor a ignorar em silêncio.

O ambiente é lido **dentro do pedido**, não no import: o [createApiClient](../../src/providers/api/client/createApiClient.ts) não é memoizado, e o `ApiClient` não guarda estado nem abre conexões. É isso que permite ao `createProvider` importar este bundle sem rebentar quando o `PROVIDER` activo é outro — ver a nota sobre bundles em [providers.md](providers.md#cada-provider-expõe-o-seu-bundle).

### As imagens vêm de um sítio que só tu sabes

Uma coisa que **não** é variável de ambiente: o host de onde a API serve as imagens. Declara-se em [imageHosts.ts](../../src/app/_lib/imageHosts.ts), e o `pnpm setup:provider` deixa a lista vazia para este provider precisamente porque não a pode adivinhar.

Enquanto estiver vazia, o `next/image` recusa qualquer imagem remota e o CSP bloqueia-a. As duas coisas são de propósito: um curinga ali é um buraco, e uma imagem que não aparece é um erro mais barato do que uma política que aceita tudo.

Não é ambiente porque as duas leituras acontecem em build — o `remotePatterns` do `next.config.ts` e a directiva `img-src` — e porque é uma decisão do projecto e não do deploy.

### O sitemap também não é nosso

Pela mesma razão. Um projecto `api` sai com o [sitemapLocation.ts](../../src/app/_lib/sitemapLocation.ts) em `{ kind: 'none' }`, e o `/sitemap.xml` responde **404**: a origem não sabe enumerar-se por omissão, e uma rota que construísse um sitemap a partir de uma origem que não lista serviria um `<urlset>` vazio. Um sitemap vazio é pior do que nenhum — afirma que o site não tem páginas.

Das duas uma, e a escolha é tua:

```ts
// a tua API serve o sitemap — o caso normal, porque é ela que sabe o que está publicado
export const sitemapLocation: SitemapLocation = {
  kind: 'external',
  url: 'https://cms.exemplo.pt/sitemap.xml',
};
```

O `robots.txt` passa a nomear esse URL. Isso não é só conveniência: um sitemap noutro host que liste URLs deste site é uma _cross-submission_, e a referência no `robots.txt` do próprio site é o que a torna aceitável para os motores de busca.

Se o URL **variar** — por ambiente, ou por tenant — não o fixes aqui: passa a `{ kind: 'source' }` e devolve-o no `getSite()` do [ApiSiteSource](../../src/providers/api/sources/ApiSiteSource.ts), no campo `sitemapUrl` do `SiteDefinition`. É o mesmo sítio onde o `name` e os `locales` deixam de ser os valores fixos com que este provider sai da caixa.

A outra saída é a API expor os caminhos publicados. O `listPaths` já está no `ApiPageSource` e o caminho está todo montado, com **uma peça por escrever** — o [mapApiPaths](../../src/providers/api/mappers/mapApiPaths.ts), pela mesma razão que o `mapApiPage`:

```
mapApiPaths() has no mapping yet, so the sitemap cannot be built.
The API returned an array of 12 item(s). Write the translation in
src/providers/api/mappers/mapApiPaths.ts — see docs/api.md.
```

O erro diz-te o que a tua API devolveu, para não teres de adivinhar a forma. O que ele tem de produzir é uma lista de [PagePath](../../src/core/pages/Page.types.ts): `path` já com o prefixo de idioma que o site serve, `locale`, e — opcionais — `updatedAt` para o `lastmod` e `noIndex` para a página ficar de fora.

O endpoint é o `/paths` com os locales em `params`, e é um valor a mudar como o do `createPageRequest`: ver [createPathsRequest](../../src/providers/api/requests/createPathsRequest.ts). Depois de o mapper existir, passa a `{ kind: 'app' }` e o `/sitemap.xml` deixa de responder 404.

## O que sai: createPageRequest

Por omissão o pedido é o caminho, e mais nada:

| Página do site          | Pedido à API                     |
| ----------------------- | -------------------------------- |
| `/`                     | `{API_URL}/`                     |
| `/sobre-nos`            | `{API_URL}/sobre-nos`            |
| `/en/about-us`          | `{API_URL}/en/about-us`          |
| `/servicos/consultoria` | `{API_URL}/servicos/consultoria` |

O caminho vai inteiro, tal como está no browser. O provider não sabe que `en` é um idioma — para ele é o primeiro segmento de um caminho, e é a API que decide o que fazer com ele.

Isto é a omissão, não uma regra. A função recebe `{ path, locale, draft }` e devolve `{ endpoint, params?, headers? }`. Quando **este** projecto tiver uma API que precise de contexto, é aqui que se acrescenta:

```ts
export function createPageRequest({ path, locale, draft }: PageRequestContext): ApiRequest {
  return {
    endpoint: `/pages/${path}`,
    params: { lang: locale, preview: draft || undefined },
    headers: { 'X-Site': 'super-bock' },
  };
}
```

Regras do transporte, para não haver surpresas:

- **Params com valor `undefined` são omitidos.** Não sai `?preview=undefined`.
- **Os headers do pedido ganham aos da configuração.** Até o `Authorization` do `API_TOKEN` se pode trocar por pedido.
- **A base e o caminho são juntos sem duplicar barras.** `API_URL` com ou sem barra final dá o mesmo URL.

Se a API precisar de algo que não caiba em caminho, params ou headers — um `POST` com corpo, por exemplo — é o `ApiClient` que ganha um método e o `ApiRequest` um campo. A source continua a não saber de nada.

## O que entra: mapApiPage

**Este ficheiro está por escrever**, porque o formato da resposta não é conhecido. Quando for, é a única coisa que interessa escrever.

Arranca com `PROVIDER=api pnpm dev` e abre uma página. O provider vai buscá-la e pára com um erro assim:

```
ApiContractError: mapApiPage() has no mapping yet, so the page cannot be built.
The API returned an object with keys: metadata, navigationHeader, sections.
Write the translation in src/providers/api/mappers/mapApiPage.ts — see docs/api.md.
```

Isso é o desenho, não uma falha: a mensagem traz as chaves do topo do corpo verdadeiro, que é o ponto de partida do mapeamento. Quem a produz é o [describeBody](../../src/providers/api/mappers/describeBody.ts), que descreve um corpo desconhecido numa linha — objecto e chaves, array e tamanho, `null` ou primitivo.

### O que tem de sair de lá

```ts
{
  meta: { locale?, title?, description?, ogTitle?, ogDescription?, noIndex?, noFollow? },
  navigation?: ModuleInstance[],
  main: ModuleInstance[],
  footer?: ModuleInstance[],
}
```

Cada `ModuleInstance` é `{ id, alias, data, name? }`, e o **`alias` tem de ser igual ao `alias` de um módulo registado** em [src/modules/](../../src/modules) — é por ele que o renderer encontra o componente. O `data` não precisa de ser validado aqui: o schema do módulo valida-o a seguir. Ver [modules.md](modules.md) e [renderer.md](renderer.md).

Nada é obrigatório além do `main`, que pode ser um array vazio.

### Exemplo completo

Supõe que a API responde isto:

```json
{
  "metadata": {
    "language": "pt-PT",
    "seoTitle": "Sobre nós",
    "seoDescription": null,
    "hideFromRobots": "true"
  },
  "sections": [
    {
      "contentType": "heroBanner",
      "key": "a7f2",
      "values": { "headline": "Sobre nós", "sublabel": "" }
    }
  ]
}
```

Nada disto encaixa no `PageDefinition`. **Primeiro descreve-se o que vem**, num `ApiPage.schema.ts` ao lado do mapper — como o `Hero.schema.ts` faz para o módulo. O corpo vem de fora do TypeScript, logo o `typecheck` não diz nada sobre ele:

```ts
import { z } from 'zod';

const apiSectionSchema = z.object({
  contentType: z.string(),
  key: z.string(),
  values: z.record(z.string(), z.unknown()).nullish(),
});

export const apiPageSchema = z.object({
  metadata: z
    .object({
      language: z.string().nullish(),
      seoTitle: z.string().nullish(),
      seoDescription: z.string().nullish(),
      hideFromRobots: z.unknown(),
    })
    .nullish(),

  sections: z.array(apiSectionSchema).nullish(),
});

export type ApiSection = z.infer<typeof apiSectionSchema>;
```

O `.nullish()` é intencional: qualquer CMS distingue "campo vazio" de "campo ausente", e o `core` não.

**Depois traduz-se**, e é aqui que vivem as decisões:

```ts
const ALIASES: Record<string, string> = {
  heroBanner: 'hero',
};

export function mapApiPage(raw: unknown): PageDefinition {
  const result = apiPageSchema.safeParse(raw);

  if (!result.success) {
    throw new ApiContractError(
      `The API page response does not match the expected contract.\n${z.prettifyError(result.error)}`,
      { cause: result.error },
    );
  }

  const page = result.data;

  return {
    meta: {
      locale: optionalText(page.metadata?.language) ?? 'pt-PT',
      title: optionalText(page.metadata?.seoTitle),
      description: optionalText(page.metadata?.seoDescription),
      noIndex: optionalFlag(page.metadata?.hideFromRobots),
    },

    main: (page.sections ?? []).flatMap(mapSection),
  };
}

function mapSection(section: ApiSection): ModuleInstance[] {
  const alias = ALIASES[section.contentType];

  if (!alias) {
    return [];
  }

  return [{ id: section.key, alias, data: section.values ?? {} }];
}
```

Cinco coisas que valem a pena reparar:

**O `locale` vem da resposta.** É a API que sabe em que idioma respondeu. Já não é ele que alimenta o `lang` do `<html>` — esse sai do locale da rota ([routing.md](routing.md#o-idioma-do-html)) — mas continua a valer a pena preenchê-lo: é o que permite detectar que a API respondeu num idioma diferente do pedido. Se a resposta não o declarar, põe-se aqui o do projecto.

**`null` e `""` não podem passar.** Um `null` que chegue a um componente aparece na página como texto. O [normalize.ts](../../src/providers/api/mappers/normalize.ts) existe para isso, e é independente do formato — serve qualquer API:

| Função         | Faz                                                    |
| -------------- | ------------------------------------------------------ |
| `optionalText` | `null`, `''` e espaços → `undefined`; o resto é trim   |
| `optionalFlag` | `true`, `'true'` e `1` → `true`; tudo o mais é `false` |
| `optionalList` | `null`, ausente ou um objecto único → sempre um array  |

**O mapa de aliases é explícito.** Uma convenção implícita (`contentType` === `alias`) parece mais curta até chegar um tipo novo da API e o renderer falhar sem dizer porquê. Com o mapa, um tipo desconhecido é uma linha que falta — visível.

**`flatMap` em vez de `map`.** Deixa cair o que não interessa sem `undefined` no meio do array. A API vai trazer coisas que este site não usa, e o mapper é o sítio onde isso morre.

**Validar é obrigatório, e falhar é melhor do que adivinhar.** Um `ApiContractError` com o caminho do campo distingue "a API mudou de forma" de "o site está estranho". Sem isso, um campo renomeado do outro lado aparece como uma página em branco.

### Testes

Quando o mapper estiver escrito, [mapApiPage.test.ts](../../src/providers/api/mappers/mapApiPage.test.ts) troca os casos de "sem mapeamento" pelos do formato real: a meta, os blocos, os `null` do CMS e um corpo fora do contrato.

É o teste que mais vale a pena ter neste provider. O mapper é a fronteira onde os dados mudam de forma, e é onde um bug passa sem dar erro.

### O caminho não sai da base

O `createUrl` do [ApiClient](../../src/providers/api/client/ApiClient.ts) resolve o caminho **contra**
a base (`new URL(path, base)`) e depois **confirma que o resultado ainda começa por ela**. Se não
começar, atira um `ApiRequestError` e não chega a haver pedido.

A razão é concreta e foi medida. A versão anterior concatenava as duas strings e passava o resultado
ao `new URL`, que resolve `..`:

```
base = https://cms.exemplo.pt/api/v1/
'sobre-nos'    -> https://cms.exemplo.pt/api/v1/sobre-nos    ok
'../../admin'  -> https://cms.exemplo.pt/admin               saiu da base
```

O caminho vem do URL do visitante, e o pedido leva o `API_TOKEN` no cabeçalho `Authorization`.
Bastava um caminho com `..` para o token ser enviado a outro sítio do mesmo host — o admin do CMS, por
exemplo. Quatro testes fixam a recusa e quatro fixam que os caminhos legítimos, com pontos e barras,
continuam a passar.

## Erros

| Erro                                                                   | Quando                                               |
| ---------------------------------------------------------------------- | ---------------------------------------------------- |
| [ApiRequestError](../../src/providers/api/errors/ApiRequestError.ts)   | rede em baixo, resposta não-OK, corpo que não é JSON |
| [ApiContractError](../../src/providers/api/errors/ApiContractError.ts) | a API respondeu, mas o corpo não é o esperado        |

A distinção é deliberada: um é infraestrutura, o outro é contrato. O `ApiRequestError` traz o `url` e o `status`; o `ApiContractError` traz a causa e, na mensagem, o caminho do campo.

Um `404` **não** é erro: o cliente devolve `undefined` e o `getPage` responde `{ status: 'notFound' }` — sem página. Um corpo `null` conta como o mesmo. Se a API servir uma página de erro própria, é na [ApiPageSource](../../src/providers/api/sources/ApiPageSource.ts) que se decide devolvê-la no `page` da resposta, e aí ela renderiza como qualquer outra ([routing.md](routing.md#o-404-é-conteúdo)). É também aí que entrariam os redirects, se a API os expuser.

## Cache

Páginas publicadas usam o cache do Next com o `revalidate` configurado, e etiquetas por caminho:

```ts
tags: ['pages', 'page:/sobre-nos'];
```

Isso permite revalidar tudo ou uma página só, quando existir um webhook do CMS a fazê-lo — hoje ainda não existe, ver [O que o transporte ainda não faz](#o-que-o-transporte-ainda-não-faz). O provider payload já tem o circuito fechado e serve de referência para o desenho: ver [payload.md § Cache](payload.md#cache), em particular a razão de as tags lá serem grosseiras e a de o segundo argumento do `revalidateTag` ser `{ expire: 0 }` e não `'max'`.

Rascunhos (`draft: true`) passam a `cache: 'no-store'`. Quem grava precisa de ver o que gravou, e não uma resposta de há um minuto.

## Idiomas

**O transporte não tem noção de idioma.** O caminho vai inteiro, e se tiver um `/en` à frente é a API que o interpreta.

O que mudou: o `locale` já **não** é ignorado pelo `ApiPageSource`. Ele resolve-o — usando o default da sua `SiteSource` quando ninguém o indica — e passa-o ao `createPageRequest`:

```ts
const resolvedLocale = locale ?? (await this.site.getSite()).defaultLocale;

const request = createPageRequest({ path, locale: resolvedLocale, draft: options?.draft });
```

O `createPageRequest` por omissão ainda não o põe no pedido, porque não se sabe como é que a API o quer — em query string, em header, no caminho. É por isso que é uma costura: o valor chega lá, e quem ligar a API decide o que fazer com ele.

Onde é que o idioma existe, então:

- **No pedido** — se o `createPageRequest` o usar.
- **No `lang` do `<html>`** — vem do locale da rota, resolvido pelo `resolveRoute`. Ver [routing.md](routing.md#o-idioma-do-html).
- **No `resolveRoute`** — que precisa de saber quais os primeiros segmentos são idiomas, para os separar do caminho. Olhando para `/en/about-us` não há como adivinhar se `en` é um idioma ou o primeiro segmento de um caminho.

A [ApiSiteSource](../../src/providers/api/sources/ApiSiteSource.ts) responde aos dois últimos pontos com um idioma só:

```ts
return {
  name: 'Site',
  locales: ['pt-PT'],
  defaultLocale: 'pt-PT',
};
```

Com um único idioma na lista, nada é reconhecido como prefixo e **o caminho passa inteiro** — que é exactamente o que se quer enquanto o mapeamento não estiver escrito. Este é o ficheiro a editar se um projecto precisar de o frontend distinguir idiomas (para gerar links com prefixo, ou um selector). Não é configuração de ambiente porque não é do transporte: é uma característica do site, como o `enabledLocales` do global `Site` é no provider Payload.

Se a API que aparecer expuser definições de site, troca-se esta classe por um `client.get()` e um mapper, como a de páginas faz.

## O mapper é teu, e é assim de propósito

O `mapApiPage` está por escrever e **vai continuar por escrever nesta foundation.** Não é uma tarefa pendente que alguém se esqueceu de fazer: é a única peça que não pode existir aqui.

O provider Payload sabe o formato do que lê porque o formato é definido no mesmo repositório. Aqui não. A resposta vem de uma API que outra pessoa desenhou, com nomes de campos, aninhamento e convenções que só se conhecem quando ela aparece. Escrever um mapper «genérico» seria escrever um palpite, e um palpite errado é pior do que um ficheiro por preencher — porque parece que funciona.

Por isso o que a foundation entrega aqui é um **ponto de partida**: o transporte inteiro montado e testado, e duas costuras marcadas a dizer «isto é teu».

| Direcção | Ficheiro                                                                      | O que o projecto decide                                                       |
| -------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Sai      | [createPageRequest.ts](../../src/providers/api/requests/createPageRequest.ts) | se o locale entra no pedido, e como: prefixo no caminho, query string, header |
| Entra    | [mappers/mapApiPage.ts](../../src/providers/api/mappers/mapApiPage.ts)        | como o corpo da resposta vira um `PageDefinition`                             |

O `ApiPageSource` já resolve o locale antes de chamar o `createPageRequest` — quer o pedido tenha vindo com um, quer tenha caído no default da `SiteSource`. O que ele **não** faz é decidir por ti se esse locale vai no URL, num parâmetro ou num cabeçalho, porque essa é uma característica da API que se vai ligar.

A [receita passo a passo](#ligar-uma-api-nova-por-passos) está no fim deste documento, e o primeiro erro que a aplicação atira já te diz as chaves que a API devolveu.

## O que o transporte ainda não faz

Isto é o outro lado da moeda, e não é decisão de projecto nenhum: são limites do código que a foundation **traz feito**. Nenhum impede ligar uma API e ver páginas; todos merecem uma linha antes de pôr isto em produção.

| Limite                                            | Consequência                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| As cache tags não incluem o locale                | duas traduções da mesma página colidem na mesma entrada de cache                        |
| Nada chama `revalidateTag`                        | as tags são só escrita; sem um webhook do CMS remoto, o conteúdo só actualiza por tempo |
| Constrói-se um `ApiClient` novo em cada `getPage` | relê o ambiente a cada pedido, em vez de o fazer uma vez                                |
| Não há `AbortSignal` nem timeout                  | um upstream pendurado pendura o render, sem limite                                      |
| Um `API_URL` mal escrito devolve 404 em tudo      | o site responde 404 em silêncio em vez de dizer que a configuração está errada          |

O primeiro e o quarto são os que mordem a sério: o primeiro serve conteúdo no idioma errado, o quarto derruba o tempo de resposta de todo o site por causa de um upstream lento. Os outros três são incómodos.

O segundo tem uma nota: parte dele **é** do projecto. Invalidar por evento exige saber que eventos o CMS remoto emite e por onde, e isso não se pode escrever sem o conhecer. O que a foundation devia trazer, e não traz, é a rota que os recebe. Para ver como fica o circuito fechado do outro lado, ver [payload.md § Cache](payload.md#cache).

## O que não tem

**`preview`.** Pré-visualizar é um mecanismo do CMS remoto — que URL assinar, que cookie ler, como avisar o browser — e não se sabe qual é. O contrato `Provider` tem-no opcional, logo a aplicação não renderiza nada e não há condicionais espalhadas. Quando o CMS for escolhido, o componente entra no bundle e mais nada muda.

**Navegação e footer.** O `PageDefinition` prevê-os, e o mapper pode preenchê-los a partir do que a resposta trouxer — muitas APIs de página mandam o header e o footer no mesmo corpo. Nenhum provider o faz ainda.

## Ligar uma API nova, por passos

1. `API_URL` no `.env.local`, e `PROVIDER=api`.
2. `pnpm dev`, abre uma página, lê as chaves na mensagem de erro.
3. Se a API precisar de contexto no pedido, [createPageRequest.ts](../../src/providers/api/requests/createPageRequest.ts).
4. Descreve o corpo num `ApiPage.schema.ts` e traduz em [mapApiPage.ts](../../src/providers/api/mappers/mapApiPage.ts).
5. Garante que cada `alias` que produzes existe em [src/modules/](../../src/modules). Um bloco da API sem módulo é uma linha no mapa de aliases, ou um módulo novo.
6. **Escreve o [ApiSiteSource.ts](../../src/providers/api/sources/ApiSiteSource.ts)**, que é a
   terceira costura e a que se esquece. Sem ele o site serve o nome literal `Site` — que chega ao
   browser como sufixo do `<title>` e como `og:site_name` — e um único idioma, o que faz o
   `resolveRoute` deixar de retirar prefixos de idioma sem que nada o diga. Avisa no log a cada
   pedido até ser escrito.
7. Testa o mapper com um corpo verdadeiro copiado da API.

O `core` não muda. O renderer não muda. Os módulos não mudam.
