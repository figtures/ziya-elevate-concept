/** Draft video framing checks. No media decoding, browser or remote database. */
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {renderExperienceEditor,wireExperienceEditor} from '../cms/admin-experience.mjs';
import {parseMediaFrame} from '../cms/media-framing.mjs';

const {window,document}=parseHTML('<!doctype html><html><body><div id="editor"></div><section class="hero-vid"><video src="/assets/one.mp4" poster="/assets/one.jpg"></video></section></body></html>');
Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
window.HTMLElement.prototype.pause=function(){if(this.localName==='video')this.paused=true;};
window.HTMLElement.prototype.load=function(){if(this.localName==='video'){this.currentTime=0;this.duration=NaN;this.readyState=0;}};
window.HTMLElement.prototype.play=function(){return Promise.resolve();};
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return (this.querySelector('option[selected]')||this.querySelector('option'))?.getAttribute('value')||'';},set(value){for(const option of this.querySelectorAll('option')){if(option.getAttribute('value')===String(value))option.setAttribute('selected','');else option.removeAttribute('selected');}}});
const frame=src=>({v:1,src,desktop:{x:25,y:40,zoom:1.3},mobile:{x:70,y:20,zoom:1.8}});
const payload={kind:'page',route:'/liderlik/',values:{},experience:{playlist:[{id:'one',src:'/assets/one.mp4',poster:'/assets/one.jpg',focal:'center',start:3,end:8},{id:'two',src:'/assets/two.mp4',poster:'/assets/two.jpg',focal:'center',start:0}]}};
const root=document.getElementById('editor');root.innerHTML=renderExperienceEditor({payload,doc:document});
let pending,changed=0;
const dispose=wireExperienceEditor(root,{payload,doc:document,onChange:()=>changed++,pickMedia:options=>{pending=options;},uploadMedia:async()=>[{url:'/assets/uploaded.mp4',mime:'video/mp4'}],getMedia:()=>[]});
const q=selector=>root.querySelector(selector);
const click=selector=>{const element=q(selector);assert(element,'Missing '+selector);assert(!element.disabled,'Disabled '+selector);element.dispatchEvent(new window.Event('click',{bubbles:true}));};
const complete=(url,selectedFrame)=>{assert(pending);pending.onSelect(url,{url},selectedFrame);pending=undefined;};

click('[data-video-action="edit-frame"]');
assert.equal(pending.type,'video');assert.equal(pending.editOnly,true);assert.equal(pending.src,'/assets/one.mp4');
assert(pending.spec.desktop.width>0&&pending.spec.mobile.height>0);
complete('/assets/one.mp4',frame('/assets/one.mp4'));
assert.deepEqual(parseMediaFrame(payload.values['media-frame:clip:one'],'/assets/one.mp4'),frame('/assets/one.mp4'));
assert.equal(q('[data-video-player]').style.objectPosition,'25% 40%');
assert.equal(q('[data-video-player]').style.transform,'scale(1.3)');
assert.equal(q('[data-video-player]').hasAttribute('controls'),false);
assert.equal(payload.experience.playlist[0].start,3);assert.equal(payload.experience.playlist[0].end,8);
click('[data-video-viewport="mobile"]');
assert.equal(q('[data-video-player]').style.objectPosition,'70% 20%');
assert.equal(q('[data-video-player]').style.transform,'scale(1.8)');
console.log('PASS desktop/mobile video framing persists separately and leaves clip timing unchanged');

click('[data-video-action="reset-frame"]');
assert.equal(payload.values['media-frame:clip:one'],undefined);
assert.equal(q('[data-video-player]').style.transform,'none');
assert.equal(q('[data-video-player]').hasAttribute('controls'),true);
click('[data-video-action="edit-frame"]');complete('/assets/one.mp4',frame('/assets/one.mp4'));
q('[data-video-focal]').value='left center';q('[data-video-focal]').dispatchEvent(new window.Event('change'));
assert.equal(payload.values['media-frame:clip:one'],undefined);
assert.equal(payload.experience.playlist[0].focal,'left center');
assert.equal(q('[data-video-player]').style.objectPosition,'left center');
console.log('PASS resetting framing and selecting a simple position removes stale custom crops');

click('[data-video-action="add-library"]');assert.equal(pending.type,'video');assert(pending.spec);complete('/assets/three.mp4',frame('/assets/three.mp4'));
const added=payload.experience.playlist.at(-1);assert.equal(added.src,'/assets/three.mp4');assert(payload.values['media-frame:clip:'+added.id]);
assert.deepEqual(Object.keys(added).sort(),['focal','id','poster','src','start']);
click('[data-video-action="replace-library"]');complete('/assets/replacement.mp4',frame('/assets/replacement.mp4'));
const replaced=payload.experience.playlist.find(clip=>clip.id===added.id);assert.equal(replaced.src,'/assets/replacement.mp4');
assert.equal(parseMediaFrame(payload.values['media-frame:clip:'+added.id],replaced.src).src,replaced.src);
assert.equal(replaced.start,0);assert.equal(replaced.end,undefined);
click('[data-video-move="2|-1"]');
assert.equal(payload.experience.playlist[1].id,added.id);assert(payload.values['media-frame:clip:'+added.id]);
click('[data-video-remove="1"]');assert.equal(payload.values['media-frame:clip:'+added.id],undefined);
assert(payload.experience.playlist.every(clip=>!Object.hasOwn(clip,'frame')));
console.log('PASS archive add/replace/reorder/remove keeps framing attached to stable clip ids without changing playlist schema');

q('[data-video-upload]').files=[{name:'uploaded.mp4',type:'video/mp4',size:1000}];
q('[data-video-upload]').dispatchEvent(new window.Event('change'));
for(let i=0;i<20;i++)await Promise.resolve();
assert.equal(pending?.editOnly,true);assert.equal(pending?.src,'/assets/uploaded.mp4');
complete('/assets/uploaded.mp4',frame('/assets/uploaded.mp4'));
assert.equal(parseMediaFrame(payload.values['media-frame:clip:'+payload.experience.playlist.at(-1).id],'/assets/uploaded.mp4').desktop.zoom,1.3);
console.log('PASS single video upload opens framing after upload controls are restored');

click('[data-video-action="edit-frame"]');const late=pending.onSelect;dispose();const previous=changed;late('/assets/one.mp4',{},frame('/assets/one.mp4'));assert.equal(changed,previous);
console.log('PASS disposed video editor ignores delayed framing selection');

const templatePayload={kind:'page',route:'/liderlik/',values:{}};
root.innerHTML=renderExperienceEditor({payload:templatePayload,doc:document});
const disposeTemplate=wireExperienceEditor(root,{payload:templatePayload,doc:document,pickMedia:options=>{pending=options;}});
click('[data-video-action="edit-frame"]');complete('/assets/one.mp4',frame('/assets/one.mp4'));
assert.equal(templatePayload.experience.playlist[0].id,'clip-1');
assert(templatePayload.values['media-frame:clip:clip-1']);
disposeTemplate();
console.log('PASS first framing edit persists template-derived clip identities for public rendering');
