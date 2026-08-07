import type { ActivityItem, Comment, Member, Project, Task } from "@/lib/types";

/**
 * Static seed data mirroring the content shown in the design. When the NestJS
 * API lands this module is the single place that swaps over to fetched data.
 */

/**
 * Inline avatar so the UI has no external image dependency. URL-encoded (not
 * base64) so this module stays isomorphic — `Buffer` is not available in the
 * browser bundle.
 */
const AVATAR =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
      `<defs>` +
      `<radialGradient id="bg" cx="30%" cy="25%" r="95%">` +
      `<stop offset="0%" stop-color="#c084fc"/>` +
      `<stop offset="40%" stop-color="#7c3aed"/>` +
      `<stop offset="100%" stop-color="#1e1b4b"/>` +
      `</radialGradient>` +
      `<radialGradient id="glow" cx="50%" cy="50%" r="50%">` +
      `<stop offset="0%" stop-color="#fbcfe8" stop-opacity=".85"/>` +
      `<stop offset="100%" stop-color="#fbcfe8" stop-opacity="0"/>` +
      `</radialGradient>` +
      `<radialGradient id="teal" cx="50%" cy="50%" r="50%">` +
      `<stop offset="0%" stop-color="#22d3ee" stop-opacity=".7"/>` +
      `<stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>` +
      `</radialGradient>` +
      `</defs>` +
      `<rect width="64" height="64" fill="url(#bg)"/>` +
      `<ellipse cx="21" cy="20" rx="17" ry="15" fill="url(#glow)"/>` +
      `<ellipse cx="45" cy="46" rx="19" ry="16" fill="url(#teal)"/>` +
      `<ellipse cx="40" cy="18" rx="10" ry="8" fill="#f0abfc" opacity=".45"/>` +
      `<ellipse cx="16" cy="48" rx="12" ry="10" fill="#312e81" opacity=".55"/>` +
      `</svg>`,
  );

export const currentUser: Member = {
  id: "u-dexter",
  name: "Dexter",
  avatar: AVATAR,
};

export const members: Record<string, Member> = {
  dexter: currentUser,
  cn: { id: "u-cn", name: "CN", avatar: null },
  admin: { id: "u-admin", name: "Admin", avatar: AVATAR },
  designer: { id: "u-designer", name: "Designer", avatar: AVATAR },
  qa: { id: "u-qa", name: "QA Team", avatar: AVATAR },
  security: { id: "u-security", name: "Security", avatar: AVATAR },
  devTeam: { id: "u-dev", name: "Dev Team", avatar: AVATAR },
  product: { id: "u-product", name: "Product", avatar: AVATAR },
  engineering: { id: "u-eng", name: "Engineering", avatar: AVATAR },
  ankit: { id: "u-ankit", name: "Ankit Dutta", avatar: AVATAR },
};

/** Group order for both the list and board views. */
export const STATUS_GROUPS = ["To Do", "Doing", "Completed", "On Hold"] as const;

/** The three rows repeated under each group in the list view. */
export const listTasks: Task[] = [
  {
    id: "t-1",
    title: "Design Homepage",
    status: "To Do",
    priority: "high",
    members: [members.dexter],
    dueDate: "2026-09-12",
    labels: [],
  },
  {
    id: "t-2",
    title: "Develop Login Feature",
    status: "To Do",
    priority: "low",
    members: [members.cn],
    dueDate: "2026-09-15",
    labels: [],
  },
  {
    id: "t-3",
    title: "Test Payment Gateway",
    status: "To Do",
    priority: "medium",
    members: [],
    dueDate: "2026-09-18",
    labels: [],
  },
];

