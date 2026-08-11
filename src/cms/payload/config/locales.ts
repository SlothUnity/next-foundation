export const availableLocales = [
  {
    label: 'Português',
    value: 'pt-PT',
  },
  {
    label: 'English',
    value: 'en-GB',
  },
  {
    label: 'Español',
    value: 'es-ES',
  },
  {
    label: 'Français',
    value: 'fr-FR',
  },
  {
    label: 'Deutsch',
    value: 'de-DE',
  },
] as const;

export type SupportedLocale = (typeof availableLocales)[number]['value'];

export const payloadLocales = availableLocales.map(({ label, value }) => ({
  label,
  code: value,
}));
