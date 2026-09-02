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
