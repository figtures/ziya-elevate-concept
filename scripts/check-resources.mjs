import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {transformSync,buildSync} from 'esbuild';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {applyResources} from '../cms/resources.mjs';
const read=name=>JSON.parse(readFileSync('cms/'+name+'.json','utf8'));
const templates=read('templates'),seed=read('seed'),styles=read('styles');
for(const bundle of Object.values(styles)){
  const raw=bundle.inputs.map(p=>readFileSync('website'+p,'utf8')).join('\n');
  const {code}=transformSync(raw,{loader:'css',minify:true,target:['chrome109','safari16','firefox115'],legalComments:'inline'});
  assert.equal(readFileSync('public'+bundle.href,'utf8'),code,'Bundle must contain the current CSS in cascade order');
  assert.equal(readFileSync('website'+bundle.href,'utf8'),code,'Asset mirrors must agree');
  assert(bundle.href.includes(createHash('sha256').update(code).digest('hex').slice(0,16)));
}
let count=0;
const built=buildSync({entryPoints:['cms/server.ts'],bundle:true,platform:'node',format:'cjs',write:false,external:['linkedom'],logLevel:'silent'}).outputFiles[0].text;
const module={exports:{}};vm.runInNewContext(built,{module,exports:module.exports,require:createRequire(import.meta.url),URL,AbortSignal,fetch});
const global=seed.find(p=>p.kind==='global');
for(const payload of seed.filter(p=>p.kind!=='global')){
  const {document}=parseHTML(module.exports.render(payload,global));
  const links=[...document.querySelectorAll('link[rel="stylesheet"]')];
  assert.equal(links.length,1,payload.route+' should have one stylesheet');
  assert(existsSync('public'+links[0].getAttribute('href')));
  for(const link of document.querySelectorAll('.ed-wordmark,.footer-wordmark'))assert.equal(link.getAttribute('aria-label'),null,'Brand uses its complete visible accessible name');
  for(const control of document.querySelectorAll('.video-toggle'))assert.equal(control.getAttribute('aria-label'),control.querySelector('.control-label')?.textContent);
  for(const video of document.querySelectorAll('video[data-hero-clip]')){
    assert.equal(video.getAttribute('src'),null,'Inactive clips must not download during HTML parsing');
    assert.match(video.getAttribute('data-src'),/^\/assets\/.*\.mp4$/);
    assert.equal(video.getAttribute('preload'),'none');
  }
  assert(![...document.querySelectorAll('link[rel="preconnect"]')].some(l=>l.getAttribute('href').includes('i.ytimg.com')));
  const once=document.toString();applyResources(document);assert.equal(document.toString(),once,'Resource transform must be idempotent');
  count++;
}
// Keep saved @src field IDs valid: the final SSR transform follows CMS edits.
const {document}=parseHTML('<html><head></head><body><video data-hero-clip="sahne" src="https://media.example.org/custom.mp4"></video></body></html>');
applyResources(document);assert.equal(document.querySelector('video').getAttribute('data-src'),'https://media.example.org/custom.mp4');
const home=parseHTML(templates['/']).document;
assert.equal(home.querySelectorAll('video[data-hero-clip][src]').length,2,'Authored CMS templates retain src bindings');
assert(readFileSync('app/[[...slug]]/route.ts','utf8').includes("'Cache-Control':'no-cache'"),'Public content remains revalidatable');
assert(readFileSync('app/admin/kurulum.sql/route.ts','utf8').includes('no-store'),'Private installer must not become cacheable');
console.log(`PASS: ${count} rendered pages, current CSS bundles/cascade, visible accessible labels, deferred media, CMS src bindings, idempotence and cache policy separation.`);
