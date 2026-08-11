/**
 * Seeds the database with the content shown in the design.
 *
 *   npm run db:seed
 *
 * Idempotent: every run clears the collections first, so re-running gives a
 * clean, predictable dataset rather than duplicates.
 */
import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { UserSchema } from './schemas/user.schema';
import { ProjectSchema } from './schemas/project.schema';
import { TaskSchema } from './schemas/task.schema';
import { CommentSchema } from './schemas/comment.schema';
import { ActivitySchema } from './schemas/activity.schema';

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
      {
        title: 'Write API Documentation',
        priority: 'high',
        member: 'Admin',
        due: '2026-07-29',
        labels: ['Deployment'],
      },
      {
        title: 'Implement Search Function',
        priority: 'medium',
        member: 'Admin',
        due: '2026-07-29',
        labels: ['Deployment'],
      },
      {
        title: 'Deploy to Production',
        priority: 'high',
        member: 'Admin',
        due: '2026-07-29',
        labels: ['Deployment'],
      },
    ],
  },
  {
    status: 'Doing',
    tasks: [
      {
        title: 'Code Review Completed',
        priority: 'medium',
        member: 'Admin',
        due: '2026-07-29',
        labels: ['Deployment'],
      },
      {
        title: 'Design Mockups Finalized',
        priority: 'high',
        member: 'Admin',
        due: '2026-07-29',
        labels: ['Deployment'],
      },
    ],
  },
  {
    status: 'Completed',
    tasks: [
      {
        title: 'Feature Testing Passed',
        priority: 'low',
        member: 'QA Team',
        due: '2026-07-30',
        labels: ['Testing', 'Passed'],
      },
      {
        title: 'UI Design Updated',
        priority: 'medium',
        member: 'Designer',
        due: '2026-07-31',
        labels: ['Design', 'Updated'],
      },
      {
        title: 'Security Audit Scheduled',
        priority: 'urgent',
        member: 'Security',
        due: '2026-08-01',
        labels: ['Audit', 'Scheduled'],
      },
    ],
  },
  {
    status: 'On Hold',
    tasks: [
      {
        title: 'UI Review Pending',
        priority: 'medium',
        member: 'Designer',
        due: '2026-08-02',
        labels: ['Review'],
      },
      {
        title: 'Backend Integration',
        priority: 'high',
        member: 'Dev Team',
        due: '2026-08-03',
        labels: ['Development'],
      },
      {
        title: 'User Feedback Review',
        priority: 'low',
        member: 'Product',
        due: '2026-08-04',
        labels: ['Research'],
      },
      {
        title: 'Performance Tuning',
        priority: 'medium',
        member: 'Engineering',
        due: '2026-08-05',
        labels: ['Optimization'],
      },
    ],
  },
];

const PROJECTS = [
  {
    name: 'Design Homepage',
    priority: 'high',
    lead: 'Dexter',
    due: '2026-09-12',
  },
  {
    name: 'Develop Login Feature',
    priority: 'low',
    lead: 'CN',
    due: '2026-09-15',
  },
  {
    name: 'Test Payment Gateway',
    priority: 'medium',
    lead: null,
    due: '2026-09-18',
  },
];

const MEMBER_NAMES = [
  'Dexter',
  'CN',
  'Admin',
  'Designer',
  'QA Team',
  'Security',
  'Dev Team',
  'Product',
  'Engineering',
  'Ankit Dutta',
];

export async function seed(uri: string) {
  await mongoose.connect(uri);

  const User = mongoose.model('User', UserSchema);
  const Project = mongoose.model('Project', ProjectSchema);
  const Task = mongoose.model('Task', TaskSchema);
  const Comment = mongoose.model('Comment', CommentSchema);
  const Activity = mongoose.model('Activity', ActivitySchema);

  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
    Activity.deleteMany({}),
  ]);

  const users = new Map<string, Types.ObjectId>();
  for (const name of MEMBER_NAMES) {
    const user = await User.create({
      name,
      // Members shown without a photo in the design fall back to initials.
      avatar: name === 'CN' ? null : AVATAR,
      // Left undefined (not null) so the partial unique index skips it.
      email: name === 'Dexter' ? 'dexter@gmail.com' : undefined,
      title: name === 'Dexter' ? 'Designer' : null,
      username: name === 'Dexter' ? 'Dexuser' : null,
    });
    users.set(name, user._id);
  }

  const projects = new Map<string, Types.ObjectId>();
  for (const entry of PROJECTS) {
    const project = await Project.create({
      name: entry.name,
      priority: entry.priority,
      dueDate: new Date(entry.due),
      lead: entry.lead ? users.get(entry.lead) : null,
    });
    projects.set(entry.name, project._id);
  }

  const firstProjectId = projects.get('Design Homepage');

  for (const column of BOARD) {
    for (const [index, entry] of column.tasks.entries()) {
      const task = await Task.create({
        title: entry.title,
        description:
          entry.title === 'Write API Documentation'
            ? 'Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.'
            : null,
        status: column.status,
        priority: entry.priority,
        dueDate: new Date(entry.due),
        position: index,
        project: firstProjectId,
        reporter: users.get('Dexter'),
        assignees: [users.get(entry.member)!],
        labels: entry.labels,
      });

      // The detail screen's reference task gets subtasks, a comment and activity.
      if (entry.title === 'Write API Documentation') {
        await Task.updateOne(
          { _id: task._id },
          {
            $set: {
              labels: [
                'Research',
                'Design',
                'Development',
                'Testing',
                'Deployment',
              ],
            },
          },
        );

        const subtasks = [
          {
            title: 'Subtask 1',
            priority: 'high',
            member: 'Dexter',
            due: '2026-09-12',
          },
          {
            title: 'Subtask 2',
            priority: 'low',
            member: 'CN',
            due: '2026-09-15',
          },
          {
            title: 'Subtask 3',
            priority: 'medium',
            member: null,
            due: '2026-09-18',
          },
        ];

        for (const [i, sub] of subtasks.entries()) {
          await Task.create({
            title: sub.title,
            status: 'To Do',
            priority: sub.priority,
            dueDate: new Date(sub.due),
            position: i,
            parent: task._id,
            project: firstProjectId,
            assignees: sub.member ? [users.get(sub.member)!] : [],
          });
        }

        await Comment.create({
          body: 'dsds',
          task: task._id,
          author: users.get('Ankit Dutta'),
        });

        await Activity.insertMany([
          {
            task: task._id,
            actor: users.get('Dexter'),
            kind: 'priority_changed',
            field: 'priority',
            fromValue: 'none',
            toValue: 'urgent',
          },
          { task: task._id, actor: users.get('Dexter'), kind: 'update_posted' },
        ]);
      }
    }
  }

  const [userCount, projectCount, taskCount] = await Promise.all([
    User.countDocuments(),
    Project.countDocuments(),
    Task.countDocuments(),
  ]);

  return { users: userCount, projects: projectCount, tasks: taskCount };
}

// Run directly (npm run db:seed) rather than when imported by a test.
if (require.main === module) {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env first.');
    process.exit(1);
  }

  seed(uri)
    .then((counts) => {
      console.log(
        `Seeded ${counts.users} users, ${counts.projects} projects, ${counts.tasks} tasks.`,
      );
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => void mongoose.disconnect());
}
