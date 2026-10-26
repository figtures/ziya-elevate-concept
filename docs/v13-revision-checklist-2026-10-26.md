# Ziya Şakir Yılmaz V13 revize planı ve kontrol listesi

Kaynak: `Ziya_Sakir_Yilmaz_V13_Tasarimci_Nihai_Brief_TEKRAR.docx` · 24 Ekim 2026. Çalışma kaydı: 26 Ekim 2026. Bu dosya briefin tamamını uygulama ve doğrulama adımlarına dönüştürür. Metinler briefteki yeni ifadelerle birebir eşleştirilir; mevcut tasarım ve korunması istenen alanlar ayrı denetlenir.

**Durum anahtarı:** `Doğrulandı` belirtilen yerel kabul kontrolü geçti; `Kod doğrulandı` otomatik kontrol geçti, ilgili görsel veya canlı ortam koşulu açık; `Medya doğrulandı` dosyanın süre/kare/kimlik kontrolü geçti, tarayıcı ekran kaydı ayrı; `Kaynak bekliyor` müşteri materyali gerekiyor; `Doğrulanamadı` istenen ortamda kontrol henüz yapılamadı; `Kısmen tamamlandı` alt koşulların tümü kapanmadı. Kod kontrolü gerçek tarayıcı, gerçek cihaz ve canlı veritabanı denetimi yerine geçmez.

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
| K00.1 | 0 | Lacivert / krem renk paleti ve mevcut tasarım dili korunur. | Değişen CSS kapsamı; mevcut renk değişkenleri; önce/sonra ekran görüntüsü. | Kod doğrulandı |
| K00.2 | 0 | Ana sayfanın genel sırası ve dört çalışma kartının yapısı korunur. | Ana sayfa bölüm kimlikleri ve kart DOM sırası karşılaştırması. | Doğrulandı |
| K00.3 | 0 | TEDx, kitaplar, final ve logo şeridi kaldırılmaz. | Oluşturulan HTML’de dört alanın varlığı. | Doğrulandı |
| K00.4 | 0,3 | Beş sayacın rakam, açıklama, animasyon, süre, yerleşim, tipografi, renk ve kodu değişmez. | Aşağıdaki dört SHA-256 + check-counters.mjs + karşılaştırmalı görsel kontrol. | Kod doğrulandı |
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
| K24 | 24 | KGKY: hero → Sabotajcı → üçlü → 6 Ayna →90 saniye →HAYIR →66 gün →test CTA →kısa cevap →FAQ. | Tüm bölümler korunarak yeni sıra; kısa cevap üst %60’ta değil. | Kod doğrulandı |
| K25.1 | 25 | Başarı Mühendisliği hero ve Bir hedef, nasıl çalışan bir sisteme dönüşür? girişi korunur. | H1 ve giriş başlığı; yeni sıra. | Doğrulandı |
| K25.2 | 25 | KİTAPTAKİ İLKELER alanında beş başlık vardır. | Ben Yasası / Sitem-Sistem / Başarı Ceketinin Üç Düğmesi / Kadar-Keder / Üç Filtre. | Doğrulandı |
| K25.3 | 25 | EĞİTİM SALONUNDAKİ UYGULAMA MODELİ kitap ilkelerinden sonra gelir. | Keşif / Tasarım / İnşa / Test / Bakım sırası. | Doğrulandı |
| K25.4 | 25 | Kitap + eğitim CTA’sı kısa cevap/SEO içeriğinden önce gelir. | Bölüm sırası. | Doğrulandı |
| K26.1 | 26 | Desktop blueprint scroll ilerlemesine bağlı beş aşamayı gösterir. | Scroll progress arttığında KEŞİF→TASARIM→İNŞA→TEST→BAKIM ilerler. | Kod doğrulandı |
| K26.2 | 26 | Scroll durunca blueprint durur; loop yoktur. | Sabit scroll konumunda zaman geçmesiyle ilerleme değişmez. | Kod doğrulandı |
| K26.3 | 26 | Mobilde beş aşama normal akışta hafif reveal olur. | Sticky/pinned yok; mobil kaydırma ve okuma kontrolü. | Kod doğrulandı |
| K26.4 | 26 | Reduced-motion tamamlanmış statik şema gösterir. | Hareket azaltma açıkken beş aşamanın tamamı görünür ve animasyon yok. | Kod doğrulandı |
| K27 | 27 | Konuşmacı deneyim paragrafı birebirdir; 13 yıl kalmaz. | 16 yıl, Bayer Country Manager8 yıl,84ülke,90+ülke,14yıl,70.000,600.000,5TEDx,dörtkitap tam metin. | Doğrulandı |
| K28.1 | 28,40 | Gerçek 75–90 saniyelik çok sahneli showreel yoksa bölüm yayınlanmaz. | Dosya süresi ve gerçek içerik incelemesi; yoksa ziyaretçi HTML’sinde bölüm yok. | Doğrulandı |
| K28.2 | 28 | Hazır reel varsa belirtilen başlık ve buton kullanılır. | 90 SANİYEDE ZİYA ŞAKİR YILMAZ / SHOWREEL’İ İZLE ▶. | Kaynak bekliyor |
| K28.3 | 28 | Hazır reel kullanıcı tıklamasıyla tek adımda sesli oynar; otomatik ses yoktur. | Click playback ve autoplay/ses politikası. | Kaynak bekliyor |
| K29.1 | 29 | Header’ın sağında TR \| EN sabit ve küçük görünür. | 1440/1920/1366desktop görünümü. | Kod doğrulandı |
| K29.2 | 29 | Mobilde TR \| EN erişimi görünürdür. | 375/430px ve AndroidChrome kontrolü. | Kod doğrulandı |
| K29.3 | 29 | TR Türkçe siteye, EN doğrudan /en/speaker/ adresine gider. | İki bağlantının href’i; İngilizce sayfada Türkçe dönüş bağlantısı. | Doğrulandı |
| K30.1 | 30 | Üç eğitim programında aynı bilgi sırası kullanılır. | KİMİN İÇİN → HANGİ PROBLEM → FORMAT → SÜRE → GRUP BÜYÜKLÜĞÜ → ÇIKTI → ÖN ÇALIŞMA → SONRASI. | Doğrulandı |
| K30.2 | 30 | Bilgisi olmayan satır ve placeholder gösterilmez. | Yakında/belirlenecek/boş bilgi satırı yok; mevcut bilgiler korunur. | Doğrulandı |
| K31.1 | 31 | Mentorluk sınırlı kontenjan cümlesi yalnız bir kez kalır. | Tam iki cümleli kontenjan metninin sayımı1. | Doğrulandı |
| K31.2 | 31 | Kontenjan cümlesinin hemen altında ritim açıklaması bulunur. | Çalışma süresi ve görüşme ritmi, ilk görüşmede hedefe göre birlikte belirlenir. | Doğrulandı |
| K32 | 32 | Hakkında 13 yıl ifadesi14yıllık girişimcilik metniyle değiştirilir. | 14 yıllık girişimcilik yolculuğunda 70.000 kişiye ulaşan bir ekip. | Doğrulandı |
| K33 | 33 | Hakkında misyon cümlesi birebir yenilenir. | Pusulam tek cümle: bir milyon insanın kalbine dokunmak. | Doğrulandı |
| K34.1 | 34 | Hakkında ana hikâyede dijital etki/Favikon sıralamaları yoktur. | Sıralama kutusunun Hakkında ziyaretçi HTML’sinden çıkarılması. | Doğrulandı |
| K34.2 | 34 | Dijital etki mevcut Basın/Medya Kiti alanına taşınır. | DİJİTAL ETKİ · TARİHLİ VERİLER başlığı; tarihli mevcutverilerin korunması. | Doğrulandı |
| K35 | 35 | Yalnız resmî belgede doğrulanan kurum ve program adı yayınlanır. | Resmî belge kaynağı; doğrulanmamış MBA/program iddiası yok. | Kaynak bekliyor |
| K36.1 | 36 | Workers/dev head noindex,nofollow içerir. | Gerçekhost yanıtında <meta name="robots" content="noindex, nofollow">. | Kod doğrulandı |
| K36.2 | 36 | Production ziyasakiryilmaz.com indekslenebilir kalır. | Productionhost yanıtında devnoindex kuralı yok; indekslenebilirrobotspolicy. | Kod doğrulandı |
| K37.1 | 37 | Dört pilların hepsinde tez/hikâye/model ve ana CTA SEO bloklarından önce gelir. | Başarı/KafaYapısı/Satış/Liderlik DOMsırası. | Doğrulandı |
| K37.2 | 37 | Dört pillarda kısa cevap →DAHA DERİNE İN→FAQ sırası uygulanır. | 8başlık korunur; Bu alandaki sekiz başlık kaldırılır. | Doğrulandı |
| K37.3 | 37 | Kısa cevap ve8başlık ilk%60’ta görünmez. | Tarayıcıda scrollHeight/öğeoffset oranı ölçümü; DOM sırası tekbaşına yeterli değildir. | Doğrulanamadı |
| K38.1 | 38 | Her alt sayfa ilk ana içerik olarak kendi H1/hero alanıyla açılır. | Tüm alt sayfalarda H1 öncesi SEO kutusu/uzun açıklama/tekrarmanifesto yok. | Doğrulandı |
| K38.2 | 38 | Her alan fark, güven veya birlikte çalışma gerekçesine hizmet eder. | Mevcut alanların editoryal kontrolü; korunmasıistenen alanlar kaldırılamaz. | Doğrulanamadı |
| K39.1 | 39 | 1440px desktop son QA yapılır. | Ekran görüntüsü, taşma ve akış incelemesi. | Doğrulanamadı |
| K39.2 | 39 | 1920px desktop son QA yapılır. | Ekran görüntüsü, taşma ve akış incelemesi. | Doğrulanamadı |
| K39.3 | 39 | 1366px laptop son QA yapılır. | Ekran görüntüsü, taşma ve akış incelemesi. | Doğrulanamadı |
| K39.4 | 39 | 375px iPhone Safari son QA yapılır. | GerçekSafari/uyguntestkanıtı; yalnızChromiumviewport Safariolduğu anlamına gelmez. | Doğrulanamadı |
| K39.5 | 39 | 430px iPhone Safari son QA yapılır. | GerçekSafari/uyguntestkanıtı. | Doğrulanamadı |
| K39.6 | 39 | Android Chrome son QA yapılır. | AndroidChrome/uyguntestkanıtı. | Doğrulanamadı |
| K39.7 | 39 | Kızık/Astana uzun paragrafları taşmaz. | 375/430/1366/1440/1920px kırılım kontrolü. | Doğrulanamadı |
| K39.8 | 39 | 440.000 başlığı mobilde dengeli ve kesilmeden görünür. | 375/430px başlık görüntüsü. | Doğrulanamadı |
| K39.9 | 39 | KGKY üçlü büyük harfleri mobilde kesilmez. | HENÜZ/RAĞMEN/MÜMKÜN375/430px görüntüsü. | Doğrulanamadı |
| K40 | 40 | Briefteki24teslimkutucuğunun tamamı ayrı kanıtla kapatılır. | Aşağıdaki teslimözeti; eksikvarsaTamamlandıdenmez. | Kısmen tamamlandı |
| K41 | 41 | 5sn/30sn/60sn/2dk/çıkışta ölçek/fark/sistem/yaşanmışlık/işbirliği mesajları okunur. | İnsan gözüyle senaryolu son okuma; yeni efekt eklemek yerine metin/kanıt/akış kontrolü. | Doğrulanamadı |

