# Ziya Şakir Yılmaz V13 revize planı ve kontrol listesi

Kaynak: `Ziya_Sakir_Yilmaz_V13_Tasarimci_Nihai_Brief_TEKRAR.docx` · 24 Ekim 2026. Çalışma kaydı: 26 Ekim 2026. Bu dosya briefin tamamını uygulama ve doğrulama adımlarına dönüştürür. Metinler briefteki yeni ifadelerle birebir eşleştirilir; mevcut tasarım ve korunması istenen alanlar ayrı denetlenir.

**Durum anahtarı:** `Doğrulandı` ilgili satırda belirtilen yerel veya canlı kontrol geçti; `Kod doğrulandı` otomatik kontrol geçti, ilgili görsel veya canlı ortam koşulu açık; `Medya doğrulandı` dosyanın süre/kare/kimlik kontrolü geçti, tarayıcı ekran kaydı ayrı; `Kaynak bekliyor` müşteri materyali gerekiyor; `Doğrulanamadı` istenen ortamda kontrol henüz yapılamadı; `Kısmen tamamlandı` alt koşulların tümü kapanmadı. Kod kontrolü gerçek tarayıcı, gerçek cihaz ve canlı veritabanı denetimi yerine geçmez.

## Uygulama sırası

1. Korunan alanların başlangıç durumunu kaydet; sayaçları kilitle.
2. Hero dört sahnenin süresini düzelt.
3. Testimonial yayın koşulunu uygula; eksik gerçek içerikleri gizle.
4. Ana sayfa Kızık, Astana ve Karar paragraflarını değiştir.
5. Satış metinleri ve akışını uygula.
6. KGKY metinleri, sırası ve metadatasını uygula.
7. Liderlik tekrarlarını kaldır; dört pillar bilgi alanlarını ana CTA sonrasına taşı.
8. Başarı Mühendisliği kitap/eğitim ayrımını ve scroll blueprint etkileşimini uygula.
9. Konuşmacı, Eğitimler, Mentorluk ve Hakkında revizelerini uygula.
10. TR/EN, dev/production robots, CMS yönetilebilirliği ve son ekran kontrollerini tamamla.

## Kesin koruma alanları

Başlangıç commit’i: `9b53f284e6e0c64e43fa6555f4ac71e9bac80032`. Sayaçların karşılaştırılacağı imzalar aşağıdadır. Ham HTML ve ilgili JS/CSS parçalarının değişmediği doğrulanır. Ayrıca aynı viewport, aynı font yükleme durumu ve animasyon bitiş anındaki görüntüler karşılaştırılır. Yalnız kod imzası pixel-level eşitliğin yerine geçmez.

| Korunan parça | SHA-256 |
| --- | --- |
| `website/index.html` içindeki `#rakamlarla` bölümünün ham HTML’si | `629022535df89bb0cec5fb67c215b4b70db6ff578717e885dd328cb75b3947e1` |
| `website/assets/main.js` sayaç bloğu | `bbaba2eba7a02b12c4861750257dc3033835c892a3d006efe61e894a14fa4c96` |
| `website/assets/content-depth.css` başlangıç sürümünün 79–167. satırları | `2190631e622befe3d3350ed159d6694d45828db00f8521fbaec238d28d6132e3` |
| `cms/compose.mjs` hero/proof yerleştirme bloğu | `d1cd69521181b19ef20e9cf5dcd1d3800ea87c45bd1345aa8f6089f3ae4f315c` |

Sayaç değerleri: `600.000+ — insana eğitim ve konuşma`; `84 ülke — iş ve sahne deneyimi`; `5× TEDx — sahne konuşması`; `4 kitap — 75.000+ okura ulaşan yazar`; `30 yıl — satış ve liderlik tecrübesi`. Mevcut sayım süresi 1600 ms; V13 bunu değiştirmez.

## Revize matrisi

