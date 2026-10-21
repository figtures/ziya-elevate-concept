import { parseHTML } from 'linkedom';
import templates from './templates.json';
import catalog from './catalog.json';
import seed from './seed.json';
import config from './config.json';
import { composeContent } from './compose.mjs';
import { applyCollection } from './collections.mjs';
import { currentContentPayload } from './content-revisions.mjs';
import { versionedAsset } from './resources.mjs';
export { config, catalog, seed, templates };
// Allow the first cross-region connection to complete while keeping failures bounded.
const CONTENT_REQUEST_TIMEOUT_MS=10000;
export async function published(route:string){
 if(!config.enabled)return seed.find(p=>p.route===route)||null;
 const response=await fetch(config.url+'/rest/v1/cms_published?route=eq.'+encodeURIComponent(route)+'&select=payload',{headers:{apikey:config.publishableKey},signal:AbortSignal.timeout(CONTENT_REQUEST_TIMEOUT_MS),cache:'no-store'});
 if(!response.ok)throw new Error('İçerik kaynağına ulaşılamadı.');
 const rows=await response.json();return currentContentPayload(rows[0]?.payload||null,seed);
}
export function render(payload:any,globalPayload:any,entries?:any[],booksPayload?:any){
 const template=(templates as any)[payload.template];const definition=(catalog as any)[payload.template];
 if(!template||!definition)return null;
 const {document}=parseHTML(template);
 const sharedDocument=globalPayload?parseHTML((templates as any)._global).document:undefined;
 composeContent(document,payload,definition,{sharedDocument,sharedPayload:globalPayload,sharedDefinition:(catalog as any)._global,entries,booksPayload,booksDefinition:(catalog as any)['/kitaplar/'],canonicalOrigin:config.canonicalOrigin,leadsEnabled:config.enabled&&config.leadsEnabled});
 if(config.enabled&&config.leadsEnabled&&document.querySelector('#contactForm')){
  const script=document.createElement('script');script.src=versionedAsset('/assets/cms-contact.js');script.setAttribute('data-endpoint',config.url+'/functions/v1/submit-lead');script.setAttribute('data-key',config.publishableKey);document.body.append(script);
 }
 return document.toString();
}

export async function publishedIndex(kind?:string){
 if(!config.enabled)return seed.filter(p=>!kind||p.kind===kind).map(p=>({route:p.route,kind:p.kind,title:p.title,robots:(p as any).robots,noindex:(p as any).noindex}));
 const rows:any[]=[];const pageSize=500;
 for(let offset=0;;offset+=pageSize){
  const response=await fetch(config.url+'/rest/v1/cms_published?select=route,kind,title:payload->>title,robots:payload->>robots,noindex:payload->>noindex&order=route.asc&limit='+pageSize+'&offset='+offset+(kind?'&kind=eq.'+encodeURIComponent(kind):''),{headers:{apikey:config.publishableKey},signal:AbortSignal.timeout(CONTENT_REQUEST_TIMEOUT_MS),cache:'no-store'});
  if(!response.ok)throw new Error('İçerik listesi yüklenemedi.');
  const page=await response.json();if(!Array.isArray(page))throw new Error('İçerik listesi geçersiz.');
  rows.push(...page);if(page.length<pageSize)return rows;
 }
}
function syncWriting(document:any,entries:any[],route:string,collection?:any){
 applyCollection(document,collection,entries,route);
}
export function addNewWriting(html:string,entries:any[],route:string,collection?:any){
 const {document}=parseHTML(html);syncWriting(document,entries,route,collection);
 return document.toString();
}
