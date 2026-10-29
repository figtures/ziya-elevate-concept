/* Static CSS cascade checks: catches stacked gutters and legacy ID overrides.
   This does not replace browser layout inspection. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import { parse as parseSelector } from 'css-what';
import { parseHTML } from 'linkedom';
import { composeContent } from '../cms/compose.mjs';
import { mediaFrameKey, serializeMediaFrame } from '../cms/media-framing.mjs';

const root = path.resolve(import.meta.dirname, '..');
const website = path.join(root, 'website');
const styles = new Map();
function pages(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const file = path.join(dir, item.name);
    return item.isDirectory() ? pages(file) : item.name === 'index.html' ? [file] : [];
  });
}
function specificity(selector) {
  const score = tokens => tokens.reduce((sum, token) => {
    if (token.type === 'attribute') return sum + (token.name === 'id' ? 10000 : 100);
    if (token.type === 'tag') return sum + 1;
    if (token.type !== 'pseudo') return sum;
    if (token.name === 'where') return sum;
    if (Array.isArray(token.data)) return sum + Math.max(0, ...token.data.map(score));
    return sum + 100;
  }, 0);
  return Math.max(...parseSelector(selector).map(score));
}
function mediaMatches(query, width) {
  if (/prefers-reduced-motion\s*:\s*reduce|\bprint\b/.test(query)) return false;
  for (const [, type, value] of query.matchAll(/\((min|max)-width\s*:\s*([\d.]+)px\)/g)) {
    if (type === 'min' && width < +value || type === 'max' && width > +value) return false;
  }
  return true;
}
function rulesFor(document, width) {
  const rules = [];
  // Framing rules are injected inline by the shared CMS composer, after the
  // stylesheet bundle. Include both in document order to exercise their cascade.
  for (const node of document.querySelectorAll('link[rel="stylesheet"],style')) {
    let sheet;
    if (node.localName === 'style') sheet = postcss.parse(node.textContent);
    else {
      const href = node.getAttribute('href').split('?')[0];
      if (!href.startsWith('/assets/')) continue;
      if (!styles.has(href)) styles.set(href, postcss.parse(readFileSync(path.join(website, href), 'utf8')));
      sheet = styles.get(href);
    }
    sheet.walkRules(rule => {
      for (let parent = rule.parent; parent; parent = parent.parent) {
        if (parent.type === 'atrule' && parent.name === 'media' && !mediaMatches(parent.params, width)) return;
        if (parent.type === 'atrule' && /keyframes/.test(parent.name)) return;
      }
      for (const selector of rule.selectors) {
        if (selector.includes('::') || /:(before|after)(?![-\w])/.test(selector)) continue;
        try { rules.push({ selector, specificity: specificity(selector), declarations: rule.nodes.filter(n => n.type === 'decl') }); }
        catch { /* Vendor pseudo-elements do not affect normal section boxes. */ }
      }
    });
  }
  return rules;
}
function properties(element, rules) {
  const result = new Map();
  let order = 0;
  function set(prop, value, important, spec) {
    const priority = [important ? 1 : 0, spec, order++];
    const old = result.get(prop);
    if (!old || priority[0] > old.priority[0] || priority[0] === old.priority[0] &&
        (priority[1] > old.priority[1] || priority[1] === old.priority[1] && priority[2] > old.priority[2])) {
      result.set(prop, { value, priority });
    }
  }
  function apply(decl, spec) {
    const values = postcss.list.space(decl.value);
    if (/^(padding|margin)$/.test(decl.prop)) {
      set(decl.prop + '-top', values[0], decl.important, spec);
      set(decl.prop + '-bottom', values[2] || values[0], decl.important, spec);
    } else if (/^(padding|margin)-block$/.test(decl.prop)) {
      const prop = decl.prop.replace('-block', '');
      set(prop + '-top', values[0], decl.important, spec);
      set(prop + '-bottom', values[1] || values[0], decl.important, spec);
    } else set(decl.prop, decl.value, decl.important, spec);
  }
  for (const rule of rules) {
    let matches = false;
    try { matches = element.matches(rule.selector); } catch { /* Unsupported state selector cannot affect this static box. */ }
    if (matches) rule.declarations.forEach(decl => apply(decl, rule.specificity));
  }
  postcss.parse(element.getAttribute('style') || '').walkDecls(decl => apply(decl, 1000000));
  return result;
}
function length(value = '0', variables, width) {
  value = value.replace(/var\((--[\w-]+)\)/g, (_, key) => {
    assert(variables.has(key), 'Missing spacing token: ' + key);
    return variables.get(key).value;
  }).trim();
  if (value.startsWith('clamp(')) {
    const [min, preferred, max] = postcss.list.comma(value.slice(6, -1)).map(v => length(v, variables, width));
    return Math.max(min, Math.min(preferred, max));
  }
  assert(/^-?[\d.]+(px|rem|vw)?$/.test(value), 'Unsupported spacing value: ' + value);
  return parseFloat(value) * (value.endsWith('rem') ? 16 : value.endsWith('vw') ? width / 100 : 1);
}

