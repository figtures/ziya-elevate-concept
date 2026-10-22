/** Non-destructive, per-placement framing. Original files are never rewritten. */
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, keys) => object(value) && Object.keys(value).length === keys.length && Object.keys(value).every(key => keys.includes(key));
const sourceURL = value => {
  if (typeof value !== 'string' || !value || value.length > 2048 || /[\\\u0000-\u0020]/.test(value)) return '';
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? value : ''; } catch { return ''; }
};
const validView = value => exactKeys(value, ['x', 'y', 'zoom']) && [value.x, value.y, value.zoom].every(n => typeof n === 'number' && Number.isFinite(n))
  && value.x >= 0 && value.x <= 100 && value.y >= 0 && value.y <= 100 && value.zoom >= 1 && value.zoom <= 3;
const copyView = value => ({x: value.x, y: value.y, zoom: value.zoom});

export const mediaFrameKey = fieldId => `${fieldId}:frame`;
export const clipMediaFrameKey = id => `media-frame:clip:${id}`;

/** The optional source must match exactly: a replacement must not inherit an old crop. */
export function parseMediaFrame(value, src) {
  let frame = value;
  if (typeof value === 'string') {
    if (!value || value.length > 4096) return null;
    try { frame = JSON.parse(value); } catch { return null; }
  }
  if (!exactKeys(frame, ['v', 'src', 'desktop', 'mobile']) || frame.v !== 1 || !sourceURL(frame.src)
    || !validView(frame.desktop) || !validView(frame.mobile) || (src !== undefined && frame.src !== src)) return null;
  return {v: 1, src: frame.src, desktop: copyView(frame.desktop), mobile: copyView(frame.mobile)};
}

export function serializeMediaFrame(value) {
  const frame = parseMediaFrame(value);
  return frame ? JSON.stringify(frame) : '';
}

const spec = (label, dw, dh, mw = dw, mh = dh, fit = 'cover', responsive = false) => ({label, desktop: {width: dw, height: dh}, mobile: {width: mw, height: mh}, fit, responsive});

/** Representative 1440px desktop / 390px phone viewports; existing CSS owns layout. */
export function getMediaFrameSpec(element) {
  const within = selector => !!element?.closest?.(selector);
  if (within('.hero-vid,[data-tedx-hero],.cinematic-stage,.cinematic-page')) {
    const retained = within('.retained-hero'), reading = within('[data-reading]');
    const desktopHeight = retained ? reading ? 567 : 612 : within('.ed-page-hero') ? 756 : 900;
    const mobileHeight = retained ? 548.6 : within('.ed-page-hero') ? 700.52 : 844;
    return spec('Açılış videosu', 1440, desktopHeight, 390, mobileHeight, 'cover', true);
  }
  if (within('.wide-photo')) return spec('Geniş sahne görseli', 1232, 550, 346, 260, 'cover', true);
  if (within('.film-feature,.keynote-film')) return spec('Konuşma görseli', 800, 600);
  if (within('.portrait-story')) return spec('Portre görseli', 480, 600, 346, 389.25);
  if (within('.sales-opener')) return spec('Satış görseli', 605, 550, 346, 259.5);
  if (within('.mentor-spread,.bio-spread')) return spec('Biyografi görseli', 450, 600, 346, 389.25);
  if (within('.talk-archive.four-talks')) return spec('Konuşma kapağı', 640, 360);
  if (within('.talk-archive')) return spec('Konuşma kapağı', 640, 400, 346, 194.625);
  if (within('.book-cover,.home-book-cover')) return spec('Kitap görseli', 800, 600, 400, 300);
  if (within('.testimonial-author,.stagger-testimonial-author') || element?.classList?.contains('testimonial-avatar')) return spec('Kişi fotoğrafı', 400, 400);
  if (within('.reference-logo,.reference-logo-item')) return spec('Referans logosu', 320, 128, 320, 128, 'contain');
  const width = Number(element?.getAttribute?.('width')), height = Number(element?.getAttribute?.('height'));
  if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) return spec('Görsel alanı', width, height);
  return spec(element?.tagName === 'VIDEO' ? 'Video alanı' : 'Görsel alanı', 1600, 900);
}

