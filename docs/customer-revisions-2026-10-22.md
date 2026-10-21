# Ziya Şakir Yılmaz müşteri revizeleri ve kabul kontrolü

Kaynak: müşterinin ilettiği **WEB SİTESİ REVİZE 1910.docx**, “V13 Nihai Uygulama Briefi”. Uygulama tarihi: 22 Ekim 2026. Bu kayıt, metin ve işlev taleplerini tek tek izler; tamamlanmayan bağımlılıklar tamamlanmış gibi gösterilmez.

**Öncelikli son talimat:** Mevcut lacivert tasarım korunacak. Renkler, tipografi, header formu, genel grid, boşluk düzeni ve mevcut görsel dil yeniden tasarlanmayacak. Belgedeki bordo/zeytin renkleri, yeni görsel kimlikler, yeniden tasarlanmış kartlar ve yeni efekt talepleri bu son talimatla kapsam dışıdır. İçerik için gerekli yeni bölümler mevcut bileşen diliyle eklenir. Hero sayaçlarının ilk ekranda, kaymadan görünmesi korunur.

Belgede 5 numaralı madde bulunmuyor; numaralandırma bilinçli olarak aynen korunmuştur.

## Uygulama planı

1. Onaylı metinleri ana sayfa ve ilgili alt sayfalara uygula; mevcut içerikleri bağlamını kaybettirmeden güncelle.
2. Gerçek medya arşivinden uygun hero kaynaklarını hazırla; kaynak bulunmayan kanıt, yorum ve showreel parçalarını uydurma.
3. Konuşmacı materyallerini ve İngilizce konuşmacı sayfasını hazırla; form, bağlantı ve SEO entegrasyonlarını tamamla.
4. CMS kataloğunu ve mevcut kayıtlarla uyumluluğu doğrula; canlı içerikleri kontrollü olarak güncelle.
5. Fonksiyon, mobil görünüm, SEO ve gerçek yayın sonuçlarını madde madde kontrol et. Gerçek cihaz kaydı alınamıyorsa bu sınırlamayı açıkça kaydet.

## Durum anahtarı

- **Bekliyor:** Henüz tamamlanma kanıtı yok.
- **Kod doğrulandı:** Kaynak ve hedefli kontrol geçti; canlı kontrol ayrı belirtilir.
- **Canlı doğrulandı:** Yayındaki sonuç kontrol edildi.
- **Canlı backend doğrulandı:** Gerçek sunucu kaydı doğrulandı; tüm sayfanın yayın veya cihaz kontrolü anlamına gelmez.
- **Malzeme bekliyor:** Gerçek/onaylı kaynak olmadan yayınlanamaz.
- **Tasarım korunuyor:** Son kullanıcı talimatı nedeniyle belgedeki tasarım değişikliği uygulanmaz.
- **Kısmi:** Uygulanabilir kısım tamamlandı; kalan bağımlılık açıkça belirtilir.

## Madde bazında kabul listesi

