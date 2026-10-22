/** Per-placement framing, rendered draft parity and backward-compatibility checks. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {parseMediaFrame, serializeMediaFrame, mediaFrameKey, clipMediaFrameKey, getMediaFrameSpec, applyMediaFrame, clearMediaFrame, applyPlaylistMediaFrames, validateDocumentMediaFrames} from '../cms/media-framing.mjs';
import {applyContent, validateDocument} from '../cms/render.mjs';
import {composeContent} from '../cms/compose.mjs';
import {derivePublishedBooks, applyHomeBooks} from '../cms/collections.mjs';
import {applyExperience} from '../cms/experience.mjs';

const json = name => JSON.parse(fs.readFileSync(new URL('../cms/' + name + '.json', import.meta.url), 'utf8'));
const templates = json('templates'), catalog = json('catalog'), seed = json('seed');
const clone = structuredClone;
const home = () => clone(seed.find(page => page.route === '/'));
const frame = (src, x = 20, y = 10, zoom = 1.3) => ({v: 1, src, desktop: {x, y, zoom}, mobile: {x: 65, y: 20, zoom: 1.7}});
const render = payload => {const doc = parseHTML(templates[payload.template]).document; applyContent(doc, payload, catalog[payload.template]); return doc;};
const homeField = catalog['/'].fields.find(field => field.type === 'image' && field.target === '@src' && home().values[field.id] === '/assets/salon-genis.webp');
const nodeFor = (doc, field = homeField) => doc.querySelector(`[data-cms-node="${field.node}"]`);
let checks = 0;
const check = (name, fn) => {fn(); checks++; console.log('PASS ' + name);};

check('Versioned frame data is finite, bounded, source-bound and immutable', () => {
  const input = frame('/photo.webp');
  assert.deepEqual(parseMediaFrame(serializeMediaFrame(input), '/photo.webp'), input);
  assert.equal(parseMediaFrame(input, '/replacement.webp'), null);
  const copied = parseMediaFrame(input); copied.desktop.x = 99; assert.equal(input.desktop.x, 20);
  const invalid = [null, '', 'not json', [], {...input, v: 2}, {...input, extra: 1}, {...input, src: 'javascript:alert(1)'}, {...input, src: '//unsafe.test/x'}, {...input, src: 'https://u:p@example.org/x'}, {...input, src: '/a\nb'}, {...input, desktop: {...input.desktop, x: -1}}, {...input, mobile: {...input.mobile, y: 101}}, {...input, desktop: {...input.desktop, zoom: 0.9}}, {...input, desktop: {...input.desktop, zoom: 3.1}}, {...input, desktop: {...input.desktop, x: '20'}}, {...input, desktop: {...input.desktop, zoom: Infinity}}, {...input, mobile: {...input.mobile, extra: 1}}];
  for (const value of invalid) assert.equal(parseMediaFrame(value), null);
});

check('Existing content remains opt-in and representative ratios match actual template contexts', () => {
  const doc = render(home());
  assert.equal(doc.querySelector('[data-media-framed],style[data-media-framing-styles]'), null);
  const wide = getMediaFrameSpec(nodeFor(doc)); assert.deepEqual(wide.desktop, {width: 1232, height: 550}); assert.deepEqual(wide.mobile, {width: 346, height: 260});
  const hero = getMediaFrameSpec(doc.querySelector('.hero-vid video')); assert.equal(hero.responsive, true); assert.ok(hero.mobile.width < hero.mobile.height);
  const bio = getMediaFrameSpec(doc.querySelector('.bio-spread img')); assert.equal(bio.desktop.width / bio.desktop.height, 3 / 4); assert.equal(bio.mobile.width / bio.mobile.height, 4 / 4.5);
});

check('Field framing survives responsive delivery and carries independent phone positioning', () => {
  const payload = home(), value = frame(payload.values[homeField.id]); payload.values[mediaFrameKey(homeField.id)] = serializeMediaFrame(value);
  const doc = render(payload), image = nodeFor(doc);
  assert.equal(image.getAttribute('data-media-framed'), 'true');
  assert.equal(image.style.getPropertyValue('--media-frame-x'), '20%'); assert.equal(image.style.getPropertyValue('--media-frame-mobile-x'), '65%');
  assert.equal(image.style.getPropertyValue('--media-frame-zoom'), '1.3'); assert.equal(image.style.getPropertyValue('--media-frame-mobile-zoom'), '1.7');
  assert.match(image.getAttribute('src'), /^\/assets\/responsive\//); assert.ok(image.getAttribute('srcset'));
  assert.equal(parseMediaFrame(image.getAttribute('data-media-frame')).src, '/assets/salon-genis.webp');
  assert.equal(doc.querySelectorAll('style[data-media-framing-styles]').length, 1); assert.match(doc.querySelector('style[data-media-framing-styles]').textContent, /max-width:760px/);
  assert.equal(image.parentElement.className, 'photo-crop');
});

check('Section reset and source replacement clear inherited frames without changing the original document', () => {
  const payload = home(), section = payload.sections.find(section => section.source === homeField.section);
  payload.values[mediaFrameKey(homeField.id)] = serializeMediaFrame(frame(payload.values[homeField.id]));
  section.values[mediaFrameKey(homeField.id)] = '';
  const initial = JSON.stringify(payload), reset = nodeFor(render(payload)); assert.equal(reset.hasAttribute('data-media-framed'), false); assert.equal(reset.style.getPropertyValue('--media-frame-x'), ''); assert.equal(JSON.stringify(payload), initial);
  delete section.values[mediaFrameKey(homeField.id)]; section.values[homeField.id] = '/assets/replaced.webp';
  assert.equal(nodeFor(render(payload)).hasAttribute('data-media-framed'), false);
  section.values[mediaFrameKey(homeField.id)] = serializeMediaFrame(frame('/assets/replaced.webp', 80)); assert.equal(nodeFor(render(payload)).style.getPropertyValue('--media-frame-x'), '80%');
});

check('Repeated book media retain per-item framing and explicit resets on the homepage and archive', () => {
  const payload = clone(seed.find(page => page.route === '/kitaplar/')), definition = catalog['/kitaplar/'];
  const gd = definition.groups.find(group => group.label === 'Kitaplar'), section = payload.sections.find(section => section.groups.some(group => group.id === gd.id)), group = section.groups.find(group => group.id === gd.id);
  const source = group.items[0], sourceDefinition = gd.items.find(item => item.id === source.source), field = definition.fields.find(field => sourceDefinition.fields.includes(field.id) && field.type === 'image' && field.target === '@src');
  const src = source.values[field.id] ?? section.values[field.id] ?? payload.values[field.id];
  const first = {...clone(source), id: 'first-crop', values: {...source.values, [mediaFrameKey(field.id)]: serializeMediaFrame(frame(src, 15))}};
  const second = {...clone(source), id: 'second-crop', values: {...source.values, [mediaFrameKey(field.id)]: serializeMediaFrame(frame(src, 85))}};
  const third = {...clone(source), id: 'reset-crop', values: {...source.values, [mediaFrameKey(field.id)]: ''}};
  payload.values[mediaFrameKey(field.id)] = serializeMediaFrame(frame(src, 45)); group.items = [first, second, third];
  const books = derivePublishedBooks(payload, definition); assert.deepEqual(books.map(book => book.frame?.desktop.x ?? null), [15, 85, null]);
  const archive = render(payload); assert.deepEqual([...archive.querySelectorAll('.book-cover img')].map(image => image.style.getPropertyValue('--media-frame-x') || null), ['15%', '85%', null]);
  const doc = render(home()); applyHomeBooks(doc, payload, definition); assert.deepEqual([...doc.querySelectorAll('.home-book-cover img')].map(image => image.style.getPropertyValue('--media-frame-x') || null), ['15%', '85%', null]);
});

check('Video source/poster companions share one crop while empty sibling resets cannot erase the selection', () => {
  const payload = home(), source = catalog['/'].fields.find(field => field.type === 'video' && field.target === '@src'), poster = catalog['/'].fields.find(field => field.node === source.node && field.target === '@poster');
  payload.values[mediaFrameKey(source.id)] = serializeMediaFrame(frame(payload.values[source.id], 17)); payload.values[mediaFrameKey(poster.id)] = '';
  assert.equal(nodeFor(render(payload), source).style.getPropertyValue('--media-frame-x'), '17%');
  payload.values[mediaFrameKey(source.id)] = ''; payload.values[mediaFrameKey(poster.id)] = serializeMediaFrame(frame(payload.values[poster.id], 76));
  assert.equal(nodeFor(render(payload), source).style.getPropertyValue('--media-frame-x'), '76%');
});

check('Playlist framing follows stable clip identities after recreated video nodes and rejects stale sources', () => {
  const payload = home(), doc = render(payload), original = doc.querySelector('.hero-vid video');
  applyMediaFrame(original, frame(original.getAttribute('src'), 5));
  payload.experience = {playlist: [{id: 'first', src: '/first.mp4', poster: '/first.webp', focal: 'center'}, {id: 'second', src: '/second.mp4', poster: '/second.webp', focal: 'center'}]};
  payload.values[clipMediaFrameKey('second')] = serializeMediaFrame(frame('/second.mp4', 80));
  applyExperience(doc, payload); applyPlaylistMediaFrames(doc, payload);
  const first = doc.querySelector('video[data-hero-clip="first"]'), second = doc.querySelector('video[data-hero-clip="second"]');
  assert.equal(first.hasAttribute('data-media-framed'), false); assert.equal(second.style.getPropertyValue('--media-frame-x'), '80%');
  payload.experience.playlist[1].src = '/third.mp4'; applyExperience(doc, payload); applyPlaylistMediaFrames(doc, payload);
  assert.equal(doc.querySelector('video[data-hero-clip="second"]').hasAttribute('data-media-framed'), false);
  const composed = parseHTML(templates['/']).document; payload.experience.playlist[1].src = '/second.mp4'; composeContent(composed, payload, catalog['/']);
  assert.equal(composed.querySelector('video[data-hero-clip="second"]').style.getPropertyValue('--media-frame-x'), '80%');
});

check('Generic crop wrappers preserve adjacent text and can be removed without leaving layout changes', () => {
  const doc = parseHTML('<!doctype html><html><head></head><body><a class="card"><img src="/test.webp" width="800" height="600"><h2>Başlık</h2></a></body></html>').document, image = doc.querySelector('img');
  applyMediaFrame(image, frame('/test.webp')); assert.ok(image.parentElement.hasAttribute('data-media-frame-wrapper')); assert.equal(image.parentElement.querySelector('h2'), null); assert.equal(doc.querySelector('a > h2').textContent, 'Başlık');
  clearMediaFrame(image); assert.equal(image.parentElement.tagName, 'A'); assert.equal(doc.querySelector('[data-media-frame-wrapper]'), null); assert.equal(image.hasAttribute('data-media-framed'), false);
});

check('Validation rejects malformed companions, accepts scoped resets and recognized record keys', () => {
  const payload = home(), key = mediaFrameKey(homeField.id); payload.values[key] = '';
  assert.deepEqual(validateDocumentMediaFrames(payload, catalog['/']), []);
  payload.values[key] = serializeMediaFrame(frame(payload.values[homeField.id]));
  for (const key of ['media-frame:clip:clip-1', 'media-frame:avatar:person-1', 'media-frame:reference:logo-1']) payload.values[key] = serializeMediaFrame(frame('/safe.webp'));
  assert.deepEqual(validateDocumentMediaFrames(payload, catalog['/']), []); assert.deepEqual(validateDocument(payload, catalog['/']), []);
  for (const invalid of ['{}', JSON.stringify({...frame('/safe.webp'), desktop: {x: 200, y: 50, zoom: 1}}), {v: 1}]) {payload.values[key] = invalid; assert.ok(validateDocumentMediaFrames(payload, catalog['/']).length);}
  payload.values[key] = ''; payload.values['unknown:@src:frame'] = serializeMediaFrame(frame('/safe.webp')); assert.ok(validateDocumentMediaFrames(payload, catalog['/']).length);
});

console.log(`${checks} media framing checks passed; visual browser behavior is not asserted by these DOM checks.`);
