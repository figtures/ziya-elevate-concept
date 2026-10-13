# CMS güvenlik ve kalıcılık denetimi — 12 Ekim 2026

Yerel güvenlik doğrulaması başarılı: **195 PostgreSQL uyumlu kontrol + 36 Edge Function senaryosu** geçti. Bunun 64 kontrolü sitenin gerçek başlangıç belgelerinin doğrulamasıdır; diğer 131 kontrol veritabanı izinlerini ve veri akışlarını sınar. Üretim şeması veya fonksiyon davranışı bu denetimde değiştirilmedi. Kurulum yönergesindeki artık bulunmayan `schema.sql` referansı mevcut migration dosyasıyla düzeltildi.

**Canlı admin panelinin eksiksiz çalıştığı henüz doğrulanmış değildir.** Denetim sırasında `cms/config.json` içinde `enabled:false`, `leadsEnabled:false`, boş proje URL'si ve boş publishable key vardır. Bir Supabase hesabı/projesi seçilmedi; bu çalışma hiçbir uzak veritabanını değiştirmedi ve e-posta göndermedi.

## Çalıştırılan doğrulamalar

`scripts/check-cms-security.mjs`, mevcut migration'ı izole PGlite veritabanında uygular. `auth.users`, `auth.uid()` ve Storage tabloları yalnızca bu süreç için taklit edilir. Gerçek başlangıç içeriği `cms/seed.json` üzerinden okunur. Edge Function testleri gerçek TypeScript handler kodunu esbuild ile paketler; Auth, REST ve Turnstile cevapları süreç içinde taklit edilir. Hiçbir dış ağ isteği yapılmaz.

```text
Validated 64 actual seed documents
PASS 195 offline allow/deny checks
PASS 36 offline Edge Function request/response checks (stubbed services; no network)
```

| Alan | Doğrulanan davranış |
| --- | --- |
| Oturumsuz ve üye olmayan kullanıcı | Taslak, sürüm, üye, medya, başvuru ve denetim kayıtlarını okuyamaz; kayıt RPC'sini kullanamaz. |
| Roller | Editör taslak kaydedebilir; yayımlama, yayından kaldırma ve kullanıcı yetkisi ataması yapamaz. Yönetici kullanıcı rolü atayamaz; hesap sahibi atayabilir. |
| Doğrudan veri değişikliği | İçerik, yayın, sürüm, başvuru, üyelik ve denetim tablolarındaki denetimsiz UPDATE/DELETE işlemleri hesap sahibine de kapalıdır; izinli değişiklikler RPC üzerinden geçer. |
| Sahte JWT metadata | `user_metadata.role` ve `app_metadata.role` içine owner yazılması üyelik yetkisi kazandırmaz. Yetki, aktif üyelik tablosundan okunur. |
| Yetkinin iptali | Kullanıcının üyeliği pasife alındığında aynı kullanıcı kimliğiyle taslak/medya okuma ve Storage yükleme girişimi engellenir. |
| Son hesap sahibi | Son aktif owner hesabı düşürülemez veya pasife alınamaz. |
| Taslak / yayın ayrımı | Kaydedilen yeni taslak yayınlanan kopyayı değiştirmez. Yayımlama mevcut revizyonu kopyalar. Yayından kaldırma public kaydı kaldırır. |
| Çakışma | Eski revizyonla kaydetme, yayımlama, başvuru güncelleme ve arşivden çıkarma reddedilir. |
| Sürüm / arşiv | Sürüm geri alma yeni taslak oluşturur. Arşivlenmiş sayfa editör tarafından geri alma yoluyla açılamaz. Arşivden çıkarma kendiliğinden yayımlamaz. |
| Korunan içerik | Ana sayfa, genel ayarlar ve aktif test yayından kaldırılamaz. Mevcut sayfanın adresi/türü değiştirilemez. |
| Belge yapısı | Geçersiz şablon, bölüm/grup yapısı, aşırı sayıda öğe ve yasak içerik ifadesi reddedilir. |
| Aktif test | 5 katman, 20 soru, katman başına 4 soru, soru başına 4 seçenek, 1–4 tam sayı puan ve sıralı sonuç eşikleri doğrulanır. |
| Medya | Üye olmayanlar yükleyemez; başka kullanıcı adına metadata oluşturulamaz; Storage nesnesi olmadan metadata kabul edilmez. URL değiştirme, fiziksel silme ve mevcut nesneyi üzerine yazma kapalıdır. Arşivleme açıklamayı güncelleyebilir, yayınlardaki URL'yi korur. |
| Başvurular | Yalnızca sunucu rolü başvuru ekleyebilir. Editör başvuruları okuyamaz/güncelleyemez. Saatlik e-posta limiti, revizyon ve işlem kaydı doğrulanır. |
| Form handler | Yanlış/eksik origin, yanlış yöntem, JSON olmayan/bozuk/büyük gövde, honeypot, geçersiz alanlar, eksik güvenilir IP ve başarısız captcha reddedilir. Başarılı cevap kayıt sonrası; rate-limit 429 ve kayıt hatası 503 döner. Sağlayıcı hata ayrıntıları istemciye sızmaz. |
| Davet handler | Geçersiz oturum, owner olmayan/pasif üyelik, owner daveti ve izin verilmeyen dönüş origin'i reddedilir. E-posta daveti başarılı fakat rol ataması başarısızsa başarı iddiası yerine kullanıcı UUID'siyle kısmi hata döner. |

