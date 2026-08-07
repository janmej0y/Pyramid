# Pyramid — Task Management System

Frontend implementation of the Assessment Task Figma design.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4

---

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build    # production build
npm run lint     # eslint
```

---

## Screens implemented

| Route | Screen |
| --- | --- |
| `/` | Guest login — "Continue as Guest" / "Login with Google" |
| `/tasks` | Tasks — **List** view, grouped by status (To Do / Doing / Completed) |
| `/tasks` → Fields → Board | Tasks — **Board** (kanban) view with 4 columns |
| `/tasks/[id]` | Task detail — properties, labels, subtasks, comments, details panel |
| `/projects` | Projects table |
| `/projects/[id]` | Project detail with breadcrumb |
| `/settings` | Settings — Profile / Theme / Color |

Interactive elements from the design: Fields menu (view switch + column toggles),
filter menu with the Priority flyout, inline search with `⌘F`, the priority
dropdown and date picker in the task details panel, and the sidebar user menu
with theme and colour submenus.

---

## Theme system

Two independent axes, matching the user menu in the design:

- **Change Theme** → Light / Dark
- **Color Mode** → Amber, Blue, Pink, Rose, Emerald, Black

Both persist to `localStorage` and survive a refresh. A small blocking script in
`<head>` applies the stored values to `<html>` before first paint, so there is no
flash of the wrong theme on reload. Themes are expressed as CSS custom properties
on `[data-theme]` / `[data-accent]` in [globals.css](frontend/src/app/globals.css),
so a colour change is one attribute swap rather than a re-render.

---

## Project structure

```
frontend/src/
├── app/                    # routes (App Router)
│   ├── page.tsx            # login
│   ├── tasks/              # list + board, task detail
│   ├── projects/           # projects table, project detail
│   └── settings/
├── components/
│   ├── ui/                 # primitives: button, avatar, chips, menu, icons
│   ├── layout/             # app shell, sidebar, user menu, page toolbar
│   ├── tasks/              # task table, board, detail view, date picker
│   ├── projects/
│   ├── settings/
│   └── providers/          # theme provider
└── lib/                    # types, seed data, theme config, helpers
```

Reusable pieces worth calling out:

- **`ui/menu.tsx`** — one popover primitive (`Menu`, `MenuItem`, `MenuCheckboxItem`,
  `MenuSub`) backing the Fields menu, filter menu, user menu, and priority
  dropdown. Handles outside-click, Escape, and focus restoration in one place.
- **`ui/icons.tsx`** — every icon is a local SVG, so there is no icon-library
  dependency and stroke weights stay consistent.
- **`tasks/task-table.tsx`** — the grouped table used by the Tasks list, the
  Projects-scoped list, and the subtasks table on the detail page.
- **`layout/page-toolbar.tsx`** — the search / Fields / filter / Add row shared
  by Tasks and Projects.

---

## Responsive behaviour

The Figma file specifies desktop frames only. Tablet and mobile follow the
assessment's responsiveness requirement, extending the desktop design rather
than redesigning it:

- **≥ 768px** — desktop layout as designed. The sidebar collapses via the topbar
  toggle.
- **< 768px** — the sidebar becomes an overlay drawer opened from the same
  toggle; table rows become stacked cards (a 5-column grid at 375px would crush
  the task title); toolbar buttons collapse to icons.
- The board scrolls horizontally at every width, keeping card width fixed.

---

## Intentional deviations

Documented per the assessment's requirement to note deviations.

1. **Fields menu lists "Members" twice.** Reproduced verbatim from the design —
   both rows are checked in the source. They are wired to separate keys so
   neither is a dead control.
2. **Task detail has two "Subtasks" headings.** Also as designed: one above the
   subtask table, one above the comment thread. Kept rather than "corrected".
3. **Avatars are generated SVG gradients.** The design's avatar images aren't
   available as assets, so they are approximated with an inline gradient. Members
   without a photo use initials (`CN`), exactly as in the design.
4. **Dates are formatted manually**, not via `Intl`. `en-GB` renders September as
   "Sept", while the design consistently uses three-letter months ("12 Sep 2026").
5. **Data is static.** This is the frontend deliverable; `lib/data.ts` holds seed
   data matching the design's content and is the single module that will swap
   over to the NestJS API.
6. **The coloured frame around each Figma frame** is a Figma artboard border, not
   a UI element, so it is not reproduced.
7. **"Login with Google" is non-functional.** Guest login is the flow the
   assessment requires; the Google button is presentational.

---

## Not yet built

Part 1 also asks for a NestJS backend with validation, and Part 2 is a separate
product-understanding write-up. This repository currently covers the frontend.
