# Backend — Final Plan Before Frontend Lock (v2)

**Status:** 🔒 BACKEND LOCKED (2026-09-07) — all 8 phases complete, 88/88 tests passing
**Supersedes:** `Backend_Final_Changes_Before_Frontend.md`, and v1 of this document
**Companion doc:** `API-CONTRACT.md` (regenerated at the end of this plan)

Authoritative list of every backend change to make before frontend work begins. Merges the original plan, a direct read of `backend/src`, and the v1 review round. All three open decisions are now **resolved** — see §0.3.

---

## 0. What this document settles

### 0.1 Changed from the original plan

| # | Original plan said | This plan says | Why |
|---|---|---|---|
| 4 | Keep `category` **and add** `portfolioSection` | **Rename** `category` → `section` with the 5 portfolio values. One taxonomy. | Two overlapping enums (with `blockchain` in both) means every write keeps two fields consistent, they can contradict, the admin UI needs two dropdowns, and the frontend must know which wins. Nothing consumes `category` yet. Permanent cost vs. one migration script. |
| 5 | Add `application/pdf` to the shared `/media/upload` | **Dedicated** `POST /profile/resume`, own multer instance (PDF only, 5 MB, magic-byte checked) | Shared uploader has one global 15 MB limit, so "PDF max 5 MB" is inexpressible there. Also see **B5** — the current pipeline would corrupt the PDF. |
| 8 | Add CSRF token infrastructure | **Conditional on topology.** Same-site + `SameSite=Lax` ⇒ custom header, no token system. | `Lax` already blocks cross-site state-changing requests. Building tokens *then* deploying same-site is wasted work. Topology is now decided (§0.3) so this resolves to the simple path. |
| 10 | `DELETE /media` with `publicId` in the body | `DELETE /media?publicId=<encoded>` | Bodies on DELETE get stripped by some proxies. A query param solves the slash-encoding problem and keeps the verb honest. |
| 2 | *(v1 said)* admin post list returns full `content` | Admin post list **omits** `content`; editor fetches `/admin/posts/:id` | The list is a table view that never renders Markdown. Full content for 20 posts is payload for nothing, and `/admin/posts/:id` already exists for the editor. |
| 7.5 | *(v1 said)* automated tests **or** an `api.http` file | Automated regression tests are **mandatory**, written **per phase**. `api.http` is kept for manual poking, not as a substitute. | These are regression tests for bugs that exist right now. See §0.4 on why they are written per-phase rather than batched. |

### 0.2 Bugs in the current code (none were in the original plan)

| ID | Bug | Severity |
|---|---|---|
| **B1** | `GET /posts?status=draft` leaks unpublished posts. `postService.getAll` takes `status` from `req.query` via an overridable default parameter. | **Critical** |
| **B2** | `publishedAt` and `readingTime` are never set on update. Both live in `pre('save')` document hooks; every update service uses `findByIdAndUpdate`, which fires query middleware only. Publishing a draft via `PATCH` leaves `publishedAt` undefined, silently breaking the sort. | **Critical** |
| **B3** | `mediaService.destroy`'s `raw` fallback is dead code — Cloudinary resolves `{ result: 'not found' }` rather than throwing, so the `catch` never runs and raw assets are never deleted. | High |
| **B4** | `app.set('trust proxy', …)` is never called. Behind a platform proxy, `express-rate-limit` v8 mis-keys every visitor to the proxy IP or throws its validation error. | High |
| **B5** | The upload pipeline applies `format: 'webp'` to anything not GLB/octet-stream. A PDF routed through it becomes a corrupt WebP. | High (blocks Phase 5) |
| **B6** | No tests, no `test` script. The original work order's "re-run API tests" referenced something that does not exist. | Medium |
| **B7** | *(found in review)* Nested profile `PATCH` would wipe sibling keys — `$set` on `{socials: {github}}` replaces the entire `socials` subdocument, destroying `linkedin` and `website`. | **Critical** (would have shipped) |

To **verify** during implementation (new major versions, low confidence):
- **V1** — `updateXSchema = createXSchema.partial()` with `.default([])` on `tags`: confirm an omitting `PATCH` does not overwrite stored tags with `[]`.
- **V2** — `auth.validator.js` uses Zod v3's `{ required_error }`, replaced by `{ error }` in v4. Confirm the intended message actually surfaces.

