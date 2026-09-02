# Routing, locales e metadata

Uma única rota serve todo o site: [app/(frontend)/[[...segments]]/page.tsx](<../src/app/(frontend)/[[...segments]]/page.tsx>), um catch-all opcional. Não há rotas por idioma nem por tipo de página.

## Da URL à página

```
/en/servicos/consultoria
        │
        ▼  segments = ['en', 'servicos', 'consultoria']
resolveRoute({ segments, locales, defaultLocale })
        │  { locale: 'en-GB', path: 'servicos/consultoria' }
        ▼
provider.page.getPage('servicos/consultoria', 'en-GB', { draft })
        │
        ▼  PageResponse: ok | notFound | redirect
```

O `locales` e o `defaultLocale` vêm ambos de `site.getSite()`, ou seja da origem de conteúdo — os idiomas do site são conteúdo, não configuração de build.

## resolveRoute

[core/routing/resolveRoute.ts](../src/core/routing/resolveRoute.ts)

```ts
export function resolveRoute({ segments, locales, defaultLocale }): ResolvedRoute;
```

A decisão é simples: se o primeiro segmento corresponder ao segmento de um locale conhecido, esse é o locale e o resto é o path; senão, é o locale por omissão e todos os segmentos são o path.

```
locales = ['pt-PT', 'en-GB']        defaultLocale = 'pt-PT'

/                        → { locale: 'pt-PT', path: ''            }
/servicos                → { locale: 'pt-PT', path: 'servicos'    }
/en                      → { locale: 'en-GB', path: ''            }
/en/servicos             → { locale: 'en-GB', path: 'servicos'    }
```

**Resolve sempre.** Não devolve `undefined`, e isso é deliberado: a versão anterior derivava o default de `locales[0]` e desistia com a lista vazia, o que fazia o site inteiro responder 404 de forma indistinguível de «esta página não existe». Um locale que a origem não sirva falha agora mais à frente, no `getPage`, onde a falha é legível.

Consequência a ter em conta: o locale por omissão **não tem prefixo**, logo uma página de topo cujo slug seja `en` ficaria inacessível. Os segmentos de locale são reservados.

## getLocaleSegment

[core/routing/getLocaleSegment.ts](../src/core/routing/getLocaleSegment.ts)

```ts
export function getLocaleSegment(locale: string): string {
  return locale.split('-')[0].toLowerCase();
}
```

`'pt-PT'` → `'pt'`, `'en-GB'` → `'en'`. As URLs usam o idioma sem a região; os contratos internos usam o código completo.

Isto significa que **dois locales com o mesmo idioma colidem** — `'en-GB'` e `'en-US'` produziriam ambos `'en'`. Se isso for necessário, é aqui e no `createPagePath` que se muda.

## createPagePath

[core/routing/createPagePath.ts](../src/core/routing/createPagePath.ts) — o inverso do `resolveRoute`.

```ts
createPagePath({ path: '/servicos', locale: 'en-GB', defaultLocale: 'pt-PT' }); // '/en/servicos'
createPagePath({ path: '/servicos', locale: 'pt-PT', defaultLocale: 'pt-PT' }); // '/servicos'
createPagePath({ path: '/', locale: 'en-GB', defaultLocale: 'pt-PT' }); // '/en'
```

Normaliza barras a mais e omite o prefixo quando o locale é o default. É usado pelo `getLivePreviewUrl` e pelo campo `PageUrl` do admin — os dois sítios que precisam de construir um URL público a partir de dados do CMS.

## isSafeRedirectPath

[core/routing/isSafeRedirectPath.ts](../src/core/routing/isSafeRedirectPath.ts) — aceita apenas caminhos relativos à própria origem.

Vive no `core/routing` por ser o mesmo género de coisa que as funções acima: pura, sem dependências, testável sem levantar nada. O único consumidor é a rota de preview, mas a regra é sobre caminhos, não sobre preview.

Não basta rejeitar `//`: para esquemas especiais o WHATWG URL trata `\` como `/`, portanto `/\sitemau.com` resolve para `//sitemau.com`.

## Como o path chega ao CMS

No provider Payload, o `path` resolve contra os breadcrumbs gerados pelo plugin de nested docs:

```
where: !path
  ? { isHome: { equals: true } }                        // raiz
  : { 'breadcrumbs.url': { equals: `/${path}` } }       // resto
```