| ID | Brief | Uygulama veya koruma şartı | Kabul kanıtı | Durum |
| --- | --- | --- | --- | --- |
| K00.1 | 0 | Lacivert / krem renk paleti ve mevcut tasarım dili korunur. | CSS kapsamı ve renk değişkenleri korunuyor. Son canlı home-final.jpg ile önceki home-1440.jpg görsel karşılaştırmasında lacivert/krem palet, tipografi, niyet kartı ve menü dili aynı. Kapsam tamamlayıcı ekran kanıtlarında. | Doğrulandı |
| K00.2 | 0 | Ana sayfanın genel sırası ve dört çalışma kartının yapısı korunur. | Ana sayfa bölüm kimlikleri ve kart DOM sırası karşılaştırması. | Doğrulandı |
| K00.3 | 0 | TEDx, kitaplar, final ve logo şeridi kaldırılmaz. | Oluşturulan HTML’de dört alanın varlığı. | Doğrulandı |
| K00.4 | 0,3 | Beş sayacın rakam, açıklama, animasyon, süre, yerleşim, tipografi, renk ve kodu değişmez. | Dört kaynak SHA-256 ve check-counters geçti. Son canlı görüntüde beş doğru nihai değer, açıklamaları ve ilk ekran görünürlüğü doğrulandı. Başlangıç 9b53f sürümüyle aynı viewport/font/animasyon anında piksel karşılaştırması yapılmadığından bu alt görsel koşul açık. | Kod doğrulandı |
| K01.1 | 1 | Hero dört profesyonel sahne klibinden oluşur; selfie/telefon görüntüsü kullanılmaz. | Kaynak klip listesi ve gözle görüntü denetimi. | Medya doğrulandı |
| K01.2 | 1 | Her sahne 2,5–3 saniye, toplam loop 10–12 saniyedir. | Video süre ölçümü; dört kesim zamanı; ekran kaydı. | Medya doğrulandı |
| K01.3 | 1 | Klipler sert cut ile geçer; hero metni değişmez. | Video geçiş uygulaması ve korunmuş metin karşılaştırması. | Medya doğrulandı |
| K02.1 | 2 | Hero üst etiketi, H1 ve alt cümlesi birebir korunur. | Başarı Mühendisi, Yazar, Eğitmen / Başarının mühendisliği vardır. / Salondan sloganla çıkılmaz; bir modelle ve ilk üç adımla çıkılır. | Doğrulandı |
| K02.2 | 2 | Dört niyet menüsü aynen korunur. | Önce/sonra bağlantı, sıra ve metin eşitliği. | Doğrulandı |
| K04.1 | 4 | Genel ve uydurulmuş testimonial metinleri ziyaretçi görünümünden çıkarılır. | Mevcut taslak cümlelerin ziyaretçi HTML’sinde bulunmaması. | Doğrulandı |
| K04.2 | 4 | Her yayınlanabilir yorum gerçek ve onaylı yorum, ad soyad, unvan, kurum içerir. | Boş quote/name/role/company veya onaysız kayıtları reddeden yayın filtresi. | Doğrulandı |
| K04.3 | 4 | Dört gerçek ve eksiksiz yorum hazır olana kadar testimonial bölümü gizlenir. | 0,1,2,3 uygun kayıtta bölüm yok; 4 uygun kayıtta bölüm var. | Doğrulandı |
| K04.4 | 4 | Yorum kartında yorum, ad soyad, unvan, kurum dört ayrı satırdır; logo şeridi kalır. | SSR/React kart yapısı; referans alanı varlığı. | Doğrulandı |
| K05 | 5 | Kızık paragrafı kerpiç ev, öğretmen baba ve baba sözüyle birebir değiştirilir. | Briefteki tam yeni paragraf eşitliği; eski paragraf yok. | Doğrulandı |
| K06 | 6 | Astana paragrafı tarih, baba sözünün geri dönüşü ve iki sözü içerir. | 12 Ekim 2012; bir milyon insan; babanın adıyla okul; tam metin eşitliği. | Doğrulandı |
| K07 | 7 | Karar paragrafı 16 yıl kurumsal ve 14 yıl girişimcilikle birebir değiştirilir. | 12.12.2012; 16 yıllık; 14 yıllık; tam metin eşitliği. | Doğrulandı |
| K08.1 | 8 | Hangi alanda birlikte çalışalım başlığı, alt cümlesi ve soru satırları korunur. | Önce/sonra textContent ve sıra karşılaştırması. | Doğrulandı |
| K08.2 | 8 | Başarı, Kafa Yapısı, Satış, Liderlik kart metinleri ve sırası korunur. | Şans bekleme. Sistem kur. / Hayat vurur. Sen yine kalkarsın. / Konuşan değil, teşhis koyan satar. / Liderin ürünü başka bir liderdir. | Doğrulandı |
| K09.1 | 9 | TEDx metinleri aynen korunur. | Başarıyı yeniden tanımlayan o an; 5 TEDx konuşması · 4 kayıt yayında. | Doğrulandı |
| K09.2 | 9 | Kitaplar metinleri aynen korunur. | Fikirlerin basılı hali.; 4 KİTAP · 75.000+ OKUR. | Doğrulandı |
| K09.3 | 9 | Final metni aynen korunur. | Sıradaki salon sizinki olsun. | Doğrulandı |
| K10.1 | 10 | Satış H1 yeni büyük harfli tezdir. | KONUŞAN DEĞİL, TEŞHİS KOYAN SATAR. | Doğrulandı |
| K10.2 | 10 | Satış hero alt metni birebir yenilenir. | Doğru sorudan doğru teklife. Satışı müşteriyi anlamakla başlayan bir sistem olarak ele alıyorum. | Doğrulandı |
| K11.1 | 11 | Satış dersinin etiketi ve başlığı yenilenir. | SAHADAN BİR DERS / 440.000 DOLARLIK DERS. | Doğrulandı |
| K11.2 | 11 | 22 üretici, beş yıl yüzde5 sözü, iki yıl yüzde3 sözleşmesi anlatımı birebirdir. | Brief paragraf1 eşitliği; eski Pahalı bir ders metni yok. | Doğrulandı |
| K11.3 | 11 | Dubai distribütörü paragrafı ve büyük kapanış tezi eklenir. | Seni aldatanla ben de çalışmam. dahil tam paragraf2; büyük kapanış tezi. | Doğrulandı |
| K12.1 | 12 | Satış sırası: hero → ders → teşhis → kritik anlar → kurumsal program → CTA → kısa cevap → bilgi alanı. | Oluşturulan bölüm sırası; bilgi içerikleri silinmez. | Doğrulandı |
| K12.2 | 12 | Satış bilgi alanının başlığı ve alt satırı yenilenir. | DAHA DERİNE İN / Satış Bilgi Merkezi · 8 başlık. | Doğrulandı |
| K13.1 | 13 | Liderlik H1 korunur ve aynı H2 tamamen silinir. | Liderin ürünü başka bir liderdir. yalnız bir ana başlıkta. | Doğrulandı |
| K13.2 | 13 | Liderlik H1 ardından briefteki tez paragrafı gelir. | Bir yöneticinin çıktısı sonuçtur. ile başlayan tam paragraf eşitliği. | Doğrulandı |
| K14.1 | 14 | Liderlik: hero → tez → Lider Çoğaltma Döngüsü → 12.12.2012 → eğitim/mentorluk CTA → kısa cevap → bilgi alanı. | Bölüm sırası ve CTA öncesinde SEO kutusu olmaması. | Doğrulandı |
| K14.2 | 14 | Liderlik bilgi alanı başlığı yenilenir. | DAHA DERİNE İN / Liderlik Bilgi Merkezi · 8 başlık. | Doğrulandı |
| K15 | 15 | Başarı beş aşamanın eğitim modeli olduğunu ve kitabın bölüm yapısı olmadığını açıklar. | Briefteki tam iki cümle eşitliği. | Doğrulandı |
| K16.1 | 16 | Başarı: hero → İstek bir başlangıç. Sistem devamıdır. → beş aşama → keynote/eğitim → CTA → kısa cevap → bilgi alanı. | Bölüm sırası. | Doğrulandı |
| K16.2 | 16 | Başarı bilgi alanı başlığı yenilenir. | DAHA DERİNE İN / Başarı Bilgi Merkezi · 8 başlık. | Doğrulandı |
| K17.1 | 17 | Kafa Yapısı: hero → sakinlik tezi → tanım → KGKY yönlendirmesi → test CTA → kısa cevap → ölçüm boyutları → bilgi alanı. | Bölüm sırası; beş test boyutu test CTA’sından sonra. | Doğrulandı |
| K17.2 | 17 | Kafa Yapısı bilgi alanı başlığı yenilenir. | DAHA DERİNE İN / Kafa Yapısı Bilgi Merkezi · 8 başlık. | Doğrulandı |
| K18 | 18 | KGKY hero alt cümlesi yenilenir; yeni bir sen kaldırılır. | Kökü derin, gövdesi esnek, fırtınada eğilen ama kırılmayan bir kafa yapısı. | Doğrulandı |
| K19 | 19 | KGKY Sabotajcı/misafir paragrafı birebir kullanılır. | Yıllardır ev sahibi sandığın o ses… Ev sensin. Anahtar sende. Kapı açık. tam paragraf eşitliği. | Doğrulandı |
| K20.1 | 20 | HENÜZ alt cümlesi yenilenir. | Bitmedin. Sadece tamamlanmadın. | Doğrulandı |
| K20.2 | 20 | RAĞMEN alt cümlesi yenilenir. | Korkunun geçmesini bekleme. Korkuyla birlikte yürü. | Doğrulandı |
| K20.3 | 20 | MÜMKÜN alt cümlesi yenilenir. | O kapı açık. Ve sen geçebilirsin. | Doğrulandı |
| K20.4 | 20 | Üçlü kapanış açıklaması ve büyük final cümlesi birebirdir. | HENÜZ ihtimali açık tutar… ve HENÜZ olmadığım kişiye, korkuma RAĞMEN yürüyebilirim; çünkü ben MÜMKÜN’üm. | Doğrulandı |
| K21.1 | 21 | 6 Ayna başlığı yenilenir. | KENDİNE BAKMADAN KENDİNİ DEĞİŞTİREMEZSİN. | Doğrulandı |
| K21.2 | 21 | Altı ayna doğru numara ve sıradadır. | 01 ÖZ DEĞER; 02 ÖZ YETERLİLİK; 03 ÖZ GÜVEN; 04 ÖZ SAYGI; 05 ÖZ ŞEFKAT; 06 ÖZ SEVGİ. | Doğrulandı |
| K22 | 22 | 90 saniye bölümünde iki satır birebirdir. | Duygunun kimyasal dalgası yaklaşık 90 saniyede söner; sonrası senin seçimin. / Dur. Gör. Sonra seç. | Doğrulandı |
| K23 | 23 | KGKY meta description tam yeni metindir. | Kurşun Geçirmez Kafa Yapısı™: Sabotajcı, HENÜZ–RAĞMEN–MÜMKÜN, 6 Ayna, 90 saniye, HAYIR ve 66 günlük uygulama yaklaşımını keşfedin. | Doğrulandı |
| K24 | 24 | KGKY: hero → Sabotajcı → üçlü → 6 Ayna →90 saniye →HAYIR →66 gün →test CTA →kısa cevap →FAQ. | Bölüm sırası korunuyor. Canlı .v13-direct-answer: 375px 5817,908/7775=%74,828; 1440px 5470,816/6490=%84,296. İlk %60 sonrası doğrulandı; kanıt docs/qa/v13-completion/kgky-answer-geometry.json. | Doğrulandı |
| K25.1 | 25 | Başarı Mühendisliği hero ve Bir hedef, nasıl çalışan bir sisteme dönüşür? girişi korunur. | H1 ve giriş başlığı; yeni sıra. | Doğrulandı |
| K25.2 | 25 | KİTAPTAKİ İLKELER alanında beş başlık vardır. | Ben Yasası / Sitem-Sistem / Başarı Ceketinin Üç Düğmesi / Kadar-Keder / Üç Filtre. | Doğrulandı |
| K25.3 | 25 | EĞİTİM SALONUNDAKİ UYGULAMA MODELİ kitap ilkelerinden sonra gelir. | Keşif / Tasarım / İnşa / Test / Bakım sırası. | Doğrulandı |
| K25.4 | 25 | Kitap + eğitim CTA’sı kısa cevap/SEO içeriğinden önce gelir. | Bölüm sırası. | Doğrulandı |
| K26.1 | 26 | Desktop blueprint scroll ilerlemesine bağlı beş aşamayı gösterir. | Canlı Chrome 1440px: scrollY=0 için progress=0; Y=1400 için 0,450669946 (2 complete, 1 active, 2 pending); Y=1770 için progress=1 ve beş aşama complete. Ekran görüntüsü kayıtlı. | Doğrulandı |
| K26.2 | 26 | Scroll durunca blueprint durur; loop yoktur. | Canlı Chrome: scrollY=1400 sabitken yaklaşık 30 saniye boyunca progress=0,4506699462748398 değişmedi; zaman tabanlı loop gözlenmedi. | Doğrulandı |
| K26.3 | 26 | Mobilde beş aşama normal akışta hafif reveal olur. | 375px canlı Chrome: mode=mobile, beş aşama complete, konum relative; sticky/pinned yok. Ekran görüntüsünde beş aşama okunabilir, yatay taşma yok. İlk reveal geçişi yakalanmadığından hareket kabulü açık. | Kod doğrulandı |
| K26.4 | 26 | Reduced-motion tamamlanmış statik şema gösterir. | Hareket azaltma açıkken beş aşamanın tamamı görünür ve animasyon yok. | Kod doğrulandı |
| K27 | 27 | Konuşmacı deneyim paragrafı birebirdir; 13 yıl kalmaz. | 16 yıl, Bayer Country Manager8 yıl,84ülke,90+ülke,14yıl,70.000,600.000,5TEDx,dörtkitap tam metin. | Doğrulandı |
| K28.1 | 28,40 | Gerçek 75–90 saniyelik çok sahneli showreel yoksa bölüm yayınlanmaz. | Dosya süresi ve gerçek içerik incelemesi; yoksa ziyaretçi HTML’sinde bölüm yok. | Doğrulandı |
| K28.2 | 28 | Hazır reel varsa belirtilen başlık ve buton kullanılır. | 90 SANİYEDE ZİYA ŞAKİR YILMAZ / SHOWREEL’İ İZLE ▶. | Kaynak bekliyor |
| K28.3 | 28 | Hazır reel kullanıcı tıklamasıyla tek adımda sesli oynar; otomatik ses yoktur. | Click playback ve autoplay/ses politikası. | Kaynak bekliyor |
| K29.1 | 29 | Header’ın sağında TR \| EN sabit ve küçük görünür. | Canlı Chrome 1440×900, 1920×1080 ve 1366×768: header TR / EN görünür. | Doğrulandı |
| K29.2 | 29 | Mobilde TR \| EN erişimi görünürdür. | Canlı Chrome 375×812 ve 430×932: header TR / EN görünür. Gerçek Android Chrome kontrolü açık. | Kısmen tamamlandı |
| K29.3 | 29 | TR Türkçe siteye, EN doğrudan /en/speaker/ adresine gider. | İki bağlantının href’i; İngilizce sayfada Türkçe dönüş bağlantısı. | Doğrulandı |
| K30.1 | 30 | Üç eğitim programında aynı bilgi sırası kullanılır. | KİMİN İÇİN → HANGİ PROBLEM → FORMAT → SÜRE → GRUP BÜYÜKLÜĞÜ → ÇIKTI → ÖN ÇALIŞMA → SONRASI. | Doğrulandı |
| K30.2 | 30 | Bilgisi olmayan satır ve placeholder gösterilmez. | Yakında/belirlenecek/boş bilgi satırı yok; mevcut bilgiler korunur. | Doğrulandı |
| K31.1 | 31 | Mentorluk sınırlı kontenjan cümlesi yalnız bir kez kalır. | Tam iki cümleli kontenjan metninin sayımı1. | Doğrulandı |
| K31.2 | 31 | Kontenjan cümlesinin hemen altında ritim açıklaması bulunur. | Çalışma süresi ve görüşme ritmi, ilk görüşmede hedefe göre birlikte belirlenir. | Doğrulandı |
| K32 | 32 | Hakkında 13 yıl ifadesi14yıllık girişimcilik metniyle değiştirilir. | 14 yıllık girişimcilik yolculuğunda 70.000 kişiye ulaşan bir ekip. | Doğrulandı |
| K33 | 33 | Hakkında misyon cümlesi birebir yenilenir. | Pusulam tek cümle: bir milyon insanın kalbine dokunmak. | Doğrulandı |
| K34.1 | 34 | Hakkında ana hikâyede dijital etki/Favikon sıralamaları yoktur. | Sıralama kutusunun Hakkında ziyaretçi HTML’sinden çıkarılması. | Doğrulandı |
| K34.2 | 34 | Dijital etki mevcut Basın/Medya Kiti alanına taşınır. | DİJİTAL ETKİ · TARİHLİ VERİLER başlığı; tarihli mevcutverilerin korunması. | Doğrulandı |
| K35 | 35 | Yalnız resmî belgede doğrulanan kurum ve program adı yayınlanır. | Web içeriğine ek olarak iki konuşmacı PDF kopyasındaki desteklenmeyen eğitim iddiaları kaldırıldı; 8 sayfa, 744.890 bayt ve aynı SHA-256 doğrulandı. Yerel görsel QA ve 23 müşteri kabul kontrolü geçti. Canlı PDF HTTP 200, 744.890 bayt ve aynı SHA-256 ile doğrulandı. Resmî kurum/program kaynağı hâlâ bekleniyor. | Kaynak bekliyor |
| K36.1 | 36 | Workers/dev head noindex,nofollow içerir. | Canlı worker’da HTTP X-Robots-Tag ve head meta noindex,nofollow; 15 rota HTTP kontrolü geçti. | Doğrulandı |
| K36.2 | 36 | Production ziyasakiryilmaz.com indekslenebilir kalır. | Yerel production-host handler testi geçti. Son DNS-over-HTTPS kontrolleri SERVFAIL ve erişilebilir yetkili DNS bulunamadığını gösterdi; alan adı erişilebilen Cloudflare hesabındaki 10 zone içinde yok. Doğru domain yönetim hesabına erişim gerekiyor; gerçek host indekslenebilirliği doğrulanmadı. | Kod doğrulandı |
| K37.1 | 37 | Dört pilların hepsinde tez/hikâye/model ve ana CTA SEO bloklarından önce gelir. | Başarı/KafaYapısı/Satış/Liderlik DOMsırası. | Doğrulandı |
| K37.2 | 37 | Dört pillarda kısa cevap →DAHA DERİNE İN→FAQ sırası uygulanır. | 8başlık korunur; Bu alandaki sekiz başlık kaldırılır. | Doğrulandı |
| K37.3 | 37 | Kısa cevap ve8başlık ilk%60’ta görünmez. | Canlı b033500 sürümü: Kafa Yapısı 375/430/1366/1440/1920px kısa cevap %65,665/%66,915/%70,790/%71,217/%72,129; sekiz başlık %72,923/%73,834/%81,198/%81,557/%82,159. Başarı/Satış/Liderlik 375 ve 1440px’de her iki alan %60 sonrası; yatay taşma yok. Ham kanıt docs/qa/v13-completion/geometry.json. | Doğrulandı |
| K38.1 | 38 | Her alt sayfa ilk ana içerik olarak kendi H1/hero alanıyla açılır. | Tüm alt sayfalarda H1 öncesi SEO kutusu/uzun açıklama/tekrarmanifesto yok. | Doğrulandı |
| K38.2 | 38 | Her alan fark, güven veya birlikte çalışma gerekçesine hizmet eder. | 11 temel rota kaynak HTML editoryal incelemesi: hero/tez/model farklılaşma; sayaç/referans/TEDx/kitap/hikâye güven; program/uygunluk/CTA birlikte çalışma gerekçesi sağlar. Amaçsız bölüm saptanmadı. Kapsam ve örnekler tamamlayıcı kanıt dosyasında. | Doğrulandı |
| K39.1 | 39 | 1440px desktop son QA yapılır. | Canlı Chrome 1440×900 ana sayfa: scrollWidth=1440; beş sayaç ilk ekranda, proof altı 836; dil seçici görünür. Public smoke kapsamı. | Doğrulandı |
| K39.2 | 39 | 1920px desktop son QA yapılır. | Canlı Chrome 1920×1080 ana sayfa: scrollWidth=1920; beş sayaç ilk ekranda, proof altı 1016; dil seçici ve uzun paragraflar kontrol edildi. | Doğrulandı |
| K39.3 | 39 | 1366px laptop son QA yapılır. | Canlı Chrome 1366×768 ana sayfa: scrollWidth=1366; beş sayaç ilk ekranda, proof altı 704; dil seçici ve uzun paragraflar kontrol edildi. | Doğrulandı |
| K39.4 | 39 | 375px iPhone Safari son QA yapılır. | 375×812 Chrome viewport geçti; gerçek iPhone Safari erişimi/kabulü yapılmadı. | Doğrulanamadı |
| K39.5 | 39 | 430px iPhone Safari son QA yapılır. | 430×932 Chrome viewport geçti; gerçek iPhone Safari erişimi/kabulü yapılmadı. | Doğrulanamadı |
| K39.6 | 39 | Android Chrome son QA yapılır. | 375/430 Chrome viewport Android cihaz testi değildir; gerçek Android Chrome kontrolü açık. | Doğrulanamadı |
| K39.7 | 39 | Kızık/Astana uzun paragrafları taşmaz. | 375/430/1366/1440/1920 Chrome: Kızık/Astana paragraflarında client ve scroll ölçüleri eşit. 1440px için iki paragrafın her biri 660px; kesilme veya taşma yok. | Doğrulandı |
| K39.8 | 39 | 440.000 başlığı mobilde dengeli ve kesilmeden görünür. | 375/430 Chrome: 440.000 başlığında client ve scroll ölçüleri eşit; 375 ekran görüntüsünde kesilme yok. | Doğrulandı |
| K39.9 | 39 | KGKY üçlü büyük harfleri mobilde kesilmez. | 375/430 Chrome: HENÜZ/RAĞMEN/MÜMKÜN client ve scroll ölçüleri eşit; 430 ekran görüntüsünde okunaklı. | Doğrulandı |
| K40 | 40 | Briefteki24teslimkutucuğunun tamamı ayrı kanıtla kapatılır. | Aşağıdaki teslimözeti; eksikvarsaTamamlandıdenmez. | Kısmen tamamlandı |
| K41 | 41 | 5sn/30sn/60sn/2dk/çıkışta ölçek/fark/sistem/yaşanmışlık/işbirliği mesajları okunur. | 11 temel rotada ölçek=sayaçlar, fark=tez/dört vaat, sistem=Başarı Mühendisliği/KGKY, yaşanmışlık=Kızık/Astana/satış dersi, işbirliği=dört niyet/final CTA eşlemesi doğrulandı. Bu yapısal editoryal okumadır; zamanlanmış 5/30/60sn/2dk senaryo kabulü henüz yoktur. | Kısmen tamamlandı |

