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

```ts
export function createMetadata(meta: Meta): Metadata {
  return {
    title: meta.title,
    description: meta.description,

    openGraph: {
      title: meta.ogTitle ?? meta.title,
      description: meta.ogDescription ?? meta.description,
    },

    robots: {
      index: !meta.noIndex,
      follow: !meta.noFollow,
    },
  };
}
```

Os campos de Open Graph caem para os campos gerais quando não estão preenchidos, e os booleanos invertem-se: o CMS pergunta «não indexar?», o Next quer saber «indexar?».

Vive na camada `app` e não no `core` porque depende de tipos do Next. O `core` não conhece o framework.

O `generateMetadata` e a página chamam ambos o mesmo [resolvePage](<../src/app/(frontend)/_lib/resolvePage.ts>), envolvido no `cache` do React: duas chamadas, uma resolução por pedido. A chave é o caminho em string e não o array de segmentos, porque o `cache` compara argumentos por identidade e cada `await params` devolve um array novo.

## O idioma do `<html>`

O layout de raiz vive no topo do route group, em [app/(frontend)/layout.tsx](<../src/app/(frontend)/layout.tsx>). **Tem de ser aí**: quando se usam route groups como raízes separadas, o Next só monta o boundary do `not-found` e do `error` se encontrar um layout de raiz a esse nível. Enquanto o layout viveu dentro do `[[...segments]]`, um 404 respondia com o invólucro interno do Next (`<html id="__next_error__">`) em vez do nosso.

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
app/(frontend)/
├── _lib/                ← não é rota: o prefixo _ tira a pasta do router
│   ├── createMetadata.ts
│   ├── resolvePage.ts
│   └── resolveSite.ts
├── layout.tsx           ← o layout de raiz do grupo
├── not-found.tsx
├── error.tsx
├── global-error.tsx
├── [[...segments]]/
│   └── page.tsx         ← todas as páginas
└── next/
    ├── preview/         ← activa o draftMode
    └── exit-preview/    ← desactiva
```

Dentro de `app/` só ficheiros de rota; o resto vai para `_lib/`. Sem essa regra, um `.ts` solto no meio das rotas não se distingue de uma convenção do Next à qual falta reconhecer o nome.

O prefixo `next/` isola as rotas de framework do namespace de conteúdo — é a convenção do template oficial do Payload. Rotas estáticas têm precedência sobre o catch-all, por isso não há conflito, mas qualquer path que se acrescente aqui deixa de estar disponível para conteúdo.

## O frontend é SSR

O layout de raiz chama `draftMode()` e `headers()`. Qualquer um dos dois **retira estas rotas da geração estática**, portanto não existe uma única página estática no frontend.

Foi uma escolha, não um acidente. A alternativa era pôr o locale como segmento real de rota (`[locale]/…`), com `generateStaticParams` a perguntar os locales ao provider no build — mas isso obrigava o locale por omissão a levar prefixo na URL e a reescrever o `createPagePath` e os seus testes.

A consequência é que o desempenho se resolve com cache **ao nível dos dados** e não com HTML pré-construído. É o que o provider payload faz — ver [payload.md](payload.md#cache).
