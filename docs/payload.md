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
  secret: requireEnv('PAYLOAD_SECRET', 'Payload to sign session tokens'),
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',

  localization: { … },
  admin: { … },

  collections: [Users, Pages, Media],
  globals: [Site],

  db: postgresAdapter({ pool: { connectionString: requireEnv('DATABASE_URL', …) } }),
  plugins: [nestedDocs, seo],
});
```

O [requireEnv](../src/providers/requireEnv.ts) derruba o arranque quando falta configuração obrigatória, em vez de degradar em silêncio: um `|| ''` num segredo de assinatura produz tokens forjáveis sem um único aviso.

## Localização

Os idiomas estão declarados em [locales.ts](../src/providers/payload/locales.ts) numa lista única, e derivam dela tanto a config do Payload como o type guard usado nas sources:

```ts
export const availableLocales = [
  { label: 'Português', value: 'pt-PT' },
  { label: 'English', value: 'en-GB' },
] as const;

export type SupportedLocale = (typeof availableLocales)[number]['value'];

export const payloadDefaultLocale: SupportedLocale = 'pt-PT';

export function isSupportedLocale(locale: string): locale is SupportedLocale { … }
```

Um idioma novo acrescenta-se aqui e propaga-se sozinho: aparece nas opções do global `Site`, na `localization` do Payload, e passa a ser aceite pelo `PayloadPageSource`.

**Há dois conceitos de "locale por omissão" e não são o mesmo:**

| Onde                               | O que é                                                |
| ---------------------------------- | ------------------------------------------------------ |
| `payloadDefaultLocale` (`'pt-PT'`) | o default do Payload, para o comportamento dos campos  |
| `SiteDefinition.defaultLocale`     | o default **do site**, o que não recebe prefixo na URL |

O primeiro é uma constante de código, partilhada pelo `localization.defaultLocale` do [payload.config.ts](../payload.config.ts) para não haver duas cópias do mesmo valor. Com `fallback: false` e com todas as queries a passarem locale explícito, governa pouco.

O segundo é o que manda no routing, e sai do [mapPayloadSite](../src/providers/payload/mappers/mapPayloadSite.ts):

```ts
defaultLocale: locales[0] ?? payloadDefaultLocale;
```

O campo `enabledLocales` é ordenável no admin e a sua descrição promete que o primeiro é o default — é essa promessa que o mapper cumpre. Se o global estiver por preencher, cai na constante em vez de ficar sem resposta.

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

**Este global tem de estar gravado.** Com `enabledLocales` vazio, o site fica sem idiomas: o `mapPayloadSite` cai no `payloadDefaultLocale` para o routing não parar, mas o `PageUrl` não renderiza e o Live Preview desliga-se — os dois em silêncio, porque tratam a ausência como «nada a mostrar». Está no [TODO.md](TODO.md).

## Media e Users

[Media.ts](../src/providers/payload/collections/Media.ts) — `upload: true`, sem campos próprios. Leitura pública: é a única collection aberta, porque as imagens de um site público têm de ser carregadas pelo browser.

[Users.ts](../src/providers/payload/collections/Users.ts) — `auth: true`, usada como `admin.user`. É a autenticação que a rota de preview valida.

## Access control

**O default do Payload é `({ req: { user } }) => Boolean(user)`.** Uma collection sem `access` declarado exige utilizador para tudo, incluindo ler — e é isso que se quer aqui: o CMS e a sua REST API ficam fechados.

A única excepção é a leitura de `Media`, porque o browser tem de conseguir carregar as imagens:

```ts
access: {
  read: () => true,
}
```

O frontend não passa por access control nenhum: lê pela Local API com `overrideAccess: true`, como consumidor de confiança que corre no servidor. Não é um atalho — é a distinção entre "quem chega pela rede" e "o nosso próprio render".

O que isto obriga, e é a parte a não perder: **é a query que tem de excluir o que não está publicado.** Com `overrideAccess: true` não há filtro implícito, e uma página em rascunho tem uma linha na tabela principal como qualquer outra. Ver [Sources](#sources).

Consequência a ter presente: uma página que nunca foi publicada dá 404 em público, mesmo existindo. Com autosave ligado, uma página criada e nunca publicada fica em `_status: 'draft'` — é preciso premir Publish.

## Plugins

[plugins/nestedDocs.ts](../src/providers/payload/plugins/nestedDocs.ts) — hierarquia de páginas e geração de breadcrumbs. O `generateURL` constrói o caminho a partir dos títulos, passados por [createSlug](../src/providers/payload/utils/createSlug.ts), e **exclui documentos com `isHome`** para que os filhos da homepage não herdem o slug dela.

[plugins/breadcrumbsField.ts](../src/providers/payload/plugins/breadcrumbsField.ts) — o campo em si, oculto no admin. Está separado do plugin porque é adicionado explicitamente à `Pages`, e não pelo plugin.

[plugins/seo.ts](../src/providers/payload/plugins/seo.ts) — `@payloadcms/plugin-seo` com `tabbedUI`, mais quatro campos: `ogTitle`, `ogDescription`, `noIndex`, `noFollow`. Os campos default do plugin são relaxados para opcionais.

## Sources

[sources/PayloadPageSource.ts](../src/providers/payload/sources/PayloadPageSource.ts)

```ts
async getPage(path, locale, options) {
  const requested = locale ?? (await this.getDefaultLocale());

  if (!isSupportedLocale(requested)) return undefined;

  // O rascunho nunca passa pela cache.
  if (options?.draft) return loadPayloadPage(path, requested, true);

  return getCachedPage(path, requested);
}
```

Sem locale, o default é resposta desta origem — o `getDefaultLocale` lê o global `Site` pelo `getCachedSite`, portanto é a mesma entrada de cache que a `PayloadSiteSource` usa e não uma consulta extra.

A bifurcação entre `loadPayloadPage` e `getCachedPage` é o tema da [Cache](#cache).

Um locale que o Payload não conheça devolve `undefined` — trata-se como página não encontrada, não como erro.

O [getPayloadClient](../src/providers/payload/getPayloadClient.ts) importa o `payload.config.ts` **dinamicamente**, para que o config não seja avaliado com `PROVIDER=mock`.

[sources/resolvePayloadPage.ts](../src/providers/payload/sources/resolvePayloadPage.ts) — a query:

```ts
await payload.find({
  collection: 'pages',
  locale,
  fallbackLocale: false,
  draft,
  overrideAccess: true,
  where, // caminho + `_status: 'published'` quando não é rascunho
  limit: 1,
  depth: 2,
});
```

Cinco decisões que importam:

- **`fallbackLocale: false`** — uma página sem tradução devolve 404 em vez de conteúdo no idioma errado.
- **`overrideAccess: true`** — a Local API não lê o cookie de sessão, e não lhe passamos `user`: com access control ligado, um visitante anónimo não é "um utilizador não autenticado", é _nenhum_ utilizador, e o `find` devolve zero documentos. O frontend é um consumidor de confiança — ver [Access control](#access-control).
- **`_status: 'published'` fora do modo de rascunho** — é isto que substitui o access control como guarda. Sem ele, uma página em rascunho com breadcrumb ficaria visível em público.
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

## Cache

[cache/](../src/providers/payload/cache/)

Sem ela, cada visita a cada página fazia duas consultas ao Postgres — uma ao global `Site`, outra à página. O `cache()` do React só deduplica dentro de um pedido, e o frontend é SSR, portanto não havia nada a guardar entre pedidos. Medido num servidor de produção contra a base de dados real: **133 ms a frio, ~20 ms a quente.**

### O que se guarda

Guarda-se o `PageDefinition` e o `SiteDefinition` — o resultado do mapeamento, não o documento cru. O documento vem com `depth: 2`, e arrasta media e relações inteiras; o `PageDefinition` é o que o renderer precisa e nada mais, é JSON puro, e é isso que o `unstable_cache` sabe serializar.

| Ficheiro                                                                          | Papel                                             |
| --------------------------------------------------------------------------------- | ------------------------------------------------- |
| [sources/loadPayloadPage.ts](../src/providers/payload/sources/loadPayloadPage.ts) | consulta + mapeamento, sem cache nenhuma          |
| [sources/loadPayloadSite.ts](../src/providers/payload/sources/loadPayloadSite.ts) | o mesmo para o global `Site`, com `depth: 0`      |
| [cache/getCachedPage.ts](../src/providers/payload/cache/getCachedPage.ts)         | o `loadPayloadPage` com o `draft` fixo em `false` |
| [cache/getCachedSite.ts](../src/providers/payload/cache/getCachedSite.ts)         | o `loadPayloadSite` guardado                      |
| [cache/tags.ts](../src/providers/payload/cache/tags.ts)                           | `payload:pages` e `payload:site`                  |
| [cache/hooks.ts](../src/providers/payload/cache/hooks.ts)                         | os hooks do Payload que invalidam                 |

O `path` e o `locale` entram na chave por serem argumentos — o `unstable_cache` inclui-os por si, e o `keyParts` serve só de prefixo. Cada idioma tem a sua entrada; o global `Site` tem uma só, partilhada por todas as rotas.

Não há `revalidate` por tempo. O conteúdo não envelhece sozinho, muda quando o editor o muda.

### O rascunho nunca entra

É a regra que mais importa. O que o editor vê no Live Preview é a versão dele, e guardá-la arriscava servi-la a um visitante anónimo. O `getCachedPage` tem o `draft` fixo em `false`, portanto não há sequer forma de lá chegar um rascunho por engano — quem precisa dele chama o `loadPayloadPage` directamente.

O `unstable_cache` também se desliga sozinho em modo rascunho, mas isso é a segunda linha de defesa, não a primeira.

### O 404 também se guarda

Uma página que não existe fica em cache como `undefined`. É o que se quer: um 404 repetido não deve custar uma consulta, e publicar a página nova invalida a mesma tag.

### Invalidação

As tags são propositadamente grosseiras — uma para todas as páginas, outra para o global. Uma tag por página seria mais eficiente mas não é de confiança aqui: o `nestedDocs` reescreve os breadcrumbs dos filhos quando um pai muda de slug, e nesse caminho não há garantia de que o `afterChange` de cada filho dispare. Invalidar a mais custa uma consulta; invalidar a menos serve um URL errado durante horas.

Duas decisões no [revalidatePayloadTag](../src/providers/payload/cache/revalidatePayloadTag.ts):

- **`{ expire: 0 }` e não `'max'`.** O `'max'` que a documentação do Next recomenda marca como velho e serve o conteúdo antigo enquanto revalida em fundo. Errado para um CMS: quem carrega em publicar veria a página velha à primeira. A forma de um só argumento faria o mesmo que `{ expire: 0 }` mas está depreciada em Next 16.
- **Os hooks também correm fora do Next.** Um script de seed, uma migração ou o CLI do Payload chamam o mesmo `afterChange`, e aí o `revalidateTag` atira por não encontrar contexto de pedido. Nesse caso não há cache para invalidar, portanto engole-se — mas só esse erro, identificado pelo código `E263` e não pela mensagem.

E uma guarda no hook das páginas: **um rascunho de uma página nunca publicada não invalida nada.** Sem isto, o autosave a 375ms invalidava a cache do site inteiro a cada tecla que um editor escrevesse. O `previousDoc` conta tanto como o `doc`, por causa do despublicar — a versão nova é rascunho, mas a antiga estava em cache e tem de sair.

### `unstable_cache` está depreciado

Em Next 16 o `unstable_cache` está declarado como substituído pela directiva `use cache`, que exige `cacheComponents: true`. Esse flag não é uma troca de API: liga o PPR por omissão, muda a navegação para `<Activity>`, e obriga todo o acesso a APIs de runtime a viver dentro de um `<Suspense>` — incluindo o `headers()` do nosso layout de raiz, de onde sai o `<html lang>`, e incluindo o admin do Payload, que partilha o mesmo `app/`. Fica registado em [TODO.md](TODO.md) como ronda própria.

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
2. `isSafeRedirectPath(path)` — só caminhos relativos à própria origem → 400 (ver [routing.md](routing.md#issaferedirectpath))
3. `payload.auth({ headers })` tem de devolver um utilizador → 401
4. só então `draftMode().enable()` e redirect

[next/exit-preview/route.ts](<../src/app/(frontend)/next/exit-preview/route.ts>) desliga o cookie. Sem passar por aqui, a navegação normal continua a servir rascunhos.

O [PayloadLivePreview.tsx](../src/providers/payload/components/PayloadLivePreview.tsx) é montado pelo [layout.tsx](<../src/app/(frontend)/layout.tsx>), condicionado ao `draftMode`, e chega lá pelo `provider.preview` — o `core` não participa.

O `matcher` do [proxy](../src/proxy.ts) exclui `next/`, portanto as duas rotas de preview não passam por ele. Se essa exclusão desaparecer, o preview deixa de existir sem dizer porquê.

### O que confunde

**Em Payload 3 o Live Preview não é um tab.** É um botão de toggle no header do documento, ao lado do Save/Publish.

**Não aparece em documentos novos.** O Payload passa `isLivePreviewEnabled && operation !== 'create'`, e a função `url` só é executada quando `operation !== 'create'`. Grava primeiro.

**Se o `url` devolver `undefined`, o preview desaparece sem erro.** A causa mais provável é o global `Site` sem `enabledLocales`.

**O `url` corre a cada autosave.** Com `interval: 375` é um `findGlobal` à base de dados a cada 375ms por editor com o painel aberto. A própria documentação do Payload avisa para não pôr operações caras nesta função. Só dói com vários editores em simultâneo; se acontecer, cachear o `defaultLocale` em memória no módulo.
