/**
 * V13 brief, items 27–28 and 30–35.
 * Mutates only the requested content, retaining existing CMS bindings. Academic
 * claims and a sound showreel remain unpublished until their source is supplied.
 */

const EXPERIENCE = '16 yıl uluslararası kurumsal hayat, son 8 yılı Bayer’de Country Manager. 84 ülkede iş deneyimi, 90’dan fazla ülkeye ihracat. 14 yıllık girişimcilik yolculuğunda 70.000 kişiye ulaşan bir ekip. 600.000’den fazla insana eğitim ve konuşma, 5 TEDx ve dört kitap.';
const ENTREPRENEURSHIP = '14 yıllık girişimcilik yolculuğunda 70.000 kişiye ulaşan bir ekip.';
const MISSION = 'Pusulam tek cümle: bir milyon insanın kalbine dokunmak.';
const OLD_MISSION = 'Hedefim, bir milyon insanın hayatında olumlu ve kalıcı bir iz bırakmak.';
const CAPACITY = 'Yılda sınırlı sayıda girişimci ve yöneticiyle çalışıyorum. Uygunluk ilk görüşmede iki taraflı kararlaştırılır.';
const CADENCE = 'Çalışma süresi ve görüşme ritmi, ilk görüşmede hedefe göre birlikte belirlenir.';
const DATED_METRICS = 'DİJİTAL ETKİ · TARİHLİ VERİLER';

const node = (document, id) => document.querySelector(`[data-cms-node="${id}"]`);

function setText(document, id, text) {
  const element = node(document, id);
  if (element) element.textContent = text;
  return element;
}

// Values come from the existing catalog and its linked program pages. In
// particular, no unconfirmed group sizes or training durations are supplied.
const PROGRAM_FACTS = {
  satis: [
    ['KİMİN İÇİN:', 'Satış ekipleri ve yöneticileri.'],
    ['HANGİ PROBLEM:', 'İhtiyaç analizi, itiraz karşılama, kapanış ve takip.'],
    ['FORMAT:', 'Vaka temelli, rol pratikli eğitim.'],
    ['SÜRE:', 'Tam gün veya modüler.'],
    ['ÇIKTI:', 'Ekibin sektörüne uyarlanmış itiraz kütüphanesi ve haftalık satış ritmi.'],
    ['ÖN ÇALIŞMA:', 'Ekip tanı anketi ve yönetici görüşmesi.'],
    ['SONRASI:', '30 günlük uygulama planı ve ölçüm.'],
  ],
  liderlik: [
    ['KİMİN İÇİN:', 'Yöneticiler ve yönetici adayları.'],
    ['HANGİ PROBLEM:', 'Delegasyon, geri bildirim, zor konuşmalar ve kriz liderliği.'],
    ['FORMAT:', 'Yeni yöneticiden üst kademeye kademeli program; karar anlarının provası.'],
    ['ÇIKTI:', 'Delegasyon ve geri bildirim için ekip standardı; 90 günlük uygulama planı.'],
    ['ÖN ÇALIŞMA:', 'Ekibe kısa bir güven anketi.'],
    ['SONRASI:', '90 günlük uygulama ve takip döngüsü.'],
  ],
  kafa: [
    ['KİMİN İÇİN:', 'Baskı ve değişimle çalışan ekipler.'],
    ['HANGİ PROBLEM:', 'Reddedilme yönetimi, baskı altında performans, belirsizlik toleransı ve ekip dayanıklılığı.'],
    ['FORMAT:', 'Ekibin öz değerlendirme profiline göre şekillenen atölye.'],
    ['ÇIKTI:', 'Ekip için ortak dil ve yönetici için toparlanma ritmi.'],
    ['ÖN ÇALIŞMA:', 'Tüm ekip Kurşun Geçirmez Kafa Yapısı Testi’ni çözer.'],
    ['SONRASI:', '30 ile 90 günlük takip ve yöneticiye ritim şablonu.'],
  ],
};

