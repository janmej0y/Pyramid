# Deployment — Render (API) + Vercel (Web)

The two halves deploy separately from the same repository:

| Part | Platform | Root directory |
|---|---|---|
| NestJS API | Render (web service) | `backend` |
| Next.js app | Vercel | `frontend` |

Deploy the **backend first** — the frontend needs its URL at build time.

---

## Before you start

**MongoDB Atlas — allow connections from anywhere.**
Atlas blocks unknown IPs by default, and both Render and Vercel use dynamic
addresses. In Atlas: **Network Access → Add IP Address → Allow access from
anywhere** (`0.0.0.0/0`). Without this the API starts but every request fails
with a server-selection timeout.

**Generate a production JWT secret.** Do not reuse the local one.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## 1. Backend on Render

A [`render.yaml`](render.yaml) blueprint is committed at the repo root, so
Render can read the whole configuration itself.

1. Push the repository to GitHub.
2. Render dashboard → **New → Blueprint** → select the repo.
3. Render reads `render.yaml` and prompts for the three secret values:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Atlas connection string, **with the database name before `?`** — e.g. `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/pyramid?retryWrites=true&w=majority` |
| `JWT_SECRET` | The generated secret above (min 16 characters) |
| `CORS_ORIGIN` | Leave as a placeholder for now; set it in step 3 |

`NODE_VERSION` (22) and `JWT_EXPIRES_IN` (7d) come from the blueprint.

4. Deploy. Render runs `npm ci && npm run build`, then `npm run start:prod`.

**Verify:** `https://<your-service>.onrender.com/api/health` returns
`{"status":"ok","timestamp":"…"}`. That endpoint pings MongoDB, so a `200`
confirms the database connection too — not merely that the process is up.

### Setting up manually instead

If you would rather not use the blueprint: **New → Web Service**, then set
Root Directory `backend`, Build Command `npm ci && npm run build`, Start
Command `npm run start:prod`, Health Check Path `/api/health`, and add every
variable from the table above plus `NODE_VERSION=22`.

---

## 2. Frontend on Vercel

1. Vercel dashboard → **Add New → Project** → import the repo.
2. **Root Directory: `frontend`.** This is the setting most often missed; the
   build fails at the repo root because there is no Next.js app there.
3. Framework preset: Next.js (detected automatically).
4. Environment variable:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-service>.onrender.com/api` |

   The `/api` suffix is required — the API is mounted under that global prefix,
   and omitting it makes every request 404.

5. Deploy.

`NEXT_PUBLIC_` variables are inlined at **build time**, not read at runtime.
Changing this value later requires a redeploy, not just a settings save.

---

## 3. Close the CORS loop

Vercel now has a URL. Go back to Render → your service → **Environment** and set:

```
CORS_ORIGIN=https://<your-project>.vercel.app
```

Save; Render restarts automatically.

To also allow Vercel preview deployments, list origins comma-separated:

```
CORS_ORIGIN=https://pyramid.vercel.app,https://pyramid-git-main-you.vercel.app
```

A wrong value here shows up as a **CORS error in the browser console** while
the server logs look completely healthy — check this first if the deployed UI
loads but no data appears.

---

## 4. Verify the deployment

1. Open the Vercel URL — the login screen renders.
2. **Continue as Guest** — should land on `/tasks`.
3. Create a task, reload the page. If it survives, the full chain works:
   browser → Vercel → Render → Atlas.

Run the interaction suite against production:

```bash
cd frontend
APP_URL=https://<your-project>.vercel.app node test/ui-check.mjs
```

---

## Known behaviour on free tiers

**Render free services sleep after ~15 minutes idle.** The next request wakes
the container, which takes roughly 30–60 seconds — and an idle Atlas free
cluster adds its own ~20 second wake-up on top. The first visit after a quiet
period is slow; subsequent ones are normal. Both paid tiers remove this.

**The health check may fail on the very first deploy** if Atlas is cold, since
the probe runs before the cluster finishes waking. Render retries; if the
deploy is marked unhealthy, hit `/api/health` once by hand and redeploy.

**Guest login is unauthenticated and unthrottled.** Every call writes a user
document. On a public URL this is trivially abusable and will fill an M0
cluster. Add `@nestjs/throttler` before sharing the link widely — see
improvement 9 in [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md).

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Render deploy fails, logs show `Invalid environment configuration` | `DATABASE_URL` missing/malformed, or `JWT_SECRET` under 16 chars. The API validates at boot deliberately. |
| `/api/health` returns 503 | Atlas unreachable — check Network Access allows `0.0.0.0/0` and the user credentials are right. |
| UI loads, no data, CORS error in console | `CORS_ORIGIN` on Render does not exactly match the Vercel origin. No trailing slash. |
| Every API call 404s | `NEXT_PUBLIC_API_URL` is missing the `/api` suffix. |
| Vercel build fails immediately | Root Directory is not set to `frontend`. |
| Changed the API URL but the app still calls the old one | `NEXT_PUBLIC_*` is baked in at build time — redeploy the frontend. |
