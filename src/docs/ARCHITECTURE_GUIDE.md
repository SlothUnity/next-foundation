# Architecture Guide

## 1. O que estamos a construir

Este projeto é uma pequena foundation para aplicações Next.js orientadas a conteúdo.

A ideia principal é separar três problemas que normalmente acabam misturados:

1. **Obter conteúdo**
2. **Interpretar esse conteúdo**
3. **Renderizar esse conteúdo**

O conteúdo pode vir de diferentes fontes:

- mock;
- Payload;
- outro CMS;
- API;
- eventualmente uma fonte própria.

Mas a aplicação não deve precisar de saber de onde veio a página.

Da mesma forma, uma página não deve precisar de saber como um módulo React é implementado.

A arquitetura cria contratos entre estas partes.

```text
                 ┌──────────────────┐
                 │     Next.js      │
                 │     App Router   │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │    Foundation    │
                 └───────┬───┬──────┘
                         │   │
               ┌─────────┘   └──────────┐
               ▼                        ▼
        ┌──────────────┐         ┌──────────────┐
        │  PageSource  │         │ ModuleRegistry│
        └──────┬───────┘         └───────┬──────┘
               │                         │
               ▼                         ▼
        ┌──────────────┐         ┌──────────────┐
        │ CMS / Mock   │         │   Modules    │
        └──────┬───────┘         └──────────────┘
               │
               ▼
        ┌──────────────┐
        │PageDefinition│
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │ PageRenderer │
        └──────┬───────┘
               │
               ▼
        ┌───────────────┐
        │ModuleRenderer │
        └───────┬───────┘
                │
                ▼
          React Component
```

O objetivo não é criar abstrações por criar.

Cada camada existe porque resolve um problema diferente.

---

# 2. A regra mais importante: separar dados de implementação

Uma página proveniente de um CMS pode dizer:

```ts
{
  id: 'hero-1',
  alias: 'hero',
  data: {
    title: 'Next Foundation',
    subtitle: 'Primeiro render'
  }
}
```

A página não contém:

```tsx
<Hero title="Next Foundation" />
```

Isto é importante.

O CMS conhece **dados**.

O frontend conhece **componentes**.

O alias é a ponte entre os dois.

```text
CMS
 │
 │ alias = "hero"
 ▼
ModuleRegistry
 │
 │ encontra
 ▼
Hero component
```

Desta forma, o CMS não fica acoplado ao React.

---

# 3. Porque existe `PageDefinition`

`PageDefinition` é o contrato interno de uma página.

```ts
export interface PageDefinition {
  meta: Meta;
  navigation?: ModuleInstance;
  main: ModuleInstance[];
  footer?: ModuleInstance;
}
```

Este tipo é extremamente importante.

Ele representa a página **depois de sair da fonte de conteúdo e antes de ser renderizada**.

Podemos pensar nele como o formato normalizado da aplicação.

```text
Payload
   │
   ▼
dados Payload
   │
   ▼
transformação
   │
   ▼
PageDefinition
   │
   ▼
React
```

## Porque não usamos diretamente o formato do CMS?

Porque isso criaria acoplamento.

Imagina que o Payload devolve:

```ts
{
  layout: {
    regions: {
      content: [...]
    }
  }
}
```

Se o `PageRenderer` começar a trabalhar diretamente com isto, o renderer passa a depender do Payload.

Depois decidimos trocar Payload por outro CMS.

Teríamos de alterar:

- PageRenderer;
- ModuleRenderer;
- testes;
- tipos;
- lógica da aplicação.

Em vez disso:

```text
Payload format
      ↓
Payload adapter
      ↓
PageDefinition
      ↓
rendering
```

Só o adapter conhece o formato do Payload.

---

# 4. Porque não usamos `regions`

Uma decisão deliberada é não fazer:

```ts
interface PageDefinition {
  regions: Record<string, ModuleInstance[]>;
}
```

Embora pareça mais genérico, isso remove significado do contrato.

Com:

