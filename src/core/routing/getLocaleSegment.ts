export function getLocaleSegment(locale: string): string {
  const [language = locale] = locale.split('-');

  return language.toLowerCase();
}
