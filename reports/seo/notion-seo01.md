Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3e51fd693ee080fe8173d913bfebee42 as of 2026-10-04T10:19:53.507Z:
<page url="https://app.notion.com/p/3e51fd693ee080fe8173d913bfebee42">
<ancestor-path>
<parent-page url="https://app.notion.com/p/3e51fd693ee080a18f79f1ede4c42fcf" title="SEO — Klasik Arama Motoru Optimizasyonu · AI Prompt"/>
</ancestor-path>
<properties>
{"title":"SEO-01 — Program, RACI & RFC Gate"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
Figtures Enterprise SEO · SEO-01
> Enterprise SEO bir ürün yüzeyidir (product surface). Her deploy, feature flag, CMS şablonu, redirect ve meta/schema değişimi arama görünürlüğü, sosyal paylaşım önizlemesi ve ölçüm bütünlüğünü etkiler. Onaysız production değişikliği = SEO incident (traffic, rich result, index kaybı).
## Kapsam (bu sayfa)
SEO-01, programın yönetişim katmanıdır: kim neye karar verir (RACI), hangi değişiklik RFC ister, story Definition of Done, gate ve kanıt standardı. Teknik uygulama SEO-02…SEO-10 inside page’lerde; bu sayfa onların ön şartıdır.
Sıra: SEO-01 PASS olmadan SEO-02’ye geçilmez.
## Staff Engineer ilkeleri (Google / Meta / LinkedIn / X ölçeği)
- Search ve sosyal graph ayrı yüzeylerdir; tek “meta tag hotfix” ile ikisini birden riske atma — RFC’de Search impact + Social impact ayrı yaz.
- robots.txt index garantisi vermez; index kararı HTML (noindex), canonical, hreflang ve kalite sinyalleriyle gelir (Google Search Essentials).
- Staging/preview her zaman crawl-safe varsay: noindex veya auth + robots Disallow kanıtı (SEO-03 ile birlikte).
- YMYL (sağlık, finans, hukuk): Legal Consulted zorunlu; schema/marka iddiası without legal = hard stop.
- Ölçüm (GSC, GA4) ve sosyal debugger (Meta Sharing Debugger, LinkedIn Post Inspector, X Card Validator) release gate’in parçası — “göz kararı OK” yasak.
- Performance budget ihlali SEO RFC’si değil ama merge blocker; exception yine EM Accountable + SEO Consulted.
Şirket sabiti (NAP/schema): [contact@figtures.com](mailto:contact@figtures.com) — tüm projelerde tutarlı.
---
## RACI (minimum tablo)
<table header-row="true">
<tr>
<td>Aktivite</td>
<td>R (Responsible)</td>
<td>A (Accountable)</td>
<td>C (Consulted)</td>
<td>I (Informed)</td>
</tr>
<tr>
<td>Yeni route / URL şablonu</td>
<td>SEO Lead</td>
<td>EM</td>
<td>Eng, Content</td>
<td>PM</td>
</tr>
<tr>
<td>robots.txt / sitemap değişimi</td>
<td>Eng</td>
<td>SEO Lead</td>
<td>DevOps</td>
<td>PM</td>
</tr>
<tr>
<td>Schema @type ekleme/değişim</td>
<td>Eng</td>
<td>SEO Lead</td>
<td>Content</td>
<td>Legal (YMYL)</td>
</tr>
<tr>
<td>Migration + 301 redirect planı</td>
<td>Eng</td>
<td>SEO Lead</td>
<td>Content, DevOps</td>
<td>Support</td>
</tr>
<tr>
<td>Performance budget exception</td>
<td>Eng</td>
<td>EM</td>
<td>SEO Lead</td>
<td>PM</td>
</tr>
<tr>
<td>Global noindex / canonical policy</td>
<td>SEO Lead</td>
<td>EM</td>
<td>Eng, Legal</td>
<td>PM</td>
</tr>
<tr>
<td>hreflang / locale URL seti</td>
<td>SEO Lead</td>
<td>EM</td>
<td>Eng, Content</td>
<td>PM</td>
</tr>
<tr>
<td>AI crawler bot policy (GPTBot, Google-Extended)</td>
<td>SEO Lead</td>
<td>EM</td>
<td>Eng, Legal, Marketing</td>
<td>PM</td>
</tr>
<tr>
<td>OGP/Twitter card şablon değişimi</td>
<td>Eng</td>
<td>SEO Lead</td>
<td>Marketing</td>
<td>PM</td>
</tr>
<tr>
<td>## RACI — genişletilmiş (uç senaryolar)<br><br>\| Aktivite \| R \| A \| C \| I \|<br>\|----------\|---\|---\|---\|---\|<br>\| Hotfix production (meta/title) \| Eng \| SEO Lead \| — \| PM \|<br>\| CMS bulk import (100+ URL) \| Content \| SEO Lead \| Eng \| PM \|<br>\| A/B test (URL veya title varyantı) \| PM \| SEO Lead \| Eng, Data \| Legal \|<br>\| Faceted nav / infinite calendar URL \| Eng \| SEO Lead \| Content \| — \|<br>\| Soft 404 → hard 404/410 \| Eng \| SEO Lead \| Content \| Support \|<br>\| WWW ↔ apex, slash policy \| DevOps \| SEO Lead \| Eng \| — \|<br>\| JavaScript rendering / prerender switch \| Eng \| EM \| SEO Lead \| PM \|<br>\| Structured data pipeline (CI validate) \| Eng \| SEO Lead \| — \| Legal \|<br>\| International launch (yeni ccTLD/subfolder) \| SEO Lead \| EM \| Eng, Content, Legal \| PM \|<br>\| Brand SERP / knowledge panel claim \| Marketing \| SEO Lead \| Legal \| EM \|<br>\| Incident: index drop / manual action \| SEO Lead \| EM \| Eng, Legal \| Exec \|<br>\| X / LinkedIn / Meta paylaşım görsel boyutu policy \| Marketing \| SEO Lead \| Eng \| PM \|<br><br>RACI doldurma kuralı: Her Figtures projesinde tabloda boş hücre bırakma — somut isim + yedek (backup) rol yaz (Notion veya proje wiki).<br><br>---<br><br>## RFC ne zaman zorunlu?<br><br>Karar matrisi (herhangi biri EVET → RFC):<br><br>\| Soru \| EVET → RFC \|<br>\|------\|------------\|<br>\| Indexable URL sayısı veya şablonu değişiyor mu? \| Zorunlu \|<br>\| robots.txt, sitemap, CDN cache header (HTML) etkileniyor mu? \| Zorunlu \|<br>\| 301/302/308 veya canonical hedefi değişiyor mu? \| Zorunlu \|<br>\| Yeni veya değişen JSON-LD @type / required field? \| Zorunlu \|<br>\| Title/meta/OG/Twitter template global değişiyor mu? \| Zorunlu \|<br>\| hreflang veya locale routing değişiyor mu? \| Zorunlu \|<br>\| Core Web Vitals budget exception? \| Zorunlu (Eng RFC) \|<br>\| Sadece typo fix, tek URL, içerik aynı intent? \| SEO Lead onayı yeter (RFC opsiyonel) \|<br><br>RFC olmadan merge yasak: production robots, site-wide canonical, redirect map, global schema injector.<br><br>---<br><br>## RFC şablonu (zorunlu alanlar — eksiksiz)<br><br>Her RFC tek kaynak: Notion DB veya Jira Epic + link. Minimum bölümler:<br><br>1. **Summary** — Ne değişiyor; hangi repo/ servis; feature flag adı; etkilenen ortamlar (dev/staging/prod).<br>2. **Owner & tarih** — RFC sahibi, hedef deploy, rollback owner.<br>3. **URL inventory attachment** — Etkilenen path listesi veya template kuralı; indexable mı?<br>4. **Search impact** — index/noindex/follow; canonical self vs consolidate; hreflang; tahmini crawl budget etkisi.<br>5. **Social / sharing impact** — og:title, og:image, twitter:card değişimi; LinkedIn 1200×627, X summary_large_image policy.<br>6. **Redirect table** — from → to, status (301 preferred), chain max 1 hop; query string policy.<br>7. **Rollback** — Önceki git SHA, config snapshot, feature flag OFF adımı; tahmini süre (dk).<br>8. **Validation plan** — Min 10 URL; GSC URL Inspection; Rich Results; Lighthouse delta; staging noindex curl.<br>9. **Risk tier** — P0 (index/traffic), P1 (rich result), P2 (preview/social), P3 (internal only).<br>10. **Sign-off** — Checkbox: SEO Lead, Eng Lead, Legal (YMYL), Marketing (bot/social policy), EM (P0/P1 prod).<br>## RACI — genişletilmiş (uç senaryolar)<br><br>\| Aktivite \| R \| A \| C \| I \|<br>\|----------\|---\|---\|---\|---\|<br>\| Hotfix production (meta/title) \| Eng \| SEO Lead \| — \| PM \|<br>\| CMS bulk import (100+ URL) \| Content \| SEO Lead \| Eng \| PM \|<br>\| A/B test (URL veya title varyantı) \| PM \| SEO Lead \| Eng, Data \| Legal \|<br>\| Faceted nav / infinite calendar URL \| Eng \| SEO Lead \| Content \| — \|<br>\| Soft 404 → hard 404/410 \| Eng \| SEO Lead \| Content \| Support \|<br>\| WWW ↔ apex, slash policy \| DevOps \| SEO Lead \| Eng \| — \|<br>\| JavaScript rendering / prerender switch \| Eng \| EM \| SEO Lead \| PM \|<br>\| Structured data pipeline (CI validate) \| Eng \| SEO Lead \| — \| Legal \|<br>\| International launch (yeni ccTLD/subfolder) \| SEO Lead \| EM \| Eng, Content, Legal \| PM \|<br>\| Brand SERP / knowledge panel claim \| Marketing \| SEO Lead \| Legal \| EM \|<br>\| Incident: index drop / manual action \| SEO Lead \| EM \| Eng, Legal \| Exec \|<br>\| X / LinkedIn / Meta paylaşım görsel boyutu policy \| Marketing \| SEO Lead \| Eng \| PM \|<br><br>RACI doldurma kuralı: Her Figtures projesinde tabloda boş hücre bırakma — somut isim + yedek (backup) rol yaz (Notion veya proje wiki).<br><br>---<br><br>## RFC ne zaman zorunlu?<br><br>Karar matrisi (herhangi biri EVET → RFC):<br><br>\| Soru \| EVET → RFC \|<br>\|------\|------------\|<br>\| Indexable URL sayısı veya şablonu değişiyor mu? \| Zorunlu \|<br>\| robots.txt, sitemap, CDN cache header (HTML) etkileniyor mu? \| Zorunlu \|<br>\| 301/302/308 veya canonical hedefi değişiyor mu? \| Zorunlu \|<br>\| Yeni veya değişen JSON-LD @type / required field? \| Zorunlu \|<br>\| Title/meta/OG/Twitter template global değişiyor mu? \| Zorunlu \|<br>\| hreflang veya locale routing değişiyor mu? \| Zorunlu \|<br>\| Core Web Vitals budget exception? \| Zorunlu (Eng RFC) \|<br>\| Sadece typo fix, tek URL, içerik aynı intent? \| SEO Lead onayı yeter (RFC opsiyonel) \|<br><br>RFC olmadan merge yasak: production robots, site-wide canonical, redirect map, global schema injector.<br><br>---<br><br>## RFC şablonu (zorunlu alanlar — eksiksiz)<br><br>Her RFC tek kaynak: Notion DB veya Jira Epic + link. Minimum bölümler:<br><br>1. **Summary** — Ne değişiyor; hangi repo/ servis; feature flag adı; etkilenen ortamlar (dev/staging/prod).<br>2. **Owner & tarih** — RFC sahibi, hedef deploy, rollback owner.<br>3. **URL inventory attachment** — Etkilenen path listesi veya “template: /blog/\{slug\}” kuralı; indexable mı?<br>4. **Search impact** — index/noindex/follow; canonical self vs consolidate; hreflang; tahmini crawl budget etkisi.<br>5. **Social / sharing impact** — og:title, og:image, twitter:card değişimi; LinkedIn 1200×627, X summary_large_image policy.<br>6. **Redirect table** — from → to, status (301 preferred), chain max 1 hop; query string policy.<br>7. **Rollback** — Önceki git SHA, config snapshot, feature flag OFF adımı; tahmini süre (dk).<br>8. **Validation plan** — Min 10 URL (aşağıda şablon); GSC URL Inspection; Rich Results (schema scope); Lighthouse delta; staging noindex curl.<br>9. **Risk tier** — P0 (index/traffic), P1 (rich result), P2 (preview/social), P3 (internal only).<br>10. **Sign-off** — Checkbox: SEO Lead, Eng Lead, Legal (YMYL), Marketing (bot/social policy), EM (P0/P1 prod).<br>GSC property / sitemap submit</td>
<td>SEO Lead</td>
<td>EM</td>
<td>Eng</td>
<td>## RFC yaşam döngüsü<br><br>Draft → SEO + Eng review (48h SLA) → Legal/Marketing (gerekiyorsa) → Approved → Deploy window → Post-deploy validation (24h) → Closed veya Rollback.<br><br>Post-deploy (P0/P1):<br>- GSC URL Inspection: “URL is on Google” / indexing state hedeflenen gibi mi?<br>- Coverage report: yeni hata sınıfı yok mu?<br>- Redirect spot-check: 10 rastgele from URL, tek hop 301.<br>- Social: Meta Sharing Debugger + LinkedIn Post Inspector + X validator (money page top 3).<br><br>Rollback tetikleyicileri: indexable URL 404; yanlış canonical cluster; site-wide noindex; redirect loop; schema manual action riski.<br><br>---<br><br>## Definition of Done (SEO story — ticket’a yapıştır)<br><br>Her SEO story kapanmadan önce kanıt linki (PR, screenshot, curl çıktısı, GSC ekran görüntüsü):<br><br>- \[ \] **Unique title + meta** — CMS override test: UI’da girilen = rendered `<title>` ve description meta; pixel-width kontrolü (sadece char count yetmez).<br>- \[ \] **Canonical explicit** — HTML link rel=canonical; HTTP header ile çelişki yok; parametre URL canonical base’e.<br>- \[ \] **Internal links ≥ 3** — Hub/spoke: ana nav + contextual body link; orphan page yok.<br>- \[ \] **Schema = görünür içerik** — DOM parity; Rich Results Test PASS (scope sayfalar); sahte rating/review yok.<br>- \[ \] **Lighthouse + CrUX** — Kategori regress yok; field Poor yeni URL’de yok (exception RFC’li).<br>- \[ \] **Staging noindex / auth** — `curl -sL staging URL | grep -i robots` veya login wall; production sızıntısı yok.<br>- \[ \] **Social preview** — og:url canonical ile uyumlu; görsel 200 OK; locale og:locale (çok dilliyse).<br><br>Opsiyonel ama önerilen (program olgunluğu):<br>- \[ \] URL Inspection screenshot arşivi (release klasörü)<br>- \[ \] RFC ID story description’da<br><br>---<br><br>## SEO-01 Gate checklist (PASS / FAIL / BLOCKED)<br><br>\| Kontrol \| PASS kriteri \|<br>\|---------\|----------------\|<br>\| RACI \| Proje adları dolu, yedek roller atanmış \|<br>\| RFC registry \| Son 90 gün SEO RFC’leri listelenmiş, açık P0 yok \|<br>\| Story DoD \| Template ticket’larda aktif \|<br>\| Validation plan \| Her RFC’de ≥10 URL Inspection listesi \|<br>\| Hard stop eğitimi \| Ekip production robots/canonical riskini biliyor \|<br>\| [contact@figtures.com](mailto:contact@figtures.com) \| NAP/schema owner onaylı \|<br><br>Gate FAIL: RACI boş veya RFC’siz merge geçmişi → SEO-02’ye geçme.<br><br>---<br><br>## Validation plan — min 10 URL şablonu (Google URL Inspection)<br><br>Her release/migration RFC’sine ekle (projeye göre doldur):<br><br>1. Homepage /<br>2. En yüksek trafik landing (GSC Top page)<br>3. Primary conversion (form, demo, checkout)<br>4. Blog/hub index<br>5. Temsili long-tail içerik URL<br>6. Locale alternate (varsa) + x-default pair<br>7. Facet/param URL (noindex/canonical doğrulama)<br>8. Staging örnek (noindex kanıt)<br>9. Redirect kaynağı (migration)<br>10. Redirect hedefi (200 + canonical self)<br><br>Komut örnekleri:<br>`curl -sI "https://{domain}/" | egrep -i 'HTTP|location|x-robots' curl -sL "https://{domain}/path" | head -80`<br><br>Google: Search Console URL Inspection, Removals (yalnızca acil), Indexing API yalnızca uygun job posting/broadcast (çoğu site GSC yeter).<br>## Anti-pattern (reddet — code review / release gate)<br><br>- “Sonra hallederiz” robots.txt veya sitemap prod değişikliği<br>- Hotfix ile site-wide duplicate title veya boş description rollout<br>- Schema without DOM parity (JSON-LD’de olup sayfada görünmeyen rating/fiyat)<br>- robots.txt ile “gizleme” sanmak (noindex unutulmuş parametre URL’leri)<br>- Staging açık index (noindex yok, GSC’de staging property bile olsa sızıntı riski)<br>- Redirect chain \>1 veya 302 migration (301 tercih)<br>- Canonical tag + HTTP canonical header çakışması<br>- hreflang tek yönlü (reciprocal yok)<br>- CMS bulk publish without URL inventory diff<br>- Social OG image relative URL veya cache-bust unutulan global template değişimi<br>- YMYL sayfada Legal sign-off olmadan medical/financial schema<br>- AI bot Disallow without Legal + Marketing imza<br>- “CrUX’e bakmadık, Lighthouse yeter” (field data merge blocker)<br>- RFC sign-off checkbox işaretli ama validation plan boş<br><br>---<br><br>## Program artefaktları (SEO-01 teslimi)<br><br>1. **RACI sayfası** — Bu tablonun proje kopyası (isimlerle).<br>2. **RFC template** — Notion/Jira; yukarıdaki 10 bölüm zorunlu.<br>3. **DoD snippet** — Ticket template’e embedded.<br>4. **10 URL Inspection listesi** — İlk release için doldurulmuş örnek.<br>5. **Escalation** — Index drop \>20% WoW veya manual action → SEO Lead + EM (SEO-09 runbook’a bağla).<br><br>Handoff: SEO-01 PASS → [SEO-02 Information Architecture & URL Policy](https://www.notion.so/3e51fd693ee080319f87eb3da92a162f)<br><br>---<br><br>## Referans (resmi dokümantasyon)<br><br>- Google Search Essentials: [https://developers.google.com/search/docs/essentials](https://developers.google.com/search/docs/essentials)<br>- SEO Starter Guide (teknik bölümler): [https://developers.google.com/search/docs/fundamentals/seo-starter-guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)<br>- URL Inspection (Search Console): [https://support.google.com/webmasters/answer/9012289](https://support.google.com/webmasters/answer/9012289)<br>- Robots intro: [https://developers.google.com/search/docs/crawling-indexing/robots/intro](https://developers.google.com/search/docs/crawling-indexing/robots/intro)<br>- Structured data intro: [https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)<br>- Meta Sharing Debugger: [https://developers.facebook.com/tools/debug/](https://developers.facebook.com/tools/debug/)<br>- LinkedIn Post Inspector: [https://www.linkedin.com/post-inspector/](https://www.linkedin.com/post-inspector/)<br>- X / Twitter Cards: [https://developer.x.com/en/docs/twitter-for-websites/cards/overview/abouts-cards](https://developer.x.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)<br>- LinkedIn share image: [https://www.linkedin.com/help/linkedin/answer/a521928](https://www.linkedin.com/help/linkedin/answer/a521928)<br><br>Figtures internal · [contact@figtures.com](mailto:contact@figtures.com) · Program hub: [https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f](https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f) · Sonraki adım SEO-02.<br>PM</td>
</tr>
</table>
</content>
</page>