```ts
navigation?: ModuleInstance;
main: ModuleInstance[];
footer?: ModuleInstance;
```

sabemos imediatamente o que cada coisa representa.

Além disso, `navigation` e `footer` são opcionais porque nem todas as páginas precisam deles.

O `main` é obrigatório porque representa o conteúdo principal da página.

No futuro, se existir uma necessidade real de outro tipo de estrutura, podemos alterar o contrato conscientemente.

Não devemos tornar a arquitetura genérica antecipadamente.

---

# 5. `ModuleInstance`: dados de uma ocorrência de módulo

Uma definição de módulo e uma instância de módulo são coisas diferentes.

## Definição

A definição diz:

> "Existe um módulo chamado hero e este é o componente que o implementa."

Por exemplo:

```ts
{
  alias: 'hero',
  name: 'Hero',
  component: Hero,
  schema: heroSchema
}
```

## Instância

A instância diz:

> "Nesta página existe uma ocorrência do módulo hero com estes dados."

```ts
{
  id: 'hero-1',
  alias: 'hero',
  data: {
    title: 'Next Foundation'
  }
}
```

Isto permite ter várias instâncias do mesmo módulo.

```text
hero-1 → Hero → "Homepage"
hero-2 → Hero → "About us"
hero-3 → Hero → "Contact"
```

O componente é o mesmo.

Os dados são diferentes.

---

# 6. Porque existe `alias`

O alias é o identificador estável do módulo.

Exemplo:

```ts
alias: 'hero';
```

A página não precisa de saber:

```ts
import { Hero } from '@/modules/hero';
```

Nem precisa de saber onde o componente está.

Ela só diz:

```ts
alias: 'hero';
```

O registry resolve o resto.

Isto é semelhante a um sistema de plugins.

```text
"hero"
   ↓
registry
   ↓
Hero definition
   ↓
Hero component
```

A grande vantagem é que o conteúdo pode referenciar módulos sem conhecer código.

---

# 7. `ModuleProps`

Temos:

```ts
export type ModuleProps = Record<string, unknown>;
```

Este é o contrato genérico da infraestrutura.

Não significa que todos os componentes tenham props desconhecidos.

Significa apenas que a infraestrutura trabalha com módulos genéricos.

Um módulo concreto pode ter:

```ts
interface HeroProps {
  title: string;
  subtitle?: string;
}
```

Enquanto outro pode ter:

```ts
interface GalleryProps {
  images: string[];
}
```

A infraestrutura não precisa de conhecer esses tipos concretos.

---

# 8. Porque precisamos de TypeScript e validação runtime

TypeScript não existe em runtime.

Isto:

```ts
interface HeroProps {
  title: string;
}
```

desaparece quando o código é executado.

Se o CMS devolver:

```json
{
  "subtitle": "hello"
}
```

o TypeScript não vai impedir isso.

É por isso que existe o schema.

Por exemplo:

```ts
const heroSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
});
```

Agora temos duas proteções diferentes.

```text
TypeScript
    │
    │ desenvolvimento
    ▼
garante tipos no código


Zod
    │
    │ runtime
    ▼
valida dados reais
```

São problemas diferentes.

---

# 9. `ModuleSchema`

A foundation não deve ficar dependente diretamente do Zod.

Por isso temos:

```ts
export interface ModuleSchema<TData extends ModuleProps = ModuleProps> {
  parse(data: unknown): TData;
}
```

A foundation só precisa de saber:

> "Tenho um objecto que recebe dados desconhecidos e devolve dados validados."

Não precisa de saber se por baixo é:

- Zod;
- Valibot;
- Yup;
- outro sistema;
- implementação própria.

Atualmente usamos Zod porque é uma boa solução para validação runtime.

Mas o contrato da Foundation é nosso.

---

# 10. O que acontece quando um módulo é definido

Um módulo pode ser definido assim:

```ts
export const hero = defineModule({
  alias: 'hero',
  name: 'Hero',
  component: createModuleComponent(Hero),
  schema: heroSchema,
});
```

