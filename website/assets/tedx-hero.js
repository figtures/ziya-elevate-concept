/* CMS video sequences: trimmed native clips; the home TEDx introduction plays once. */
(() => {
  'use strict';
  const host = document.querySelector('[data-tedx-hero],[data-video-sequence]');
  if (!host) return;
  const section = host.closest('section');
  const videos = [...host.querySelectorAll('[data-hero-clip]')];
  if (!videos.length || !section) return;
  const hasIntro = host.hasAttribute('data-tedx-hero');
  const button = section.querySelector('.video-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const intro = {videoId:host.dataset.videoId,startSeconds:Number(host.dataset.clipStart),endSeconds:Number(host.dataset.clipEnd)};
  let player, ready = false, playerDestroyed = false, introFinished = !hasIntro, visible = true;
  let manualPause = reduced.matches, active = 0, wasWanted = false;
  let lastProgress = performance.now(), lastTime = -1;
  let apiRequested = false, ticker, nativeTicker;
  const needsSeek = new Set(videos);
  const unavailable = new Set();
  // Published HTML keeps these URLs in data-src so even metadata range requests
  // cannot compete with the opening image, fonts and four-second TEDx clip.
  const sources = videos.map(video => video.dataset.src || video.getAttribute('src'));
  const trimStart = video => Math.max(0, Number(video.dataset.clipStart) || 0);
  const trimEnd = video => {
    const selected = Number(video.dataset.clipEnd);
    return Math.min(selected > 0 ? selected : Infinity, Number.isFinite(video.duration) ? video.duration : Infinity);
  };
  const wanted = () => visible && !manualPause && !document.hidden && !document.querySelector('dialog[open]') && !document.body.classList.contains('menu-open');
  const releaseIntro = () => {
    ready = false;
    if (player && !playerDestroyed) {playerDestroyed = true;player.destroy();}
    host.classList.remove('tedx-playing');
  };
  const releaseNative = video => {
    video.pause();video.preload = 'none';
    if (video.hasAttribute('src')) {video.removeAttribute('src');video.load();}
  };
  const label = () => {
    if (!button) return;
    const playing = wanted();
    const text = playing ? (button.dataset.pauseLabel ?? 'Videoyu duraklat') : (button.dataset.playLabel ?? 'Videoyu oynat');
    button.querySelector('use')?.setAttribute('href', '/assets/icons.svg#' + (playing ? 'pause' : 'play'));
    const controlLabel = button.querySelector('.control-label');
    if (controlLabel) controlLabel.textContent = text;
    button.setAttribute('aria-label', text);
  };
  const sync = () => {
    const play = wanted();
    if (play && !wasWanted) lastProgress = performance.now();
    wasWanted = play;
    if (play && !introFinished) {
      requestIntro();
      if (!ticker) ticker = setInterval(checkIntro, 100);
    } else if (ticker) {
      clearInterval(ticker);ticker = undefined;
    }
    if (ready && !introFinished) {
      if (play) player.playVideo();
      else player.pauseVideo();
    }
    videos.forEach((video, index) => {
      video.preload = introFinished && index === active && play ? 'auto' : 'none';
      if (introFinished && index === active && play) {
        if (!video.hasAttribute('src') && sources[index]) {
          video.setAttribute('src', sources[index]);video.load();
        }
        // Wait for metadata before seeking so frame zero is never flashed when
        // the selected segment starts later in the file.
        if (video.readyState < 1 || unavailable.has(index)) return;
        if (needsSeek.has(video)) {
          const start = trimStart(video);
          if (start >= trimEnd(video)) {failClip(index); return;}
          needsSeek.delete(video);
          if (Math.abs(video.currentTime - start) > .01) video.currentTime = start;
        }
        if (video.seeking || !video.paused) return;
        video.play().catch(error => {
          if (error.name !== 'AbortError' && index === active && wanted()) {
            if (error.name === 'NotSupportedError') failClip(index);
            else {manualPause = true;releaseIntro();sync();}
          }
        });
      }
      else video.pause();
    });
    if (wanted() && introFinished && !nativeTicker) nativeTicker = setInterval(() => {
      const video = videos[active];
      if (!needsSeek.has(video) && !video.seeking && !video.paused && video.currentTime >= trimEnd(video)) nextClip();
    }, 40);
    else if ((!wanted() || !introFinished) && nativeTicker) {clearInterval(nativeTicker);nativeTicker = undefined;}
    label();
  };
  const showNative = index => {
    if (!introFinished || index !== active) return;
    videos.forEach((video, i) => {
      video.classList.toggle('is-active', i === index);
      // Completed clips keep their media buffer for the next rotation. Never
      // detach a successful source: doing so could download it again each lap.
      if (i !== index) {video.pause();video.preload = 'none';}
    });
    host.classList.remove('tedx-playing');
    host.dataset.playback = 'playlist';
    host.dataset.clipIndex = String(index);
    host.dataset.clip = videos[index].dataset.heroClip;
    // Keep the last TEDx frame until native playback starts, then release the
    // completed third-party iframe rather than retaining a hidden player.
    releaseIntro();
  };
  const nextClip = () => {
    if (!introFinished) return;
    const next = videos.findIndex((_, offset) => !unavailable.has((active + offset + 1) % videos.length));
    if (next < 0) {manualPause = true;releaseIntro();videos.forEach(releaseNative);sync();return;}
    videos[active].pause();
    active = (active + next + 1) % videos.length;
    needsSeek.add(videos[active]);
    sync();
  };
  const failClip = index => {
    unavailable.add(index);releaseNative(videos[index]);
    if (introFinished && index === active) nextClip();
  };
  const finishIntro = reason => {
    // This latch is never reset by scroll, pause, menu, modal or player events.
    if (introFinished) return;
    introFinished = true;
    if (ticker) {clearInterval(ticker);ticker = undefined;}
    host.dataset.introComplete = reason;
    if (ready) player.pauseVideo();
    if (reason === 'unavailable') releaseIntro();
    if (unavailable.has(active)) nextClip();
    else sync();
  };
  videos.forEach((video, index) => {
    video.muted = true;video.defaultMuted = true;video.loop = false;
    video.removeAttribute('autoplay');
    releaseNative(video);
    video.addEventListener('loadedmetadata', () => {if (introFinished && index === active) sync();});
    video.addEventListener('seeked', () => {if (introFinished && index === active) sync();});
    video.addEventListener('playing', () => showNative(index));
    video.addEventListener('timeupdate', () => {
      if (introFinished && index === active && wanted() && !video.paused && !needsSeek.has(video) && !video.seeking && video.currentTime >= trimEnd(video)) nextClip();
    });
    video.addEventListener('ended', () => {if (introFinished && index === active && !needsSeek.has(video)) nextClip();});
    video.addEventListener('error', () => failClip(index));
  });
  button?.addEventListener('click', () => {manualPause = !manualPause;sync();});
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    section.dataset.cinematicVisible = String(visible);
    document.dispatchEvent(new Event('cinematicvisibility'));
    sync();
  }, {threshold:.08}).observe(section);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => {manualPause = reduced.matches;sync();});
  new MutationObserver(sync).observe(document.body, {attributes:true,attributeFilter:['class']});
  const dialog = document.getElementById('talkDialog');
  if (dialog) new MutationObserver(sync).observe(dialog, {attributes:true,attributeFilter:['open']});
  const createPlayer = () => {
    if (player || introFinished) return;
    player = new YT.Player('tedxHeroPlayer', {
      host:'https://www.youtube-nocookie.com',
      videoId:intro.videoId,
      playerVars:{autoplay:0,mute:1,playsinline:1,controls:0,disablekb:1,fs:0,rel:0,iv_load_policy:3,start:intro.startSeconds,end:intro.endSeconds,origin:location.origin},
      events:{
        onReady(event) {
          if (introFinished || playerDestroyed) {releaseIntro();return;}
          ready = true;
          event.target.mute();
          const frame = event.target.getIframe();
          frame.setAttribute('title', (document.getElementById('talkTitle')?.textContent || 'TEDxReset') + ' · Açılış');
          frame.setAttribute('tabindex', '-1');frame.setAttribute('aria-hidden', 'true');
          frame.setAttribute('allow', 'autoplay; encrypted-media');
          lastProgress = performance.now();
          sync();
        },
        onStateChange(event) {
          if (introFinished) return;
          if (event.data === YT.PlayerState.PLAYING) {
            const time = player.getCurrentTime();
            if (time >= intro.startSeconds && time < intro.endSeconds) {
              host.classList.add('tedx-playing');host.dataset.playback = 'intro';
            }
            lastProgress = performance.now();
          }
          if (event.data === YT.PlayerState.ENDED) finishIntro('played');
        },
        onAutoplayBlocked:() => finishIntro('unavailable'),
        onError:() => finishIntro('unavailable')
      }
    });
  };
  function requestIntro() {
    if (player || introFinished || !wanted()) return;
    if (window.YT?.Player) {createPlayer();return;}
    if (apiRequested) return;
    apiRequested = true;
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {previous?.();if(wanted()) createPlayer();};
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';script.async = true;
    script.onerror = () => finishIntro('unavailable');
    document.head.append(script);
  }
  function checkIntro() {
    if (introFinished) return;
    if (!wanted()) return;
    const now = performance.now();
    if (ready) {
      const time = player.getCurrentTime();
      if (time !== lastTime) {lastTime = time;lastProgress = now;}
      if (time >= intro.endSeconds) {finishIntro('played');return;}
      if (player.getPlayerState() === YT.PlayerState.PLAYING && time >= intro.startSeconds) {
        host.classList.add('tedx-playing');host.dataset.playback = 'intro';
      }
    }
    if (now - lastProgress > 8000) finishIntro('unavailable');
  }
  sync();
})();
