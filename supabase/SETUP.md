# Supabase CMS backend setup

The CMS schema, seed and Edge Functions were installed in project `hzmrvyjolrqdsrppajqs` on 2026-10-12. See `INSTALLATION.md` for the live verification record and remaining initial owner setup. This guide also documents installation into a new empty project; do not rerun its initial seed on the operational database.

## Files

- `supabase/migrations/20261011212741_ziya_cms.sql`: tables, explicit grants, RLS, private implementations and public invoker RPCs.
- `supabase/migrations/20261012133109_cms_actor_indexes.sql`: indexes covering the audit, media and version Auth foreign keys.
- `supabase/migrations/20261012133701_cms_revision_conflict_http.sql`: non-retryable HTTP 409 revision conflicts; apply after the initial migration.
- `supabase/bootstrap-owner.sql`: intentionally incomplete one-time owner assignment. It fails until a verified Auth user UUID is supplied.
- `supabase/functions/admin-users/index.ts`: verified owner session, real Auth invite, DB-backed role assignment.
- `supabase/functions/submit-lead/index.ts`: input validation, honeypot, optional Turnstile, atomic persistent rate limits, real DB insert.
- `supabase/functions/_shared/http.ts`: CORS allowlist, bounded body reads and validation.
- `supabase/functions-config.toml`: merge into the CLI-generated configuration.
- `scripts/check-cms-security.mjs`: isolated PostgreSQL-compatible allow/deny checks; it never contacts a project.

## Installation sequence

1. Explicitly select the correct Supabase account and project. Use a dedicated project or review existing names/policies before applying the schema; this schema intentionally does not overwrite existing CMS tables or use broad grants on unrelated tables.
2. Discover the installed CLI via `supabase --help` and `supabase migration --help`. The reviewed initial migration already exists at `supabase/migrations/20261011212741_ziya_cms.sql`; use that file for a new installation rather than creating a duplicate migration. For subsequent schema changes, use `supabase migration new <descriptive-name>` and the documented local diff workflow. Do not invent migration timestamps.
3. Install first in a local/disposable development database, run policy tests and Security/Performance Advisors, then apply the reviewed migration to the intended project.
4. Seed the known template identifiers into `cms_private.cms_templates(template)` before seeding documents. For example, the import script can derive them from the fixed approved templates. The public client must not be given write access to this allowlist. Imported documents need `draft.id`, `draft.route`, `draft.template`, `draft.kind`, nonempty `draft.title`, an object `values` and array `sections`. Draft `test` may be an object or null. Seed `cms_versions` with action `seed` and the initial public snapshots intentionally, not by first visitor initialization.
5. Create the initial Auth account through the project operator workflow and confirm its email. Supply that exact UUID in `bootstrap-owner.sql`, inspect it, then execute the one-time SQL as an operator. Never ship this SQL as an RPC or expose an owner-claim endpoint. Disable public signup for the admin-only Auth project if no other part of the site needs registration.
6. Configure Auth Site URL and allowlisted redirect URLs for the real `/admin/` callback. Implement invitation/recovery password-setting UI using the received Auth session; do not rely on an invite email alone to create an admin session.
7. Set Edge Function secrets described below. Frontend receives only project URL + publishable key. The service-role key and rate-limit secret remain server-side.
8. Merge function configuration, deploy the functions using the CLI help for the installed version, then verify with dedicated test users. The browser connects with the authenticated caller JWT for admin actions.

## Environment values

| Name | Purpose |
|---|---|
| `SUPABASE_URL` | Project API URL, provided by the Edge runtime |
| `SUPABASE_ANON_KEY` | Runtime client key fallback; frontend should prefer a publishable key |
| `CMS_PUBLISHABLE_KEY` | Optional current publishable key for user-scoped Edge client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for Auth Admin and the service-only lead RPC |
| `CMS_ALLOWED_ORIGINS` | Comma-separated exact origins, e.g. `https://example.com`; no wildcard or trailing slash |
| `CMS_ADMIN_REDIRECT_URL` | Exact approved HTTPS admin invite callback; never taken from the request |
| `CMS_RATE_LIMIT_SECRET` | Strong random server secret used to hash IP/email rate keys |
| `CMS_CLIENT_IP_HEADER` | Gateway-verified client-IP header: `x-forwarded-for`, `x-real-ip` or `cf-connecting-ip` |
| `CMS_TURNSTILE_SECRET` | Optional; if configured the frontend must send a valid `captcha_token` |