O `defineModule` atualmente é simples:

```ts
export function defineModule(module: Module): Module {
  return module;
}
```

Pode parecer inútil.

Mas existe uma razão.

É um ponto semântico para a criação de módulos.

Em vez de termos uma API baseada em detalhes internos, temos:

```ts
defineModule(...)
```

Se no futuro precisarmos de:

- validação;
- normalização;
- defaults;
- metadata;
- development checks;

podemos fazê-lo nesse ponto sem alterar todos os módulos.

---

# 11. `createModuleComponent`

Existe outra fronteira importante:

```ts
createModuleComponent(...)
```

Um componente concreto pode ter props específicas.

Por exemplo:

```ts
interface HeroProps {
  title: string;
  subtitle?: string;
}
```

O componente trabalha com:

```tsx
function Hero(props: HeroProps) {
  ...
}
```

A infraestrutura, por outro lado, trabalha com módulos genéricos.

O adapter faz a ponte.

```text
Module infrastructure
       │
       │ ModuleProps
       ▼
adapter
       │
       │ HeroProps
       ▼
Hero component
```

Isto mantém os detalhes específicos do componente fora da infraestrutura.

---

# 12. `ModuleRegistry`

O registry é responsável por guardar definições de módulos.

Conceptualmente:

```ts
Map<string, Module>;
```

Mas temos uma abstração `Registry` porque esta lógica pode ser reutilizada.

O `ModuleRegistry` adiciona conhecimento específico:

```ts
alias → Module
```

Por exemplo:

```text
hero     → Hero
gallery  → Gallery
cta      → CTA
article  → Article
```

---

# 13. Porque o renderer não importa módulos diretamente

Uma implementação simples poderia fazer:

```ts
import Hero from '@/modules/hero';
import Gallery from '@/modules/gallery';

switch (module.alias) {
  case 'hero':
    return <Hero />;
  case 'gallery':
    return <Gallery />;
}
```

Não queremos isso.

Porque cada módulo novo obrigaria a alterar o renderer.

Isso viola uma propriedade importante da arquitetura:

> adicionar um módulo não deve exigir alterar o sistema de rendering.

Em vez disso:

```text
module
   ↓
register
   ↓
registry
   ↓
renderer
```

O renderer não precisa saber quais módulos existem.

---

# 14. Registo automático dos módulos

Temos:

```ts
import * as modules from '@/modules';
```

e:

```ts
Object.values(modules).forEach((module) => {
  foundation.modules.register(module);
});
```

A vantagem é que o setup da Foundation fica independente da lista concreta.

A responsabilidade é:

```text
modules/
    ↓
exports
    ↓
registerModules()
    ↓
ModuleRegistry
```

Quando adicionamos um módulo, o objetivo é que o sistema o consiga registar sem alterar o renderer.

---

# 15. `Foundation`

A Foundation junta as dependências principais:

```ts
export interface Foundation {
  modules: ModuleRegistry;
  page: PageSource;
}
```

Isto é uma espécie de container muito simples.

A aplicação recebe uma Foundation e encontra os serviços de que precisa.

```text
Foundation
 ├── modules
 └── page
```

Isto evita espalhar criação de dependências pelo projeto.

Em vez de:

```ts
new ModuleRegistry()
new PayloadPageSource()
new ...
```

em vários locais, existe um ponto central.

---

# 16. Porque `Foundation` não é simplesmente um singleton global

É tentador fazer:

```ts
export const foundation = ...
```

e usar globalmente.

Pode funcionar, mas cria problemas de:

- testes;
- estado partilhado;
- configuração;
- múltiplas instâncias;
- dependências escondidas.

A criação através de:

```ts
createFoundation();
```

torna as dependências explícitas.

Podemos criar uma Foundation diferente num teste.

Podemos substituir `PageSource`.

Podemos configurar ambientes diferentes.

---

# 17. `PageSource`

`PageSource` é uma abstração:

