# Providers

Um provider é um adaptador entre uma fonte de conteúdo e os contratos do `core`. É a única camada que conhece o CMS.

## O contrato

[providers/Provider.types.ts](../src/providers/Provider.types.ts)

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
): Promise<PageDefinition | undefined>;
```

Não significa «desiste», que era o que o `PayloadPageSource` fazia. Quem chama nem sempre sabe que locales a origem serve; a origem sabe sempre. Um locale que ela não conheça continua a dar `undefined` — isso é um pedido a uma página que ali não existe.

A consequência prática está no [routing.md](routing.md): como o default vive no provider e o provider corre no servidor, o `proxy` não precisa de o saber e portanto não reescreve URLs.

## Resolução

[providers/createProvider.ts](../src/providers/createProvider.ts) escolhe pela variável `PROVIDER`:

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

[providers/provider.ts](../src/providers/provider.ts) é o singleton:

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
  async getPage(
    path: string,
    locale?: string,
    options?: GetPageOptions,
  ): Promise<PageDefinition | undefined> {
    // 1. sem locale, resolver o default desta origem
    // 2. validar/normalizar o locale
    // 3. consultar o CMS (usando options?.draft se suportado)
    // 4. devolver undefined se não existir
    // 5. traduzir para PageDefinition
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

## O provider api

[providers/api/](../src/providers/api/) serve conteúdo de uma API HTTP externa, escrita por alguém que não conhece esta estrutura.

O pedido vai a cru — `API_URL` mais o caminho onde estamos — e a resposta, que não se sabe qual é, é traduzida para o contrato interno. São duas costuras, uma por direcção, e são os únicos ficheiros a editar:

| Direcção | Ficheiro                                                            |
| -------- | ------------------------------------------------------------------- |
| Sai      | [createPageRequest.ts](../src/providers/api/createPageRequest.ts)   |
| Entra    | [mappers/mapApiPage.ts](../src/providers/api/mappers/mapApiPage.ts) |

O `createPageRequest` recebe `path`, `locale` e `draft`. O `locale` chega já resolvido — o `ApiPageSource` pergunta o default à sua `SiteSource` quando ninguém o indica — mas a implementação por omissão ainda não o põe no pedido: é uma das costuras por escrever.

O `mapApiPage` está por escrever, e **fica assim**: o formato da resposta é de quem desenhou a API, e um mapper genérico seria um palpite. Arranca com `PROVIDER=api` e o erro do primeiro pedido diz as chaves que a API devolveu.

Não declara `preview`, por isso é — como o `mocks` — um caso de teste do `preview` opcional.

**Documentação completa: [api.md](api.md).**

## O provider mock

[providers/mocks/](../src/providers/mocks/) serve páginas escritas à mão, sem base de dados.

```
mocks/
├── provider.ts
├── index.ts             ← o barrel: a única porta para fora
├── definePage.ts        ← como se escreve uma página
├── mockSite.ts          ← o site e os locales que os mocks servem
├── pages/
│   ├── index.ts         ← a lista do que é servido
│   └── home.ts          ← uma página, em todos os idiomas
└── sources/
    ├── MockPageSource.ts
    └── MockSiteSource.ts
```

Arranca com `PROVIDER=mock pnpm dev`. Serve três propósitos: desenvolver o frontend sem o CMS a correr, ter testes rápidos que não tocam no Payload, e provar que a abstracção funciona — se o mock deixar de conseguir servir o site, a abstracção está a vazar.

Não declara `preview`, por isso é também o caso de teste do `preview` opcional.

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

Depois junta-se a `home` à lista em [pages/index.ts](../src/providers/mocks/pages/index.ts). A lista é escrita à mão, e não varrida do disco: uma página só aparece no site depois de alguém a pôr lá, e é aí que se vê de uma vez o que os mocks servem.

Três decisões que fazem esta forma valer a pena:

**As traduções entram juntas, com o locale por chave.** Acrescentar um idioma é acrescentar uma chave, não criar um ficheiro com um sufixo no nome e lembrar-se de o registar. As duas versões ficam lado a lado, onde se vê logo se uma ficou para trás.

**O `path` vive dentro de cada tradução.** Um slug traduz-se como qualquer outro conteúdo: `sobre-nos` em português é `about-us` em inglês. Ao lado das traduções, ficarias preso ao mesmo caminho nos dois idiomas.

**O `block()` recebe a definição do módulo, não o alias em texto.** É a diferença entre um erro de escrita rebentar no editor e rebentar em runtime como «Module "heor" is not registered» — e dá autocomplete ao `data`, verificado contra o tipo desse módulo.

O que o compilador passa a apanhar: uma chave de locale que não existe (`mockLocales` é um tuplo `as const`, como o `availableLocales` do provider payload), um `path` esquecido, um campo mal escrito no `data`, e um `locale` escrito na `meta` — esse já é a chave, e não se escreve duas vezes.

Os `id` das `ModuleInstance` são derivados do alias e da posição (`hero-1`, `hero-2`) em vez de escritos à mão: o `ModuleRenderer` exige-os únicos dentro da página, e dois `hero-1` colados por copy-paste davam uma key repetida em React, que falha em silêncio.
