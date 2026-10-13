import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseHTML } from 'linkedom';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const code = read('website/assets/main.js');
assert.equal(code, read('public/assets/main.js'), 'Source and served interactions must agree');
assert.equal(read('website/assets/content-depth.css'), read('public/assets/content-depth.css'), 'Source and served proof styles must agree');
const source = parseHTML(read('website/index.html')).document;
const proof = source.querySelector('#rakamlarla');
assert.ok(proof && proof.tagName === 'SECTION', 'Proof points must be a CMS-manageable section');
assert.ok(proof.previousElementSibling.classList.contains('hero'), 'Counters immediately follow the hero video');
assert.equal(proof.nextElementSibling.id, 'sahneden-hayata');
const expected = [
  ['600.000+', 'insana eğitim ve konuşma'],
  ['84 ülke', 'iş ve sahne deneyimi'],
  ['5× TEDx', 'sahne konuşması'],
  ['4 kitap', '75.000+ okura ulaşan yazar'],
  ['30 yıl', 'satış ve liderlik tecrübesi'],
];
assert.deepEqual([...proof.querySelectorAll('.proof-stat')].map(el => [el.querySelector('[data-counter]').textContent, el.querySelector('.proof-label').textContent]), expected, 'All five original, authored values must remain in server HTML');

function fixture({ text = '600.000+', reduced = false, observer = true, staleAttribute = '' } = {}) {
  const { document } = parseHTML(`<html><body><p id="counter" data-counter ${staleAttribute}>${text}</p></body></html>`);
  const el = document.getElementById('counter');
  const observers = [], frames = new Map(), changes = [];
  let id = 0;
  const motion = { matches: reduced, addEventListener(type, fn) { if (type === 'change') changes.push(fn); } };
  const env = {
    document, scrollY: 0,
    matchMedia: () => motion,
    addEventListener() {}, setTimeout() {},
    requestAnimationFrame(fn) { frames.set(++id, fn); return id; },
    cancelAnimationFrame(key) { frames.delete(key); },
  };
  if (observer) env.IntersectionObserver = class {
    constructor(fn, options) { this.fn = fn; this.options = options; this.watched = new Set(); observers.push(this); }
    observe(node) { this.watched.add(node); }
    unobserve(node) { this.watched.delete(node); }
    disconnect() { this.watched.clear(); }
  };
  env.window = env;
  runInNewContext(code, env);
  return {
    el, frames, observers,
    enter(value = true) { observers[0]?.fn([{ target: el, isIntersecting: value }]); },
    tick(timestamp) { const pending = [...frames]; frames.clear(); for (const [, fn] of pending) fn(timestamp); },
    motion(value) { motion.matches = value; for (const fn of changes) fn(); },
    accessible() { const copy = el.cloneNode(true); copy.querySelectorAll('[aria-hidden="true"]').forEach(node => node.remove()); return copy.textContent; },
    visual() { return el.querySelector('[aria-hidden="true"]')?.textContent ?? el.textContent; },
  };
}

{
  const f = fixture();
  assert.equal(f.el.textContent, '600.000+', 'Offscreen numbers stay visible and final');
  assert.equal(f.frames.size, 0);
  f.enter(false); assert.equal(f.el.textContent, '600.000+');
  f.enter(); assert.equal(f.visual(), '0+'); assert.equal(f.accessible(), '600.000+');
  assert.equal(f.el.hasAttribute('aria-label'), false, 'Do not create a stale duplicate accessible label');
  f.tick(0); f.tick(800);
  assert.equal(f.visual(), '525.000+', 'Animation uses Turkish grouping and eased progress');
  assert.equal(f.accessible(), '600.000+', 'Assistive technology reads the final value throughout animation');
  f.tick(1600); assert.equal(f.el.textContent, '600.000+'); assert.equal(f.el.children.length, 0);
  f.enter(); assert.equal(f.frames.size, 0, 'A counter animates only once');
}
{
  const f = fixture({ staleAttribute: 'data-count="600000" data-suffix="+"' });
  f.el.textContent = '720.000+'; // Same update produced by the CMS renderer.
  f.enter(); f.tick(100); f.tick(900);
  assert.equal(f.visual(), '630.000+', 'Current visible CMS value overrides the stale original attribute');
  f.tick(1700); assert.equal(f.el.textContent, '720.000+');
}
for (const [text] of expected) {
  const f = fixture({ text }); f.enter(); f.tick(0); f.tick(1600);
  assert.equal(f.el.textContent, text, 'Every authored suffix survives animation');
}
{
  const f = fixture({ reduced: true });
  assert.equal(f.observers.length, 0); assert.equal(f.frames.size, 0); assert.equal(f.el.textContent, '600.000+');
}
{
  const f = fixture(); f.enter(); f.tick(0); f.tick(400); f.motion(true);
  assert.equal(f.frames.size, 0); assert.equal(f.el.textContent, '600.000+'); assert.equal(f.observers[0].watched.size, 0);
  f.motion(false); f.enter(); assert.equal(f.frames.size, 0, 'Turning motion back on does not replay completed counters');
}
{
  const f = fixture(); f.motion(true); assert.equal(f.el.textContent, '600.000+'); assert.equal(f.observers[0].watched.size, 0);
}
{
  const f = fixture({ observer: false }); assert.equal(f.el.textContent, '600.000+'); assert.equal(f.frames.size, 0);
}
{
  const f = fixture({ text: 'Yeni değer hazırlanıyor' }); f.enter(); assert.equal(f.el.textContent, 'Yeni değer hazırlanıyor'); assert.equal(f.frames.size, 0);
}
console.log('PASS: five original proof points below video, CMS text edits, once-only count-up, stable accessible values, suffixes, observer fallback and initial/dynamic reduced motion.');
