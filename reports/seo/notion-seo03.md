Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3e51fd693ee080798f52ce38f6716e92 as of 2026-10-04T10:20:11.045Z:
<page url="https://app.notion.com/p/3e51fd693ee080798f52ce38f6716e92">
<ancestor-path>
<parent-page url="https://app.notion.com/p/3e51fd693ee080a18f79f1ede4c42fcf" title="SEO — Klasik Arama Motoru Optimizasyonu · AI Prompt"/>
</ancestor-path>
<properties>
{"title":"SEO-03 — Crawl, Index, robots.txt & Sitemap"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
## SEO-03 Gate checklist (PASS / FAIL / BLOCKED)
<table header-row="true">
<tr>
<td>Kontrol</td>
<td>PASS</td>
</tr>
<tr>
<td>robots.txt prod</td>
<td>200; şablon onaylı</td>
</tr>
<tr>
<td>Staging block</td>
<td>Kanıt (robots + noindex/auth)</td>
</tr>
<tr>
<td>Sitemap</td>
<td>200; yalnızca indexable; sample 10 URL OK</td>
</tr>
<tr>
<td>GSC</td>
<td>Domain property; sitemap submitted</td>
</tr>
<tr>
<td>AI bot policy</td>
<td>Yazılı + imza (Disallow ise)</td>
</tr>
<tr>
<td>CSS/JS</td>
<td>robots’ta Disallow yok</td>
</tr>
<tr>
<td>Facet/calendar</td>
<td>Patlama yok (SEO-02 cross-check)</td>
</tr>
</table>
Gate FAIL → SEO-04’e geçme.
---
## Test & teyit komutları
- [ ] https://\{domain\}/robots.txt → 200
- [ ] Staging crawl block kanıtlı
- [ ] Sitemap 200; 10 rastgele URL 200 + indexable
- [ ] Facet/infinite calendar patlaması yok
- [ ] Prod HTML money page: no unintended noindex
- [ ] Social bots Allow (preview smoke — SEO-08)
Hatırlat: robots gizlemez; gizleme = noindex / auth / remove.
---
## Anti-pattern (reddet)
- Disallow ile “gizlenmiş” hassas URL (hâlâ index riski)
- Prod sitemap’te staging/facet/session URL
- Sahte lastmod (tüm URL bugün)
- robots.txt 404 veya yanlış host’ta
- Site-wide Disallow / sonra Allow unutulmuş
- noindex + sitemap aynı URL
- AI bot Disallow without documentation
- Blocked CSS/JS in robots
- GSC property yokken launch
---
## Handoff & referans
Önceki: [SEO-02 IA & URL Policy](https://www.notion.so/3e51fd693ee080319f87eb3da92a162f)
Sonraki: [SEO-04 Rendering, SPA & Prerender](https://www.notion.so/3e51fd693ee08029afacfd9271e061c5)
Program hub: [https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f](https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f)
Google robots intro: [https://developers.google.com/search/docs/crawling-indexing/robots/intro](https://developers.google.com/search/docs/crawling-indexing/robots/intro)<br>Google sitemaps: [https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)<br>Google noindex: [https://developers.google.com/search/docs/crawling-indexing/block-indexing](https://developers.google.com/search/docs/crawling-indexing/block-indexing)<br>GSC start: [https://support.google.com/webmasters/answer/9128669](https://support.google.com/webmasters/answer/9128669)<br>Google-Extended: [https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers)<br>OpenAI GPTBot: [https://platform.openai.com/docs/gptbot](https://platform.openai.com/docs/gptbot)
## Sitemap operasyonu
Kaynak: SEO-02 URL inventory (index=yes only).
<table header-row="true">
<tr>
<td>Kural</td>
<td>Detay</td>
</tr>
<tr>
<td>Format</td>
<td>XML sitemap 0.9; UTF-8</td>
</tr>
<tr>
<td>lastmod</td>
<td>Gerçek deploy/content change; fake daily refresh yasak</td>
</tr>
<tr>
<td>changefreq/priority</td>
<td>Opsiyonel; Google yok sayabilir — lastmod önemli</td>
</tr>
<tr>
<td>Limit</td>
<td>50.000 URL / 50MB → sitemap index split</td>
</tr>
<tr>
<td>hreflang</td>
<td>sitemap hreflang extension veya HTML hreflang (tutarlı tek yöntem)</td>
</tr>
<tr>
<td>Image/video/news</td>
<td>Ayrı extension sitemap gerekirse RFC</td>
</tr>
</table>
Dinamik üretim:
- CI/CD job: build sonrası sitemap generate; diff alert (yeni/kayıp URL).
- Programmatic SEO: quality gate olmadan bulk URL ekleme yasak.
Test:<br>curl -sI https://\{domain\}/sitemap.xml<br>curl -s https://\{domain\}/sitemap.xml \| head -40
# rastgele 10 loc URL → 200 + indexable
Sitemap index örneği:<br>/sitemap.xml → index → sitemap-pages-1.xml, sitemap-blog-1.xml
---
## Google Search Console (GSC)
Kurulum:
- Domain property (DNS TXT) tercih; URL-prefix yedek.
- Tüm canonical host variant verification (www/apex SEO-02).
Ritüel (haftalık SEO-09 ile hizalı):
- Pages → Indexing: Why pages aren’t indexed
- Sitemaps: submit + last read status
- Crawl stats: host status, response codes
- Manual actions / Security issues: 0 tolerance
Material URL set değişimi (migration, yeni locale, büyük CMS import):
- Sitemap resubmit
- URL Inspection örneklem (min 10 SEO-01)
Indexing API: yalnızca JobPosting/BroadcastEvent gibi desteklenen türler; genel site için kullanma.
---
## Crawl budget (orta/büyük siteler)
- Facet explosion SEO-02 policy ile bloklu; crawl trap audit (Screaming Frog).
- Infinite calendar/archive: capped pagination veya noindex geçmiş.
- Log analysis: money page hit rate; 404 spike alarm.
- Parametre URL crawl → canonical/noindex fix (SEO-02).
- Sunucu 5xx crawl waste → incident (SEO-09).
Küçük site: crawl budget genelde sorun değil; yine facet/staging disiplini geçerli.
## Staging, preview, CMS draft
<table header-row="true">
<tr>
<td>Ortam</td>
<td>Zorunlu</td>
</tr>
<tr>
<td>Staging</td>
<td>robots Disallow ve/veya noindex; basic auth/IP allowlist</td>
</tr>
<tr>
<td>Preview token URL</td>
<td>noindex,nofollow; kısa TTL token</td>
</tr>
<tr>
<td>CMS draft</td>
<td>Unpublished = 404 veya auth; asla prod sitemap</td>
</tr>
</table>
Kanıt (release gate):<br>curl -sL [https://staging](https://staging/).\{domain\}/ \| grep -i 'noindex'<br>curl -s [https://staging](https://staging/).\{domain\}/robots.txt
Anti-pattern: staging Allow + indexable title/meta.
---
## AI bot & sosyal crawler policy
Bilinçli karar — RFC + Legal/Marketing (Disallow ise):
User-agent: GPTBot<br>Allow: /
User-agent: Google-Extended<br>Allow: /
User-agent: anthropic-ai<br>Disallow: /
User-agent: Facebookexternalhit<br>Allow: /
User-agent: Twitterbot<br>Allow: /
User-agent: LinkedInBot<br>Allow: /
Notlar:
- Google-Extended ≠ Googlebot; arama index ayrı crawler.
- Disallow training bot ≠ arama trafiği kaybı otomatik değil; risk analizi yazılı.
- Meta/X/LinkedIn preview botları engellenirse paylaşım kartları bozulur (SEO-08 incident).
---
## Meta robots & X-Robots-Tag
<table header-row="true">
<tr>
<td>Senaryo</td>
<td>Uygulama</td>
</tr>
<tr>
<td>Site-wide staging</td>
<td>X-Robots-Tag: noindex, nofollow header</td>
</tr>
<tr>
<td>PDF/video</td>
<td>Header noindex if not for SERP</td>
</tr>
<tr>
<td>Facet URL</td>
<td>noindex,follow + canonical (SEO-02)</td>
</tr>
<tr>
<td>Paginated</td>
<td>index,follow (strateji SEO-02)</td>
</tr>
</table>
Doğrulama: curl -sI URL \| grep -i x-robots; HTML meta robots.
Google: noindex uzun süre → crawl frequency düşer; kaldırınca re-crawl bekle.
> robots.txt crawl trafiğini yönetir; sayfayı Google sonuçlarından gizlemez. Gizleme: meta robots noindex, X-Robots-Tag, auth, veya Search Console removal. ([Google robots intro](https://developers.google.com/search/docs/crawling-indexing/robots/intro))
## Kapsam (bu sayfa)
SEO-03: Production/staging crawl policy, robots.txt, meta/X-Robots-Tag index kontrolü, sitemap operasyonu, Google Search Console (GSC) indexing ritüeli, crawl budget (büyük siteler), AI crawler bot policy. URL envanter ve facet kuralları SEO-02; render SEO-04.
Ön koşul: SEO-02 PASS (indexable inventory + facet policy).
## Staff Engineer ilkeleri (Google / Meta / LinkedIn / X)
- robots Disallow ≠ noindex: Disallow edilen URL hâlâ indexlenebilir (başka site link verirse). Gizlenecek URL inventory’de noindex + mümkünse auth.
- Staging asla “gizli URL” ile prod crawl riski taşımamalı: robots Disallow + noindex + IP/auth katmanı.
- Sitemap = indexable URL taahhüdü; facet/session URL sitemap’e girmez (SEO-02).
- GSC domain property + DNS doğrulama; sitemap her material URL set değişiminde yeniden submit.
- AI bot (GPTBot, Google-Extended, anthropic-ai, etc.) Allow/Disallow bilinçli; Disallow = Legal + Marketing imza (SEO-01 RFC).
- CSS/JS robots block yasak (render bozulur — Google rendering).
- Sosyal crawler (Facebookexternalhit, Twitterbot, LinkedInBot) genelde Allow; paylaşım önizlemesi için HTML erişimi gerekir (SEO-08).
---
## Index vs crawl vs render (net ayrım)
<table header-row="true">
<tr>
<td>Mekanizma</td>
<td>Etki</td>
</tr>
<tr>
<td>robots.txt Disallow</td>
<td>Crawl azaltır; index garantisi yok</td>
</tr>
<tr>
<td>meta name=robots noindex</td>
<td>Index engelleme (sayfa crawl edilebilir)</td>
</tr>
<tr>
<td>X-Robots-Tag header</td>
<td>HTTP seviyesinde noindex/nofollow</td>
</tr>
<tr>
<td>401/403 auth</td>
<td>Crawl/index kısıtı</td>
</tr>
<tr>
<td>canonical</td>
<td>Duplicate consolidation (SEO-02)</td>
</tr>
<tr>
<td>GSC Removals</td>
<td>Geçici acil (incident)</td>
</tr>
</table>
Production indexable sayfa: robots Allow (veya belirtilmemiş) + noindex yok + 200 + inventory index=yes.
---
## robots.txt production şablonu
Örnek (domain ve staging path projeye göre):
User-agent: \*<br>Allow: /<br>Disallow: /admin/<br>Disallow: /api/<br>Disallow: /preview/<br>Disallow: /internal/<br>Disallow: /\{staging-path\}/
Sitemap: https://\{domain\}/sitemap.xml
Kurallar:
- Tek robots.txt kökte 200 (redirect zinciri kısa).
- User-agent satırları spesifik bot override (AI policy aşağıda).
- Sitemap: mutlak HTTPS URL; www policy ile uyumlu (SEO-02).
- CDN edge robots ≠ origin çelişkisi yok.
Test:<br>curl -sI https://\{domain\}/robots.txt \| head -5<br>curl -s https://\{domain\}/robots.txt
Staging:
- Ayrı host veya path; Disallow + noindex HTML; prod sitemap’te staging URL yok.
</content>
</page>