| No | Talep ve kabul ölçütü | Durum | Kanıt veya açık bağımlılık |
| --- | --- | --- | --- |
| 1 | Hero yalnız dört gerçek sahne anı; selfie/telefon yok. Her biri 2,5–3 sn; sert kesme. H.264 1080p toplam ≤5 MB; ayrı 720p mobil ≤2,5 MB; AVIF poster. | Kısmi | Dört temiz gerçek kare grubu sert kesmeyle hazır. Desktop 1.027.470 B, 1920×1080 H.264; mobil 466.176 B, 1280×720; AVIF poster. Kaynak 720p, çıktı 1080p büyütme. Toplam 3,333 sn; istenen 4 × 2,5–3 sn için uzun özgün kayıt yok. Kanıt: `scripts/hero-media-edit.json`; hedefli codec/boyut kontrolü geçti. |
| 2 | Hero etiketi “Başarı Mühendisi, Yazar, Eğitmen”. Konuşmacı sayfasında “5 TEDx konuşması · 4 kayıt yayında”. | Kod doğrulandı | Ana sayfa ve TR konuşmacı metinleri kabul kontrolünden geçti; canlı yayın kontrolü bekliyor. |
| 3 | H1 korunur; alt cümle “Salondan sloganla çıkılmaz; bir modelle ve ilk üç adımla çıkılır.” | Kod doğrulandı | H1 korunuyor, onaylı alt cümle kaynakta mevcut; mobil satır/taşma kontrolü ayrı. |
| 4 | Dört niyet korunur; keynote/kurumsal/bireysel/mentorluk metinleri birebir standardize edilir. Header CTA bu alana gider, popup açmaz. | Kod doğrulandı | Dört niyet metni birebir. Tüm aktif sayfalarda masaüstü ve mobil header CTA’ları ana sayfadaki gerçek dört-seçenek hedefine gidiyor; popup yok. Kaynak ve CMS kabul kontrolü geçti. |
| 5 | Kaynak belgede bu numara yok. | Uygulanmaz | Yeni bir talep uydurulmadı. |
| 6 | Sayaçların altında 6–8 gerçek/onaylı kurum veya etkinlik; logo izni yoksa metin. | Malzeme bekliyor | Depoda izin/onay belgesiyle eşleşen kurum listesi bulunamadı. Bağımsız etkinlik doğrulamaları 25. maddede ele alınır; uydurma logo eklenmez. |
| 7 | Ana testimonial, gerçek isim/unvan/kurum ve onaylı 2–3 cümle; değişimi anlatır. | Malzeme bekliyor | Onaylı müşteri sözü, isim, unvan, kurum ve portre gönderilmedi. Belgedeki örnek cümle gerçek yorum diye yayımlanmaz. |
| 8 | Manifesto başlığı korunur; otuz yıllık saha deneyimi metni ve “Dört keynote’u gör”/“Kızık’tan Astana’ya” bağlantıları uygulanır. | Kod doğrulandı | Onaylı manifesto metni ve başlık kaynakta mevcut. CTA standardının global entegrasyonu ayrıca 28. maddede; yeni reveal temposu uygulanmadı, mevcut hareket dili korunuyor. |
| 9 | Manifestodan sonra “Önce yaşadım” bölümü; Kızık, Astana, Karar paragrafları aynen; yalnız hikâyeye devam bağlantısı. | Kod doğrulandı | Kızık/Astana/Karar paragrafları birebir; sıra manifesto→yaşamışlık→alanlar; hakkında bağlantısı var, satış CTA yok. `check-customer-revisions.mjs` doğruladı. |
| 10 | Dört alan başlığı/alt metni, dört ana cümle ve dört soru birebir. Sorular dokunmatik cihazda erişilebilir. | Kod doğrulandı | Başlık, alt metin, dört ana cümle ve dört soru birebir kontrolden geçti. Mevcut alan yerleşimi korunuyor; yeni görsel kart/hover tasarımı yok. |
| 11 | TEDx etiketi, başlığı, alt metni ve CTA güncellenir; 5/4 açıklaması görünür. Poster ilk yüklemede erişilebilir. | Kod doğrulandı | Onaylı metinler ve 5/4 açıklaması var. TEDx poster `loading=eager`; kaynak kontrolü geçti; mobil görsel kontrol ayrı. |
| 12 | Başarı Mühendisliği kitabının kavramları ile eğitim uygulaması ayrılır; keşif/tasarım/inşa/test/bakım soruları onaylı biçimde yer alır. | Kod doğrulandı | Beş uygulama aşaması ve soruları birebir; bunun kitabın bölüm yapısı olmadığı açıklaması var. |
| 13 | Başarı Mühendisliği için yeni blueprint/teknik görsel dünya. | Tasarım korunuyor | Son talimat gereği mevcut lacivert tasarım yeniden kurulmayacak; bu maddeye yeni grafik dili eklenmeyecek. |
| 14 | KGKY hero ve Sabotajcı/Henüz/Rağmen/Mümkün/6 Ayna/90 Saniye/Hayır/66 Gün içerik akışı; beş zırh ana sistem olmaz. | Kısmi | Sabotajcı→Henüz/Rağmen/Mümkün→6 Ayna→90 saniye/Hayır→66 gün sırası ve metinler uygulandı. Gerçek localStorage 66 gün aracı ve test bağlantısı var. 6 Ayna adları doğrulanmadığı için yazılmadı; yalnız onaylı başlık/kitap linki. Türetilen ölçüm boyutları açıklaması var; tasarım korunuyor. |
| 15 | Keynote 01: “5 aşamalı modeli götürür” kaldırılır; Ben Yasası ve Sitem/Sistem ile onaylı çıktı metni. | Kod doğrulandı | TR konuşmacı çıktısı birebir onaylı metne çevrildi; kabul kontrolü geçti. |
| 16 | Keynote 02: “5 zırh katmanı” kaldırılır; Sabotajcı, Henüz–Rağmen–Mümkün ve 90 saniye çıktısı. | Kod doğrulandı | Sabotajcı/Henüz–Rağmen–Mümkün/90 sn çıktısı birebir; kabul kontrolü geçti. |
| 17 | Satış hero altında 22 üretici, %5/%3 sözleşme hikâyesi; rakamsız “Pahalı bir ders.”; ardından teşhis cümlesi. | Kod doğrulandı | Satış sayfasında rakamsız “Pahalı bir ders.” ve müşterinin verdiği 22 üretici/%5/%3 olay metni birebir. Diğer eski tutarların kaldırılması global kabul kontrolünde ayrıca izleniyor. |
| 18 | Liderlik tezi; Gör/Göster/Geliştir/Geri Çekil/Çoğalt döngüsü, ™ olmadan; 12.12.2012 saha hikâyesi. | Kod doğrulandı | Beş adım doğru sırada, başlıkta ™ yok; kurumsal unvan sonrası saha hikâyesi birebir. |
| 19 | Kurumsal başlık ve üç sorun sorusu; bireysel başlık/cümle; iki tarafın ana ve ikincil CTA’ları. | Kod doğrulandı | Kurumsal üç soru ve bireysel cümle/CTA metinleri kaynak kabul kontrolünden geçti. |
| 20 | 75–95 saniyelik gerçek showreel; sahne/punchline/TEDx/seyirci/uluslararası/final akışı; ses yalnız kullanıcı tıklamasıyla. | Malzeme bekliyor | Yerel özgün videolarda ses yok; 90 sn showreel ve gerçek punchline/alkış için sesli ham kayıt gerekiyor. YouTube metadata mevcut ancak indirme akışı kullanılamadı. Sahte veya tekrarlardan uzatılmış showreel yayımlanmadı. |
| 21 | ≤10 MB speaker kit PDF; üç gerçek yüksek çözünürlüklü fotoğraf; TR/EN 50/150/300 kelime bio; dört keynote/audience/format/teknik/iletişim/logo. | Kısmi | `/assets/ziya-sakir-yilmaz-speaker-kit.pdf`: 744.877 bayt, 8 sayfa. TR/EN 50/150/300 kelimelik altı bio ve dört keynote, format/teknik/iletişim içerikleri hazır; 8 sayfa render görseli incelendi. 3 gerçek fotoğraf mevcut fakat native 1920×1080, 1800×1013, 800×800; yüksek çözünürlüklü orijinaller bekleniyor. Kaynak: `content/speaker-kit.json`. |
| 22 | Mentorluk için uygun olmayan üç profil; sınırlı kontenjan cümlesi; “Mentorluk için başvur”. | Kod doğrulandı | Üç uygunsuz profil, sınırlı çalışma/uygunluk cümlesi ve başvuru CTA uygulandı. Onaysız süre/görüşme ritmi kaldırıldı. |
| 23 | Ana sayfada dört gerçek kitap kapağı; “Fikirlerin basılı hali.” ve “4 kitap · 75.000+ okur”; sürekli sallanma yok. | Kod doğrulandı | Anasayfada dört yerel gerçek kapak, bağlantılar, onaylı başlık ve 4 kitap/75.000+ okur var. Sürekli sallanma eklenmedi; görsel hareket kontrolü mobil QA’da. |
| 24 | “Sahneden sonra ne kaldı?”: bir ana ve üç küçük onaylı yorum; gerçek isim/unvan/kurum/portre. | Malzeme bekliyor | Dört onaylı testimonial yok; placeholder ya da örnek yorum yayınlanmayacak. |
| 25 | Konuşmacı hero sonrası etkinlik adı+yıl+doğrulanabilir kaynak bağlantısı; izinsiz logo yok. | Kod doğrulandı | TEDxReset 2025, Global HR Summit 2026, Global Marketing Summit 2026, SAGEL Day 2026 etkinlik+yıl/kaynak linkleri TR/EN sayfalara eklendi. Kaynaklar `content/speaker-kit.json` eventSources; izinsiz logo yok. |
| 26 | Final başlığı “Sıradaki salon sizinki olsun.”; onaylı alt metin; keynote/kurumsal ana CTA, bireysel/mentorluk bağlantıları. | Kod doğrulandı | Başlık, alt metin ve davet/kurumsal/bireysel/mentorluk bağlantıları kaynakta mevcut. Mevcut final tasarımı korunuyor. |
| 27 | Keynote seçilince tarih ve katılımcı grubu; temel iletişim alanları; gerçek CRM kaydı; yalnız sunucu başarısında onaylı teşekkür metni. | Canlı backend doğrulandı | Keynote tarih/katılımcı alanları ve temel form alanları kaynakta doğrulandı. Canlı test isteği HTTP 201 ile kaydedildi; CRM’de tarih, katılımcı grubu ve iletişim alanları doğrulandı. Test kaydı doğrulama sonrası silindi. 37 form kontrolü ve altı önizleme yüzeyi kontrolü geçti. İngilizce form 375px tarayıcıda koşullu alan ve yatay taşma kontrolünden geçti. |
| 28 | “Programın iskeletini gör”, “Dört keynote’u gör”, “Kızık’tan Astana’ya” CTA standardı. | Kod doğrulandı | Tüm aktif sayfalarda eski jenerik CTA etiketleri kaldırıldı; site genelindeki eski 440.000/220.000 tutar taraması da geçti. Header ve footer bağlantıları CMS üretimine dahil edildi. |
| 29 | “30 saniyede cevap” içerikleri korunur. | Tasarım korunuyor | Bilgiler silinmez. Belgedeki yeni kutu stili/genişlik/font tasarımı son kullanıcı talimatı gereği uygulanmaz. |
| 30 | Geniş fotoğraflarda gerçek yeterli çözünürlük; 2400px genişlik standardı ve doğal görünüm; dört alan için 1200×1500 hedefi. | Kısmi | Gerçek kaynaklar envanterlendi. Native 2400 px geniş sahne fotoğrafı ve yüksek çözünürlüklü üç portre mevcut değil. Teknik büyütme özgün detay artışı diye sunulmuyor; yeni alan kartı tasarımı uygulanmıyor. |
| 31 | 375px/430px mobil hero/poster/başlık/sorular/TEDx/KGKY/66gün/form/final; iPhone Safari ve Android Chrome ekran kaydı. | Kısmi | Masaüstü ile 375px/430px ana sayfa: beş sayaç ilk ekranda; mobil video kaynağı doğru, taşma yok. EN 375px form: koşullu alanlar doğru, taşma yok. KGKY 430px: hedef ve birinci gün kaydı yenileme sonrası korunuyor. iPhone Safari/Android Chrome fiziksel cihaz ekran kaydı mevcut araçla alınamadı. |
| 32 | Üretim canonical `https://ziyasakiryilmaz.com/...`; dev noindex; Person sameAs dört kaynak; dört Book; hakkında misyon; TR/EN hreflang. | Kod doğrulandı | Üretim canonical ve TR/EN hreflang, 65 belgeli CMS kaynağında doğrulandı; üretim/dev host davranışı ve canlı çıktı yayından sonra ayrıca kontrol edilecek. İngilizce Service kanalı sayfadaki gerçek `#inquiry` formunu gösteriyor; 64 ham şablon ve 64 SSR çıktısında SEO kontrolü geçti. |
| 33 | `/en/speaker/`: Success Engineer, dört keynote, kısa bio, doğrulanmış sahne bilgileri, speaker kit, inquiry akışı. | Kısmi | `/en/speaker/` İngilizce satış metni, Success Engineer, dört keynote, bio, gerçek kaynak linkleri, PDF ve gerçek contactForm hazır. CMS sayfası ve TR/EN hreflang kabul kontrolünden geçti. Onaysız yorum ve eksik 90 sn showreel yayımlanmadı. |