function reviseTraining(document) {
  if (!document.querySelector('link[data-v13-program-facts]')) {
    const stylesheet = document.createElement('link');
    stylesheet.setAttribute('rel', 'stylesheet');
    stylesheet.setAttribute('href', '/assets/v13-program-facts.css');
    stylesheet.setAttribute('data-v13-program-facts', '');
    document.head.append(stylesheet);
  }
  for (const [id, facts] of Object.entries(PROGRAM_FACTS)) {
    const article = document.querySelector(`.program-catalog > article#${id}`);
    if (!article || article.querySelector('.v13-program-facts')) continue;
    const content = article.lastElementChild;
    const disclosure = content.querySelector('details.content-detail');
    const depth = disclosure?.querySelector('.depth-body');
    const summary = Array.from(content.children).find((element) => element.tagName === 'P');
    // Retain the original editable description in its existing disclosure.
    if (summary && depth) depth.prepend(summary);
    const list = document.createElement('dl');
    list.className = 'v13-program-facts';
    list.setAttribute('aria-label', `${article.querySelector('h3')?.textContent || 'Program'} bilgileri`);
    for (const [label, value] of facts) {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const definition = document.createElement('dd');
      term.textContent = label;
      definition.textContent = value;
      row.append(term, definition);
      list.append(row);
    }
    content.prepend(list);
  }
}

function reviseMentorship(document) {
  const occurrences = [...document.querySelectorAll('p')].filter((element) => element.textContent.trim() === CAPACITY);
  const first = occurrences.shift();
  for (const duplicate of occurrences) duplicate.remove();
  if (!first) return;
  let next = first.nextElementSibling;
  if (!next || next.tagName !== 'P') {
    next = document.createElement('p');
    first.after(next);
  }
  next.textContent = CADENCE;
}

function removeUnverifiedEducationSchema(document) {
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    let schema;
    try { schema = JSON.parse(script.textContent); } catch { continue; }
    let changed = false;
    function visit(value) {
      if (!value || typeof value !== 'object') return;
      if ('alumniOf' in value) {
        delete value.alumniOf;
        changed = true;
      }
      for (const child of Object.values(value)) visit(child);
    }
    visit(schema);
    if (changed) script.textContent = JSON.stringify(schema);
  }
}

function reviseAbout(document) {
  setText(document, '3713910b-112', 'Yolculuğu Malatya’nın Kızık köyünde başladı. Uluslararası kurumsal hayatta satış ve liderlik üzerine çalıştı. Kurumsal kariyerini girişimcilik, yazarlık ve konuşmacılık izledi.');
  setText(document, '3713910b-113', MISSION);
  const story = node(document, '3713910b-121');
  if (story) {
    story.textContent = story.textContent
      .replace("ODTÜ Ekonomi ve Londra'da MBA'in ardından 16 yıllık", '16 yıllık')
      .replace('Sonra kurumsal koltuk bırakıldı; girişimcilik ve yeni nesil e-ticarette bugün 70.000 kişiye ulaşan bir ekibin liderliği başladı.', `Sonra kurumsal koltuk bırakıldı. ${ENTREPRENEURSHIP}`)
      .replace('13 yılda 70.000 kişilik bir ekip.', ENTREPRENEURSHIP);
  }
  const missionStory = node(document, '3713910b-122');
  // The paragraph also holds two linked book/concept names; retain those nodes
  // and their CMS IDs while updating only the surrounding text.
  if (missionStory) {
    for (const child of missionStory.childNodes) {
      if (child.nodeType === 3) child.textContent = child.textContent.replace(OLD_MISSION, MISSION).replace('kendi sözleriyle hedefi şudur:', 'kendi sözleriyle pusulası şudur:');
    }
  }

  // Dated metrics belong only to the dedicated press/media-kit page.
  node(document, '3713910b-145')?.remove();
  document.querySelector('#dijital-etki')?.remove();
  const rows = document.querySelector('.ed-dark .editorial-rows');
  if (rows) [...rows.querySelectorAll('.row-number')].forEach((number, index) => { number.textContent = String(index + 1).padStart(2, '0'); });
  // The existing press CTA now makes the new destination reachable from About.
  const pressLink = node(document, '3713910b-169');
  if (pressLink) pressLink.setAttribute('href', '/basin/');
  setText(document, '3713910b-170', 'Basın / Medya Kiti');
  removeUnverifiedEducationSchema(document);
}

