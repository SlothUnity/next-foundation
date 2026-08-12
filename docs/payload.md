# Provider Payload

Tudo o que é específico do Payload vive em [src/providers/payload/](../src/providers/payload/). O resto do projecto não sabe que existe.

```
providers/payload/
├── provider.ts        ← o bundle: page, site, preview
├── locales.ts         ← idiomas suportados
├── sources/           ← PageSource e SiteSource + a query
├── mappers/           ← documento Payload → contrato do core
├── collections/       ← Pages, Media, Users
├── globals/           ← Site
├── blocks/            ← blocos de conteúdo (espelham os módulos)
├── plugins/           ← nestedDocs, breadcrumbs, seo
├── components/        ← componentes de admin (React)
└── utils/             ← createSlug, getLivePreviewUrl
```

## Configuração

[payload.config.ts](../payload.config.ts) na raiz, por convenção do Payload.

```ts
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',

  localization: { … },
  admin: { … },

  collections: [Users, Pages, Media],
  globals: [Site],

  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL || '' } }),
  plugins: [nestedDocs, seo],
});
```

## Localização

Os idiomas estão declarados em [locales.ts](../src/providers/payload/locales.ts) numa lista única, e derivam dela tanto a config do Payload como o type guard usado nas sources:

```ts
export const availableLocales = [
  { label: 'Português', value: 'pt-PT' },
  { label: 'English', value: 'en-GB' },
] as const;

export type SupportedLocale = (typeof availableLocales)[number]['value'];

export function isSupportedLocale(locale: string): locale is SupportedLocale { … }
```

Um idioma novo acrescenta-se aqui e propaga-se sozinho: aparece nas opções do global `Site`, na `localization` do Payload, e passa a ser aceite pelo `PayloadPageSource`.

**Há dois conceitos de "locale por omissão" e não são o mesmo:**

| Onde                                     | O que é                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| `localization.defaultLocale` (`'pt-PT'`) | o default do Payload, para fallback de campos          |
| `site.enabledLocales[0]`                 | o default **do site**, o que não recebe prefixo na URL |

O `resolveRoute` usa o segundo. Se o global `Site` tiver `enabledLocales` por outra ordem, é essa ordem que manda nas URLs.

O `filterAvailableLocales` esconde do admin os idiomas que o global `Site` não tem activos, para os editores não escreverem conteúdo em idiomas que o site não serve.

## Pages

[collections/Pages.ts](../src/providers/payload/collections/Pages.ts) — a collection central. Dois tabs:

**Configuration** — `isHome`, `title` (localizado), `breadcrumbs` (oculto, gerado), e o campo `pageUrl`.

**Modules** — um campo `blocks` alimentado por `pageBlocks`. Cada bloco disponível aqui corresponde a um módulo registado no frontend.

### isHome

Um checkbox com validação assíncrona que garante **uma só** homepage:

```ts
validate: async (value, { id, req }) => {
  if (!value) return true;

  const existing = await req.payload.find({
    collection: 'pages',
    where: { and: [{ isHome: { equals: true } }, ...(id ? [{ id: { not_equals: id } }] : [])] },
    limit: 1,
  });

  return existing.docs.length > 0 ? 'A homepage already exists.' : true;
};
```

O `not_equals: id` é o que permite gravar a própria homepage sem se autodetectar como conflito.

A página com `isHome` responde na raiz (`/` ou `/en`), e o plugin de nested docs exclui-a dos breadcrumbs dos filhos — ver [routing.md](routing.md).

### Rascunhos e autosave

```ts
versions: {
  drafts: {
    autosave: { interval: 375 },
  },
},
```

Com drafts activos, as queries normais passam a devolver só conteúdo publicado. O `375` é o intervalo que a documentação do Payload sugere para compensar o roundtrip do Live Preview server-side.

### Live Preview

```ts
admin: {
  livePreview: {
    url: async ({ data, locale, req }) => {
      const site = await req.payload.findGlobal({ slug: 'site', depth: 0 });
      const defaultLocale = site.enabledLocales?.[0];

      if (!defaultLocale) return undefined;

      return getLivePreviewUrl({
        breadcrumbs: data?.breadcrumbs,
        isHome: data?.isHome,
        locale: locale.code,
        defaultLocale,
      });
    },
  },
},
```

Devolver `undefined` é o contrato do Payload para **desligar** o preview. Ver a secção do Live Preview abaixo.

### O campo pageUrl

[components/PageUrl.tsx](../src/providers/payload/components/PageUrl.tsx) é um campo `type: 'ui'` que mostra ao editor o URL público da página. Corre no cliente e obtém os dados por REST (`/api/globals/site` e `/api/pages/:id`), porque um componente de admin não tem acesso à Local API.

