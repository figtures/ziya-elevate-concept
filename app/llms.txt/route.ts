import {config,publishedIndex} from '../../cms/server';
import {discoveryResponse} from '../../cms/discovery.mjs';
export async function GET(request:Request){
 try{return await discoveryResponse(await publishedIndex(),{enabled:config.publicDiscoveryEnabled,origin:config.canonicalOrigin},request);}
 catch{return new Response('Not found\n',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});}
}
export const HEAD=GET;
