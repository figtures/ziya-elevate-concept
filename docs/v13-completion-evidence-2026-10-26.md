# V13 eksik tamamlama ve kabul kanıtları

Tarih: **26 Ekim 2026, Türkiye saati**. Bu kayıt, önceki dağıtımın ardından yapılan tamamlama çalışmasını ve doğrulamanın sınırlarını izler. Bir kontrolün yerel ortamda geçmesi, canlı uygulamada veya gerçek cihazda tamamlandığı anlamına gelmez.

## Canlı yönetim paneli: taslak kaydı ve yayın ayrımı

Mevcut **sahip** yetkili CMS oturumuyla uygulamanın kendi arayüzü kullanıldı. Supabase dashboard oturumu yerine uygulama oturumu doğrulandı; SQL veya ayrıcalıklı anahtarla oturum taklidi yapılmadı.

| Adım | Gözlenen sonuç |
| --- | --- |
| Kontrollü test içeriği | Basın şablonuyla `/v13-kabul-taslagi/` adresinde “V13 Kabul Taslağı — Yayınlanmayacak” başlıklı içerik oluşturuldu. |
| İlk kayıt | H1 ilk test metniyle kaydedildi; sürüm 1 oluştu. |
| Kalıcılık | Sayfa tamamen yenilendi; genel görünümden içerik yeniden açıldı ve ilk metin korundu. |
| İkinci kayıt | H1 ikinci test metniyle değiştirildi; sürüm 2 oluştu. |
| Önizleme | Taslak önizlemesinin iframe içeriğinde ikinci metin görüldü. |
| Yeniden açma | Tam sayfa yenilemesi ve yeniden açma sonrasında ikinci metin korundu. |
| Sürüm geçmişi | İki ayrı `save` kaydı görüldü. |
| Yayın ayrımı | “Yayınla” düğmesine hiç basılmadı. Yayındaki içerik sayısı 66 olarak kaldı. Test adresi işlem öncesinde ve sonrasında anonim istekte HTTP 404 döndürdü. |
| Test kaydının son durumu | İçerik uygulama arayüzünden arşivlendi. 23:47 TSİ itibarıyla Arşiv listesinde görüldü. Kalıcı silme yapılmadı. |

Bu sonuç, canlı uygulamada **kaydet → tamamen yenile → yeniden aç → önizle** akışının çalıştığını ve taslak kaydının kendiliğinden yayın oluşturmadığını doğrular. Gerçek ziyaretçiye açık mevcut bir sayfanın içeriği değiştirilmedi.

## Yeni Kafa Yapısı alanlarının canlı CMS kalıcılığı

Dağıtım sonrası Kafa Yapısı sayfası mevcut yönetici oturumunda açıldı. Başlangıç durumu **sürüm 2** idi. Yeni **03 · Sistemin zirvesi** bölümünde Astana paragrafı, iki bağlantı, kitap görseli, alternatif metin/kadraj alanı ve üç düzenlenebilir kelime maddesi görüldü.

Alanların içeriği değiştirilmeden **Taslağı kaydet** kullanıldı; **sürüm 3** ve **“Yayında · yeni taslak”** durumu oluştu. Tam sayfa yenilemesi, genel görünüme dönüş ve Kafa Yapısı’nın yeniden açılması sonrasında 03. bölümün bütün alanları ve sürüm 3 korundu. **Yayınla** düğmesine basılmadı; ziyaretçiye açık yayın ayrıca değiştirilmedi.

Bu, yeni alanların uygulama arayüzünde kayıt ve yeniden açma kalıcılığının testidir. Migration işaretinin ham veritabanı değeri ayrıca sorgulanmadı; o değerin SQL ile doğrulandığı iddia edilmez.

Canlı ziyaretçi sayfasında kısa cevap açılır alanı açılıp tam metni görüldü; sekiz başlık alanı açıldığında sekiz başlığın tamamı ve açıklamaları görünürdü. 375px görünümde yeni kitap görseli yüklendi (`naturalWidth=1448`) ve yatay taşma yoktu. Böylece ilk yüklemedeki lazy-load öncesi geometri kaydında görülen boş doğal boyut, bozuk görsel olarak yorumlanmaz.