const frameProperties = ['--media-frame-x', '--media-frame-y', '--media-frame-zoom', '--media-frame-mobile-x', '--media-frame-mobile-y', '--media-frame-mobile-zoom'];
const stylesheet = `
html body [data-media-framed="true"][data-media-framed]{object-fit:cover!important;object-position:var(--media-frame-x,50%) var(--media-frame-y,50%)!important;transform:scale(var(--media-frame-zoom,1))!important;transform-origin:var(--media-frame-x,50%) var(--media-frame-y,50%)!important;translate:none!important;rotate:none!important;scale:none!important}
html body [data-media-frame-clip],html body [data-media-frame-container]{overflow:hidden}
html body [data-media-frame-wrapper]{display:block;position:relative;aspect-ratio:var(--media-frame-ratio,16/9);border-radius:inherit}
html body [data-media-frame-wrapper]>[data-media-framed],html body .book-cover[data-media-frame-container]>[data-media-framed]{display:block;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;aspect-ratio:auto!important}
html body .book-cover[data-media-frame-container]{padding:0;min-height:0;aspect-ratio:4/3}
html body .home-book-cover[data-media-frame-container]{height:auto;aspect-ratio:4/3}
html body picture[data-media-frame-container]{display:block;transform:none!important;translate:none!important;scale:none!important;rotate:none!important}
html body .photo-crop>picture[data-media-frame-container]{width:100%;height:100%}
@media(max-width:760px){html body [data-media-framed="true"][data-media-framed]{object-position:var(--media-frame-mobile-x,50%) var(--media-frame-mobile-y,50%)!important;transform:scale(var(--media-frame-mobile-zoom,1))!important;transform-origin:var(--media-frame-mobile-x,50%) var(--media-frame-mobile-y,50%)!important}html body [data-media-frame-wrapper]{aspect-ratio:var(--media-frame-mobile-ratio,var(--media-frame-ratio,16/9))}}
`;

export function ensureMediaFrameStyles(doc) {
  if (!doc?.head || doc.querySelector('style[data-media-framing-styles]')) return;
  const style = doc.createElement('style'); style.setAttribute('data-media-framing-styles', ''); style.textContent = stylesheet; doc.head.appendChild(style);
}

/** A React island may provide its own correctly-sized clipping parent. */
function ensureClip(element) {
  const parent = element.parentElement;
  if (!parent || parent.hasAttribute('data-media-frame-clip')) return;
  if (parent.matches('picture,.photo-crop,.hero-vid,[data-tedx-hero],.home-book-cover,.book-cover,.video-stage,.cinematic-stage,.cinematic-page,[data-media-frame-wrapper]')) {
    parent.setAttribute('data-media-frame-container', '');
    return;
  }
  const doc = element.ownerDocument, frame = doc.createElement('div'), target = getMediaFrameSpec(element);
  frame.setAttribute('data-media-frame-wrapper', ''); frame.setAttribute('data-media-frame-clip', '');
  frame.style.setProperty('--media-frame-ratio', `${target.desktop.width}/${target.desktop.height}`);
  frame.style.setProperty('--media-frame-mobile-ratio', `${target.mobile.width}/${target.mobile.height}`);
  parent.insertBefore(frame, element); frame.appendChild(element);
}

export function clearMediaFrame(element) {
  if (!element) return;
  for (const name of ['data-media-frame', 'data-media-framed', 'data-media-frame-field']) element.removeAttribute(name);
  for (const property of frameProperties) element.style.removeProperty(property);
  const parent = element.parentElement;
  if (parent?.hasAttribute('data-media-frame-wrapper')) {parent.before(element); parent.remove();}
  else if (parent?.hasAttribute('data-media-frame-container') && !parent.querySelector('[data-media-framed]')) parent.removeAttribute('data-media-frame-container');
}

