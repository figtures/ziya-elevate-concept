/** Acceptance checks for the client's 19 October brief, with the 22 October
 * instruction to preserve the navy design. Run after CMS source regeneration.
 * This verifies authored source and generated CMS rendering; it does not claim
 * an authenticated live CRM delivery, physical-device recording or approval of
 * a testimonial. Those remain separate entries in the revision checklist. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {parseHTML} from 'linkedom';
import {applyContent} from '../cms/render.mjs';
import {applySEO} from '../cms/seo.mjs';

const root=resolve(new URL('..',import.meta.url).pathname);
const failures=[],passes=[],boundaries=[];
const normalize=value=>String(value??'').normalize('NFKC').replace(/[’‘]/g,"'").replace(/[–—]/g,'-').replace(/\u00ad/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('tr');
function text(node){
 if(!node)return '';
 if(node.nodeType===3)return node.textContent;
 if(node.nodeType!==1&&node.nodeType!==9)return '';
 if(node.matches?.('script,style,svg,[hidden],[aria-hidden="true"]'))return '';
 return [...node.childNodes].map(text).join(' ').replace(/\s+/g,' ').trim();
}
function check(label,fn){try{fn();passes.push(label);}catch(error){failures.push({label,message:error.message});}}
function source(route){const p=join(root,'website',route,'index.html');assert(existsSync(p),`Missing page ${route||'/'}`);return parseHTML(readFileSync(p,'utf8')).document;}
function includes(node,expected){assert(normalize(text(node)).includes(normalize(expected)),`Missing approved copy: ${expected}`);}
function allCopy(route,phrases){check(`${route||'/'} approved copy`,()=>{const doc=source(route);for(const phrase of phrases)includes(doc.body,phrase);});}
function pages(dir=join(root,'website')){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?pages(join(dir,e.name)):e.name==='index.html'?[join(dir,e.name)]:[]);}
const active=pages().map(path=>({path,doc:parseHTML(readFileSync(path,'utf8')).document})).filter(({doc})=>!doc.querySelector('meta[http-equiv="refresh"]'));

allCopy('',[
 'Başarı Mühendisi, Yazar, Eğitmen',
 'Salondan sloganla çıkılmaz; bir modelle ve ilk üç adımla çıkılır.',
 'Sizin için nasıl başlayalım?',
 'Ziya Şakir Yılmaz’ı etkinliğimize davet etmek istiyorum.',
 'Ekibimiz için eğitim almak istiyorum.', 'Kendim için eğitim almak istiyorum.', 'Mentorluk için başvurmak istiyorum.',
 'Bir konuşma biter. Bir yaklaşım kalır.',
 'Başarı, kafa yapısı, satış ve liderlik. Otuz yıllık saha deneyiminde öğrendiklerimi bir konuşmaya, uygulanabilir bir eğitime ve birlikte çalışma disiplinine dönüştürüyorum.',
 'Önce yaşadım', 'Bu fikirler masa başında doğmadı.',
 'Malatya’nın Kızık köyünde başlayan hayatımda başarı benim için hiçbir zaman hazır verilmiş bir yol olmadı. Gaz lambasının ışığını, küçük bir yerden büyük bir dünyaya bakmayı ve insanın önce kendi sınırlarının dışına çıkması gerektiğini çok erken öğrendim.',
 '12 Ekim 2012 Cuma sabahı Astana’da bir otel odasında uyandım. Bir an hangi ülkede olduğumu hatırlayamadım. Dışarıdan bakıldığında başarılı bir hayatım vardı. Ama o sabah kendime çok daha zor bir soru sordum: Başarı buysa, ben gerçekten istediğim hayatı mı yaşıyorum?',
 '12.12.2012’de 16 yıllık kurumsal hayatımı bıraktım. Sonraki yıllarda girişimcilikten satışa, eğitimden liderliğe uzanan başka bir hayat kurdum. Öğrendiğim en önemli şey şuydu: Hayatı değiştiren şey bilgi değil; bilgiyi bir sisteme dönüştürüp uygulayabilmektir.',
 'Hangi alanda birlikte çalışalım?',
 'Bireysel gelişimden kurumsal dönüşüme; dört alanda deneyimi sistemleştiriyor, bilgiyi sonuca taşıyorum.',
 'Şans bekleme. Sistem kur.', 'Hedefin yazılı mı, yoksa dilek mi?',
 'Hayat vurur. Sen yine kalkarsın.', 'Son darbeden kaç günde kalktın?',
 'Konuşan değil, teşhis koyan satar.', '“Düşüneyim” dediklerinde ne yapıyorsun?',
 'Liderin ürünü başka bir liderdir.', 'Sen yokken ekip ne kadar çalışıyor?',
 'Başarıyı yeniden tanımlayan o an', 'O an, bir başlangıç olabilir.',
 'Başarıyı neden yeniden tanımlamamız gerektiğini kendi sözlerimle dinleyin.',
 'TEDxRESET konuşmasını izle', '5 TEDx konuşması · 4 kayıt yayında',
 'Ekibiniz nerede sonuç kaybediyor?',
 'Satış ekibiniz teklif anlatıyor ama teşhis koyamıyor mu?',
 'Yöneticileriniz ekip yönetiyor ama lider yetiştiremiyor mu?',
 'Baskı ve reddedilme performansı düşürüyor mu?',
 'Ekibim için eğitim istiyorum', 'Programların iskeletini gör',
 'Değişim nerede başlasın?', 'Henüz olmadığım kişiye, korkuma rağmen yürüyebilirim.',
 'Kendim için eğitim istiyorum', 'Bireysel çalışmaları gör',
 'Fikirlerin basılı hali.', '4 kitap · 75.000+ okur',
 'Sıradaki salon sizinki olsun.', 'Etkinliğinizi, ekibinizi veya bir sonraki gelişim hedefinizi konuşalım.',
 'Ziya Şakir Yılmaz’ı davet et', 'Kurumsal eğitimi konuşalım'
]);
check('Home manifesto/story/topics remain in the requested order',()=>{
 const doc=source(''),sections=[...doc.querySelectorAll('body > section')];
 const ix=phrase=>sections.findIndex(n=>normalize(text(n)).includes(normalize(phrase)));
 const manifesto=ix('Bir konuşma biter.'),story=ix('Önce yaşadım'),topics=ix('Hangi alanda birlikte çalışalım?');
 assert(manifesto>=0&&story>manifesto&&topics>story,'Story must follow manifesto and precede four topics');
 const storyNode=sections[story];assert(storyNode.querySelector('a[href^="/ziya-sakir-yilmaz/"]'),'Story needs an About link');
 assert(!storyNode.querySelector('a[href^="/iletisim/"]'),'Story must not contain a sales CTA');
});
check('Header CTAs lead to the existing four-intention area',()=>{
 const home=source('');
 for(const {doc,path} of active){
  for(const cta of doc.querySelectorAll('header .header-invite,header .menu-invite')){
   const href=cta.getAttribute('href');assert(href,relative(root,path));
   const url=new URL(href,'https://ziyasakiryilmaz.com/');
   assert.equal(url.pathname,'/',`${relative(root,path)} header CTA should go to home intentions`);
   const target=home.getElementById(decodeURIComponent(url.hash.slice(1)));
   assert(target,`${relative(root,path)} missing intention anchor ${href}`);
   assert(target.querySelectorAll('a[href*="konu="]').length>=4,'Header target must include the four choices');
   assert(!cta.hasAttribute('data-invite-open'),'Header CTA must not open a popup');
  }
 }
});
check('Home book section has all four real, linked covers',()=>{
 const doc=source('');const title=[...doc.querySelectorAll('h2')].find(n=>normalize(text(n))===normalize('Fikirlerin basılı hali.'));
 assert(title,'Missing books title');const section=title.closest('section');
 for(const label of ['Başarı Mühendisliği','Size Bir Sır Vereyim mi?','İlk 72 Saat','Kurşun Geçirmez Kafa Yapısı'])includes(section,label);
 const images=[...section.querySelectorAll('img')];assert.equal(images.length,4,'Exactly four book covers expected');
 for(const img of images){assert(img.getAttribute('alt')?.trim(),'Book needs a meaningful alt');const src=img.getAttribute('src');assert(src?.startsWith('/assets/')&&existsSync(join(root,'website',src)),'Book cover must be a real local asset');assert(img.closest('a[href]'),'Book cover should link to its details');}
});
check('TEDx poster is available without lazy-load gating',()=>{
 const doc=source(''),button=[...doc.querySelectorAll('[data-talk]')].find(n=>normalize(text(n)).includes(normalize('TEDxRESET konuşmasını izle')));
 assert(button,'TEDx section watch action');const image=button.closest('section')?.querySelector('img');assert(image,'TEDx poster');assert.notEqual(image.getAttribute('loading'),'lazy');
});
allCopy('basari-muhendisligi',[
 'Eğitim salonundaki uygulama modeli',
 'Aşağıdaki beş aşama kitabın bölüm yapısı değildir; Başarı Mühendisliği yaklaşımının eğitim ve uygulama sürecinde kullanılan çalışma modelidir.',
 'Keşif','Neredeyim, nereye gidiyorum?', 'Tasarım','Hedef hangi sisteme dönüşecek?',
 'İnşa','Günlük hangi davranışlar uygulanacak?', 'Test','Ne çalışıyor, ne çalışmıyor?', 'Bakım','Sonuç nasıl korunacak ve geliştirilecek?'
]);
allCopy('kursun-gecirmez-kafa-yapisi',[
 'Kurşun Geçirmez Kafa Yapısı', 'Bambu gibi: kökü derin, gövdesi esnek, fırtınada yıkılmayan yeni bir sen.',
 'En zor rakibin bazen kafanın içindedir.', 'HENÜZ.', 'Bugün olmaması, olmayacağı anlamına gelmez.',
 'RAĞMEN.', 'Cesaret korkusuzluk değil; korkuya rağmen bir sonraki adımı seçebilmektir.',
 'MÜMKÜN.', 'İnsan önce zihninde mümkün gördüğü yere yürür.',
 'Kendine bakmadan kendini değiştiremezsin.', '90 SANİYE.', 'Duygunun ilk dalgasıyla karar verme. Dur. Gör. Sonra seç.',
 'Bazen en güçlü kelime hayırdır.', 'Bilgi yetmez. Tekrar gerekir.',
 'Kitaptaki kavramlardan türetilen ölçüm boyutları'
]);
check('KGKY has a reachable 66-day application and test route',()=>{
 const doc=source('kursun-gecirmez-kafa-yapisi');assert(doc.querySelector('a[href="/testler/kafa-yapisi-testi/"]'));
 assert(doc.querySelector('[data-habit-plan]'),'An actual 66-day tool is required, not an empty link');
 assert(doc.querySelector('[data-plan-form] input[name="goal"]'));assert(doc.querySelector('[data-plan-form] input[type="date"]'));assert(doc.querySelector('[data-plan-meter][max="66"]'));
});
allCopy('konusmaci',[
 '5 TEDx konuşması · 4 kayıt yayında',
 'Ben Yasası, Sitem/Sistem yaklaşımı ve kendi ilk çalışan sistemini kurmak için kullanabileceği net bir başlangıç çerçevesi.',
 'İçindeki Sabotajcı’yı fark etmek, HENÜZ–RAĞMEN–MÜMKÜN dilini kullanmak ve zor anlarda uygulayabileceği 90 saniyelik bir dur–gör–seç refleksi.'
]);
allCopy('satis',[
 'Sahadan bir ders', 'Pahalı bir ders.',
 'Bir masada 22 üretici vardı. Verilen söz yüzde 5’ti. Önüme gelen sözleşmede yüzde 3 yazıyordu. O gün satışla ilgili yalnız fiyatı değil, güvenin gerçek maliyetini de öğrendim.',
 'Konuşan değil, teşhis koyan satar.'
]);
allCopy('liderlik',[
 'Liderin ürünü başka bir liderdir.', 'Lider çoğaltma döngüsü',
 '12.12.2012’de kurumsal unvanımı bıraktım. Sonraki dönemde insanları kartvizitimdeki pozisyonla değil, kurduğumuz güven ve sistemle hareket ettirmeyi öğrenmek zorunda kaldım. Liderlik benim için tam burada başka bir anlama dönüştü: sen yokken de devam eden insanlar yetiştirmek.'
]);
check('Leadership sequence preserves order without an invented trademark',()=>{
 const doc=source('liderlik');const title=[...doc.querySelectorAll('h2,h3,p')].find(n=>normalize(text(n))===normalize('Lider çoğaltma döngüsü'));
 assert(title);const section=title.closest('section'),copy=normalize(text(section));
 let after=-1;for(const step of ['Gör','Göster','Geliştir','Geri çekil','Çoğalt']){const at=copy.indexOf(normalize(step),after+1);assert(at>after,`Sequence step ${step}`);after=at;}
 assert(!text(title).includes('™'));
});
allCopy('mentorluk',[
 'Bu çalışma kimler için değil?', 'Sadece kısa süreli motivasyon arayanlar için değil.',
 'Kararlarının sorumluluğunu mentora devretmek isteyenler için değil.',
 'Takviminde düşünmeye, uygulamaya ve geri bildirim almaya gerçek zaman ayıramayacak kişiler için değil.',
 'Yılda sınırlı sayıda girişimci ve yöneticiyle çalışıyorum. Uygunluk ilk görüşmede iki taraflı kararlaştırılır.',
 'Mentorluk için başvur'
]);
allCopy('ziya-sakir-yilmaz',['Hedefim, bir milyon insanın hayatında olumlu ve kalıcı bir iz bırakmak.']);
check('Unapproved dollar figure and old generic CTA labels are not public copy',()=>{
 for(const {doc,path} of active){
  assert(!/440[.,]000|220[.,]000/.test(text(doc.body)),`${relative(root,path)} unapproved dollar amount`);
  for(const node of doc.querySelectorAll('a,button,summary'))assert(!['programı incele','programları incele','konuşmaları keşfet','hikâyenin tamamı'].includes(normalize(text(node))),`${relative(root,path)} old CTA: ${text(node)}`);
 }
});
check('Keynote inquiry collects event date and attendee group',()=>{
 const doc=source('iletisim'),form=doc.querySelector('#contactForm');assert(form);
 assert(form.querySelector('input[type="date"]'),'Missing event date');
 const select=[...form.querySelectorAll('select')].find(n=>['100’den az','100–500','500+'].every(label=>normalize(text(n)).includes(normalize(label))));assert(select,'Missing three attendee groups');
 for(const type of ['email','tel'])assert(form.querySelector(`input[type="${type}"]`),`Missing ${type}`);
 for(const label of ['Ad Soyad','Şirket / Kurum','Şehir','Mesaj'])includes(form,label);
});
check('English speaker sales page and actual inquiry path',()=>{
 const doc=source('en/speaker');assert.equal(doc.documentElement.lang,'en');includes(doc.body,'Success Engineer');
 assert(doc.querySelectorAll('h1').length===1,'One English H1');
 assert(doc.querySelector('form#contactForm, a[href*="/iletisim/"],a[href="#inquiry"]'),'English inquiry access');
 assert(doc.querySelector('a[href="/konusmaci/"]'),'TR counterpart reachable');
 assert(doc.querySelector('a[href$=".pdf"]'),'English speaker kit link');
});
check('Speaker kit exists, is a PDF and stays below 10MB',()=>{
 const doc=source('konusmaci'),a=[...doc.querySelectorAll('a[href]')].find(n=>/\.pdf(?:[?#]|$)/i.test(n.getAttribute('href'))&&/speaker kit/i.test(text(n)));
 assert(a,'Speaker kit download action');const path=join(root,'public',new URL(a.getAttribute('href'),'https://ziyasakiryilmaz.com').pathname);
 assert(existsSync(path),'Speaker kit must be shipped');const bytes=readFileSync(path);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert(bytes.length<=10_000_000,`PDF ${bytes.length} bytes`);
});

check('Speaker kit bios have all six requested lengths',()=>{
 const kit=JSON.parse(readFileSync(join(root,'content/speaker-kit.json'),'utf8'));
 for(const lang of ['tr','en'])for(const count of [50,150,300]){
  const bio=kit.bios?.[lang]?.[count];assert(bio,`${lang}${count} biography`);
  assert.equal(bio.trim().split(/\s+/u).length,count,`${lang}${count} word count`);
 }
 assert.equal(kit.photoAssets.length,3);
 for(const filename of kit.photoAssets)assert(existsSync(join(root,'website/assets',filename)),`Real photo ${filename}`);
 for(const route of ['konusmaci','en/speaker']){
  const doc=source(route);assert.equal(doc.querySelectorAll('.keynote-topics > details').length,4,`${route} four keynotes`);
  for(const event of kit.eventSources){
   assert(/20\d{2}/.test(event.label),'Event needs a year');
   assert([...doc.querySelectorAll('a[href]')].some(a=>a.getAttribute('href')===event.url),`${route} event source ${event.label}`);
  }
 }
});

// Check the actual generated CMS rendering rather than only template meta tags.
check('CMS publication contains revised templates and the English page',()=>{
 const seed=JSON.parse(readFileSync(join(root,'cms/seed.json'),'utf8'));
 const templates=JSON.parse(readFileSync(join(root,'cms/templates.json'),'utf8'));
 const catalog=JSON.parse(readFileSync(join(root,'cms/catalog.json'),'utf8'));
 for(const route of ['/','/konusmaci/','/en/speaker/','/iletisim/','/kursun-gecirmez-kafa-yapisi/']){
  const row=seed.find(p=>p.route===route);assert(row,`CMS row ${route}`);assert(catalog[row.template]&&templates[row.template],`CMS template ${route}`);
  const doc=parseHTML(templates[row.template]).document;applyContent(doc,row,catalog[row.template]);applySEO(doc,row,'https://ziyasakiryilmaz.com');
  assert.equal(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),`https://ziyasakiryilmaz.com${route}`);
  assert.equal(doc.documentElement.lang,route.startsWith('/en/')?'en':'tr');
  if(route==='/')includes(doc.body,'Salondan sloganla çıkılmaz; bir modelle ve ilk üç adımla çıkılır.');
  if(['/konusmaci/','/en/speaker/'].includes(route)){
   const alternates=[...doc.querySelectorAll('link[rel="alternate"][hreflang]')];
   for(const [lang,path] of [['tr','/konusmaci/'],['en','/en/speaker/']])assert(alternates.some(n=>n.getAttribute('hreflang')===lang&&n.getAttribute('href')===`https://ziyasakiryilmaz.com${path}`),`Missing ${lang} alternate ${route}`);
  }
 }
});

for(const [name,width,height,maxBytes] of [['hero-stage-clean-1080.mp4',1920,1080,5_000_000],['hero-stage-clean-720.mp4',1280,720,2_500_000]]){
 check(`Hero media ${name} codec/resolution/size`,()=>{
  const path=join(root,'website/assets',name);assert(existsSync(path),name);assert(statSync(path).size<=maxBytes,`${name} exceeds ${maxBytes} bytes`);
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height:format=duration','-of','json',path],{encoding:'utf8'}));
  assert.equal(probe.streams[0].codec_name,'h264');assert.equal(probe.streams[0].width,width);assert.equal(probe.streams[0].height,height);
  const duration=Number(probe.format.duration);assert(duration>0&&duration<=12.2,'No oversized loop');
  if(duration<10)boundaries.push(`${name}: ${duration.toFixed(2)}sn; brief 10–12 sn için yeterli temiz özgün kaynak henüz yok.`);
 });
}
check('Hero AVIF poster is shipped',()=>assert(existsSync(join(root,'website/assets/hero-stage-clean.avif'))));
boundaries.push('Onaylı kurum/logo listesi, dört gerçek testimonial ve kitaptaki 6 Ayna adları belge/onay gerektirir.');
boundaries.push('75–95 sn sesli gerçek showreel, uygun kaynak yoksa yayınlanamaz; kod kontrolü bunu tamamlanmış saymaz.');
boundaries.push('375/430 tarayıcı kontrolü, fiziksel iPhone Safari/Android Chrome ekran kaydının yerine geçmez.');
boundaries.push('Canlı form teslimi, canlı CMS içerikleri ve Cloudflare dağıtımı ayrıca doğrulanmalıdır.');
console.log(`${passes.length} acceptance checks passed; ${failures.length} failed.`);
for(const failure of failures)console.error(`FAIL: ${failure.label}\n  ${failure.message}`);
for(const boundary of [...new Set(boundaries)])console.log(`OPEN ACCEPTANCE: ${boundary}`);
if(failures.length)process.exitCode=1;