## Yerel admin ve medya kontrolleri

| Kontrol | Sonuç | Kapsam |
| --- | --- | --- |
| `node scripts/check-admin-workflows.mjs` | **56 geçti, 0 hata** | 66 belge, 6.067 düzenlenebilir alan ve 65 video çalışma alanının erişimi; taslak/yayın ayrımı, sürüm çakışması, geri yükleme, roller, kitap ekleme/silme/sıralama, menü ve arşiv sıralaması, medya yükleme sınırları, klip süreleri ve önizleme, geçici şifre ve silme onayı. |
| `node scripts/check-media-frame-editor.mjs` | **6 kontrol grubu geçti** | Bağımsız masaüstü/mobil kadraj, sürükleme ve klavye ayarı, sıfırlama, iptal, asenkron uygulama hatasından dönüş, video yükleme/arama/oynatma ve kaynak temizliği. |
| `node scripts/check-media-picker-framing.mjs` | **5 kontrol grubu geçti** | Medya seçiminden sonra alana uygun kırpma adımı; iptalde taslağın korunması; önceki kadrajın geri gelmesi; eski kaynak kadrajının uygulanmaması; kitap yerleşimlerinin bağımsızlığı; sosyal görsel kırpma sınırları. |

Yerel kontroller DOM ve kontrollü istemci yanıtları kullanır. Gerçek tarayıcıdaki dosya çözümleme, video oynatma veya gerçek cihaz testi yerine geçmez.

## Canlı iletişim formu

26.10.2026 **23:52 TSİ** tarihinde kontrollü test talebi gerçek iletişim formundan gönderildi. Ziyaretçi arayüzünde **“Talebiniz alındı”** sonucu görüldü ve aynı test talebi admin panelinde bulundu. Test için kişisel olmayan `v13-qa@example.invalid` adresi kullanıldı. E-posta veya WhatsApp mesajı gönderilmedi.

Talep, admin panelinde **İstenmeyen** olarak seçilip **Güncelle** düğmesiyle kaydedildi. Ardından sayfa tamamen yenilendi; aynı test adı, test e-posta adresi ve 26.10.2026 23:52 kayıt zamanı bulunan satırda **İstenmeyen** durumunun korunduğu doğrulandı. Böylece gerçek form gönderimi, yönetim panelinde kaydın görünmesi ve durum güncellemesinin kalıcılığı ayrı ayrı doğrulandı.

## Konuşmacı dosyası PDF düzeltmesi

`website/assets/ziya-sakir-yilmaz-speaker-kit.pdf` ve `public/assets/ziya-sakir-yilmaz-speaker-kit.pdf` güncellendi. Desteklenmeyen eğitim iddiaları kaldırıldı; briefteki deneyim süreleri ve ilgili biyografi içeriği korundu.

| Kontrol | Sonuç |
| --- | --- |
| Dosya kapsamı | Her iki kopya da 8 sayfa ve 744.890 bayt. |
| SHA-256 | Her iki dosyada `1b37d5ab89e5652537bcd06c53d5efb927d38827e469011e34a75f3c509dd463`. |
| Müşteri kabul kontrolleri | 23 kontrol geçti. |
| Görsel inceleme | PDF görsel QA geçti. |

Dağıtım sonrasında canlı PDF HTTP 200 döndürdü. İndirilen dosyanın 744.890 bayt olduğu ve yukarıdaki SHA-256 ile birebir eşleştiği doğrulandı; düzeltilmiş dosya canlıda sunuluyor.

## Kafa Yapısı akışı ve teknik doğrulama

Kafa Yapısı akış düzeltmesi canlıya alındı. Aşağıdaki yerel kontroller geçti:

