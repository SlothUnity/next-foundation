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

O módulo hero, quatro ficheiros:

```
src/modules/hero/
├── Hero.tsx           ← o componente
├── Hero.types.ts      ← os props, derivados do schema
├── Hero.schema.ts     ← validação de runtime
├── Hero.module.ts     ← o registo
└── index.ts
```

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

**1. Criar a pasta** em `src/modules/<nome>/` com os quatro ficheiros acima.

**2. Exportar do barrel** [src/modules/index.ts](../src/modules/index.ts):

```ts
export { heroModule } from './hero';
export { galleryModule } from './gallery';
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

## Regras

- Adicionar um módulo **nunca** deve exigir alterações ao `PageRenderer` ou ao `ModuleRenderer`.
- Um módulo não importa de `providers/`. Recebe dados via props; não sabe de onde vieram.
- O `PageDefinition` não importa tipos de módulos concretos. Trabalha com `ModuleInstance`.
- Se um módulo precisar de dados que não estão nos seus `data`, o sítio para os obter é o mapper do provider — não o componente.
