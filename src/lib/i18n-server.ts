import "server-only";
import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  getDictionary as getDictionaryForLocale,
  isLocale,
  LOCALE_COOKIE_NAME,
  type AppLocale,
  type AppMessages,
} from "@/lib/i18n";

export async function getLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}

export async function getDictionary(locale?: AppLocale): Promise<AppMessages> {
  return getDictionaryForLocale(locale ?? (await getLocale()));
}
