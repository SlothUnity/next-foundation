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

**Hoje nenhum provider preenche o `navigation` nem o `footer`**, e isso é deliberado. Onde esse conteúdo vive no CMS — provavelmente globals, no Payload — é uma decisão de quem monta o site, não da foundation. Ela garante os landmarks e o sítio onde os módulos entram; o resto é do projecto.

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

Em desenvolvimento mostra o alias que falhou. Em produção devolve `null` — falha silenciosa e sem expor nomes internos.

## Cobertura de testes

O renderer é a parte mais testada do projecto. [ModuleRenderer.test.tsx](../src/core/renderer/ModuleRenderer.test.tsx) · [PageRenderer.test.tsx](../src/core/renderer/PageRenderer.test.tsx) · [ModuleErrorFallback.test.tsx](../src/core/renderer/ModuleErrorFallback.test.tsx)

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