let authoredChecked = 0, composedChecked = 0, talkImagesChecked = 0;
const measures = [];
function checkLayout(document, label, { composed = false } = {}) {
  const sections = [...document.querySelectorAll('body > section,body > main#main-content > section')];
  assert(sections.length, 'Layout check must inspect real sections: ' + label);
  if (composed) {
    assert.equal(document.querySelectorAll('body > section').length, 0, 'CMS sections belong to the main landmark: ' + label);
    assert(document.querySelector('body > main#main-content > section'), 'CMS main landmark is present: ' + label);
  }
  for (const width of [375, 768, 1440, 1920]) {
    const rules = rulesFor(document, width);
    const tokens = properties(document.body, rules);
    const px = (element, prop) => length(properties(element, rules).get(prop)?.value, tokens, width);
    const proof = document.querySelector('.speaker-stage-proof');
    if (proof) {
      const join = length('var(--section-join-space)', tokens, width);
      assert.equal(px(proof, 'padding-top'), join, `Speaker strip keeps its compact top gutter: ${label} at ${width}px`);
      assert.equal(px(proof, 'padding-bottom'), join, `Speaker strip keeps its compact bottom gutter: ${label} at ${width}px`);
    }
    for (const section of sections.filter(el => !el.matches('.hero,.page-hero'))) {
      assert(px(section, 'padding-top') <= 80, `Excess top gutter: ${label} at ${width}px`);
      assert(px(section, 'padding-bottom') <= 80, `Excess bottom gutter: ${label} at ${width}px`);
    }
    for (const [first, second] of [['.ed-intro', '.ed-topics'], ['.ed-catalog', '.ed-training-process'], ['.ed-keynote-film', '.ed-talk-topics']]) {
      const a = document.querySelector(first), b = document.querySelector(second);
      if (!a || !b) continue;
      const gap = px(a, 'padding-bottom') + px(b, 'padding-top');
      assert(gap <= 80, `Stacked same-paper gutter: ${label} at ${width}px: ${gap}px`);
      if (first === '.ed-intro') measures.push(`${label}, ${width}px viewport: home join ${gap}px`);
    }
    const books = [...document.querySelectorAll('.book-editorial-list>article')];
    if (books.length) {
      assert.equal(px(books[0], 'padding-top'), 0, 'First book adds a second top gutter');
      assert.equal(px(books.at(-1), 'padding-bottom'), 0, 'Last book adds a second bottom gutter');
    }
    for (const chapter of document.querySelectorAll('.reading-chapter')) {
      const h2 = chapter.querySelector('h2');
      const gap = px(chapter, 'margin-top') + px(chapter, 'padding-top') + (h2 ? px(h2, 'margin-top') : 0);
      assert(gap <= 40, `Stacked reading-chapter gutter: ${label} at ${width}px: ${gap}px`);
    }
    for (const image of document.querySelectorAll('.talk-archive img')) {
      const effective = properties(image, rules);
      const context = `${label}, ${width}px, ${image.getAttribute('src')}`;
      if (image.hasAttribute('data-media-framed')) {
        const wrapper = image.closest('[data-media-frame-wrapper]');
        assert(wrapper, 'Framed talk media keeps its ratio wrapper: ' + context);
        assert.equal(effective.get('height')?.value, '100%', 'Framed media fills its wrapper: ' + context);
        assert.equal(effective.get('aspect-ratio')?.value, 'auto', 'Wrapper owns the framed ratio: ' + context);
        assert.match(properties(wrapper, rules).get('aspect-ratio')?.value || '', /--media-frame-(?:mobile-)?ratio/, 'Wrapper retains the CMS crop ratio: ' + context);
      } else {
        // Intrinsic height attributes reserve space but must not force a 1080px
        // poster beside a 450px one once the card has a responsive CSS width.
        if (composed) {
          assert(Number(image.getAttribute('width')) > 0, 'Composed image reserves intrinsic width: ' + context);
          assert(Number(image.getAttribute('height')) > 0, 'Composed image reserves intrinsic height: ' + context);
        }
        assert.equal(effective.get('height')?.value, 'auto', 'Talk image height follows its CSS ratio: ' + context);
        assert.match(effective.get('aspect-ratio')?.value || '', /^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/, 'Talk image has an explicit card ratio: ' + context);
        assert.equal(effective.get('display')?.value, 'block', 'Talk image avoids an inline baseline gap: ' + context);
      }
      talkImagesChecked++;
    }
  }
}
for (const file of pages(website)) {
  const { document } = parseHTML(readFileSync(file, 'utf8'));
  if (!document.querySelector('header')) continue;
  checkLayout(document, path.relative(website, file));
  authoredChecked++;
}

