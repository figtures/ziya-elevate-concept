import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {applyContent,validateDocument} from '../cms/render.mjs';
const read=name=>JSON.parse(fs.readFileSync('cms/'+name+'.json','utf8'));
const seed=read('seed'), catalog=read('catalog'), templates=read('templates');
const clone=structuredClone;
const home=seed.find(p=>p.route==='/'), def=catalog['/'];
const render=(p)=>{const {document}=parseHTML(templates[p.template]);applyContent(document,p,catalog[p.template],{global:p.kind==='global'});return document;};
const original=render(home);
assert.equal(original.querySelector('picture source').getAttribute('srcset'),'/assets/hero-poster.avif','Unchanged CMS render must preserve efficient AVIF');
for(const selector of ['[data-tedx-hero]','[data-hero-clip="sahne"]','[data-hero-clip="uluslararasi"]']){
 const element=original.querySelector(selector);
 for(const attribute of selector==='[data-tedx-hero]'?['data-video-id','data-clip-start','data-clip-end']:['src','poster']){
  assert(def.fields.some(f=>f.node===element.getAttribute('data-cms-node')&&f.target==='@'+attribute),'Missing editable hero binding '+selector+' '+attribute);
 }
}
const edited=clone(home),intro=original.querySelector('[data-tedx-hero]').getAttribute('data-cms-node');
edited.values[intro+':@data-video-id']='NTmsBaoUm5s';edited.values[intro+':@data-clip-start']='12';edited.values[intro+':@data-clip-end']='16';
const poster=original.querySelector('picture img').getAttribute('data-cms-node');edited.values[poster+':@src']='/assets/salon-genis.webp';
const replaced=render(edited);assert.equal(replaced.querySelector('picture source'),null,'Replacement must not be hidden by original AVIF');assert.equal(replaced.querySelector('picture img').getAttribute('src'),read('responsive-images')['/assets/salon-genis.webp'].fallback);assert.equal(replaced.querySelector('[data-tedx-hero]').dataset.videoId,'NTmsBaoUm5s');assert.deepEqual(validateDocument(edited,def),[]);
edited.values[intro+':@data-clip-end']='11';assert(validateDocument(edited,def).some(x=>x.includes('bitişi')),'Clip end must follow start');edited.values[intro+':@data-clip-end']='16';edited.values[intro+':@data-video-id']='bad';assert(validateDocument(edited,def).some(x=>x.includes('YouTube')));
let dimensioned=0;for(const page of seed.filter(p=>p.kind!=='global')){const doc=render(page);for(const image of doc.querySelectorAll('img[src^="/assets/"]')){assert(Number(image.getAttribute('width'))>0&&Number(image.getAttribute('height'))>0,'Missing image aspect ratio on '+page.route);dimensioned++;}}
const global=clone(seed.find(p=>p.kind==='global')),gd=catalog[global.template];const footer=global.sections.find(s=>gd.sections.find(d=>d.id===s.source).tag==='footer');assert.equal(footer.groups.length,5,'All three footer columns, programs and social lists must be editable');
const group=footer.groups[0],item=clone(group.items[0]),itemDef=gd.groups.find(g=>g.id===group.id).items.find(i=>i.id===item.source);item.id='audit-footer-added';
const link=gd.fields.find(f=>itemDef.fields.includes(f.id)&&f.target==='@href');const text=gd.fields.find(f=>itemDef.fields.includes(f.id)&&f.target==='text');item.values[link.id]='/iletisim/';item.values[text.id]='Yeni bağlantı';group.items.unshift(item);const renderedGlobal=render(global);assert.equal(renderedGlobal.querySelector('.footer-group li a').textContent,'Yeni bağlantı');assert.equal(renderedGlobal.querySelector('.footer-group li a').getAttribute('href'),'/iletisim/');
const contact=seed.find(p=>p.route==='/iletisim/');assert(catalog[contact.template].fields.some(f=>f.target==='@placeholder'),'Form placeholders must be editable');
console.log(`PASS: hero introduction/clips/posters editable, AVIF preserved/replaced safely, invalid clip settings rejected, ${dimensioned} image instances reserve intrinsic ratios, all 5 footer lists can add/reorder/edit links, form placeholders editable.`);
