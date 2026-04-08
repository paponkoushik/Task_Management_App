"use client";

import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage, sendJson } from "@/lib/api-client";
import {
  TASK_STATUSES,
  type AppTaskStatus,
} from "@/lib/app-constants";
import { apiRoutes } from "@/lib/api-routes";
import {
  formatCountLabel,
  formatDateTime,
  type AppLocale,
  getRoleLabel,
  getSprintStatusLabel,
  getTaskStatusLabel,
} from "@/lib/i18n";
import { LogoutButton } from "@/app/(auth)/_components/logout-button";
import { useI18n } from "@/app/_components/i18n-provider";
import {
  AssigneeAvatars,
  displayUserName,
} from "@/app/(workspace)/_components/assignee-avatars";
import { TaskComments } from "@/app/(workspace)/_components/task-comments";
import type {
  AppUserSummary,
  DashboardTask,
  SprintBoardViewModel,
} from "@/types/task-orbit";

type SprintBoardProps = SprintBoardViewModel;

function displayName(user: AppUserSummary | null, unassignedLabel: string) {
  if (!user) {
    return unassignedLabel;
  }

  return displayUserName(user);
}

function displayAssigneeNames(users: AppUserSummary[], unassignedLabel: string) {
  if (users.length === 0) {
    return unassignedLabel;
  }

  return users.map((user) => displayName(user, unassignedLabel)).join(", ");
}

function formatStamp(value: string, locale: AppLocale) {
  return formatDateTime(value, locale);
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
  const { messages } = useI18n();

  if (!storyPoints && !estimate) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
      {storyPoints ? (
        <span className="rounded-full bg-sky-100 px-3 py-2 font-semibold text-sky-900">
          SP {storyPoints}
        </span>
      ) : null}
      {estimate ? (
        <span className="rounded-full bg-amber-100 px-3 py-2 font-semibold text-amber-900">
          {messages.dashboard.estimate}: {estimate}
        </span>
      ) : null}
    </div>
  );
}