## Dış materyal ve doğrulama bağımlılıkları

- **Gerçek yorumlar:** Yayın için en az dört gerçek/onaylı yorum ve her birinin ad soyad, unvan, kurum bilgisi gerekir. Briefin kabul ettiği geçici sonuç, bölümün gizli kalması ve logo şeridinin korunmasıdır.
- **Showreel:** 75–90 saniyelik uygun video, eksiksiz görüntü/ses kaynağı ve kullanım hakkı doğrulanamadığında bölüm yayınlanmaz. Briefin teslim checklist’i bu durumu açıkça kabul eder.
- **Eğitim belgesi:** Resmî kurum/program adı kaynak belgede görülmeden MBA veya başka bir program adı tamamlandı diye işaretlenmez. Doğrulanmamış iddiaların kaldırılması ayrı bir uygulama; doğru adın yayınlanması ayrı kaynak koşuludur.
- **Gerçek tarayıcılar:** iPhone Safari ve Android Chrome koşulları yalnız DOM testleriyle kapatılamaz. Erişilemeyen tarayıcı/device kontrolleri açıkça Doğrulanamadı kalır.

## Doğrulama kaydı · 26 Ekim 2026

90 atomik maddenin durumu: **74 Doğrulandı**, **4 Kod doğrulandı**, **3 Medya doğrulandı**, **3 Kaynak bekliyor**, **3 Doğrulanamadı**, **3 Kısmen tamamlandı**. Brief §40’ın 24 teslim kutucuğundan 23’ü belirtilen yerel/canlı kanıtla işaretli; 1’i özel production alan adının gerçek host kontrolünü bekliyor. Test sayısı ile tamamlanmış revize sayısı birbirinin yerine kullanılmaz.

