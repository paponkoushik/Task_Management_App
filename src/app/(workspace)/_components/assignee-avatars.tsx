"use client";

import type { AppUserSummary } from "@/types/task-orbit";

const AVATAR_TONES = [
  "bg-slate-950 text-white",
  "bg-teal-600 text-white",
  "bg-amber-500 text-slate-950",
  "bg-sky-600 text-white",
  "bg-emerald-600 text-white",
] as const;

export function displayUserName(user: AppUserSummary | null) {
  if (!user) {
    return "Unassigned";
  }

  return user.name?.trim() || user.email;
}

function getUserInitials(user: AppUserSummary) {
  const source = user.name?.trim() || user.email.split("@")[0] || "U";
  const parts = source
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function AssigneeAvatars({
  users,
  emptyLabel = "Unassigned",
  onRemove,
  disabled = false,
}: {
  users: AppUserSummary[];
  emptyLabel?: string;
  onRemove?: (userId: number) => void;
  disabled?: boolean;
}) {
  if (users.length === 0) {
    return (
      <span
        title={emptyLabel}
        aria-label={emptyLabel}
        className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
      >
        --
      </span>
    );
  }

  return (
    <div className="flex items-center pl-1">
      {users.map((user, index) => (
        <div
          key={user.id}
          title={displayUserName(user)}
          aria-label={displayUserName(user)}
          className="group relative -ml-2 first:ml-0 transition-transform hover:z-20 hover:-translate-y-0.5"
        >
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold uppercase tracking-[0.04em] shadow-sm ${
              AVATAR_TONES[index % AVATAR_TONES.length]
            } ${onRemove ? "cursor-pointer" : ""}`}
          >
            {getUserInitials(user)}
          </span>

          {onRemove ? (
            <button
              type="button"
              aria-label={`Remove ${displayUserName(user)}`}
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                onRemove(user.id);
              }}
              className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white bg-slate-950 text-[10px] font-semibold leading-none text-white opacity-0 shadow-sm transition group-hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              x
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
