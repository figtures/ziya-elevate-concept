import { INSTAGRAM_URL, LINKEDIN_URL, ORDER_URL, SITE_URL, copy, shared, type Locale } from "./site-content";
import shareImageAsset from "@/assets/ziya-sakir-yilmaz-og.jpg.asset.json";

export function createHomeHead(locale: Locale) {
  const c = copy[locale];
  const path = locale === "tr" ? "/" : "/en";
  const pageUrl = new URL(path, SITE_URL).href;
  const trUrl = new URL("/", SITE_URL).href;
  const enUrl = new URL("/en", SITE_URL).href;
  const shareImageUrl = new URL(shareImageAsset.url, SITE_URL).href;
  const personId = `${SITE_URL}/#person`;
  const websiteId = `${SITE_URL}/#website`;
  const pageId = `${pageUrl}#webpage`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: "Ziya Şakir Yılmaz",
        alternateName: "Başarı Mühendisi",
        url: SITE_URL,
        sameAs: [INSTAGRAM_URL, LINKEDIN_URL, ...shared.talks.map((talk) => talk.url)],
        jobTitle: locale === "tr" ? "Başarı Mühendisi, Eğitmen ve Yazar" : "Success Engineer, Speaker and Author",
        knowsAbout: locale === "tr"
          ? ["Satış", "Liderlik", "Girişimcilik", "İletişim", "Başarı Mühendisliği"]
          : ["Sales", "Leadership", "Entrepreneurship", "Communication", "Success Engineering"],
        image: shareImageUrl,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: SITE_URL,
        name: "Ziya Şakir Yılmaz",
        about: { "@id": personId },
        inLanguage: ["tr-TR", "en"],
      },
      {
        "@type": "ProfilePage",
        "@id": pageId,
        url: pageUrl,
        name: c.title,
        description: c.description,
        inLanguage: locale === "tr" ? "tr-TR" : "en",
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: shareImageUrl,
          width: 1200,
          height: 630,
        },
      },
      ...c.books.map((book) => ({
        "@type": "Book",
        name: book[0],
        author: { "@id": personId },
        inLanguage: "tr",
        description: book[1],
      })),
      {
        "@type": "Course",
        name: c.programs[0].title,
        description: c.programs[0].body,
        provider: { "@id": personId },
        offers: { "@type": "Offer", url: ORDER_URL, availability: "https://schema.org/InStock" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: locale === "tr" ? "Ana Sayfa" : "Home", item: pageUrl }],
      },
    ],
  };

  return {
    meta: [
      { title: c.title },
      { name: "description", content: c.description },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: c.title },
      { property: "og:description", content: c.description },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: pageUrl },
      { property: "og:locale", content: locale === "tr" ? "tr_TR" : "en_US" },
      { property: "og:locale:alternate", content: locale === "tr" ? "en_US" : "tr_TR" },
      { property: "og:image", content: shareImageUrl },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: c.imageAlt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: c.title },
      { name: "twitter:description", content: c.description },
      { name: "twitter:image", content: shareImageUrl },
      { name: "twitter:image:alt", content: c.imageAlt },
    ],
    links: [
      { rel: "canonical", href: pageUrl },
      { rel: "alternate", hrefLang: "tr", href: trUrl },
      { rel: "alternate", hrefLang: "en", href: enUrl },
      { rel: "alternate", hrefLang: "x-default", href: trUrl },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(graph) }],
  };
}
