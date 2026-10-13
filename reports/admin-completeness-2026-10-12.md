# Yönetim paneli kapsam ve etkileşim denetimi

Tarih: 12 Ekim 2026. Kaynak: bu site deposundaki güncel katalog ve yönetim kodu.

**Sonuç:** Yerel kontroller geçti: 7 DOM temel kontrolü ve 24 ayrıntılı yönetim akışı. 64 belge, 177 bölüm ve 5,699 içerik alanının tamamı gerçek bölüm editörlerinde erişilebilir. Kalıcı kayıt/yayın için gerekli Supabase bağlantısı henüz etkin değil. Bu rapor canlı veritabanı, gerçek e-posta teslimi veya tarayıcıda görsel test yapıldığını iddia etmez.

## İçerik kapsamı

| Alan | Sayı / durum | Yönetim yolu |
|---|---:|---|
| Sayfalar | 23 | Sayfalar; ilgili hızlı erişim |
| Makaleler | 30 | Makaleler; tasarım şablonundan yeni makale |
| Hayattan notlar | 9 | Hayattan notlar; tasarım şablonundan yeni not |
| Özgün Kafa Yapısı Testi | 1 | 20 soru, 5 katman, cevap/puan/öneri/sonuç aralıkları |
| Ortak üst menü ve alt bilgi | 1 | Menü ve alt bilgi; bağlantı metni, adres, sıra |
| İçerik bölümleri | 177 | Bölüm içeriği, sıra, görünürlük, aynı tasarımdan bölüm ekleme |
| Düzenlenebilir alanlar | 5,699 | Metin, bağlantı, medya, alternatif metin, kadraj, video kimliği/zamanları |
| Tekrarlanan listeler | 59 | Kitaplar, konuşmalar, programlar, tablolar, menü ve alt bilgi listeleri |
| Kaynak medya envanteri | 16 | Görseller, video dosyaları ve video kapakları |
| SEO | Her belgede | Başlık, açıklama, sosyal görsel; yeni içerikte sayfa adresi |
| Talepler | Yönetici / sahip | Durum, iç not, arama ve filtre |
| Ekip | Sahip | Davet, rol ve aktiflik yönetimi |

Video açılışı korunur. Testte özgün 20 soru / 5 katman yapısı korunur. Mevcut sayfa adresleri bağlantıları bozmamak için sabittir; yeni içerik oluştururken adres girilebilir. Sayfa tasarımının CSS/animasyon kodu ve Supabase altyapı ayarları, içerik panelinden değiştirilen alanlar değildir.

## Düzeltilen gerçek sorunlar

1. **Kayıt sırasında başka belgeye geçiş:** Arayüz işlem boyunca kilitlenir; aynı anda ikinci işlem başlatılamaz. Kaydedilecek belge RPC öncesi kopyalanır. Hata sonrası taslak korunur ve kilit kalkar.
2. **Yanlış medya türü seçimi:** Görsel alanında yalnız görseller, video alanında yalnız videolar listelenir. Dosya adı/açıklama araması eklendi.
3. **Sosyal görsel yönetimi:** SEO sekmesinden medya arşivi açılır. Yeni görsel seçildiğinde arşivdeki anlamlı alternatif metin ilgili sayfa görseline aktarılır.
4. **Kopyalanan başlıkta eski metin:** Bölüm veya madde seviyesindeki eski H1 değişiklikleri temizlenir. Sonradan oluşturulan bir içerik de tekrar çoğaltılabilir.
5. **Yeni içerikte adres sorunları:** Aynı adres ve ayrılmış yönetim/API adresleri, taslak oluşturmadan önce reddedilir.
6. **Eski kayıtlara erişilememe:** Taleplerde 200, geçmişte 80 sınırı ve Supabase varsayılan sonuç penceresi yerine sıralı 250 kayıtlık okumalar kullanılır. 1.101 içerik, 301 talep ve 301 sürümlük örnekle son kayda erişim doğrulandı.
7. **Önizleme penceresi etkileşimi:** Pencere açıkken arkadaki panel etkileşime kapatılır; kapatılınca yeniden açılır.

Bu çalışma sırasında ana görevde derleyiciye de açılış video alanları, form ipuçları/seçenek etiketleri ve alt bilgi listeleri eklendi. Güncel katalogla tüm alanların erişim testi tekrar çalıştırıldı.

## Kontroller ve sonuçlar

Komutlar:

```sh
node scripts/check-admin-dom.mjs
node scripts/check-admin-workflows.mjs
node --check cms/admin.mjs
```

