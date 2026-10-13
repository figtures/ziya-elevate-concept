import {experienceDefaults} from './experience.mjs';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles = {floating: 'Sabit iletişim düğmesi', playback: 'Video oynatma kontrolleri', talk: 'Konuşma penceresi', contact: 'İletişim formu ve WhatsApp', playlist: 'Açılıştan sonra oynatılan videolar', testUI: 'Test ekranları ve indirilen rapor'};
const labels = {
  enabled: 'Sitede göster', label: 'Düğme metni', href: 'Bağlantı', playLabel: 'Oynatma etiketi', pauseLabel: 'Duraklatma etiketi', title: 'Pencere başlığı', closeLabel: 'Kapatma düğmesi', watchLabel: 'Harici izleme metni',
  phone: 'WhatsApp numarası', submitLabel: 'Form gönderme düğmesi', sendingLabel: 'Gönderiliyor metni', successTitle: 'Başarılı gönderim başlığı', successText: 'Başarılı gönderim açıklaması', errorTitle: 'Gönderim hatası başlığı', errorText: 'Gönderim hatası açıklaması', retryLabel: 'Yeniden deneme düğmesi', againLabel: 'Yeni talep düğmesi', minMessageText: 'Kısa mesaj uyarısı', greeting: 'WhatsApp mesajının açılışı', privacyText: 'Form altındaki bilgilendirme', whatsappLabel: 'WhatsApp düğmesi',
  previousLabel: 'Önceki soru düğmesi', scoreLabel: 'Skor başlığı', scoreDisclaimer: 'Skorun altındaki açıklama', resultNote: 'Sonuç bilgilendirmesi', strongLabel: 'Güçlü alan başlığı', weakLabel: 'Gelişim alanı başlığı', strongSuffix: 'Güçlü alan açıklaması', maintainLabel: 'Yüksek skorlu alan başlığı', maintainTip: 'Yüksek skorlu alan açıklaması', stepsLabel: 'İlk adımlar başlığı', downloadLabel: 'Rapor indirme düğmesi', downloadNote: 'Rapor indirme açıklaması', actionLabel: 'Sonuç ekranı eylem düğmesi', actionHref: 'Eylem düğmesi bağlantısı', teamPrefix: 'Kurumsal görüşme ön metni', teamLabel: 'Kurumsal görüşme bağlantı metni', teamHref: 'Kurumsal görüşme bağlantısı', layerPrefix: 'Soru katmanı ön metni', questionPrefix: 'Soru numarası ön metni', reportTitle: 'İndirilen raporun başlığı', reportAuthor: 'Rapor yazarı', reportScorePrefix: 'Raporda skor ön metni', reportStrongPrefix: 'Raporda güçlü alan ön metni', reportWeakPrefix: 'Raporda odak alanı ön metni', reportStepsLabel: 'Raporda ilk adımlar başlığı', reportDisclaimer: 'Rapor bilgilendirmesi'
};
function input(group, key, value, disabled) {
  const id = `experience-${group}-${key}`, attr = `id="${id}" data-experience-group="${group}" data-experience-key="${key}" ${disabled ? 'disabled' : ''}`;
  const label = labels[key] || key;
  if (typeof value === 'boolean') return `<div class="field"><label for="${id}">${label}</label><input type="checkbox" ${attr} ${value ? 'checked' : ''}></div>`;
  const body = String(value).length > 90 || /(?:Text|Note|Disclaimer|Tip|Suffix)$/.test(key) ? `<textarea ${attr} maxlength="2000" rows="3">${esc(value)}</textarea>` : `<input ${attr} maxlength="2000" type="text" value="${esc(value)}" ${key === 'phone' ? 'inputmode="numeric" pattern="[0-9]{7,15}"' : ''}>`;
  return `<div class="field"><label for="${id}">${label}</label>${body}${key === 'phone' ? '<p class="help">Ülke koduyla, boşluk veya + olmadan. Örnek: 905321234567</p>' : ''}</div>`;
}
export function renderExperienceEditor({payload, doc, canEdit = true}) {
  const defaults = experienceDefaults(doc, payload), disabled = !canEdit;
  return `<div data-experience-editor>${Object.entries(defaults).map(([group, data]) => {
    if (group === 'playlist') return `<section class="panel"><div class="panel-head"><div><h2>${titles[group]}</h2><p>TEDx açılışı ilk ziyarette bir kez oynar. Ardından bu liste sırayla döner.</p></div><button type="button" class="button small" data-playlist-action="add" ${disabled || data.length >= 12 ? 'disabled' : ''}>Video ekle</button></div><div class="panel-body">${data.map((item, i) => `<article class="repeat-item"><div class="repeat-head"><b>Video ${i + 1}</b><div class="actions"><button type="button" class="button quiet small" aria-label="Video ${i + 1} sırasını yükselt" data-playlist-action="up" data-index="${i}" ${disabled || i === 0 ? 'disabled' : ''}>Yukarı</button><button type="button" class="button quiet small" aria-label="Video ${i + 1} sırasını düşür" data-playlist-action="down" data-index="${i}" ${disabled || i === data.length - 1 ? 'disabled' : ''}>Aşağı</button><button type="button" class="button quiet small" data-playlist-action="remove" data-index="${i}" ${disabled || data.length <= 1 ? 'disabled' : ''}>Kaldır</button></div></div><div class="repeat-body field-grid">${[['src','Video adresi'],['poster','Kapak görseli'],['focal','Görüntü odak konumu']].map(([key,label]) => `<div class="field"><label for="playlist-${i}-${key}">${label}</label><input id="playlist-${i}-${key}" data-playlist-index="${i}" data-playlist-key="${key}" maxlength="2000" value="${esc(item[key])}" ${disabled ? 'disabled' : ''}>${key !== 'focal' ? `<button type="button" class="button quiet small" data-playlist-media="${key}" data-index="${i}" ${disabled ? 'disabled' : ''}>Medya arşivinden seç</button>` : '<p class="help">Örnek: center, center 35%, 38% center</p>'}</div>`).join('')}</div></article>`).join('')}</div></section>`;
    return `<section class="panel"><div class="panel-head"><h2>${titles[group]}</h2></div><div class="panel-body"><div class="field-grid">${Object.entries(data).map(([key, value]) => input(group, key, value, disabled)).join('')}</div></div></section>`;
  }).join('') || '<div class="empty-state">Bu sayfanın metin, görsel ve bağlantıları İçerik sekmesindeki bölümlerden yönetiliyor.</div>'}</div>`;
}
export function wireExperienceEditor(root, {payload, doc, onChange, rerender, pickMedia, canEdit = true}) {
  if (!canEdit) return;
  const current = () => experienceDefaults(doc, payload);
  const ensure = group => {payload.experience ||= {}; if (!payload.experience[group]) payload.experience[group] = structuredClone(current()[group]); return payload.experience[group];};
  root.querySelectorAll('[data-experience-key]').forEach(el => el.addEventListener('input', () => {ensure(el.dataset.experienceGroup)[el.dataset.experienceKey] = el.type === 'checkbox' ? el.checked : el.value; onChange?.();}));
  root.querySelectorAll('[data-playlist-key]').forEach(el => el.addEventListener('input', () => {ensure('playlist')[Number(el.dataset.playlistIndex)][el.dataset.playlistKey] = el.value; onChange?.();}));
  root.querySelectorAll('[data-playlist-action]').forEach(el => el.addEventListener('click', () => {
    const list = ensure('playlist'), i = Number(el.dataset.index), action = el.dataset.playlistAction;
    if (action === 'add' && list.length < 12) list.push({...list.at(-1), id: 'clip-' + crypto.randomUUID()});
    if (action === 'remove' && list.length > 1) list.splice(i, 1);
    const to = action === 'up' ? i - 1 : action === 'down' ? i + 1 : -1;
    if (to >= 0 && to < list.length) {const [item] = list.splice(i, 1); list.splice(to, 0, item);}
    onChange?.(); rerender?.();
  }));
  root.querySelectorAll('[data-playlist-media]').forEach(el => el.addEventListener('click', () => {
    const key = el.dataset.playlistMedia, index = Number(el.dataset.index);
    pickMedia?.({type: key === 'src' ? 'video' : 'image', value: current().playlist[index][key], onSelect: value => {ensure('playlist')[index][key] = typeof value === 'string' ? value : value.url; onChange?.(); rerender?.();}});
  }));
}