| Kontrol | Sonuç ve kapsam |
| --- | --- |
| `node scripts/check-v13-revisions.mjs` | 23 kabul grubu geçti. Yeni V13 metinleri, bölüm sıraları, korunan ana sayfa alanları, CMS katalog/template/seed tutarlılığı, gerçek compose çıktısı, yeni alanların düzenlenebilirliği, migration sonrası içerik ve blueprint scroll davranışı denetlendi. |
| `node scripts/check-customer-revisions.mjs` | V13 briefine güncellenmiş müşteri kabul kontrollerinin 23/23’ü geçti. Önceki briefle çelişen eski metin beklentileri güncellendi; açık materyal, canlı form/CMS ve cihaz koşulları ayrıca raporlanır. |
| `node scripts/check-experience-controls.mjs` | 12/12 kontrol geçti: 11 saniyelik hero yapılandırması, playlist sırası/ekleme/silme/kadraj, medya seçimi, form hedefleri, yönetilebilir test metinleri, read-only editör ve güvenli URL doğrulaması. |
| `node scripts/check-counters.mjs` | Beş sayaç, sayım davranışı, erişilebilir değerler, suffix’ler, CMS değişiklikleri ve reduced-motion senaryoları geçti. Dört başlangıç SHA-256 imzası ayrıca birebir aynı. |
| `node scripts/check-v13-technical.mjs` | 16 kontrol geçti: dört eksiksiz/onaylı yorum eşiği, eski üretilmiş metinlerin engellenmesi, SSR/React ayrı unvan/kurum satırları, admin onay UX’i, TR/EN ve geliştirme/production host robots ayrımı. Test yerel sahte ağ yanıtları kullanır. |
| `node scripts/check-v13-migration.mjs` | 14 kontrol geçti: legacy menü alan/sıra/gizlilik koruması, değişmez girdiler, sayaç ve diğer editör değişiklikleri, taşınan alanlar, tekrar grupları, gizlilik/sıra, sonraki düzenlemeler, özel menü/playlist ve gerçek yorumların korunması; eski kayıtların yeni seed ile eşdeğer render edilmesi. |
| `node scripts/check-v13-content-language.mjs` | Dört onaylı Bilgi Merkezi başlığının sekiz tam varyasyonu kabul; 15 yakın veya uydurma başlık reddi. Diğer “merkez/merkezi” kullanımları açılmaz. |
| `node scripts/check-hero-sequence.mjs` | İlk açılış, playlist dönüşümü, kaynak tembelleştirme, pause/resume, menü/dialog/sekme, reduced-motion ve video hata senaryoları geçti. Bu bir tarayıcı ekran kaydı değildir. |
| `ffprobe` · iki yeni hero dosyası | Her dosya 11,000 saniye, 264 kare, 24 fps, tek video kanalı; ses kanalı yok. 1080 teslim 1920×1080, mobil teslim 1280×720. |

