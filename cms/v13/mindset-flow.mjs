/** Complete the mindset narrative without changing the approved site theme.
 * Existing editorial nodes retain their identities; the short answer, test
 * dimensions, reading links, eight topics and FAQ remain available in order.
 */
export function reviseMindsetFlow(document) {
  if (document.querySelector('[data-v13-mindset-bridge]')) return document;
  const node = id => {
    const element = document.querySelector(`[data-cms-node="${id}"]`);
    if (!element) throw new Error(`Mindset flow: missing ${id}`);
    return element;
  };
  const make = (tag, id, className, text) => {
    const element = document.createElement(tag);
    element.setAttribute('data-cms-node', `5f3f14fd-flow-${id}`);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  const plus = () => {
    const container = document.createElement('span');
    container.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="/assets/icons.svg#plus"></use></svg>';
    return container.firstElementChild;
  };
  const retag = (element, tag) => {
    const replacement = document.createElement(tag);
    for (const attribute of [...element.attributes]) replacement.setAttribute(attribute.name, attribute.value);
    replacement.append(...element.childNodes);
    element.replaceWith(replacement);
    return replacement;
  };
  const bridge = make('section', 'bridge', 'ed-section v13-mindset-bridge');
  bridge.setAttribute('data-v13-mindset-bridge', '');
  bridge.setAttribute('data-motion-section', '');
  const wrap = make('div', 'wrap', 'wrap');
  const layout = make('div', 'layout', 'v13-mindset-layout');
  const narrative = make('div', 'narrative', 'v13-mindset-narrative');
  const story = make('div', 'story', 'v13-mindset-story');
  story.append(make('p', 'story-label', 'eyebrow', '12 Ekim 2012 · Astana'));

  // The personal passage was inside the generic mindset explanation. Promote
  // it as lived evidence, while keeping the scientific explanation below CTA.
  const explanation = node('5f3f14fd-132');
  const firstText = explanation.firstChild;
  const marker = 'Rehberin kişisel sıfır noktası';
  const split = firstText.textContent.indexOf(marker);
  if (split < 0) throw new Error('Mindset flow: expected the reviewed Astana passage');
  const personal = make('p', 'story-copy', 'ed-description');
  personal.append(document.createTextNode(firstText.textContent.slice(split)));
  firstText.textContent = firstText.textContent.slice(0, split).trimEnd();
  const storyLink = node('5f3f14fd-133');
  const suffix = storyLink.nextSibling;
  personal.append(storyLink);
  if (suffix?.nodeType === 3) personal.append(suffix);
  story.append(personal);
  narrative.append(story);

  const approach = make('div', 'approach', 'v13-mindset-approach');
  const approachTitle = retag(node('5f3f14fd-134'), 'h2');
  approachTitle.id = 'mindset-approach-title';
  bridge.setAttribute('aria-labelledby', approachTitle.id);
  approach.append(approachTitle, node('5f3f14fd-135'));
  const words = make('div', 'words', 'editorial-rows v13-mindset-words');
  for (const [index, [title, copy]] of [
    ['HENÜZ.', 'Bitmedin. Sadece tamamlanmadın.'],
    ['RAĞMEN.', 'Korkunun geçmesini bekleme. Korkuyla birlikte yürü.'],
    ['MÜMKÜN.', 'O kapı açık. Ve sen geçebilirsin.'],
  ].entries()) {
    const row = make('div', `word-${index}`, 'editorial-row');
    row.append(make('h3', `word-title-${index}`, '', title), make('p', `word-copy-${index}`, '', copy));
    words.append(row);
  }
  approach.append(words);
  narrative.append(approach);
  const figure = make('figure', 'visual', 'v13-mindset-visual');
  const image = make('img', 'image');
  image.setAttribute('src', '/assets/kitap-kursun-studio-v1.webp');
  image.setAttribute('alt', 'Ziya Şakir Yılmaz — Kurşun Geçirmez Kafa Yapısı kitabı');
  image.setAttribute('width', '1448');
  image.setAttribute('height', '1086');
  image.setAttribute('loading', 'lazy');
  image.setAttribute('decoding', 'async');
  figure.append(image);
  layout.append(narrative, figure);
  wrap.append(layout);
  bridge.append(wrap);
  node('5f3f14fd-166').before(bridge);

  // Measurement detail is available on request, in the same disclosure pattern
  // already used by the answer, knowledge topics and FAQ. No source is removed.
  const dimensions = node('5f3f14fd-139');
  const dimensionsDetail = make('details', 'dimensions', 'content-detail v13-mindset-dimensions');
  const dimensionSummary = make('summary', 'dimensions-summary');
  const label = retag(node('5f3f14fd-141'), 'span');
  label.classList.remove('eyebrow');
  dimensionSummary.append(label, plus());
  dimensions.before(dimensionsDetail);
  dimensionsDetail.append(dimensionSummary, dimensions);
  dimensions.classList.add('depth-body');

  const reading = document.querySelector('.reading-selection');
  if (!reading) throw new Error('Mindset flow: expected reading selection');
  const readingDetail = make('details', 'reading', 'content-detail v13-mindset-reading');
  const readingSummary = make('summary', 'reading-summary');
  const readingLabels = make('span', 'reading-labels', 'v13-mindset-reading-labels');
  const heading = reading.querySelector('.ed-heading');
  for (const child of [...heading.children]) {
    const label = retag(child, 'span');
    if (!label.classList.contains('eyebrow')) label.classList.add('v13-reading-title');
    readingLabels.append(label);
  }
  readingSummary.append(readingLabels, plus());
  reading.before(readingDetail);
  readingDetail.append(readingSummary, reading);
  reading.classList.add('depth-body');

  if (!document.head.querySelector('link[href="/assets/v13-mindset-flow.css"]')) {
    const css = document.createElement('link');
    css.setAttribute('rel', 'stylesheet');
    css.setAttribute('href', '/assets/v13-mindset-flow.css');
    document.head.append(css);
  }
  return document;
}
