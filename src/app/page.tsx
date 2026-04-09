import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";

export default async function Home() {
  const currentUser = await getCurrentUser();
  const messages = await getDictionary();
  const home = messages.home;

  const primaryHref = currentUser ? "/dashboard" : "/login";
  const primaryLabel = currentUser ? messages.common.backToDashboard : messages.auth.signIn;

  const serviceCards = [
    {
      eyebrow: messages.dashboard.createSprintEyebrow,
      title: messages.dashboard.createSprintTitle,
      description: messages.sprintBoard.planningDescription,
    },
    {
      eyebrow: messages.dashboard.createTaskEyebrow,
      title: messages.dashboard.createTaskTitle,
      description: messages.dashboard.moveIntoSprintNote,
    },
    {
      eyebrow: messages.dashboard.assignMembersTitle,
      title: messages.dashboard.assignMembers,
      description: messages.dashboard.assignMembersDescription,
    },
    {
      eyebrow: messages.comments.title,
      title: messages.comments.addComment,
      description: messages.comments.commentPermissionOnly,
    },
  ];

  const workflowCards = [
    {
      step: "01",
      title: messages.dashboard.createTask,
      description: messages.dashboard.createTaskTitle,
    },
    {
      step: "02",
      title: messages.dashboard.createSprint,
      description: messages.dashboard.createSprintTitle,
    },
    {
      step: "03",
      title: messages.dashboard.sprintBoards,
      description: messages.dashboard.memberViewDescription,
    },
  ];

  return (
    <main className="px-6 py-6 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="rounded-[2rem] border border-[var(--border)] bg-[color:rgba(255,253,248,0.86)] px-5 py-4 shadow-[0_24px_80px_rgba(19,33,24,0.08)] backdrop-blur md:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#0f172a_0%,#115e59_55%,#f59e0b_120%)] text-sm font-black tracking-[0.2em] text-white">
                TO
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                  Task Orbit
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {home.brandTagline}
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-[var(--muted)]">
              <a
                href="#services"
                className="rounded-full px-3 py-2 transition hover:bg-black/5 hover:text-[var(--foreground)]"
              >
                {home.navServices}
              </a>
              <a
                href="#workflow"
                className="rounded-full px-3 py-2 transition hover:bg-black/5 hover:text-[var(--foreground)]"
              >
                {home.navWorkflow}
              </a>
              <a
                href="#footer"
                className="rounded-full px-3 py-2 transition hover:bg-black/5 hover:text-[var(--foreground)]"
              >
                {home.navContact}
              </a>
              <Link
                href={primaryHref}
                className="rounded-full bg-slate-950 px-5 py-2.5 text-white transition hover:bg-slate-800"
              >
                {primaryLabel}
              </Link>
            </nav>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[2.8rem] border border-[var(--border)] bg-[linear-gradient(145deg,#0f172a_0%,#134e4a_42%,#f59e0b_125%)] p-8 text-white shadow-[0_35px_110px_rgba(19,33,24,0.16)] md:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.34em] text-amber-200">
                {messages.auth.heroEyebrow}
              </p>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
                {messages.auth.heroTitle}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
                {messages.auth.heroDescription}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-slate-100">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
                {home.featureAuth}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
                {home.featureDatabase}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
                {home.featureDelivery}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
                {home.featureAssignments}
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                {primaryLabel}
              </Link>
              <a
                href="#services"
                className="inline-flex items-center justify-center rounded-full border border-white/24 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/16"
              >
                {home.exploreServices}
              </a>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-[2.2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_60px_rgba(19,33,24,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                    {messages.auth.manager}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    manager@taskorbit.local
                  </p>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                  {home.lead}
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                {messages.auth.managerDescription}
              </p>
            </div>

            <div className="rounded-[2.2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_60px_rgba(19,33,24,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                {messages.auth.members}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] bg-slate-950 px-4 py-4 text-sm text-white">
                  <p className="font-semibold">member@taskorbit.local</p>
                  <p className="mt-1 text-slate-300">{home.taskDelivery}</p>
                </div>
                <div className="rounded-[1.4rem] bg-white px-4 py-4 text-sm shadow-[inset_0_0_0_1px_rgba(19,33,24,0.08)]">
                  <p className="font-semibold text-slate-950">member2@taskorbit.local</p>
                  <p className="mt-1 text-[var(--muted)]">{home.sharedAssignment}</p>
                </div>
                <div className="rounded-[1.4rem] bg-white px-4 py-4 text-sm shadow-[inset_0_0_0_1px_rgba(19,33,24,0.08)]">
                  <p className="font-semibold text-slate-950">member3@taskorbit.local</p>
                  <p className="mt-1 text-[var(--muted)]">{home.statusUpdates}</p>
                </div>
                <div className="rounded-[1.4rem] bg-white px-4 py-4 text-sm shadow-[inset_0_0_0_1px_rgba(19,33,24,0.08)]">
                  <p className="font-semibold text-slate-950">member4@taskorbit.local</p>
                  <p className="mt-1 text-[var(--muted)]">{home.sprintExecution}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                {messages.auth.membersDescription}
              </p>
            </div>

            <div className="rounded-[2.2rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(15,118,110,0.12),rgba(255,255,255,0.92))] p-6 shadow-[0_18px_60px_rgba(19,33,24,0.08)]">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                    {home.authLabel}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">JWT</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                    {home.databaseLabel}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">Postgres</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                    {home.deliveryLabel}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">Kanban</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="services"
          className="rounded-[2.6rem] border border-[var(--border)] bg-[color:rgba(255,253,248,0.92)] p-7 shadow-[0_24px_80px_rgba(19,33,24,0.08)] md:p-9"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                {home.servicesEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                {home.servicesTitle}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
              {home.servicesDescription}
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {serviceCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[1.8rem] border border-[var(--border)] bg-white p-5 shadow-[0_16px_40px_rgba(19,33,24,0.05)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                  {card.eyebrow}
                </p>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="workflow"
          className="grid gap-6 rounded-[2.6rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(15,118,110,0.08))] p-7 shadow-[0_24px_80px_rgba(19,33,24,0.08)] lg:grid-cols-[0.85fr_1.15fr] md:p-9"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              {home.workflowEyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              {messages.dashboard.sprintBoards}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
              {messages.dashboard.sprintBoardsDescription}
            </p>

            <div className="mt-8 rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.25)]">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-300">
                {home.teamVisibilityEyebrow}
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight">
                {home.teamVisibilityTitle}
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {messages.comments.commentPermission} {messages.dashboard.tip}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {workflowCards.map((card) => (
              <article
                key={card.step}
                className="rounded-[1.8rem] border border-[var(--border)] bg-white p-5 shadow-[0_16px_40px_rgba(19,33,24,0.05)]"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                  {card.step}
                </p>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <footer
          id="footer"
          className="rounded-[2rem] border border-[var(--border)] bg-[color:rgba(255,253,248,0.86)] px-6 py-6 shadow-[0_18px_60px_rgba(19,33,24,0.06)]"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                Task Orbit
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                {home.footerDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-[var(--muted)]">
              <Link
                href={primaryHref}
                className="rounded-full bg-slate-950 px-5 py-2.5 text-white transition hover:bg-slate-800"
              >
                {primaryLabel}
              </Link>
              <a href="#services" className="rounded-full px-3 py-2 transition hover:bg-black/5">
                {home.navServices}
              </a>
              <a href="#workflow" className="rounded-full px-3 py-2 transition hover:bg-black/5">
                {home.navWorkflow}
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
