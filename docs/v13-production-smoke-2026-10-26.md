# V13 canlı dağıtım HTTP kontrolü — 26 Ekim 2026

Kontrol zamanı: **26.10.2026 21:39:50 TSİ**. Yalnız anonim HTTPS istekleri kullanıldı; oturum çerezi, kullanıcı anahtarı veya yönetici yetkisi kullanılmadı.

- Dağıtılan ana dal commit’i: `98aefcc324c8390446e231137c56a421cb7f428b`.
- Cloudflare production build: `0f7fc25c-c49b-4037-af5d-75691b375e16` — **success**.
- Worker version: `3a9a18da-c4e0-4e21-9773-168ff6e4526c`.
- Doğrulanan adres: https://ziya-sakir-yilmaz.busratechnology.workers.dev/
- Sonuç: **101 kontrol geçti; 0 kontrol başarısız.**

## Sayfa kapsamı

Her satırda HTTP 200, tek H1, doğru production canonical, HTTP `X-Robots-Tag` ve HTML robots ile geliştirme alanında `noindex, nofollow`, iki TR/EN dil seçici ve footer’da Basın bağlantısı doğrulandı. 15 sayfa × 5 koşul = 75 kontrol.

| Rota | HTTP | Beş ortak koşul |
| --- | --- | --- |
| `/` | 200 | Geçti |
| `/basari-muhendisligi/` | 200 | Geçti |
| `/basari/` | 200 | Geçti |
| `/basin/` | 200 | Geçti |
| `/egitimler/` | 200 | Geçti |
| `/en/speaker/` | 200 | Geçti |
| `/kafa-yapisi/` | 200 | Geçti |
| `/kitaplar/` | 200 | Geçti |
| `/konusmaci/` | 200 | Geçti |
| `/kursun-gecirmez-kafa-yapisi/` | 200 | Geçti |
| `/liderlik/` | 200 | Geçti |
| `/mentorluk/` | 200 | Geçti |
| `/satis/` | 200 | Geçti |
| `/testler/kafa-yapisi-testi/` | 200 | Geçti |
| `/ziya-sakir-yilmaz/` | 200 | Geçti |

## İçerik ve kaynak kontrolleri

- Ana sayfa: `/assets/hero-stage-v13-1080.mp4`, başlangıç `0`, bitiş `11`; onaysız yorum bölümü yok; 31 referans logosu mevcut; yeni Kızık/Astana hikâye metni yayında.
- Beş sayaç DOM’da mevcut ve değerler: `600.000+`, `84 ülke`, `5× TEDx`, `4 kitap`, `30 yıl`. Bu HTTP kontrolü animasyon zamanlamasının veya ekrandaki piksel konumunun ölçümü değildir.
- Dört çalışma alanında ilgili `Bilgi Merkezi · 8 başlık` başlığı ve sekiz bilgi konusu mevcut.
- Satış sayfasında `440.000 DOLARLIK DERS` ve distribütörün güven cümlesi mevcut.
- KGKY meta açıklaması V13 briefindeki metinle birebir eşleşiyor.
- Başarı Mühendisliği sayfası `/assets/v13-blueprint.js` script’ini içeriyor.
- Eğitimler sayfasında üç `.v13-program-facts` bilgi grubu mevcut.
- Tarihli dijital etki bilgileri Basın sayfasında; Hakkında sayfasında Favikon bilgisi yok.
- İki yeni hero MP4 dosyası ve blueprint JS dosyası HTTP 200 ile sunuluyor; MP4 yanıt türü `video/mp4`.
- `/sitemap.xml`, `/robots.txt`, `/admin/` HTTP 200; bilinmeyen rota HTTP 404.
- Sitemap’te 65 URL mevcut ve `https://ziyasakiryilmaz.com/basin/` yer alıyor. Canonical alan adı `https://ziyasakiryilmaz.com` olarak korunuyor.

## Açık sınırlar

`https://ziyasakiryilmaz.com/` isteği bu çalışma ortamında Envoy’dan **503 upstream connection failure** döndürdü. Bu, özel alan adının V13 sürümünü sunduğunu doğrulamaz; origin’in genel erişilebilirliği veya kesintisi hakkında kesin sonuç çıkarılmaz. Worker adresinin canlı yayını doğrulandı.

Bu rapor HTTP/SSR kontrolüdür. Tarayıcıdaki hareket, video oynatma, responsive yerleşim, gerçek iPhone Safari/Android, Lighthouse veya oturum açılmış admin kalıcı kayıt işlemlerinin yerine geçmez. Bunların sonucu ayrı checklist’te tutulmalıdır.
