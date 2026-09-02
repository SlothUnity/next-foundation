export function getLocaleSegment(locale: string): string {
  // O `split` devolve sempre pelo menos um elemento, mas o TypeScript não o sabe —
  // e é essa a classe de erro que o `noUncheckedIndexedAccess` obriga a olhar. O
  // default deixa a intenção escrita: um locale sem hífen é ele próprio o segmento.
  const [language = locale] = locale.split('-');

  return language.toLowerCase();
}
