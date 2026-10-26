import { published, render, publishedIndex, config } from '../../cms/server';
import {isV13PreviewOrigin} from '../../cms/v13/technical.mjs';
export const dynamic='force-dynamic';
const redirects:Record<string,string>={'/testler/basari-muhendisligi-skoru/':'/testler/kafa-yapisi-testi/','/testler/satis-yetkinlik-skoru/':'/testler/kafa-yapisi-testi/','/testler/liderlik-yetkinlik-skoru/':'/testler/kafa-yapisi-testi/'};
export async function GET(request:Request){
 const url=new URL(request.url),preview=isV13PreviewOrigin(url.origin,config.canonicalOrigin),robotHeaders:Record<string,string>=preview?{'X-Robots-Tag':'noindex, nofollow'}:{};let path=url.pathname;if(!path.endsWith('/')){url.pathname=path+'/';return Response.redirect(url.toString(),308);}
 if(redirects[path])return Response.redirect(new URL(redirects[path],url).toString(),308);
 try{const [payload,global]=await Promise.all([published(path),published('/_global/')]);
 if(!payload||payload.kind==='global')return new Response('<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>Sayfa bulunamadı</title></head><body><h1>Sayfa bulunamadı</h1><a href="/">Ana sayfaya dön</a></body></html>',{status:404,headers:{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow'}});
 const entries=['/makaleler/','/hayattan-notlar/'].includes(path)?await publishedIndex(path==='/makaleler/'?'article':'note'):undefined;
 const books=path==='/'?await published('/kitaplar/'):undefined;
 const html=render(payload,global,entries,books,{requestOrigin:url.origin});if(!html)throw new Error('Şablon bulunamadı');
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin',...robotHeaders}});
 }catch{return new Response('İçerik geçici olarak yüklenemedi. Lütfen kısa süre sonra yeniden deneyin.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Retry-After':'30',...robotHeaders}});}
}
