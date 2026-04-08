export const apiRoutes = {
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  localePreference: "/api/preferences/locale",
  tasks: "/api/tasks",
  sprints: "/api/sprints",
  task: (taskId: number | string) => `/api/tasks/${taskId}`,
  taskStatus: (taskId: number | string) => `/api/tasks/${taskId}/status`,
  taskComments: (taskId: number | string) => `/api/tasks/${taskId}/comments`,
} as const;
