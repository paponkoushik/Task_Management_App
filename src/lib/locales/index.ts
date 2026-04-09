import { bnMessages } from "./bn";
import { deMessages } from "./de";
import { enMessages } from "./en";
import { esMessages } from "./es";
import { frMessages } from "./fr";
import { itMessages } from "./it";
import { noMessages } from "./no";
import { ptMessages } from "./pt";

type DeepStringShape<T> = T extends string
  ? string
  : {
      [K in keyof T]: DeepStringShape<T[K]>;
    };

export type DictionaryMessages = DeepStringShape<typeof enMessages>;

export const dictionaries = {
  en: enMessages,
  bn: bnMessages,
  de: deMessages,
  fr: frMessages,
  it: itMessages,
  no: noMessages,
  pt: ptMessages,
  es: esMessages,
} satisfies Record<string, DictionaryMessages>;

export type DictionaryLocale = keyof typeof dictionaries;

export const APP_LOCALES = Object.keys(dictionaries) as DictionaryLocale[];

export const localeMetadata = {
  en: { label: "English", intl: "en-US" },
  bn: { label: "বাংলা", intl: "bn-BD" },
  de: { label: "Deutsch", intl: "de-DE" },
  fr: { label: "Français", intl: "fr-FR" },
  it: { label: "Italiano", intl: "it-IT" },
  no: { label: "Norsk", intl: "nb-NO" },
  pt: { label: "Português", intl: "pt-BR" },
  es: { label: "Español", intl: "es-ES" },
} satisfies Record<DictionaryLocale, { label: string; intl: string }>;
