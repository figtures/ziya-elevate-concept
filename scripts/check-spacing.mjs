/* Static CSS cascade checks: catches stacked gutters and legacy ID overrides.
   This does not replace browser layout inspection. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import { parse as parseSelector } from 'css-what';
import { parseHTML } from 'linkedom';

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
  for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
    const href = link.getAttribute('href').split('?')[0];
    if (!href.startsWith('/assets/')) continue;
    if (!styles.has(href)) styles.set(href, postcss.parse(readFileSync(path.join(website, href), 'utf8')));
    styles.get(href).walkRules(rule => {
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

let checked = 0;
const measures = [];
for (const file of pages(website)) {
  const { document } = parseHTML(readFileSync(file, 'utf8'));
  if (!document.querySelector('header')) continue;
  const sections = [...document.body.children].filter(el => el.localName === 'section');
  for (const width of [375, 768, 1440, 1920]) {
    const rules = rulesFor(document, width);
    const tokens = properties(document.body, rules);
    const px = (element, prop) => length(properties(element, rules).get(prop)?.value, tokens, width);
    for (const section of sections.filter(el => !el.matches('.hero,.page-hero'))) {
      assert(px(section, 'padding-top') <= 80, `Excess top gutter: ${file} at ${width}px`);
      assert(px(section, 'padding-bottom') <= 80, `Excess bottom gutter: ${file} at ${width}px`);
    }
    for (const [first, second] of [['.ed-intro', '.ed-topics'], ['.ed-catalog', '.ed-training-process'], ['.ed-keynote-film', '.ed-talk-topics']]) {
      const a = document.querySelector(first), b = document.querySelector(second);
      if (!a || !b) continue;
      const gap = px(a, 'padding-bottom') + px(b, 'padding-top');
      assert(gap <= 80, `Stacked same-paper gutter: ${file} at ${width}px: ${gap}px`);
      if (first === '.ed-intro') measures.push(`${width}px viewport: home join ${gap}px`);
    }
    const books = [...document.querySelectorAll('.book-editorial-list>article')];
    if (books.length) {
      assert.equal(px(books[0], 'padding-top'), 0, 'First book adds a second top gutter');
      assert.equal(px(books.at(-1), 'padding-bottom'), 0, 'Last book adds a second bottom gutter');
    }
    for (const chapter of document.querySelectorAll('.reading-chapter')) {
      const h2 = chapter.querySelector('h2');
      const gap = px(chapter, 'margin-top') + px(chapter, 'padding-top') + (h2 ? px(h2, 'margin-top') : 0);
      assert(gap <= 40, `Stacked reading-chapter gutter: ${file} at ${width}px: ${gap}px`);
    }
  }
  checked++;
}
for (const file of ['editorial.css', 'content-depth.css']) {
  assert.equal(readFileSync(path.join(website, 'assets', file), 'utf8'), readFileSync(path.join(root, 'public/assets', file), 'utf8'));
}
console.log(`PASS: ${checked} content templates, 4 viewports; section, book and reading spacing budgets; CSS copies match.`);
console.log(measures.join('\n'));
