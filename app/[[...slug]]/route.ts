import { published, render, publishedIndex } from '../../cms/server';
export const dynamic='force-dynamic';
const redirects:Record<string,string>={'/testler/basari-muhendisligi-skoru/':'/testler/kafa-yapisi-testi/','/testler/satis-yetkinlik-skoru/':'/testler/kafa-yapisi-testi/','/testler/liderlik-yetkinlik-skoru/':'/testler/kafa-yapisi-testi/'};
export async function GET(request:Request){
 const url=new URL(request.url);let path=url.pathname;if(!path.endsWith('/')){url.pathname=path+'/';return Response.redirect(url.toString(),308);}
 if(redirects[path])return Response.redirect(new URL(redirects[path],url).toString(),308);
 try{const [payload,global]=await Promise.all([published(path),published('/_global/')]);
 if(!payload||payload.kind==='global')return new Response('<!doctype html><html lang="tr"><meta charset="utf-8"><title>Sayfa bulunamadı</title><body><h1>Sayfa bulunamadı</h1><a href="/">Ana sayfaya dön</a></body></html>',{status:404,headers:{'Content-Type':'text/html; charset=utf-8'}});
 const entries=['/makaleler/','/hayattan-notlar/'].includes(path)?await publishedIndex(path==='/makaleler/'?'article':'note'):undefined;
 const books=path==='/'?await published('/kitaplar/'):undefined;
 const html=render(payload,global,entries,books);if(!html)throw new Error('Şablon bulunamadı');
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
 }catch{return new Response('İçerik geçici olarak yüklenemedi. Lütfen kısa süre sonra yeniden deneyin.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Retry-After':'30'}});}
}