| Kontrol | Sonuç |
| --- | --- |
| Kafa Yapısı akış kontrolleri | 7 kontrol geçti. |
| V13 içerik migration kontrolleri | 14 kontrol geçti. |
| V13 kabul kontrolleri | 23 kontrol geçti. |
| V13 teknik kontrolleri | 16 kontrol geçti. |
| TypeScript | `npm run typecheck` geçti. |
| Üretim derlemesi | Build geçti. |

Dağıtım sonrası canlı Chrome ölçümlerinde Kafa Yapısı kısa cevap ve sekiz başlık alanları tüm beş genişlikte ilk %60'ın dışında kaldı. Ölçüm, öğenin belge başına göre üst koordinatının footer dahil toplam `scrollHeight` değerine oranıdır. Açılır alanların başlangıçtaki kapalı durumu kullanıldı. Ham kanıt: `docs/qa/v13-completion/geometry.json`.

| Genişlik | Kısa cevap başlangıcı | Sekiz başlık başlangıcı | Yatay taşma |
| --- | --- | --- | --- |
| 375px | %65,665 | %72,923 | Yok |
| 430px | %66,915 | %73,834 | Yok |
| 1366px | %70,790 | %81,198 | Yok |
| 1440px | %71,217 | %81,557 | Yok |
| 1920px | %72,129 | %82,159 | Yok |

Başarı, Satış ve Liderlik sayfalarının 375px ve 1440px kontrollerinde de hem kısa cevap hem sekiz başlık başlangıcı %60'tan sonra; tüm ölçümlerde `scrollWidth` viewport genişliğine eşit. Bu sonuç gerçek Safari/Android cihaz kabulü değildir.

KGKY’nin doğrudan `.v13-direct-answer` öğesi ayrıca ölçüldü: 375px’de 5.817,908 / 7.775 = **%74,828**; 1440px’de 5.470,816 / 6.490 = **%84,296**. Böylece K24’ün ilk %60 dışında kalma koşulu da doğrulandı. Kanıt: `docs/qa/v13-completion/kgky-answer-geometry.json`. Önceki genel geometri JSON’undaki %79,907 / %87,042 değerleri sonraki “Neden kurşun geçirmez?” açılır başlığına aittir; kısa cevap ölçümü olarak kullanılmaz.

Mobil blueprint ekranında beş aşamanın tamamı okunabilir normal akışta ve yatay taşma olmadan görüldü. İlk reveal geçişi yakalanmadığından K26.3’ün hareket koşulu henüz görsel olarak kapatılmadı.

## Editoryal akış incelemesi

Kaynak HTML üzerinden 11 temel rota okundu: `/`, `/basari/`, `/kafa-yapisi/`, `/satis/`, `/liderlik/`, `/basari-muhendisligi/`, `/kursun-gecirmez-kafa-yapisi/`, `/konusmaci/`, `/egitimler/`, `/mentorluk/`, `/ziya-sakir-yilmaz/`.

- **Farklılaşma:** Ana sayfanın başarı mühendisliği tezi, dört çalışma alanının ayrı soruları ve vaatleri; Satış’ın teşhis yaklaşımı, Lider Çoğaltma Döngüsü, Başarı Mühendisliği kitap/eğitim ayrımı ve KGKY’nin adlandırılmış kavramları.
- **Güven ve yaşanmışlık:** Beş sayaç, kurum referansları, TEDx ve kitaplar; Kızık/Astana/12.12.2012 hikâyesi; 440.000 dolarlık satış dersi.
- **Birlikte çalışma gerekçesi:** Dört niyet CTA’sı, program hedef kitlesi/problem/format/çıktı bilgileri, keynote hazırlık süreci, mentorluk uygunluk ve görüşme ritmi.

İncelenen temel akışlarda bu üç amaca hizmet etmeyen bir bölüm saptanmadı; K38.2 editoryal kapsamıyla doğrulandı. Brief §41’in ölçek/fark/kendi sistemi/yaşanmışlık/işbirliği mesajlarının içerik karşılıkları mevcut. Bu inceleme zamanlanmış bir okuyucu deneyi değildir; 5/30/60 saniye ve 2 dakika içinde gerçek kullanıcı tepkisi veya dönüşüm garantisi iddia edilmez. K41 bu nedenle mesaj eşlemesi tamamlanmış, zamanlanmış senaryo kabulü açık olarak tutulur.