O `generateURL` do plugin constrói o `breadcrumbs.url` a partir dos títulos dos ancestrais, passados por `createSlug`, **excluindo** documentos com `isHome`. É por isso que os filhos da homepage não herdam o slug dela.

Nota: o `breadcrumbs.url` só é recalculado quando o documento é gravado. Um título alterado e ainda não gravado não muda o URL.

## Metadata

[app/(frontend)/\_lib/createMetadata.ts](<../src/app/(frontend)/_lib/createMetadata.ts>) traduz o `Meta` do domínio para o `Metadata` do Next.

Os campos de Open Graph caem para os campos gerais quando não estão preenchidos, e os booleanos invertem-se: o CMS pergunta «não indexar?», o Next quer saber «indexar?». O cartão do Twitter passa a `summary_large_image` quando há imagem e a `summary` quando não há.

Vive na camada `app` e não no `core` porque depende de tipos do Next. O `core` não conhece o framework.

**A metadata está repartida entre o layout e a página, e a divisão não é arbitrária.**

O layout responde o que é do site: o `metadataBase`, o `title.template` e o `openGraph.siteName`. Os três saem do `SiteDefinition.name` — que até aqui era um campo obrigatório no CMS **sem um único leitor**. O `metadataBase` é o que torna os URLs relativos da página resolúveis, portanto tem de estar acima dela.

A página responde o que é dela: `title`, `description`, o `canonical`, o `hreflang`, a imagem de OG e os `robots`.