function KanbanPlanningEditor({
  storyPoints,
  estimate,
  disabled,
  onSave,
}: {
  storyPoints: number | null;
  estimate: string | null;
  disabled: boolean;
  onSave: (nextPlanning: { storyPoints: number | null; estimate: string | null }) => Promise<void>;
}) {
  const { messages } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draftStoryPoints, setDraftStoryPoints] = useState(storyPoints ? String(storyPoints) : "");
  const [draftEstimate, setDraftEstimate] = useState(estimate ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDraftStoryPoints(storyPoints ? String(storyPoints) : "");
      setDraftEstimate(estimate ?? "");
    }
  }, [estimate, isOpen, storyPoints]);

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

  async function persist(nextStoryPoints: number | null, nextEstimate: string | null) {
    setIsSaving(true);

    try {
      await onSave({
        storyPoints: nextStoryPoints,
        estimate: nextEstimate,
      });
      setIsOpen(false);
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label={isOpen ? messages.comments.hide : messages.comments.show}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-600 transition hover:border-sky-500 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
          <path
            d="M6 14.5h8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="m8 11.5 4.8-4.8a1.6 1.6 0 1 1 2.2 2.2L10.2 13.7 7.5 14.5 8 11.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-20 w-72 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 px-2 pb-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {messages.sprintBoard.planningMenuTitle}
              </p>
              <p className="text-xs text-slate-500">
                {messages.sprintBoard.planningMenuDescription}
              </p>
            </div>
            <button
              type="button"
              disabled={disabled || isSaving || (!storyPoints && !estimate)}
              onClick={() => {
                void persist(null, null);
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-rose-200 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {messages.common.clear}
            </button>
          </div>

          <div className="grid gap-3 px-2">
            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">{messages.dashboard.storyPoint}</span>
              <input
                type="number"
                min={1}
                max={100}
                value={draftStoryPoints}
                onChange={(event) => setDraftStoryPoints(event.target.value)}
                disabled={disabled || isSaving}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                placeholder={messages.dashboard.storyPoint}
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">{messages.dashboard.estimate}</span>
              <input
                value={draftEstimate}
                onChange={(event) => setDraftEstimate(event.target.value)}
                disabled={disabled || isSaving}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                placeholder={messages.common.estimatePlaceholder}
                maxLength={60}
              />
            </label>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 px-2 pt-3">
            <p className="text-xs text-slate-500">
              {draftStoryPoints || draftEstimate
                ? messages.sprintBoard.readyToSavePlanning
                : messages.sprintBoard.noPlanYet}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setDraftStoryPoints(storyPoints ? String(storyPoints) : "");
                  setDraftEstimate(estimate ?? "");
                  setIsOpen(false);
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {messages.common.cancel}
              </button>
              <button
                type="button"
                disabled={disabled || isSaving}
                onClick={() => {
                  void persist(
                    parseStoryPointsInput(draftStoryPoints),
                    draftEstimate.trim() ? draftEstimate.trim() : null,
                  );
                }}
                className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? `${messages.common.save}...` : messages.common.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function sortTasks(tasks: DashboardTask[]) {
  return [...tasks].sort((left, right) => {
    if (left.position !== right.position) {
      return left.position - right.position;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function SprintSummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`rounded-[1.8rem] border border-white/50 px-5 py-5 shadow-sm ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function KanbanAssigneePicker({
  users,
  selectedIds,
  disabled,
  onSave,
}: {
  users: AppUserSummary[];
  selectedIds: number[];
  disabled: boolean;
  onSave: (nextIds: number[]) => Promise<void>;
}) {
  const { locale, messages } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draftIds, setDraftIds] = useState(selectedIds);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredUsers = users.filter((user) => {
    const haystack = `${displayName(user, messages.common.unassigned)} ${user.email}`.toLowerCase();
    return haystack.includes(searchTerm.trim().toLowerCase());
  });

  useEffect(() => {
    if (!isOpen) {
      setDraftIds(selectedIds);
      setSearchTerm("");
    }
  }, [isOpen, selectedIds]);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

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
    setDraftIds((current) =>
      current.includes(userId)
        ? current.filter((selectedId) => selectedId !== userId)
        : [...current, userId],
    );
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      await onSave(draftIds);
      setIsOpen(false);
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label={isOpen ? messages.comments.hide : messages.comments.show}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-600 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-45" : ""}`}
        >
          <path
            d="M10 4.5v11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4.5 10h11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-20 w-72 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 px-2 pb-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {messages.sprintBoard.assigneeMenuTitle}
              </p>
              <p className="text-xs text-slate-500">
                {messages.sprintBoard.assigneeMenuDescription}
              </p>
            </div>
            <button
              type="button"
              disabled={disabled || isSaving || draftIds.length === 0}
              onClick={() => setDraftIds([])}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-rose-200 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {messages.common.clear}
            </button>
          </div>

          <div className="mb-3 px-2">
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={messages.common.searchUser}
              disabled={disabled || isSaving}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="grid max-h-60 gap-2 overflow-y-auto pr-1">
            {filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                {messages.common.noUserFound}
              </div>
            ) : null}

            {filteredUsers.map((user) => {
              const isSelected = draftIds.includes(user.id);

              return (
                <button
                  key={user.id}
                  type="button"
                  disabled={disabled || isSaving}
                  onClick={() => toggleUser(user.id)}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    isSelected
                      ? "border-teal-500 bg-teal-50 text-teal-900"
                      : "border-slate-200 bg-white text-slate-700"
                  } ${(disabled || isSaving) ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-teal-400 hover:bg-teal-50/50"}`}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{displayName(user, messages.common.unassigned)}</p>
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
              {draftIds.length === 0
                ? messages.dashboard.noMemberSelectedYet
                : formatCountLabel(
                    draftIds.length,
                    messages.dashboard.selectedMembers,
                    messages.dashboard.selectedMembersPlural,
                    locale,
                  )}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setDraftIds(selectedIds);
                  setIsOpen(false);
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {messages.common.cancel}
              </button>
              <button
                type="button"
                disabled={disabled || isSaving}
                onClick={() => {
                  void handleSave();
                }}
                className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? `${messages.common.save}...` : messages.common.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KanbanCard({
  task,
  currentUser,
  users,
  canDrag,
  canAssign,
  isPending,
  onSaveAssignees,
  onSavePlanning,
}: {
  task: DashboardTask;
  currentUser: AppUserSummary;
  users: AppUserSummary[];
  canDrag: boolean;
  canAssign: boolean;
  isPending: boolean;
  onSaveAssignees: (taskId: number, assigneeIds: number[]) => Promise<void>;
  onSavePlanning: (
    taskId: number,
    planning: { storyPoints: number | null; estimate: string | null },
  ) => Promise<void>;
}) {
  const { messages } = useI18n();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    disabled: !canDrag || isPending,
    data: {
      taskId: task.id,
      status: task.status,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="rounded-[1.6rem] border border-[var(--border)] bg-white p-4 shadow-[0_14px_30px_rgba(19,33,24,0.08)] transition"
    >
      <KanbanCardBody
        task={task}
        currentUser={currentUser}
        users={users}
        canAssign={canAssign}
        isPending={isPending}
        onSaveAssignees={onSaveAssignees}
        onSavePlanning={onSavePlanning}
        dragHandle={
          canDrag ? (
            <button
              type="button"
              {...attributes}
              {...listeners}
              disabled={isPending}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:border-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60 touch-none"
            >
              {messages.sprintBoard.drag}
            </button>
          ) : null
        }
      />
    </article>
  );
}

function KanbanCardBody({
  task,
  currentUser,
  users,
  canAssign,
  isPending,
  onSaveAssignees,
  onSavePlanning,
  dragHandle,
  showComments = true,
  showAssignmentControls = true,
  showPlanningControls = true,
}: {
  task: DashboardTask;
  currentUser: AppUserSummary;
  users: AppUserSummary[];
  canAssign: boolean;
  isPending: boolean;
  onSaveAssignees: (taskId: number, assigneeIds: number[]) => Promise<void>;
  onSavePlanning: (
    taskId: number,
    planning: { storyPoints: number | null; estimate: string | null },
  ) => Promise<void>;
  dragHandle?: React.ReactNode;
  showComments?: boolean;
  showAssignmentControls?: boolean;
  showPlanningControls?: boolean;
}) {
  const { locale, messages } = useI18n();
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {messages.common.task} #{task.id}
          </p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {getTaskStatusLabel(task.status, messages)}
          </span>
          {dragHandle}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {task.description || messages.common.noDescription}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <TaskPlanningBadges storyPoints={task.storyPoints} estimate={task.estimate} />

        {showPlanningControls && canAssign ? (
          <KanbanPlanningEditor
            storyPoints={task.storyPoints}
            estimate={task.estimate}
            disabled={isPending}
            onSave={(planning) => onSavePlanning(task.id, planning)}
          />
        ) : null}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {messages.common.assignees}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <AssigneeAvatars
              users={task.assignees}
              emptyLabel={messages.common.unassigned}
              removeLabel={messages.common.remove}
              disabled={isPending}
              onRemove={
                canAssign
                  ? (userId) => {
                      void onSaveAssignees(
                        task.id,
                        task.assignees
                          .filter((assignee) => assignee.id !== userId)
                          .map((assignee) => assignee.id),
                      ).catch(() => {});
                    }
                  : undefined
              }
            />

            {showAssignmentControls && canAssign && users.length > 0 ? (
              <KanbanAssigneePicker
                users={users}
                selectedIds={task.assignees.map((assignee) => assignee.id)}
                disabled={isPending}
                onSave={(assigneeIds) => onSaveAssignees(task.id, assigneeIds)}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="rounded-full bg-slate-100 px-3 py-2">
          {messages.common.creator}: {displayName(task.creator, messages.common.unassigned)}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-2">
          {task.assignees.length === 0
            ? messages.common.noAssigneeYet
            : formatCountLabel(
                task.assignees.length,
                messages.common.assignee,
                messages.common.assignees,
                locale,
              )}
        </span>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {messages.common.updated} {formatStamp(task.updatedAt, locale)}
      </p>

      {showComments ? <TaskComments task={task} currentUser={currentUser} compact /> : null}
    </>
  );
}

function KanbanColumn({
  status,
  tasks,
  currentUser,
  users,
  isPending,
  onSaveAssignees,
  onSavePlanning,
}: {
  status: AppTaskStatus;
  tasks: DashboardTask[];
  currentUser: AppUserSummary;
  users: AppUserSummary[];
  isPending: boolean;
  onSaveAssignees: (taskId: number, assigneeIds: number[]) => Promise<void>;
  onSavePlanning: (
    taskId: number,
    planning: { storyPoints: number | null; estimate: string | null },
  ) => Promise<void>;
}) {
  const { locale, messages } = useI18n();
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <section
      ref={setNodeRef}
      className={`rounded-[2rem] border border-[var(--border)] p-5 transition ${
        isOver ? "bg-teal-50 shadow-[inset_0_0_0_1px_rgba(13,148,136,0.25)]" : "bg-[var(--panel)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {messages.sprintBoard.column}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {getTaskStatusLabel(status, messages)}
          </h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          {formatCountLabel(tasks.length, messages.common.task, messages.common.tasks, locale)}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {tasks.length === 0 ? (
          <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
            {messages.sprintBoard.dropTaskHere}
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={`${task.id}-${task.updatedAt}`}
              task={task}
              currentUser={currentUser}
              users={users}
              canDrag={
                currentUser.role === "MANAGER" ||
                task.assignees.some((assignee) => assignee.id === currentUser.id)
              }
              canAssign={currentUser.role === "MANAGER"}
              isPending={isPending}
              onSaveAssignees={onSaveAssignees}
              onSavePlanning={onSavePlanning}
            />
          ))
        )}
      </div>
    </section>
  );
}

export function SprintBoard({
  currentUser,
  users,
  sprint,
  tasks,
  backlogTasks,
}: SprintBoardProps) {
  const router = useRouter();
  const { messages } = useI18n();
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));
  const [boardTasks, setBoardTasks] = useState(tasks);
  const [availableBacklogTasks, setAvailableBacklogTasks] = useState(backlogTasks);
  const [selectedBacklogTaskId, setSelectedBacklogTaskId] = useState(
    backlogTasks[0] ? String(backlogTasks[0].id) : "",
  );
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const boardCounts = TASK_STATUSES.reduce<Record<AppTaskStatus, number>>((accumulator, status) => {
    accumulator[status] = boardTasks.filter((task) => task.status === status).length;
    return accumulator;
  }, {} as Record<AppTaskStatus, number>);

  const columns = TASK_STATUSES.map((status) => ({
    status,
    tasks: sortTasks(boardTasks.filter((task) => task.status === status)),
  }));

  const activeTask = activeTaskId
    ? boardTasks.find((task) => task.id === activeTaskId) ?? null
    : null;

  function refreshBoard(message: string) {
    setFeedback(message);
    setError(null);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleAddBacklogTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedBacklogTaskId) {
      setError(messages.sprintBoard.chooseBacklogTask);
      return;
    }

    const selectedTask = availableBacklogTasks.find(
      (task) => task.id === Number(selectedBacklogTaskId),
    );

    if (!selectedTask) {
      setError(messages.sprintBoard.backlogTaskNotFound);
      return;
    }

    const previousBoardTasks = boardTasks;
    const previousBacklogTasks = availableBacklogTasks;
    const now = new Date().toISOString();

    const optimisticTask: DashboardTask = {
      ...selectedTask,
      sprint: {
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
      },
      status: "TODO",
      updatedAt: now,
      position: boardCounts.TODO,
    };

    setBoardTasks((current) => [...current, optimisticTask]);
    setAvailableBacklogTasks((current) => current.filter((task) => task.id !== selectedTask.id));
    setSelectedBacklogTaskId((current) => {
      if (current !== String(selectedTask.id)) {
        return current;
      }

      const nextTask = previousBacklogTasks.find((task) => task.id !== selectedTask.id);
      return nextTask ? String(nextTask.id) : "";
    });

    try {
      await sendJson(apiRoutes.task(selectedTask.id), {
        method: "PATCH",
        body: {
          title: selectedTask.title,
          description: selectedTask.description,
          storyPoints: selectedTask.storyPoints,
          estimate: selectedTask.estimate,
          assigneeIds: selectedTask.assignees.map((assignee) => assignee.id),
          sprintId: sprint.id,
          status: selectedTask.status,
        },
      });

      refreshBoard(messages.sprintBoard.movedIntoSprint);
    } catch (caughtError) {
      setBoardTasks(previousBoardTasks);
      setAvailableBacklogTasks(previousBacklogTasks);
      setFeedback(null);
      setError(
        getApiErrorMessage(
          caughtError,
          messages.sprintBoard.addTaskFailed,
          messages.common.networkError,
        ),
      );
    }
  }

  async function handleAssigneeSave(taskId: number, assigneeIds: number[]) {
    setError(null);

    const currentTask = boardTasks.find((task) => task.id === taskId);

    if (!currentTask) {
      return;
    }

    const previousTasks = boardTasks;
    const now = new Date().toISOString();
    const nextAssignees = users.filter((user) => assigneeIds.includes(user.id));

    setBoardTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              assignees: nextAssignees,
              updatedAt: now,
            }
          : task,
      ),
    );

    try {
      await sendJson(apiRoutes.task(taskId), {
        method: "PATCH",
        body: {
          title: currentTask.title,
          description: currentTask.description,
          storyPoints: currentTask.storyPoints,
          estimate: currentTask.estimate,
          assigneeIds,
          sprintId: sprint.id,
          status: currentTask.status,
        },
      });

      refreshBoard(`${messages.sprintBoard.assigneesUpdated} "${currentTask.title}".`);
    } catch (caughtError) {
      setBoardTasks(previousTasks);
      setFeedback(null);
      setError(
        getApiErrorMessage(
          caughtError,
          messages.sprintBoard.assigneeUpdateFailed,
          messages.common.networkError,
        ),
      );
      throw caughtError;
    }
  }

  async function handlePlanningSave(
    taskId: number,
    planning: { storyPoints: number | null; estimate: string | null },
  ) {
    setError(null);

    const currentTask = boardTasks.find((task) => task.id === taskId);

    if (!currentTask) {
      return;
    }

    const previousTasks = boardTasks;
    const now = new Date().toISOString();

    setBoardTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              storyPoints: planning.storyPoints,
              estimate: planning.estimate,
              updatedAt: now,
            }
          : task,
      ),
    );

    try {
      await sendJson(apiRoutes.task(taskId), {
        method: "PATCH",
        body: {
          title: currentTask.title,
          description: currentTask.description,
          storyPoints: planning.storyPoints,
          estimate: planning.estimate,
          assigneeIds: currentTask.assignees.map((assignee) => assignee.id),
          sprintId: sprint.id,
          status: currentTask.status,
        },
      });

      refreshBoard(`${messages.sprintBoard.planningUpdated} "${currentTask.title}".`);
    } catch (caughtError) {
      setBoardTasks(previousTasks);
      setFeedback(null);
      setError(
        getApiErrorMessage(
          caughtError,
          messages.sprintBoard.planningUpdateFailed,
          messages.common.networkError,
        ),
      );
      throw caughtError;
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const taskId = event.active.data.current?.taskId as number | undefined;
    setActiveTaskId(taskId ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null);
    setError(null);

    const taskId = event.active.data.current?.taskId as number | undefined;
    const sourceStatus = event.active.data.current?.status as AppTaskStatus | undefined;
    const targetStatus = event.over?.id as AppTaskStatus | undefined;

    if (!taskId || !sourceStatus || !targetStatus || sourceStatus === targetStatus) {
      return;
    }

    const movingTask = boardTasks.find((task) => task.id === taskId);

    if (!movingTask) {
      return;
    }

    const previousTasks = boardTasks;
    const nextPosition = boardTasks.filter((task) => task.status === targetStatus).length;
    const now = new Date().toISOString();

    setBoardTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: targetStatus,
              position: nextPosition,
              updatedAt: now,
            }
          : task,
      ),
    );

    try {
      await sendJson(apiRoutes.taskStatus(taskId), {
        method: "PATCH",
        body: {
          status: targetStatus,
        },
      });

      refreshBoard(
        `${messages.sprintBoard.taskMovedTo} ${getTaskStatusLabel(targetStatus, messages)}.`,
      );
    } catch (caughtError) {
      setBoardTasks(previousTasks);
      setFeedback(null);
      setError(
        getApiErrorMessage(
          caughtError,
          messages.sprintBoard.taskMoveFailed,
          messages.common.networkError,
        ),
      );
    }
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[2.4rem] border border-[var(--border)] bg-[linear-gradient(135deg,#dbeafe_0%,#f8fafc_38%,#dcfce7_100%)] p-8 shadow-[0_28px_80px_rgba(19,33,24,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-800">
                {messages.sprintBoard.eyebrow}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {sprint.name}
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-700">
                {sprint.goal || messages.dashboard.noSprintGoal}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                  {getSprintStatusLabel(sprint.status, messages)}
                </span>
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                  {messages.sprintBoard.viewer}: {getRoleLabel(currentUser.role, messages)}
                </span>
                <Link
                  href="/dashboard"
                  className="rounded-full bg-white px-4 py-2 font-medium text-teal-800 shadow-sm"
                >
                  {messages.common.backToDashboard}
                </Link>
              </div>
            </div>
            <LogoutButton />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <SprintSummaryCard
              label={messages.dashboard.todo}
              value={boardCounts.TODO}
              tone="bg-white/80"
            />
            <SprintSummaryCard
              label={messages.dashboard.inProgress}
              value={boardCounts.IN_PROGRESS}
              tone="bg-white/80"
            />
            <SprintSummaryCard
              label={messages.dashboard.complete}
              value={boardCounts.COMPLETE}
              tone="bg-white/80"
            />
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
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(19,33,24,0.08)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {messages.sprintBoard.planningEyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {messages.sprintBoard.planningTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {messages.sprintBoard.planningDescription}
                </p>
              </div>

              <form onSubmit={handleAddBacklogTask} className="flex flex-wrap gap-3">
                <select
                  value={selectedBacklogTaskId}
                  onChange={(event) => setSelectedBacklogTaskId(event.target.value)}
                  className="min-w-72 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-600"
                  disabled={isPending || availableBacklogTasks.length === 0}
                >
                  {availableBacklogTasks.length === 0 ? (
                    <option value="">{messages.sprintBoard.noBacklogTasksAvailable}</option>
                  ) : null}
                  {availableBacklogTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} - {displayAssigneeNames(task.assignees, messages.common.unassigned)}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={isPending || availableBacklogTasks.length === 0}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? messages.common.working : messages.sprintBoard.addToSprint}
                </button>
              </form>
            </div>
          </section>
        ) : null}

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={(event) => {
            void handleDragEnd(event);
          }}
        >
          <section className="grid gap-5 xl:grid-cols-3">
            {columns.map((column) => (
              <KanbanColumn
                key={column.status}
                status={column.status}
                tasks={column.tasks}
                currentUser={currentUser}
                users={users}
                isPending={isPending}
                onSaveAssignees={handleAssigneeSave}
                onSavePlanning={handlePlanningSave}
              />
            ))}
          </section>

          <DragOverlay>
            {activeTask ? (
              <div className="w-[min(100vw-2rem,22rem)] rounded-[1.6rem] border border-[var(--border)] bg-white p-4 shadow-[0_18px_45px_rgba(19,33,24,0.16)]">
                <KanbanCardBody
                  task={activeTask}
                  currentUser={currentUser}
                  users={[]}
                  canAssign={false}
                  isPending={false}
                  onSaveAssignees={async () => {}}
                  onSavePlanning={async () => {}}
                  showComments={false}
                  showAssignmentControls={false}
                  showPlanningControls={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </main>
  );
}
