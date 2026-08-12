# Renderer

## PageRenderer

`PageRenderer` recebe uma `PageDefinition` e uma `Foundation`.

```ts
interface PageRendererProps {
  page: PageDefinition;
  foundation: Foundation;
}
```

A responsabilidade do `PageRenderer` é apenas organizar as regiões fixas da página:

```text
navigation?
main[]
footer?
```

Não conhece módulos concretos.

## Estrutura

O renderer segue esta forma:

```tsx
<>
  {page.navigation && <ModuleRenderer module={page.navigation} foundation={foundation} />}

  <main>
    {page.main.map((module) => (
      <Fragment key={module.id}>
        <ModuleRenderer module={module} foundation={foundation} />
      </Fragment>
    ))}
  </main>

  {page.footer && <ModuleRenderer module={page.footer} foundation={foundation} />}
</>
```

O `Fragment` não adiciona um wrapper DOM.

A chave usa `module.id`, que pertence à instância da página.

## ModuleRenderer

`ModuleRenderer` resolve uma instância através do alias:

```text
ModuleInstance.alias
        ↓
ModuleRegistry.getByAlias()
        ↓
Module definition
```

### Módulo não registado

Em desenvolvimento:

```text
ModuleRenderError
```

Em produção:

```text
ModuleErrorFallback
```

### Validação

Se o módulo possuir schema:

```ts
data = definition.schema.parse(module.data);
```

Se a validação falhar:

- desenvolvimento: lança `ModuleValidationError`;
- produção: usa o comportamento de fallback definido pelo renderer.

### Renderização

Depois da resolução e validação:

```tsx
const Component = definition.component;

return <Component {...data} />;
```

## ModuleErrorFallback

O fallback é uma fronteira de apresentação de erros de módulo.

Em desenvolvimento apresenta informação útil para diagnóstico.

Em produção pode não apresentar conteúdo visível.

Isto evita expor detalhes internos do sistema em produção.

## Responsabilidades

### PageRenderer

Responsável por:

- estrutura da página;
- navigation opcional;
- main;
- footer opcional;
- delegar cada módulo.

Não é responsável por:

- descobrir módulos;
- validar schemas;
- conhecer Payload;
- conhecer módulos concretos.

### ModuleRenderer

Responsável por:

- resolver alias;
- validar dados;
- renderizar o componente;
- tratar erro/fallback.

Não é responsável por:

- obter páginas;
- routing;
- conhecer a estrutura do CMS.

## Testes atuais

O renderer tem cobertura para:

- módulo registado com dados válidos;
- dados inválidos em desenvolvimento;
- alias desconhecido em desenvolvimento;
- fallback de módulo desconhecido em produção;
- navigation;
- main;
- footer;
- ausência de navigation/footer.

Os testes devem continuar independentes entre si.
