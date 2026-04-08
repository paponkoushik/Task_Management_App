"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage, requestJson } from "@/lib/api-client";
import { apiRoutes } from "@/lib/api-routes";
import { formatDateTime } from "@/lib/i18n";
import { useI18n } from "@/app/_components/i18n-provider";
import type { AppUserSummary, DashboardTask, TaskComment } from "@/types/task-orbit";

type TaskCommentsProps = {
  task: Pick<DashboardTask, "id" | "creator" | "assignees" | "comments">;
  currentUser: AppUserSummary;
  compact?: boolean;
};

type LocalTaskComment = TaskComment & {
  optimistic?: boolean;
};

function displayName(user: AppUserSummary) {
  return user.name?.trim() || user.email;
}

export function TaskComments({
  task,
  currentUser,
  compact = false,
}: TaskCommentsProps) {
  const router = useRouter();
  const { locale, messages } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<LocalTaskComment[]>(task.comments);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canComment =
    currentUser.id === task.creator.id ||
    task.assignees.some((assignee) => assignee.id === currentUser.id);
  const latestComment = comments.at(-1);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsOpen(true);

    const trimmedBody = body.trim();

    if (!trimmedBody) {
      setError(messages.comments.commentRequired);
      return;
    }

    const optimisticId = -Date.now();
    const optimisticComment: LocalTaskComment = {
      id: optimisticId,
      body: trimmedBody,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: currentUser,
      optimistic: true,
    };

    setComments((current) => [...current, optimisticComment]);
    setBody("");

    try {
      const { response, payload } = await requestJson<{
        error?: string;
        comment?: TaskComment;
      }>(apiRoutes.taskComments(task.id), {
        method: "POST",
        body: {
          body: trimmedBody,
        },
      });

      if (!response.ok) {
        setComments((current) => current.filter((comment) => comment.id !== optimisticId));
        setBody(trimmedBody);
        setError(payload?.error ?? messages.comments.commentPostFailed);
        return;
      }

      const savedComment = payload?.comment;

      if (savedComment) {
        setComments((current) =>
          current.map((comment) => (comment.id === optimisticId ? savedComment : comment)),
        );
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (caughtError) {
      setComments((current) => current.filter((comment) => comment.id !== optimisticId));
      setBody(trimmedBody);
      setError(
        getApiErrorMessage(
          caughtError,
          messages.comments.commentPostFailed,
          messages.common.networkError,
        ),
      );
    }
  }

  return (
    <section
      className={`${compact ? "mt-4 pt-4" : "mt-6 pt-5"} border-t border-slate-200`}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-teal-500 hover:bg-teal-50/60"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
              {messages.comments.title}
            </h4>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              {comments.length}
            </span>
          </div>
          <p className="mt-2 truncate text-xs text-slate-500">
            {latestComment
              ? `${latestComment.author.id === currentUser.id ? messages.comments.you : displayName(latestComment.author)}: ${latestComment.body}`
              : messages.comments.noCommentsYet}
          </p>
        </div>
        <span className="ml-4 shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {isOpen ? messages.comments.hide : messages.comments.show}
        </span>
      </button>

      {isOpen ? (
        <div className="mt-4">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500">{messages.comments.noCommentsYet}</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <article
                  key={comment.id}
                  className={`rounded-2xl bg-slate-100 px-4 py-3 ${comment.optimistic ? "opacity-70" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {comment.author.id === currentUser.id
                        ? messages.comments.you
                        : displayName(comment.author)}
                    </span>
                    <span>
                      {comment.optimistic
                        ? messages.comments.posting
                        : formatDateTime(comment.createdAt, locale)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {comment.body}
                  </p>
                </article>
              ))}
            </div>
          )}

          {canComment ? (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-600 ${
                  compact ? "min-h-24" : "min-h-28"
                }`}
                placeholder={messages.comments.writeComment}
                disabled={isPending}
                maxLength={500}
                required
              />

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>{messages.comments.commentPermission}</span>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? messages.comments.posting : messages.comments.addComment}
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-4 text-xs text-slate-500">
              {messages.comments.commentPermissionOnly}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