```ts
export abstract class PageSource {
  abstract getPage(slug: string, locale?: string): Promise<PageDefinition | undefined>;
}
```

A pergunta que esta classe responde é apenas:

> "Dado este slug e locale, existe uma página?"

Não responde:

> "Como renderizo a página?"

Nem:

> "Como faço o 404?"

Nem:

> "Como funciona o Payload?"

---

# 18. Porque `PageSource` devolve `undefined`

Uma página inexistente não é necessariamente um erro técnico.

É um resultado válido da pesquisa.

```text
GET /about
    ↓
PageSource
    ↓
página encontrada
```

ou:

```text
GET /does-not-exist
    ↓
PageSource
    ↓
undefined
```

Depois a aplicação decide:

```ts
if (!page) {
  notFound();
}
```

Isto é importante porque `PageSource` pertence ao core e não deve conhecer Next.js.

---

# 19. Porque `notFound()` não está no PageSource

`notFound()` é específico do Next.js.

Se fizéssemos:

```ts
class PayloadPageSource {
  async getPage() {
    ...
    notFound();
  }
}
```

estaríamos a acoplar a infraestrutura de conteúdo ao framework.

Isso impediria facilmente:

- testes simples;
- utilização fora do Next;
- outra aplicação React;
- API;
- outro framework.

Em vez disso:

```text
PageSource
   ↓
undefined
   ↓
Next.js
   ↓
notFound()
```

Cada camada trata o que lhe pertence.

---

# 20. `MockPageSource`

O `MockPageSource` existe para desenvolver a Foundation sem depender do CMS.

Ele implementa:

```ts
class MockPageSource extends PageSource
```

e devolve dados locais.

Isto permite desenvolver:

```text
Renderer
Modules
Schemas
Routing
Tests
```

antes de integrar Payload.

Mais importante:

o resto da aplicação não precisa de saber se está a falar com:

```text
MockPageSource
```

ou:

```text
PayloadPageSource
```

porque ambos respeitam o mesmo contrato.

---

# 21. O futuro `PayloadPageSource`

Quando integrarmos Payload, a ideia será:

```text
PayloadPageSource
        │
        ▼
Payload API
        │
        ▼
Payload document
        │
        ▼
adapter / mapper
        │
        ▼
PageDefinition
```

O renderer continuará a receber exatamente:

```ts
PageDefinition;
```

Isto é uma das decisões mais importantes do projeto.

Payload é uma implementação da origem dos dados, não a arquitetura da aplicação.

---

# 22. `PageRenderer`

O `PageRenderer` recebe:

```ts
{
  (page, foundation);
}
```

A sua responsabilidade é estrutural.

Ele sabe que uma página possui:

```text
navigation
main
footer
```

Mas não sabe o que é:

```text
Hero
Gallery
CTA
```

Isso é responsabilidade do `ModuleRenderer`.

---

# 23. Porque temos dois renderers

Poderíamos colocar tudo num único componente.

Mas estaríamos a misturar duas responsabilidades.

`PageRenderer` responde:

> "Onde os módulos são colocados?"

`ModuleRenderer` responde:

> "Como resolvo e renderizo este módulo?"

São perguntas diferentes.

```text
PageRenderer
    │
    ├── navigation
    ├── main
    └── footer
             │
             ▼
      ModuleRenderer
             │
             ├── registry
             ├── schema
             ├── errors
             └── component
```

---

# 24. Fluxo completo do rendering

Quando fazemos:

```tsx
<PageRenderer page={page} foundation={foundation} />
```

acontece:

```text
PageRenderer
     │
     ▼
page.main
     │
     ▼
ModuleInstance
     │
     │ alias = "hero"
     ▼
ModuleRenderer
     │
     ▼
ModuleRegistry
     │
     ▼
Hero definition
     │
     ▼
heroSchema.parse(data)
     │
     ▼
validated data
     │
     ▼
Hero component
     │
     ▼
React output
```

---

# 25. O que acontece quando o alias não existe

Imagine que o CMS devolve:

