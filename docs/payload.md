# Provider Payload

Tudo o que é específico do Payload vive em [src/providers/payload/](../src/providers/payload/). O resto do projecto não sabe que existe.

```
providers/payload/
├── provider.ts        ← o bundle: page, site, preview
├── locales.ts         ← idiomas suportados
├── sources/           ← PageSource e SiteSource + as queries
├── mappers/           ← documento Payload → contrato do core
├── collections/       ← Pages, Redirects, Media, Users
├── globals/           ← Site
├── blocks/            ← blocos de conteúdo (espelham os módulos)
├── fields/            ← campos partilhados por collections
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

  collections: [Users, Pages, Redirects, Media],
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

**Configuration** — `isHome`, `is404`, `title` (localizado), `breadcrumbs` (oculto, gerado), e o campo `pageUrl`.

**Modules** — um campo `blocks` alimentado por `pageBlocks`. Cada bloco disponível aqui corresponde a um módulo registado no frontend.

### isHome e is404

Duas checkboxes com a mesma regra: **um só** documento da collection pode ter cada uma ligada. A primeira diz «esta é a homepage», a segunda «esta é a página de erro».

A regra vive numa fábrica, [fields/uniqueFlagField.ts](../src/providers/payload/fields/uniqueFlagField.ts), e não em duas cópias:

```ts
uniqueFlagField({
  name: 'is404',
  label: 'Not Found Page',
  description: 'Serve this page when no other page matches the URL. It is never indexed.',
  taken: 'A not found page already exists.',
  collection: 'pages',
});
```

Três detalhes que a fábrica preserva do `isHome` original:

- **a validação só corre quando o valor é `true`.** Desligar a marca nunca pode falhar, senão um documento marcado por engano ficava impossível de gravar;
- **o `not_equals: id`** é o que permite gravar o próprio documento marcado sem ele se autodetectar como conflito. Não existe na criação, onde ainda não há `id`;
- **garante que não há mais do que um, nunca que há um.** Quem lê tem de lidar com a ausência — e é o que o `resolvePayloadNotFoundPage` faz.

A página com `isHome` responde na raiz (`/` ou `/en`), e o plugin de nested docs exclui-a dos breadcrumbs dos filhos — ver [routing.md](routing.md).

A página com `is404` continua a ter URL próprio e a responder nele. O que a marca acrescenta é ser servida quando nenhum outro caminho encaixa — e aí o `generateMetadata` força-lhe o `noIndex`, independentemente do que o editor tenha escolhido no separador de SEO.

### Hooks de cache

```ts
hooks: {
  afterChange: [revalidatePagesOnChange],
  afterDelete: [revalidatePagesOnDelete],
},
```

O único ponto onde o CMS fala com o cache do Next. Interage com o `autosave` logo abaixo, e a interação não é inocente — ver [Cache](#cache).

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
      const previewSecret = process.env.PREVIEW_SECRET;

      if (!previewSecret) {
        req.payload.logger.error('PREVIEW_SECRET is not set: Live Preview is disabled.');

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

Devolver `undefined` é o contrato do Payload para **desligar** o preview, e com o segredo em falta é a única saída honesta: o link que se gerasse respondia 403 dentro do iframe sem dizer a ninguém porquê. Ver a secção do Live Preview abaixo.

O `defaultLocale` vem do `mapPayloadSite` e não de um `enabledLocales?.[0]` local — essa terceira cópia da regra desligava o preview em silêncio com o global por preencher.

### O campo pageUrl

[components/PageUrl.tsx](../src/providers/payload/components/PageUrl.tsx) é um campo `type: 'ui'` que mostra ao editor o URL público da página. **Corre só no servidor e não faz pedido nenhum à API.**

Um componente de campo de servidor recebe nas props tudo o que este campo precisa:

| prop          | serve para                                           |
| ------------- | ---------------------------------------------------- |
| `data`        | os `breadcrumbs` do documento, de onde sai o caminho |
| `req.locale`  | o idioma escolhido no admin                          |
| `req.origin`  | a origem do pedido                                   |
| `req.payload` | a Local API, para ler o global `Site`                |

Aqui esteve um componente cliente com um `useEffect` a buscar o global e a página por REST — pedidos ao Payload a partir de dentro do Payload. Com eles foram-se quatro coisas: os `return` mudos quando uma resposta não vinha `ok`, o `AbortController` em falta, o `void loadData()` que transformava uma falha de rede numa _unhandled rejection_, e uma terceira cópia do `enabledLocales[0]` sem a queda para o `payloadDefaultLocale` — era isso que fazia o campo desaparecer com o global por preencher.

Vir tudo do mesmo render fecha ainda uma inconsistência que uma versão cliente não consegue evitar: o `useLocale()` muda de imediato ao trocar de idioma, mas os breadcrumbs viriam de um pedido separado, e entre os dois há um instante com o prefixo de um idioma e o caminho do outro.

Numa página por gravar não há breadcrumbs nem URL. O campo diz-o em vez de desaparecer, e nem chega a consultar o global.

O caminho do componente é uma **string** na config — ver o aviso em [conventions.md](conventions.md#cuidado-com-o-que-o-typescript-não-vê).

## Redirects

[collections/Redirects.ts](../src/providers/payload/collections/Redirects.ts) — uma linha por caminho antigo. O `from`, o destino, e o `permanent`.

**Sem versões.** Não há rascunho de um redirect: qualquer gravação é uma publicação, e por isso os hooks invalidam sempre, sem a guarda de `_status` que a `Pages` precisa por causa do autosave.

### O destino é uma referência, não um caminho

É a decisão central desta collection. O `type` escolhe entre **uma página** (por omissão) e **um caminho à mão**; o primeiro é uma `relationship` para `pages`, e o URL é derivado dos breadcrumbs no momento da leitura.

Duas coisas se ganham com isso, e nenhuma é cosmética.

**Se a página de destino mudar de slug, a referência continua certa.** Com o `nestedDocs` a reescrever breadcrumbs sempre que um pai muda, um destino escrito à mão fica a apontar para o vazio sem ninguém dar por isso — e um 308 para um 404 é pior do que não haver redirect nenhum, porque o browser guarda o caminho e continua a ir lá.

**A referência não é localizada, e o `from` é.** O `from` tem de o ser porque um slug traduz-se: `/pagina-antiga` não é `/old-page`. Mas a página de destino é **um documento**, o mesmo nos dois idiomas — o que muda é o URL dela em cada um. O editor escolhe a página uma vez e cada idioma recebe o seu URL, em vez de haver duas hipóteses de apontar o redirect português para o URL inglês.

O `custom` fica para o que não é uma página do CMS — um ficheiro, uma rota da aplicação. Esse é localizado, porque aí o URL é mesmo escrito à mão.

### O resto dos campos

**O `from` não leva prefixo de idioma**: o caminho que chega ao provider já vem sem ele, resolvido pelo `resolveRoute`. O `custom` leva-o quando precisa, porque vai direito ao `redirect()` do Next.

**Os dois caminhos passam pelo `isSafeRedirectPath`** — a mesma função que fecha o open redirect da rota de pré-visualização. Um redirect para fora do site é uma decisão de projecto; o que não pode é acontecer por distracção num campo de texto, assinado pelo nosso domínio. O `custom` leva ainda uma guarda de ciclo: um redirect que aponta para si próprio é recusado enquanto ainda tem nome, em vez de o browser o cortar com um erro que não nomeia o culpado.

As validações decidem pelo `type` e não pela UI. O `admin.condition` esconde o campo que não interessa, mas esconder não é dispensar — a regra de «é obrigatório» tem de saber em que modo está.

O `permanent` escolhe entre 307 e 308 — ver [routing.md](routing.md#redirects). Como se lêem e se guardam está em [Sources](#sources) e [Cache](#cache).

### Porque não o plugin oficial

O [`@payloadcms/plugin-redirects`](https://payloadcms.com/docs/plugins/redirects) faz parte disto, e foi considerado. Três razões para não entrar:

- **não resolve nada em runtime.** A documentação dele di-lo: «this plugin only manages the redirects within the Payload Admin Panel and database. It does not handle the redirect itself.» O loader, a cache, a tag, os hooks e a ligação à `PayloadPageSource` — o grosso do trabalho — existiam na mesma;
- **os `redirectTypes` dele são 301/302**, e este projecto serve **307/308**. Ver [routing.md](routing.md#redirects): 301/302 exigiam produzir a resposta no proxy, e isso está medido a 12× o custo. O campo do plugin oferecia ao editor uma escolha que a aplicação não sabe honrar;
- **o `from` teria de ser localizado por `overrides`**, e a essa altura os campos estão reescritos — que é o que está aqui, sem a dependência.

## Site

[globals/Site.ts](../src/providers/payload/globals/Site.ts) — nome do site e `enabledLocales` (select `hasMany`, ordenável).

**Este global tem de estar gravado**, mas já não é catastrófico se não estiver. Com `enabledLocales` vazio, o `mapPayloadSite` cai no `payloadDefaultLocale` para o routing não parar e avisa no log que o está a fazer; o Live Preview e o `pageUrl` continuam a funcionar, porque os dois passam a resposta a esse mesmo mapeador.

Tem um `afterChange` a invalidar a tag `payload:site` — sem guarda nenhuma, porque um global não tem rascunhos e mudar a ordem dos idiomas muda o `<html lang>` de todas as páginas. Ver [Cache](#cache).

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

  if (!isSupportedLocale(requested)) return { status: 'notFound' };

  // O rascunho nunca passa pela cache — nem pelos redirects.
  if (options?.draft) return loadPayloadPage(path, requested, true);

  const redirect = await this.resolveRedirect(path, requested);

  if (redirect) return redirect;

  return getCachedPage(path, requested);
}
```

