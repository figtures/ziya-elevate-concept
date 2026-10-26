/** A separate one-time patch for records already saved after the initial V13
 * rollout. Only the mindset page is affected; editor values and order survive.
 */
import revision from './mindset-flow-revision.json' with {type:'json'};
export const MINDSET_FLOW_MARKER='v13:mindset-flow';
export const MINDSET_FLOW_VERSION='2026-10-26';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function applyMindsetFlowUpdate(payload){
 if(payload?.route!=='/kafa-yapisi/'||payload.values?.[MINDSET_FLOW_MARKER]===MINDSET_FLOW_VERSION)return payload;
 const next=structuredClone(payload);next.values||={};next.sections||=[];
 const beforeFields=new Map(revision.fields.before.map(field=>[field.id,field]));
 const afterFields=new Map(revision.fields.after.map(field=>[field.id,field]));
 const addedFields=revision.fields.after.filter(field=>!beforeFields.has(field.id));
 for(const field of addedFields)if(!Object.hasOwn(next.values,field.id))next.values[field.id]=structuredClone(revision.after.values[field.id]);
 const bags=[next.values,...next.sections.flatMap(section=>[section.values,...(section.groups||[]).flatMap(group=>(group.items||[]).map(item=>item.values))])].filter(Boolean);
 // Split only the reviewed text. A custom rewrite is never replaced by the
 // default scientific paragraph, and subsequent editor saves are untouched.
 for(const bag of bags)for(const field of revision.fields.before){
  if(!afterFields.has(field.id)||same(revision.before.values[field.id],revision.after.values[field.id]))continue;
  if(Object.hasOwn(bag,field.id)&&same(bag[field.id],revision.before.values[field.id]))bag[field.id]=structuredClone(revision.after.values[field.id]);
 }
 const oldSources=new Set(revision.before.sections.map(section=>section.source));
 const addedSections=revision.after.sections.filter(section=>!oldSources.has(section.source));
 for(const planned of addedSections){
  if(next.sections.some(section=>section.source===planned.source))continue;
  const section=structuredClone(planned);
  const previousOwner=next.sections.find(item=>item.source==='5f3f14fd-137'&&item.id===item.source);
  if(previousOwner?.hidden===true)section.hidden=true;
  const plannedIndex=revision.after.sections.findIndex(item=>item.source===planned.source);
  const following=revision.after.sections.slice(plannedIndex+1).map(item=>item.source);
  const position=next.sections.findIndex(item=>following.includes(item.source));
  if(position<0)next.sections.push(section);else next.sections.splice(position,0,section);
 }
 // Section-level field overrides follow the same authored node to its new
 // section. Global overrides and existing repeated dimension rows stay intact.
 for(const section of [...next.sections]){
  for(const [id,value]of Object.entries(section.values||{})){
   const previous=beforeFields.get(id),current=afterFields.get(id);
   if(!previous||!current||previous.section===current.section)continue;
   const destinationId=section.id===section.source?current.section:`${section.id}-mindset-bridge`;
   let destination=next.sections.find(item=>item.source===current.section&&item.id===destinationId);
   if(!destination&&section.id!==section.source){
    const planned=revision.after.sections.find(item=>item.source===current.section);
    if(planned){destination=structuredClone(planned);destination.id=destinationId;destination.hidden=section.hidden===true;next.sections.splice(next.sections.indexOf(section),0,destination);}
   }
   if(!destination)continue;
   destination.values||={};if(!Object.hasOwn(destination.values,id))destination.values[id]=value;
   delete section.values[id];
  }
 }
 next.values[MINDSET_FLOW_MARKER]=MINDSET_FLOW_VERSION;
 return next;
}
