/** Shared, interruptible disclosure motion. Native semantics stay in control. */
export const DISCLOSURE_MOTION={open:340,close:240,easing:'cubic-bezier(.22,1,.36,1)'};
const detailsStates=new WeakMap(),visibilityStates=new WeakMap(),dialogStates=new WeakMap();
const enhancedRoots=new WeakSet(),enhancedDialogs=new WeakSet();
const view=element=>element?.ownerDocument?.defaultView||globalThis;
const styles=element=>view(element).getComputedStyle?.(element)||{};
const number=value=>Number.parseFloat(value)||0;
// offsetHeight stays in layout pixels even inside a scaled scroll-motion section.
const rectHeight=element=>element.offsetHeight||element.getBoundingClientRect?.().height||0;
const preference=element=>view(element).matchMedia?.('(prefers-reduced-motion: reduce)');
const reduced=element=>preference(element)?.matches===true;
const restoreStyles=(element,keys)=>{
 const previous=Object.fromEntries(keys.map(key=>[key,element.style[key]]));
 return ()=>{for(const key of keys)element.style[key]=previous[key]||'';};
};
function cancel(map,element){const state=map.get(element);if(state)state.cancel();}
function run(map,element,target,keyframes,{duration,cleanup=()=>{},commit=()=>{}}={}){
 let settle;
 const promise=new Promise(resolve=>{settle=resolve;});
 const mq=preference(element);
 const state={target,promise,animation:null,done:false,cancel:()=>finish(false)};
 const finish=completed=>{
  if(state.done)return;state.done=true;
  mq?.removeEventListener?.('change',onPreference);
  if(map.get(element)===state)map.delete(element);
  state.animation?.cancel();cleanup();
  if(completed)commit();settle(completed);
 };
 const onPreference=event=>{if(event.matches)finish(true);};
 map.set(element,state);
 try{
  state.animation=element.animate(keyframes,{duration,easing:DISCLOSURE_MOTION.easing,fill:'both'});
  state.animation.finished.then(()=>finish(true),()=>finish(false));
  mq?.addEventListener?.('change',onPreference);
 }catch{finish(true);}
 return promise;
}
function isAnimated(element,instant){return !instant&&!reduced(element)&&typeof element.animate==='function';}
function motionState(element,state){element.setAttribute('data-motion-state',state);}

/** Delay hidden until the exit completes; repeated clicks reverse from the visible frame. */
export function animateVisibility(element,open,{kind='dropdown',instant=false}={}){
 if(!element)return Promise.resolve(false);
 open=!!open;
 const active=visibilityStates.get(element);
 if(active?.target===open&&!instant)return active.promise;
 const wasHidden=element.hidden;
 const current=styles(element),from={opacity:wasHidden?'0':current.opacity||'1',transform:current.transform==='none'?'none':current.transform||'none',height:rectHeight(element),paddingTop:current.paddingTop||'0px',paddingBottom:current.paddingBottom||'0px',marginTop:current.marginTop||'0px',marginBottom:current.marginBottom||'0px'};
 cancel(visibilityStates,element);
 element.inert=!open;
 const commit=()=>{element.hidden=!open;motionState(element,open?'open':'closed');};
 if(!isAnimated(element,instant)||(!open&&wasHidden)){commit();return Promise.resolve(true);}
 element.hidden=false;
 motionState(element,open?'opening':'closing');
 const natural=styles(element),baseTransform=natural.transform==='none'?'':natural.transform||'';
 let frames,cleanup=()=>{};
 if(kind==='collapse'){
  const height=rectHeight(element),naturalBox={paddingTop:natural.paddingTop||'0px',paddingBottom:natural.paddingBottom||'0px',marginTop:natural.marginTop||'0px',marginBottom:natural.marginBottom||'0px'};
  cleanup=restoreStyles(element,['overflow','boxSizing']);element.style.overflow='hidden';element.style.boxSizing='border-box';
  const collapsed={height:'0px',opacity:0,paddingTop:'0px',paddingBottom:'0px',marginTop:'0px',marginBottom:'0px'};
  const expanded={height:height+'px',opacity:1,...naturalBox};
  const start=wasHidden?collapsed:{height:from.height+'px',opacity:from.opacity,paddingTop:from.paddingTop,paddingBottom:from.paddingBottom,marginTop:from.marginTop,marginBottom:from.marginBottom};
  frames=[start,open?expanded:collapsed];
 }else{
  const rest=baseTransform||'none',offset=kind==='backdrop'?rest:`${baseTransform} translateY(${kind==='panel'?10:6}px) scale(.985)`.trim();
  frames=[{opacity:from.opacity,transform:wasHidden?offset:from.transform},{opacity:open?1:0,transform:open?rest:offset}];
 }
 return run(visibilityStates,element,open,frames,{duration:open?DISCLOSURE_MOTION.open:DISCLOSURE_MOTION.close,cleanup,commit});
}