// Checking only source HTML misses selectors broken by the production <main>
// wrapper. Use the same composer and bundled styles as visitors and previews.
const json = name => JSON.parse(readFileSync(path.join(root, 'cms', name + '.json'), 'utf8'));
const seed = json('seed'), catalog = json('catalog'), templates = json('templates');
const shared = seed.find(page => page.kind === 'global');
function compose(payload) {
  const document = parseHTML(templates[payload.template]).document;
  return composeContent(document, payload, catalog[payload.template], {
    sharedDocument: parseHTML(templates[shared.template]).document,
    sharedPayload: shared,
    sharedDefinition: catalog[shared.template],
  });
}
for (const payload of seed.filter(page => page.kind !== 'global')) {
  const document = compose(payload);
  if (!document.querySelector('header')) continue;
  checkLayout(document, `CMS ${payload.route}`, { composed: true });
  composedChecked++;
}
for (const route of ['/konusmaci/', '/en/speaker/']) {
  const payload = structuredClone(seed.find(page => page.route === route));
  assert(payload, 'Speaker regression route exists: ' + route);
  const original = parseHTML(templates[payload.template]).document;
  const images = [...original.querySelectorAll('.talk-archive img')];
  assert.equal(images.length, 4, 'All four public talks remain present: ' + route);
  for (const image of images) {
    const field = catalog[payload.template].fields.find(field => field.node === image.getAttribute('data-cms-node') && field.target === '@src');
    assert(field, 'Every talk image remains CMS-editable: ' + route);
    payload.values[mediaFrameKey(field.id)] = serializeMediaFrame({
      v: 1, src: payload.values[field.id],
      desktop: { x: 30, y: 45, zoom: 1.2 }, mobile: { x: 65, y: 40, zoom: 1.4 },
    });
  }
  const document = compose(payload);
  assert.equal(document.querySelectorAll('.talk-archive [data-media-framed]').length, 4, 'Composed crops survive all four talk bindings: ' + route);
  checkLayout(document, `CMS framed ${route}`, { composed: true });
}
for (const file of ['editorial.css', 'content-depth.css']) {
  assert.equal(readFileSync(path.join(website, 'assets', file), 'utf8'), readFileSync(path.join(root, 'public/assets', file), 'utf8'));
}
console.log(`PASS: ${authoredChecked} authored and ${composedChecked} composed CMS pages, 4 viewports; section/book/reading spacing, ${talkImagesChecked} talk image checks including TR/EN CMS crops; CSS copies match.`);
console.log(measures.join('\n'));
