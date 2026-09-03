# Renderer

Duas responsabilidades separadas: o `PageRenderer` organiza a página, o `ModuleRenderer` resolve um módulo. Nenhum dos dois conhece módulos concretos ou o CMS.

## PageRenderer

[core/renderer/PageRenderer.tsx](../src/core/renderer/PageRenderer.tsx)

```ts
interface PageRendererProps {
  page: PageDefinition;
  foundation: Foundation;
}
```

Organiza as três regiões e delega tudo o resto:

```tsx
<>
  {page.navigation && (
    <nav>
      <ModuleRenderer module={page.navigation} foundation={foundation} />
    </nav>
  )}

  <main>
    {page.main.map((module) => (
      <Fragment key={module.id}>
        <ModuleRenderer module={module} foundation={foundation} />
      </Fragment>
    ))}
  </main>

  {page.footer && (
    <footer>
      <ModuleRenderer module={page.footer} foundation={foundation} />
    </footer>
  )}
</>
```

O `Fragment` evita um wrapper no DOM. A chave é o `module.id`, que pertence à instância e vem do CMS — não o índice, para que reordenar blocos no admin não force React a recriar a árvore toda.

**Os landmarks são do renderer, não dos módulos.** O `<nav>`, o `<main>` e o `<footer>` são emitidos aqui, sempre, independentemente do módulo que lá caia. Quem escrever um módulo de navegação **não** deve trazer o seu próprio `<nav>` — sairiam dois, aninhados.

Isto é o que a foundation garante e o projecto não pode desfazer: o conteúdo das três regiões é livre, a estrutura não.