| Kontrol grubu | Doğrulanan davranış | Sonuç |
|---|---|---|
| Başlangıç ve gezinme | Çevrimdışı açılış, tüm yönetim başlıkları, tüm bölüm editörleri | Geçti |
| Alan kapsamı | Katalogdaki her alan gerçek editör DOM'unda bulunuyor | Geçti |
| Taslak metni | Alan değişir; kaynak seed değişmez; önizlemede görünür | Geçti |
| Bölümler | Sıralama, görünürlük, ekleme; ilk video bölümü korunur | Geçti |
| Listeler | Kitap/menü maddesi düzenleme, çoğaltma, sıralama, kaldırma | Geçti |
| İçerik çoğaltma | Değiştirilmiş H1 ve sonradan oluşturulan kaynak | Geçti |
| SEO | Başlık/açıklama/görsel ve taslak önizlemesi | Geçti |
| Medya seçici | Dosya türü, arama, seçim, alternatif metin aktarımı | Geçti |
| Test | Soru/yanıt/puan, sıra, sonuç başlığı; 20 soru/5 katman | Geçti |
| Rol arayüzü | Sahip/yönetici/editör yayın ve ekip kısıtları | Geçti |
| Taslak kaydı | Yalnız kayıt RPC'si; yayındaki sürüm aynı kalır | Yerel RPC stub ile geçti |
| Yayın | Önce taslağı kaydeder; yeni revizyonla yayın RPC'si | Yerel RPC stub ile geçti |
| Çakışma | 40001 hatasında değişiklik kaybolmaz; Türkçe açıklama | Yerel RPC stub ile geçti |
| Eşzamanlı işlem | Kayıt sürerken gezinme/ikinci yayın engellenir | Yerel RPC stub ile geçti |
| Arşiv | Arşivle/çıkar/yayından kaldır doğru belgeyi hedefler | Yerel RPC stub ile geçti |
| Sürüm geri alma | Yeni taslak oluşur; kendiliğinden yayınlanmaz | Yerel RPC stub ile geçti |
| Sayfalı okuma | Eski 80/200/1000 sınırlarının ötesi erişilebilir | Yerel sorgu stub ile geçti |
| Medya yükleme | Tür ve 50 MB doğrulaması; benzersiz yol; meta kayıt | Yerel Storage/DB stub ile geçti |
| Medya arşivleme | Alternatif metin güncelleme; URL korunarak arşivleme | Yerel DB stub ile geçti |
| Talep | Durum/iç not; beklenen revizyon ile güncelleme | Yerel RPC stub ile geçti |
| Ekip rolü | Rol ve aktiflik güncelleme parametreleri | Yerel RPC stub ile geçti |
| Şifre | Eşleşmeyen şifre reddi; eşleşen değer için tek çağrı | Yerel Auth stub ile geçti |
| Kayıt dışı değişiklik | Sayfadan ayrılma onayı iptal edilebilir | Geçti |
| Güvenli başlık/önizleme | Başlık HTML olarak çalışmaz; footer konumu korunur | Geçti |
| Asenkron okuma | Eski görünüm yanıtı yeni görünümü bozmaz | Geçti |

## Canlı doğrulama bekleyenler

| İşlem | Neden henüz doğrulanmadı | Gerekli sonraki kontrol |
|---|---|---|
| Giriş ve kalıcı CRUD | `cms/config.json` bağlantısı devre dışı | Siteye ait Supabase projesi seçilip bağlandıktan sonra gerçek hesapla giriş/kayıt |
| Canlı RLS ve yetki sınırları | Uzaktaki proje seçilmedi | Editör/yönetici/sahip hesaplarıyla gerçek veritabanı işlemleri |
| Gerçek yayın ve geri alma | Kalıcı içerik kaynağı bağlanmadı | Taslak–yayın ayrımını ziyaretçi çıktısında doğrulama |
| Dosya yükleme | Canlı Storage kullanılmadı | Görsel/video yükleme, geri okuma ve arşivleme |
| İletişim talepleri | Form bağlantısı etkin değil | Gerçek form gönderimi ve panelde durum takibi |
| Davet / şifre e-postası | Gerçek kişiye e-posta gönderilmedi | Onaylanmış test alıcısı ve Auth teslim ayarları |
| Tarayıcı / ekran boyutları | Bu ortamda desteklenen tarayıcı QA aracı yok | Masaüstü/mobil ekran ve gerçek klavye/fokus kontrolü |

Yerel stub testleri ağ protokolünü ve Supabase servisinin gerçekten çalıştığını doğrulamaz. Veritabanı güvenlik testlerinin bulguları ayrı güvenlik raporunda değerlendirilmelidir. Bu panel şu anda **kurulum önizlemesi** durumundadır; “canlıda her şey eksiksiz yönetiliyor” sonucu verilemez.

## Supabase kaynakları

Uygulama öncesi [güncel değişiklik özeti](https://supabase.com/changelog.md) incelendi. API çağrı şekilleri [RPC belgesi](https://supabase.com/docs/reference/javascript/rpc) ve [sayfalı aralık belgesi](https://supabase.com/docs/reference/javascript/using-modifiers-range) ile doğrulandı. Paket sürümü değiştirilmedi; `@supabase/supabase-js` 2.117.3 kullanılıyor.
