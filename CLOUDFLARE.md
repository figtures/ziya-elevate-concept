# Cloudflare Workers deployment

This repository contains the current Turkish keynote website and its Supabase admin panel.

| Setting | Value |
| --- | --- |
| Worker name | `ziya-sakir-yilmaz-cms` |
| Production branch | `main` |
| Root directory | Repository root |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy --config dist/server/wrangler.json` |
| Node version | `22.18.0` (pinned in `.node-version`; dashboard override optional) |

Cloudflare installs npm dependencies automatically. Include development dependencies because the build uses Vite and Wrangler. The generated Worker configuration includes both the server entry point and client assets.

Supabase public connection settings are read from `cms/config.json`; owner-managed user creation additionally requires the server-only `SUPABASE_SERVICE_ROLE_KEY` runtime secret. Never add a database password, management access token, or service-role key to frontend configuration.

## Change the production domain

The committed `cms/config.json` is the common domain setting for canonical links, Open Graph, structured data, sitemap, robots, llms.txt and the admin preview. Known old asset URLs are rebased to this origin. Arbitrary request headers never determine the canonical address.

First inspect the configuration plan (this makes no network calls or changes):

```sh
npm run domain:configure -- https://your-domain.com --alias https://www.your-domain.com
```

Supply `SUPABASE_ACCESS_TOKEN` securely in your local shell environment and apply the same command:

```sh
npm run domain:configure -- https://your-domain.com --alias https://www.your-domain.com --apply
```

Replace the example addresses with domains you control. Omit `--alias` if no alternate domain will be attached. The command synchronizes Supabase Auth Site URL, the admin redirect allowlist, exact-origin function CORS and the admin invitation callback. It preserves the repository's approved origins and existing Auth redirect URLs, verifies both functions with non-mutating preflight requests, and only then updates the local config. No test emails, invitations or leads are sent. Secrets cannot be read back: keep any additional approved CORS origins explicitly listed in `allowedOrigins` before applying. On a partial provider failure, inspect the reported stage and rerun; do not assume rollback.

Commit the updated `cms/config.json` and let Cloudflare rebuild `main`. Attach the primary domain and every explicit alias to this Worker in Cloudflare Custom Domains; Cloudflare/DNS access is required for this final step. This script does not change DNS, email records, custom-domain bindings or TLS settings. A domain that is not supplied cannot be pre-authorized safely.

Explicit aliases redirect GET/HEAD requests to the canonical domain with HTTP 308, preserving path and query. HTTP requests to a configured primary or alias also redirect to HTTPS. Other deployment hosts receive `X-Robots-Tag: noindex` and a disallow-all robots response to prevent duplicate indexing. Preview hosts keep the production canonical address; if an admin must sign in on a preview host, add that exact origin to `allowedOrigins` before applying domain setup.

`SITE_URL` is an optional **build-time** override consumed before the admin and Worker bundles are built. Normally leave it unset and use the committed domain config. An override does not synchronize Supabase or attach DNS. A production-domain override takes precedence over committed config; workers.dev, pages.dev and chatgpt.site preview overrides retain the committed production canonical and remain noindex. The `SUPABASE_SERVICE_ROLE_KEY` runtime secret is required for user creation. Never put the Supabase management token in frontend or Cloudflare runtime variables.

Run `npm run domain:check` for domain/SEO and mocked setup checks. These checks do not modify production services.

## Media

The largest hero video is stored in lossless binary parts under `media/` to accommodate the repository transfer API's request-size limit. `npm run build` and `npm run dev` restore the original file automatically and verify its SHA-256 checksum. The video is not re-encoded or compressed; the generated website receives the original bytes. Keep all parts and `media/manifest.json` in the repository.

## SMTP-free user creation

Set `SUPABASE_SERVICE_ROLE_KEY` as a server-only Worker secret before using account creation. After building: `npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config dist/server/wrangler.json`. Do not put the value in this repository or expose it to the browser. Apply the first-login password migration before deployment. See `cms/USER-ACCOUNTS.md`.
