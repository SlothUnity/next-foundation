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

O `sass` está declarado como devDependency — o Next compila `.scss` assim que o pacote existe, sem configuração nenhuma. **Não há sistema de tema, e é deliberado**: variáveis, tokens, reset, escalas — a foundation não impõe nenhum, porque isso é decisão de quem monta o site. O que ela garante é o sítio onde os estilos de um módulo vivem e o nome que têm.

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

> **Há um gerador que faz os quatro:** `pnpm generate`. Vale a pena ler os passos à mão uma vez para perceber o que ele escreve e porquê — depois disso, usa o gerador. Ver [O gerador](#o-gerador).

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

**4. `pnpm payload:generate`** para regenerar os tipos.

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

[generator/plopfile.ts](../generator/plopfile.ts), ligado ao script `pnpm generate`.

```
$ pnpm generate
? Module name: (e.g., Cta Block -> ctaBlock)  Cta
```

Ou, sem prompt: `pnpm generate Module Cta`.

**Cobre os quatro passos acima.** Escreve os sete ficheiros do módulo, regista-o no barrel, cria o bloco do Payload e mete-o no `pageBlocks`:

```
src/modules/Cta/
├── Cta.tsx              o componente, já a desenhar o title
├── Cta.schema.ts        z.object({ title: z.string() })
├── Cta.types.ts         z.infer do schema
├── Cta.module.ts        alias 'cta', name 'Cta'
├── Cta.style.scss       .cta { }
├── Cta.test.tsx         renderiza e procura o heading
└── index.ts

src/modules/index.ts                              + export { ctaModule }
src/providers/payload/blocks/CtaBlock.ts          slug 'cta'
src/providers/payload/blocks/index.ts             + CtaBlock em pageBlocks
```

O `alias` do módulo e o `slug` do bloco saem ambos do `camelCase` do nome que deste, por isso **coincidem por construção** — que é o erro mais fácil de cometer à mão e o mais difícil de diagnosticar.

**Falta um passo, e é de propósito:** correr `pnpm payload:generate` a seguir, para os tipos do Payload apanharem o bloco novo. O gerador lembra-te no fim.

### Sem o provider payload, não há bloco

As três acções do Payload só correm **se `src/providers/payload/blocks/index.ts` existir**. Um projecto servido por `api` ou por `mocks` pode ter apagado `src/providers/payload/` inteiro, e nesse caso um bloco não teria onde viver — nem ficheiro, nem `pageBlocks` onde se registar.

Sem ele, o gerador escreve só o módulo e diz-to:

```
-> Provider payload não encontrado — só o módulo foi criado.
   Liga-o à tua origem de conteúdo.
```

Não é um aviso de erro: é a resposta certa nesse projecto. O que muda é onde o `alias` passa a ter de coincidir — no `mapApiPage` do provider api, ou no `block()` de uma página de mock. Ver [providers.md](providers.md).

O que o gerador testa é o `index.ts` e não só a pasta, porque é nele que vivem as duas âncoras `// plop:` — sem elas não há onde registar o bloco.

O que sai é código pronto a correr, não um esqueleto vazio: o `pnpm typecheck`, o `pnpm lint` e o teste gerado passam sem se tocar em nada. A partir daí acrescentas campos ao schema e ao bloco, aos pares.

### As duas coisas invulgares que vais notar

**As âncoras `// plop:` no [blocks/index.ts](../src/providers/payload/blocks/index.ts).**

```ts
import { HeroBlock } from './HeroBlock';
// plop: import

export const pageBlocks = [
  HeroBlock,
  // plop: block
];
```

Este é o único ficheiro que precisa de **duas** inserções — o import e a entrada no array — e um append cego só sabe escrever no fim. As âncoras dizem ao Plop onde pôr cada uma. O `src/modules/index.ts` não precisa delas porque só tem exports, e o fim do ficheiro serve.

**Os templates estão no [.prettierignore](../.prettierignore).** O Prettier tem parser de handlebars e, se lhe deixarem ver um `.hbs`, reescreve-o como se fosse markup — o que destrói a indentação do código que o template gera. Já aconteceu neste repositório: os templates estiveram meses a produzir ficheiros numa linha só. Se um dia o código gerado voltar a sair mal formatado, é aqui que se olha primeiro.

## Regras

- Adicionar um módulo **nunca** deve exigir alterações ao `PageRenderer` ou ao `ModuleRenderer`.
- Um módulo não importa de `providers/`. Recebe dados via props; não sabe de onde vieram.
- O `PageDefinition` não importa tipos de módulos concretos. Trabalha com `ModuleInstance`.
- Se um módulo precisar de dados que não estão nos seus `data`, o sítio para os obter é o mapper do provider — não o componente.

## Partes do contrato ainda por exercitar

O `Hero` só usa campos de texto, portanto há caminhos do código que **nenhum módulo percorreu ainda**. Se fores o primeiro a escrever um destes, conta com ser também o primeiro a encontrar o que lá estiver partido:

| Um módulo com…     | Exercita                                                                       |
| ------------------ | ------------------------------------------------------------------------------ |
| uma relação        | o `depth: 2` da query do Payload — sem ele, a relação chega como um id         |
| um upload de media | a collection `Media` e o único caminho de leitura pública do CMS               |
| uma lista de itens | o `removeNullValues` do mapper a percorrer arrays, e as keys de React na lista |

Não é trabalho pendente da foundation — é o que se descobre ao construir o primeiro site com ela.

## O que a foundation não decide por ti

Duas coisas ficam ao critério de quem escreve o módulo, porque dependem da página onde ele vai cair e a foundation não tem como as adivinhar.

**O nível do título.** O gerador emite `<h2>`, que é o que costuma estar certo: uma página tem um `<h1>` e os módulos vêm abaixo dele. Mas o [Hero.tsx](../src/modules/Hero/Hero.tsx) emite `<h1>` — dois heros na mesma página dariam dois `<h1>`, o que é um erro de estrutura de documento. O `Hero` é um exemplo para provar que o mecanismo funciona, não um modelo a copiar nesse ponto.

Se um projecto precisar de o resolver a sério, o módulo tem de saber a sua posição na página, e isso **altera o contrato dos módulos** — ou o `ModuleRenderer` passa a dar o índice, ou o nível vem de um campo do CMS. É uma decisão do projecto.

**O nome acessível do `<section>`.** Um `<section>` sem nome não conta como landmark para um leitor de ecrã. Dar-lhe um `aria-labelledby` a apontar para o próprio título é o que o torna navegável, e implica gerar um `id` único — outra vez, informação que vive na instância e não no componente.
