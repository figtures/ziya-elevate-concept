/** Native-only playback for the inert-script draft iframe. No page code is executed. */
export function wirePageVideoPreview(frameDocument) {
  if (!frameDocument?.body) return () => {};
  const document = frameDocument, view = document.defaultView || globalThis;
  const releases = [], allVideos = [...document.querySelectorAll('video')];
  let disposed = false;
  const on = (target, event, listener) => {
    target.addEventListener(event, listener);
    releases.push(() => target.removeEventListener(event, listener));
  };
  const safeSource = value => {
    const source = String(value || '');
    if (/^\/(?!\/)/.test(source) && !/[\\\u0000-\u0020]/.test(source)) return source;
    try { return new URL(source).protocol === 'https:' ? source : ''; } catch { return ''; }
  };
  // A preview never boots YouTube or any other embedded player.
  document.querySelectorAll('iframe,#tedxHeroPlayer').forEach(node => node.remove());
  const style = document.createElement('style');
  style.textContent = `
    .cms-page-video-preview {pointer-events:none!important}
    .cms-page-video-preview .hero-vid {z-index:0!important;pointer-events:none!important}
    .cms-page-video-preview video {pointer-events:auto!important;transform:none!important}
    .cms-page-video-preview .video-toggle {display:none!important}
    .cms-page-video-preview .hero-bottom-line {pointer-events:none!important}
    .cms-page-video-preview-status {position:absolute!important;left:24px!important;right:24px!important;bottom:55px!important;z-index:5!important;width:max-content!important;max-width:calc(100% - 48px)!important;margin:0!important;padding:7px 11px!important;border-radius:10px!important;background:#111c33df!important;color:#fff!important;font:500 12px/1.5 sans-serif!important;pointer-events:none!important}
  `;
  document.head.append(style);
  releases.push(() => style.remove());
  const grouped = new Set(), groups = [];
  for (const host of document.querySelectorAll('.hero-vid,[data-tedx-hero],[data-video-sequence]')) {
    const videos = [...host.querySelectorAll('video')].filter(video => !grouped.has(video));
    if (videos.length) {videos.forEach(video => grouped.add(video)); groups.push({host, videos});}
  }
  for (const video of allVideos) if (!grouped.has(video)) groups.push({host: video.parentElement, videos: [video]});

  for (const {host, videos} of groups) {
    const section = host.closest('section') || host;
    section.classList.add('cms-page-video-preview');
    host.removeAttribute('aria-hidden');
    host.classList.remove('tedx-playing');
    const status = document.createElement('p');
    status.className = 'cms-page-video-preview-status';
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    host.append(status);
    releases.push(() => {status.remove(); section.classList.remove('cms-page-video-preview');});
    const sources = videos.map(video => safeSource(video.dataset.src || video.getAttribute('src')));
    const unavailable = new Set(), needsSeek = new Set(videos), ignoredPauses = new WeakMap();
    const pauseInternal = video => {
      if (!video.paused) {ignoredPauses.set(video, (ignoredPauses.get(video) || 0) + 1); video.pause();}
    };
    let active = 0, wantPlay = false, changing = false, timer;
    const startOf = video => Math.max(0, Number(video.dataset.clipStart ?? video.dataset.startAt) || 0);
    const endOf = video => {
      const selected = Number(video.dataset.clipEnd);
      return Math.min(selected > 0 ? selected : Infinity, Number.isFinite(video.duration) ? video.duration : Infinity);
    };
    const say = text => {if (!disposed) status.textContent = text;};
    const stopTimer = () => {if (timer) view.clearInterval(timer); timer = undefined;};
    const watch = () => {
      stopTimer();
      if (disposed || !wantPlay || document.hidden) return;
      timer = view.setInterval(() => {
        const video = videos[active];
        if (!needsSeek.has(video) && !video.seeking && !video.paused && video.currentTime >= endOf(video)) advance();
      }, 40);
    };
    const description = () => `Klip ${active + 1} / ${videos.length} · ${startOf(videos[active]).toLocaleString('tr-TR')} sn’den itibaren`;
    const prepare = () => {
      if (disposed || unavailable.has(active)) return;
      const video = videos[active];
      if (video.readyState < 1) return;
      if (needsSeek.has(video)) {
        if (startOf(video) >= endOf(video)) {fail(active, 'Seçilen başlangıç, video süresinin dışında.'); return;}
        needsSeek.delete(video);
        if (Math.abs(video.currentTime - startOf(video)) > .01) {
          try {video.currentTime = startOf(video);} catch {fail(active, 'Seçilen saniyeye gidilemedi.'); return;}
        }
      }
      if (video.seeking) return;
      if (wantPlay && !document.hidden && video.paused) {
        video.play()?.catch(error => {
          if (disposed || video !== videos[active] || error.name === 'AbortError') return;
          wantPlay = false; stopTimer(); say('Oynat düğmesine basarak önizlemeyi başlatın.');
        });
      } else if (!wantPlay) say(`${description()} · Oynat düğmesiyle önizleyin`);
    };
    const select = (index, play) => {
      if (disposed) return;
      changing = true; wantPlay = play; active = index; stopTimer();
      videos.forEach((video, i) => {
        pauseInternal(video);
        video.classList.toggle('is-active', i === active);
        video.style.setProperty('visibility', i === active ? 'visible' : 'hidden', 'important');
        video.style.setProperty('opacity', i === active ? '1' : '0', 'important');
        video.controls = i === active;
        video.setAttribute('tabindex', i === active ? '0' : '-1');
        video.setAttribute('aria-hidden', String(i !== active));
        video.preload = i === active ? 'metadata' : 'none';
      });
      const video = videos[active]; needsSeek.add(video);
      host.dataset.previewClipIndex = String(active);
      say(`${description()} · Hazırlanıyor…`);
      changing = false;
      if (!sources[active]) {fail(active, 'Video adresi geçerli değil.'); return;}
      if (!video.hasAttribute('src')) {video.setAttribute('src', sources[active]); video.load();}
      prepare();
    };
    const advance = () => {
      if (disposed || changing) return;
      const next = videos.findIndex((_, offset) => !unavailable.has((active + offset + 1) % videos.length));
      if (next < 0) {wantPlay = false;stopTimer();say('Videolar açılamadı. Medya dosyalarını ve seçilen süreleri kontrol edin.');return;}
      select((active + next + 1) % videos.length, wantPlay);
    };
    const fail = (index, message) => {
      if (disposed || unavailable.has(index)) return;
      unavailable.add(index); changing = true; pauseInternal(videos[index]); changing = false;
      if (index === active) {say(message); advance();}
    };
    videos.forEach((video, index) => {
      video.pause(); video.muted = true; video.defaultMuted = true; video.playsInline = true; video.loop = false;
      video.removeAttribute('autoplay'); video.removeAttribute('loop'); video.removeAttribute('src');
      video.querySelectorAll('source').forEach(source => source.removeAttribute('src'));
      video.preload = 'none'; video.load();
      on(video, 'loadedmetadata', () => {if (index === active) prepare();});
      on(video, 'seeked', () => {if (index === active) prepare();});
      on(video, 'play', () => {
        if (disposed || index !== active) {pauseInternal(video); return;}
        wantPlay = true;
        if (video.currentTime < startOf(video) || video.currentTime >= endOf(video)) {needsSeek.add(video); prepare();}
        say(`${description()} · Akış önizleniyor`); watch();
      });
      on(video, 'pause', () => {
        const ignored = ignoredPauses.get(video) || 0;
        if (ignored) {ignoredPauses.set(video, ignored - 1); return;}
        if (!disposed && index === active && !changing && !document.hidden && !video.ended && video.currentTime < endOf(video)) {
          wantPlay = false; stopTimer(); say(`${description()} · Duraklatıldı`);
        }
      });
      on(video, 'timeupdate', () => {
        if (!disposed && index === active && wantPlay && !video.paused && !video.seeking && !needsSeek.has(video) && video.currentTime >= endOf(video)) advance();
      });
      on(video, 'ended', () => {if (!disposed && index === active && !needsSeek.has(video)) advance();});
      on(video, 'error', () => fail(index, 'Video yüklenemedi.'));
    });
    on(document, 'visibilitychange', () => {
      if (document.hidden) {videos.forEach(pauseInternal); stopTimer();}
      else if (wantPlay) {prepare(); watch();}
    });
    releases.push(stopTimer);
    select(0, false);
  }
  return () => {
    if (disposed) return;
    disposed = true;
    releases.splice(0).reverse().forEach(release => release());
    allVideos.forEach(video => {
      video.pause(); video.removeAttribute('src'); video.preload = 'none';
      video.querySelectorAll('source').forEach(source => source.removeAttribute('src'));
      video.load();
    });
  };
}