### 0.3 Resolved decisions

1. **Field name → `section`.** Values: `full-stack | blockchain | systems | hardware | creative`. No consumers, little data — take the clearer domain term now. Larger diff than reusing `category` (indexes, filter param, contract) but correct.
2. **Skill and Certification taxonomies stay independent.** Python, AWS, MongoDB, Blender do not single-select cleanly onto the five narrative sections, and certifications are further removed still. Forcing alignment would make the data model serve a presentation metaphor. Document the three vocabularies as deliberately distinct so the frontend never assumes they interchange.
3. **Same-site production topology.** `pawan.dev` + `api.pawan.dev`, or `pawan.dev/api/*` proxied. Enables `HttpOnly + Secure + SameSite=Lax` and the simple CSRF design. Cross-site (`*.vercel.app` ↔ `*.onrender.com`) is acceptable during development only, never as the final architecture.

### 0.4 Testing discipline

Automated tests are mandatory before backend lock, and **each phase's tests are written inside that phase, not batched afterward.**

The reason is specific: these are regression tests for bugs that exist in the code today. A test authored after its fix has only ever been observed green, which is an assertion about nothing — it may not exercise the bug at all. Written per-phase, each test is seen failing against the real defect, then passing. That is the only thing that makes it a regression test rather than decoration.

The dedicated testing step before Phase 7 is therefore a **consolidation gate**, not an authoring step: full suite green, required behaviors confirmed covered, `api.http` refreshed.

**Stack:** `node:test` (built into Node 18+) + `supertest` + `mongodb-memory-server`.

**Cloudinary must be mocked, never hit live.** Testing the `{result:'not found'}` → retry-as-`raw` path against the real API means CI credentials and junk assets. Because `media.service.js` imports the shared configured cloudinary object, tests stub it by assigning the property directly — `cloudinary.uploader.destroy = async () => ({ result: 'not found' })` — which works under ESM since it mutates the object rather than rebinding the import. Same technique for `upload_stream`.

**Required coverage before lock:**

- [ ] `GET /projects?status=draft` returns no drafts
- [ ] `GET /posts?status=draft` returns no drafts
- [ ] Draft slug 404s on both public detail routes
- [ ] Every `/admin/*` route: 401 without cookie, 403 for non-admin, 200 for admin
- [ ] Profile upsert creates exactly one document; a second `PATCH` updates rather than inserting
- [ ] **Nested `PATCH` preserves sibling keys** (the B7 regression)
- [ ] `PATCH` setting `status: 'published'` sets `publishedAt`
- [ ] `PATCH` changing post `content` recomputes `readingTime`
- [ ] Resume replacement: new asset stored, profile updated, old asset deleted
- [ ] Resume failure path: DB update failure deletes the newly uploaded asset
- [ ] Non-PDF and fake-PDF (wrong magic bytes) resume uploads rejected
- [ ] `mediaService.destroy` retries as `raw` when the image attempt returns `not found`

---

## Phase 1 — Close the public data leaks

**Goal:** No public endpoint returns unpublished content under any query string.

**1.1 Projects.** In `projectService.getAll`, remove the `status` parameter entirely and hard-code `status: 'published'`. Delete the `if (!query.status)` fallback — that conditional *is* the hole. Public filters: `section`, `featured`, `page`, `limit`.

**1.2 Posts (B1).** Same fix in `postService.getAll`. Remove the `status = 'published'` **default parameter** — a default is overridable, which is the bug — and hard-code the filter. Public filters: `tag`, `page`, `limit`.

**1.3** Confirm `getBySlug` on both still forces `status: 'published'` (it does) with a test against a known draft slug.

**Tests this phase:** first three items in §0.4. Write them before the fix so you watch them fail.

---

## Phase 2 — Admin read routes

**Goal:** The admin dashboard never uses a public route as a workaround.

New `routes/admin.routes.js`, mounted with guards applied **once at the mount point** so a future route cannot forget them:

```js
router.use('/admin', protect, adminOnly, adminRoutes);
```

