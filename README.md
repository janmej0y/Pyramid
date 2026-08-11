# Pyramid — Task Management System

A full-stack task manager built from the Assessment Task Figma design: kanban
board, grouped list, task details with subtasks and comments, projects, guest
authentication, and a two-axis theme system.

| | |
| --- | --- |
| **Frontend** | Next.js 16.3 (App Router) · React 19 · TypeScript · Tailwind CSS v4 |
| **Backend** | NestJS 11 · TypeScript · Mongoose 9 · MongoDB |
| **Auth** | JWT guest sessions, globally guarded routes |

---

## Table of contents

- [Quick start](#quick-start)
- [Scripts](#scripts)
- [Features](#features)
- [API reference](#api-reference)
- [Architecture](#architecture)
- [Theme system](#theme-system)
- [Responsive behaviour](#responsive-behaviour)
- [Testing](#testing)
- [Design decisions](#design-decisions)
- [Intentional deviations](#intentional-deviations)
- [Deployment notes](#deployment-notes)

---

## Quick start

**Prerequisites:** Node.js 20+, npm, and a MongoDB database.

### 0. Get a MongoDB connection string

**MongoDB Atlas** (free, recommended — and required for any cloud deployment):

1. Create a free M0 cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Database Access** → add a database user with a password
3. **Network Access** → allow your IP (or `0.0.0.0/0` for development)
4. **Connect → Drivers** → copy the string, then insert the database name
   before the `?`:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/pyramid?retryWrites=true&w=majority
```

Or use a **local MongoDB**: `mongodb://localhost:27017/pyramid`.

The app runs as two processes. **Start the backend first**; the frontend calls it
on load.

### 1. Backend → http://localhost:4000/api

```bash
cd backend
npm install
cp .env.example .env        # paste your connection string into DATABASE_URL
npm run db:seed             # loads the design's content
npm run start:dev           # watch mode
```

No migration step — Mongoose creates collections and indexes on first use.

### 2. Frontend → http://localhost:3000

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open **http://localhost:3000** and click **Continue as Guest**.

> **If login fails with _"Could not start a guest session"_** the backend isn't
> running, or it's running on a different origin than the frontend expects. Next
> falls back to port 3001 when 3000 is taken — both are allowed in
> `CORS_ORIGIN` by default.

### Environment variables

**`backend/.env`**

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | — | MongoDB URI; **must start `mongodb://` or `mongodb+srv://`** |
| `JWT_SECRET` | — | Signing key; **must be 16+ characters** |
| `JWT_EXPIRES_IN` | `7d` | Session lifetime |
| `PORT` | `4000` | API port |
| `CORS_ORIGIN` | `localhost:3000,localhost:3001` | Comma-separated allowed origins |

**`frontend/.env.local`**

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | API base URL (include `/api`) |

Config is validated at boot — a missing or too-short `JWT_SECRET` fails
immediately with a clear message rather than at the first login attempt.

---

## Scripts

### Backend

| Command | Does |
| --- | --- |
| `npm run start:dev` | Watch-mode server |
| `npm run start:prod` | Runs built output (`npm run build` first) |
| `npm run build` | `nest build` |
| `npm run lint` | ESLint with `--fix` |
| `npm run db:seed` | Reload seed data (wipes collections and re-inserts) |
| `node test/api-smoke.mjs` | 49 API assertions (needs a running server) |
| `node test/start-memory-db.mjs` | In-memory MongoDB for local testing, no install |

### Frontend

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

---

## Features

### Screens

| Route | Screen |
| --- | --- |
| `/` | Guest login |
| `/tasks` | Tasks — list view, grouped by status |
| `/tasks` → Fields → Board | Tasks — kanban board |
| `/tasks/[id]` | Task detail — properties, subtasks, comments, details panel |
| `/projects` | Projects table |
| `/projects/[id]` | Project-scoped tasks with breadcrumb |
| `/settings` | Settings — Profile / Theme / Color |

### What works

Everything below persists to the API and survives a refresh.

**Tasks**
- Create inline from any column or the toolbar button
- Rename and edit descriptions by clicking them
- Move between statuses, change priority, delete — from the `···` menu on rows and cards
- Search by title (`⌘F` / `Ctrl+F`) and filter by priority
- Toggle columns and switch list/board via the Fields menu

**Task detail**
- Editable title and description
- Status, priority, due date (calendar picker), and member assignment
- Subtasks: add, delete, change priority
- Comments: post, reply, delete — deletion is disabled on others' comments, since the API enforces ownership
- Watch/lock toggles, copy-link, and a collapsible details panel

**Projects** — create, delete, change priority, open a project's own task board.

**Settings** — profile fields save on blur; theme and accent switch live; Leave
Workspace confirms before signing out.

---

## API reference

Base URL `http://localhost:4000/api`. Every route requires
`Authorization: Bearer <token>` except `POST /auth/guest` and `GET /health`.

### Auth

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/guest` | Create a guest session → `{ accessToken, user }` |
| `GET` | `/auth/me` | Resolve the current session |

### Tasks

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/tasks` | List — `search`, `status`, `priority`, `projectId`, `parentId`, `includeSubtasks`, `skip`, `take` |
| `GET` | `/tasks/grouped` | Bucketed by status — `projectId` |
| `POST` | `/tasks` | Create |
| `GET` | `/tasks/:id` | Fetch one |
| `PATCH` | `/tasks/:id` | Update |
| `DELETE` | `/tasks/:id` | Delete (cascades to subtasks and comments) |

### Comments

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/tasks/:taskId/comments` | Thread, with replies nested |
| `POST` | `/tasks/:taskId/comments` | Add a comment or reply (`parentId`) |
| `PATCH` | `/comments/:id` | Edit own comment |
| `DELETE` | `/comments/:id` | Delete own comment |

### Projects, users, health

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/projects` | List — `search`, `priority`, `skip`, `take` |
| `POST` | `/projects` | Create |
| `GET` `PATCH` `DELETE` | `/projects/:id` | Fetch / update / delete |
| `GET` | `/users` | Members for the assignee picker |
| `GET` | `/users/:id` | Fetch one |
| `PATCH` | `/users/me` | Update own profile |
| `GET` | `/health` | Liveness + database connectivity |

### Conventions

**Validation.** A global `ValidationPipe` runs `class-validator` DTOs with
`whitelist` and `forbidNonWhitelisted`, so an unknown or misspelled field is a
`400` rather than a value that silently does nothing. Enum-like fields
(`priority`, `status`) are checked against shared constants.

**Errors.** One envelope for every failure. Unexpected errors are logged in full
server-side but reported generically, so stack traces never reach the browser:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "priority must be one of: urgent, high, medium, low, none",
  "path": "/api/tasks",
  "timestamp": "2026-08-11T00:00:00.000Z"
}
```

**Auth.** `JwtAuthGuard` is registered globally via `APP_GUARD`, so routes are
protected **by default** and opt out explicitly with `@Public()`. A new endpoint
cannot be left unsecured by forgetting a decorator.

**Ownership.** Comment edits and deletes return `403` unless you wrote the
comment.

---

## Architecture

```
Pyramid/
├── backend/
│   ├── src/
│   │   ├── schemas/           Mongoose schemas (User, Project, Task,
│   │   │                      Comment, Activity)
│   │   ├── auth/              guest login, JWT guard, @Public/@CurrentUser
│   │   ├── tasks/             controller · service · DTOs
│   │   ├── projects/          controller · service · DTOs
│   │   ├── comments/          threaded comments, ownership checks
│   │   ├── users/             member list, profile updates
│   │   ├── common/            constants, pagination DTO, exception filter,
│   │   │                      _id → id serializer
│   │   ├── config/            env validation
│   │   ├── health/            liveness + database ping
│   │   └── seed.ts            design content, idempotent
│   └── test/
│       ├── api-smoke.mjs      end-to-end API assertions
│       └── start-memory-db.mjs  in-memory MongoDB for local runs
│
└── frontend/src/
    ├── app/                   routes (App Router)
    ├── components/
    │   ├── ui/                button · avatar · chips · menu · icons · editable-text
    │   ├── layout/            app-shell · sidebar · user-menu · page-toolbar
    │   ├── tasks/             table · board · detail · details-panel · date-picker
    │   │                      · inline-add · row-actions
    │   ├── projects/          list + detail
    │   ├── settings/          profile / theme / colour
    │   ├── auth/              login card, route guard
    │   └── providers/         theme + auth context
    └── lib/                   api client · hooks · types · theme · constants
```

### Data model

Five collections: `users`, `projects`, `tasks`, `comments`, `activities`.

Modelled for MongoDB rather than translated from a relational schema:

- **Assignees and labels are embedded on the task** — arrays of `ObjectId` refs
  and plain strings — instead of the join tables a SQL design would need. Both
  are always read with their task, so embedding avoids extra round trips.
- **Tasks self-reference** for subtasks via a `parent` ref, one level deep,
  enforced in the service layer.
- **Deletes cascade in application code.** MongoDB has no foreign-key cascade,
  so removing a task or project explicitly clears its subtasks, comments and
  activity.
- **Email uses a partial unique index**, not `sparse`. Guests have no email, and
  `sparse` only skips *missing* fields — an explicit `null` still gets indexed,
  so the second guest would collide with the first.

Responses always expose `id`, never `_id`: a small serializer
(`common/serialize.ts`) does that translation in one place, so no Mongo-specific
field names reach the client.

### Reusable components

- **`ui/menu.tsx`** — one popover primitive (`Menu`, `MenuItem`,
  `MenuCheckboxItem`, `MenuSub`) backing the Fields menu, filter menu, user menu,
  row actions, and priority dropdown. Outside-click, Escape, focus restoration,
  and close-on-select live in one place.
- **`tasks/task-table.tsx`** — the grouped table used by the Tasks list, the
  project-scoped list, and the subtasks table.
- **`tasks/inline-add.tsx`** / **`tasks/row-actions.tsx`** — create and
  row-operation affordances shared by tasks, subtasks, and projects.
- **`ui/editable-text.tsx`** — click-to-edit text for titles and descriptions.
- **`layout/page-toolbar.tsx`** — the search / Fields / filter / Add row shared
  by Tasks and Projects.
- **`lib/api.ts`** — single typed API client; attaches the bearer token and
  normalises failures into `ApiError`.

---

## Theme system

Two independent axes, exactly as the design's user menu presents them:

- **Change Theme** → Light · Dark
- **Color Mode** → Amber · Blue · Pink · Rose · Emerald · Black

Both persist to `localStorage` and survive a refresh.

Themes are CSS custom properties scoped to `[data-theme]` and `[data-accent]` on
`<html>`, so switching is one attribute change rather than a React re-render. A
small blocking script in `<head>` applies the stored values **before first
paint** — without it, dark-mode users would see a white flash on every reload.

---

## Responsive behaviour

The Figma file specifies desktop frames only. Tablet and mobile satisfy the
assessment's responsiveness requirement by extending the desktop design rather
than redesigning it:

- **≥ 768px** — desktop layout as designed; the sidebar collapses from the topbar toggle.
- **< 768px** — the sidebar becomes an overlay drawer from the same toggle; table
  rows become stacked cards (a five-column grid at 375px would crush the task
  title to a few characters); toolbar buttons collapse to icons.
- The board scrolls horizontally at every width, keeping card width fixed rather
  than compressing cards.

---

## Testing

**API — 49 assertions.** Start the server, then:

```bash
cd backend
npm run start:dev          # terminal 1
node test/api-smoke.mjs    # terminal 2
```

No MongoDB installed? `node test/start-memory-db.mjs` boots a real MongoDB
in-process and prints a connection string to use as `DATABASE_URL`.

Covers auth enforcement (401 anonymous, 401 malformed token), every validation
rejection, filtering, subtask nesting limits, cascade deletes, comment ownership
(403), and full CRUD on tasks and projects.

**UI.** Interactions were verified in a real browser with Playwright — creating a
task, renaming it, moving it between columns, changing priority, adding subtasks
and comments, editing the profile, and deleting everything — asserting each
change persisted, with no console errors.

**Build and lint** both pass clean across both packages.

---

## Design decisions

- **MongoDB with Mongoose.** `@nestjs/mongoose` is the idiomatic pairing for a
  Nest backend, and a document store deploys anywhere — unlike SQLite, whose
  file is wiped on every restart on an ephemeral host.
- **Guest users are real documents**, not anonymous sessions, so tasks and
  comments hold genuine references and ownership checks work uniformly.
- **Subtasks are a self-reference** rather than a separate collection — they
  carry identical fields, and one level of nesting is enforced in the service.
- **Search uses an escaped, case-insensitive regex.** MongoDB has no `LIKE`, and
  an unescaped user string would otherwise be interpreted as a pattern.
- **`useAsync` instead of a data-fetching library.** The app has a handful of read
  paths; a small hook with request cancellation avoids the dependency.
- **Mutations re-fetch rather than patch local state**, which keeps the list and
  board consistent without duplicating optimistic-update logic per view.
- **Icons are local SVGs**, so there's no icon-library dependency and stroke
  weights stay consistent.

### Mongoose 9 notes

A couple of details differ from older Mongoose tutorials:

- **Nullable fields need an explicit `type`.** `@Prop({ default: null })` on a
  `string | null` property throws `CannotDetermineTypeError` — TypeScript's
  reflection metadata can't describe a union, so `@Prop({ type: String })` is
  required.
- **`FilterQuery` was renamed `QueryFilter`**, and `isValidObjectId()` now
  rejects numbers.
- Malformed ids are checked with `Types.ObjectId.isValid()` before any query, so
  a bad path parameter returns a clean `404` instead of a driver-level cast
  error.

---

## Intentional deviations

Documented per the assessment's requirement to note deviations from the design.

**Reproduced from the design as-is** — these look like mistakes but match the
source:

1. **The Fields menu lists "Members" twice.** Both rows are checked in the
   original. They map to separate keys so neither is a dead control.
2. **The task detail has two "Subtasks" headings** — one above the subtask table,
   one above the comment thread. Kept rather than silently "corrected".

**Filled in where the design was unspecified:**

3. **Creation is inline, not modal.** The design shows a "+ Add Task" row and no
   create dialog, so clicking it turns the row into a text field (Enter saves,
   Escape cancels). New items get a default due date so cards are never missing
   one.
4. **The `···` row menus have no specified contents**, so they expose what the API
   supports: move between statuses, change priority, delete.
5. **The reply box attaches to the most recent comment**, since the design shows
   one shared reply field beneath the thread rather than per-comment replies.
6. **Responsive layouts** are extrapolated from the desktop frames — see above.

**Scoped out, and why:**

7. **"Login with Google" is disabled.** Guest login is the flow the assessment
   requires; wiring OAuth was out of scope.
8. **"Add document or link" is presentational.** Attachments aren't in the data
   model, so the row renders but is inert rather than pretending to save.
9. **Reaction and file-attachment buttons were removed.** Neither is in the API
   schema — leaving them would ship controls that do nothing.

**Technical judgement calls:**

10. **Dates are formatted manually**, not via `Intl`. `en-GB` renders September as
    "Sept" while the design consistently uses three-letter months ("12 Sep 2026").
11. **Avatars are generated SVG gradients.** The design's avatar images aren't
    available as exportable assets, so they're approximated inline. Members
    without a photo fall back to initials (`CN`), as in the design.
12. **Search and priority filters apply client-side** to the already-fetched
    grouped payload, so list and board stay in sync without a refetch. The API
    supports both as query parameters for when the dataset outgrows this.
13. **The coloured frame around each Figma frame** is an artboard border, not a UI
    element, so it isn't reproduced.

**Known limitation:**

14. **Colours, spacing and type sizes were matched from exported screenshots**,
    not Figma dev-mode values (the file requires a login to inspect). They are
    close but not guaranteed pixel-exact.

---

## Deployment notes

Not yet deployed, but MongoDB Atlas means no database migration is needed first —
the same connection string works locally and in production.

When deploying:

1. **Atlas → Network Access** must allow your host's IP. Serverless platforms use
   rotating IPs, so `0.0.0.0/0` is usually required; keep the database user's
   password strong since it becomes the only barrier.
2. Set `CORS_ORIGIN` to the deployed frontend URL, and `NEXT_PUBLIC_API_URL` to
   the deployed API URL (including `/api`).
3. **Use a strong random `JWT_SECRET`** — the committed default is for local
   development only.
4. Run the seed once against the production database if you want the design's
   sample content.

Suggested hosts: Vercel for the frontend, Render or Railway for the API.

---

## Remaining work

- Part 2 of the assessment (the AbleSpace product write-up)
- Deployment to a public URL
