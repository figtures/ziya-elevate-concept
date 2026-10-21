/* Choreography contract tests. The engine stub records animation targets and
   lifecycle calls; browser QA verifies Framer Motion playback and actual pixels. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {installEditorialMotion} from '../src/motion/choreography.mjs';

const read = file => readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const checks = [];
const check = (name,fn) => { fn(); checks.push(name); };
const accessibleTitle = element => {
  const clone = element.cloneNode(true);
  clone.querySelectorAll('br').forEach(br=>br.replaceWith(clone.ownerDocument.createTextNode(' ')));
  return clone.textContent.replace(/\s+/g,' ').trim();
};
function fixture(html,{mobile=false,reduced=false,failAt=Infinity}={}) {
  const {document} = parseHTML(html);
  const titles = new Map([...document.querySelectorAll('h2')].map(el=>[el,{
    text:el.textContent,name:accessibleTitle(el),breaks:el.querySelectorAll('br').length,
  }]));
  const queries = new Map(), animations = [], subscriptions = [], observers = [], warnings = [];
  for (const [query,matches] of [['(prefers-reduced-motion: reduce)',reduced],['(max-width: 760px)',mobile]]) {
    const listeners = new Set();
    queries.set(query,{matches,listeners,addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)});
  }
  const engine = {
    animate(element,keyframes,options) {
      if(animations.length===failAt) throw Error('Simulated unavailable animation API');
      const entry={element,keyframes,options,canceled:0,cancel(){this.canceled++;}};
      animations.push(entry);
      // Model style ownership, including an interrupted animation during cleanup.
      for (const [property,values] of Object.entries(keyframes)) {
        const value=Array.isArray(values)?values[0]:values;
        if(property.startsWith('--'))element.style.setProperty(property,value);
        else element.style[property]=value;
      }
      return entry;
    },
    scroll(animation,options) {
      const entry={animation,options,disposed:0}; subscriptions.push(entry);
      return ()=>entry.disposed++;
    },
    inView(element,onEnter,options) {
      const entry={element,options,disposed:0,leave:onEnter(element)};observers.push(entry);
      return ()=>{entry.disposed++;entry.leave?.();};
    },
  };
  const dispose=installEditorialMotion(engine,{document,matchMedia:q=>queries.get(q),console:{warn:(...args)=>warnings.push(args)}});
  const change=(query,value)=>{
    const media=queries.get(query);media.matches=value;[...media.listeners].forEach(fn=>fn());
  };
  return {document,titles,animations,subscriptions,observers,queries,warnings,dispose,
    active:()=>animations.filter(a=>!a.canceled),
    reduced:value=>change('(prefers-reduced-motion: reduce)',value),
    mobile:value=>change('(max-width: 760px)',value)};
}
const sample = `<!doctype html><html><body data-editorial>
<section class="hero" data-motion-section><div class="hero-vid"><video></video></div><div class="home-hero-inner"><h1>Opening remains readable</h1></div></section>
<section id="first" class="ed-section" data-motion-section><div class="wrap" style="color: navy">
<div class="ed-heading"><h2 id="title-one">İyi bir <em data-inline-note="preserved">başlangıç</em>.<br>İstanbul’da güçlen. 👩🏽‍💻</h2><p>Always readable.</p></div>
<div class="topic-links"><a href="#closing"><h3>Topic</h3></a><a href="#closing">Next topic</a></div>
<figure class="ed-photo"><div class="photo-crop"><img src="scene.jpg" alt="Stage"></div></figure>
</div></section>
<section id="second" class="ed-section ed-dark" data-motion-section><div class="wrap"><div class="ed-heading"><h2 id="title-two">Sahneye çık.</h2></div>
<div class="editorial-rows"><div id="outer-row"><div class="book-row" id="nested-row">Nested row</div></div></div></div></section>
<section id="closing" class="ed-section ed-closing" data-motion-section><div class="wrap"><div class="ed-heading"><h2 id="title-three">Birlikte ilerleyelim.</h2></div></div></section>
<section id="contact" class="ed-section" data-motion-section><div class="wrap"><div class="ed-heading"><h2>Contact introduction</h2></div><form><div class="ed-heading"><h2 id="form-title">Name</h2></div><label>Name<input name="name"></label><div class="topic-links"><a id="form-row" href="#">Protected control</a></div></form></div></section>
<section id="quiz" class="ed-section" data-motion-section><div class="wrap test-shell"><div class="ed-heading"><h2 id="quiz-title">Soruyu yanıtlayın.</h2></div><button>Yanıt</button></div></section>
<section id="reading-section" class="ed-section" data-motion-section><div class="wrap reading-layout"><article class="prose"><div class="ed-heading"><h2 id="reading-title">Reading title</h2></div><p>Long reading.</p></article></div></section>
<footer class="site-footer"><div class="wrap">Footer</div></footer></body></html>`;
const transformed = f => f.active().filter(a=>'transform' in a.keyframes||'translate' in a.keyframes).map(a=>a.element);
const assertTitles = f => {
  for(const [el,before] of f.titles) {
    assert.equal(el.textContent,before.text,'Authored title text survives');
    assert.equal(el.querySelectorAll('br').length,before.breaks,'Authored breaks survive');
    if(el.classList.contains('motion-title'))assert.equal(el.getAttribute('aria-label'),before.name);
  }
  assert.ok([...f.document.querySelectorAll('.motion-word')].every(word=>word.getAttribute('aria-hidden')==='true'));
  assert.equal(f.document.querySelectorAll('.motion-word .motion-word,.motion-letter .motion-letter').length,0,'Splitting never nests');
};

check('Self-hosted output and styling mirrors match',()=>{
  assert.equal(read('website/assets/editorial-motion.js'),read('public/assets/editorial-motion.js'));
  assert.equal(read('website/assets/editorial.css'),read('public/assets/editorial.css'));
  assert.match(read('src/motion/editorial-motion.mjs'),/from ['"]framer-motion\/dom['"]/);
});
check('Copy, authored breaks, inline emphasis and Turkish graphemes survive',()=>{
  const f=fixture(sample);assertTitles(f);
  assert.equal(f.document.querySelector('em[data-inline-note="preserved"]').textContent,'başlangıç');
  const letters=[...f.document.querySelectorAll('#title-one .motion-letter')];
  assert.ok(letters.some(el=>el.textContent==='İ'),'Combining dotted I is one grapheme');
  assert.ok(letters.some(el=>el.textContent==='👩🏽‍💻'),'Joined emoji is one grapheme');
  assert.equal(f.document.querySelectorAll('.motion-title-glass').length,3);
  assert.equal(f.document.querySelector('.page-scroll-progress').getAttribute('aria-hidden'),'true');
  assert.ok(f.document.documentElement.classList.contains('motion-ready'));
  assert.equal(f.warnings.length,0);
});
check('Chapters, media and text use reversible scroll timelines without hiding text',()=>{
  const f=fixture(sample);
  assert.equal(f.subscriptions.length,f.animations.length,'Every animation is linked to scrolling');
  for(const a of f.animations) {
    assert.equal(a.options.autoplay,false,'Scroll owns playback');
    assert.equal(a.keyframes.opacity,undefined,'Readable content remains opaque');
    assert.equal(a.keyframes.display,undefined);
    assert.equal(a.keyframes.visibility,undefined);
  }
  for(const s of f.subscriptions.filter(s=>s.options?.target)) {
    assert.equal(s.options.trackContentSize,true,'CMS/media reflow is tracked');
    assert.equal(s.options.offset.length,2);
  }
  const wrap=f.document.querySelector('#first>.wrap');
  const chapter=f.active().find(a=>a.element===wrap);
  assert.match(chapter.keyframes.transform[0],/138px/);
  assert.equal(chapter.keyframes.transform.at(-1),'translate3d(0,0,0) scale(1)');
  assert.ok(f.active().some(a=>a.element.matches('.photo-crop')&&a.keyframes.clipPath));
  assert.ok(f.active().some(a=>a.element.matches('.photo-crop img')&&a.keyframes.transform));
});
check('Nested rows, forms, tests and prose do not receive compounded travel',()=>{
  const f=fixture(sample);const moving=new Set(transformed(f));
  assert.ok(moving.has(f.document.getElementById('outer-row')));
  assert.ok(!moving.has(f.document.getElementById('nested-row')),'Nested selected rows must not compound travel');
  for(const id of ['contact','quiz','reading-section']) {
    assert.ok(!moving.has(f.document.querySelector(`#${id}>.wrap`)),`${id}: layout remains anchored`);
  }
  for(const el of f.document.querySelectorAll('form *, .test-shell *, .reading-layout *')) {
    assert.ok(!moving.has(el),'Interactive/reading descendants stay stable');
    assert.ok(!el.classList.contains('motion-title'));
  }
  const reading=fixture(sample.replace('body data-editorial','body data-editorial data-reading="article"'));
  assert.equal(reading.document.querySelectorAll('.motion-title,.motion-panel,.motion-row').length,0,'Long-form pages keep reading flow');
});
check('Reduced motion and breakpoint changes clean up and rebuild without duplicate splitting',()=>{
  const f=fixture(sample);const count=f.document.querySelectorAll('.motion-letter').length;
  const old=[...f.animations],oldScroll=[...f.subscriptions],oldViews=[...f.observers];
  f.mobile(true);
  assert.ok(old.every(a=>a.canceled===1));
  assert.ok(oldScroll.every(s=>s.disposed===1));
  assert.ok(oldViews.every(s=>s.disposed===1));
  assert.equal(f.document.querySelectorAll('.motion-letter').length,count);assertTitles(f);
  const chapter=f.active().find(a=>a.element===f.document.querySelector('#first>.wrap'));
  assert.match(chapter.keyframes.transform[0],/68px/);
  f.reduced(true);
  assert.equal(f.active().length,0);
  assert.ok(f.subscriptions.every(s=>s.disposed===1));
  assert.equal(f.document.querySelectorAll('[data-motion-active]').length,0);
  assert.equal(f.document.querySelector('#first>.wrap').getAttribute('style'),'color: navy','Original inline style is restored');
  assert.equal(f.document.querySelector('.photo-crop img').getAttribute('style'),null);
  assert.ok(!f.document.documentElement.classList.contains('motion-ready'));
  f.reduced(false);assertTitles(f);
  assert.equal(f.document.querySelectorAll('.motion-letter').length,count);
  assert.equal(f.document.querySelectorAll('.page-scroll-progress').length,1);
  f.dispose();
  assert.equal(f.active().length,0);
  assert.ok([...f.queries.values()].every(q=>q.listeners.size===0),'Disposal removes preference listeners');
  const initial=fixture(sample,{reduced:true});
  assert.equal(initial.animations.length,0);assert.equal(initial.document.querySelectorAll('.motion-letter').length,0);
  initial.dispose();
});
check('Engine failure restores content and leaves the natural layout usable',()=>{
  const f=fixture(sample,{failAt:4});
  assert.equal(f.warnings.length,1);
  assert.equal(f.active().length,0);
  assert.ok(f.subscriptions.every(s=>s.disposed===1));
  assert.ok(!f.document.documentElement.classList.contains('motion-ready'));
  assert.equal(f.document.querySelector('#first>.wrap').getAttribute('style'),'color: navy');
  assertTitles(f);f.dispose();
  const ordinary=fixture(sample.replace('body data-editorial','body'));
  assert.equal(ordinary.animations.length,0);ordinary.dispose();
});
const routes=Object.keys(JSON.parse(read('cms/metadata.json')));
check(`All ${routes.length} content templates retain readable copy and clean lifecycles`,()=>{
  for(const route of routes) {
    const f=fixture(read(`website/${route.replace(/^\//,'')}index.html`));
    assert.equal(f.warnings.length,0,`${route}: choreography initializes`);assertTitles(f);
    const rows=[...f.document.querySelectorAll('.motion-row')];
    for(const row of rows)assert.ok(!row.parentElement.closest('.motion-row'),`${route}: no nested row travel`);
    for(const animation of f.animations) {
      assert.doesNotMatch(JSON.stringify(animation.keyframes),/NaN|Infinity/,`${route}: finite keyframes`);
      assert.ok(!animation.element.closest('form,.test-shell,.reading-layout,article.prose,.reading-chapter'),`${route}: protected content remains stable`);
    }
    const count=f.document.querySelectorAll('.motion-letter').length;
    f.mobile(true);assertTitles(f);
    assert.equal(f.document.querySelectorAll('.motion-letter').length,count);
    f.reduced(true);assert.equal(f.active().length,0);f.dispose();
  }
});
console.log(`PASS: ${checks.length} choreography contract groups; authored copy/graphemes, scroll ownership, nested/protected content, preference rebuilds, cleanup, failure recovery and ${routes.length} actual templates. Browser playback is verified separately.`);
