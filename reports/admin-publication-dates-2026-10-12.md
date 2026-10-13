# Yeni içerikte yayın tarihi denetimi — 12 Ekim 2026

## Sorun ve düzeltme

Yeni makale/not oluşturma ve “Çoğalt” akışı, örnek içeriğin görünür yayın tarihlerini de kopyalıyordu. Bu, yeni içeriğin eski makalenin yayın ve son güncelleme tarihleriyle görünmesine, görünür metinden üretilen yapılandırılmış verinin de aynı yanlış tarihleri kullanmasına yol açabiliyordu.

Katalog derleyicisi artık yalnızca yayın bilgisi taşıyan alanları açıkça tanımlar:

- 30 makalede, makale gövdesindeki `.hero-note` yayın/son güncelleme satırı.
- 9 notta, `.page-hero .kicker` içindeki yayın tarihi.

Yeni içerik oluşturulurken bu alanların yayın/son güncelleme parçaları sıfırlanır. Makale tarih satırındaki tarih dışı yazar bilgisi ve not başlığındaki seri bilgisi korunur. Belge, bölüm ve madde seviyesindeki düzenlenmiş değerler de aynı kurala tabidir.

Makale gövdesindeki araştırma tarihleri, tarih içeren alıntılar, yazarın metinleri ve mevcut yayınların tarihleri değiştirilmez. Yeni taslağa otomatik olarak bugün tarihi yazılmaz; oluşturma tarihi ile gerçek yayın tarihi birbirine karıştırılmaz. Kendi yayın bilgileri, admin'in ilgili alanlarından girilebilir.

## Kontrol sonuçları

Gerçek `createDialog` form akışı LinkeDOM içinde çalıştırıldı. Güncel derleyici ayrı geçici klasörde katalog üretti; paylaşılan `cms/catalog.json`, `cms/templates.json`, seed veya derlenmiş admin varlıkları bu test sırasında değiştirilmedi.

`scripts/check-admin-workflows.mjs`: **26 kontrol geçti, 0 başarısız**.

Eklenen regresyonlar:

1. **39 şablonun tamamı:** Yeni makale/not taslağında kaynak yayın tarihleri aktarılmaz; başlık değişikliği dışındaki diğer metin alanları aynen korunur ve seed değişmez.
2. **Düzenlenmiş kaynak çoğaltma:** Bölüm seviyesinde sonradan değiştirilmiş yayın/son güncelleme tarihleri kaldırılır; yazar/seri metni, makale içindeki araştırma tarihleri ve kaynak taslak korunur. Sonuç ayrıca gerçek admin önizleme DOM'unda kontrol edilir.

Bu sonuçlar yerel DOM ve Supabase taklit yanıtlarıyla alınmıştır; canlı Supabase kayıt/yayın veya tarayıcı testi yapıldığı anlamına gelmez.

## Değişen kaynaklar

- `cms/admin.mjs`
- `scripts/build-cms-catalog.py`
- `scripts/check-admin-workflows.mjs`

Dağıtım öncesi katalog ve admin varlıkları normal derleme akışıyla yeniden üretilmelidir.
