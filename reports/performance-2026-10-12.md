# Video ve kaynak performansı denetimi — 12 Ekim 2026

Bu rapor kaynak kodu, dosya boyutları, medya meta verileri ve gerçek hero JavaScript'ini çalıştıran VM senaryolarına dayanır. Lighthouse veya tarayıcı ölçümü değildir; LCP, INP, CLS ve performans puanı bu kontrollerden hesaplanamaz. Canlı PageSpeed/Lighthouse sonuçları ayrı canlı denetimde ele alınır.

## Giderilen sorunlar

- İlk native video oynadıktan sonra `preload=auto` üzerinde kalıyordu. Artık her video geçişinde yalnızca oynatılması istenen aktif video `auto`, diğerleri `metadata` olur. Duraklatma, sekmenin gizlenmesi, sayfa dışına kaydırma ve menü/modal açılması da `auto` önceliğini kaldırır. `preload` tarayıcıya ipucudur; daha önce indirilmiş veriler geri alınmaz ve indirme durması tüm tarayıcılarda garanti edilmez.
- Hareket azaltma tercihi veya gizli sekme durumunda oynatılmayacak YouTube oynatıcısı erkenden yükleniyordu. API ve iframe, ancak görüntü görünür ve oynatma isteniyorsa oluşturulur. Normal görünür açılışta otomatik oynatma korunur.
- İlk TEDx kaydı tamamlandıktan sonra gizli YouTube iframe'i sayfada kalıyordu. Native videonun `playing` olayı geldiğinde iframe kaldırılır. Geçiş başlayana kadar TEDx'in son karesi korunur.
- Intro kontrolü, video duraklatılmışken de her 100 ms'de çalışıyordu. Artık yalnızca intro oynatılmak istendiğinde çalışır ve intro tamamlanınca sonlandırılır.
- Native otomatik oynatma reddedildiğinde artık yalnızca buton etiketi değil, tüm oynatma/ön yükleme durumu senkronize edilir.

TEDxReset `00:31–00:35` bölümü ilk açılışta bir kez oynar. Ardından sahne ve uluslararası klipler dönüşümlü oynar. Menü, modal, sekme, sayfa dışına kaydırma ve geç YouTube yanıtları intro'yu yeniden başlatmaz. Tam ekran kadraj, mevcut video dosyaları ve çözünürlükleri korunmuştur.

## Doğrulama

Komut: `node scripts/check-hero-sequence.mjs` — **PASS**.

Test, yayımlanan `public/assets/tedx-hero.js` dosyasını VM içinde çalıştırır ve kaynak kopyasıyla aynı olduğunu doğrular. Senaryolar:

1. Intro başlangıç/bitiş saniyeleri ve intro sırasında native videoların durması.
2. Bir kez intro, dört tam native döngüsü; her geçişte aktif/inaktif ön yükleme.
3. İlk native görüntü geldiğinde iframe'in bir kez kaldırılması.
4. Intro bittikten sonra gelen YouTube bitiş ve hazır olma olayları.
5. Elle duraklatma/devam etme; viewport, menü, modal ve sekme görünürlüğü.
6. Hareket azaltma açıkken sıfır YouTube isteği/oynatıcısı ve sıfır polling; kullanıcı oynatınca başlama.
7. Gizli sekmede sıfır YouTube isteği; API'nin menü açıkken dönmesi halinde iframe oluşturmama.
8. API ağ hatasında native video ile devam etme ve geç API yanıtının intro'yu başlatmaması.
9. Oynatma istenirken sekiz saniye ilerleme olmazsa native videoya geçiş; ekran dışındaki süreyi bu süreye saymama.
10. YouTube autoplay reddi, hatalı native klibi atlama ve tüm klipler hata verdiğinde durma.
11. Sistem hareket tercihi değişikliği ve native `play()` reddi sonrası tutarlı duraklatma.

## Kaynak envanteri

| Kaynak | Mevcut ölçü | Değerlendirme |
|---|---:|---|
| Ana sayfa hero AVIF kapağı | 1.600 × 900; 13.449 bayt | Preload ve `fetchpriority=high` mevcut. İlk görüntü için hafif kaynak. |
| Sahne videosu | 2.560 × 1.440; 11 sn; 13.189.706 bayt; yaklaşık 9,59 Mbps | H.264, ses kanalı yok; `moov` dosya başında. Çözünürlük düşürülmedi. |
| Uluslararası video | 1.920 × 1.080; 8,98 sn; 11.376.989 bayt; yaklaşık 10,14 Mbps | H.264, ses kanalı yok; `moov` dosya başında. Çözünürlük düşürülmedi. |
| 54 alt sayfanın sahne kapağı | 2.560 × 1.440; 358.498 bayt JPEG | Aynı ölçüde modern format türevi, ilk açılış için somut optimizasyon adayı. |
| Uluslararası klip kapağı | 164.098 bayt JPEG | Modern format türevi adayı. |
| Ana sayfada 8 CSS dosyası | Toplam 105.392 bayt; bağımsız gzip toplamı 26.272 bayt | Bunlar diskten hesaplanan boyutlardır; gerçek transfer/ağ gecikmesi değildir. |
| Fontlar | Yaklaşık 180 KiB; yerel variable WOFF2, Latin ve Latin Extended alt kümeleri | `font-display:swap` mevcut; yalnızca kullanılan alt kümeler tarayıcı tarafından yüklenir. Manrope Latin ve Türkçe alt kümeleri preload edilir. |

Görsel ölçüleri Pillow ile yalnızca okunmuş; video özellikleri `ffprobe` ile incelenmiştir. Bu çalışma içinde görsel/video dönüştürülmemiş ve 8K üretildiği iddia edilmemiştir.

## Kalan ölçüm ve iyileştirme alanları

- Native autoplay videoları 9,6–10,1 Mbps veri hızına sahiptir. Aynı çözünürlükte alternatif codec/bitrate çalışması ancak görüntü kalitesi karşılaştırılarak değerlendirilmeli; yalnızca skor uğruna kullanıcının tam ekran kaliteli video talebi bozulmamalıdır.
- JPEG kapakların aynı boyutlarda AVIF/WebP türevleri ve CMS'de görsel değişince eski türevin kalmasını önleyen render mantığı birlikte ele alınmalıdır.
- İlk görünümdeki videolar lazy-load edilmemelidir. Aşağıdaki görseller için lazy loading; görünür videolar için oynatma, sekme/viewport dışında duraklama zaten bulunur.
- Statik CSS birleştirme kararı, gerçek Lighthouse waterfall ve kullanılmayan CSS ölçümünden sonra verilmelidir. Ölçüm olmadan sırf dosya sayısını azaltmak için mevcut CSS sırası değiştirilmeyebilir.
- Browser/Lighthouse ölçümü olmadan mobil pil tüketimi, gerçek bant genişliği, görsel geçişin pikselleri veya Core Web Vitals doğrulandı sayılamaz.

Birincil başvuru: [web.dev — Lazy loading video](https://web.dev/articles/lazy-loading-video), [web.dev — video ve source etiketleri](https://web.dev/articles/video-and-source-tags). Bu kaynaklar LCP video kapağının önceliklendirilmesini, görünür ilk videonun lazy-load edilmemesini ve video `preload` davranışının sınırlarını açıklar.