O `<main>` leva um `id`, e ele vem de [landmarks.ts](../src/core/renderer/landmarks.ts) e não de uma string escrita aqui. A razão é o skip link: ele vive na camada `app` ([SkipToContent](<../src/app/(frontend)/_components/SkipToContent.tsx>)) e tem de apontar para um id que o `core` emite. Duas cópias da mesma string e o atalho deixa de funcionar sem que nada falhe — é a mesma lição do `PATHNAME_HEADER` no [proxy](routing.md#o-proxy). Há um teste em cada lado a fixar o par.

O skip link aceita um `label`, com um default em português, para um projecto o traduzir sem editar o componente. O CSS dele usa as cores de sistema (`Canvas`, `CanvasText`) em vez de valores próprios: assim adapta-se ao modo claro ou escuro do visitante e **não impõe paleta nenhuma** a um projecto que ainda não escolheu a sua.

**Hoje nenhum provider preenche o `navigation` nem o `footer`**, e isso é deliberado. Onde esse conteúdo vive no CMS — provavelmente globals, no Payload — é uma decisão de quem monta o site, não da foundation. Ela garante os landmarks e o sítio onde os módulos entram; o resto é do projecto.

O mesmo vale para o **nível dos títulos**: o gerador emite `<h2>`, que é o que costuma estar certo, e garantir um `<h1>` por página exige dar ao módulo a sua posição na página — o que altera o contrato dos módulos. É responsabilidade de quem constrói o frontend do projecto, não da foundation.

## ModuleRenderer

[core/renderer/ModuleRenderer.tsx](../src/core/renderer/ModuleRenderer.tsx)

Três passos: resolver, validar, renderizar.

```
module.alias
     ↓
foundation.modules.getByAlias(alias)     ← resolver
     ↓
definition.schema?.parse(module.data)    ← validar
     ↓
<Component {...data} />                  ← renderizar
```

Repara que só usa `foundation.modules`. Recebe a `Foundation` inteira por conveniência, mas não toca em `page` nem em `site`.

## Erros

Dois pontos de falha, com o mesmo padrão: **em desenvolvimento lança, em produção degrada.**

| Situação                | Desenvolvimento         | Produção                |
| ----------------------- | ----------------------- | ----------------------- |
| alias não registado     | `ModuleRenderError`     | `<ModuleErrorFallback>` |
| `schema.parse()` falhou | `ModuleValidationError` | `<ModuleErrorFallback>` |

A razão da assimetria: em desenvolvimento um bloco mal ligado é um bug e queremos vê-lo imediatamente; em produção um bloco mal preenchido por um editor não deve derrubar a página inteira.

O `ModuleValidationError` guarda o erro original em `cause`, por isso o detalhe do zod não se perde:

```ts
throw new ModuleValidationError(`Module "${module.alias}" data validation failed.`, {
  cause: error,
});
```

### ModuleErrorFallback

[core/renderer/ModuleErrorFallback.tsx](../src/core/renderer/ModuleErrorFallback.tsx)

Em desenvolvimento mostra o alias que falhou. Em produção devolve `null` — a página não expõe nomes internos ao visitante.

### O silêncio era para o visitante, não para ti

Degradar em silêncio **na página** é a decisão certa. Degradar em silêncio **em todo o sistema** não era: um bloco que deixasse de validar depois de uma mudança de schema desaparecia da página em produção sem uma linha de log, sem sinal nenhum, para ninguém.

O `Foundation` leva agora um `reportError`, e o `ModuleRenderer` chama-o nos dois pontos de falha antes de desenhar o fallback:

```ts
foundation.reportError({ alias: module.alias, failure: 'invalid-data', cause: error });
```

Vem pelo `foundation` e não por um global porque o renderer já o recebe — e porque quem decide o destino do relatório é a raiz de composição, não a camada que o produz. O default é o [logModuleError](../src/core/observability/logModuleError.ts), que escreve no `console.error` dizendo o alias, o que falhou e o que verificar. Um projecto passa o seu ao `createFoundation` e o relatório vai para onde quiser: um fornecedor de telemetria, uma fila, um webhook.

O contrato ([ErrorReporter](../src/core/observability/ErrorReporter.types.ts)) é deliberadamente estreito — `alias`, `failure`, `cause` — e não conhece fornecedor nenhum, que é o que o mantém no `core`.

### E o que o renderer não apanha

O `ModuleRenderer` só vê as falhas dos módulos. Para o resto — um erro numa rota, num handler, na resolução de uma página — o sítio é o [instrumentation.ts](../src/instrumentation.ts), o `onRequestError` do Next. Escreve a rota, o tipo de render e o **`digest`**, que é a única coisa que a fronteira de erro mostra ao visitante: sem ele no log, o código que a pessoa tem no ecrã não corresponde a nada do lado do servidor.

É também o ponto onde um Sentry ou equivalente entra, com uma linha. A foundation não escolhe qual — escolher por um cliente que ainda não existe seria decidir a factura dele.

## Cobertura de testes

O renderer é a parte mais testada do projecto. [ModuleRenderer.test.tsx](../src/core/renderer/ModuleRenderer.test.tsx) · [ModuleRenderer.reporting.test.tsx](../src/core/renderer/ModuleRenderer.reporting.test.tsx) · [PageRenderer.test.tsx](../src/core/renderer/PageRenderer.test.tsx) · [ModuleErrorFallback.test.tsx](../src/core/renderer/ModuleErrorFallback.test.tsx)

O de reporting corre com `NODE_ENV` em `production`, que é o único modo onde a degradação acontece, e inclui um teste do caso que passa: **um módulo que renderiza não reporta nada.** Sem esse, um reporter que disparasse sempre passaria os outros dois e o sinal não valeria nada.

- módulo registado com dados válidos
- dados inválidos em desenvolvimento e em produção
- alias desconhecido em desenvolvimento e em produção
- presença e ausência de `navigation` e `footer`
- `main` com zero, um e vários módulos

Os testes manipulam `process.env.NODE_ENV` para cobrir os dois comportamentos, e devem manter-se independentes entre si — cada um constrói a sua `Foundation`.

## Fronteiras

**PageRenderer** — estrutura da página e delegação. Não descobre módulos, não valida schemas, não conhece o CMS.

**ModuleRenderer** — resolução por alias, validação, renderização, fallback. Não obtém páginas, não faz routing, não conhece a estrutura do CMS.

Se aparecer um `if (module.alias === 'hero')` em qualquer um dos dois, algo foi feito ao contrário.
