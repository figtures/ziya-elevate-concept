# Kamuya açık SEO, GEO ve AEO uygulaması — 12 Ekim 2026

Kullanıcı dış erişimi açıkça yetkilendirdi. Site erişimi `public` olarak değiştirildi; gerçek anonim HTTP başlangıç taraması 63/63 içerik sayfası ve 27/27 varlık için 200 yanıtını kaydetti. Bu rapor önceki raporların özel erişim engelini ve eski `.com` canonical kararını günceller. Kaynak dosyalarındaki önceki denetimler tarihsel kanıt olarak korunur.

Yayın adresi: https://ziya-sakir-yilmaz-keynote.dev-busraaktas.chatgpt.site

## Uygulanan düzeltmeler

- Canonical, sitemap, OG ve schema kimlikleri doğrulanan açık yayın adresinde birleşti. Bu sürümün `.com` üzerinde çalıştığı doğrulanamadığından eski alan adına indeksleme sinyali gönderilmiyor. İleride gerçek domain geçişinde canonical/redirect/Search Console birlikte güncellenmeli.
- 63 sayfanın başlık, açıklama, dil, tek H1, ana içerik alanı ve görünür içerikle uyumlu JSON-LD çıktısı test edildi. Makale, not, kişi, kitap, konuşma ve hizmet ilişkileri sayfadaki bilgilerden üretiliyor; uydurma puan, yorum, fiyat veya yayın tarihi yok.
- Arşivde yeni, değiştirilen ve yayımdan kaldırılan içerikler hem görünür listelerde hem schema'da aynı sırayla yansıyor. 1.203 kayıtla sayfalama sınırı test edildi.
- Mevcut 30 doğrudan cevap ve 103 soru-cevap birimi bağlantılandırıldı. İçindekiler son CMS içeriğinden üretiliyor. 26 bibliyografik esere karşılık 23 makalede 62 kaynak bağlantısı eklendi; makale metinleri korunuyor. Bu bağlantılar tüm sayısal iddialara bağımsız uzman onayı verildiği anlamına gelmez.
- Dokuz notun özgün kaynakta kayıtlı yazarı görünür, panelden düzenlenebilir yazar bağlantısına dönüştürüldü. Yeni makale/not taslağı, eski şablonun yayın/güncelleme tarihini taşımıyor.
- İsteğe bağlı `llms.txt`, yayımlanmış sayfalardan 23 seçilmiş bağlantı üretiyor; UTF-8, boyut sınırı, ETag/304 ve HEAD desteği var. Yönetim/API yanıtları `noindex` ve `no-store` taşıyor.
- TEDx 31–35 saniyelik ilk gösterimden sonra native videolara geçiş korunuyor. İnaktif videonun yüksek ön yükleme durumu, biten YouTube iframe'i ve gereksiz polling temizleniyor; gizli sekme/hareket azaltma durumlarında medya yüklemesi erteleniyor.
- Tasarım, menü başlıkları, dört başvuru seçeneği, kitaplar, 20 soruluk test ve Türkçe içerik korunuyor. Önceki spacing düzeltmeleri regresyon testinden geçti.

## Yerel doğrulama

| Kapsam | Gerçek sonuç | Sınır |
|---|---|---|
| İç bağlantılar | 66 kaynak HTML, 5.014 bağlantı/varlık yolu; tümü çözümlendi | Tarayıcı piksel hesabı değil |
| Menü ve footer | 63/63 rota menü/footer → arşiv → detay yoluyla erişilebilir | Canlı crawler keşfi ayrı kanıt |
| Spacing | 63 şablon, 4 viewport için CSS bütçeleri geçti | Görsel tarayıcı ekran testi değil |
| SEO | 63 şablon + 63 final SSR; schema/metadata/negatif CMS senaryoları geçti | Haricî Rich Results raporu değil |
| AEO | 877 kontrol geçti | Araştırma iddialarının uzman değerlendirmesi değil |
| Keşif dosyası | 38 kontrol geçti; 23 URL, 3.228 UTF-8 byte | Sıralama veya alıntılanma garantisi değil |
| Admin | 5.726 alan, 177 bölüm; 26 ayrıntılı iş akışı geçti | Yerel DOM ve stub servisler; canlı Supabase bağlı değil |
| Güvenlik | 195 SQL izin/red + 36 Edge Function kontrolü geçti | Yerel testler; gerçek hesap/Storage uçtan uca ölçümü değil |
| Hero | 11 medya yaşam döngüsü senaryo grubu geçti | Gerçek tarayıcı/Lighthouse ölçümü değil |

