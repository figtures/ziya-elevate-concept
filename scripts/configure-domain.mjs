import { readFile, stat, writeFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_CONFIG = fileURLToPath(new URL('../cms/config.json', import.meta.url));
const API = 'https://api.supabase.com/v1/projects/';
const unique = values => [...new Set(values)];

export function normalizeOrigin(value) {
  // Reject URL parser repairs, explicit ports (including :443) and non-public hosts.
  if (typeof value !== 'string' || value !== value.trim() || /[\s\\*?#%]/u.test(value) || !/^https:\/\/[^/]+\/?$/i.test(value)) {
    throw new Error('Domain must be an exact public HTTPS origin without a path, query or fragment.');
  }
  const authority = value.slice(value.indexOf('://') + 3).replace(/\/$/, '');
  if (/[:@]/.test(authority)) throw new Error('Domain credentials and ports are not allowed.');
  let url;
  try { url = new URL(value); } catch { throw new Error('Domain is not a valid HTTPS origin.'); }
  const host = url.hostname;
  const labels = host.split('.');
  if (url.protocol !== 'https:' || isIP(host) || labels.length < 2 || host.length > 253 ||
      labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
      /(?:^|\.)(?:localhost|local|internal|lan|home|test|invalid|onion)$/.test(host)) {
    throw new Error('Domain must use a public DNS hostname; local hosts and IP addresses are not allowed.');
  }
  return url.origin;
}

function originList(config, key) {
  if (config[key] === undefined) return [];
  if (!Array.isArray(config[key])) throw new Error(`cms/config.json ${key} must be an array of exact HTTPS origins.`);
  return config[key].map(normalizeOrigin);
}

export function buildDomainPlan(config, origin, aliases = []) {
  const primary = normalizeOrigin(origin);
  const redirects = unique(aliases.map(normalizeOrigin)).filter(item => item !== primary);
  const previousApproved = unique([
    ...[config.siteOrigin, config.canonicalOrigin].filter(Boolean).map(normalizeOrigin),
    ...originList(config, 'allowedOrigins'),
    ...originList(config, 'redirectOrigins'),
  ]);
  // Legacy URLs are only content/media rebasing sources, never an authorization list.
  const previousLegacy = originList(config, 'legacyOrigins');
  let supabaseUrl;
  try { supabaseUrl = new URL(config.url); } catch { throw new Error('cms/config.json must contain a Supabase project URL.'); }
  if (supabaseUrl.protocol !== 'https:' || !/^[a-z0-9]{20}\.supabase\.co$/.test(supabaseUrl.hostname) ||
      supabaseUrl.port || supabaseUrl.username || supabaseUrl.password || supabaseUrl.pathname !== '/' || supabaseUrl.search || supabaseUrl.hash) {
    throw new Error('cms/config.json url must be the exact HTTPS Supabase project URL.');
  }
  const allowedOrigins = unique([primary, ...redirects, ...previousApproved]);
  const legacyOrigins = unique([...previousLegacy, ...previousApproved]).filter(item => item !== primary && !redirects.includes(item));
  const nextConfig = { ...config, siteOrigin: primary, canonicalOrigin: primary, allowedOrigins, legacyOrigins, redirectOrigins: redirects };
  return {
    projectRef: supabaseUrl.hostname.split('.')[0],
    functionOrigin: supabaseUrl.origin,
    primary,
    nextConfig,
    requiredAuthRedirects: allowedOrigins.map(item => `${item}/admin/`),
    secrets: [
      { name: 'CMS_ALLOWED_ORIGINS', value: allowedOrigins.join(',') },
      { name: 'CMS_ADMIN_REDIRECT_URL', value: `${primary}/admin/` },
    ],
  };
}

export function mergeAuthConfig(current, plan) {
  if (!current || typeof current !== 'object' || Array.isArray(current) ||
      (current.uri_allow_list != null && typeof current.uri_allow_list !== 'string')) {
    throw new Error('Supabase returned an unexpected Auth configuration; no settings were changed.');
  }
  const existing = (current.uri_allow_list || '').split(',').map(value => value.trim()).filter(Boolean);
  return { site_url: plan.primary, uri_allow_list: unique([...existing, ...plan.requiredAuthRedirects]).join(',') };
}

export class DomainSetupError extends Error {
  constructor(stage, detail, completedStages = [], remoteWriteAttempted = false) {
    super(`[${stage}] ${detail} Local config was not updated. ${remoteWriteAttempted
      ? 'Supabase settings may have changed; no automatic rollback was attempted. Review the stage and rerun the same command after fixing the problem.'
      : 'No Supabase writes were attempted.'}`);
    this.name = 'DomainSetupError';
    this.stage = stage;
    this.completedStages = [...completedStages];
    this.remoteWriteAttempted = remoteWriteAttempted;
  }
}

async function timedRequest(request, url, options, timeoutMs, json) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const response = await request(url, { ...options, redirect: 'error', signal: controller.signal });
        if (!response.ok) throw new Error(`Service returned HTTP ${response.status}.`);
        if (!json) return response;
        try { return await response.json(); } catch { throw new Error('Service returned invalid JSON.'); }
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Request timed out.')); }, timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

async function atomicConfigWrite(configPath, nextConfig, initialText) {
  if (await readFile(configPath, 'utf8') !== initialText) throw new Error('Config changed during setup.');
  const temporary = resolve(dirname(configPath), `.${basename(configPath)}.${randomUUID()}.tmp`);
  try {
    const mode = (await stat(configPath)).mode & 0o777;
    await writeFile(temporary, `${JSON.stringify(nextConfig, null, 2)}\n`, { encoding: 'utf8', mode, flag: 'wx' });
    await rename(temporary, configPath);
  } finally { await unlink(temporary).catch(() => {}); }
}

/** Offline unless apply=true. Inject request/configPath/env for tests; never log API responses or credentials. */
export async function configureDomain({ origin, aliases = [], apply = false, configPath = DEFAULT_CONFIG,
  env = process.env, request = globalThis.fetch, timeoutMs = 15000, log = console.log } = {}) {
  const initialText = await readFile(configPath, 'utf8');
  const plan = buildDomainPlan(JSON.parse(initialText), origin, aliases);
  log(JSON.stringify({ mode: apply ? 'apply' : 'plan-only', projectRef: plan.projectRef,
    primary: plan.primary, allowedOrigins: plan.nextConfig.allowedOrigins,
    legacyOrigins: plan.nextConfig.legacyOrigins, redirectOrigins: plan.nextConfig.redirectOrigins,
    authRedirectsToAdd: plan.requiredAuthRedirects }, null, 2));
  log('Only the explicit config origins above are preserved for CORS. Supabase secret values cannot be read back; add any other approved origins to cms/config.json allowedOrigins before applying.');
  if (!apply) {
    log('No files or services changed. To apply this plan, set SUPABASE_ACCESS_TOKEN securely in the shell environment and repeat with --apply.');
    return { applied: false, plan };
  }
  const token = env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token || /\s/.test(token)) throw new DomainSetupError('credentials', 'A valid SUPABASE_ACCESS_TOKEN environment variable is required.');
  const completed = [];
  let stage = 'read-auth';
  let remoteWriteAttempted = false;
  const apiHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  async function call(url, options, json = false) {
    try { return await timedRequest(request, url, options, timeoutMs, json); }
    catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'Service returned invalid JSON.' || /^Service returned HTTP \d{3}\.$/.test(message)) throw new Error(message);
      throw new Error('Network request failed or timed out.');
    }
  }
  try {
    const authUrl = `${API}${plan.projectRef}/config/auth`;
    const currentAuth = await call(authUrl, { method: 'GET', headers: apiHeaders }, true);
    const authPayload = mergeAuthConfig(currentAuth, plan);
    completed.push(stage);
    stage = 'update-auth';
    remoteWriteAttempted = true;
    await call(authUrl, { method: 'PATCH', headers: apiHeaders, body: JSON.stringify(authPayload) });
    completed.push(stage);
    stage = 'update-function-secrets';
    await call(`${API}${plan.projectRef}/secrets`, { method: 'POST', headers: apiHeaders, body: JSON.stringify(plan.secrets) });
    completed.push(stage);
    stage = 'verify-auth';
    const verified = await call(authUrl, { method: 'GET', headers: apiHeaders }, true);
    const savedRedirects = typeof verified.uri_allow_list === 'string' ? verified.uri_allow_list.split(',').map(item => item.trim()) : [];
    if (verified.site_url !== authPayload.site_url || authPayload.uri_allow_list.split(',').some(item => !savedRedirects.includes(item))) {
      throw new Error('Auth Site URL or redirect allowlist did not match the requested settings.');
    }
    completed.push(stage);
    // OPTIONS exercises the same CORS gate as POST without submitting a lead or inviting a user.
    for (const endpoint of ['submit-lead', 'admin-users']) {
      stage = `verify-cors:${endpoint}`;
      for (const allowedOrigin of plan.nextConfig.allowedOrigins) {
        const response = await call(`${plan.functionOrigin}/functions/v1/${endpoint}`, { method: 'OPTIONS', headers: {
          Origin: allowedOrigin, 'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,apikey,content-type,x-client-info',
        } });
        const methods = (response.headers.get('access-control-allow-methods') || '').toUpperCase().split(',').map(item => item.trim());
        const headers = (response.headers.get('access-control-allow-headers') || '').toLowerCase().split(',').map(item => item.trim());
        if (response.headers.get('access-control-allow-origin') !== allowedOrigin || !methods.includes('POST') ||
            ['authorization', 'apikey', 'content-type', 'x-client-info'].some(name => !headers.includes(name))) {
          throw new Error('The function did not accept an explicitly configured origin and required POST headers.');
        }
      }
      completed.push(stage);
    }
    stage = 'write-local-config';
    await atomicConfigWrite(configPath, plan.nextConfig, initialText);
  } catch (error) {
    // Only our bounded errors reach the CLI; provider bodies or thrown request objects can contain secrets.
    const safeDetails = new Set(['Network request failed or timed out.', 'Service returned invalid JSON.',
      'Supabase returned an unexpected Auth configuration; no settings were changed.',
      'Auth Site URL or redirect allowlist did not match the requested settings.',
      'The function did not accept an explicitly configured origin and required POST headers.']);
    const message = error instanceof Error ? error.message : '';
    const detail = safeDetails.has(message) || /^Service returned HTTP \d{3}\.$/.test(message)
      ? message : stage === 'write-local-config' ? 'Atomic local config update failed or the file changed during setup.' : 'Setup step failed.';
    throw new DomainSetupError(stage, detail, completed, remoteWriteAttempted);
  }
  log('Supabase Auth and function CORS verified; cms/config.json updated. Rebuild and deploy the repository, then attach the primary domain and explicit aliases in Cloudflare. DNS and TLS are not changed by this command.');
  return { applied: true, plan, completedStages: [...completed, 'write-local-config'] };
}

export function parseArgs(args) {
  const parsed = { origin: undefined, aliases: [], apply: false };
  for (let index = 0; index < args.length; index++) {
    const value = args[index];
    if (value === '--apply') parsed.apply = true;
    else if (value === '--alias') {
      if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error('--alias requires an exact HTTPS origin.');
      parsed.aliases.push(args[++index]);
    } else if (value.startsWith('--') || parsed.origin) throw new Error('Unexpected argument. Use domain:configure -- https://example.com [--alias https://www.example.com] [--apply].');
    else parsed.origin = value;
  }
  if (!parsed.origin) throw new Error('Usage: npm run domain:configure -- https://example.com [--alias https://www.example.com] [--apply]');
  return parsed;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await configureDomain(parseArgs(process.argv.slice(2))); }
  catch (error) { console.error(error instanceof Error ? error.message : 'Domain setup failed.'); process.exitCode = 1; }
}