## Onay veya gerçek malzeme gerektiren noktalar

- **Logolar ve kurum adları:** Müşterinin kullanılmasını onayladığı 6–8 kurum/etkinlik listesi ile logo izinleri. Etkinlikte yer alma kanıtı, kurumun ticari referans olma onayı yerine geçmez.
- **Testimonial:** Dört gerçek kişiden onaylı metin; ad soyad, unvan, kurum; varsa kullanım izni olan portre. Belgedeki örnek sözler kullanılmaz.
- **6 Ayna:** Kitaptaki doğrulanmış adların yer aldığı sayfa/alıntı veya yazar onayı. Mevcut sözlükteki listede Öz Değer, Öz Yeterlilik, Öz Güven, Öz Saygı, Öz Şefkat, Öz Sevgi yazıyor; özgün retained V12 dosyaları bu adları doğrulamıyor.
- **Satış hikâyesindeki tutar:** Onaylı tek dolar rakamı gelene kadar rakamsız başlık ve müşterinin verdiği olay metni yeterlidir.
- **Mentorluk ritmi:** Süre/görüşme sıklığı onayı. Çalışmanın uygunluk ve başvuru metinleri bu onayı beklemeden tamamlanabilir.
- **Showreel ve görsel kalite:** Mevcut gerçek video arşivi gerekli punchline, seyirci ve alkış seslerini karşılamıyorsa ham kayıt istenir. Teknik büyütme gerçek kaynak detayını artırmış gibi sunulmaz.
- **Fiziksel cihaz kabulü:** iPhone Safari ve Android Chrome üzerinde gerçek ekran kayıtları mevcut araçtan alınamıyorsa ayrı son kabul adımı olarak kalır.