## Dış materyal ve doğrulama bağımlılıkları

- **Gerçek yorumlar:** Yayın için en az dört gerçek/onaylı yorum ve her birinin ad soyad, unvan, kurum bilgisi gerekir. Briefin kabul ettiği geçici sonuç, bölümün gizli kalması ve logo şeridinin korunmasıdır.
- **Showreel:** 75–90 saniyelik uygun video, eksiksiz görüntü/ses kaynağı ve kullanım hakkı doğrulanamadığında bölüm yayınlanmaz. Briefin teslim checklist’i bu durumu açıkça kabul eder.
- **Eğitim belgesi:** Resmî kurum/program adı kaynak belgede görülmeden MBA veya başka bir program adı tamamlandı diye işaretlenmez. Doğrulanmamış iddiaların kaldırılması ayrı bir uygulama; doğru adın yayınlanması ayrı kaynak koşuludur.
- **Gerçek tarayıcılar:** iPhone Safari ve Android Chrome koşulları yalnız DOM testleriyle kapatılamaz. Erişilemeyen tarayıcı/device kontrolleri açıkça Doğrulanamadı kalır.

## Doğrulama kaydı · 26 Ekim 2026

90 atomik maddenin durumu: **60 Doğrulandı**, **11 Kod doğrulandı**, **3 Medya doğrulandı**, **3 Kaynak bekliyor**, **12 Doğrulanamadı**, **1 Kısmen tamamlandı**. Brief §40’ın 24 teslim kutucuğundan 21’i yerel kanıtla işaretli; 3’ü gerçek ekran/host kontrolü bekliyor. Yerel test sayısı ile tamamlanmış revize sayısı birbirinin yerine kullanılmaz.

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

