# Per-placement media framing

The admin media picker now opens a framing step for content images/videos, playlist clips, testimonial portraits, reference logos and social sharing images. Existing content fields also provide **Kadrajı ayarla**. Original source files are retained.

## Editing flow

1. Select or upload a source, or edit the current source's framing.
2. Switch between desktop and phone previews. Drag the source, use arrow keys, or adjust horizontal/vertical position and zoom.
3. Apply the framing to the current draft. Cancel leaves the draft untouched; **Orijinal yerleşimi kullan** restores the authored placement.
4. Save, preview and publish through the existing content workflow.

Frame data is source-bound and stored per placement in existing document/section/repeater values. Different usages of one file remain independent. Clip and record keys follow stable identities through ordering changes. No database schema migration is required. Existing approval and publication controls remain in force.

Public rendering uses the same object-position, transform-origin and zoom calculation as the editor. Framed photos retain section motion while their individual image drift is disabled so the chosen crop stays stable. Responsive preview proportions follow the existing component layouts; fluid heroes and wide photos continue adapting to the visitor's viewport.

Video framing controls the visible area; existing start/end controls still determine playback time. A video's poster uses the video's viewport. Social cards require an actual derived image, so applying an OG frame exports a 1200×630 JPG and saves it through the existing authenticated upload flow. Cross-origin sources that disallow canvas export show an actionable error without replacing the current image.

## Verification

DOM interaction checks cover framing controls, video timing preservation, per-scope persistence, cancellation, source changes, SQL-compatible payload shape, record/React source propagation, keyboard access and cleanup. Existing 56 admin workflow checks and 65 CMS document checks pass. The production build passes. Browser visual rendering, real media decoding and authenticated Storage writes were not exercised in this environment.
