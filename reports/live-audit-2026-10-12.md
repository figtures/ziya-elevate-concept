# Anonim canlı yayın denetimi — 12 Ekim 2026

Denetlenen yayın: https://ziya-sakir-yilmaz-keynote.dev-busraaktas.chatgpt.site/

Bu rapor gerçekten gönderilen anonim HTTP isteklerini kaydeder. İsteklerde oturum çerezi, yetkilendirme başlığı veya erişim atlatma anahtarı kullanılmadı. Kaydedilen başlıklardan `Set-Cookie` çıkarıldı. Tarayıcıyla görsel ölçüm, Lighthouse veya gerçek kullanıcı Core Web Vitals ölçümü yerine geçmez.

## İlk canlı tarama

Kanıt: [live-baseline.json](./public-audit/live-baseline.json). UTC tamamlanma zamanı kanıt dosyasındadır; Türkiye saati UTC+3'tür.

| Kontrol | Gerçek sonuç |
|---|---|
| Anonim içerik sayfaları | 63 / 63 HTTP 200; giriş duvarı yok |
| Türkçe dil, tek H1, tek başlık ve açıklama | 63 / 63 geçti |
| Başlık/açıklama benzersizliği | Yinelenen başlık veya açıklama bulunmadı |
| JSON-LD | 63 / 63 sayfada JSON ayrıştırılabildi |
| Görsel alt özniteliği | Eksik öznitelik bulunmadı; anlam kalitesi için insan incelemesi ayrıdır |
| Yerel CSS, JavaScript ve görsel dosyaları | 27 / 27 HEAD isteği HTTP 200 |
| Arama/asistan user-agent yanıtları | Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot: 6 / 6 HTTP 200 ve normal anonim yanıtla aynı HTML |
| Emekliye ayrılan üç test URL'si | Aktif kafa yapısı testine HTTP 308 |
| Bilinmeyen URL ve `/_global/` | HTTP 404 |
| `/makaleler` | `/makaleler/` adresine HTTP 308 |
| Admin sayfası | HTTP 200; `noindex, nofollow`; `no-store`; CSP |
| Robots ve sitemap | HTTP 200; sitemap 63 içerik URL'si |

User-agent kontrolleri belirli istek başlıklarına sunucunun verdiği cevabı doğrular. İstekler Google/OpenAI/Anthropic IP adreslerinden yapılmadı; bu sonuç tek başına arama motorlarının veya yapay zekâ hizmetlerinin siteyi gerçekten taradığını ya da dizine aldığını kanıtlamaz.

İlk yayında bulunan 66 uyarı: 63 sayfanın canonical URL'si yayının bulunduğu origin yerine `https://ziyasakiryilmaz.com` adresini gösteriyordu; sitemap aynı diğer origin'e işaret ediyordu; iki CMS API yanıtında `X-Robots-Tag: noindex` eksikti. `/llms.txt` ilk yayında 404'tü; bu dosya zorunlu bir Google indeksleme veya AI görünürlüğü şartı olarak değerlendirilmedi.

## İyileştirmelerden sonraki canlı yayın

Denetlenen kaynak sürümü: `ed156f7e492b738ecee972503eb17f3de478e5e4`. Yayın tamamlanması: 12 Ekim 2026, 03:49:36 Türkiye saati. Kanıt: [live-after.json](./public-audit/live-after.json).

- **63 / 63** içerik sayfası anonim HTTP 200 döndürdü. Canonical, OG sayfa URL'si, WebPage URL'si ve bütün yerel schema `@id` değerleri çalışan public origin ile tutarlı.
- Paylaşım görseli dahil **28 / 28** yerel CSS/JavaScript/görsel kaynağı HTTP 200 döndürdü.
- Sitemap'teki 63 URL çalışan origin'e ait. `robots.txt`, `sitemap.xml` ve `llms.txt` HTTP 200.
- Her iki CMS API yanıtı artık `noindex, nofollow, noarchive` içeriyor. Admin sayfasının noindex ve güvenlik başlıkları korundu.
- Altı bot user-agent kontrolü normal anonim ziyaretçiyle yine aynı HTML'i aldı. Hata URL'leri ve dört yönlendirme kontrolü beklenen HTTP durumlarıyla geçti.
- Canlı HTML'de **30 doğrudan cevap, 133 cevap birimi ve 62 kaynak bağlantısı** bulundu. Dokuz notun tamamında görünür yazar bağlantısı ve BlogPosting yazar bilgisi var. İçindekiler bağlantılarında eksik hedef bulunmadı.

