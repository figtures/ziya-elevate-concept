# İçerik yönetimi

Panel: `/admin/`. Kayıt işlemi yalnız taslağı değiştirir; yayınlama, ziyaretçilerin gördüğü sürümü günceller. Editör taslak hazırlayabilir, yönetici/sahip yayınlayabilir. Geçmiş sürümleri geri alma yeni taslak oluşturur.

| İçerik | Paneldeki konum | Kontroller |
| --- | --- | --- |
| Ana menü ve alt menüler | Menü ve alt bilgi → Menü yapısı | Bağlantı ekleme, sayfa seçimi, sıra, alt menü, gizleme, yeni sekme |
| Mobil menü, sosyal bağlantılar | Menü ve alt bilgi → Menü yapısı | Ayrı listeler, görünürlük, sıra ve hedef adres |
| Alt bilgi | Menü ve alt bilgi → Menü yapısı | Grup başlıkları, sütun/yatay yerleşim, grup sırası, bağlantılar |
| Marka ve diğer ortak metinler | Menü ve alt bilgi → İçerik | Menü düğmesi, marka ve alt bilgi metinleri |
| Makale ve not listeleri | Yazı sıralaması veya Makaleler/Hayattan notlar → Kategori ve sıralama | Kategori ve yazı sırası, sürükle bırak, klavye ile taşıma, kategori değişimi, gizleme, liste başlığı ve etiket |
| Makale, kitap, konuşma ve eğitim içerikleri | İlgili bölüm → İçerik | Metin, görsel, video, link, bölümler, maddeler, çoğaltma, sıra ve görünürlük |
| Açılış videoları | Ana sayfa → İçerik / Video ve etkileşimler | TEDx kimliği ve klip saniyeleri; devam video listesini ekleme, kaldırma ve sıralama |
| Sabit iletişim düğmesi | Menü ve alt bilgi → Video ve etkileşimler | Metin, bağlantı, göster/gizle |
| İletişim formu | İletişim → Video ve etkileşimler | WhatsApp numarası, gönderme ve durum mesajları, bilgilendirme |
| Kafa Yapısı Testi | Kafa Yapısı Testi → Test soruları / Video ve etkileşimler | 20 soru, yanıtlar, puanlar, katmanlar, sonuç eşikleri, ekran ve rapor metinleri |
| SEO | Sayfa → SEO & adres | Başlık, açıklama, paylaşım görseli ve açıklaması, index/noindex |
| Medya | Medya arşivi | Görsel/video yükleme, arama, alternatif metin, arşivleme |
| Talepler | Gelen talepler | Arama, durum, takip notu |
| Ekip | Ekip ve yetkiler | Sahip tarafından kullanıcı daveti, rol ve etkinlik yönetimi |

Menü bağlantı denetimi, kırık site içi hedefleri ve menü/alt bilgide doğrudan yer almayan sayfaları gösterir. İkinci liste uyarı niteliğindedir; sayfa içerik içindeki bir bağlantıyla erişilebilir olabilir.

Makale sıralaması SEO başlığından bağımsızdır. Gizlenen veya listeden çıkarılan yazı otomatik ekleme tarafından geri getirilmez. Yeni yayımlanan yazılar, otomatik ekleme açıksa ilk görünür kategoriye adres sırasıyla eklenir. Taslaklar ziyaretçi arşivinde gösterilmez. Kaldırılan yazıları yeniden seçmek mümkündür.

Önizleme, seçili taslağı yayındaki ortak menü ve yayımlanan yazı listesiyle birleştirir. Menü taslağı önizlenirken yayındaki ana sayfa kullanılır. Güvenli önizleme içinde formlar, bağlantılar ve video oynatımı çalıştırılmaz.

Noindex sayfalar erişilebilir kalır; sitemap ve llms.txt listelerinden çıkarılır. Bir belge başka bir kullanıcı tarafından değiştirilmişse kayıt reddedilir ve eldeki taslak korunur.

## 13 Ekim 2026 doğrulaması

- 37 yönetim iş akışı; 64 belge, 5.737 katalog alanı, 178 bölüm editörü.
- Menü, arşiv, etkileşim ve nihai sunucu çıktısı için DOM ve çalışma zamanı kontrolleri.
- 291 yerel SQL izin/ret kontrolü ve 36 Edge Function kontrolü.
- Canlı Supabase üzerinde 7 belge türünde 24 kayıt/yayın/izin/revizyon kontrolü; işlemler geri alındı. 64 yayımlanmış belge korundu, deneme kullanıcıları kalmadı.
- Supabase güvenlik ve performans danışmanlarında ERROR/WARN yok.
- Görsel tarayıcı testi bu ortamda yapılamadı; DOM/çalışma zamanı testleri görsel değerlendirme yerine geçmez.

Yeni migration `20261013083441_advanced_cms_controls.sql`, yönetim API’si tarafından `20261013084830` sürümüyle kaydedildi. Canlıya mevcut içerik tohumu yeniden yüklenmedi.
