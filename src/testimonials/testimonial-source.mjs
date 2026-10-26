import {parseMediaFrame,serializeMediaFrame} from '../../cms/media-framing.mjs';
/** Read only the rendered, already-filtered CMS cards; never fetch draft data. */
export function readTestimonialItems(host) {
 const source=host.querySelector('[data-testimonial-source]');
 if(!source)return [];
 return [...source.querySelectorAll(':scope > figure')].map((card,index)=>{
  const image=card.querySelector('img');let avatar='';
  if(image){const value=image.getAttribute('src')||'';if(value.startsWith('/')&&!value.startsWith('//')||/^https:\/\//i.test(value))avatar=value;}
  const frame=parseMediaFrame(image?.getAttribute('data-media-frame'),avatar);
  return {id:card.getAttribute('data-testimonial-id')||'testimonial-'+index,
   name:card.querySelector('figcaption strong')?.textContent?.trim()||'Ad soyad',
   quote:card.querySelector('blockquote')?.textContent?.trim()||'',
   role:card.querySelector('[data-testimonial-role]')?.textContent?.trim()||'',
   company:card.querySelector('[data-testimonial-company]')?.textContent?.trim()||'',avatar,
   ...(frame?{avatarFrame:serializeMediaFrame(frame)}:{}),
   draft:card.hasAttribute('data-testimonial-draft'),hidden:card.hasAttribute('data-testimonial-hidden')};
 });
}
