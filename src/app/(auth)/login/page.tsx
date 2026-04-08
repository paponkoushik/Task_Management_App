import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./_components/login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2.6rem] border border-[var(--border)] bg-[linear-gradient(140deg,#0f172a_0%,#134e4a_46%,#f59e0b_120%)] p-8 text-white shadow-[0_30px_90px_rgba(19,33,24,0.18)]">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-200">
            Small Team Todo App
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">
            Login with JWT, plan sprints, and move cards across a kanban board.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            This app uses PostgreSQL, Prisma, HTTP-only session cookies, sprint-based planning,
            and role-based task access. One manager can create sprints and assign work to multiple
            members, and assigned members can drag shared cards between Todo, In Progress, and
            Complete.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.8rem] bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">
                Manager
              </p>
              <p className="mt-3 text-lg font-medium">manager@taskorbit.local</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Creates tasks, edits them, creates sprints, and moves backlog work into a sprint.
              </p>
            </div>
            <div className="rounded-[1.8rem] bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">
                Members
              </p>
              <div className="mt-3 space-y-1 text-sm font-medium md:text-base">
                <p>member@taskorbit.local</p>
                <p>member2@taskorbit.local</p>
                <p>member3@taskorbit.local</p>
                <p>member4@taskorbit.local</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Assigned members see shared sprint work after login and can update task state.
              </p>
            </div>
          </div>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
