"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/api-client";
import { apiRoutes } from "@/lib/api-routes";
import { APP_LOCALES, type AppLocale } from "@/lib/i18n";
import { useI18n } from "./i18n-provider";

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale, messages } = useI18n();
  const [isPending, startTransition] = useTransition();

  async function handleChange(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }

    await requestJson(apiRoutes.localePreference, {
      method: "POST",
      body: {
        locale: nextLocale,
      },
    });

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="rounded-full border border-[var(--border)] bg-white/90 p-1 shadow-[0_12px_35px_rgba(15,23,42,0.1)] backdrop-blur">
      <div className="flex items-center gap-1 px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        <span>{messages.common.language}</span>
      </div>
      <div className="flex items-center gap-1">
        {APP_LOCALES.map((option) => {
          const isActive = option === locale;
          const label =
            option === "en" ? messages.common.english : messages.common.bangla;

          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                void handleChange(option);
              }}
              disabled={isPending}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