Hero dört planın her birini 2,75 saniye gösterir. Kaynak temiz planlar yalnız 0,542–0,875 saniyedir; bu nedenle gerçek kareler yavaşlatılmıştır. 1080 boyutu 720p kaynaktan ölçeklenir. Doğal hızda dört uzun çekim veya gerçek 8K kaynak üretildiği iddia edilmez. Ayrıntı: `docs/v13-hero-evidence.md` ve `scripts/v13-hero-manifest.json`.

Müşteri kabul ve experience kontrolleri güncel V13 içeriğine uyumlu olarak yeniden çalıştırıldı; bu iki testte önceki brief beklentisinden kalan hata yoktur.

Ek doğrulamalar: `check-admin-workflows.mjs` 56/56; `check-v13-press-publication.mjs` 8/8; `npm run typecheck` geçti. PostgreSQL üzerinde üç migration’ın tam doğrulayıcı zinciri, yeni Basın kaydı, tekrar çalıştırma, yayından kaldırılmış/arşivlenmiş/mevcut kayıtları koruma denetlendi. SQL güvenlik paketinde 255, Edge Function stublarında 37 kontrol geçti. TypeScript kontrolü web/Cloudflare uygulamasını kapsar; ayrı Deno runtime’ındaki Edge Function’lar bu TypeScript projesine dahil değildir. Bunlar canlı veritabanı testi değildir. SEO testinde 65 ham ve 65 SSR sayfası; responsive medya testinde 66 belge geçti. JSON-LD/hreflang tekrar işleme sırası da düzeltildi.

