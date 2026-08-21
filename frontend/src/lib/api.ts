import type { Priority } from "@/lib/types";

/**
 * Exported because the Google sign-in button navigates the browser straight to
 * `${API_BASE_URL}/auth/google` — a full-page redirect, not a fetch, since the
 * OAuth consent screen cannot be loaded via XHR.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const BASE_URL = API_BASE_URL;

export const TOKEN_STORAGE_KEY = "pyramid.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Private mode — the session simply won't survive a refresh.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Nothing to clean up.
  }
}

/** Error carrying the API's status code so callers can branch on 401 vs 400. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...init } = options;
  const token = auth ? getToken() : null;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      // class-validator returns an array of messages; surface the first.
      message = Array.isArray(body.message)
        ? body.message[0]
        : (body.message ?? message);
    } catch {
      // Non-JSON error body; the status text stands.
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// --- response shapes -------------------------------------------------------

export type ApiMember = { id: string; name: string; avatar: string | null };

/** The full profile returned by /auth/me and /users/me. */
export type ApiProfile = ApiMember & {
  email: string | null;
  title: string | null;
  username: string | null;
  isGuest: boolean;
};

export type ApiTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: Priority;
  dueDate: string | null;
  position: number;
  projectId: string | null;
  parentId: string | null;
  project: { id: string; name: string } | null;
  reporter: ApiMember | null;
  members: ApiMember[];
  labels: string[];
  subtaskCount: number;
};

export type ApiProject = {
  id: string;
  name: string;
  priority: Priority;
  dueDate: string | null;
  lead: ApiMember | null;
  taskCount: number;
};

export type ApiComment = {
  id: string;
  body: string;
  createdAt: string;
  author: ApiMember;
  replies: ApiComment[];
};

type Paginated<T> = { items: T[]; total: number; skip: number; take: number };

// --- endpoints -------------------------------------------------------------

export const api = {
  loginAsGuest: (name?: string) =>
    request<{
      accessToken: string;
      user: { id: string; name: string; avatar: string | null };
    }>("/auth/guest", {
      method: "POST",
      body: JSON.stringify({ name }),
      auth: false,
    }),

  me: () => request<ApiProfile>("/auth/me"),

  listTasks: (
    params: {
      search?: string;
      priority?: Priority;
      projectId?: string;
      parentId?: string;
    } = {},
  ) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.priority) query.set("priority", params.priority);
    if (params.projectId) query.set("projectId", params.projectId);
    if (params.parentId) query.set("parentId", params.parentId);
    const suffix = query.toString();
    return request<Paginated<ApiTask>>(`/tasks${suffix ? `?${suffix}` : ""}`);
  },

  groupedTasks: (projectId?: string) =>
    request<{ status: string; items: ApiTask[] }[]>(
      `/tasks/grouped${projectId ? `?projectId=${projectId}` : ""}`,
    ),

  getTask: (id: string) => request<ApiTask>(`/tasks/${id}`),

  /**
   * `assigneeIds`/`labels` are write-only shapes — the API accepts ids and label
   * names, but returns hydrated `members`/`labels`, so they aren't on ApiTask.
   */
  createTask: (
    body: Partial<Omit<ApiTask, "members" | "reporter" | "project">> & {
      title: string;
      assigneeIds?: string[];
      labels?: string[];
      parentId?: string;
    },
  ) => request<ApiTask>("/tasks", { method: "POST", body: JSON.stringify(body) }),

  updateTask: (id: string, body: Record<string, unknown>) =>
    request<ApiTask>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteTask: (id: string) =>
    request<{ id: string }>(`/tasks/${id}`, { method: "DELETE" }),

  listProjects: (params: { search?: string; priority?: Priority } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.priority) query.set("priority", params.priority);
    const suffix = query.toString();
    return request<Paginated<ApiProject>>(
      `/projects${suffix ? `?${suffix}` : ""}`,
    );
  },

  getProject: (id: string) => request<ApiProject>(`/projects/${id}`),

  listComments: (taskId: string) =>
    request<ApiComment[]>(`/tasks/${taskId}/comments`),

  createComment: (taskId: string, body: string, parentId?: string) =>
    request<ApiComment>(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body, parentId }),
    }),

  updateComment: (id: string, body: string) =>
    request<ApiComment>(`/comments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    }),

  deleteComment: (id: string) =>
    request<{ id: string }>(`/comments/${id}`, { method: "DELETE" }),

  createProject: (body: {
    name: string;
    priority?: Priority;
    dueDate?: string;
    leadId?: string;
  }) =>
    request<ApiProject>("/projects", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateProject: (id: string, body: Record<string, unknown>) =>
    request<ApiProject>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteProject: (id: string) =>
    request<{ id: string }>(`/projects/${id}`, { method: "DELETE" }),

  listUsers: () => request<ApiMember[]>("/users"),

  /** Which sign-in methods this deployment has configured. */
  authProviders: () =>
    request<{ guest: boolean; google: boolean }>("/auth/providers", {
      auth: false,
    }),

  updateProfile: (body: {
    name?: string;
    email?: string;
    title?: string;
    username?: string;
  }) =>
    request<ApiProfile>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
