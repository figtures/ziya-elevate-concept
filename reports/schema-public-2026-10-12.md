# Public SEO / JSON-LD denetimi

12 Ekim 2026 · Ziya Şakir Yılmaz

## Uygulanan değişiklikler

`cms/seo.mjs`, başlık, açıklama, canonical, Open Graph ve JSON-LD'yi son CMS DOM'undan üretir. Görünür içerik silinmez veya şema için yeniden yazılmaz.

| Sayfa / bileşen | Üretilen yapı | Doğruluk sınırı |
|---|---|---|
| Tüm içerik sayfaları | WebSite, Person, WebPage, sayfa yolu | Aynı canonical kökü; çözümlenen `@id` ilişkileri |
| Biyografi | ProfilePage, görünür meslekler ve giriş metni | Kaynaksız eğitim, ödül veya takipçi sayısı eklenmez |
| 30 makale / 9 not | Article / BlogPosting, yayıncı, görünür yazar ve tarihler | Görünür yazar yoksa yazar varsayılmaz; geçersiz tarih yayımlanmaz |
| Makale ve not arşivleri | CollectionPage + ItemList | Son görünür sıralama ve tüm liste grupları; kaldırılan içerik şemada kalmaz |
| Konuşmacı, mentorluk ve üç kurumsal program | Service | Hizmet adı, türü, açıklaması ve iletişim kanalı görünür sayfadan alınır |
| Eğitim kataloğu | Üç Service içeren ItemList | Hedef kitle mevcut kart metninden alınır |
| Kitaplar | Book içeren ItemList | Ortak yazar Emre Topçu dahil; görünür kitap bilgileri ve sıralama korunur |
| Dört kayıtlı konuşma | CreativeWork içeren ItemList | Doğrulanmış yükleme tarihi bulunmadığından VideoObject uygunluğu taklit edilmez |
| Açılabilir soru-cevaplar | FAQPage | Görünür soru ve tam cevaplar; Google zengin sonuç iddiası yoktur |

Bu site bir kişinin yayın ve hizmetlerini temsil ediyor. Belgelenmemiş şirket adresi, Organization/LocalBusiness kimliği, fiyat, değerlendirme, yıldız, etkinlik tarihi veya hizmet bölgesi eklenmedi.

Dokuz özgün notun görünür `rel="author"` bağlantısı da yazar kimliğine bağlanır. AEO katmanının görünür paragraflara eklediği doğrulanmış bibliyografik bağlantılar, son render sırasında `Article.citation` listesine alınır; aynı kaynak yalnız bir kez yer alır.

## Canonical ve medya

Kullanıcının dış erişim izniyle kullanılan public adres, `cms/config.json` içindeki `canonicalOrigin` değeridir. Güvensiz canonical girişleri güvenli public köke düşer. `/assets/` altında eski `ziyasakiryilmaz.com` / `www.ziyasakiryilmaz.com` adreslerine bağlı SEO görselleri seçilen public köke çevrilir; diğer harici görsel servislerinin adresleri değiştirilmez.

Bir görsel panelden değiştirildiğinde eski görselin ölçü, format veya alternatif metin etiketleri taşınmaz. Yalnız aynı görsele ait görünür alternatif metin kullanılabilir. Görsel URL'lerinde protokol bağımsız URL, kullanıcı adı/şifre, JavaScript, data URL, boşluk ve ters eğik çizgi reddedilir.

Public sayfalarda `index, follow, max-image-preview:large` kullanılır. Mevcut bir `robots` politikası varsa korunur; özel `noindex` veya `nofollow` ayarı sessizce değiştirilmez.

## Doğrulama

`node scripts/check-seo.mjs` sonucu: **PASS**.

- 63 ham şablon ve 63 gerçek SSR render'ı.
- Tekil meta etiketleri, canonical, Open Graph ve X/Twitter tutarlılığı.
- Üretilen tipler ve özellikler için yerel sözleşme kontrolü; yinelenmeyen kimlikler, çözümlenmiş referanslar ve ardışık liste sıraları.
- Beş hizmet, üç eğitim programı, kitapların/konuşmaların düzenlenmesi ve sıralaması.
- Görünür yazar değişimi/gizlenmesi, yayıncı ayrımı, hatalı tarihler ve yayından önceye düşen güncelleme tarihi.
- Arşivlerde yeni, kaldırılmış, gizli, yinelenen ve güvensiz bağlantı senaryoları.
- Gerçek `server.render` üzerinden bütün arşiv gruplarında güncel başlık, yeni kayıt, yayından kaldırılan kayıt ve grup içi/gruplar arası çoğaltma. Son DOM ile ItemList sırası bire bir karşılaştırıldı; boş arşiv eski şemayı taşımıyor.
- Gerçek `publishedIndex` fonksiyonu için izole fetch taklidi: 1.203 kayıt, 0/500/1000 sayfa sınırları, tam 500 kayıt ardından boş sayfa, tür filtresi, HTTP 503 ve bozuk gövde. Uzak veritabanına bağlanılmadı.
- Gerçek render'da AEO kaynak bağlantılarının SEO şemasından önce oluşması ve dokuz notun görünür yazarlarının çözümlenmesi.
- JSON-LD kapanış etiketi enjeksiyonu ve güvensiz medya URL'leri.
- Sitemap ve robots canonical kökü.

Bu kontrol bir Rich Results Test sonucu veya Lighthouse ölçümü değildir. Google'ın özel araçlarındaki ve gerçek indeksindeki sonuçlar ayrıca doğrulanmalıdır. Sunucu sırası **içerik → ortak header/footer → arşiv üyeliği → AEO → SEO → HTML** olarak uygulanmış ve yukarıdaki senaryolarda test edilmiştir.

## Güncel birincil kaynaklar

- [Google: yapılandırılmış veri politikası](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): şema görünür ve temsil edici içeriğe dayanmalı; doğru işaretleme görünüm garantisi vermez.
- [Google: Article](https://developers.google.com/search/docs/appearance/structured-data/article): yayıncı ile yazar farklı rollerdir; yazar kimliği bir profil URL'siyle ilişkilendirilebilir.
- [Google: ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page): kişinin kendisini tanıttığı sayfa uygun bir kullanım örneğidir.
- [Google: 2026 değişiklikleri](https://developers.google.com/search/updates): FAQ zengin sonuçları 7 Mayıs 2026 itibarıyla kaldırıldı. FAQPage semantik veri olarak tutulur. llms.txt Google arama görünürlüğü/sıralaması için bir gereklilik veya avantaj değildir.
- [Schema.org Service](https://schema.org/Service), [Book](https://schema.org/Book), [ItemList](https://schema.org/ItemList), [Person](https://schema.org/Person), [WebPage](https://schema.org/WebPage).

Belgeler 12 Ekim 2026 tarihinde kontrol edildi. Yayımlanmış içerik tarihinin editoryal doğruluğu, saha başarısı veya dış platform verisi schema üretiminin kendisiyle kanıtlanmış sayılmaz.
