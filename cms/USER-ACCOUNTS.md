# SMTP-free CMS accounts

Only active owners who have completed their password change may create accounts in **Ekip ve yetkiler → Kullanıcı oluştur**. Choose an editor or administrator role. The form generates a cryptographically random temporary password before submission; it can be copied there and appears again in the result dialog; no email is sent. Share the login details directly with the intended person.

The first login shows a full-page password change form. Until the Auth password is actually changed, `cms_members.must_change_password` blocks private content, media and write RPCs through `cms_private.has_role`. Users cannot clear this column or use editable metadata to unlock access. Existing members are not forced to change passwords by this migration.

`cms_register_created_member` rechecks the owner's permissions and atomically registers the new member with the password requirement. Registration failure attempts to remove only the new Auth account created by that request. Duplicate emails never reset or overwrite existing accounts. If the response is lost, the same generated password stays in the form; check the team list before retrying.

## Server deployment

Apply `supabase/migrations/20261014091715_cms_first_login_password.sql` before deploying the UI.

Set `SUPABASE_SERVICE_ROLE_KEY` as a **secret runtime environment variable** on the site server. It is used only by `/api/cms/users` after a verified Supabase session and database owner check. Never prefix it with `NEXT_PUBLIC_` or `VITE_`, put it in `cms/config.json`, or commit its value.

Sites: configure the secret through the hosting environment settings and redeploy. Cloudflare Workers: after the build, run `npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config dist/server/wrangler.json` and enter the key securely. Vercel requires the same server-only environment variable before redeploying.

No SMTP, invitation redirect, or change to the legacy Edge Function's gateway JWT settings is needed. Account creation uses the site's same-origin server route; password changes go to Supabase Auth with the user's session.

## Deleting accounts

Apply `20261015202445_cms_member_deletion.sql`. Owners can delete editor/admin accounts after confirming the exact email. Own accounts and owner accounts cannot be deleted. A locked caller-scoped RPC disables access first; Supabase Auth then deletes the user and membership. An Auth deletion trigger prevents concurrent reactivation or owner promotion from being deleted. If Auth deletion fails, the disabled member remains visible for retry. Auth-owned storage objects may require reassignment before deletion. Site content is retained.
