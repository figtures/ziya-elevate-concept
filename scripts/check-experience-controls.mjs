/** Server DOM, editor events and runtime submission/quiz checks; no external writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {applyExperience, experienceDefaults, validateExperience} from '../cms/experience.mjs';
import {renderExperienceEditor, wireExperienceEditor} from '../cms/admin-experience.mjs';
const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const templates = JSON.parse(read('cms/templates.json'));
const seed = JSON.parse(read('cms/seed.json'));
const docFor = route => {const p = structuredClone(seed.find(p => p.route === route)), {document,window}=parseHTML(templates[p.template]); return {payload:p,document,window};};
// Linkedom does not implement native media playback or writable select values.
// These stubs isolate editor events; video timing is covered by runtime tests.
function editorDOM() {
  const {document,window}=parseHTML('<body><main></main></body>');
  window.HTMLElement.prototype.pause=function(){if(this.localName==='video')this.paused=true;};
  window.HTMLElement.prototype.load=function(){if(this.localName==='video'){this.currentTime=0;this.duration=NaN;this.readyState=0;}};
  window.HTMLElement.prototype.play=function(){return Promise.resolve();};
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return (this.querySelector('option[selected]')||this.querySelector('option'))?.getAttribute('value')||'';},set(value){for(const option of this.querySelectorAll('option')){if(option.getAttribute('value')===String(value))option.setAttribute('selected','');else option.removeAttribute('selected');}}});
  return {document,window};
}
function twoClipFixture(document,payload) {
  const original=experienceDefaults(document,payload).playlist[0];
  assert(original,'At least one authored hero clip');
  return [structuredClone(original),{...structuredClone(original),id:'fixture-second',src:'/fixture-second.mp4',poster:'/fixture-second.jpg'}];
}
let count=0;
function check(name, fn) {fn(); count++; console.log('PASS '+name);}
check('Unconfigured controls preserve authored page markup', () => {
  for (const route of ['/', '/iletisim/', '/testler/kafa-yapisi-testi/']) {
    const {document,payload}=docFor(route); delete payload.experience;
    const before=document.toString(); applyExperience(document,payload); assert.equal(document.toString(),before);
  }
});
check('Configured V13 hero renders its 11-second playlist and preserves protected content', () => {
  const {document,payload}=docFor('/');
  const protectedSelectors=['#rakamlarla','.hero-statement','.hero-intentions','#alanlar','#kitaplar','.ed-closing'];
  for(const selector of protectedSelectors)assert(document.querySelector(selector),`Protected home block ${selector} must exist`);
  const before=protectedSelectors.map(selector=>document.querySelector(selector).outerHTML);
  assert.deepEqual(payload.experience.playlist.map(({src,start,end})=>({src,start,end})),[{src:'/assets/hero-stage-v13-1080.mp4',start:0,end:11}]);
  applyExperience(document,payload);
  const clips=[...document.querySelectorAll('[data-hero-clip]')];
  assert.equal(clips.length,1); assert.equal(clips[0].dataset.src,'/assets/hero-stage-v13-1080.mp4');
  assert.equal(clips[0].dataset.clipStart,'0'); assert.equal(clips[0].dataset.clipEnd,'11');
  assert(clips[0].classList.contains('is-active')); assert.equal(clips[0].hasAttribute('src'),false,'Deferred source avoids an eager request');
  assert.deepEqual(protectedSelectors.map(selector=>document.querySelector(selector)?.outerHTML),before);
});
check('Typed validation blocks unsafe URLs, arbitrary keys and oversized playlists', () => {
  for (const experience of [{floating:{href:'javascript:alert(1)'}},{contact:{phone:'+90 invalid'}},{testUI:{actionHref:'//evil.test'}},{playback:{onclick:'alert(1)'}},{playlist:[]},{playlist:Array(13).fill({id:'a',src:'/a.mp4',poster:'/p.jpg',focal:'center'})},{playlist:[{id:'a',src:'/a.mp4',poster:'/p.jpg',focal:'expression(x)'}]}]) assert.ok(validateExperience(experience).length);
  assert.deepEqual(validateExperience({floating:{enabled:false,label:'Sor'},contact:{phone:'905551234567'},playlist:[{id:'clip',src:'/safe.mp4',poster:'https://example.org/p.jpg',focal:'38% center'}]}),[]);
});
check('Global floating CTA and playback labels render without altering sections', () => {
  const {document,payload}=docFor('/'), sectionCount=document.querySelectorAll('section').length;
  applyExperience(document,payload,{experience:{floating:{label:'İletişime geç',href:'/iletisim/#talep-formu'},playback:{playLabel:'Filmi başlat',pauseLabel:'Filmi durdur'}}});
  assert.equal(document.querySelector('.ask-ziya .control-label').textContent,'İletişime geç');
  assert.equal(document.querySelector('.ask-ziya').getAttribute('href'),'/iletisim/#talep-formu');
  assert.equal(document.querySelector('.video-toggle').dataset.playLabel,'Filmi başlat');
  assert.equal(document.querySelectorAll('section').length,sectionCount);
  applyExperience(document,payload,{experience:{floating:{enabled:false}}}); assert.equal(document.querySelector('.ask-ziya'),null);
});
check('Playlist ordering, additional video, focal point and media attributes reach rendered DOM', () => {
  const {document,payload}=docFor('/'); const clips=twoClipFixture(document,payload);
  payload.experience={playlist:[clips[1],{id:'new-clip',src:'/new.mp4',poster:'/new.jpg',focal:'20% center'},clips[0]],talk:{title:'Konuşma seçkisi',closeLabel:'Pencereyi kapat',watchLabel:'Konuşmaya git',href:'https://www.youtube.com/watch?v=u-p2y6JH3aA'}};
  applyExperience(document,payload);
  const videos=[...document.querySelectorAll('[data-hero-clip]')]; assert.deepEqual(videos.map(v=>v.dataset.heroClip),payload.experience.playlist.map(v=>v.id));
  assert.equal(videos[1].dataset.src,'/new.mp4'); assert.equal(videos[1].hasAttribute('src'),false); assert.equal(videos[1].style.objectPosition,'20% center');
  assert.equal(document.querySelector('#talkTitle').textContent,'Konuşma seçkisi'); assert.equal(document.querySelector('.talk-close').getAttribute('aria-label'),'Pencereyi kapat');
});
check('Contact labels, correct destination and privacy text share one typed configuration', () => {
  const {document,payload}=docFor('/iletisim/'); payload.experience={contact:{phone:'905551234567',submitLabel:'Talebi ilet',privacyText:'Talebinizi yanıtlamak için kaydedilir.',whatsappLabel:'Mesajla'}}; applyExperience(document,payload);
  assert.equal(document.querySelector('#sendWhatsApp').getAttribute('href'),'https://wa.me/905551234567');
  assert.equal(document.querySelector('#contactForm [type=submit]').textContent,'Talebi ilet');
  assert.equal(document.querySelector('.contact-form-wrap > .hero-note').textContent,'Talebinizi yanıtlamak için kaydedilir.');
  assert.equal(JSON.parse(document.getElementById('cms-contact-content').textContent).phone,'905551234567');
});
check('Enabled lead collection replaces obsolete privacy text and preserves authored overrides', () => {
  const {document,payload}=docFor('/iletisim/'); applyExperience(document,payload,undefined,{leadsEnabled:true});
  assert.ok(!document.querySelector('.contact-form-wrap > .hero-note').textContent.includes('kaydedilmez'));
  assert.equal(document.querySelector('#contactForm [type=submit]').textContent,'Talebimi gönder');
  document.querySelector('.contact-form-wrap > .hero-note').textContent='Yazar tarafından onaylanan bilgilendirme.';
  document.querySelector('#contactForm [type=submit]').textContent='İletişime geç'; applyExperience(document,payload,undefined,{leadsEnabled:true});
  assert.equal(document.querySelector('.contact-form-wrap > .hero-note').textContent,'Yazar tarafından onaylanan bilgilendirme.');
  assert.equal(JSON.parse(document.getElementById('cms-contact-content').textContent).submitLabel,'İletişime geç');
});
check('Test result labels and destinations are editable text, never interpreted as HTML', () => {
  const {document,payload}=docFor('/testler/kafa-yapisi-testi/'); payload.experience={testUI:{scoreLabel:'Sonucun',downloadLabel:'Raporu al',actionLabel:'Birlikte çalışalım',actionHref:'/iletisim/',teamPrefix:'Ekibiniz için: ',teamLabel:'Eğitim',teamHref:'/egitimler/',reportTitle:'</script><script>alert(1)</script>'}}; applyExperience(document,payload);
  assert.equal(document.querySelector('#result .kicker').textContent,'Sonucun'); assert.equal(document.querySelector('#downloadReport .control-label').textContent,'Raporu al');
  assert.equal(document.querySelector('#result a.btn-primary').getAttribute('href'),'/iletisim/'); assert.equal(document.querySelector('#result .hero-note.mt-2 a').getAttribute('href'),'/egitimler/');
  assert.ok(!document.querySelector('#cms-test-content').textContent.includes('<script>')); assert.equal(JSON.parse(document.querySelector('#cms-test-content').textContent).reportTitle,payload.experience.testUI.reportTitle);
});
check('Editor retains configuration and supports video reordering, addition, deletion and media selection', () => {
  const {document:source,payload}=docFor('/');
  payload.experience={...payload.experience,playlist:twoClipFixture(source,payload)};
  const {document,window}=editorDOM(); let changes=0;
  document.querySelector('main').innerHTML=renderExperienceEditor({payload,doc:source});
  const dispose=wireExperienceEditor(document,{payload,doc:source,onChange:()=>changes++,pickMedia:({onSelect})=>onSelect('/replacement.mp4',{url:'/replacement.mp4'})});
  const click=selector=>{const element=document.querySelector(selector);assert(element,selector);assert(!element.disabled,selector);element.dispatchEvent(new window.Event('click',{bubbles:true}));};
  document.querySelector('[data-experience-group=talk][data-experience-key=title]').value='Nerede başlar?'; document.querySelector('[data-experience-key=title]').dispatchEvent(new window.Event('input'));
  assert.equal(payload.experience.talk.title,'Nerede başlar?'); assert.ok(payload.experience.talk.watchLabel);
  const before=experienceDefaults(source,payload).playlist.map(i=>i.id);
  click('[data-video-move="0|1"]'); assert.deepEqual(payload.experience.playlist.map(i=>i.id),before.toReversed());
  click('[data-video-action="add-library"]'); assert.equal(payload.experience.playlist.length,3); assert.equal(document.querySelectorAll('[data-video-clip]').length,3);
  click('[data-video-select="0"]'); click('[data-video-action="replace-library"]'); assert.equal(payload.experience.playlist[0].src,'/replacement.mp4');
  click('[data-video-remove="0"]'); assert.equal(payload.experience.playlist.length,2); assert.equal(document.querySelectorAll('[data-video-clip]').length,2); assert.ok(changes>=5);
  dispose();
});
check('Read-only editor never registers changes', () => {
  const {document:source,payload}=docFor('/'); const before=structuredClone(payload); const {document,window}=editorDOM();
  document.querySelector('main').innerHTML=renderExperienceEditor({payload,doc:source,canEdit:false}); const dispose=wireExperienceEditor(document,{payload,doc:source,canEdit:false,onChange:()=>{throw Error('Mutation');}});
  const input=document.querySelector('[data-experience-key=title]'); assert.ok(input.disabled); input.value='changed'; input.dispatchEvent(new window.Event('input')); assert.deepEqual(payload,before); dispose();
});
check('Quiz runtime uses managed result/report copy throughout all 20 questions', () => {
  const {document,window,payload}=docFor('/testler/kafa-yapisi-testi/'); payload.experience={testUI:{layerPrefix:'Alan: ',questionPrefix:'Madde ',strongSuffix:'Güç metni',weakLabel:'Odak metni',reportTitle:'Özel rapor',reportAuthor:'Rapor sahibi',reportStepsLabel:'UYGULAMA',reportDisclaimer:'Özel açıklama'}}; applyExperience(document,payload);
  for(const e of document.querySelectorAll('*')){e.scrollIntoView=()=>{};e.focus=()=>{};}
  let report=''; class BlobMock{constructor(parts){report=parts.join('');}}
  const context={window,document,Date,Blob:BlobMock,URL:{createObjectURL:()=>'/report',revokeObjectURL(){}},setTimeout:()=>0}; vm.createContext(context);
  window.TEST_DEF=payload.test; vm.runInContext(read('website/assets/test-engine.js'),context);
  document.getElementById('startBtn').click(); assert.equal(document.getElementById('qNum').textContent,'Madde 1'); assert.ok(document.getElementById('qLayer').textContent.startsWith('Alan: '));
  for(let i=0;i<20;i++)document.querySelector('#qOpts button').click();
  assert.equal(document.getElementById('result').hidden,false); assert.ok(document.getElementById('strongText').textContent.endsWith('Güç metni'));
  document.getElementById('downloadReport').click(); assert.ok(report.includes('Özel rapor')&&report.includes('Rapor sahibi')&&report.includes('UYGULAMA')&&report.includes('Özel açıklama'));
});
{
  const {document,window,payload}=docFor('/iletisim/'); payload.experience={contact:{phone:'905551234567',greeting:'Merhaba ekip,',successTitle:'Kayıt başarılı',successText:'Size döneceğiz.',againLabel:'Yeni form'}}; applyExperience(document,payload);
  const script=document.createElement('script'); script.dataset.endpoint='https://test.invalid/submit';script.dataset.key='public-key'; Object.defineProperty(document,'currentScript',{value:script});
  document.getElementById('contactForm').reportValidity=()=>true;document.getElementById('contactPreview').scrollIntoView=()=>{};
  for(const [id,value] of Object.entries({ad:'Test Kullanıcısı',ep:'test@example.org',mesaj:'Kurumsal eğitim talebimiz var.'}))document.getElementById(id).value=value;
  Object.defineProperty(document.getElementById('konu'),'selectedOptions',{value:[document.querySelector('#konu option')]});
  document.querySelector('#konu option').setAttribute('selected','');
  let sent;const context={document,AbortSignal,fetch:async(url,request)=>{sent=JSON.parse(request.body);return {ok:true,json:async()=>({ok:true,id:'lead-id'})};}};vm.createContext(context);vm.runInContext(read('public/assets/cms-contact.js'),context);
  document.getElementById('contactForm').dispatchEvent(new window.Event('submit',{cancelable:true})); for(let i=0;i<10;i++)await Promise.resolve();
  check('Actual form handler uses managed success copy and configured WhatsApp destination',()=>{assert.equal(sent.name,'Test Kullanıcısı');assert.equal(document.querySelector('#contactPreview h3').textContent,'Kayıt başarılı');assert.equal(document.querySelector('#contactPreview p').textContent,'Size döneceğiz.');assert.equal(document.querySelector('#contactForm [type=submit]').textContent,'Yeni form');assert.ok(document.getElementById('sendWhatsApp').href.startsWith('https://wa.me/905551234567?text='));assert.ok(document.getElementById('preparedMessage').textContent.startsWith('Merhaba ekip,'));});
}
console.log(`${count} experience checks passed.`);