/** Board columns with the exact cards from the design. */
export const boardColumns: { status: string; tasks: Task[] }[] = [
  {
    status: "To Do",
    tasks: [
      {
        id: "b-1",
        title: "Write API Documentation",
        status: "To Do",
        priority: "high",
        members: [members.admin],
        dueDate: "2026-07-29",
        labels: ["Deployment", "Deployment"],
      },
      {
        id: "b-2",
        title: "Implement Search Function",
        status: "To Do",
        priority: "medium",
        members: [members.admin],
        dueDate: "2026-07-29",
        labels: ["Deployment", "Deployment"],
      },
      {
        id: "b-3",
        title: "Deploy to Production",
        status: "To Do",
        priority: "high",
        members: [members.admin],
        dueDate: "2026-07-29",
        labels: ["Deployment", "Deployment"],
      },
    ],
  },
  {
    status: "Doing",
    tasks: [
      {
        id: "b-4",
        title: "Code Review Completed",
        status: "Doing",
        priority: "medium",
        members: [members.admin],
        dueDate: "2026-07-29",
        labels: ["Deployment", "Deployment"],
      },
      {
        id: "b-5",
        title: "Design Mockups Finalized",
        status: "Doing",
        priority: "high",
        members: [members.admin],
        dueDate: "2026-07-29",
        labels: ["Deployment", "Deployment"],
      },
    ],
  },
  {
    status: "Completed",
    tasks: [
      {
        id: "b-6",
        title: "Feature Testing Passed",
        status: "Completed",
        priority: "low",
        members: [members.qa],
        dueDate: "2026-07-30",
        labels: ["Testing", "Passed"],
      },
      {
        id: "b-7",
        title: "UI Design Updated",
        status: "Completed",
        priority: "medium",
        members: [members.designer],
        dueDate: "2026-07-31",
        labels: ["Design", "Updated"],
      },
      {
        id: "b-8",
        title: "Security Audit Scheduled",
        status: "Completed",
        priority: "urgent",
        members: [members.security],
        dueDate: "2026-08-01",
        labels: ["Audit", "Scheduled"],
      },
    ],
  },
  {
    status: "On Hold",
    tasks: [
      {
        id: "b-9",
        title: "UI Review Pending",
        status: "On Hold",
        priority: "medium",
        members: [members.designer],
        dueDate: "2026-08-02",
        labels: ["Review"],
      },
      {
        id: "b-10",
        title: "Backend Integration",
        status: "On Hold",
        priority: "high",
        members: [members.devTeam],
        dueDate: "2026-08-03",
        labels: ["Development"],
      },
      {
        id: "b-11",
        title: "User Feedback Review",
        status: "On Hold",
        priority: "low",
        members: [members.product],
        dueDate: "2026-08-04",
        labels: ["Research"],
      },
      {
        id: "b-12",
        title: "Performance Tuning",
        status: "On Hold",
        priority: "medium",
        members: [members.engineering],
        dueDate: "2026-08-05",
        labels: ["Optimization"],
      },
    ],
  },
];

export const projects: Project[] = [
  {
    id: "p-1",
    name: "Design Homepage",
    priority: "high",
    lead: members.dexter,
    dueDate: "2026-09-12",
  },
  {
    id: "p-2",
    name: "Develop Login Feature",
    priority: "low",
    lead: members.cn,
    dueDate: "2026-09-15",
  },
  {
    id: "p-3",
    name: "Test Payment Gateway",
    priority: "medium",
    lead: { id: "u-none", name: "", avatar: null },
    dueDate: "2026-09-18",
  },
];

/** Subtask rows inside the task detail view. */
export const subtasks: Task[] = [
  {
    id: "s-1",
    title: "Subtask 1",
    status: "To Do",
    priority: "high",
    members: [members.dexter],
    dueDate: "2026-09-12",
    labels: [],
  },
  {
    id: "s-2",
    title: "Subtask 2",
    status: "To Do",
    priority: "low",
    members: [members.cn],
    dueDate: "2026-09-15",
    labels: [],
  },
  {
    id: "s-3",
    title: "Subtask 3",
    status: "To Do",
    priority: "medium",
    members: [],
    dueDate: "2026-09-18",
    labels: [],
  },
];

export const detailTask = {
  id: "b-1",
  title: "Write API Documentation",
  description:
    "Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.",
  role: "Designer",
  dueDate: "2026-07-31",
  labels: ["Research", "Design", "Development", "Testing", "Deployment"],
  status: "Backlog",
  priority: "high" as const,
};

export const comments: Comment[] = [
  {
    id: "c-1",
    author: members.ankit,
    body: "dsds",
    createdAt: "just now",
  },
];

export const activity: ActivityItem[] = [
  {
    id: "a-1",
    actor: "You",
    text: "changed priority from No priority to Ur...",
    kind: "priority",
  },
  {
    id: "a-2",
    actor: "You",
    text: "posted an update",
    meta: "Aug 2026",
    kind: "update",
  },
];