Sem locale, o default é resposta desta origem — o `getDefaultLocale` lê o global `Site` pelo `getCachedSite`, portanto é a mesma entrada de cache que a `PayloadSiteSource` usa e não uma consulta extra.

A bifurcação entre `loadPayloadPage` e `getCachedPage` é o tema da [Cache](#cache).

Um locale que o Payload não conheça devolve `{ status: 'notFound' }` **com um aviso no log** — trata-se como página não encontrada, mas não em silêncio: é divergência de configuração entre o CMS e o `locales.ts`, e sem o aviso ficava indistinguível de uma página que não existe.

**O redirect resolve-se antes de se procurar página nenhuma**, e fora do `getCachedPage`. Se vivesse lá dentro, a decisão de redireccionar ficava guardada dentro da entrada da página, com a tag das páginas — e mudar um redirect não a invalidava. Assim são duas caches com duas tags, cada uma a expirar pelo seu motivo.

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

O mesmo ficheiro exporta o `resolvePayloadNotFoundPage`, que é a mesma consulta com `{ is404: { equals: true } }` no lugar do caminho. Corre **só quando a primeira falha**, e por isso uma página que existe continua a custar uma consulta. O caminho de falha custa duas, uma vez — o resultado fica em cache como qualquer outro.

Um 404 em rascunho não passa: o filtro de `_status` vale para a página de erro como para as outras, senão um 404 por publicar aparecia a toda a gente sem ninguém o ter publicado.

[sources/loadPayloadRedirects.ts](../src/providers/payload/sources/loadPayloadRedirects.ts) — a tabela de redirects de um idioma, como **mapa** de caminho antigo para destino.

Um mapa e não uma lista, e a tabela inteira e não uma consulta por caminho, porque isto corre antes de cada página: guardado, é uma entrada de cache por idioma partilhada por todo o site; consultado por caminho, seria uma entrada por URL visitado e uma consulta a frio em cada um deles.

**Duas consultas a frio, para o site inteiro.** A primeira traz a tabela com `depth: 0` — ids, não documentos. É aí que está o cuidado: com `depth: 1`, o Payload populava a página apontada por cada redirect — blocos, media, relações — só para se lhe ler o breadcrumb. A segunda traz **todas** as páginas apontadas de uma vez, com `select: { breadcrumbs: true }`, e desaparece se nenhum redirect apontar para uma página.

```ts
const result = await payload.find({
  collection: 'pages',
  where: { and: [{ id: { in: [...ids] } }, { _status: { equals: 'published' } }] },
  locale,
  fallbackLocale: false,
  limit: ids.size,
  depth: 0,
  select: { breadcrumbs: true },
});
```

O `_status: 'published'` não é copiado por hábito. **Um redirect para uma página por publicar mandava o visitante a um 404 — e sendo 308, o browser guardava esse caminho e continuava a ir lá depois de o problema estar resolvido.** É pior do que não haver redirect nenhum, e por isso a linha é ignorada com um aviso que a nomeia.

O URL final sai do último breadcrumb passado pelo [createPagePath](../src/core/routing/createPagePath.ts), que é quem sabe pôr o prefixo de idioma. A homepage tem `/` como breadcrumb e vira `/` ou `/en` conforme o idioma, de graça.

A chave é normalizada para a forma em que o caminho chega — sem barras nas pontas, com a raiz (`/`) a virar a cadeia vazia, que é como a homepage aparece aqui.

Há um limite de mil linhas. Não é um número mágico: é o ponto onde carregar a tabela toda para memória deixa de ser óbvio, e quando é ultrapassado o loader **diz em voz alta** que os restantes respondem 404, em vez de os ignorar em silêncio.

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

Guarda-se o `PageResponse` e o `SiteDefinition` — o resultado do mapeamento, não o documento cru. O documento vem com `depth: 2`, e arrasta media e relações inteiras; o `PageDefinition` é o que o renderer precisa e nada mais, é JSON puro, e é isso que o `unstable_cache` sabe serializar. O envelope inteiro também o é.

| Ficheiro                                                                                    | Papel                                                |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [sources/loadPayloadPage.ts](../src/providers/payload/sources/loadPayloadPage.ts)           | consulta + mapeamento, sem cache nenhuma             |
| [sources/loadPayloadRedirects.ts](../src/providers/payload/sources/loadPayloadRedirects.ts) | a tabela de redirects de um idioma, como mapa        |
| [sources/loadPayloadSite.ts](../src/providers/payload/sources/loadPayloadSite.ts)           | o mesmo para o global `Site`, com `depth: 0`         |
| [cache/getCachedPage.ts](../src/providers/payload/cache/getCachedPage.ts)                   | o `loadPayloadPage` com o `draft` fixo em `false`    |
| [cache/getCachedRedirects.ts](../src/providers/payload/cache/getCachedRedirects.ts)         | o mapa de redirects guardado                         |
| [cache/getCachedSite.ts](../src/providers/payload/cache/getCachedSite.ts)                   | o `loadPayloadSite` guardado                         |
| [cache/tags.ts](../src/providers/payload/cache/tags.ts)                                     | `payload:pages`, `payload:redirects`, `payload:site` |
| [cache/hooks.ts](../src/providers/payload/cache/hooks.ts)                                   | os hooks do Payload que invalidam                    |

O `path` e o `locale` entram na chave por serem argumentos — o `unstable_cache` inclui-os por si, e o `keyParts` serve só de prefixo. Cada idioma tem a sua entrada; o global `Site` tem uma só, partilhada por todas as rotas. Os redirects têm uma por idioma, também partilhada por todas as rotas — é o que torna barato consultá-los antes de cada página.

Não há `revalidate` por tempo. O conteúdo não envelhece sozinho, muda quando o editor o muda.

### O rascunho nunca entra

É a regra que mais importa. O que o editor vê no Live Preview é a versão dele, e guardá-la arriscava servi-la a um visitante anónimo. O `getCachedPage` tem o `draft` fixo em `false`, portanto não há sequer forma de lá chegar um rascunho por engano — quem precisa dele chama o `loadPayloadPage` directamente.

O `unstable_cache` também se desliga sozinho em modo rascunho, mas isso é a segunda linha de defesa, não a primeira.

### O 404 também se guarda

Uma página que não existe fica em cache como `{ status: 'notFound' }` — com a página de erro do CMS lá dentro, se existir alguma. É o que se quer: um 404 repetido não deve custar duas consultas, e publicar a página nova invalida a mesma tag.

### Invalidação

As tags são propositadamente grosseiras — uma para todas as páginas, uma para todos os redirects, outra para o global. Uma tag por página seria mais eficiente mas não é de confiança aqui: o `nestedDocs` reescreve os breadcrumbs dos filhos quando um pai muda de slug, e nesse caminho não há garantia de que o `afterChange` de cada filho dispare. Invalidar a mais custa uma consulta; invalidar a menos serve um URL errado durante horas.

Grosseiras **entre si não são**: os redirects têm tag própria, porque apagar um redirect não tem que deitar fora a cache das páginas.

**Mas a dependência corre num sentido.** Como o destino de um redirect por referência é o URL de uma página, gravar uma página invalida **as duas** tags: mudar o slug de uma página deixaria o mapa a apontar para um URL que já não existe, e a tag dos redirects sozinha nunca o saberia. O contrário não é verdade — gravar um redirect não toca em página nenhuma.

É o preço da referência, e é barato: o mapa de redirects reconstrói-se em duas consultas, uma vez, contra o URL errado servido durante horas.

Duas decisões no [revalidatePayloadTag](../src/providers/payload/cache/revalidatePayloadTag.ts):

- **`{ expire: 0 }` e não `'max'`.** O `'max'` que a documentação do Next recomenda marca como velho e serve o conteúdo antigo enquanto revalida em fundo. Errado para um CMS: quem carrega em publicar veria a página velha à primeira. A forma de um só argumento faria o mesmo que `{ expire: 0 }` mas está depreciada em Next 16.
- **Os hooks também correm fora do Next.** Um script de seed, uma migração ou o CLI do Payload chamam o mesmo `afterChange`, e aí o `revalidateTag` atira por não encontrar contexto de pedido. Nesse caso não há cache para invalidar, portanto engole-se — mas só esse erro, identificado pelo código `E263` e não pela mensagem.

E uma guarda no hook das páginas: **um rascunho de uma página nunca publicada não invalida nada.** Sem isto, o autosave a 375ms invalidava a cache do site inteiro a cada tecla que um editor escrevesse. O `previousDoc` conta tanto como o `doc`, por causa do despublicar — a versão nova é rascunho, mas a antiga estava em cache e tem de sair.

### `unstable_cache` está depreciado

Em Next 16 o `unstable_cache` está declarado como substituído pela directiva `use cache`, que exige `cacheComponents: true`. Esse flag não é uma troca de API: liga o PPR por omissão, muda a navegação para `<Activity>`, e obriga todo o acesso a APIs de runtime a viver dentro de um `<Suspense>` — incluindo o `headers()` do nosso layout de raiz, de onde sai o `<html lang>`, e incluindo o admin do Payload, que partilha o mesmo `app/`. É por isso uma dívida assumida e não uma tarefa por agendar: vale a pena esperar que o Payload 3 declare suporte para `cacheComponents`.

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

O locale por omissão que entra nesse caminho sai do `mapPayloadSite`, e não de uma leitura própria de `enabledLocales[0]`. A regra é dele e resolve sempre — a cópia que aqui esteve desistia com o global por preencher, e o preview desaparecia sem explicação.

O `previewSecret` é **parâmetro** do `getLivePreviewUrl`, não uma leitura de `process.env` lá dentro, e serve de chave de assinatura — não vai no URL (ver [O segredo não viaja](#o-segredo-não-viaja)). A collection detecta a ausência antes de gerar o link, regista `PREVIEW_SECRET is not set` no log do servidor e devolve `undefined` — o preview fica desligado de propósito, não por acidente.

[app/(frontend)/next/preview/route.ts](<../src/app/(frontend)/next/preview/route.ts>) — as guardas antes de activar o `draftMode`, por esta ordem:

1. `PREVIEW_SECRET` tem de estar definido → 503, e a mensagem nomeia a variável
2. `isSafeRedirectPath(path)` — só caminhos relativos à própria origem → 400 (ver [routing.md](routing.md#issaferedirectpath))
3. `verifyPreviewToken(token, path)` → 403
4. `payload.auth({ headers })` tem de devolver um utilizador → 401
5. só então `draftMode().enable()` e redirect

A ordem não é arbitrária: o caminho é validado **antes** do token porque entra no que foi assinado — verificar a assinatura contra um caminho que ainda não se sabe se é seguro seria verificar a coisa errada.

### O segredo não viaja

[utils/previewToken.ts](../src/providers/payload/utils/previewToken.ts)

O `PREVIEW_SECRET` **assina**, não circula. O que vai no URL é um token: `<expiração>.<HMAC-SHA256 de "caminho|expiração">`.

O que isto muda é o valor do que se apanha. Uma query string acaba em três sítios — nos logs de acesso do servidor, do proxy e da CDN, no histórico do browser, e no `src` do iframe dentro do DOM do admin. Antes, o que lá ficava era o segredo de produção, válido para sempre e para o site inteiro, e só rodável à mão. Agora:

- o token está **preso a um caminho**, logo pré-visualiza aquela página e mais nenhuma;
- **expira**, logo uma linha de log da semana passada não vale nada;
- e o segredo em si **nunca sai do servidor**.

Uma nota sobre o que isto **não** resolve: o token continua numa query string, portanto continua nos logs. Não há como evitá-lo com um iframe — o `src` não leva cabeçalhos e não faz `POST`. O que se reduz é o valor do que lá fica.

**O TTL é de uma hora, e o número tem uma razão.** O `url` da collection corre uma vez, quando a vista de edição é renderizada, e o resultado fica no `src` do iframe. Um editor que abra o documento e só carregue no botão de preview vinte minutos depois usa o token do início. Com um TTL de um minuto veria um 403 sem ter feito nada de errado.

Por isso a verificação distingue **expirado** de **inválido**: um link velho responde «Preview link has expired. Reload the admin and try again.», e um link forjado responde «Invalid preview token». Um pede um refresh, o outro não pede nada.

A expiração faz parte do que é assinado, portanto empurrá-la para o futuro invalida a assinatura em vez de estender o token.

[next/exit-preview/route.ts](<../src/app/(frontend)/next/exit-preview/route.ts>) desliga o cookie. Sem passar por aqui, a navegação normal continua a servir rascunhos.

O [PayloadLivePreview.tsx](../src/providers/payload/components/PayloadLivePreview.tsx) é montado pelo [layout.tsx](<../src/app/(frontend)/layout.tsx>), condicionado ao `draftMode`, e chega lá pelo `provider.preview` — o `core` não participa.

O `matcher` do [proxy](../src/proxy.ts) exclui `next/`, portanto as duas rotas de preview não passam por ele. Se essa exclusão desaparecer, o preview deixa de existir sem dizer porquê.

### O que está por verificar contra o admin

A invalidação da cache e o Live Preview estão construídos e testados unitariamente, mas
nunca foram vistos a funcionar ponta a ponta — as duas coisas exigem uma escrita na base
de dados e uma sessão de editor. Vale a mesma nota para os componentes de admin: o
`PageUrl` e o `livePreview.url` têm testes do que fazem, não de como aparecem dentro do
Payload.

O mesmo para o `is404` e a collection `Redirects`: a lógica das duas está testada, mas
marcar uma página como sendo a de erro e criar um redirect no admin exige o mesmo — uma
escrita e uma sessão.

**O `redirects` é uma tabela nova e o `is404` uma coluna nova.** O adaptador de Postgres
empurra as duas no primeiro arranque em desenvolvimento (`pnpm dev`); em produção é
preciso uma migração.

O cenário que fecha isto está no [TODO.md](TODO.md).

### O que confunde

**Em Payload 3 o Live Preview não é um tab.** É um botão de toggle no header do documento, ao lado do Save/Publish.

**Não aparece em documentos novos.** O Payload passa `isLivePreviewEnabled && operation !== 'create'`, e a função `url` só é executada quando `operation !== 'create'`. Grava primeiro.

**Se o `url` devolver `undefined`, o preview desaparece sem erro.** Hoje só há uma causa, e ela deixa rasto: `PREVIEW_SECRET` por definir, com uma linha de erro no log do servidor. O global `Site` sem `enabledLocales` já não desliga nada.

**O `url` corre a cada autosave.** Com `interval: 375` é um `findGlobal` à base de dados a cada 375ms por editor com o painel aberto. A própria documentação do Payload avisa para não pôr operações caras nesta função. Só dói com vários editores em simultâneo; se acontecer, cachear o `defaultLocale` em memória no módulo.
