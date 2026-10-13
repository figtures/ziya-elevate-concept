import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { deploymentOrigin, resolveDeploymentConfig, domainRedirect, isPreviewOrigin } from '../cms/domain.mjs';
import { composeContent } from '../cms/compose.mjs';
import { applySocialImageMetadata } from '../cms/seo.mjs';
import { generateDiscovery } from '../cms/discovery.mjs';

const read = async (name) => JSON.parse(await readFile(new URL('../cms/' + name + '.json', import.meta.url), 'utf8'));
const [config, seed, catalog, templates] = await Promise.all(['config','seed','catalog','templates'].map(read));
const origin = 'https://new-domain.example.org';
assert.equal(deploymentOrigin(origin + '/'), origin);
for (const value of ['', 'http://example.com', 'https://user:pass@example.com', 'https://example.com:443',
  'https://example.com:8080', 'https://example.com/path', 'https://example.com/?', 'https://example.com/#',
  'https://*.example.com', 'https://localhost', 'https://127.0.0.1', 'https://example.com\\evil']) {
  assert.throws(() => deploymentOrigin(value), value);
}
const resolved = resolveDeploymentConfig(config, origin);
assert.equal(resolved.siteOrigin, origin);
assert.equal(resolved.canonicalOrigin, origin);
assert(resolved.legacyOrigins.includes(config.canonicalOrigin));
assert.equal(resolveDeploymentConfig(config).canonicalOrigin, config.canonicalOrigin);
assert.throws(() => resolveDeploymentConfig(config, ''));

const migrated = {...resolved, redirectOrigins: ['https://www.new-domain.example.org']};
for (const address of ['https://www.new-domain.example.org', 'http://www.new-domain.example.org', 'http://new-domain.example.org']) {
  const response = domainRedirect(new Request(address + '/makaleler/?utm_source=test'), migrated);
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), origin + '/makaleler/?utm_source=test');
}
assert.equal(domainRedirect(new Request(origin + '/'), migrated), null);
assert.equal(domainRedirect(new Request('https://attacker.example/', {headers:{'x-forwarded-host':'www.new-domain.example.org'}}), migrated), null);
assert.equal(domainRedirect(new Request('https://www.new-domain.example.org/', {method:'POST'}), migrated), null);
assert.equal(isPreviewOrigin(new Request(origin + '/'), migrated), false);
assert.equal(isPreviewOrigin(new Request('https://demo.workers.dev/'), migrated), true);

const global = seed.find(page => page.kind === 'global');
let checked = 0;
for (const page of seed.filter(page => page.kind !== 'global')) {
  const {document} = parseHTML(templates[page.template]);
  const sharedDocument = parseHTML(templates[global.template]).document;
  composeContent(document, page, catalog[page.template], {
    sharedDocument, sharedPayload: global, sharedDefinition: catalog._global,
    canonicalOrigin: origin, entries: seed,
  });
  assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'), origin + page.route);
  assert.equal(document.querySelector('meta[property="og:url"]').getAttribute('content'), origin + page.route);
  const graph = document.querySelector('script[data-cms-seo]').textContent;
  assert(!graph.includes(config.canonicalOrigin), page.route + ': stale schema origin');
  checked++;
}
const page = seed.find(page => page.route === '/');
for (const oldOrigin of [config.canonicalOrigin, 'https://ziyasakiryilmaz.com']) {
  const {document} = parseHTML(templates[page.template]);
  applySocialImageMetadata(document, {...page, ogImage:oldOrigin + '/assets/og/home.png?version=1'}, origin);
  assert.equal(document.querySelector('meta[property="og:image"]').getAttribute('content'), origin + '/assets/og/home.png?version=1');
}
const {document} = parseHTML(templates[page.template]);
applySocialImageMetadata(document, {...page, ogImage:'https://external.example/assets/image.png'}, origin);
assert.equal(document.querySelector('meta[property="og:image"]').getAttribute('content'), 'https://external.example/assets/image.png');
const discovery = generateDiscovery(seed, {enabled:true, origin});
assert(discovery.urls.length > 0);
assert(discovery.urls.every(url => url.startsWith(origin + '/')));
console.log(`Domain checks passed: ${checked} pages, redirects, preview indexing, legacy media and discovery URLs.`);
