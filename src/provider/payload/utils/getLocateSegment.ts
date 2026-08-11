export function getLocateSegment(locale: string): string {
  return locale.split('-')[0].toLowerCase();
}