## Doğrulama kaydı

| Kontrol | Sonuç | Kanıt |
| --- | --- | --- |
| Kaynak belgenin tüm paragraflarının okunması | Tamamlandı | DOCX XML metin çıkarımı; 633 indeksine kadar içerik, belge içinde medya/hyperlink yok. |
| Son tasarım talimatının önceliği | Tanımlandı | Lacivert tasarım korunur; belgeyle çatışan görsel yeniden tasarım maddeleri ayrı işaretlendi. |
| Metin ve bağlantı kabul kontrolleri | Tamamlandı | `node scripts/check-customer-revisions.mjs`: 23 kabul kontrolü geçti, 0 hata. Açık gerçek malzeme/cihaz koşulları ayrı raporlanıyor. |
| CMS kayıtları ve yeni alanlar | Canlı backend doğrulandı | 65 belge canlıya tek transaction ile aktarıldı. 65 taslak ve yayındaki payload, repo seed içeriğiyle birebir eşleşiyor; revision/published_revision eşit. Yeni EN sayfası yayında. 192 bölüm editörü ve 5979 düzenlenebilir alan önceki yerel kontrollerde geçti. |
| Admin iş akışları | Tamamlandı | `check-admin-workflows.mjs`: 52 geçti, 0 hata; 65 belge, 5979 düzenlenebilir alan ve 64 video çalışma alanı. Taslak/yayın ayrımı, yetki, kullanıcı işlemleri, medya, kitaplar, menü/sıralama ve önizleme yerel DOM + Supabase stublarıyla kontrol edildi. Gerçek oturumdaki Storage yükleme testi yerine geçmez. |
| Form başarılı ve başarısız gönderim akışları | Canlı kayıt doğrulandı | Canlı POST 201; CRM’de gerçek tarih/katılımcı/iletişim alanları doğrulandı. Test kaydı doğrulama sonrası silindi. 37 form kontrolü ve altı önizleme yüzeyi kontrolü geçti; İngilizce 375px formda keynote seçimine göre alanların değişmesi ve yatay taşma olmaması doğrulandı. |
| Hero video codec/süre/boyut/kare | Kısmi | ffprobe ile H.264, 1080p/720p ve boyutlar geçti; dört temiz sert kesme medya ajanı tarafından incelendi. Süre 3,333 sn; uzun özgün kayıt yok. |
| Speaker kit PDF | Kısmi | 744.877 bayt, 8 sayfa; altı bio kelime sayısı, kaynak linkleri ve tüm sayfa render incelemesi geçti. Yüksek çözünürlüklü fotoğraf orijinalleri bekliyor. |
| Mobil tarayıcı kontrolü | Kısmi | Masaüstü, 375px ve 430px ana sayfa: beş sayaç ilk ekranda ve taşma yok; mobil 720p kaynak seçimi doğrulandı. İngilizce 375px form: keynote koşullu alanları çalışıyor, yatay taşma yok. KGKY 430px: hedef oluşturma, birinci gün işaretleme ve localStorage kaydının yenileme sonrası kalıcılığı doğrulandı. Fiziksel iPhone/Android kaydı yok. |
| SEO ve dil eşleştirmesi | Tamamlandı | `check-seo.mjs`: 64 ham şablon ve 64 SSR sayfası; altı Service sayfası, TR/EN dil/locale/hreflang, şema referansları, görünür içerik eşleşmesi, kaynak sırası, sitemap ve robots geçti. |
| Üretim build | Tamamlandı | Üretim build geçti. `check-resources.mjs`: 64 SSR sayfası, güncel CSS paketleri/sırası, kaynak bağları ve önbellek kuralları geçti. |
| GitHub ve Cloudflare dağıtımı | Canlı doğrulandı | `12b33f288ae4c61f438a9508a4b156c29e7462c5` için Workers Builds sonucu completed/success. Build `5f458ecd-bf18-45e8-a9b3-79cce506d03b`, Worker sürümü `7b3c1e36-e5d2-4554-8b81-644bae529bd3`. CI/CD otomatik çalışıyor; Cloudflare panel girişi gerekmiyor. |
| Canlı yeni sürüm kontrolü | Dağıtım ve veritabanı doğrulandı; HTML kabulü sınırlı | CI/CD completed/success; 65 canlı CMS payload seed ile birebir eşleşti, 65 yayımlanan sürüm geçmişi kaydı doğrulandı. Bu ortamdan `/en/speaker/` HTTP isteği Cloudflare 403/error 1010 döndürdü; tarayıcı isteği tamamlanmadı. Bu sonuç ziyaretçilerin de hata gördüğünü kanıtlamaz. Canlı DOM/PDF/SEO çıktısı ayrıca doğrulanmış sayılmaz. |

