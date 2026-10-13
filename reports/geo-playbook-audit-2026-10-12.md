# Ziya Şakir Yılmaz — GEO uygulama denetimi

Denetim tarihi: 12 Ekim 2026. Bu dosya Notion playbook'u ile mevcut kaynağın karşılaştırılmasıdır; canlı arama görünürlüğü, Lighthouse skoru veya tamamlanmış GEO sertifikası değildir. İncelenen başlangıç sürümü `59aebdfd4dd439e5d9c7999624f6073e5df1bb38`. Aynı çalışma sırasında yapılan teknik düzeltmelerin son durumu ana görevdeki test raporuyla birlikte değerlendirilmelidir.

**Sonuç: GEO-01–10 program kapıları BLOCKED.** Bunun anlamı web sitesindeki yerel düzeltmelerin yapılamaması değil; belgede istenen üretim görünürlüğü ve işletim programının henüz doğrulanmamış olmasıdır. Owner-private önizlemenin erişimi değiştirilmedi. Supabase yapılandırması kapalı; editör panelinin görünmesi canlı yönetim akışının kanıtı değildir. Gerçek Lighthouse, haricî rich-result doğrulaması, crawler/WAF logları ve AI cevap laboratuvarı çalıştırılmış gibi gösterilmedi.

## Kaynakların tamamı okundu

Hub ve on alt sayfa sırayla, tam içerikleriyle okundu. Yanıtlarda truncation veya unknown-block uyarısı yok; bütün içerikler kapanan page etiketi taşıyor. Kaynaklar Notion'da “unverified” durumunda; bu kaynak talimatını yok sayma gerekçesi değildir, yalnız native doğrulama durumudur. GEO-01 sonraki adımların risk keşfine izin verdiğinden GEO-02–10 bu kapsamda incelendi.

