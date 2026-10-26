/**
 * V13 brief §§5–7, 10–17 and 37. Transform existing compiled templates without
 * replacing their CMS node identities. This module deliberately has no I/O.
 */
export const HOME_STORY_COPY = {
  '42099b4a-202': 'Malatya’nın Kızık köyünde, kerpiç bir evde, gaz lambasının ışığında büyüdüm. Babam bir öğretmendi. Daha çocukken bana şu cümleyi söyledi: ‘Oğlum, dinle beni. Sen bu köyden çıkabilirsin. Ama bir şartla. Kafanın içindeki köyü de bırakacaksın.’ Beş yaşında bir çocuk böyle bir cümleyi anlayamaz. Ben de anlamadım. Ama o cümle içimde yıllarca bekledi.',
  '42099b4a-205': 'Tarih 12 Ekim 2012. O yoğun tempo içerisinde bir sabah gözlerimi açtığımda hangi ülkede olduğumu bile hatırlayamadım. Birkaç saniye sürdü. Bana bir saat gibi geldi. Yatağın kenarına oturdum. Dışarıdan bakıldığında her şey yolundaydı; Bayer’de üst düzey yöneticiydim, iyi kazanıyordum, sürekli seyahat ediyordum. Ama o sabah babamın yıllar önce söylediği cümle yeniden yankılandı: ‘Kafanın içindeki köyü de bırakacaksın.’ O otel odasında kendime iki şey söz verdim: Bir milyon insanın kalbine dokunacaktım. Ve babamın adını, bir gün, bir okulun tabelasına kazıyacaktım.',
  '42099b4a-208': 'İki ay sonra, 12.12.2012’de, 16 yıllık kurumsal hayatımı bıraktım. Ardından gelen 14 yıllık girişimcilik yolculuğunda satıştan liderliğe, eğitimden insan yetiştirmeye kadar öğrendiğim her şeyi sahada yeniden sınadım. Bugün anlattığım sistemlerin ortak noktası şu: Önce yaşadım. Sonra neden çalıştığını söktüm, parçalara ayırdım ve uygulanabilir bir modele dönüştürdüm.',
};

export const PILLAR_COPY = {
  salesHeadline: 'KONUŞAN DEĞİL, TEŞHİS KOYAN SATAR.',
  salesLead: 'Doğru sorudan doğru teklife. Satışı müşteriyi anlamakla başlayan bir sistem olarak ele alıyorum.',
  salesStory: 'Bir masada 22 üretici vardı. Bana beş yıl boyunca yüzde 5 komisyon sözü verilmişti. Önüme gelen sözleşmede ise süre iki yıl, komisyon yüzde 3’tü. İmzalamadım. Çünkü satışta güven, fiyat kadar gerçek bir değerdir.',
  salesDistributor: 'Durumu Dubai’de birlikte çalıştığım distribütöre anlattığımda bana tek bir cümle söyledi: ‘Seni aldatanla ben de çalışmam.’ O gün yalnızca bir sözleşmenin değil, güvenin gerçek maliyetini öğrendim.',
  leadershipThesis: 'Bir yöneticinin çıktısı sonuçtur. Bir liderin çıktısı insanlardır. Büyük liderin çıktısı ise yeni liderlerdir. Liderlik benim için, sen yokken de devam eden insanlar yetiştirmektir.',
  successModel: 'Başarı Mühendisliği’nin eğitimdeki uygulama modeli; Keşif, Tasarım, İnşa, Test ve Bakım aşamalarını bir araya getirir. Bu beş aşama kitabın bölüm yapısı değil, yaklaşımın eğitim ve uygulama sürecinde kullanılan çalışma modelidir.',
};

const PILLARS = {
  '/satis/': { prefix: '11c5b094', early: 118, reading: 182, hub: 225, faq: 251, closing: 263, title: 'Satış' },
  '/liderlik/': { prefix: '454dc2e9', early: 116, reading: 185, hub: 225, faq: 252, closing: 264, title: 'Liderlik' },
  '/basari/': { prefix: 'b55b9651', early: 122, reading: 187, hub: 234, faq: 261, closing: 273, title: 'Başarı' },
  '/kafa-yapisi/': { prefix: '5f3f14fd', early: 119, reading: 182, hub: 226, faq: 253, closing: 265, title: 'Kafa Yapısı' },
};

function required(document, id) {
  const element = document.querySelector(`[data-cms-node="${id}"]`);
  if (!element) throw new Error(`V13 pillar transform: required CMS node ${id} is missing`);
  return element;
}

