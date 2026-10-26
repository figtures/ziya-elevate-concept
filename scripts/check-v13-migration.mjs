/** Regression checks for the one-time V13 rollout against persisted CMS edits.
 * This exercises the actual before/after manifest and visitor composition. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {applyV13ContentUpdate, V13_MARKER, V13_VERSION} from '../cms/v13/content-update.mjs';
import {applyMindsetFlowUpdate} from '../cms/v13/mindset-flow-update.mjs';
import {applyContent} from '../cms/render.mjs';
import {composeContent} from '../cms/compose.mjs';
import {deriveNavigation, applyNavigation, validateNavigation} from '../cms/navigation.mjs';
import {mediaFrameKey, clipMediaFrameKey, serializeMediaFrame, validateDocumentMediaFrames} from '../cms/media-framing.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(`../cms/${name}.json`, import.meta.url), 'utf8'));
const revisions = read('v13/revisions'), templates = read('templates'), catalog = read('catalog');
const clone = structuredClone, same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const migrated = key => applyV13ContentUpdate(clone(revisions.pages[key].before));
const globalRevision = revisions.pages._global;
const bags = payload => [payload.values, ...payload.sections.flatMap(section => [section.values, ...section.groups.flatMap(group => group.items.map(item => item.values))])];
const changes = revision => revision.fields.after.filter(field => !same(revision.before.values[field.id], revision.after.values[field.id]));
const findNode = (doc, id) => doc.querySelector(`[data-cms-node="${id}"]`);
const frame = src => serializeMediaFrame({v:1,src,desktop:{x:23,y:41,zoom:1.4},mobile:{x:77,y:35,zoom:1.7}});
const render = (payload, {composed = false} = {}) => {
  const document = parseHTML(templates[payload.template]).document;
  if (composed && payload.kind !== 'global') {
    const sharedPayload = migrated('_global');
    composeContent(document, payload, catalog[payload.template], {
      sharedDocument: parseHTML(templates[sharedPayload.template]).document,
      sharedPayload, sharedDefinition: catalog[sharedPayload.template],
      canonicalOrigin:'https://ziyasakiryilmaz.com', requestOrigin:'https://ziyasakiryilmaz.com',
    });
  } else {
    applyContent(document, payload, catalog[payload.template], {global:payload.kind === 'global'});
    if (payload.kind === 'global' && payload.navigation) applyNavigation(document, payload.navigation);
  }
  return document;
};
let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('PASS ' + name); }
  catch (error) { failed++; console.error('FAIL ' + name + '\n' + String(error.stack).slice(0, 2400)); }
}

check('Manifest contains the authoritative routes and every existing page migrates immutably once', () => {
  for (const key of ['/', '/satis/', '/liderlik/', '/basari/', '/kafa-yapisi/', '/kursun-gecirmez-kafa-yapisi/', '/basari-muhendisligi/', '/konusmaci/', '/egitimler/', '/mentorluk/', '/ziya-sakir-yilmaz/', '_global']) assert(revisions.pages[key]?.before, key);
  for (const [route, revision] of Object.entries(revisions.pages)) {
    if (!revision.before) continue;
    const input = clone(revision.before), snapshot = clone(input), result = applyV13ContentUpdate(input);
    assert.deepEqual(input, snapshot, route + ': migration mutated input');
    assert.equal(result.values[V13_MARKER], V13_VERSION, route);
    assert.equal(applyV13ContentUpdate(result), result, route + ': already marked document must be returned unchanged');
    assert.deepEqual(result.sections.map(section => section.source), applyMindsetFlowUpdate(revision.after).sections.map(section => section.source), route + ': section order');
  }
});

check('All five proof values and arbitrary page/section counter edits remain untouched', () => {
  const revision = revisions.pages['/'], input = clone(revision.before);
  const values = ['600.000+', '84 ülke', '5× TEDx', '4 kitap', '30 yıl'];
  const fields = revision.fields.before.filter(field => values.includes(revision.before.values[field.id]));
  assert.equal(fields.length, 5);
  for (const field of fields) assert.equal(revision.after.values[field.id], revision.before.values[field.id]);
  input.values[fields[0].id] = '710.000+';
  input.sections.find(section => section.source === fields[1].section).values[fields[1].id] = '91 ülke';
  const result = applyV13ContentUpdate(input), doc = render(result, {composed:true});
  assert.equal(result.values[fields[0].id], '710.000+');
  assert.deepEqual([...doc.querySelectorAll('[data-counter]')].map(node => node.textContent), ['710.000+', '91 ülke', ...values.slice(2)]);
});

check('Unrelated custom copy, image selection and responsive per-section framing survive', () => {
  const revision = revisions.pages['/'], input = clone(revision.before), definition = catalog['/'];
  const field = revision.fields.after.find(field => field.type === 'image' && field.target === '@src' && revision.before.values[field.id] === '/assets/salon-genis.webp');
  assert(field, 'Retained wide stage photo must exist');
  const section = input.sections.find(section => section.source === field.section);
  const text = revision.fields.after.find(candidate => candidate.section === field.section && candidate.target === 'text' && same(revision.before.values[candidate.id], revision.after.values[candidate.id]));
  if (text) section.values[text.id] = 'Yönetici tarafından korunacak özgün açıklama.';
  input.values[mediaFrameKey(field.id)] = frame(input.values[field.id]);
  section.values[field.id] = '/assets/admin-selected-photo.webp';
  section.values[mediaFrameKey(field.id)] = frame(section.values[field.id]);
  const result = applyV13ContentUpdate(input), retained = result.sections.find(item => item.id === section.id);
  if (text) assert.equal(retained.values[text.id], section.values[text.id]);
  assert.equal(result.values[mediaFrameKey(field.id)], input.values[mediaFrameKey(field.id)]);
  assert.equal(retained.values[mediaFrameKey(field.id)], section.values[mediaFrameKey(field.id)]);
  assert.deepEqual(validateDocumentMediaFrames(result, definition), []);
  const image = findNode(render(result), field.node);
  assert.equal(image.getAttribute('src'), '/assets/admin-selected-photo.webp');
  assert.equal(image.style.getPropertyValue('--media-frame-x'), '23%');
  assert.equal(image.style.getPropertyValue('--media-frame-mobile-x'), '77%');
});

check('Authoritative changed copy defeats stale root, section and repeated-item overrides once', () => {
  let checked = 0;
  for (const [route, revision] of Object.entries(revisions.pages)) {
    if (!revision.before) continue;
    const fields = changes(revision).filter(field => ['text','long'].includes(field.type));
    if (!fields.length) continue;
    const input = clone(revision.before);
    for (const bag of bags(input)) for (const field of fields) bag[field.id] = 'ESKİ YEREL METİN';
    const result = applyV13ContentUpdate(input);
    for (const field of fields) {
      assert.equal(result.values[field.id], revision.after.values[field.id], route + ': ' + field.id);
      for (const bag of bags(result).slice(1)) assert(!Object.hasOwn(bag, field.id), route + ': stale override remains');
      checked++;
    }
    assert(!render(result).body.textContent.includes('ESKİ YEREL METİN'), route);
  }
  assert(checked > 50, 'Expected broad authoritative copy coverage');
});

check('Unchanged moved field overrides follow their CMS node to the new section', () => {
  let checked = 0;
  for (const [route, revision] of Object.entries(revisions.pages)) {
    if (!revision.before) continue;
    const old = new Map(revision.fields.before.map(field => [field.id, field]));
    const field = revision.fields.after.find(field => ['text','long'].includes(field.type) && old.get(field.id)?.section && old.get(field.id).section !== field.section && same(revision.before.values[field.id], revision.after.values[field.id]));
    if (!field) continue;
    const input = clone(revision.before), from = input.sections.find(section => section.source === old.get(field.id).section);
    from.values[field.id] = 'Taşınan yönetici düzenlemesi ' + route;
    const result = applyV13ContentUpdate(input), to = result.sections.find(section => section.source === field.section);
    assert.equal(to.values[field.id], from.values[field.id], route);
    assert(!Object.hasOwn(result.sections.find(section => section.id === from.id).values, field.id), route);
    assert(render(result).body.textContent.includes(from.values[field.id]), route);
    checked++;
  }
  assert(checked >= 5);
});

check('Blueprint keeps its CMS repeat group, per-stage custom description and duplicate item', () => {
  const key = '/basari-muhendisligi/', revision = revisions.pages[key], input = clone(revision.before);
  const group = input.sections.flatMap(section => section.groups).find(group => group.id === 'eea7dbba-131');
  assert(group);
  const custom = clone(group.items[0]); custom.id = 'custom-kesif'; custom.values['eea7dbba-135:text'] = 'Kişiye özel keşif açıklaması';
  group.items.unshift(custom);
  const result = applyV13ContentUpdate(input);
  const blueprint = result.sections.flatMap(section => section.groups).find(group => group.id === 'eea7dbba-131');
  assert(blueprint, 'The new template must still declare the authored repeat group');
  assert.equal(blueprint.items.find(item => item.id === custom.id)?.values['eea7dbba-135:text'], 'Kişiye özel keşif açıklaması');
  assert(render(result).body.textContent.includes('Kişiye özel keşif açıklaması'));
});

check('Required section order changes preserve duplicates, visibility and existing group reordering', () => {
  const key = '/satis/', revision = revisions.pages[key], input = clone(revision.before);
  const repeatable = input.sections.find(section => section.groups.length);
  const copy = clone(repeatable); copy.id = 'custom-section-copy'; copy.hidden = true;
  repeatable.groups[0].items.reverse();
  input.sections.push(copy);
  const result = applyV13ContentUpdate(input), positions = result.sections.filter(section => section.source === copy.source);
  assert.equal(positions.length, 2);
  assert.equal(positions[1].id, copy.id); assert.equal(positions[1].hidden, true);
  assert.deepEqual(positions[0].groups[0].items.map(item => item.id), repeatable.groups[0].items.map(item => item.id));
  assert.deepEqual([...new Set(result.sections.map(section => section.source))], revision.after.sections.map(section => section.source));
});

check('Removed authored biography group item is removed while retained custom item values survive', () => {
  const revision = revisions.pages['/ziya-sakir-yilmaz/'], input = clone(revision.before);
  const group = input.sections.flatMap(section => section.groups).find(group => group.id === '3713910b-132');
  assert(group);
  group.items[0].values['3713910b-135:text'] = 'Korunacak kariyer açıklaması';
  const result = applyV13ContentUpdate(input), next = result.sections.flatMap(section => section.groups).find(item => item.id === group.id);
  assert(!next.items.some(item => item.source === '3713910b-145'));
  assert.equal(next.items[0].values['3713910b-135:text'], 'Korunacak kariyer açıklaması');
});

check('Migration marker preserves subsequent editor changes and custom reordering verbatim', () => {
  const key = '/kursun-gecirmez-kafa-yapisi/', revision = revisions.pages[key], input = migrated(key);
  const field = changes(revision).find(field => field.target === 'text');
  input.values[field.id] = 'Revize sonrasında kaydedilen yeni metin';
  input.sections.find(section => section.source === field.section).values[field.id] = 'Revize sonrası bölüm metni';
  input.sections.reverse();
  const before = clone(input), result = applyV13ContentUpdate(input);
  assert.equal(result, input); assert.deepEqual(result, before);
});

check('Basın navigation is added once without replacing bespoke menus and links', () => {
  const input = clone(globalRevision.before);
  // The baseline seed predates the structured navigation model; an existing
  // admin document can still contain one derived by the navigation editor.
  input.navigation = deriveNavigation(render(input));
  assert(!input.navigation.footer.flatMap(group => group.items).some(item => item.href === '/basin/'));
  input.navigation.primary[0].label = 'Özel menü etiketi';
  input.navigation.footer[0].items.push({id:'custom-resource',label:'Özel kaynak',href:'/makaleler/',hidden:false,newTab:false});
  const result = applyV13ContentUpdate(input);
  assert.equal(result.navigation.primary[0].label, 'Özel menü etiketi');
  assert.deepEqual(validateNavigation(result.navigation), []);
  assert(result.navigation.footer.flatMap(group => group.items).some(item => item.id === 'custom-resource'));
  assert.equal(result.navigation.footer.flatMap(group => group.items).filter(item => item.href === '/basin/').length, 1);
  assert.equal(applyV13ContentUpdate(result).navigation.footer.flatMap(group => group.items).filter(item => item.href === '/basin/').length, 1);
});

check('Legacy navigation field overrides, item order and hidden state survive the Basın addition', () => {
  const input = clone(globalRevision.before), definition = catalog._global;
  assert.equal(input.navigation, undefined, 'Fixture represents a pre-structured navigation document');
  for (const id of ['cf8e6d9e-47', 'cf8e6d9e-424']) {
    const section = input.sections.find(section => section.groups.some(group => group.id === id));
    const group = section.groups.find(group => group.id === id), item = group.items[0];
    const fields = definition.groups.find(group => group.id === id).items.find(source => source.id === item.source).fields.map(field => definition.fields.find(entry => entry.id === field));
    const text = fields.find(field => field.target === 'text'), link = fields.find(field => field.target === '@href');
    assert(text && link);
    input.values[text.id] = 'Üst düzey özel menü'; section.values[text.id] = 'Bölüme özel menü';
    item.values[text.id] = 'Öğe düzeyinde özel menü ' + id;
    input.values[link.id] = '/basari/'; section.values[link.id] = '/liderlik/'; item.values[link.id] = '/ozel-baglanti/';
    group.items[1].hidden = true;
    group.items.reverse();
  }
  const navigationBefore = deriveNavigation(render(input)), result = applyV13ContentUpdate(input);
  assert.equal(result.navigation, undefined, 'A new structured model must not mask legacy bindings');
  const navigationAfter = deriveNavigation(render(result));
  const press = navigationAfter.footer.flatMap(group => group.items).filter(item => item.href === '/basin/');
  assert.equal(press.length, 1);
  navigationAfter.footer.forEach(group => { group.items = group.items.filter(item => item.href !== '/basin/'); });
  // Derivation numbers visible items in DOM order. Equality checks labels,
  // targets, visibility, grouping and administrator order together.
  assert.deepEqual(navigationAfter, navigationBefore);
  assert.equal(applyV13ContentUpdate(result), result);
});

check('Custom and mixed hero playlists plus clip framing survive; known legacy films switch to 11 seconds', () => {
  const revision = revisions.pages['/'];
  const customClip = {id:'admin-film',src:'/assets/custom-stage.mp4',poster:'/assets/custom-stage.jpg',focal:'right',start:4.5,end:13.5};
  for (const playlist of [[customClip], [{id:'old-film',src:'/assets/hero-stage-clean-1080.mp4',start:0,end:7}, customClip]]) {
    const input = clone(revision.before); input.experience = {playlist:clone(playlist)};
    input.values[clipMediaFrameKey(customClip.id)] = frame(customClip.src);
    const result = applyV13ContentUpdate(input);
    assert.deepEqual(result.experience.playlist, playlist);
    assert.equal(result.values[clipMediaFrameKey(customClip.id)], input.values[clipMediaFrameKey(customClip.id)]);
  }
  for (const src of ['/assets/hero-stage-clean-1080.mp4', '/assets/hero-stage-clean-720.mp4?v=old', '/assets/hero-loop-v5.mp4']) {
    const input = clone(revision.before); input.experience = {playlist:[{id:'old',src,start:0,end:7}]};
    const result = applyV13ContentUpdate(input);
    assert.deepEqual(result.experience.playlist, revision.after.experience.playlist);
    assert.equal(result.experience.playlist[0].end - result.experience.playlist[0].start, 11);
  }
});

check('Known generated proposal quotes are cleared; real approved and unfinished custom records survive', () => {
  const input = clone(revisions.pages['/'].before);
  const real = {id:'actual-client',name:'Örnek Müşteri',quote:'Ekibimizin atölyesinde karar süreçlerini birlikte gözden geçirdik.',role:'Eğitim yöneticisi',company:'Örnek Kurum',status:'approved',enabled:true};
  const custom = {id:'custom-draft',name:'Taslak kişi',quote:'Kişinin onayını bekleyen özgün taslak.',role:'',company:'',status:'draft',enabled:true};
  input.testimonials = {enabled:true,items:[{...real,id:'old-proposal',quote:'Başarıyı günlük davranışlara dönüştüren, üzerinde düşünmeye değer bir yaklaşım.'}, real, custom]};
  const result = applyV13ContentUpdate(input);
  assert.deepEqual(result.testimonials.items, [real, custom]);
});

check('Migrated old seed renders identically to new seed for every existing route', () => {
  for (const [route, revision] of Object.entries(revisions.pages)) {
    if (!revision.before) continue;
    const actual = render(migrated(route), {composed:true}).toString();
    const expected = render(applyMindsetFlowUpdate(clone(revision.after)), {composed:true}).toString();
    if (route === '_global') {
      // New installations have structured navigation; upgraded legacy sites
      // retain authored field bindings. Their markup may differ, not their menu.
      assert.deepEqual(deriveNavigation(parseHTML(actual).document), deriveNavigation(parseHTML(expected).document), route + ': final navigation differs');
    } else assert.equal(actual, expected, route + ': final server HTML differs');
  }
});

console.log(`${passed} V13 migration checks passed; ${failed} failed. Browser playback and production database persistence are not asserted here.`);
if (failed) process.exitCode = 1;