```ts
{
  alias: 'video',
  data: {}
}
```

mas `video` não foi registado.

O registry devolve:

```ts
undefined;
```

O `ModuleRenderer` sabe que não consegue renderizar.

Em desenvolvimento queremos saber imediatamente:

```text
Module "video" is not registered.
```

Por isso lançamos:

```ts
ModuleRenderError;
```

Em produção não queremos necessariamente destruir a página inteira por causa de um módulo.

Por isso existe o fallback.

---

# 26. Porque existe `ModuleErrorFallback`

Um CMS pode conter conteúdo inválido.

Por exemplo:

```text
Página
 ├── Hero       ✓
 ├── Gallery    ✓
 ├── Video      ✗
 └── CTA        ✓
```

Uma estratégia seria:

```text
Video falhou
↓
página inteira falha
```

Outra é:

```text
Video falhou
↓
fallback
↓
resto da página continua
```

A segunda é geralmente mais adequada para sistemas de conteúdo.

Em desenvolvimento, queremos informação detalhada.

Em produção, queremos degradação controlada.

---

# 27. Desenvolvimento vs produção

A arquitetura assume comportamentos diferentes.

## Development

Queremos falhar cedo.

Exemplo:

```text
schema inválido
      ↓
throw ModuleValidationError
```

Isto permite descobrir problemas durante desenvolvimento.

## Production

Queremos evitar que um erro isolado destrua a experiência inteira.

```text
schema inválido
      ↓
fallback
```

Isto é particularmente importante quando o conteúdo vem de uma fonte externa.

---

# 28. Porque os erros são classes próprias

Temos erros como:

```ts
ModuleRenderError;
ModuleValidationError;
```

Poderíamos simplesmente fazer:

```ts
throw new Error(...)
```

Mas tipos de erro específicos permitem distinguir problemas.

Por exemplo:

```text
ModuleRenderError
    → módulo não registado

ModuleValidationError
    → dados inválidos

PageSourceError
    → problema ao obter conteúdo
```

No futuro isto permite logging, monitoring e tratamento específico.

---

# 29. `ModuleErrorFallback` em produção

O fallback pode não renderizar conteúdo visível:

```ts
return null;
```

Isto é uma decisão deliberada.

Em desenvolvimento:

```text
Module Error
Failed to load module: video
```

Em produção:

```text
[nada]
```

Podemos posteriormente substituir isto por:

- placeholder;
- componente visual;
- logging;
- monitoring;
- mensagem genérica.

Mas a existência do fallback mantém a decisão localizada.

---

# 30. Routing

A camada Next.js é responsável pelo routing.

Conceptualmente:

```ts
export default async function Page({
  params,
}) {
  const page = await foundation.page.getPage(params.slug);

  if (!page) {
    notFound();
  }

  return (
    <PageRenderer
      page={page}
      foundation={foundation}
    />
  );
}
```

O fluxo é:

```text
URL
 ↓
Next.js route
 ↓
slug
 ↓
PageSource
 ↓
PageDefinition?
 ↓
não existe → notFound()
 ↓
existe
 ↓
PageRenderer
```

---

# 31. Porque a URL não está no `MockPageSource`

O `MockPageSource` não deve assumir:

```ts
if (slug === '/') {
  return homePage;
}
```

como arquitetura definitiva.

Isso seria apenas uma particularidade do mock.

O contrato é:

```ts
getPage(slug, locale);
```

A implementação deve responder com base nos dados que possui.

O CMS real fará algo como:

```text
slug
 ↓
query
 ↓
documento
```

O mock deve simular essa ideia, não criar uma regra especial para `/`.

---

# 32. O CMS como serviço de conteúdo

A aplicação deve pensar:

> "Preciso da página deste slug."

Não:

> "Preciso consultar Payload."

Essa diferença parece pequena, mas é fundamental.

```text
Aplicação
    │
    ▼
PageSource
    │
    ├── Mock
    ├── Payload
    ├── API
    └── outro CMS
```

