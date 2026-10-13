// Run by check-cms-security.mjs inside its isolated PGlite database.
// These assertions use the same role-gated RPCs as the admin UI, never bypass writes.
import assert from 'node:assert/strict';
export async function checkAdvancedCMS({db,allow,deny,editor,admin,doc}) {
  const node=(id,href='/sample/')=>({id,label:'Bağlantı',href,hidden:false,newTab:false});
  const navigation={version:1,primary:[{...node('top'),children:[node('child')]}],mobileSecondary:[node('mobile')],audience:[node('audience')],social:[node('social','https://example.test/profile')],footer:[{id:'footer',title:'Yazılar',placement:'columns',hidden:false,items:[node('footer-link','/makaleler/')]}]};
  const collection={version:1,appendNew:false,excluded:['/makaleler/gizli/'],categories:[{id:'writing',source:'source',label:'Yazılar',hidden:false,items:[{route:'/makaleler/ikinci/',label:'İkinci yazı',badge:'Öne çıkan',hidden:false},{route:'/makaleler/ilk/',label:'İlk yazı',badge:'',hidden:true}]}]};
  const experience={floating:{enabled:true,label:'Sorun',href:'/iletisim/'},playback:{playLabel:'Oynat',pauseLabel:'Duraklat'},talk:{title:'Konuşma',closeLabel:'Kapat',watchLabel:'İzle',href:'https://youtube.com/watch?v=abc'},contact:{phone:'905001234567',submitLabel:'Gönder',greeting:'Merhaba',privacyText:'Bilgileriniz talebiniz için kullanılır.'},playlist:[{id:'stage',src:'/assets/stage.mp4',poster:'https://example.test/poster.jpg',focal:'50% 40%'}],testUI:{previousLabel:'Geri',actionHref:'/iletisim/',teamHref:'mailto:info@example.test',reportDisclaimer:'Kişisel değerlendirmedir.'}};
  // Add a separate valid route to avoid touching the legacy sample revisions.
  const base={...doc,id:'advanced',route:'/advanced/'};
  const validPage={...base,experience,robots:'noindex',sections:[{id:'s',source:'s',hidden:false,values:{},groups:[{id:'g',items:[{id:'i',source:'i',hidden:true,values:{}}]}]}]};
  await allow(editor,'select * from public.cms_save_document($1,$2,$3)',['advanced',0,validPage]);
  await allow(admin,'select * from public.cms_publish_document($1,$2)',['advanced',1]);
  const published=(await allow('anon',"select payload from public.cms_published where id='advanced'")).rows[0].payload;
  assert.deepEqual(published,validPage);
  await deny(editor,'select * from public.cms_save_document($1,$2,$3)',['advanced',0,validPage],'PT409');

  // Validate optional models through real saves and inspect persisted payloads.
  const global={...base,id:'global',route:'/_global/',kind:'global',navigation};
  await allow(editor,'select * from public.cms_save_document($1,$2,$3)',['global',1,global]);
  await allow(admin,'select * from public.cms_publish_document($1,$2)',['global',2]);
  assert.deepEqual((await allow('anon',"select payload from public.cms_published where id='global'")).rows[0].payload.navigation,navigation);
  const archive={...base,id:'archive',route:'/makaleler/',collection};
  await allow(editor,'select * from public.cms_save_document($1,$2,$3)',['archive',0,archive]);
  await allow(admin,'select * from public.cms_publish_document($1,$2)',['archive',1]);
  assert.deepEqual((await allow('anon',"select payload from public.cms_published where id='archive'")).rows[0].payload.collection,collection);
  const notes={...base,id:'notes',route:'/hayattan-notlar/',collection:{...collection,excluded:[],categories:[{...collection.categories[0],items:[{...collection.categories[0].items[0],route:'/notlar/ilk/'}]}]}};
  await allow(editor,'select * from public.cms_save_document($1,$2,$3)',['notes',0,notes]);
  const reject=async (original,revision,mutate)=>{const p=structuredClone(original);mutate(p);await deny(editor,'select * from public.cms_save_document($1,$2,$3)',[p.id,revision,p],'22023');};
  for(const mutate of [
    p=>p.navigation=null,p=>p.navigation.version=2,p=>p.navigation.unknown=true,p=>delete p.navigation.social,
    p=>p.navigation.primary={},p=>p.navigation.primary=Array.from({length:21},(_,i)=>node('top'+i)),
    p=>p.navigation.primary[0].label=' ',p=>p.navigation.primary[0].label='a'.repeat(161),
    p=>p.navigation.primary[0].hidden='false',p=>p.navigation.primary[0].newTab=null,
    p=>p.navigation.primary[0].id='../bad',p=>p.navigation.primary[0].children=[node('top')],
    p=>p.navigation.primary[0].children[0].children=[node('too-deep')],
    p=>p.navigation.primary[0].children=Array.from({length:21},(_,i)=>node('c'+i)),
    p=>p.navigation.primary[0].onClick='alert(1)',p=>p.navigation.primary[0].label='Başarı merkezi',
    p=>p.navigation.mobileSecondary[0].children=[node('bad-child')],
    p=>p.navigation.footer[0].placement=null,p=>p.navigation.footer[0].placement='other',
    p=>p.navigation.footer[0].items=Array.from({length:41},(_,i)=>node('f'+i)),
    p=>p.navigation.footer=Array.from({length:9},(_,i)=>({...navigation.footer[0],id:'f'+i,items:[]})),
  ]) await reject(global,2,mutate);
  for(const url of ['javascript:alert(1)','data:text/html,bad','//evil.test/x','/\\evil.test','/ok\nnext','https://u:p@evil.test/','https://','https://evil.test/\"x','#','/x%0Afoo']) {
    await reject(global,2,p=>p.navigation.primary[0].href=url);
  }
  for(const url of ['/', '/makaleler/?q=hello#writing','#writing','https://example.test:443/path?x=1&y=2','mailto:info@example.test','tel:+905001234567']) {
    const p=structuredClone(global);p.navigation.primary[0].href=url;
    await db.query('select cms_private.validate_document($1,$2)',[p.id,p]);
  }
  for(const mutate of [
    p=>p.collection=null,p=>p.collection.version='1',p=>p.collection.appendNew='true',p=>p.collection.foo=true,
    p=>p.collection.categories=[],p=>p.collection.categories[0].source='../bad',
    p=>p.collection.categories[0].hidden=1,p=>p.collection.categories[0].label='merkez',
    p=>p.collection.categories.push(structuredClone(p.collection.categories[0])),
    p=>p.collection.categories[0].items.push(structuredClone(p.collection.categories[0].items[0])),
    p=>p.collection.categories[0].items[0].route='/notlar/ilk/',
    p=>p.collection.categories[0].items[0].route='https://evil.test/',
    p=>p.collection.categories[0].items[0].badge='a'.repeat(101),
    p=>p.collection.categories[0].items[0].hidden='false',p=>p.collection.categories[0].items[0].html='<script>',
    p=>p.collection.excluded=['/makaleler/ikinci/'],p=>p.collection.excluded=['/makaleler/a/','/makaleler/a/'],
    p=>p.collection.excluded=Array.from({length:501},(_,i)=>'/makaleler/a-'+i+'/'),
    p=>p.collection.categories[0].items=Array.from({length:501},(_,i)=>({route:'/makaleler/a-'+i+'/',label:'Yazı',badge:'',hidden:false})),
  ]) await reject(archive,1,mutate);
  for(const mutate of [
    p=>p.robots='all',p=>p.robots=null,p=>p.sections[0].groups[0].items[0].hidden='true',
    p=>p.navigation=navigation,p=>p.collection=collection,
    p=>p.experience=null,p=>p.experience.unknown={},p=>p.experience.version=1,
    p=>p.experience.floating.enabled='true',p=>p.experience.floating.html='<script>',
    p=>p.experience.contact.phone='abc',p=>p.experience.contact.greeting=17,
    p=>p.experience.contact.privacyText='x'.repeat(2001),p=>p.experience.contact.privacyText='x'+' '.repeat(2000),
    p=>p.experience.testUI.reportTitle='Merkez',
    p=>p.experience.playlist=[],p=>p.experience.playlist[0].src='data:video/mp4,bad',
    p=>p.experience.playlist[0].poster='mailto:x@example.test',p=>p.experience.playlist[0].src='//evil.test/vid.mp4',
    p=>p.experience.playlist[0].focal='url(javascript:alert(1))',p=>p.experience.playlist[0].id='../bad',
    p=>p.experience.playlist.push(structuredClone(p.experience.playlist[0])),
    p=>p.experience.playlist=Array.from({length:13},(_,i)=>({...experience.playlist[0],id:'v'+i})),
    p=>p.experience.talk.href='javascript:alert(1)',p=>p.experience.testUI.actionHref='data:text/html,test',
  ]) await reject(validPage,1,mutate);
  for(const helper of [
    ['cms_object_keys($1,$2,$3)',[{},[],[]]],['cms_text($1,$2,$3)',['"text"',0,20]],
    ['cms_url($1,$2)',['"/"',false]],['cms_navigation_item($1,$2)',[node('test'),false]],
    ['validate_advanced_controls($1)',[validPage]]
  ]) await deny(editor,'select cms_private.'+helper[0],helper[1],'42501');
  console.log('Advanced controls: RPC persistence, publication, unsafe input rejection and private helper ACLs passed');
}
