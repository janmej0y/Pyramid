import type { DueBucket, Filters, Priority } from "@/lib/types";

/** Midnight today, in local time — the reference point for every due bucket. */
function startOfToday(): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

export function matchesDueBucket(iso: string | undefined, bucket: DueBucket): boolean {
  if (bucket === "none") return !iso;
  if (!iso) return false;

  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return false;
  due.setHours(0, 0, 0, 0);

  const today = startOfToday();
  const days = Math.round((due.getTime() - today) / 86_400_000);

  switch (bucket) {
    case "overdue":
      return days < 0;
    case "today":
      return days === 0;
    case "week":
      // Today through six days out, i.e. the next seven days inclusive.
      return days >= 0 && days <= 6;
    case "month":
      return days >= 0 && days <= 30;
    default:
      return true;
  }
}

export type FilterableItem = {
  status?: string;
  priority: Priority;
  members: { id: string }[];
  labels?: string[];
  dueDate?: string;
  reporterId?: string;
  teams?: string[];
};

/**
 * True when an item satisfies every active axis.
 *
 * Axes combine with AND; values within one axis combine with OR — the
 * convention users expect from Linear/Jira-style filter bars.
 */
export function matchesFilters(item: FilterableItem, filters: Filters): boolean {
  if (filters.status.length && !filters.status.includes(item.status ?? "")) {
    return false;
  }

  if (filters.priority.length && !filters.priority.includes(item.priority)) {
    return false;
  }

  if (filters.memberIds.length) {
    const ids = new Set(item.members.map((member) => member.id));
    if (!filters.memberIds.some((id) => ids.has(id))) return false;
  }

  if (filters.labels.length) {
    const labels = item.labels ?? [];
    if (!filters.labels.some((label) => labels.includes(label))) return false;
  }

  if (filters.reporterIds.length) {
    if (!item.reporterId || !filters.reporterIds.includes(item.reporterId)) return false;
  }

  if (filters.teams.length) {
    const teams = item.teams ?? [];
    if (!filters.teams.some((team) => teams.includes(team))) return false;
  }

  if (filters.due && !matchesDueBucket(item.dueDate, filters.due)) {
    return false;
  }

  return true;
}

/** Immutably toggles a value in one of the array-valued axes. */
export function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export const DUE_BUCKETS: { id: DueBucket; label: string }[] = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Due today" },
  { id: "week", label: "Next 7 days" },
  { id: "month", label: "Next 30 days" },
  { id: "none", label: "No due date" },
];
