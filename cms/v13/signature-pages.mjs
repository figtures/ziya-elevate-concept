/** Authoritative v13 revisions 18–26. Existing CMS node IDs remain attached
 * to their content when a block changes position in the reading order. */
const KGKY = '/kursun-gecirmez-kafa-yapisi/';
const ENGINEERING = '/basari-muhendisligi/';
const DESCRIPTION = 'Kurşun Geçirmez Kafa Yapısı™: Sabotajcı, HENÜZ–RAĞMEN–MÜMKÜN, 6 Ayna, 90 saniye, HAYIR ve 66 günlük uygulama yaklaşımını keşfedin.';

function node(document, id) {
  const result = document.querySelector(`[data-cms-node="${id}"]`);
  if (!result) throw new Error(`v13 signature page: missing CMS node ${id}`);
  return result;
}

function create(document, tag, id, className, text) {
  const existing = document.querySelector(`[data-cms-node="${id}"]`);
  if (existing) return existing;
  const element = document.createElement(tag);
  element.setAttribute('data-cms-node', id);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function addAsset(document, tag, path) {
  const attr = tag === 'link' ? 'href' : 'src';
  if (document.querySelector(`${tag}[${attr}^="${path}"]`)) return;
  const element = document.createElement(tag);
  element.setAttribute(attr, path);
  if (tag === 'link') element.setAttribute('rel', 'stylesheet');
  else element.setAttribute('defer', '');
  (tag === 'link' ? document.head : document.body).append(element);
}

function relocateAnswer(document, { closing, details, answer, id, faq }) {
  const host = create(document, 'div', id, 'depth-stack v13-signature-depth');
  const direct = node(document, answer);
  direct.classList.add('v13-direct-answer');
  const label = direct.querySelector('span');
  if (label) label.classList.add('eyebrow', 'v13-answer-label');
  host.append(direct, node(document, details));
  if (faq) host.append(node(document, faq));
  node(document, closing).append(host);
}

function reviseMindset(document) {
  const replacements = {
    'fc3787a9-90': 'Kökü derin, gövdesi esnek, fırtınada eğilen ama kırılmayan bir kafa yapısı.',
    'fc3787a9-106': 'Yıllardır ev sahibi sandığın o ses, uzun süredir oturan bir misafir. Kafanın içindeki eski sesi ev sahibi sanma. O sadece uzun kalmış bir misafir. Ve misafir, ne kadar uzun kalırsa kalsın, ev sahibi olamaz. Ev sensin. Anahtar sende. Kapı açık.',
    'fc3787a9-130': 'Bitmedin. Sadece tamamlanmadın.',
    'fc3787a9-134': 'Korkunun geçmesini bekleme. Korkuyla birlikte yürü.',
    'fc3787a9-138': 'O kapı açık. Ve sen geçebilirsin.',
    'fc3787a9-144': 'KENDİNE BAKMADAN KENDİNİ DEĞİŞTİREMEZSİN.',
    'fc3787a9-156': 'Duygunun kimyasal dalgası yaklaşık 90 saniyede söner; sonrası senin seçimin.',
  };
  for (const [id, text] of Object.entries(replacements)) node(document, id).textContent = text;

  const hrmWrap = node(document, 'fc3787a9-121');
  hrmWrap.append(create(document, 'p', 'v13-kgky-hrm-bridge', 'v13-hrm-bridge',
    'HENÜZ ihtimali açık tutar. RAĞMEN eylemi başlatır. MÜMKÜN gidecek bir yön olduğunu hatırlatır.'));
  hrmWrap.append(create(document, 'p', 'v13-kgky-hrm-statement', 'v13-hrm-statement',
    'HENÜZ olmadığım kişiye, korkuma RAĞMEN yürüyebilirim; çünkü ben MÜMKÜN’üm.'));

  const mirrors = create(document, 'ol', 'v13-kgky-mirrors', 'v13-mirrors');
  ['ÖZ DEĞER', 'ÖZ YETERLİLİK', 'ÖZ GÜVEN', 'ÖZ SAYGI', 'ÖZ ŞEFKAT', 'ÖZ SEVGİ'].forEach((name, index) => {
    const item = create(document, 'li', `v13-kgky-mirror-${index + 1}`, '', `${String(index + 1).padStart(2, '0')} · ${name}`);
    mirrors.append(item);
  });
  node(document, 'fc3787a9-144').after(mirrors);
  node(document, 'fc3787a9-156').after(create(document, 'p', 'v13-kgky-pause-line', 'v13-pause-line', 'Dur. Gör. Sonra seç.'));

  // The test remains the primary action. The retained explanatory text and FAQ
  // now follow it at the end of the page, without adding a competing section.
  relocateAnswer(document, {
    closing: 'fc3787a9-248', details: 'fc3787a9-107', answer: 'fc3787a9-113',
    id: 'v13-kgky-depth', faq: 'fc3787a9-178',
  });
  document.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]')
    .forEach(meta => meta.setAttribute('content', DESCRIPTION));
  document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
    try {
      const schema = JSON.parse(script.textContent);
      const update = value => {
        if (!value || typeof value !== 'object') return;
        if (String(value.url || value['@id'] || '').includes(KGKY.slice(0, -1)) && value.description) value.description = DESCRIPTION;
        Object.values(value).forEach(child => { if (Array.isArray(child)) child.forEach(update); else if (child && typeof child === 'object') update(child); });
      };
      update(schema);
      script.textContent = JSON.stringify(schema).replace(/</g, '\\u003c');
    } catch { /* Leave any unrelated, non-JSON payload untouched. */ }
  });
}

