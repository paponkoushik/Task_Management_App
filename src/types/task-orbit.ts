import type { AppSprintStatus, AppTaskStatus, AppUserRole } from "@/lib/app-constants";

export type AppUserSummary = {
  id: number;
  name: string | null;
  email: string;
  role: AppUserRole;
};

export type SprintPreview = {
  id: number;
  name: string;
  status: AppSprintStatus;
};

export type SprintSummary = {
  id: number;
  name: string;
  goal: string | null;
  status: AppSprintStatus;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  counts: Record<AppTaskStatus, number>;
};

export type TaskComment = {
  id: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: AppUserSummary;
};

export type DashboardTask = {
  id: number;
  title: string;
  description: string | null;
  storyPoints: number | null;
  estimate: string | null;
  status: AppTaskStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
  creator: AppUserSummary;
  assignees: AppUserSummary[];
  sprint: SprintPreview | null;
  comments: TaskComment[];
};

export type DashboardViewModel = {
  currentUser: AppUserSummary;
  users: AppUserSummary[];
  sprints: SprintSummary[];
  backlogTasks: DashboardTask[];
  sprintTasks: DashboardTask[];
};

export type SprintBoardViewModel = {
  currentUser: AppUserSummary;
  users: AppUserSummary[];
  sprint: SprintSummary;
  tasks: DashboardTask[];
  backlogTasks: DashboardTask[];
};
