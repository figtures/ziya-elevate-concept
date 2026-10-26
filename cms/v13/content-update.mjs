/** One-time, field-scoped rollout of the client's V13 brief.
 * Existing content IDs, unrelated editor changes and media framing survive.
 * Persisted marker prevents future admin edits from being reset on each read.
 */
import revisions from './revisions.json' with {type:'json'};
import {testimonialApprovalErrors} from '../testimonials.mjs';
import {applyMindsetFlowUpdate} from './mindset-flow-update.mjs';
export const V13_MARKER='v13:applied';
export const V13_VERSION='2026-10-26';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const copy=value=>structuredClone(value);
function reconcileItems(items,before,after){
 if(same(before.map(x=>x.source),after.map(x=>x.source)))return items;
 const allowed=new Set(after.map(x=>x.source));
 const previous=new Set(before.map(x=>x.source));
 // Adding/removing an authored item is not an instruction to undo an editor's
 // order. Preserve existing instances (including hidden/duplicated records)
 // whenever the relative order of retained authored sources has not changed.
 if(same(before.filter(x=>allowed.has(x.source)).map(x=>x.source),after.filter(x=>previous.has(x.source)).map(x=>x.source))){
  const result=items.filter(item=>allowed.has(item.source)||!previous.has(item.source));
  for(const [index,source]of after.entries()){
   if(previous.has(source.source)||result.some(item=>item.source===source.source))continue;
   const following=after.slice(index+1).map(item=>item.source);
   const position=result.findIndex(item=>following.includes(item.source));
   if(position<0)result.push(copy(source));else result.splice(position,0,copy(source));
  }
  return result;
 }
 const result=[];
 for(const source of after){
  const matches=items.filter(x=>x.source===source.source);
  result.push(...(matches.length?matches:[copy(source)]));
 }
 // User-added types remain where possible, removed authored types cannot render.
 for(const item of items)if(!allowed.has(item.source)&&!before.some(x=>x.source===item.source))result.push(item);
 return result;
}
export function applyV13ContentUpdate(payload){
 if(!payload||payload.values?.[V13_MARKER]===V13_VERSION)return applyMindsetFlowUpdate(payload);
 const key=payload.kind==='global'?'_global':payload.route;
 const revision=revisions.pages?.[key];
 if(!revision?.before||payload.template!==revision.after.template)return payload;
 const before=revision.before,after=revision.after,next=copy(payload);
 next.values||={};
 const oldFields=new Map(revision.fields.before.map(f=>[f.id,f]));
 const newFields=new Map(revision.fields.after.map(f=>[f.id,f]));
 const changed=new Set(Object.keys(after.values).filter(id=>!same(before.values[id],after.values[id])));
 const removed=new Set([...oldFields.keys()].filter(id=>!newFields.has(id)));
 const oldSections=next.sections||[];
 const bags=[next.values,...oldSections.flatMap(s=>[s.values,...(s.groups||[]).flatMap(g=>g.items.map(i=>i.values))])].filter(Boolean);
 for(const bag of bags)for(const id of [...changed,...removed])delete bag[id];
 for(const id of changed)next.values[id]=copy(after.values[id]);
 // Move field overrides with their authored nodes when a section changes.
 const moved=new Map();
 for(const section of oldSections){
  for(const [id,value]of Object.entries(section.values||{})){
   const prev=oldFields.get(id),dest=newFields.get(id);
   if(prev&&dest&&prev.section!==dest.section){
    if(section.id===section.source){if(!moved.has(dest.section))moved.set(dest.section,{});moved.get(dest.section)[id]=value;}
    delete section.values[id];
   }
  }
 }
 const oldGroups=new Map(oldSections.filter(s=>s.id===s.source).flatMap(s=>(s.groups||[]).map(g=>[g.id,g])));
 const beforeGroups=new Map(before.sections.flatMap(s=>s.groups.map(g=>[g.id,g])));
 next.sections=[];
 for(const planned of after.sections){
  const matches=oldSections.filter(s=>s.source===planned.source);
  for(const section of matches.length?matches:[copy(planned)]){
   section.values={...moved.get(planned.source),...section.values};
   section.groups=planned.groups.map(group=>{
    const current=(section.groups||[]).find(g=>g.id===group.id)||oldGroups.get(group.id);
    if(!current)return copy(group);
    const result=copy(current);
    result.items=reconcileItems(result.items,beforeGroups.get(group.id)?.items||[],group.items);
    return result;
   });
   next.sections.push(section);
  }
 }
 for(const key of ['title','description','ogImage','ogImageAlt','ogImageAltFor'])if(!same(before[key],after[key]))next[key]=copy(after[key]);
 // Preserve a bespoke playlist; upgrade only the reviewed legacy hero asset.
 if(next.route==='/'&&after.experience?.playlist){
  const playlist=next.experience?.playlist;
  if(!playlist||playlist.every(clip=>/\/(?:hero-stage-clean-(?:1080|720)|hero-loop-v5)\.mp4(?:\?|$)/.test(clip.src||''))){
   next.experience={...next.experience,playlist:copy(after.experience.playlist)};
  }
 }
 // Legacy navigation is still authored through field/repeater overrides.
 // Installing a new structured model would mask those existing edits. Its new
 // press link is already added through the template and reconciled footer group;
 // the admin can derive a structured model from the preserved rendered menu.
 if(key==='_global'&&after.navigation&&next.navigation){
  if(!next.navigation.footer.some(g=>g.items.some(i=>i.href==='/basin/'))){
   const planned=after.navigation.footer.find(g=>g.items.some(i=>i.href==='/basin/'));
   const group=next.navigation.footer.find(g=>g.id===planned?.id)||next.navigation.footer.find(g=>!g.hidden&&g.placement==='columns');
   const item=planned?.items.find(i=>i.href==='/basin/');if(group&&item)group.items.push(copy(item));
  }
 }
 if(next.route==='/'&&next.testimonials?.items){
  next.testimonials.items=next.testimonials.items.filter(item=>!testimonialApprovalErrors(item).some(e=>e.startsWith('Eski örnek metin')));
 }
 next.values[V13_MARKER]=V13_VERSION;
 return applyMindsetFlowUpdate(next);
}