A aplicação não muda.

Só a implementação muda.

---

# 33. Porque não queremos saber antecipadamente quais módulos existem

Este ponto é especialmente importante.

A Foundation não deve ter:

```ts
if (module.alias === 'hero') ...
if (module.alias === 'gallery') ...
if (module.alias === 'cta') ...
```

Nem:

```ts
type KnownModules = 'hero' | 'gallery' | 'cta';
```

Isso criaria uma lista central de módulos.

Mas os módulos são extensíveis.

Um projeto pode ter:

```text
Hero
Gallery
CTA
```

Outro pode ter:

```text
Navbar
ProductGrid
Pricing
Testimonials
```

Outro pode nem ter Hero.

O renderer só precisa saber:

```text
alias → registry
```

---

# 34. O sistema funciona como um plugin registry

Podemos pensar nos módulos como plugins.

```text
Foundation
    │
    ▼
ModuleRegistry
    │
    ├── hero
    ├── gallery
    ├── product-grid
    ├── pricing
    └── ...
```

O renderer não conhece a lista.

Ele apenas pergunta:

```ts
getByAlias(alias);
```

Isto torna a arquitetura extensível.

---

# 35. Onde entra o React

React só aparece na parte de rendering.

O fluxo de dados é:

```text
CMS
 ↓
plain data
 ↓
PageDefinition
 ↓
ModuleInstance
 ↓
Module definition
 ↓
React component
```

O CMS não precisa de importar React.

O `PageSource` não precisa de importar React.

O `PageDefinition` não precisa de importar React.

O renderer é onde o dado encontra o componente.

Esta separação torna o sistema mais previsível.

---

# 36. Porque os tipos de domínio ficam separados dos componentes

Temos estruturas como:

```text
types/
  core/
    components/
    definitions/
```

Isto representa uma separação conceptual.

Por exemplo:

```text
ModuleComponent
```

é um contrato de componente.

Enquanto:

```text
Module
```

é uma definição de domínio/runtime.

A ideia é evitar que todos os tipos do projeto acabem dentro dos componentes React.

---

# 37. Porque não colocamos tudo numa única pasta

A estrutura procura refletir responsabilidades:

```text
src/
├── app/
├── core/
│   ├── errors/
│   ├── foundation/
│   ├── pages/
│   ├── registry/
│   ├── renderer/
│   └── setup/
├── modules/
├── mocks/
└── types/
```

Não é uma regra estética.

A estrutura ajuda a responder:

> "Onde devo procurar esta responsabilidade?"

Exemplos:

```text
Como obtenho uma página?
→ core/pages

Como encontro um módulo?
→ core/registry

Como renderizo uma página?
→ core/renderer

Como defino um módulo?
→ modules

Que contrato tem uma página?
→ types
```

---

# 38. Testes

Os testes não servem apenas para confirmar que o código funciona.

Servem também para documentar os contratos.

Por exemplo, um teste do `ModuleRegistry` demonstra:

```text
register
   ↓
getByAlias
   ↓
mesmo módulo
```

Um teste do `ModuleRenderer` demonstra:

```text
alias válido
   ↓
schema
   ↓
component
```

Outro demonstra:

```text
alias inválido
   ↓
development
   ↓
throw
```

Outro:

```text
alias inválido
   ↓
production
   ↓
fallback
```

Os testes tornam as decisões arquiteturais executáveis.

---

# 39. Porque isolamos os testes

Os testes de renderer podem alterar:

```ts
process.env.NODE_ENV;
```

ou registar módulos.

Se o estado for partilhado, um teste pode influenciar outro.

Por isso os testes devem:

- criar as suas próprias Foundation;
- criar os seus próprios registries;
- limpar mocks;
- restaurar environment;
- não depender da ordem de execução.

Um teste deve funcionar isoladamente.

---

# 40. Exemplo completo

Imaginemos que o CMS devolve:

