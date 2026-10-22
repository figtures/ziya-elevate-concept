/** Per-record framing keeps the media source and publication controls intact. */
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {applyTestimonials} from '../cms/testimonials.mjs';
import {applyReferences} from '../cms/references.mjs';
import {renderTestimonialsEditor,wireTestimonialsEditor} from '../cms/admin-testimonials.mjs';
import {renderReferencesEditor,wireReferencesEditor} from '../cms/admin-references.mjs';
import {readTestimonialItems} from '../src/testimonials/testimonial-source.mjs';
import {parseMediaFrame,serializeMediaFrame} from '../cms/media-framing.mjs';
const avatar='/assets/person.webp',logo='/assets/logo.webp';
const makeFrame=src=>({v:1,src,desktop:{x:28,y:20,zoom:1.5},mobile:{x:40,y:15,zoom:1.2}});
const payload={route:'/',values:{},testimonials:{enabled:true,eyebrow:'Deneyimler',title:'Deneyimler',description:'',items:[{id:'person',name:'Test Kişisi',role:'Görev',company:'Kurum',avatar,quote:'Onaylı test metni.',status:'approved',enabled:true,approvedAt:'2026-10-22T00:00:00Z'}]},references:{enabled:true,eyebrow:'Referanslar',title:'Referanslar',duration:45,logos:[{id:'logo',name:'Test kurumu',src:logo,width:400,height:160,url:'',enabled:true}]}};
const avatarKey='media-frame:avatar:person',logoKey='media-frame:reference:logo';
payload.values[avatarKey]=serializeMediaFrame(makeFrame(avatar));payload.values[logoKey]=serializeMediaFrame(makeFrame(logo));
const {document}=parseHTML('<html><head></head><body><section class="editorial-home-hero"></section><section id="alanlar"></section></body></html>');
applyTestimonials(document,payload);applyReferences(document,payload);
assert.equal(document.querySelectorAll('style[data-media-framing-styles]').length,1);
for(const image of document.querySelectorAll('[data-media-framed]')){assert(image.parentElement.hasAttribute('data-media-frame-clip'));assert.equal(image.style.getPropertyValue('--media-frame-zoom'),'1.5');}
const items=readTestimonialItems(document.querySelector('[data-testimonials-carousel]'));
assert.equal(items[0].role,'Görev · Kurum');assert.deepEqual(parseMediaFrame(items[0].avatarFrame,avatar),makeFrame(avatar));
assert.equal(document.querySelector('#referanslar img').getAttribute('data-media-frame'),payload.values[logoKey]);
console.log('PASS SSR records and testimonial island data preserve both device frames and byline');

let selection;
const mountAvatar=()=>{const {document,window}=parseHTML('<html><head></head><body><main>'+renderTestimonialsEditor(payload.testimonials)+'</main></body></html>');wireTestimonialsEditor(document.querySelector('main'),{payload,pickMedia:(done,options)=>{selection={done,options};},onChange(){},rerender(){},confirmRemove:()=>true});return{document,window};};
let admin=mountAvatar();assert.equal(admin.document.querySelectorAll('img[data-media-framed]').length,2);
admin.document.querySelector('[data-testimonial-action="frame"]').click();assert.equal(selection.options.editOnly,true);assert.equal(selection.options.spec.desktop.width,selection.options.spec.desktop.height);
selection.done(avatar,{},makeFrame(avatar));assert.equal(payload.testimonials.items[0].status,'approved');assert.equal(payload.values[avatarKey],serializeMediaFrame(makeFrame(avatar)));
admin=mountAvatar();admin.document.querySelector('[data-testimonial-action="frame"]').click();selection.done(avatar,{},undefined);assert(!Object.hasOwn(payload.values,avatarKey));
payload.values[avatarKey]=serializeMediaFrame(makeFrame(avatar));admin=mountAvatar();const input=admin.document.querySelector('[data-testimonial-field="0:avatar"]');input.value='/assets/new-person.webp';input.dispatchEvent(new admin.window.Event('input'));assert(!Object.hasOwn(payload.values,avatarKey));
console.log('PASS avatar picker, original reset and direct source change keep approval and clear stale framing');

globalThis.Image=class{set src(value){this.value=value;}};
const mountLogo=()=>{const {document,window}=parseHTML('<html><head></head><body><main>'+renderReferencesEditor(payload.references)+'</main></body></html>');wireReferencesEditor(document.querySelector('main'),{payload,pickMedia:(done,options)=>{selection={done,options};},onChange(){},rerender(){},confirmRemove:()=>true});return{document,window};};
admin=mountLogo();assert.equal(admin.document.querySelectorAll('img[data-media-framed]').length,1);admin.document.querySelector('[data-reference-action="frame"]').click();assert.equal(selection.options.editOnly,true);assert.deepEqual(selection.options.spec.desktop,{width:146,height:66});selection.done(logo,{},makeFrame(logo));assert.equal(payload.values[logoKey],serializeMediaFrame(makeFrame(logo)));
admin=mountLogo();admin.document.querySelector('[data-reference-action="remove"]').click();assert(!Object.hasOwn(payload.values,logoKey));
console.log('PASS logo picker respects live slot sizes and removing a record cleans companion metadata');

payload.testimonials.items[0].avatar='/assets/changed.webp';payload.values[avatarKey]=serializeMediaFrame(makeFrame(avatar));applyTestimonials(document,payload);assert.equal(document.querySelector('#deneyimler img').getAttribute('data-media-framed'),null);assert.equal(readTestimonialItems(document.querySelector('[data-testimonials-carousel]'))[0].avatarFrame,undefined);
payload.testimonials.items[0].status='draft';applyTestimonials(document,payload);assert.equal(document.querySelector('#deneyimler'),null);
console.log('PASS source mismatch drops crop and draft framing never exposes an unapproved quote');
