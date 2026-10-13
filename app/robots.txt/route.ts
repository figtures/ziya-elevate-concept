import config from '../../cms/config.json';
import {canonicalOrigin} from '../../cms/seo.mjs';
import {isPreviewOrigin} from '../../cms/domain.mjs';
export function GET(request?:Request){
 const origin=canonicalOrigin((config as any).canonicalOrigin);
 if(request&&isPreviewOrigin(request,config))return new Response('User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain; charset=utf-8','X-Robots-Tag':'noindex, nofollow'}});
 return new Response('User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: '+origin+'/sitemap.xml\n',{headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
