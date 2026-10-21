/** Typed controls for interface content that lives outside the section catalog. */
import {navigationURL} from './navigation.mjs';
const link = value => typeof value==='string' && value.length<=2000 && !!navigationURL(value);
const mediaLink = value => link(value) && !/^(?:#|mailto:|tel:)/.test(value);
const focalPattern = /^(?:center|left|right|top|bottom|\d+(?:\.\d+)?%)(?:\s+(?:center|left|right|top|bottom|\d+(?:\.\d+)?%))?$/;
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
export const EXPERIENCE_FIELDS = {
  floating: ['enabled', 'label', 'href'],
  playback: ['playLabel', 'pauseLabel'],
  talk: ['title', 'closeLabel', 'watchLabel', 'href'],
  contact: ['phone', 'submitLabel', 'sendingLabel', 'successTitle', 'successText', 'errorTitle', 'errorText', 'retryLabel', 'againLabel', 'minMessageText', 'greeting', 'privacyText', 'whatsappLabel'],
  testUI: ['previousLabel', 'scoreLabel', 'scoreDisclaimer', 'resultNote', 'strongLabel', 'weakLabel', 'strongSuffix', 'maintainLabel', 'maintainTip', 'stepsLabel', 'downloadLabel', 'downloadNote', 'retryLabel', 'actionLabel', 'actionHref', 'teamPrefix', 'teamLabel', 'teamHref', 'layerPrefix', 'questionPrefix', 'reportTitle', 'reportAuthor', 'reportScorePrefix', 'reportStrongPrefix', 'reportWeakPrefix', 'reportStepsLabel', 'reportDisclaimer']
};
export const CONTACT_DEFAULTS = {
  phone: '905326467755', submitLabel: 'Talebimi gönder', sendingLabel: 'Gönderiliyor…',
  successTitle: 'Talebiniz alındı.', successText: 'Teşekkürler. Talebiniz bize ulaştı. En geç 48 saat içinde sizinle iletişime geçeceğiz.',
  errorTitle: 'Talep kaydedilemedi.', errorText: 'Tekrar deneyebilir veya WhatsApp üzerinden gönderebilirsiniz.',
  retryLabel: 'Tekrar dene', againLabel: 'Yeni talep gönder', minMessageText: 'Lütfen talebinizi en az 10 karakterle açıklayın.',
  greeting: 'Merhaba Ziya Bey,', privacyText: 'Form ile gönderdiğiniz bilgiler talebinizi yanıtlamak amacıyla güvenli biçimde kaydedilir. Ayrıntılar için KVKK Aydınlatma Metni’ni inceleyebilirsiniz.', whatsappLabel: 'WhatsApp’ta devam et'
};
export const EN_CONTACT_DEFAULTS = {
  phone: CONTACT_DEFAULTS.phone, submitLabel: 'Send inquiry', sendingLabel: 'Sending…',
  successTitle: 'Your inquiry has been received.', successText: 'Thank you. We have received your inquiry and will contact you within 48 hours.',
  errorTitle: 'Your inquiry could not be saved.', errorText: 'Please try again or continue on WhatsApp.',
  retryLabel: 'Try again', againLabel: 'Send a new inquiry', minMessageText: 'Please describe your inquiry in at least 10 characters.',
  greeting: 'Hello Ziya,', privacyText: 'Your information is securely recorded so we can respond to your inquiry.', whatsappLabel: 'Continue on WhatsApp'
};
export const TEST_UI_DEFAULTS = {
  previousLabel: 'Önceki soru', scoreLabel: 'Zihinsel Zırh Skorun',
  scoreDisclaimer: 'Bu skor klinik veya psikolojik bir değerlendirme değildir; kişisel farkındalık ve gelişim aracıdır.',
  resultNote: 'Bu sonuç bugünün fotoğrafıdır ve kişilik hükmü taşımaz: bugünkü cevapların hangi alanda gelişim fırsatı olduğunu gösteriyor. Aynı testi 66 gün sonra tekrar et.',
  strongLabel: 'Güçlü Zırhın', weakLabel: 'Gelişim Alanın', strongSuffix: 'Gelişim yolculuğunda bu katmandan güç al.',
  maintainLabel: 'Sürdürülecek alışkanlık', maintainTip: 'Bu katmanda da güçlü bir öz değerlendirme yaptın. Kazandığın alışkanlıkları sürdür; aşağıdaki adımları düzenli hatırlatıcı olarak kullan.',
  stepsLabel: 'Senin İçin İlk 3 Adım', downloadLabel: 'Kişisel raporumu indir', downloadNote: 'Skorun, katmanların ve ilk üç adımın cihazına metin dosyası olarak indirilir.', retryLabel: 'Testi Yenile',
  actionLabel: "66 Günlük Oyun Planı'nı Al", actionHref: '/kursun-gecirmez-kafa-yapisi/#oyun-plani', teamPrefix: 'Ekibin için toplu rapor: ', teamLabel: 'kurumsal görüşme', teamHref: '/iletisim/?konu=kurumsal#talep-formu',
  layerPrefix: 'Katman: ', questionPrefix: 'Soru ', reportTitle: 'KURŞUN GEÇİRMEZ KAFA YAPISI · KİŞİSEL RAPOR', reportAuthor: 'Ziya Şakir Yılmaz',
  reportScorePrefix: 'Genel skor: ', reportStrongPrefix: 'Güçlü katman: ', reportWeakPrefix: 'Odak katman: ', reportStepsLabel: 'İLK ÜÇ ADIM',
  reportDisclaimer: 'Bu sonuç klinik veya psikolojik bir değerlendirme değildir; kişisel farkındalık ve gelişim aracıdır.'
};
const testSelectors = {
  previousLabel: '#previousQuestion', scoreLabel: '#result .kicker', scoreDisclaimer: '#verdictText + .hero-note', resultNote: '#layerBars + .hero-note',
  strongLabel: '#strongBox .cap-tag', weakLabel: '#weakBox .cap-tag', stepsLabel: '#stepsList', downloadLabel: '#downloadReport .control-label',
  downloadNote: '.report-actions .hero-note', retryLabel: '#retryBtn', actionLabel: '#result a.btn-primary', teamLabel: '#result .hero-note.mt-2 a'
};
const textAt = (doc, selector, fallback) => doc?.querySelector(selector)?.textContent ?? fallback;
const attrAt = (doc, selector, attr, fallback) => doc?.querySelector(selector)?.getAttribute(attr) || fallback;
export function experienceDefaults(doc, payload = {}) {
  const result = {};
  if (payload.kind === 'global' || payload.route === '/_global/') {
    result.floating = {enabled: !!doc?.querySelector('.ask-ziya'), label: textAt(doc, '.ask-ziya .control-label', 'Ziya’ya sor'), href: attrAt(doc, '.ask-ziya', 'href', '/iletisim/?konu=soru')};
    result.playback = {playLabel: 'Videoyu oynat', pauseLabel: 'Videoyu duraklat'};
  }
  if (doc?.querySelector('#talkDialog') && payload.kind !== 'global') {
    result.talk = {title: textAt(doc, '#talkTitle', 'Ziya Şakir Yılmaz · TEDxReset'), closeLabel: attrAt(doc, '.talk-close', 'aria-label', 'Videoyu kapat'), watchLabel: textAt(doc, '#talkDialog > a', 'YouTube’da izle'), href: attrAt(doc, '#talkDialog > a', 'href', 'https://www.youtube.com/watch?v=u-p2y6JH3aA')};
  }
  if (payload.kind !== 'global') {
    const hero = doc?.querySelector('[data-tedx-hero],.hero-vid');
    const clips = hero ? [...hero.querySelectorAll('video')] : [];
    if (clips.length) result.playlist = clips.map((video, i) => ({
      id: video.dataset.heroClip || `clip-${i + 1}`,
      src: video.dataset.src || video.getAttribute('src') || '',
      poster: video.getAttribute('poster') || '/assets/hero-poster.jpg',
      focal: video.style.objectPosition || 'center',
      ...(video.hasAttribute('data-clip-start') || video.hasAttribute('data-start-at') ? {start: Number(video.dataset.clipStart ?? video.dataset.startAt)} : {}),
      ...(video.hasAttribute('data-clip-end') ? {end: Number(video.dataset.clipEnd)} : {})
    }));
  }
  if (doc?.querySelector('#contactForm') || payload.route === '/iletisim/') {
    const defaults = doc?.querySelector('#contactForm')?.dataset.language === 'en' || payload.route === '/en/speaker/' ? EN_CONTACT_DEFAULTS : CONTACT_DEFAULTS;
    const submitLabel = textAt(doc, '#contactForm [type="submit"]', defaults.submitLabel);
    const privacyText = textAt(doc, '.contact-form-wrap > .hero-note', defaults.privacyText);
    result.contact = {...defaults, whatsappLabel: textAt(doc, '#sendWhatsApp', defaults.whatsappLabel),
      submitLabel: submitLabel === 'WhatsApp mesajını hazırla' ? defaults.submitLabel : submitLabel,
      privacyText: privacyText === 'Form mesajını hazırlar; gönderimi WhatsApp’ta sen tamamlarsın. Bilgilerin bu sayfada kaydedilmez.' ? defaults.privacyText : privacyText};
  }
  if (doc?.querySelector('#quiz') || payload.kind === 'test') {
    result.testUI = {...TEST_UI_DEFAULTS};
    for (const [key, selector] of Object.entries(testSelectors)) if (key !== 'stepsLabel') result.testUI[key] = textAt(doc, selector, result.testUI[key]);
    result.testUI.stepsLabel = doc?.querySelector('#stepsList')?.parentElement?.querySelector('.cap-tag')?.textContent || result.testUI.stepsLabel;
    result.testUI.actionHref = attrAt(doc, '#result a.btn-primary', 'href', result.testUI.actionHref);
    result.testUI.teamHref = attrAt(doc, '#result .hero-note.mt-2 a', 'href', result.testUI.teamHref);
    const team = doc?.querySelector('#result .hero-note.mt-2');
    if (team?.firstChild?.nodeType === 3) result.testUI.teamPrefix = team.firstChild.textContent;
  }
  for (const [key, value] of Object.entries(payload.experience || {})) {
    if (key === 'playlist') result.playlist = structuredClone(value);
    else if (Object.hasOwn(EXPERIENCE_FIELDS, key)) result[key] = {...result[key], ...value};
  }
  return result;
}
export function validateExperience(value) {
  if (value === undefined) return [];
  const errors = [];
  if (!object(value)) return ['Deneyim ayarları geçerli bir nesne olmalı.'];
  if (Object.keys(value).some(key => !Object.hasOwn(EXPERIENCE_FIELDS, key) && key !== 'playlist')) errors.push('Bilinmeyen deneyim ayarı.');
  for (const [group, fields] of Object.entries(EXPERIENCE_FIELDS)) {
    const data = value[group]; if (data === undefined) continue;
    if (!object(data) || Object.keys(data).some(key => !fields.includes(key))) {errors.push(`${group}: ayar yapısı geçersiz.`); continue;}
    for (const [key, v] of Object.entries(data)) {
      if (group === 'floating' && key === 'enabled') {if (typeof v !== 'boolean') errors.push('Görünürlük açık veya kapalı olmalı.'); continue;}
      if (typeof v !== 'string' || v.length > 2000) {errors.push(`${key}: en fazla 2000 karakter girin.`); continue;}
      if (['href', 'actionHref', 'teamHref'].includes(key) && !link(v)) errors.push(`${key}: geçerli bağlantı girin.`);
      if (key === 'phone' && !/^\d{7,15}$/.test(v)) errors.push('WhatsApp numarasını ülke koduyla, yalnızca rakamlarla girin.');
    }
  }
  if (value.playlist !== undefined) {
    if (!Array.isArray(value.playlist) || value.playlist.length < 1 || value.playlist.length > 12) errors.push('Açılış listesini 1–12 video ile oluşturun.');
    else {
      const ids = new Set();
      for (const item of value.playlist) {
        if (!object(item) || Object.keys(item).some(k => !['id', 'src', 'poster', 'focal', 'start', 'end'].includes(k)) || typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(item.id) || ids.has(item.id) || !mediaLink(item.src) || !mediaLink(item.poster) || typeof item.focal !== 'string' || item.focal.length > 2000 || !focalPattern.test(item.focal)) errors.push('Video listesinde kimlik, adres, kapak veya odak konumu geçersiz.');
        if (object(item)) {
          const start = item.start === undefined ? 0 : item.start;
          if (typeof start !== 'number' || !Number.isFinite(start) || start < 0 || start > 36000 ||
              (item.end !== undefined && (typeof item.end !== 'number' || !Number.isFinite(item.end) || item.end <= start || item.end > 36000))) {
            errors.push('Video başlangıcı 0–36000 saniye arasında, bitişi başlangıçtan sonra olmalı.');
          }
        }
        ids.add(item?.id);
      }
    }
  }
  if (/merkez/i.test(JSON.stringify(value))) errors.push('İçerikte “merkez / merkezi” kullanılamaz.');
  return [...new Set(errors)];
}
const setText = (doc, selector, value) => {if (value !== undefined) {const el = doc.querySelector(selector); if (el) el.textContent = value;}};
function dataJSON(doc, id, data) {
  let el = doc.getElementById(id); if (!el) {el = doc.createElement('script'); el.id = id; el.type = 'application/json'; doc.body.append(el);}
  el.textContent = JSON.stringify(data).replaceAll('<', '\\u003c');
}
export function applyExperience(doc, payload, globalPayload, {leadsEnabled = false} = {}) {
  const shared = globalPayload?.experience || {}, local = payload.experience || {};
  // Invalid values never become DOM attributes, even if a legacy row bypasses validation.
  if (validateExperience(shared).length || validateExperience(local).length) return;
  const exp = {};
  for (const key of Object.keys(EXPERIENCE_FIELDS)) if (shared[key] || local[key]) exp[key] = {...shared[key], ...local[key]};
  const floating = exp.floating;
  if (floating) {
    const el = doc.querySelector('.ask-ziya');
    if (floating.enabled === false) el?.remove();
    else if (el) {if (floating.label !== undefined) {el.setAttribute('title', floating.label); setText(doc, '.ask-ziya .control-label', floating.label);} if (floating.href !== undefined) el.setAttribute('href', floating.href);}
  }
  if (exp.playback) for (const button of doc.querySelectorAll('.video-toggle')) {
    if (exp.playback.playLabel !== undefined) button.dataset.playLabel = exp.playback.playLabel;
    if (exp.playback.pauseLabel !== undefined) {button.dataset.pauseLabel = exp.playback.pauseLabel; button.setAttribute('aria-label', exp.playback.pauseLabel); const label = button.querySelector('.control-label'); if (label) label.textContent = exp.playback.pauseLabel;}
  }
  if (exp.talk) {
    const t = exp.talk; setText(doc, '#talkTitle', t.title); setText(doc, '#talkDialog > a', t.watchLabel);
    if (t.closeLabel !== undefined) doc.querySelector('.talk-close')?.setAttribute('aria-label', t.closeLabel);
    if (t.href !== undefined) doc.querySelector('#talkDialog > a')?.setAttribute('href', t.href);
  }
  if (local.playlist && doc.querySelector('[data-tedx-hero],.hero-vid')) {
    const host = doc.querySelector('[data-tedx-hero],.hero-vid'), original = host.querySelector('video');
    const isTEDx = host.hasAttribute('data-tedx-hero');
    if (!isTEDx) host.setAttribute('data-video-sequence', '');
    const marker = doc.createComment('video-list'); original?.before(marker);
    host.querySelectorAll('video').forEach(v => v.remove());
    for (const [index, item] of local.playlist.entries()) {
      const video = original ? original.cloneNode(false) : doc.createElement('video');
      for (const attr of ['id', 'src', 'data-cms-node', 'autoplay', 'loop', 'data-start-at', 'data-clip-start', 'data-clip-end']) video.removeAttribute(attr);
      video.classList.remove('is-active');
      video.dataset.clipStart = String(item.start ?? 0);
      if (item.end !== undefined) video.dataset.clipEnd = String(item.end);
      // Active classes survive motion's restoration of inline transform styles.
      video.style.removeProperty('visibility');
      if (!isTEDx && index === 0) video.classList.add('is-active');
      video.dataset.src = item.src; video.dataset.heroClip = item.id; video.setAttribute('data-tedx-fallback', '');
      video.setAttribute('poster', item.poster); video.style.objectPosition = item.focal; video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.setAttribute('preload', 'none'); video.setAttribute('aria-hidden', 'true');
      if (marker.parentNode) marker.before(video); else host.insertBefore(video, host.querySelector('#tedxHeroPlayer'));
    }
    marker.remove();
    if (!isTEDx && !doc.querySelector('[data-video-sequence-styles]')) {
      const style = doc.createElement('style'); style.setAttribute('data-video-sequence-styles', '');
      style.textContent = '[data-video-sequence] video[data-hero-clip]{visibility:hidden}[data-video-sequence] video[data-hero-clip].is-active{visibility:visible}';
      doc.head.append(style);
    }
    if (!isTEDx && ![...doc.querySelectorAll('script[src]')].some(el => el.getAttribute('src').split('?')[0] === '/assets/tedx-hero.js')) {
      const script = doc.createElement('script'); script.src = '/assets/tedx-hero.js'; script.defer = true; doc.body.append(script);
    }
  }
  if (doc.querySelector('#contactForm') && (exp.contact || leadsEnabled)) {
    const config = experienceDefaults(doc, {...payload, experience: {contact: exp.contact || {}}}).contact; dataJSON(doc, 'cms-contact-content', config);
    setText(doc, '#contactForm [type="submit"]', config.submitLabel); setText(doc, '#sendWhatsApp', config.whatsappLabel);
    setText(doc, '.contact-form-wrap > .hero-note', config.privacyText);
    const whatsapp = doc.getElementById('sendWhatsApp'); if (whatsapp) whatsapp.setAttribute('href', `https://wa.me/${config.phone}`);
  }
  if (doc.querySelector('#quiz') && exp.testUI) {
    const config = {...TEST_UI_DEFAULTS, ...exp.testUI}; dataJSON(doc, 'cms-test-content', config);
    for (const [key, selector] of Object.entries(testSelectors)) if (key !== 'stepsLabel') setText(doc, selector, config[key]);
    const stepLabel = doc.querySelector('#stepsList')?.parentElement?.querySelector('.cap-tag'); if (stepLabel) stepLabel.textContent = config.stepsLabel;
    doc.querySelector('#result a.btn-primary')?.setAttribute('href', config.actionHref);
    const team = doc.querySelector('#result .hero-note.mt-2'); if (team?.firstChild?.nodeType === 3) team.firstChild.textContent = config.teamPrefix;
    doc.querySelector('#result .hero-note.mt-2 a')?.setAttribute('href', config.teamHref);
  }
}
