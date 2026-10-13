# Kamuya açık GEO keşif katmanı — 12 Ekim 2026

Bu rapor, önceki `geo-playbook-audit-2026-10-12.md` raporunun özel erişim ve `llms.txt` kararlarını günceller. Kullanıcı bu turda dış erişimin açılmasını ve SEO/GEO/AEO çalışmasının sürdürülmesini açıkça istedi. Bu nedenle önceki rapordaki “public yayın için kullanıcı kararı yok” engeli artık geçerli değildir. Bu kayıt; bağımsız editör, hukuk uzmanı veya müşteri adına üretilmiş bir onay değildir.

## Yayın adresi ve veri kaynağı

- Mevcut kamuya açık hedef: `https://ziya-sakir-yilmaz-keynote.dev-busraaktas.chatgpt.site`.
- Yerel üretici çalışma anında `cms/config.json` içindeki açıkça seçilmiş canonical origin'i kullanır. `ziyasakiryilmaz.com` alan adına örtük dönüş yapmaz.
- Önceki özel erişim engelinin kalktığına ait gerçek, kimlik doğrulamasız HTTP başlangıç kaydı: `public-audit/live-baseline.json`. Bu başlangıç kaydında eski `.com` canonical'ı hâlâ görülmektedir; düzeltme sonrası kanıtla karıştırılmamalıdır.
- Keşif veri kaynağı yalnız `cms_published` veya kurulum kipindeki yayımlanmış seed'dir. Taslak/revision/lead/kullanıcı tabloları okunmaz.

## Uygulanan keşif sözleşmesi

`cms/discovery.mjs` bu projenin mevcut sayfa yapısına göre seçilmiş 23 bağlantı üretir. Ana sayfa ve biyografi, altı ana konu, keynote/eğitim/mentorluk, kitaplar/yazı arşivleri/sözlük/araştırmalar/bülten ve test/iletişim akışı kapsanır. Makale ve notların tüm içeriği ilgili arşiv bağlantılarından bulunur; ikinci bir sitemap kopyası üretilmez.

| Kontrol | Davranış |
|---|---|
| Yayın anahtarı | `publicDiscoveryEnabled` tam olarak `true` değilse 404; cache kapalı |
| Canonical origin | HTTPS, kimlik bilgisi/parametre/fragment/path/özel port olmaması; localhost/IP/özel kullanım alan adları reddedilir |
| Bağlantı kapsamı | Yalnız tanımlı rehber rotaları ve yayımlanmış kayıtlarda mevcut olanlar; keyfî feed URL'leri kabul edilmez |
| Kapsam dışı kayıt | `noindex`, draft/archived, admin/API, emekli testler ve query içeren yollar çıkarılır |
| İçerik | Başlıklar CMS kaydından alınır; HTML temizlenir, Markdown kaçışları uygulanır, UTF-8/NFC korunur |
| Determinizm | Feed sırası değişse de çıktı byte düzeyinde aynıdır; build zamanı veya sahte içerik güncelleme tarihi basılmaz |
| Bütçe | En fazla 200 bağlantı ve 100 KiB; aşımda sessiz kırpma yapılmaz |
| Cache | İçerik SHA-256 ETag, koşullu 304, HEAD desteği, `max-age=0, must-revalidate` |
| Fallback | Son doğrulanmış artifact deposu olmadığı için üretim/veri kaynağı arızasında kontrollü 404; boş dosyaya 200 yok |
| Gizlilik | İçerik indeksi hiçbir secret, admin kaydı, kişisel talep veya erişim tokenı okumaz |

İlk yerel üretim **23 bağlantı, 3.228 UTF-8 byte**. Bu boyut içerik başlıkları yönetim panelinden değiştikçe değişebilir. Yayından kaldırılan bir kayıt sonraki üretimden çıkar; dosya elle kopyalanıp eski tutulmaz.

## Tekrar çalıştırılabilir kontroller

```bash
node scripts/check-discovery.mjs
node scripts/check-discovery.mjs --live
```

Yerel üretici ve Fetch Response sözleşmesi için **38 kontrol PASS**: yayın bayrağı, yanlış/özel origin, aynı girdi kararlılığı, yayımdan kaldırma, noindex/draft/archived, duplicate conflict, Markdown/HTML enjeksiyonu, özel URL dışlama, bütçe ihlalleri, UTF-8, 200/304/HEAD ve ETag değişimi.

`--live` yalnız açıkça çağrıldığında ağ isteği yapar. Yayımdaki `llms.txt` dosyasını ve listelediği URL'leri kimlik doğrulamasız GET ile denetler: doğrudan 200, text/html, self-canonical, noindex olmaması, SSR H1; ayrıca llms MIME/boyut/link bütçesi, OAI-SearchBot user-agent ile çıktı eşitliği ve ETag 304 kontrolü. Ham sonuç dosyası `public-audit/discovery-http.json` olur. Bu dosya oluşmadan canlı kontrol geçmiş sayılmaz. User-agent değişimi gerçek OpenAI IP'sinden gelen trafik, WAF allowlist veya bot kimliği doğrulaması değildir.

