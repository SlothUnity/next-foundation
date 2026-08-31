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

/**
 * O locale que o Payload assume quando ninguém indica nenhum.
 *
 * Governa o comportamento dos campos localizados no CMS. **Não** é o default de routing
 * — esse é o `defaultLocale` do `SiteDefinition`, que sai do global `Site` e é
 * controlável pelo editor. Serve aqui de último recurso, para o caso de o global ainda
 * não ter locales escolhidos.
 */
export const payloadDefaultLocale: SupportedLocale = 'pt-PT';

export const payloadLocales = availableLocales.map(({ label, value }) => ({
  label,
  code: value,
}));

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return availableLocales.some(({ value }) => value === locale);
}
