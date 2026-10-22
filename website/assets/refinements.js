(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const videos = [...document.querySelectorAll('video:not([data-tedx-fallback])')];
  const state = new Map(videos.map(video => [video, { visible: false, manualPause: reduced }]));
  const label = video => {
    const button = video.closest('section')?.querySelector('.video-toggle');
    if (!button || !video.hasAttribute('data-cinematic')) return;
    button.querySelector('use')?.setAttribute('href', '/assets/icons.svg#' + (video.paused ? 'play' : 'pause'));
    const text = button.querySelector('.control-label');
    if (text) text.textContent = video.paused ? (button.dataset.playLabel ?? 'Videoyu oynat') : (button.dataset.pauseLabel ?? 'Videoyu duraklat');
    button.setAttribute('aria-label', video.paused ? (button.dataset.playLabel ?? 'Videoyu oynat') : (button.dataset.pauseLabel ?? 'Videoyu duraklat'));
  };
  const update = video => {
    const s = state.get(video);
    if (s.visible && !s.manualPause && !document.hidden && !document.querySelector('dialog[open]') && !document.body.classList.contains('menu-open')) video.play().catch(() => label(video));
    else video.pause();
    label(video);
  };
  const contactFloat = document.querySelector('.ask-ziya');
  const updateContact = () => {
    if (contactFloat) contactFloat.hidden = videos.some(v => v.hasAttribute('data-cinematic') && state.get(v).visible) || !!document.querySelector('[data-cinematic-visible="true"]');
  };
  document.addEventListener('cinematicvisibility', updateContact);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {state.get(entry.target).visible = entry.isIntersecting;update(entry.target);});
    updateContact();
  }, { threshold: 0.08 });
  videos.forEach(video => {
    video.muted = true;video.defaultMuted = true;video.playsInline = true;
    if (reduced) {video.removeAttribute('autoplay');video.pause();}
    if (video.dataset.startAt) {
      const begin = () => {video.currentTime = Math.min(Number(video.dataset.startAt), Math.max(0, video.duration - .25));};
      if (video.readyState >= 1) begin();
      else video.addEventListener('loadedmetadata', begin, {once:true});
    }
    video.addEventListener('loadeddata', () => update(video));
    video.addEventListener('play', () => label(video));
    video.addEventListener('pause', () => label(video));
    observer.observe(video);
    if (video.hasAttribute('data-cinematic')) video.closest('section')?.querySelector('.video-toggle')?.addEventListener('click', () => {
      state.get(video).manualPause = !video.paused;update(video);
    });
  });
  document.addEventListener('visibilitychange', () => videos.forEach(update));
  new MutationObserver(() => videos.forEach(update)).observe(document.body,{attributes:true,attributeFilter:['class']});
  const dialog = document.getElementById('talkDialog');
  if (dialog) {
    document.querySelectorAll('[data-talk]').forEach(button => button.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + button.dataset.talk + '?autoplay=1&rel=0&enablejsapi=1';
      iframe.title = document.getElementById('talkTitle')?.textContent || 'Ziya Şakir Yılmaz · TEDxReset konuşması';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen = true;
      document.getElementById('talkPlayer').replaceChildren(iframe);
      if(window.ZiyaMotion)window.ZiyaMotion.openDialog(dialog);else dialog.showModal();videos.forEach(update);
    }));
    const closeTalk=()=>window.ZiyaMotion?window.ZiyaMotion.closeDialog(dialog):dialog.close();
    dialog.querySelector('.talk-close').addEventListener('click', closeTalk);
    dialog.addEventListener('click', e => {if (e.target === dialog) closeTalk();});
    // Pause audio immediately while retaining the film frame through the fade.
    dialog.addEventListener('ziya:dialog-closing',()=>document.querySelector('#talkPlayer iframe')?.contentWindow?.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),'https://www.youtube-nocookie.com'));
    dialog.addEventListener('close', () => {document.getElementById('talkPlayer').replaceChildren();videos.forEach(update);});
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {document.querySelector('.nav-links')?.classList.remove('open');document.querySelector('.hamb')?.setAttribute('aria-expanded', 'false');document.querySelector('.hamb')?.setAttribute('aria-label', document.documentElement.lang==='en'?'Open navigation':'Menüyü aç');document.querySelector('.hamb use')?.setAttribute('href','/assets/icons.svg#menu');}
  });
  const form = document.getElementById('contactForm');
  if (form) {
    let content={};try{content=JSON.parse(document.getElementById('cms-contact-content')?.textContent||'{}');}catch{}
    const phone=/^\d{7,15}$/.test(content.phone||'')?content.phone:'905326467755';
    const topic = document.getElementById('konu');const query = new URLSearchParams(location.search).get('konu');
    if ([...topic.options].some(o => o.value === query)) topic.value = query;
    if (query === 'tani' || query?.startsWith('kurumsal-')) topic.value = 'kurumsal';
    let extraReady=false;
    const extra = () => {
      const corporate=['kurumsal','konusmaci'].includes(topic.value),keynote=topic.value==='konusmaci';
      for(const [id,show] of [['kurumsalExtra',corporate],['keynoteExtra',keynote]]){
        const group=document.getElementById(id);if(!group)continue;
        if(window.ZiyaMotion)window.ZiyaMotion.animateVisibility(group,show,{kind:'collapse',instant:!extraReady});else group.hidden=!show;
        group.querySelectorAll('input,select').forEach(input=>{input.disabled=!show;});
      }
      const company=document.getElementById('firma');if(company)company.required=corporate;
      extraReady=true;
    };
    topic.addEventListener('change', extra);extra();
    form.addEventListener('submit', e => {
      e.preventDefault();if (!form.reportValidity()) return;
      const val = id => document.getElementById(id)?.value.trim()||'';
      const lines = [content.greeting ?? 'Merhaba Ziya Bey,', '', topic.selectedOptions[0].text, '', 'Ad Soyad: '+val('ad'), 'E-posta: '+val('ep')];
      if (['kurumsal','konusmaci'].includes(topic.value)) {if (val('firma')) lines.push('Firma: '+val('firma'));if (val('ekip')) lines.push('Ekip: '+val('ekip'));}
      if(val('telefon'))lines.push('Telefon: '+val('telefon'));if(val('sehir'))lines.push('Şehir: '+val('sehir'));
      if(topic.value==='konusmaci'){if(val('etkinlik-tarihi'))lines.push('Etkinlik tarihi: '+val('etkinlik-tarihi'));const people=document.getElementById('katilimci-sayisi');if(people?.value)lines.push('Katılımcı sayısı: '+people.selectedOptions[0].text);}
      lines.push('',val('mesaj'));const message = lines.join('\n');
      document.getElementById('preparedMessage').textContent = message;
      document.getElementById('sendWhatsApp').href = 'https://wa.me/'+phone+'?text='+encodeURIComponent(message);
      const preview = document.getElementById('contactPreview');
      const en=form.dataset.language==='en';preview.querySelector('h3').textContent=en?'Your message is ready.':'Mesajınız hazır.';preview.querySelector('p').textContent=en?'Your inquiry has not been sent yet. Review and send it on WhatsApp.':'Talebiniz henüz gönderilmedi. WhatsApp’ta kontrol edip gönderin.';
      preview.hidden = false;preview.scrollIntoView({behavior:'smooth',block:'center'});
    });
  }
})();
