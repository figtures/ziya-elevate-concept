import assert from 'node:assert/strict';
import {createUserHandler} from '../cms/user-management.mjs';
const config={enabled:true,url:'https://database.example.test',publishableKey:'public-test-key'};
function harness(overrides={}){
 const calls=[];const state={member:{role:'owner',active:true,must_change_password:false},...overrides};
 const makeClient=(url,key,options)=>{
  calls.push({kind:'client',key,options});
  if(key==='secret-test-key')return {auth:{admin:{createUser:async body=>{calls.push({kind:'create',body});return state.createResult||{data:{user:{id:'created-id'}},error:null};},deleteUser:async id=>{calls.push({kind:'delete',id});return {error:null};}}}};
  return {auth:{getUser:async token=>{calls.push({kind:'verify',token});return {data:{user:state.invalid?null:{id:'owner-id'}},error:state.invalid?{}:null};}},from:()=>({select:()=>({eq:()=>({single:async()=>({data:state.member,error:null})})})}),rpc:async(name,args)=>{calls.push({kind:'rpc',name,args});return {error:state.grantError?{}:null};}};
 };
 return {calls,async request(body={email:' New@Example.org ',role:'editor'},headers={},secret='secret-test-key'){
  const req=new Request('https://panel.example.test/api/cms/users',{method:'POST',headers:{origin:'https://panel.example.test',authorization:'Bearer valid-owner-token','content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
  return createUserHandler(req,{config,secret,makeClient});
 }};
}
let count=0;
for(const scenario of [
 {headers:{authorization:''},status:401},{headers:{origin:'https://evil.test'},status:403},{headers:{'sec-fetch-site':'cross-site'},status:403},{headers:{'content-type':'text/plain'},status:415},
 {body:{email:'a@example.org',role:'owner'},status:400},{body:{email:'a@@example.org',role:'editor'},status:400},{body:'{',status:400},{body:'x'.repeat(4097),status:413},
 {state:{invalid:true},status:401},{state:{member:{role:'admin',active:true}},status:403},{state:{member:{role:'owner',active:false}},status:403},{state:{member:{role:'owner',active:true,must_change_password:true}},status:403}
]){const h=harness(scenario.state);const r=await h.request(scenario.body,scenario.headers);assert.equal(r.status,scenario.status);assert.equal(h.calls.filter(x=>x.kind==='create').length,0);count++;}
const ok=harness(),r=await ok.request(),body=await r.json();assert.equal(r.status,201);assert.equal(body.email,'new@example.org');assert.match(body.temporaryPassword,/^Zy!4[a-f0-9]{32}$/);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(ok.calls.find(x=>x.kind==='create').body.email_confirm,true);assert.equal(ok.calls.find(x=>x.kind==='verify').token,'valid-owner-token');assert.equal(ok.calls.find(x=>x.kind==='rpc').name,'cms_register_created_member');assert.ok(!JSON.stringify(body).includes('secret-test-key'));count++;
const duplicate=harness({createResult:{data:null,error:{code:'email_exists',message:'SECRET'}}});assert.equal((await duplicate.request()).status,409);assert.equal(duplicate.calls.filter(x=>['rpc','delete'].includes(x.kind)).length,0);count++;
const rollback=harness({grantError:true}),rr=await rollback.request();assert.equal(rr.status,503);assert.equal(rollback.calls.find(x=>x.kind==='delete').id,'created-id');assert.ok(!(await rr.text()).includes('Zy!4'));count++;
const unconfigured=harness();assert.equal((await unconfigured.request(undefined,undefined,'')).status,503);assert.equal(unconfigured.calls.length,0);count++;
console.log(`PASS ${count} user-creation route security and response checks; no network or emails`);
