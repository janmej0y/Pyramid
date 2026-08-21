# Deployment — Render (API) + Vercel (Web)

The two halves deploy as separate services from the same repository:

| Part | Platform | Root directory |
|---|---|---|
| NestJS API | Render — web service | `backend` |
| Next.js app | Vercel — project | `frontend` |

**Deploy the backend first.** The frontend needs the API URL at build time.

Total time: roughly 20 minutes, most of it waiting on builds.

> Vercel builds Next.js natively — no adapter or plugin is needed. The two
> server-rendered routes (`/tasks/[id]`, `/projects/[id]`) work out of the box.

---

## Step 0 — Prerequisites

### 0.1 Push to GitHub

Both platforms deploy from a Git repository.

```bash
cd c:/Users/Main/Desktop/Pyramid
git add .
git commit -m "Prepare for deployment"
git push
```

### 0.2 Open MongoDB Atlas to the internet

This is the single most common cause of a deploy that builds fine and then
fails every request. Render and Vercel use dynamic IPs, and Atlas blocks
unknown addresses by default.

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → your cluster
2. **Network Access** (left sidebar) → **Add IP Address**
3. Choose **Allow access from anywhere** — this enters `0.0.0.0/0`
4. **Confirm**

### 0.3 Generate a production JWT secret

Do not reuse the local one from `backend/.env`.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Copy the output somewhere for Step 1.

### 0.4 Have your Atlas connection string ready

In Atlas: **Connect → Drivers → copy the connection string**. Then edit it:

- Replace `<password>` with the real database-user password
- **Insert the database name `pyramid` before the `?`**

The result must look like this:

```
mongodb+srv://myuser:mypassword@cluster0.abc12.mongodb.net/pyramid?retryWrites=true&w=majority
                                                              ^^^^^^^^
                                                       this part is required
```

Without the database name, Mongoose silently writes to a database called
`test` and your app appears empty.

---

## Step 1 — Backend on Render

A [`render.yaml`](render.yaml) blueprint is committed at the repository root,
so Render can configure the service itself.

### 1.1 Create the service

