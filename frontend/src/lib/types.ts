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

/** Relative due-date buckets offered by the Due Date filter. */
export type DueBucket = "overdue" | "today" | "week" | "month" | "none";

/**
 * Every filter axis the Filter menu exposes. Multi-select axes are arrays so a
 * user can hold several values at once; `due` is single-select because the
 * buckets overlap and combining them reads as ambiguous.
 */
export type Filters = {
  status: string[];
  priority: Priority[];
  memberIds: string[];
  labels: string[];
  reporterIds: string[];
  teams: string[];
  due: DueBucket | null;
};

export const EMPTY_FILTERS: Filters = {
  status: [],
  priority: [],
  memberIds: [],
  labels: [],
  reporterIds: [],
  teams: [],
  due: null,
};

/** Total number of active constraints — drives the toolbar's count badge. */
export function countFilters(filters: Filters): number {
  return (
    filters.status.length +
    filters.priority.length +
    filters.memberIds.length +
    filters.labels.length +
    filters.reporterIds.length +
    filters.teams.length +
    (filters.due ? 1 : 0)
  );
}
