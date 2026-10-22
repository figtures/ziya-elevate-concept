/** Browser-independent interaction coverage for the draft-only framing editor. */
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {renderMediaFrameEditor,wireMediaFrameEditor} from '../cms/admin-media-frame.mjs';

const src='/assets/stage.jpg';
const spec={label:'Sahne görseli',desktop:{width:1600,height:900},mobile:{width:390,height:600}};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup(options={}){
 const {window,document}=parseHTML('<!doctype html><html><body><main></main></body></html>');
 const host=document.querySelector('main');host.innerHTML=renderMediaFrameEditor({src,spec,...options});
 const media=host.querySelector('[data-frame-media]'),stage=host.querySelector('[data-frame-stage]');
 Object.defineProperties(media,{naturalWidth:{value:1920,configurable:true},naturalHeight:{value:1080,configurable:true},complete:{value:false,configurable:true}});
 stage.getBoundingClientRect=()=>({width:640,height:360,left:0,top:0});stage.focus=()=>{};stage.setPointerCapture=()=>{};stage.releasePointerCapture=()=>{};
 const applied=[],cleanup=wireMediaFrameEditor(host,{src,spec,onApply:frame=>{applied.push(frame);},...options});
 const q=selector=>host.querySelector(selector);
 const event=(node,type,properties={})=>{const value=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(value,properties);node.dispatchEvent(value);return value;};
 const click=selector=>event(q(selector),'click');
 const input=(key,value)=>{const slider=q(`[data-frame-range="${key}"]`);slider.value=String(value);event(slider,'input');};
 const load=()=>event(media,'load');
 return {document,host,media,stage,applied,cleanup,q,event,click,input,load};
}

{
 const test=setup();assert.equal(test.q('[data-frame-apply]').disabled,true);test.load();assert.equal(test.q('[data-frame-apply]').disabled,false);
 test.input('x',28);test.input('y',18);test.input('zoom',1.4);assert.equal(test.media.style.objectPosition,'28% 18%');assert.equal(test.media.style.transform,'scale(1.4)');assert.equal(test.media.style.transformOrigin,'28% 18%');
 test.click('[data-frame-viewport="mobile"]');test.input('x',72);test.input('zoom',1.9);test.click('[data-frame-viewport="desktop"]');assert.equal(test.q('[data-frame-range="x"]').value,'28');
 test.click('[data-frame-apply]');await flush();assert.deepEqual(test.applied[0],{v:1,src,desktop:{x:28,y:18,zoom:1.4},mobile:{x:72,y:50,zoom:1.9}});
 test.cleanup();console.log('PASS loading gate, independent desktop/mobile controls, and exact transform output');
}
{
 const test=setup();test.load();test.input('zoom',2);test.event(test.stage,'pointerdown',{pointerId:1,clientX:100,clientY:100,button:0});test.event(test.stage,'pointermove',{pointerId:1,clientX:164,clientY:136});test.event(test.stage,'pointerup',{pointerId:1});
 assert.equal(Number(test.q('[data-frame-range="x"]').value),40);assert.equal(Number(test.q('[data-frame-range="y"]').value),40);
 const key=test.event(test.stage,'keydown',{key:'ArrowUp',shiftKey:true});assert.equal(key.defaultPrevented,true);assert.equal(Number(test.q('[data-frame-range="y"]').value),35);
 test.click('[data-frame-reset="current"]');assert.equal(test.q('[data-frame-range="zoom"]').value,'1');assert.equal(test.q('[data-frame-range="y"]').value,'50');
 test.click('[data-frame-original]');await flush();assert.equal(test.applied[0],null);test.cleanup();console.log('PASS pointer drag, keyboard adjustment, reset, and original-placement callback');
}
{
 let cancelled=0;const test=setup({onCancel:()=>cancelled++});test.load();test.input('x',9);test.click('[data-frame-cancel]');assert.equal(cancelled,1);assert.equal(test.applied.length,0);test.cleanup();test.click('[data-frame-apply]');assert.equal(test.applied.length,0);console.log('PASS cancel is non-mutating and disposal removes callbacks');
}
{
 let release;const pending=new Promise(resolve=>release=resolve);const test=setup({onApply:()=>pending});test.load();test.click('[data-frame-apply]');assert.equal(test.host.firstElementChild.getAttribute('aria-busy'),'true');assert.equal(test.q('[data-frame-viewport="mobile"]').disabled,true);assert.equal(test.q('[data-frame-range="x"]').disabled,true);release();await flush();assert.equal(test.q('[data-frame-apply]').disabled,false);test.cleanup();
 const failed=setup({onApply:async()=>{throw Error('Yükleme başarısız');}});failed.load();failed.click('[data-frame-apply]');await flush();assert.equal(failed.q('[data-frame-status]').textContent,'Yükleme başarısız');assert.equal(failed.q('[data-frame-status]').dataset.tone,'error');assert.equal(failed.q('[data-frame-apply]').disabled,false);failed.cleanup();console.log('PASS async apply locks controls and recovers from a rejected export');
}
{
 const test=setup({spec:{...spec,singleViewport:true}});assert.equal(test.q('.media-frame-viewports').hasAttribute('hidden'),true);test.event(test.media,'error');assert.equal(test.q('[data-frame-apply]').disabled,true);assert.equal(test.q('[data-frame-status]').dataset.tone,'error');test.cleanup();
 assert(!renderMediaFrameEditor({src:'javascript:alert(1)',spec}).includes('src="javascript:'));
 assert(renderMediaFrameEditor({src,spec:{...spec,label:'<script>unsafe</script>'}}).includes('&lt;script&gt;unsafe&lt;/script&gt;'));console.log('PASS fixed-ratio single viewport, failed media gate, and escaped unsafe input');
}
{
 const test=setup({src:'/assets/stage.mp4',kind:'video'});let pauses=0,loads=0;
 Object.defineProperties(test.media,{videoWidth:{value:1920},videoHeight:{value:1080},duration:{value:42},currentTime:{value:0,writable:true},paused:{value:true,writable:true}});
 test.media.pause=()=>{pauses++;test.media.paused=true;test.event(test.media,'pause');};test.media.play=()=>{test.media.paused=false;test.event(test.media,'play');return Promise.resolve();};test.media.load=()=>{loads++;};
 test.event(test.media,'loadedmetadata');assert.equal(test.q('[data-frame-time]').max,'42');test.click('[data-frame-play]');assert.equal(test.q('[data-frame-play-label]').textContent,'Duraklat');
 test.q('[data-frame-time]').value='31';test.event(test.q('[data-frame-time]'),'input');assert.equal(test.media.currentTime,31);assert.equal(test.q('[data-frame-play-label]').textContent,'Oynat');
 test.input('y',25);test.click('[data-frame-apply]');await flush();assert.equal(test.applied[0].desktop.y,25);assert.equal(Object.hasOwn(test.applied[0],'start'),false);test.cleanup();assert(pauses>=2);assert.equal(loads,1);assert.equal(test.media.hasAttribute('src'),false);console.log('PASS video load, playback, local seeking, framing-only payload, and media disposal');
}
