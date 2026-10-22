import assert from 'node:assert/strict';
import fs from 'node:fs';
import {currentBookPhotography, BOOK_PHOTOGRAPHY_REVISIONS} from '../cms/book-photography.mjs';
import {currentContentPayload} from '../cms/content-revisions.mjs';

const old='/assets/kitap-basari-studio-v1.webp', next=BOOK_PHOTOGRAPHY_REVISIONS[old];
const custom='https://media.example.com/editor-cover.webp';
const payload={id:'/kitaplar/',route:'/kitaplar/',template:'/kitaplar/',title:'Müşterinin düzenlediği başlık',values:{'book:@src':old,'link:@href':old,'text:text':old},sections:[{id:'books',hidden:true,values:{'cover:@src':old},groups:[{id:'inventory',items:[{id:'custom',hidden:false,values:{'image:@src':custom}},{id:'original',hidden:true,values:{'image:@src':old}}]}]}],testimonials:{items:[{name:'Private draft',status:'draft'}]}};
const original=JSON.stringify(payload),updated=currentBookPhotography(payload);
assert.equal(JSON.stringify(payload),original,'Existing stored objects remain immutable');
assert.equal(updated.values['book:@src'],next);
assert.equal(updated.values['link:@href'],old,'A text/link field with the same value is not an image migration');
assert.equal(updated.values['text:text'],old);
assert.equal(updated.sections[0].values['cover:@src'],next);
assert.equal(updated.sections[0].groups[0].items[1].values['image:@src'],next);
assert.equal(updated.sections[0].groups[0].items[0].values['image:@src'],custom,'Editor-selected covers remain untouched');
assert.equal(updated.sections[0].hidden,true);
assert.equal(updated.sections[0].groups[0].items[1].hidden,true);
assert.deepEqual(updated.sections[0].groups[0].items.map(i=>i.id),['custom','original']);
assert.equal(updated.title,payload.title);
assert.equal(updated.testimonials,payload.testimonials,'Draft comments are not approved or published by an asset update');
assert.equal(currentBookPhotography(updated),updated,'Already upgraded payloads retain identity');
const unrelated={...payload,route:'/satis/',template:'/satis/'};
assert.equal(currentBookPhotography(unrelated),unrelated);
assert.deepEqual(await currentContentPayload(payload,[]),updated,'Concurrent copy edits do not prevent this narrow media-only update');
const media=JSON.parse(fs.readFileSync('cms/media-seed.json','utf8'));
for(const url of Object.values(BOOK_PHOTOGRAPHY_REVISIONS)){
 assert(media.some(item=>item.url===url),'New photographs are selectable in the media library');
 assert(fs.existsSync('public'+url));assert(fs.existsSync('website'+url));
}
console.log('PASS: new book photography reaches stored/CMS payloads without changing custom covers, copy, order, visibility, unrelated pages or draft approvals; media mirrors exist.');
