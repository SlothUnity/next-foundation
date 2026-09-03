export const availableLocales = [
  {
    label: 'Português',
    value: 'pt-PT',
  },
  {
    label: 'English',
    value: 'en-GB',
  },
] as const;

export type SupportedLocale = (typeof availableLocales)[number]['value'];

export const payloadDefaultLocale: SupportedLocale = 'pt-PT';

export const payloadLocales = availableLocales.map(({ label, value }) => ({
  label,
  code: value,
}));

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return availableLocales.some(({ value }) => value === locale);
}