İlk doğrulayıcı, dört sayfada geçerli `@type: ["WebPage", "CollectionPage"/"ProfilePage"]` kullanımını tek string olmadığı için yanlış işaretledi. Doğrulayıcı düzeltildi; dört URL'ye yeni anonim HTTP isteğiyle şema URL'si ayrıca doğrulandı. [live-page-types.json](./public-audit/live-page-types.json) ham şema nesnelerini; ana JSON'daki `validatorCorrections` alanı bu düzeltmenin kaydını içerir.

Bu taramada **0 hata, 1 gerçek uyarı** kaldı: `/admin/kurulum.sql` statik yanıtında `X-Robots-Tag` yoktu. Robots dosyası `/admin/` yolunu zaten taramaya kapatıyordu. Statik dosya başlığı için hazırlanan düzeltmenin ayrı yayın sonrası HTTP kontrolü gerekir.

03:55:18 Türkiye saati, `8fc6e79d2e0e44b54ce5e2ca0c59e2c242379a62` sürümü sonrası hedef GET ve HEAD tekrarları yapıldı. Paketteki `_headers` değişikliğine rağmen canlı SQL yanıtı hâlâ `application/octet-stream`, `public, max-age=0, must-revalidate` döndü; noindex, nosniff ve dosya indirme başlıkları gözlenmedi. **Uyarı kapatılmadı.** Aynı kontrolde anasayfa, robots ve iki API yanıtı beklendiği gibi geçti. Kanıt: [live-final-resource-check.json](./public-audit/live-final-resource-check.json). Bu bulgu uygulama kaynak kodunun tek başına gerçek yayın doğrulaması olmadığını gösterir; yalnızca paket içeriğine bakılarak başarılı sonucu yazılmadı.

**Son doğrulama — 04:01:29 Türkiye saati:** `d7b9ead91e7cd69e0e5e50e9a8ec0f6e17d537a8` sürümünde SQL indirmesi doğrudan uygulama rotasına taşındı. Gerçek GET ve HEAD yanıtları HTTP 200, `text/plain; charset=utf-8`, `no-store`, `attachment`, `nosniff` ve `noindex, nofollow, noarchive` başlıklarıyla geçti. Dosya 788.880 bayt; SHA-256 `8e821b6ae6f66f6a54227fb3e33334f8946438add9a21e66b7bb7c80b658a801` önceki içerikle birebir aynı. Anasayfa, robots ve API kontrolleri tekrar geçti; anasayfa HTML özeti önceki taramayla aynı kaldı. Kanıt: [live-v20-resource-check.json](./public-audit/live-v20-resource-check.json).

**Tanımlı anonim HTTP/SEO/AEO kontrol kapsamının son durumu: 0 hata, 0 uyarı.** Bu sonuç, aşağıda açıkça belirtilen çalıştırılamayan Lighthouse ölçümünü, doğrulanmamış Search Console erişimini veya arama/AI hizmetlerinin gerçek sıralama ve alıntılama davranışını kapsamaz. Ana JSON geçmişindeki `issuesAtInitialCompletion` ve `postDeploymentFollowupHistory` alanları eski bulguları korur.

## Canonical alan adı bulgusu