## Tamamlama turu: admin, form ve PDF

Tamamlama commit’i: `b03350096eb8ebb74375a4b51686e904cd4e065b`. Cloudflare CI/CD 27 Ekim 2026 00:02:51 TSİ’de başarılı tamamlandı. Canlı Kafa Yapısı geometrisi ve yeni PDF’nin birebir dosya eşitliği doğrulandı; ayrıntılı kanıt `docs/v13-completion-evidence-2026-10-26.md` içindedir.

- **Canlı admin kabulü tamamlandı:** Sahip oturumuyla kontrollü, yayımlanmayan taslak iki sürüm olarak kaydedildi; tam yenileme ve yeniden açma metinleri korudu; önizleme ikinci metni gösterdi; iki `save` geçmiş kaydı görüldü. Taslak arşivlendi, anonim rota 404 kaldı, yayın sayısı 66 değişmedi.
- **Yeni Kafa Yapısı CMS alanları doğrulandı:** Başlangıç sürüm 2’de 03 · Sistemin zirvesi bölümünün Astana paragrafı, iki bağlantı, kitap görseli/alt metni/kadrajı ve üç kelime maddesi görüldü. İçerik değiştirilmeden taslak kaydı sürüm 3 oluşturdu; tam yenileme ve yeniden açma bütün alanları korudu. Yayınla kullanılmadı; “Yayında · yeni taslak” durumu korundu. Ham DB migration işareti ayrıca sorgulanmadı. Canlı kısa cevap ve sekiz konu açıldığında tam metinler görünür; 375px kitap görseli yüklendi ve taşma yok.

- **Canlı form ve CRM kabulü tamamlandı:** Form “Talebiniz alındı” sonucu verdi; test talebi admin panelinde bulundu; İstenmeyen durumuna alınan kayıt tam yenileme sonrasında aynı durumda kaldı. E-posta/WhatsApp mesajı gönderilmedi.
- **PDF düzeltmesi ve canlı eşitliği tamamlandı:** İki konuşmacı dosyası aynı 8 sayfalık, 744.890 baytlık sürümdür; desteklenmeyen eğitim iddiaları kaldırıldı. Canlı HTTP 200, birebir SHA-256, 23 müşteri kontrolü ve görsel QA kanıtları tamamlayıcı rapordadır. Resmî eğitim belgesi bekleyen K35 kapatılmaz.

Admin/form kabulü, 90 maddelik matriste ayrı bir atomik ID olarak yer almıyordu; açık operasyonel koşullar olarak kapatıldı. Bu nedenle sırf bu iki kabul sonucu matrisin sayımlarını değiştirmez. Kanıt: `docs/v13-completion-evidence-2026-10-26.md`.

## Brief §40 · 24 teslim kutucuğunun eşlemesi

İşaretli kutular, belirtilen yerel kaynak/medya/render ve canlı HTTP/Chrome kanıtını gösterir. Chrome viewport kontrolü gerçek Safari/Android cihaz kabulü olarak okunmamalıdır.

