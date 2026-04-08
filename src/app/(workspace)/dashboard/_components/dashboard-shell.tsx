"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage, sendJson } from "@/lib/api-client";
import {
  ROLE_LABELS,
  SPRINT_STATUS_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type AppTaskStatus,
} from "@/lib/app-constants";
import { apiRoutes } from "@/lib/api-routes";
import { LogoutButton } from "@/app/(auth)/_components/logout-button";
import { TaskComments } from "@/app/(workspace)/_components/task-comments";
import type {
  AppUserSummary,
  DashboardTask,
  DashboardViewModel,
  SprintSummary,
} from "@/types/task-orbit";

type DashboardShellProps = DashboardViewModel;

type TaskPayload = {
  title: string;
  description: string | null;
  storyPoints: number | null;
  estimate: string | null;
  assigneeIds: number[];
  sprintId: number | null;
  status: AppTaskStatus;
};

function displayName(user: AppUserSummary | null) {
  if (!user) {
    return "Unassigned";
  }

  return user.name?.trim() || user.email;
}

function displayAssigneeNames(users: AppUserSummary[]) {
  if (users.length === 0) {
    return "Unassigned";
  }

  return users.map((user) => displayName(user)).join(", ");
}

function formatStamp(value: string) {
  return new Date(value).toLocaleString();
}

function parseStoryPointsInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function TaskPlanningBadges({
  storyPoints,
  estimate,
}: {
  storyPoints: number | null;
  estimate: string | null;
}) {
  if (!storyPoints && !estimate) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
      {storyPoints ? (
        <span className="rounded-full bg-sky-100 px-3 py-2 font-semibold text-sky-900">
          SP {storyPoints}
        </span>
      ) : null}
      {estimate ? (
        <span className="rounded-full bg-amber-100 px-3 py-2 font-semibold text-amber-900">
          Est. {estimate}
        </span>
      ) : null}
    </div>
  );
}

