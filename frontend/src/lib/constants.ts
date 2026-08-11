/**
 * Board columns / list groups. Mirrors the backend's STATUSES constant — the
 * API rejects anything outside this set.
 */
export const STATUS_OPTIONS = ["To Do", "Doing", "Completed", "On Hold"] as const;

export type StatusOption = (typeof STATUS_OPTIONS)[number];
