/** Use the shipped rendering and editor modules in VM checks, not replacements. */
export {applyContent,validateDocument,safeURL} from '../cms/render.mjs';
export {deriveNavigation,applyNavigation} from '../cms/navigation.mjs';
export {renderNavigationEditor,wireNavigationEditor} from '../cms/admin-navigation.mjs';
export {deriveCollection,applyCollection} from '../cms/collections.mjs';
export {renderCollectionEditor,wireCollectionEditor} from '../cms/admin-collections.mjs';
export {experienceDefaults,applyExperience} from '../cms/experience.mjs';
export {renderExperienceEditor,wireExperienceEditor} from '../cms/admin-experience.mjs';
export {composeContent} from '../cms/compose.mjs';
export {auditContentLinks} from '../cms/link-audit.mjs';

export {wirePageVideoPreview} from '../cms/admin-video-preview.mjs';

export {currentContentPayload} from '../cms/content-revisions.mjs';
export {withInitialPageDrafts} from '../cms/admin-initial-pages.mjs';
export {applyTestimonials} from '../cms/testimonials.mjs';
export {renderTestimonialsEditor,wireTestimonialsEditor} from '../cms/admin-testimonials.mjs';
export {renderReferencesEditor,wireReferencesEditor} from '../cms/admin-references.mjs';

export {enhanceDetails,animateVisibility,setDetailsOpen} from '../src/interactions/disclosure-motion.mjs';

export {renderMediaFrameEditor,wireMediaFrameEditor} from '../cms/admin-media-frame.mjs';
export {parseMediaFrame,serializeMediaFrame,mediaFrameKey,getMediaFrameSpec} from '../cms/media-framing.mjs';
export {exportSocialImageFrame} from '../cms/admin-media-export.mjs';
