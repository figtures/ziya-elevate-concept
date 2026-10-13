# Teknik SEO ve performans denetimi — 12 Ekim 2026

**Proje:** Ziya Şakir Yılmaz  
**İncelenen önizleme:** https://ziya-sakir-yilmaz-keynote.dev-busraaktas.chatgpt.site  
**Korunan canonical hedefi:** https://ziyasakiryilmaz.com  
**Başlangıç sürümü:** 59aebdfd4dd439e5d9c7999624f6073e5df1bb38  
**Program yayın geçidi:** BLOCKED — teknik düzeltmelerin tamamlanması, Notion programının dış doğrulama ve insan imza şartlarını tek başına karşılamaz.

Bu rapor uygulama kaynakları ve sunucuda üretilen HTML üzerinden yapılan denetimi kaydeder. Lighthouse raporu, gerçek tarayıcı ölçümü veya Google indekslenme kanıtı değildir. Özel önizleme erişimi korunur; bot politikası, yayın alan adı ve public erişim bu denetim için değiştirilmez.

## Okunan gereksinimler ve kapsam

[SEO ana belgesi](https://app.notion.com/p/3e51fd693ee080a18f79f1ede4c42fcf) ve aşağıdaki on alt sayfa 01→10 sırasıyla tamamen alındı ve okundu. Metinler [seo klasöründe](seo/) saklandı; [fetch kayıtları](seo/notion-fetch-receipts.json) sayfa URL, güncelleme tarihi ve içerik uzunluğunu kaydeder. Servis bu yanıtlarda kesilme veya bilinmeyen blok uyarısı vermedi; bu alanlar dönmediği için kayıtlarda null bırakıldı.

SEO-01 yönetişim geçidi henüz geçilmedi. Sonraki dokümanlar uygulama geçidini geçmiş saymak için değil, tüm talep kapsamını ve riskleri keşfetmek için incelendi. SEO-01…10 programının tamamına PASS verilmedi. Bağımsız, yetkilendirilmiş özel önizleme iyileştirmeleri ayrıca test edilir.

| Adım | Belge | Yerel kanıt / incelenen kapsam | Eksik dış kanıt veya karar | Program geçidi |
|---|---|---|---|---|
| SEO-01 | [Program, RACI ve RFC](https://app.notion.com/p/3e51fd693ee080fe8173d913bfebee42) | Envanter, başlangıç SHA, etki ve geri dönüş sınırları bu pakette | İsimli SEO/Eng/EM ve yedek sorumlular; RFC onayları; görev DoD kullanım kanıtı | BLOCKED |
| SEO-02 | [IA ve URL politikası](https://app.notion.com/p/3e51fd693ee080319f87eb3da92a162f) | 63 route envanteri; path/slash/canonical kodu; menü/liste erişimi | Public www/http/slash ağ testi; GSC ilk 50 sorgu ve sorgu sahibi eşlemesi; policy imzası | BLOCKED |
| SEO-03 | [Crawl, robots ve sitemap](https://app.notion.com/p/3e51fd693ee080798f52ce38f6716e92) | robots ve dinamik sitemap kaynağı; /admin/ ve /api/ engeli; CSS/JS engeli yok | Gerçek production domain property, DNS doğrulaması, sitemap gönderimi/okunma; public HTTP sonuçları | BLOCKED |
| SEO-04 | [Rendering](https://app.notion.com/p/3e51fd693ee08029afacfd9271e061c5) | 63 sayfa SSR HTML; title/H1/copy/link initial HTML'de | GSC crawled HTML karşılaştırması; gerçek tarayıcı deep-link/yenileme, filmstrip ve route meta E2E | BLOCKED |
| SEO-05 | [On-page](https://app.notion.com/p/3e51fd693ee080b8bc62d8fc29813eef) | 0 duplicate title/description; her sayfada 1 H1; Türkçe lang; CMS HTML alanlarının denetimi | Mobil/masaüstü SERP pixel ölçümü; metin/sunum sahibi incelemesi | BLOCKED |
| SEO-06 | [Structured data](https://app.notion.com/p/3e51fd693ee080f080d7fcb37d6a5893) | Schema tür ve tarih envanteri; DOM parity riskleri tespit edildi | Rich Results ve GSC dış doğrulaması; schema RFC sign-off; gerçek tarih/kimlik kayıtları | BLOCKED |
| SEO-07 | [CWV ve performans](https://app.notion.com/p/3e51fd693ee0801ba516d2d9ef2fb99e) | Yerel JS/CSS boyutları; video indirme stratejisi; görsel boyutları ve fontlar | Lighthouse mobil/masaüstü; LCP/CLS filmstrip; CrUX 28 günlük p75; onaylı route budget veya istisna | BLOCKED |
| SEO-08 | [Social graph](https://app.notion.com/p/3e51fd693ee080b8891aee0e50eba1ab) | OG/X alanları; canonical eşleşmesi; 1200×630 JPG fallback | Paylaşım botlarının gerçek erişimi; Meta/LinkedIn/X top 10 URL önizlemesi ve arşivi | BLOCKED |
| SEO-09 | [Ölçüm ve olaylar](https://app.notion.com/p/3e51fd693ee080809ea0cfbd09fa6bff) | Kontrol listesi ve olay akışı aşağıda | GSC/GA4/CrUX erişimi; dashboard URL/rolleri; iki haftalık ölçüm; isimli on-call | BLOCKED |
| SEO-10 | [Yayın ve yönlendirmeler](https://app.notion.com/p/3e51fd693ee08052ad3ccbf5fe5f01ea) | Mevcut 3 test yönlendirmesi ve slash davranışı incelendi; geri dönüş SHA kayıtlı | Tüm önceki geçitler; yönlendirme kayıt imzası; denenmiş rollback; public cutover, T+7/T+30 izlemi | BLOCKED |

Tek Türkçe içerik var. Gerçek çeviriler bulunmadığından hreflang veya sahte İngilizce URL üretilmez. Playbook'un Figtures şirket sabiti örneği Ziya Şakir Yılmaz'ın iletişim bilgisi sayılmaz; sayfaya/schema'ya taşınmaz. Kitap, program, biyografi ve makale iddiaları mevcut içerikle sınırlı kalır.

## Son düzeltmelerin tekrar denetimi

Dört sayfadaki H1→H3 atlaması H2 semantiğiyle, kartların tipografisi korunarak düzeltildi. Sunucunun ürettiği gerçek HTML tekrar incelendi; [son statik SSR kanıtı](seo/static-after.json) başlangıç dosyasından ayrı saklandı. 

| Kontrol | Önce | Sonra |
|---|---:|---:|
| Eksik og:site_name | 2 | 0 |
| Eksik twitter:title / description | 2 / 2 | 0 / 0 |
| Ana içerik landmark eksikliği | 63 | 0 |
| HTML görsel width/height eksikliği | 21 | 0 |
| Duplicate title / description | 0 / 0 | 0 / 0 |
| Birden fazla veya eksik H1 | 0 | 0 |
| Başlık seviye atlaması bulunan sayfa | 4 | 0 |
| srcset bulunmayan img | 22 | 22 |

[GET handler yanıt testi](seo/route-handler-after.json) 63 yayımlanmış sayfanın tamamında 200, tek H1/main landmark, tam meta alanları, self canonical ve geçerli JSON-LD doğruladı. Ayrıca 2 bilinmeyen/özel route 404, 3 eski test route'u 308→200, 3 trailing-slash normalizasyonu, query parametrelerinden arındırılmış canonical ve 63 benzersiz sitemap URL'si doğrulandı. Bu test uygulamanın gerçek Request/Response fonksiyonlarını çağırır; dış ağ, CDN, oturum duvarı veya tarayıcı ölçümü yerine geçmez.

Yeniden üretim:

```bash
node reports/seo/audit-static.mjs reports/seo/static-after.json
node reports/seo/check-routes.mjs
```

Ana sayfada iki native video açılışta metadata düzeyinde tutuluyor; TEDx bittikten sonra yalnız seçilen video auto preload'a alınıyor. Sonraki videoya geçişte o video hazırlanıyor. Video dosya boyutları ve gerçek mobil ağ etkisi ayrı bir konudur; LCP/INP/CLS iyileşmesi ölçülmüş sayılmaz.

SEO runtime düzeltmeleri eksik etiketleri tamamladı, OG/X görsel URL'lerini mutlak yaptı, schema'yı son CMS DOM'undan üretti. Gösterilmeyen VideoObject tarihleri kaldırıldı; makale tarihleri görünür tarihle eşlendi; kitap/konuşma listeleri görünür kartlara bağlandı. Son Rich Results ve gerçek sosyal bot doğrulaması hâlâ BLOCKED.

## Başlangıç ölçümü ve somut kusurlar

Yeniden üretim:

```bash
node reports/seo/audit-static.mjs reports/seo/static-baseline.json
```

[63 sayfanın alan düzeyinde kanıtı](seo/static-baseline.json), [URL envanteri](seo/url-inventory.csv).

| Kontrol | Başlangıç sonucu | Anlamı |
|---|---:|---|
| SSR içerik sayfası | 63 | Ortak menü/footer belgesi envanter dışında |
| Boş description | 0 | Açıklamalar HTML'de |
| Duplicate title / description | 0 / 0 | Aynı metne sahip meta yok |
| Tek H1 ihlali | 0 | 63 sayfada birer H1 |
| Eksik og:site_name | 2 | Ana sayfa ve /makaleler/ |
| Eksik twitter:title / description | 2 / 2 | Ana sayfa ve /makaleler/ |
| main landmark bulunmayan sayfa | 63 | Ekran okuyucu ana içerik bölgesi eksik |
| Başlık düzeyi atlayan sayfa | 4 | H1 sonrasında H3 görülen yerler |
| alt niteliği bulunmayan img | 0 | Mevcut img öğeleri tanımlı |
| width/height bulunmayan img | 21 | CSS oranı bazılarını korusa da HTML ölçüsü eksik |
| srcset bulunmayan img | 22 | Mobilde ölçüye uygun kaynak seçimi yok |
| En yüksek yerel JS gzip toplamı | 7.290 byte | YouTube ve video dahil değil |
| En yüksek yerel CSS gzip toplamı | 26.008 byte | Ağ ölçümü veya tarayıcı sonucu değil |

Öncelikler:

1. **CMS meta parity:** Önceki renderer yalnız mevcut meta düğümlerine değer yazıyordu. Eksik OG/X etiketlerini oluşturmalı, CMS'den gelen görsel yolunu mutlak HTTPS URL'ye çevirmeli. Ana sayfa ve makale listesi etkileniyor.
2. **Schema görünür içerikle aynı kaynaktan üretilmeli:** Başlangıç JSON-LD'sinde TEDx videoları için 1 Ocak tarihlerinin kaynağı görünür değil; gelecek kitap için 2026-10 yayım bilgisi bulunuyor. Makalelerde ortak 2026-09-29/30 tarihleri, notlarda Eylül tarihleri ve biyografide güncelleme tarihi var. Bu tarihler doğrulanmadan bugünün tarihiyle değiştirilmemeli. Görünür veya kayıtlı doğrulanmış tarih yoksa uygun property atlanmalı. CMS içerik değiştiğinde FAQ, Book, Article ve entity verisi de değişmeli.
3. **Erişilebilirlik:** Sayfa başına bir main landmark; /buradan-basla/, /hayattan-notlar/, /testler/ ve /testler/kafa-yapisi-testi/ başlık hiyerarşisi düzeltmesi gerekli. Görünüşü değiştirmeden semantik düzenlenebilir.
4. **Medya yükleme maliyeti:** Ana sayfanın 13.189.706 byte native videosu preload=auto. İkinci video 11.376.989 byte; intro bitince iki native video da preload=auto oluyor. Buna YouTube açılışı ekleniyor. Bu dosya boyutları transferin tamamının ilk anda gerçekleştiğini kanıtlamaz; fakat mobil bant genişliği rekabeti için somut risk. Mevcut 31–35 saniyelik tek seferlik açılış ve ardından native video akışı korunarak yalnız sıradaki video hazırlanmalı.
5. **Görsel boyutu:** srcset/sizes ve gerçek width/height değerlendirilmeli. Kitap kapakları gibi küçük orijinaller için sahte yüksek çözünürlük üretilmemeli. 8K indirmek performans hedefi olarak kullanılmamalı; dosyanın gerçek çözünürlüğü ve aktarım boyutu ayrı raporlanmalı.

Canonical host ile özel önizleme host'u farklıdır. Bu tek başına yanlış canonical kanıtı değildir: mevcut production politikası .com alanını işaretler; CMS siteOrigin özel uygulama erişimi/iletişim akışında kullanılır. Bu denetim .com politikasını değiştirmez. Merkezi canonicalOrigin kullanımı tekrar eden hardcoded değerlerin drift riskini azaltabilir.

## Lighthouse, CWV ve tarayıcı doğrulaması

**Lighthouse: NOT_RUN. Skor yok.** [Makine tarafından okunabilir durum](seo/lighthouse-status.json).

Çalışma ortamı managed Linux. Gerekli control-browser becerisi ve yetkili tarayıcı yolu bu oturumda yok. Sites'in managed ortam talimatı, bu durumda alternatif tarayıcı kurmayı veya farklı preview yolu açmayı yasaklıyor. Bu nedenle Chrome kurulmadı, gizli fallback tarayıcı çalıştırılmadı, private oturum bilgisi PageSpeed'e gönderilmedi ve site public yapılmadı.

Lighthouse özel oturumdaki sayfalar üzerinde Chrome DevTools aracılığıyla çalışabilir; bu oturumda o yetkili kabiliyet bulunmaması engeldir. PageSpeed'e özel önizleme URL'sini göndermek uygulama yerine giriş duvarını ölçebilir. Böyle bir puanı sitenin sonucu saymıyoruz.

Yetkili tarayıcı bulunduğunda tamamlanacak ölçüm:

- Aşağıdaki 10 URL için mobil ve masaüstü; aynı koşullarda üçer Lighthouse çalıştırması, medyan ve ham JSON/HTML.
- LCP öğesi ve ağ waterfall; video/YouTube ile poster rekabeti.
- Sayfa açılışı, menü, makale listesi, test soru ilerlemesi ve form için CLS/etkileşim kontrolü.
- Lighthouse Performance, Accessibility, Best Practices, SEO ayrı raporlanır. Lighthouse skorundan GEO skoru türetilmez.
- CrUX ve GSC alan verisi ayrıca incelenir. Alan verisi yoksa NO_DATA denir; otomatik Good sayılmaz.
- Önce/sonra aynı mobil ağ/CPU profili ve aynı viewport kullanılır.

| İlk ölçüm seti | Gerekçe |
|---|---|
| / | Ana sayfa, YouTube → native intro akışı |
| /konusmaci/ | Keynote dönüşümü, konuşma arşivi |
| /egitimler/ | Eğitim listesi |
| /kurumsal/satis-egitimi/ | Kurumsal eğitim detay |
| /mentorluk/ | Mentorluk dönüşümü |
| /iletisim/ | Form etkileşimi |
| /kitaplar/ | Kapak görselleri |
| /makaleler/ | İçerik keşfi |
| /makaleler/zihinsel-dayaniklilik/ | Makale, kaynaklar ve FAQ |
| /testler/kafa-yapisi-testi/ | Test etkileşimi |

Notion'un örnek JS gzip bütçeleri (home 180KB, içerik 150KB) yalnız yerel script ölçümünde aşılmıyor; bu, YouTube dahil gerçek route bütçesinin geçtiği anlamına gelmez. Video şartı nedeniyle gerçek transfer ve LCP ölçümü özellikle gerekli. Good CWV eşikleri p75 LCP≤2,5s, INP≤200ms, CLS≤0,1 olarak değerlendirilir; ölçülmüş sonuç yoktur.

## Operasyon ve yayın için tamamlanacak işler

- GSC Domain property, DNS doğrulama sahibi ve yedek atanır; sitemap gönderilir; ilk 10 URL canlı test ve crawled HTML arşivlenir.
- Query→owner URL haritası gerçek GSC sorgularıyla hazırlanır. Makaleleri varsayımsal cannibalization nedeniyle silmek veya taşımak bu denetimin parçası değildir.
- Public origin'in http/https, www/apex ve trailing-slash politikası ağ üzerinden doğrulanır. Yeni yönlendirme gerekiyorsa from/to/status/query politikası ayrı kayda alınır.
- Görünür metin, schema ve sosyal profil URL'leri içerik sahibi tarafından doğrulanır. Sahte yorum/rating, backlink, yayın tarihi veya kurumsal başarı metriği eklenmez.
- Meta Sharing Debugger, LinkedIn Post Inspector ve X paylaşım testi seçilmiş 10 URL için uygulanır; gerçek görsel HTTP durumu ve crop kanıtı kaydedilir.
- Haftalık GSC: brand/non-brand, indexing, sitemap, manual actions, CWV, sorgu çakışması; aylık CrUX trendi. GA4 kurulumu/consent gereksinimleri onaylı analytics kimlikleriyle ayrıca tamamlanır.
- Olay tetikleri: site genelinde yanlış noindex/canonical, index kaybı, redirect döngüsü, önemli sayfalarda 5xx veya doğrulanmış non-brand trafik düşüşü. Önce son yayın ve robots/canonical/redirect kontrolü, sonra kanıtlı kök neden analizi.
- Production erişimi ve bot politikası ancak mevcut yetki kapsamına göre ayrı karar verildiğinde değiştirilir. Zamanlanmış otomasyon bu raporla kurulmuş sayılmaz.

## Geri dönüş ve kanıt sınırı

Başlangıç SHA korunmuştur. Yetkili Sites iş akışı üzerinden önceki kaynak sürümünü geri yayımlama planı kullanılabilir; bu raporda rollback çalıştırılmış gibi işaretlenmez. SEO programının public release gate'i dış doğrulamalar ve imzalar tamamlanana kadar BLOCKED kalır. Özel önizleme düzenlemeleri kullanıcıya inceleme için sunulabilir.

`static-after.json` ve `route-handler-after.json` son tekrar denetimini gösterir. Başlangıç kanıtı ayrı korunmuştur. Son runtime/HTML değişikliklerinden sonra bu iki komut yeniden çalıştırılmalıdır; dış hizmet testlerinin NOT_RUN/BLOCKED durumları yerel testlerle değişmez.

## Birincil teknik referanslar

12 Ekim 2026'da incelendi:

- [Google structured data kuralları](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): görünür içerik, doğruluk, erişim ve gerekli alanlar.
- [Google sitemap üretimi](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): canonical URL'ler, gerçek lastmod ve mutlak adresler.
- [Google/web.dev LCP optimizasyonu](https://web.dev/articles/optimize-lcp): kritik görselin ilk HTML'de bulunması, önceliği ve LCP görselinin lazy olmaması.
- [Chrome Lighthouse belgeleri](https://developer.chrome.com/docs/lighthouse/overview/): tarayıcı gereksinimi, özel oturum ve rapor çıktıları.

