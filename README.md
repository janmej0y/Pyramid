# Pyramid — Task Management System

Full-stack implementation of the Assessment Task Figma design.

**Frontend:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4
**Backend:** NestJS 11 · TypeScript · Prisma 7 · SQLite

---

## Getting started

Two processes: the API on `:4000`, the web app on `:3000`.

```bash
# 1. API
cd backend
npm install
cp .env.example .env          # SQLite needs no external service
npx prisma migrate dev        # create the database
npm run db:seed               # load the design's content
npm run start:dev             # http://localhost:4000/api

# 2. Web app (second terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev                   # http://localhost:3000
```

Open http://localhost:3000 and click **Continue as Guest**.

### Verification

```bash
# backend — 49 assertions against a running API
cd backend && node test/api-smoke.mjs

# both — build + lint
npm run build && npm run lint
```

---

## Screens implemented

| Route | Screen |
| --- | --- |
| `/` | Guest login — "Continue as Guest" / "Login with Google" |
| `/tasks` | Tasks — **List** view, grouped by status (To Do / Doing / Completed / On Hold) |
| `/tasks` → Fields → Board | Tasks — **Board** (kanban) view |
| `/tasks/[id]` | Task detail — properties, labels, subtasks, comments, details panel |
| `/projects` | Projects table |
| `/projects/[id]` | Project-scoped tasks with breadcrumb |
| `/settings` | Settings — Profile / Theme / Color |

Interactive elements from the design: Fields menu (view switch + column toggles),
filter menu with the Priority flyout, inline search with `⌘F`, the priority
dropdown (persists to the API) and date picker on the task detail, and the
sidebar user menu with theme and colour submenus.

---

## API

Base URL `http://localhost:4000/api`. All routes require a bearer token except
`POST /auth/guest` and `GET /health`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/guest` | Create a guest session, returns a JWT |
| `GET` | `/auth/me` | Resolve the current session |
| `GET` | `/tasks` | List tasks — `search`, `status`, `priority`, `projectId`, `parentId`, `skip`, `take` |
| `GET` | `/tasks/grouped` | Tasks bucketed by status (board + grouped list) |
| `GET/POST/PATCH/DELETE` | `/tasks/:id` | Task CRUD |
| `GET/POST` | `/tasks/:taskId/comments` | Task comment thread |
| `PATCH/DELETE` | `/comments/:id` | Edit/delete own comment (403 otherwise) |
| `GET/POST/PATCH/DELETE` | `/projects/:id` | Project CRUD |
| `GET` | `/users` | Members for the assignee picker |
| `PATCH` | `/users/me` | Update own profile |
| `GET` | `/health` | Liveness + database check |

**Validation.** A global `ValidationPipe` runs `class-validator` DTOs with
`whitelist` and `forbidNonWhitelisted`, so unknown fields are a 400 rather than
silently ignored. Enum-like fields (`priority`, `status`) are checked against
shared constants. Environment variables are validated at boot, so a missing
`JWT_SECRET` fails immediately rather than on the first login.

**Errors.** One envelope for every failure:

```json
{ "statusCode": 400, "error": "Bad Request", "message": "priority must be one of: urgent, high, medium, low, none",
  "path": "/api/tasks", "timestamp": "2026-08-08T00:00:00.000Z" }
```

**Auth.** `JwtAuthGuard` is registered globally, so routes are protected by
default and opt out explicitly with `@Public()` — a new endpoint cannot be left
unsecured by omission.

---

## Project structure

```
backend/src/
├── auth/          guest login, JWT guard, @Public / @CurrentUser decorators
├── tasks/         controller · service · DTOs (create/update/query)
├── projects/      controller · service · DTOs
├── comments/      threaded comments with ownership checks
├── users/         member list + profile updates
├── common/        shared constants, pagination DTO, exception filter
├── config/        environment validation
└── prisma/        PrismaService + generated client

