# Navy staggered testimonials

The uploaded stagger-card example is adapted in `components/ui/stagger-testimonials.tsx`. Existing shadcn aliases, TypeScript, Tailwind, Framer Motion and Lucide dependencies are reused.

- Section background: `#111c33`; active card: warm ivory; adjacent cards: translucent navy. Rounded corners replace the example's clipped corners.
- Previous/next controls, scoped arrow keys, stable CMS identities, reduced-motion support and measured card height support short and long comments.
- Actual CMS photos are optional; missing photos use initials. No stock portraits or example company endorsements are imported.
- Public HTML supplies only approved comments to the React island. Without JavaScript, the complete readable grid remains available.
- The admin's inline preview uses the same interactive component and retains its selected card while text changes. The full-page iframe keeps its existing script restrictions and uses the static fallback.
- Existing draft/publication controls are preserved. This change does not write Supabase records or publish draft comments.

Validation: production build; 16 reference/testimonial checks; 56 local admin workflow checks; 64 rendered-resource checks; 65 CMS documents; primary text contrast above 4.5:1. Browser visual playback remains unverified in this environment.
