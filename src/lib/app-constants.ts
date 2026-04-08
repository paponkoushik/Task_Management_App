export const USER_ROLES = ["MANAGER", "MEMBER"] as const;
export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "COMPLETE"] as const;
export const SPRINT_STATUSES = ["ACTIVE", "COMPLETED"] as const;

export type AppUserRole = (typeof USER_ROLES)[number];
export type AppTaskStatus = (typeof TASK_STATUSES)[number];
export type AppSprintStatus = (typeof SPRINT_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<AppTaskStatus, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
};

export const ROLE_LABELS: Record<AppUserRole, string> = {
  MANAGER: "Manager",
  MEMBER: "Member",
};

export const SPRINT_STATUS_LABELS: Record<AppSprintStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
};
