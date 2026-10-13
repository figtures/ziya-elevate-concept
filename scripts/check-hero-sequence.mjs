import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync(new URL('../public/assets/tedx-hero.js',import.meta.url),'utf8');
assert.equal(code,readFileSync(new URL('../website/assets/tedx-hero.js',import.meta.url),'utf8'),'Source and served hero script must match.');
function fixture({reduced=false,hidden=false,apiAvailable=true,legacySource=false}={}){
 let time=0;const timers=new Set(),observers=[],mutations=[],players=[],scripts=[];
 const element=(dataset={})=>{const handlers={},classes=new Set();return {dataset,paused:true,currentTime:0,attributes:{},loadCount:0,classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)},getAttribute(k){return this.attributes[k]??null;},hasAttribute(k){return k in this.attributes;},setAttribute(k,v){this.attributes[k]=v;},load(){this.loadCount++;this.paused=true;this.currentTime=0;},removeAttribute(k){delete this.attributes[k];},addEventListener(k,f){(handlers[k]??=[]).push(f);},emit(k){for(const f of handlers[k]||[])f();},play(){if(this.paused){this.paused=false;this.emit('playing');}return Promise.resolve();},pause(){this.paused=true;}};};
 const videos=[element({heroClip:'sahne',src:'/assets/sahne.mp4'}),element({heroClip:'uluslararasi',src:'/assets/uluslararasi.mp4'})];
 if(legacySource) videos.forEach(v=>{v.setAttribute('src',v.dataset.src);delete v.dataset.src;});
 const use=element(),label=element(),button=element();button.querySelector=s=>s==='use'?use:label;
 const section=element();section.querySelector=()=>button;
 const host=element({videoId:'u-p2y6JH3aA',clipStart:'31',clipEnd:'35'});host.closest=()=>section;host.querySelectorAll=()=>videos;
 const body=element(),dialog=element(),document=element();document.body=body;document.hidden=hidden;document.dispatchEvent=()=>{};document.querySelector=s=>s==='[data-tedx-hero]'?host:s==='dialog[open]'&&dialog.open?dialog:null;document.getElementById=()=>dialog;document.head={append:e=>scripts.push(e)};document.createElement=()=>element();
 const media=element();media.matches=reduced;
 const YT={PlayerState:{PLAYING:1,ENDED:0},Player:class{constructor(id,config){this.config=config;this.current=31;this.state=2;this.loads=0;this.destroyed=0;players.push(this);}mute(){}getIframe(){return element();}getCurrentTime(){return this.current;}getPlayerState(){return this.state;}playVideo(){if(this.state!==1){this.state=1;this.config.events.onStateChange({data:1});}}pauseVideo(){this.state=2;}loadVideoById(){this.loads++;}destroy(){this.destroyed++;}end(){this.config.events.onStateChange({data:0});}}};
 const context={document,window:apiAvailable?{YT}:{},YT,matchMedia:()=>media,location:{origin:'http://test.local'},performance:{now:()=>time},Event:class{},IntersectionObserver:class{constructor(fn){observers.push(fn);}observe(){}},MutationObserver:class{constructor(fn){mutations.push(fn);}observe(){}},setInterval:fn=>(timers.add(fn),fn),clearInterval:fn=>timers.delete(fn)};
 vm.runInNewContext(code,context);
 return {videos,host,button,label,document,body,timers,players,scripts,get player(){return players[0];},ready(){const player=players[0];player.config.events.onReady({target:player});},apiReady(){context.window.YT=YT;context.window.onYouTubeIframeAPIReady?.();},tick(ms=100){time+=ms;for(const fn of [...timers])fn();},visible(value){observers[0]([{isIntersecting:value}]);},menu(value){body.classList.toggle('menu-open',value);mutations[0]();},dialog(value){dialog.open=value;mutations[1]();},hidden(value){document.hidden=value;document.emit('visibilitychange');},motion(value){media.matches=value;media.emit('change');}};
}
{
 const f=fixture();f.ready();assert.equal(f.player.config.playerVars.autoplay,0,'Only sync() may start playback after mute and visibility checks.');assert.equal(f.player.config.playerVars.start,31);assert.equal(f.player.config.playerVars.end,35);assert.ok(f.videos.every(v=>v.paused&&v.preload==='none'&&!v.hasAttribute('src')),'No native request during TEDx intro.');
 assert.equal(f.label.textContent,'Videoyu duraklat');assert.equal(f.button.attributes['aria-label'],f.label.textContent);
 f.player.current=34.9;f.tick();assert.equal(f.host.dataset.playback,'intro');
 f.player.current=35;f.tick();assert.equal(f.host.dataset.clip,'sahne');assert.equal(f.host.dataset.introComplete,'played');
 assert.equal(f.videos[0].preload,'auto');assert.equal(f.videos[0].getAttribute('src'),'/assets/sahne.mp4');assert.equal(f.videos[1].preload,'none','Inactive clip must not compete for an early metadata download.');assert.ok(!f.videos[1].hasAttribute('src'));
 assert.equal(f.player.destroyed,1,'The finished iframe must be released after the first native frame.');assert.equal(f.timers.size,0);
 f.player.end();assert.equal(f.host.dataset.clip,'sahne');
 for(let i=0;i<4;i++){f.videos[0].emit('ended');assert.equal(f.host.dataset.clip,'uluslararasi');assert.equal(f.videos[0].preload,'none');assert.equal(f.videos[0].getAttribute('src'),'/assets/sahne.mp4','Completed clip keeps its source and buffer.');assert.equal(f.videos[1].preload,'auto');assert.equal(f.videos[1].getAttribute('src'),'/assets/uluslararasi.mp4');f.videos[1].emit('ended');assert.equal(f.host.dataset.clip,'sahne');assert.equal(f.videos[1].preload,'none');assert.equal(f.videos[0].loadCount,1,'A completed clip must reuse its buffer without load() on every rotation.');assert.equal(f.videos[1].loadCount,1,'Second clip is attached once, then reused.');}
 assert.equal(f.player.loads,0,'The opening TEDx must never reload.');
 f.videos[0].currentTime=2;f.button.emit('click');assert.ok(f.videos.every(v=>v.paused&&v.preload==='none'));assert.equal(f.label.textContent,'Videoyu oynat');assert.equal(f.button.attributes['aria-label'],f.label.textContent);assert.equal(f.videos[0].currentTime,2,'Pause retains the active playback position.');f.button.emit('click');assert.equal(f.videos[0].paused,false);
 f.visible(false);assert.ok(f.videos.every(v=>v.paused));f.visible(true);assert.equal(f.host.dataset.clip,'sahne');
 f.menu(true);assert.ok(f.videos.every(v=>v.paused));f.menu(false);assert.equal(f.player.state,2);
 f.dialog(true);assert.ok(f.videos.every(v=>v.paused));f.dialog(false);assert.equal(f.videos[0].paused,false);
 f.hidden(true);assert.ok(f.videos.every(v=>v.paused));f.hidden(false);assert.equal(f.videos[0].paused,false);
 assert.equal(f.player.destroyed,1,'Returning to the hero cannot recreate or destroy the finished intro twice.');
}
{
 const f=fixture();f.tick(8100);assert.equal(f.host.dataset.introComplete,'unavailable');assert.equal(f.host.dataset.clip,'sahne');f.ready();assert.equal(f.player.state,2,'Late YouTube readiness must not restart the introduction.');assert.equal(f.player.destroyed,1);
}
{
 const f=fixture({reduced:true,apiAvailable:false});assert.equal(f.scripts.length,0);assert.equal(f.timers.size,0);f.tick(20000);assert.ok(f.videos.every(v=>v.paused));assert.equal(f.host.dataset.introComplete,undefined);f.button.emit('click');assert.equal(f.scripts.length,1);f.apiReady();f.ready();assert.equal(f.player.state,1);
}
{
 const f=fixture({hidden:true,apiAvailable:false});assert.equal(f.scripts.length,0);assert.equal(f.timers.size,0);f.hidden(false);assert.equal(f.scripts.length,1);f.menu(true);f.apiReady();assert.equal(f.players.length,0,'An API response while obscured must not create an iframe.');f.menu(false);assert.equal(f.players.length,1);f.ready();assert.equal(f.player.state,1);
}
{
 const f=fixture({apiAvailable:false});assert.equal(f.scripts.length,1);f.scripts[0].onerror();assert.equal(f.host.dataset.introComplete,'unavailable');assert.equal(f.host.dataset.clip,'sahne');f.apiReady();assert.equal(f.players.length,0);
}
{
 const f=fixture();f.ready();f.visible(false);assert.equal(f.timers.size,0);f.tick(30000);assert.equal(f.host.dataset.introComplete,undefined);f.visible(true);f.tick(100);assert.equal(f.host.dataset.introComplete,undefined,'An offscreen interval must not consume the intro watchdog.');f.player.current=35;f.tick();assert.equal(f.host.dataset.clip,'sahne');
}
{
 const f=fixture();f.ready();f.player.config.events.onAutoplayBlocked();assert.equal(f.host.dataset.clip,'sahne');f.videos[0].emit('error');assert.equal(f.host.dataset.clip,'uluslararasi');f.videos[1].emit('ended');assert.equal(f.host.dataset.clip,'uluslararasi','Skip a failed native clip.');f.videos[1].emit('error');assert.ok(f.videos.every(v=>v.paused));
}
{
 const f=fixture();f.ready();f.motion(true);assert.equal(f.player.state,2);assert.equal(f.timers.size,0);f.motion(false);assert.equal(f.player.state,1);f.player.current=35;f.tick();f.videos[1].play=()=>Promise.reject(Object.assign(new Error('Blocked'),{name:'NotAllowedError'}));f.videos[0].emit('ended');await new Promise(resolve=>setImmediate(resolve));assert.ok(f.videos.every(v=>v.paused&&v.preload==='none'),'A native play rejection must pause and release auto preload.');
}
{
 const f=fixture({legacySource:true});assert.ok(f.videos.every(v=>!v.hasAttribute('src')&&v.preload==='none'),'Legacy templates are normalized without downloading inactive clips.');f.ready();f.player.current=35;f.tick();assert.equal(f.videos[0].getAttribute('src'),'/assets/sahne.mp4');
}
{
 const f=fixture();f.ready();f.videos[0].emit('error');f.videos[1].emit('error');f.player.current=35;f.tick();assert.ok(f.videos.every(v=>v.paused&&!v.hasAttribute('src')));assert.equal(f.player.destroyed,1,'A failed native playlist still releases the third-party player.');
}
console.log('PASS: intro once, two-clip rotation, deferred unplayed sources, completed media buffer reuse, preserved resume positions, accessible control labels, iframe release, API deferral/errors, late events, pause/resume, viewport/menu/dialog/tab, reduced motion, stalled intro, native errors/rejections.');