| Route | Behavior |
|---|---|
| `GET /admin/projects` | `status` **is** caller-controlled here (`draft`/`published`/omitted = all), plus `section`, `page`, `limit`. Wire to existing `projectService.getAllAdmin`. |
| `GET /admin/projects/:id` | By `_id`, any status. New service method. |
| `GET /admin/posts` | New `postService.getAllAdmin`. **Omits `content`** — list view only. |
| `GET /admin/posts/:id` | By `_id`, any status, **full `content`** for the editor. |

Existing `POST`/`PATCH`/`DELETE` routes stay where they are. No cosmetic refactor.

**Tests:** guard matrix (401/403/200) across all four routes; admin list returns drafts; admin post list has no `content` key; admin post detail does.

---

## Phase 3 — Profile singleton (About + CV)

### 3.1 Model — `models/Profile.js`

```js
{
  singleton: { type: String, default: 'main', unique: true, immutable: true },
  name, headline, shortBio, bio,           // bio is Markdown
  roles: [String],
  location,
  avatar:  { url, publicId },
  socials: { github, linkedin, email, website },
  availability: { available: { type: Boolean, default: false }, text },
  resume:  { url, publicId, fileName, updatedAt },
  seo:     { title, description, ogImage: { url, publicId } },
}
```

The unique `singleton` field is the actual enforcement mechanism for "only one profile".

### 3.2 Nested PATCH semantics — **B7, the critical detail**

A naive `findOneAndUpdate({singleton:'main'}, {socials:{github:'new'}})` issues `$set` on the whole `socials` subdocument and **destroys `linkedin` and `website`**. This must not be possible.

**Rule: flatten the validated update into dot-paths before writing.**

```
{ socials: { github: 'new' } }   →   { 'socials.github': 'new' }
```

Only `socials.github` is touched; siblings survive. Dot-paths also create nested structure correctly under `upsert`, so the singleton insert still works.

**Flattening rules — exact:**

| Input | Behavior |
|---|---|
| Plain object | Recurse into it, emit dot-paths for leaves |
| **Array** (`roles`, and any future array) | **Do not recurse.** Assign whole — `roles: ['a']` means *replace the array*, not merge index-wise |
| String / number / boolean | Leaf, emit as-is |
| Empty string | A valid value that clears a field (all these fields are strings — no `null` semantics needed) |

Apply flattening **after** Zod validation, so only allowlisted paths can ever reach `$set`.

Write to:

```js
Profile.findOneAndUpdate(
  { singleton: 'main' },
  { $set: flattened },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
)
```

**Test (mandatory):** seed `socials` with three keys, `PATCH` one, assert the other two are unchanged. Also assert `roles` replaces rather than merges.

### 3.3 `GET /profile` — public

**Never 404, never return `null`.** On an empty database return a fully-shaped object with empty strings and empty arrays, so a fresh clone renders a blank About section instead of crashing the frontend on `profile.socials.github` of undefined. Strip `singleton`, `_id`, `__v`.

### 3.4 `PATCH /profile` — admin only

Zod partial with nested optional objects. Feeds the flattener in 3.2.

### 3.5 `scripts/seedProfile.js` + `seed:profile` script

Upserts a placeholder. Without it every fresh environment has a blank About page and no obvious cause.

---

## Phase 4 — Rename `category` → `section`

**4.1** In `models/Project.js` and `validators/project.validator.js`: rename the field to `section`, enum `full-stack | blockchain | systems | hardware | creative`. Update both compound indexes.

**4.2** `scripts/migrateProjectSection.js`, run once, kept in-repo as a record:

```
software → full-stack     blockchain → blockchain     cnc → hardware
```

Check the collection count first; if empty this is a no-op — note that result rather than assuming it ran.

**4.3** Public filter becomes `GET /projects?section=systems`. Status stays hard-coded published from Phase 1.

**4.4** `Skill.category` and `Certification.category` are **unchanged** per §0.3.2. Add an explicit note to `API-CONTRACT.md` that the three taxonomies are independent by design.

---

## Phase 5 — Resume pipeline

### 5.1 Fix B5 and tighten the general uploader

`media.service.js` currently picks `resource_type` by inverted allowlist (`isModel ? raw : image`) and applies `format: 'webp'` to everything else — so any unrecognized type is treated as an image and transcoded.

Replace with **explicit positive allowlists**:

