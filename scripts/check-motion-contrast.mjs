/* Deterministic regression checks for the Lighthouse contrast failures.
   These validate palette math and scroll behavior, not a new browser audit. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseHTML } from 'linkedom';
import postcss from 'postcss';

const asset = name => readFileSync(new URL(`../website/assets/${name}`, import.meta.url), 'utf8');
const css = postcss.parse(asset('editorial.css') + '\n' + asset('content-depth.css'));
function prop(selector, name) {
  let value;
  css.walkRules(rule => {
    if (rule.parent.type !== 'root' || !rule.selectors.includes(selector)) return;
    rule.walkDecls(name, decl => { value = decl.value; });
  });
  assert.ok(value, `Missing ${selector} ${name}`);
  return value;
}
const rgb = hex => {
  assert.match(hex, /^#[a-f\d]{6}$/i);
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
};
const luminance = channels => channels.map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
const checks = [];
function contrast(name, foreground, background, opacity = 1, minimum = 4.5) {
  const bg = rgb(background), fg = rgb(foreground).map((c, i) => c * opacity + bg[i] * (1 - opacity));
  const a = luminance(fg), b = luminance(bg), ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  assert.ok(ratio >= minimum, `${name}: ${ratio.toFixed(2)} is below ${minimum}:1`);
  checks.push({ name, ratio });
}
const paper = prop('body[data-editorial]', 'background');
const ink = prop('body[data-editorial]', 'color');
const dark = prop('[data-editorial] .ed-dark', 'background');
const light = prop('[data-editorial] .ed-dark', 'color');
const eyebrowOpacity = +prop('[data-editorial] .eyebrow', 'opacity');
contrast('Paper eyebrow', ink, paper, eyebrowOpacity);
contrast('Dark eyebrow', light, dark, eyebrowOpacity);
contrast('Photo caption', prop('.ed-photo figcaption', 'color'), paper);
contrast('Dark photo caption', prop('.ed-dark .ed-photo figcaption', 'color'), dark);
contrast('Description', prop('.ed-description', 'color'), paper);
contrast('Dark description', prop('[data-editorial] .ed-dark .ed-description', 'color'), dark);
contrast('Topic number', prop('.topic-links>a>span', 'color'), paper);
contrast('Topic title', prop('.topic-links>a', 'color'), paper, 1, 3);
contrast('Topic body', prop('.topic-links p', 'color'), paper);
contrast('Program body', prop('.program-duo p:not(.eyebrow)', 'color'), paper);
contrast('Program button', prop('.ed-button', 'color'), prop('.ed-button', 'background'));
contrast('Program link', prop('.ed-link', 'color'), paper);
contrast('Continuation label', prop('.continuation-links>span', 'color'), paper);
contrast('Dark intent numbers', light, dark, +prop('.intent-number', 'opacity'));
contrast('Paper row numbers', ink, paper, +prop('.row-number', 'opacity'));
contrast('Dark row numbers', light, dark, +prop('.row-number', 'opacity'));
contrast('Detail labels', prop('.depth-body>div>span:first-child', 'color'), paper);
contrast('Detail link labels', prop('.depth-body a', 'color'), paper, +prop('.depth-body>a>span:last-child:not(:first-child)', 'opacity'));
contrast('Reading categories', prop('.reading-link', 'color'), prop('.ed-reading', 'background'), +prop('.reading-selection .reading-link>span.cat', 'opacity'));
assert.equal(prop('.motion-ready [data-motion-item]', 'opacity'), '1', 'Text-containing motion wrappers must stay fully opaque');

const { document } = parseHTML('<html><body><section class="hero" data-motion-section><h1 id="hero" data-motion-item>Opening</h1></section><section id="content" data-motion-section><div id="copy" data-motion-item>Readable copy <span id="nested" data-motion-item>Nested</span></div><article id="reading" class="reading-chapter" data-motion-item>Long read</article><div id="tall" data-motion-item>Tall block</div></section></body></html>');
const geometry = { hero: [0, 800], content: [900, 1500], copy: [1200, 200], nested: [1200, 20], reading: [1550, 500], tall: [2100, 1200] };
for (const [id, [y, h]] of Object.entries(geometry)) {
  const el = document.getElementById(id);
  Object.defineProperties(el, { offsetTop: { value: y }, offsetHeight: { value: h }, offsetParent: { value: null } });
}
Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3600 });
let pending;
const events = {};
const reduced = { matches: false, addEventListener(name, fn) { events[`reduced-${name}`] = fn; } };
const env = {
  document, innerHeight: 800, scrollY: 0,
  matchMedia: () => reduced,
  requestAnimationFrame: fn => { pending = fn; return 1; },
  addEventListener: (name, fn) => { events[name] = fn; },
};
env.window = env;
runInNewContext(asset('editorial-motion.js'), env);
function flush(y) {
  env.scrollY = y;
  events.scroll();
  assert.ok(pending, 'Scroll requests an animation frame');
  const fn = pending; pending = null; fn();
  for (const item of document.querySelectorAll('[data-motion-item]')) {
    assert.equal(item.style.getPropertyValue('--item-opacity') || '', '', 'Motion must not fade text at any scroll position');
    assert.equal(item.style.opacity || '', '', 'Motion must not set inline opacity');
  }
  return parseFloat(document.getElementById('copy').style.getPropertyValue('--item-y'));
}
const positions = [flush(0), flush(600), flush(1000), flush(1700), flush(600)];
assert.ok(positions[0] > positions[1] && positions[1] > positions[2] && positions[2] > positions[3], 'Text motion continues as the section crosses the viewport');
assert.equal(positions[1], positions[4], 'Reverse scrolling restores the same position');
assert.equal(document.getElementById('hero').style.getPropertyValue('--item-y') || '', '', 'Hero copy has no delayed entrance');
assert.equal(document.getElementById('nested').style.getPropertyValue('--item-y') || '', '', 'Nested motion is not multiplied');
assert.equal(document.getElementById('reading').style.getPropertyValue('--item-y'), '0px', 'Long reading content stays stable');
assert.equal(document.getElementById('tall').style.getPropertyValue('--item-y'), '0px', 'Viewport-tall content stays stable');
assert.notEqual(document.getElementById('content').style.getPropertyValue('--photo-y'), '0px', 'Photo parallax remains active');
reduced.matches = true;
events['reduced-change']();
flush(600);
for (const id of ['copy', 'reading', 'tall']) assert.equal(document.getElementById(id).style.getPropertyValue('--item-y'), '0px');
for (const section of document.querySelectorAll('[data-motion-section]')) {
  assert.equal(section.style.getPropertyValue('--media-y'), '0px');
  assert.equal(section.style.getPropertyValue('--photo-y'), '0px');
}
console.log(`${checks.length} WCAG palette checks passed (minimum ${Math.min(...checks.map(c => c.ratio)).toFixed(2)}:1); scroll, reverse, nested, hero, reading and reduced-motion checks passed.`);