function newNode(document, tag, id, className, text) {
  const element = document.createElement(tag);
  element.setAttribute('data-cms-node', id);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// Both the heading and its existing line-break retain their original CMS ids.
function replaceTwoLineHeading(document, id, firstLine, secondLine) {
  const heading = required(document, id);
  const lineBreak = heading.querySelector('br');
  if (!lineBreak) {
    heading.textContent = `${firstLine} ${secondLine}`;
    return;
  }
  heading.replaceChildren(document.createTextNode(firstLine), lineBreak, document.createTextNode(` ${secondLine}`));
}

function promoteDefinition(element) {
  element.classList.add('ed-description', 'v13-pillar-thesis');
  const label = element.querySelector('span');
  if (label) {
    label.classList.add('eyebrow');
    label.style.display = 'block';
  }
}

function renameHub(document, config) {
  const hub = required(document, `${config.prefix}-${config.hub}`);
  const summary = hub.querySelector('summary');
  const label = required(document, `${config.prefix}-${config.hub + 2}`);
  const captionId = `${config.prefix}-v13-hub-caption`;
  label.textContent = 'DAHA DERİNE İN';
  label.style.display = 'block';
  let group = summary.querySelector('.v13-hub-label');
  if (!group) {
    group = newNode(document, 'span', `${config.prefix}-v13-hub-label`, 'v13-hub-label');
    summary.insertBefore(group, label);
    group.append(label);
  }
  let caption = document.querySelector(`[data-cms-node="${captionId}"]`);
  if (!caption) {
    caption = newNode(document, 'small', captionId, 'v13-hub-caption');
    caption.style.display = 'block';
    caption.style.fontWeight = '400';
    group.append(caption);
  }
  caption.textContent = `${config.title} Bilgi Merkezi · 8 başlık`;
  return hub;
}

function arrangeLowerInformation(document, config, route) {
  const reading = required(document, `${config.prefix}-${config.reading}`);
  const closing = required(document, `${config.prefix}-${config.closing}`);
  const early = required(document, `${config.prefix}-${config.early}`);
  const readingWrap = reading.querySelector('.wrap');
  early.classList.add('v13-pillar-answer');
  early.style.marginBlock = '0 var(--content-gap)';
  const hub = renameHub(document, config);
  const faq = required(document, `${config.prefix}-${config.faq}`);

  // Keep the existing CTA, guides, summary, topic entries and FAQ nodes. Only
  // their position changes; the visible marketing story precedes all SEO depth.
  closing.after(reading);
  if (route === '/kafa-yapisi/') {
    const layers = required(document, '5f3f14fd-137');
    closing.after(layers);
    layers.after(reading);
    layers.querySelector('.wrap').prepend(early);
  } else {
    readingWrap.prepend(early);
  }

  // Existing reading links stay available, between the short answer and hub.
  // FAQ is the final page content, immediately after the eight topic entries.
  readingWrap.append(hub, faq);
}

export function reviseHomeSalesPillars(document, route) {
  if (route === '/') {
    for (const [id, copy] of Object.entries(HOME_STORY_COPY)) required(document, id).textContent = copy;
    return document;
  }
  const config = PILLARS[route];
  if (!config) return document;

  if (route === '/satis/') {
    replaceTwoLineHeading(document, '11c5b094-88', 'KONUŞAN DEĞİL,', 'TEŞHİS KOYAN SATAR.');
    required(document, '11c5b094-90').textContent = PILLAR_COPY.salesLead;
    required(document, '11c5b094-113').textContent = 'SAHADAN BİR DERS';
    required(document, '11c5b094-114').textContent = '440.000 DOLARLIK DERS';
    required(document, '11c5b094-115').textContent = PILLAR_COPY.salesStory;
    let distributor = document.querySelector('[data-cms-node="11c5b094-v13-distributor"]');
    if (!distributor) distributor = newNode(document, 'p', '11c5b094-v13-distributor', 'ed-description');
    distributor.textContent = PILLAR_COPY.salesDistributor;
    required(document, '11c5b094-115').after(distributor);
    replaceTwoLineHeading(document, '11c5b094-116', 'KONUŞAN DEĞİL,', 'TEŞHİS KOYAN SATAR.');
    const diagnosis = required(document, '11c5b094-128');
    promoteDefinition(diagnosis);
    required(document, '11c5b094-116').after(diagnosis);
  }

  if (route === '/liderlik/') {
    // Only the explicitly rejected repeated H2 (and its BR) is removed.
    document.querySelector('[data-cms-node="454dc2e9-114"]')?.remove();
    required(document, '454dc2e9-90').textContent = PILLAR_COPY.leadershipThesis;
    const intro = required(document, '454dc2e9-131');
    intro.classList.add('ed-description');
    required(document, '454dc2e9-112').append(intro);
  }

  if (route === '/basari/') {
    required(document, 'b55b9651-121').textContent = PILLAR_COPY.successModel;
  }

  if (route === '/kafa-yapisi/') {
    const definition = required(document, '5f3f14fd-129');
    promoteDefinition(definition);
    required(document, '5f3f14fd-115').before(definition);
    // Generic conceptual copy belongs with the lower short-answer material;
    // the manifesto keeps Ziya’s own definition immediately after the quote.
    required(document, '5f3f14fd-125').after(required(document, '5f3f14fd-114'));
  }

  arrangeLowerInformation(document, config, route);
  return document;
}