function reviseEngineering(document) {
  const principles = node(document, 'eea7dbba-171');
  principles.classList.add('v13-book-principles');
  const oldHeading = node(document, 'eea7dbba-172');
  if (oldHeading.localName === 'h2') oldHeading.textContent = 'KİTAPTAKİ İLKELER';
  else {
    const heading = document.createElement('h2');
    for (const attr of oldHeading.attributes) heading.setAttribute(attr.name, attr.value);
    heading.textContent = 'KİTAPTAKİ İLKELER';
    oldHeading.replaceWith(heading);
  }
  node(document, 'eea7dbba-182').textContent = 'Sitem-Sistem';
  node(document, 'eea7dbba-196').textContent = 'Kadar-Keder';
  node(document, 'eea7dbba-100').append(principles);

  const section = node(document, 'eea7dbba-124');
  section.setAttribute('data-v13-blueprint', '');
  // This component owns its scroll timeline; do not also enroll it in the
  // editorial chapter/row choreography or the legacy .bp-draw reveal.
  section.removeAttribute('data-motion-section');
  section.querySelectorAll('[data-motion-item]').forEach(element => element.removeAttribute('data-motion-item'));
  node(document, 'eea7dbba-127').classList.replace('ed-heading', 'v13-blueprint-heading');
  node(document, 'eea7dbba-129').textContent = 'EĞİTİM SALONUNDAKİ UYGULAMA MODELİ';
  const steps = node(document, 'eea7dbba-131');
  // Keep the authored CMS repeat-group selector so existing per-stage edits,
  // visibility and ordering survive migration. The section is already excluded
  // from general motion by removing data-motion-section above.
  steps.classList.add('editorial-rows', 'v13-blueprint-steps');
  steps.setAttribute('role', 'list');
  steps.setAttribute('aria-label', 'Eğitim salonundaki beş aşamalı uygulama modeli');
  [...steps.children].forEach((step, index) => {
    step.setAttribute('data-v13-blueprint-step', String(index));
    step.setAttribute('role', 'listitem');
    step.querySelector('h3').textContent = ['KEŞİF', 'TASARIM', 'İNŞA', 'TEST', 'BAKIM'][index];
  });
  const rail = create(document, 'div', 'v13-blueprint-rail', 'v13-blueprint-rail');
  rail.setAttribute('aria-hidden', 'true');
  node(document, 'eea7dbba-127').append(rail);
  // Existing book cover, all five explanatory accordions and both CTAs survive.
  relocateAnswer(document, {
    closing: 'eea7dbba-209', details: 'eea7dbba-108', answer: 'eea7dbba-114',
    id: 'v13-engineering-depth',
  });
  addAsset(document, 'script', '/assets/v13-blueprint.js');
}

export function reviseSignaturePages(document, route) {
  if (![KGKY, ENGINEERING].includes(route)) return;
  document.body.setAttribute('data-v13-signature', route === KGKY ? 'kgky' : 'engineering');
  if (route === KGKY) reviseMindset(document);
  else reviseEngineering(document);
  addAsset(document, 'link', '/assets/v13-signature-pages.css');
}
