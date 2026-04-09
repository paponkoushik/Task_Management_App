"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/api-client";
import { apiRoutes } from "@/lib/api-routes";
import { APP_LOCALES, getLocaleLabel, type AppLocale } from "@/lib/i18n";
import { useI18n } from "./i18n-provider";

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale, messages } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  async function handleChange(nextLocale: AppLocale) {
    setIsOpen(false);

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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={isPending}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={messages.common.language}
        className="inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/88 py-1.5 pl-1.5 pr-4 text-slate-700 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur transition hover:border-[var(--border)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f8fafc_0%,#dbeafe_100%)] text-slate-700 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4.5 w-4.5">
            <circle cx="10" cy="10" r="6.2" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M3.8 10h12.4M10 3.8c1.7 1.7 2.6 3.8 2.6 6.2 0 2.4-.9 4.6-2.6 6.2M10 3.8C8.3 5.5 7.4 7.6 7.4 10c0 2.4.9 4.6 2.6 6.2"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="min-w-0 text-sm font-semibold tracking-tight">
          {getLocaleLabel(locale)}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path
            d="M5.5 7.5 10 12l4.5-4.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label={messages.common.language}
          className="absolute right-0 top-14 min-w-52 rounded-[1.4rem] border border-white/80 bg-white/95 p-2 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur"
        >
          {APP_LOCALES.map((option) => {
            const isActive = option === locale;

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  void handleChange(option);
                }}
                disabled={isPending}
                role="menuitemradio"
                aria-checked={isActive}
                className={`flex w-full items-center justify-between rounded-[1rem] px-3 py-2.5 text-left text-sm font-semibold tracking-tight transition ${
                  isActive
                    ? "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <span>{getLocaleLabel(option)}</span>
                <span
                  className={`inline-flex h-2.5 w-2.5 rounded-full ${
                    isActive ? "bg-white" : "bg-slate-300"
                  }`}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
