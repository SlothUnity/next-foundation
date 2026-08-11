export function getLocaleSegment(locale: string): string {
  return locale.split('-')[0].toLowerCase();
}