**Client-IP deployment gate:** Inspect the actual trusted ingress behavior in the chosen deployment and configure only a header that the gateway strips/sets or appends authoritatively. For `x-forwarded-for` the implementation uses the final value, never the user-controlled first value. Do not deploy with a blindly selected header; if the platform does not provide a trustworthy per-client value, configure Turnstile and a trusted proxy/rate-limit gateway. The function fails closed when its required header is absent. Email throttling remains separate. CORS is not a bot authentication mechanism.

## API contract and behavior

- `cms_save_document(p_id,p_expected,p_payload)` creates only with `p_expected=0`, then increments draft revision on every save.
- `cms_publish_document(p_id,p_expected)` copies the current draft into the public table atomically. Editors cannot call it successfully.
- `cms_unpublish_document(p_id,p_expected)` and `cms_archive_document(p_id,p_expected)` remove the public row and increment revision. Homepage `/`, general settings `/_global/` and the active test cannot be removed.
- `cms_unarchive_document(p_id,p_expected)` is admin/owner only; restores an archived document to draft, increments revision and never publishes. Existing route/id/kind stay immutable even for unpublished documents.
- `cms_restore_document(p_id,p_version,p_expected)` restores that document's content as a new draft, preserves current route/id/kind, and never auto-publishes. An archived document must first be unarchived by an admin/owner; editors cannot bypass that restriction through version restore.
- `cms_set_member(p_user_id,p_role,p_active)` is owner-only, reads the email from Auth, and serializes role changes to protect the last active owner.
- `cms_update_lead(p_id,p_expected,p_status,p_notes)` is admin/owner only. Status values: `new`, `in_progress`, `contacted`, `closed`, `spam`.
- All above RPCs return the updated row. `PT409 / REVISION_CONFLICT` (HTTP 409) means reload/reconcile; never automatically retry using a higher expected revision.
- To invite a user, invoke `admin-users` with `{ "action":"invite", "email":"…", "role":"admin" | "editor" }`. Owner role is assigned only by a later explicit owner action.
- Contact payload: `{ name, email, company?, team_size?, topic, message, website:"", captcha_token? }`. Topic values: `konusmaci`, `kurumsal`, `bireysel`, `mentorluk`, `basin`, `soru`.
- Submit-lead returns `201 {ok:true,id}` only after DB commit. Email rate limit is 3 accepted submissions/hour, trusted-IP rate limit 10/hour. A `429` does not mean a lead was saved.

Application revision conflicts must use `PT409`, not the engine serialization code `40001`: PostgREST 14 can retry `40001` indefinitely. Apply the follow-up migration before production RPC traffic. If a pre-migration request is already looping, identify its exact Authenticator backend PID from the repeated error logs and terminate only that verified backend; changing the function alone does not stop in-flight loops. The admin accepts legacy `40001` during upgrade and never retries either conflict automatically.

## Storage

The `cms-public` bucket is explicitly public: files become reachable as soon as uploaded, including files used only in a draft. State this clearly in the admin upload UI and do not store private client files here. Public access to uploaded media is intentional and does not make document drafts public.

Use lowercase `<UUID>.<extension>` object paths and `upsert:false`. Allowed extensions/MIMEs are JPEG, PNG, WebP, AVIF, GIF, MP4 and WebM, maximum 50 MiB. Upload via Storage API, then insert metadata (`path`, public `url`, `mime`, `size`, `alt`, `created_by` and optional independent UUID `id`). Metadata may update only `alt` and `archived`; clients cannot mutate path/URL/creator or hard-delete objects. Replacing a file creates a new path. Archiving hides it in the picker and does not break live/historical references. Failed metadata insertion can leave an uploaded orphan; retry metadata creation, never falsely report total failure while silently hiding the file.

## Rendering and publishing boundaries