## Brief §40 · 24 teslim kutucuğunun eşlemesi

İşaretli kutular yerel kaynak, medya ve render kanıtını gösterir; canlı yayın veya gerçek cihaz kabulü olarak okunmamalıdır.

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
- [ ] Header’da TR | EN var — K29.1–K29.3; render ve bağlantılar geçti, istenen ekranlarda görünürlük açık.
- [x] Mentorluk tekrar cümlesi silindi — K31.1.
- [x] Hakkında sayfasında Favikon sıralamaları ana hikâyede yok — K34.1.
- [ ] Dev domain noindex,nofollow — K36.1; yerel gerçek handler testi geçti, yayımlanan host ayrıca doğrulanacak.
- [ ] Production domain indexlenebilir — K36.2; yerel gerçek handler testi geçti, yayımlanan host ayrıca doğrulanacak.

## Teslim özeti ve açık koşullar

Uygulanan içerik ve yerel kod kontrolleri yukarıda kanıtlarıyla kayıtlıdır. Değişiklikler inceleme dalı ve taslak PR üzerinden teslim edilecek; doğru üretim veritabanı doğrulanmadan production dalına merge edilip CI/CD yayını tetiklenmeyecek. Bu dosya yayın commit’i, başarılı dağıtım veya canlı site kabulü iddiası içermez.

