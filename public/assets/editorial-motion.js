/* Scroll-linked chapter motion and readable, progressively enhanced glass type. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const sections = [...document.querySelectorAll('[data-motion-section]')];
  const reading = document.body.hasAttribute('data-reading');
  const panels = reading ? [] : sections.filter(el => el.matches('.ed-section:not(.ed-proof)') &&
    !el.querySelector('.reading-layout,.test-shell,form') && el.querySelector(':scope > .wrap'));
  panels.forEach((el, i) => {el.classList.add('motion-panel');el.dataset.motionDirection = String(i % 2 ? -1 : 1);});
  const items = [...document.querySelectorAll('[data-motion-item]')].filter(el => !el.closest('.hero,.page-hero,form,.test-shell,.motion-panel') && !el.parentElement.closest('[data-motion-item]'));
  const titleCandidates = reading ? [] : [
    document.querySelector('.ed-section:not(.ed-reading):not(.ed-proof) .ed-heading h2,.ed-manifesto .manifesto-layout h2'),
    document.querySelector('.ed-dark .ed-heading h2'),
    document.querySelector('.ed-closing .ed-heading h2')
  ];
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('tr', {granularity:'grapheme'}) : null;
  const titles = [...new Set(titleCandidates.filter(Boolean))].filter(el => !el.closest('form,.test-shell') && !el.querySelector('a,button'));
  const splitTitle = el => {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));
    el.setAttribute('aria-label', clone.textContent.replace(/\s+/g,' ').trim());
    el.classList.add('motion-title');
    const letters = [];
    const wrap = parent => [...parent.childNodes].forEach(node => {
      if(node.nodeType === 3){
        const fragment = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/u).forEach(word => {
          if(!word)return;
          if(/^\s+$/u.test(word)){fragment.append(document.createTextNode(word));return;}
          const span = document.createElement('span');span.className='motion-word';span.setAttribute('aria-hidden','true');
          const chars = segmenter ? [...segmenter.segment(word)].map(s=>s.segment) : [...word];
          chars.forEach(char=>{const letter=document.createElement('span');letter.className='motion-letter';letter.textContent=char;span.append(letter);letters.push(letter);});
          fragment.append(span);
        });
        node.replaceWith(fragment);
      }else if(node.nodeType === 1 && !node.matches('br,svg'))wrap(node);
    });
    wrap(el);return {el,letters};
  };
  const titleItems = titles.map(splitTitle);
  const progress = document.createElement('div');
  progress.className = 'page-scroll-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
  let frame=0,dirty=true,metrics=[],itemMetrics=[],titleMetrics=[];
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const smooth=v=>v*v*(3-2*v);
  const top=el=>{let v=0;for(let n=el;n;n=n.offsetParent)v+=n.offsetTop;return v;};
  const measure=()=>{
    metrics=sections.map(el=>({el,y:top(el),h:el.offsetHeight,panel:panels.includes(el)}));
    itemMetrics=items.map(el=>({el,y:top(el),h:el.offsetHeight}));
    titleMetrics=titleItems.map(item=>({...item,y:top(item.el),h:item.el.offsetHeight}));dirty=false;
  };
  const render=()=>{
    frame=0;if(dirty)measure();
    const y=scrollY,vh=innerHeight,mobile=typeof innerWidth==='number'&&innerWidth<=760;
    root.style.setProperty('--reading-progress',clamp(y/Math.max(1,document.documentElement.scrollHeight-vh)));
    metrics.forEach(({el,y:sy,h,panel})=>{
      const p=clamp((vh+y-sy)/(vh+h));
      el.style.setProperty('--media-y',reduced.matches?'0px':((p-.5)*72).toFixed(2)+'px');
      el.style.setProperty('--photo-y',reduced.matches?'0px':((p-.5)*36).toFixed(2)+'px');
      if(!panel)return;
      const enter=smooth(clamp((vh*.97-sy+y)/(vh*.58)));
      const leave=smooth(clamp((vh*.18-(sy+h-y))/(vh*.36)));
      const remaining=reduced.matches?0:1-enter,exit=reduced.matches?0:leave;
      const direction=Number(el.dataset.motionDirection);
      el.style.setProperty('--panel-y',((mobile?64:112)*remaining-(mobile?12:24)*exit).toFixed(2)+'px');
      el.style.setProperty('--panel-x',(direction*(mobile?10:32)*remaining).toFixed(2)+'px');
      el.style.setProperty('--panel-scale',(1-(mobile?.025:.055)*remaining-.012*exit).toFixed(4));
      el.dataset.motionActive=String(!reduced.matches&&sy-y<vh+150&&sy+h-y>-150);
    });
    itemMetrics.forEach(({el,y:iy,h})=>{
      if(reduced.matches||h>vh||el.matches('.reading-chapter,article.prose')){
        el.style.setProperty('--item-y','0px');return;
      }
      const entrance=clamp((vh*.97-iy+y)/(vh*.28));
      const flow=clamp((vh+y-iy)/(vh+h));
      el.style.setProperty('--item-y',((1-entrance)*32+(0.5-flow)*10).toFixed(2)+'px');
    });
    titleMetrics.forEach(({el,letters,y:ty})=>{
      const p=reduced.matches?1:clamp((vh*.88-ty+y)/(vh*.48));
      el.style.setProperty('--title-shine',(160-p*180).toFixed(1)+'%');
      letters.forEach((letter,i)=>{
        const stagger=i/Math.max(1,letters.length-1)*.2;
        const rest=1-smooth(clamp((p-stagger)/.8));
        letter.style.transform=reduced.matches?'none':`translate3d(0,${(rest*(mobile?22:40)).toFixed(2)}px,0) scale(${(1+rest*(mobile?.14:.24)).toFixed(3)}) rotateX(${(rest*22).toFixed(2)}deg)`;
      });
    });
    root.classList.add('motion-ready');
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(render);};
  const resize=()=>{dirty=true;schedule();};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize,{passive:true});addEventListener('pageshow',resize);
  reduced.addEventListener('change',resize);
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(document.body);
  document.fonts?.ready.then(resize);
  document.querySelectorAll('img').forEach(img=>{if(!img.complete)img.addEventListener('load',resize,{once:true});});
  document.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',resize));
  schedule();
})();
