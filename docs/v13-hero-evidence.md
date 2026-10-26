# V13 hero video kontrolü

Hero videosu, mevcut gerçek sahne kayıtlarındaki dört temiz çekimden oluşturuldu. Dört planın her biri **2,75 saniye**, toplam döngü **11,00 saniye**. Geçişler 2,75, 5,50 ve 8,25 saniyede sert kesmedir; döngü sonunda ilk plana dönülür.

| Plan | Kaynak kare aralığı | Kaynak süre | Çıktı zaman aralığı |
| --- | --- | --- | --- |
| TEDx geniş plan | 6–26 | 0,875 sn | 0,00–2,75 sn |
| Büyük salon | 40–52 | 0,542 sn | 2,75–5,50 sn |
| Seyirci genel plan | 211–224 | 0,583 sn | 5,50–8,25 sn |
| Ziya sahnede orta plan | 174–188 | 0,625 sn | 8,25–11,00 sn |

Kaynak `hero-loop-v5.mp4`: 1280 × 720, 24 fps. Kaynağın gömülü geçişleri, selfie bölümü ve açılış/kapanış kararmaları kullanılmadı. `klip-uluslararasi.mp4` bütünüyle selfie görüntüsü olduğu için dışarıda bırakıldı. Sahne ve izleyici planları kaynak temas sayfasında tek tek kontrol edildi. Eski temiz montajın başlangıç/bitiş karelerinde kalan gömülü dissolve izleri ayrıca ayıklandı; yeni kesimlerin iki tarafındaki kareler de görsel olarak incelendi.

**Süre ayarı:** Eldeki montajda doğal hızında 2,5–3 saniye süren dört temiz plan yok. Bu nedenle mevcut gerçek karelerin sırası korunarak her plan 2,75 saniyeye yavaşlatıldı. Sabit kare hızında yavaşlatma kaynak kareleri tekrar eder; yapay kare üretimi, hareket interpolasyonu, yeni görüntü veya son kareyi dondurarak uzatma uygulanmadı. Çıktıda saniye başına yaklaşık 4,7–7,6 farklı kaynak kare bulunur; hareket bu nedenle doğal hızından belirgin biçimde yavaştır. Normal hızda aynı süre ve akıcılık için uzun kamera kayıtları gerekir.

Çıktılar:

- `/assets/hero-stage-v13-1080.mp4`: 1920 × 1080 teslim boyutu; 720p kaynaktan ölçekleme.
- `/assets/hero-stage-v13-720.mp4`: 1280 × 720 mobil/ekonomik teslim.

Her iki dosya H.264, 24 fps, 264 kare ve sessizdir. MP4 fast-start açıktır. `scripts/build-v13-hero.py` çıktının kare sayısını, toplam süresini, ses kanalının bulunmadığını ve dosya boyutu bütçesini doğrular. Ayrıntılı kaynak/çıktı SHA-256 değerleri `scripts/v13-hero-manifest.json` içinde bulunur.

**Showreel durumu:** Depodaki bütün video kaynakları sessiz ve en fazla 11 saniyedir. Gerçek 75–90 saniyelik, konuşma cümleleri ve alkış içeren showreel için gerekli kayıtlar mevcut değildir. Briefin teslim koşuluna göre hazır olmayan showreel bölümü yayında gösterilmemelidir.

Bu çalışma hero metinlerini, sayaçları, sayaç kodunu veya sayfa tasarımını değiştirmez.
