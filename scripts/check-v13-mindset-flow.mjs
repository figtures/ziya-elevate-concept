import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {parseHTML} from 'linkedom';
import {applyMindsetFlowUpdate,MINDSET_FLOW_MARKER,MINDSET_FLOW_VERSION} from '../cms/v13/mindset-flow-update.mjs';
import {applyV13ContentUpdate} from '../cms/v13/content-update.mjs';
import {applyContent,validateDocument} from '../cms/render.mjs';
const read=name=>JSON.parse(fs.readFileSync(`cms/${name}.json`,'utf8'));
const revision=read('v13/mindset-flow-revision'),templates=read('templates'),catalog=read('catalog'),seeds=read('seed');
const definition=catalog['/kafa-yapisi/'];
const render=payload=>{const {document}=parseHTML(templates['/kafa-yapisi/']);applyContent(document,payload,definition);return document;};
const byId=(document,id)=>document.querySelector(`[data-cms-node="${id}"]`);
const text=node=>node.textContent.replace(/\s+/g,' ').trim();
const order=(document,...ids)=>{const nodes=[...document.querySelectorAll('*')];const positions=ids.map(id=>nodes.indexOf(byId(document,id)));assert(positions.every(x=>x>=0));assert(positions.every((x,i)=>i===0||x>positions[i-1]),ids.join(' → '));};
let passed=0;
const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};

