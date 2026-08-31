# Módulos

Um módulo é um componente de conteúdo identificado por um `alias`. A página não conhece o componente — guarda apenas uma instância com dados:

```ts
{
  id: 'hero-1',
  alias: 'hero',
  data: { title: 'Next Foundation', subtitle: '…' }
}
```

O renderer usa o `alias` para perguntar ao registry quem sabe renderizar aquilo.

## Anatomia

O módulo Hero:

```
src/modules/Hero/
├── Hero.tsx           ← o componente
├── Hero.types.ts      ← os props, derivados do schema
├── Hero.schema.ts     ← validação de runtime
├── Hero.module.ts     ← o registo
├── Hero.style.scss    ← os estilos
└── index.ts
```

O sufixo do ficheiro de estilos é `.style.scss` e não `.module.scss` de propósito: `Hero.module.ts` é a **definição do módulo** deste projecto, e um `Hero.module.scss` ao lado tornaria a palavra «module» ambígua na mesma pasta.

**Schema primeiro.** Ele é a fonte de verdade e o tipo deriva dele, não o contrário:

```ts
// Hero.schema.ts
import { z } from 'zod';

export const heroSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
});
```

```ts
// Hero.types.ts
import { z } from 'zod';

import { heroSchema } from './Hero.schema';

export type HeroProps = z.infer<typeof heroSchema>;
```

Assim o schema e o tipo não podem divergir.

```tsx
// Hero.tsx
import type { HeroProps } from './Hero.types';
import './Hero.style.scss';

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <section>
      <h1>{title}</h1>

      {subtitle && <p>{subtitle}</p>}
    </section>
  );
}
```

```ts
// Hero.module.ts
import { createModuleComponent, defineModule } from '@/core/modules';

import { Hero } from './Hero';
import { heroSchema } from './Hero.schema';

export const heroModule = defineModule({
  alias: 'hero',
  name: 'Hero',
  schema: heroSchema,
  component: createModuleComponent(Hero),
});
```

```ts
// index.ts
export * from './Hero';
export * from './Hero.module';
export * from './Hero.types';
```

## Criar um módulo novo

Quatro passos, nenhum deles toca no renderer.

> Há um gerador para os passos 1 e 2: `pnpm generate`. Faz metade do trabalho e tem arestas conhecidas — ver [O gerador](#o-gerador) no fim deste documento antes de o usares.

**1. Criar a pasta** em `src/modules/<Nome>/` com os ficheiros acima.

**2. Exportar do barrel** [src/modules/index.ts](../src/modules/index.ts):

```ts
export { heroModule } from './Hero';
export { galleryModule } from './Gallery';
```

O `registerModules` registra tudo o que este barrel exportar — não há mais nada a ligar. Exporta o **módulo**, não o componente: o registry itera sobre os valores exportados e espera definições de módulo.

**3. Criar o bloco correspondente no CMS.** No Payload, um `Block` em [providers/payload/blocks/](../src/providers/payload/blocks/) com `slug` igual ao `alias` do módulo:

```ts
export const GalleryBlock: Block = {
  slug: 'gallery',        // === alias do módulo
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  fields: [ … ],
};
```

E adicioná-lo a [blocks/index.ts](../src/providers/payload/blocks/index.ts):

```ts
export const pageBlocks = [HeroBlock, GalleryBlock];
```

**4. `pnpm generate:payload`** para regenerar os tipos.

O `slug` do bloco tem de ser igual ao `alias` do módulo — é essa a única ligação entre o CMS e o frontend. O mapper usa `blockType` como alias, e o registry procura por esse alias. Se não coincidirem, dá `ModuleRenderError` em desenvolvimento.

**5. Opcional: usá-lo numa página de mock.** O `block()` do provider mocks recebe a definição do módulo e verifica o `data` contra o tipo dele, portanto um módulo novo fica utilizável sem nada mais:

```ts
main: [block(galleryModule, { images: [] })];
```

Ver [providers.md](providers.md#escrever-uma-página).

## defineModule e createModuleComponent

```ts
export function defineModule<TProps extends ModuleProps>(module: Module<TProps>): Module<TProps> {
  return module;
}
```

Não faz nada em runtime — existe para a inferência de tipos e para haver um sítio óbvio onde acrescentar comportamento no futuro sem mexer em todos os módulos.

```tsx
export function createModuleComponent<TProps extends ModuleProps>(
  Component: ModuleComponent<TProps>,
): RuntimeModuleComponent {
  return function ModuleComponentAdapter(props: ModuleProps) {
    return <Component {...(props as TProps)} />;
  };
}
```

Adapta um componente tipado (`HeroProps`) ao contrato genérico que o registry guarda (`RuntimeModuleComponent`, que recebe `ModuleProps`). O cast está confinado aqui — é o preço de ter um registry heterogéneo, e é pago num só lugar em vez de espalhado pelos módulos.

É a razão de o `schema` importar: o cast assume que os dados têm a forma certa, e o `parse` no renderer é o que garante que isso é verdade.

## Componentes de servidor

O `Hero.tsx` não tem `'use client'`, logo é um Server Component. Isso é o esperado: o `PageRenderer` corre no servidor e os módulos são renderizados lá.

Um módulo que precise de interactividade marca-se com `'use client'` normalmente. Nesse caso os `data` que recebe têm de ser serializáveis — o que já são, porque vêm de JSON do CMS.

## O gerador

[generator/plopfile.ts](../generator/plopfile.ts) — um gerador Plop.js ligado ao script `pnpm generate`.

```
$ pnpm generate
? Module name: (e.g., Cta Block -> ctaBlock)  Cta
```

Escreve os cinco ficheiros do módulo em `src/modules/Cta/`, mais o `index.ts`, e acrescenta a linha de export a [src/modules/index.ts](../src/modules/index.ts). Os nomes derivam todos da resposta: `PascalCase` para ficheiros e componente, `camelCase` para o alias e o schema.

**Cobre os passos 1 e 2 desta página, não os 3 e 4.** O bloco do Payload — o `<Nome>Block.ts` com `slug` igual ao alias, e a entrada em `pageBlocks` — continua a ser trabalho manual, e é o passo onde a ligação entre o CMS e o frontend se faz. Um módulo gerado e não ligado ao CMS não tem como aparecer numa página.

Três arestas a conhecer antes de o usares:

- **Os templates estão mal formatados**, e o código gerado sai numa linha só. A causa é o `pnpm format` correr Prettier sobre os `.hbs` — o `.prettierignore` não exclui a pasta `generator/`, e o parser de handlebars do Prettier reescreve-os. O código é válido; corre `pnpm format` depois de gerar.
- **O componente gerado ignora os props.** Sai `export function Cta(module: CtaProps)` — o parâmetro chama-se `module`, não é destruturado, e o `<section>` fica vazio. O schema pede um `title` que o componente nunca desenha.
- **Não gera teste**, e o `className` que põe no `<section>` não corresponde a convenção nenhuma do projeto: o `Hero.style.scss` estiliza por elemento, não por classe.

Está registado no [TODO.md](TODO.md).

## Regras

- Adicionar um módulo **nunca** deve exigir alterações ao `PageRenderer` ou ao `ModuleRenderer`.
- Um módulo não importa de `providers/`. Recebe dados via props; não sabe de onde vieram.
- O `PageDefinition` não importa tipos de módulos concretos. Trabalha com `ModuleInstance`.
- Se um módulo precisar de dados que não estão nos seus `data`, o sítio para os obter é o mapper do provider — não o componente.