- [x] Sayaç bölümüne hiçbir müdahale yapılmadı — K00.4, dört SHA-256.
- [x] Hero loop 10–12 saniye — K01.2, iki dosyada `ffprobe` 11,000 saniye.
- [x] Genel testimonial’lar kaldırıldı; gerçek yorumlarda unvan + kurum var veya bölüm gizli — K04.1–K04.4, bölüm gizli.
- [x] Kızık bölümünde baba cümlesi birebir var — K05.
- [x] Astana bölümünde 12 Ekim 2012 + iki söz birebir var — K06.
- [x] Karar bölümünde 16 yıl kurumsal + 14 yıl girişimcilik var — K07.
- [x] Satış H1 “KONUŞAN DEĞİL, TEŞHİS KOYAN SATAR.” — K10.1.
- [x] Satışta “440.000 DOLARLIK DERS” var — K11.1.
- [x] Satışta “Seni aldatanla ben de çalışmam.” var — K11.3.
- [x] Liderlik H1 tekrar etmiyor — K13.1.
- [x] KGKY hero alt cümlesi yeni metin — K18.
- [x] KGKY HENÜZ / RAĞMEN / MÜMKÜN yeni kaynak metin — K20.1–K20.4.
- [x] KGKY 6 Ayna tam sıra — K21.2.
- [x] KGKY 90 saniye metni yeni hali — K22.
- [x] KGKY meta description güncel — K23.
- [x] 30 Saniyede Cevap blokları pillar sayfalarında aşağı taşındı — K37.1, DOM sırası.
- [x] 8 başlık listeleri “DAHA DERİNE İN” alanına taşındı — K37.2, sekiz başlık korunur.
- [x] Konuşmacı sayfasında 13 yıl yok; 14 yıl var — K27.
- [x] Showreel 75–90 saniye veya bölüm hazır değilse yayınlanmıyor — K28.1, bölüm gizli.
- [x] Header’da TR | EN var — K29.1–K29.3; üç desktop ve iki mobil Chrome viewport’unda görünür, href’ler doğru. Gerçek Android koşulu K29.2’de açık.
- [x] Mentorluk tekrar cümlesi silindi — K31.1.
- [x] Hakkında sayfasında Favikon sıralamaları ana hikâyede yok — K34.1.
- [x] Dev domain noindex,nofollow — K36.1; canlı worker HTTP header ve HTML meta ile doğrulandı.
- [ ] Production domain indexlenebilir — K36.2; yerel handler geçti, özel alan adının V13 çıktısı bu ortamdan doğrulanamadı.

## Canlı yayın ve doğrulama kaydı

26 Ekim 2026’da kullanıcı tarafından açılan doğru Supabase projesi `hzmrvyjolrqdsrppajqs` üzerinde üç V13 migration uygulandı ve migration geçmişindeki üç kayıt doğrulandı:

1. `20261026174158_v13_approved_knowledge_labels.sql`
2. `20261026174711_v13_press_template_registration.sql`
3. `20261026174847_v13_initial_press_publication.sql`

Son validator `prosrc` MD5 değeri `0bd13a5949f306cedaaf90965360119c`. Önceden bulunan 65 belgenin taslak ve yayın içerik hash’leri aynı kaldı. Yeni toplamlar 66 belge, 66 yayın kaydı ve 210 sürüm kaydı; Basın sayfasının revision değeri 1. Kontrol edilen tablolarda RLS açık; yeni özel yardımcı fonksiyona anon/authenticated erişimi yok. Bu canlı veritabanı kontrolleri, oturum açılmış uygulamada kaydet–yeniden aç akışının yapıldığı anlamına gelmez.

