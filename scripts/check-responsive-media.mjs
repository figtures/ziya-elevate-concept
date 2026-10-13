import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {applyContent,setField} from '../cms/render.mjs';
import {applyResponsiveMedia} from '../cms/media.mjs';
import registry from '../cms/responsive-images.json' with {type:'json'};

const data=JSON.parse(readFileSync('cms/seed.json'));
const catalog=JSON.parse(readFileSync('cms/catalog.json'));
const templates=JSON.parse(readFileSync('cms/templates.json'));
const home=data.find(p=>p.route==='/');
const render=payload=>{
 const {document}=parseHTML(templates[payload.template]);
 applyContent(document,payload,catalog[payload.template]);
 return document;
};

let count=0;
for(const payload of data){
 const doc=render(payload);
 for(const image of doc.querySelectorAll('img[srcset]')){
  if(!image.getAttribute('src').startsWith('/assets/responsive/'))continue;
  assert(image.getAttribute('sizes'),'Responsive media must specify its layout size');
  assert.equal(image.getAttribute('decoding'),'async');
  count++;
 }
 const before=doc.toString();applyResponsiveMedia(doc);
 assert.equal(doc.toString(),before,'Media delivery must be idempotent: '+payload.route);
}
assert(count>=10,'All uses of the registered photographs must receive delivery variants');

for(const [original,image] of Object.entries(registry)){
 let previous=0;
 for(const variant of image.variants){
  assert(variant.width>previous&&variant.width<=image.width,'Widths are ordered without upscaling');
  previous=variant.width;
  assert(Math.abs(variant.width/variant.height-image.width/image.height)<0.005,'Original aspect ratio is preserved');
  const source=readFileSync('website'+variant.src),publicAsset=readFileSync('public'+variant.src);
  assert.deepEqual(source,publicAsset);
  assert.equal(source.subarray(8,12).toString(),'WEBP');
  assert.equal(source.byteLength,variant.bytes);
 }
 assert(image.variants.some(v=>v.width===image.width),'Keep native resolution available for high-DPI screens');
 assert(readFileSync('website'+original).length,'Original remains available to the CMS');
}

const doc=render(home);
const stage=doc.querySelector('img[src*="responsive/tedx-oan-sahne-genis"]');
assert(stage?.getAttribute('alt').includes('Ziya'),'Authored alternative text is preserved');
const custom='https://media.example/tedx-oan-sahne-genis.jpg';
setField(doc,{node:stage.getAttribute('data-cms-node'),target:'@src'},custom);
applyResponsiveMedia(doc);
assert.equal(stage.getAttribute('src'),custom,'A matching external basename is not a registered local image');
assert.equal(stage.hasAttribute('srcset'),false,'CMS replacement must remove old variants');
assert.equal(stage.hasAttribute('sizes'),false,'CMS replacement must remove old sizing metadata');

const payload=structuredClone(home);
const photoField=catalog[home.template].fields.find(f=>f.target==='@src'&&home.values[f.id]==='/assets/salon-genis.webp');
assert(photoField,'Home audience photograph must be CMS editable');
payload.values[photoField.id]='/assets/custom-audience.jpg';
const replaced=render(payload).querySelector(`[data-cms-node="${photoField.node}"]`);
assert.equal(replaced.getAttribute('src'),'/assets/custom-audience.jpg');
assert.equal(replaced.hasAttribute('srcset'),false);

const poster=doc.querySelector('video[data-hero-clip="uluslararasi"]');
assert.equal(poster.getAttribute('poster'),registry['/assets/klip-uluslararasi-restored-poster.jpg'].fallback);
const posterNode=poster.getAttribute('data-cms-node'),videoSrc=poster.getAttribute('src');
setField(doc,{node:posterNode,target:'@poster'},'https://media.example/custom-poster.jpg');
applyResponsiveMedia(doc);
assert.equal(poster.getAttribute('poster'),'https://media.example/custom-poster.jpg');
assert.equal(poster.getAttribute('src'),videoSrc,'Poster delivery must not change the hero video sequence');

const art=parseHTML('<picture><source srcset="/custom.avif"><img data-cms-node="photo" src="/assets/tedx-oan-sahne-genis.jpg"></picture>').document;
applyResponsiveMedia(art);assert.equal(art.querySelector('img').getAttribute('src'),'/assets/tedx-oan-sahne-genis.jpg','Explicit picture art direction wins');
setField(art,{node:'photo',target:'@src'},'/assets/replacement.jpg');
assert.equal(art.querySelector('source'),null,'CMS picture replacement cannot retain the old AVIF source');
applyResponsiveMedia(art);assert.equal(art.querySelector('img').getAttribute('src'),'/assets/replacement.jpg');

console.log(`PASS: ${count} responsive photographs across ${data.length} CMS documents; original resolution, local asset identity, deterministic variants, CMS overrides, art direction and video sources preserved.`);
