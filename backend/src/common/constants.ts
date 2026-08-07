/**
 * Domain vocabulary shared by DTO validation and the seed script. SQLite has no
 * native enum type, so these are validated at the application boundary instead.
 */

export const PRIORITIES = ['urgent', 'high', 'medium', 'low', 'none'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ['To Do', 'Doing', 'Completed', 'On Hold'] as const;
export type Status = (typeof STATUSES)[number];

export const ACTIVITY_KINDS = ['priority_changed', 'update_posted'] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
