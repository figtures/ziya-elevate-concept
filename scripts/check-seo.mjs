import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {buildSync} from 'esbuild';
import {parseHTML} from 'linkedom';
import {applyContent} from '../cms/render.mjs';
import {applySEO,canonicalOrigin,indexableRoute,DEFAULT_CANONICAL_ORIGIN} from '../cms/seo.mjs';
const read=name=>JSON.parse(fs.readFileSync('cms/'+name+'.json'));
const seed=read('seed'),catalog=read('catalog'),templates=read('templates'),config=read('config'),socialImages=read('social-images');
const origin=canonicalOrigin(config.canonicalOrigin);
const graph=doc=>JSON.parse(doc.querySelector('script[data-cms-seo]').textContent)['@graph'];
const entity=(doc,type)=>graph(doc).find(n=>n['@type']===type||Array.isArray(n['@type'])&&n['@type'].includes(type));
const nodesText=doc=>[...doc.body.querySelectorAll('h1,h2,h3,p,li,td,th')].map(n=>n.textContent);
function lintGraph(doc){
 const allowed={
  WebSite:['url','name','inLanguage','publisher'],Person:['name','url','sameAs','jobTitle','description'],
  WebPage:['url','name','description','inLanguage','isPartOf','mainEntity','primaryImageOfPage','breadcrumb','hasPart','mentions'],
  ProfilePage:[],CollectionPage:[],ImageObject:['url'],BreadcrumbList:['itemListElement'],
  ListItem:['position','name','item'],Article:['url','headline','description','inLanguage','mainEntityOfPage','publisher','author','datePublished','dateModified','image','citation'],
  BlogPosting:[],Book:['name','inLanguage','author','description','image','url','datePublished'],
  ItemList:['name','numberOfItems','itemListElement'],CreativeWork:['name','url','inLanguage','creator','image'],
  FAQPage:['mainEntity'],Question:['name','acceptedAnswer'],Answer:['text'],
  Service:['url','name','serviceType','provider','mainEntityOfPage','description','availableChannel','audience'],
  ServiceChannel:['serviceUrl'],Audience:['audienceType']
 };
 allowed.BlogPosting=allowed.Article;
 const ids=new Set(),refs=[];
 function visit(value){
  if(Array.isArray(value)){value.forEach(visit);return;}
  if(!value||typeof value!=='object')return;
  if(value['@type']){
   const types=[value['@type']].flat();types.forEach(t=>assert(t in allowed,'Unknown schema type: '+t));
   const keys=new Set(types.flatMap(t=>allowed[t]));
   for(const key of Object.keys(value))if(!key.startsWith('@'))assert(keys.has(key),types.join('/')+' has unsupported property '+key);
   if(value['@id']){assert(!ids.has(value['@id']),'Duplicate entity ID: '+value['@id']);ids.add(value['@id']);}
  }else if(value['@id'])refs.push(value['@id']);
  for(const [key,item]of Object.entries(value)){
   if(['url','serviceUrl','image','@id'].includes(key)&&typeof item==='string')assert.match(item,/^https:\/\/[^\s<>]+$/,'Unsafe or relative schema URL');
   if(['datePublished','dateModified'].includes(key))assert.match(item,/^\d{4}(?:-\d{2}-\d{2})?$/);
   visit(item);
  }
  if(value['@type']==='ItemList'){
   assert.equal(value.numberOfItems,value.itemListElement.length);
   assert.deepEqual(value.itemListElement.map(n=>n.position),value.itemListElement.map((_,i)=>i+1));
  }
 }
 visit(graph(doc));refs.forEach(id=>assert(ids.has(id),'Unresolved entity reference: '+id));
}
function dom(payload,seo=true){
 const document=parseHTML(templates[payload.template]).document;
 applyContent(document,payload,catalog[payload.template],{global:payload.kind==='global'});
 const global=seed.find(p=>p.kind==='global');
 if(payload.kind!=='global'){
  const shared=parseHTML(templates._global).document;
  applyContent(shared,global,catalog._global,{global:true});
  for(const selector of ['body > header','body > footer']) document.querySelector(selector)?.replaceWith(shared.querySelector(selector));
 }
 if(seo)applySEO(document,payload,origin);
 return document;
}
function check(doc,payload){
 const url=origin+payload.route;
 assert.equal(doc.documentElement.lang,'tr',payload.route);
 assert.equal(doc.title,payload.title,payload.route);
 for(const [selector,value]of [['meta[name="description"]',payload.description],['link[rel="canonical"]',url],['meta[property="og:url"]',url],['meta[property="og:title"]',payload.title],['meta[name="twitter:title"]',payload.title],['meta[property="og:description"]',payload.description],['meta[name="twitter:description"]',payload.description]]){
  assert.equal(doc.querySelectorAll(selector).length,1,selector+' '+payload.route);
  assert.equal(doc.querySelector(selector).getAttribute(selector.startsWith('link')?'href':'content'),value,selector+' '+payload.route);
 }
 for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])assert.match(doc.querySelector(selector).getAttribute('content'),/^https:\/\//);
 const image=new URL(doc.querySelector('meta[property="og:image"]').content),registered=image.origin===origin?socialImages[image.pathname]:null;
 if(registered){
  for(const key of ['width','height','type'])assert.equal(doc.querySelector(`meta[property="og:image:${key}"]`)?.content,String(registered[key]),payload.route+' '+key);
  const alt=payload.ogImageAlt||registered.alt;assert.equal(doc.querySelector('meta[property="og:image:alt"]')?.content,alt);assert.equal(doc.querySelector('meta[name="twitter:image:alt"]')?.content,alt);
 }
 assert.equal(doc.querySelectorAll('script[type="application/ld+json"]').length,1);
 assert.equal(doc.querySelector('meta[name="robots"]').content,'index, follow, max-image-preview:large');
 const g=graph(doc),page=entity(doc,'WebPage'),person=entity(doc,'Person');
 assert.equal(page.url,url);assert.equal(page['@id'],url+'#webpage');
 assert.equal(person.url,origin+'/ziya-sakir-yilmaz/');
 for(const key of ['birthDate','alumniOf','memberOf','author','knowsAbout'])assert.equal(person[key],undefined,key+' must not copy unsupported template claims');
 if(payload.route==='/ziya-sakir-yilmaz/')assert.deepEqual(person.jobTitle,doc.querySelector('.page-hero .eyebrow').textContent.split('·').map(s=>s.trim()));
 else assert.equal(person.jobTitle,undefined);
 assert(!JSON.stringify(g).includes('"uploadDate"'));
 assert(!JSON.stringify(g).includes('"aggregateRating"'));
 lintGraph(doc);
 if(payload.route!=='/'){
  const crumbs=entity(doc,'BreadcrumbList');assert(crumbs);
  assert.equal(crumbs.itemListElement.at(-1).item,url);
  assert.deepEqual(crumbs.itemListElement.map(x=>x.position),crumbs.itemListElement.map((_,i)=>i+1));
 }
 if(['article','note'].includes(payload.kind)){
  const article=entity(doc,payload.kind==='article'?'Article':'BlogPosting');assert(article);
  assert.equal(article.url,url);assert.equal(article.mainEntityOfPage['@id'],url+'#webpage');
  assert.equal(article.author?.['@id'],person['@id'],'Published writing must resolve its visible author');
  if(payload.kind==='article'){assert.equal(article.datePublished,'2026-09-29');assert.equal(article.dateModified,'2026-09-29');}
  else assert.match(article.datePublished,/^2026-09-(?:2[1-9])$/);
 }
 const first=doc.head.innerHTML;applySEO(doc,payload,origin);assert.equal(doc.head.innerHTML,first,'SEO must be idempotent: '+payload.route);
}
let checked=0;
for(const payload of seed){
 if(payload.kind==='global'){
  const d=dom(payload,false),before=d.toString();applySEO(d,payload,origin);assert.equal(d.toString(),before);continue;
 }
 const d=dom(payload,false),before=nodesText(d);applySEO(d,payload,origin);assert.deepEqual(nodesText(d),before,'Body copy changed');check(d,payload);checked++;
 // Raw authored templates must receive the same complete head contract.
 const raw=parseHTML(templates[payload.template]).document;applySEO(raw,payload,origin);check(raw,payload);
}
const source=seed.find(p=>p.kind==='article'),edited=structuredClone(source);
edited.route='/makaleler/yeni-deneme/';edited.title='Yeni başlık </script><img src=x onerror=alert(1)>';edited.description='Yeni açıklama <em>metin</em>';edited.ogImage='/assets/hero-poster.jpg';
let article=dom(edited);assert.equal(article.querySelector('link[rel="canonical"]').getAttribute('href'),origin+edited.route);
assert.equal(entity(article,'Article').url,origin+edited.route);assert.equal(entity(article,'Article')['@id'],origin+edited.route+'#article');
assert.equal(article.querySelector('meta[property="og:image"]').getAttribute('content'),origin+'/assets/hero-poster.jpg');
assert.equal(article.head.querySelector('img'),null);assert(!article.querySelector('script[data-cms-seo]').textContent.includes('</script>'));
// Missing/duplicate head nodes are created and deduplicated safely.
article.head.querySelectorAll('meta[name^="twitter:"],meta[property="og:site_name"]').forEach(n=>n.remove());
article.head.append(article.querySelector('link[rel="canonical"]').cloneNode(true));applySEO(article,edited,origin);
assert.equal(article.querySelectorAll('link[rel="canonical"]').length,1);assert.equal(article.querySelector('meta[name="twitter:title"]').content,edited.title);
// Published authors follow visible bylines, independently of the site publisher.
article=dom(source,false);let byline=article.querySelector('article a[href="/ziya-sakir-yilmaz/"]').parentElement;
byline.querySelector('b').textContent='Konuk Yazar';applySEO(article,source,origin);
assert.equal(entity(article,'Article').author.name,'Konuk Yazar');assert.equal(entity(article,'Article').author.url,undefined);assert.equal(entity(article,'Article').publisher['@id'],origin+'/ziya-sakir-yilmaz/#person');
byline.hidden=true;applySEO(article,source,origin);assert.equal(entity(article,'Article').author,undefined);
const relAuthor=article.createElement('a');relAuthor.rel='author';relAuthor.href='/ziya-sakir-yilmaz/';relAuthor.textContent='Ziya Şakir Yılmaz';article.querySelector('article').append(relAuthor);applySEO(article,source,origin);assert.equal(entity(article,'Article').author['@id'],origin+'/ziya-sakir-yilmaz/#person');
const cite=article.createElement('a');cite.rel='cite';cite.href='https://doi.org/10.1002/ejsp.674';cite.title='How are habits formed';cite.textContent='Lally';article.querySelector('article').append(cite);article.querySelector('article').append(cite.cloneNode(true));applySEO(article,source,origin);assert.equal(entity(article,'Article').citation.length,1);assert.equal(entity(article,'Article').citation[0].url,cite.href);article.querySelectorAll('a[rel="cite"]').forEach(n=>n.hidden=true);applySEO(article,source,origin);assert.equal(entity(article,'Article').citation,undefined);
// Dates and full FAQ answers must follow edits to visible content, not template schema.
article=dom(source,false);article.querySelectorAll('article .hero-note').forEach(n=>{if(n.textContent.includes('Yayın:'))n.textContent='Yayın: 12 Ekim 2026 · Son güncelleme: 13 Ekim 2026';});
const detail=article.querySelector('.faq details');detail.querySelector('summary').textContent='Değişen soru?';detail.querySelector('.a').textContent='Değişen yanıt.';
applySEO(article,source,origin);assert.equal(entity(article,'Article').datePublished,'2026-10-12');assert.equal(entity(article,'Article').dateModified,'2026-10-13');assert.equal(entity(article,'FAQPage').mainEntity[0].name,'Değişen soru?');assert(entity(article,'FAQPage').mainEntity[0].acceptedAnswer.text.includes('Değişen yanıt.'));
article.querySelectorAll('article .hero-note').forEach(n=>{if(n.textContent.includes('Yayın:'))n.textContent='Yayın: 31 Şubat 2026';});applySEO(article,source,origin);assert.equal(entity(article,'Article').datePublished,undefined);assert.equal(entity(article,'Article').dateModified,undefined);
article.querySelectorAll('article .hero-note').forEach(n=>{if(n.textContent.includes('Yayın:'))n.textContent='Yayın: 12 Ekim 2026 · Son güncelleme: 10 Ekim 2026';});applySEO(article,source,origin);assert.equal(entity(article,'Article').dateModified,undefined,'Modification cannot predate publication');
// Book edits, reordering and cloned cards remain in exact visible order.
const books=structuredClone(seed.find(p=>p.route==='/kitaplar/')),bookSection=books.sections.find(s=>s.groups.length),bookGroup=bookSection.groups[0];
bookGroup.items.reverse();const cloned=structuredClone(bookGroup.items[0]);cloned.id='seo-copy-book';bookGroup.items.push(cloned);
const bookDOM=dom(books,false);const titles=[...bookDOM.querySelectorAll('.book-editorial-list > article h2')];titles.at(-1).textContent='Yeni kitap <script>başlık</script>';applySEO(bookDOM,books,origin);
const bookItems=entity(bookDOM,'ItemList').itemListElement;assert.equal(bookItems.length,5);assert.equal(bookItems.find(n=>n.item.name==='İlk 72 Saat').item.author[1].name,'Emre Topçu');assert.deepEqual(bookItems.map(n=>n.item.name),titles.map(n=>n.textContent));assert.equal(bookDOM.querySelector('h2 script'),null);
const speaker=seed.find(p=>p.route==='/konusmaci/'),talkDOM=dom(speaker,false);const talkArchive=talkDOM.querySelector('.talk-archive');talkArchive.prepend(talkArchive.lastElementChild);talkArchive.firstElementChild.querySelector('h3').textContent='Güncel konuşma';talkArchive.firstElementChild.href='https://www.youtube.com/watch?v=aaaaaaaaaaa';applySEO(talkDOM,speaker,origin);
const talkItems=entity(talkDOM,'ItemList').itemListElement;assert.equal(talkItems.length,4);assert.equal(talkItems[0].item.name,'Güncel konuşma');assert.equal(talkItems[0].item.url,'https://www.youtube.com/watch?v=aaaaaaaaaaa');assert(!entity(talkDOM,'VideoObject'));
// The five actual services describe the visible page and actual enquiry channel only.
let services=0;
for(const p of seed.filter(p=>p.kind==='page')){
 const d=dom(p),service=entity(d,'Service');if(!service)continue;services++;
 const heading=d.querySelector('h1').cloneNode(true);heading.querySelectorAll('br').forEach(n=>n.replaceWith(' '));assert.equal(service.name,heading.textContent.replace(/\s+/g,' ').trim());
 assert.equal(service.provider['@id'],origin+'/ziya-sakir-yilmaz/#person');assert.equal(service.mainEntityOfPage['@id'],origin+p.route+'#webpage');
 assert.equal(new URL(service.availableChannel.serviceUrl).pathname,'/iletisim/');
 for(const key of ['offers','aggregateRating','areaServed','review'])assert.equal(service[key],undefined);
}
assert.equal(services,5);
const programDOM=dom(seed.find(p=>p.route==='/egitimler/')),programs=entity(programDOM,'ItemList');assert.equal(programs.numberOfItems,3);assert(programs.itemListElement.every(x=>x.item['@type']==='Service'));lintGraph(programDOM);
// Archive schema uses all final DOM groups, excludes hidden/unsafe/removed links, and preserves the displayed order.
for(const route of ['/makaleler/','/hayattan-notlar/']){
 const p=seed.find(p=>p.route===route),d=dom(p,false),prefix=route==='/makaleler/'?'/makaleler/':'/notlar/';
 const current=[...d.querySelectorAll('.post-list > a')];assert.equal(current.length,route==='/makaleler/'?30:9);
 current.at(-1).remove();current[0].hidden=true;
 const a=d.createElement('a');a.href=prefix+'yeni-yazi/';a.innerHTML='<span></span><span class="cat">Kategori</span>';a.firstElementChild.textContent='Yeni yazı <script>alert(1)</script>';d.querySelector('.post-list').prepend(a);
 const bad=a.cloneNode(true);bad.href='javascript:alert(1)';d.querySelector('.post-list').prepend(bad);
 const duplicate=a.cloneNode(true);d.querySelector('.post-list').append(duplicate);
 applySEO(d,p,origin);const list=entity(d,'ItemList');assert.equal(list.numberOfItems,current.length-1);assert.equal(list.itemListElement[0].item.url,origin+prefix+'yeni-yazi/');assert.equal(list.itemListElement[0].item.name,a.firstElementChild.textContent);assert(!JSON.stringify(list).includes('javascript:'));lintGraph(d);
}
// Legacy local media is served from the selected public origin. External source images keep their origin.
for(const value of ['https://ziyasakiryilmaz.com/assets/hero-poster.jpg','https://www.ziyasakiryilmaz.com/assets/hero-poster.jpg','/assets/hero-poster.jpg']){
 const p={...source,ogImage:value},d=dom(p);assert.equal(d.querySelector('meta[property="og:image"]').content,origin+'/assets/hero-poster.jpg');assert.equal(entity(d,'Article').image,origin+'/assets/hero-poster.jpg');
}
assert.equal(dom({...source,ogImage:'https://cdn.example.org/photo.jpg'}).querySelector('meta[property="og:image"]').content,'https://cdn.example.org/photo.jpg');
for(const unsafe of ['javascript:alert(1)','data:image/svg+xml,<svg/>','//evil.example/x.jpg','https://name:secret@evil.example/image.jpg','https://safe.example\\@evil.example/x.jpg','https://evil.example/ x.jpg']){
 const d=dom({...source,ogImage:unsafe});assert(!d.querySelector('meta[property="og:image"]').content.includes('evil.example'));lintGraph(d);
}
// A generated card's measured geometry/alt may only describe that exact local image.
const [cardURL,card]=Object.entries(socialImages)[0];assert.ok(cardURL,'Generated social image registry is empty');
const registeredPayload={...source,ogImage:cardURL,ogImageAlt:'Kartın özgün açıklaması',ogImageAltFor:cardURL};
const registeredDOM=dom(registeredPayload);assert.equal(registeredDOM.querySelector('meta[property="og:image:width"]').content,String(card.width));assert.equal(registeredDOM.querySelector('meta[name="twitter:image:alt"]').content,registeredPayload.ogImageAlt);
const relocated=dom(registeredPayload,false);applySEO(relocated,registeredPayload,'https://new-brand.example');assert.equal(relocated.querySelector('meta[property="og:image"]').content,'https://new-brand.example'+cardURL);assert.equal(relocated.querySelector('meta[property="og:image:width"]').content,String(card.width));assert.equal(relocated.querySelector('meta[property="og:image:alt"]').content,registeredPayload.ogImageAlt);
for(const customURL of ['https://cdn.example.org/new.jpg','https://cdn.example.org'+cardURL,cardURL+'?width=300']){
 const replacement=dom(registeredPayload,false);applySEO(replacement,{...registeredPayload,ogImage:customURL},origin);
 for(const key of ['width','height','type','alt'])assert.equal(replacement.querySelector(`meta[property="og:image:${key}"]`),null,'Stale image '+key+' on '+customURL);
 assert.equal(replacement.querySelector('meta[name="twitter:image:alt"]'),null);
}
const customPayload={...source,ogImage:'https://cdn.example.org/new.jpg',ogImageAlt:'Yeni görsel: <img src=x onerror=alert(1)>',ogImageAltFor:'https://cdn.example.org/new.jpg'},customDOM=dom(customPayload);
assert.equal(customDOM.querySelector('meta[property="og:image:alt"]').content,customPayload.ogImageAlt);assert.equal(customDOM.head.querySelector('img'),null);assert.equal(customDOM.querySelector('meta[property="og:image:width"]'),null);
assert.equal(dom({...customPayload,ogImageAlt:'a'.repeat(800)}).querySelector('meta[property="og:image:alt"]').content.length,420);
const invalidImage=dom({...registeredPayload,ogImage:'javascript:alert(1)'});assert.equal(invalidImage.querySelector('meta[property="og:image"]').content,new URL(invalidImage.querySelector('.hero-vid img')?.getAttribute('src')||invalidImage.querySelector('.hero-vid video')?.getAttribute('poster'),origin).href);assert.notEqual(invalidImage.querySelector('meta[property="og:image:alt"]')?.content,registeredPayload.ogImageAlt);
const legacyAlt=dom({...source,ogImage:cardURL,ogImageAlt:undefined,ogImageAltFor:undefined});assert.equal(legacyAlt.querySelector('meta[property="og:image:alt"]').content,card.alt);
for(const metaName of ['robots','ROBOTS']){
 const d=dom(source,false);d.querySelectorAll('meta[name="robots"]').forEach(n=>n.remove());const policy=d.createElement('meta');policy.name=metaName;policy.content='noindex, nofollow, max-image-preview:none';d.head.append(policy);applySEO(d,source,origin);
 const policies=[...d.head.querySelectorAll('meta[name]')].filter(n=>n.name.toLowerCase()==='robots');assert.equal(policies.length,1);assert.equal(policies[0].content,'noindex, nofollow, max-image-preview:none');
}
// Canonical setting and the safe fallback point to the explicitly approved public deployment.
assert.equal(canonicalOrigin('javascript:alert(1)'),DEFAULT_CANONICAL_ORIGIN);assert.equal(canonicalOrigin('https://user:pass@evil.example'),DEFAULT_CANONICAL_ORIGIN);assert.equal(canonicalOrigin('https://brand.example/path?q=1'),'https://brand.example');
for(const route of ['/admin/','/admin/users/','/api/','/assets/','/_global/','https://evil.example/','//evil.example/','/path?query/','/testler/basari-muhendisligi-skoru/','/testler/satis-yetkinlik-skoru/','/testler/liderlik-yetkinlik-skoru/'])assert(!indexableRoute(route),route);
for(const route of ['/','/makaleler/yeni-makale/','/testler/kafa-yapisi-testi/'])assert(indexableRoute(route));
function bundle(file,globals={}){const output=buildSync({entryPoints:[file],bundle:true,write:false,platform:'node',format:'cjs',packages:'external'}).outputFiles[0].text;const module={exports:{}};vm.runInNewContext(output,{module,exports:module.exports,require:createRequire(import.meta.url),URL,AbortSignal,Response,console,...globals});return module.exports;}
// Exercise the actual SSR entry point, not only the helper, on every served document.
const server=bundle('cms/server.ts'),global=seed.find(p=>p.kind==='global');
for(const payload of seed.filter(p=>p.kind!=='global'))check(parseHTML(server.render(payload,global)).document,payload);
// Regression: production SSR must update ALL archive groups before it builds JSON-LD.
for(const [route,kind]of [['/makaleler/','article'],['/hayattan-notlar/','note']]){
 const payload=structuredClone(seed.find(p=>p.route===route)),base=dom(payload,false),originalLinks=[...base.querySelectorAll('.post-list > a')];
 const removed=originalLinks.at(-1).getAttribute('href'),changed=originalLinks.at(-2).getAttribute('href'),first=originalLinks[0].getAttribute('href');
 const groups=payload.sections.flatMap(s=>s.groups);
 // Simulate an editor duplicating an item inside the first group and in a later group.
 const group=groups[0],copy=structuredClone(group.items[0]);copy.id='seo-duplicate-first';group.items.push(copy);
 if(groups.length>1){const last=groups.at(-1),definition=catalog[payload.template].groups.find(g=>g.id===last.id).items[0],href=definition.fields.find(f=>f.endsWith(':@href'));last.items[0].values[href]=first;}
 const entries=seed.filter(p=>p.kind===kind&&p.route!==removed).map(p=>({route:p.route,kind,title:p.route===changed?'Güncellenen başlık | Ziya Şakir Yılmaz':p.title}));
 const newRoute=(kind==='article'?'/makaleler/':'/notlar/')+'canli-yeni-yazi/',newTitle='Yeni yazı <script>alert(1)</script>';
 entries.push({route:newRoute,kind,title:newTitle});entries.push({...entries.at(-1)});
 const final=parseHTML(server.render(payload,global,entries)).document,links=[...final.querySelectorAll('.post-list > a')],list=entity(final,'ItemList');
 assert.equal(links.length,new Set(entries.map(p=>p.route)).size);
 assert.equal(new Set(links.map(a=>a.getAttribute('href'))).size,links.length);
 assert(!links.some(a=>a.getAttribute('href')===removed),'Unpublished item remains in final DOM');
 assert.equal(links.find(a=>a.getAttribute('href')===changed).querySelector('span').textContent.trim(),originalLinks.find(a=>a.getAttribute('href')===changed).querySelector('span').textContent.trim());
 assert.equal(links.find(a=>a.getAttribute('href')===newRoute).querySelector('span').textContent,newTitle);
 assert.equal(final.querySelector('.post-list script'),null);
 assert.deepEqual(list.itemListElement.map(e=>({url:e.item.url,name:e.item.name})),links.map(a=>({url:origin+a.getAttribute('href'),name:a.querySelector('span:not(.cat)').textContent.trim()})));
 lintGraph(final);
 // Empty publication set removes all entries and must not leave old ItemList schema.
 const empty=parseHTML(server.render(payload,global,[])).document;assert.equal(empty.querySelectorAll('.post-list > a').length,0);assert.equal(entity(empty,'ItemList'),undefined);
}
// The source links added by applyAEO must be present before Article.citation is computed.
const cited=seed.find(p=>p.route==='/makaleler/aliskanlik-kazanmak-kac-gun-surer/'),citedDOM=parseHTML(server.render(cited,global)).document;
const visibleCiteURLs=[...new Set([...citedDOM.querySelectorAll('article a[rel~="cite"]')].map(a=>a.href))];
assert(visibleCiteURLs.length>0);assert.deepEqual(entity(citedDOM,'Article').citation.map(c=>c.url),visibleCiteURLs);
// Pagination tests execute the actual server function with an isolated fetch mock, never a live database.
const calls=[],remoteRows=Array.from({length:1203},(_,i)=>({route:'/makaleler/test-'+String(i).padStart(4,'0')+'/',kind:'article',title:'Yazı '+i}));
let mode='rows',rowLimit=1203;
const remote=bundle('cms/server.ts',{fetch:async(input,options)=>{
 const url=new URL(input);calls.push({url,options});
 if(mode==='http-error')return new Response('Unavailable',{status:503});
 if(mode==='invalid')return Response.json({unexpected:true});
 const offset=Number(url.searchParams.get('offset'));return Response.json(remoteRows.slice(0,rowLimit).slice(offset,offset+500));
}});
remote.config.enabled=true;remote.config.url='https://cms-test.example';remote.config.publishableKey='isolated-test-public-key';
let fetched=await remote.publishedIndex('article');assert.equal(fetched.length,1203);assert.equal(new Set(fetched.map(p=>p.route)).size,1203);assert.deepEqual(calls.map(c=>Number(c.url.searchParams.get('offset'))),[0,500,1000]);
for(const {url,options}of calls){assert.equal(url.searchParams.get('limit'),'500');assert.equal(url.searchParams.get('order'),'route.asc');assert.equal(url.searchParams.get('kind'),'eq.article');assert.equal(options.cache,'no-store');assert.equal(options.headers.apikey,'isolated-test-public-key');}
calls.length=0;rowLimit=500;fetched=await remote.publishedIndex();assert.equal(fetched.length,500);assert.deepEqual(calls.map(c=>Number(c.url.searchParams.get('offset'))),[0,500]);assert(calls.every(c=>!c.url.searchParams.has('kind')));
mode='http-error';await assert.rejects(remote.publishedIndex(),/yüklenemedi/);mode='invalid';await assert.rejects(remote.publishedIndex(),/geçersiz/);
// Keep the sitemap regression isolated when the deployed CMS configuration is enabled.
const sitemap=await bundle('app/sitemap.xml/route.ts',{fetch:async()=>Response.json(seed.map(({route,kind,title})=>({route,kind,title})))}).GET(),xml=await sitemap.text();
assert.equal(sitemap.status,200);assert.equal((xml.match(/<loc>/g)||[]).length,checked);assert(!/admin|_global|testler\/(?:basari-muhendisligi|satis-yetkinlik|liderlik-yetkinlik)-skoru/.test(xml));assert(xml.includes('<loc>'+origin+'/</loc>'));for(const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g))assert.equal(new URL(m[1]).origin,origin);
const robots=await bundle('app/robots.txt/route.ts').GET(),robotsText=await robots.text();assert(robotsText.includes('Sitemap: '+origin+'/sitemap.xml'));assert(robotsText.includes('Disallow: /admin/'));assert(robotsText.includes('Disallow: /api/'));
console.log(`PASS: ${checked} raw templates and ${checked} final SSR pages: unique metadata, coherent schema graph references/properties, visible author/date/FAQ parity, 5 services, 3 programs, final SSR archive synchronization and AEO citation order, 1203-row pagination with empty/error boundaries, book/talk reordering, malicious URL and JSON-LD injection safety, canonical media remapping, sitemap and robots. Global excluded.`);
