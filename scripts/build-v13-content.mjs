/** Incremental V13 content build. Never regenerate existing CMS node ids. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { reviseHomeSalesPillars, HOME_STORY_COPY } from '../cms/v13/home-sales-pillars.mjs';
import { reviseSignaturePages } from '../cms/v13/signature-pages.mjs';
import { reviseBioTraining, createMediaKitDocument } from '../cms/v13/bio-training.mjs';
import { deriveNavigation, validateNavigation } from '../cms/navigation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'cms/v13/revisions.json');
const previousManifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;
const baselineCommit = previousManifest?.baselineCommit || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const baselineFile = (file) => execFileSync('git', ['show', `${baselineCommit}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
const templates = JSON.parse(baselineFile('cms/templates.json'));
const catalog = JSON.parse(baselineFile('cms/catalog.json'));
const seeds = JSON.parse(baselineFile('cms/seed.json'));
const baselineSeeds = new Map(seeds.map((seed) => [seed.id, seed]));
const routes = ['/', '/satis/', '/liderlik/', '/basari/', '/kafa-yapisi/', '/kursun-gecirmez-kafa-yapisi/', '/basari-muhendisligi/', '/konusmaci/', '/egitimler/', '/mentorluk/', '/ziya-sakir-yilmaz/'];
const documents = Object.fromEntries(routes.map((route) => [route, parseHTML(templates[route]).document]));
// The media kit must retain the original dated evidence before About is revised.
documents['/basin/'] = createMediaKitDocument(documents['/ziya-sakir-yilmaz/']);
for (const route of routes) {
  reviseHomeSalesPillars(documents[route], route);
  reviseSignaturePages(documents[route], route);
  reviseBioTraining(documents[route], route);
}

const desktopFilm = '/assets/hero-stage-v13-1080.mp4';
const mobileFilm = '/assets/hero-stage-v13-720.mp4';
const heroVideo = documents['/'].querySelector('[data-hero-clip="sahne-akisi"]');
assert(heroVideo, 'Expected the existing home stage film');
heroVideo.setAttribute('src', desktopFilm);
heroVideo.setAttribute('data-mobile-src', mobileFilm);
heroVideo.setAttribute('data-clip-start', '0');
heroVideo.setAttribute('data-clip-end', '11');

// Keep the shared footer entry in the ordinary editable navigation model.
const globalDocument = parseHTML(templates._global).document;
const footerWork = globalDocument.querySelector('.footer-group[aria-labelledby="footer-work-title"] ul');
assert(footerWork, 'Expected shared work/footer navigation');
if (!footerWork.querySelector('a[href="/basin/"]')) {
  const item = globalDocument.createElement('li');
  item.setAttribute('data-cms-node', 'cf8e6d9e-v13-press-item');
  const link = globalDocument.createElement('a');
  link.setAttribute('data-cms-node', 'cf8e6d9e-v13-press-link');
  link.setAttribute('href', '/basin/');
  link.textContent = 'Basın / Medya Kiti';
  item.append(link);
  footerWork.append(item);
}
documents._global = globalDocument;
const modifiedTemplates = Object.fromEntries(Object.entries(documents).map(([route, document]) => [route, document.toString()]));
const result = JSON.parse(execFileSync('python3', [path.join(root, 'scripts/compile-v13-content.py')], {
  cwd: root,
  input: JSON.stringify({ templates: modifiedTemplates, baselineCatalog: catalog, baselineSeeds: seeds }),
  encoding: 'utf8', maxBuffer: 40 * 1024 * 1024,
}));
const nextSeeds = new Map(result.seeds.map((seed) => [seed.id, seed]));
const homeSeed = nextSeeds.get('/');
homeSeed.experience = { ...homeSeed.experience, playlist: [{
  id: 'sahne-akisi', src: desktopFilm, poster: heroVideo.getAttribute('poster'),
  focal: heroVideo.style.objectPosition || 'center 35%', start: 0, end: 11,
}] };
const sharedSeed = nextSeeds.get('_global');
const navigation = structuredClone(sharedSeed.navigation || deriveNavigation(globalDocument));
if (!navigation.footer.some((group) => group.items.some((item) => item.href === '/basin/'))) {
  const group = navigation.footer.find((item) => item.title === 'Birlikte çalışalım') || navigation.footer[0];
  assert(group, 'Expected editable footer group');
  group.items.push({ id: 'v13-press-media-kit', label: 'Basın / Medya Kiti', href: '/basin/', hidden: false, newTab: false });
}
assert.deepEqual(validateNavigation(navigation), [], 'New media kit navigation must validate');
sharedSeed.navigation = navigation;

// Retain the original raw counter and hero markup in the compiled homepage.
// Only the film URL/timing changes inside its hero; no hero text is serialized.
function sectionMarkup(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<section\\b[^>]*\\bid=["']${escaped}["'][^>]*>[\\s\\S]*?<\\/section>`))?.[0];
}
function reviseHeroFilm(html) {
  return html.replace(/<video\b[^>]*data-hero-clip=["']sahne-akisi["'][^>]*>/, (tag) => {
    let next = tag.replace(/\bsrc=["'][^"']*["']/, `src="${desktopFilm}"`);
    for (const [attribute, value] of [['data-mobile-src', mobileFilm], ['data-clip-start', '0'], ['data-clip-end', '11']]) {
      const expression = new RegExp(`\\s${attribute}=["'][^"']*["']`);
      next = expression.test(next) ? next.replace(expression, ` ${attribute}="${value}"`) : next.replace(/>$/, ` ${attribute}="${value}">`);
    }
    return next;
  });
}
for (const id of ['rakamlarla', 'icerik']) {
  const before = sectionMarkup(templates['/'], id);
  const after = sectionMarkup(result.templates['/'], id);
  assert(before && after, `Home protected section ${id} must exist`);
  result.templates['/'] = result.templates['/'].replace(after, id === 'icerik' ? reviseHeroFilm(before) : before);
}
assert.equal(sectionMarkup(result.templates['/'], 'rakamlarla'), sectionMarkup(templates['/'], 'rakamlarla'));

const manifest = { version: 'v13-2026-10-26', baselineCommit, pages: {} };
for (const route of Object.keys(documents)) {
  const beforeDocument = templates[route] ? parseHTML(templates[route]).document : null;
  const afterDocument = parseHTML(result.templates[route]).document;
  const oldIds = [...(beforeDocument?.querySelectorAll('[data-cms-node]') || [])].map((node) => node.getAttribute('data-cms-node'));
  const newIds = [...afterDocument.querySelectorAll('[data-cms-node]')].map((node) => node.getAttribute('data-cms-node'));
  assert.equal(new Set(newIds).size, newIds.length, `${route}: duplicate CMS ids`);
  const removedNodeIds = oldIds.filter((id) => !newIds.includes(id));
  const retainedIds = oldIds.filter((id) => newIds.includes(id));
  assert.equal(retainedIds.length + removedNodeIds.length, oldIds.length);
  const before = baselineSeeds.get(route) || null;
  const after = nextSeeds.get(route);
  manifest.pages[route] = { before, after, fields: { before: catalog[route]?.fields || [], after: result.catalog[route].fields }, removedNodeIds };
  templates[route] = result.templates[route];
  catalog[route] = result.catalog[route];
}

// Homepage source is a surgical text/media patch, so raw counter markup,
// event code, hero text, cards, TEDx, books and final CTA remain identical.
const escapeText = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const homeSourceBefore = baselineFile('website/index.html');
let homeSource = homeSourceBefore;
const baselineHomeDocument = parseHTML(JSON.parse(baselineFile('cms/templates.json'))['/']).document;
for (const [id, copy] of Object.entries(HOME_STORY_COPY)) {
  const oldCopy = baselineHomeDocument.querySelector(`[data-cms-node="${id}"]`).textContent;
  assert.equal(homeSource.split(escapeText(oldCopy)).length - 1, 1, `Unique source paragraph ${id}`);
  homeSource = homeSource.replace(escapeText(oldCopy), escapeText(copy));
}
homeSource = reviseHeroFilm(homeSource);
assert.equal(sectionMarkup(homeSource, 'rakamlarla'), sectionMarkup(homeSourceBefore, 'rakamlarla'));
assert.equal(sectionMarkup(homeSource, 'icerik'), reviseHeroFilm(sectionMarkup(homeSourceBefore, 'icerik')));
fs.writeFileSync(path.join(root, 'website/index.html'), homeSource);
for (const route of Object.keys(documents).filter((route) => route !== '/' && route !== '_global')) {
  const document = parseHTML(result.templates[route]).document;
  for (const element of document.querySelectorAll('*')) for (const attribute of [...element.attributes]) {
    if (attribute.name.startsWith('data-cms-')) element.removeAttribute(attribute.name);
  }
  const target = path.join(root, 'website', route.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, document.toString().replace(/[ \t]+$/gm, ''));
}
const mergedSeeds = seeds.map((seed) => nextSeeds.get(seed.id) || seed);
for (const seed of result.seeds) if (!baselineSeeds.has(seed.id)) mergedSeeds.push(seed);
for (const [file, value] of [['cms/templates.json', templates], ['cms/catalog.json', catalog], ['cms/seed.json', mergedSeeds], ['cms/v13/revisions.json', manifest]]) {
  fs.writeFileSync(path.join(root, file), JSON.stringify(value));
}
console.log(`V13: ${Object.keys(documents).length} documents incrementally compiled from ${baselineCommit.slice(0, 12)}; homepage counter and hero copy protected.`);
console.log('V13 manifest: before/after seed snapshots and field mappings; custom seed properties retained.');
for (const [route, page] of Object.entries(manifest.pages)) console.log(`${route}: ${page.after.sections.length} sections; ${page.fields.after.length} fields; ${page.removedNodeIds.length} explicitly removed nodes`);