1. Sign in at [dashboard.render.com](https://dashboard.render.com)
2. **New → Blueprint**
3. Connect your GitHub account and select the `Pyramid` repository
4. Render detects `render.yaml` and shows a service named **pyramid-api**
5. Click **Apply**

### 1.2 Fill in the three secrets

Render prompts for the values marked `sync: false` in the blueprint:

| Variable | Value |
|---|---|
| `DATABASE_URL` | The Atlas string from Step 0.4 |
| `JWT_SECRET` | The secret from Step 0.3 |
| `CORS_ORIGIN` | `http://localhost:3000` for now — corrected in Step 3 |

`NODE_VERSION` (22) and `JWT_EXPIRES_IN` (7d) come from the blueprint
automatically.

### 1.3 Wait for the build

Render runs `npm ci && npm run build`, then `npm run start:prod`. First build
takes 3–5 minutes.

Watch the logs for:

```
API listening on port 10000, base path /api
```

### 1.4 Verify

Copy your service URL from the top of the Render dashboard — it looks like
`https://pyramid-api.onrender.com`.

Open in a browser:

```
https://pyramid-api.onrender.com/api/health
```

Expected:

```json
{"status":"ok","timestamp":"2026-08-21T…"}
```

This endpoint pings MongoDB before answering, so a `200` proves the database
connection works — not merely that the process started.

**Keep this URL.** You need it in Step 2.

> If you see 503, the database is unreachable — recheck Step 0.2 and the
> credentials inside `DATABASE_URL`.

### Setting up manually instead

If you would rather not use the blueprint: **New → Web Service**, then set
Root Directory `backend`, Build Command `npm ci && npm run build`, Start
Command `npm run start:prod`, Health Check Path `/api/health`, and add every
variable from the table above plus `NODE_VERSION=22`.

---

## Step 2 — Frontend on Vercel

### 2.1 Import the project

1. Sign in at [vercel.com](https://vercel.com)
2. **Add New → Project**
3. Connect GitHub, then **Import** the `Pyramid` repository

### 2.2 Configure

Vercel shows a configuration screen before the first build. Set:

| Field | Value |
|---|---|
| **Root Directory** | `frontend` |
| Framework Preset | Next.js — detected automatically |
| Build Command | leave default (`npm run build`) |
| Output Directory | leave default |
| Install Command | leave default |

**Root Directory is the critical one.** Click **Edit** next to it and select
`frontend`. Left at the repository root, the build fails immediately because
there is no Next.js app there.

Everything else is auto-detected — there is no config file to add.

### 2.3 Add the environment variable

Expand **Environment Variables** and add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://pyramid-api.onrender.com/api` |

Use your own Render URL from Step 1.4.

**The `/api` suffix is required.** The API is mounted under that global prefix;
omitting it makes every request 404.

Leave it applied to all three environments (Production, Preview, Development).

### 2.4 Deploy

Click **Deploy**. The first build takes 2–4 minutes.

Vercel gives you a URL like `https://pyramid-xxxx.vercel.app`. You can change
it under **Settings → Domains**.

**Keep this URL.** You need it in Step 3.

---

## Step 3 — Connect the two (CORS)

The backend currently rejects requests from your Vercel domain. Fix it now.

1. Render dashboard → **pyramid-api** → **Environment**
2. Edit `CORS_ORIGIN` to your exact Vercel URL:

```
CORS_ORIGIN=https://your-project.vercel.app
```

3. **Save changes** — Render restarts automatically (about a minute)

### Rules for this value

- **No trailing slash.** `https://x.vercel.app/` fails; `https://x.vercel.app` works.
- **Include `https://`.**
- It must match the browser's origin exactly.

Vercel gives every branch and pull request its own preview URL, which will hit
CORS unless listed. To allow your main preview domain too:

```
CORS_ORIGIN=https://your-project.vercel.app,https://your-project-git-main-you.vercel.app
```

---

## Step 4 — Verify end to end

1. Open your Vercel URL. The login screen renders.
2. Click **Continue as Guest** → you should land on `/tasks` with data.
3. Create a task, then **reload the page**. If it is still there, the whole
   chain works: browser → Vercel → Render → Atlas.
4. Open a task to confirm the dynamic route renders.

Optionally, run the interaction suite against production:

```bash
cd frontend
APP_URL=https://your-project.vercel.app node test/ui-check.mjs
```

> The first request after an idle period is slow — see below. Let the page
> finish loading before deciding something is broken.

---

## Free-tier behaviour worth knowing

**Render free services sleep after ~15 minutes idle.** Waking the container
takes 30–60 seconds, and a cold Atlas cluster adds roughly 20 more. The first
visit after a quiet spell can take over a minute; everything after is normal.

If you are sharing this link with someone — an evaluator, say — open it
yourself a minute beforehand so the service is warm when they arrive.

**Vercel does not sleep.** Only the Render side has the cold-start delay.

**The first health check can fail** if Atlas is still waking when the probe
runs. Render retries. If the deploy is marked unhealthy, load `/api/health`
once by hand, then hit **Manual Deploy → Deploy latest commit**.

**Guest login is unauthenticated and unthrottled.** Each call writes a user
document to the database. On a public URL this is trivially abusable and will
fill a free M0 cluster. Adding `@nestjs/throttler` is worthwhile before you
share the link widely — see improvement 9 in
[docs/WALKTHROUGH.md](docs/WALKTHROUGH.md).

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Render build fails: `Invalid environment configuration` | `DATABASE_URL` malformed or `JWT_SECRET` under 16 characters. The API validates at boot on purpose. |
| `/api/health` returns 503 | Atlas unreachable. Recheck Network Access allows `0.0.0.0/0`, and the username/password inside the connection string. |
| Vercel build fails instantly, "no Next.js version detected" | Root Directory is not set to `frontend`. |
| Site loads, but no tasks appear; console shows a CORS error | `CORS_ORIGIN` on Render does not exactly match the Vercel origin. Check for a trailing slash. |
| Every API call returns 404 | `NEXT_PUBLIC_API_URL` is missing the `/api` suffix. |
| Preview deployments hit CORS but production works | Preview URLs differ per branch — add them to `CORS_ORIGIN`. |
| Changed the API URL, app still calls the old one | `NEXT_PUBLIC_*` values are inlined at build time. Redeploy: **Deployments → ⋯ → Redeploy**. |
| App is very slow on first load | Expected — the Render backend is waking. See above. |
| Data appears in a database called `test` | The database name is missing from `DATABASE_URL` — it belongs before the `?`. |

---

## What is committed for deployment

| File | Purpose |
|---|---|
| [`render.yaml`](render.yaml) | Render blueprint — service config, health check, env var declarations |

Vercel needs no configuration file; Root Directory and the one environment
variable are set in its dashboard.

Secrets are never committed. Both `.env` files stay gitignored; the values live
in each platform's dashboard.