check('Only the mindset page changes and the patch is immutable and once-only',()=>{
 const untouched=seeds.find(p=>p.route==='/');assert.equal(applyMindsetFlowUpdate(untouched),untouched);
 const input=structuredClone(revision.before),snapshot=structuredClone(input),result=applyMindsetFlowUpdate(input);
 assert.deepEqual(input,snapshot);assert.equal(result.values[MINDSET_FLOW_MARKER],MINDSET_FLOW_VERSION);assert.equal(applyMindsetFlowUpdate(result),result);
 assert.deepEqual(validateDocument(result,definition),[]);
});
check('Every previous CMS node and source paragraph remains reachable without duplicate identities',()=>{
 const beforeTemplates=JSON.parse(execFileSync('git',['show',`${revision.baselineCommit}:cms/templates.json`],{encoding:'utf8',maxBuffer:30*1024*1024}));
 const before=parseHTML(beforeTemplates['/kafa-yapisi/']).document,after=render(applyMindsetFlowUpdate(revision.before));
 const ids=[...after.querySelectorAll('[data-cms-node]')].map(node=>node.getAttribute('data-cms-node'));assert.equal(new Set(ids).size,ids.length);
 for(const node of before.querySelectorAll('[data-cms-node]'))assert(byId(after,node.getAttribute('data-cms-node')),node.getAttribute('data-cms-node'));
 for(const field of revision.fields.before){if(field.id==='5f3f14fd-132:text')continue;assert.equal(revision.after.values[field.id],revision.before.values[field.id],field.id);}
 const old=revision.before.values['5f3f14fd-132:text'];
 assert.equal(revision.after.values['5f3f14fd-132:text']+' '+revision.after.values['5f3f14fd-flow-story-copy:text'],old);
 assert.equal((text(after.body).match(/Rehberin kişisel sıfır noktası/g)||[]).length,1);
});
check('Narrative, concept, CTA, answer, dimensions, eight topics and FAQ retain the required sequence',()=>{
 const document=render(applyMindsetFlowUpdate(revision.before));
 order(document,'5f3f14fd-111','5f3f14fd-129','5f3f14fd-115','5f3f14fd-flow-bridge','5f3f14fd-166','5f3f14fd-265','5f3f14fd-119','5f3f14fd-139','5f3f14fd-226');
 assert.equal(document.querySelectorAll('.v13-mindset-words .editorial-row').length,3);
 assert.equal(document.querySelectorAll('.v13-mindset-dimensions .editorial-row').length,5);
 assert.equal(document.querySelectorAll('.v13-mindset-reading .reading-link').length,3);
 for(const details of document.querySelectorAll('.v13-mindset-dimensions,.v13-mindset-reading'))assert(!details.hasAttribute('open'));
});
check('Custom scientific text, moved links and section copy survive; new copy and media stay editable',()=>{
 const input=structuredClone(revision.before);input.values['5f3f14fd-132:text']='Yönetici tarafından yazılan farklı bilimsel açıklama.';
 const lower=input.sections.find(s=>s.source==='5f3f14fd-137');lower.values['5f3f14fd-134:text']='Editörün özgün yaklaşım başlığı';lower.values['5f3f14fd-136:@href']='/kitaplar/';
 const result=applyMindsetFlowUpdate(input),bridge=result.sections.find(s=>s.source==='5f3f14fd-flow-bridge');
 assert.equal(result.values['5f3f14fd-132:text'],input.values['5f3f14fd-132:text']);assert.equal(bridge.values['5f3f14fd-134:text'],lower.values['5f3f14fd-134:text']);assert.equal(bridge.values['5f3f14fd-136:@href'],'/kitaplar/');
 bridge.values['5f3f14fd-flow-story-copy:text']='Editörün kişisel hikâyesi. ';
 bridge.values['5f3f14fd-flow-image:@src']='/assets/ziya-portrait.webp';
 const document=render(result);assert(text(document.body).includes('Editörün kişisel hikâyesi.'));assert.equal(byId(document,'5f3f14fd-flow-image').getAttribute('src'),'/assets/ziya-portrait.webp');
});
check('Hidden sections, duplicated section overrides and reordered dimension items survive',()=>{
 const input=structuredClone(revision.before),lower=input.sections.find(s=>s.source==='5f3f14fd-137');lower.hidden=true;
 const group=lower.groups.find(g=>g.id==='5f3f14fd-145');group.items.reverse();group.items[0].values['5f3f14fd-165:text']='Özel toparlanma açıklaması';
 const duplicate=structuredClone(lower);duplicate.id='custom-lower-copy';duplicate.hidden=false;duplicate.values['5f3f14fd-134:text']='Kopyadaki farklı yaklaşım';input.sections.push(duplicate);
 const result=applyMindsetFlowUpdate(input);
 assert.equal(result.sections.find(s=>s.id==='5f3f14fd-flow-bridge').hidden,true);
 assert.deepEqual(result.sections.find(s=>s.id===lower.id).groups,lower.groups);
 assert.equal(result.sections.find(s=>s.id==='custom-lower-copy-mindset-bridge').values['5f3f14fd-134:text'],'Kopyadaki farklı yaklaşım');
 assert(text(render(result).body).includes('Kopyadaki farklı yaklaşım'));
});
check('Later edits, section ordering and word repeaters are not reset by subsequent reads',()=>{
 const result=applyMindsetFlowUpdate(revision.before),bridge=result.sections.find(s=>s.id==='5f3f14fd-flow-bridge');
 bridge.values['5f3f14fd-flow-story-copy:text']='Sonradan kaydedilen hikâye';
 const words=bridge.groups.find(g=>g.id==='5f3f14fd-flow-words');assert(words);words.items.reverse();
 result.sections.reverse();const snapshot=structuredClone(result);assert.equal(applyMindsetFlowUpdate(result),result);assert.deepEqual(result,snapshot);
});
check('Previously saved V13 and fresh installs compose to the same updated page',()=>{
 const previous={...structuredClone(revision.before),values:{...revision.before.values,'v13:applied':'2026-10-26'}};
 const migrated=applyV13ContentUpdate(previous),fresh=applyMindsetFlowUpdate(revision.after);
 assert.equal(render(migrated).toString(),render(fresh).toString());
 const legacy=read('v13/revisions').pages['/kafa-yapisi/'].before;
 assert.equal(render(applyV13ContentUpdate(legacy)).toString(),render(fresh).toString());
});
console.log(`${passed} mindset flow checks passed. Browser geometry is checked separately; no padding-based percentage assertion.`);