## Yayın durumu

Tamamlama commit’i `b03350096eb8ebb74375a4b51686e904cd4e065b` ana dala gönderildi. Mevcut Cloudflare CI/CD dağıtımı **başarılı** tamamlandı: 27 Ekim 2026 **00:02:51 TSİ** (`2026-10-26T21:02:51Z`). Ardından canlı geometri ve PDF eşitliği doğrulandı. Doğrulanan yayın: https://ziya-sakir-yilmaz.busratechnology.workers.dev/ .

## Son canlı ekran kanıtları

| Görüntü | Kanıt |
| --- | --- |
| [Ana sayfa son görünüm](qa/v13-completion/home-final.jpg) | Beş sayacın tamamı ilk ekranda: 600.000+, 84 ülke, 5× TEDx, 4 kitap, 30 yıl. Dört niyet menüsü, lacivert/krem palet ve mevcut tasarım dili korunuyor. |
| [Kafa Yapısı masaüstü](qa/v13-completion/mindset-desktop-final.jpg) | Yeni akışın masaüstü görünümü. |
| [Kafa Yapısı 375px](qa/v13-completion/mindset-mobile-375.jpg) | Yeni kitap görselinin yüklendiği mobil görünüm; yatay taşma yok. |
| [Blueprint 375px](qa/v13-completion/blueprint-mobile-375.jpg) | Beş aşama normal akışta okunabilir; ilk reveal geçişinin ekran kaydı değildir. |

Son ana sayfa görüntüsü önceki [1440px görüntüyle](qa/v13/home-1440.jpg) gözle karşılaştırıldı: lacivert/krem palet, açık gold/bej sayaç tonu, tipografi dili, hero/niyet kartı ve menü düzeni korunuyor. Bu nedenle K00.1 görsel ve kod kapsamıyla kapatıldı. Dört sayaç kaynak imzası ve `check-counters` kontrolü de geçti. Ancak son görüntü ile önceki görüntü aynı viewport/video karesinde değildir; başlangıç 9b53f sürümüyle eş koşullu piksel karşılaştırması yapılmış sayılmaz. K00.4 bu dar görsel karşılaştırma sınırı nedeniyle kod doğrulandı durumunda tutulur.

## Açık doğrulama ve kaynak sınırları

- Gerçek iPhone Safari ve Android Chrome cihazlarına erişim doğrulanmadı; Chrome viewport ölçümleri bu cihazların testi olarak sunulmaz.
- İşletim sistemi/tarayıcı hareket azaltma tercihiyle gerçek etkileşim doğrulaması henüz yapılmadı. Yerel reduced-motion kontrolleri ayrı kanıttır.
- En az dört eksiksiz, gerçek ve onaylı yorum; uygun 75–90 saniyelik sesli showreel; resmî eğitim kurumu/program belgesi henüz sağlanmış sayılmaz. Kaynak gerektiren içerik üretilerek gerçekmiş gibi yayınlanmaz.
- Özel alan adı için gerçek DNS-over-HTTPS sorguları **SERVFAIL** verdi; yetkili DNS yanıtına ulaşılamadı. Alan adı, kullanıcının erişilebilen tek Cloudflare hesabındaki 10 zone içinde bulunmadı. Cloudflare ayarlarında değişiklik yapılmadı. DNS/custom-domain sorununun giderilmesi için alan adının yönetildiği hesaba erişim gerekiyor. Bu nedenle özel alan adının V13 Worker sürümünü sunduğu veya gerçek host indeks politikası doğrulanmış sayılmaz.

Bu dosyada kullanıcı parolası, oturum bilgisi, servis anahtarı veya özel iletişim bilgisi tutulmaz.
