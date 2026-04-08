"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage, requestJson } from "@/lib/api-client";
import { apiRoutes } from "@/lib/api-routes";
import { useI18n } from "@/app/_components/i18n-provider";

export function LogoutButton() {
  const router = useRouter();
  const { messages } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleLogout() {
    setError(null);

    try {
      const { response, payload } = await requestJson<{ error?: string }>(apiRoutes.logout, {
        method: "POST",
      });

      if (!response.ok) {
        setError(payload?.error ?? messages.auth.logoutFailed);
        return;
      }

      startTransition(() => {
        router.push(messages.auth.logoutRedirect);
        router.refresh();
      });
    } catch (caughtError) {
      setError(
        getApiErrorMessage(
          caughtError,
          messages.auth.logoutFailed,
          messages.common.networkError,
        ),
      );
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? messages.auth.loggingOut : messages.auth.logout}
      </button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