export function setDetailsOpen(details,open,{instant=false,retarget=false}={}){
 if(!details)return Promise.resolve(false);
 open=!!open;
 const active=detailsStates.get(details);
 if(active?.target===open&&!instant&&!retarget)return active.promise;
 if(!active&&details.open===open){motionState(details,open?'open':'closed');return Promise.resolve(true);}
 const summary=[...details.children].find(child=>child.tagName==='SUMMARY');
 const from=rectHeight(details);cancel(detailsStates,details);
 const commit=()=>{details.open=open;motionState(details,open?'open':'closed');};
 if(!summary||!isAnimated(details,instant)){commit();return Promise.resolve(true);}
 const restore=restoreStyles(details,['overflow','boxSizing']);
 const natural=styles(details);
 const summaryStyle=styles(summary);
 const closed=rectHeight(summary)+number(summaryStyle.marginTop)+number(summaryStyle.marginBottom)+number(natural.paddingTop)+number(natural.paddingBottom)+number(natural.borderTopWidth)+number(natural.borderBottomWidth);
 if(!open&&details.contains(details.ownerDocument.activeElement)&&!summary.contains(details.ownerDocument.activeElement))summary.focus({preventScroll:true});
 details.open=true;
 const expanded=rectHeight(details),target=open?expanded:Math.max(0,closed);
 motionState(details,open?'opening':'closing');
 details.style.overflow='hidden';details.style.boxSizing='border-box';
 const children=[...details.children].filter(child=>child!==summary),inertBefore=children.map(child=>child.inert);
 if(!open)children.forEach(child=>{child.inert=true;});
 let observer;
 const cleanup=()=>{observer?.disconnect();restore();children.forEach((child,index)=>{child.inert=inertBefore[index];});};
 const duration=Math.max(100,(open?DISCLOSURE_MOTION.open:DISCLOSURE_MOTION.close)*Math.min(1,Math.abs(target-from)/Math.max(1,expanded-closed)));
 const promise=run(detailsStates,details,open,[{height:from+'px'},{height:target+'px'}],{duration,cleanup,commit});
 // Restore auto height after settling; retarget a growing open panel while it moves.
 const Observer=view(details).ResizeObserver;
 if(open&&Observer&&detailsStates.has(details)){
  const dimensions=child=>[child.offsetWidth||child.getBoundingClientRect?.().width||0,rectHeight(child)];
  const previousSizes=new Map(children.map(child=>[child,dimensions(child)]));
  observer=new Observer(()=>{
   const state=detailsStates.get(details);if(!state||!state.target)return;
   // Ignore ResizeObserver's initial delivery. Measuring child boxes instead of
   // the animated parent also avoids a self-triggering resize/restart loop.
   const changed=children.some(child=>{const before=previousSizes.get(child),after=dimensions(child);return Math.abs(after[0]-before[0])>1||Math.abs(after[1]-before[1])>1;});
   if(changed)setDetailsOpen(details,true,{retarget:true});
  });
  children.forEach(child=>observer.observe(child));
 }
 return promise;
}

/** One delegated handler also covers details created later by the admin renderer. */
export function enhanceDetails(root=globalThis.document){
 if(!root||enhancedRoots.has(root))return;enhancedRoots.add(root);
 root.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button>0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
  const summary=event.target?.closest?.('summary'),details=summary?.parentElement;
  if(!summary||details?.tagName!=='DETAILS'||details.hasAttribute('data-no-motion'))return;
  const nested=event.target.closest?.('a,button,input,select,textarea,[contenteditable="true"]');
  if(nested&&summary.contains(nested))return;
  event.preventDefault();
  const active=detailsStates.get(details);setDetailsOpen(details,!(active?active.target:details.open));
 });
}

function ensureDialog(dialog){
 if(enhancedDialogs.has(dialog))return;enhancedDialogs.add(dialog);
 dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog(dialog);});
 dialog.addEventListener('close',()=>{cancel(dialogStates,dialog);motionState(dialog,'closed');});
 dialog.addEventListener('submit',event=>{
  if((event.submitter?.formMethod||event.target?.method)==='dialog'){event.preventDefault();closeDialog(dialog,event.submitter?.value||'');}
 });
}
export function openDialog(dialog){
 if(!dialog)return Promise.resolve(false);ensureDialog(dialog);
 const active=dialogStates.get(dialog);
 if(active?.target===true)return active.promise;
 const wasOpen=dialog.open,current=styles(dialog);
 const from={opacity:wasOpen?current.opacity||'1':0,transform:wasOpen?current.transform||'none':'none'};
 cancel(dialogStates,dialog);
 if(!dialog.open)dialog.showModal();
 if(!isAnimated(dialog,false)){motionState(dialog,'open');return Promise.resolve(true);}
 const base=styles(dialog).transform||'none';
 if(!wasOpen)from.transform=`${base==='none'?'':base} translateY(10px) scale(.985)`.trim();
 motionState(dialog,'opening');
 return run(dialogStates,dialog,true,[from,{opacity:1,transform:base}],{duration:DISCLOSURE_MOTION.open,commit:()=>motionState(dialog,'open')});
}
export function closeDialog(dialog,returnValue){
 if(!dialog||!dialog.open)return Promise.resolve(true);
 ensureDialog(dialog);
 const active=dialogStates.get(dialog);if(active?.target===false)return active.promise;
 const current=styles(dialog),from={opacity:current.opacity||'1',transform:current.transform||'none'};
 cancel(dialogStates,dialog);
 const EventClass=view(dialog).CustomEvent||globalThis.CustomEvent;
 if(EventClass)dialog.dispatchEvent(new EventClass('ziya:dialog-closing'));
 const commit=()=>{motionState(dialog,'closed');if(dialog.open){if(returnValue===undefined)dialog.close();else dialog.close(returnValue);}};
 if(!isAnimated(dialog,false)){commit();return Promise.resolve(true);}
 motionState(dialog,'closing');
 const base=styles(dialog).transform,offset=`${base&&base!=='none'?base:''} translateY(8px) scale(.985)`.trim();
 return run(dialogStates,dialog,false,[from,{opacity:0,transform:offset}],{duration:DISCLOSURE_MOTION.close,commit});
}