Test komutları ilgili raporlarda ve `scripts/check-*.mjs` dosyalarında tutulur. Route Request/Response kanıtı `seo/route-handler-after.json`; gerçek ağ taraması `public-audit/live-baseline.json` ve yayın sonrası ayrı dosyadadır.

## Dış ölçüm ve erişim sınırları

Google PageSpeed API'ye mobil ve masaüstü için gerçek ölçüm istekleri gönderildi. İki istek de `HTTP 429 / RESOURCE_EXHAUSTED` ve günlük kota 0 yanıtı verdi. Hata kanıtları `public-audit/` içinde. Bu nedenle Lighthouse skoru, LCP/CLS/INP veya CrUX değeri üretilmedi. Ortamda desteklenen tarayıcı kontrolü bulunmadığı için tarayıcı kurularak alternatif bir yol açılmadı.

Search Console/Bing sahiplik doğrulaması ve sitemap gönderimi, gerçek crawler IP/CDN logları, sosyal hesap sahipliği, konuşma transcript/caption QA, kritik iddiaların editoryal incelemesi ve iki bağımsız AI yüzeyindeki alıntı ölçümleri hâlâ dış kanıt gerektiriyor. Supabase bu projede bağlı değil; yönetim panelinin çevrimdışı testleri canlı CRUD başarısı olarak sunulamaz. Mevcut erişim ve verilerle bu sonuçlar uydurulmadı.

Google'ın güncel belgeleri, AI özelliklerinde temel SEO'nun geçerli olduğunu; indekslenme ve gösterimin garanti edilmediğini söylüyor. `llms.txt` Google sıralamasını artıran bir koşul değildir. FAQ zengin sonuçları 7 Mayıs 2026'dan beri gösterilmiyor; bu projedeki FAQ schema semantik uyum içindir.

Birincil kaynaklar:

- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/updates
- https://web.dev/articles/lazy-loading-video

Notion kapsamındaki teknik, erişim gerektiren ve insan incelemesi isteyen maddeler ayrı izlenir. Bu dosya bütün SEO/GEO işletim programına koşulsuz PASS veya arama motorlarında eksiksiz görünürlük iddiası vermez.

## Yayın sonrası kanıt

Son yayın 12 Ekim 2026, 01:00:37 UTC'de başarılı oldu: sürüm **20**, kaynak `d7b9ead91e7cd69e0e5e50e9a8ec0f6e17d537a8`, deployment `appgdep_6acc311f9c04819184b0ea09d7cc6233`. Erişim `public`.

Gerçek anonim HTTP taraması ve hedefli son kontrol birlikte **63/63 içerik sayfası, 28/28 varlık, 0 açık hata ve 0 açık uyarı** sonucunu verdi. Bu sonuç `scripts/check-live-seo.mjs` kapsamıyla sınırlıdır; bütün SEO/GEO programının veya sıralamanın tamamlandığı anlamına gelmez. Altı bot user-agent denemesi ziyaretçiyle aynı HTML'yi aldı; gerçek vendor IP doğrulaması yapılmadı.

- `public-audit/live-after.json`: sayfa, varlık, canonical/OG/schema, yönlendirme ve bot yanıtları; ilk uyarı ve düzeltme geçmişi korunur.
- `public-audit/live-v20-resource-check.json`: son sürümde kurulum GET/HEAD, ana sayfa, robots ve API yanıtlarının gerçek ağ kanıtı.
- `public-audit/discovery-http.json`: 23/23 rehber bağlantısı, UTF-8/MIME, self-canonical, bot çıktı eşliği ve 304 kontrolü PASS.
- `public-audit/installer-route-check.json`: kurulum SQL içeriğinin önceki dosyayla byte düzeyinde aynı kaldığının yerel kanıtı; canlı kontrol de aynı SHA-256'yı doğruladı.

Statik `_headers` denemesi yayımdaki kurulum indirmesine uygulanmadı; sonuç başarısız olarak kaydedildi. Ardından `/admin/kurulum.sql` açık bir sunucu rotasına taşındı, çakışan statik varlık kaldırıldı. Son gerçek GET ve HEAD yanıtları `noindex, nofollow, noarchive`, `no-store`, `nosniff`, doğru MIME ve indirme başlığını taşıyor. Kurulum içeriği değişmedi.

Notion kapsamının madde düzeyindeki son durumu [public-requirements-2026-10-12.md](public-requirements-2026-10-12.md) ve JSON eşinde: **196 GEO + 161 SEO = 357 özgün kontrol**, 20 kaynak snapshot hash'i ve 417 anlatı bölüm başlığı. Teknik olarak test edilmiş maddeler, dış ölçümler, editoryal/işletim kayıtları ve gerçekten uygulanmayan senaryolar ayrı kaydedilir.