[PR #1](https://github.com/figtures/ziya-elevate-concept/pull/1) ana dala birleştirildi. Yayın commit’i `98aefcc324c8390446e231137c56a421cb7f428b`; Cloudflare production build `0f7fc25c-c49b-4037-af5d-75691b375e16` başarılı; Worker version `3a9a18da-c4e0-4e21-9773-168ff6e4526c`.

Canlı adres: https://ziya-sakir-yilmaz.busratechnology.workers.dev/ . Dağıtım sonrası anonim HTTP/SSR kontrolünde **15 rota üzerinde 101 koşul geçti, 0 hata**. `/basin/` HTTP 200, sitemap 65 public URL, yeni hero dosyaları, pillar metinleri, KGKY metadata, footer ve TR/EN bağlantıları doğrulandı. Ayrıntı: `docs/v13-production-smoke-2026-10-26.md`.

### Canlı Chrome ekran kontrolleri

| Viewport | Yatay taşma | Sayaçlar ilk ekran | Sayaç alanı alt koordinatı | Dil seçici |
| --- | --- | --- | --- | --- |
| 1440×900 | Yok; scrollWidth=1440 | Beş sayaç görünür | 836px | TR / EN görünür |
| 1920×1080 | Yok; scrollWidth=1920 | Beş sayaç görünür | 1016px | TR / EN görünür |
| 1366×768 | Yok; scrollWidth=1366 | Beş sayaç görünür | 704px | TR / EN görünür |
| 375×812 | Yok; scrollWidth=375 | Beş sayaç görünür | 768,375px | TR / EN görünür |
| 430×932 | Yok; scrollWidth=430 | Beş sayaç görünür | 895,094px | TR / EN görünür |

375/430/1366/1440/1920 genişliklerinde Kızık ve Astana paragraflarının client/scroll ölçüleri eşittir; 1440px için her iki paragrafta da 660px ölçülmüştür. Satış başlığı 375/430px’de kesilmiyor; 375px ekran görüntüsü incelendi. KGKY üç büyük sözcük 375/430px’de ölçümden geçti; 430px ekran görüntüsünde okunaklı. Blueprint mobil 375px’de normal relative akışta ve beş aşaması DOM’da tamamlanmış; son ekran görüntüsünde beş aşama okunabilir ve yatay taşma yok. İlk hafif reveal geçişinin mobil görsel kabulü ayrıca açık. Desktop 1440px’de scrollY=0 için progress=0, Y=1400 için progress=0,450669946 (iki complete, bir active, iki pending), Y=1770 için progress=1 ve beş complete. Y=1400 sabitken yaklaşık 30 saniye boyunca ilerleme değeri değişmedi.

Son tamamlama turunun [ana sayfa](qa/v13-completion/home-final.jpg), [Kafa Yapısı masaüstü](qa/v13-completion/mindset-desktop-final.jpg), [Kafa Yapısı 375px](qa/v13-completion/mindset-mobile-375.jpg) ve [blueprint 375px](qa/v13-completion/blueprint-mobile-375.jpg) görüntüleri ayrıca kayıtlıdır. Ana sayfada beş nihai sayaç değeri ve dört niyet menüsü görünür; lacivert/krem tasarım dili önceki görüntüyle gözle eşleştirildi. Eş koşullu başlangıç piksel testi olarak sunulmaz.

Sekiz canlı ekran görüntüsü `docs/qa/v13/` altında kayıtlıdır: `home-1920.jpg`, `home-1440.jpg`, `home-1366.jpg`, `home-375.jpg`, `home-430.jpg`, `sales-375.jpg`, `kgky-430.jpg`, `blueprint-1440.jpg`. Ana sayfanın 375px ve 1920px görüntülerinde sayaçların nihai değerleri yakalandı; diğer ekranlarda mevcut 1600ms sayım animasyonu sürmekteydi. Bu, başlangıç sürümüyle piksel karşılaştırması değildir. Basın sayfasının yeni kaydı tarayıcı DOM’unda da doğrulandı; bu oturumda alınan konsol hata kaydı boştu.

Önceki 98aefcc sürümünde Kafa Yapısı kısa cevabı 1440px’de %54,53 ve 375px’de %42,32 konumundaydı. **Bu başarısız ölçümler b033500 düzeltmesinin ardından geçersiz kaldı.** Yeni canlı sürümde Kafa Yapısı kısa cevabı beş genişlikte %65,665–%72,129, sekiz başlık alanı %72,923–%82,159 aralığında. Başarı, Satış ve Liderlikte 375/1440px ölçümleri de iki alan için %60 üzerindedir. K37.3 kapatıldı; ham sonuçlar `docs/qa/v13-completion/geometry.json` dosyasındadır. KGKY’nin doğrudan kısa cevap öğesi ayrıca 375px’de %74,828 ve 1440px’de %84,296 ölçüldü; K24 de kapatıldı. Bu değerler sonraki açılır başlığın konumundan ayrı ölçümdür.

## Teslim özeti ve açık koşullar

V13 kodu ve gerekli üç veritabanı güncellemesi worker production ortamında yayındadır. Yerel önizlemenin önceki erişim sorunu canlı HTTP ve Chrome kontrolleriyle aşılmıştır. Tamamlanan maddeler yukarıda kapsamlarıyla işaretlidir; bütün 90 madde kapatılmış sayılmaz.

- Dört gerçek/onaylı yorum bulunmadığından yorum bölümü gizlidir; logo şeridi korunur. Gerçek kayıtlar admin panelinde hazırlanıp onaylanınca eşik sağlandığında yayınlanabilir.
- Uygun 75–90 saniyelik sesli showreel kaynağı olmadığı için bölüm gizlidir. Başlık ve click-to-play koşulları kaynak gelene kadar açık kalır.
- Resmî eğitim kaydı sağlanmadığı için doğrulanmamış ODTÜ/MBA ve alumniOf iddiaları kaldırılmıştır. Doğru kurum/program adı kaynak bekler.
- Gerçek iPhone Safari/Android Chrome ve başlangıç sürümüyle piksel karşılaştırması yapılmadı. Chrome viewport sonuçları bu cihazların yerine geçmez.
- Production canonical `https://ziyasakiryilmaz.com` korunmaktadır. İlk HTTP denemesi upstream bağlantı hatası vermişti; son DNS-over-HTTPS kontrolleri SERVFAIL ve erişilebilir yetkili DNS bulunamadığını gösterdi. Domain, erişilebilen Cloudflare hesabındaki 10 zone içinde yok; DNS ayarları değiştirilmedi. Sorunu gidermek için domainin yönetildiği hesaba erişim gerekiyor. Worker yayını doğrulandı; özel domain V13 yayını ve index politikası açık.
- Canlı admin kaydet–tam yenile–yeniden aç–önizle–sürüm geçmişi ve yayın ayrımı doğrulandı. Kontrollü test taslağı yayımlanmadan arşivlendi; yayın sayısı 66 kaldı ve test rotası anonim istekte 404 verdi. Gerçek iletişim formu başarıyla talep oluşturdu; admin panelindeki eşleşen test kaydı İstenmeyen olarak güncellendi ve tam yenileme sonrasında durumunun korunduğu görüldü. Ayrıntılı kanıt: `docs/v13-completion-evidence-2026-10-26.md`.
- Kafa Yapısı ile diğer üç pilların kısa cevap ve sekiz başlık konumu canlı ölçümle tamamlandı. Mobil blueprint reveal, reduced-motion’ın gerçek tarayıcı tercihiyle doğrulanması ve insan gözüyle mesaj/akış değerlendirmesinin kalan kanıtları ayrıca izlenir.

## Kalan kabul sırası

1. **Tamamlandı:** Dört pilların kısa cevap ve sekiz başlık alanları ilk %60 sonrasında doğrulandı. KGKY’nin doğrudan kısa cevap öğesi de iki genişlikte %60 sonrası doğrulandı. Mobil blueprint’te beş aşama okunabilir; ilk reveal geçişinin görsel kontrolü ayrıca izleniyor.
2. **Tamamlandı:** Uygulamada sahip oturumuyla canlı admin kaydet–yeniden aç, taslak önizlemesi, sürüm geçmişi ve yayın ayrımı doğrulandı. Gerçek form test kaydı admin panelinde görüldü; İstenmeyen durumunun tam yenileme sonrası kalıcılığı doğrulandı.
3. Gerçek iPhone Safari ve Android Chrome, reduced-motion ve başlangıç sürümüyle sayaç görüntüsü karşılaştırmasını tamamla.
4. Özel production alan adının bu Worker’a bağlantısını ve gerçek index politikasını doğrula; canonical yapılandırması DNS/custom-domain bağlantısının kanıtı değildir.
5. Kaynak bekleyen gerçek yorum, showreel ve resmî eğitim belgesi geldikçe ilgili koşulları tamamla. 11 temel sayfanın editoryal akış incelemesi tamamlandı; K41’in zamanlanmış senaryo kabulü ayrıca açık.