- Dört gerçek/onaylı yorum bulunmadığından yorum bölümü gizlidir; logo şeridi korunur. Gerçek kayıtlar admin panelinde hazırlanıp onaylanınca eşik sağlandığında yayınlanabilir.
- Uygun 75–90 saniyelik sesli showreel kaynağı olmadığı için bölüm gizlidir. Başlık ve click-to-play kabul koşulları kaynak gelene kadar açık kalır.
- Resmî eğitim kaydı sağlanmadığı için doğrulanmamış ODTÜ/MBA ve `alumniOf` iddiaları kaldırılmıştır. Doğru kurum/program adının eklenmesi kaynak bekler.
- Bağlı iki Supabase hesabında da hedef üretim projesi `hzmrvyjolrqdsrppajqs` bulunamadığı için canlı veritabanı migration’ı ve kalıcı admin kayıt testi doğrulanamamıştır. Yerel migration testleri canlı yazma gerçekleştiği anlamına gelmez.
- Yönetilen önizleme `terminal.local:4173` üzerinde başlatıldı; bağlı Chrome erişiminde gezinme zaman aşımına uğradı. Bu nedenle ekran görüntüsüyle kabul yapılmış sayılmaz. iPhone Safari, Android Chrome, karşılaştırmalı sayaç görüntüleri, beş viewport’taki taşmalar ve bilgi alanlarının gerçek sayfa yüksekliğinde ilk %60 dışında kalması açık kalır.
- İnsan gözüyle 5 saniye / 30 saniye / 60 saniye / 2 dakika mesaj ve akış değerlendirmesi ayrıca gerekir. Bu nedenle bütün checklist tamamlandı olarak işaretlenmez.

## Yayına alma sırası

1. Hedef Supabase projesi `hzmrvyjolrqdsrppajqs` için doğru hesap/proje erişimini doğrula. Başka bağlı projeye işlem uygulama.
2. Hazır üç ek SQL migration’ını sırasıyla uygula: `20261026174158_v13_approved_knowledge_labels.sql` → `20261026174711_v13_press_template_registration.sql` → `20261026174847_v13_initial_press_publication.sql`. İlki yalnız dört onaylı başlığı doğrulayıcıya ekler; ikincisi `/basin/` şablonunu kaydeder; üçüncüsü yalnız henüz bulunmayan Basın sayfasının ilk kaydını/yayınını oluşturur. Mevcut taslak, arşivlenmiş veya yayından kaldırılmış sayfayı yeniden yayınlamaz. Genel seed installer bu adımın yerine kullanılmaz.
3. Hedef veritabanında migration sonuçlarını, onaylı başlıklı içerik kaydını ve Basın yayın kaydını doğrula; admin önizlemesinden yapılan değişikliğin kaydet/yeniden aç sonrasında korunduğunu kontrol et. Bu koşul kapanmadan CI/CD production yayını tutulur; aksi durumda admin kayıt hatası veya `/basin/` için 404 oluşabilir.
4. İnceleme dalı/taslak PR kontrolünü tamamla, ardından production dalına merge ile mevcut CI/CD’yi çalıştır. Dağıtılan commit’i kaydet; `/basin/`, güncel metinler, dev/production robots, form ve admin kontrollerini gerçek host üzerinde tekrarla.
5. Tarayıcı erişimi sağlandığında açık viewport, taşma, sayaç karşılaştırması ve gerçek cihaz kontrollerini tamamla; yalnız kanıtlanan satırları kapat.
