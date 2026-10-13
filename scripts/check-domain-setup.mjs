import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeOrigin, buildDomainPlan, mergeAuthConfig, configureDomain, parseArgs, DomainSetupError } from './configure-domain.mjs';

const source = { url: 'https://abcdefghijklmnopqrst.supabase.co', publishableKey: 'sb_publishable_test', enabled: true,
  siteOrigin: 'https://old.example.com', canonicalOrigin: 'https://old.example.com',
  allowedOrigins: ['https://preview.example.com'], legacyOrigins: ['https://earlier.example.com'], redirectOrigins: ['https://alias.example.com'] };
const origin = 'https://new.example.com';
const aliases = ['https://www.new.example.com'];
const plan = buildDomainPlan(source, origin, aliases);
let checks = 0;
function check(name, fn) { fn(); checks++; }
check('normalization', () => assert.equal(normalizeOrigin('https://WWW.Example.COM/'), 'https://www.example.com'));
for (const invalid of ['http://example.com', 'https://localhost', 'https://sub.localhost', 'https://127.0.0.1', 'https://[::1]',
  'https://10.1.2.3', 'https://example.com:443', 'https://example.com:8443', 'https://u:p@example.com', 'https://*.example.com',
  'https://example.com/path', 'https://example.com//', 'https://example.com?', 'https://example.com#', 'https://example.com/?x=1',
  'https://example.com/#foo', 'https://example.com\\evil', ' https://example.com', 'https://example.com ', 'https://example.local',
  'https://example.com.', 'https://foo..example.com', 'https://foo_bar.com', 'https://example%2ecom']) {
  check(`invalid ${invalid}`, () => assert.throws(() => normalizeOrigin(invalid)));
}
check('new config preserves explicit origins only', () => {
  assert.equal(plan.nextConfig.siteOrigin, origin);
  assert.equal(plan.nextConfig.canonicalOrigin, origin);
  assert.deepEqual(plan.nextConfig.redirectOrigins, aliases);
  assert.deepEqual(plan.nextConfig.allowedOrigins, [origin, ...aliases, source.siteOrigin, ...source.allowedOrigins, ...source.redirectOrigins]);
  assert.deepEqual(plan.nextConfig.legacyOrigins, [...source.legacyOrigins, source.siteOrigin, ...source.allowedOrigins, ...source.redirectOrigins]);
  assert.deepEqual(source.redirectOrigins, ['https://alias.example.com']);
  assert(!plan.nextConfig.allowedOrigins.includes('https://www.old.example.com'));
  assert(!plan.nextConfig.allowedOrigins.includes(source.legacyOrigins[0]), 'Content legacy origins must not become authorized CORS origins');
});
check('explicit redirects replace old redirects, never oldsite auto-redirect', () => {
  assert.deepEqual(buildDomainPlan(source, origin).nextConfig.redirectOrigins, []);
  assert.deepEqual(buildDomainPlan(source, origin, [origin, ...aliases, ...aliases]).nextConfig.redirectOrigins, aliases);
});
check('malformed local allowlist rejected', () => assert.throws(() => buildDomainPlan({ ...source, allowedOrigins: '*' }, origin)));
check('wrong Supabase URL rejected', () => assert.throws(() => buildDomainPlan({ ...source, url: 'https://evil.example.com' }, origin)));
check('preserve existing Auth redirects including previously configured patterns', () => {
  const merged = mergeAuthConfig({ uri_allow_list: 'https://legacy.example.com/callback,https://*.preview.example.com/**' }, plan);
  assert.equal(merged.site_url, origin);
  assert.deepEqual(merged.uri_allow_list.split(','), ['https://legacy.example.com/callback', 'https://*.preview.example.com/**', ...plan.requiredAuthRedirects]);
  assert.deepEqual(Object.keys(merged).sort(), ['site_url', 'uri_allow_list']);
});
check('malformed Auth data rejected', () => assert.throws(() => mergeAuthConfig({ uri_allow_list: [] }, plan)));
check('argument parsing', () => assert.deepEqual(parseArgs([origin, '--alias', aliases[0], '--apply']), { origin, aliases, apply: true }));
check('unknown arguments rejected', () => assert.throws(() => parseArgs([origin, '--token', 'secret'])));
check('missing argument rejected', () => assert.throws(() => parseArgs([origin, '--alias'])));