**Canlı sonuç: PASS.** 12 Ekim 2026, 00:50:08–00:50:21 UTC arasında public deployment `ed156f7e492b738ecee972503eb17f3de478e5e4` üzerinde komut gerçekten çalıştırıldı. 23/23 bağlantı doğrudan 200, self-canonical ve indexable; tümünde SSR H1 mevcut. `llms.txt` 3.228 byte UTF-8, doğru MIME, OAI-SearchBot user-agent eşliği ve ETag koşullu 304 kontrollerini geçti. Kanıt: [discovery-http.json](./public-audit/discovery-http.json).

## Bot politikası ayrımı

Arama erişimi ile temel model eğitimi aynı karar değildir. Kullanıcının dış erişim talebi kamuya açık site ve arama/cevap keşfine yeterli bağlam sağlar; sıralama elde etmek için eğitim botlarına özel, yeni bir izin kuralı yazmak gerekmez. Robots kuralları root uygulamada tutulur; keşif üreticisi botlara farklı içerik sunmaz ve bot kimliği ile yetki kontrolünü atlamaz. `robots.txt` admin güvenliği değildir; API ve panel yetki kontrolleri ayrıca korunmalıdır.

Güncel birincil kaynaklar:

- [Google — AI özellikleri ve site gereksinimleri](https://developers.google.com/search/docs/appearance/ai-features): görünür metin, erişilebilir içerik ve structured-data uyumu temel gereksinimlerdir. Yeni bir “AI schema” veya AI dosyası Google görünürlüğünün şartı değildir.
- [OpenAI — crawler açıklamaları](https://developers.openai.com/api/docs/bots): `OAI-SearchBot` arama, `GPTBot` model eğitimi, `ChatGPT-User` kullanıcı tarafından başlatılan istek amaçlarıyla ayrılır.
- [llms.txt önerisi](https://llmstxt.org/): dosya, ayrıntılı içeriğe yol gösteren seçici Markdown rehberidir; robots politikasının veya sitemap'in yerine geçmez.
- [Notion GEO-06](https://www.notion.so/3ea1fd693ee0808fb11fc496576c424d): kaynak snapshot'ı `geo/notion-geo06.json`; boyut/URL bütçesi, deterministik üretim, güvenli fallback, MIME ve koşullu cache kontrolleri bu uygulamada karşılanır.

## Hangi sonuçlar bundan çıkarılamaz?

Bu çalışma arama motorunun sayfaları indekslediğini, bir modelin alıntıladığını, müşteri getirdiğini veya Notion'ın on adımlı işletim programının tamamlandığını göstermez. Eksik erişimi kod açığı gibi adlandırmadan şu kontroller ayrı kanıt ister:

1. Search Console/Bing doğrulaması, URL inspection ve gerçek index coverage; hesap veya DNS sahipliği gerekir.
2. Gerçek crawler IP/rDNS ve CDN/WAF istek kayıtları; yalnız user-agent değiştirilerek doğrulanamaz.
3. Sosyal hesap sahipliği ve dış profil/domain eşleşmesi; biyografi/araştırma/kitap iddialarının birincil kaynak doğrulaması ve yetkili editör değerlendirmesi.
4. Gerçek konuşma transcript/caption içerikleri; bir videonun görsel karelerinden güvenilir konuşma metni uydurulmaz.
5. En az iki model/yüzeyde sürümlü prompt seti, gerçek alıntı sonuçları ve tekrarlar; önceki 50 soruluk taslak çalıştırılmış sonuç değildir.
6. Gerçek tarayıcı Lighthouse ve üçüncü taraf validator çıktıları; yerel parse/HTTP testleri bu raporların yerine geçmez.

Bu maddeler için sahte başarı ölçümü, otomatik onay veya uydurma insan incelemesi üretilmedi. İlk rapordaki 196 maddelik kapsam matrisi korunur; bu teknik güncelleme bütün programı “tamamlandı” diye kapatmaz.

## Geri dönüş

Keşif dosyasını durdurmak için `publicDiscoveryEnabled` kapatılır; endpoint 404/no-store döner. Ana sayfalar, sitemap ve admin bu bayrağa bağlı değildir. Hatalı yayın rotası kaynaktan çıkarıldıktan sonra üretici + canlı HTTP testleri tekrar çalıştırılır. ETag içerikle değişir. Kayıt, artifact ve deployment geçmişi korunur; gerçekleşmemiş rollback tatbikatı için RTO veya PASS yazılmaz.