O caminho do componente é uma **string** na config — ver o aviso em [conventions.md](conventions.md#cuidado-com-o-que-o-typescript-não-vê).

## Site

[globals/Site.ts](../src/providers/payload/globals/Site.ts) — nome do site e `enabledLocales` (select `hasMany`, ordenável).

**Este global tem de estar gravado.** Se `enabledLocales` estiver vazio, o `resolveRoute` não consegue determinar o locale por omissão, o `PageUrl` não renderiza e o Live Preview desliga-se — os três em silêncio, porque cada um trata a ausência como "nada a mostrar".

## Media e Users

[Media.ts](../src/providers/payload/collections/Media.ts) — `upload: true`, sem campos próprios.

[Users.ts](../src/providers/payload/collections/Users.ts) — `auth: true`, usada como `admin.user`. É a autenticação que a rota de preview valida.

## Plugins

[plugins/nestedDocs.ts](../src/providers/payload/plugins/nestedDocs.ts) — hierarquia de páginas e geração de breadcrumbs. O `generateURL` constrói o caminho a partir dos títulos, passados por [createSlug](../src/providers/payload/utils/createSlug.ts), e **exclui documentos com `isHome`** para que os filhos da homepage não herdem o slug dela.

[plugins/breadcrumbsField.ts](../src/providers/payload/plugins/breadcrumbsField.ts) — o campo em si, oculto no admin. Está separado do plugin porque é adicionado explicitamente à `Pages`, e não pelo plugin.

[plugins/seo.ts](../src/providers/payload/plugins/seo.ts) — `@payloadcms/plugin-seo` com `tabbedUI`, mais quatro campos: `ogTitle`, `ogDescription`, `noIndex`, `noFollow`. Os campos default do plugin são relaxados para opcionais.

## Sources

[sources/PayloadPageSource.ts](../src/providers/payload/sources/PayloadPageSource.ts)

```ts
async getPage(path, locale, options) {
  if (!locale || !isSupportedLocale(locale)) return undefined;

  const payload = await getPayload({ config });
  const page = await resolvePayloadPage(payload, path, locale, options?.draft ?? false);

  if (!page) return undefined;

  return mapPayloadPage(page, locale);
}
```

Um locale não suportado devolve `undefined` — trata-se como página não encontrada, não como erro.

[sources/resolvePayloadPage.ts](../src/providers/payload/sources/resolvePayloadPage.ts) — a query:

```ts
await payload.find({
  collection: 'pages',
  locale,
  fallbackLocale: false,
  draft,
  overrideAccess: draft,
  where: !path ? { isHome: { equals: true } } : { 'breadcrumbs.url': { equals: `/${path}` } },
  limit: 1,
  depth: 2,
});
```

Quatro decisões que importam:

- **`fallbackLocale: false`** — uma página sem tradução devolve 404 em vez de conteúdo no idioma errado.
- **`overrideAccess: draft`** — necessário porque não passamos `user` ao `find`; sem isto a query de rascunhos era rejeitada por access control. Está atrás do `draftMode`, que só é activado por um utilizador autenticado.
- **`where` bifurcado** — path vazio resolve pela homepage; o resto resolve pelo breadcrumb.
- **`depth: 2`** — popula relações e media. Com `depth: 0` os blocos com relações chegariam como IDs.

## Mapper

[mappers/mapPayloadPage.ts](../src/providers/payload/mappers/mapPayloadPage.ts) — a fronteira onde o formato do Payload deixa de existir.

```ts
function mapBlock(block): ModuleInstance {
  const { id, blockType, blockName, ...data } = block;

  return {
    id,
    name: blockName || blockType,
    alias: blockType, // ← a ligação ao módulo
    data: removeNullValues(data),
  };
}
```

O `blockType` do Payload torna-se o `alias` do módulo. É essa a única ligação entre o CMS e o frontend.

O `removeNullValues` é recursivo e existe porque o Payload devolve `null` para campos opcionais vazios, enquanto o zod espera `undefined` em `.optional()`. Sem isto, um subtítulo vazio falhava a validação.

## Live Preview

Server-side, que é o que a documentação do Payload recomenda para React Server Components. Funciona por refresh da rota em cada gravação — com autosave a 375ms é praticamente indistinguível de preview por tecla, e mantém a renderização no servidor.

```
admin altera um campo
        │  autosave (375ms)
        ▼
postMessage para o iframe
        │
        ▼
RefreshRouteOnSave  →  router.refresh()          providers/payload/components/
        │
        ▼
page.tsx  →  draftMode().isEnabled  →  getPage(…, { draft: true })
```

**O arranque:** o `url` da collection devolve `/next/preview?path=…&previewSecret=…`. O iframe carrega essa rota, que valida e redirecciona para a página real.

[app/(frontend)/next/preview/route.ts](<../src/app/(frontend)/next/preview/route.ts>) — quatro guardas antes de activar o `draftMode`:

1. `previewSecret` tem de coincidir com `PREVIEW_SECRET` → 403
2. `path` tem de começar por `/` e não por `//` → 400 (protecção contra open redirect)
3. `payload.auth({ headers })` tem de devolver um utilizador → 401
4. só então `draftMode().enable()` e redirect

[next/exit-preview/route.ts](<../src/app/(frontend)/next/exit-preview/route.ts>) desliga o cookie. Sem passar por aqui, a navegação normal continua a servir rascunhos.

O [PayloadLivePreview.tsx](../src/providers/payload/components/PayloadLivePreview.tsx) é montado pelo [layout.tsx](<../src/app/(frontend)/layout.tsx>), condicionado ao `draftMode`, e chega lá pelo `provider.preview` — o `core` não participa.

### O que confunde

**Em Payload 3 o Live Preview não é um tab.** É um botão de toggle no header do documento, ao lado do Save/Publish.

**Não aparece em documentos novos.** O Payload passa `isLivePreviewEnabled && operation !== 'create'`, e a função `url` só é executada quando `operation !== 'create'`. Grava primeiro.

**Se o `url` devolver `undefined`, o preview desaparece sem erro.** A causa mais provável é o global `Site` sem `enabledLocales`.

**O `url` corre a cada autosave.** Com `interval: 375` é um `findGlobal` à base de dados a cada 375ms por editor com o painel aberto. A própria documentação do Payload avisa para não pôr operações caras nesta função. Só dói com vários editores em simultâneo; se acontecer, cachear o `defaultLocale` em memória no módulo.
