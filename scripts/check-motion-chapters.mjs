/* Runtime regression checks for scroll chapters and progressive glass type.
   Geometry is deterministic; these do not claim a browser rendering audit. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseHTML } from 'linkedom';
import postcss from 'postcss';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const code = read('website/assets/editorial-motion.js');
const cssText = read('website/assets/editorial.css');
const css = postcss.parse(cssText);
assert.equal(code, read('public/assets/editorial-motion.js'), 'Published motion script matches source');
assert.equal(cssText, read('public/assets/editorial.css'), 'Published motion styling matches source');
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };

function geometry(el, y, h) {
  Object.defineProperties(el, {
    offsetTop: { configurable: true, value: y },
    offsetHeight: { configurable: true, value: h },
    offsetParent: { configurable: true, value: null },
  });
}
function accessibleTitle(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('br').forEach(br => br.replaceWith(clone.ownerDocument.createTextNode(' ')));
  return clone.textContent.replace(/\s+/g, ' ').trim();
}
function fixture(html, { width = 1440, reduced = false } = {}) {
  const { document } = parseHTML(html);
  const titles = new Map([...document.querySelectorAll('h2')].map(el => [el, {
    text: el.textContent, name: accessibleTitle(el), breaks: el.querySelectorAll('br').length,
  }]));
  [...document.querySelectorAll('*')].forEach(el => geometry(el, 1000, 80));
  [...document.querySelectorAll('[data-motion-section]')].forEach((section, i) => {
    const y = i * 1200;
    geometry(section, y, 900);
    [...section.querySelectorAll('*')].forEach((el, j) => geometry(el, y + 70 + j * 3, 80));
  });
  for (const el of document.querySelectorAll('[data-test-y]')) geometry(el, +el.dataset.testY, +(el.dataset.testHeight || 80));
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 12000 });
  const frames = new Map(), events = new Map();
  let frameId = 0;
  const motion = { matches: reduced, addEventListener(name, fn) { events.set(`motion-${name}`, fn); } };
  const env = {
    document, innerHeight: 800, innerWidth: width, scrollY: 0, Intl,
    matchMedia: () => motion,
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
    addEventListener(name, fn) { events.set(name, fn); },
    ResizeObserver: class { observe() {} },
  };
  env.window = env;
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); };
  runInNewContext(code, env);
  flush();
  return {
    document, titles, env,
    scroll(y) { env.scrollY = y; events.get('scroll')(); flush(); },
    reduced(value) { motion.matches = value; events.get('motion-change')(); flush(); },
    resize(width) { env.innerWidth = width; events.get('resize')(); flush(); },
  };
}
const sample = `<!doctype html><html><body data-editorial>
  <section class="hero" data-motion-section><h1 data-motion-item>Opening remains stable</h1></section>
  <section id="first" class="ed-section" data-motion-section data-test-y="1000" data-test-height="900"><div class="wrap">
    <div class="ed-heading" data-motion-item><h2 id="title-one" data-test-y="1080">İyi bir <em data-inline-note="preserved">başlangıç</em>.<br>İstanbul’da güçlen. 👩🏽‍💻</h2><p>Always readable.</p></div>
    <a id="chapter-link" href="#closing">Next section</a>
  </div></section>
  <section id="second" class="ed-section ed-dark" data-motion-section data-test-y="2300"><div class="wrap"><div class="ed-heading"><h2 id="title-two">Sahneye çık.</h2></div><h2 id="extra-title">An ordinary title</h2></div></section>
  <section id="closing" class="ed-section ed-closing" data-motion-section data-test-y="3400"><div class="wrap"><div class="ed-heading"><h2 id="title-three">Birlikte ilerleyelim.</h2></div></div></section>
  <section id="contact" class="ed-section" data-motion-section><div class="wrap"><form><div id="form-copy" data-motion-item><label>İsim<input name="name"></label></div></form></div></section>
  <section id="quiz" class="ed-section" data-motion-section><div class="wrap test-shell"><div id="quiz-card" data-motion-item><h2>Soruyu yanıtlayın.</h2><button>Yanıt</button></div></div></section>
  <section id="reading-section" class="ed-section" data-motion-section><div class="wrap reading-layout"><nav class="reading-toc">Contents</nav><article class="prose" data-motion-item><h2>Reading title</h2><p>Long reading.</p></article></div></section>
  <article id="tall" data-motion-item data-test-y="5000" data-test-height="1400">Long content</article>
  <section class="ed-section ed-proof" data-motion-section><div class="wrap">Final proof values</div></section>
  </body></html>`;
const props = el => ['--panel-y', '--panel-x', '--panel-scale'].map(name => Number.parseFloat(el.style.getPropertyValue(name)));

check('Desktop chapters visibly move, settle and reverse', () => {
  const f = fixture(sample), first = f.document.getElementById('first');
  assert.deepEqual(props(first), [112, 32, .945]);
  assert.deepEqual(props(f.document.getElementById('second')), [112, -32, .945]);
  f.scroll(600); const mid = props(first);
  assert.ok(mid[0] > 0 && mid[0] < 112 && mid[1] > 0 && mid[2] > .945 && mid[2] < 1);
  f.scroll(900); assert.deepEqual(props(first), [0, 0, 1], 'Reading position has no entrance displacement');
  f.scroll(600); assert.deepEqual(props(first), mid, 'Scroll reversal restores exact progress');
  f.scroll(0); assert.deepEqual(props(first), [112, 32, .945]);
  assert.equal(first.querySelector('[data-motion-item]').style.getPropertyValue('--item-y') || '', '', 'Panel children do not compound item travel');
});
check('Mobile movement is bounded and resize updates it', () => {
  const f = fixture(sample, { width: 390 }), first = f.document.getElementById('first');
  assert.deepEqual(props(first), [64, 10, .975]);
  f.scroll(900); assert.deepEqual(props(first), [0, 0, 1]);
  f.scroll(0); f.resize(1440); assert.deepEqual(props(first), [112, 32, .945]);
});
check('Three selected titles preserve copy, line breaks, inline emphasis and Turkish graphemes', () => {
  const f = fixture(sample);
  assert.deepEqual([...f.document.querySelectorAll('.motion-title')].map(el => el.id), ['title-one', 'title-two', 'title-three']);
  for (const [el, before] of f.titles) {
    assert.equal(el.textContent, before.text);
    assert.equal(el.querySelectorAll('br').length, before.breaks);
    if (el.classList.contains('motion-title')) {
      assert.equal(el.getAttribute('aria-label'), before.name);
      assert.ok([...el.querySelectorAll('.motion-word')].every(word => word.getAttribute('aria-hidden') === 'true'));
    }
  }
  const first = f.document.getElementById('title-one');
  assert.equal(first.querySelector('em[data-inline-note="preserved"]').textContent, 'başlangıç');
  assert.ok([...first.querySelectorAll('.motion-letter')].some(el => el.textContent === 'İ'), 'Combining dotted I remains one grapheme');
  assert.ok([...first.querySelectorAll('.motion-letter')].some(el => el.textContent === '👩🏽‍💻'), 'Joined emoji remains one grapheme');
  const letters = [...first.querySelectorAll('.motion-letter')];
  f.scroll(750);
  assert.notEqual(letters[0].style.transform, letters.at(-1).style.transform, 'Letters have staggered scroll progress');
  f.scroll(1000);
  assert.ok(letters.every(el => /translate3d\(0,0\.00px,0\) scale\(1\.000\) rotateX\(0\.00deg\)/.test(el.style.transform)), 'Heading settles at readable size');
});
check('Forms, quizzes, reading layouts and proof points remain stable', () => {
  const f = fixture(sample);
  for (const id of ['contact', 'quiz', 'reading-section']) assert.equal(f.document.getElementById(id).classList.contains('motion-panel'), false);
  for (const id of ['form-copy', 'quiz-card']) assert.equal(f.document.getElementById(id).style.getPropertyValue('--item-y') || '', '', `${id} is excluded from fallback travel`);
  assert.equal(f.document.querySelector('.ed-proof').classList.contains('motion-panel'), false);
  assert.equal(f.document.getElementById('tall').style.getPropertyValue('--item-y'), '0px');
  const reading = fixture(sample.replace('body data-editorial', 'body data-editorial data-reading="article"'));
  assert.equal(reading.document.querySelectorAll('.motion-panel,.motion-title').length, 0, 'Long-form pages have no chapter or split-letter animation');
});
check('Initial and dynamic reduced motion restore natural transforms', () => {
  const f = fixture(sample); f.scroll(600); f.reduced(true);
  for (const section of f.document.querySelectorAll('[data-motion-section]')) {
    assert.equal(section.style.getPropertyValue('--media-y'), '0px');
    assert.equal(section.style.getPropertyValue('--photo-y'), '0px');
    if (section.classList.contains('motion-panel')) {
      assert.deepEqual(props(section), [0, 0, 1]);
      assert.equal(section.dataset.motionActive, 'false');
    }
  }
  assert.ok([...f.document.querySelectorAll('.motion-letter')].every(el => el.style.transform === 'none'));
  f.reduced(false); assert.ok(props(f.document.getElementById('first'))[0] > 0);
  const initial = fixture(sample, { reduced: true });
  assert.deepEqual(props(initial.document.getElementById('first')), [0, 0, 1]);
});

function rules(selector) { const found = []; css.walkRules(rule => { if (rule.selectors.includes(selector)) found.push(rule); }); return found; }
function decl(rule, name) { return rule.nodes.find(node => node.type === 'decl' && node.prop === name)?.value; }
check('Focus, print, forced colors and no-JavaScript fallbacks remain readable', () => {
  assert.ok(rules('.motion-ready .motion-panel:focus-within>.wrap').some(rule => decl(rule, 'transform') === 'none'));
  assert.ok(rules('.motion-panel:focus-within .motion-letter').some(rule => decl(rule, 'transform') === 'none'));
  assert.ok(rules('.motion-word').some(rule => decl(rule, 'white-space') === 'nowrap'));
  assert.ok(rules('[data-editorial] .reveal').some(rule => decl(rule, 'opacity') === '1'));
  for (const state of ['prefers-reduced-motion:reduce', 'forced-colors:active', 'print']) {
    let found = false;
    css.walkAtRules('media', rule => { if (rule.params.includes(state)) rule.walkRules('.motion-letter', child => { if (decl(child, 'background') === 'none') found = true; }); });
    assert.ok(found, `${state} disables decorative transparent text fill`);
  }
  const { document } = parseHTML(sample);
  assert.equal(document.querySelectorAll('.motion-word,.motion-letter,.motion-ready').length, 0, 'Server HTML requires no motion script to expose its text');
});
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
const lum = hex => rgb(hex).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
check('Every opaque glass gradient stop retains at least 4.5:1 contrast', () => {
  for (const [selector, background] of [['.motion-letter', '#f5f3ee'], ['.motion-letter', '#e9ece2'], ['.ed-dark .motion-letter', '#252e27']]) {
    const gradients = rules(selector).map(rule => decl(rule, 'background-image')).filter(Boolean);
    assert.ok(gradients.length);
    for (const gradient of gradients) for (const color of gradient.match(/#[a-f0-9]{6}\b/gi) || []) {
      const a = lum(color), b = lum(background), ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      assert.ok(ratio >= 4.5, `${color} on ${background} is only ${ratio.toFixed(2)}:1`);
    }
  }
});

const routes = Object.keys(JSON.parse(read('cms/metadata.json')));
check(`Actual runtime is safe on all ${routes.length} content pages`, () => {
  for (const route of routes) {
    const f = fixture(read(`website/${route.replace(/^\//, '')}index.html`));
    const titles = [...f.document.querySelectorAll('.motion-title')];
    assert.ok(titles.length <= 3, `${route}: at most three enhanced titles`);
    for (const [el, before] of f.titles) {
      assert.equal(el.textContent, before.text, `${route}: authored heading copy survives`);
      assert.equal(el.querySelectorAll('br').length, before.breaks, `${route}: line breaks survive`);
      if (el.classList.contains('motion-title')) assert.equal(el.getAttribute('aria-label'), before.name);
    }
    for (const panel of f.document.querySelectorAll('.motion-panel')) {
      assert.ok(panel.querySelector(':scope > .wrap'));
      assert.equal(panel.querySelector('.reading-layout,.test-shell,form'), null);
    }
    if (f.document.body.hasAttribute('data-reading')) assert.equal(f.document.querySelectorAll('.motion-panel,.motion-title').length, 0);
    for (const y of [500, 1600, 4000, 500]) {
      f.scroll(y);
      assert.doesNotMatch(f.document.documentElement.outerHTML, /(?:--panel-[a-z-]+|--item-y|--title-shine):[^;\"]*(?:NaN|Infinity)/, `${route}: finite transforms`);
    }
    f.reduced(true);
    assert.ok([...f.document.querySelectorAll('.motion-letter')].every(el => el.style.transform === 'none'));
  }
});
console.log(`PASS: ${checks.length} chapter-motion groups; desktop/mobile travel, scroll reversal, title integrity, Turkish graphemes, interactive exclusions, accessibility fallbacks, glass contrast and ${routes.length} real templates.`);
