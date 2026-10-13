import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {parseHTML} from 'linkedom';
import {buildSync,transformSync} from 'esbuild';
const read=path=>fs.readFileSync(path,'utf8');
const source=parseHTML(read('content/v12/index.html')).document;
const expected=[...source.querySelectorAll('header .nav-links a')].map(a=>[a.textContent.trim(),'/'+a.getAttribute('href').replace(/^\/+|\/+$/g,'')+'/']);
const pages=fs.readdirSync('website',{recursive:true}).filter(x=>x.endsWith('index.html')).map(file=>({route:'/'+file.replace(/index.html$/,''),document:parseHTML(read('website/'+file)).document})).filter(x=>x.document.querySelector('header.site'));
const routes=new Map(pages.map(x=>[x.route,x.document]));
function links(document,selector){return new Set([...document.querySelectorAll(selector)].map(a=>(a.getAttribute('href')||'').split(/[?#]/)[0]));}
function checkReachable(document,documents){
 const first=links(document,'header a[href],footer a[href]');const reached=new Set(first);
 for(const route of first){const page=documents.get(route);if(page)for(const next of links(page,'body > section a[href],main > section a[href]'))reached.add(next);}
 assert.deepEqual([...documents.keys()].filter(route=>!reached.has(route)),[],'Public content must be reachable through navigation and its listing page.');
}
for(const {route,document} of pages){
 assert.deepEqual([...document.querySelectorAll('header .nav-links a')].map(a=>[a.textContent.trim(),a.getAttribute('href')]),expected,'Reference navigation drift: '+route);
 checkReachable(document,routes);
 assert.equal(document.querySelectorAll('footer').length,1);
 assert.equal(document.querySelectorAll('footer details,footer [data-footer-directory]').length,0,'Footer must not contain content archives.');
 assert(document.querySelector('footer a[href="/makaleler/"]'));assert(document.querySelector('footer a[href="/hayattan-notlar/"]'));
 assert.equal([...links(document,'footer a[href]')].filter(path=>/^\/(makaleler|notlar)\/[^/]+\/$/.test(path)).length,0,'Individual article/note links belong on their index pages.');
}
for(const file of ['signature-header.css','site-footer.css']){
 assert.equal(transformSync(read('website/assets/'+file),{loader:'css'}).warnings.length,0);
 assert.equal(read('website/assets/'+file),read('public/assets/'+file));
}
const module={exports:{}};
const output=buildSync({entryPoints:['cms/server.ts'],bundle:true,write:false,platform:'node',format:'cjs',packages:'external'}).outputFiles[0].text;
vm.runInNewContext(output,{module,exports:module.exports,require:createRequire(import.meta.url),URL,AbortSignal,console});
const {render,seed,addNewWriting}=module.exports;
const global=seed.find(x=>x.kind==='global');
const rendered=new Map(seed.filter(x=>x.kind!=='global').map(payload=>[payload.route,parseHTML(render(payload,global)).document]));
for(const document of rendered.values())checkReachable(document,rendered);
for(const [route,kind,newRoute,removed] of [
 ['/makaleler/','article','/makaleler/yeni-makale/','/makaleler/basari-nedir/'],
 ['/hayattan-notlar/','note','/notlar/yeni-not/','/notlar/not-001/']
]){
 const payload=seed.find(x=>x.route===route);
 const entries=seed.filter(x=>x.kind===kind&&x.route!==removed).concat([{route:newRoute,kind,title:'Yeni içerik <img src=x onerror=alert(1)> | Ziya'}]);
 const document=parseHTML(addNewWriting(render(payload,global),entries,route)).document;
 assert.equal(document.querySelector(`.post-list a[href="${removed}"]`),null);
 assert(document.querySelector(`.post-list a[href="${newRoute}"]`));
 assert.equal(document.querySelector(`.post-list a[href="${newRoute}"] img`),null);
 assert.equal(document.querySelector(`footer a[href="${newRoute}"]`),null);
 assert.equal(document.querySelectorAll('footer details').length,0);
}
console.log(`PASS: ${pages.length}/63 routes reachable through menu/footer → listing → detail; source menu unchanged; no footer article archives; new/unpublished articles and notes synchronize on listing pages.`);
