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

## Resolução

[providers/createProvider.ts](../src/providers/createProvider.ts) escolhe pela variável `PROVIDER`:

```ts
export function createProvider(): Provider {
  const name = process.env.PROVIDER ?? 'payload';

  switch (name) {
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

Nota: os bundles são `const` de módulo, logo **ambos** são instanciados quando o `createProvider` é importado. Hoje é irrelevante — os sources não guardam estado e o `getPayload({ config })` memoiza internamente. Se um provider passar a abrir conexões no construtor, converte-os em factories (`createPayloadProvider()`) chamadas dentro do `case`.

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
    // 1. validar/normalizar o locale
    // 2. consultar o CMS (usando options?.draft se suportado)
    // 3. devolver undefined se não existir
    // 4. traduzir para PageDefinition
  }
}
```

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

## O provider mock

[providers/mocks/](../src/providers/mocks/) serve dados de fixtures, sem base de dados:

```
mocks/
├── provider.ts
├── MockPageSource.ts + MockPageSource.test.ts
├── MockSiteSource.ts
├── homePage.ts        ← PageDefinition da homepage
└── siteSettings.ts    ← SiteDefinition
```

Arranca com `PROVIDER=mock pnpm dev`. Serve três propósitos: desenvolver o frontend sem o CMS a correr, ter testes rápidos que não tocam no Payload, e provar que a abstracção funciona — se o mock deixar de conseguir servir o site, a abstracção está a vazar.

Não declara `preview`, por isso é também o caso de teste do `preview` opcional.
