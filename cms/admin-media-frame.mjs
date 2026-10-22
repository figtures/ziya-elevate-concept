/** Per-placement framing; selecting a crop never changes the original media file. */
import iconNodes from './icon-nodes.json' with {type: 'json'};

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const symbol = name => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconNodes[name] || iconNodes.image}</svg>`;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mediaURL = value => {
  const src = String(value || '').trim();
  if (/^\/(?!\/)/.test(src) && !/[\\\u0000-\u0020]/.test(src)) return src;
  try { return new URL(src).protocol === 'https:' ? src : ''; } catch { return ''; }
};
const fresh = () => ({x:50,y:50,zoom:1});
const profile = value => ({
  x: Number.isFinite(value?.x) ? clamp(value.x,0,100) : 50,
  y: Number.isFinite(value?.y) ? clamp(value.y,0,100) : 50,
  zoom: Number.isFinite(value?.zoom) ? clamp(value.zoom,1,3) : 1
});
const framing = (value, src) => {
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { value = null; } }
  if (value?.src && value.src !== src) value = null;
  return {v:1,src,desktop:profile(value?.desktop),mobile:profile(value?.mobile ?? value?.desktop)};
};
const dimensions = (value, fallback) => ({width:Number.isFinite(value?.width) && value.width > 0 ? clamp(value.width,1,10000) : fallback.width,height:Number.isFinite(value?.height) && value.height > 0 ? clamp(value.height,1,10000) : fallback.height});
const specification = spec => ({label:String(spec?.label || 'Seçili medya alanı'),note:String(spec?.note || ''),singleViewport:spec?.singleViewport===true,desktop:dimensions(spec?.desktop,{width:1600,height:900}),mobile:dimensions(spec?.mobile,{width:390,height:600})});
const time = value => Number.isFinite(value) ? `${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}` : '0:00';
let editorSequence = 0;

export function renderMediaFrameEditor({src,kind='image',spec,value,icon=symbol} = {}) {
  const safeSrc=mediaURL(src), video=kind==='video', id=`media-frame-${++editorSequence}`, target=specification(spec), data=framing(value,safeSrc);
  const range=(key,label,min,max,step,suffix)=>`<label class="media-frame-range" for="${id}-${key}"><span>${label}<output data-frame-output="${key}" for="${id}-${key}">${data.desktop[key]}${suffix}</output></span><input id="${id}-${key}" data-frame-range="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${data.desktop[key]}" disabled></label>`;
  return `<section class="media-frame-editor" data-media-frame-editor>
    <div class="media-frame-heading"><div><p class="media-frame-eyebrow">KADRAJ AYARI</p><h3>${esc(target.label)}</h3><p>Görünmesini istediğiniz alanı sürükleyin veya aşağıdaki ayarları kullanın.</p></div><span class="badge draft">Taslak</span></div>
    <div class="media-frame-layout"><div class="media-frame-preview-column">
      <div class="media-frame-viewports" role="group" aria-label="Kadrajın kullanılacağı ekran"${target.singleViewport?' hidden':''}><button type="button" data-frame-viewport="desktop" aria-pressed="true">${icon('monitor')}<span>Masaüstü</span></button><button type="button" data-frame-viewport="mobile" aria-pressed="false">${icon('smartphone')}<span>Telefon</span></button></div>
      <div class="media-frame-preview-surround"><div class="media-frame-stage" data-frame-stage data-viewport="desktop" tabindex="0" role="group" aria-label="Kadraj önizlemesi. Görüntüyü sürükleyin veya yön tuşlarıyla konumlandırın." aria-describedby="${id}-help" style="aspect-ratio:${target.desktop.width}/${target.desktop.height}">
        ${video ? `<video data-frame-media playsinline muted preload="metadata"${safeSrc?` src="${esc(safeSrc)}"`:''} aria-label="Video kadraj önizlemesi"></video>` : `<img data-frame-media${safeSrc?` src="${esc(safeSrc)}"`:''} alt="Seçilen görselin kadraj önizlemesi" draggable="false" decoding="async">`}
        <span class="media-frame-grid" aria-hidden="true"></span><span class="media-frame-loading" data-frame-loading>${icon(video?'play':'image')}<span>Medya yükleniyor…</span></span>
      </div></div>
      <div class="media-frame-dimensions"><strong data-frame-ratio></strong><span data-frame-source-size>Kaynak boyutu okunuyor…</span></div>
      ${video?`<div class="media-frame-video-tools"><button type="button" class="button quiet" data-frame-play disabled aria-label="Önizlemeyi oynat">${icon('play')}<span data-frame-play-label>Oynat</span></button><label class="media-frame-video-scrub" for="${id}-time"><span class="media-frame-sr-only">Önizleme zamanı</span><input id="${id}-time" data-frame-time type="range" min="0" max="1" step="0.1" value="0" disabled></label><output data-frame-clock>0:00 / 0:00</output></div><p class="media-frame-video-note">Burada kare seçmek klibin başlangıç ve bitiş saniyesini değiştirmez.</p>`:''}
      <p id="${id}-help" class="media-frame-help">Kadrajın oranı seçili alana göre sabittir.${target.singleViewport?'':' Masaüstü ve telefon için ayrı konumlar seçebilirsiniz.'}</p>
      ${target.note?`<p class="media-frame-help">${esc(target.note)}</p>`:''}
    </div><div class="media-frame-adjustments"><div><p class="media-frame-eyebrow" data-frame-current-label>MASAÜSTÜ KADRAJI</p><h4>Görünümü ayarlayın</h4></div>
      ${range('zoom','Yakınlaştırma',1,3,.01,'×')}${range('x','Yatay konum',0,100,.1,'%')}${range('y','Dikey konum',0,100,.1,'%')}
      <p class="media-frame-quality" data-frame-quality>Yakınlaştırmak görünür alanı daraltır; dosyanın çözünürlüğünü artırmaz.</p>
      <div class="media-frame-reset-actions"><button type="button" class="button quiet" data-frame-reset="current">${icon('rotate-ccw')}Bu kadrajı sıfırla</button><button type="button" class="button quiet small" data-frame-reset="both"${target.singleViewport?' hidden':''}>İki ekranı da sıfırla</button><button type="button" class="button quiet small" data-frame-original>Orijinal yerleşimi kullan</button></div>
    </div></div>
    <p class="media-frame-status" data-frame-status role="status" aria-live="polite">Medya yüklendiğinde kadrajı ayarlayabilirsiniz.</p>
    <footer class="media-frame-footer"><p>Orijinal dosya korunur. Ayarlar yalnızca bu alana uygulanır.</p><div><button type="button" class="button quiet" data-frame-cancel>Vazgeç</button><button type="button" class="button primary" data-frame-apply disabled>Kadrajı uygula</button></div></footer>
  </section>`;
}

export function wireMediaFrameEditor(root,{src,kind='image',spec,value,onApply,onCancel} = {}) {
  const el=root.matches?.('[data-media-frame-editor]') ? root : root.querySelector('[data-media-frame-editor]');
  if(!el)return ()=>{};
  const q=selector=>el.querySelector(selector), stage=q('[data-frame-stage]'), media=q('[data-frame-media]'), video=kind==='video', target=specification(spec), safeSrc=mediaURL(src);
  let data=framing(value,safeSrc), viewport='desktop', ready=false, disposed=false, saving=false, sourceWidth=0, sourceHeight=0, drag=null;
  const cleanups=[], on=(node,event,fn)=>{node?.addEventListener(event,fn);cleanups.push(()=>node?.removeEventListener(event,fn));};
  const current=()=>data[viewport];
  const status=(message,bad=false)=>{if(disposed)return;q('[data-frame-status]').textContent=message;q('[data-frame-status]').dataset.tone=bad?'error':'info';};
  const enable=allowed=>{ready=allowed;for(const input of el.querySelectorAll('[data-frame-range],[data-frame-apply],[data-frame-play]'))input.disabled=!allowed;stage.setAttribute('aria-disabled',String(!allowed));};
  const refresh=()=>{
    const p=current(), d=target[viewport];stage.dataset.viewport=viewport;stage.style.aspectRatio=`${d.width} / ${d.height}`;
    media.style.objectFit='cover';media.style.objectPosition=`${p.x}% ${p.y}%`;media.style.transformOrigin=`${p.x}% ${p.y}%`;media.style.transform=`scale(${p.zoom})`;
    for(const input of el.querySelectorAll('[data-frame-range]')){const key=input.dataset.frameRange;input.value=String(p[key]);q(`[data-frame-output="${key}"]`).textContent=key==='zoom'?`${p.zoom.toFixed(2)}×`:`${Math.round(p[key])}%`;}
    for(const button of el.querySelectorAll('[data-frame-viewport]'))button.setAttribute('aria-pressed',String(button.dataset.frameViewport===viewport));
    q('[data-frame-current-label]').textContent=target.singleViewport?'SEÇİLİ ALANIN KADRAJI':viewport==='desktop'?'MASAÜSTÜ KADRAJI':'TELEFON KADRAJI';
    q('[data-frame-ratio]').textContent=`${target.singleViewport?'':(viewport==='desktop'?'Masaüstü':'Telefon')+' · '}${Math.round(d.width)} × ${Math.round(d.height)} oranı`;
    const cover=sourceWidth&&sourceHeight?Math.max(d.width/sourceWidth,d.height/sourceHeight)*p.zoom:0;
    q('[data-frame-quality]').textContent=cover>1.05?'Bu kadrajda kaynak görüntü büyütülüyor. Daha net sonuç için daha yüksek çözünürlüklü bir dosya seçin.':'Yakınlaştırmak görünür alanı daraltır; dosyanın çözünürlüğünü artırmaz.';
    q('[data-frame-quality]').dataset.tone=cover>1.05?'warning':'info';
  };
  const clock=()=>{if(!video)return;const duration=Number.isFinite(media.duration)?media.duration:0;q('[data-frame-clock]').textContent=`${time(media.currentTime)} / ${time(duration)}`;const slider=q('[data-frame-time]');slider.disabled=!ready||!duration;slider.max=String(duration||1);slider.value=String(media.currentTime||0);};
  const loaded=()=>{
    if(disposed)return;sourceWidth=video?media.videoWidth:media.naturalWidth;sourceHeight=video?media.videoHeight:media.naturalHeight;
    if(!sourceWidth||!sourceHeight)return;
    q('[data-frame-loading]').hidden=true;q('[data-frame-source-size]').textContent=`Kaynak: ${sourceWidth} × ${sourceHeight} px`;enable(true);refresh();clock();status('Görüntüyü sürükleyerek kadrajı seçin. Değişiklikler “Kadrajı uygula” ile taslağa işlenir.');
  };
  const failed=()=>{if(disposed)return;enable(false);q('[data-frame-loading]').hidden=true;status('Medya açılamadı. Dosyanın adresini ve erişimini kontrol edin; farklı bir dosya da seçebilirsiniz.',true);};
  on(media,video?'loadedmetadata':'load',loaded);on(media,'error',failed);
  on(el,'input',event=>{
    if(!ready||saving)return;
    const key=event.target.dataset.frameRange;
    if(['x','y','zoom'].includes(key)){const n=Number(event.target.value);if(Number.isFinite(n)){current()[key]=clamp(n,key==='zoom'?1:0,key==='zoom'?3:100);refresh();}}
    if(video&&event.target.hasAttribute('data-frame-time')){media.pause();media.currentTime=Number(event.target.value);clock();}
  });
  const apply=async frame=>{
    if(saving||disposed)return;
    saving=true;media.pause?.();const controls=[...el.querySelectorAll('button,input')].map(node=>[node,node.disabled]);controls.forEach(([node])=>node.disabled=true);el.setAttribute('aria-busy','true');status('Kadraj uygulanıyor…');
    try{await onApply?.(frame);if(!disposed)status(frame?'Kadraj taslağa uygulandı.':'Orijinal yerleşim taslağa uygulandı.');}
    catch(error){if(!disposed)status(error?.message||'Kadraj uygulanamadı. Yeniden deneyin.',true);}
    finally{saving=false;if(!disposed){el.removeAttribute('aria-busy');controls.forEach(([node,disabled])=>node.disabled=disabled);}}
  };
  on(el,'click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled||!el.contains(button))return;
    if(button.dataset.frameViewport){viewport=button.dataset.frameViewport;refresh();}
    if(button.hasAttribute('data-frame-reset')){if(button.dataset.frameReset==='both'){data.desktop=fresh();data.mobile=fresh();}else data[viewport]=fresh();refresh();status(button.dataset.frameReset==='both'?'Masaüstü ve telefon kadrajları sıfırlandı.':'Seçili ekranın kadrajı sıfırlandı.');}
    if(button.hasAttribute('data-frame-apply')&&ready)void apply(structuredClone(data));
    if(button.hasAttribute('data-frame-original'))void apply(null);
    if(button.hasAttribute('data-frame-cancel')){media.pause?.();onCancel?.();}
    if(button.hasAttribute('data-frame-play')&&ready){if(media.paused){const result=media.play();result?.catch(()=>status('Önizleme başlayamadı. Oynat düğmesini yeniden deneyin.',true));}else media.pause();}
  });
  const stopDrag=()=>{if(!drag)return;try{stage.releasePointerCapture?.(drag.id);}catch{}drag=null;stage.classList.remove('is-dragging');};
  on(stage,'pointerdown',event=>{
    if(!ready||saving||(event.button!==undefined&&event.button!==0)||event.isPrimary===false)return;
    const rect=stage.getBoundingClientRect();if(!rect.width||!rect.height)return;
    event.preventDefault();stage.focus({preventScroll:true});media.pause?.();drag={id:event.pointerId,x:event.clientX,y:event.clientY,profile:{...current()},width:rect.width,height:rect.height};
    try{stage.setPointerCapture?.(event.pointerId);}catch{}stage.classList.add('is-dragging');
  });
  on(stage,'pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;event.preventDefault();const baseScale=Math.max(drag.width/sourceWidth,drag.height/sourceHeight), horizontal=sourceWidth*baseScale*drag.profile.zoom-drag.width,vertical=sourceHeight*baseScale*drag.profile.zoom-drag.height;
    const p=current();p.x=horizontal>.1?clamp(drag.profile.x-(event.clientX-drag.x)*100/horizontal,0,100):drag.profile.x;p.y=vertical>.1?clamp(drag.profile.y-(event.clientY-drag.y)*100/vertical,0,100):drag.profile.y;refresh();
  });
  on(stage,'pointerup',stopDrag);on(stage,'pointercancel',stopDrag);on(stage,'lostpointercapture',()=>{drag=null;stage.classList.remove('is-dragging');});
  on(stage,'keydown',event=>{
    if(!ready||saving||event.altKey||event.ctrlKey||event.metaKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();const p=current(), step=event.shiftKey?5:1,key=['ArrowLeft','ArrowRight'].includes(event.key)?'x':'y';p[key]=clamp(p[key]+(['ArrowLeft','ArrowUp'].includes(event.key)?-step:step),0,100);refresh();
  });
  if(video){
    const playback=()=>{const paused=media.paused;q('[data-frame-play-label]').textContent=paused?'Oynat':'Duraklat';q('[data-frame-play]').setAttribute('aria-label',paused?'Önizlemeyi oynat':'Önizlemeyi duraklat');q('[data-frame-play] svg').outerHTML=symbol(paused?'play':'pause');};
    on(media,'timeupdate',clock);on(media,'durationchange',clock);on(media,'play',playback);on(media,'pause',playback);on(media,'ended',playback);
  }
  refresh();enable(false);
  if(!safeSrc)failed();else if(video?media.readyState>=1:media.complete){if(!video&&!media.naturalWidth)failed();else loaded();}
  return ()=>{disposed=true;stopDrag();cleanups.forEach(fn=>fn());if(video){media.pause();media.removeAttribute('src');media.load();}};
}
