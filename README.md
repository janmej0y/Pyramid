<div align="center">

# 🔺 Pyramid

### A full-stack task & project workspace

Kanban board · grouped lists · subtasks · comments · Google sign-in · dual-axis theming

<br/>

![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-9-880000?style=for-the-badge&logo=mongoose&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

<br/>

![Tests](https://img.shields.io/badge/tests-41%2F41_passing-22c55e?style=flat-square)
![Console](https://img.shields.io/badge/console_errors-0-22c55e?style=flat-square)
![Responsive](https://img.shields.io/badge/responsive-320→1920px-22c55e?style=flat-square)
![Lint](https://img.shields.io/badge/eslint-0_problems-22c55e?style=flat-square)

</div>

---

## 📑 Contents

| | | |
|---|---|---|
| 🚀 [Quick start](#-quick-start) | 🎬 [Screens](#-screens) | 🏗️ [Architecture](#️-architecture) |
| ✨ [Features](#-features) | 🔌 [API](#-api-reference) | 🎨 [Theming](#-theme-system) |
| 📱 [Responsive](#-responsive-behaviour) | 🧪 [Testing](#-testing) | 🚢 [Deploy](#-deployment) |
| 🔐 [Google sign-in](#-google-sign-in) | 🧭 [Decisions](#-design-decisions) | 📋 [Deviations](#-intentional-deviations) |

---

## 🚀 Quick start

```mermaid
flowchart LR
    A["📦 Clone"] --> B["🍃 MongoDB<br/>connection string"]
    B --> C["⚙️ Backend<br/>:4000"]
    C --> D["🖥️ Frontend<br/>:3000"]
    D --> E["✅ Continue<br/>as Guest"]

    style A fill:#e0e7ff,stroke:#6366f1,color:#1e1b4b
    style B fill:#dcfce7,stroke:#22c55e,color:#14532d
    style C fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
    style D fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a
    style E fill:#fef3c7,stroke:#f59e0b,color:#78350f
```

> **Prerequisites** · Node.js 20+ · npm · a MongoDB database

<details open>
<summary><b>0️⃣ &nbsp;Get a MongoDB connection string</b></summary>

<br/>

**MongoDB Atlas** (free tier, required for cloud deployment):

1. Create a free **M0** cluster → [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Database Access** → add a user with a password
3. **Network Access** → allow your IP (or `0.0.0.0/0` for deployment)
4. **Connect → Drivers** → copy the string

> ⚠️ **Put the database name before the `?`** — Atlas omits it, and without it
> Mongoose silently writes to a database called `test`.

```diff
- mongodb+srv://user:pass@cluster0.abc.mongodb.net/?retryWrites=true
+ mongodb+srv://user:pass@cluster0.abc.mongodb.net/pyramid?retryWrites=true
                                                  ^^^^^^^^
```

**Or run MongoDB locally:** `mongodb://127.0.0.1:27017/pyramid`

</details>

<details open>
<summary><b>1️⃣ &nbsp;Backend → <code>http://localhost:4000/api</code></b></summary>

<br/>

```bash
cd backend
npm install
cp .env.example .env        # then paste your DATABASE_URL
npm run db:seed             # optional — demo tasks & projects
npm run start:dev
```

✅ Ready when you see `API listening on port 4000, base path /api`

</details>

<details open>
<summary><b>2️⃣ &nbsp;Frontend → <code>http://localhost:3000</code></b></summary>

<br/>

```bash
cd frontend
npm install
cp .env.example .env.local  # defaults to localhost:4000/api
npm run dev
```

Open **http://localhost:3000** → click **Continue as Guest** 🎉

</details>

### 🔑 Environment variables

<table>
<tr><th colspan="3">🗄️ &nbsp;Backend &nbsp;<code>backend/.env</code></th></tr>
<tr><th>Variable</th><th>Required</th><th>Notes</th></tr>
<tr><td><code>DATABASE_URL</code></td><td>✅</td><td>Mongo connection string, database name included</td></tr>
<tr><td><code>JWT_SECRET</code></td><td>✅</td><td>Min 16 chars — <b>boot fails otherwise</b></td></tr>
<tr><td><code>JWT_EXPIRES_IN</code></td><td>—</td><td>Default <code>7d</code></td></tr>
<tr><td><code>PORT</code></td><td>—</td><td>Default <code>4000</code></td></tr>
<tr><td><code>CORS_ORIGIN</code></td><td>—</td><td>Comma-separated origins</td></tr>
<tr><td><code>GOOGLE_CLIENT_ID</code></td><td>🔵</td><td rowspan="3" align="center"><i>All three, or none.<br/>See <a href="#-google-sign-in">Google sign-in</a></i></td></tr>
<tr><td><code>GOOGLE_CLIENT_SECRET</code></td><td>🔵</td></tr>
<tr><td><code>GOOGLE_CALLBACK_URL</code></td><td>🔵</td></tr>
<tr><th colspan="3">🖥️ &nbsp;Frontend &nbsp;<code>frontend/.env.local</code></th></tr>
<tr><td><code>NEXT_PUBLIC_API_URL</code></td><td>✅</td><td>Must include the <code>/api</code> suffix</td></tr>
</table>

> 🔒 Config is validated at **boot**, not at first request — a missing secret
> fails loudly with a message naming exactly what's wrong.

---

## 🎬 Screens

<table>
<tr>
<td width="50%"><img src="docs/images/02-tasks-list.png" alt="Task list"/><br/><div align="center"><b>📋 List view</b><br/><sub>Grouped by status, inline editing</sub></div></td>
<td width="50%"><img src="docs/images/05-tasks-board.png" alt="Board"/><br/><div align="center"><b>🗂️ Board view</b><br/><sub>Drag cards between columns</sub></div></td>
</tr>
<tr>
<td width="50%"><img src="docs/images/08-task-detail.png" alt="Task detail"/><br/><div align="center"><b>📝 Task detail</b><br/><sub>Subtasks, comments, activity</sub></div></td>
<td width="50%"><img src="docs/images/13-dark-mode.png" alt="Dark mode"/><br/><div align="center"><b>🌙 Dark mode</b><br/><sub>Re-themed, not inverted</sub></div></td>
</tr>
<tr>
<td width="50%"><img src="docs/images/14-filter-menu.png" alt="Filters"/><br/><div align="center"><b>🔍 Filters</b><br/><sub>Seven working axes</sub></div></td>
<td width="50%"><img src="docs/images/17-undo-toast.png" alt="Undo"/><br/><div align="center"><b>↩️ Undo</b><br/><sub>6-second recovery window</sub></div></td>
</tr>
</table>

<div align="center"><sub>📄 Full walkthrough with every screen → <a href="docs/Pyramid-Walkthrough.pdf"><b>Pyramid-Walkthrough.pdf</b></a></sub></div>

---

## ✨ Features

### 🔄 The task pipeline

```mermaid
flowchart LR
    T["📥 To Do"] -->|drag / menu| D["⚙️ Doing"]
    D --> C["✅ Completed"]
    D -.->|blocked| H["⏸️ On Hold"]
    H -.-> D

    style T fill:#f1f5f9,stroke:#64748b,color:#0f172a
    style D fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a
    style C fill:#dcfce7,stroke:#22c55e,color:#14532d
    style H fill:#fef3c7,stroke:#f59e0b,color:#78350f
```

### 📊 What works

| | Feature | Detail |
|:--:|---|---|
| 🔐 | **Auth** | Guest sessions + Google OAuth, JWT, globally guarded routes |
| ✏️ | **Inline editing** | Priority, members, due date — editable straight from any row |
| 🖱️ | **Drag & drop** | Pointer drag + full keyboard equivalent (`Space` `←→` `Esc`) |
| 🔍 | **Search** | Debounced, client-side, `⌘F` / `Ctrl+F` |
| 🎛️ | **Filters** | Status · Priority · Members · Due date · Teams · Labels · Reporter |
| 👁️ | **Column toggles** | Seven optional columns via the Fields menu |
| 🌗 | **Theming** | Light/dark × six accents = 12 combinations |
| ↩️ | **Undo** | Deletes recoverable for 6s, restoring all fields |
| 💀 | **Skeletons** | Shaped placeholders at real row height — no layout shift |
| ♿ | **Accessible** | ARIA throughout, focus rings, drawer focus trap |
| 📱 | **Responsive** | Tables restructure into cards below `md` |

### ⌨️ Keyboard

| Keys | Action |
|---|---|
| <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>F</kbd> | Open search |
| <kbd>Space</kbd> | Pick up / drop a board card |
| <kbd>←</kbd> <kbd>→</kbd> | Move held card between columns |
| <kbd>Esc</kbd> | Cancel drag · close menu · dismiss drawer |
| <kbd>Enter</kbd> | Save inline edit |
| <kbd>Tab</kbd> | Trapped inside the mobile drawer |

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph browser["🌐 Browser"]
        UI["<b>Next.js 16</b> · App Router<br/>React 19 · Tailwind v4"]
    end

    subgraph api["🔧 NestJS 11 API — :4000"]
        direction TB
        G["🛡️ <b>JwtAuthGuard</b><br/><i>global — opt out with @Public()</i>"]
        V["✅ <b>ValidationPipe</b><br/><i>whitelist · forbid unknown</i>"]
        C["🎯 <b>Controllers</b><br/>auth · tasks · projects · comments · users"]
        S["⚙️ <b>Services</b>"]
        G --> V --> C --> S
    end

    DB[("🍃 <b>MongoDB Atlas</b><br/>Mongoose ODM")]

    UI -->|"fetch + Bearer"| G
    S -->|"queries"| DB
    DB -.->|"documents"| S
    S -.->|"JSON"| UI

    style UI fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a
    style G fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
    style V fill:#fef3c7,stroke:#f59e0b,color:#78350f
    style C fill:#e0e7ff,stroke:#6366f1,color:#1e1b4b
    style S fill:#f3e8ff,stroke:#a855f7,color:#581c87
    style DB fill:#dcfce7,stroke:#22c55e,color:#14532d
```

### 🔁 How a change persists

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant C as ⚛️ Component
    participant A as 📡 api client
    participant N as 🔧 NestJS
    participant M as 🍃 MongoDB

    U->>C: selects "High"
    C->>A: updateTask(id, …)
    A->>N: PATCH /api/tasks/:id 🔑
    N->>N: verify token → validate DTO
    N->>M: findByIdAndUpdate
    M-->>N: updated doc
    N->>M: record activity
    N-->>A: 200 + JSON
    A->>N: GET /tasks/grouped
    N-->>C: fresh payload
    C-->>U: row re-renders ✨
```

> 💡 **Why re-fetch instead of patching state?** One grouped endpoint feeds both
> list and board, so they can never disagree — no duplicated optimistic-update
> logic per view.

### 🗂️ Project layout

```
📦 Pyramid
├── 🖥️ frontend/
│   └── src/
│       ├── app/              # routes: / · /tasks · /projects · /settings · /auth/callback
│       ├── components/
│       │   ├── layout/       # shell · sidebar · toolbar
│       │   ├── tasks/        # board · table · detail · cell editors
│       │   └── ui/           # button · menu · toast · skeleton · icons
│       └── lib/              # api · hooks · filters · dnd · focus-trap
├── ⚙️ backend/
│   └── src/
│       ├── auth/             # guest + Google OAuth · JWT guard
│       ├── tasks/ projects/ comments/ users/
│       ├── schemas/          # user · task · project · comment · activity
│       └── common/           # constants · filters · serialize
└── 📄 docs/                  # walkthrough + screenshots
```

### 🧩 Data model

```mermaid
erDiagram
    USER ||--o{ TASK : reports
    USER ||--o{ COMMENT : writes
    USER ||--o{ PROJECT : leads
    PROJECT ||--o{ TASK : contains
    TASK ||--o{ TASK : "has subtasks"
    TASK ||--o{ COMMENT : has
    TASK ||--o{ ACTIVITY : logs
    COMMENT ||--o{ COMMENT : replies
```

---

## 🔌 API reference

> Base URL `http://localhost:4000/api` · all routes need `Authorization: Bearer <token>`
> unless marked 🌐 **public**

<details>
<summary><b>🔐 Auth</b></summary>

<br/>

| Method | Route | Description |
|---|---|---|
| `POST` | `/auth/guest` 🌐 | Create a guest session |
| `GET` | `/auth/providers` 🌐 | Which sign-in methods are configured |
| `GET` | `/auth/google` 🌐 | Redirect to Google consent |
| `GET` | `/auth/google/callback` 🌐 | OAuth landing → redirects to frontend |
| `GET` | `/auth/me` | Resolve token → user |

</details>

<details>
<summary><b>✅ Tasks</b></summary>

<br/>

| Method | Route | Description |
|---|---|---|
| `GET` | `/tasks` | Paginated list · filters via query |
| `GET` | `/tasks/grouped` | Bucketed by status — powers list **and** board |
| `POST` | `/tasks` | Create |
| `GET` | `/tasks/:id` | One task |
| `PATCH` | `/tasks/:id` | Update any field |
| `DELETE` | `/tasks/:id` | Delete |

</details>

<details>
<summary><b>💬 Comments · 📁 Projects · 👥 Users</b></summary>

<br/>

| Method | Route |
|---|---|
| `GET` `POST` | `/tasks/:taskId/comments` |
| `PATCH` `DELETE` | `/comments/:id` |
| `GET` `POST` | `/projects` |
| `GET` `PATCH` `DELETE` | `/projects/:id` |
| `GET` | `/users` · `/users/:id` |
| `PATCH` | `/users/me` |
| `GET` | `/health` 🌐 — pings MongoDB |

</details>

### 📐 Conventions

> ⚠️ **Casing is deliberately asymmetric** — statuses are Title Case, priorities lowercase.

```js
STATUSES   = ["To Do", "Doing", "Completed", "On Hold"]   // Title Case
PRIORITIES = ["urgent", "high", "medium", "low", "none"]  // lowercase
```

Unknown fields are **rejected as 400**, never silently ignored. Errors share one shape:

```json
{ "statusCode": 400, "error": "Bad Request", "message": ["…"],
  "path": "/api/tasks", "timestamp": "2026-08-22T…" }
```

---

## 🔐 Google sign-in

```mermaid
sequenceDiagram
    autonumber
    participant B as 🌐 Browser
    participant A as 🔧 API
    participant G as 🔵 Google

    B->>A: GET /auth/google
    A->>A: sign CSRF state 🔏
    A-->>B: 302 + HttpOnly cookie 🍪
    B->>G: consent screen
    G-->>B: redirect ?code&state
    B->>A: GET /auth/google/callback
    A->>A: verify state (constant-time)
    A->>G: exchange code → token
    G-->>A: profile 👤
    A->>A: find or create user
    A-->>B: redirect #token=… 🔑
    B->>A: GET /auth/me
    A-->>B: session ✅
```

### 🛡️ Security choices

| | Decision | Why |
|:--:|---|---|
| 🔗 | Token in URL **fragment** | Fragments never reach a server — stays out of logs & `Referer` |
| 🔏 | **HMAC-signed** CSRF state | Survives restarts & multi-instance; no session store needed |
| 📧 | Unverified emails **discarded** | Stops account claiming via an unowned address |
| 🆔 | Match on `googleId`, not email | Stable if the user changes their Google address |
| ⚡ | **All-or-none** config | Partial setup fails at boot, not at first click |

### ⚙️ Setup

<details>
<summary><b>Configure Google OAuth</b></summary>

<br/>

**1.** [Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
**Create Credentials → OAuth client ID → Web application**

**2.** Add **Authorised redirect URIs** — must match byte for byte:

```
http://localhost:4000/api/auth/google/callback
https://<your-api>.onrender.com/api/auth/google/callback
```

**3.** Add to `backend/.env` (or your host's dashboard):

```env
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

> ℹ️ Leave all three unset to run **guest-only** — the button hides itself
> automatically via `/auth/providers`.

</details>

---

## 🎨 Theme system

Two **independent axes** on `<html>` → **12 combinations**:

```mermaid
flowchart LR
    subgraph axis1["🌗 data-theme"]
        L["☀️ light"]
        D["🌙 dark"]
    end
    subgraph axis2["🎨 data-accent"]
        A1["🟠 amber"] --- A2["🟣 blue"] --- A3["🩷 pink"]
        A4["🌹 rose"] --- A5["🟢 emerald"] --- A6["⚫ black"]
    end
    axis1 --> T["CSS custom properties"]
    axis2 --> T
    T --> R["🖌️ Every component"]

    style T fill:#e0e7ff,stroke:#6366f1,color:#1e1b4b
    style R fill:#dcfce7,stroke:#22c55e,color:#14532d
```

✅ No component hardcodes a colour — everything reads `var(--token)`
✅ Preference applied **before first paint**, so no flash on refresh
✅ Dark mode is genuinely re-themed: priority hues brighten for contrast

---

## 📱 Responsive behaviour

<div align="center">

| 📐 Width | Layout | Overflow |
|---|---|:--:|
| **1920** | Full two-pane, sidebar 244px | ✅ |
| **1440** | Sidebar 228px | ✅ |
| **1280** | Sidebar 210px | ✅ |
| **1024** | Toolbar labels intact | ✅ |
| **768** | 🍔 Sidebar → overlay drawer | ✅ |
| **430 · 390 · 360 · 320** | 🃏 Tables → stacked cards | ✅ |

<sub>Verified by comparing <code>scrollWidth</code> against <code>clientWidth</code> at every width</sub>

</div>

> 📱 **The mobile treatment restructures rather than shrinks.** Instead of
> horizontally scrolling a five-column table, each row becomes a card: title on
> one line, priority + date + assignee on a second. Toolbar buttons drop labels;
> the sidebar becomes a drawer with scrim, scroll-lock, focus trap and Escape.

---

## 🧪 Testing

<div align="center">

| Suite | Coverage | Result |
|---|---|:--:|
| 🎭 `frontend/test/ui-check.mjs` | Every interactive control, real Chromium | **21/21** ✅ |
| 🔐 OAuth end-to-end | Consent, CSRF, cancellation, bad tokens | **20/20** ✅ |
| 🔌 `backend/test/api-smoke.mjs` | Every endpoint + status code | ✅ |
| 📐 Responsive audit | 10 widths × 4 routes | ✅ |

</div>

```bash
# Both servers must be running
cd frontend
npm i -D playwright && npx playwright install chromium
APP_URL=http://localhost:3000 node test/ui-check.mjs
```

Each assertion drives a real control **and verifies the change persisted through
the API** — not just that the UI updated locally.

---

## 🚢 Deployment

```mermaid
flowchart LR
    R["🔧 <b>Render</b><br/>NestJS API<br/><sub>root: backend/</sub>"]
    V["▲ <b>Vercel</b><br/>Next.js<br/><sub>root: frontend/</sub>"]
    M[("🍃 <b>Atlas</b>")]

    V -->|"NEXT_PUBLIC_API_URL"| R
    R -->|"DATABASE_URL"| M
    R -.->|"CORS_ORIGIN"| V

    style R fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
    style V fill:#f1f5f9,stroke:#0f172a,color:#0f172a
    style M fill:#dcfce7,stroke:#22c55e,color:#14532d
```

**Order matters:** 1️⃣ backend → 2️⃣ frontend → 3️⃣ set `CORS_ORIGIN` to the frontend URL.

<div align="center"><sub>📖 Step-by-step guide → <a href="DEPLOYMENT.md"><b>DEPLOYMENT.md</b></a></sub></div>

### ⚠️ Four things that break deploys

| | Gotcha |
|:--:|---|
| 🌐 | Atlas **Network Access** must allow `0.0.0.0/0` |
| 🗄️ | Database name goes **before the `?`** in `DATABASE_URL` |
| 📁 | Vercel **Root Directory** must be `frontend` |
| 🔗 | `NEXT_PUBLIC_API_URL` needs the **`/api`** suffix — and is baked in at build time |

---

## 🧭 Design decisions

<details>
<summary><b>Why no component library, state manager, or data-fetching library?</b></summary>

<br/>

Runtime dependencies are **React, React DOM and Next** — nothing else. Menus,
avatars, chips, toasts, drag-and-drop and the focus trap are all built here.

The design's components don't map cleanly onto any library's defaults, so
adopting one would have meant fighting its styling to reach the same result.
`useAsync` and `useDebounced` cover the handful of read paths without pulling in
a cache layer.

</details>

<details>
<summary><b>Why re-fetch after every mutation?</b></summary>

<br/>

`GET /tasks/grouped` feeds both list and board. Re-fetching guarantees the two
views agree and that what's on screen is what the database holds — at the cost
of a little latency. Optimistic updates are noted as a future improvement, worth
doing only with proper rollback.

</details>

<details>
<summary><b>Why hand-rolled OAuth instead of Passport?</b></summary>

<br/>

The JWT guard is already hand-rolled. Adding `passport` +
`@nestjs/passport` + `passport-google-oauth20` would introduce a second,
parallel auth abstraction for a flow that is two HTTP calls.

</details>

<details>
<summary><b>Mongoose 9 notes</b></summary>

<br/>

- **Partial unique indexes** on `email` and `googleId` — `sparse` alone would
  let a second guest collide, since it only skips *missing* fields
- **Nullable props need an explicit `type`** — reflection can't infer a schema
  type from `string | null`
- `serverSelectionTimeoutMS: 10000` and `maxPoolSize: 10` suit the free tier

</details>

---

## 📋 Intentional deviations

> Documented per the assessment's requirement to note deviations from the design.

<details>
<summary><b>🔧 Fixed after review</b></summary>

<br/>

| | Was | Now |
|:--:|---|---|
| 1 | Comments heading read **"Subtasks"** | Renamed to **"Comments"** |
| 2 | Fields menu listed **"Members" twice** | Second row relabelled **"Assignees"** |
| 3 | **Google login disabled** | Fully implemented |
| 4 | Filter menu had **one working axis** | All **seven** work |

</details>

<details>
<summary><b>✏️ Filled in where the design was unspecified</b></summary>

<br/>

- **Creation is inline, not modal** — the design shows a `+ Add Task` row and no
  dialog. Enter saves, Escape cancels. New items get a default due date.
- **`···` menus expose what the API supports** — move status, change priority, delete.
- **The reply box attaches to the most recent comment**, matching the single
  shared reply field in the design.
- **Responsive layouts are extrapolated** from desktop frames.

</details>

<details>
<summary><b>📦 Scoped out</b></summary>

<br/>

- **"Add document or link" is presentational** — attachments aren't in the data
  model, so the row renders inert rather than pretending to save.
- **Reaction and attachment buttons removed** — neither is backed by the API.
- **Lock / watcher / share** in the detail header render per the design but
  aren't wired.

</details>

---

## 🗺️ Remaining work

| | Item | Notes |
|:--:|---|---|
| 🛡️ | **Rate limiting** | `/auth/guest` is unauthenticated & unthrottled — add `@nestjs/throttler` before sharing publicly |
| ⚡ | **Optimistic UI** | Needs proper rollback to be worth it |
| 📄 | **Pagination** | API supports `skip`/`take`; UI never paginates (silently truncates past 100) |
| 🧪 | **Unit tests** | Coverage is end-to-end only; no `.spec.ts` files exist |

---

<div align="center">

### 📚 More documentation

[![Walkthrough](https://img.shields.io/badge/📄_Walkthrough-PDF-ef4444?style=for-the-badge)](docs/Pyramid-Walkthrough.pdf)
[![Markdown](https://img.shields.io/badge/📝_Walkthrough-Markdown-6366f1?style=for-the-badge)](docs/WALKTHROUGH.md)
[![Deployment](https://img.shields.io/badge/🚢_Deployment-Guide-22c55e?style=for-the-badge)](DEPLOYMENT.md)

<br/>

**Built by Janmejoy Mahato**

<sub>Next.js 16 · React 19 · TypeScript · Tailwind v4 · NestJS 11 · MongoDB</sub>

</div>
