/* Scroll is the timeline, never a wheel/touch interceptor. Text is always opaque.
   Transform ownership: chapter = transform, rows = translate, media = transform,
   type = transform. Hover transforms therefore remain available on cards. */
export function installEditorialMotion({animate, scroll, inView}, win = window) {
  const doc = win.document;
  if (!doc.body.hasAttribute('data-editorial')) return () => {};
  const root = doc.documentElement;
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = win.matchMedia('(max-width: 760px)');
  const reading = doc.body.hasAttribute('data-reading');
  const sections = [...doc.querySelectorAll('[data-motion-section]')];
  const protectedArea = 'form,.test-shell,.reading-layout,article.prose,.reading-chapter';
  const titleCache = new Map();
  const originalStyles = new Map();
  let disposers = [];

  const remember = element => {
    if (!originalStyles.has(element)) originalStyles.set(element, element.getAttribute('style'));
  };
  const splitTitle = element => {
    if (titleCache.has(element)) return titleCache.get(element);
    const label = element.cloneNode(true);
    label.querySelectorAll('br').forEach(br => br.replaceWith(doc.createTextNode(' ')));
    element.setAttribute('aria-label',label.textContent.replace(/\s+/g,' ').trim());
    element.classList.add('motion-title');
    const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('tr',{granularity:'grapheme'}) : null;
    const words = [], letters = [];
    const walk = parent => [...parent.childNodes].forEach(node => {
      if (node.nodeType === 3) {
        const fragment = doc.createDocumentFragment();
        node.nodeValue.split(/(\s+)/u).forEach(word => {
          if (!word) return;
          if (/^\s+$/u.test(word)) { fragment.append(doc.createTextNode(word)); return; }
          const span = doc.createElement('span');
          span.className = 'motion-word'; span.setAttribute('aria-hidden','true'); words.push(span);
          const chars = segmenter ? [...segmenter.segment(word)].map(s=>s.segment) : [...word];
          chars.forEach(char => {
            const letter = doc.createElement('span');
            letter.className = 'motion-letter'; letter.textContent = char;
            span.append(letter); letters.push(letter);
          });
          fragment.append(span);
        });
        node.replaceWith(fragment);
      } else if (node.nodeType === 1 && !node.matches('br,svg')) walk(node);
    });
    walk(element);
    const result = {words,letters}; titleCache.set(element,result); return result;
  };

  const stop = () => {
    disposers.splice(0).reverse().forEach(dispose=>dispose());
    originalStyles.forEach((style,element)=>{
      if (style === null) element.removeAttribute('style'); else element.setAttribute('style',style);
    });
    originalStyles.clear();
    doc.querySelectorAll('[data-motion-active]').forEach(el=>el.removeAttribute('data-motion-active'));
    root.classList.remove('motion-ready');
  };

  const start = () => {
    stop();
    if (reduced.matches) return;
    const mobile = compact.matches;
    const track = (element,keyframes,{target=element,offset=['start 1','end 0'],times,ease='linear'}={}) => {
      remember(element);
      const animation = animate(element,keyframes,{duration:1,autoplay:false,ease,...(times?{times}:{})});
      disposers.push(()=>animation.cancel());
      disposers.push(scroll(animation,{target,offset,trackContentSize:true}));
    };

    try {
      // An opening scene that recedes as the next chapter arrives.
      sections.filter(el=>el.matches('.hero,.page-hero')).forEach(hero=>{
        hero.querySelectorAll('.hero-vid > video,.hero-vid > picture,.hero-vid > img').forEach(media=>{
          track(media,{transform:['translate3d(0,0%,0) scale(1.08)','translate3d(0,9%,0) scale(1.2)']},
            {target:hero,offset:['start start','end start']});
        });
        const copy = hero.querySelector('.home-hero-inner') || hero.querySelector(':scope > .wrap');
        if (copy) track(copy,{translate:['0px 0px',`0px ${mobile?-32:-86}px`]},
          {target:hero,offset:['start start','end start']});
      });

      // Editorial chapters enter with a generous vertical sweep, then hold still
      // while being read. Their authored heights/margins never change.
      // Proof points belong to the opening frame. Only their numbers count up;
      // the strip must never enter, scale or drift with editorial chapters.
      if (!reading) sections.filter(el=>el.matches('.ed-section:not(.ed-proof)')).forEach((section,index)=>{
        const wrap = section.querySelector(':scope > .wrap');
        const interactive = section.querySelector(protectedArea);
        if (wrap && !interactive) {
          section.classList.add('motion-panel');
          // The compact logo band and its next chapter form a single opening
          // sequence. Full chapter travel would visually double their gutter.
          const compactJoin = section.matches('.ed-references') || section.previousElementSibling?.matches('.ed-references');
          const distance = compactJoin?(mobile?24:46):(mobile?68:138);
          track(wrap,{transform:[`translate3d(0,${distance}px,0) scale(${mobile?.97:.945})`,'translate3d(0,0,0) scale(1)']},
            {target:section,offset:['start 1','start .24'],ease:'linear'});
          track(wrap,{translate:['0px 0px',`0px ${mobile?-18:-42}px`]},
            {target:section,offset:['end .4','end 0'],ease:'linear'});
          disposers.push(inView(section,()=>{
            section.dataset.motionActive='true';
            return ()=>section.removeAttribute('data-motion-active');
          },{margin:'120px 0px 120px 0px'}));
        }

        // Sequential content keeps its own rhythm within each chapter.
        const candidates = [...section.querySelectorAll('.topic-links > a,.editorial-rows > a,.editorial-rows > article,.editorial-rows > div,.program-duo > article,.book-row,.book-list > article,.training-grid > article,.work-options > a,.leadership-principles > details')]
          .filter(el=>!el.closest(protectedArea));
        const rows = candidates.filter(el=>!candidates.some(parent=>parent!==el&&parent.contains(el)));
        rows.forEach((row,i)=>{
          row.classList.add('motion-row');
          track(row,{translate:[`${mobile?0:(index%2?-72:72)}px ${mobile?48:72}px`,'0px 0px']},
            {target:row,offset:[`start ${.98-Math.min(i%3,2)*.035}`,'start .46'],ease:[.25,.1,.25,1]});
        });

        // A soft specular reflection crosses the navy background with the scroll.
        if (section.matches('.ed-dark,.ed-closing')) {
          section.classList.add('motion-surface');
          track(section,{'--glass-position':['-55%','155%']},{target:section});
        }
      });

      // Images open from a rounded inset and drift independently of the copy.
      doc.querySelectorAll('.ed-photo .photo-crop').forEach(crop=>{
        if (crop.closest(protectedArea)) return;
        crop.classList.add('motion-media');
        track(crop,{clipPath:[`inset(${mobile?4:8}% ${mobile?3:7}% round ${mobile?30:52}px)`,'inset(0% 0% round 24px)']},
          {target:crop,offset:['start 1','start .22'],ease:[.22,1,.36,1]});
        const image = crop.querySelector('img');
        if (image) track(image,{transform:['translate3d(0,4%,0) scale(1.18)','translate3d(0,-4%,0) scale(1.12)']},{target:crop});
      });

      if (!reading) {
        const headings = [...doc.querySelectorAll('.ed-section .ed-heading h2,.ed-manifesto h2')]
          .filter(el=>!el.closest(protectedArea)&&!el.querySelector('a,button'));
        const glass = new Set([headings[0],headings.find(el=>el.closest('.ed-dark')),headings.find(el=>el.closest('.ed-closing'))].filter(Boolean));
        headings.forEach(title=>{
          const {words,letters} = splitTitle(title);
          const detailed = glass.has(title);
          title.classList.toggle('motion-title-glass',detailed);
          const pieces = detailed?letters:words;
          pieces.forEach((piece,i)=>{
            const delay = i/Math.max(1,pieces.length-1)*(detailed?.23:.16);
            const distance = detailed?(mobile?30:62):(mobile?32:58);
            const from = `translate3d(0,${distance}px,0) scale(${detailed?1.18:1.04}) rotateX(${detailed?32:12}deg)`;
            track(piece,{transform:[from,from,'translate3d(0,0,0) scale(1) rotateX(0deg)']},
              {target:title,offset:['start .98','start .35'],times:[0,.01+delay,1],ease:[.22,1,.36,1]});
          });
          if (detailed) track(title,{'--title-shine':['135%','-35%']},
            {target:title,offset:['start .95','end .1']});
        });
      }

      // Contact/test layouts stay anchored; their introductory copy still moves.
      sections.filter(el=>el.querySelector(protectedArea)).forEach(section=>{
        const heading = section.querySelector('.ed-heading');
        if (heading && !heading.closest(protectedArea)) {
          track(heading,{translate:[`0px ${mobile?30:54}px`,'0px 0px']},
            {target:heading,offset:['start 1','start .45'],ease:[.22,1,.36,1]});
        }
      });
      const footer = doc.querySelector('.ed-footer .wrap,.site-footer .wrap');
      if (footer) track(footer,{translate:[`0px ${mobile?26:56}px`,'0px 0px']},
        {target:footer,offset:['start 1','end 1'],ease:[.22,1,.36,1]});

      let progress = doc.querySelector('.page-scroll-progress');
      if (!progress) {
        progress = doc.createElement('div'); progress.className='page-scroll-progress';
        progress.setAttribute('aria-hidden','true'); doc.body.append(progress);
      }
      remember(progress);
      const progressAnimation = animate(progress,{transform:['scaleX(0)','scaleX(1)']},{duration:1,ease:'linear',autoplay:false});
      disposers.push(()=>progressAnimation.cancel(),scroll(progressAnimation));
      root.classList.add('motion-ready');
    } catch (error) {
      // CMS content and links remain usable if a browser cannot run enhancement.
      stop();
      win.console.warn('Editorial motion could not start; static layout retained.',error);
    }
  };
  reduced.addEventListener('change',start);
  compact.addEventListener('change',start);
  start();
  return () => {stop();reduced.removeEventListener('change',start);compact.removeEventListener('change',start);};
}
