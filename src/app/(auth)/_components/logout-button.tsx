"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/api-client";
import { apiRoutes } from "@/lib/api-routes";

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleLogout() {
    setError(null);

    const { response, payload } = await requestJson<{ error?: string }>(apiRoutes.logout, {
      method: "POST",
    });

    if (!response.ok) {
      setError(payload?.error ?? "Logout failed.");
      return;
    }

    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Logging out..." : "Logout"}
      </button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
