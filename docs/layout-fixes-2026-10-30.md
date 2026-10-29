# Layout düzeltmeleri ve kalan işler — 30 Ekim 2026

Kapsam: `/en/speaker/` ekran görüntüsündeki kart oranları, fazla boşluklar ve kesilen içerik. Ortak bileşen düzeltmeleri Türkçe sayfalara ve CMS önizlemelerine de uygulanır. Onaylı lacivert/krem tasarım, içerikler ve ana sayfadaki beş sayaç korunur.

## Düzeltilenler

- [x] Konuşma kartlarında kaynak görsel yüksekliğinin kart oranını bozması giderildi: `height:auto` ve blok yerleşimi ile kartın oranı uygulanıyor. Yükleme sırasında yer ayıran gerçek boyut nitelikleri korunuyor. CMS kadrajı seçildiğinde sarmalayıcının oranı ve `height:100%` kuralı geçerliliğini koruyor.
- [x] CMS'nin eklediği `main#main-content` kapsayıcısı bölüm boşluğu seçicilerine dahil edildi. Ardışık krem bölümlerde iki büyük boşluğun toplanması önlendi.
- [x] Konuşmacı sayfasının kısa bağlantı şeridi kompakt bölüm boşluğuna alındı; genel bölüm kuralıyla özgüllük çakışması giderildi.
- [x] Bölüm ve satır animasyonlarının aşağı hareketinin üst üste binmesi kaldırıldı. Bölüm/başlık hareketleri mevcut alt boşlukla, satırların yatay hareketi tablet ekranındaki iç boşlukla sınırlandı; kesilen içerik için taşmanın nedeni giderildi. Kaydırmaya bağlı hareket ve azaltılmış hareket desteği korunuyor.
- [x] Son öğe olan tanıtım bloğunun fazladan alt marjı kaldırıldı.
- [x] İletişim formu ve yanındaki tanıtım üstten hizalandı; dar kolonların taşmasını önleyen genişlik kuralları eklendi.
- [x] Konuşma accordion başlıklarının orta kolonu `minmax(0,1fr)` yapıldı. İlk açık accordion başlığı kaynakta ve CMS çıktısında mevcut; bu başlığın ekran görüntüsündeki kaybının ayrı bir tarayıcı nedeni doğrulanmadı.
- [x] İngilizce konuşmacı sayfasındaki iki ortak Türkçe arayüz metni çevrildi. Özel CMS metinleri ve konuşmaların özgün Türkçe adları korunuyor.

## Doğrulama

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `node scripts/check-spacing.mjs`: 65 kaynak ve 65 CMS sayfası; 375, 768, 1440, 1920 px genişliklerde CSS cascade kontrolü; Türkçe/İngilizce CMS kadrajları dahil 96 konuşma görseli kontrolü.
- [x] `node scripts/check-motion-chapters.mjs`: 10 kontrol grubu, 63 şablon; 0/12/80 px dikey ve 0/12/32/48 px yatay boşluklarda hareket sınırı, yaşam döngüsü, azaltılmış hareket ve sayaç koruması.
- [x] `node scripts/check-counters.mjs`
- [x] `node scripts/check-disclosure-motion.mjs`: 10 kontrol.
- [x] `node scripts/check-public-navigation-motion.mjs`: 6 kontrol.
- [x] Kaynak ve public CSS kopyaları eşleşiyor; üretim bundle'ları yeniden oluşturuldu.
- [ ] Bu revizyonun tarayıcıda önce/sonra görsel karşılaştırması ve ölçülmüş CLS değeri. Bağlı tarayıcı zaman aşımına uğradı; bulut tarayıcısı başlatılamadı. CSS/DOM ve animasyon sözleşmesi kontrolleri gerçek tarayıcı ölçümü olarak sunulmuyor.

## Hâlâ gerekenler

| İş | Durum ve gerekli tamamlayıcı |
| --- | --- |
| Özel üretim domaini | `ziyasakiryilmaz.com` DNS sorguları SERVFAIL dönüyor; yetkili sunucu yanıtları REFUSED/lame delegation bildiriyor. Registrar ad sunucuları, Cloudflare zone ve Worker özel domain bağlantısı doğrulanıp düzeltilmeli. Worker önizlemesinde `noindex,nofollow` kalması doğrudur; özel domain erişilebilir olmadan SEO yayını tamamlanmış sayılmaz. |
| Onaylı referans yorumları | Yorum modülü/admin yönetimi hazır. Gerçek alıntı, ad, görev ve kurum bilgileriyle en az dört onaylı referans gerekli. Doğrulanmamış taslak sözler gerçek referans olarak yayınlanmıyor. |
| Gerçek showreel | 75–90 saniyelik sesli, onaylı kayıt gerekli. Dört TEDx kaydı mevcut; kısa sessiz klipler showreel olarak sunulmuyor. |
| Eğitim bilgisi belgeleri | ODTÜ/MBA gibi iddiaların eklenmesi için resmi kaynak gerekli; doğrulanmayan unvanlar biyografi ve medya kitine geri eklenmedi. |
| Son kabul kontrolleri | Gerçek iPhone Safari/Android, işletim sistemi azaltılmış hareket tercihi, mobil blueprint ilk görünümü, eş koşullu sayaç karşılaştırması ve brief §41 zamanlı okuma senaryosu için eksik kanıtlar tamamlanmalı. Bunlar tamamlanmış özellik sayısından ayrı değerlendirilir. |

Önceki ayrıntılı kabul kaydı: [V13 revizyon checklist](v13-revision-checklist-2026-10-26.md). Eski test kayıtları bu revizyon için yeniden yapılmış canlı panel testi gibi değerlendirilmemelidir. Bu değişiklik Supabase içeriğine veya kullanıcı hesaplarına yazmaz.

Yayın yolu: normal GitHub `main` commit'i → mevcut Cloudflare CI/CD. Manuel Worker deploy kullanılmaz. Yayın sonucu, commit kontrolü ve sunulan CSS/JS içerikleri ayrıca kontrol edilir; bunlar tarayıcı görsel kontrolünün yerine geçmez.
