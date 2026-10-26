// One content pipeline for visitor HTML and the admin's draft preview.
import {applyContent} from './render.mjs';
import {applyNavigation} from './navigation.mjs';
import {applyCollection,applyHomeBooks} from './collections.mjs';
import {applyExperience} from './experience.mjs';
import {applyAEO} from './aeo.mjs';
import {applySEO} from './seo.mjs';
import {applyResources} from './resources.mjs';
import {applySpeakerLocale} from './speaker-locale.mjs';
import {applyReferences} from './references.mjs';
import {applyTestimonials} from './testimonials.mjs';
import {applyHomeLayout} from './home-layout.mjs';
import {applyPlaylistMediaFrames,ensureMediaFrameStyles} from './media-framing.mjs';
import {applyV13Technical} from './v13/technical.mjs';

/**
 * @param {any} document
 * @param {any} payload
 * @param {any} definition
 * @param {{sharedDocument?: any, sharedPayload?: any, sharedDefinition?: any,
 * entries?: any[], booksPayload?: any, booksDefinition?: any, canonicalOrigin?: string,
 * requestOrigin?: string, leadsEnabled?: boolean}} options
 */
export function composeContent(document,payload,definition,{sharedDocument,sharedPayload,sharedDefinition,entries,booksPayload,booksDefinition,canonicalOrigin,requestOrigin,leadsEnabled=false}={}){
 applyContent(document,payload,definition);
 if(sharedDocument&&sharedPayload&&sharedDefinition){
  applyContent(sharedDocument,sharedPayload,sharedDefinition,{global:true});
  if(sharedPayload.navigation)applyNavigation(sharedDocument,sharedPayload.navigation);
  for(const selector of ['body > header','body > footer']){
   const node=sharedDocument.querySelector(selector);if(node)document.querySelector(selector)?.replaceWith(node);
  }
  // Navigation assets added to the detached shared template must follow it.
  for(const selector of ['link[href="/assets/cms-navigation.css"]','script[src="/assets/cms-navigation.js"]']){
   const node=sharedDocument.querySelector(selector);if(node&&!document.querySelector(selector))(node.tagName==='LINK'?document.head:document.body).append(node.cloneNode(true));
  }
 }
 applySpeakerLocale(document,payload);
 for(const a of document.querySelectorAll('header.site a')){
  const href=a.getAttribute('href')||'';a.removeAttribute('aria-current');a.classList.remove('active');
  if(href===payload.route){a.setAttribute('aria-current','page');a.classList.add('active');}
  else if(href.startsWith('/')&&href.length>1&&!/[?#]/.test(href)&&payload.route.startsWith(href)){a.setAttribute('aria-current','location');a.classList.add('active');}
 }
 applyExperience(document,payload,sharedPayload,{leadsEnabled});
 applyPlaylistMediaFrames(document,payload);
 // Compose the homepage proof points over the film after CMS bindings resolve.
 // Keep the authored section IDs stable so existing edits and visibility survive.
 if(payload.route==='/'){
  applyHomeBooks(document,booksPayload,booksDefinition);
  applyHomeLayout(document,payload.route);
  const hero=document.querySelector('.editorial-home-hero');
  const proof=document.querySelector('#rakamlarla');
  if(hero&&proof){hero.classList.add('hero-with-proof');hero.append(proof);}
  applyReferences(document,payload);
  applyTestimonials(document,payload);
 }
 const sections=[...document.querySelectorAll('body > section')];
 if(sections.length){const main=document.createElement('main');main.id='main-content';sections[0].before(main);main.append(...sections);}
 if(entries&&['/makaleler/','/hayattan-notlar/'].includes(payload.route))applyCollection(document,payload.collection,entries,payload.route);
 applyAEO(document,payload);applySEO(document,payload,canonicalOrigin);applyResources(document);
 applyV13Technical(document,payload,{requestOrigin,canonicalOrigin});
 if(document.querySelector('[data-media-framed]'))ensureMediaFrameStyles(document);
 return document;
}