Doğrudan HTTP denemeleri `ziyasakiryilmaz.com` ve `www.ziyasakiryilmaz.com` için bu ortamın çıkış proxy'sinden `502 Connection refused` aldı. Bu, alan adının genel olarak kapalı olduğunu kanıtlamaz. Web okuma servisi `www` adresinin sekiz ay önce taranmış Kajabi “Ücretsiz Girişimcilik Eğitimi” içeriğini döndürdü; mevcut 63 sayfalık keynote yayınını doğrulamadı. Alan adı sahipliği veya DNS yönetim yetkisi bu çalışmada doğrulanmadı. Kanıt: [domain-web-observation.json](./public-audit/domain-web-observation.json).

Canonical, sitemap, yapılandırılmış veri ve paylaşım URL'leri çalışan yayın adresiyle tutarlı olmalıdır. Özel alan adına geçişte önce DNS/yayın doğrulaması, ardından bütün URL sinyallerinin birlikte güncellenmesi ve eski origin'den yönlendirme gerekir.

## Gerçek Lighthouse girişimleri

Google'ın resmî PageSpeed Insights v5 API'sine bu **public** URL için ayrı mobil ve masaüstü analiz istekleri gönderildi. Her iki istekte `PERFORMANCE`, `ACCESSIBILITY`, `BEST_PRACTICES`, `SEO` kategorileri istendi. Gizli anahtar veya başka projeye ait kimlik bilgisi kullanılmadı.

İki istek de **HTTP 429 / RESOURCE_EXHAUSTED / RATE_LIMIT_EXCEEDED** döndü. Google cevabında günlük proje kotası `defaultPerDayPerProject`, kota değeri `0` olarak bildirildi. Hata analiz çalışmadan önce oluştu; geçerli `lighthouseResult` veya herhangi bir skor üretilmedi. API hata yanıtındaki kota projesi kimliği kanıt dosyalarında maskelendi.

Kanıtlar:

- [İstek ve sonuç özeti](./public-audit/lighthouse-attempts.json)
- [Mobil API hata cevabı](./public-audit/pagespeed-mobile-raw.json)
- [Masaüstü API hata cevabı](./public-audit/pagespeed-desktop-raw.json)

Sonuç: Gerçek Lighthouse skoru, LCP, CLS, INP/TBT ve görsel erişilebilirlik sonuçları **ölçülmedi**. HTTP taraması veya kaynak kod testi bu sonuçların yerine yazılmadı. Yeterli PageSpeed API kotası olan proje anahtarı ya da desteklenen tarayıcı çalıştırma ortamı sağlandığında yeniden ölçülmelidir. Bu çalışma sırasında tarayıcı kurulmadı veya alternatif tarayıcı yolu kullanılmadı.

Kullanıcının açabileceği resmî analiz arayüzü: https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fziya-sakir-yilmaz-keynote.dev-busraaktas.chatgpt.site%2F

## Yeniden çalıştırma

```sh
node scripts/check-live-seo.mjs live-after
```

Script bütün içerik rotalarını, temel servis uçlarını, altı user-agent yanıtını ve HTML'de bulunan yerel kaynakların HTTP durumunu denetler. JSON kanıtları `reports/public-audit/` klasörüne yazar. Yeni URL gerekirse `BASE_URL` ortam değişkeniyle verilebilir; kod herhangi bir oturum/kimlik bilgisi kullanmaz.

## Resmî dayanaklar

- [Google PageSpeed API başlangıç](https://developers.google.com/speed/docs/insights/v5/get-started)
- [PageSpeed runPagespeed yöntemi ve kategori parametreleri](https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed)
- [Google canonical URL ve sitemap tutarlılığı](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Googlebot kimliğini doğrulama ve user-agent sınırlaması](https://developers.google.com/search/docs/crawling-indexing/googlebot)

Bu rapor SEO, GEO veya AEO sıralama/alıntılanma garantisi içermez. Google'ın seçtiği canonical, gerçek indekslenme, arama gösterimleri ve yapay zekâ yanıtlarında kaynak gösterilme ayrıca ilgili servisler üzerinden gözlemlenmelidir.