Document JSON is data, not trusted executable code. Render text as text; sanitize supported rich-text HTML, validate href/src protocols and sandbox previews. SQL verifies the document envelope, template allowlist, five allowed kinds, section/group/item shapes, at most 40 sections and 100 items per group, and the prohibited content expression case-insensitively. It does not sanitize arbitrary embedded HTML, SVG, JavaScript or CSS.

The application must additionally validate allowed component/value types and source references. For `kind=test`, the database requires 5 layers, 20 questions, 4 questions per layer, 4 choices per question with integer scores 1–4, nonempty question/choice/layer/result text, and descending integer verdict thresholds 0–100 ending at 0. It must retain the original test content when seeding. No participant test-response collection is added by this backend.

Supabase public content publication updates the database. A static host still needs the existing runtime hydration integration and an explicit solution for removed/new routes, metadata and search-engine output. Do not display a successful static rebuild or SEO refresh unless such a pipeline actually ran. Missing public rows must not silently resurrect deliberately unpublished static fallback content.

Auth invitation and membership assignment span two systems and cannot be one DB transaction. If the invitation email succeeds but the caller loses owner access before assignment, the function returns an explicit partial failure with the invited UUID. That user has no CMS access; an owner must complete the membership assignment. Never delete an existing Auth user automatically as compensation.

## Verification status

The schema was rerun on 2026-10-12 in an isolated PGlite PostgreSQL-compatible runtime with mocked Auth/Storage schemas. All 136 permission/invariant checks and all 64 current site seed-document validations passed (200 checks total). Coverage includes draft visibility, nonmember access, editor publication denial, revision conflicts, membership revocation without a JWT refresh, last-owner protection, public snapshot isolation, version restore, unarchive permissions, immutable document identity, protected routes, malformed sections/tests, lead throttling and immutable Storage writes. Additional cases verify direct table-write denial even for owners, ignored forged role metadata, media ownership checks and archived-media URL preservation.

The same script runs 36 request/response checks against the actual bundled Edge Function handlers using isolated in-process Auth, REST and Turnstile stubs. These cover rejected origins, absent/invalid sessions, input limits, trusted-IP failures, rate-limit responses, captcha failures, owner-only invitation, safe callback origins and partial invitation failure. They send no requests or email and do not prove a deployed gateway works. Run with `CMS_PGLITE_MODULE=<absolute-path-to-pglite-module> CMS_SEED_FILE=cms/seed.json node scripts/check-cms-security.mjs` if PGlite is provided outside this repository; otherwise the script resolves the installed `@electric-sql/pglite` package. See `reports/cms-security-2026-10-12.md` for scope and remaining live checks.

Both Edge Functions passed `deno check --node-modules-dir=manual` using the pinned Supabase client installed through npm. Direct Deno registry access was unavailable in this environment, so dependencies were resolved through npm for this check. A minimal package manifest and npm lockfile are included; run `npm ci --ignore-scripts` in the functions directory before repeating that exact local check. No local verification dependency directory is included in the deliverable.

The isolated checks above do not substitute for live verification. Actual Auth gateway, Storage, RPC, CORS, ingress-header, lead-submission and Advisor results are recorded separately in `INSTALLATION.md`. Invitation/recovery email delivery and visual browser interaction remain unverified; no outbound email was sent during setup.

## This site deployment

The approved static source now lives under `website/`. Vinext server routes render published snapshots, new routes, metadata and the sitemap directly from Supabase, without a static rebuild. Missing snapshots return 404 and backend failures return 503. Only when `cms/config.json` explicitly has `enabled:false` does the installation preview use original seeded content. After account/project selection, set `url`, `publishableKey` and `enabled:true` in that config and rebuild. Never put the service role key in this file. `leadsEnabled:true` is separate and must wait for the submit-lead deployment checks.

Migration filenames were generated by the installed Supabase CLI. `node scripts/prepare-cms.mjs` generates `supabase/seed.sql` and `cms/installation-schema.json`, which includes every migration in filename order. The `/admin/kurulum.sql` HTTP route serves the combined installer (migrations + seed; no secrets). For a new empty project, use either that installer or all migrations in order followed by seed, never both. Do not rerun seed on an operational CMS: it can republish intentionally unpublished documents. Initial owner bootstrap remains a separate operator action.