## Kod ve doküman incelemesi

CMS tablolarında RLS etkindir. Public RPC'ler `SECURITY INVOKER`; yetkili uygulamalar API'ye açılmayan `cms_private` şemasında, sabit boş `search_path` ve veritabanı üyeliği denetimiyle çalışır. Fonksiyon çalıştırma izinleri açıkça sınırlandırılmıştır. Servis anahtarı sadece Edge ortam değişkeninden alınır. Storage bucket'ın yüklenen dosyaları anında erişilebilir kılan public niteliği kurulum belgesinde açıklanmıştır; özel müşteri dosyaları için uygun değildir.

Supabase changelog ve aşağıdaki güncel resmi belgeler 12 Ekim 2026 tarihinde incelendi. Yeni tabloların Data API'ye otomatik açılmasını kaldıran değişiklik açısından migration'ın açık GRANT ifadeleri kontrol edildi. Bu uygulama ilgili `ltree`, eski şifreleme cipher'ları, Realtime şema değişiklikleri veya kaldırılan logs API'sini kullanmıyor.

- [Supabase changelog](https://supabase.com/changelog.md)
- [Data API açık izin değişikliği](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Edge Function authentication](https://supabase.com/docs/guides/functions/auth)

## Canlı kurulumda tamamlanması gereken doğrulamalar

Bunlar başarısız test sonucu değil, seçili/bağlı proje olmadığı için **çalıştırılmamış** kontrollerdir:

1. Seçilen projede migration, başlangıç içeriği ve doğrulanmış ilk owner kurulumu; Security/Performance Advisors çıktıları.
2. Gerçek owner/admin/editor oturumlarıyla giriş, davet kabulü, şifre yenileme, çıkış ve pasife alınmış üyelik.
3. Taslak kaydetme → başka oturumda kalıcılık → yayımlama → site HTML/metadata/sitemap değişimi → eski revizyon çakışması → sürüm geri alma akışı.
4. Gerçek Storage upload, metadata kaydı, medya seçimi ve arşivleme; dosya boyutu/MIME kuralları ve başarısız metadata kaydının yeniden denenmesi.
5. Auth gateway JWT ayarı, gerçek CORS origin listesi, izinli callback ve SMTP teslimatı. Denetimde kimseye davet veya test e-postası gönderilmedi.
6. Form Edge Function kurulumu, güvenilir istemci IP header'ının platformda doğrulanması, captcha yapılandırması ve gerçek başvurunun panelde görünmesi. `leadsEnabled` bunlar tamamlanmadan açılmamalı.

Bu rapor tarayıcı arayüzü kullanılabilirlik testi, gerçek Supabase uçtan uca testi veya Lighthouse raporu değildir. Bunların yerine puan veya başarı iddiası üretilmemiştir.
