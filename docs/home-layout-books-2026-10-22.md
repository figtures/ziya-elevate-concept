# Home layout and book photography — 22 October 2026

- Reduced the combined spacing after the references and shortened the following chapter's entry translation. Other chapter motion remains unchanged.
- Grouped the existing books action with the heading, aligned to the right; moved the existing book/reader count under the heading. Preserved CMS field identities, labels, destinations, book ordering and visibility.
- Retained the original Kurşun Geçirmez Kafa Yapısı mockup. Added distinct stack, shelf and overhead compositions for the other three books in the same ivory/navy daylight palette. Native generated size: 1448 × 1086; optimized WebP copies are about 300 KB each. Prompts: `content/book-studio-v2-prompts.json`.
- Upgraded only known site-owned old photography URLs in stored content. Custom uploads and concurrent copy changes are preserved; old files remain available.
- Added an inline admin preview with explicit draft labels and visibility counts. Approved testimonials can render even when the working-areas section is hidden. Unverified suggested quotations remain private.

## Checks

- Production build: passed.
- Safe photography upgrades and asset mirrors: passed.
- Heading/action grouping, CMS field identity and idempotence: passed.
- Shared home books: 14 checks passed.
- References/testimonials: 14 checks passed.
- Admin workflows: 56 checks passed using DOM fixtures/local service stubs.
- Chapter motion: 8 contract groups across 63 templates passed.
- Rendered resources/cascade/cache rules: 64 pages passed.
- CMS content/anchors/validation: 65 documents passed.
- Browser playback and live deployment are not verified by these local checks. The managed preview was unavailable in this environment; no live Supabase data was changed.