export function applyMediaFrame(element, value) {
  const frame = parseMediaFrame(value);
  if (!element || !['IMG', 'VIDEO'].includes(element.tagName) || !frame) return false;
  ensureClip(element);
  element.setAttribute('data-media-frame', serializeMediaFrame(frame)); element.setAttribute('data-media-framed', 'true');
  for (const [prefix, view] of [['', frame.desktop], ['mobile-', frame.mobile]]) {
    element.style.setProperty(`--media-frame-${prefix}x`, `${view.x}%`);
    element.style.setProperty(`--media-frame-${prefix}y`, `${view.y}%`);
    element.style.setProperty(`--media-frame-${prefix}zoom`, String(view.zoom));
  }
  ensureMediaFrameStyles(element.ownerDocument);
  return true;
}

const mediaFields = definition => (definition?.fields || []).filter(field => ['image', 'video'].includes(field.type) && ['@src', '@poster', '@data-src'].includes(field.target));
const find = (root, node) => root.getAttribute?.('data-cms-node') === node ? root : root.querySelector(`[data-cms-node="${String(node).replace(/[^a-zA-Z0-9-]/g, '')}"]`);
const fieldSource = (element, field) => element.getAttribute(field.target.slice(1)) || (field.target === '@src' ? element.getAttribute('data-src') : '') || '';

/** Runs after each values scope so section/item resets override inherited framing. */
export function applyFieldMediaFrames(root, definition, values = {}) {
  const byNode = new Map();
  for (const field of mediaFields(definition)) {if (!byNode.has(field.node)) byNode.set(field.node, []); byNode.get(field.node).push(field);}
  for (const [node, fields] of byNode) {
    const element = find(root, node); if (!element) continue;
    const explicit = fields.filter(field => Object.hasOwn(values || {}, mediaFrameKey(field.id)));
    if (explicit.length) {
      clearMediaFrame(element);
      for (const field of explicit) {
        const frame = parseMediaFrame(values[mediaFrameKey(field.id)], fieldSource(element, field));
        if (frame && applyMediaFrame(element, frame)) element.setAttribute('data-media-frame-field', field.id);
      }
    } else if (element.hasAttribute('data-media-frame')) {
      const owner = fields.find(field => field.id === element.getAttribute('data-media-frame-field'));
      if (!owner || !parseMediaFrame(element.getAttribute('data-media-frame'), fieldSource(element, owner))) clearMediaFrame(element);
    }
  }
}

export function applyPlaylistMediaFrames(doc, payload) {
  for (const clip of payload.experience?.playlist || []) {
    const videos = [...doc.querySelectorAll('video[data-hero-clip]')].filter(video => video.getAttribute('data-hero-clip') === clip.id);
    for (const video of videos) {
      // applyExperience clones the first old video; unrelated framing must not follow it.
      clearMediaFrame(video);
      const frame = parseMediaFrame(payload.values?.[clipMediaFrameKey(clip.id)], clip.src);
      if (frame) applyMediaFrame(video, frame);
    }
  }
}

/** Frame values share existing JSON documents; no schema change or asset mutation. */
export function validateDocumentMediaFrames(payload, definition) {
  const allowed = new Set(mediaFields(definition).map(field => mediaFrameKey(field.id)));
  const values = [payload.values, ...(payload.sections || []).flatMap(section => [section.values, ...(section.groups || []).flatMap(group => (group.items || []).map(item => item.values))])];
  const errors = [];
  for (const scope of values) for (const [key, value] of Object.entries(scope || {})) {
    if (!key.endsWith(':frame') && !key.startsWith('media-frame:')) continue;
    const recordKey = /^media-frame:(?:clip|avatar|reference):[a-zA-Z0-9_-]{1,100}$/.test(key);
    if ((!allowed.has(key) && !recordKey) || (recordKey && scope !== payload.values) || typeof value !== 'string' || (value !== '' && !parseMediaFrame(value))) errors.push('Medya kadrajı geçersiz. Konum 0–100, yakınlaştırma 1–3 arasında olmalı.');
  }
  return [...new Set(errors)];
}
