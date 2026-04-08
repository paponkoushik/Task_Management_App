import { bnMessages } from "./bn";
import { enMessages } from "./en";

type DeepStringShape<T> = T extends string
  ? string
  : {
      [K in keyof T]: DeepStringShape<T[K]>;
    };

export type DictionaryMessages = DeepStringShape<typeof enMessages>;

export const dictionaries = {
  en: enMessages,
  bn: bnMessages,
} satisfies Record<string, DictionaryMessages>;

export type DictionaryLocale = keyof typeof dictionaries;

export const APP_LOCALES = Object.keys(dictionaries) as DictionaryLocale[];