const temporary = await mkdtemp(join(tmpdir(), 'cms-domain-check-'));
const configPath = join(temporary, 'config.json');
const originalText = `${JSON.stringify(source)}\n`;
const token = 'sbp_test_DO_NOT_PRINT_THIS';
const json = body => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
function fixture({ failStage, incorrectAuth = false, incorrectCors = false, leak = false, hang = false } = {}) {
  const calls = [];
  let auth = { site_url: source.siteOrigin, uri_allow_list: 'https://existing.example.com/callback' };
  const request = async (url, options) => {
    calls.push({ url, options });
    assert(options.signal instanceof AbortSignal);
    assert.equal(options.redirect, 'error');
    const name = options.method === 'GET' ? (calls.length === 1 ? 'read-auth' : 'verify-auth')
      : options.method === 'PATCH' ? 'update-auth' : options.method === 'POST' ? 'update-function-secrets' : 'verify-cors';
    if (name === failStage) {
      if (hang) return new Promise(() => {});
      if (leak) throw new Error(`Provider details ${token}`);
      return new Response(`Provider details ${token}`, { status: 503 });
    }
    if (options.method === 'GET') return json(incorrectAuth && name === 'verify-auth' ? { ...auth, site_url: source.siteOrigin } : auth);
    if (options.method === 'PATCH') { auth = JSON.parse(options.body); return json(auth); }
    if (options.method === 'POST') return json({});
    assert.equal(options.method, 'OPTIONS', 'Verification must never send a lead or invite POST');
    assert(!options.headers.Authorization, 'Management token must not be sent to Edge Functions');
    return new Response(null, { status: 204, headers: {
      'access-control-allow-origin': incorrectCors ? '*' : options.headers.Origin,
      'access-control-allow-headers': 'authorization,apikey,content-type,x-client-info',
      'access-control-allow-methods': 'POST, OPTIONS',
    } });
  };
  return { calls, request };
}
async function run({ apply = true, env = { SUPABASE_ACCESS_TOKEN: token }, options = {}, timeoutMs = 1000 } = {}) {
  await writeFile(configPath, originalText);
  const logs = [];
  const mock = fixture(options);
  let result, error;
  try { result = await configureDomain({ origin, aliases, apply, configPath, env, request: mock.request, timeoutMs, log: line => logs.push(line) }); }
  catch (caught) { error = caught; }
  assert(!logs.join('\n').includes(token));
  assert(!String(error?.message).includes(token));
  assert(!await readFile(configPath, 'utf8').then(text => text.includes(token)));
  return { ...mock, logs, result, error };
}
try {
  let state = await run({ apply: false });
  assert(!state.error); assert.equal(state.result.applied, false); assert.equal(state.calls.length, 0);
  assert.equal(await readFile(configPath, 'utf8'), originalText); checks++;
  state = await run({ env: {} });
  assert.equal(state.error.stage, 'credentials'); assert.equal(state.calls.length, 0);
  assert.equal(await readFile(configPath, 'utf8'), originalText); checks++;
  state = await run();
  assert(!state.error); assert.equal(state.result.applied, true);
  assert.deepEqual(JSON.parse(await readFile(configPath, 'utf8')), plan.nextConfig);
  const authCall = state.calls.find(call => call.options.method === 'PATCH');
  assert.equal(authCall.url, 'https://api.supabase.com/v1/projects/abcdefghijklmnopqrst/config/auth');
  assert.deepEqual(JSON.parse(authCall.options.body), { site_url: origin, uri_allow_list: ['https://existing.example.com/callback', ...plan.requiredAuthRedirects].join(',') });
  const secretsCall = state.calls.find(call => call.options.method === 'POST');
  assert.equal(secretsCall.url, 'https://api.supabase.com/v1/projects/abcdefghijklmnopqrst/secrets');
  assert.deepEqual(JSON.parse(secretsCall.options.body), plan.secrets);
  assert.deepEqual(state.calls.filter(call => call.options.method === 'OPTIONS').map(call => call.options.headers.Origin), [...plan.nextConfig.allowedOrigins, ...plan.nextConfig.allowedOrigins]);
  assert.equal(state.calls.length, 4 + 2 * plan.nextConfig.allowedOrigins.length);
  assert.deepEqual(await readdir(temporary), ['config.json']); checks++;
  for (const stage of ['read-auth', 'update-auth', 'update-function-secrets', 'verify-auth', 'verify-cors']) {
    state = await run({ options: { failStage: stage } });
    assert(state.error instanceof DomainSetupError);
    assert(state.error.stage.startsWith(stage));
    assert.equal(state.error.remoteWriteAttempted, stage !== 'read-auth');
    assert.equal(await readFile(configPath, 'utf8'), originalText);
    if (stage !== 'read-auth') assert.match(state.error.message, /no automatic rollback/);
    checks++;
  }
  state = await run({ options: { failStage: 'read-auth', leak: true } });
  assert.equal(state.error.stage, 'read-auth'); assert.match(state.error.message, /Network request failed/); checks++;
  state = await run({ options: { failStage: 'read-auth', hang: true }, timeoutMs: 5 });
  assert.equal(state.error.stage, 'read-auth'); assert.equal(await readFile(configPath, 'utf8'), originalText); checks++;
  state = await run({ options: { incorrectAuth: true } });
  assert.equal(state.error.stage, 'verify-auth'); assert.equal(await readFile(configPath, 'utf8'), originalText); checks++;
  state = await run({ options: { incorrectCors: true } });
  assert.equal(state.error.stage, 'verify-cors:submit-lead'); assert.equal(await readFile(configPath, 'utf8'), originalText); checks++;
  console.log(`PASS: ${checks} domain setup checks; exact origins, existing access preservation, offline plan, credentials, API payloads, CORS verification, atomic writes, timeouts and partial-failure reporting. No live API was called.`);
} finally { await rm(temporary, { recursive: true, force: true }); }