```ts
{
  meta: {
    locale: 'pt-PT'
  },
  main: [
    {
      id: 'hero-1',
      alias: 'hero',
      data: {
        title: 'Olá',
        subtitle: 'Foundation'
      }
    }
  ]
}
```

## Passo 1 — PageSource

```text
CMS
 ↓
PageSource
 ↓
PageDefinition
```

## Passo 2 — Next.js

```text
PageDefinition
 ↓
PageRenderer
```

## Passo 3 — PageRenderer

```text
main[0]
 ↓
ModuleRenderer
```

## Passo 4 — ModuleRenderer

```text
alias = "hero"
 ↓
ModuleRegistry
 ↓
Hero definition
```

## Passo 5 — schema

```text
data
 ↓
heroSchema.parse()
 ↓
{
  title: "Olá",
  subtitle: "Foundation"
}
```

## Passo 6 — React

```tsx
<Hero title="Olá" subtitle="Foundation" />
```

O resultado final é UI.

---

# 41. Exemplo com módulo inexistente

CMS:

```ts
{
  alias: 'video-player',
  data: {}
}
```

Registry:

```text
video-player
 ↓
undefined
```

Development:

```text
ModuleRenderError
```

Production:

```text
ModuleErrorFallback
```

A página pode continuar a renderizar os restantes módulos.

---

# 42. Exemplo com dados inválidos

CMS:

```ts
{
  alias: 'hero',
  data: {
    subtitle: 'hello'
  }
}
```

Schema:

```ts
title: z.string();
```

Resultado:

```text
schema.parse()
 ↓
ZodError
 ↓
ModuleValidationError
```

Em desenvolvimento o erro é visível imediatamente.

Isto impede que um componente receba dados que não respeitam o seu contrato.

---

# 43. O princípio de dependência

Uma forma simples de perceber a arquitetura é olhar para a direção das dependências.

Queremos aproximadamente:

```text
Application
    ↓
Foundation
    ↓
Contracts
```

e:

```text
Infrastructure
    ↓
Contracts
```

Não queremos:

```text
PageDefinition
    ↓
Payload
```

nem:

```text
PageSource
    ↓
Next.js
```

nem:

```text
ModuleRenderer
    ↓
Hero
```

A infraestrutura implementa contratos.

O renderer consome contratos.

Os adapters convertem formatos externos para contratos internos.

---

# 44. A arquitetura em uma frase

A arquitetura pode ser resumida assim:

> **As fontes externas fornecem dados, os adapters transformam esses dados num contrato interno estável, a Foundation disponibiliza os serviços, o registry resolve módulos por alias e os renderers transformam os dados validados em React.**

---

# 45. O que acontece quando adicionamos Payload

Não queremos alterar:

```text
PageRenderer
ModuleRenderer
ModuleRegistry
ModuleDefinition
PageDefinition
ModuleInstance
```

Queremos adicionar:

```text
PayloadPageSource
```

e talvez:

```text
Payload mapper
```

O fluxo passa de:

```text
MockPageSource
     ↓
PageDefinition
```

para:

```text
PayloadPageSource
     ↓
Payload
     ↓
mapper
     ↓
PageDefinition
```

O resto permanece igual.

Esta é uma das principais razões para termos criado `PageSource`.

---

# 46. O que acontece quando adicionamos um módulo

Suponhamos que amanhã aparece:

```text
ProductGrid
```

Devemos precisar de:

```text
1. criar ProductGrid
2. criar ProductGrid.schema
3. definir módulo
4. exportar módulo
```

O renderer não deve ser alterado.

Não devemos adicionar:

```ts
case 'product-grid':
```

em nenhum renderer.

O registry deve resolver automaticamente:

```text
product-grid
      ↓
ProductGrid definition
```

---

# 47. O que acontece quando um projeto não tem Hero

Nada.

O sistema não depende do Hero.

Uma página pode ser:

```ts
{
  meta: {...},
  main: [
    {
      id: 'gallery-1',
      alias: 'gallery',
      data: {...}
    }
  ]
}
```

Se `gallery` estiver registado, funciona.

