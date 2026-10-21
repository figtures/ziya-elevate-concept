/** Customer revision checks: real handler payloads, honest outcomes and language/canonical identity. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {applySEO} from '../cms/seo.mjs';
import {applyExperience} from '../cms/experience.mjs';
import {resolveDeploymentConfig,isPreviewOrigin} from '../cms/domain.mjs';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const config=JSON.parse(read('cms/config.json'));
let checked=0;
for(const [route,file,language] of [['/iletisim/','website/iletisim/index.html','tr'],['/en/speaker/','website/en/speaker/index.html','en']]){
 const {document,window}=parseHTML(read(file));
 assert.equal(document.querySelector('#contactForm').dataset.language,language);
 for(const id of ['ad','ep','telefon','sehir','firma','mesaj','etkinlik-tarihi','katilimci-sayisi'])assert(document.getElementById(id),`${language}: ${id}`);
 assert.equal(document.getElementById('etkinlik-tarihi').type,'date');
 assert.deepEqual([...document.querySelectorAll('#katilimci-sayisi option')].map(n=>n.getAttribute('value')),['','under-100','100-500','500+']);
 applyExperience(document,{route,kind:'page',template:route},undefined,{leadsEnabled:true});
 const input={ad:'Revision QA',ep:'qa@example.org',telefon:'+90 555 123 4567',sehir:'Istanbul',firma:'Test company',ekip:'40',mesaj:'This is a local validation test.', 'etkinlik-tarihi':'2027-05-04','katilimci-sayisi':'100-500'};
 for(const [id,value] of Object.entries(input)){const node=document.getElementById(id);if(node.tagName==='SELECT')node.querySelector(`[value="${value}"]`).setAttribute('selected','');else node.value=value;}
 const topic=document.getElementById('konu');topic.querySelector('[value=konusmaci]').setAttribute('selected','');Object.defineProperty(topic,'selectedOptions',{get(){return [topic.querySelector('[selected]')];}});
 document.getElementById('contactForm').reportValidity=()=>true;document.getElementById('contactPreview').scrollIntoView=()=>{};
 const script=document.createElement('script');script.dataset.endpoint='https://example.invalid/submit';script.dataset.key='publishable';Object.defineProperty(document,'currentScript',{value:script});
 let sent,result={ok:true,id:'persisted-record-id'},responseOK=true;
 const context={document,AbortSignal,fetch:async(_url,request)=>{sent=JSON.parse(request.body);return {ok:responseOK,json:async()=>result};}};vm.createContext(context);vm.runInContext(read('public/assets/cms-contact.js'),context);
 const submit=async()=>{document.getElementById('contactForm').dispatchEvent(new window.Event('submit',{cancelable:true}));for(let i=0;i<10;i++)await Promise.resolve();};
 await submit();
 assert.equal(sent.topic,'konusmaci');assert.equal(sent.team_size,'100–500');assert.equal(sent.company,'Test company');
 for(const value of ['+90 555 123 4567','Istanbul','2027-05-04','100–500',input.mesaj])assert(sent.message.includes(value),value);
 assert(document.querySelector('#contactPreview p').textContent.includes(language==='en'?'within 48 hours':'48 saat'));
 result={ok:true};await submit();assert(!document.querySelector('#contactPreview p').textContent.includes(language==='en'?'within 48 hours':'48 saat'),'Missing database ID must not report success');
 responseOK=false;result={ok:false,error:'Service unavailable'};await submit();assert(document.querySelector('#contactPreview p').textContent.includes('Service unavailable'));
 topic.querySelector('[selected]').removeAttribute('selected');topic.querySelector('[value=bireysel]').setAttribute('selected','');responseOK=true;result={ok:true,id:'second-id'};await submit();assert.equal(sent.company,'');assert.equal(sent.team_size,'');assert(!sent.message.includes('Etkinlik tarihi:'));
 checked+=11;
}
for(const route of ['/konusmaci/','/en/speaker/']){
 const {document}=parseHTML(read('website'+route+'index.html'));applySEO(document,{route,template:route,kind:'page',title:route.startsWith('/en/')?'Ziya Şakir Yılmaz | Keynote Speaker':'Ziya Şakir Yılmaz | Konuşmacı',description:'A keynote speaking programme.'});
 assert.equal(document.documentElement.lang,route.startsWith('/en/')?'en':'tr');
 assert.equal(document.querySelector('link[rel=canonical]').href,'https://ziyasakiryilmaz.com'+route);
 for(const lang of ['tr','en','x-default'])assert(document.querySelector(`link[hreflang="${lang}"]`));
 const graph=JSON.parse(document.querySelector('script[data-cms-seo]').textContent)['@graph'];assert.equal(graph.find(n=>n['@id'].endsWith('#webpage')).inLanguage,route.startsWith('/en/')?'en':'tr');checked+=6;
}
const resolved=resolveDeploymentConfig(config,'https://ziya-sakir-yilmaz.busratechnology.workers.dev');assert.equal(resolved.canonicalOrigin,'https://ziyasakiryilmaz.com');assert(isPreviewOrigin(new Request(resolved.siteOrigin),resolved));assert(!isPreviewOrigin(new Request(resolved.canonicalOrigin),resolved));checked+=3;
console.log(`PASS ${checked} customer contact and SEO checks; no external writes.`);
// Exercise the actual Worker response wrapper so previews are noindex for every surface.
const {build}=await import('esbuild');
const bundleImport=async(options)=>{const output=await build({bundle:true,write:false,format:'esm',platform:'node',...options});return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));};
const worker=await bundleImport({entryPoints:[new URL('../build/sites-worker.ts',import.meta.url).pathname],define:{'import.meta.env.DEV':'false'},plugins:[{name:'isolated-handler',setup(build){build.onResolve({filter:/^vinext\/server\/fetch-handler$|connector-context$/},args=>({path:args.path,namespace:'qa'}));build.onLoad({filter:/.*/,namespace:'qa'},args=>({contents:args.path.includes('connector-context')?'export const runWithConnectorBinding=(_,callback)=>callback();':'export default {fetch:async()=>new Response("fixture",{headers:{"Content-Type":"text/html"}})};'}));}}]});
for(const route of ['/','/iletisim/','/en/speaker/','/robots.txt','/sitemap.xml','/admin/']){
 const response=await worker.default.fetch(new Request('https://ziya-sakir-yilmaz.busratechnology.workers.dev'+route),{},{});assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
}
assert.equal((await worker.default.fetch(new Request('https://ziyasakiryilmaz.com/'),{},{})).headers.get('X-Robots-Tag'),null);
const robots=await bundleImport({entryPoints:[new URL('../app/robots.txt/route.ts',import.meta.url).pathname]});
const previewRobots=robots.GET(new Request('https://ziya-sakir-yilmaz.busratechnology.workers.dev/robots.txt'));assert.match(await previewRobots.text(),/Disallow: \/\n/);assert.match(previewRobots.headers.get('X-Robots-Tag'),/noindex/);
const productionRobots=await robots.GET(new Request('https://ziyasakiryilmaz.com/robots.txt')).text();assert.match(productionRobots,/Sitemap: https:\/\/ziyasakiryilmaz\.com\/sitemap.xml/);
console.log('PASS preview noindex on all six surfaces, production indexability and robots policies.');
