import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/prisma/generated/client';

// Prisma 7 ships no bundled query engine — the client talks to the database
// through a driver adapter, which must be supplied explicitly.
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  }),
});

const AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<defs><radialGradient id="bg" cx="30%" cy="25%" r="95%">' +
      '<stop offset="0%" stop-color="#c084fc"/>' +
      '<stop offset="40%" stop-color="#7c3aed"/>' +
      '<stop offset="100%" stop-color="#1e1b4b"/>' +
      '</radialGradient></defs>' +
      '<rect width="64" height="64" fill="url(#bg)"/>' +
      '<ellipse cx="21" cy="20" rx="17" ry="15" fill="#fbcfe8" opacity=".45"/>' +
      '<ellipse cx="45" cy="46" rx="19" ry="16" fill="#22d3ee" opacity=".35"/>' +
      '</svg>',
  );

/** Board columns and their cards, mirroring the design. */
const BOARD: {
  status: string;
  tasks: {
    title: string;
    priority: string;
    member: string;
    due: string;
    labels: string[];
  }[];
}[] = [
  {
    status: 'To Do',
    tasks: [
      { title: 'Write API Documentation', priority: 'high', member: 'Admin', due: '2026-07-29', labels: ['Deployment'] },
      { title: 'Implement Search Function', priority: 'medium', member: 'Admin', due: '2026-07-29', labels: ['Deployment'] },
      { title: 'Deploy to Production', priority: 'high', member: 'Admin', due: '2026-07-29', labels: ['Deployment'] },
    ],
  },
  {
    status: 'Doing',
    tasks: [
      { title: 'Code Review Completed', priority: 'medium', member: 'Admin', due: '2026-07-29', labels: ['Deployment'] },
      { title: 'Design Mockups Finalized', priority: 'high', member: 'Admin', due: '2026-07-29', labels: ['Deployment'] },
    ],
  },
  {
    status: 'Completed',
    tasks: [
      { title: 'Feature Testing Passed', priority: 'low', member: 'QA Team', due: '2026-07-30', labels: ['Testing', 'Passed'] },
      { title: 'UI Design Updated', priority: 'medium', member: 'Designer', due: '2026-07-31', labels: ['Design', 'Updated'] },
      { title: 'Security Audit Scheduled', priority: 'urgent', member: 'Security', due: '2026-08-01', labels: ['Audit', 'Scheduled'] },
    ],
  },
  {
    status: 'On Hold',
    tasks: [
      { title: 'UI Review Pending', priority: 'medium', member: 'Designer', due: '2026-08-02', labels: ['Review'] },
      { title: 'Backend Integration', priority: 'high', member: 'Dev Team', due: '2026-08-03', labels: ['Development'] },
      { title: 'User Feedback Review', priority: 'low', member: 'Product', due: '2026-08-04', labels: ['Research'] },
      { title: 'Performance Tuning', priority: 'medium', member: 'Engineering', due: '2026-08-05', labels: ['Optimization'] },
    ],
  },
];

const PROJECTS = [
  { name: 'Design Homepage', priority: 'high', lead: 'Dexter', due: '2026-09-12' },
  { name: 'Develop Login Feature', priority: 'low', lead: 'CN', due: '2026-09-15' },
  { name: 'Test Payment Gateway', priority: 'medium', lead: null, due: '2026-09-18' },
];

async function main() {
  console.log('Seeding…');

  // Idempotent: wipe in FK-safe order so re-running gives a clean dataset.
  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.label.deleteMany();
  await prisma.user.deleteMany();

  const names = [
    'Dexter', 'CN', 'Admin', 'Designer', 'QA Team',
    'Security', 'Dev Team', 'Product', 'Engineering', 'Ankit Dutta',
  ];

  const users = new Map<string, string>();
  for (const name of names) {
    const user = await prisma.user.create({
      data: {
        name,
        // Members shown without a photo in the design fall back to initials.
        avatar: name === 'CN' ? null : AVATAR,
        email: name === 'Dexter' ? 'dexter@gmail.com' : null,
        title: name === 'Dexter' ? 'Designer' : null,
        username: name === 'Dexter' ? 'Dexuser' : null,
      },
    });
    users.set(name, user.id);
  }

  const projects = new Map<string, string>();
  for (const entry of PROJECTS) {
    const project = await prisma.project.create({
      data: {
        name: entry.name,
        priority: entry.priority,
        dueDate: new Date(entry.due),
        leadId: entry.lead ? users.get(entry.lead) : null,
      },
    });
    projects.set(entry.name, project.id);
  }

  const labelIds = new Map<string, string>();
  async function labelId(name: string) {
    const cached = labelIds.get(name);
    if (cached) return cached;
    const label = await prisma.label.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    labelIds.set(name, label.id);
    return label.id;
  }

  const firstProjectId = projects.get('Design Homepage');

  for (const column of BOARD) {
    for (const [index, entry] of column.tasks.entries()) {
      const task = await prisma.task.create({
        data: {
          title: entry.title,
          description:
            entry.title === 'Write API Documentation'
              ? 'Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.'
              : null,
          status: column.status,
          priority: entry.priority,
          dueDate: new Date(entry.due),
          position: index,
          projectId: firstProjectId,
          reporterId: users.get('Dexter'),
          assignees: { create: [{ userId: users.get(entry.member)! }] },
        },
      });

      for (const name of entry.labels) {
        await prisma.taskLabel.create({
          data: { taskId: task.id, labelId: await labelId(name) },
        });
      }

      // The detail screen's reference task gets subtasks, a comment and activity.
      if (entry.title === 'Write API Documentation') {
        const subtasks = [
          { title: 'Subtask 1', priority: 'high', member: 'Dexter', due: '2026-09-12' },
          { title: 'Subtask 2', priority: 'low', member: 'CN', due: '2026-09-15' },
          { title: 'Subtask 3', priority: 'medium', member: null, due: '2026-09-18' },
        ];

        for (const [i, sub] of subtasks.entries()) {
          await prisma.task.create({
            data: {
              title: sub.title,
              status: 'To Do',
              priority: sub.priority,
              dueDate: new Date(sub.due),
              position: i,
              parentId: task.id,
              projectId: firstProjectId,
              assignees: sub.member
                ? { create: [{ userId: users.get(sub.member)! }] }
                : undefined,
            },
          });
        }

        for (const name of ['Research', 'Design', 'Development', 'Testing']) {
          await prisma.taskLabel.create({
            data: { taskId: task.id, labelId: await labelId(name) },
          });
        }

        await prisma.comment.create({
          data: {
            body: 'dsds',
            taskId: task.id,
            authorId: users.get('Ankit Dutta')!,
          },
        });

        await prisma.activity.createMany({
          data: [
            {
              taskId: task.id,
              actorId: users.get('Dexter')!,
              kind: 'priority_changed',
              field: 'priority',
              fromValue: 'none',
              toValue: 'urgent',
            },
            {
              taskId: task.id,
              actorId: users.get('Dexter')!,
              kind: 'update_posted',
            },
          ],
        });
      }
    }
  }

  const [users_, projects_, tasks_] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.task.count(),
  ]);

  console.log(`Seeded ${users_} users, ${projects_} projects, ${tasks_} tasks.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