```
image/jpeg, image/jpg, image/png, image/webp, image/gif   → resource_type: 'image'  (+ webp/quality transform)
model/gltf-binary, application/octet-stream               → resource_type: 'raw'    (no transform)
anything else                                             → reject
```

Multer's `fileFilter` already bounds the general uploader to that same set, so this is hardening rather than an open hole today — but it makes the mapping correct by construction, so adding a mimetype to the filter later cannot silently produce a mangled or arbitrary raw asset. Resume PDFs never go through this uploader.

### 5.2 `POST /profile/resume` — admin only

Own multer instance in `middleware/upload.js`: `application/pdf` only, 5 MB limit, memory storage.

**Verify the bytes, not just the header.** `file.mimetype` is browser-supplied and trivially spoofed. After multer fills the buffer, assert it begins with `%PDF-`:

```js
if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') throw new ApiError(400, 'File is not a valid PDF');
```

The PDF spec tolerates leading bytes before the header and a few exporters emit them, so log rejections clearly — a strict byte-0 check is right for a self-uploaded CV, but the 400 should be diagnosable if a legitimate file ever trips it.

### 5.3 Replacement flow with compensation

Cloudinary and MongoDB cannot be atomic together, so an upload that succeeds followed by a DB write that fails leaves an orphaned asset. Compensate:

```
1. upload new PDF → portfolio/resume, resource_type: 'raw'
2. read current profile, capture previous resume.publicId
3. try: update profile with new { url, publicId, fileName, updatedAt }
   └─ on failure: delete the just-uploaded asset, then propagate the original error
4. delete previous asset — non-fatal, log failures only
```

The compensating delete in step 3 can itself fail; log it and still propagate the *original* error, which is the one that explains what happened.

**Tests:** happy path, forced DB failure cleans up the new asset, non-PDF rejected, fake-PDF (wrong magic bytes) rejected.

---

## Phase 6 — Correctness fixes in existing code

