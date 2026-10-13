/** Responsive delivery is opt-in by exact local asset path, never by basename. */
import images from './responsive-images.json' with { type: 'json' };

const known = new Map();
for (const [original, image] of Object.entries(images)) {
  known.set(original, image);
  for (const variant of image.variants) known.set(variant.src, image);
}

function sizesFor(image) {
  // Account for the existing object-fit crops and 1.055 photo motion overscan.
  // High-DPI displays can still select the full original resolution.
  if (image.closest('.film-feature,.keynote-film'))
    return '(max-width: 760px) calc(141vw - 62px), (max-width: 1100px) calc(92vw - 105px), (max-width: 1328px) calc(92vw - 148px), 1070px';
  if (image.closest('.sales-opener'))
    return '(max-width: 760px) calc(141vw - 62px), (max-width: 1100px) calc(95vw - 109px), (max-width: 1328px) calc(95vw - 167px), 1100px';
  if (image.closest('.talk-archive'))
    return '(max-width: 760px) calc(100vw - 44px), (max-width: 1100px) calc(38vw - 45px), (max-width: 1328px) calc(38vw - 57px), 455px';
  return '(max-width: 760px) calc(106vw - 47px), (max-width: 1100px) calc(106vw - 68px), (max-width: 1328px) calc(106vw - 102px), 1310px';
}

export function applyResponsiveMedia(doc) {
  for (const element of doc.querySelectorAll('img[src]')) {
    const image = known.get(element.getAttribute('src'));
    if (!image || image.use !== 'image') continue;
    // Authored art direction is authoritative. CMS src replacement removes
    // obsolete picture sources in setField before this delivery pass runs.
    if (element.parentElement?.tagName === 'PICTURE' && element.parentElement.querySelector('source')) continue;
    element.setAttribute('src', image.fallback);
    element.setAttribute('srcset', image.variants.map(v => `${v.src} ${v.width}w`).join(', '));
    element.setAttribute('sizes', sizesFor(element));
    element.setAttribute('width', String(image.width));
    element.setAttribute('height', String(image.height));
    element.setAttribute('decoding', 'async');
  }
  for (const element of doc.querySelectorAll('video[poster]')) {
    const image = known.get(element.getAttribute('poster'));
    if (image?.use === 'poster') element.setAttribute('poster', image.fallback);
  }
}
