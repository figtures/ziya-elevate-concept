// Atomic content rollout: recognize only the exact public baseline that was
// reviewed. An editor's concurrent changes never get replaced by this adapter.
import revisions from './content-revisions.json' with {type:'json'};
import assetRevisions from './book-reference-revisions.json' with {type:'json'};
import {currentBookPhotography} from './book-photography.mjs';
import {applyV13ContentUpdate} from './v13/content-update.mjs';
const currentContent=value=>applyV13ContentUpdate(currentBookPhotography(value));

export function canonicalJSON(value){
 if(Array.isArray(value))return '['+value.map(canonicalJSON).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonicalJSON(value[key])).join(',')+'}';
 return JSON.stringify(value);
}
export async function contentFingerprint(payload){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalJSON(payload)));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function currentContentPayload(payload,seeds){
 const update=assetRevisions[payload?.id];
 if(update&&await contentFingerprint(payload)===update.baseline){
  const next={...payload,values:{...payload.values,...update.values}};
  if(payload.route==='/'){
   const home=seeds.find(item=>item.id==='/');
   next.references=home.references;next.testimonials=home.testimonials;
  }
  return currentContent(next);
 }
 if(!payload||!revisions[payload.id])return currentContent(payload);
 if(await contentFingerprint(payload)!==revisions[payload.id])return currentContent(payload);
 return currentContent(seeds.find(item=>item.id===payload.id)||payload);
}
