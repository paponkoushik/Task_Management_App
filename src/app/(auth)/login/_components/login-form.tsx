"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage, requestJson } from "@/lib/api-client";
import { apiRoutes } from "@/lib/api-routes";

type LoginResponse = {
  error?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const { response, payload } = await requestJson<LoginResponse>(apiRoutes.login, {
        method: "POST",
        body: { email, password },
      });

      if (!response.ok) {
        setError(payload?.error ?? "Login failed.");
        return;
      }

      startTransition(() => {
        router.push("/dashboard");
        router.refresh();
      });
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Login failed."));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-[0_24px_80px_rgba(19,33,24,0.08)]"
    >
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700">
          Login
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          Enter your account
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          All seeded users use password <span className="font-semibold">123456</span>.
        </p>
      </div>

      <div className="mt-8 space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-600"
            placeholder="manager@taskorbit.local"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-600"
            placeholder="123456"
            required
          />
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
