/** Read only the rendered, already-filtered CMS cards; never fetch draft data. */
export function readTestimonialItems(host) {
 const source=host.querySelector('[data-testimonial-source]');
 if(!source)return [];
 return [...source.querySelectorAll(':scope > figure')].map((card,index)=>{
  const image=card.querySelector('img');let avatar='';
  if(image){const value=image.getAttribute('src')||'';if(value.startsWith('/')&&!value.startsWith('//')||/^https:\/\//i.test(value))avatar=value;}
  return {id:card.getAttribute('data-testimonial-id')||'testimonial-'+index,
   name:card.querySelector('figcaption strong')?.textContent?.trim()||'Ad soyad',
   quote:card.querySelector('blockquote')?.textContent?.trim()||'',
   role:card.querySelector('figcaption span')?.textContent?.trim()||'',avatar,
   draft:card.hasAttribute('data-testimonial-draft'),hidden:card.hasAttribute('data-testimonial-hidden')};
 });
}