| Belge | Son düzenleme (UTC) | Kaynak |
|---|---|---|
| Hub | 2026-10-10 23:25:18.242 | [GEO programı](https://app.notion.com/p/3ea1fd693ee08042a6d5d41d947cfd2c) |
| GEO-01 | 2026-10-04 10:19:33.247 | [Program/RACI/RFC](https://www.notion.so/3ea1fd693ee080eaaff1fdc020e1e1d7) |
| GEO-02 | 2026-10-03 19:26:02.586 | [Entity mimarisi](https://www.notion.so/3ea1fd693ee0801eb182cf82c18aca43) |
| GEO-03 | 2026-10-04 10:19:26.257 | [Crawler/indexability](https://www.notion.so/3ea1fd693ee080458f85c39c71f0bcac) |
| GEO-04 | 2026-10-03 19:33:30.812 | [Kaynaklanabilir içerik](https://www.notion.so/3ea1fd693ee08057b923cbb565bdcf1a) |
| GEO-05 | 2026-10-04 10:19:13.571 | [Intent/konu sahipliği](https://www.notion.so/3ea1fd693ee080dc9606d7298594ac0d) |
| GEO-06 | 2026-10-04 10:19:09.549 | [Schema/llms.txt](https://www.notion.so/3ea1fd693ee0808fb11fc496576c424d) |
| GEO-07 | 2026-10-04 10:19:04.850 | [Güncellik/kaynak zinciri](https://www.notion.so/3ea1fd693ee080178b05df5343b7ef68) |
| GEO-08 | 2026-10-04 10:19:00.835 | [Üçüncü taraf doğrulama](https://www.notion.so/3ea1fd693ee080fab746cd3813461d25) |
| GEO-09 | 2026-10-04 10:18:56.577 | [Ölçüm/prompt laboratuvarı](https://www.notion.so/3ea1fd693ee080808541d6be8d70a648) |
| GEO-10 | 2026-10-04 10:18:15.702 | [Yayın kapısı](https://www.notion.so/3ea1fd693ee0805a80c5cb7856eac7a0) |

Tam metin snapshot'ları `geo/notion-hub.json`, `geo/notion-geo01.json` … `geo/notion-geo10.json` içinde. URL, revizyon, SHA-256 ve eksiksizlik bilgisi `geo/notion-source-index.json` dosyasında. **196 özgün checklist maddesi ve bütün bölüm başlıkları** `geo/requirements-matrix.json` içinde madde kimliğiyle kayıtlıdır. Bu nedenle aşağıdaki özet, detayların atlandığı bir kapsam daraltması değildir. Kaynak belgelerdeki kontrol eşikleri proje için otomatik kabul edilmiş sayılmadı.

## Adım bazında kapsam ve durum

| Kapı | Okunan zorunlu stratejiler | Bu denetimdeki çıktı | Tam PASS için eksik |
|---|---|---|---|
| GEO-01 — BLOCKED | Charter, anti-goals, RACI/backup/escalation, SEO bağımlılıkları, standard/major/emergency RFC, risk/exception, retention, RTO/RPO, vendor değişikliğinde yeniden açma | Tüm gate ve başlık envanteri; aşağıdaki risk ve devir listesi | SEO-01–03 kanıtları, isimli sorumlular ve bağımsız imzalar, erişim/retention sözleşmesi, tatbikat |
| GEO-02 — BLOCKED | Stabil entity ID, tip/ilişki/alias/lifecycle, sameAs sahipliği, NAP çelişkisi, rebrand/M&A/holding/franchise/şube kapsamı, panel değerlendirmesi, entity incident | Kişi ve web sitesi için taslak envanter; mevcut schema alanlarının kaynak snapshot'ı | Üretim domaini, profil sahipliği, biyografik iddiaların kaynak ve tarihleri. Kurum/holding/şube senaryoları bu kişi sitesi için kapsam kararı gerektirir; tüzel kurum uydurulmaz |
| GEO-03 — BLOCKED | Search/training/user-triggered/social ayrımı, vendor kaynakları, IP/rDNS/spoofing, robots precedence, WAF-origin parity, 403/429/timeout/spike, propagation, vendor alarmı, emergency block | 11 satırlı bot taslağı; Google/OpenAI/Perplexity resmî dokümanları okundu | Kamuya açık hedef ve insan politika kararı; gerçek IP/edge logları, alarmlar ve T+15m/1h/24h kanıtı. Özel önizlemede public erişim beklenmez |
| GEO-04 — BLOCKED | Article/service/comparison/FAQ/research şablonları, answer-unit sözleşmesi, chunk bütçesi, lint, kaynak tier/lisans, medya transcript/caption, Türkçe/locale parity, stale-source incident | 63 kaynak sayfası taraması; H1/alt/schema/FAQ envanteri; içerik kaynağı ayrımı | Tüm kritik claim–source locator ve reviewer eşleşmesi, medya hakları/transcript QA, anlamlı FAQ karşılaştırması ve içerik tatbikatı |
| GEO-05 — BLOCKED | Intent taxonomy/journey, impact-confidence-evidence-effort, branded/unbranded/comparison/risk, adversarial, answer-gap, çift URL kararı, locale/trend, append-only değişiklik | 25 konu/owner taslağı; 50 dengeli prompt taslağı | Gerçek Search Console/satış/destek verisi, puanlar ve sorumlular, prompt sonuçları. Aynı konudaki yazılar kanıtsız birleştirilmez |
| GEO-06 — BLOCKED | CMS→DOM→JSON-LD eşlemesi, tip/@id/graph, contract sürüm/migration, negatif fixture, validator/golden diff, normalizasyon, cache/MIME/ETag, llms bütçe/fallback/incident | Somut canonical/schema/tarih parity hataları bildirildi; mevcut code path incelendi | Son kodun haricî validator ve canlı örnek kanıtları; onaylı entity facts. llms.txt opsiyonel; özel/staging URL yayımlamak yasak |
| GEO-07 — BLOCKED | Risk bazlı SLA, kaynak puanı, gerçek author/reviewer yeterlilik/bağımsızlık, semantic date diff, link-rot, deprecation, emergency correction, YMYL, correction notice, stale dashboard | Aşağıdaki doğrulama ve kaynak sahipliği planı; 30 tarih çelişkisinin kanıtı | Yazar/editör doğrulaması, uzman incelemesi gereken iddialar, kaynak monitor ve gerçek tarih geçmişi; sahte güncelleme tarihi yok |
| GEO-08 — BLOCKED | LinkedIn/X/Meta/YouTube/GitHub hesap ID/owner/MFA parity, social inspector/cache, correction, logo izinleri, impersonation, review etiği, kriz ve abandoned hesaplar | Off-site planı ve mevcut profil adayları için doğrulama sırası | Yetkili hesap erişimi ve doğru profiller, izin kayıtları, haricî preview testleri; mesaj/profil değişikliği yapılmadı |
| GEO-09 — BLOCKED | Rubric/critical override, claim accuracy/citation, örneklem/tekrar, model-session varyansı, blind çift evaluator/kappa/ICC/CI, paired baseline, semver/rebaseline, bütçe/ToS/redaction/retention/referral, incident SLA | 50 prompt ve ayrıntılı çalıştırma planı; sonuç alanları boş | En az iki yüzeyde gerçek baseline, bütçe/izin, onaylı reference facts, evaluator ve ölçüm altyapısı. Hiçbir skor veya AI görünürlük sonucu üretilmedi |
| GEO-10 — BLOCKED | Immutable manifest/hash/imza, kanıt biçimleri, exception, release blockers, go/no-go, RTO/RPO/tatbikat, partial/failed rollback, T+1/7/30, reopen, teslim paketi | Manifest taslağı; bu kanıt indeksi ve geri dönüş planı | GEO-01–09 + SEO release kanıtları, imzalar, restore tatbikatı, canlı smoke ve müşteri erişim kabulü |

## Kaynak taramasının doğrulanmış bulguları

Komut: `node reports/geo/audit-source.mjs`. Kanıt: `geo/source-baseline.json`. Bu komut HTTP istekleri, CSS layout hesabı, JavaScript kapalı tarayıcı görünümü veya Lighthouse çalıştırmaz.

| Kontrol | Başlangıç sonucu | Anlamı |
|---|---|---|
| İçerik rotaları | 63; 30 makale, 9 not | Global CMS kaydı ve üç eski test redirect'i içerik sayfası sayılmadı |
| Tek H1 | 63/63 | Kaynak HTML'de bulundu; mobil görünürlük sonucu değildir |
| JSON-LD parse | Hatalı JSON yok | Schema.org property doğruluğu veya rich-result uygunluğu demek değildir |
| Görsel alt attribute | Eksik attribute yok | Alt metnin editoryal kalitesi ayrı kontrol gerektirir |
| FAQ | 120/120 soru görünür kaynak metinde | 22 cevap tam normalize metin eşleşmesini geçmiyor; markup farkı veya anlamsal drift olabilir. Otomatik “22 sahte cevap” sonucu çıkarılmaz |
| Makale tarihi | 30/30'da schema 30 Eylül, görünür güncelleme 29 Eylül 2026 | Başlangıç sürümünde gerçek parity hatası; kaynak doğrulanmadan bugünün tarihi basılamaz |
| SSR yolu | `cms/server.ts` + catch-all route | İçerik server HTML olarak oluşturuluyor; edge yanıtı/crawl doğrulaması ayrıca gerekli |
| Bot/arama erişimi | Owner-private site | Kamuya açık indekslenme için uygunluk doğrulanamaz; gizlilik ayarı SEO puanı uğruna değiştirilemez |

## Teknik düzeltme listesi ve kabul koşulları

Bu liste başlangıç bulgularıdır; uygulama dosyalarını bu alt denetim değiştirmedi. Ana çalışma sırasında yapılan düzeltmeler son test çıktılarıyla bağlanmalıdır.

| Öncelik | Bulgu / dosya | Güvenli uygulama | Kabul kanıtı |
|---|---|---|---|
| P0 | `cms/render.mjs`, sitemap ve robots hedef domaini hard-code ediyor | Tek ortam/canonical kaynağı; preview ve doğrulanmış production birbirinden açıkça ayrılmalı | Bütün render edilen rotalarda canonical/OG/schema/sitemap tutarlılığı |
| P0 | CMS metni değişince FAQ, CollectionPage, ProfilePage ve nested author/mainEntityOfPage eski kalabiliyor | Görünür DOM veya aynı CMS verisinden deterministik schema; ham editoryal JSON-LD'ye kör güven yok | FAQ düzenleme/section hide/reorder/yeni makale dahil negatif parity fixture'ları |
| P0 | 30 makalede tarih çelişkisi | Görünür onaylı tarih ile schema eşle; semantic content diff olmadan dateModified/lastmod güncelleme | 30 sayfa tarih karşılaştırması; yeni build tarih değiştirmiyor |
| P1 | Person altında Book nesneleri `author` yönünde | Book.author kişiye referans versin; kitap bilgileri gerçek görünür içerikten üretilebiliyorsa ekle | Tip/property incelemesi + görünür kitap/author parity |
| P1 | Schema biyografi, üyelik, okul, sayısal erişim iddiaları içeriyor | Authored metni sessizce silme veya güçlendirme; claim register ve kaynak/reviewer bekleme durumu | Her kritik iddia için kaynak/locator/tarih veya açık gap |
| P1 | Yeni yazının schema/OG/title/canonical türevleri | Aynı route ve CMS snapshot'ından üret; kaynak makalenin eski @id/yazarı/tarihi kopyalanmasın | Yeni makale fixture ve kötü URL/HTML/JS değerleri için güvenli render |
| P1 | Sitemap yalnız route listesine dayanıyor | Yayımlanmış, canonical ve indexability politikası uygun kayıtlar; draft/admin/API/redirect yok | Yayından kaldırma sonrası listeden çıkma, query/redirect içermeme |
| P1 | Metadata'daki “30 rehber” gibi sabit sayı büyüyen arşivle drift edebilir | Authored görünür başlığı bilinçsizce değiştirmeden CMS/count yönetimini eşleştir | Yeni yazı yayını/kaldırma sonrası arşiv anlatımı ve sayı testi |
| P1 | Video esas bilgisi yalnız medya içinde kalabilir | Konuşmalar için izinli, düzeltilmiş transcript/caption/chapter; sessiz dekoratif hero ayrı değerlendirilir | Gerçek konuşma metni ve insan QA; sahte transcript yok |
| P2 | Kaynak/author/reviewer/review tarihi standart alanları eksik | Taslak kaynak ve review kayıtlarını CMS'ye ekleme kapsamı belirle; bilinmeyene doğrulanmış tarih atama | Yönetici düzenleme ve izin testleri; UI/schema gerçek veriyle eş |
| P2 | llms.txt yok | **Şu an yayımlamama doğru karardır.** İsteğe bağlı generator ancak onaylı public domain ve link-check sonrasında açılabilir | Public 200/self-canonical/indexable linkler; UTF-8/<100KiB/≤200 URL; özel URL sıfır |

## İçeriğin kaynağı ve editoryal doğrulama

`scripts/mirror.py` ile `source-inventory.json`, ilk ithalatın `https://ziyasakiryilmaz.pages.dev` kaynağını gösteriyor. README ve ilk commit `40e7a53`, 30 makalenin önceden var olduğunu belgeliyor. Bu, “metinler bu güncellemede yapay zekâyla üretildi” iddiasını desteklemez; aynı zamanda her araştırma iddiasının ya da yazarlık bilgisinin bağımsız doğrulanması değildir.

| İçerik | Önerilen inceleme | Kaydedilecek kanıt | Durum |
|---|---|---|---|
| Biyografi, sayısal erişim, ülke/TEDx sayıları | Ziya Bey veya yetkili editörle birincil kayıt doğrulaması | Kaynak, kapsam/dönem, claim ID, reviewer, gerçek doğrulama tarihi | Bekliyor |
| Kitaplar | Yayıncı/ISBN/baskı/yazarlık ve satın alma linki | Kitap bazında resmî sayfa; duyurulan kitabın yayın durumu | Bekliyor |
| 30 makale | Atıfları iddia/locator ile eşleştir; yazarlık ve review sorumlusu | DOI/resmî araştırma URL'si, yöntem/örneklem/dönem, lisans ve belirsizlik | Bekliyor |
| Psikoloji/nöroplastisite/test | Kişisel gelişim ile tanı/tedavi iddiasını ayır | Yüksek riskli iddiada uygun bağımsız uzman; testin ölçme sınırları | Bekliyor |
| Konuşmalar/video | Gerçek konuşmacı/başlık/tarih ve transcript | Canonical medya, hak sahibi, zaman damgalı atıf, caption QA | Bekliyor |
| Hizmet/iletişim | Sunulan kapsam, talep akışı, güncel iletişim | 90 gün veya kapsam değişiminde review; formun gerçek uçtan uca kanıtı | Yerel arayüz incelemesi gerçek gönderim kanıtı değildir |

Freshness planı: fiyat/uygunluk varsa değişim anında ve en fazla 24 saat; güvenlik/gizlilik 30 gün; hizmet/biyografi/iletişim 90 gün; araştırma kaynağı dönemi +30 gün ve en fazla 180 gün; evergreen 365 gün. Bunlar playbook üst sınırlarından hazırlanmış öneridir; aktif job veya kabul edilmiş SLA sayılmaz. %80 due-soon, %100 stale; kaynak değişikliği süre beklemeden review açar. Tarihleri yalnız deploy yapıldığı için değiştirmek yasak.

Correction akışı: iddia/URL/tarih/kanıtı koru → riski sınıflandır → canonical kaynağı doğrula → görünür içerik ve schema'yı birlikte düzelt → önemli maddi hata için kısa görünür bildirim → aynı testleri çalıştır → sonucu revizyonda sakla. Gerçek kişi ve iletişim atanmadan bu bir operasyonel on-call hizmeti değildir.

## Off-site ve bot kararları

Mevcut schema'daki LinkedIn, Instagram, YouTube, Facebook, X ve Kitapyurdu bağlantıları **aday** resmi yüzeylerdir; görünüşlerinden sahiplik varsayılmadı. Önce platform immutable account ID, gerçek owner+backup, erişim ve domain doğrulanır; sonra isim/logo/bio/domain parity kontrol edilir. GitHub veya Company Page yalnız bu kişi/işletme için gerçekten varsa kapsamda tutulur. Sırf on yüzey sayısını doldurmak için profil açılmaz.

Logo/referans kullanımı izin ve kapsam kaydı gerektirir. Hiçbir profil düzenlenmedi, review talebi veya üçüncü kişiye düzeltme mesajı gönderilmedi. LinkedIn Post Inspector, Meta/X kart önizlemesi ve cache T+15m/1h/24h kanıtları çalıştırılmadı.

Resmî kaynaklar 12 Ekim 2026'da okundu: [Google crawler listesi](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers), [OpenAI bot dokümanı](https://developers.openai.com/api/docs/bots), [Perplexity crawler dokümanı](https://docs.perplexity.ai/docs/resources/perplexity-crawlers). Bot taslağı arama, eğitim/grounding, kullanıcı isteği ve sosyal önizleme sınıflarını ayırır. Google-Extended ayrı HTTP botu veya Search sıralama kontrolü değildir. OpenAI SearchBot/GPTBot kararları bağımsız; ChatGPT-User kullanıcı tarafından tetiklenir. Perplexity arama ve user fetcher'ları ayrı sınıftadır. Bu kaynaklar üretim WAF allowlist onayı yerine geçmez.

[Google'ın AI arama rehberi](https://developers.google.com/search/docs/appearance/ai-features) özel bir AI dosyası veya özel schema gerektirmediğini, görünür metin/structured-data uyumunu ve temel SEO gerekliliklerini açıklar. Bu nedenle llms.txt yokluğuna otomatik “GEO başarısız” puanı verilmez; yanlış veya özel URL yayımlamak daha ciddi bir hatadır. İndekslenme veya alıntılanma garantisi verilmez.

## Prompt laboratuvarı ve ölçüm — hazırlanmış, çalıştırılmamış

`geo/prompt-lab-dataset-draft.json` içinde 50 sentetik prompt var: branded, unbranded, comparison, how-to, risk sınıflarında onar soru. Bu sorular gerçek kullanıcı verisi gibi sunulmadı. Türkçe tek locale; İngilizce site veya ikinci pazar uydurulmadı. Ziya Beyin dört talep yolu ve mevcut konu sayfaları kapsanıyor; yanlış öncül, kesin fiyat/başarı garantisi, tedavi ikamesi ve kaynakları yok saydırma soruları negatif test olarak ayrıldı.

Çalıştırmadan önce atomik reference facts ve kabul edilen kaynaklar editör tarafından doldurulmalı. İki model/yüzey, olağan sorularda beş, comparison/risk sorularında on tekrar **700 run/zaman noktası** eder. Bu bir bütçe önerisidir; API çağrısı, ücret, hesap veya otomasyon izni kullanılmadı.

Rubric: görev 15, doğruluk 25, citation 20, desteksiz iddia 15, sınırlar 10, entity 10, güncellik/locale 5. Kritik hata her toplam skoru geçersiz kılar. Model/sürüm/browsing/oturum/locale/tarih kaydedilir; sonuçların en az %20'si ve kritik sonuçların tamamı ikinci bağımsız değerlendiriciyle incelenir. Kappa/ICC, prompt kümelenmesini dikkate alan güven aralıkları, eşleşmiş baseline–release ve +7/+30 gün sonuçları gerekir. Model değişirse rebaseline gerekir.

AI referral için yalnız observed/tagged/bot-excluded/unknown ayrımı yapılabilir. Citation = onay, click veya gelir değildir. Mevcut denetimde Search Console/analytics hesabı, gerçek referral veya model cevabı ölçülmedi.

Retention notu: GEO-01 genel operasyon logları için 12 ay, GEO-09 ham transcript için 180 gün gibi farklı varsayılanlar içeriyor. Proje sözleşmesinde kapsam ve daha katı kural açıkça karara bağlanmalı; kişisel veri toplamadan önce saklama/silme/yasal dayanak belirlenmeli. Bu rapor otomatik olarak uzun süre kişisel veri saklama yetkisi oluşturmaz.

## Risk, devir ve geri dönüş

| Risk | Etki | Sonraki sorumlu / gereken karar | Telafi ve geri dönüş |
|---|---|---|---|
| Özel preview'ı public üretim gibi ölçmek | Yanlış indexability/başarı beyanı | Site sahibi: gerçek yayın domaini ve yayın aşaması | Gizliliği koru; public GEO iddiası yapma |
| CMS ve schema birbirinden ayrışıyor | Yanlış makale/FAQ/tarih/kimlik | Engineering + Content: son renderer testleri | Önceki kod/CMS revision'a dön; aynı parity testini çalıştır |
| Doğrulanmamış araştırma/kişisel başarı iddiaları | Yanlış güven/sayısal veya YMYL çıkarım | Ziya Bey/editör; risk varsa alan uzmanı | Claim register ve review; kaynağı uydurma veya metni sessizce eksiltme |
| Supabase kapalı | Kaydet/yayınla/medya/ekip/lead gerçekte doğrulanamıyor | Site sahibi: doğru bağlı Supabase hesabı/projesi | Kurulum modunu dürüst göster; veri gönderildi iddiası verme |
| Browser/haricî validator erişimi yok | Gerçek layout/Lighthouse/preview sonucu yok | Yetkili test ortamı ve operatörü | Statik testleri ayrı raporla; skor üretme |
| Bot politikası belirsiz | Arama ile eğitim politikası karışabilir | Security/Legal/Marketing + site sahibi | Taslak registry; mevcut erişimi değiştirme |
| Owner/backup/imza/retention yok | Playbook işletilemez | İsimli müşteri sorumluları atanmalı | Gate BLOCKED; draftları onaylı gibi kullanma |

Uygulama geri dönüş noktası, denetim başlangıcındaki commit'tir. Gerçek publish geri dönüşünü Sites sürümü üzerinden ana görev yapar; bu alt denetimde deploy veya rollback tatbikatı yapılmadı. CMS canlıya bağlanınca son onaylı revision/export ve storage hash'leri ayrıca korunmalıdır. RTO/RPO hedefleri ölçülmedikçe “sağlandı” yazılamaz.

## Kanıt indeksi ve yeniden üretme

| Dosya | İçerik |
|---|---|
| `geo/notion-source-index.json` | 11 kaynak, revizyon, metin hash'i ve tamlık kontrolü |
| `geo/notion-*.json` | Kullanıcının verdiği Notion programının tam, özel denetim snapshot'ları |
| `geo/requirements-matrix.json` | 196 checklist kontrolü ve tüm strateji başlıkları; uydurulmamış kapı durumu |
| `geo/source-baseline.json` | 63 route için metadata/H1/schema/FAQ/tarih/link/media/alt kaynak taraması |
| `geo/audit-source.mjs` | Kaynak taramasını yeniden üretir; uygulama dosyası değiştirmez |
| `geo/entity-inventory-draft.json` | Kişi/site envanteri; onay ve kimlik boşlukları açık |
| `geo/bot-registry-draft.json` | Bot sınıfları ve resmî kaynaklar; canlı politika değildir |
| `geo/topic-ownership-draft.json` | 25 mevcut topic/owner adayı; gerçek veri/öncelik puanı bekliyor |
| `geo/prompt-lab-dataset-draft.json` | 50 prompt, rubric ve örneklem planı; hiçbir sonuç yok |
| `geo/evidence-manifest-draft.json` | İmzasız yayın kanıt manifesti taslağı; release belgesi değil |
| `geo/CHECKSUMS.sha256` | Bu alt denetimin teslim dosyalarının hash'leri |

Yeniden tarama: repository kökünde `node reports/geo/audit-source.mjs`. Taslakları yeniden üretme: `node reports/geo/prepare-drafts.mjs` (bu komut insan tarafından doldurulmuş taslakları ezebileceğinden ilk denetimden sonra önce diff alınmalı). Kaynak HTML değişirse baseline da değişir; eski evidence snapshot'ı korunmadan tekrar çalıştırılmamalıdır.

**Açık kapılar kapanmadan “GEO eksiksiz uygulandı”, “AI-ready”, “Lighthouse geçti” veya “admin her şeyi canlı yönetiyor” beyanı desteklenmez.** Bu rapor somut yerel düzeltmeleri, kamuya açık üretim doğrulamasını ve gerçek editoryal/operasyonel sahipliği birbirine karıştırmadan tamamlanacak işi gösterir.
