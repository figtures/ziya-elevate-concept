// Atomic content rollout: recognize only the exact public baseline that was
// reviewed. An editor's concurrent changes never get replaced by this adapter.
import revisions from './content-revisions.json' with {type:'json'};

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
 if(!payload||!revisions[payload.id])return payload;
 if(await contentFingerprint(payload)!==revisions[payload.id])return payload;
 return seeds.find(item=>item.id===payload.id)||payload;
}
