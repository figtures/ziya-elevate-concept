/* Deterministic palette and opaque motion-type checks.
   Engine/lifecycle contracts live in check-motion-chapters.mjs; this is not a Lighthouse or browser audit. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

const asset = name => readFileSync(new URL(`../website/assets/${name}`, import.meta.url), 'utf8');
const css = postcss.parse(asset('editorial.css') + '\n' + asset('content-depth.css'));
const variables = new Map();
css.walkRules(rule => {
  if (rule.parent.type !== 'root' || !rule.selectors.includes(':root')) return;
  rule.walkDecls(/^--/, decl => variables.set(decl.prop, decl.value));
});
function resolve(value, stack = []) {
  return value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (_, name, fallback) => {
    assert.ok(!stack.includes(name), `Cyclic CSS variable: ${[...stack, name].join(' -> ')}`);
    const next = variables.get(name) ?? fallback;
    assert.notEqual(next, undefined, `Unknown CSS variable: ${name}`);
    return resolve(next, [...stack, name]);
  });
}
function prop(selector, name) {
  let value;
  css.walkRules(rule => {
    if (rule.parent.type !== 'root' || !rule.selectors.includes(selector)) return;
    rule.walkDecls(name, decl => { value = decl.value; });
  });
  assert.ok(value, `Missing ${selector} ${name}`);
  return resolve(value);
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

// Moving letters use the ordinary contextual text color. No transparent fill or
// gradient may make individual glyphs fade as the scroll position changes.
assert.equal(prop('.motion-title-glass .motion-letter', 'background'), 'none');
assert.equal(prop('.motion-title-glass .motion-letter', 'color'), 'inherit');
assert.equal(prop('.motion-title-glass .motion-letter', 'text-shadow'), 'none');
css.walkRules(rule => {
  if (!rule.selectors.some(selector => selector.includes('.motion-title-glass .motion-letter'))) return;
  rule.walkDecls(decl => {
    assert.doesNotMatch(decl.value, /gradient\(|transparent/, 'Animated heading letters stay solid in every media state');
  });
});
for (const background of [paper, prop('.ed-reading', 'background')]) {
  contrast(`Solid heading on ${background}`, ink, background);
}
// The decorative reflection lightens navy by at most its maximum RGBA alpha.
let surface;
css.walkRules(rule => {
  if (rule.selectors.includes('.motion-surface:before')) rule.walkDecls('background', decl => { surface = decl.value; });
});
assert.ok(surface, 'Navy reflection surface is defined');
const reflection = surface.match(/rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
assert.ok(reflection, 'Reflection alpha is included in the contrast calculation');
const peak = rgb(dark).map((channel, index) => Math.round(channel * (1 - +reflection[4]) + +reflection[index + 1] * +reflection[4]));
const reflectedDark = '#' + peak.map(channel => channel.toString(16).padStart(2, '0')).join('');
for (const selector of ['[data-editorial] .ed-dark', '[data-editorial] .ed-closing']) {
  const color = prop(selector, 'color');
  contrast(`${selector} solid heading`, color, dark);
  contrast(`${selector} heading on peak reflection`, color, reflectedDark);
}
contrast('Navy paragraph on peak reflection', prop('[data-editorial] .ed-dark .ed-description', 'color'), reflectedDark);

// Preference and print styles keep the same ordinary text color; forced-color
// mode follows the user's system palette.
for (const state of ['prefers-reduced-motion:reduce', 'forced-colors:active', 'print']) {
  let readable = false;
  css.walkAtRules('media', media => {
    if (!media.params.includes(state)) return;
    media.walkRules(rule => {
      if (!rule.selectors.includes('.motion-title-glass .motion-letter')) return;
      const declarations = new Map(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]));
      if (declarations.get('background') === 'none' && ['inherit', 'CanvasText'].includes(declarations.get('color'))) readable = true;
    });
  });
  assert.ok(readable, `${state}: animated words retain a readable fallback`);
}
assert.equal(prop('.motion-letter', 'color'), 'inherit', 'Animated letters inherit their normal color');
assert.equal(prop('[data-editorial] .reveal', 'opacity'), '1', 'Legacy reveal classes never hide the new choreography');
console.log(`PASS: ${checks.length} WCAG palette checks (minimum ${Math.min(...checks.map(c => c.ratio)).toFixed(2)}:1); CSS variables, solid animated headings, navy reflection peak and readable preference/print fallbacks. Runtime contracts are checked separately.`);