Não interessa que `hero` nunca tenha existido nesse projeto.

Isto é exatamente o comportamento que queremos de uma Foundation reutilizável.

---

# 48. O que não devemos fazer

Evitar:

```ts
if (alias === 'hero')
```

Evitar:

```ts
switch (alias)
```

no renderer.

Evitar importar Payload diretamente no renderer.

Evitar chamar `notFound()` dentro do `PageSource`.

Evitar fazer `PageDefinition` igual ao documento do CMS.

Evitar colocar uma lista fixa de módulos no core.

Evitar assumir que todas as páginas têm Hero.

Evitar usar `unknown` e fazer casts indiscriminadamente depois de passar pelo schema.

Evitar adicionar abstrações genéricas sem uma necessidade real.

---

# 49. O que devemos fazer

Preferir:

```text
CMS
 ↓
adapter
 ↓
PageDefinition
 ↓
PageRenderer
 ↓
ModuleRenderer
 ↓
registry
 ↓
schema
 ↓
component
```

Cada camada deve ter uma responsabilidade clara.

Quando surgir um problema, a primeira pergunta deve ser:

> "Em que camada este problema pertence?"

Exemplos:

| Problema                     | Camada                          |
| ---------------------------- | ------------------------------- |
| Payload mudou o formato      | Payload adapter                 |
| Página não existe            | PageSource → aplicação          |
| Alias não existe             | ModuleRegistry / ModuleRenderer |
| Dados do Hero inválidos      | ModuleSchema                    |
| Componente Hero tem bug      | Hero module                     |
| Layout da página está errado | PageRenderer                    |
| UI de erro de módulo         | ModuleErrorFallback             |
| Novo módulo                  | `modules/` + registry           |
| Novo CMS                     | novo `PageSource`               |

---

# 50. Modelo mental final

Se fores novo no projeto, pensa nestas cinco perguntas:

### 1. De onde vem a página?

`PageSource`

### 2. Qual é o formato que o frontend entende?

`PageDefinition`

### 3. Que módulos existem?

`ModuleRegistry`

### 4. Como sabemos que os dados são válidos?

`ModuleSchema`

### 5. Como transformamos os dados em UI?

`PageRenderer` → `ModuleRenderer` → React component

E o fluxo completo é:

```text
                    EXTERNAL WORLD
                          │
                  ┌───────▼───────┐
                  │ CMS / Payload │
                  │     / Mock    │
                  └───────┬───────┘
                          │
                          ▼
                    PageSource
                          │
                          ▼
                   PageDefinition
                          │
                          ▼
                    PageRenderer
                          │
                          ▼
                   ModuleInstance
                          │
                          ▼
                  ModuleRegistry
                          │
                          ▼
                  Module Definition
                          │
                    ┌─────┴─────┐
                    │           │
                  Schema      Component
                    │           │
                    ▼           ▼
                validated     React
                   data         UI
```

Se alguém compreender este fluxo, compreende a arquitetura fundamental do projeto.

---

# 51. A razão de toda a arquitetura

No fundo, estamos a tentar garantir quatro propriedades:

## Extensibilidade

Podemos adicionar módulos sem modificar o renderer.

## Substituibilidade

Podemos trocar Mock por Payload sem modificar o renderer.

## Isolamento

Um problema num módulo não precisa de destruir toda a página.

## Previsibilidade

Os dados externos passam por contratos e validação antes de chegarem aos componentes.

Estas quatro propriedades são mais importantes do que qualquer classe ou ficheiro individual.

A arquitetura não existe para tornar o projeto "mais complexo".

Existe para garantir que, quando o projeto crescer, as alterações continuem localizadas.

```text
Novo CMS
   → PageSource

Novo módulo
   → modules/

Nova validação
   → schema

Novo comportamento de erro
   → renderer/fallback

Novo layout de página
   → PageDefinition + PageRenderer
```

A regra fundamental é:

> **uma alteração deve afetar o menor número possível de camadas.**
