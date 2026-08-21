# Deployment — Render (API) + Netlify (Web)

The two halves deploy as separate services from the same repository:

| Part | Platform | Base directory |
|---|---|---|
| NestJS API | Render — web service | `backend` |
| Next.js app | Netlify — site | `frontend` |

**Deploy the backend first.** The frontend needs the API URL at build time.

Total time: roughly 20 minutes, most of it waiting on builds.

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
fails every request. Render and Netlify use dynamic IPs, and Atlas blocks
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

---

## Step 2 — Frontend on Netlify

Two files are already committed for this:
[`frontend/netlify.toml`](frontend/netlify.toml) (build settings) and the
`@netlify/plugin-nextjs` dev dependency, which provides server-side rendering.

Your app has two server-rendered routes — `/tasks/[id]` and `/projects/[id]` —
so the plugin is required. A plain static deploy would 404 on every task
detail page.

### 2.1 Create the site

1. Sign in at [app.netlify.com](https://app.netlify.com)
2. **Add new site → Import an existing project**
3. **Deploy with GitHub**, authorise, and pick the `Pyramid` repository

### 2.2 Configure the build

Netlify shows a build settings screen. Set:

| Field | Value |
|---|---|
| **Base directory** | `frontend` |
| Build command | `npm run build` |
| Publish directory | `frontend/.next` |

**Base directory is the critical one.** Left blank, Netlify builds from the
repository root, finds no Next.js app, and fails immediately.

Once base directory is `frontend`, Netlify reads `netlify.toml` from there and
picks up the command, publish path, plugin, and Node version automatically —
so the other fields should populate themselves. Leave whatever it fills in.

> Note on the two publish paths: the UI field is written relative to the
> repository root (`frontend/.next`), while `publish` inside `netlify.toml` is
> relative to the base directory (`.next`). Both point at the same folder.
> The file wins, so there is nothing to reconcile by hand.

### 2.3 Add the environment variable

Before deploying, click **Add environment variables**:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://pyramid-api.onrender.com/api` |

Use your own Render URL from Step 1.4.

**The `/api` suffix is required.** The API is mounted under that global prefix;
omitting it makes every request 404.

### 2.4 Deploy

Click **Deploy**. The first build takes 2–4 minutes.

When it finishes, Netlify gives you a URL like
`https://random-name-123456.netlify.app`. You can rename it under
**Site configuration → Change site name**.

**Keep this URL.** You need it in Step 3.

---

## Step 3 — Connect the two (CORS)

The backend currently rejects requests from your Netlify domain. Fix it now.

1. Render dashboard → **pyramid-api** → **Environment**
2. Edit `CORS_ORIGIN` to your exact Netlify URL:

```
CORS_ORIGIN=https://your-site-name.netlify.app
```

3. **Save changes** — Render restarts automatically (about a minute)

### Rules for this value

- **No trailing slash.** `https://x.netlify.app/` fails; `https://x.netlify.app` works.
- **Include `https://`.**
- It must match the browser's origin exactly.

To also allow Netlify's deploy previews, list origins comma-separated:

```
CORS_ORIGIN=https://your-site.netlify.app,https://deploy-preview-1--your-site.netlify.app
```

---

## Step 4 — Verify end to end

1. Open your Netlify URL. The login screen renders.
2. Click **Continue as Guest** → you should land on `/tasks` with data.
3. Create a task, then **reload the page**. If it is still there, the whole
   chain works: browser → Netlify → Render → Atlas.
4. Open a task to confirm the dynamic route renders (this is what the Netlify
   plugin provides).

Optionally, run the interaction suite against production:

```bash
cd frontend
APP_URL=https://your-site.netlify.app node test/ui-check.mjs
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
| Netlify build fails instantly, "no package.json" | Base directory is not set to `frontend`. |
| Site loads, but no tasks appear; console shows a CORS error | `CORS_ORIGIN` on Render does not exactly match the Netlify origin. Check for a trailing slash. |
| Every API call returns 404 | `NEXT_PUBLIC_API_URL` is missing the `/api` suffix. |
| Task detail pages 404 | `@netlify/plugin-nextjs` did not load — confirm `netlify.toml` is inside `frontend/` and the base directory is set. |
| Changed the API URL, app still calls the old one | `NEXT_PUBLIC_*` values are inlined at build time. Trigger a redeploy: **Deploys → Trigger deploy → Clear cache and deploy site**. |
| App is very slow on first load | Expected on free tiers. See the section above. |
| Data appears in a database called `test` | The database name is missing from `DATABASE_URL` — it belongs before the `?`. |

---

## What is committed for deployment

| File | Purpose |
|---|---|
| [`render.yaml`](render.yaml) | Render blueprint — service config, health check, env var declarations |
| [`frontend/netlify.toml`](frontend/netlify.toml) | Netlify build command, publish path, Next.js plugin, Node version |
| `@netlify/plugin-nextjs` | Dev dependency providing SSR for the two dynamic routes |

Secrets are never committed. Both `.env` files stay gitignored; the values live
in each platform's dashboard.
