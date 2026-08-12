# Routing, locales e metadata

Uma única rota serve todo o site: [app/(frontend)/[[...segments]]/page.tsx](<../src/app/(frontend)/[[...segments]]/page.tsx>), um catch-all opcional. Não há rotas por idioma nem por tipo de página.

## Da URL à página

```
/en/servicos/consultoria
        │
        ▼  segments = ['en', 'servicos', 'consultoria']
resolveRoute({ segments, locales })
        │  { locale: 'en-GB', path: 'servicos/consultoria' }
        ▼
provider.page.getPage('servicos/consultoria', 'en-GB', { draft })
```

O `locales` vem de `site.getSite()`, ou seja do CMS — os idiomas do site são conteúdo, não configuração de build.

## resolveRoute

[core/routing/resolveRoute.ts](../src/core/routing/resolveRoute.ts)

```ts
export function resolveRoute({ segments, locales }): ResolvedRoute | undefined;
```

**O primeiro locale da lista é o default.** Se `locales` estiver vazio devolve `undefined`, e a página faz `notFound()`.

A decisão é simples: se o primeiro segmento corresponder ao segmento de um locale conhecido, esse é o locale e o resto é o path; senão, é o locale por omissão e todos os segmentos são o path.

```
locales = ['pt-PT', 'en-GB']        (pt-PT é o default)

/                        → { locale: 'pt-PT', path: ''            }
/servicos                → { locale: 'pt-PT', path: 'servicos'    }
/en                      → { locale: 'en-GB', path: ''            }
/en/servicos             → { locale: 'en-GB', path: 'servicos'    }
```

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

[app/(frontend)/createMetadata.ts](<../src/app/(frontend)/createMetadata.ts>) traduz o `Meta` do domínio para o `Metadata` do Next.

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

Os campos de Open Graph caem para os campos gerais quando não estão preenchidos, e os booleanos invertem-se: o CMS pergunta "não indexar?", o Next quer saber "indexar?".

Vive na camada `app` e não no `core` porque depende de tipos do Next. O `core` não conhece o framework.

O `generateMetadata`, a página e o layout chamam todos o mesmo [resolvePage](<../src/app/(frontend)/[[...segments]]/resolvePage.ts>), que está envolvido no `cache` do React: três chamadas, uma resolução por pedido. A chave é o caminho em string e não o array de segmentos, porque o `cache` compara argumentos por identidade e cada `await params` devolve um array novo.

## O idioma do `<html>`

O root layout vive **dentro** do segmento dinâmico, em [[[...segments]]/layout.tsx](<../src/app/(frontend)/[[...segments]]/layout.tsx>), e não acima dele. A razão é o `lang`:

```tsx
<html lang={resolved?.page.meta.locale}>
```

Quem declara o idioma é a página, não o routing — a fonte de conteúdo sabe em que idioma escreveu, e o mapper do provider põe isso na `meta.locale`. Um layout acima do segmento não recebe `params`, logo não sabe que página está a ser servida e não conseguiria lá chegar.

A consequência prática: um provider cujo conteúdo traz o idioma tem o `lang` correcto sem declarar lista de idiomas nenhuma. A lista serve o `resolveRoute`, que é um problema diferente — ver [api.md](api.md#idiomas).

Sem página resolvida (um 404) não se declara `lang` nenhum, em vez de declarar um errado.

## Rotas reservadas

```
app/(frontend)/
├── [[...segments]]/     ← todas as páginas, e o root layout
└── next/
    ├── preview/         ← activa o draftMode
    └── exit-preview/    ← desactiva
```

O prefixo `next/` isola as rotas de framework do namespace de conteúdo — é a convenção do template oficial do Payload. Rotas estáticas têm precedência sobre o catch-all, por isso não há conflito, mas qualquer path que se acrescente aqui deixa de estar disponível para conteúdo.

## draftMode

O [layout.tsx](<../src/app/(frontend)/[[...segments]]/layout.tsx>) e o `page.tsx` chamam `draftMode()`, o que **retira estas rotas da geração estática**, mesmo em produção. No estado actual não se perde nada, porque as páginas vêm todas da base de dados. Se um dia se quiser ISR, é preciso isolar a leitura do `draftMode` do caminho normal.
