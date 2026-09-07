# API Contract — Portfolio Backend

**Status: backend locked for frontend development.** This is a full regeneration from the current code (not a patch of the pre-hardening version) after `BACKEND_FINAL_PLAN.md` Phases 1–7. 88/88 backend tests pass. No further backend changes should be made unless frontend work exposes a genuine missing requirement — see that plan's closing rule.

Source of truth: `backend/src`. Base URL in dev: `http://localhost:5000/api/v1`. Also: `GET /health` and `GET /ready` (outside `/api/v1`, see below).

---

## Global conventions

- **Envelope**: every JSON response has `success: boolean`.
  - List: `{ success: true, data: [...], meta?: { page, limit, total, pages? } }`
  - Single: `{ success: true, data: {...} }`
  - Action/no payload: `{ success: true, message: "..." }`
  - Error: `{ success: false, error: "message" }` (+ `stack` field, dev only)
- **Auth**: JWT in an **httpOnly cookie** named `token`. Frontend must call `fetch`/`axios` with `credentials: 'include'` on every request. Cookie is `SameSite=Lax` in **every** environment and `Secure` in production only — see [Auth & CSRF](#auth--csrf) below.
- **CSRF header on every admin write.** Every `POST`/`PATCH`/`DELETE` that requires admin auth also requires the header `X-Requested-With: portfolio-admin`, or it 403s even with a valid cookie. See [Auth & CSRF](#auth--csrf).
- **Admin-only routes** require `protect` (valid cookie) + `adminOnly` (`user.role === 'admin'`, plus the CSRF header check for writes). There is exactly one role, `admin`, and no public signup — only login, backed by a pre-seeded admin (`npm run seed`).
- **Validation errors** (Zod, via `validate` middleware): `400` with `error` as a single string joining all field errors, e.g. `"title: Title is required, section: Invalid enum value"`.
- **Mongoose-level errors**:
  - Duplicate unique field (`code 11000`) → `400`, `"A record with this <field> already exists."`
  - `CastError` (bad ObjectId in `:id`) → `400`, `"Invalid <path>: <value>"`
  - JWT invalid/expired → `401`
  - Unhandled → `500`, generic `"Internal server error"` (real message hidden in prod)
- **Rate limits**: `POST /auth/login` — 5 requests / 15 min per IP. `POST /messages` — 5 requests / hour per IP. Both return `429`.
- **Pagination**: `projects`, `posts`, `admin/projects`, `admin/posts`, and `messages` (admin) paginate via `?page=&limit=`, returned in `meta`. `skills` and `certifications` return the full array, no pagination.
- **IDs**: MongoDB ObjectId strings as `_id`. Public read endpoints for projects/posts use `:slug`; admin write/detail endpoints use `:id`.
- **Public endpoints never leak unpublished content**, under any query string — `status` is not a client-controllable filter on any public list.

---

## Endpoint reference

| Frontend Feature | Endpoint | Method | Auth | Request | Response (`data`) |
|---|---|---|---|---|---|
| Profile / About | `/profile` | GET | none | — | Full profile object, **never 404s, never null** — see [Profile](#profile) |
| Profile — update | `/profile` | PATCH | admin | Partial profile body (below); `resume` field rejected with 400 | Updated profile |
| Resume / CV upload | `/profile/resume` | POST | admin | `multipart/form-data`, field `file`, PDF only, ≤5 MB | `data.resume = {url, publicId, fileName, updatedAt}` |
| Login | `/auth/login` | POST | none (rate-limited) | `{ email, password }` | `{ _id, email, role }` + sets `token` cookie |
| Logout | `/auth/logout` | POST | none | — | clears cookie |
| Current admin user | `/auth/me` | GET | required | — | `{ _id, email, role, createdAt, updatedAt }` |
| Projects — list | `/projects` | GET | none | `section?, featured?, page?=1, limit?=12` | array of Project + `meta`. Sort: featured first, then `order` asc, then `publishedAt` desc |
| Projects — detail | `/projects/:slug` | GET | none | — | single Project (404 if not `published`) |
| Projects — create | `/projects` | POST | admin | Project body | created Project |
| Projects — update | `/projects/:id` | PATCH | admin | partial Project body | updated Project |
| Projects — delete | `/projects/:id` | DELETE | admin | — | message only |
| Blog — list | `/posts` | GET | none | `tag?, page?=1, limit?=10` | array of Post **without `content`** + `meta` |
| Blog — detail | `/posts/:slug` | GET | none | — | full Post incl. `content` (404 if not `published`) |
| Blog — create | `/posts` | POST | admin | Post body | created Post |
| Blog — update | `/posts/:id` | PATCH | admin | partial Post body | updated Post |
| Blog — delete | `/posts/:id` | DELETE | admin | — | message only |
| Admin: projects list | `/admin/projects` | GET | admin | `status?` (draft/published/omitted=all), `section?, page?=1, limit?=20` | array of Project (any status) + `meta` |
| Admin: project detail | `/admin/projects/:id` | GET | admin | — | Project by `_id`, any status |
| Admin: posts list | `/admin/posts` | GET | admin | `status?, tag?, page?=1, limit?=20` | array of Post **without `content`** (any status) + `meta` |
| Admin: post detail | `/admin/posts/:id` | GET | admin | — | Post by `_id`, any status, **full `content`** |
| Contact form | `/messages` | POST | none (rate-limited) | `{ name, email, subject?, body, website? }` | `201` regardless of honeypot outcome — see [Contact & notifications](#contact--notifications) |
| Messages — list (inbox) | `/messages` | GET | admin | `read?, page?=1, limit?=20` | array of Message + `meta` |
| Messages — mark read | `/messages/:id/read` | PATCH | admin | — | updated Message |
| Messages — delete | `/messages/:id` | DELETE | admin | — | message only |
| Skills — list | `/skills` | GET | none | `category?` | full array, sorted by category, order, level desc |
| Skills — create/update/delete | `/skills` `/skills/:id` | POST/PATCH/DELETE | admin | Skill body | as usual |
| Certifications — list | `/certifications` | GET | none | `category?, featured?` | full array |
| Certifications — create/update/delete | `/certifications` `/certifications/:id` | POST/PATCH/DELETE | admin | Certification body | as usual |
| Media upload | `/media/upload` | POST | admin | `multipart/form-data`, field `file`, optional `?folder=` | `{ url, publicId, format, width, height }` |
| Media delete (preferred) | `/media?publicId=<encoded>` | DELETE | admin | query param, URL-encode the publicId | message only |
| Media delete (legacy) | `/media/:publicId` | DELETE | admin | path param, URL-encode the publicId | message only — **kept for now, scheduled for removal once nothing references it; prefer the query-param form above for new code** |

### Independent taxonomies — do not assume these interchange

Three separate category-like fields exist, deliberately unaligned:

- `Project.section`: `full-stack | blockchain | systems | hardware | creative` — the portfolio's narrative/navigation taxonomy.
- `Skill.category`: `software | blockchain | engineering | creative`
- `Certification.category`: `software | blockchain | engineering | other`

A skill like "AWS" or "Blender" doesn't map cleanly onto a project section, and certifications are even less coupled to it. Treat all three as independent vocabularies.

### Request body shapes

All partial-update (`PATCH`) schemas below are **explicitly built so an omitted field is left untouched**, not reset to its create-time default — this was a real, fixed bug (see the note under Projects). Only fields actually present in the request body are ever written.

**Project**:
```
{
  title: string (1-120),
  slug?: string,                          // auto-generated from title if omitted
  section: 'full-stack' | 'blockchain' | 'systems' | 'hardware' | 'creative',
  summary: string (1-300),
  description?: string = '',
  tags?: string[] = [],
  coverImage?: { url: string(url), publicId: string },
  gallery?: [{ url, publicId }] = [],
  models3d?: [{ url, publicId }] = [],
  links?: { github?: url|'', live?: url|'', demo?: url|'' },
  meta?: Record<string, unknown> = {},
  featured?: boolean = false,
  order?: number = 0,
  status?: 'draft' | 'published' = 'draft',
}
```
> On `PATCH`, omitting e.g. `featured` leaves the stored value alone — it will **not** be reset to `false`, and critically, omitting `status` will **not** silently unpublish a published project. (This was a real bug, fixed and regression-tested; the fix pattern is the same across Project/Post/Skill/Certification.)
>
> `publishedAt` is set automatically the moment `status` becomes `'published'` (works correctly on both create and update). `section` replaced the old `category` field/enum — see the migration note below if you're working against an older database dump.

**Post**:
```
{
  title: string (1-200),
  slug?: string,                          // auto-generated from title if omitted
  excerpt: string (1-400),
  content: string (min 1),                // readingTime is auto-computed, don't send it — recomputed correctly on update too
  coverImage?: { url: string, publicId: string },
  tags?: string[] = [],
  status?: 'draft' | 'published' = 'draft',
}
```

**Skill**:
```
{
  name: string (1-100),
  category: 'software' | 'blockchain' | 'engineering' | 'creative',
  level: integer (1-5),
  icon?: string = '',
  yearsOfExperience?: number = 0,
  description?: string = '',
  order?: number = 0,
}
```

**Certification**:
```
{
  name: string (1-200),
  issuer: string (1-100),
  category?: 'software'|'blockchain'|'engineering'|'other' = 'software',
  issueDate: ISO datetime string,
  expiryDate?: ISO datetime string,
  credentialId?: string = '',
  verifyUrl?: url|'',
  badgeImage?: { url: string, publicId: string },
  featured?: boolean = false,
  order?: number = 0,
}
```

**Message (contact form)**:
```
{
  name: string (1-100),
  email: string (email),
  subject?: string (<=200) = 'No subject',
  body: string (10-3000),
  website?: string,                       // HONEYPOT — leave this hidden/empty in the real UI
}
```

**Login**: `{ email: string(email), password: string(min 1) }` — validation messages are correct (`"Email is required"` / `"Password is required"`), not a generic Zod fallback.

---

## Profile

**`GET /profile`** is the single source for the About section and the CV link. It **never 404s and never returns `null`** — on a completely empty database it still returns `200` with a fully-shaped object (empty strings, empty arrays, `null` for unset asset references). Build the frontend against this shape immediately; content can be filled in later via `PATCH /profile` or `npm run seed:profile` for a placeholder.

```json
{
  "success": true,
  "data": {
    "name": "", "headline": "", "shortBio": "", "bio": "",
    "roles": [], "location": "",
    "avatar": null,
    "socials": { "github": "", "linkedin": "", "email": "", "website": "" },
    "availability": { "available": false, "text": "" },
    "resume": null,
    "seo": { "title": "", "description": "", "ogImage": null }
  }
}
```

`bio` is Markdown — render with a sanitizing renderer (e.g. `react-markdown` + `rehype-sanitize`), never inject as raw HTML.

**`PATCH /profile` nested-update semantics**: sending `{ socials: { github: 'new-url' } }` updates **only** `socials.github` — sibling keys (`linkedin`, `email`, `website`) are preserved, not wiped. This is deliberate (dot-path writes internally) and regression-tested. The one exception: **arrays are replaced whole**, not merged — `{ roles: ['Engineer'] }` replaces the entire `roles` array.

`resume` cannot be set via `PATCH /profile` (`400` if attempted) — it is admin-write-only via `POST /profile/resume`.

**`POST /profile/resume`**: multipart field name `file`, PDF only (checked both by declared Content-Type and by the actual file bytes — a `.pdf`-named file with the wrong magic bytes is rejected), 5 MB max. Uploading replaces the previous resume; the old Cloudinary asset is cleaned up automatically. If the upload succeeds but something fails before the database is updated, the newly-uploaded asset is deleted too (no orphaned files).

---

## Auth & CSRF

- **Cookie**: `token`, httpOnly, `SameSite=Lax` in every environment, `Secure` in production only. This assumes a **same-site production deployment** (e.g. `pawan.dev` + `api.pawan.dev`, or a proxied `/api/*`) — cross-site deployment (frontend and API on different registrable domains) is not what this cookie config is built for and would need revisiting.
- **CSRF header required on every admin write.** Any `POST`/`PATCH`/`DELETE` under `adminOnly` requires:
  ```
  X-Requested-With: portfolio-admin
  ```
  Missing or wrong value → `403 "Missing or invalid CSRF header."`, even with a fully valid auth cookie. **Do not treat this header as optional or redundant with the cookie** — it exists specifically to close a residual CSRF gap that `SameSite=Lax` alone doesn't cover (a plain cross-site `<form method="post">` top-level navigation). Set it on every admin `fetch`/`axios` call, e.g. an axios instance default:
  ```js
  axios.defaults.headers.common['X-Requested-With'] = 'portfolio-admin';
  ```
  `GET`/`HEAD`/`OPTIONS` never need this header, including on `adminOnly` routes.
- **No refresh-token flow.** The cookie simply expires after 7 days. Treat a `401` from any admin call as "redirect to login," not as a signal to attempt a silent refresh.

---

## CORS

Configured in `backend/src/app.js` via an origin-callback function, not a static origin:

- **`FRONTEND_ORIGINS`** — comma-separated list of exact allowed origins (protocol+host+port). This is the normal case; put your dev and production frontend origins here.
- **`PREVIEW_ORIGIN_REGEX`** — optional, **off by default**. Only needed for a platform with rotating preview URLs (e.g. Vercel). If you set it, anchor at both ends and escape literal dots (`^https:\/\/portfolio-[a-z0-9]+-<team>\.vercel\.app$`) — an unanchored pattern also matches an attacker's lookalike domain.
- Requests with **no `Origin` header** (curl, server-to-server, uptime monitors) are always allowed — CORS is a browser-enforced mechanism and these clients ignore it regardless.
- A rejected origin is blocked **server-side** (the request never reaches the route handler), not merely missing response headers.
- `allowedHeaders` includes `Content-Type`, `Authorization`, and `X-Requested-With` (required for the CSRF mechanism above — an admin frontend sending that header will fail preflight if this list is ever "cleaned up").
- `methods`: `GET, POST, PATCH, DELETE, OPTIONS`. No `PUT` — this API only ever uses `PATCH` for updates.

---

## Contact & notifications

`POST /messages` always returns `201` with a generic success message, whether or not the honeypot field (`website`) was tripped — a bot submitting spam gets the same response as a real visitor, so it can't tell the honeypot worked.

If `RESEND_API_KEY` and `CONTACT_NOTIFY_EMAIL` are both set, a real (non-honeypot) message triggers an email notification to the owner via Resend's HTTP API — awaited server-side with a 5-second timeout, and **any failure is logged, never surfaced to the visitor** (the message is already safely stored regardless). If either env var is unset, notification is skipped entirely (logged as a warning) — messages are still stored normally. `CONTACT_NOTIFY_FROM` is optional and defaults to a Resend sandbox address.

---

## Environment variables

**Required** (`config/env.js` exits the process if any are missing):
```
MONGODB_URI, JWT_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
CLOUDINARY_API_SECRET, FRONTEND_ORIGINS
```

**Optional**:
```
NODE_ENV, PORT, JWT_EXPIRES_IN (default 7d)
PREVIEW_ORIGIN_REGEX          — off by default, see CORS above
ADMIN_EMAIL, ADMIN_PASSWORD   — only read by `npm run seed`
VERCEL_DEPLOY_HOOK_URL        — only read by `npm run deploy:trigger`
GH_TOKEN
RESEND_API_KEY, CONTACT_NOTIFY_EMAIL, CONTACT_NOTIFY_FROM  — contact notifications; skipped gracefully if unset
```

**Frontend-side, not part of the backend `.env`**: introduce your own `VITE_API_URL` (or equivalent) pointing at the backend's `/api/v1` base, and make sure it matches an entry in `FRONTEND_ORIGINS` exactly (protocol+host+port). Every request that relies on auth must be sent with `credentials: 'include'`, and every admin write must carry the `X-Requested-With: portfolio-admin` header (see [Auth & CSRF](#auth--csrf)).

---

## Health checks

- **`GET /health`** — liveness. `200` whenever the process is up, regardless of database state. Not useful for "is this instance actually serving requests" — use `/ready` for that.
- **`GET /ready`** — readiness. `200` when MongoDB is connected, `503` otherwise (`{ status, database }` body). Point platform/container health checks here, not at `/health`.

---

## Error response format (recap)

```json
{ "success": false, "error": "human-readable message" }
```
Status codes: `400` (validation/cast/duplicate), `401` (no/invalid/expired token, bad login), `403` (non-admin, or missing/wrong CSRF header on an admin write), `404` (not found, thrown explicitly per-resource), `429` (rate limit), `500` (unhandled, including a rejected CORS origin). The Express-level 404 for unmatched routes returns the same envelope shape.

---

## Scripts

```
npm run seed            # create the (single) admin user from ADMIN_EMAIL/ADMIN_PASSWORD
npm run seed:profile    # create a placeholder Profile document if none exists
npm test                # run the backend test suite (88 tests; in-memory MongoDB, no external services touched)
npm run deploy:trigger  # POST to VERCEL_DEPLOY_HOOK_URL, if set
```

Two one-off migration/backfill scripts exist in `backend/scripts/` and are safe to re-run (no-op if there's nothing to do) — run them once against your real database if you have pre-existing data older than this contract:

```
node scripts/migrateProjectSection.js   # old category ('software'/'blockchain'/'cnc') → new section field
node scripts/backfillPublishedAt.js     # sets publishedAt on any published row that's missing it
```

---

## What the frontend should not need to build around

- No case-study-specific fields (`role`, `year`, `problem`, `solution`, `impact`, `teamSize`, …) exist on Project yet. Use `meta` (a free-form object) for any experimental fields until a real one proves it deserves a permanent schema field — note `meta` keys must avoid `$` and `.` (stripped by `express-mongo-sanitize`).
- No public signup, comments, likes, or followers — one admin, anonymous public visitors.
- No refresh-token flow for the admin session.
- 3D/presentation concerns (iceberg geometry, camera path, scroll interpolation, shaders, etc.) are entirely a frontend concern — nothing in this API is aware of them, by design.

---

*Regenerated from `backend/src` directly (routes, controllers, services, models, validators, middleware, config) on 2026-09-07, after `BACKEND_FINAL_PLAN.md` Phases 1–7. Full test suite (88 tests) passing at time of writing. This supersedes the pre-hardening version of this document.*
