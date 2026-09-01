/**
 * O que se desenha quando a origem diz `notFound` e não traz conteúdo.
 *
 * Não é a página de erro do site — é o aviso de que ela **não existe**. Neste
 * projecto o 404 é conteúdo do provider, e um provider que ainda não tenha uma
 * página de erro configurada cai aqui.
 *
 * Degrada com voz, como o resto: sem o aviso, uma lacuna de configuração ficava
 * indistinguível de uma página de erro deliberadamente minimalista.
 */
export function MissingNotFoundPage() {
  console.warn(
    'The content source answered "notFound" without a page. Configure a not-found page in your provider so visitors get real content.',
  );

  return (
    <main>
      <h1>404</h1>

      <p>Page not found.</p>
    </main>
  );
}
