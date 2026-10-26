/** V13 acceptance: independent brief copy, generated CMS data, actual composer,
 * one-time content migration, and immutable counter evidence. Local fixtures
 * only; a pass does not claim a live deploy, physical-device QA or real approval.
 * Run from the repository root: node scripts/check-v13-revisions.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseHTML} from 'linkedom';
import {composeContent} from '../cms/compose.mjs';
import {applyV13ContentUpdate,V13_MARKER,V13_VERSION} from '../cms/v13/content-update.mjs';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BASE='9b53f284e6e0c64e43fa6555f4ac71e9bac80032';
const origin='https://ziyasakiryilmaz.com';
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const baseline=file=>execFileSync('git',['show',`${BASE}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
const templates=json('cms/templates.json'),catalog=json('cms/catalog.json'),seeds=json('cms/seed.json');
const beforeTemplates=JSON.parse(baseline('cms/templates.json'));
const revisions=json('cms/v13/revisions.json');
const seed=id=>{const value=seeds.find(row=>row.id===id);assert(value,`Missing seed ${id}`);return value;};
const clone=value=>structuredClone(value);
const doc=html=>parseHTML(html).document;
const byId=(document,id)=>{const node=document.querySelector(`[data-cms-node="${id}"]`);assert(node,`Missing CMS node ${id}`);return node;};
const normalized=value=>String(value??'').replace(/\s+/g,' ').trim();
function text(node){
 if(!node)return '';
 if(node.nodeType===3)return node.textContent;
 if(node.matches?.('script,style,svg,[aria-hidden="true"],[hidden]'))return '';
 return normalized([...node.childNodes].map(text).join(' '));
}
const copy=(document,id,expected)=>assert.equal(normalized(text(byId(document,id))),expected,`Exact brief copy ${id}`);
function before(document,...nodes){
 const all=[...document.querySelectorAll('*')];
 const positions=nodes.map(node=>all.indexOf(typeof node==='string'?byId(document,node):node));
 assert(positions.every((value,index)=>value>=0&&(!index||value>positions[index-1])),`Wrong reading order: ${nodes.map(node=>typeof node==='string'?node:node?.outerHTML?.slice(0,80)).join(' → ')}`);
}
function render(route,payload=seed(route),requestOrigin=origin){
 const document=doc(templates[payload.template||route]);
 return composeContent(document,clone(payload),catalog[payload.template||route],{
  sharedDocument:doc(templates._global),sharedPayload:clone(seed('_global')),sharedDefinition:catalog._global,
  booksPayload:clone(seed('/kitaplar/')),booksDefinition:catalog['/kitaplar/'],
  canonicalOrigin:origin,requestOrigin,
 });
}
const failures=[];let count=0;
function check(label,fn){try{fn();count++;console.log(`PASS ${label}`);}catch(error){failures.push({label,message:error.stack||error.message});console.error(`FAIL ${label}: ${error.message}`);}}
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const counterHTML=source=>source.match(/<section\b[^>]*\bid="rakamlarla"[\s\S]*?<\/section>/)?.[0];
const between=(source,start,end)=>{const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert(a>=0&&b>a,'Protected source markers exist');return source.slice(a,b);};

check('PROTECTED: four counter source blocks retain their baseline SHA-256',()=>{
 const blocks=[
  [counterHTML(read('website/index.html')),'629022535df89bb0cec5fb67c215b4b70db6ff578717e885dd328cb75b3947e1','counter HTML'],
  [between(read('website/assets/main.js'),'  /* The rendered, CMS-editable number','  var noMotion'),'bbaba2eba7a02b12c4861750257dc3033835c892a3d006efe61e894a14fa4c96','counter JS'],
  [between(read('cms/compose.mjs'),"  const hero=document.querySelector('.editorial-home-hero');",'  applyReferences(document,payload);'),'d1cd69521181b19ef20e9cf5dcd1d3800ea87c45bd1345aa8f6089f3ae4f315c','counter composition'],
 ];
 const css=baseline('website/assets/content-depth.css').split('\n').slice(78,167).join('\n')+'\n';
 assert(read('website/assets/content-depth.css').includes(css),'Counter and hero viewport CSS remains byte-identical');
 blocks.push([css,'2190631e622befe3d3350ed159d6694d45828db00f8521fbaec238d28d6132e3','counter CSS']);
 for(const [content,expected,label]of blocks){assert(content,label);assert.equal(hash(content),expected,label);}
});

check('PROTECTED: homepage cards, hero copy, TEDx, books and final stay unchanged',()=>{
 const old=doc(beforeTemplates['/']),current=doc(templates['/']);
 for(const selector of ['.editorial-home-hero h1','.editorial-home-hero .hero-subtitle','#alanlar','[data-cms-node="42099b4a-254"]','#kitaplar','[data-cms-node="42099b4a-350"]']){
  const a=old.querySelector(selector),b=current.querySelector(selector);if(!a){assert(!b,selector);continue;}
  assert(b,selector);assert.equal(text(b),text(a),selector);
  assert.deepEqual([...b.querySelectorAll('a')].map(n=>n.getAttribute('href')),[...a.querySelectorAll('a')].map(n=>n.getAttribute('href')),`${selector} links`);
 }
 assert.equal(current.querySelector('#rakamlarla').outerHTML,old.querySelector('#rakamlarla').outerHTML,'Compiled counter DOM is unchanged');
 const oldOrder=[...old.querySelectorAll('body>section')].map(n=>n.getAttribute('data-cms-node'));
 const newOrder=[...current.querySelectorAll('body>section')].map(n=>n.getAttribute('data-cms-node'));
 assert.deepEqual(newOrder,oldOrder,'Authorised text changes do not reorder homepage sections');
 const publicHome=render('/');assert(publicHome.querySelector('#referanslar'),'Logo strip remains visible');
 const hero=publicHome.querySelector('.editorial-home-hero');assert(hero.contains(publicHome.querySelector('#rakamlarla')),'Counters still render inside hero');
 for(const phrase of ['Başarı Mühendisi, Yazar, Eğitmen','Başarının mühendisliği vardır.','Salondan sloganla çıkılmaz; bir modelle ve ilk üç adımla çıkılır.'])assert(text(hero).includes(phrase),phrase);
 const intentions=hero.querySelectorAll('a[href*="konu="]');assert.equal(intentions.length,4,'Four intentions remain');
});
check('§1: hero manifest has four 2.75s cuts, exact shipped assets and honest source limitations',()=>{
 const manifest=json('scripts/v13-hero-manifest.json');
 assert.equal(manifest.clips.length,4);assert.equal(manifest.duration,11);
 assert.deepEqual(manifest.clips.map(clip=>[clip.outputStart,clip.outputEnd]),[[0,2.75],[2.75,5.5],[5.5,8.25],[8.25,11]]);
 for(const clip of manifest.clips)assert(clip.duration>=2.5&&clip.duration<=3);
 for(const output of manifest.outputs){
  for(const folder of ['website','public'])assert.equal(hash(fs.readFileSync(path.join(root,folder,output.src))),output.sha256,`${folder}${output.src}: measured asset identity`);
  assert.equal(output.frames,264);assert.equal(output.fps,24);assert.equal(output.duration,11);
 }
 assert.equal(manifest.verified.audioStreams,0);assert(manifest.limitations.some(value=>value.includes('retimed')),'Slow-motion source limitation disclosed');
 const hero=render('/').querySelector('.editorial-home-hero');
 assert(hero.querySelector('video[data-src^="/assets/hero-stage-v13-"]'),'Composed hero selects the measured V13 output');
});

const homeCopy={
 '42099b4a-202':'Malatya’nın Kızık köyünde, kerpiç bir evde, gaz lambasının ışığında büyüdüm. Babam bir öğretmendi. Daha çocukken bana şu cümleyi söyledi: ‘Oğlum, dinle beni. Sen bu köyden çıkabilirsin. Ama bir şartla. Kafanın içindeki köyü de bırakacaksın.’ Beş yaşında bir çocuk böyle bir cümleyi anlayamaz. Ben de anlamadım. Ama o cümle içimde yıllarca bekledi.',
 '42099b4a-205':'Tarih 12 Ekim 2012. O yoğun tempo içerisinde bir sabah gözlerimi açtığımda hangi ülkede olduğumu bile hatırlayamadım. Birkaç saniye sürdü. Bana bir saat gibi geldi. Yatağın kenarına oturdum. Dışarıdan bakıldığında her şey yolundaydı; Bayer’de üst düzey yöneticiydim, iyi kazanıyordum, sürekli seyahat ediyordum. Ama o sabah babamın yıllar önce söylediği cümle yeniden yankılandı: ‘Kafanın içindeki köyü de bırakacaksın.’ O otel odasında kendime iki şey söz verdim: Bir milyon insanın kalbine dokunacaktım. Ve babamın adını, bir gün, bir okulun tabelasına kazıyacaktım.',
 '42099b4a-208':'İki ay sonra, 12.12.2012’de, 16 yıllık kurumsal hayatımı bıraktım. Ardından gelen 14 yıllık girişimcilik yolculuğunda satıştan liderliğe, eğitimden insan yetiştirmeye kadar öğrendiğim her şeyi sahada yeniden sınadım. Bugün anlattığım sistemlerin ortak noktası şu: Önce yaşadım. Sonra neden çalıştığını söktüm, parçalara ayırdım ve uygulanabilir bir modele dönüştürdüm.',
};
check('§§5–7: all three exact story paragraphs survive the public CMS composer',()=>{const document=render('/');for(const [id,value]of Object.entries(homeCopy))copy(document,id,value);});

const pillars={
 '/satis/':{prefix:'11c5b094',closing:263,answer:118,hub:225,title:'Satış'},
 '/liderlik/':{prefix:'454dc2e9',closing:264,answer:116,hub:225,title:'Liderlik'},
 '/basari/':{prefix:'b55b9651',closing:273,answer:122,hub:234,title:'Başarı'},
 '/kafa-yapisi/':{prefix:'5f3f14fd',closing:265,answer:119,hub:226,title:'Kafa Yapısı'},
};
for(const [route,info]of Object.entries(pillars))check(`§§12–17,37: ${route} CTA → answer → eight retained topics → FAQ`,()=>{
 const document=render(route),id=part=>`${info.prefix}-${part}`;
 before(document,id(info.closing),id(info.answer),id(info.hub));
 assert.equal(text(document.querySelector('.v13-hub-label > span')),'DAHA DERİNE İN');
 assert.equal(text(document.querySelector('.v13-hub-caption')),`${info.title} Bilgi Merkezi · 8 başlık`);
 const hub=byId(document,id(info.hub)),oldHub=byId(doc(beforeTemplates[route]),id(info.hub));
 assert.deepEqual([...hub.querySelectorAll('a')].map(n=>n.getAttribute('href')),[...oldHub.querySelectorAll('a')].map(n=>n.getAttribute('href')),'All existing topic links retained');
 assert.equal(hub.querySelectorAll('.depth-body > h3').length,8,'Eight knowledge topics');
 const faq=[...document.querySelectorAll('.ed-reading details')].find(n=>text(n.querySelector('summary')).includes('Sık sorulan sorular'));
 assert(faq,'FAQ retained');before(document,hub,faq);
 assert(!text(document.body).includes('Bu alandaki sekiz başlık'),'Obsolete heading removed');
});

check('§§10–12: exact sales thesis and complete two-paragraph field story',()=>{
 const document=render('/satis/');
 assert.equal(text(document.querySelector('h1')),'KONUŞAN DEĞİL, TEŞHİS KOYAN SATAR.');
 copy(document,'11c5b094-90','Doğru sorudan doğru teklife. Satışı müşteriyi anlamakla başlayan bir sistem olarak ele alıyorum.');
 copy(document,'11c5b094-113','SAHADAN BİR DERS');copy(document,'11c5b094-114','440.000 DOLARLIK DERS');
 copy(document,'11c5b094-115','Bir masada 22 üretici vardı. Bana beş yıl boyunca yüzde 5 komisyon sözü verilmişti. Önüme gelen sözleşmede ise süre iki yıl, komisyon yüzde 3’tü. İmzalamadım. Çünkü satışta güven, fiyat kadar gerçek bir değerdir.');
 copy(document,'11c5b094-v13-distributor','Durumu Dubai’de birlikte çalıştığım distribütöre anlattığımda bana tek bir cümle söyledi: ‘Seni aldatanla ben de çalışmam.’ O gün yalnızca bir sözleşmenin değil, güvenin gerçek maliyetini öğrendim.');
 copy(document,'11c5b094-116','KONUŞAN DEĞİL, TEŞHİS KOYAN SATAR.');
 before(document,'11c5b094-114','11c5b094-115','11c5b094-v13-distributor','11c5b094-116','11c5b094-128','11c5b094-137','11c5b094-263');
 assert(!text(document.body).includes('Pahalı bir ders.'));
});
check('§§13–16: leadership duplicate removed and training/book distinction exact',()=>{
 const document=render('/liderlik/');
 assert.equal(text(document.querySelector('h1')),'Liderin ürünü başka bir liderdir.');
 assert.equal([...document.querySelectorAll('h1,h2')].filter(n=>text(n)==='Liderin ürünü başka bir liderdir.').length,1);
 copy(document,'454dc2e9-90','Bir yöneticinin çıktısı sonuçtur. Bir liderin çıktısı insanlardır. Büyük liderin çıktısı ise yeni liderlerdir. Liderlik benim için, sen yokken de devam eden insanlar yetiştirmektir.');
 before(document,'454dc2e9-90','454dc2e9-143','454dc2e9-165','454dc2e9-264');
 const success=render('/basari/');
 copy(success,'b55b9651-121','Başarı Mühendisliği’nin eğitimdeki uygulama modeli; Keşif, Tasarım, İnşa, Test ve Bakım aşamalarını bir araya getirir. Bu beş aşama kitabın bölüm yapısı değil, yaklaşımın eğitim ve uygulama sürecinde kullanılan çalışma modelidir.');
 before(success,'b55b9651-104','b55b9651-140','b55b9651-166','b55b9651-273','b55b9651-122');
});
check('§17: mindset definition, concept link, test and measurement dimensions read in order',()=>{
 const document=render('/kafa-yapisi/');
 before(document,'5f3f14fd-111','5f3f14fd-129','5f3f14fd-115','5f3f14fd-166','5f3f14fd-119','5f3f14fd-139','5f3f14fd-226');
});

const kgkyCopy={
 'fc3787a9-90':'Kökü derin, gövdesi esnek, fırtınada eğilen ama kırılmayan bir kafa yapısı.',
 'fc3787a9-106':'Yıllardır ev sahibi sandığın o ses, uzun süredir oturan bir misafir. Kafanın içindeki eski sesi ev sahibi sanma. O sadece uzun kalmış bir misafir. Ve misafir, ne kadar uzun kalırsa kalsın, ev sahibi olamaz. Ev sensin. Anahtar sende. Kapı açık.',
 'fc3787a9-130':'Bitmedin. Sadece tamamlanmadın.',
 'fc3787a9-134':'Korkunun geçmesini bekleme. Korkuyla birlikte yürü.',
 'fc3787a9-138':'O kapı açık. Ve sen geçebilirsin.',
 'v13-kgky-hrm-bridge':'HENÜZ ihtimali açık tutar. RAĞMEN eylemi başlatır. MÜMKÜN gidecek bir yön olduğunu hatırlatır.',
 'v13-kgky-hrm-statement':'HENÜZ olmadığım kişiye, korkuma RAĞMEN yürüyebilirim; çünkü ben MÜMKÜN’üm.',
 'fc3787a9-144':'KENDİNE BAKMADAN KENDİNİ DEĞİŞTİREMEZSİN.',
 'fc3787a9-156':'Duygunun kimyasal dalgası yaklaşık 90 saniyede söner; sonrası senin seçimin.',
 'v13-kgky-pause-line':'Dur. Gör. Sonra seç.',
};
const kgkyDescription='Kurşun Geçirmez Kafa Yapısı™: Sabotajcı, HENÜZ–RAĞMEN–MÜMKÜN, 6 Ayna, 90 saniye, HAYIR ve 66 günlük uygulama yaklaşımını keşfedin.';
check('§§18–24: KGKY exact copy, numbered mirrors, retained practice and final answer/FAQ',()=>{
 const document=render('/kursun-gecirmez-kafa-yapisi/');
 for(const [id,value]of Object.entries(kgkyCopy))copy(document,id,value);
 assert.deepEqual([...document.querySelectorAll('.v13-mirrors li')].map(text),['01 · ÖZ DEĞER','02 · ÖZ YETERLİLİK','03 · ÖZ GÜVEN','04 · ÖZ SAYGI','05 · ÖZ ŞEFKAT','06 · ÖZ SEVGİ']);
 before(document,'fc3787a9-90','fc3787a9-106','fc3787a9-130','v13-kgky-hrm-statement','fc3787a9-144','fc3787a9-156','fc3787a9-161','fc3787a9-232','fc3787a9-113','fc3787a9-178');
 assert(document.querySelector('[data-habit-plan] [data-plan-form]'),'66-day actual practice tool survives');
 assert(document.querySelector('a[href="/testler/kafa-yapisi-testi/"]'),'Live test destination survives');
 for(const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'])assert.equal(document.querySelector(selector)?.getAttribute('content'),kgkyDescription,selector);
 assert.equal(seed('/kursun-gecirmez-kafa-yapisi/').description,kgkyDescription,'Admin SEO description matches');
});
check('§25: engineering principles precede the five-stage training model and primary CTA',()=>{
 const document=render('/basari-muhendisligi/');
 assert.equal(text(document.querySelector('h1')),'Başarı Mühendisliği™');
 const principles=document.querySelector('.v13-book-principles');assert(principles);
 assert.equal(text(principles.querySelector('h2')),'KİTAPTAKİ İLKELER');
 assert.deepEqual([...principles.querySelectorAll('details summary')].map(text),['Ben Yasası','Sitem-Sistem','Başarı Ceketinin Üç Düğmesi','Kadar-Keder','Üç Filtre']);
 assert.deepEqual([...document.querySelectorAll('[data-v13-blueprint-step] h3')].map(text),['KEŞİF','TASARIM','İNŞA','TEST','BAKIM']);
 before(document,principles,'eea7dbba-124','eea7dbba-152','eea7dbba-209','eea7dbba-114');
 assert(document.querySelector('script[src^="/assets/v13-blueprint.js"]'));
 const styles=[...document.querySelectorAll('link[rel="stylesheet"][href^="/assets/"]')].map(node=>read('public'+node.getAttribute('href').split('?')[0])).join('\n');
 assert(styles.includes('[data-v13-signature] .v13-mirrors'),'Signature styles reach the visitor through the generated CSS bundle');
});

check('§26: blueprint progresses only on scroll/resize, reverses, and reduced motion is static',()=>{
 const js=read('website/assets/v13-blueprint.js');
 const create=(desktop,reduced)=>{
  const document=render('/basari-muhendisligi/'),window={},events={},frames=[];let top=800;
  window.innerHeight=1000;window.matchMedia=query=>({matches:query.includes('min-width')?desktop:reduced,addEventListener(){}});
  window.addEventListener=(name,fn)=>(events[name]??=[]).push(fn);window.removeEventListener=()=>{};
  window.requestAnimationFrame=fn=>(frames.push(fn),frames.length);window.cancelAnimationFrame=()=>{};
  const list=document.querySelector('.v13-blueprint-steps');list.getBoundingClientRect=()=>({top,height:1000});
  vm.runInNewContext(js,{document,window,Element:document.defaultView.Element});
  const section=document.querySelector('[data-v13-blueprint]');
  return {section,steps:[...section.querySelectorAll('[data-v13-blueprint-step]')],events,frames,scroll(value){top=value;(events.scroll||[]).forEach(fn=>fn());while(frames.length)frames.shift()();}};
 };
 const desktop=create(true,false);assert.equal(desktop.section.dataset.v13BlueprintMode,'desktop');
 assert.equal(desktop.section.style.getPropertyValue('--v13-blueprint-progress'),'0');
 desktop.scroll(300);assert.equal(desktop.section.style.getPropertyValue('--v13-blueprint-progress'),'0.5');
 assert.deepEqual(desktop.steps.map(n=>n.dataset.v13StepState),['complete','complete','active','pending','pending']);
 assert.equal(desktop.frames.length,0,'No recurring animation frame loop');
 desktop.scroll(-200);assert(desktop.steps.every(n=>n.dataset.v13StepState==='complete'));
 desktop.scroll(800);assert(desktop.steps.every(n=>n.dataset.v13StepState==='pending'),'Reverse scroll reverses progress');
 for(const [isDesktop,isReduced,mode]of [[false,false,'mobile'],[true,true,'static'],[false,true,'static']]){
  const fixture=create(isDesktop,isReduced);assert.equal(fixture.section.dataset.v13BlueprintMode,mode);
  assert(fixture.steps.every(n=>n.dataset.v13StepState==='complete'));assert.equal(fixture.events.scroll,undefined,'Mobile/reduced mode does not pin or bind scroll');
 }
 const css=read('website/assets/v13-signature-pages.css');assert.match(css,/@media\(max-width:1023px\)[^\n]*position:static/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)[^\n]*animation:none!important/);
});

check('§§27–28: speaker experience exact, 13 years removed, unready showreel hidden',()=>{
 const document=render('/konusmaci/');
 copy(document,'0b7effcb-245','16 yıl uluslararası kurumsal hayat, son 8 yılı Bayer’de Country Manager. 84 ülkede iş deneyimi, 90’dan fazla ülkeye ihracat. 14 yıllık girişimcilik yolculuğunda 70.000 kişiye ulaşan bir ekip. 600.000’den fazla insana eğitim ve konuşma, 5 TEDx ve dört kitap.');
 assert(!/13 yıl/.test(text(document.body)));assert(!document.querySelector('[data-showreel],#showreel'));
 assert(!text(document.body).includes('SHOWREEL’İ İZLE'));assert(document.querySelector('[data-talk]'),'TEDx is retained, not mislabeled as a showreel');
});
check('§30: each training program uses ordered, nonempty, editable fact rows',()=>{
 const document=render('/egitimler/'),order=['KİMİN İÇİN:','HANGİ PROBLEM:','FORMAT:','SÜRE:','GRUP BÜYÜKLÜĞÜ:','ÇIKTI:','ÖN ÇALIŞMA:','SONRASI:'];
 for(const id of ['satis','liderlik','kafa']){
  const rows=[...document.querySelectorAll(`#${id} .v13-program-facts > div`)];assert(rows.length>=6);
  const labels=rows.map(n=>text(n.querySelector('dt')));assert.deepEqual(labels,[...labels].sort((a,b)=>order.indexOf(a)-order.indexOf(b)));
  for(const row of rows){const dd=row.querySelector('dd'),value=text(dd);assert(value&&!/yakında|belirlenecek/i.test(value));assert(catalog['/egitimler/'].fields.some(field=>field.node===dd.getAttribute('data-cms-node')),'Program fact remains CMS editable');}
  assert(!labels.includes('GRUP BÜYÜKLÜĞÜ:'),'Unprovided group sizes are not invented');
 }
});
check('§31: mentorship capacity appears once immediately followed by cadence',()=>{
 const document=render('/mentorluk/'),capacity='Yılda sınırlı sayıda girişimci ve yöneticiyle çalışıyorum. Uygunluk ilk görüşmede iki taraflı kararlaştırılır.';
 const nodes=[...document.querySelectorAll('p')].filter(n=>text(n)===capacity);assert.equal(nodes.length,1);
 assert.equal(text(nodes[0].nextElementSibling),'Çalışma süresi ve görüşme ritmi, ilk görüşmede hedefe göre birlikte belirlenir.');
});
check('§§32–35: biography, source-safe education and dated press destination',()=>{
 const about=render('/ziya-sakir-yilmaz/'),press=render('/basin/');
 assert(text(about.body).includes('14 yıllık girişimcilik yolculuğunda 70.000 kişiye ulaşan bir ekip.'));
 assert(text(about.body).includes('Pusulam tek cümle: bir milyon insanın kalbine dokunmak.'));
 assert(!/13 yıl|Favikon|MBA|ODTÜ/i.test(text(about.body)));assert(!about.querySelector('#dijital-etki'));
 assert(![...about.querySelectorAll('script[type="application/ld+json"]')].some(n=>n.textContent.includes('alumniOf')),'Unverified education is absent from structured data');
 assert.equal(text(press.querySelector('h1')),'Basın / Medya Kiti');
 assert(text(press.querySelector('#dijital-etki')).includes('DİJİTAL ETKİ · TARİHLİ VERİLER'));
 const old=doc(beforeTemplates['/ziya-sakir-yilmaz/']);
 for(const link of old.querySelectorAll('#dijital-etki a[href]'))assert(press.querySelector(`#dijital-etki a[href="${link.getAttribute('href')}"]`),'Existing dated source link retained');
 assert(about.querySelector('a[href="/basin/"]'));assert(press.querySelector('footer a[href="/basin/"]'));
 assert.equal(press.querySelector('link[rel="canonical"]').getAttribute('href'),`${origin}/basin/`);
});

check('§§29,36,38: all public templates render a first H1, language links, host-specific robots and valid IDs',()=>{
 for(const payload of seeds.filter(row=>row.kind!=='global')){
  const route=payload.route,document=render(route),ids=[...document.querySelectorAll('[id]')].map(n=>n.id);
  assert.equal(new Set(ids).size,ids.length,`${route}: unique DOM IDs`);
  const main=document.querySelector('main')||document.body;
  assert.equal(main.querySelector('h1,h2,h3')?.tagName,'H1',`${route}: first main heading is H1`);
  assert.equal(document.querySelectorAll('h1').length,1,`${route}: exactly one H1`);
  assert(document.querySelector('header [data-v13-language="header"]'),`${route}: persistent language links`);
  for(const nav of document.querySelectorAll('[data-v13-language]')){assert.equal(nav.querySelector('[lang="tr"]').getAttribute('href'),'/');assert.equal(nav.querySelector('[lang="en"]').getAttribute('href'),'/en/speaker/');}
  assert(document.querySelector('footer a[href="/basin/"]'),`${route}: press reachable`);
  for(const schema of document.querySelectorAll('script[type="application/ld+json"]'))JSON.parse(schema.textContent);
  const preview=render(route,payload,'https://preview.workers.dev');
  assert.equal(preview.head.querySelector('meta[name="robots"]').getAttribute('content'),'noindex, nofollow',`${route}: preview head`);
  if(!payload.noindex&&!String(payload.robots||'').includes('noindex'))assert(!/noindex/.test(document.head.querySelector('meta[name="robots"]')?.content||''),`${route}: production indexable`);
 }
});
check('CMS: every compiled V13 field has a unique reachable node and initial value',()=>{
 for(const route of Object.keys(revisions.pages)){
  const document=doc(templates[route]),definition=catalog[route],payload=seed(route);
  const ids=definition.fields.map(field=>field.id);assert.equal(new Set(ids).size,ids.length,`${route}: duplicate field IDs`);
  const nodes=[...document.querySelectorAll('[data-cms-node]')].map(n=>n.getAttribute('data-cms-node'));assert.equal(new Set(nodes).size,nodes.length,`${route}: duplicate CMS identities`);
  for(const field of definition.fields){byId(document,field.node);assert(Object.hasOwn(payload.values,field.id),`${route}: missing initial ${field.id}`);}
  for(const section of payload.sections){byId(document,section.source);for(const group of section.groups||[])for(const item of group.items)byId(document,item.source);}
 }
});
check('CMS: new story, KGKY, training and press content remain editable through the actual composer',()=>{
 for(const [route,node]of [['/','42099b4a-202'],['/kursun-gecirmez-kafa-yapisi/','v13-kgky-hrm-statement'],['/satis/','11c5b094-v13-distributor']]){
  const payload=clone(seed(route)),field=catalog[route].fields.find(f=>f.node===node&&f.target==='text');assert(field);
  payload.values[field.id]='Editör kontrol metni.';copy(render(route,payload),node,'Editör kontrol metni.');
 }
 for(const route of ['/egitimler/','/basin/']){const payload=clone(seed(route)),field=catalog[route].fields.find(f=>f.target==='text'&&f.type==='long');assert(field);payload.values[field.id]='Editörün değiştirdiği içerik.';assert(text(render(route,payload).body).includes('Editörün değiştirdiği içerik.'));}
});
check('MIGRATION: legacy payloads receive V13 once while unrelated edits, media and later edits survive',()=>{
 for(const [route,revision]of Object.entries(revisions.pages)){
  if(!revision.before)continue;
  const payload=clone(revision.before);payload.values['qa:custom']='korunan değer';
  payload.mediaFrames={'qa-image':{position:'42% 61%',zoom:1.2}};
  const first=applyV13ContentUpdate(payload);assert.equal(first.values[V13_MARKER],V13_VERSION,`${route}: migration marker`);
  assert.equal(first.values['qa:custom'],'korunan değer');assert.deepEqual(first.mediaFrames,payload.mediaFrames);
  assert(!Object.hasOwn(payload.values,V13_MARKER),'Original object remains unchanged');
  const changed=Object.keys(revision.after.values).find(id=>JSON.stringify(revision.before.values[id])!==JSON.stringify(revision.after.values[id]));
  if(changed){first.values[changed]='Yayın sonrası editör değişikliği';assert.equal(applyV13ContentUpdate(first).values[changed],'Yayın sonrası editör değişikliği','Repeated reads preserve later editor updates');}
  assert.equal(applyV13ContentUpdate(first),first,'Marked payloads are returned unchanged');
 }
 const home=clone(revisions.pages['/'].before);home.experience={...home.experience,playlist:[{id:'custom',src:'/assets/owner-selected.mp4',start:4,end:7}]};
 assert.deepEqual(applyV13ContentUpdate(home).experience.playlist,home.experience.playlist,'Bespoke editor-selected video playlist survives');
});
check('MIGRATION: composed upgraded baseline renders all required new copy and metadata',()=>{
 const home=render('/',applyV13ContentUpdate(clone(revisions.pages['/'].before)));
 for(const [id,value]of Object.entries(homeCopy))copy(home,id,value);
 const kgky=render('/kursun-gecirmez-kafa-yapisi/',applyV13ContentUpdate(clone(revisions.pages['/kursun-gecirmez-kafa-yapisi/'].before)));
 for(const [id,value]of Object.entries(kgkyCopy))copy(kgky,id,value);
 assert.equal(kgky.querySelector('meta[name="description"]').content,kgkyDescription);
 assert(!home.querySelector('#deneyimler'),'Unready legacy testimonial proposals stay hidden');
});

console.log(`\n${count} V13 acceptance groups passed; ${failures.length} failed.`);
console.log('Not claimed here: physical Safari/Android QA, pixel comparison, live CMS persistence, deployed-host checks, genuine testimonial approval or missing source material.');
if(failures.length){for(const failure of failures)console.error(`\n${failure.label}\n${failure.message}`);process.exitCode=1;}