function AssigneePicker({
  users,
  selectedIds,
  onChange,
  disabled,
}: {
  users: AppUserSummary[];
  selectedIds: number[];
  onChange: (nextIds: number[]) => void;
  disabled: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedUsers = users.filter((user) => selectedIds.includes(user.id));

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

  function toggleUser(userId: number) {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== userId));
      return;
    }

    onChange([...selectedIds, userId]);
  }

  return (
    <div ref={containerRef} className="relative space-y-3">
      <div
        className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 transition ${
          disabled ? "opacity-60" : "hover:border-teal-500"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Multi Select
          </p>

          {selectedUsers.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <button
                  type="button"
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  disabled={disabled}
                  className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-900 transition hover:bg-teal-200 disabled:cursor-not-allowed"
                  aria-label={`Remove ${displayName(user)}`}
                >
                  <span>{displayName(user)}</span>
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-200 text-[10px] leading-none text-teal-900">
                    x
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Choose one or more members</p>
          )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-medium text-slate-950">
              {selectedUsers.length === 0
                ? "No members"
                : `${selectedUsers.length} selected`}
            </p>
            <button
              type="button"
              disabled={disabled}
              aria-label={isOpen ? "Collapse member picker" : "Expand member picker"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen((current) => !current)}
              className="mt-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              >
                <path
                  d="M5 7.5 10 12.5 15 7.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 z-20 rounded-[1.6rem] border border-slate-200 bg-white p-3 shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 px-2 pb-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Assign members</p>
              <p className="text-xs text-slate-500">Select multiple users for this task</p>
            </div>
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={disabled || selectedIds.length === 0}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-rose-200 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
          {users.map((user) => {
            const isSelected = selectedIds.includes(user.id);

            return (
              <button
                type="button"
                key={user.id}
                onClick={() => toggleUser(user.id)}
                disabled={disabled}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  isSelected
                    ? "border-teal-500 bg-teal-50 text-teal-900"
                    : "border-slate-200 bg-white text-slate-700"
                } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-teal-400 hover:bg-teal-50/50"}`}
              >
                <div className="min-w-0">
                  <p className="font-medium">{displayName(user)}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
                    isSelected
                      ? "border-teal-600 bg-teal-600"
                      : "border-slate-300 bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
                      isSelected ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </span>
              </button>
            );
          })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 px-2 pt-3">
            <p className="text-xs text-slate-500">
              {selectedIds.length === 0
                ? "No member selected yet."
                : `${selectedIds.length} member${selectedIds.length > 1 ? "s" : ""} selected`}
            </p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`rounded-[1.8rem] border border-white/40 px-5 py-5 shadow-sm ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function SprintCard({ sprint }: { sprint: SprintSummary }) {
  return (
    <Link
      href={`/sprints/${sprint.id}`}
      className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(19,33,24,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(19,33,24,0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Sprint Board
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {sprint.name}
          </h3>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          {SPRINT_STATUS_LABELS[sprint.status]}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {sprint.goal || "No sprint goal has been written yet."}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-100 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Todo</p>
          <p className="mt-2 text-xl font-semibold text-slate-950">{sprint.counts.TODO}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            In Progress
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {sprint.counts.IN_PROGRESS}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Complete
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-950">{sprint.counts.COMPLETE}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
        <span>{sprint.taskCount} task(s)</span>
        <span className="font-medium text-teal-800">Open kanban board</span>
      </div>
    </Link>
  );
}

function ManagerTaskCard({
  currentUser,
  task,
  users,
  sprints,
  disabled,
  onSave,
  onDelete,
}: {
  currentUser: AppUserSummary;
  task: DashboardTask;
  users: AppUserSummary[];
  sprints: SprintSummary[];
  disabled: boolean;
  onSave: (taskId: number, payload: TaskPayload) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [storyPoints, setStoryPoints] = useState(task.storyPoints ? String(task.storyPoints) : "");
  const [estimate, setEstimate] = useState(task.estimate ?? "");
  const [status, setStatus] = useState<AppTaskStatus>(task.status);
  const [assigneeIds, setAssigneeIds] = useState(task.assignees.map((assignee) => assignee.id));
  const [sprintId, setSprintId] = useState(task.sprint ? String(task.sprint.id) : "");

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSave(task.id, {
      title,
      description,
      storyPoints: parseStoryPointsInput(storyPoints),
      estimate,
      status,
      assigneeIds,
      sprintId: sprintId ? Number(sprintId) : null,
    });
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Delete "${task.title}"?`);

    if (!confirmed) {
      return;
    }

    await onDelete(task.id);
  }

  return (
    <article
      className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(19,33,24,0.08)]"
    >
      <form onSubmit={handleSave}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Task #{task.id}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Current sprint:{" "}
              {task.sprint ? (
                <Link href={`/sprints/${task.sprint.id}`} className="font-medium text-teal-800">
                  {task.sprint.name}
                </Link>
              ) : (
                "Backlog"
              )}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Assignees: {displayAssigneeNames(task.assignees)}
            </p>
            <TaskPlanningBadges storyPoints={task.storyPoints} estimate={task.estimate} />
          </div>
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-900">
            {TASK_STATUS_LABELS[task.status]}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-600"
            placeholder="Task title"
            required
            disabled={disabled}
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-600"
            placeholder="Task description"
            disabled={disabled}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Story point</span>
              <input
                type="number"
                min={1}
                max={100}
                value={storyPoints}
                onChange={(event) => setStoryPoints(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-600"
                placeholder="e.g. 5"
                disabled={disabled}
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Estimate</span>
              <input
                value={estimate}
                onChange={(event) => setEstimate(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-600"
                placeholder="e.g. 2d or 6h"
                disabled={disabled}
                maxLength={60}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Assign members</span>
              <AssigneePicker
                users={users}
                selectedIds={assigneeIds}
                onChange={setAssigneeIds}
                disabled={disabled}
              />
            </div>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Move into sprint</span>
              <select
                value={sprintId}
                onChange={(event) => setSprintId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-600"
                disabled={disabled}
              >
                <option value="">Backlog</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as AppTaskStatus)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-600"
                disabled={disabled}
              >
                {TASK_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {TASK_STATUS_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {sprintId && !task.sprint ? (
          <p className="mt-4 text-xs text-teal-800">
            Adding a task to a sprint resets it to Todo so it starts in the first kanban column.
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <div>
            <p>Created by {displayName(task.creator)}</p>
            <p>Updated {formatStamp(task.updatedAt)}</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={disabled}
              className="rounded-full border border-rose-200 px-4 py-2 font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="rounded-full bg-slate-950 px-5 py-2 font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </div>
      </form>

      <TaskComments task={task} currentUser={currentUser} />
    </article>
  );
}

function MemberTaskCard({
  currentUser,
  task,
}: {
  currentUser: AppUserSummary;
  task: DashboardTask;
}) {
  return (
    <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(19,33,24,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Assigned task
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {task.title}
          </h3>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
          {TASK_STATUS_LABELS[task.status]}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        {task.description || "No description added yet."}
      </p>

      <TaskPlanningBadges storyPoints={task.storyPoints} estimate={task.estimate} />

      <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
        <div className="rounded-full bg-slate-100 px-4 py-2">
          Assigned by {displayName(task.creator)}
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2">
          Team: {displayAssigneeNames(task.assignees)}
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2">
          {task.sprint ? (
            <Link href={`/sprints/${task.sprint.id}`} className="font-medium text-teal-800">
              Sprint: {task.sprint.name}
            </Link>
          ) : (
            "Backlog task"
          )}
        </div>
      </div>

      <p className="mt-5 text-sm text-slate-500">Updated {formatStamp(task.updatedAt)}</p>

      <TaskComments task={task} currentUser={currentUser} />
    </article>
  );
}

function TaskSection({
  title,
  description,
  emptyLabel,
  tasks,
  children,
}: {
  title: string;
  description: string;
  emptyLabel: string;
  tasks: DashboardTask[];
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <p className="text-sm text-slate-500">{tasks.length} task(s)</p>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-slate-600">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid gap-5">{children}</div>
      )}
    </section>
  );
}

export function DashboardShell({
  currentUser,
  users,
  sprints,
  backlogTasks,
  sprintTasks,
}: DashboardShellProps) {
  const router = useRouter();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStoryPoints, setTaskStoryPoints] = useState("");
  const [taskEstimate, setTaskEstimate] = useState("");
  const [taskAssigneeIds, setTaskAssigneeIds] = useState<number[]>([]);
  const [sprintName, setSprintName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allTasks = [...backlogTasks, ...sprintTasks];
  const activeSprintCount = sprints.filter((sprint) => sprint.status === "ACTIVE").length;

  function refreshDashboard(message: string) {
    setFeedback(message);
    setError(null);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await sendJson(apiRoutes.tasks, {
        method: "POST",
        body: {
          title: taskTitle,
          description: taskDescription,
          storyPoints: parseStoryPointsInput(taskStoryPoints),
          estimate: taskEstimate,
          assigneeIds: taskAssigneeIds,
        },
      });

      setTaskTitle("");
      setTaskDescription("");
      setTaskStoryPoints("");
      setTaskEstimate("");
      setTaskAssigneeIds([]);
      refreshDashboard("Backlog task created.");
    } catch (caughtError) {
      setFeedback(null);
      setError(getApiErrorMessage(caughtError, "Task creation failed."));
    }
  }

  async function handleCreateSprint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await sendJson(apiRoutes.sprints, {
        method: "POST",
        body: {
          name: sprintName,
          goal: sprintGoal,
        },
      });

      setSprintName("");
      setSprintGoal("");
      refreshDashboard("Sprint created. You can now move tasks into it.");
    } catch (caughtError) {
      setFeedback(null);
      setError(getApiErrorMessage(caughtError, "Sprint creation failed."));
    }
  }

  async function handleTaskSave(taskId: number, payload: TaskPayload) {
    setError(null);

    try {
      await sendJson(apiRoutes.task(taskId), {
        method: "PATCH",
        body: payload,
      });
      refreshDashboard(
        payload.sprintId ? "Task saved and synced with its sprint." : "Task saved successfully.",
      );
    } catch (caughtError) {
      setFeedback(null);
      setError(getApiErrorMessage(caughtError, "Task update failed."));
    }
  }

  async function handleDelete(taskId: number) {
    setError(null);

    try {
      await sendJson(apiRoutes.task(taskId), {
        method: "DELETE",
      });
      refreshDashboard("Task deleted.");
    } catch (caughtError) {
      setFeedback(null);
      setError(getApiErrorMessage(caughtError, "Task delete failed."));
    }
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2.4rem] border border-[var(--border)] bg-[linear-gradient(135deg,#fef3c7_0%,#fdfbf6_42%,#d1fae5_100%)] p-8 shadow-[0_28px_80px_rgba(19,33,24,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-800">
                Task Orbit
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {currentUser.role === "MANAGER"
                  ? "Plan sprints, assign tasks, and move work into kanban boards."
                  : "See your assigned sprint work and keep tasks moving."}
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-700">
                Signed in as {displayName(currentUser)} ({ROLE_LABELS[currentUser.role]}).
              </p>
            </div>
            <LogoutButton />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <SummaryCard label="Backlog" value={backlogTasks.length} tone="bg-white/80" />
            <SummaryCard label="In Sprints" value={sprintTasks.length} tone="bg-white/80" />
            <SummaryCard label="Active Sprints" value={activeSprintCount} tone="bg-white/80" />
          </div>
        </header>

        {feedback ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {feedback}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {currentUser.role === "MANAGER" ? (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <form
              onSubmit={handleCreateTask}
              className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(19,33,24,0.08)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Create Task
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Add work to the backlog
              </h2>

              <div className="mt-5 space-y-4">
                <input
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-600"
                  placeholder="Task title"
                  required
                  disabled={isPending}
                />
                <textarea
                  value={taskDescription}
                  onChange={(event) => setTaskDescription(event.target.value)}
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-600"
                  placeholder="Describe the task"
                  disabled={isPending}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-700">
                    <span className="font-medium">Story point</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={taskStoryPoints}
                      onChange={(event) => setTaskStoryPoints(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-600"
                      placeholder="e.g. 5"
                      disabled={isPending}
                    />
                  </label>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span className="font-medium">Estimate</span>
                    <input
                      value={taskEstimate}
                      onChange={(event) => setTaskEstimate(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-600"
                      placeholder="e.g. 2d or 6h"
                      disabled={isPending}
                      maxLength={60}
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Assign members</p>
                  <AssigneePicker
                    users={users}
                    selectedIds={taskAssigneeIds}
                    onChange={setTaskAssigneeIds}
                    disabled={isPending}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Working..." : "Create task"}
              </button>
            </form>

            <form
              onSubmit={handleCreateSprint}
              className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(19,33,24,0.08)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Create Sprint
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Start a new kanban board
              </h2>

              <div className="mt-5 space-y-4">
                <input
                  value={sprintName}
                  onChange={(event) => setSprintName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-600"
                  placeholder="Sprint name"
                  required
                  disabled={isPending}
                />
                <textarea
                  value={sprintGoal}
                  onChange={(event) => setSprintGoal(event.target.value)}
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-600"
                  placeholder="Sprint goal"
                  disabled={isPending}
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Working..." : "Create sprint"}
              </button>
            </form>
          </section>
        ) : (
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(19,33,24,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Member View
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Your dashboard shows backlog items and sprint boards that belong to you.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Open a sprint board to drag your assigned cards from Todo to In Progress and then
              to Complete.
            </p>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Sprint Boards
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Open any sprint to see its kanban columns and move cards between them.
              </p>
            </div>
            <p className="text-sm text-slate-500">{sprints.length} sprint(s)</p>
          </div>

          {sprints.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-slate-600">
              No sprints yet. Create one and then move tasks into it.
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {sprints.map((sprint) => (
                <SprintCard key={sprint.id} sprint={sprint} />
              ))}
            </div>
          )}
        </section>

        <TaskSection
          title="Backlog Tasks"
          description="Tasks outside any sprint stay here until you move them into a sprint."
          emptyLabel="No backlog tasks right now."
          tasks={backlogTasks}
        >
          {currentUser.role === "MANAGER"
            ? backlogTasks.map((task) => (
                <ManagerTaskCard
                  key={`${task.id}-${task.updatedAt}`}
                  currentUser={currentUser}
                  task={task}
                  users={users}
                  sprints={sprints}
                  disabled={isPending}
                  onSave={handleTaskSave}
                  onDelete={handleDelete}
                />
              ))
            : backlogTasks.map((task) => (
                <MemberTaskCard key={task.id} currentUser={currentUser} task={task} />
              ))}
        </TaskSection>

        <TaskSection
          title="Sprint Tasks"
          description="These tasks already belong to a sprint. Open the linked board for kanban view."
          emptyLabel="No tasks have been moved into a sprint yet."
          tasks={sprintTasks}
        >
          {currentUser.role === "MANAGER"
            ? sprintTasks.map((task) => (
                <ManagerTaskCard
                  key={`${task.id}-${task.updatedAt}`}
                  currentUser={currentUser}
                  task={task}
                  users={users}
                  sprints={sprints}
                  disabled={isPending}
                  onSave={handleTaskSave}
                  onDelete={handleDelete}
                />
              ))
            : sprintTasks.map((task) => (
                <MemberTaskCard key={task.id} currentUser={currentUser} task={task} />
              ))}
        </TaskSection>

        {currentUser.role === "MANAGER" && allTasks.length > 0 ? (
          <p className="text-center text-sm text-slate-500">
            Tip: when you move a task into a sprint, it lands in Todo and becomes available on
            that sprint&apos;s kanban board.
          </p>
        ) : null}
      </div>
    </main>
  );
}
