export type Priority = "urgent" | "high" | "medium" | "low" | "none";

export type Member = {
  id: string;
  name: string;
  avatar?: string | null;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: Priority;
  members: Member[];
  dueDate: string;
  labels: string[];
  projectId?: string;
};

export type Project = {
  id: string;
  name: string;
  priority: Priority;
  lead: Member;
  dueDate: string;
};

export type Comment = {
  id: string;
  author: Member;
  body: string;
  createdAt: string;
};

export type ActivityItem = {
  id: string;
  actor: string;
  text: string;
  meta?: string;
  kind: "priority" | "update";
};

/** Optional columns toggled from the Fields menu. */
export type FieldKey =
  | "priority"
  | "members"
  | "dueDate"
  | "assignees"
  | "labels"
  | "status"
  | "reporter";

export type ViewMode = "list" | "board";