## Yayın kaydı — 22 Ekim 2026

- Kod: `12b33f288ae4c61f438a9508a4b156c29e7462c5`; Cloudflare Workers Builds completed/success.
- Otomatik CI/CD doğrulandı; panelden manuel yayın gerekmiyor.
- Hedef Worker: `ziya-sakir-yilmaz`; sürüm `7b3c1e36-e5d2-4554-8b81-644bae529bd3`.
- `supabase/content-revisions/20261022-customer-content.sql` canlı veritabanında uygulandı. Öncesinde 64 belgenin incelenen baseline ile aynı olduğu ve yayımlanmamış taslak bulunmadığı doğrulandı.
- Satır kilitleri ve revision/JSON eşitlik korumalarıyla işlem tek transaction olarak tamamlandı. Eski sürümler korunuyor; yeni İngilizce sayfayla birlikte 65 yayımlanmış kayıt bulunuyor.
- Sonradan okunan 65 taslak ve 65 yayımlanmış payload repo seed dosyasıyla birebir eşleşti; revision artışları doğrulandı.
- Bu SQL tek seferliktir; aynı sürümde tekrar çalıştırılmamalı.
- Malzeme ve fiziksel cihaz bekleyen maddeler hâlâ ayrı ve açık tutulur.

Canlı HTML doğrulamasının erişim sınırı yukarıdaki tabloda kaydedildi. Yerel mobil, form ve SEO kontrollerinin geçmiş sonuçları, canlı tarayıcı kabulü olarak yeniden etiketlenmedi.
