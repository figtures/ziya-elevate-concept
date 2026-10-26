import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parseHTML } from 'linkedom';
import { HOME_STORY_COPY, PILLAR_COPY, reviseHomeSalesPillars } from '../cms/v13/home-sales-pillars.mjs';

const revisionManifest = JSON.parse(fs.readFileSync(new URL('../cms/v13/revisions.json', import.meta.url), 'utf8'));
const templates = JSON.parse(execFileSync('git', ['show', `${revisionManifest.baselineCommit}:cms/templates.json`], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));
const byId = (doc, id) => doc.querySelector(`[data-cms-node="${id}"]`);
const ids = (doc) => [...doc.querySelectorAll('[data-cms-node]')].map((node) => node.getAttribute('data-cms-node'));
const docFor = (route) => parseHTML(templates[route]).document;
const routes = ['/', '/satis/', '/liderlik/', '/basari/', '/kafa-yapisi/'];
const assertBefore = (doc, first, last, message) => {
  const nodes = [...doc.querySelectorAll('*')];
  assert(nodes.indexOf(first) < nodes.indexOf(last), message);
};

for (const route of routes) {
  const before = docFor(route);
  const document = docFor(route);
  const previousIds = ids(before);
  reviseHomeSalesPillars(document, route);
  const currentIds = ids(document);
  assert.equal(new Set(currentIds).size, currentIds.length, `${route}: unique CMS ids`);
  const removed = previousIds.filter((id) => !currentIds.includes(id));
  assert.deepEqual(removed, route === '/liderlik/' ? ['454dc2e9-114', '454dc2e9-115'] : [], `${route}: only explicitly removed duplicate H2 may lose ids`);
  assert.equal(document.querySelectorAll('section').length, before.querySelectorAll('section').length, `${route}: no new sections`);
  const once = document.toString();
  reviseHomeSalesPillars(document, route);
  assert.equal(document.toString(), once, `${route}: safe to rerun`);
  if (route === '/') {
    for (const [id, copy] of Object.entries(HOME_STORY_COPY)) {
      assert.equal(byId(document, id).textContent, copy);
      byId(before, id).textContent = copy;
    }
    assert.equal(document.toString(), before.toString(), 'Homepage: only the three authorised paragraphs change');
    assert.equal(document.querySelector('#rakamlarla').outerHTML, docFor('/').querySelector('#rakamlarla').outerHTML, 'Counter markup remains byte-identical');
    console.log('PASS /: exact story copy; every other element and counters unchanged');
    continue;
  }
  assert.equal(document.querySelector('h1,h2,h3')?.tagName, 'H1', `${route}: first heading is H1`);
  assert(!document.body.textContent.includes('Bu alandaki sekiz başlık'), `${route}: obsolete hub label gone`);
  assert.equal(document.querySelectorAll('.v13-hub-caption').length, 1, `${route}: one hub caption`);
  const answer = document.querySelector('.v13-pillar-answer');
  assert(answer.textContent.includes('30 Saniyede Cevap'), `${route}: short answer retained`);
  assertBefore(document, document.querySelector('.ed-closing'), answer, `${route}: primary CTA before summary`);
  const hub = document.querySelector('.v13-hub-label').closest('details');
  assertBefore(document, answer, hub, `${route}: summary before hub`);
  assert.equal(hub.querySelector('.v13-hub-label > span').textContent, 'DAHA DERİNE İN');
  const faq = document.querySelector('.ed-reading .wrap').lastElementChild;
  assert(faq.querySelector('summary').textContent.includes('Sık sorulan sorular'), `${route}: FAQ last`);
  assertBefore(document, hub, faq, `${route}: hub before FAQ`);
  console.log(`PASS ${route}: H1 first, CTA → answer → hub → FAQ, CMS identities retained`);
}

const sales = docFor('/satis/');
reviseHomeSalesPillars(sales, '/satis/');
assert.equal(sales.querySelector('h1').textContent, PILLAR_COPY.salesHeadline);
assert.equal(byId(sales, '11c5b094-90').textContent, PILLAR_COPY.salesLead);
assert.equal(byId(sales, '11c5b094-114').textContent, '440.000 DOLARLIK DERS');
assert.equal(byId(sales, '11c5b094-115').textContent, PILLAR_COPY.salesStory);
assert.equal(byId(sales, '11c5b094-v13-distributor').textContent, PILLAR_COPY.salesDistributor);
assertBefore(sales, byId(sales, '11c5b094-v13-distributor'), byId(sales, '11c5b094-116'), 'Sales: full story before closing thesis');
assertBefore(sales, byId(sales, '11c5b094-116'), byId(sales, '11c5b094-128'), 'Sales: diagnostic model follows story');
assertBefore(sales, byId(sales, '11c5b094-128'), byId(sales, '11c5b094-137'), 'Sales: diagnostic model before critical conversation moments');

const leadership = docFor('/liderlik/');
reviseHomeSalesPillars(leadership, '/liderlik/');
assert.equal(byId(leadership, '454dc2e9-90').textContent, PILLAR_COPY.leadershipThesis);
assert.equal(leadership.querySelector('h1').outerHTML, docFor('/liderlik/').querySelector('h1').outerHTML, 'Leadership H1 unchanged');
assert(!byId(leadership, '454dc2e9-114'), 'Leadership duplicate H2 removed');
assertBefore(leadership, byId(leadership, '454dc2e9-143'), byId(leadership, '454dc2e9-165'), 'Leadership: model before 12.12.2012 field story');

const success = docFor('/basari/');
reviseHomeSalesPillars(success, '/basari/');
assert.equal(byId(success, 'b55b9651-121').textContent, PILLAR_COPY.successModel);

const mindset = docFor('/kafa-yapisi/');
reviseHomeSalesPillars(mindset, '/kafa-yapisi/');
assertBefore(mindset, byId(mindset, '5f3f14fd-111'), byId(mindset, '5f3f14fd-129'), 'Mindset: quote before Ziya definition');
assertBefore(mindset, byId(mindset, '5f3f14fd-129'), byId(mindset, '5f3f14fd-115'), 'Mindset: definition before KGKY link');
assertBefore(mindset, byId(mindset, '5f3f14fd-166'), byId(mindset, '5f3f14fd-119'), 'Mindset: test CTA before summary');
assertBefore(mindset, byId(mindset, '5f3f14fd-166'), byId(mindset, '5f3f14fd-114'), 'Mindset: generic concept description moves below test CTA');
assertBefore(mindset, byId(mindset, '5f3f14fd-119'), byId(mindset, '5f3f14fd-139'), 'Mindset: summary before five measurement dimensions');
assertBefore(mindset, byId(mindset, '5f3f14fd-139'), byId(mindset, '5f3f14fd-226'), 'Mindset: measurement dimensions before hub');
console.log('PASS exact sales / leadership / success copy and mindset measurement order');
