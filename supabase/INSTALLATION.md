# Supabase installation — 2026-10-12

Project: `hzmrvyjolrqdsrppajqs` (the project explicitly provided by the user).
Site: https://ziya-sakir-yilmaz-keynote.dev-busraaktas.chatgpt.site
Admin: https://ziya-sakir-yilmaz-keynote.dev-busraaktas.chatgpt.site/admin/

## Installed

- Three tracked migrations: initial CMS, Auth foreign-key indexes, non-retryable HTTP 409 revision conflicts.
- 64 original documents, templates and published snapshots: 63 pages plus shared navigation. Existing home counters and motion content retained.
- Nine CMS tables with RLS; public reads limited to published content. Drafts, team membership, leads and version history require membership and role checks.
- Public `cms-public` media bucket with immutable UUID paths, MIME allowlist and 50 MiB limit.
- Deployed `admin-users` (`verify_jwt=true`) and `submit-lead` (`verify_jwt=false`, public form with validation/rate limits).
- Auth signup disabled, minimum password length 12, exact site/admin redirect allowlist.
- Exact-origin CORS, random server-only rate secret and `CMS_CLIENT_IP_HEADER=cf-connecting-ip`.
- Frontend stores only project URL and the publishable client key. No access token, DB password or service credential is in the repository.

## Live verification

- Actual temporary Auth accounts signed in successfully. Owner authorization, editor/outsider denial, `getUser`, draft save, publish, unchanged published snapshot after draft edits, HTTP 409 stale save, unpublish, Storage upload and unauthorized upload rejection passed (23 API assertions).
- 49 live REST/SQL assertions passed: anonymous boundaries, forged role metadata, editor/admin roles, history restore, archive/unarchive, membership revocation, lead permissions and persistent throttling. Transactional fixtures were rolled back.
- Lead endpoint: valid CORS, rejected origin, honeypot, invalid email/topic, three accepted records and fourth request HTTP 429 with Retry-After were checked against the real function and database. Temporary lead records and their rate windows were removed.
- Protected temporary ingress probe verified that forged X-Forwarded-For and X-Real-IP do not change CF-Connecting-IP; forging CF-Connecting-IP was rejected by the gateway. The probe function and its secret were deleted.
- Temporary Auth users, CMS test page/history/audit and uploaded image were removed. No real person was invited or emailed.
- Supabase Advisors: no ERROR findings, no performance WARN findings, no missing foreign-key indexes. Private deny-all tables intentionally show RLS/no-policy INFO; new unused-index INFO is expected.
- Local regression: 200 SQL/seed checks, 36 Edge handler checks and 28 admin workflow tests passed. The 63-page metadata/SSR regression also passed.
- Actual server rendering fetched the home, shared navigation, contact page and 64-entry index from Supabase successfully. Home counters/TEDx content and the live lead endpoint were preserved. The bounded content fetch timeout is 10 seconds to accommodate the first cross-region connection; this is not a new Lighthouse measurement.

## Remaining

- Initial permanent owner: pending the user's chosen email. No permanent Auth user/member exists. Create/confirm the exact account, then execute the UUID-specific `bootstrap-owner.sql`; never select an owner from a project name or profile metadata.
- Email invitation/recovery delivery has not been exercised. Visual browser QA was unavailable in this environment; API, DOM and rendering checks are distinct from browser QA.
- Leaked-password protection remains disabled because this project's plan rejected the setting as Pro-only. No plan or billing change was made; the 12-character policy is enabled.

## Operational notes

Do not rerun `seed.sql` on the live CMS: it can republish intentionally unpublished pages. Use role-checked RPCs for edits and subsequent tracked migrations for schema changes.

PostgREST 14.18 retried application SQLSTATE 40001 indefinitely during the live stale-save test. The follow-up migration changes all revision conflicts to PT409 (HTTP 409). Only the confirmed temporary test backend was terminated, and the live conflict request then returned 409 successfully. The admin retains drafts and never automatically retries a conflicting save.

## Advanced content controls — 2026-10-13

Applied only `20261013083441_advanced_cms_controls.sql` to the existing project. Management API history version: `20261013084830`, name `advanced_cms_controls`. All existing documents and their publication state were preserved; the seed was not reapplied.

Verified actual RPC saves and publication of optional navigation, article/note collections, experience settings, robots and legacy documents inside a transaction. Confirmed draft isolation, PT409 stale writes, unsafe URL rejection, invalid robots rejection and editor publication denial; rolled back every probe. 64 published documents and zero probe users remained. Security/performance advisors reported no ERROR/WARN findings.

The first permanent management account still needs its intended email address. This update does not invite an assumed recipient or send email.
