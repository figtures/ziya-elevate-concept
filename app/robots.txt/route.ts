import config from '../../cms/config.json';
import {canonicalOrigin} from '../../cms/seo.mjs';
export function GET(){
 const origin=canonicalOrigin((config as any).canonicalOrigin);
 return new Response('User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: '+origin+'/sitemap.xml\n',{headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