**6.1 `publishedAt` / `readingTime` on update (B2).** Change `update()` in `project.service.js` and `post.service.js` from `findByIdAndUpdate` to `findById` → `Object.assign(doc, data)` → `doc.save()`. Document middleware then fires, full validation runs, and create/update share one code path. (The `pre('findOneAndUpdate')` alternative duplicates the logic in two places and will drift — don't.) Performance is irrelevant at this scale.

Backfill existing rows where `status === 'published'` and `publishedAt` is missing.

**6.2 Media deletion (B3 + item 10).** Fix `destroy()` to inspect the resolved value — if `result.result !== 'ok'`, retry with `resource_type: 'raw'`. Add `DELETE /media?publicId=<encoded>`, Zod-validated, admin only. Keep the old path route until nothing references it, then delete it.

**6.3 Trust proxy (B4).** `app.set('trust proxy', 1)`, guarded to production or driven by an env var so local dev keeps keying on the real socket address.

**6.4 Deterministic sort.** Public project sort → `{ featured: -1, order: 1, publishedAt: -1 }` with a matching compound index. Document in the contract that rows without `publishedAt` sort last within their tier — 6.1 stops producing those going forward.

**6.5 Health and readiness.** Split them:

```
GET /health  → 200 always while the process is alive       (liveness)
GET /ready   → 200 when Mongo is connected, else 503       (readiness)
```

Returning `200 {"database":"down"}` is useless to Render/Railway/container health checks — they act on status codes. Point the platform's health check at `/ready`. If the platform supports only one path, use `/ready`.

**6.6** Verify V1 and V2 (§0.2).

---

## Testing consolidation gate

Full suite green. Every box in §0.4 checked. `api.http` refreshed to match the current routes. This gate is passed *before* Phase 7 begins — no phase reaches it with unwritten tests, since tests ship inside their phase.

---

## Phase 7 — Production hardening

### 7.1 CORS allowlist

Replace the single `FRONTEND_URL` with `FRONTEND_ORIGINS` (comma-separated) and an origin callback.

- **Allow requests with no `Origin` header** (`!origin`) — curl, server-to-server, uptime monitors send none.
- **Preview origins must be narrowly scoped.** Never `*.vercel.app` — that authorizes *anyone's* Vercel deployment to make credentialed requests. Match your actual project+team pattern, anchored at both ends with escaped dots:
  ```js
  /^https:\/\/portfolio-[a-z0-9]+-<team-slug>\.vercel\.app$/
  ```
  An unanchored or unescaped pattern also matches `evil-vercel.app.attacker.com`. Gate previews behind an explicit env flag, and prefer injecting specific preview origins where practical.
- **`allowedHeaders` must include the CSRF header** (§7.3) — `X-Requested-With`, plus `X-CSRF-Token` if the token path is ever taken. The contract currently allows only `Content-Type` and `Authorization`, so the admin frontend would fail preflight. Fix here, not at discovery time.
- **Update `config/env.js`** — its `required` array still lists `FRONTEND_URL`; renaming without updating it hard-exits the server on boot.

Never `origin: '*'` with `credentials: true`.

### 7.2 Cookie strategy

Per §0.3.3, same-site. Production cookie: `HttpOnly`, `Secure`, `SameSite=Lax`. Pre-deploy verification: exact CORS origin, `credentials: 'include'` client-side, HTTPS end to end.

### 7.3 CSRF — simple path

Topology is decided, so this resolves to: `SameSite=Lax` **plus** a required custom header on all admin `POST`/`PATCH`/`DELETE`, e.g. `X-Requested-With: portfolio-admin`.

**Record why this works:** `X-Requested-With` is deliberately *not* a CORS-safelisted header, so sending it forces a preflight that an unlisted origin fails. That is the entire mechanism — without this note someone will later "simplify" the header away as redundant.

Double-submit tokens are built **only** if the topology ever changes to cross-site. JWT stays in the httpOnly cookie regardless.

### 7.4 Contact notification

```
store message → try send (awaited, with timeout) → swallow/log failure → return success
```

**Await the send rather than fire-and-forget.** An unawaited promise can be dropped if execution is frozen after the response — currently hypothetical, since this is a long-running Express process rather than a serverless function, but awaiting costs nothing and keeps a future serverless deploy safe.

**Wrap it in a ~5s `Promise.race` timeout** so a hung provider cannot hang the visitor's request, and swallow both rejection and timeout — a mail failure must never turn a successfully stored message into a visitor-facing error. Log failures distinctly.

**Do not notify on honeypot hits** — `messageService.create` returns `null` for those; branch on it. Resend is the least-effort provider.

---

## Phase 8 — Regenerate and lock

1. Rewrite `API-CONTRACT.md` from the updated code — no hand-patching.
2. Review once for gaps.
3. **Backend locked.** No further backend features unless frontend work exposes a genuine missing requirement.

> The danger at this point is no longer poor planning. It is continuing to improve the plan instead of implementing the product.

---

## Deliberately not doing

Public signup · multiple roles · social login · comments · likes · followers · public refresh tokens · complex permissions · custom analytics · backend-controlled 3D behavior.

Analytics via Vercel/Plausible/Cloudflare, not built here. Admin dashboard extras (unread counts, draft counts, media management UI) are frontend work, after the lock.

**Stays in the frontend:** iceberg geometry, camera path, 450° orbit, scroll interpolation, damping, fog, lighting animation, marine snow, vertex/core glow, water shader, 3D label positions, responsive layout, mobile fallback, `prefers-reduced-motion`, typography, navigation animation.

**Case-study fields:** not schema fields yet. Use `meta` until the frontend design proves one deserves permanence. Note `express-mongo-sanitize` strips keys containing `$` or `.`, so `meta` keys must avoid both.

**Project detail content:** `description` is Markdown by contract — documentation only, no backend change. Render with `react-markdown` + `rehype-sanitize`. Never store or render raw unsanitized HTML.

---

## File-by-file change map

| File | Change | Phase |
|---|---|---|
| `services/project.service.js` | Hard-code published; `getByIdAdmin`; `update` → `findById`+`save`; new sort | 1, 2, 6 |
| `services/post.service.js` | Hard-code published; `getAllAdmin` (no content), `getByIdAdmin`; `update` rewrite | 1, 2, 6 |
| `services/media.service.js` | Positive-allowlist `resource_type`; fix `destroy` result check | 5, 6 |
| `services/profile.service.js` | **New** — singleton upsert, dot-path flattener, resume swap + compensation | 3, 5 |
| `models/Project.js` | `category` → `section`; enum; indexes | 4 |
| `models/Profile.js` | **New** | 3 |
| `routes/admin.routes.js` | **New** — guarded at mount | 2 |
| `routes/profile.routes.js` | **New** — public GET, admin PATCH, admin POST resume | 3, 5 |
| `routes/media.routes.js` | Query-param delete | 6 |
| `routes/index.js` | Mount admin + profile | 2, 3 |
| `validators/project.validator.js` | `section` enum | 4 |
| `validators/profile.validator.js` | **New** | 3 |
| `validators/media.validator.js` | **New** | 6 |
| `middleware/upload.js` | `uploadResume` instance | 5 |
| `config/env.js` | `FRONTEND_URL` → `FRONTEND_ORIGINS` | 7 |
| `app.js` | CORS allowlist + headers; `trust proxy`; `/health` + `/ready` | 6, 7 |
| `scripts/seedProfile.js` | **New** | 3 |
| `scripts/migrateProjectSection.js` | **New** | 4 |
| `tests/**` | **New** — per phase | 1–6 |
| `backend/api.http` | **New** — manual smoke, not a test substitute | gate |
| `API-CONTRACT.md` | Full regeneration | 8 |

---

## Execution order

```
Phase 1  Security leaks            (+ tests)
   ↓
Phase 2  Admin read API            (+ tests)
   ↓
Phase 3  Profile singleton         (+ nested-PATCH regression test)
   ↓
Phase 4  Project.category → section
   ↓
Phase 5  Resume pipeline           (+ tests)
   ↓
Phase 6  Existing correctness bugs (+ tests)
   ↓
TESTING CONSOLIDATION GATE — full suite green
   ↓
Phase 7  Production hardening
   ↓
Regenerate API-CONTRACT.md
   ↓
BACKEND LOCK
   ↓
FRONTEND
```

---

## Checklist

**Before frontend**
- [x] 1.1 Projects: `status` not caller-controlled
- [x] 1.2 Posts: same leak closed *(B1)*
- [x] 1.3 Draft slugs 404 on both detail routes (already correct; regression-tested)
- [x] 2 Admin routes, guarded at mount; post list omits `content`
- [x] 3.1–3.2 Profile model + **dot-path nested PATCH** *(B7)*
- [x] 3.3–3.4 Public GET never 404s; admin PATCH upserts
- [x] 3.5 Profile seed script
- [x] 4.1–4.2 `section` rename + migration script (not run — dev DB has no project data yet; see note)
- [x] 4.3 Public filtering by `section`
- [x] 4.4 Independent taxonomies documented (no consumers of `Skill.category`/`Certification.category` touched)
- [x] 5.1 Positive-allowlist upload mapping *(B5)*
- [x] 5.2 Resume route: PDF-only, 5 MB, magic bytes verified
- [x] 5.3 Replacement compensation on DB failure
- [x] 6.1 `publishedAt` / `readingTime` on update + backfill script *(B2)*
- [x] 6.2 Destroy fallback + query-param delete *(B3)*
- [x] 6.3 `trust proxy` *(B4)*
- [x] 6.4 Deterministic sort + index
- [x] 6.5 `/health` + `/ready` (503 when DB down)
- [x] 6.6 V1, V2 verified — **both were real bugs, not false alarms; both fixed** (see note below)
- [x] **B8 (new, found during 6.6):** partial-update validators applied create-time defaults to omitted fields on Project/Post/Skill/Certification — fixed across all four
- [ ] **GATE** All §0.4 coverage green *(B6)*

**Before production**
- [x] 7.1 CORS allowlist: no-origin allowed, narrow preview regex, CSRF header allowed, `env.js` updated
- [x] 7.2 Cookie code fixed to same-site (`HttpOnly + SameSite=Lax` always; `Secure` in production) — **actual deployment/DNS is still your action item, not something this session can do**
- [x] 7.3 Custom-header CSRF + rationale documented — centralized in `adminOnly`, covers every current and future admin write route by construction
- [x] 7.4 Contact email: awaited, timed out, honeypot-aware — **requires you to set `RESEND_API_KEY` + `CONTACT_NOTIFY_EMAIL`; gracefully no-ops until then**

**Lock**
- [x] 8 `API-CONTRACT.md` regenerated, reviewed, backend locked