O `canonical` sai do `createPagePath` com o locale da rota, o que o torna a mitigação do caminho duplicado descrito em [resolveRoute](#resolveroute): `/pt/sobre-nos` e `/sobre-nos` servem o mesmo conteúdo, e ambos declaram o segundo como canónico.

O **hreflang** não se pode adivinhar prefixando o caminho actual com cada idioma, porque os slugs são traduzidos — o URL sairia errado. Vem do provider, que responde o caminho da mesma página em cada idioma: no Payload, o campo `breadcrumbs` é localizado, portanto um `findByID` com `locale: 'all'` traz todos de uma vez. É uma consulta a mais por página, dentro da mesma entrada de cache. Uma origem que não saiba responder deixa o `alternates` vazio, e o `hreflang` simplesmente não é emitido.

O `generateMetadata` e a página chamam ambos o mesmo [resolvePage](<../src/app/(frontend)/_lib/resolvePage.ts>), envolvido no `cache` do React: duas chamadas, uma resolução por pedido. A chave é o caminho em string e não o array de segmentos, porque o `cache` compara argumentos por identidade e cada `await params` devolve um array novo.

## O idioma do `<html>`

O layout de raiz vive no topo do route group, em [app/(frontend)/layout.tsx](<../src/app/(frontend)/layout.tsx>) — é onde o Next o procura quando se usam route groups como raízes separadas.

O custo de estar aí é não haver `params`. O caminho chega por header, posto pelo [proxy](../src/proxy.ts):

```tsx
const pathname = (await headers()).get(PATHNAME_HEADER) ?? '';

const { locale } = resolveRoute({
  segments: pathname.split('/').filter(Boolean),
  locales: site.locales,
  defaultLocale: site.defaultLocale,
});

return <html lang={locale}>;
```

O `lang` sai do locale **da rota** e não do `meta.locale` da página. É uma função pura sobre dados que o `resolveSite()` já trouxe, logo o layout não paga uma consulta à página só para escrever o `lang` — e quando a página não resolve, o que se desenha é o `not-found` deste projeto, que o locale da rota continua a descrever correctamente.

## O proxy

[src/proxy.ts](../src/proxy.ts) — em Next 16 a convenção `middleware` está depreciada; o ficheiro chama-se `proxy` e exporta uma função `proxy`.

Não reescreve nem redirecciona: só copia o pathname para o header `x-pathname`. É deliberado. Reescrever obrigaria o proxy a saber qual é o locale por omissão, e esse é uma resposta do provider — ver [providers.md](providers.md). Ao não decidir nada aqui, o default continua a viver onde deve e as URLs ficam como estão.

O `matcher` exclui o admin, a API do Payload, as rotas de preview, os assets do Next e os ficheiros com extensão. Como não se reescreve nada, apanhar o resto seria inofensivo — mas é trabalho por pedido a troco de nada.

## O que é rota e o que não é

```
app/
├── _lib/
│   └── requestOrigin.ts ← partilhado pelos dois grupos
├── robots.ts            ← na raiz, e não no grupo: ver abaixo
├── (frontend)/
│   ├── _components/     ← não é rota: o prefixo _ tira a pasta do router
│   │   └── MissingNotFoundPage.tsx
│   ├── _lib/
│   │   ├── createMetadata.ts
│   │   ├── resolvePage.ts
│   │   └── resolveSite.ts
│   ├── layout.tsx       ← o layout de raiz do grupo
│   ├── error.tsx
│   ├── global-error.tsx
│   ├── sitemap.ts
│   ├── [[...segments]]/
│   │   └── page.tsx     ← todas as páginas
│   └── next/
│       ├── preview/     ← activa o draftMode
│       └── exit-preview/ ← desactiva
└── (payload)/           ← gerado pelo Payload
```

Dentro de `app/` só ficheiros de rota; o resto vai para uma pasta com `_` — `_lib/` para funções, `_components/` para componentes. Sem essa regra, um `.ts` solto no meio das rotas não se distingue de uma convenção do Next à qual falta reconhecer o nome.

O prefixo `next/` isola as rotas de framework do namespace de conteúdo — é a convenção do template oficial do Payload. Rotas estáticas têm precedência sobre o catch-all, por isso não há conflito, mas qualquer path que se acrescente aqui deixa de estar disponível para conteúdo.

## Sitemap e robots

O [sitemap.ts](<../src/app/(frontend)/sitemap.ts>) pergunta os caminhos à origem — o `listPaths` do [core.md](core.md#listar-caminhos) — e torna-os absolutos. O [robots.ts](../src/app/robots.ts) desautoriza `/admin`, `/api` e `/next/`, e aponta para o sitemap.

**O `robots.ts` está na raiz do `app/` e o `sitemap.ts` dentro do grupo. Isso não é preferência.** O Next casa a convenção do sitemap com um padrão não ancorado, portanto ela resolve dentro de um route group; casa a do robots com `/^[\\/]robots/`, **ancorado**. Um `robots.ts` dentro do `(frontend)` é descartado sem rota, sem output e sem aviso nenhum — só se percebe a ler o `is-metadata-route.js` do Next. Se algum dia o `/robots.txt` desaparecer da tabela de rotas do build, é aqui que se olha.

O URL absoluto vem do **host do pedido** ([requestOrigin.ts](../src/app/_lib/requestOrigin.ts)) e não do `NEXT_PUBLIC_SERVER_URL`. São três razões: uma fonte de verdade em vez de duas, correcção quando um deploy serve vários domínios, e — a razão prática — o `next build` continua verde sem ambiente nenhum, que é a garantia que o [setup:provider](providers.md#remover-o-payload) estabeleceu para os providers `api` e `mock`.

Ambas as rotas leem `headers()`, portanto são dinâmicas e o Next não as pré-renderiza. Numa origem que não sabe listar, o sitemap responde vazio **com um aviso no log** em vez de atirar.

## O 404 é conteúdo

Um caminho que não existe **não** chama `notFound()`. A origem responde
`{ status: 'notFound' }`, com a página de erro dela se a tiver, e essa página
renderiza pela árvore normal — pelo mesmo `PageRenderer`, dentro do mesmo layout.

O `notFound()` esteve aqui e saiu. A razão está medida, num build de produção:

|                    | status | HTML servido                                                         |
| ------------------ | ------ | -------------------------------------------------------------------- |
| com `notFound()`   | 404    | **vazio** — `<html id="__next_error__">`, conteúdo só no payload RSC |
| como render normal | 200    | completo — `<html lang="pt-PT">`, `<main>`, `<h1>`                   |

**A causa não é o streaming**, que é o que a documentação do Next leva a pensar. Foi
isolada por eliminação, com três medições:

| o que se variou                                               | shell servido    |
| ------------------------------------------------------------- | ---------------- |
| `notFound()` com o layout normal (assíncrono)                 | `__next_error__` |
| o mesmo, com um layout **totalmente síncrono**                | `__next_error__` |
| uma página **sem um único `await`** que só chama `notFound()` | `__next_error__` |

Sem nada assíncrono em lado nenhum o shell continua vazio, portanto o streaming não
explica isto. O que explica são **as duas raízes de route group** — o caso que a
documentação do `not-found.js` nomeia à parte. Não há layout na camada de raiz de onde
compor o 404, e o Next usa o dele.

E não pode haver: o `(payload)/layout.tsx` usa o `RootLayout` do Payload, que traz o seu
próprio `<html>`. Um `app/layout.tsx` na camada de raiz daria `<html>` dentro de `<html>`
no admin.

No browser não se nota, porque o React hidrata a partir do payload RSC; num crawler sem
JS não há nada.

**O preço assumido é o status passar a 200.** Em troca vem HTML servido, uma página de
erro editável no CMS, e um só caminho de render. O `noIndex` é forçado pelo
`generateMetadata` quando o status é `notFound`, o que substitui a `<meta robots>` que
o Next injectava sozinho.

Se a origem disser `notFound` sem página — no Payload, enquanto ninguém marcar uma
página com `is404` — a aplicação desenha o
[MissingNotFoundPage](<../src/app/(frontend)/_components/MissingNotFoundPage.tsx>), que avisa
no log em vez de fingir que está tudo bem.

### Porque é que não se recupera o status

O `notFound()` **dá** o status 404 correcto — o que ele não dá é corpo. As duas saídas
para ter os dois foram avaliadas, e uma foi medida:

**Produzir a resposta no proxy** — perguntar o status ao provider antes de renderizar e,
num 404, devolver o HTML com status 404. Funciona: dá 404 e HTML completo. **E custa
caro**, medido contra a base de dados real, na mesma página:

|                         | tempo de resposta |
| ----------------------- | ----------------- |
| como está               | **14 ms**         |
| com a consulta no proxy | **177 ms**        |

São 12×, **em todos os pedidos**, incluindo os das páginas que existem. O motivo é que o
`unstable_cache` não funciona no proxy — não há work store — portanto cada pedido volta
ao Postgres. Trocar isso por um código de estado que só o analytics lê não se justifica.

**Tirar o admin do Payload deste `app/`** resolveria a causa na raiz, e é a única solução
limpa — mas é uma reestruturação grande, e esta foundation não a faz. Quem não precisar do
Payload de todo tem a receita em
[providers.md](providers.md#remover-o-payload); quem precisar dele fica com o 200.

## Redirects

`{ status: 'redirect', to, permanent }` traduz-se em `redirect()` ou
`permanentRedirect()`. Ao contrário do 404, **aqui o código HTTP é real** — medido:

```
GET /pagina-antiga  →  HTTP/1.1 308 Permanent Redirect
                       location: /
```

São 307 e 308, e não 301/302: esses
exigiriam produzir a resposta no [proxy](../src/proxy.ts), onde o `NextResponse.redirect`
aceita a lista toda.

O `mocks` traz um exemplo em cada idioma, numa lista à mão. O `payload` lê-os de uma
collection `Redirects`, onde o destino é uma **referência a uma página** e não um caminho
escrito — o URL sai dos breadcrumbs dela no idioma pedido, e por isso não apodrece quando
um slug muda ([payload.md](payload.md#redirects)). O `api` não os preenche: como uma API
diz «isto mudou de sítio» é decisão de quem a desenhou.

**O redirect ganha à página.** Se um caminho tiver as duas coisas, responde o redirect —
é o que permite substituir um URL sem apagar o conteúdo que estava nele. E é resolvido
**antes** de se procurar página nenhuma, o que no Payload custa uma leitura de cache e
não uma consulta: a tabela vem inteira numa entrada por idioma, partilhada por todas as
rotas.

A excepção é a pré-visualização: em modo rascunho não se olha para os redirects, senão um
redirect a apanhar o caminho de uma página partia o preview da própria página que o
editor está a escrever.

## O frontend é SSR

O layout de raiz chama `draftMode()` e `headers()`. Qualquer um dos dois **retira estas rotas da geração estática**, portanto não existe uma única página estática no frontend.

Foi uma escolha, não um acidente. A alternativa era pôr o locale como segmento real de rota (`[locale]/…`), com `generateStaticParams` a perguntar os locales ao provider no build — mas isso obrigava o locale por omissão a levar prefixo na URL e a reescrever o `createPagePath` e os seus testes.

A consequência é que o desempenho se resolve com cache **ao nível dos dados** e não com HTML pré-construído. É o que o provider payload faz — ver [payload.md](payload.md#cache).