/** Apply content-only revisions to the existing route document. */
export function reviseBioTraining(document, route) {
  if (route === '/konusmaci/') {
    setText(document, '0b7effcb-245', EXPERIENCE);
    // No genuine 75–90 second multi-stage sound reel exists in the supplied
    // assets. Per the brief's final checklist, leave it unpublished. The TEDx
    // feature and archive remain intact and are not relabeled as a showreel.
  } else if (route === '/egitimler/') {
    reviseTraining(document);
  } else if (route === '/mentorluk/') {
    reviseMentorship(document);
  } else if (route === '/ziya-sakir-yilmaz/') {
    reviseAbout(document);
  }
  return document;
}

/**
 * Build /basin/ from the UNREVISED About document, before its dated block is
 * removed. This is the destination explicitly requested in brief item 34.
 * The compiler must assign fresh CMS bindings to this newly created route.
 */
export function createMediaKitDocument(sourceAboutDocument) {
  const document = sourceAboutDocument.cloneNode(true);
  const hero = node(document, '3713910b-83');
  const press = node(document, '3713910b-153');
  if (!hero || !press || !press.querySelector('#dijital-etki')) {
    throw new Error('Basın / Medya Kiti requires the original About hero and dated press block.');
  }
  const metricSummary = node(document, '3713910b-148')?.cloneNode(true);
  for (const section of [...document.body.children].filter((element) => element.tagName === 'SECTION')) {
    if (section !== hero && section !== press) section.remove();
  }
  setText(document, '3713910b-88', 'Etkinlik ve basın');
  setText(document, '3713910b-89', 'Basın / Medya Kiti');
  setText(document, '3713910b-91', 'Konuşma konuları, basın ve etkinlik dosyaları, tarihli dijital etki verileri.');
  setText(document, '3713910b-198', DATED_METRICS);
  const source = node(document, '3713910b-202');
  if (source && metricSummary) source.after(metricSummary);
  const metrics = document.querySelector('#dijital-etki');
  metrics.setAttribute('open', '');

  const title = 'Basın / Medya Kiti | Ziya Şakir Yılmaz';
  const description = 'Ziya Şakir Yılmaz’ın konuşma konularına, basın ve etkinlik dosyalarına, resmî sosyal medya profillerine ve tarihli dijital etki verilerine ulaşın.';
  const canonical = 'https://ziyasakiryilmaz.com/basin/';
  document.body.setAttribute('data-page', 'basin');
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
  for (const property of ['og:title', 'twitter:title']) document.querySelector(`meta[property="${property}"], meta[name="${property}"]`)?.setAttribute('content', title);
  for (const property of ['og:description', 'twitter:description']) document.querySelector(`meta[property="${property}"], meta[name="${property}"]`)?.setAttribute('content', description);
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
  document.querySelector('meta[property="og:type"]')?.setAttribute('content', 'website');
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((element) => element.remove());
  document.querySelectorAll('header a.active').forEach((element) => element.classList.remove('active'));
  document.querySelectorAll('script[type="application/ld+json"]').forEach((element) => element.remove());
  const schema = document.createElement('script');
  schema.setAttribute('type', 'application/ld+json');
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: canonical,
    inLanguage: 'tr-TR',
    about: { '@id': 'https://ziyasakiryilmaz.com/ziya-sakir-yilmaz#person' },
  });
  document.head.append(schema);
  // A new route must not share content keys with its source page.
  document.querySelectorAll('*').forEach((element) => {
    for (const attribute of [...element.attributes]) {
      if (attribute.name.startsWith('data-cms-')) element.removeAttribute(attribute.name);
    }
  });
  return document;
}
