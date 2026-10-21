# Kitaplar, referanslar ve yorum yönetimi

## Teslim kapsamı

- [x] Dört kitap için aynı ışık ve kadraja sahip stüdyo görselleri. Kurşun Geçirmez Kafa Yapısı için kullanıcının gönderdiği görsel kullanıldı; diğer üçü gerçek kapaklar temel alınarak üretildi. Kaynak istemler `content/book-studio-prompts.json` içinde.
- [x] Anasayfa, kitap arşivi ve Başarı Mühendisliği sayfasındaki dokuz görsel kullanımı güncellendi. Görseller 1448 × 1086; 8K olarak etiketlenmedi.
- [x] Başlıklardaki çok renkli gradient kaldırıldı. Düz lacivert/krem metin, mevcut scroll animasyonları ve gold hero sayaçları korundu.
- [x] Gönderilen PowerPoint'teki 31 gerçek logo yerel varlıklara alındı. Adlar ve kaynaklar `content/reference-logos.json` içinde.
- [x] Hero sonrasında bulanık kenarlı, duraklatılabilen, mobil uyumlu logo şeridi. Azaltılmış hareket tercihinde sabit düzen; JavaScript olmadan okunabilir logo listesi.
- [x] Yorum alanı dört çalışma alanından hemen önce yerleşir. Onaylı yorum yoksa ziyaretçiye boş bölüm gösterilmez.
- [x] Panelde Referanslar ve Yorumlar kısayolları; ekleme, kaldırma, sıralama, görünürlük, metin, bağlantı ve medya arşivi seçimi.
- [x] Yedi ad için metin önerileri özel taslak kaydına hazırlandı. Bunlar gerçek alıntı değildir. İlgili kişinin doğruladığı metin girilip onaylandıktan sonra yayınlanır. İsim, unvan, kurum veya yorum değişikliği onayı sıfırlar.
- [x] Veritabanı yayını taslak/gizli yorumları herkese açık kayıttan çıkarır; özel taslakları korur.

## Yapı ve kontroller

Proje TypeScript, Tailwind CSS ve shadcn alias yapısını zaten kullanıyor. Bileşen yolu `components/ui`, yardımcı `lib/utils.ts`, ana stil girişi `app/globals.css`. `ProgressiveBlur`, `InfiniteSlider` ve `LogosSlider` bu yapıda bulunur. HTML sunan ziyaretçi rotaları için bağımsız React island kullanılır; genel sayfa stilleri sıfırlanmaz. `motion@14.5.0`, mevcut `framer-motion@14.5.0` ve `react-use-measure@2.1.7` kullanılır.

Doğrulamalar: production build, hedefli TypeScript kontrolü, 11 referans/yorum testi, 52 admin iş akışı, 14 ortak kitap kontrolü, 65 CMS belge kontrolü, 64 sayfa kaynak ve SEO kontrolü, 26 renk kontrastı kontrolü. Veritabanı geçişi ve taslak/yayın izolasyonu önce geri alınan transaction içinde denendi.

Yayın geçişi üç belgeyle sınırlıdır. Mevcut alan kimlikleri, içerik ve kayıtlı bölüm görünürlüğü korunur. SQL satır kilitleri ve tam sürüm/içerik eşitliği kontrolü kullanır. Eşzamanlı değişiklikte tüm işlem durur. Yeni şema geçişi `20261022160000_cms_references_testimonials.sql`, içerik geçişi `20261022-books-references.sql` dosyasındadır.

Yerel Chromium bulunmadığından bu tur ekran görüntüsü veya gerçek tarayıcı kabul testi yapıldığı iddia edilmez. Derleme ve DOM kontrolleri görsel kabulün yerine geçmez.
