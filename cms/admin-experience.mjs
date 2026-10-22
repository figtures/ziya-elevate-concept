import {experienceDefaults} from './experience.mjs';
import {renderVideoEditor,wireVideoEditor} from './admin-video.mjs';
import {parseMediaFrame,serializeMediaFrame,getMediaFrameSpec} from './media-framing.mjs';
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
export function renderExperienceEditor({payload, doc, canEdit = true, canUpload = true, media=[]}) {
  const defaults = experienceDefaults(doc, payload), disabled = !canEdit;
  return `<div data-experience-editor>${Object.entries(defaults).sort(([a],[b])=>(a==='playlist'?-1:b==='playlist'?1:0)).map(([group, data]) => {
    if (group === 'playlist') return renderOpeningEditor(doc,payload,disabled) + renderVideoEditor({clips:data,canEdit,canUpload,media});
    return `<section class="panel"><div class="panel-head"><h2>${titles[group]}</h2></div><div class="panel-body"><div class="field-grid">${Object.entries(data).map(([key, value]) => input(group, key, value, disabled)).join('')}</div></div></section>`;
  }).join('') || '<div class="empty-state">Bu sayfanın metin, görsel ve bağlantıları İçerik sekmesindeki bölümlerden yönetiliyor.</div>'}</div>`;
}
function renderOpeningEditor(doc,payload,disabled) {
  const host=doc?.querySelector('[data-tedx-hero]');if(!host)return '';
  const node=host.getAttribute('data-cms-node');if(!node)return '';
  return `<details class="panel"><summary class="panel-head"><div><h2>İlk açılış · TEDxReset</h2><p>Sayfa açıldığında bu kısa bölüm bir kez oynar. Ardından aşağıdaki klipler sırayla devam eder.</p></div></summary><div class="panel-body"><div class="field-grid">${[['data-clip-start','Başlangıç saniyesi'],['data-clip-end','Bitiş saniyesi']].map(([key,label])=>`<div class="field"><label for="opening-${key}">${label}</label><input id="opening-${key}" type="number" min="0" max="36000" step="0.1" data-opening-node="${esc(node)}" data-opening-attr="${key}" value="${esc(host.getAttribute(key))}" ${disabled?'disabled':''}></div>`).join('')}</div><button type="button" class="button quiet small" data-preview-opening>TEDx açılışını önizle</button><div data-opening-preview></div><p class="help" data-opening-error role="status"></p></div></details>`;
}
export function wireExperienceEditor(root, {payload, doc, onChange, rerender, pickMedia, uploadMedia, notify, getMedia=()=>[], canEdit = true, canUpload=true}) {
  const current = () => experienceDefaults(doc, payload);
  const ensure = group => {payload.experience ||= {}; if (!payload.experience[group]) payload.experience[group] = structuredClone(current()[group]); return payload.experience[group];};
  root.querySelectorAll('[data-experience-key]').forEach(el => el.addEventListener('input', () => {if(!canEdit)return;ensure(el.dataset.experienceGroup)[el.dataset.experienceKey] = el.type === 'checkbox' ? el.checked : el.value; onChange?.();}));
  const updateOpening=el=>{
    if(!canEdit)return;
    const key=el.dataset.openingNode+':@'+el.dataset.openingAttr;
    payload.values[key]=el.value;
    for(const section of payload.sections||[]){delete section.values?.[key];for(const group of section.groups||[])for(const item of group.items||[])delete item.values?.[key];}
    doc.querySelector('[data-tedx-hero]')?.setAttribute(el.dataset.openingAttr,el.value);
    root.querySelector('[data-opening-preview]')?.replaceChildren();onChange?.();
  };
  root.querySelectorAll('[data-opening-attr]').forEach(el=>el.addEventListener('input',()=>updateOpening(el)));
  root.querySelector('[data-preview-opening]')?.addEventListener('click',()=>{
    const host=doc.querySelector('[data-tedx-hero]'),id=host.dataset.videoId,start=Number(host.dataset.clipStart),end=Number(host.dataset.clipEnd),error=root.querySelector('[data-opening-error]');
    if(!/^[-\w]{11}$/.test(id)||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>36000){error.textContent='Bitiş saniyesi başlangıçtan büyük olmalı; 0–36000 aralığında değer girin.';return;}
    error.textContent='';const frame=root.ownerDocument.createElement('iframe');frame.title='TEDx açılışı önizlemesi';frame.src=`https://www.youtube-nocookie.com/embed/${id}?start=${Math.floor(start)}&end=${Math.ceil(end)}&rel=0&playsinline=1`;frame.setAttribute('allow','fullscreen; encrypted-media');frame.style.cssText='width:100%;aspect-ratio:16/9;border:0;border-radius:16px;margin-top:16px';root.querySelector('[data-opening-preview]').replaceChildren(frame);
  });
  const cleanup= root.querySelector('[data-video-editor]') ? wireVideoEditor(root,{
    getClips:()=>current().playlist,
    getFrame:clip=>payload.values?.[`media-frame:clip:${clip.id}`],
    onFrameChange:(clip,frame)=>{
      if(!canEdit||!clip)return;
      // Persist template-derived clip identities before attaching a per-clip crop.
      ensure('playlist');
      const key=`media-frame:clip:${clip.id}`,value=parseMediaFrame(frame,clip.src);payload.values||={};
      if(value)payload.values[key]=serializeMediaFrame(value);else delete payload.values[key];
      onChange?.();
    },
    frameSpec:getMediaFrameSpec(doc?.querySelector('[data-tedx-hero] video,.hero-vid video')),
    onChange:clips=>{payload.experience||={};payload.experience.playlist=clips;onChange?.();},pickMedia,uploadMedia,notify,getMedia,canEdit,canUpload
  }) : null;
  return ()=>{cleanup?.();root.querySelector('[data-opening-preview]')?.replaceChildren();};
}
