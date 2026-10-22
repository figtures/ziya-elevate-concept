/** Deterministic autoplay interaction checks; no browser rendering or live CMS access. */
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = await mkdtemp(join(tmpdir(), 'ziya-testimonial-autoplay-'));
const outfile = join(directory, 'check.cjs');
const source = `
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';

const reducedMotion = process.env.TEST_REDUCED_MOTION === '1';
const nativeTimeout = globalThis.setTimeout.bind(globalThis);
const nativeClearTimeout = globalThis.clearTimeout.bind(globalThis);
const nativeInterval = globalThis.setInterval.bind(globalThis);
const nativeClearInterval = globalThis.clearInterval.bind(globalThis);
const { window, document } = parseHTML('<!doctype html><html><head></head><body><div id="app"></div><button id="outside">Outside</button></body></html>');
Object.assign(globalThis, { window, document, HTMLElement: window.HTMLElement, Element: window.Element, SVGElement: window.SVGElement, IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'local-autoplay-check' }, configurable: true });
window.matchMedia = () => ({ matches: reducedMotion, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
globalThis.requestAnimationFrame = window.requestAnimationFrame = callback => nativeTimeout(() => callback(performance.now()), 1);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame = nativeClearTimeout;
globalThis.getComputedStyle = window.getComputedStyle = element => ({ getPropertyValue: name => element.style.getPropertyValue(name), transform: element.style.transform || 'none' });
Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 360; } });
Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return 340; } });
globalThis.ResizeObserver = class { observe() {} disconnect() {} };

// Keep Motion's short scheduling real; control user-visible autoplay delays only.
let now = 0;
let nextTimerId = -1;
const timers = new Map();
const schedule = (callback, delay, repeating, args) => {
  const id = nextTimerId--;
  timers.set(id, { callback, delay, repeating, args, due: now + delay });
  return id;
};
globalThis.setTimeout = window.setTimeout = (callback, delay = 0, ...args) => delay >= 1000 ? schedule(callback, delay, false, args) : nativeTimeout(callback, delay, ...args);
globalThis.setInterval = window.setInterval = (callback, delay = 0, ...args) => delay >= 1000 ? schedule(callback, delay, true, args) : nativeInterval(callback, delay, ...args);
globalThis.clearTimeout = window.clearTimeout = id => { if (!timers.delete(id)) nativeClearTimeout(id); };
globalThis.clearInterval = window.clearInterval = id => { if (!timers.delete(id)) nativeClearInterval(id); };

const intersections = new Set();
globalThis.IntersectionObserver = window.IntersectionObserver = class {
  constructor(callback) { this.callback = callback; this.nodes = new Set(); intersections.add(this); }
  observe(node) { this.nodes.add(node); }
  unobserve(node) { this.nodes.delete(node); }
  disconnect() { this.nodes.clear(); intersections.delete(this); }
};
let hidden = false;
Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => hidden ? 'hidden' : 'visible' });
const visibilityListeners = new Set();
const addEventListener = document.addEventListener.bind(document);
const removeEventListener = document.removeEventListener.bind(document);
document.addEventListener = (type, callback, options) => { if (type === 'visibilitychange') visibilityListeners.add(callback); addEventListener(type, callback, options); };
document.removeEventListener = (type, callback, options) => { if (type === 'visibilitychange') visibilityListeners.delete(callback); removeEventListener(type, callback, options); };

(async () => {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { StaggerTestimonials } = await import('./components/ui/stagger-testimonials.tsx');
  const root = createRoot(document.getElementById('app'));
  const items = [
    { id: 'a', name: 'Birinci Kişi', quote: 'Birinci öneri', draft: true },
    { id: 'b', name: 'İkinci Kişi', quote: 'İkinci öneri', draft: true },
    { id: 'c', name: 'Üçüncü Kişi', quote: 'Üçüncü öneri', draft: true },
  ];
  const render = next => React.act(async () => { root.render(React.createElement(StaggerTestimonials, { items: next })); });
  const carousel = () => document.querySelector('.stagger-testimonials');
  const name = () => document.querySelector('[data-active="true"] strong')?.textContent;
  const expectedNext = () => items[(items.findIndex(item => item.name === name()) + 1) % items.length].name;
  const event = (target, type, properties = {}) => React.act(async () => {
    const value = new window.Event(type, { bubbles: true, cancelable: true });
    Object.assign(value, properties);
    target.dispatchEvent(value);
  });
  const click = label => {
    const button = document.querySelector('button[aria-label="' + label + '"]');
    assert(button, 'Missing control: ' + label);
    return event(button, 'click');
  };
  const visible = value => React.act(async () => {
    for (const observer of intersections) observer.callback([...observer.nodes].map(target => ({ target, isIntersecting: value, intersectionRatio: value ? 1 : 0 })));
  });
  const visibility = value => React.act(async () => {
    hidden = value;
    document.dispatchEvent(new window.Event('visibilitychange'));
  });
  const advance = async milliseconds => {
    const until = now + milliseconds;
    let iterations = 0;
    while (true) {
      const next = [...timers.entries()].filter(([, timer]) => timer.due <= until).sort((a, b) => a[1].due - b[1].due)[0];
      if (!next) break;
      assert(++iterations < 100, 'Unexpected timer loop');
      const [id, timer] = next;
      now = timer.due;
      if (timer.repeating) timer.due += timer.delay;
      else timers.delete(id);
      await React.act(async () => { timer.callback(...timer.args); });
    }
    now = until;
  };
  const assertPaused = async label => {
    const before = name();
    assert.equal(timers.size, 0, label + ' clears the autoplay timer');
    assert.equal(carousel()?.dataset.autoplay, 'paused', label + ' exposes paused state');
    assert.equal(document.querySelector('.stagger-testimonials-counter')?.getAttribute('aria-live'), 'polite', label + ' allows manual announcements');
    await advance(6000);
    assert.equal(name(), before, label + ' prevents automatic advancement');
  };
  const assertResumed = async label => {
    const before = name();
    const next = expectedNext();
    assert.equal(timers.size, 1, label + ' installs exactly one autoplay timer');
    assert.equal(carousel()?.dataset.autoplay, 'running', label + ' exposes running state');
    assert.equal(document.querySelector('.stagger-testimonials-counter')?.getAttribute('aria-live'), 'off', label + ' avoids repeated automatic announcements');
    await advance(1999);
    assert.equal(name(), before, label + ' waits a full two seconds');
    await advance(1);
    assert.equal(name(), next, label + ' advances at two seconds');
  };

  await render(items);
  assert.equal(name(), 'Birinci Kişi');
  assert.equal(timers.size, 0, 'Autoplay waits until visibility is established');
  await visible(true);

  if (reducedMotion) {
    assert.equal(carousel().dataset.reducedMotion, 'true');
    await assertPaused('Reduced-motion preference');
    await click('Sonraki yorum');
    assert.equal(name(), 'İkinci Kişi', 'Reduced motion preserves manual navigation');
    console.log('PASS reduced motion disables autoplay and preserves manual navigation');
  } else {
    await assertResumed('Initial visibility');
    await advance(2000);
    assert.equal(name(), 'Üçüncü Kişi');
    await advance(2000);
    assert.equal(name(), 'Birinci Kişi', 'Automatic progression wraps');
    console.log('PASS automatic progression starts at 2000ms, repeats, and wraps');

    const outside = document.getElementById('outside');
    await event(carousel(), 'mouseover', { relatedTarget: outside });
    await assertPaused('Pointer hover');
    await event(carousel(), 'mouseout', { relatedTarget: outside });
    await assertResumed('Pointer exit');
    console.log('PASS hovering pauses autoplay and leaving restarts a full interval');

    const nextButton = document.querySelector('button[aria-label="Sonraki yorum"]');
    const previousButton = document.querySelector('button[aria-label="Önceki yorum"]');
    await event(nextButton, 'focusin', { relatedTarget: outside });
    await assertPaused('Keyboard focus');
    await event(nextButton, 'focusout', { relatedTarget: previousButton });
    await event(previousButton, 'focusin', { relatedTarget: nextButton });
    await assertPaused('Focus moving between carousel controls');
    await event(previousButton, 'focusout', { relatedTarget: outside });
    await assertResumed('Focus leaving the carousel');
    console.log('PASS focus pauses autoplay until focus leaves the entire carousel');

    await click('Otomatik geçişi duraklat');
    await assertPaused('Explicit pause');
    await visible(false);
    await visible(true);
    await assertPaused('Explicit pause after viewport re-entry');
    await click('Otomatik geçişi başlat');
    await assertResumed('Explicit resume');
    console.log('PASS pause/play control persists user choice across viewport changes');

    await visible(false);
    await assertPaused('Offscreen carousel');
    await visible(true);
    await assertResumed('Carousel returning onscreen');
    await visibility(true);
    await assertPaused('Hidden document');
    await visibility(false);
    await assertResumed('Visible document');
    console.log('PASS offscreen and hidden-document states pause and resume autoplay');

    await advance(1500);
    const manualNext = expectedNext();
    await click('Sonraki yorum');
    assert.equal(name(), manualNext);
    await assertResumed('Manual navigation');
    console.log('PASS manual navigation resets the two-second interval');

    await render([items[0]]);
    await assertPaused('Single-item collection');
    await render([]);
    assert.equal(carousel(), null);
    assert.equal(timers.size, 0, 'Empty collection has no autoplay timer');
    await render(items);
    await visible(true);
    await assertResumed('Refilled collection');
    console.log('PASS single, empty, and refilled collections manage autoplay safely');
  }

  await React.act(async () => root.unmount());
  assert.equal(timers.size, 0, 'Unmount clears autoplay timers');
  assert.equal(intersections.size, 0, 'Unmount disconnects intersection observers');
  assert.equal(visibilityListeners.size, 0, 'Unmount removes visibility listeners');
  console.log('PASS autoplay timer, intersection observer, and visibility listener cleanup');
  // Shared Motion scheduling is not a browser leak check; finish the isolated DOM process.
  setImmediate(() => process.exit(0));
})().catch(error => { console.error(error); process.exit(1); });
`;

try {
  await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'testimonial-autoplay-check.tsx', loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', target: 'node22', outfile, define: { 'process.env.NODE_ENV': '"development"' }, logLevel: 'silent' });
  for (const reducedMotion of ['0', '1']) {
    const result = spawnSync(process.execPath, [outfile], { encoding: 'utf8', timeout: 20000, env: { ...process.env, TEST_REDUCED_MOTION: reducedMotion } });
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    if (result.error) throw result.error;
    if (result.status !== 0) { process.exitCode = result.status || 1; break; }
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
