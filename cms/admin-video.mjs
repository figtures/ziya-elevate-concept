/** A draft-only video editor. Media uploads never publish a document. */
import iconNodes from './icon-nodes.json' with {type: 'json'};
import {parseMediaFrame} from './media-framing.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconNodes[name] || iconNodes.image}</svg>`;
const mediaURL = value => {
  const s = String(value || '');
  if (/^\/(?!\/)/.test(s) && !/[\\\u0000-\u0020]/.test(s)) return s;
  try { return new URL(s).protocol === 'https:' ? s : ''; } catch { return ''; }
};
const clipName = (clip, index, media = []) => {
  const named=media.find(item=>item.url===clip.src)?.alt;
  if(named?.trim())return named;
  if(/\/[a-f0-9-]{36}\.(mp4|webm)(?:[?#]|$)/i.test(clip.src||''))return `Video ${index + 1}`;
  try { return decodeURIComponent(new URL(clip.src, 'https://local.invalid').pathname.split('/').at(-1)).replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') || `Klip ${index + 1}`; }
  catch { return `Klip ${index + 1}`; }
};
export function formatVideoTime(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const n = Math.max(0, seconds), minutes = Math.floor(n / 60);
  return `${String(minutes).padStart(2, '0')}:${(n % 60).toFixed(1).padStart(4, '0')}`;
}
export function validateClipTrim(start, end, duration) {
  if (!Number.isFinite(start) || start < 0 || start > 36000) return 'Başlangıç için 0 ile 36.000 arasında bir saniye girin.';
  if (end !== undefined && (!Number.isFinite(end) || end <= start || end > 36000)) return 'Bitiş saniyesi başlangıçtan büyük ve en fazla 36.000 olmalı.';
  if (Number.isFinite(duration) && duration > 0 && (start >= duration || (end !== undefined && end > duration + .05))) return `Bu video ${formatVideoTime(duration)} uzunluğunda. Süreyi videonun içinde seçin.`;
  return '';
}
const disabled = value => value ? ' disabled' : '';
const action = (name, label, symbol, noEdit = false, cls = '') => `<button type="button" class="button ${cls}" data-video-action="${name}"${disabled(noEdit)}>${symbol ? icon(symbol) : ''}<span>${label}</span></button>`;

function clipRows(clips, selected, canEdit, media = []) {
  return clips.map((clip, index) => `<li class="video-clip${index === selected ? ' is-selected' : ''}" data-video-clip="${index}">
    <button type="button" class="video-clip-select" data-video-select="${index}" aria-pressed="${index === selected}">
      <span class="video-clip-thumb">${mediaURL(clip.poster) ? `<img src="${esc(mediaURL(clip.poster))}" alt="" loading="lazy">` : icon('play')}<b>${String(index + 1).padStart(2, '0')}</b></span>
      <span class="video-clip-copy"><strong>${esc(clipName(clip, index, media))}</strong><small>${formatVideoTime(clip.start || 0)} · ${clip.end === undefined ? 'video sonuna kadar' : formatVideoTime(clip.end)}</small></span>
    </button>
    <div class="video-clip-actions">
      <button type="button" class="icon-button" data-video-move="${index}|-1" aria-label="${index + 1}. klibi yukarı taşı" title="Yukarı taşı"${disabled(!canEdit || !index)}>${icon('chevron-up')}</button>
      <button type="button" class="icon-button" data-video-move="${index}|1" aria-label="${index + 1}. klibi aşağı taşı" title="Aşağı taşı"${disabled(!canEdit || index === clips.length - 1)}>${icon('chevron-down')}</button>
      <button type="button" class="icon-button" data-video-remove="${index}" aria-label="${index + 1}. klibi listeden kaldır" title="Listeden kaldır"${disabled(!canEdit || clips.length <= 1)}>${icon('trash-2')}</button>
    </div>
  </li>`).join('');
}

export function renderVideoEditor({clips = [], canEdit = true, canUpload = canEdit, media = []} = {}) {
  const first = clips[0] || {}, locked = !canEdit;
  return `<section class="panel video-workbench" data-video-editor>
    <div class="panel-head video-workbench-heading"><div><p class="video-step-label">SEÇ · DÜZENLE · ÖNİZLE</p><h2>Video akışı</h2><p>Kliplerinizi ekleyin, istediğiniz saniyeleri seçin ve akışı birlikte izleyin.</p></div><span class="badge draft">Taslak düzenleme</span></div>
    <div class="video-workspace">
      <aside class="video-library" aria-label="Video sırası">
        <div class="video-library-title"><h3>Klip sırası</h3><span data-video-count>${clips.length} / 12</span></div>
        <ol class="video-clip-list" data-video-list>${clipRows(clips, 0, canEdit, media)}</ol>
        <div class="video-add-actions">${action('add-library','Arşivden klip ekle','plus',locked || clips.length >= 12,'primary')}${action('add-upload','Yeni video yükle','files',!canUpload || clips.length >= 12,'quiet')}</div>
        <p class="help">Klipler yukarıdan aşağıya oynar. Bir klibi kaldırmak arşivdeki dosyayı silmez.</p>
      </aside>
      <div class="video-studio">
        <div class="video-preview-heading"><div><span class="video-step-label">CANLI ÖNİZLEME</span><h3 data-video-selected-title>${esc(clipName(first, 0, media))}</h3></div><label class="video-loop-label"><input type="checkbox" data-video-loop checked> Tekrarla</label></div>
        <div class="video-viewport-switch" role="group" aria-label="Önizleme ekranı"><button type="button" data-video-viewport="desktop" aria-pressed="true">Masaüstü</button><button type="button" data-video-viewport="mobile" aria-pressed="false">Telefon</button><small>Görünümü değiştirmek taslağı etkilemez.</small></div>
        <div class="video-stage" data-video-stage data-viewport="desktop">
          <video data-video-player controls playsinline preload="metadata" crossorigin="anonymous" aria-label="Seçilen video ve akış önizlemesi" ${mediaURL(first.poster) ? `poster="${esc(mediaURL(first.poster))}"` : ''}></video>
          <span class="video-preview-tag" data-video-mode>Seçili klip</span>
        </div>
        <div class="video-player-tools">${action('preview-clip','Bu klibi oynat','play',!clips.length,'quiet')}${action('preview-all','Tüm akışı önizle','play',!clips.length,'primary')}${action('stop','Durdur','pause',!clips.length,'quiet')}${action('next','Sonraki klip','arrow-right',clips.length<2,'quiet')}<span class="video-clock" data-video-clock>00:00.0 / —</span></div>
        <label class="video-scrub-label" for="video-frame-position">Videoda gezin · kapak için istediğiniz karede durun</label><input id="video-frame-position" data-video-scrub type="range" min="0" max="1" step="0.1" value="0" disabled aria-label="Video karesi seç">
        <div class="video-sequence-progress"><progress data-video-progress max="1" value="0" aria-label="Akış önizlemesi ilerlemesi"></progress><small data-video-progress-label>Önizleme henüz başlatılmadı.</small></div>
        <p class="video-message" data-video-message role="status" aria-live="polite">Yaptığınız değişiklikler yalnızca taslağa işlenir.</p>
        <div class="video-inspector">
          <section class="video-inspector-section"><div class="video-inspector-title"><span>01</span><div><h3>Kullanılacak bölüm</h3><p>Videonun tamamını veya yalnızca seçtiğiniz saniyeleri kullanın.</p></div></div>
            <div class="video-trim-grid"><div class="field"><label for="video-trim-start">Başlangıç (saniye)</label><input id="video-trim-start" data-video-start type="number" min="0" max="36000" step="0.1" value="${esc(first.start || 0)}"${disabled(locked)}>${action('mark-start','Bu kareyi başlangıç yap','clock-3',locked,'quiet small')}</div><div class="field"><label for="video-trim-end">Bitiş (saniye)</label><input id="video-trim-end" data-video-end type="number" min="0" max="36000" step="0.1" placeholder="Video sonuna kadar" value="${esc(first.end ?? '')}"${disabled(locked)}>${action('mark-end','Bu kareyi bitiş yap','clock-3',locked,'quiet small')}</div></div>
            <div class="video-trim-summary"><span data-video-trim-summary></span>${action('reset-trim','Videonun tamamını kullan','clock-3',locked,'quiet small')}</div>
          </section>
          <section class="video-inspector-section"><div class="video-inspector-title"><span>02</span><div><h3>Kapak karesi</h3><p>Oynatma başlamadan önce görünecek görseli seçin.</p></div></div>
            <div class="video-cover-row"><div class="video-cover-preview" data-video-cover>${mediaURL(first.poster) ? `<img src="${esc(mediaURL(first.poster))}" alt="Seçilen video kapağı">` : icon('image')}</div><div class="video-cover-actions">${action('capture-cover','Bu kareyi JPG kapak yap','image',!canUpload,'primary')}${action('cover-library','Arşivden görsel seç','image',locked,'quiet small')}${action('cover-upload','Kapak yükle','files',!canUpload,'quiet small')}</div></div>
            <p class="help">Videoyu durdurup zaman çubuğundan kare seçin. JPG, medya arşivinize de eklenir.</p>
          </section>
          <section class="video-inspector-section video-focal-section"><div class="field"><label for="video-focal">Görüntüde hangi alan öne çıksın?</label><select id="video-focal" data-video-focal${disabled(locked)}><option value="center">Ortası</option><option value="left center">Solu</option><option value="right center">Sağı</option><option value="center top">Üstü</option><option value="center bottom">Altı</option><option value="custom">Özel masaüstü / telefon kadrajı</option></select><p class="help">Kadrajı ayarlarken masaüstü ve telefon için farklı alanlar seçebilirsiniz.</p></div><div class="actions">${action('edit-frame','Kadrajı ayarla','image',locked,'primary')}${action('reset-frame','Özel kadrajı kaldır','rotate-ccw',locked,'quiet')}${action('replace-library','Seçili videoyu değiştir','files',locked,'quiet')}</div></section>
        </div>
      </div>
    </div>
    <div class="video-upload-status" data-video-upload-status hidden role="status" aria-live="polite"><progress data-video-upload-progress max="100"></progress><span data-video-upload-label>Dosya yükleniyor…</span></div>
    <input type="file" data-video-upload accept="video/mp4,video/webm" multiple hidden><input type="file" data-video-cover-upload accept="image/jpeg,image/png,image/webp,image/avif" hidden>
    <footer class="video-workbench-footer">${icon('check')}<p>Önce <strong>Taslağı kaydet</strong>, kontrolünüz tamamlandığında <strong>Yayınla</strong>. Önizlemek canlı siteyi değiştirmez.</p></footer>
  </section>`;
}

export function wireVideoEditor(root, {getClips, getMedia = () => [], getFrame = () => undefined, onFrameChange, frameSpec, onChange, pickMedia, uploadMedia, notify, canEdit = true, canUpload = canEdit} = {}) {
  const el = root.matches?.('[data-video-editor]') ? root : root.querySelector('[data-video-editor]');
  if (!el) return () => {};
  const q = selector => el.querySelector(selector), video = q('[data-video-player]');
  let clips = structuredClone(getClips?.() || []), selected = 0, disposed = false, uploading = false, mode = 'inspect', starting = false, sourceToken = 0, corsFallback = false, wantPlay = false, playbackTimer;
  const durations = new Map(), cleanups = [];
  const on = (target, type, fn) => {target.addEventListener(type, fn); cleanups.push(() => target.removeEventListener(type, fn));};
  const current = () => clips[selected];
  const frameFor = clip => clip && parseMediaFrame(getFrame(clip), clip.src);
  const selectedFrameSpec = frameSpec || {label:'Video açılışı',desktop:{width:1440,height:900},mobile:{width:390,height:780}};
  const duration = () => durations.get(current()?.src);
  const message = (text, bad = false) => {if (disposed) return; q('[data-video-message]').textContent = text; q('[data-video-message]').dataset.tone = bad ? 'error' : 'info';};
  const report = (text, bad = false) => {message(text, bad); notify?.(text, bad);};
  const save = () => {onChange?.(structuredClone(clips)); refreshList(); refreshSummary();};
  const refreshList = () => {q('[data-video-list]').innerHTML = clipRows(clips, selected, canEdit && !uploading, getMedia()); q('[data-video-count]').textContent = `${clips.length} / 12`; q('[data-video-action=next]').disabled=uploading||clips.length<2; for (const name of ['add-library','add-upload']) q(`[data-video-action="${name}"]`).disabled = uploading || clips.length >= 12 || (name === 'add-upload' ? !canUpload : !canEdit);};
  const refreshSummary = () => {
    const c = current(); if (!c) return;
    const end = c.end ?? duration(), length = Number.isFinite(end) ? end - (c.start || 0) : NaN;
    q('[data-video-trim-summary]').textContent = Number.isFinite(length) ? `Seçilen bölüm: ${formatVideoTime(Math.max(0,length))}` : 'Video sonuna kadar oynatılır.';
    const endInput = q('[data-video-end]'); endInput.placeholder = Number.isFinite(duration()) ? `Video sonu: ${duration().toFixed(1)} sn` : 'Video sonuna kadar';
  };
  const refreshFraming = () => {
    const c=current(); if(!c)return;
    const frame=frameFor(c), viewport=q('[data-video-stage]').dataset.viewport==='mobile'?'mobile':'desktop';
    const view=frame?.[viewport], size=selectedFrameSpec[viewport];
    if(size?.width>0&&size?.height>0)q('[data-video-stage]').style.aspectRatio=`${size.width} / ${size.height}`;
    video.style.objectPosition=view?`${view.x}% ${view.y}%`:c.focal||'center';
    video.style.transform=view?`scale(${view.zoom})`:'none';
    video.style.transformOrigin=view?`${view.x}% ${view.y}%`:'center';
    // External playback and timeline controls remain fixed outside the crop.
    if(view)video.removeAttribute('controls');else video.setAttribute('controls','');
    q('[data-video-action="reset-frame"]').disabled=!canEdit||!frame;
  };
  const refreshInspector = () => {
    const c = current(); if (!c) return;
    q('[data-video-selected-title]').textContent = clipName(c, selected, getMedia());
    q('[data-video-start]').value = String(c.start || 0); q('[data-video-end]').value = c.end === undefined ? '' : String(c.end);
    const options = [...q('[data-video-focal]').options].map(o => o.value); q('[data-video-focal]').value = frameFor(c)?'custom':options.includes(c.focal) ? c.focal : 'custom';
    refreshFraming();
    q('[data-video-cover]').innerHTML = mediaURL(c.poster) ? `<img src="${esc(mediaURL(c.poster))}" alt="Seçilen video kapağı">` : icon('image');
    video.poster = mediaURL(c.poster); refreshSummary();
  };
  const updateClock = () => {
    const position = Number.isFinite(video.currentTime) ? video.currentTime : 0, total = Number.isFinite(video.duration) ? video.duration : duration();
    q('[data-video-clock]').textContent = `${formatVideoTime(position)} / ${formatVideoTime(total)}`;
    const scrub = q('[data-video-scrub]'); scrub.disabled = !Number.isFinite(total) || uploading; if (Number.isFinite(total)) scrub.max = String(total); scrub.value = String(position);
    const c = current(); if (!c) return;
    const lengths = clips.map(item => {const end = item.end ?? durations.get(item.src);return Number.isFinite(end) ? Math.max(0,end - (item.start || 0)) : NaN;});
    const full = lengths.every(Number.isFinite) && lengths.reduce((a,b)=>a+b,0), end = c.end ?? total;
    const fraction = Number.isFinite(end) && end > (c.start || 0) ? Math.min(1,Math.max(0,(position - (c.start || 0)) / (end - (c.start || 0)))) : 0;
    q('[data-video-progress]').value = mode === 'sequence' ? (full ? (lengths.slice(0,selected).reduce((a,b)=>a+b,0) + fraction*lengths[selected])/full : (selected + fraction)/clips.length) : fraction;
    if (mode !== 'inspect') q('[data-video-progress-label]').textContent = mode === 'sequence' ? `Akış önizlemesi · ${selected + 1} / ${clips.length}. klip` : `Seçili bölüm · ${formatVideoTime(c.start || 0)} – ${formatVideoTime(end)}`;
  };
  const play = () => {wantPlay = true; const token=sourceToken;const result=video.play(); result?.catch(error => {if (!disposed && token===sourceToken && error.name!=='AbortError'){wantPlay=false;message('Oynatma başlayamadı. Videonun oynat düğmesine yeniden basın.',true);}});};
  const seek = position => {if (!Number.isFinite(position)) return;try {video.currentTime = Math.max(0,Math.min(position,Number.isFinite(video.duration)?video.duration:position));} catch {}};
  const select = (index, {playNow = false, preserveMode = false} = {}) => {
    if (index < 0 || index >= clips.length || disposed) return;
    video.pause(); selected = index; if (!preserveMode) mode = 'inspect'; wantPlay = playNow; corsFallback = false; sourceToken++;
    const c=current(); refreshList(); refreshInspector();
    q('[data-video-mode]').textContent = mode==='sequence' ? `Akış · ${selected + 1} / ${clips.length}` : 'Seçili klip';
    q('[data-video-progress-label]').textContent = mode==='inspect' ? 'Süreleri düzenleyin veya önizlemeyi başlatın.' : 'Video hazırlanıyor…';
    video.crossOrigin='anonymous'; video.src=mediaURL(c.src); video.load();
    q('[data-video-scrub]').disabled=true;
  };
  const commitTrim = (start, end) => {
    const error=validateClipTrim(start,end,duration());
    if(error){message(error,true);q('[data-video-start]').setAttribute('aria-invalid','true');q('[data-video-end]').setAttribute('aria-invalid','true');refreshInspector();return false;}
    q('[data-video-start]').removeAttribute('aria-invalid');q('[data-video-end]').removeAttribute('aria-invalid');
    const c=current();c.start=start;if(end===undefined)delete c.end;else c.end=end;
    mode='inspect';wantPlay=false;video.pause();save();refreshInspector();message('Klip süresi taslağa işlendi. “Bu klibi oynat” ile kontrol edebilirsiniz.');return true;
  };
  const fileCheck = (files, type) => {
    if(!files.length)throw Error('Önce bir dosya seçin.');
    for(const file of files){if(!((type==='video'?['video/mp4','video/webm']:['image/jpeg','image/png','image/webp','image/avif']).includes(file.type)))throw Error(type==='video'?'MP4 veya WebM video seçin.':'JPG, PNG, WebP veya AVIF görsel seçin.');if(file.size>50*1024*1024)throw Error('Her dosya en fazla 50 MB olabilir.');}
    if(type==='video'&&clips.length+files.length>12)throw Error('Bir akışa en fazla 12 klip ekleyebilirsiniz.');
  };
  const upload = async (files, type, done) => {
    if(uploading||!canUpload||!uploadMedia)return;
    try{fileCheck(files,type);}catch(error){report(error.message,true);return;}
    uploading=true;video.pause();wantPlay=false; const box=q('[data-video-upload-status]');box.hidden=false;q('[data-video-upload-progress]').removeAttribute('value');q('[data-video-upload-label]').textContent=`${files.length>1?files.length+' dosya':'Dosya'} yükleniyor…`;
    const controls=[...el.querySelectorAll('button,input,select')].map(control=>[control,control.disabled]);controls.forEach(([control])=>control.disabled=true);el.setAttribute('aria-busy','true');
    try{const records=await uploadMedia(files,{onProgress:progress=>{if(disposed)return;if(typeof progress==='number'){q('[data-video-upload-progress]').value=Math.max(0,Math.min(100,progress));q('[data-video-upload-label]').textContent=`Yükleniyor · %${Math.round(progress)}`;}else{const part=Number(progress?.index||0)+1,total=Number(progress?.total||files.length),phase=progress?.phase==='saving'?'Arşive kaydediliyor':progress?.phase==='done'?'Tamamlandı':'Yükleniyor';q('[data-video-upload-progress]').removeAttribute('value');q('[data-video-upload-label]').textContent=`${part} / ${total} · ${phase}${progress?.name?' · '+progress.name:''}`;}}});if(!disposed){if(!Array.isArray(records)||!records.length)throw Error('Yüklenen dosyanın medya kaydı alınamadı.');await done(records);}}
    catch(error){if(!disposed)report(error.message||'Yükleme tamamlanamadı. Yeniden deneyin.',true);}
    finally{uploading=false;if(!disposed){box.hidden=true;el.removeAttribute('aria-busy');controls.forEach(([control,wasDisabled])=>{if(control.isConnected)control.disabled=wasDisabled;});refreshList();updateClock();}}
  };
  const append = (records,frame) => {if(disposed||!canEdit)return;const start=clips.length;for(const record of records){if(clips.length>=12)break;const url=mediaURL(typeof record==='string'?record:record.url);if(!url)continue;const clip={id:'clip-'+crypto.randomUUID(),src:url,poster:'/assets/hero-poster.jpg',focal:'center',start:0};clips.push(clip);if(frame&&records.length===1)onFrameChange?.(clip,parseMediaFrame(frame,url));}if(clips.length===start)return;save();select(start);message('Yeni klip eklendi. Şimdi süresini, kadrajını ve kapağını seçebilirsiniz.');};
  const choose = (type,onSelect,options={}) => {if(uploading||!canEdit)return;video.pause();wantPlay=false;pickMedia?.({type,...(type==='video'?{spec:selectedFrameSpec}:{}),...options,onSelect:(url,record,frame)=>{if(!disposed)onSelect(typeof url==='string'?url:url?.url,record||url,frame);}});};
  const editFrame = () => {
    const clip=current();if(!clip)return;const id=clip.id,src=clip.src;
    choose('video',(_url,_record,frame)=>{const target=clips.find(item=>item.id===id&&item.src===src);if(!target)return;onFrameChange?.(target,parseMediaFrame(frame,src));refreshInspector();message('Masaüstü ve telefon kadrajı taslağa işlendi.');},{src,value:getFrame(clip),editOnly:true});
  };
  const setCover = (url,targetId=current()?.id) => {const target=clips.find(c=>c.id===targetId);if(!target||!mediaURL(url))return;target.poster=mediaURL(url);save();refreshInspector();message('Kapak görseli taslağa işlendi.');};
  const preview = all => {
    const validation=clips.map(c=>validateClipTrim(c.start||0,c.end,durations.get(c.src))).find(Boolean);
    if(validation){message(validation,true);return;}
    mode=all?'sequence':'clip';message(all?'Tüm klipler seçtiğiniz süre ve sırayla oynatılıyor.':'Yalnızca seçtiğiniz saniyeler oynatılıyor.');
    select(all?0:selected,{playNow:true,preserveMode:true});
  };
  const advance = () => {
    if(starting||mode==='inspect'||disposed)return;starting=true;
    if(mode==='sequence'&&selected<clips.length-1)select(selected+1,{playNow:true,preserveMode:true});
    else if(q('[data-video-loop]').checked){if(mode==='sequence')select(0,{playNow:true,preserveMode:true});else{seek(current().start||0);play();}}
    else{video.pause();wantPlay=false;message(mode==='sequence'?'Akış önizlemesi tamamlandı.':'Seçilen klip tamamlandı.');mode='inspect';}
    queueMicrotask(()=>starting=false);
  };
  on(video,'loadedmetadata',()=>{if(disposed||!current())return;if(Number.isFinite(video.duration)&&video.duration>0){durations.set(current().src,video.duration);q('[data-video-start]').max=String(Math.min(video.duration,36000));q('[data-video-end]').max=String(Math.min(video.duration,36000));}refreshSummary();const error=validateClipTrim(current().start||0,current().end,video.duration);if(error){wantPlay=false;message(error,true);}seek(current().start||0);updateClock();if(wantPlay)play();});
  const enforceTrim = () => {if(disposed||mode==='inspect'||video.paused||!current()||video.readyState<2)return;const c=current();if(video.currentTime<(c.start||0)-.025)seek(c.start||0);else if(c.end!==undefined&&video.currentTime>=c.end-.025)advance();};
  on(video,'timeupdate',()=>{updateClock();enforceTrim();});
  on(video,'seeked',enforceTrim);
  on(video,'pause',()=>{clearInterval(playbackTimer);playbackTimer=undefined;});
  on(video,'ended',advance);
  on(video,'error',()=>{if(disposed)return;if(!corsFallback){corsFallback=true;video.removeAttribute('crossorigin');video.load();message('Video önizlemesi açılıyor. Bu kaynağın JPG karesi için erişim izni gerekebilir.');}else{wantPlay=false;message('Video açılamadı. Dosyanın MP4/WebM olduğundan ve medya adresinin erişilebilir olduğundan emin olun.',true);}});
  on(video,'play',()=>{if(mode==='inspect'){mode='clip';q('[data-video-mode]').textContent='Seçili klip';}const c=current();if(c&&(video.currentTime<(c.start||0)||(c.end!==undefined&&video.currentTime>=c.end)))seek(c.start||0);clearInterval(playbackTimer);playbackTimer=setInterval(enforceTrim,40);});
  on(q('[data-video-scrub]'),'input',event=>{mode='inspect';wantPlay=false;video.pause();seek(Number(event.target.value));updateClock();});
  on(q('[data-video-start]'),'change',()=>commitTrim(Number(q('[data-video-start]').value),q('[data-video-end]').value===''?undefined:Number(q('[data-video-end]').value)));
  on(q('[data-video-end]'),'change',()=>commitTrim(Number(q('[data-video-start]').value),q('[data-video-end]').value===''?undefined:Number(q('[data-video-end]').value)));
  on(q('[data-video-focal]'),'change',event=>{if(!canEdit||event.target.value==='custom')return;current().focal=event.target.value;onFrameChange?.(current(),undefined);refreshFraming();save();});
  on(q('[data-video-upload]'),'change',event=>{const files=[...event.target.files];event.target.value='';const previousCount=clips.length;void upload(files,'video',append).then(()=>{if(!disposed&&files.length===1&&clips.length>previousCount)editFrame();});});
  on(q('[data-video-cover-upload]'),'change',event=>{const files=[...event.target.files];event.target.value='';void upload(files,'image',records=>setCover(records[0].url));});
  on(el,'click',async event=>{
    const viewportButton=event.target.closest('[data-video-viewport]');if(viewportButton){q('[data-video-stage]').dataset.viewport=viewportButton.dataset.videoViewport;for(const b of el.querySelectorAll('[data-video-viewport]'))b.setAttribute('aria-pressed',String(b===viewportButton));refreshFraming();return;}
    const selectButton=event.target.closest('[data-video-select]');if(selectButton){if(!uploading)select(Number(selectButton.dataset.videoSelect));return;}
    const moveButton=event.target.closest('[data-video-move]');if(moveButton){if(!canEdit||uploading||moveButton.disabled)return;const [i,offset]=moveButton.dataset.videoMove.split('|').map(Number),to=i+offset;if(to<0||to>=clips.length)return;const id=current().id;const [item]=clips.splice(i,1);clips.splice(to,0,item);selected=clips.findIndex(c=>c.id===id);save();message('Klip sırası güncellendi.');return;}
    const removeButton=event.target.closest('[data-video-remove]');if(removeButton){if(!canEdit||uploading||clips.length<=1)return;const i=Number(removeButton.dataset.videoRemove),id=current().id;onFrameChange?.(clips[i],undefined);clips.splice(i,1);selected=Math.max(0,clips.findIndex(c=>c.id===id));save();select(selected);message('Klip akıştan kaldırıldı. Arşivdeki video korunuyor.');return;}
    const button=event.target.closest('[data-video-action]');if(!button||button.disabled||uploading)return;
    switch(button.dataset.videoAction){
      case 'add-library':choose('video',(url,record,frame)=>append([record?.url?record:{url}],frame));break;
      case 'add-upload':q('[data-video-upload]').click();break;
      case 'replace-library':{const id=current()?.id;choose('video',(url,_record,frame)=>{const target=clips.find(item=>item.id===id);if(!target||!mediaURL(url))return;target.src=mediaURL(url);target.start=0;delete target.end;onFrameChange?.(target,parseMediaFrame(frame,url));save();select(clips.indexOf(target));message('Video değiştirildi. Süreyi, kadrajı ve kapağı kontrol edin.');});break;}
      case 'edit-frame':editFrame();break;
      case 'reset-frame':onFrameChange?.(current(),undefined);refreshInspector();message('Özel kadraj kaldırıldı. Varsayılan görüntü konumu kullanılıyor.');break;
      case 'cover-library':choose('image',url=>setCover(url));break;
      case 'cover-upload':q('[data-video-cover-upload]').click();break;
      case 'preview-clip':preview(false);break;
      case 'preview-all':preview(true);break;
      case 'next':select((selected+1)%clips.length,{playNow:!video.paused,preserveMode:mode==='sequence'});break;
      case 'stop':mode='inspect';wantPlay=false;video.pause();message('Önizleme duraklatıldı. İsterseniz bu kareyi kapak olarak seçebilirsiniz.');break;
      case 'mark-start':commitTrim(Math.round(video.currentTime*10)/10,current().end);break;
      case 'mark-end':commitTrim(current().start||0,Math.round(video.currentTime*10)/10);break;
      case 'reset-trim':commitTrim(0,undefined);seek(0);break;
      case 'capture-cover':{
        if(!canUpload||video.readyState<2||!video.videoWidth||video.seeking){message('Önce videonun yüklenmesini bekleyin ve bir karede durdurun.',true);break;}
        mode='inspect';wantPlay=false;video.pause();
        try{const targetId=current().id,canvas=document.createElement('canvas'),scale=Math.min(1,4096/Math.max(video.videoWidth,video.videoHeight));canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);const blob=await new Promise((resolve,reject)=>{try{canvas.toBlob(value=>value?resolve(value):reject(Error('JPG karesi oluşturulamadı.')),'image/jpeg',.94);}catch(error){reject(error);}});if(disposed)return;const file=new File([blob],`video-kapak-${Math.round(video.currentTime*1000)}.jpg`,{type:'image/jpeg'});await upload([file],'image',records=>{setCover(records[0].url,targetId);report('JPG kapak oluşturuldu ve medya arşivine eklendi.');});}
        catch(error){report(error.name==='SecurityError'?'Bu dış kaynaktan kare alınamıyor. Videoyu medya arşivine yükleyerek tekrar deneyin veya bir kapak görseli yükleyin.':error.message||'Kapak oluşturulamadı.',true);}break;
      }
    }
  });
  if(clips.length)select(0);
  return ()=>{disposed=true;sourceToken++;clearInterval(playbackTimer);cleanups.forEach(fn=>fn());video.pause();video.removeAttribute('src');video.load();};
}