frontend/src/
├── app/           routes (App Router)
├── components/
│   ├── ui/        primitives: button, avatar, chips, menu, icons
│   ├── layout/    app shell, sidebar, user menu, page toolbar
│   ├── tasks/     task table, board, detail view, details panel, date picker
│   ├── auth/      login card, route guard
│   └── providers/ theme + auth context
└── lib/           api client, hooks, types, theme config, helpers
```

Reusable pieces worth calling out:

- **`ui/menu.tsx`** — one popover primitive (`Menu`, `MenuItem`, `MenuCheckboxItem`,
  `MenuSub`) backing the Fields menu, filter menu, user menu and priority
  dropdown. Outside-click, Escape and focus restoration live in one place.
- **`tasks/task-table.tsx`** — the grouped table used by the Tasks list, the
  project-scoped list and the subtasks table.
- **`layout/page-toolbar.tsx`** — the search / Fields / filter / Add row shared
  by Tasks and Projects.
- **`lib/api.ts`** — single typed API client; every request attaches the bearer
  token and normalises errors into `ApiError`.

---

## Theme system

Two independent axes, matching the user menu in the design:

- **Change Theme** → Light / Dark
- **Color Mode** → Amber, Blue, Pink, Rose, Emerald, Black

Both persist to `localStorage` and survive a refresh. A blocking script in
`<head>` applies the stored values to `<html>` before first paint, so there is no
flash of the wrong theme on reload. Themes are CSS custom properties on
`[data-theme]` / `[data-accent]`, so switching is one attribute change rather
than a re-render.

---

## Responsive behaviour

The Figma file specifies desktop frames only. Tablet and mobile follow the
assessment's responsiveness requirement, extending the desktop design rather
than redesigning it:

- **≥ 768px** — desktop layout as designed; the sidebar collapses via the topbar toggle.
- **< 768px** — the sidebar becomes an overlay drawer from the same toggle; table
  rows become stacked cards (a 5-column grid at 375px would crush the task
  title); toolbar buttons collapse to icons.
- The board scrolls horizontally at every width, keeping card width fixed.

---

## Intentional deviations

Documented per the assessment's requirement to note deviations.

1. **Fields menu lists "Members" twice.** Reproduced verbatim from the design —
   both rows are checked in the source. They map to separate keys so neither is
   a dead control.
2. **Task detail has two "Subtasks" headings.** Also as designed: one above the
   subtask table, one above the comment thread. Kept rather than "corrected".
3. **Avatars are generated SVG gradients.** The design's avatar images aren't
   available as assets, so they're approximated with an inline gradient. Members
   without a photo fall back to initials (`CN`), as in the design.
4. **Dates are formatted manually**, not via `Intl`. `en-GB` renders September as
   "Sept" while the design uses three-letter months ("12 Sep 2026").
5. **"Login with Google" is non-functional** and rendered disabled. Guest login is
   the flow the assessment requires; wiring OAuth was out of scope.
6. **The coloured frame around each Figma frame** is an artboard border, not a UI
   element, so it isn't reproduced.
7. **Search and priority filtering are applied client-side** on the already
   fetched group payload, so list and board stay in sync without a refetch. The
   API supports both as query parameters for when the dataset outgrows this.
8. **Colours, spacing and type sizes were matched from exported screenshots**,
   not Figma dev-mode values (the file requires a login). They are close but not
   guaranteed pixel-exact.
9. **Creation happens inline, not in a modal.** The design shows a "+ Add Task"
   row and no create dialog, so clicking it turns the row into a text field
   (Enter saves, Escape cancels). New items get a default due date so cards are
   never missing one.
10. **The "···" row menus have no specified contents in the design.** They expose
    the operations the API supports: move between statuses, change priority, and
    delete.
11. **"Add document or link" is presentational.** Attachments aren't part of the
    data model, so the row renders but is inert rather than pretending to save.
12. **Reaction and file-attachment buttons were removed.** Neither is in the API
    schema; leaving them would mean shipping controls that do nothing.
13. **The reply box attaches to the most recent comment**, since the design shows
    one shared reply field beneath the thread rather than per-comment replies.

---

## Design decisions

- **SQLite over Postgres** — the assessment allows any database, and SQLite keeps
  the project runnable with no external service. The schema is provider-agnostic;
  switching means changing the `datasource` provider and the Prisma adapter in
  `prisma.service.ts`.
- **Guest users are real rows**, not anonymous sessions, so tasks and comments
  have a genuine foreign key and ownership checks work uniformly.
- **Subtasks are a self-relation on `Task`** rather than a separate model — they
  carry identical fields, and one level of nesting is enforced in the service.
- **`useAsync` instead of a data-fetching library** — the app has a handful of
  read paths; a hand-rolled hook with cancellation avoids the dependency.

---

## Not yet done

Part 2 (the AbleSpace product write-up) and deployment to a public URL.
