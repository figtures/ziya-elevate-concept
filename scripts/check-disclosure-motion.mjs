import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {animateVisibility,enhanceDetails,setDetailsOpen,openDialog,closeDialog} from '../src/interactions/disclosure-motion.mjs';

const {document,window}=parseHTML('<html><body><button id="trigger">Open</button><div id="menu" hidden><a href="/">Link</a></div><details id="faq"><summary>Question</summary><p>Answer</p></details><dialog><button>Close</button></dialog></body></html>');
const listeners=new Set();let preferReduced=false;
window.matchMedia=()=>({get matches(){return preferReduced;},addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)});
window.getComputedStyle=element=>({opacity:element._opacity??'1',transform:element._transform??'none',paddingTop:'12px',paddingBottom:'12px',marginTop:'4px',marginBottom:'4px',borderTopWidth:'1px',borderBottomWidth:'1px'});
const records=[];
function animation(element){
 element.animate=(frames,options)=>{
  let resolve,reject;const finished=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const record={element,frames,options,finished,cancelled:false,finish:()=>resolve(),cancel(){this.cancelled=true;reject(new Error('cancelled'));}};
  records.push(record);return record;
 };
 element.getBoundingClientRect=()=>({top:0,bottom:element._height??180,height:element._height??180});
}
const settle=async record=>{record.finish();await Promise.resolve();await Promise.resolve();};
let checks=0;const check=async(name,fn)=>{await fn();checks++;console.log('PASS '+name);};
const menu=document.querySelector('#menu');animation(menu);
await check('dropdown remains painted during exit and becomes inaccessible immediately',async()=>{
 const opening=animateVisibility(menu,true);assert.equal(menu.hidden,false);assert.equal(menu.inert,false);await settle(records.at(-1));assert.equal(await opening,true);
 const closing=animateVisibility(menu,false);assert.equal(menu.hidden,false);assert.equal(menu.inert,true);await settle(records.at(-1));assert.equal(await closing,true);assert.equal(menu.hidden,true);
});
await check('rapid reversal cancels stale completion without hiding the reopened panel',async()=>{
 const first=animateVisibility(menu,true);const old=records.at(-1);const second=animateVisibility(menu,false);assert.equal(old.cancelled,true);assert.equal(await first,false);
 const third=animateVisibility(menu,true);assert.equal(await second,false);await settle(records.at(-1));assert.equal(await third,true);assert.equal(menu.hidden,false);assert.equal(menu.getAttribute('data-motion-state'),'open');
});
await check('inflow panels animate measured height, spacing and opacity then restore natural sizing',async()=>{
 animateVisibility(menu,false,{instant:true});const opened=animateVisibility(menu,true,{kind:'collapse'});const a=records.at(-1);
 assert.equal(a.frames[0].height,'0px');assert.equal(a.frames[1].height,'180px');assert.equal(a.frames[0].paddingTop,'0px');assert.equal(menu.style.overflow,'hidden');await settle(a);await opened;assert.equal(menu.style.overflow,'');
});
await check('instant initialization and reduced motion never wait to hide',async()=>{
 const before=records.length;animateVisibility(menu,false,{instant:true});assert.equal(menu.hidden,true);assert.equal(records.length,before);
 preferReduced=true;await animateVisibility(menu,true);assert.equal(menu.hidden,false);assert.equal(records.length,before);preferReduced=false;
});
await check('switching reduced motion on finishes an active request safely',async()=>{
 const pending=animateVisibility(menu,false);assert.equal(menu.hidden,false);preferReduced=true;for(const fn of [...listeners])fn({matches:true});assert.equal(await pending,true);assert.equal(menu.hidden,true);preferReduced=false;
});
const details=document.querySelector('details'),summary=details.querySelector('summary');animation(details);details.getBoundingClientRect=()=>({top:0,bottom:details._height??(details.open?180:50),height:details._height??(details.open?180:50)});summary.getBoundingClientRect=()=>({top:0,bottom:33,height:33});
await check('accordion keeps native open until exit settles and rapid input reverses height',async()=>{
 details.open=false;const opening=setDetailsOpen(details,true);assert.equal(details.open,true);await settle(records.at(-1));assert.equal(await opening,true);
 const closing=setDetailsOpen(details,false);assert.equal(details.open,true);assert.equal(details.querySelector('p').inert,true);details._height=90;
 const reopening=setDetailsOpen(details,true);assert.equal(await closing,false);assert.equal(records.at(-1).frames[0].height,'90px');await settle(records.at(-1));assert.equal(await reopening,true);assert.equal(details.open,true);delete details._height;
 const final=setDetailsOpen(details,false);await settle(records.at(-1));assert.equal(await final,true);assert.equal(details.open,false);assert.equal(details.style.overflow,'');
});
await check('resize observation ignores its initial callback and retargets actual content growth',async()=>{
 const observers=[];window.ResizeObserver=class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
 const answer=details.querySelector('p');let answerHeight=100;answer.getBoundingClientRect=()=>({width:200,height:answerHeight});
 const opening=setDetailsOpen(details,true),initialCount=records.length;observers.at(-1).callback();assert.equal(records.length,initialCount);
 answerHeight=200;observers.at(-1).callback();assert.equal(records.length,initialCount+1);assert.equal(await opening,false);observers.at(-1).callback();assert.equal(records.length,initialCount+1);
 await settle(records.at(-1));assert.equal(details.open,true);assert.equal(observers.at(-1).disconnected,true);delete window.ResizeObserver;
});
await check('delegated accordion handling supports dynamically created admin panels',async()=>{
 enhanceDetails(document);enhanceDetails(document);const item=document.createElement('details');item.innerHTML='<summary>New</summary><p>Dynamic content</p>';document.body.append(item);
 preferReduced=true;item.querySelector('summary').dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));assert.equal(item.open,true);preferReduced=false;
});
const dialog=document.querySelector('dialog');animation(dialog);let closed=0,closingIntent=0;dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;closed++;dialog.dispatchEvent(new window.Event('close'));};dialog.addEventListener('ziya:dialog-closing',()=>closingIntent++);
await check('native dialog remains modal through exit and emits cleanup intent immediately',async()=>{
 const opening=openDialog(dialog);assert.equal(dialog.open,true);await settle(records.at(-1));await opening;
 const closing=closeDialog(dialog);assert.equal(dialog.open,true);assert.equal(closingIntent,1);assert.equal(closed,0);await settle(records.at(-1));assert.equal(await closing,true);assert.equal(dialog.open,false);assert.equal(closed,1);
});
await check('Escape cancellation uses the same animated close path',async()=>{
 const opening=openDialog(dialog);await settle(records.at(-1));await opening;const event=new window.Event('cancel',{cancelable:true});dialog.dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(dialog.open,true);await settle(records.at(-1));assert.equal(dialog.open,false);
});
console.log(`${checks} disclosure lifecycle checks passed (DOM and controlled Web Animations, not browser visual QA).`);
