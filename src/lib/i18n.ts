import type { AppSprintStatus, AppTaskStatus, AppUserRole } from "@/lib/app-constants";
import {
  APP_LOCALES,
  dictionaries,
  type DictionaryLocale,
  type DictionaryMessages,
} from "@/lib/locales";

export { APP_LOCALES };

export type AppLocale = DictionaryLocale;
export type AppMessages = DictionaryMessages;

export const LOCALE_COOKIE_NAME = "task-orbit-locale";
export const DEFAULT_LOCALE: AppLocale = "en";

const localeDictionaries: Record<AppLocale, AppMessages> = dictionaries;

export function isLocale(value: string | null | undefined): value is AppLocale {
  return typeof value === "string" && APP_LOCALES.includes(value as AppLocale);
}

export function getDictionary(locale: AppLocale): AppMessages {
  return localeDictionaries[locale];
}

export function getRoleLabel(role: AppUserRole, messages: AppMessages) {
  const labels: Record<AppUserRole, string> = {
    MANAGER: messages.common.manager,
    MEMBER: messages.common.member,
  };

  return labels[role];
}

export function getTaskStatusLabel(status: AppTaskStatus, messages: AppMessages) {
  const labels: Record<AppTaskStatus, string> = {
    TODO: messages.dashboard.todo,
    IN_PROGRESS: messages.dashboard.inProgress,
    COMPLETE: messages.dashboard.complete,
  };

  return labels[status];
}

export function getSprintStatusLabel(status: AppSprintStatus, messages: AppMessages) {
  const labels: Record<AppSprintStatus, string> = {
    ACTIVE: messages.common.active,
    COMPLETED: messages.common.completed,
  };

  return labels[status];
}

export function formatDateTime(value: string, locale: AppLocale) {
  return new Date(value).toLocaleString(locale === "bn" ? "bn-BD" : "en-US");
}

export function formatCountLabel(
  count: number,
  singular: string,
  plural: string,
  locale: AppLocale,
) {
  const formattedCount = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(
    count,
  );

  if (locale === "bn") {
    return `${formattedCount} ${plural}`;
  }

  return `${formattedCount} ${count === 1 ? singular : plural}`;
}
