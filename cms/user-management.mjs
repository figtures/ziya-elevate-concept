import {createClient} from '@supabase/supabase-js';
const responseHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive'};
const reply=(body,status)=>Response.json(body,{status,headers:responseHeaders});
const fail=(status,error)=>reply({ok:false,error},status);
async function readBody(request){
 const reader=request.body?.getReader();if(!reader)throw Error('body');
 let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();throw new RangeError('size');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder().decode(bytes));
}
export async function createUserHandler(request,{config,secret,makeClient=createClient}){
 const origin=request.headers.get('origin');
 if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return fail(403,'Bu kaynaktan kullanıcı oluşturulamaz.');
 const authorization=request.headers.get('authorization')||'';
 if(!/^Bearer [^\s]+$/i.test(authorization))return fail(401,'Yeniden oturum açmanız gerekiyor.');
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return fail(415,'JSON gövdesi gerekli.');
 let body;try{body=await readBody(request);}catch(error){return fail(error instanceof RangeError?413:400,'Geçersiz kullanıcı bilgileri.');}
 if(!body||typeof body.email!=='string'||!['admin','editor'].includes(body.role))return fail(400,'E-posta ve kullanıcı yetkisini kontrol edin.');
 const email=body.email.trim().toLowerCase();
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||/[\u0000-\u001f\u007f]/u.test(email))return fail(400,'E-posta adresi geçersiz.');
 if(!config.enabled||!secret)return fail(503,'Kullanıcı oluşturma hizmeti henüz yapılandırılmadı.');
 const options={auth:{persistSession:false,autoRefreshToken:false}};
 try{
  const caller=makeClient(config.url,config.publishableKey,{...options,global:{headers:{Authorization:authorization}}});
  const {data:auth,error:authError}=await caller.auth.getUser(authorization.slice(7));
  if(authError||!auth?.user)return fail(401,'Oturumunuz doğrulanamadı. Yeniden giriş yapın.');
  const {data:member,error:memberError}=await caller.from('cms_members').select('role,active,must_change_password').eq('user_id',auth.user.id).single();
  if(memberError||!member?.active||member.role!=='owner'||member.must_change_password)return fail(403,'Kullanıcı oluşturmak için şifresini belirlemiş hesap sahibi yetkisi gerekir.');
  const admin=makeClient(config.url,secret,options);
  const temporaryPassword='Zy!4'+Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
  // Explicit owner-managed creation: no invite, confirmation, or recovery email.
  const {data:created,error:createError}=await admin.auth.admin.createUser({email,password:temporaryPassword,email_confirm:true});
  if(createError||!created?.user){
   if(['email_exists','user_already_exists'].includes(createError?.code))return fail(409,'Bu e-posta adresiyle zaten bir hesap var. Mevcut hesabın şifresi değiştirilmedi.');
   return fail(502,'Kullanıcı oluşturulamadı. Ekip listesini kontrol edip yeniden deneyin.');
  }
  // The caller-scoped RPC rechecks owner rights and atomically adds a locked member.
  const {error:grantError}=await caller.rpc('cms_register_created_member',{p_user_id:created.user.id,p_role:body.role});
  if(grantError){
   // Only the brand-new user from this operation can be rolled back.
   const {error:cleanupError}=await admin.auth.admin.deleteUser(created.user.id);
   return fail(503,cleanupError?'Hesap oluşturuldu ancak panel yetkisi atanamadı. Erişim kapalı; hesap sahibi teknik kurulumunu kontrol etmelidir.':'Panel yetkisi atanamadığı için kullanıcı oluşturma işlemi geri alındı.');
  }
  return reply({ok:true,email,temporaryPassword},201);
 }catch{return fail(502,'İşlemin sonucu doğrulanamadı. Yeniden denemeden önce ekip listesini kontrol edin.');}
}
