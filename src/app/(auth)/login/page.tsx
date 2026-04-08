import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { LoginForm } from "./_components/login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  const messages = await getDictionary();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2.6rem] border border-[var(--border)] bg-[linear-gradient(140deg,#0f172a_0%,#134e4a_46%,#f59e0b_120%)] p-8 text-white shadow-[0_30px_90px_rgba(19,33,24,0.18)]">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-200">
            {messages.auth.heroEyebrow}
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">
            {messages.auth.heroTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            {messages.auth.heroDescription}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.8rem] bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">
                {messages.auth.manager}
              </p>
              <p className="mt-3 text-lg font-medium">manager@taskorbit.local</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                {messages.auth.managerDescription}
              </p>
            </div>
            <div className="rounded-[1.8rem] bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">
                {messages.auth.members}
              </p>
              <div className="mt-3 space-y-1 text-sm font-medium md:text-base">
                <p>member@taskorbit.local</p>
                <p>member2@taskorbit.local</p>
                <p>member3@taskorbit.local</p>
                <p>member4@taskorbit.local</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                {messages.auth.membersDescription}
              </p>
            </div>
          </div>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
