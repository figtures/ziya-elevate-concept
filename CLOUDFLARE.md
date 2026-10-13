# Cloudflare Workers deployment

This repository contains the current Turkish keynote website and its Supabase admin panel.

| Setting | Value |
| --- | --- |
| Worker name | `ziya-sakir-yilmaz-cms` |
| Production branch | `main` |
| Root directory | Repository root |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy --config dist/server/wrangler.json` |
| Build variable | `NODE_VERSION=22.18.0` |

Cloudflare installs npm dependencies automatically. Include development dependencies because the build uses Vite and Wrangler. The generated Worker configuration includes both the server entry point and client assets.

Supabase public connection settings are read from `cms/config.json`; additional Cloudflare runtime variables are not required. Never add a database password, management access token, or service-role key to frontend configuration.

Before moving to a new production domain, update `siteOrigin` and `canonicalOrigin` in `cms/config.json`. Update the Supabase Edge Function settings `CMS_ALLOWED_ORIGINS` and `CMS_ADMIN_REDIRECT_URL`, and the Supabase Auth Site URL and redirect allowlist to include the actual new domain and `/admin/` URL.

## Media

The largest hero video is stored in lossless binary parts under `media/` to accommodate the repository transfer API's request-size limit. `npm run build` and `npm run dev` restore the original file automatically and verify its SHA-256 checksum. The video is not re-encoded or compressed; the generated website receives the original bytes. Keep all parts and `media/manifest.json` in the repository.
