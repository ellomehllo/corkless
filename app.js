import firebaseConfig from './firebase-config.js';
import supaConfig from './supabase-config.js';
import {makeDb} from './db.js?v=202610122323';
import {TERMS_V,EFFECTIVE,PRIVACY,TERMS} from './legal.js?v=202610171318';
import {modHit,MOD_CAT} from './mod.js?v=202610142017';

const FB = window.__TACK_FB_BASE || 'https://www.gstatic.com/firebasejs/12.19.0/';
const SB = window.__TACK_SB || 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
const SITE = window.__TACK_SITE || location.origin + location.pathname.replace(/index\.html$/, '');

const RINGS=['#C6F24E','#A18CFF','#FF5B6E','#4FE3E0','#FF7AD1','#FFC53D'];
const GLOW={'#A18CFF':'rgba(161,140,255,.45)','#FF5B6E':'rgba(255,91,110,.5)','#FFC53D':'rgba(255,197,61,.35)','#4FE3E0':'rgba(79,227,224,.4)','#FF7AD1':'rgba(255,122,209,.38)','#C6F24E':'rgba(170,226,84,.32)'};
const KINDS=['Errand','Lifting','Ride','Print','Teach','Photo','Notes','Music','Other'];
const WHENS=['Next hour','Today','Tomorrow','This week','No rush'];
const WHERES=['Gate 1','Hostel B','Canteen','Library','Off campus'];
const YEARS=['FY','SY','TY','Final year','PG'];
const STATUSES=['open','assigned','done','closed','removed'];
const REASONS=['Unsafe or harassing','Assignment or exam work','No-show or didn’t pay','Something else'];
const DEFAULT_CAMPUS='MIT-WPU';
const CRIT={d:[['timing','Timing','Showed up and finished when agreed'],['quality','Quality','Did the job well'],['comm','Communication','Replied and kept you updated'],['care','Care','Careful with your things, followed instructions']],
  p:[['payment','Payment','Paid what was agreed, on time'],['clarity','Clarity','The job was as described'],['comm','Communication','Easy to reach, replied on time'],['respect','Respect','Treated you well']]};
const ID_RE=/^[A-Za-z0-9_-]{6,128}$/, JOB_RE=/^[a-z0-9]{4,24}$/;
const NEAR_M=500,LOC={pos:null};
const locOptIn=()=>{try{return localStorage.getItem('tack.loc')==='1'}catch{return false}};
function getLoc(){if(!navigator.geolocation)return Promise.resolve(null);
  return new Promise(res=>navigator.geolocation.getCurrentPosition(p=>{LOC.pos={lat:p.coords.latitude,lng:p.coords.longitude};try{localStorage.setItem('tack.loc','1')}catch{};res(LOC.pos);if(S.phase==='app')render()},
    ()=>res(null),{enableHighAccuracy:true,maximumAge:3e5,timeout:12000}))}
function distM(a,b){const r=Math.PI/180,x=(b.lng-a.lng)*r*Math.cos((a.lat+b.lat)/2*r),y=(b.lat-a.lat)*r;return Math.sqrt(x*x+y*y)*6371e3}
const geoOk=g=>g&&typeof g==='object'&&Math.abs(num(g.lat))<=90&&Math.abs(num(g.lng))<=180&&(num(g.lat)||num(g.lng))?{lat:num(g.lat),lng:num(g.lng)}:null;
const nearMe=j=>!!(LOC.pos&&j.geo&&j.owner!==S.me?.id&&distM(LOC.pos,j.geo)<=NEAR_M);
const nearTag=()=>'<span class="neartag">'+ic('place',11,2.4)+' Near you</span>';
const PIC_RE=/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/,PIC_MAX=200000,MAX_PICS=3;
const PHOTO_RE=/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

const I={
 board:'<rect x="3" y="3" width="7.5" height="9.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="1.6"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.6"/><rect x="3" y="15.5" width="7.5" height="5.5" rx="1.6"/>',
 bids:'<path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
 chat:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4.2-1L3 20l1.1-4.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"/>',
 me:'<path d="M20 21v-1.5a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V21"/><circle cx="12" cy="7.5" r="4"/>',
 plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
 back:'<line x1="20" y1="12" x2="5" y2="12"/><polyline points="11 18 5 12 11 6"/>',
 send:'<line x1="21" y1="3" x2="10" y2="14"/><polygon points="21 3 14.5 21 10 14 3 9.5 21 3"/>',
 tick:'<polyline points="20 6 9 17 4 12"/>',
 flag:'<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
 users:'<path d="M17 21v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V21"/><circle cx="9.5" cy="7.5" r="4"/><path d="M22 21v-1.5a4 4 0 0 0-3-3.9"/><path d="M16 3.6a4 4 0 0 1 0 7.8"/>',
 shield:'<path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z"/>',
 edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
 trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/>',
 star:'<polygon points="12 2.5 15 8.8 21.9 9.6 16.8 14.3 18.2 21.2 12 17.8 5.8 21.2 7.2 14.3 2.1 9.6 9 8.8 12 2.5"/>',
 chev:'<polyline points="9 6 15 12 9 18"/>',
 place:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
 out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
 share:'<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><line x1="8.3" y1="10.8" x2="15.7" y2="6.2"/><line x1="8.3" y1="13.2" x2="15.7" y2="17.8"/>',
 bookmark:'<path d="M6 3h12v18l-6-4.5L6 21Z"/>',
 download:'<path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M4 19h16"/>',
 link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/>',
 search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="21"/>',
 play:'<polygon points="7 4 20 12 7 20 7 4"/>',
 pause:'<line x1="8" y1="5" x2="8" y2="19"/><line x1="16" y1="5" x2="16" y2="19"/>',
 bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
 camera:'<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>',
 eyeoff:'<path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-2.4 3.3M6.6 6.6C3.6 8.5 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m3 3 18 18"/>',
 ban:'<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
 moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
 smile:'<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
 note:'<path d="M5 3.5h14a1 1 0 0 1 1 1V14l-6.5 6.5H5a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/><path d="M13.5 20.5V15a1 1 0 0 1 1-1H20"/><path d="M8 8h8M8 11.5h4.5"/>',
  bid:'<circle cx="12" cy="12" r="9.5"/><path d="M8.5 7.5h7M8.5 10.5h7"/><path d="M11 7.5c2.2 0 3.5 1.1 3.5 3s-1.3 3-3.5 3H8.5l4.5 4"/>',
  tagged:'<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="10" r="3"/><path d="M6.5 20.5a6 6 0 0 1 11 0"/>',
  dots:'<path d="M12 5h.01M12 12h.01M12 19h.01" stroke-width="3"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="1.8"/><path d="m21 15-4.5-4.5L6 21"/>',
 reply:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
 copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>'
};
const SAY_MAX=3500,SAY_WORDS=500,words=t=>(String(t||'').trim().match(/\S+/g)||[]).length,sayOver=t=>SAY_MAX<1000?String(t||'').length>SAY_MAX:words(t)>SAY_WORDS,sayCount=t=>SAY_MAX<1000?`${String(t||'').length} / ${SAY_MAX} characters`:`${words(t)} / ${SAY_WORDS} words`;
const ic=(n,s=20,w=2,c='currentColor',fill='none')=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${fill}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

const blankDraft=()=>({text:'',price:'',kind:'Errand',when:'Today',where:'Gate 1',whereText:'',more:'',pics:[],useLoc:locOptIn(),hue:199});
const inviteParam=(new URLSearchParams(location.search).get('invite')||'').trim().toLowerCase();
const jobParam=(new URLSearchParams(location.search).get('job')||'').slice(0,80);
const chatParam=(new URLSearchParams(location.search).get('chat')||'').slice(0,160);
const codeParam=((new URLSearchParams(location.search).get('code')||'').trim().toLowerCase().match(/^[a-z0-9]{8,24}$/)||[''])[0];
const S={
  phase:'loading', fb:null, db:null, auth:null, user:null, me:null, signingUp:false, erased:false,
  authMode:inviteParam||codeParam?'signup':'login', authErr:'', authMsg:'', busy:false,
  form:{name:'',email:inviteParam,pw:'',colq:'',college:'',notListed:false,ncol:'',ncity:''}, cat:null, cpick:null,
  ready:{config:false,people:false,priv:false}, subs:[],
  config:{}, peopleDocs:{}, priv:{}, threadDocs:{}, pitchIn:{}, pitchMine:{}, offersIn:{}, offersOut:{}, onlineDocs:{}, myCodes:{}, lastCode:null,
  offer:{to:null,prevJob:null,text:'',price:'',when:'Next hour',where:''}, invites:{}, reports:[], myInvite:null,
  myDoc:null, pendingMine:0,
  view:'board', openJob:null, personOf:null, sort:'high', find:{q:''}, near:false,
  draft:blankDraft(), bid:{key:null,amt:'',say:'',pics:[]}, pics:{}, revs:{}, allRevs:null, pw:{cur:'',nw:''}, pwOpen:false, help:{kind:null,job:null,why:'',note:'',sent:null}, actTab:'all', actSeenAt:0, intro:{on:false,i:0}, fresh:null, chatDraft:{text:''}, pay:{upi:null,ref:''},
  onb:{name:'',photo:'',year:'',branch:'',does:'',ring:'',banner:'',adult:false,rules:false},
  inv:{email:'',campus:'',camp:''}, camp:{q:''}, coms:{}, cmine:{}, cinv:{}, cid:null, cnote:null, cnotes:{}, ccoms:{}, cmembers:{}, cdraft:{name:'',about:'',text:'',more:'',color:'#7FA2FF',handle:'',comment:''}, lastInvite:null, myCampus:null, campuses:{}, viewCampus:(()=>{try{return localStorage.getItem('tack.viewCampus')||''}catch{return''}})(),
  picks:{}, repDocs:{},
  sheet:null, omenu:null, pnotes:{}, ptab:'notes', following:{}, followers:{}, ffeed:[], rate:{a:0,b:0,c:0,d:0,text:'',rev:'',pics:[]}, rep:{why:'',note:'',block:false}, erase:{pw:''},
  chat:{key:null}, err:{}
};

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o??{}));
const str=(v,n)=>typeof v==='string'?v.slice(0,n):'';
const num=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
const fmt=n=>Math.round(num(n)).toLocaleString('en-IN');
const rid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const digits=v=>parseInt(String(v??'').replace(/\D/g,''),10);
const arr=v=>Array.isArray(v)?v.filter(x=>typeof x==='string'):[];
const validEmail=e=>/^[^\s@/]+@[^\s@/]+\.[^\s@/]{2,}$/.test(e);
function clock(t){const d=new Date(t),h=d.getHours()%12||12,m=String(d.getMinutes()).padStart(2,'0');return `${h}:${m} ${d.getHours()<12?'am':'pm'}`}
function ago(t){const s=(Date.now()-t)/1000;if(s<60)return'now';if(s<3600)return Math.floor(s/60)+'m';if(s<86400)return Math.floor(s/3600)+'h';const d=new Date(t);return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
function since(t){const a=ago(t);return a==='now'?'just now':/^\d+[mh]$/.test(a)?a+' ago':'on '+a}
function chatStamp(t){const d=new Date(t),now=new Date(),day=x=>new Date(x).setHours(0,0,0,0),days=Math.round((day(now)-day(d))/864e5);
  if(days===0)return clock(t);if(days===1)return'Yesterday '+clock(t);if(days<7)return d.toLocaleDateString('en-IN',{weekday:'short'})+' '+clock(t);
  return d.toLocaleDateString('en-IN',d.getFullYear()===now.getFullYear()?{day:'numeric',month:'short'}:{day:'numeric',month:'short',year:'numeric'})+', '+clock(t)}
function stamp(t){const d=new Date(t),today=new Date();return d.toDateString()===today.toDateString()?clock(t):d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+', '+clock(t)}
function deadlineFor(when,at){
  const eod=k=>{const x=new Date(at);x.setDate(x.getDate()+k);x.setHours(23,59,59,0);return +x};
  switch(when){case'Next hour':return at+36e5;case'Today':return eod(0);case'Tomorrow':return eod(1);case'This week':return at+7*864e5;default:return at+30*864e5}
}

function pdoc(uid){return uid===S.me?.id?(S.myDoc||{}):(S.peopleDocs[uid]||{})}
const HANDLE_RE=/^(?![.])(?!.*[.]{2})[a-z0-9._]{4,20}(?<![.])$/,HANDLE_DAYS=30,HANDLE_RESERVED=['tack','admin','organiser','organizer','support','official','moderator','staff','help','team','system','root','null','undefined','everyone'];
function handleOf(uid){const h=str(pdoc(uid).handle,20).toLowerCase();return HANDLE_RE.test(h)?h:''}
function myRealName(){return str(S.myName||S.myDoc?.name||S.onb.name||S.user?.displayName,60).trim()}
const isOrg=uid=>!!uid&&uid===ownerId();
function realNameOf(uid){const me=S.me?.id;if(!uid)return'';if(isOrg(uid))return'tack';if(uid===me)return myRealName();
  for(const p of Object.values(S.picks||{})){if(!p)continue;if(p.owner===me&&p.doer===uid&&typeof p.doerName==='string')return str(p.doerName,60).trim();if(p.doer===me&&p.owner===uid&&typeof p.posterName==='string')return str(p.posterName,60).trim()}
  if(S.me?.isOwner&&S.names&&S.names[uid])return S.names[uid];
  return handleOf(uid)?'':str(pdoc(uid).name,60).trim()}
function fullName(uid){return realNameOf(uid)}
function shortName(uid){if(isOrg(uid))return'tack';const n=uid===S.me?.id&&handleOf(uid)?'':realNameOf(uid);if(n){const p=n.split(/\s+/);return p.length>1?`${p[0]} ${p[p.length-1][0].toUpperCase()}.`:p[0]}const h=handleOf(uid);return h?'@'+h:(uid===S.me?.id?'You':'Someone')}
function firstName(uid){if(isOrg(uid))return'tack';const n=uid===S.me?.id&&handleOf(uid)?'':realNameOf(uid);if(n)return n.split(/\s+/)[0];const h=handleOf(uid);return h?'@'+h:(uid===S.me?.id?'You':'Someone')}
function handleCheck(raw){const h=String(raw||'').trim().replace(/^@/,'').toLowerCase();if(!h)return{h,st:'empty'};
  if(h.length<4)return{h,st:'short'};if(!HANDLE_RE.test(h))return{h,st:'chars'};if(HANDLE_RESERVED.includes(h)||modHit(h,h.replace(/[._]/g,'')))return{h,st:'taken'};return{h,st:'check'}}
let handleT=null;
function checkHandle(raw){const r=handleCheck(raw);S.hcheck={...r};clearTimeout(handleT);
  if(r.st==='check'){if(r.h===handleOf(S.me.id)){S.hcheck.st='mine';return}handleT=setTimeout(()=>{handleOwner(r.h).then(u=>{if(S.hcheck.h!==r.h)return;S.hcheck.st=u&&u!==S.me.id?'taken':'ok';paintHandle()}).catch(()=>{S.hcheck.st='ok';paintHandle()})},350)}}
function handleMsg(){const c=S.hcheck||{};return{empty:'',short:'At least 4 characters',chars:'Letters, numbers, . and _ only',taken:'Not available',check:'Checking…',ok:'Available ✓',mine:'This is your username'}[c.st]||''}
function paintHandle(){const el=$('hMsg');if(el){el.textContent=handleMsg();el.className='hmsg '+(S.hcheck?.st||'')}syncNeed()}
function handleLockedUntil(){const at=num(S.myDoc?.handleAt);return handleOf(S.me.id)&&at&&Date.now()<at+HANDLE_DAYS*864e5?at+HANDLE_DAYS*864e5:0}
function handleField(locked){const h=S.onb.handle||'';return`<div class="stack gap8"><label class="formlabel" for="ohd">Username <span class="muted">· what people see on the board</span></label>
  <label class="field hfield ${locked?'locked':''}" for="ohd"><span class="hat">@</span><input id="ohd" maxlength="20" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(h)}" data-bind="onb.handle" ${locked?'disabled':''} aria-describedby="hMsg"></label>
  <span id="hMsg" class="hmsg ${S.hcheck?.st||''}">${locked?esc(locked):handleMsg()}</span></div>`}
async function handleOwner(h){const {data,error}=await S.sb.from('people').select('id').eq('handle',h).maybeSingle();if(error)throw error;return data?data.id:null}
async function claimHandle(h){const me=S.me.id,u=await handleOwner(h);if(u&&u!==me)throw new Error('taken');
  if(!S.myNameSaved){const n=myRealName();if(n.length>=2){const {error}=await S.sb.from('names').insert({id:me,name:n.slice(0,60)});if(error&&error.code!=='23505')throw error}}
  S.myNameSaved=true}
function loadNames(D){S.names=S.names||{};for(const u of D.members){if(u in S.names||!handleOf(u))continue;S.names[u]='';S.fb.getDoc(S.fb.doc(S.db,'names',u)).then(d=>{if(d.exists()){S.names[u]=str(d.data().name,60);render()}}).catch(()=>{})}}
function syncDealNames(){const me=S.me?.id,n=myRealName();if(!me||!n||S.dealSync)return;
  for(const[k,p]of Object.entries(S.picks||{})){if(!p)continue;const f=p.doer===me&&typeof p.doerName!=='string'?'doerName':p.owner===me&&typeof p.posterName!=='string'?'posterName':'';if(!f||(S.dealFail||{})[k+f])continue;
    S.dealSync=true;S.picks={...S.picks,[k]:{...p,[f]:n}};S.fb.updateDoc(S.fb.doc(S.db,'picks',k),{[f]:n}).catch(e=>{console.warn(e);S.dealFail={...(S.dealFail||{}),[k+f]:1}}).finally(()=>{S.dealSync=false});return}}
function photoOf(uid){const p=uid===S.me?.id&&(S.phase==='onboard'||S.view==='edit')?S.onb.photo:pdoc(uid).photo;return typeof p==='string'&&p.length<300000&&PHOTO_RE.test(p)?p:''}
function ringOf(uid){const r=uid===S.me?.id&&S.onb.ring&&(S.phase==='onboard'||S.view==='edit')?S.onb.ring:pdoc(uid).ring;if(RINGS.includes(r))return r;let h=0;for(const c of String(uid))h=(h*31+c.charCodeAt(0))|0;return RINGS[Math.abs(h)%RINGS.length]}
function metaOf(uid){const d=pdoc(uid);return [str(d.year,12),str(d.branch,24)].filter(Boolean).join(' ')}
function face(uid,s){if(isOrg(uid))return tackFace(s);const src=photoOf(uid);return src?`<img class="av" src="${src}" width="${s}" height="${s}" alt="">`:`<span class="av av-empty" style="width:${s}px;height:${s}px;font-size:${Math.round(s*.4)}px">${esc((firstName(uid).replace(/^@/,'')[0]||'?').toUpperCase())}</span>`}
// Online: the database only shows this to people you've made a deal with. S.skew corrects for the phone's clock.
const onlineAt=uid=>num(S.onlineDocs?.[uid]?.at),onlineNow=uid=>{const t=onlineAt(uid);return uid!==S.me?.id&&t>0&&t>Date.now()+(S.skew||0)-150000};
const restricted=()=>arr(S.priv.restricted).filter(u=>typeof u==='string');
// Theme: 'dark' (default for existing members), 'light' or 'system'. Kept on this device and in private settings.
const THEMES=['dark','light','system'],lightMQ=matchMedia('(prefers-color-scheme: light)');
const themePref=()=>{try{const t=localStorage.getItem('tack.theme');return THEMES.includes(t)?t:''}catch{return''}};
function applyTheme(p){const t=p==='system'?(lightMQ.matches?'light':'dark'):p==='light'?'light':'dark';document.documentElement.dataset.theme=t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',t==='light'?'#F3F4F6':'#060608')}
function setTheme(p,save=true){if(!THEMES.includes(p))return;try{localStorage.setItem('tack.theme',p)}catch{}applyTheme(p);if(save&&S.me)savePriv({theme:p});else render()}
lightMQ.addEventListener?.('change',()=>{if(themePref()==='system')applyTheme('system')});
// An ask with no yes after 3 hours reads the same whether it was declined or ignored.
const askStale=o=>Date.now()-num(o.at)>3*36e5;
function ring(uid,s){return `<span class="ring${onlineNow(uid)?' live':''}" style="width:${s}px;height:${s}px">${face(uid,s-8)}</span>`}
const campusName=id=>str(S.campuses?.[id]?.name,60)||(id&&id===S.myCampus?.id?str(S.myCampus.name,60):'')||DEFAULT_CAMPUS;
const curCampus=()=>(S.me?.isOwner&&S.viewCampus&&S.campuses[S.viewCampus]?S.viewCampus:S.myCampus?.id)||'mit-wpu';
const campusOf=uid=>str(pdoc(uid).campus,40)||'mit-wpu';
const campus=()=>campusName(curCampus());
const ownerId=()=>typeof S.config.adminUid==='string'?S.config.adminUid:null;
const organiser=()=>{const o=ownerId();return o&&fullName(o)?firstName(o):'the organiser'};
const isMember=uid=>{const d=pdoc(uid);return !!d.adult&&!d.removed};

function normJob(id,j,uid){
  return{id,owner:uid,key:uid+'~'+id,text:str(j.text,400),more:str(j.more,600),price:num(j.price),kind:str(j.kind,20),
    when:str(j.when,20),where:str(j.where,40),at:num(j.at),deadline:num(j.deadline),
    status:STATUSES.includes(j.status)?j.status:'open',doneAt:num(j.doneAt),takenAt:num(j.takenAt),repickAt:num(j.repickAt),editedAt:num(j.editedAt),dropped:arr(j.dropped).filter(u=>typeof u==='string').slice(0,5),pics:Math.min(MAX_PICS,Math.max(0,Math.floor(num(j.pics)))),geo:geoOk(j.geo),campus:str(j.campus,40),color:COLOR_RE.test(str(j.color,7))?str(j.color,7):'',friendsOnly:j.friendsOnly===true,accepted:null,agreed:0,pick:null};
}
function jobState(j){return j.status==='open'&&j.deadline<Date.now()?'expired':j.status}
function derive(){
  const me=S.me.id,blocked=new Set(arr(S.priv.blocked));
  const cc=curCampus(),members=Object.keys(S.peopleDocs).filter(u=>u!==me&&ID_RE.test(u)&&isMember(u)&&(campusOf(u)===cc||(!S.me.isOwner&&isOrg(u))));
  if(S.myDoc?.adult)members.push(me);
  const jobs=[],jobByKey={},bidsByJob={};
  for(const uid of members){const d=pdoc(uid);
    if(d.jobs&&typeof d.jobs==='object')for(const[id,j]of Object.entries(d.jobs)){if(!JOB_RE.test(id)||!j||typeof j!=='object')continue;const n=normJob(id,j,uid);jobs.push(n);jobByKey[n.key]=n}
  }
  for(const p of [...Object.values(S.pitchIn),...Object.values(S.pitchMine)]){
    if(!p||typeof p.job!=='string'||typeof p.by!=='string'||!jobByKey[p.job]||!members.includes(p.by)||!(num(p.amt)>0))continue;
    const l=(bidsByJob[p.job]=bidsByJob[p.job]||[]);if(!l.some(b=>b.by===p.by))l.push({by:p.by,amt:num(p.amt),say:str(p.say,SAY_MAX),at:num(p.at),pics:Math.min(MAX_PICS,num(p.pics)),near:p.near===true})}
  for(const[k,pk]of Object.entries(S.picks)){const j=jobByKey[k];if(!j||!pk||typeof pk.doer!=='string')continue;
    j.accepted=pk.doer;j.agreed=num(pk.agreed);j.pick=pk;if(pk.doneAt)j.doneAt=num(pk.doneAt)}
  const D={members,jobs,jobByKey,bidsByJob,blocked};
  D.threads=threadsOf(D);D.convos=convosOf(D.threads);D.unread=D.convos.filter(t=>t.unread).length;
  D.notes=notesOf(D);D.newNotes=S.view==='bids'?0:D.notes.filter(n=>n.at>num(S.priv.actSeen)&&n.at<=Date.now()+6e4).length;
  D.toConfirm=jobs.filter(j=>j.accepted===me&&j.status==='done'&&(PAY_ON?!payOf(j)?.ok:!j.pick?.ratedPoster)).length;
  D.offersWaiting=offerList(S.offersIn).filter(o=>o.status==='pending'&&D.members.includes(o.owner)&&!D.blocked.has(o.owner)).length;
  return D;
}
function myBidOn(jobKey){const p=S.pitchMine[jobKey+'~'+S.me.id];return p&&num(p.amt)>0?{amt:num(p.amt),say:str(p.say,SAY_MAX),at:num(p.at),pics:Math.min(MAX_PICS,num(p.pics))}:null}
function threadOpen(k){return !!S.threadDocs[k]}
// Following is switched off: no followers, no friends, no friends-only jobs. A job's chat stays open while it's being bid on,
// during the deal and for a week after it's done; after that, either person can send a message request.
const FOLLOW_ON=false;
const isFollowing=u=>FOLLOW_ON&&!!S.following[u],followsMe=u=>FOLLOW_ON&&!!S.followers[u],isFriend=u=>isFollowing(u)&&followsMe(u),canChat=isFriend;
const CHAT_GRACE=7*864e5,DM_REQ_MAX=3;
// Anyone can message anyone they can see. The first messages arrive as a message request: up to 3 messages,
// and the other person accepts or declines.
function dmState(k,u){if(isFriend(u))return'open';const d=S.threadDocs[k];if(!d)return'requesting';if(!d.req)return'open';if(d.req!==S.me.id)return'incoming';
  const n=(S.chat.parts?.[k]||[]).filter(m=>m.by===S.me.id).length;return n<DM_REQ_MAX?'requesting':'capped'}
const reqIn=(k,u)=>!!parseKey(k)?.friend&&dmState(k,u)==='incoming';
function jobChatOpen(k,D){const j=D.jobByKey[parseKey(k)?.jobKey],doer=parseKey(k)?.members[1];if(!j)return false;
  if(j.status==='open'||(j.status==='assigned'&&!j.accepted))return true;
  if(j.accepted&&j.accepted===doer)return j.status==='assigned'||(j.status==='done'&&Date.now()-num(j.doneAt||j.pick?.doneAt)<CHAT_GRACE);
  return false}
const activeDeal=(u,D)=>workedWith(u,D).find(j=>jobChatOpen(jobThreadKey(j.key,j.accepted),D))||null;
const friendIds=()=>Object.keys(S.following).filter(isFriend);
const dmKey=u=>{const[a,b]=[S.me.id,u].sort();return`f~${a}~dm~${b}`};
function setRel(m,u,v){S[m]={...S[m]};if(v)S[m][u]=v;else delete S[m][u];render()}
function loadFeed(){if(!S.me)return;S.fb.rpc('follow_feed').then(l=>{S.ffeed=Array.isArray(l)?l.filter(x=>x&&typeof x.id==='string'&&ID_RE.test(String(x.owner))).map(normPNote):[];if(S.phase==='app')render()},()=>{S.ffeed=[]})}
function canMessage(t,D){const me=S.me.id;
  if(isFriend(t.other))return true;if(!t.jobKey){if(!parseKey(t.key)?.friend)return false;const st=dmState(t.key,t.other);return st==='open'||st==='requesting'}
  const j=D.jobByKey[t.jobKey];if(!j)return false;return(j.owner===me||j.accepted===me||threadOpen(t.key))&&jobChatOpen(t.key,D)}
function workedWith(uid,D){const me=S.me.id;return D.jobs.filter(j=>(j.status==='assigned'||j.status==='done')&&((j.owner===me&&j.accepted===uid)||(j.owner===uid&&j.accepted===me)))}
function lastJobFor(uid,D){return D.jobs.filter(j=>j.owner===S.me.id&&j.accepted===uid&&(j.status==='assigned'||j.status==='done')).sort((a,b)=>b.at-a.at)[0]||null}
const ASKS_ON=false;
const offerList=o=>Object.entries(o).map(([k,v])=>({key:k,...v})).filter(x=>x&&typeof x.text==='string');
function bidsFor(D,key){return (D.bidsByJob[key]||[]).filter(b=>!D.blocked.has(b.by))}
const MOD_AREA={job:'job',bid:'bid',chat:'message',offer:'request',review:'review',profile:'profile'};
const warnsOf=()=>Array.isArray(S.priv.warns)?S.priv.warns.filter(w=>w&&typeof w==='object'):[];
function modBlock(area,...texts){const cat=modHit(...texts);if(!cat)return false;const at=Date.now(),warns=[...warnsOf(),{at,area,cat}].slice(-20);
  savePriv({warns});S.fb.addDoc(S.fb.collection(S.db,'flags'),{by:S.me.id,area,cat,at}).catch(()=>{});
  S.sheet={type:'blocked',area,cat,n:warns.length};S.err={};render();return true}
function droppedMe(j){return!!S.me&&j.dropped.includes(S.me.id)}
function repicking(j){return jobState(j)==='assigned'&&!j.accepted&&j.repickAt>0}
function lostBid(j){const me=S.me?.id,st=jobState(j);return!!me&&j.owner!==me&&j.accepted!==me&&(droppedMe(j)||(!(j.repickAt>0&&!j.accepted)&&(!!j.accepted||st==='assigned'||st==='done')))}
function lostAt(j,bidAt=0){return num(j.takenAt)||num(bidAt)}
function notesOf(D){const me=S.me.id,out=[],J=k=>D.jobByKey[k],t=j=>{const x=str(j.text,200).trim().replace(/[.!?\s]+$/,'');return'<i>\u201c'+esc(x.length>56?x.slice(0,55).trim()+'\u2026':x)+'\u201d</i>'},nm=u=>'<b>'+esc(firstName(u))+'</b>',ok=u=>u&&D.members.includes(u)&&!D.blocked.has(u);
  const add=(at,who,html,go)=>{if(at>0)out.push({at,who,html,...go})},A=w=>'<span class="act">'+w+'</span>';
  for(const w of warnsOf())if(MOD_CAT[w.cat])add(num(w.at),'tack',`Your ${MOD_AREA[w.area]||'post'} wasn\u2019t posted: it broke tack\u2019s rules on ${MOD_CAT[w.cat]}. Repeated attempts can get your account removed.`,{go:'settings'});
  const joined=num(S.myDoc?.joinedAt);add(joined,'tack','Welcome to tack. Pin a small job or bid on one from the board.',{go:'board'});
  for(const j of D.jobs){
    if(j.owner===me){
      for(const b of bidsFor(D,j.key))if(b.by!==me&&ok(b.by))add(b.at,b.by,`${nm(b.by)} ${A('bid on')} ${t(j)}`,{job:j.key});
      const pk=j.pick;if(PAY_ON&&pk&&ok(pk.doer)){const pay=payOf(j);
        if(pay)add(pay.at,pk.doer,pay.ok?`${nm(pk.doer)} ${A('confirmed your payment')} for ${t(j)}`:`${nm(pk.doer)} says your payment for ${t(j)} ${A('hasn\u2019t arrived yet')}`,{job:j.key})}
      const st=jobState(j);
      if(st==='expired')add(j.deadline,'tack',`${A('Time ran out')} on ${t(j)}. Pin it again if you still need it.`,{job:j.key});
      if(st==='removed')add(j.at,'tack',`${t(j)} was ${A('taken off the board')} by ${esc(organiser())}.`,{job:j.key});
    }else if(j.accepted===me&&j.pick){const pk=j.pick,pay=payOf(j);
      add(num(pk.at),j.owner,`${nm(j.owner)} ${A('picked you')} for ${t(j)}`,{job:j.key});
      if(pk.status==='done')add(num(pk.doneAt),j.owner,`${nm(j.owner)} ${A('marked')} ${t(j)} ${A('as done')}. ${PAY_ON?'Got paid?':'Rate them?'}`,{job:j.key});
      if(PAY_ON?pay&&pay.ok:pk.status==='done')add(PAY_ON?pay.at:num(pk.doneAt)+1,'tack',`${A('Congrats, you finished')} ${t(j)}`,{job:j.key,...(PAY_ON?{earn:j.agreed||j.price}:{})});
      if(typeof pk.review==='string')add(num(pk.doneAt)+2,j.owner,`${nm(j.owner)} ${A('left you a review')}. Tap to see it.`,{rev:pk.review});
    }else if(ok(j.owner)){const b=myBidOn(j.key);
      if(b&&lostBid(j))add(lostAt(j,b.at),j.owner,`${nm(j.owner)} ${A('picked someone else')} for ${t(j)}`,{job:j.key});
      else if(b&&jobState(j)==='open'&&j.editedAt>b.at)add(j.editedAt,j.owner,`${nm(j.owner)} ${A('updated')} ${t(j)}. Check it still works for you.`,{job:j.key});
    }
  }
  if(FOLLOW_ON)for(const[u,at]of Object.entries(S.followers))if(!D.blocked.has(u))add(at,u,`${nm(u)} ${A('started following you')}`,{person:u,...(isFollowing(u)?{}:{fb:u})});
  for(const t of D.threads)if(reqIn(t.key,t.other))add(num(S.threadDocs[t.key]?.at)||t.last?.at||0,t.other,`${nm(t.other)} ${A('sent you a message request')}`,{mreq:t.key,person:t.other});
  if(FOLLOW_ON)for(const x of S.ffeed)if(!D.blocked.has(x.owner))add(x.at,x.owner,`${nm(x.owner)} ${A('pinned')} ${t(x)}`,D.jobByKey[x.key]?{job:x.key}:{person:x.owner});
  for(const[id,iv]of Object.entries(S.cinv||{}))if(S.coms[id])add(num(iv.at),iv.by,`${nm(iv.by)} ${A('invited you')} to <b>${esc(comName(id))}</b>`,{go:'board',cinv:id});
  for(const o of offerList(S.offersIn))if(ok(o.owner))add(num(o.at),o.owner,`${nm(o.owner)} ${A('asked you')}: ${esc(str(o.text,60))}`,{go:'bids'});
  // Declines are silent: the asker only ever hears about a yes.
  for(const o of offerList(S.offersOut))if(ok(o.to)&&o.status==='accepted')add(num(o.respondedAt),o.to,`${nm(o.to)} ${A('said yes')} to ${esc(str(o.text,60))}`,{go:'bids'});
  return out.sort((a,b)=>b.at-a.at).slice(0,80);
}
function miniNote(j){if(!j||j.owner!==S.me?.id)return'';const c=noteOf(j);
  return`<span class="mininote${isOrg(j.owner)?' tackmini':''}" style="--nc:${c}" aria-hidden="true"><i class="mnpin"></i>${isOrg(j.owner)?'':`<b>₹${fmt(j.price)}</b>`}<span class="mnl"></span><span class="mnl s"></span></span>`}
function tackFace(s){return`<span class="tackav" style="width:${s}px;height:${s}px" role="img" aria-label="tack"></span>`}
const HOLD_AT=5;
const held=uid=>{const x=(S.strikes||{})[uid];return!!x&&num(x.n)-num(x.cleared)>=HOLD_AT};
const hiddenFor=j=>held(j.owner)&&j.owner!==S.me?.id&&!S.me?.isOwner;
function strikeAdd(about){const me=S.me.id;if(!about||about===me||!ID_RE.test(about))return;S.fb.rpc('strike',{p_about:about}).catch(()=>{})}
function boardJobs(D){
  const now=Date.now();
  const cc=S.me.isOwner?curCampus():'';
  const l=D.jobs.filter(j=>j.status==='open'&&j.deadline>now&&!D.blocked.has(j.owner)&&!hiddenFor(j)&&(!cc||(j.campus||campusOf(j.owner))===cc));
  return sortJobs(l);
}
function findJobs(l){const q=S.find.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if(q.length)l=l.filter(j=>{const h=[j.text,j.more,j.kind,j.when,j.where,firstName(j.owner),'₹'+j.price].join(' ').toLowerCase();return q.every(w=>h.includes(w))});
  if(S.near)l=l.filter(nearMe);
  return l;
}
function sortJobs(l){
  const o=ownerId();
  if(S.sort==='high')l.sort((a,b)=>b.price-a.price||b.at-a.at);
  else if(S.sort==='closing')l.sort((a,b)=>a.deadline-b.deadline);
  else l.sort((a,b)=>b.at-a.at);
  return o?[...l.filter(j=>j.owner===o),...l.filter(j=>j.owner!==o)]:l;
}
const pref=(k,d=true)=>{const v=(S.priv.prefs||{})[k];return typeof v==='boolean'?v:d};
const needTerms=()=>S.phase==='app'&&!!S.ready?.priv&&!S.joining&&(S.priv.terms||{}).v!==TERMS_V;
function onlinePeople(D){return D.members.filter(u=>onlineNow(u)&&!D.blocked.has(u)).sort((a,b)=>onlineAt(b)-onlineAt(a))}
function payOf(j){const x=j.pick&&j.pick.paid;return x&&typeof x==='object'&&typeof x.ok==='boolean'?{ok:x.ok,at:num(x.at)}:null}
// Payments in tack (UPI sharing, "I've paid", "Did they pay you?") are on hold. Members pay each other directly,
// in cash or UPI, outside tack. Flip PAY_ON back to bring the guided payment flow back.
const PAY_ON=false;
const PAY_GRACE=864e5;
const UPI_RE=/^[a-zA-Z0-9._-]{2,64}@[a-zA-Z][a-zA-Z0-9.-]{1,48}$/;
const upiOf=j=>{const u=j.pick&&j.pick.upi;return typeof u==='string'&&UPI_RE.test(u)?u:''};
const sentOf=j=>{const x=j.pick&&j.pick.sent;return x&&typeof x==='object'&&num(x.at)>0?{at:num(x.at),ref:typeof x.ref==='string'?x.ref.slice(0,40):''}:null};
const upiLink=j=>`upi://pay?pa=${encodeURIComponent(upiOf(j))}&pn=${encodeURIComponent(shortName(j.accepted))}&am=${num(j.agreed)}&cu=INR&tn=${encodeURIComponent('tack: '+j.text.slice(0,40))}`;
function payLine(uid){const r=repOf(uid,'p');if(!r.n)return'';const v=r.per.find(c=>c.k==='payment')?.v||0;return v?` · Pays on time ★${v.toFixed(1)}`:''}
function posterPay(j){if(!PAY_ON)return'';const dn=esc(firstName(j.accepted)),u=upiOf(j),sent=sentOf(j),pay=payOf(j),done=jobState(j)==='done',over=done&&!pay?.ok&&!sent&&Date.now()-(j.doneAt||0)>PAY_GRACE;
  if(pay?.ok)return'';
  const btn=u?`<button class="${done?'cta':'btn2'}" data-sheet="paysafe">${ic('shield',16)} Pay ₹${fmt(j.agreed)} with UPI</button>`:'';
  return`<div class="paycard${over?' over':''}">
    <div class="payhead">${ic('shield',18)}<span class="rowtext"><span class="t1">${over?`Payment overdue. ${dn} is still waiting for ₹${fmt(j.agreed)}`:sent?`You marked ₹${fmt(j.agreed)} as sent ${since(sent.at)}`:done?`Pay ${dn} ₹${fmt(j.agreed)}`:'Pay safely, after the work is done'}</span>
      <span class="t2">${sent?`${sent.ref&&sent.ref!=='cash'?'UPI ref '+esc(sent.ref)+'. ':sent.ref==='cash'?'Paid in cash. ':''}Waiting for ${dn} to confirm it reached them.`:u?`${dn} shared their UPI ID for this job. Pay inside tack so there’s a record.`:`${dn} hasn’t shared a UPI ID yet. Ask them in chat, or pay in cash.`}</span></span></div>
    ${sent?'':btn}${sent||!done?'':`<button class="linkbtn" data-act="markSent" data-val="cash">I paid in cash</button>`}</div>`}
function doerPay(j){if(!PAY_ON)return'';const pn=esc(firstName(j.owner)),u=upiOf(j);
  if(payOf(j)?.ok)return'';
  if(u&&!S.upiEdit)return`<div class="paycard"><div class="payhead">${ic('shield',18)}<span class="rowtext"><span class="t1">${pn} can pay you in tack</span><span class="t2">Your UPI ID <b>${esc(u)}</b> is shared with ${pn} for this job only.</span></span></div><button class="linkbtn" data-act="editUpi">Change</button></div>`;
  return`<div class="paycard"><div class="payhead">${ic('shield',18)}<span class="rowtext"><span class="t1">Get paid safely</span><span class="t2">Share your UPI ID so ${pn} can pay you the exact amount inside tack. Only ${pn} sees it, for this job.</span></span></div>
    <label class="field" for="upiIn"><input id="upiIn" type="text" inputmode="email" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="113" placeholder="yourname@okaxis" value="${esc(S.pay.upi??(S.priv.upi||''))}" data-bind="pay.upi" aria-label="Your UPI ID"></label>
    ${S.err.upi?`<p class="err">${esc(S.err.upi)}</p>`:''}<button class="btn2" data-act="shareUpi">Share my UPI ID</button></div>`}

function repOf(uid,side){const r=S.repDocs[uid],x=r&&r[side]&&typeof r[side]==='object'?r[side]:{},n=Math.max(0,Math.round(num(x.n)));
  const per=CRIT[side].map(([k,l])=>({k,l,v:n?num(x[k])/n:0}));return{n,per,avg:n?(per.reduce((a,c)=>a+c.v,0)/per.length):0}}
function stats(uid,D){
  const d=repOf(uid,'d'),p=repOf(uid,'p');let earned=0;
  if(PAY_ON&&uid===S.me.id)for(const j of D.jobs)if(j.accepted===uid&&payOf(j)?.ok)earned+=j.agreed||j.price;
  return{done:d.n,avg:d.n?d.avg.toFixed(1):null,doer:d,poster:p,earned};
}
function rateLine(uid,D){const s=stats(uid,D);return s.avg?` · ★${s.avg} from ${s.done} ${s.done===1?'job':'jobs'}`:''}
function posterLine(uid){const p=repOf(uid,'p');return p.n?` · ★${p.avg.toFixed(1)} as a poster`:''}
const jobThreadKey=(jobKey,bidder)=>`j~${jobKey}~${bidder}`;
function parseKey(k){const p=k.split('~');if(p[0]==='j'&&p.length===4)return{members:[p[1],p[3]],jobKey:p[1]+'~'+p[2]};if(p[0]==='d'&&p.length===3)return{members:[p[1],p[2]],jobKey:null};if(p[0]==='f'&&p.length===4&&p[2]==='dm')return{members:[p[1],p[3]],jobKey:null,friend:true};return null}
function threadsOf(D){
  const me=S.me.id,out={};
  const add=(k,other,jobKey)=>{if(out[k])return out[k];if(!other||other===me||(!D.members.includes(other)&&!canChat(other)&&!parseKey(k)?.friend)||D.blocked.has(other))return null;return out[k]={key:k,other,jobKey,last:null}};
  for(const[k,t]of Object.entries(S.threadDocs)){const p=parseKey(k);if(!p||!p.members.includes(me))continue;
    const th=add(k,p.members.find(x=>x!==me),p.jobKey);if(th&&t&&num(t.lastAt))th.last={at:num(t.lastAt),text:str(t.lastText,80),from:str(t.lastBy,128)}}
  for(const j of D.jobs)if(j.accepted&&(j.status==='assigned'||j.status==='done')&&(j.owner===me||j.accepted===me))add(jobThreadKey(j.key,j.accepted),j.owner===me?j.accepted:j.owner,j.key);
  const seen=S.priv.seen||{};
  return Object.values(out).map(t=>{const j=t.jobKey?D.jobByKey[t.jobKey]:null;t.job=j;
    t.unread=!!(t.last&&t.last.from!==me&&t.last.at>num(seen[t.key]));
    t.sub=t.last?(t.last.from===me?'You: ':'')+t.last.text:(j?`₹${fmt(j.agreed||j.price)} · ${j.text}`:'Say hi');return t})
    .filter(t=>t.last||t.job).sort((a,b)=>(b.last?.at||b.job?.at||0)-(a.last?.at||a.job?.at||0));
}

// One conversation per person: every job thread with them (bids, deals, old jobs) shows as one chat.
function convosOf(threads){const by={};for(const t of threads)(by[t.other]=by[t.other]||[]).push(t);const when=t=>t.last?.at||t.job?.at||0;
  return Object.values(by).map(l=>{l.sort((a,b)=>when(b)-when(a));const last=l.map(x=>x.last).filter(Boolean).sort((a,b)=>b.at-a.at)[0]||null;
    return{...l[0],keys:l.map(x=>x.key),n:l.length,last,unread:l.some(x=>x.unread),sub:last?(last.from===S.me.id?'You: ':'')+last.text:l[0].sub}}).sort((a,b)=>when(b)-when(a))}
const chatCan=(k,other,D)=>canMessage({key:k,other,jobKey:parseKey(k)?.jobKey||null},D);
const queues={};
function enqueue(k,fn){const q=(queues[k]||Promise.resolve()).catch(()=>{}).then(fn);queues[k]=q;return q}
function writeErr(e){
  const c=e&&e.code;
  if(c==='permission-denied'){lostAccess();return}
  toast(c==='unavailable'?'You’re offline. It will save when you reconnect.':'Couldn’t save that. Try again.');
  console.warn(e);
}
function prune(d){
  delete d.paid;delete d.bids;
  return d;
}
async function rateBatch(pickKey,about,side,vals,pickPatch){
  const [owner,job]=pickKey.split('~');
  await S.fb.rpc('rate',{p_owner:owner,p_job:job,p_side:side,p_vals:vals,p_note:(side==='d'?pickPatch.noteToDoer:pickPatch.noteToPoster)||null});
}
async function reviewBatch(pickKey,about,text,pics,stars){
  const rid=await S.fb.rpc('post_review',{p_job:pickKey.split('~')[1],p_text:text,p_stars:stars?Math.round(stars*10)/10:null,p_pics:pics.length?pics:null});
  S.picks={...S.picks,[pickKey]:{...S.picks[pickKey],review:rid}};if(pics.length)S.pics['r:'+rid]=pics;delete S.revs[about];
}
function reviewsOf(uid){const v=S.revs[uid];if(v!==undefined)return v;S.revs[uid]=null;const {collection,query,where,limit,getDocs}=S.fb;
  getDocs(query(collection(S.db,'reviews'),where('about','==',uid),limit(60))).then(q=>{const l=[];q.forEach(d=>{const r=d.data();if(r&&typeof r.text==='string'&&r.text.trim())
    l.push({id:d.id,text:str(r.text,400),at:num(r.at),stars:num(r.stars)>=1&&num(r.stars)<=5?num(r.stars):0,pics:Math.min(MAX_PICS,num(r.pics))})});S.revs[uid]=l.sort((a,b)=>b.at-a.at)})
    .catch(e=>{console.warn(e);S.revs[uid]=[]}).finally(()=>{if(S.phase==='app')render()});
  return null}
function reviewList(uid){const l=reviewsOf(uid);if(!l||!l.length)return'';const shown=S.allRevs===uid?l:l.slice(0,5),fn=esc(firstName(uid));
  return`<div class="stack gap8"><div style="display:flex;align-items:baseline;gap:8px"><h2 class="h2">Reviews</h2><span style="font-size:var(--t-12);font-weight:500;color:var(--muted)">${l.length} from posters ${fn} worked for</span></div>
    ${shown.map(r=>`<div class="box stack" style="gap:8px"><span class="revhead">${r.stars?`<b>★${r.stars.toFixed(1)}</b>`:''}<span>${new Date(r.at).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</span></span>
      <p class="revtext">${esc(r.text)}</p>${picStrip('r:'+r.id,r.pics,'flush')}
      ${S.me.isOwner&&uid!==S.me.id?`<button class="linkbtn" style="align-self:flex-start;padding:0" data-sheet="delReview" data-rid="${esc(r.id)}" data-about="${esc(uid)}">Remove review</button>`:''}</div>`).join('')}
    ${l.length>shown.length?`<button class="btn2" data-act="allReviews" data-uid="${esc(uid)}">Show all ${l.length} reviews</button>`:''}</div>`}
function reviewFields(fn){return`<div class="stack gap8"><label class="formlabel" for="revT">Public review <span class="muted">(optional)</span></label>
    <textarea id="revT" class="inp" rows="3" maxlength="400" style="resize:vertical" placeholder="How did it go? Other posters will read this on ${fn}'s profile." data-bind="rate.rev">${esc(S.rate.rev)}</textarea>
    ${picEdit('rev',S.rate.pics)}
    <p class="note" style="text-align:left">Shows on ${fn}'s profile with the month. Never your name or the job.</p></div>`}
const converting=new Set();
function convertOffers(){
  for(const o of offerList(S.offersOut)){
    if(o.status!=='accepted'||converting.has(o.key)||!JOB_RE.test(o.job||''))continue;converting.add(o.key);
    const at=num(o.at)||Date.now();
    saveMine(x=>{x.jobs={...(x.jobs||{})};if(!x.jobs[o.job])x.jobs[o.job]={text:str(o.text,200),more:'',price:num(o.price),kind:'Other',when:str(o.when,20),where:str(o.where,40),at,deadline:deadlineFor(o.when,at),
      status:'assigned',takenAt:Date.now(),offer:true};return x});
    enqueue('me',()=>S.fb.setDoc(S.fb.doc(S.db,'picks',S.me.id+'~'+o.job),{owner:S.me.id,job:o.job,doer:o.to,agreed:num(o.price),at:num(o.respondedAt)||Date.now(),status:'assigned',posterName:myRealName()}))
      .then(()=>S.fb.deleteDoc(S.fb.doc(S.db,'offers',o.key))).catch(e=>console.warn(e));
  }
}
function savePitch(jobKey,say,amt,pics,near){const {doc,setDoc,deleteDoc}=S.fb,me=S.me.id,id=jobKey+'~'+me,owner=jobKey.split('~')[0];
  if(amt){const p={owner,by:me,job:jobKey,amt,say:(say||'').slice(0,SAY_MAX),at:Date.now(),...(pics?{pics}:{}),...(near?{near:true}:{})};S.pitchMine={...S.pitchMine,[id]:p};return setDoc(doc(S.db,'pitches',id),p).catch(writeErr)}
  const m={...S.pitchMine};delete m[id];S.pitchMine=m;return deleteDoc(doc(S.db,'pitches',id)).catch(()=>{})}
function saveMine(mut){
  const {doc,setDoc}=S.fb;
  S.myDoc=prune(mut(clone(S.myDoc)));S.pendingMine++;render();
  return enqueue('me',()=>setDoc(doc(S.db,'people',S.me.id),S.myDoc)).catch(writeErr).finally(()=>{S.pendingMine--});
}
const PUSH_KEY='tack.push';
const isIOS=()=>/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
// Inside the iOS app tack runs in a web view, where web push can't work. Until native push is added,
// the iOS app shows no notification settings or prompts at all.
const IOS_APP=(()=>{try{const C=window.Capacitor;return!!(C&&C.isNativePlatform&&C.isNativePlatform()&&C.getPlatform&&C.getPlatform()==='ios')}catch{return false}})();
// Shown in Settings when set. Leave empty to point people to Report or feedback only.
const SUPPORT_EMAIL='';
// The iOS app's native layer: a real tab bar (TackNative, in the app), haptics and Apple push.
// The website and the Android app don't have these plugins, so all of this switches itself off there.
// Plugins come from Capacitor's bridge (Capacitor.Plugins). The app's own TackNative plugin is added a moment
// after this script starts, so each one is picked up as soon as it appears.
const CAP=window.Capacitor;let NTabs=null,NPush=null,NHap=null;
function whenPlug(n,cb,t=0){if(!IOS_APP)return;let p=null;try{p=CAP&&CAP.Plugins&&CAP.Plugins[n]}catch{}if(p&&(!CAP.isPluginAvailable||CAP.isPluginAvailable(n)))return cb(p);if(t<80)setTimeout(()=>whenPlug(n,cb,t+1),100)}
whenPlug('Haptics',p=>{NHap=p});
function haptic(k){if(!NHap)return;try{if(k==='success'||k==='warning')NHap.notification({type:k.toUpperCase()});else NHap.impact({style:k==='medium'?'MEDIUM':'LIGHT'})}catch{}}
const pushReady=()=>IOS_APP?!!NPush:'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
function pushOn(){try{return IOS_APP?!!NPush&&!!localStorage.getItem(PUSH_KEY):pushReady()&&Notification.permission==='granted'&&!!localStorage.getItem(PUSH_KEY)}catch{return false}}
// Each device's Firebase token is registered in Supabase (public.push_tokens). The database decides who to tell
// and the "push" Edge Function sends through Firebase. Registering again each session moves a shared device to
// whoever is signed in now.
const pushRegister=(t,pl=IOS_APP?'ios':'web')=>S.fb.rpc('push_register',{p_token:t,p_platform:pl}).catch(e=>console.warn('push_register',e));
const pushUnregister=t=>S.fb.rpc('push_unregister',{p_token:t}).catch(e=>console.warn('push_unregister',e));
function openLink(link){try{const u=new URL(link),j=u.searchParams.get('job'),c=u.searchParams.get('chat'),D=derive();
  if(c){const t=D.threads.find(x=>x.key===c);if(t){openThread(t);return}}
  if(j&&D.jobByKey[j]){S.sheet=null;S.openJob=j;S.bid={key:null};go('job');return}
  go(c?'chats':'bids')}catch(e){console.warn(e)}}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.type==='open'&&S.phase==='app')openLink(String(e.data.link||''))});
// Apple hands the app a device token; it's registered like a browser's, as platform 'ios'.
let nativePushWaiting=false,pendingLink='';
whenPlug('PushNotifications',p=>{NPush=p;
  NPush.addListener('registration',t=>{const tok=String(t&&t.value||'');if(!tok)return;let old='';try{old=localStorage.getItem(PUSH_KEY)||'';localStorage.setItem(PUSH_KEY,tok)}catch{}
    if(old&&old!==tok)pushUnregister(old);if(S.me)pushRegister(tok,'ios');
    if(nativePushWaiting){nativePushWaiting=false;S.busy=false;toast('Notifications are on');render()}});
  NPush.addListener('registrationError',e=>{console.warn(e);if(nativePushWaiting){nativePushWaiting=false;S.busy=false;toast('Couldn\u2019t turn on notifications. Try again.');render()}});
  NPush.addListener('pushNotificationActionPerformed',a=>{const l=String(a?.notification?.data?.link||'');if(!l)return;if(S.phase==='app')openLink(l);else pendingLink=l});
  if(S.phase==='app')render()});
async function pushToken(){const reg=await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;
  const m=await import(FB+'firebase-messaging.js');S.msg=S.msg||m.getMessaging(await fcmApp());return{m,token:await m.getToken(S.msg,{serviceWorkerRegistration:reg})}}
function dropPushField(t){const {doc,updateDoc,FieldPath,deleteField}=S.fb;return updateDoc(doc(S.db,'private',S.me.id),new FieldPath('push',t),deleteField()).catch(e=>console.warn(e))}
async function enablePush(){
  if(IOS_APP){if(!NPush)return;let p;try{p=await NPush.requestPermissions()}catch{p={receive:'denied'}}
    if(p.receive!=='granted'){toast('Notifications are off for tack. Turn them on in iPhone Settings → tack.');return}
    S.busy=true;nativePushWaiting=true;render();try{await NPush.register()}catch(e){console.warn(e);nativePushWaiting=false;S.busy=false;toast('Couldn\u2019t turn on notifications. Try again.');render()}return}
  if(!pushReady()){if(isIOS()&&!standalone()){S.sheet={type:'iosPush'};render()}else toast('This browser can\u2019t show notifications.');return}
  let perm=Notification.permission;if(perm==='default')perm=await Notification.requestPermission();
  if(perm!=='granted'){toast('Notifications are blocked. Allow them for tack in your browser settings.');return}
  S.busy=true;render();
  try{const {token}=await pushToken();if(!token)throw new Error('no token');
    try{localStorage.setItem(PUSH_KEY,token)}catch{}
    await pushRegister(token);await savePriv({push:{...(S.priv.push||{}),[token]:Date.now()}});toast('Notifications are on')}
  catch(e){console.warn(e);toast('Couldn\u2019t turn on notifications. Try again.')}
  S.busy=false;render()}
async function disablePush(){if(IOS_APP&&NPush){try{NPush.unregister()}catch{}}
  let t=null;try{t=localStorage.getItem(PUSH_KEY);localStorage.removeItem(PUSH_KEY)}catch{}
  if(t){const p={...(S.priv.push||{})};delete p[t];S.priv={...S.priv,push:p};dropPushField(t);pushUnregister(t);
    try{const m=await import(FB+'firebase-messaging.js');S.msg=S.msg||m.getMessaging(await fcmApp());await m.deleteToken(S.msg)}catch{}}
  toast('Notifications are off');render()}
async function syncPush(){
  if(!pushOn())return;
  if(IOS_APP){try{await NPush.register()}catch(e){console.warn(e)}return}
  try{const old=localStorage.getItem(PUSH_KEY),{token}=await pushToken();if(!token)return;pushRegister(token);if(token===old&&(S.priv.push||{})[token])return;
    localStorage.setItem(PUSH_KEY,token);const p={...(S.priv.push||{})};if(old&&old!==token){delete p[old];dropPushField(old);pushUnregister(old)}
    savePriv({push:{...p,[token]:Date.now()}})}catch(e){console.warn(e)}}
function bannerHTML(){const b=S.config.banner;if(!b||!b.on||typeof b.text!=='string'||!b.text.trim())return'';const k='tack.banner.'+num(b.at);
  try{if(localStorage.getItem(k))return''}catch{}
  return`<div class="annc" role="status">${ic('bell',16)}<span>${b.title?`<b>${esc(str(b.title,60))}</b> `:''}${esc(str(b.text,200))}</span><button class="annx" data-act="hideBanner" data-k="${esc(k)}" aria-label="Close this announcement">${ic('x',14)}</button></div>`}
function savePriv(patch){
  const {doc,setDoc}=S.fb;
  S.priv={...S.priv,...patch,seen:{...(S.priv.seen||{}),...(patch.seen||{})}};render();
  S.privPend=(S.privPend||0)+1;
  return enqueue('priv',()=>setDoc(doc(S.db,'private',S.me.id),patch,{merge:true})).catch(writeErr).finally(()=>{S.privPend--;if(!S.privPend&&S.privLast){S.priv={...S.privLast,seen:{...(S.privLast.seen||{}),...(S.priv.seen||{})}};S.privLast=null;if(S.phase==='app')render()}});
}

async function fcmApp(){if(S.fbApp)return S.fbApp;const app=await import(FB+'firebase-app.js');S.fbApp=app.initializeApp(firebaseConfig);return S.fbApp}
const userOf=u=>u?{uid:u.id,email:(u.email||'').toLowerCase(),emailVerified:!!u.email_confirmed_at,displayName:str(u.user_metadata?.name,60)}:null;
async function boot(){
  render();
  if(!supaConfig||!supaConfig.url||!supaConfig.key){S.phase='setup';render();return}
  try{
    const {createClient}=await import(SB);
    S.sb=createClient(supaConfig.url,supaConfig.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}});
    S.fb=makeDb(S.sb);S.db=null;
  }catch(e){console.error(e);S.phase='offline';render();return}
  let last;
  S.sb.auth.onAuthStateChange((ev,session)=>{
    if(ev==='PASSWORD_RECOVERY'){S.recovery=true;S.pw={cur:'',nw:''};S.err={};S.phase='newpw';render();return}
    const u=session?.user||null,k=u?u.id+':'+!!u.email_confirmed_at:'';
    if(k===last&&ev!=='SIGNED_OUT')return;last=k;
    setTimeout(()=>{if(!S.recovery)handleUser(userOf(u))},0)});
}
function stopSubs(){S.subs.forEach(u=>{try{u()}catch{}});S.subs=[];closeThread();closeCom()}
let verifyTimer=null;
function stopVerifyPoll(){clearInterval(verifyTimer);verifyTimer=null}
async function handleUser(user){
  stopSubs();stopVerifyPoll();S.user=user;S.sb.__uid=user?.uid||null;S.me=null;S.myName=null;S.myNameSaved=false;S.names={};S.dealFail={};S.dealSync=false;S.hcheck=null;firstLoadDone=false;
  if(S.signingUp)return;
  if(!user){if(!S.erased)S.phase='auth';render();return}
  if(!user.emailVerified){S.phase='verify';render();return}
  S.phase='loading';render();
  const {doc,getDoc}=S.fb,email=(user.email||'').toLowerCase();
  let isOwner=false;
  try{isOwner=(await S.fb.rpc('am_admin'))===true}catch{}
  let camp=null;try{camp=await S.fb.rpc('ensure_my_campus')}catch(e){console.warn(e)}
  if(!camp&&savedCode()){try{if(await S.fb.rpc('use_invite_code',{p_code:savedCode()}))camp=await S.fb.rpc('ensure_my_campus')}catch(e){console.warn(e)}}
  if(camp&&camp.need==='pick'&&!isOwner){S.me=null;S.cpick={opts:null,dom:str(camp.domain,80),q:'',add:!(camp.options||[]).length,ncol:'',ncity:'',busy:false,err:''};
    S.cpick.opts=(camp.options||[]).map(o=>({id:o.id,name:o.name,city:o.city||'',domains:[str(camp.domain,80)],k:(o.name+' '+(o.city||'')).toLowerCase()}));S.phase='campus';render();return}
  if(!camp&&!isOwner){S.phase='notinvited';render();return}
  try{localStorage.removeItem('tack.code')}catch{}
  S.myCampus=camp&&typeof camp.id==='string'?{id:camp.id,name:str(camp.name,60)}:null;
  if(!isOwner){
    let inv=null;try{inv=await getDoc(doc(S.db,'invites',email))}catch{}
    S.myInvite=inv&&inv.exists()?inv.data():null;
  }
  S.me={id:user.uid,email,isOwner};
  startSubs();
}
const savedCode=()=>{try{return localStorage.getItem('tack.code')||''}catch{return''}};
let retried=false;
function lostAccess(){if(S.phase==='notinvited')return;stopSubs();
  const u=S.user;
  if(u&&!retried){retried=true;S.sb.auth.refreshSession().then(()=>handleUser(u),()=>{S.phase='notinvited';render()});return}
  S.phase='notinvited';render()}
function startSubs(){
  const {doc,collection,onSnapshot,query,where,orderBy,limit}=S.fb,db=S.db,me=S.me.id;
  S.ready={config:false,people:false,priv:false};S.config={};S.peopleDocs={};S.priv={};S.threadDocs={};S.invites={};S.reports=[];
  const fail=e=>{if(e&&e.code==='permission-denied')lostAccess();else console.warn(e)};
  S.subs.push(onSnapshot(doc(db,'config','app'),s=>{S.config=s.exists()?s.data():{};S.ready.config=true;afterData()},fail));
  S.following={};S.followers={};S.ffeed=[];
  const rel=(f,m,k)=>S.subs.push(onSnapshot(query(collection(db,'follows'),where(f,'==',me)),snap=>{const o={};snap.forEach(x=>{const d=x.data();if(ID_RE.test(String(d[k])))o[d[k]]=num(d.at)||1});S[m]=o;if(S.phase==='app')render()},e=>console.warn(e)));
  if(FOLLOW_ON){rel('follower','following','followee');rel('followee','followers','follower');loadFeed()}
  S.subs.push(onSnapshot(collection(db,'people'),snap=>{
    const d={};snap.forEach(x=>{d[x.id]=x.data()});
    S.peopleDocs=d;if(!S.pendingMine)S.myDoc=d[me]?clone(d[me]):null;S.ready.people=true;afterData();
  },fail));
  const setOnline=snap=>{const f={};snap.forEach(x=>{f[x.id]=x.data()});const mine=f[me];if(mine&&num(mine.at)>0&&num(mine.at)!==num(S.onlineDocs[me]?.at)){const k=num(mine.at)-Date.now();if(Math.abs(k)<36e5)S.skew=k}S.onlineDocs=f;if(S.phase==='app')render()};
  S.subs.push(onSnapshot(collection(db,'online'),setOnline,e=>console.warn(e)));
  // Heartbeat while tack is open and on screen; going to the background marks you offline straight away.
  const beat=on=>S.fb.setDoc(S.fb.doc(S.db,'online',me),{at:on?1:0}).catch(()=>{});
  const tick=()=>{if(!document.hidden)beat(true);S.fb.getDocs(collection(db,'online')).then(setOnline,()=>{})};
  const vis=()=>{if(document.hidden)beat(false);else tick()};
  tick();const onlineTick=setInterval(tick,60000);document.addEventListener('visibilitychange',vis);
  S.subs.push(()=>{clearInterval(onlineTick);document.removeEventListener('visibilitychange',vis);beat(false)});
  S.subs.push(onSnapshot(doc(db,'private',me),s=>{const d=s.exists()?s.data():{};if(S.privPend>0){S.privLast=d;return}S.priv=d;S.ready.priv=true;afterData()},fail));
  const pk={own:{},doer:{}},mergePicks=()=>{S.picks={...pk.doer,...pk.own};if(S.phase==='app')render()};
  S.subs.push(onSnapshot(query(collection(db,'picks'),where('owner','==',me)),snap=>{pk.own={};snap.forEach(x=>{pk.own[x.id]=x.data()});mergePicks()},e=>console.warn(e)));
  S.subs.push(onSnapshot(query(collection(db,'picks'),where('doer','==',me)),snap=>{pk.doer={};snap.forEach(x=>{pk.doer[x.id]=x.data()});mergePicks()},e=>console.warn(e)));
  S.subs.push(onSnapshot(collection(db,'communities'),snap=>{const c={};snap.forEach(x=>{c[x.id]=x.data()});S.coms=c;if(S.phase==='app')render()},e=>console.warn(e)));
  S.subs.push(onSnapshot(query(collection(db,'cmembers'),where('uid','==',me)),snap=>{const c={};snap.forEach(x=>{const d=x.data();c[d.community]=d.role});S.cmine=c;if(S.cid&&!c[S.cid]&&S.phase==='app'&&['cboard','cnote'].includes(S.view)){closeCom();go('board')}if(S.phase==='app')render()},e=>console.warn(e)));
  S.subs.push(onSnapshot(query(collection(db,'cinvites'),where('uid','==',me)),snap=>{const c={};snap.forEach(x=>{const d=x.data();c[d.community]=d});S.cinv=c;if(S.phase==='app')render()},e=>console.warn(e)));
  S.subs.push(onSnapshot(collection(db,'campuses'),snap=>{const c={};snap.forEach(x=>{c[x.id]=x.data()});S.campuses=c;if(S.phase==='app')render()},e=>console.warn(e)));
  S.subs.push(onSnapshot(collection(db,'strikes'),snap=>{const r={};snap.forEach(x=>{r[x.id]=x.data()});S.strikes=r;if(S.phase==='app')render()},e=>console.warn(e)));
  S.subs.push(onSnapshot(collection(db,'rep'),snap=>{const r={};snap.forEach(x=>{r[x.id]=x.data()});S.repDocs=r;if(S.phase==='app')render()},e=>console.warn(e)));
  // Asks (favour requests) are switched off for now; offers stay in the database but aren't loaded.
  if(ASKS_ON)S.subs.push(onSnapshot(query(collection(db,'offers'),where('to','==',me)),snap=>{const o={};snap.forEach(x=>{o[x.id]=x.data()});S.offersIn=o;if(S.phase==='app')render()},e=>console.warn(e)));
  if(ASKS_ON)S.subs.push(onSnapshot(query(collection(db,'offers'),where('owner','==',me)),snap=>{const o={};snap.forEach(x=>{o[x.id]=x.data()});S.offersOut=o;convertOffers();if(S.phase==='app')render()},e=>console.warn(e)));
  S.subs.push(onSnapshot(query(collection(db,'invcodes'),where('by','==',me)),snap=>{const c={};snap.forEach(x=>{c[x.id]=x.data()});S.myCodes=c;if(S.phase==='app')render()},e=>console.warn(e)));
  S.subs.push(onSnapshot(query(collection(db,'pitches'),where('owner','==',me)),snap=>{const p={};snap.forEach(x=>{p[x.id]=x.data()});S.pitchIn=p;if(S.phase==='app')render()},e=>console.warn(e)));
  S.subs.push(onSnapshot(query(collection(db,'pitches'),where('by','==',me)),snap=>{const p={};snap.forEach(x=>{p[x.id]=x.data()});S.pitchMine=p;if(S.phase==='app')render()},e=>console.warn(e)));
  S.subs.push(onSnapshot(query(collection(db,'threads'),where('members','array-contains',me)),snap=>{
    const t={};snap.forEach(x=>{t[x.id]=x.data()});S.threadDocs=t;if(S.phase==='app')render();
  },fail));
  if(S.me.isOwner){
    S.subs.push(onSnapshot(collection(db,'invites'),snap=>{const i={};snap.forEach(x=>{i[x.id]=x.data()});S.invites=i;if(S.phase==='app')render()},fail));
    S.subs.push(onSnapshot(query(collection(db,'reports'),orderBy('at','desc'),limit(100)),snap=>{S.reports=snap.docs.map(x=>x.data());if(S.phase==='app')render()},fail));
  }
}
let firstLoadDone=false;
function afterData(){
  if(!(S.ready.config&&S.ready.people&&S.ready.priv))return;
  const {doc,setDoc,updateDoc,getDoc}=S.fb,me=S.me.id;
  if(!firstLoadDone){
    firstLoadDone=true;setTimeout(syncPush,1500);
    getDoc(doc(S.db,'names',me)).then(d=>{if(d.exists()&&typeof d.data().name==='string'){S.myName=str(d.data().name,60);S.myNameSaved=true;render()}}).catch(()=>{});
    if(S.me.isOwner&&ownerId()!==me)setDoc(doc(S.db,'config','app'),{...S.config,adminUid:me,campus:str(S.config.campus,40)||DEFAULT_CAMPUS}).catch(writeErr);
    if(!S.me.isOwner&&S.myInvite&&S.myInvite.uid!==me)updateDoc(doc(S.db,'invites',S.me.email),{uid:me,joinedAt:Date.now()}).catch(()=>{});
    if(S.myDoc&&S.myDoc.removed)saveMine(d=>{delete d.removed;return d});
  }
  if(THEMES.includes(S.priv.theme)&&S.priv.theme!==themePref()){try{localStorage.setItem('tack.theme',S.priv.theme)}catch{}applyTheme(S.priv.theme)}
  computePhase();render();
  if(S.phase==='app'&&!S.introChecked&&!S.joining&&!needTerms()){S.introChecked=true;if(!S.priv.introSeen)setTimeout(()=>{if(!S.intro.on&&S.phase==='app'&&!S.priv.introSeen&&!S.joining)openIntro()},700)}
}
function computePhase(){
  if(!S.me)return;
  if(S.erased){S.phase='erased';return}
  if(!(S.ready.config&&S.ready.people&&S.ready.priv)){S.phase='loading';return}
  if(!S.myDoc||!S.myDoc.adult){if(S.phase!=='onboard')seedOnb();S.phase='onboard';return}
  if(!handleOf(S.me.id)){if(S.phase!=='handle'){seedOnb();S.hcheck=null}S.phase='handle';return}
  S.phase='app';
}
function seedOnb(){const d=S.myDoc||{};S.onb={handle:str(d.handle,20),name:str(d.name,60)||S.myName||S.user?.displayName||'',photo:PHOTO_RE.test(d.photo||'')?d.photo:'',year:str(d.year,12),branch:str(d.branch,24),does:str(d.bio,BIO_MAX)||str(d.does,60),banner:bannerOk(d.banner)?d.banner:'',ring:RINGS.includes(d.ring)?d.ring:ringOf(S.me.id),adult:!!d.adult,rules:!!d.adult}}

const AUTH_CODE={invalid_credentials:'auth/invalid-credential',user_already_exists:'auth/email-already-in-use',email_exists:'auth/email-already-in-use',weak_password:'auth/weak-password',
  validation_failed:'auth/invalid-email',over_request_rate_limit:'auth/too-many-requests',over_email_send_rate_limit:'auth/too-many-requests',email_not_confirmed:'auth/email-not-confirmed',same_password:'auth/same-password'};
const authErr=e=>{const x=new Error(e?.message||'auth');x.code=AUTH_CODE[e?.code]||(e?.status===429?'auth/too-many-requests':/fetch/i.test(e?.message||'')?'auth/network-request-failed':'auth/'+(e?.code||'unknown'));return x};
const AUTH_ERR={
  'auth/invalid-credential':'Wrong email or password.','auth/wrong-password':'Wrong email or password.','auth/user-not-found':'Wrong email or password.',
  'auth/email-already-in-use':'That email already has an account. Log in instead.','auth/weak-password':'Use a longer password: at least 8 characters.',
  'auth/invalid-email':'That doesn’t look like an email address.','auth/too-many-requests':'Too many tries. Wait a few minutes and try again.',
  'auth/network-request-failed':'You look offline. Check your connection.','auth/requires-recent-login':'For safety, log in again first.',
  'auth/password-does-not-meet-requirements':'That password is too simple. Use at least 8 characters.',
  'auth/email-not-confirmed':'Confirm your email first with the code we sent you.','auth/same-password':'That\u2019s your current password. Pick a new one.'
};
const authMsg=e=>AUTH_ERR[e&&e.code]||'Something went wrong. Try again.';
async function sendVerify(u){const {error}=await S.sb.auth.resend({type:'signup',email:u.email,options:{emailRedirectTo:SITE}});if(error)throw authErr(error)}
async function doSignup(){
  const f=S.form,name=f.name.trim(),email=f.email.trim().toLowerCase();
  if(name.length<2)return authFail('Add your full name.');
  if(!validEmail(email))return authFail('That doesn’t look like an email address.');
  if(f.pw.length<8)return authFail('Use a password of at least 8 characters.');
  const viaInvite=!!(inviteParam||codeParam),col=f.college?catById(f.college):null;
  if(!viaInvite&&!col&&!(f.notListed&&f.ncol.trim().length>=2))return authFail(f.notListed?'Add your college name.':'Pick your college from the list, or tap “My college isn’t listed”.');
  if(col&&!domOk(email,col.domains))return authFail(`Use your ${col.domains.map(d=>'@'+d).join(' or ')} email to join ${col.name}.`);
  S.busy=true;S.authErr='';S.signingUp=true;render();
  let can='';
  try{can=await S.fb.rpc('can_join',{p_email:email,p_code:codeParam||null})}catch(e){S.signingUp=false;return authFail('Couldn\u2019t reach tack. Check your connection and try again.')}
  if(can!=='invited'&&can!=='code'&&can!=='college'){S.signingUp=false;S.busy=false;S.phase='auth';
    return authFail(can==='usedcode'?'This invite link has already been used. Ask your friend for a new one.':can==='badcode'?'This invite link isn\u2019t valid. Check you copied all of it, or ask your friend for a new one.'
      :`${email} isn’t a college email tack recognises, and it isn’t on the invite list. Sign up with your college email, or ask the organiser to invite you.`)}
  if(can==='code')try{localStorage.setItem('tack.code',codeParam)}catch{}
  if(!viaInvite&&!col&&can!=='college'){S.signingUp=false;S.busy=false;return authFail('That doesn’t look like a college email. Use the email your college gave you.')}
  const meta={name,...(col?{campus:col.id}:{}),...(!col&&f.notListed?{newCampus:{college:f.ncol.trim().slice(0,60),city:f.ncity.trim().slice(0,40)}}:{})};
  const {data,error}=await S.sb.auth.signUp({email,password:f.pw,options:{data:meta,emailRedirectTo:SITE}});
  S.signingUp=false;S.busy=false;
  if(error)return authFail(authMsg(authErr(error)));
  if(data?.user&&Array.isArray(data.user.identities)&&!data.user.identities.length)return authFail(AUTH_ERR['auth/email-already-in-use']);
  S.onb.name=name;S.form.pw='';
  if(data?.session)handleUser(userOf(data.user));
  else{S.user={email,displayName:name,emailVerified:false};S.form.otp='';S.err={};S.phase='verify';render()}
}
// Sign-up is confirmed with a 6-digit code typed in this same tab, so the person lands straight in tack.
async function doVerifyOtp(){
  const token=String(S.form.otp||'').replace(/\D/g,''),email=(S.user?.email||'').toLowerCase();
  if(token.length!==6){S.err={otp:'Enter the 6-digit code from the email.'};render();return}
  S.busy=true;S.err={};render();
  const {data,error}=await S.sb.auth.verifyOtp({email,token,type:'signup'});
  S.busy=false;
  if(error||!data?.session){S.err={otp:'That code isn\u2019t right, or it has expired. Check the latest email, or send a new code.'};render();return}
  S.form.otp='';handleUser(userOf(data.session.user));
}
async function doLogin(){
  const f=S.form,email=f.email.trim().toLowerCase();
  if(!validEmail(email))return authFail('That doesn’t look like an email address.');
  if(!f.pw)return authFail('Enter your password.');
  S.busy=true;S.authErr='';render();
  const {error}=await S.sb.auth.signInWithPassword({email,password:f.pw});
  if(error){const e=authErr(error);if(e.code==='auth/email-not-confirmed'){S.user={email,emailVerified:false};S.form.otp='';S.err={};S.phase='verify';S.busy=false;render();sendVerify(S.user).catch(()=>{});return}authFail(authMsg(e))}else{S.form.pw='';S.authMsg=''}
  S.busy=false;render();
}
async function doReset(){
  const email=S.form.email.trim().toLowerCase();
  if(!validEmail(email))return authFail('Enter the email you signed up with.');
  S.busy=true;S.authErr='';render();
  const {error}=await S.sb.auth.resetPasswordForEmail(email,{redirectTo:SITE});if(error){S.busy=false;const e=authErr(error);return authFail(e.code==='auth/too-many-requests'||e.code==='auth/network-request-failed'?authMsg(e):'Couldn\u2019t send the email right now. Try again in a few minutes.')}
  S.busy=false;S.authMsg=`If ${email} has an account, a reset link is on its way. Check spam too.`;render();
}
function authFail(m){S.authErr=m;S.busy=false;render();return false}
async function logOut(){try{const t=localStorage.getItem(PUSH_KEY);if(t&&S.me)await pushUnregister(t)}catch{}stopSubs();firstLoadDone=false;S.view='board';S.myDoc=null;S.authMode='login';S.authErr='';S.authMsg='';S.form.pw='';try{await S.sb.auth.signOut()}catch{}}
async function setNewPw(){if(!need(S.pw.nw.length>=8,'pw','Use a new password of at least 8 characters.'))return;
  S.busy=true;render();const {data,error}=await S.sb.auth.updateUser({password:S.pw.nw});S.busy=false;
  if(error){S.err={pw:authMsg(authErr(error))};render();return}
  S.recovery=false;S.pw={cur:'',nw:''};S.err={};toast('Password set');handleUser(userOf(data.user))}
async function checkPw(pw){const {error}=await S.sb.auth.signInWithPassword({email:S.user.email,password:pw});if(error)throw authErr(error)}

function closeCom(){(S.comSubs||[]).forEach(u=>{try{u()}catch{}});S.comSubs=[];S.cid=null;S.cnote=null;S.cnotes={};S.ccoms={};S.cmembers={}}
function openCom(id){if(S.cid===id){go('cboard');return}closeCom();S.cid=id;const {collection,query,where,onSnapshot}=S.fb,db=S.db;
  const r=()=>{if(S.phase==='app')render()};
  S.comSubs=[onSnapshot(query(collection(db,'cnotes'),where('community','==',id)),snap=>{const c={};snap.forEach(x=>{c[x.id]=x.data()});S.cnotes=c;r()},e=>console.warn(e)),
    onSnapshot(query(collection(db,'ccomments'),where('community','==',id)),snap=>{const c={};snap.forEach(x=>{c[x.id]=x.data()});S.ccoms=c;r()},e=>console.warn(e)),
    onSnapshot(query(collection(db,'cmembers'),where('community','==',id)),snap=>{const c={};snap.forEach(x=>{const d=x.data();c[d.uid]=d.role});S.cmembers=c;r()},e=>console.warn(e))];
  go('cboard')}
// Username suggestions when inviting to a board: people you can already see (your campus, board mates, people you've worked with).
// Matching usernames first, then people you've worked with, then whoever's online. Members and people you've blocked are left out.
function ciSugs(){const q=S.cdraft.handle.trim().replace(/^@/,'').toLowerCase(),me=S.me.id,D=derive(),bl=new Set(arr(S.priv.blocked)),mem=S.cmembers||{},l=[];
  for(const u of Object.keys(S.peopleDocs)){if(u===me||!ID_RE.test(u)||!isMember(u)||isOrg(u)||bl.has(u)||mem[u])continue;const h=handleOf(u);if(!h)continue;
    const nm=(realNameOf(u)||'').toLowerCase();let sc=0;
    if(q){if(h.startsWith(q))sc=3;else if(h.includes(q))sc=2;else if(nm.split(/\s+/).some(w=>w&&w.startsWith(q)))sc=1;else continue}
    l.push({u,h,sc,w:workedWith(u,D).length>0,on:onlineNow(u)})}
  return l.sort((a,b)=>b.sc-a.sc||b.w-a.w||b.on-a.on||a.h.localeCompare(b.h)).slice(0,6)}
function ciSugsHTML(){const l=ciSugs(),q=S.cdraft.handle.trim();
  if(!l.length)return q?'<p class="note hsnone">No one you know matches. If you know their exact username, you can still send the invite.</p>':'';
  return`${q?'':'<span class="formlabel">Suggested</span>'}<div class="menu hsugs">${l.map(x=>`<button data-act="comInviteH" data-h="${esc(x.h)}" aria-label="Invite @${esc(x.h)}">${ring(x.u,34)}<span class="rowtext"><span class="t1">@${esc(x.h)}</span><span class="t2">${esc(x.w?'Worked together':realNameOf(x.u)||campusName(campusOf(x.u)))}</span></span><span class="pick">Invite</span></button>`).join('')}</div>`}
const comName=id=>str(S.coms[id]?.name,40)||'Board';
const comOwner=id=>S.cmine[id]==='owner';
function comChips(){const mine=Object.keys(S.cmine).filter(id=>S.coms[id]).sort((a,b)=>comName(a).localeCompare(comName(b))),inv=Object.keys(S.cinv).filter(id=>S.coms[id]);
  return`<div class="comrow" role="navigation" aria-label="Boards"><button class="comchip on">${esc(campus())}</button>${mine.map(id=>`<button class="comchip" data-com="${esc(id)}">${esc(comName(id))}</button>`).join('')}${inv.map(id=>`<button class="comchip invited" data-sheet="cjoin" data-about="${esc(id)}">${ic('mail',13)} ${esc(comName(id))}</button>`).join('')}<button class="comchip cnewchip" data-sheet="cnew">${ic('plus',14)} New board</button></div>`}
function cnoteTile(n,i){const c=COLOR_RE.test(n.color||'')?n.color:'#7FA2FF',k=Object.values(S.ccoms).filter(x=>x.note===n.id).length,ph=n.pics?(picsOf('c:'+n.id)||[])[0]:'',tags=[n.where,n.when].filter(Boolean).join(' · ');
  return`<button class="tile ntile cntile r${i%3}" data-cnote="${esc(n.id)}" style="--nc:${c};--i:${i};--d:0s"><span class="tbg ${ph?'ph':''}" aria-hidden="true">${ph?`<img src="${ph}" alt="">`:''}</span><span class="pin"></span>${n.pics?`<span class="tpics">${ic('camera',12,2.2)} ${n.pics} ${n.pics===1?'photo':'photos'}</span>`:''}<p>${esc(n.text)}</p>${tags?`<span class="where">${ic('place',12,2.2)}<span>${esc(tags)}</span></span>`:''}
    <span class="by">${face(n.by,22)}<span class="nm">${esc(firstName(n.by))}</span><span class="n">${ic('chat',12,2.2)} ${k}</span></span></button>`}
function viewCBoard(D){const id=S.cid,c=S.coms[id];if(!id||!c||!S.cmine[id])return viewBoard(D);
  const notes=Object.entries(S.cnotes).map(([k,v])=>({...v,id:k})).sort((a,b)=>b.at-a.at),n=Object.keys(S.cmembers).length,owner=comOwner(id);
  const cols=wideMQ.matches?3:2,col=Array.from({length:cols},()=>[]);notes.forEach((x,i)=>col[i%cols].push(cnoteTile(x,i)));
  return`<div class="pad cboard"><div class="ptop">${back('board')}${kebab('cboard',[{i:'users',t:'Members',v:String(n),at:'data-sheet="cmembers"'},owner?{i:'plus',t:'Invite people',at:'data-sheet="cinvite"'}:null],'Board options')}</div>
    <div class="chead"><h1 class="pageh">${esc(c.name)}</h1>${c.about?`<p class="cabout">${esc(c.about)}</p>`:''}
      <div class="cmeta"><span class="muted">${n} ${n===1?'member':'members'}</span></div></div>
    ${notes.length?`<div class="wall">${col.map(x=>`<div class="wcol">${x.join('')}</div>`).join('')}</div>`:`<div class="empty"><b>No notes yet</b><p>Add the first note for ${esc(c.name)}.</p></div>`}
    <button class="cta cadd" data-act="cnoteStart">${ic('plus',17,2.4,'var(--on-grad)')} Add a note</button></div>`}
function viewCNote(D){const n0=S.cnotes[S.cnote];if(!S.cid||!n0)return viewCBoard(D);const n={...n0,id:S.cnote},c=COLOR_RE.test(n.color||'')?n.color:'#7FA2FF',me=S.me.id,owner=comOwner(S.cid);
  const coms=Object.entries(S.ccoms).map(([k,v])=>({...v,id:k})).filter(x=>x.note===n.id).sort((a,b)=>a.at-b.at);
  return`<div class="pad cnotepage"><div class="ptop">${back('cboard')}${kebab('cnote',[n.by===me||owner?{i:'trash',t:n.by===me?'Delete this note':'Remove this note',at:'data-act="cnoteDel"',danger:true}:null],'Note options')}</div>
    <div class="tile ntile cnbig" style="--nc:${c};--d:0s"><span class="pin"></span><p>${esc(n.text)}</p>${[n.where,n.when].filter(Boolean).length?`<span class="where">${ic('place',12,2.2)}<span>${esc([n.where,n.when].filter(Boolean).join(' · '))}</span></span>`:''}${n.more?`<p class="cmore">${esc(n.more)}</p>`:''}
      <span class="by">${face(n.by,26)}<span class="nm">${esc(shortName(n.by))}</span><span class="n">${since(n.at)}</span></span></div>
    ${n.pics?picStrip('c:'+n.id,n.pics):''}
    <h2 class="h2">${coms.length} ${coms.length===1?'comment':'comments'}</h2>
    <div class="ccoms">${coms.map(x=>`<div class="ccom">${face(x.by,30)}<div class="cbody"><span class="cwho">${esc(shortName(x.by))} <span class="muted">${since(x.at)}</span></span><p>${esc(x.t)}</p>
      ${x.by===me||owner?`<button class="linkbtn" data-act="ccomDel" data-id="${esc(x.id)}">Delete</button>`:''}</div></div>`).join('')}</div>
    <div class="composer ccomposer ${S.cdraft.comment.trim()?'hastext':''}" id="ccomposer"><label class="field" for="ccomIn"><input id="ccomIn" maxlength="500" placeholder="Add a comment…" value="${esc(S.cdraft.comment)}" data-bind="cdraft.comment" autocomplete="off"></label>
      <button class="csend" data-act="ccomSend" aria-label="Post comment">${ic('send',19,2,'var(--on-grad)')}</button></div></div>`}
function closeThread(){(S.chat.unsubs||[]).forEach(u=>{try{u()}catch{}});if(S.rec)recStop(false);if(S.audio){S.audio.pause();S.playing=null}S.chat={key:null}}
function openThread(t){
  const {collection,query,orderBy,limit,onSnapshot}=S.fb,D=derive(),other=t.other;
  closeThread();S.chatDraft={text:''};
  const keys=[...new Set([t.key,...D.threads.filter(x=>x.other===other).map(x=>x.key)])];
  // Send into the thread you came from; if that one is closed, the most recent one that's still open.
  let key=t.key;if(!chatCan(key,other,D))key=D.threads.filter(x=>x.other===other).map(x=>x.key).find(k=>chatCan(k,other,D))||t.key;
  S.chat={key,other,jobKey:parseKey(key)?.jobKey||null,keys,parts:{},msgs:[],loaded:false,unsubs:[]};
  let waiting=keys.length;
  for(const k of keys){const jobKey=parseKey(k)?.jobKey||null;let first=true;
    S.chat.unsubs.push(onSnapshot(query(collection(S.db,'threads',k,'msgs'),orderBy('at','desc'),limit(300)),snap=>{
      if(S.chat.other!==other||!S.chat.keys?.includes(k))return;
      S.chat.parts[k]=snap.docs.map(d=>({...d.data(),id:Number(d.id)})).filter(m=>m&&typeof m.t==='string'&&m.kind!=='unsent').map(m=>({id:m.id,t:m.t.slice(0,1000),at:num(m.at),by:str(m.by,128),kind:['photo','audio'].includes(m.kind)?m.kind:'text',media:typeof m.media==='string'?m.media:'',dur:num(m.dur),
        replyTo:num(m.replyTo)||null,reactions:m.reactions&&typeof m.reactions==='object'?m.reactions:{},thread:k,jobKey})).reverse();
      S.chat.msgs=Object.values(S.chat.parts).flat().sort((x,y)=>x.at-y.at||x.id-y.id);
      if(first){first=false;waiting--}if(waiting>0)return;
      const wasLoaded=S.chat.loaded;S.chat.loaded=true;markSeen();render();
      if(!wasLoaded)requestAnimationFrame(()=>{const m=$('main');if(S.view==='chat')m.scrollTop=m.scrollHeight});
    },e=>{if(first){first=false;waiting--}if(waiting<=0){S.chat.loaded=true;render()}console.warn(e)}));
  }
  go('chat',true);
}
function mediaUrl(path){S.media=S.media||{};const v=S.media[path];if(v!==undefined)return v;S.media[path]=null;
  S.sb.storage.from('chat').createSignedUrl(path,6*3600).then(({data})=>{S.media[path]=data?.signedUrl||'';if(data?.signedUrl)S.pics['m:'+path]=[data.signedUrl];if(S.view==='chat')render()}).catch(()=>{S.media[path]=''});return null}
const mmss=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function msgBody(m){if(m.kind==='photo'){const u=mediaUrl(m.media);return u?`<button class="mphoto" data-pic="${esc('m:'+m.media)}" data-i="0" aria-label="Open photo"><img src="${esc(u)}" alt="Photo"></button>`:'<span class="mphoto wait"></span>'}
  if(m.kind==='audio'){const u=mediaUrl(m.media),on=S.playing===m.media;return`<span class="maudio"><button class="mplay" data-act="playVoice" data-src="${esc(m.media)}" ${u?'':'disabled'} aria-label="${on?'Pause':'Play'} voice message">${ic(on?'pause':'play',16,2.2,'currentColor',on?'none':'currentColor')}</button><span class="mwave"><i style="width:${on?S.playPct||0:0}%"></i></span><span class="mdur">${mmss(m.dur)}</span></span>`}
  return esc(m.t)}
// Replies, reactions and unsending, like Instagram: swipe a message to reply, hold it for reactions and more, double-tap to heart.
const REACTS=['❤️','😂','😮','😢','👍','🔥'];
const msgSnip=m=>m.kind==='photo'?'Photo':m.kind==='audio'?'Voice message':str(m.t,90);
const quoteHTML=q=>`<button class="mquote" data-act="jumpMsg" data-to="${q.id}"><b>${q.by===S.me.id?'You':esc(firstName(q.by))}</b><span>${esc(msgSnip(q))}</span></button>`;
const replyBar=r=>`<div class="replybar"><span class="rowtext"><span class="t1">Replying to ${r.by===S.me.id?'yourself':esc(firstName(r.by))}</span><span class="t2">${esc(msgSnip(r))}</span></span><button class="iconbtn" data-act="cancelReply" aria-label="Cancel reply">${ic('x',14,2.4)}</button></div>`;
const chatMsg=id=>S.chat.msgs?.find(x=>x.id===id);
function startReply(id){const m=chatMsg(id);if(!m)return;if(m.thread&&m.thread!==S.chat.key&&chatCan(m.thread,S.chat.other,derive())){S.chat.key=m.thread;S.chat.jobKey=m.jobKey}S.chatDraft.reply={id,by:m.by,t:m.t,kind:m.kind};S.sheet=null;render();requestAnimationFrame(()=>$('msg')?.focus())}
function reactTo(id,e,force){const m=chatMsg(id);if(!m)return;const me=S.me.id,cur=m.reactions?.[me];if(force&&cur===e)return;const next=cur===e?null:e;
  m.reactions={...(m.reactions||{})};if(next)m.reactions[me]=next;else delete m.reactions[me];S.rxPop=next?id:null;render();setTimeout(()=>{if(S.rxPop===id)S.rxPop=null},600);
  S.fb.rpc('react_msg',{p_id:id,p_emoji:next}).catch(()=>toast('Couldn\u2019t react. Try again.'))}
async function sendMedia(kind,blob,ext,dur){const c=S.chat;if(!c.key||!canMessage(c,derive()))return;
  const path=`${c.key.replaceAll('~','_')}/${crypto.randomUUID()}.${ext}`,type=kind==='photo'?'image/jpeg':(blob.type||'audio/webm').split(';')[0];
  S.chatUp=kind;render();
  const {error}=await S.sb.storage.from('chat').upload(path,blob,{contentType:type,upsert:false});
  if(error){S.chatUp=null;render();console.warn(error);toast(kind==='photo'?'Couldn\u2019t send the photo. Try again.':'Couldn\u2019t send the voice message. Try again.');return}
  const reply=S.chatDraft.reply?.id||null;S.chatDraft.reply=null;
  try{await S.fb.rpc('send_msg',{p_thread:c.key,p_job:c.jobKey||null,p_other:c.other,p_text:'',p_kind:kind,p_media:path,p_dur:dur||null,p_reply:reply});savePriv({seen:{[c.key]:Date.now()}})}
  catch(e){console.warn(e);toast('Couldn\u2019t send that. Try again.')}
  S.chatUp=null;render()}
async function sendChatPhoto(file){let b;try{const d=await readPic(file);b=await (await fetch(d)).blob()}catch{toast('That photo couldn\u2019t be opened. Try another one.');return}return sendMedia('photo',b,'jpg')}
// One file input that lives outside the app's re-rendered regions. Opening the system picker sends the page to the
// background, which re-renders the chat, so an input inside the composer could be replaced before the photo arrives.
const chatPicker=(()=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.multiple=true;i.hidden=true;
  i.addEventListener('change',async()=>{const fs=[...(i.files||[])].slice(0,10);i.value='';for(const f of fs)await sendChatPhoto(f)});document.body.appendChild(i);return i})();
const recClock=()=>mmss(S.rec?(Date.now()-S.rec.t0)/1000:0);
async function recStart(){if(S.rec)return;if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){toast('This browser can\u2019t record audio.');return}
  let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch{toast('Allow the microphone for tack to send voice messages.');return}
  const mt=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg'].find(t=>MediaRecorder.isTypeSupported?.(t))||'';
  const rec=new MediaRecorder(stream,mt?{mimeType:mt}:undefined),parts=[];rec.ondataavailable=e=>{if(e.data.size)parts.push(e.data)};
  S.rec={rec,stream,parts,t0:Date.now(),tick:setInterval(()=>{const el=$('recT');if(el)el.textContent=recClock();if(Date.now()-S.rec.t0>=120000)recStop(true)},250)};rec.start(250);render()}
function recStop(send){const r=S.rec;if(!r)return;clearInterval(r.tick);S.rec=null;const dur=(Date.now()-r.t0)/1000;
  r.rec.onstop=()=>{r.stream.getTracks().forEach(t=>t.stop());if(!send)return;if(dur<1){toast('Hold on a little longer to record.');return}
    const type=(r.rec.mimeType||r.parts[0]?.type||'audio/webm').split(';')[0],blob=new Blob(r.parts,{type}),ext=type.includes('mp4')?'m4a':type.includes('ogg')?'ogg':'webm';sendMedia('audio',blob,ext,Math.round(dur))};
  try{r.rec.stop()}catch{r.stream.getTracks().forEach(t=>t.stop())}render()}
function playVoice(path){const u=S.media?.[path];if(!u)return;S.audio=S.audio||new Audio();const a=S.audio;
  if(S.playing===path&&!a.paused){a.pause();S.playing=null;render();return}
  a.src=u;S.playing=path;S.playPct=0;a.ontimeupdate=()=>{S.playPct=a.duration?Math.round(a.currentTime/a.duration*100):0;const b=document.querySelector(`[data-src="${CSS.escape(path)}"]`)?.parentElement?.querySelector('.mwave i');if(b)b.style.width=S.playPct+'%'};
  a.onended=()=>{S.playing=null;S.playPct=0;render()};a.play().catch(()=>{S.playing=null;toast('Couldn\u2019t play that.')});render()}
function markSeen(){
  const c=S.chat;if(!c.key||S.view!=='chat')return;const me=S.me.id,patch={};
  for(const k of c.keys||[c.key]){const last=Math.max(0,...(c.parts?.[k]||[]).filter(m=>m.by!==me).map(m=>m.at));if(!last)continue;
    if(last>num((S.priv.seen||{})[k]))patch[k]=last;
    if(pref('receipts')&&threadOpen(k)&&!reqIn(k,c.other)&&last>num(((S.threadDocs[k]||{}).read||{})[me]))S.fb.rpc('thread_read',{p_thread:k,p_at:last}).catch(()=>{})}
  if(Object.keys(patch).length)savePriv({seen:patch});
}
function sendMsg(){
  const c=S.chat,t=S.chatDraft.text.trim();if(!c.key||!t)return;
  if(modBlock('chat',t))return;
  if(!canMessage(c,derive())){toast('You can\u2019t message them yet.');return}
  const at=Date.now();
  const reply=S.chatDraft.reply?.id||null;
  S.chatDraft.text='';S.chatDraft.reply=null;const box=$('msg');if(box)box.value='';if(reply)render();
  S.fb.rpc('send_msg',{p_thread:c.key,p_job:c.jobKey||null,p_other:c.other,p_text:t.slice(0,1000),p_reply:reply}).catch(writeErr);
  savePriv({seen:{[c.key]:at}});
  requestAnimationFrame(()=>{$('msg')?.focus()});
}

const BIO_MAX=160,BANNER_MAX=90000,BANNERS={ocean:'linear-gradient(120deg,#1D3FD8,#0F8C9C 60%,#0E9C84)',dusk:'linear-gradient(120deg,#3B2A8F,#B4508C 60%,#F08A4B)',grove:'linear-gradient(120deg,#0E5C47,#2E9E6A 55%,#B9D96A)',ember:'linear-gradient(120deg,#5A1E2A,#C2412D 55%,#F2B84B)',night:'radial-gradient(120% 140% at 20% 0%,#2C3E8F 0%,#0D1530 55%,#050A1C 100%)',candy:'linear-gradient(120deg,#6A5CFF,#E58AC0 55%,#FFC9A8)',mint:'linear-gradient(120deg,#0E9C84,#7FE0CF 60%,#E7FFF8)',mono:'linear-gradient(120deg,#1E2536,#3A4560 55%,#5E6B8A)'};
const bannerOk=b=>typeof b==='string'&&(BANNERS[b]||(b.length<=BANNER_MAX&&PIC_RE.test(b)));
function bannerStyle(b){return BANNERS[b]?`background:${BANNERS[b]}`:bannerOk(b)?`background:center/cover url(${b})`:''}
function openCrop(file,target){if(!file)return;const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{S.crop={target,url,w:img.naturalWidth,h:img.naturalHeight,cx:img.naturalWidth/2,cy:img.naturalHeight/2,z:1,aspect:target==='banner'?3:1};S.cropImg=img;S.err={};S.sheet={type:'crop'};render()};
  img.onerror=()=>{URL.revokeObjectURL(url);S.err={onb:'That photo couldn’t be opened. Try another one, or a screenshot of it.'};render()};
  img.src=url}
function cropGeom(){const c=S.crop,box=$('cropBox');if(!c||!box)return null;const W=box.clientWidth,H=box.clientHeight,s0=Math.max(W/c.w,H/c.h),sc=s0*c.z;
  const hx=W/(2*sc),hy=H/(2*sc);c.cx=Math.min(Math.max(c.cx,hx),c.w-hx);c.cy=Math.min(Math.max(c.cy,hy),c.h-hy);return{W,H,sc,hx,hy}}
function cropApply(){const c=S.crop,g=cropGeom(),im=$('cropImg');if(!g||!im)return;
  im.style.width=c.w*g.sc+'px';im.style.height=c.h*g.sc+'px';im.style.transform=`translate(${g.W/2-c.cx*g.sc}px,${g.H/2-c.cy*g.sc}px)`;const z=$('cropZoom');if(z&&+z.value!==c.z)z.value=c.z}
function cropDone(){const c=S.crop,g=cropGeom();if(!c||!g||!S.cropImg)return;const out=c.target==='banner'?[960,320]:[256,256],cv=document.createElement('canvas');cv.width=out[0];cv.height=out[1];
  const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,out[0],out[1]);x.drawImage(S.cropImg,c.cx-g.hx,c.cy-g.hy,g.hx*2,g.hy*2,0,0,out[0],out[1]);
  let q=.82,d=cv.toDataURL('image/jpeg',q);while(c.target==='banner'&&d.length>BANNER_MAX&&q>.4){q-=.08;d=cv.toDataURL('image/jpeg',q)}
  if(c.target==='banner')S.onb.banner=d;else S.onb.photo=d;URL.revokeObjectURL(c.url);S.crop=null;S.cropImg=null;S.sheet=null;render()}
let cropPtrs=new Map(),cropPinch=0;
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#cropBox')||!S.crop)return;e.preventDefault();cropPtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});e.target.setPointerCapture?.(e.pointerId);
  if(cropPtrs.size===2){const[a,b]=[...cropPtrs.values()];cropPinch=Math.hypot(a.x-b.x,a.y-b.y)}});
document.addEventListener('pointermove',e=>{if(!S.crop||!cropPtrs.has(e.pointerId))return;const p=cropPtrs.get(e.pointerId),g=cropGeom();if(!g)return;
  if(cropPtrs.size===2){cropPtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});const[a,b]=[...cropPtrs.values()],dd=Math.hypot(a.x-b.x,a.y-b.y);if(cropPinch){S.crop.z=Math.min(4,Math.max(1,S.crop.z*dd/cropPinch))}cropPinch=dd}
  else{S.crop.cx-=(e.clientX-p.x)/g.sc;S.crop.cy-=(e.clientY-p.y)/g.sc;cropPtrs.set(e.pointerId,{x:e.clientX,y:e.clientY})}cropApply()});
['pointerup','pointercancel'].forEach(n=>document.addEventListener(n,e=>{cropPtrs.delete(e.pointerId);if(cropPtrs.size<2)cropPinch=0}));
document.addEventListener('wheel',e=>{if(!S.crop||!e.target.closest('#cropBox'))return;e.preventDefault();S.crop.z=Math.min(4,Math.max(1,S.crop.z*(e.deltaY<0?1.08:1/1.08)));cropApply()},{passive:false});
function readPhoto(file){
  return new Promise((res,rej)=>{
    if(!file||!/^image\//.test(file.type))return rej(new Error('type'));
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{const n=192,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d');
      const s=Math.min(img.naturalWidth,img.naturalHeight);x.drawImage(img,(img.naturalWidth-s)/2,(img.naturalHeight-s)/2,s,s,0,0,n,n);
      URL.revokeObjectURL(url);res(c.toDataURL('image/jpeg',.82))};
    img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('decode'))};
    img.src=url;
  });
}
function readPic(file){
  return new Promise((res,rej)=>{
    if(!file||!/^image\//.test(file.type))return rej(new Error('type'));
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{const w=img.naturalWidth,h=img.naturalHeight,c=document.createElement('canvas'),x=c.getContext('2d');let n=1024,q=.72,out='';
      for(let i=0;i<6;i++){const k=Math.min(1,n/Math.max(w,h));c.width=Math.max(1,Math.round(w*k));c.height=Math.max(1,Math.round(h*k));
        x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);out=c.toDataURL('image/jpeg',q);if(out.length<=PIC_MAX)break;n=Math.round(n*.8);q=Math.max(.5,q-.06)}
      URL.revokeObjectURL(url);out.length<=PIC_MAX&&PIC_RE.test(out)?res(out):rej(new Error('size'))};
    img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('decode'))};
    img.src=url;
  });
}
const cleanPics=l=>Array.isArray(l)?l.filter(x=>typeof x==='string'&&x.length<=PIC_MAX&&PIC_RE.test(x)).slice(0,MAX_PICS):[];
function picsOf(k){const v=S.pics[k];if(v!==undefined)return v;S.pics[k]=null;
  const [col,id]=k.split(':');S.fb.getDoc(S.fb.doc(S.db,{j:'jobpics',b:'bidpics',r:'reviewpics',c:'cnotepics'}[col],id)).then(d=>{S.pics[k]=d.exists()?cleanPics(d.data().pics):[]}).catch(()=>{S.pics[k]=[]}).finally(()=>{if(S.phase==='app')render()});
  return null}
function picStrip(k,n,cls=''){if(!n)return'';const l=picsOf(k);
  return`<div class="pics ${cls}">${l?l.map((src,i)=>`<button class="pic" data-pic="${esc(k)}" data-i="${i}" aria-label="Open photo ${i+1} of ${l.length}"><img src="${src}" alt=""></button>`).join('')
    :Array.from({length:n},()=>'<span class="pic wait" aria-hidden="true"></span>').join('')}</div>`}
function picEdit(t,l){l=l||[];
  return`<div class="pics">${l.map((src,i)=>`<span class="pic"><img src="${src}" alt="Photo ${i+1}"><button class="picx" data-unpic="${t}" data-i="${i}" aria-label="Remove photo ${i+1}">${ic('x',14,2.6)}</button></span>`).join('')}
    ${l.length<MAX_PICS?`<label class="pic add" for="pk-${t}">${ic('camera',20)}<span>${l.length?'Add':'Add photos'}</span><input id="pk-${t}" type="file" accept="image/jpeg,image/png,image/webp" multiple data-pics="${t}"></label>`:''}</div>`}

async function loadCat(){if(S.cat||S.catLoading)return;S.catLoading=true;
  try{const [c,d]=await Promise.all([S.sb.from('campuses').select('id,name,college,city,listed'),S.sb.from('campus_domains').select('domain,campus')]);
    const dm={};for(const r of d.data||[])(dm[r.campus]=dm[r.campus]||[]).push(r.domain);
    S.cat=(c.data||[]).map(r=>({id:r.id,name:r.name,college:r.college||'',city:r.city||'',domains:dm[r.id]||[],k:(r.name+' '+(r.college||'')+' '+(r.city||'')+' '+(dm[r.id]||[]).join(' ')).toLowerCase()}))}catch(e){console.warn(e)}
  S.catLoading=false;if(['auth','campus'].includes(S.phase))render()}
const catById=id=>(S.cat||[]).find(c=>c.id===id);
function catSearch(q,pool){const t=q.toLowerCase().split(/[\s,]+/).filter(Boolean);const l=pool||S.cat||[];if(!t.length)return pool?l.slice(0,40):[];
  return l.filter(c=>t.every(w=>c.k.includes(w))).sort((a,b)=>(a.name.toLowerCase().startsWith(t[0])?0:1)-(b.name.toLowerCase().startsWith(t[0])?0:1)||a.name.localeCompare(b.name)).slice(0,40)}
const domOk=(email,doms)=>{const d=email.split('@')[1]||'';return doms.some(x=>d===x||d.endsWith('.'+x))};
function colResHTML(q,pool,act){const l=catSearch(q,pool);if(!q.trim()&&!pool)return'';
  return l.length?l.map(c=>`<button type="button" class="colopt" data-act="${act}" data-id="${esc(c.id)}"><b>${esc(c.name)}</b><span>${esc(c.domains[0]?'@'+c.domains[0]:'')}</span></button>`).join('')
    :`<p class="note" style="text-align:left;margin:6px 2px">No college matches “${esc(q)}”.</p>`}
function paintCol(){const r=$('colRes');if(!r)return;const pool=S.phase==='campus'?S.cpick?.opts:null;r.innerHTML=colResHTML(S.phase==='campus'?S.cpick.q:S.form.colq,pool,S.phase==='campus'?'pickBranch':'pickCollege')}
function collegeField(){const f=S.form,c=f.college?catById(f.college):null;if(!S.cat)loadCat();
  if(c)return`<div class="stack gap8"><span class="formlabel">Your college</span><div class="colchosen"><span><b>${esc(c.name)}</b><br><span class="muted">Sign up with your ${esc(c.domains.map(d=>'@'+d).join(' or '))} email</span></span><button type="button" class="linkbtn" data-act="clearCollege">Change</button></div></div>`;
  if(f.notListed)return`<div class="stack gap8"><span class="formlabel">Your college</span>
    <input id="fNcol" class="inp" maxlength="60" placeholder="College name, e.g. Pearl Academy" value="${esc(f.ncol)}" data-bind="form.ncol">
    <input id="fNcity" class="inp" maxlength="40" placeholder="City or campus, e.g. Jaipur" value="${esc(f.ncity)}" data-bind="form.ncity">
    <p class="note" style="text-align:left;margin:0">tack makes a new board for your college. Others from your college join it with the same kind of email.</p>
    <button type="button" class="linkbtn" style="align-self:flex-start;padding:0" data-act="colList">Search the list instead</button></div>`;
  return`<div class="stack gap8"><label class="formlabel" for="fCol">Your college</label>
    <input id="fCol" class="inp" autocomplete="off" placeholder="${S.cat?'Search '+S.cat.length+' colleges: NIFT Bhopal, IIT Bombay…':'Loading colleges…'}" value="${esc(f.colq)}" data-bind="form.colq">
    <div id="colRes" class="colres">${colResHTML(f.colq,null,'pickCollege')}</div>
    <button type="button" class="linkbtn" style="align-self:flex-start;padding:0" data-act="colMissing">My college isn’t listed</button></div>`}
function authHTML(){
  const m=S.authMode,f=S.form;
  const field=(id,label,type,key,ph,ac)=>`<div class="stack gap8"><label class="formlabel" for="${id}">${label}</label>
    ${type==='password'?`<span class="pwwrap">`:''}<input id="${id}" class="inp" type="${type==='password'&&S.showPw?'text':type}" autocomplete="${ac}" placeholder="${esc(ph)}" value="${esc(f[key])}" data-bind="form.${key}" ${type==='email'?'inputmode="email" autocapitalize="off" spellcheck="false"':''}>${type==='password'?`<button type="button" class="pwtoggle" data-act="togglePw" aria-label="${S.showPw?'Hide':'Show'} password">${S.showPw?'Hide':'Show'}</button></span>`:''}</div>`;
  const tabs=`<div class="authtabs" role="tablist"><button type="button" role="tab" aria-selected="${m==='login'}" class="${m==='login'?'on':''}" data-auth="login">Log in</button>
    <button type="button" role="tab" aria-selected="${m==='signup'}" class="${m==='signup'?'on':''}" data-auth="signup">Sign up</button></div>`;
  let body='';
  if(m==='signup')body=`<form class="stack" id="authForm" data-form="signup" novalidate style="gap:14px">
     ${inviteParam?`<div class="invitebanner">You're invited. Create your account with <b>${esc(inviteParam)}</b>, the address your invite went to.</div>`:codeParam?`<div class="invitebanner">A friend invited you to tack. Sign up with any email you use.</div>`:''}
     ${field('fName','Full name','text','name','Sana Qureshi','name')}
     ${inviteParam||codeParam?'':collegeField()}
     ${field('fEmail','College email','email','email',inviteParam?'The address you were invited on':'you@college.edu.in','email')}
     ${field('fPw','Password','password','pw','At least 8 characters','new-password')}
     ${S.authErr?`<p class="err" role="alert">${esc(S.authErr)}</p>`:''}
     <button class="cta" type="submit" data-need="signup" ${S.busy?'disabled':''}>${S.busy?'Creating your account…':'Create account'}</button>
     <p class="note">No college email? Ask the organiser for an invite.</p></form>`;
  else if(m==='login')body=`<form class="stack" id="authForm" data-form="login" novalidate style="gap:14px">
     ${field('fEmail','Email','email','email','you@college.edu.in','email')}
     ${field('fPw','Password','password','pw','Your password','current-password')}
     ${S.authErr?`<p class="err" role="alert">${esc(S.authErr)}</p>`:''}
     <button class="cta" type="submit" data-need="login" ${S.busy?'disabled':''}>${S.busy?'Logging in…':'Log in'}</button>
     <button type="button" class="linkbtn" data-auth="reset">Forgot your password?</button></form>`;
  else body=`<form class="stack" id="authForm" data-form="reset" novalidate style="gap:14px">
     <p>Enter the email you signed up with and we'll send a link to set a new password.</p>
     ${field('fEmail','Email','email','email','you@college.edu.in','email')}
     ${S.authErr?`<p class="err" role="alert">${esc(S.authErr)}</p>`:''}${S.authMsg?`<p class="okmsg" role="status">${esc(S.authMsg)}</p>`:''}
     <button class="cta" type="submit" data-need="reset" ${S.busy?'disabled':''}>Send reset link</button>
     <button type="button" class="linkbtn" data-auth="login">Back to log in</button></form>`;
  return`<div class="gatebox authbox"><div class="mark">tack</div>
    <div class="authcard">${m==='reset'?'<h1 class="authh">Reset your password</h1>':tabs}${body}</div></div>`;
}
function gateHTML(){
  const email=esc(S.user?.email||'');
  switch(S.phase){
  case'loading':return`<div class="loading"><div class="mark">tack</div></div>`;
  case'setup':return`<div class="gatebox"><div class="mark">tack</div><h1>Almost ready</h1><p>This site isn't connected to its database yet. Add the Supabase project URL and key to <b>supabase-config.js</b> and reload.</p></div>`;
  case'offline':return`<div class="gatebox"><div class="mark">tack</div><h1>Can't reach tack</h1><p>Check your connection and reload the page.</p><button class="cta" data-act="reload">Reload</button></div>`;
  case'auth':return authHTML();
  case'verify':return`<div class="gatebox"><div class="mark">tack</div><h1>Check your email</h1>
    <p>We sent a 6-digit code to <b>${email}</b>. Type it here to get into tack. Check spam if it isn’t there in a minute.</p>
    <form class="stack" id="authForm" data-form="otp" novalidate style="gap:12px">
      <input id="fOtp" class="inp otpinp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" value="${esc(S.form.otp||'')}" data-bind="form.otp" aria-label="6-digit code">
      ${S.err.otp?`<p class="err" role="alert">${esc(S.err.otp)}</p>`:''}
      <button class="cta" type="submit" ${S.busy?'disabled':''}>${S.busy?'Checking…':'Confirm'}</button></form>
    <button class="btn2" data-act="resendVerify">Send a new code</button>
    <button class="linkbtn" data-act="logout">Use a different email</button></div>`;
  case'newpw':return`<div class="gatebox"><div class="mark">tack</div><h1>Set a new password</h1>
    <form class="stack" id="authForm" data-form="newpw" novalidate style="gap:14px">
    <div class="stack gap8"><label class="formlabel" for="fNewPw">New password</label><span class="pwwrap"><input id="fNewPw" class="inp" type="${S.showPw?'text':'password'}" autocomplete="new-password" placeholder="At least 8 characters" value="${esc(S.pw.nw)}" data-bind="pw.nw"><button type="button" class="pwtoggle" data-act="togglePw" aria-label="${S.showPw?'Hide':'Show'} password">${S.showPw?'Hide':'Show'}</button></span></div>
    ${S.err.pw?`<p class="err" role="alert">${esc(S.err.pw)}</p>`:''}
    <button class="cta" type="submit" ${S.busy?'disabled':''}>${S.busy?'Saving…':'Save password'}</button></form></div>`;
  case'campus':{const c=S.cpick;return`<div class="gatebox"><div class="mark">tack</div>
    <h1>${c.add?'Name your college':'Pick your campus'}</h1>
    ${c.add?`<p>You’re the first from <b>@${esc(c.dom)}</b>. Tell us your college and tack makes its board. Everyone with the same kind of email joins you there.</p>
      <div class="stack gap8"><input id="cpCol" class="inp" maxlength="60" placeholder="College name" value="${esc(c.ncol)}" data-bind="cpick.ncol">
      <input id="cpCity" class="inp" maxlength="40" placeholder="City or campus" value="${esc(c.ncity)}" data-bind="cpick.ncity"></div>
      ${c.err?`<p class="err" role="alert">${esc(c.err)}</p>`:''}
      <button class="cta" data-act="addBranch" ${c.busy?'disabled':''}>${c.busy?'Making your board…':'Create our board'}</button>
      ${c.opts.length?'<button class="linkbtn" data-act="branchList">Back to the list</button>':''}`
     :`<p>Your <b>@${esc(c.dom)}</b> email works at ${c.opts.length} campuses. Pick yours to see its board.</p>
      ${c.opts.length>8?`<input id="cpQ" class="inp" autocomplete="off" placeholder="Search by city" value="${esc(c.q)}" data-bind="cpick.q">`:''}
      <div id="colRes" class="colres open">${colResHTML(c.q,c.opts,'pickBranch')}</div>
      ${c.err?`<p class="err" role="alert">${esc(c.err)}</p>`:''}
      <button class="linkbtn" data-act="branchMissing">My campus isn’t listed</button>`}
    <button class="linkbtn" data-act="logout">Log out</button></div>`}
  case'notinvited':return`<div class="gatebox"><div class="mark">tack</div><h1>Use your college email</h1>
    <p><b>${email}</b> isn’t a college email tack recognises, and it isn’t on the invite list. Log out and sign up with your college email to join your campus board, or ask the organiser to invite this address.</p>
    <button class="btn2" data-act="logout">Log out</button></div>`;
  case'erased':return`<div class="gatebox"><div class="mark">tack</div><h1>Your account is deleted</h1>
    <p>Your profile, jobs, bids and messages are erased, and your login is gone.</p></div>`;
  case'onboard':return onboardHTML(false);
  case'handle':return`<div class="gatebox onb" style="gap:20px"><div class="mark">tack</div><div><h1>Pick your username</h1>
    <p style="margin-top:8px">tack now shows a username on the board, on your jobs and your bids. Your real name, <b>${esc(myRealName())}</b>, is only shown to the person you make a deal with.</p></div>
    ${handleField('')}${S.err.onb?`<p class="err" role="alert">${esc(S.err.onb)}</p>`:''}
    <button class="cta" data-act="saveHandle" data-need="handle">Save username</button></div>`;
  }
  return'';
}
function onboardHTML(edit){
  const o=S.onb,me=S.me.id;
  return`<div class="gatebox onb" style="gap:20px">
   ${edit?`<button class="back" data-act="goBack" data-to="me" aria-label="Back" style="padding:0">${ic('back',20)}</button>`:'<div class="mark">tack</div>'}
   <div><h1>${edit?'Edit profile':'Set up your profile'}</h1>
   </div>
   ${edit?`<div class="eprev">
     <div class="eban" style="${bannerStyle(o.banner)}"><label class="ebtn" for="obn">${ic('camera',14)} ${o.banner?'Change banner':'Add banner'}<input id="obn" type="file" accept="image/*" data-bannerfile></label></div>
     <div class="eav"><label for="oph" class="eavl" aria-label="${o.photo?'Change photo':'Add a photo'}">${ring(me,96)}<span class="eavcam">${ic('camera',15)}</span><input id="oph" type="file" accept="image/*" data-photo></label></div>
     <div class="eacts">${o.photo?'<button class="linkbtn" data-act="clearPhoto">Remove photo</button>':''}${o.banner?'<button class="linkbtn" data-act="pickBanner" data-val="">Remove banner</button>':''}</div>
     <div class="bannerpick" role="group" aria-label="Banner colours">${Object.keys(BANNERS).map(k=>`<button class="bsw ${o.banner===k?'on':''}" style="background:${BANNERS[k]}" data-act="pickBanner" data-val="${k}" aria-label="Banner ${k}" aria-pressed="${o.banner===k}"></button>`).join('')}</div>
   </div>`:''}
   ${edit?'':`<div class="photopick">${ring(me,76)}<div class="stack gap8">
     <label class="upload" for="oph">${ic('camera',16)} ${o.photo?'Change photo':'Add a photo'}<input id="oph" type="file" accept="image/*" data-photo></label>
     ${o.photo?'<button class="linkbtn" style="align-self:flex-start;padding:0" data-act="clearPhoto">Remove photo</button>':''}</div></div>`}
   <div class="stack gap8"><label class="formlabel" for="onm">Full name</label>
     ${edit?`<div class="inp lockedname">${esc(myRealName())}</div><span class="labelhint">As on your college ID. Only the person you make a deal with sees it. It can’t be changed.</span>`:`<input id="onm" class="inp" maxlength="60" autocomplete="name" value="${esc(o.name)}" data-bind="onb.name"><span class="labelhint">As on your college ID. You can’t change it later. Only the person you make a deal with sees it.</span>`}</div>
   ${handleField(edit&&handleLockedUntil()?`You can change it again on ${new Date(handleLockedUntil()).toLocaleDateString('en-IN',{day:'numeric',month:'long'})}.`:'')}
   <div class="stack gap8"><span class="formlabel" id="yl">Year</span>
     <div class="chips" role="group" aria-labelledby="yl">${YEARS.map(y=>`<button class="chip ${o.year===y?'on':''}" data-onb="year" data-val="${y}" aria-pressed="${o.year===y}">${y}</button>`).join('')}</div></div>
   <div class="stack gap8"><label class="formlabel" for="obr">Branch</label>
     <input id="obr" class="inp" maxlength="24" placeholder="CSE, ECE, BDes…" value="${esc(o.branch)}" data-bind="onb.branch" autocomplete="off"></div>
   <div class="stack gap8"><label class="formlabel" for="odo">${edit?'Bio':'What are you good at?'} <span class="muted">(optional${edit?'':', shows as your bio'})</span></label>
     <textarea id="odo" class="inp" rows="3" maxlength="${BIO_MAX}" style="resize:none;line-height:1.45" placeholder="Photography, quick notes, I have a scooter for rides…" data-bind="onb.does">${esc(o.does)}</textarea></div>
   ${edit?'':`<label class="check" for="oad"><input type="checkbox" id="oad" data-bind="onb.adult" ${o.adult?'checked':''}> I'm 18 or older.</label>
   <label class="check" for="oru"><input type="checkbox" id="oru" data-bind="onb.rules" ${o.rules?'checked':''}> <span>I agree to the <button type="button" class="inlink" data-doc="terms">Terms of Use</button> and <button type="button" class="inlink" data-doc="privacy">Privacy Policy</button>, including no assignment or exam work and nothing illegal or unsafe.</span></label>`}
   ${S.err.onb?`<p class="err" role="alert">${esc(S.err.onb)}</p>`:''}
   <button class="cta" data-act="${edit?'saveProfile':'join'}" data-need="${edit?'profile':'join'}">${edit?'Save profile':'Join the board'}</button>
   ${edit?'<button class="linkbtn" data-go="me">Cancel</button>':'<button class="linkbtn" data-act="logout">Log out</button>'}
  </div>`;
}

function back(to){return`<button class="back" data-act="goBack" data-to="${to}" aria-label="Back">${ic('back',20)}</button>`}
// One overflow menu (⋯) per page, top right. The page keeps its main action in view; everything else lives here.
// Items: {i:icon,t:label,at:'data-… attributes',danger,v:value} · {sep:1} · {html}
function kebab(id,items,label='More options',cls=''){
  items=items.filter(Boolean).filter((x,i,a)=>!(x.sep&&(i===0||a[i-1].sep)));while(items.length&&items[items.length-1].sep)items.pop();
  if(!items.some(x=>x.at))return'';const open=S.omenu===id;
  return`<div class="omenu${cls?' '+cls:''}${open?' open':''}"><button class="obtn" data-act="omenu" data-id="${id}" aria-haspopup="menu" aria-expanded="${open}" aria-label="${esc(label)}">${ic('dots',20,2.4)}</button>${open?`<div class="opop" role="menu" aria-label="${esc(label)}">${items.map(x=>x.sep?'<span class="osep" role="separator"></span>':x.html||`<button role="menuitem" class="oitem${x.danger?' danger':''}" ${x.at}>${ic(x.i,18)}<span class="ot">${x.t}</span>${x.v?`<span class="oval">${x.v}</span>`:''}</button>`).join('')}</div>`:''}</div>`}
const LOGO={
  wa:'<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><path fill="#fff" d="M16 4.5A11.4 11.4 0 0 0 6.2 21.7L4.6 27.4l5.9-1.5A11.4 11.4 0 1 0 16 4.5Z"/><path fill="#25D366" d="M16 6.6a9.3 9.3 0 0 0-7.9 14.3l.2.4-1 3.4 3.5-.9.4.2A9.3 9.3 0 1 0 16 6.6Z"/><path fill="#fff" d="M12.5 10.6c-.2-.5-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7c0 1.6 1.2 3.1 1.3 3.3s2.3 3.6 5.6 4.9c2.8 1.1 3.3.9 4 .8s2-.8 2.2-1.6.3-1.5.2-1.6-.3-.2-.6-.4l-2.1-1c-.3-.1-.5-.2-.7.1l-1 1.2c-.2.2-.4.2-.7.1a7.6 7.6 0 0 1-2.2-1.4 8.4 8.4 0 0 1-1.5-1.9c-.2-.3 0-.5.1-.6l.5-.6.3-.5a.6.6 0 0 0 0-.5l-1-2.4Z"/></svg>',
  ig:'<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true"><rect x="5.5" y="5.5" width="21" height="21" rx="6.5" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="16" cy="16" r="5" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="21.9" cy="10.1" r="1.5" fill="#fff"/></svg>'};
const slogo=(k,label,attrs)=>`<${/href=/.test(attrs)?'a':'button'} class="slogo" ${attrs}><span class="slogo-i s-${k}">${LOGO[k]||ic(k,22)}</span><span>${label}</span></${/href=/.test(attrs)?'a':'button'}>`;
const jobLink=j=>SITE+'?job='+encodeURIComponent(j.key);
const jobShareText=j=>isOrg(j.owner)?`From tack: ${j.text} Join your campus board: ${jobLink(j)}`:`₹${fmt(j.price)} on tack: ${j.text}${j.where?' ('+j.where+')':''}. Bid on it here: ${jobLink(j)}`;
const isSaved=k=>Array.isArray(S.priv.saved)&&S.priv.saved.includes(k);
function wrapLines(x,t,w,max){const out=[];let line='';for(const word of String(t).split(/\s+/)){const tryL=line?line+' '+word:word;if(x.measureText(tryL).width>w&&line){out.push(line);line=word}else line=tryL;if(out.length===max)break}
  if(out.length<max&&line)out.push(line);if(out.length===max&&out.join(' ').length<String(t).trim().length){let l=out[max-1];while(l&&x.measureText(l+'…').width>w)l=l.slice(0,-1);out[max-1]=l.trimEnd()+'…'}return out}
function rrect(x,X,Y,W,H,R){x.beginPath();x.moveTo(X+R,Y);x.arcTo(X+W,Y,X+W,Y+H,R);x.arcTo(X+W,Y+H,X,Y+H,R);x.arcTo(X,Y+H,X,Y,R);x.arcTo(X,Y,X+W,Y,R);x.closePath()}
function wordmark(F,col='#F4F6FB'){const c=document.createElement('canvas'),x=c.getContext('2d');x.font=`800 ${F}px Unbounded, Gabarito, sans-serif`;
  const m=x.measureText('tack'),A=m.fontBoundingBoxAscent||F*.9,D=m.fontBoundingBoxDescent||F*.25;c.width=Math.ceil(m.width+4);c.height=Math.ceil(F);
  x.font=`800 ${F}px Unbounded, Gabarito, sans-serif`;x.fillStyle=col;x.textBaseline='alphabetic';x.fillText('tack',0,(F-(A+D))/2+A);
  x.globalCompositeOperation='destination-out';x.beginPath();x.arc(.235*F,.4*F,Math.max(.048*F,1.8),0,7);x.fill();return c}
function drawPin(x,cx,cy,r,col){x.fillStyle=col;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.fillStyle='rgba(6,6,8,.28)';x.beginPath();x.arc(cx-r*.35,cy-r*.32,r*.28,0,7);x.fill();x.fillStyle=col;rrect(x,cx-r*.17,cy+r*.75,r*.35,r*1.5,r*.17);x.fill()}
async function tackStoryCard(j){
  try{await Promise.all(['800 84px Gabarito','500 40px Figtree','600 34px Figtree','800 76px Unbounded'].map(f=>document.fonts.load(f)))}catch{}
  const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const bg=x.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#0a1206');bg.addColorStop(.55,'#070a14');bg.addColorStop(1,'#060608');x.fillStyle=bg;x.fillRect(0,0,W,H);
  const blob=(cx,cy,r,col)=>{const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,W,H)};
  blob(120,180,900,'rgba(198,242,78,.42)');blob(1040,520,900,'rgba(74,114,214,.55)');blob(420,1100,700,'rgba(159,219,116,.18)');
  x.fillStyle='rgba(255,255,255,.07)';for(let yy=22;yy<H;yy+=44)for(let xx=22;xx<W;xx+=44){x.beginPath();x.arc(xx,yy,2.4,0,7);x.fill()}
  const icon=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='icon-512.png?v=202610050117'});
  let y=190;if(icon){x.save();x.shadowColor='rgba(198,242,78,.5)';x.shadowBlur=70;rrect(x,W/2-110,y,220,220,60);x.clip();x.drawImage(icon,W/2-110,y,220,220);x.restore()}y+=300;
  x.fillStyle='#fff';x.textAlign='center';x.font='800 84px Gabarito';const hl=wrapLines(x,j.text,900,5);for(const l of hl){x.fillText(l,W/2,y);y+=96}y+=40;
  const paras=str(j.more,600).split(/\n+/).map(t=>t.trim()).filter(Boolean);
  if(paras.length){x.font='500 40px Figtree';x.textAlign='left';const lines=[];for(const p of paras){for(const l of wrapLines(x,p,780,4))lines.push(l);lines.push('')}lines.pop();
    const ch=Math.min(H-y-330,80+lines.length*56);const cx=90,cw=900;
    const cg=x.createLinearGradient(cx,y,cx+cw,y+ch);cg.addColorStop(0,'rgba(78,108,28,.75)');cg.addColorStop(.55,'rgba(40,66,120,.75)');cg.addColorStop(1,'rgba(43,70,156,.8)');
    rrect(x,cx,y,cw,ch,48);x.fillStyle=cg;x.fill();
    const bgd=x.createLinearGradient(cx,y,cx+cw,y+ch);bgd.addColorStop(0,'rgba(225,250,140,.8)');bgd.addColorStop(1,'rgba(74,114,214,.85)');x.lineWidth=3;x.strokeStyle=bgd;rrect(x,cx+1.5,y+1.5,cw-3,ch-3,47);x.stroke();
    const hi=x.createLinearGradient(0,y,0,y+ch*.45);hi.addColorStop(0,'rgba(255,255,255,.12)');hi.addColorStop(1,'rgba(255,255,255,0)');rrect(x,cx,y,cw,ch,48);x.fillStyle=hi;x.fill();
    x.fillStyle='#EEF3FF';let ly=y+70;for(const l of lines){if(ly>y+ch-20)break;if(l)x.fillText(l,cx+56,ly);ly+=l?56:28}y+=ch}
  const wm=wordmark(76);x.drawImage(wm,W/2-wm.width/2,H-250);x.textAlign='center';x.fillStyle='rgba(230,240,255,.8)';x.font='600 34px Figtree';
  x.fillText('Join your campus board',W/2,H-110);x.fillStyle='rgba(230,240,255,.5)';x.font='500 30px Figtree';x.fillText(SITE.replace(/^https?:\/\//,'').replace(/\/$/,''),W/2,H-62);
  return await new Promise(r=>c.toBlob(r,'image/png'))}
async function noteCard(j){if(isOrg(j.owner))return tackStoryCard(j);
  try{await Promise.all(['800 180px Gabarito','800 76px Unbounded','700 60px Figtree','600 40px Figtree'].map(f=>document.fonts.load(f)))}catch{}
  const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),gn=gradNote(j),nc=noteOf(j),left=j.deadline-Date.now();
  x.fillStyle='#060608';x.fillRect(0,0,W,H);
  const ph=j.pics?(S.pics['j:'+j.key]||[])[0]:'';
  if(ph){const im=new Image();im.src=ph;try{await im.decode()}catch{}const sc=Math.max(W/im.width,H/im.height)*1.25;x.filter='blur(70px) saturate(1.3) brightness(.62)';x.drawImage(im,(W-im.width*sc)/2,(H-im.height*sc)/2,im.width*sc,im.height*sc);x.filter='none';x.fillStyle='rgba(6,6,8,.35)';x.fillRect(0,0,W,H)}
  else{for(const[cx,cy,r,a,bc]of[[180,1560,1100,'70',gn?'#0A5CF5':nc],[980,260,820,'40',gn?'#46B2FD':nc],[560,980,700,'22',nc]]){const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,bc+a);g.addColorStop(1,bc+'00');x.fillStyle=g;x.fillRect(0,0,W,H)}}
  x.fillStyle='rgba(244,241,250,.06)';for(let gy=40;gy<H;gy+=44)for(let gx=40;gx<W;gx+=44){x.beginPath();x.arc(gx,gy,2.2,0,7);x.fill()}
  {const wm=wordmark(76);x.drawImage(wm,96,154-wm.height/2);x.textBaseline='middle'}
  const camp=campus();x.font='700 34px Figtree';const cw=x.measureText(camp).width+56;x.fillStyle='rgba(244,241,250,.1)';rrect(x,W-80-cw,124,cw,64,32);x.fill();x.fillStyle='#DFDAEC';x.fillText(camp,W-80-cw+28,157);
  x.font='700 60px Figtree';const lines=wrapLines(x,j.text,760,7);
  const meta=[j.where,left<36e5?'':j.when].filter(Boolean).join(' · '),urgent=left>0&&left<36e5;
  const ch=110+170+(urgent?90:30)+lines.length*78+(meta?90:0)+80,cy=(H-ch)/2-30;
  x.save();x.translate(W/2,cy+ch/2);x.rotate(-.022);x.translate(-W/2,-(cy+ch/2));
  x.shadowColor='rgba(0,0,0,.6)';x.shadowBlur=80;x.shadowOffsetY=40;x.fillStyle='rgba(25,22,36,.94)';rrect(x,100,cy,880,ch,56);x.fill();x.shadowColor='transparent';
  x.strokeStyle='rgba(244,241,250,.1)';x.lineWidth=2;x.stroke();
  const gl=x.createRadialGradient(980,cy,0,980,cy,700);gl.addColorStop(0,nc+'38');gl.addColorStop(1,nc+'00');x.fillStyle=gl;rrect(x,100,cy,880,ch,56);x.fill();
  const ag=(x0,x1)=>{const g=x.createLinearGradient(x0,0,x1,0);g.addColorStop(0,'#0A5CF5');g.addColorStop(.3,'#1774F7');g.addColorStop(.68,'#2B93FA');g.addColorStop(1,'#46B2FD');return g};x.shadowColor=gn?'#46B2FD':nc;x.shadowBlur=30;x.fillStyle=gn?ag(W/2-20,W/2+20):nc;x.beginPath();x.arc(W/2,cy,20,0,7);x.fill();x.shadowColor='transparent';
  let y=cy+110;x.textBaseline='alphabetic';x.font='800 170px Gabarito';x.fillStyle='#F4F1FA';x.fillText('₹'+fmt(j.price),160,y+120);y+=170;
  if(urgent){y+=20;const t=Math.max(1,Math.round(left/6e4))+' min left';x.font='700 34px Figtree';const tw=x.measureText(t).width+44;x.fillStyle='rgba(255,91,110,.2)';rrect(x,160,y,tw,58,29);x.fill();x.fillStyle='#FF8C9B';x.fillText(t,182,y+41);y+=70}else y+=30;
  x.fillStyle='#F4F1FA';x.font='700 60px Figtree';for(const l of lines){y+=78;x.fillText(l,160,y-14)}
  if(meta){y+=70;x.fillStyle='#9C96AE';x.font='600 40px Figtree';x.fillText(meta,160,y)}
  x.restore();
  x.textAlign='center';x.fillStyle='#F4F1FA';x.font='800 64px Gabarito';x.fillText('Bid on it on tack',W/2,H-250);
  x.fillStyle='#9C96AE';x.font='600 36px Figtree';x.fillText(SITE.replace(/^https?:\/\//,'').replace(/\/$/,''),W/2,H-180);
  x.fillStyle='#6F6987';x.font='600 30px Figtree';x.fillText('The job board for '+campus()+' students',W/2,H-124);
  return new Promise(r=>c.toBlob(r,'image/png'))}
function openShare(k){const j=derive().jobByKey[k];if(!j)return;S.sheet={type:'share',key:k};render();
  if(S.shareImg?.key===k)return;S.shareImg=null;const go2=()=>noteCard(j).then(b=>{if(!b)return;S.shareImg={key:k,blob:b,url:URL.createObjectURL(b)};if(S.sheet?.type==='share')render()});
  if(j.pics&&picsOf('j:'+k)===null)setTimeout(go2,700);else go2()}
function saveImg(){if(!S.shareImg)return;const a=document.createElement('a');a.href=S.shareImg.url;a.download='tack-job.png';document.body.appendChild(a);a.click();a.remove()}
function revBy(rid,D){const pk=Object.values(S.picks||{}).find(p=>p&&p.review===rid);return pk&&D.members.includes(pk.owner)?pk.owner:null}
function starsHTML(v,size,anim){const st=ic('star',size,2,'currentColor','currentColor');return`<span class="revstars${anim?' anim':''}" aria-label="${v?v.toFixed(1)+' out of 5':'No stars'}">${[1,2,3,4,5].map(n=>{const c=v>=n-.25?'on':v>=n-.75?'half':'';return`<span class="rs ${c}" style="--i:${n}">${c==='half'?`<span class="hf">${st}</span>`:''}${st}</span>`}).join('')}</span>`}
function viewReviews(D){const l=reviewsOf(S.me.id);
  return`<div class="pad">${back('me')}<div class="stack narrow" style="margin-top:6px;gap:14px"><div class="stack gap8"><h1 class="pageh">Your reviews</h1><p class="note" style="text-align:left;margin:0">From posters you did jobs for. Everyone else sees them without names.</p></div>
    ${!l?'<p class="note" style="text-align:left">Loading\u2026</p>':!l.length?'<div class="empty" style="margin:8px 0"><b>No reviews yet</b><p>When a poster reviews your work, it shows up here.</p></div>'
      :l.map(r=>{const by=revBy(r.id,D);return`<button class="box revcard" data-review="${esc(r.id)}"><span class="revtop">${by?ring(by,30):''}<span class="revwho">${by?`<b>${esc(firstName(by))}</b>`:'A poster'}<span>${new Date(r.at).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</span></span>${r.stars?starsHTML(r.stars,15):''}</span><p class="revtext">${esc(r.text)}</p>${picStrip('r:'+r.id,r.pics,'flush')}</button>`}).join('')}
  </div></div><div style="height:24px"></div>`}
function viewReview(D){const l=reviewsOf(S.me.id),r=l&&l.find(x=>x.id===S.openRev),by=r&&revBy(r.id,D);
  return`<div class="pad">${back('reviews')}<div class="stack narrow" style="margin-top:6px">
    ${!l?'<p class="note">Loading\u2026</p>':!r?'<div class="empty" style="margin:8px 0"><b>This review was removed</b><p>It no longer shows on your profile.</p></div>'
      :`<div class="revreveal">${by?ring(by,64):''}<h1 class="pageh" style="text-align:center">${by?`<b>${esc(firstName(by))}</b> reviewed you`:'Your review'}</h1>
        ${starsHTML(r.stars,34,true)}${r.stars?`<b class="revnum">${r.stars.toFixed(1)}</b>`:''}
        <p class="revwords">\u201c${esc(r.text)}\u201d</p>${picStrip('r:'+r.id,r.pics,'flush')}
        <p class="note">Shows on your profile without their name.</p></div>`}
  </div></div><div style="height:24px"></div>`}
function viewSaved(D){const keys=Array.isArray(S.priv.saved)?S.priv.saved:[],list=keys.map(k=>D.jobByKey[k]).filter(j=>j&&j.status!=='removed'),gone=keys.length-list.length;
  return`<div class="pad narrow"><h1 class="pageh">Saved jobs</h1>${list.length?'':`<div class="empty" style="margin:8px 0"><b>Nothing saved yet</b><p>Hold a note on the board, or tap the bookmark on a job, to keep it here.</p><button class="btn2" style="width:auto;padding:10px 20px;margin-top:6px" data-go="board">Browse the board</button></div>`}</div>
  ${list.length?`<div class="wallzone">${wallHTML(list,D)}</div>`:''}${gone?`<p class="note" style="padding:0 16px 24px">${gone} saved ${gone===1?'job is':'jobs are'} no longer on the board.</p>`:''}`}
const NOTES=['#A18CFF','#4FE3E0','#FF7AD1','#FFC53D','#FF9F45','#6CB6FF'];
const COLOR_RE=/^#[0-9a-fA-F]{6}$/,DEFAULT_NOTE='#3CC9FF';
function hueHex(h){h=((num(h)%360)+360)%360;const s=.85,l=.6,k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));
  return'#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('').toUpperCase()}
function hexHue(x){const r=parseInt(x.slice(1,3),16)/255,g=parseInt(x.slice(3,5),16)/255,b=parseInt(x.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
  if(!d)return 199;const h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return Math.round((h*60+360)%360)}
const gradNote=j=>false;
const gcls=j=>gradNote(j)?' gnote':'',gvars=j=>gradNote(j)?';--nc1:var(--g1);--nc2:var(--g2)':'';
function noteOf(j){if(!j)return DEFAULT_NOTE;if(COLOR_RE.test(j.color||''))return j.color;if(!j.key)return DEFAULT_NOTE;let h=2166136261;for(let i=0;i<j.key.length;i++){h^=j.key.charCodeAt(i);h=Math.imul(h,16777619)}return hueHex((h>>>0)%360)}
function tile(j,D,i=0,o={}){
  const c=noteOf(j),n=bidsFor(D,j.key).length,left=j.deadline-Date.now(),soon=jobState(j)==='open'&&left<36e5;
  const ph=j.pics?(picsOf('j:'+j.key)||[])[0]:'',d=-((Date.now()/1000+i*2.3)%32).toFixed(2);
  const tk=isOrg(j.owner);
  const t=`<button class="tile ntile${gcls(j)}${tk?' tacknote':''} r${i%3} ${S.fresh===j.key?'fresh':''}" ${o.remote?`data-sheet="pnote" data-about="${esc(j.key)}"`:`data-job="${esc(j.key)}"`} style="--nc:${c};--i:${i};--d:${d}s${gvars(j)}">
    <span class="tbg ${ph?'ph':''}" aria-hidden="true">${ph?`<img src="${ph}" alt="">`:''}</span>
    <span class="pin"></span>${S.me?.isOwner&&held(j.owner)?'<span class="heldtag">Held</span>':j.pics&&!o.own?`<span class="tpics">${ic('camera',12,2.2)} ${j.pics} ${j.pics===1?'photo':'photos'}</span>`:''}
    ${tk?'':`<span class="price">₹${fmt(j.price)}</span>`}
    ${soon?`<span class="flag">${Math.max(1,Math.round(left/6e4))} min left</span>`:''}${o.tag?`<span class="flag ptag${o.on?' on':''}">${esc(o.tag)}</span>`:''}${FOLLOW_ON&&j.friendsOnly?`<span class="flag ptag">${ic('users',11,2.4)} Friends</span>`:''}${j.hidden?`<span class="flag ptag">${ic('eyeoff',11,2.4)} Hidden</span>`:''}${nearMe(j)?nearTag():''}
    <p>${esc(j.text)}</p>
    ${j.where||j.when?`<span class="where">${ic('place',12,2.2)}<span>${esc([j.where,soon?'':j.when].filter(Boolean).join(' · '))}</span></span>`:''}
    <span class="by">${face(j.owner,22)}<span class="nm">${esc(firstName(j.owner))}</span><span class="n">${j.owner===S.me.id?`${n} ${n===1?'bid':'bids'}`:since(j.at)}</span></span>
  </button>`;
  return o.own?`<div class="pwrap${j.hidden?' hid':''}">${t}<button class="pgdots" data-sheet="pnmenu" data-about="${esc(j.key)}" aria-label="Options for this note">${ic('dots',16,2.8)}</button></div>`:t;
}
const wideMQ=matchMedia('(min-width:900px)');
function wallHTML(list,D){const n=wideMQ.matches?3:2,cols=Array.from({length:n},()=>[]);
  list.forEach((j,i)=>cols[i%n].push(tile(j,D,i)));
  return`<div class="wall">${cols.map(c=>`<div class="wcol">${c.join('')}</div>`).join('')}</div>`}
wideMQ.addEventListener?.('change',()=>{if(S.phase==='app')render()});
function viewBoard(D){
  const drop=!S.boardDropped&&!S.intro.on&&!S.momentOn&&!S.joining&&S.priv.introSeen&&!reduceMotion.matches;if(drop){S.boardDropped=true;S.dropping=true;setTimeout(()=>{S.dropping=false},2200)}
  const all=boardJobs(D),list=findJobs(all),filtered=!!(S.find.q.trim()||S.near),online=onlinePeople(D);
  return`<div class="boardpage"><header class="top">
    <div><div class="mark">tack</div><div class="sub"><span class="dot"></span><span>${S.me.isOwner?`<button class="campbtn" data-sheet="campus">${esc(campus())}${ic('chev',12,2.4)}</button>`:esc(campus())} · ${all.length} pinned</span></div></div>
    <button data-go="me" aria-label="Your profile">${ring(S.me.id,48)}</button>
  </header>
  ${online.length?`<section class="stripwrap" aria-label="Online"><p class="label">Online</p>
    <div class="strip">${online.map(u=>`<button class="person" data-person="${esc(u)}" data-hold="${esc(u)}" aria-label="${esc(firstName(u))} is online">${ring(u,50)}<span>${esc(firstName(u))}</span></button>`).join('')}</div></section>`:''}
  ${comChips()}
  ${stepsCard(D)}
  <div class="dhead"><h1 class="h1">The board</h1><span class="muted">${all.length} pinned at ${S.me.isOwner?`<button class="campbtn" data-sheet="campus">${esc(campus())}${ic('chev',12,2.4)}</button>`:esc(campus())}</span></div>
  <label class="search" for="q">${ic('search',17)}<input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Search jobs: print, shawarma, today, library" value="${esc(S.find.q)}" data-bind="find.q" aria-label="Search jobs">${S.find.q?`<button class="sclear" data-act="clearSearch" aria-label="Clear search">${ic('x',14,2.4)}</button>`:''}</label>
  <div class="pills" role="group" aria-label="Filter and sort jobs"><button class="pill ${S.near?'on':''}" data-act="toggleNear" aria-pressed="${S.near}">${ic('place',13,2.2)} Near you</button><span class="pillsep" aria-hidden="true"></span>${[['high','Top pay'],['newest','Newest'],['closing','Closing soon']].map(([k,l])=>`<button class="pill ${S.sort===k?'on':''}" data-sort="${k}" aria-pressed="${S.sort===k}">${l}</button>`).join('')}</div>
  <div class="wallzone ${S.dropping?'dropin':''}">${filtered&&!list.length&&all.length?`<div class="empty"><b>${S.near&&!S.find.q.trim()?'Nothing near you right now':'No jobs match that'}</b><p>${S.near?'Only jobs pinned with a location can show as near you.':'Try another word, like the place, the time or what you need.'}</p><button class="btn2" data-act="clearFind">Show all jobs</button></div>`:list.length?wallHTML(list,D)+`<div class="boardend"><span class="endpin" aria-hidden="true"></span>${filtered?`<p>${list.length} of ${all.length} jobs shown.</p>`:''}<button class="btn2" data-go="post">Pin a job</button></div>`
    :`<div class="empty"><b>Nothing pinned yet</b><p>Pin the first job: a xerox run, a lift down four floors, an hour of help before a submission.</p><button class="cta" data-go="post">Pin a job</button></div>`}</div></div>`;
}
function viewTackNote(j){if(S.shareImg?.key!==j.key&&!S.shareBusy){S.shareBusy=true;noteCard(j).then(b=>{S.shareBusy=false;if(b)S.shareImg={key:j.key,blob:b,url:URL.createObjectURL(b)}}).catch(()=>{S.shareBusy=false})}const mine=j.owner===S.me.id,st=jobState(j),jp=j.pics?picsOf('j:'+j.key):null;
  const paras=str(j.more,600).split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const enter=S.tkSeen!==j.key;S.tkSeen=j.key;
  return`<div class="tackpage${enter?' enter':''}">
   <div class="tkbg" style="--t:-${(Date.now()/1000%60).toFixed(2)}s" aria-hidden="true"><i class="tb1"></i><i class="tb2"></i><i class="tb3"></i></div>
   <div class="tktop">${back('board')}<div class="jtools">${mine&&st==='open'?`<button class="jtool" data-act="editJob" data-key="${esc(j.key)}" aria-label="Edit">${ic('edit',18)}</button>`:''}<button class="jtool" data-act="openShare" data-key="${esc(j.key)}" aria-label="Share">${ic('share',18)}</button></div></div>
   <div class="tkhero">
     <span class="tkicon"></span>
     <h1 class="tkh">${esc(j.text)}</h1>
   </div>
   ${jp&&jp.length?`<div class="tkpics">${jp.map((src,i)=>`<button class="tkpic" data-pic="${esc('j:'+j.key)}" data-i="${i}" style="--k:${i}"><img src="${src}" alt="Photo ${i+1}"></button>`).join('')}</div>`:''}
   ${paras.length?`<div class="tkcard">${paras.map((p,i)=>`<p style="--k:${i}">${esc(p)}</p>`).join('')}</div>`:''}
   <div class="tkshare"><span class="tklabel">Share</span><div class="slogos">${slogo('ig','Instagram','data-act="tackShare" data-to="ig"')}${slogo('wa','WhatsApp','data-act="tackShare" data-to="wa"')}${slogo('share','More','data-act="tackShare" data-to="sys"')}${slogo('link','Copy link','data-act="tackShare" data-to="copy"')}</div></div>
  </div>`}
function viewJob(D){
  const j0=D.jobByKey[S.openJob],j=j0&&hiddenFor(j0)&&j0.accepted!==S.me.id&&!myBidOn(j0.key)?null:j0;
  if(!j)return`<div class="pad">${back('board')}<div class="empty" style="margin:18px 0"><b>This job is gone</b><p>The poster closed it or it was taken off the board.</p></div></div>`;
  const me=S.me.id,mine=j.owner===me,st=jobState(j),bids=bidsFor(D,j.key).sort((a,b)=>a.amt-b.amt||a.at-b.at);
  const myBid=myBidOn(j.key);
  if(S.bid.key!==j.key)S.bid={key:j.key,amt:String(myBid?num(myBid.amt):j.price),say:myBid?myBid.say:'',pics:myBid&&num(myBid.pics)?null:[]};
  if(S.bid.pics===null){const l=picsOf('b:'+j.key+'~'+me);if(l)S.bid.pics=[...l]}
  const stTag={expired:'<span class="tag warn">Closed · time ran out</span>',closed:'<span class="tag">Closed</span>',removed:'<span class="tag warn">Removed</span>',
    assigned:repicking(j)?(mine?'<span class="tag warn">Choose someone else</span>':droppedMe(j)?'<span class="tag">Taken</span>':'<span class="tag">Choosing again</span>'):mine||j.accepted===me?`<span class="tag ok">Picked ${esc(shortName(j.accepted))}</span>`:'<span class="tag">Taken</span>',done:payOf(j)?.ok?'<span class="tag ok">Done · Paid ✓</span>':'<span class="tag ok">Done</span>'}[st]||'';
  let foot='';
  if(mine){
    if(st==='open')foot='';
    else if(st==='assigned'&&!j.accepted){const left=bids.filter(b=>!j.dropped.includes(b.by)).length;
      foot=`<div class="foot"><div class="banner warnbanner">${left?'Pick someone else from the bids':'Nobody else has bid yet'}</div>
      <p class="note">${left?'The job stays off the board while you choose.':'Put it back on the board so others can bid, or close it.'}</p>
      ${left?'':'<button class="cta" data-act="reopenJob">Put it back on the board</button>'}<button class="btn2" data-sheet="close">Close this job</button></div>`}
    else if(st==='assigned')foot=`<div class="foot"><div class="banner">${ic('tick',13,3.4,'var(--accent)')} You picked ${esc(firstName(j.accepted))} for ₹${fmt(j.agreed)}</div>
      <button class="cta" data-sheet="done">Mark as done</button>${posterPay(j)}<button class="btn2" data-thread-with="${esc(j.accepted)}">Message ${esc(firstName(j.accepted))}</button>
</div>`;
    else if(st==='done'){const pay=PAY_ON?payOf(j):null,dn=esc(firstName(j.accepted));
      foot=`<div class="foot">${pay?.ok?`<div class="banner">${ic('tick',13,3.4,'var(--accent)')} ${dn} confirmed they got ₹${fmt(j.agreed)}</div>`
        :pay?`<div class="banner warnbanner">${dn} hasn’t got your payment yet</div>`:''}${posterPay(j)}
        ${j.pick?.ratedDoer?`<p class="note">You rated ${dn}${(S.priv.gave||{})[j.key]?' ★'+num(S.priv.gave[j.key]).toFixed(1):''}.</p>`:`<button class="cta" data-sheet="done">Rate ${dn}</button>`}
        ${j.pick?.review?`<p class="note">Your review is on ${dn}'s profile, without your name.</p>`
          :j.pick?.ratedDoer?`<button class="btn2" data-sheet="review">Write a public review of ${dn}</button>`:''}
        ${j.pick?.noteToPoster?`<div class="box stack" style="gap:4px"><span class="formlabel">${dn}'s private note to you</span><span class="t2" style="color:var(--fg)">${esc(str(j.pick.noteToPoster,200))}</span></div>`:''}</div>`}
    else if(st==='expired')foot=`<div class="foot"><button class="btn2" data-act="repost">Pin it again</button></div>`;
  }else{
    if(st==='open'&&myBid&&S.bidEdit!==j.key)foot=`<div class="foot">
      <div class="jcard stack bidcard">
        <div class="bidtop"><span class="formlabel">Your bid</span><span class="muted">${ic('shield',12,2.2)} only ${esc(firstName(j.owner))} sees this</span></div>
        <span class="bidamt">₹${fmt(myBid.amt)}</span>
        ${myBid.say?`<p class="jmore bidpitch">${esc(myBid.say)}</p>`:'<p class="jmore muted">No pitch added.</p>'}
        ${picStrip('b:'+j.key+'~'+me,myBid.pics,'sub')}
        <span class="bidwhen">Placed ${since(myBid.at)}</span>
        <div class="bidbtns"><button class="btn2" data-act="editBid">${ic('edit',15)} Edit bid</button>${threadOpen(jobThreadKey(j.key,me))?`<button class="btn2" data-thread-job>${ic('chat',15)} Message ${esc(firstName(j.owner))}</button>`:''}</div>
      </div>
      </div>`;
    else if(st==='open')foot=`<div class="foot">
      <h2 class="h2">${myBid?'Edit your bid':'Place your bid'}</h2>
      <div style="display:flex;gap:9px"><label class="field" for="bidAmt"><span class="fl">Your bid ₹</span>
        <input id="bidAmt" type="text" inputmode="numeric" maxlength="6" value="${esc(S.bid.amt)}" data-bind="bid.amt" aria-label="Your bid in rupees"
         style="font-family:var(--display);font-size:var(--t-19);font-weight:700;letter-spacing:-.035em;font-variant-numeric:tabular-nums"></label>
        ${threadOpen(jobThreadKey(j.key,me))?`<button class="iconbtn" style="width:52px;height:auto;border-radius:999px;background:var(--surface)" data-thread-job aria-label="Message ${esc(firstName(j.owner))}">${ic('chat',20)}</button>`:''}</div>
      <div class="pitchbox"><label class="pitchlabel" for="bidSay">Pitch yourself <span class="labelhint">· only ${esc(firstName(j.owner))} sees this</span></label>
        <textarea id="bidSay" rows="5" maxlength="${SAY_MAX}" placeholder="Why you? Past work, what you'll bring, when you can do it." data-bind="bid.say">${esc(S.bid.say)}</textarea>
        <div class="pitchfoot">${S.bid.pics?picEdit('bid',S.bid.pics):'<div class="pics"><span class="pic wait" aria-hidden="true"></span></div>'}<span class="wc ${sayOver(S.bid.say)?'over':''}" id="bidWc">${sayCount(S.bid.say)}</span></div></div>
      ${S.err.bid?`<p class="err">${esc(S.err.bid)}</p>`:''}
      <button class="cta" data-act="bid" data-need="bid">${myBid?'Update bid':'Place bid'}</button>
      ${myBid?'<button class="linkbtn" data-act="cancelBidEdit">Cancel</button>':''}
      </div>`;
    else if(j.accepted===me&&st==='done'&&!PAY_ON){const pn=esc(firstName(j.owner));
      foot=`<div class="foot"><div class="banner">${ic('tick',13,3.4,'var(--accent)')} ${pn} marked this job done</div>
          ${j.pick?.ratedPoster?`<p class="note">You rated ${pn}${(S.priv.gave||{})[j.key]?' ★'+num(S.priv.gave[j.key]).toFixed(1):''}.</p>`:`<button class="cta" data-sheet="ratePoster">Rate ${pn}</button>`}
          ${j.pick?.noteToDoer?`<div class="box stack" style="gap:4px"><span class="formlabel">${pn}'s private note to you</span><span class="t2" style="color:var(--fg)">${esc(str(j.pick.noteToDoer,200))}</span></div>`:''}
          <p class="note">Sort out payment with ${pn} directly, in cash or UPI. tack doesn\u2019t handle money.</p></div>`}
    else if(j.accepted===me&&st==='done'){const pay=payOf(j),pn=esc(firstName(j.owner)),late=!pay?.ok&&Date.now()-(j.doneAt||pay?.at||Date.now())>PAY_GRACE;
      foot=pay?.ok?`<div class="foot"><div class="banner">${ic('tick',13,3.4,'var(--accent)')} Paid · you confirmed ₹${fmt(j.agreed)} ${since(pay.at)}</div>
          ${j.pick?.ratedPoster?`<p class="note">You rated ${pn}${(S.priv.gave||{})[j.key]?' ★'+num(S.priv.gave[j.key]).toFixed(1):''}.</p>`:`<button class="cta" data-sheet="ratePoster">Rate ${pn}</button>`}
          ${j.pick?.noteToDoer?`<div class="box stack" style="gap:4px"><span class="formlabel">${pn}'s private note to you</span><span class="t2" style="color:var(--fg)">${esc(str(j.pick.noteToDoer,200))}</span></div>`:''}</div>`
        :`<div class="foot"><div class="stack gap8 box" style="border:1px solid rgba(170,226,84,.3)">
          <span class="t1" style="font-size:var(--t-16)">Did ${pn} pay you ₹${fmt(j.agreed)}?</span>
          <span class="t2">${sentOf(j)?`${pn} says they sent it ${since(sentOf(j).at)}${sentOf(j).ref==='cash'?' in cash':sentOf(j).ref?' (UPI ref '+esc(sentOf(j).ref)+')':''}. `:''}${pay?'You said not yet. Tap Yes once the money reaches you.':`${pn} marked this job done. Confirm once the money reaches you.`}</span></div>${doerPay(j)}
          <button class="cta" data-act="paid" data-val="yes">Yes, I got it</button>
          ${pay?'':'<button class="btn2" data-act="paid" data-val="no">Not yet</button>'}
          ${late?`<button class="linkbtn" data-sheet="report" data-about="${esc(j.owner)}" data-prewhy="No-show or didn’t pay">Still not paid? Report it</button>`:''}
          <p class="note">tack never holds your money. This only records what you both tell us.</p></div>`}
    else if(j.accepted===me)foot=`<div class="foot"><div class="banner">${ic('tick',13,3.4,'var(--accent)')} ${esc(firstName(j.owner))} picked you for ₹${fmt(j.agreed)}</div>
      <button class="cta" data-thread-job>Message ${esc(firstName(j.owner))}</button>${doerPay(j)}</div>`;
    else foot=`<div class="foot"><p class="note">${st==='assigned'||st==='done'?'This job went to someone else.':'This job is closed.'}</p></div>`;
  }
  const menu=kebab('job',[{i:'share',t:'Share',at:`data-act="openShare" data-key="${esc(j.key)}"`},
    mine?null:{i:'bookmark',t:isSaved(j.key)?'Remove from saved':'Save for later',at:`data-act="toggleSave" data-key="${esc(j.key)}"`},
    mine&&st==='open'?{i:'edit',t:'Edit job',at:`data-act="editJob" data-key="${esc(j.key)}"`}:null,
    mine&&st==='assigned'&&j.accepted&&!repicking(j)&&!(sentOf(j)||payOf(j))?{i:'users',t:'Pick someone else',at:'data-sheet="repick"'}:null,
    !mine&&st==='open'&&myBid?{i:'x',t:'Withdraw my bid',at:'data-act="withdraw"'}:null,
    PAY_ON&&j.accepted===me&&st==='done'&&payOf(j)?.ok?{i:'x',t:'I marked paid by mistake',at:'data-act="paid" data-val="no"'}:null,
    mine&&st==='done'&&j.pick?.review?{i:'trash',t:'Delete my review',at:`data-sheet="delReview" data-rid="${esc(j.pick.review)}" data-about="${esc(j.accepted)}"`}:null,
    {sep:1},
    mine&&st==='open'?{i:'x',t:'Close this job',at:'data-sheet="close"',danger:true}:null,
    mine?null:{i:'flag',t:'Report this job',at:`data-sheet="report" data-about="${esc(j.owner)}"`,danger:true},
    !mine&&S.me.isOwner&&st!=='removed'?{i:'trash',t:'Take off the board',at:'data-sheet="remove"',danger:true}:null],'Job options','onhero');
  const jp=j.pics?picsOf('j:'+j.key):null,d=-((Date.now()/1000)%32).toFixed(2);
  const hasPh=!!(jp&&jp.length),online=/^online$/i.test(j.where||'');
  const cover=hasPh?`<button class="jcover" data-pic="${esc('j:'+j.key)}" data-i="0" aria-label="See the ${jp.length} ${jp.length===1?'photo':'photos'}"><span class="tbg ph" style="--d:${d}s"><img src="${jp[0]}" alt=""></span></button>`
    :`<div class="jcover"><span class="tbg" style="--d:${d}s" aria-hidden="true"></span></div>`;
  const hint=hasPh?`${ic('camera',12,2.2)} Tap to see ${jp.length} ${jp.length===1?'photo':'photos'}`:j.pics?'Loading photos…':'No pictures';
  const bidsSec=`<section class="jbids">
   <div class="stack">
    ${mine?`<div style="display:flex;align-items:baseline;gap:8px"><h2 class="h2">${bids.length} ${bids.length===1?'bid':'bids'}</h2></div>`
      :`<div style="display:flex;align-items:baseline;gap:8px"><h2 class="h2">Your bid</h2></div>`}
    ${bids.length?bids.map(b=>`<div class="row">
      <button class="rowmain" data-person="${esc(b.by)}">${ring(b.by,42)}<span class="rowtext">
        <span class="t1">${esc(shortName(b.by))}${mine&&b.near?' '+nearTag():''} <span class="muted">· ${esc(metaOf(b.by))}${esc(rateLine(b.by,D))}</span></span>
        ${b.say?`<span class="t2 bidsay">${esc(b.say)}</span>`:''}</span></button>
      <span class="bidend"><span class="amt">₹${fmt(b.amt)}</span>
      ${mine&&(st==='open'||repicking(j))&&!j.dropped.includes(b.by)?`<button class="pick" data-pick="${esc(b.by)}" aria-label="Pick ${esc(firstName(b.by))} for ₹${fmt(b.amt)}">Pick</button>`:''}
      ${mine&&(st==='open'||repicking(j))&&!j.dropped.includes(b.by)?`<button class="iconbtn" data-thread-with="${esc(b.by)}" aria-label="Message ${esc(firstName(b.by))}">${ic('chat',17)}</button>`:''}
      ${mine&&j.dropped.includes(b.by)?'<span class="tag">Didn’t do it</span>':''}
      ${j.accepted===b.by?'<span class="tag ok">Picked</span>':''}</span>
    </div>${picStrip('b:'+j.key+'~'+b.by,b.pics,'sub')}`).join(''):''}
   </div>
  </section>`;
  if(isOrg(j.owner))return viewTackNote(j);
  return`<div class="pad jobpage${gcls(j)}${isOrg(j.owner)?' tackjob':''}" style="--nc:${noteOf(j)}${gvars(j)}">
  ${menu}<div class="jhero">${cover}${back('board')}
    <div class="jhead"><h1 class="h1">${esc(j.text)}</h1></div></div>
  <div class="jpwrap">${hasPh?`<button class="jhint" data-pic="${esc('j:'+j.key)}" data-i="0">${hint}</button>`:`<span class="jhint">${hint}</span>`}<button class="jposter" data-person="${esc(j.owner)}"><span class="javwrap"><span class="ring${onlineNow(j.owner)?' live':''}" style="width:68px;height:68px">${face(j.owner,58)}</span>${online?'<span class="onl"><i></i>Online</span>':''}</span>
    <span class="pname">${esc(shortName(j.owner))}</span>
    <span class="jmeta">${mine?`posted ${since(j.at)}${j.editedAt?' · edited':''}`:`${esc(metaOf(j.owner)||campus())}${esc(posterLine(j.owner))} · posted ${since(j.at)}${j.editedAt?' · edited':''}${esc(payLine(j.owner))}`}</span></button></div>
  <div class="jcard stack">
    ${isOrg(j.owner)?'':`<span class="big" style="view-transition-name:jp">₹${fmt(j.price)}</span>`}
    <div class="chips">${[j.when,online?'':j.where].filter(Boolean).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}${nearMe(j)?nearTag():''}${FOLLOW_ON&&j.friendsOnly?'<span class="chip">Friends only</span>':''}${stTag}</div>
    ${j.more?`<p class="jmore">${esc(j.more)}</p>`:''}
  </div>
  ${mine?bidsSec+foot:foot+(st==='open'?'':bidsSec)}
  </div>`;
}
const NOTE_MAX=100,noteCount=t=>`${String(t||'').length} / ${NOTE_MAX}`;
const NOTE_WHITE='#FFFFFF';
function noteTone(){return{c:S.draft.white?NOTE_WHITE:hueHex(S.draft.hue),g:false}}
function syncNoteTone(){const hb=$('jhue');if(hb)hb.style.setProperty('--thumb',hueHex(S.draft.hue));const n=$('bignote');if(!n)return;const {c,g}=noteTone();n.style.setProperty('--nc',c);n.classList.toggle('gnote',g);
  if(g){n.style.setProperty('--nc1','var(--g1)');n.style.setProperty('--nc2','var(--g2)')}else{n.style.removeProperty('--nc1');n.style.removeProperty('--nc2')}
  const pr=$('bnPrice');if(pr)pr.classList.toggle('blank',!digits(S.draft.price))}
const noteHeld=()=>{const a=document.activeElement;return!!(a&&a.closest&&a.closest('#notewrap'))};
function postEnterOnce(){const e=!!S.postEnter;S.postEnter=false;return e}
function viewPost(){
  const d=S.draft,{c,g}=noteTone(),me=S.me.id,ph=(d.pics||[])[0]||'';
  const group=(t,k,list)=>`<div class="stack gap8"><span class="formlabel" id="g-${k}">${t}</span><div class="chips" role="group" aria-labelledby="g-${k}">${list.map(v=>`<button class="chip ${d[k]===v&&!(k==='where'&&d.whereText.trim())?'on':''}" data-set="${k}" data-val="${esc(v)}" aria-pressed="${d[k]===v&&!(k==='where'&&d.whereText.trim())}">${esc(v)}</button>`).join('')}</div></div>`;
  const cm=!!d.cid;
  return`<div class="pad postpage${cm?' cpost':''}">${cm?back('cboard'):d.editId?back('job'):back('board')}
   <h1 class="pageh" style="margin:6px 0 2px">${cm?'Add a note to '+esc(comName(d.cid)):d.editId?'Edit your job':'Pin a job'}</h1>
   <div class="notewrap${noteHeld()?' flat':''}" id="notewrap"><div class="bignote tile ntile${g?' gnote':''}${postEnterOnce()?' enter':''}" id="bignote" style="--nc:${c}${g?';--nc1:var(--g1);--nc2:var(--g2)':''};--d:0s">
     <span class="tbg ${ph?'ph':''}" aria-hidden="true">${ph?`<img src="${ph}" alt="">`:''}</span>
     <span class="pin" aria-hidden="true"></span>
     ${cm?'':`<label class="bnprice ${digits(d.price)?'':'blank'}" id="bnPrice" for="jp"><span>₹</span><input id="jp" type="text" inputmode="numeric" maxlength="5" placeholder="150" value="${esc(d.price)}" data-bind="draft.price" aria-label="You'll pay, in rupees"></label>`}
     <textarea id="jt" class="bntext" rows="3" maxlength="${NOTE_MAX}" placeholder="${cm?'What do you want to share?':'What do you need? Pick up my print-outs from Sai Xerox before 4.'}" data-bind="draft.text" aria-label="${cm?'Your note':'What do you need?'}">${esc(d.text)}</textarea>
     <div class="bnpics">${picEdit('draft',d.pics)}</div>
     <span class="bnfoot"><span class="by">${face(me,22)}<span class="nm">${esc(firstName(me))}</span></span><span class="wc ${d.text.length>=NOTE_MAX?'full':''}" id="jtWc">${noteCount(d.text)}</span></span>
   </div>
   ${ph?'':`<div class="huewrap"><input type="range" id="jhue" class="huebar" min="0" max="359" step="1" value="${num(d.hue)}" data-bind="draft.hue" aria-label="Note colour" title="Slide to pick the note colour" style="--thumb:${c}"><button type="button" class="hueclear${d.white?' on':''}" id="jwhite" data-act="noteWhite" aria-label="No colour, white text" aria-pressed="${!!d.white}">${ic('x',12,2)}</button></div>`}</div>

   <div class="stack postsec"><h2 class="h2">Tags</h2>
     ${group('By when','when',WHENS)}${group('Where','where',WHERES)}
     <input id="jw" class="inp" maxlength="40" placeholder="Or type a place: Seminar hall, B-wing 4th floor…" value="${esc(d.whereText)}" data-bind="draft.whereText" aria-label="Other place">
     ${cm||(!FOLLOW_ON&&!d.friendsOnly)?'':`<button class="locbtn" data-act="toggleFriendsOnly" aria-pressed="${!!d.friendsOnly}">${ic(d.friendsOnly?'tick':'users',16,2.4)}<span class="rowtext"><span class="t1">${d.friendsOnly?'Only your friends can see this':'Show only to friends'}</span><span class="t2">${d.friendsOnly?(friendIds().length?'Your friends on this board see it and can bid. Nobody else does.':'You don’t have friends on tack yet, so nobody else will see it until you do.'):'Keep this job off everyone else’s board.'}</span></span></button>`}
     ${cm?'':`<button class="locbtn" data-act="toggleJobLoc" aria-pressed="${!!d.useLoc}">${ic(d.useLoc?'tick':'place',16,2.4)}<span class="rowtext"><span class="t1">${d.useLoc?'Tagged with where you are now':'Tag this job with where you are'}</span><span class="t2">${d.useLoc?'Members nearby see a Near you tag. Turn off if the job is somewhere else.':'Helps people close by find it. Rounded to about 100 m, never shown on a map.'}</span></span></button>`}
   </div>
   <div class="stack postsec"><h2 class="h2">${cm?'Details':'Job description'}</h2>
     <div class="pitchbox"><label class="pitchlabel" for="jm">Details <span class="labelhint">· optional, shown on the job page</span></label>
       <textarea id="jm" rows="5" maxlength="600" placeholder="${cm?'Anything else people should know.':'Anything the person doing it should know: roll number, floor, what to bring, how you\'ll pay.'}" data-bind="draft.more">${esc(d.more)}</textarea>
       <div class="pitchfoot" style="justify-content:flex-end"><span class="wc">${d.more.length} / 600</span></div></div>
   </div>
   <div class="foot">${S.err.post?`<p class="err">${esc(S.err.post)}</p>`:''}<button class="cta" data-act="post" data-need="${cm?'cpost':'post'}">${d.editId?'Save changes':'Pin it to the board'}</button>
     </div>
  </div><div style="height:24px"></div>`;
}
function viewBids(D){
  const me=S.me.id;
  const myJobs=D.jobs.filter(j=>j.owner===me&&j.status!=='removed').sort((a,b)=>{const o=x=>({open:0,assigned:1}[jobState(x)]??2);return o(a)-o(b)||b.at-a.at});
  const myBids=Object.values(S.pitchMine).filter(p=>p&&num(p.amt)>0).map(p=>({k:p.job,b:{amt:num(p.amt),at:num(p.at)},j:D.jobByKey[p.job]})).filter(x=>x.j&&x.j.owner!==me).sort((a,b)=>num(b.b.at)-num(a.b.at));
  const jobLine=j=>{const st=jobState(j),n=bidsFor(D,j.key).length;
    return st==='open'?[`${n} ${n===1?'bid':'bids'} in`,'']:st==='assigned'?[`Picked ${shortName(j.accepted)} · ₹${fmt(j.agreed)}`,'ok']:st==='done'?(!PAY_ON?[j.pick?.ratedDoer?'Done':'Done · rate them','ok']:payOf(j)?.ok?[j.pick?.ratedDoer?'Done · Paid ✓':'Done · Paid ✓ · rate them','ok']:[`Done · ${payOf(j)?'they haven\u2019t got your payment':'waiting for them to confirm payment'}`,payOf(j)?'warn':'']):st==='expired'?['Time ran out','warn']:['Closed','']};
  const bidLine=({j})=>{const st=jobState(j);return j.accepted===me?(st==='done'?(!PAY_ON?[j.pick?.ratedPoster?'Done':'Done · rate them','ok']:payOf(j)?.ok?['Done · Paid ✓','ok']:['Done · confirm you got paid','warn']):[`Accepted · ₹${fmt(j.agreed)}`,'ok']):droppedMe(j)?[`${firstName(j.owner)} picked someone else`,'lost']:repicking(j)?[`Waiting for ${firstName(j.owner)} to pick again`,'']:lostBid(j)?['Someone else got picked · keep trying','lost']:st==='open'?[`Waiting for ${firstName(j.owner)} to pick`,'']:st==='expired'?['Time ran out','']:['Closed','']};
  const row=(j,[line,cls],amt,who)=>`<button class="item" data-job="${esc(j.key)}">${ring(who||j.owner,38)}<span class="itext"><span class="t1" style="font-weight:500;color:var(--fg)">${esc(j.text)}</span>
    <span style="font-size:var(--t-11);font-weight:600;color:${cls==='ok'?'var(--accent)':cls==='warn'?'var(--coral-ink)':cls==='lost'?'var(--amber-ink)':'var(--muted)'}">${esc(line)}</span></span><span class="amt" style="font-size:var(--t-16);color:var(--fg)">₹${fmt(amt)}</span></button>`;
  const oin=offerList(S.offersIn).filter(o=>D.members.includes(o.owner)&&!D.blocked.has(o.owner)&&o.status!=='declined').sort((a,b)=>num(b.at)-num(a.at));
  const oout=offerList(S.offersOut).filter(o=>o.status!=='accepted').sort((a,b)=>num(b.at)-num(a.at));
  const doing=D.jobs.filter(j=>j.accepted===me&&!myBidOn(j.key)&&j.status!=='removed').sort((a,b)=>b.at-a.at);
  const offerCard=o=>`<div class="box stack" style="gap:10px;border:1px solid rgba(170,226,84,.3)">
    <div style="display:flex;align-items:center;gap:10px">${ring(o.owner,38)}<span class="rowtext"><span class="t1">${esc(shortName(o.owner))} asked you</span><span class="t2">${esc([o.where,o.when].filter(Boolean).join(' · '))}</span></span><span class="amt" style="color:var(--accent)">₹${fmt(o.price)}</span></div>
    <span style="font-size:var(--t-14);line-height:1.4;color:var(--fg);overflow-wrap:anywhere">${esc(o.text)}</span>
    ${o.status==='pending'?`<div class="offeracts"><button class="ghostbtn" data-act="declineOffer" data-key="${esc(o.key)}">Not this time</button><button class="pick" data-act="acceptOffer" data-key="${esc(o.key)}">Accept</button></div>`
      :`<p class="okmsg">Accepted. ${esc(firstName(o.owner))} will message you here.</p>`}</div>`;
  return`<div class="pad narrow"><h1 class="pageh">Activity</h1>
   <div class="stack">
    ${oin.length?`<div class="sect"><h2 class="h2">Offers for you</h2></div><div class="stack gap8">${oin.map(offerCard).join('')}</div>`:''}
    ${oout.length?`<div class="sect"><h2 class="h2">Offers you sent</h2></div><div class="stack gap8">${oout.map(o=>`<div class="row">${ring(o.to,38)}<span class="rowtext"><span class="t1">${esc(shortName(o.to))} · ₹${fmt(o.price)}</span><span class="t2">${askStale(o)?'No answer':'Waiting for them to answer'} · ${esc(o.text)}</span></span>
      <button class="btn2" style="width:auto;padding:8px 12px;font-size:var(--t-12)" data-act="withdrawOffer" data-key="${esc(o.key)}">${askStale(o)?'Dismiss':'Withdraw'}</button></div>`).join('')}</div>`:''}
    ${(()=>{const pastJob=j=>{const st=jobState(j);return st==='closed'||st==='expired'||st==='removed'||(st==='done'&&(!PAY_ON||payOf(j)?.ok)&&j.pick?.ratedDoer)};
      const all=[...doing.map(j=>({j,amt:j.agreed||j.price,at:num(j.pick?.at)||j.at})),...myBids.map(x=>({j:x.j,amt:num(x.b.amt),at:x.b.at,x}))];
      const pastBid=({j})=>j.accepted===me?(jobState(j)==='done'&&(!PAY_ON||payOf(j)?.ok)&&j.pick?.ratedPoster):(jobState(j)!=='open'&&!(repicking(j)&&!droppedMe(j)))||!!j.accepted;
      const jobsNow=myJobs.filter(j=>!pastJob(j)),active=all.filter(y=>y.j.accepted===me&&!pastBid(y)),waiting=all.filter(y=>y.j.accepted!==me&&!pastBid(y));
      const notPicked=all.filter(y=>y.x&&lostBid(y.j)&&lostAt(y.j,y.at)>Date.now()-14*864e5).sort((a,b)=>lostAt(b.j,b.at)-lostAt(a.j,a.at));
      const hist=[...D.jobs.filter(j=>j.owner===me&&pastJob(j)).map(j=>({j,mine:true,amt:j.agreed||j.price,at:Math.max(j.doneAt||0,j.at)})),...all.filter(pastBid).map(y=>({...y,at:Math.max(y.j.doneAt||0,y.at||0,y.j.at)}))].sort((a,b)=>b.at-a.at);
      const tabs=[['all','All',0],['jobs','Your jobs',jobsNow.length],['bids','Your bids',active.length+waiting.length],['history','History',hist.length]];
      const grp=(t,l)=>l.length?`<section class="igroup"><h2 class="ihead">${t}</h2>${l.map(y=>row(y.j,bidLine(y.x||{j:y.j}),y.amt)).join('')}</section>`:'';
      const empty=t=>`<p class="note" style="text-align:left">${t}</p>`;
      return`<div class="pills" style="padding:4px 0 0" role="group" aria-label="Show">${tabs.map(([k,l,n])=>`<button class="pill ${S.actTab===k?'on':''}" data-acttab="${k}" aria-pressed="${S.actTab===k}">${l}${n?' · '+n:''}</button>`).join('')}</div>
      ${S.actTab==='all'?(()=>{const feed=[...D.notes.map(n=>({...n,kind:'n'})),...jobsNow.map(j=>({kind:'j',j,at:j.at})),...[...active,...waiting,...notPicked].map(y=>({kind:'b',y,at:y.at||y.j.at}))].sort((a,b)=>b.at-a.at);
        const np=([l,c])=>[String(l).replace(/\s*·\s*₹[\d,]+/g,'').replace(/₹[\d,]+\s*·\s*/g,''),c];
        const one=f=>f.kind==='j'?row(f.j,np(jobLine(f.j)),f.j.price,me):f.kind==='b'?row(f.y.j,np(bidLine(f.y.x||{j:f.y.j})),f.y.amt)
          :f.cinv||f.fb||f.mreq?`<div class="item notif ninv ${f.at>S.actSeenAt?'new':''}">${ring(f.who,38)}<span class="itext"><span class="ntext">${f.html}</span><span class="t2">${since(f.at)}</span>${actBtns(f)}</span>${f.at>S.actSeenAt?'<span class="udot" aria-label="New"></span>':''}</div>`
          :`<button class="item notif ${f.at>S.actSeenAt?'new':''}${f.earn?' earned':''}" ${f.rev?`data-review="${esc(f.rev)}"`:f.job?`data-job="${esc(f.job)}"`:f.person?`data-person="${esc(f.person)}"`:`data-go="${f.go}"`}>${f.who==='tack'?tackFace(38):ring(f.who,38)}<span class="itext"><span class="ntext">${f.html}</span><span class="t2">${since(f.at)}</span></span>${f.earn?`<b class="earn">+₹${fmt(f.earn)}</b>`:''}${miniNote(f.job&&D.jobByKey[f.job])}${f.at>S.actSeenAt?'<span class="udot" aria-label="New"></span>':''}</button>`;
        return feed.length?`<div class="ifeed allfeed">${dateGroups(feed,f=>f.at).map(([g,l])=>`<section class="igroup"><h2 class="ihead">${g}</h2>${l.map(one).join('')}</section>`).join('')}</div>`:empty('Bids, picks and payments show up here.')})()
      :S.actTab==='jobs'?`${jobsNow.length?`<div class="ifeed"><section class="igroup">${jobsNow.map(j=>row(j,jobLine(j),j.price,me)).join('')}</section></div>`:empty('Nothing pinned right now.')}
`
      :S.actTab==='bids'?(active.length||waiting.length||notPicked.length?`<div class="ifeed">${grp('Active',active)+grp('Waiting',waiting)+grp('Not picked',notPicked)}</div>`:empty('Bids you place on the board show up here.'))
      :hist.length?`<div class="ifeed">${dateGroups(hist,y=>y.at).map(([g,l])=>`<section class="igroup"><h2 class="ihead">${g}</h2>${l.map(y=>y.mine?row(y.j,jobLine(y.j),y.amt,me):row(y.j,bidLine(y.x||{j:y.j}),y.amt)).join('')}</section>`).join('')}</div>`:empty('Finished and closed jobs and bids show up here.')}`})()}
   </div></div><div style="height:24px"></div>`;
}
const codeLink=c=>`${SITE}?code=${c}`;
const codeText=c=>`Join me on tack, the ${campus()} board for quick jobs and favours. This invite link is just for you:\n${codeLink(c)}`;
function codeShare(c){return`<div class="copyrow"><span>${esc(codeLink(c))}</span></div>
  <div class="slogos">${slogo('wa','WhatsApp',`href="https://wa.me/?text=${encodeURIComponent(codeText(c))}" target="_blank" rel="noopener"`)}${slogo('ig','Instagram',`data-act="igText" data-text="${esc(codeText(c))}"`)}${navigator.share?slogo('share','More',`data-act="shareCode" data-code="${esc(c)}"`):''}${slogo('link','Copy',`data-act="copy" data-text="${esc(codeText(c))}"`)}</div>`}
function inviteCard(D,big){
  if(false)return big?'<div class="empty" style="margin:8px 0"><b>No chats yet</b><p>Bid on a job, or tap Ask on someone who\u2019s free, to start talking.</p></div>':'';
  const used=0;
  return`<div class="${big?'empty':'box stack'}" style="${big?'margin:8px 0':'gap:10px'}">
    ${big?'<b>No chats yet</b><p>Chats open when you work with someone: message your bidders, or message someone you\u2019ve worked with from their profile. Bring your friends onto the board too.</p>':'<span class="t1" style="font-size:var(--t-16)">Invite friends to tack</span><span class="t2">More people on the board means jobs get picked up faster. Friends from '+esc(campus())+' join with their college email.</span>'}
    <button class="${big?'cta noglow':'btn2'}" data-sheet="invitefriend">Invite a friend</button>
    ${used?`<p class="note">${used} ${used===1?'person has':'people have'} joined with your links.</p>`:''}</div>`}
function dateGroups(list,at){const d0=new Date().setHours(0,0,0,0),grp=t=>!t?'Earlier':t>=d0?'Today':t>=d0-864e5?'Yesterday':t>=d0-6*864e5?'Last 7 days':t>=d0-29*864e5?'Last 30 days':'Earlier',out=[];
  for(const x of list){const g=grp(at(x));if(!out.length||out[out.length-1][0]!==g)out.push([g,[]]);out[out.length-1][1].push(x)}return out}
function viewChats(D){
  const isReq=t=>(t.keys||[t.key]).every(k=>reqIn(k,t.other)),reqs=D.convos.filter(isReq),rest=D.convos.filter(t=>!isReq(t));
  const reqRow=t=>`<button class="item" data-thread="${esc(t.key)}" data-hold="${esc(t.other)}">${ring(t.other,46)}<span class="itext"><span class="t1">${esc(shortName(t.other))}</span><span class="t2">${esc(t.sub)}</span></span><span class="iend"><span class="tag">Request</span></span></button>`;
  return`<div class="pad narrow"><h1 class="pageh">Chats</h1>
  ${reqs.length?`<div class="ifeed"><section class="igroup"><h2 class="ihead">Message requests</h2>${reqs.map(reqRow).join('')}</section></div>`:''}
  ${rest.length?`<div class="ifeed">${dateGroups(rest,t=>t.last?.at||t.job?.at||0).map(([g,l])=>`<section class="igroup"><h2 class="ihead">${g}</h2>${l.map(t=>`<button class="item" data-thread="${esc(t.key)}" data-hold="${esc(t.other)}">${ring(t.other,46)}
    <span class="itext"><span class="t1">${esc(shortName(t.other))}</span><span class="t2" style="${t.unread?'color:var(--fg);font-weight:500':''}">${esc(t.sub)}</span></span>
    <span class="iend"><span class="time">${t.last?ago(t.last.at):''}</span>${t.unread?'<span class="udot" aria-label="Unread"></span>':''}</span></button>`).join('')}</section>`).join('')}</div>`
   :reqs.length?'':inviteCard(D,true)}
  ${rest.length?`<div style="margin-top:18px">${inviteCard(D,false)}</div>`:''}
  </div><div style="height:24px"></div>`;
}
function viewChat(D){
  const c=S.chat;if(!c.key)return viewChats(D);
  const j=c.jobKey?D.jobByKey[c.jobKey]:null,me=S.me.id;
  const accepted=j&&j.accepted&&[j.owner,j.accepted].includes(me)&&[j.owner,j.accepted].includes(c.other);
  const can=canMessage(c,D);
  return`<div class="pad" style="padding-bottom:10px"><div style="display:flex;align-items:center;gap:10px">
     <button class="back" data-act="goBack" data-to="chats" aria-label="Back" style="padding:0">${ic('back',20)}</button>
     <button class="rowmain" data-person="${esc(c.other)}" data-hold="${esc(c.other)}">${ring(c.other,42)}<span class="rowtext"><span style="font-size:var(--t-16);font-weight:600;letter-spacing:-.015em">${esc(shortName(c.other))}</span>
       <span style="font-size:var(--t-12);font-weight:500;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${onlineNow(c.other)?'Active now':esc(metaOf(c.other)||campus())}</span></span></button>
     ${kebab('chat',[{i:'users',t:'View profile',at:`data-person="${esc(c.other)}"`},{i:'eyeoff',t:'Restrict or block…',at:`data-sheet="who" data-about="${esc(c.other)}"`},{sep:1},{i:'flag',t:'Report',at:`data-sheet="report" data-about="${esc(c.other)}"`,danger:true}],'Chat options')}</div></div>
  <div class="msgs">
   ${!c.msgs.length?`<p class="note" style="margin:10px 0">${c.loaded?'Say hi. Sort out the time and place here.':'Loading messages…'}</p>`:''}
   ${(()=>{const lastOut=[...c.msgs].reverse().find(m=>m.by===me),readAt=num(((S.threadDocs[lastOut?.thread||c.key]||{}).read||{})[c.other]),seen=pref('receipts')&&lastOut&&readAt>=lastOut.at;
     // Like Fiverr: a card in the timeline when a gig with this person starts and when it's done. Tap it for the details.
     const gigs=[];for(const k of c.keys||[c.key]){const x=D.jobByKey[parseKey(k)?.jobKey];if(!x||!x.pick||!x.accepted)continue;
       if(!((x.owner===me&&x.accepted===c.other)||(x.owner===c.other&&x.accepted===me)))continue;
       const st=num(x.pick.at)||x.takenAt;if(st)gigs.push({at:st,done:false,j:x});const dn=x.pick.status==='done'?num(x.pick.doneAt)||x.doneAt:0;if(dn)gigs.push({at:dn,done:true,j:x})}
     gigs.sort((x,y)=>x.at-y.at);let gi=0;
     const gigCard=g=>`<button class="gigcard${g.done?' done':''}" data-gig="${esc(g.j.key)}"><span class="gigic">${ic(g.done?'tick':'bids',18,2.2)}</span><span class="gigtext"><b>${g.done?'Gig completed':'Gig started'}</b><span>₹${fmt(g.j.agreed||g.j.price)} · ${esc(str(g.j.text,60))}</span></span><span class="gigchev">${ic('chev',14,2.4)}</span></button>`;
     const gigsUpTo=t=>{let h='';while(gi<gigs.length&&gigs[gi].at<=t){h+=gigCard(gigs[gi]);gi++}return h};
     const byId=new Map(c.msgs.map(m=>[m.id,m]));
     // Like Instagram: one centred time above a group, when the chat starts, after an hour's gap or on a new day.
     const gap=(a,b)=>!a||b.at-a.at>36e5||new Date(a.at).toDateString()!==new Date(b.at).toDateString();
     return c.msgs.map((m,i)=>{const rx=Object.values(m.reactions||{}).filter(e=>REACTS.includes(e)),q=m.replyTo?byId.get(m.replyTo):null;
       const p=c.msgs[i-1],n=c.msgs[i+1],cards=gigsUpTo(m.at),ncard=!!n&&gi<gigs.length&&gigs[gi].at<=n.at,head=gap(p,m),mine=m.by===me,cont=!head&&!cards&&p.by===m.by&&!q,more=!!n&&!gap(m,n)&&!ncard&&n.by===m.by&&!n.replyTo,lastOfRun=!n||gap(m,n)||ncard||n.by!==m.by;
       const lab=q?`<p class="rlabel">${mine?(q.by===me?'You replied to yourself':'You replied to '+esc(firstName(q.by))):esc(firstName(m.by))+(q.by===me?' replied to you':' replied')}</p><button class="rquote" data-act="jumpMsg" data-to="${q.id}"><span>${esc(msgSnip(q))}</span></button>`:'';
       const acts=`<span class="macts">${S.rxFor===m.id?`<span class="rxbar" role="group" aria-label="React">${REACTS.map(e=>`<button data-act="reactMsg" data-to="${m.id}" data-e="${e}" aria-label="React with ${e}">${e}</button>`).join('')}</span>`:''}<button data-act="rxOpen" data-to="${m.id}" data-tip="React" aria-label="React">${ic('smile',18)}</button><button data-act="replyMsg" data-to="${m.id}" data-tip="Reply" aria-label="Reply">${ic('reply',18)}</button><button data-act="msgMore" data-to="${m.id}" data-tip="More" aria-label="More">${ic('dots',18)}</button></span>`;
       return`${head?`<p class="tstamp">${chatStamp(m.at)}</p>`:''}${cards}<div class="mrow ${mine?'mine':'theirs'}${cont?' cont':''}${more?' more':''}${rx.length?' hasrx':''}">${mine?'':`<span class="mav">${lastOfRun?face(m.by,28):''}</span>`}<div class="mcol">${lab}<div class="mline"><div class="${mine?'out':'in'}${m.kind!=='text'?' media '+m.kind:''}" data-mid="${m.id}">${msgBody(m)}${rx.length?`<span class="rx${S.rxPop===m.id?' pop':''}">${[...new Set(rx)].join('')}${rx.length>1?`<b>${rx.length}</b>`:''}</span>`:''}</div>${acts}</div></div></div>${seen&&m===lastOut?'<p class="seen">Seen</p>':''}`}).join('')+gigsUpTo(Infinity)})()}
   ${S.chatUp?`<div class="out media pending">${S.chatUp==='photo'?'Sending photo…':'Sending voice message…'}</div>`:''}
  </div>
  ${(()=>{const st=parseKey(c.key)?.friend?dmState(c.key,c.other):null,fn=esc(firstName(c.other)),u=esc(c.other);
    return st==='incoming'?`<div class="foot"><div class="mreq"><b>${fn} wants to message you</b><span>They won\u2019t know you\u2019ve read this until you accept.</span>
        <div class="ninvbtns"><button class="pick" data-act="answerMsgReq" data-key="${esc(c.key)}" data-ok="1">Accept</button><button class="ghostbtn" data-act="answerMsgReq" data-key="${esc(c.key)}" data-ok="0">Decline</button></div></div></div>`
      :st==='capped'?`<div class="foot"><p class="note">Message request sent. You can send more once ${fn} accepts.</p></div>`
      :st==='requesting'?`<p class="note mreqnote">${ic('shield',12,2.2)} This goes to ${fn} as a message request. They\u2019ll see it once they accept.</p>`:''})()}
  ${(()=>{const st=parseKey(c.key)?.friend?dmState(c.key,c.other):null;return st==='incoming'||st==='capped'})()?'':!can?`<div class="foot"><p class="note">${c.jobKey&&D.jobByKey[c.jobKey]&&jobChatOpen(c.key,D)?`You can message ${esc(firstName(c.other))} once they pick you for this job.`
      :`${c.jobKey?'This job is over, so its chat has closed. ':''}Send a message request to keep talking.`}</p>${c.jobKey&&D.jobByKey[c.jobKey]&&jobChatOpen(c.key,D)?'':`<div class="ninvbtns"><button class="pick" data-msgwith="${esc(c.other)}">Message request</button></div>`}</div>`:`
  <div class="foot" style="position:sticky;bottom:0;background:linear-gradient(transparent,var(--bg) 30%)">${S.rec?`<div class="composer rec">
    <button class="cbtn" data-act="recCancel" aria-label="Cancel recording">${ic('trash',19)}</button>
    <span class="recbar"><i class="recdot"></i><span id="recT">${recClock()}</span><span class="muted">Recording</span></span>
    <button class="csend" data-act="recSend" aria-label="Send voice message">${ic('send',19,2,'var(--on-grad)')}</button></div>`
   :`${S.chatDraft.reply?replyBar(S.chatDraft.reply):''}<div class="composer igc ${S.chatDraft.text.trim()?'hastext':''}" id="composer"><div class="igpill">
    <button class="igcam" data-act="pickChatPhoto" aria-label="Send a photo">${ic('camera',18,2,'var(--bub-ink)')}</button>
    <label class="field" for="msg"><input id="msg" type="text" maxlength="1000" placeholder="Message…" value="${esc(S.chatDraft.text)}" data-bind="chatDraft.text" aria-label="Message ${esc(firstName(c.other))}" autocomplete="off"></label>
    <button class="igicon cmic" data-act="recStart" aria-label="Record a voice message">${ic('mic',22)}</button>
    <button class="igicon cimg" data-act="pickChatPhoto" aria-label="Send a photo">${ic('image',22)}</button>
    <button class="igsend ctext" data-act="send">Send</button>
  </div></div>`}</div>`}`;
}
// Profiles read like Instagram: name bar, photo with stats, bio, one main button, then a grid of notes (and, on your own profile, your bids).
const normPNote=x=>({key:x.owner+'~'+x.id,owner:x.owner,id:x.id,text:str(x.text,400),price:num(x.price),when:str(x.when_label,20),where:str(x.place,40),at:num(x.at),deadline:num(x.deadline),
  status:str(x.status,12),doneAt:num(x.done_at),color:COLOR_RE.test(x.color||'')?x.color:'',campus:str(x.campus,40),hidden:x.hidden===true,remote:true});
function loadProfileNotes(uid){const c=S.pnotes[uid];if(c&&(c.busy||Date.now()-c.at<6e4))return;S.pnotes[uid]={...(c||{}),busy:true,at:Date.now()};
  const done=v=>{S.pnotes[uid]=v;if(['me','person'].includes(S.view))render()};
  S.fb.rpc('profile_notes',{p:uid}).then(l=>done({at:Date.now(),ok:true,list:Array.isArray(l)?l.filter(x=>x&&typeof x.id==='string'&&x.owner===uid).map(normPNote):[]}),e=>{console.warn(e);done({at:Date.now(),ok:false,list:null})})}
// Every note they've pinned: what the database returns (any college, minus hidden ones), plus anything newer already on this board.
function profileNotes(uid,D){const c=S.pnotes[uid],base=c?.ok?c.list:[],seen=new Set(base.map(x=>x.key));
  const extra=D.jobs.filter(j=>j.owner===uid&&j.status!=='removed'&&!seen.has(j.key));
  return[...base.map(x=>D.jobByKey[x.key]?{...D.jobByKey[x.key],hidden:x.hidden}:x),...extra].filter(x=>uid===S.me.id||!x.hidden).sort((a,b)=>b.at-a.at)}
function pnoteByKey(k,D){for(const c of Object.values(S.pnotes))for(const x of c?.list||[])if(x.key===k)return D.jobByKey[k]?{...D.jobByKey[k],hidden:x.hidden}:x;return D.jobByKey[k]||null}
const PTAB_ICONS=[['notes','note','Board'],['bids','bid','Bids'],['saved','bookmark','Saved']],PTABS=PTAB_ICONS.map(x=>x[0]);
const stTag=j=>({assigned:'Picked',done:'Done',closed:'Closed',expired:'Closed'}[jobState(j)]||'');
const shortDay=t=>t?new Date(t).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'';
// A personal board note: price, the job, one status line. Same calm notes as the campus board, without the extras.
function ptile(j,i,o){const st=jobState(j),dim=['closed','expired','removed'].includes(st)&&!o.on,k=esc(j.key);
  const t=`<button class="tile ntile ptile${gcls(j)}${dim?' dim':''}" ${o.remote?`data-sheet="pnote" data-about="${k}"`:`data-job="${k}"`} style="--nc:${noteOf(j)};--i:${i};--d:0s${gvars(j)}">
    <span class="pin"></span>${isOrg(j.owner)?'':`<span class="price">₹${fmt(j.price)}</span>`}<p>${esc(j.text)}</p>
    <span class="pst${o.on?' on':''}">${esc(o.tag)}${j.hidden?' · hidden':''}</span></button>`;
  return o.own?`<div class="pwrap${j.hidden?' hid':''}">${t}<button class="pgdots" data-sheet="pnmenu" data-about="${k}" aria-label="Options for this job">${ic('dots',16,2.8)}</button></div>`:t}
function profileWall(items){const n=wideMQ.matches?3:2,cols=Array.from({length:n},()=>[]);
  items.forEach(({j,o},i)=>cols[i%n].push(ptile(j,i,o)));
  return`<div class="pboard"><div class="wall">${cols.map(c=>`<div class="wcol">${c.join('')}</div>`).join('')}</div></div>`}
// Profile buttons for someone else: Message leads, follow sits beside it.
function relBtns(uid,D){const u=esc(uid);if(!FOLLOW_ON)return isOrg(uid)?'':`<div class="pacts"><button class="cta" data-msgwith="${u}">Message</button></div>`;
  const f=isFollowing(uid),fl=isFriend(uid)?'Friends':f?'Following':followsMe(uid)?'Follow back':'Follow';
  return`<div class="pacts">${isOrg(uid)?'':`<button class="cta" data-msgwith="${u}">Message</button>`}<button class="btn2" data-act="follow" data-uid="${u}">${fl}</button></div>`}
// The personal board: jobs they posted and jobs they did. Who did a job is private, so on someone else's profile
// it only shows jobs they did for you.
function boardItems(uid,D){const me=S.me.id,isMe=uid===me,out=[];
  for(const j of profileNotes(uid,D)){const st=jobState(j),n=isMe&&!j.remote?bidsFor(D,j.key).length:0,when=shortDay(j.doneAt||j.at);
    out.push({at:j.doneAt||j.at,j,o:{remote:!D.jobByKey[j.key],own:isMe&&!isOrg(uid),on:st==='open',
      tag:st==='open'?(isMe?`Open · ${n} ${n===1?'bid':'bids'}`:'Open now'):st==='assigned'?(isMe?`Posted · picked @${handleOf(j.accepted)||'someone'}`:'Posted · picked'):st==='done'?`Posted · ${when}`:`Closed · ${when}`}})}
  const did=D.jobs.filter(j=>j.status!=='removed'&&j.accepted===uid&&j.owner!==uid&&(isMe||j.owner===me));
  for(const j of did){const done=jobState(j)==='done',when=shortDay(j.doneAt||num(j.pick?.at)||j.at);
    out.push({at:j.doneAt||num(j.pick?.at)||j.at,j,o:{on:!done,tag:isMe?(done?`Did it · ${when}`:`Doing it for @${handleOf(j.owner)||firstName(j.owner)}`):(done?`Did it for you · ${when}`:'Doing it for you')}})}
  return out.sort((a,b)=>b.at-a.at)}
function profileNudge(uid){const d=pdoc(uid);
  const n=!str(d.bio,BIO_MAX)?['Add a line about you','Posters pick people who say what they’re good at.']:!photoOf(uid)?['Add a profile photo','A real face helps people say yes.']:!(d.year&&d.branch)?['Add your year and branch','So classmates know who you are.']:null;
  return n?`<button class="pnudge" data-go="edit"><span class="rowtext"><span class="t1">${n[0]}</span><span class="t2">${n[1]}</span></span><span class="chev">${ic('chev',16)}</span></button>`:''}
// Profiles keep one focal point: the person, one line of trust, one action, then their personal board.
function viewPerson(uid,D){
  const d=pdoc(uid),st=stats(uid,D),isMe=uid===S.me.id,me=S.me.id,org=isOrg(uid);
  const bio=str(d.bio,BIO_MAX)||str(d.does,60),real=!org&&handleOf(uid)?realNameOf(uid):'';
  const menu=isMe?kebab('me',[{html:`<span class="ohead">Logged in as ${esc(S.me.email)}</span>`},
     {sep:1},
     {i:'star',t:'Your reviews',at:'data-go="reviews"',v:(()=>{const l=reviewsOf(S.me.id);return l&&l.length?String(l.length):''})()},
     IOS_APP&&!NPush?null:{i:'bell',t:'Notifications',at:`data-act="${pushOn()?'pushOff':'pushOn'}"`,v:pushOn()?'On':'Off'},
     {html:`<div class="themerow orow">${ic('moon',18)} Appearance<span class="seg" role="group" aria-label="Appearance">${[['dark','Dark'],['light','Light'],['system','Auto']].map(([k,l])=>`<button data-act="setThemeTo" data-k="${k}" class="${(themePref()||'dark')===k?'on':''}" aria-pressed="${(themePref()||'dark')===k}"${k==='system'?' title="Match your phone"':''}>${l}</button>`).join('')}</span></div>`},
     S.me.isOwner?{i:'users',t:'Invites and members',at:'data-go="invites"'}:null,
     {sep:1},{i:'board',t:'How tack works',at:'data-act="replayIntro"'},{i:'shield',t:'Settings and privacy',at:'data-go="settings"'},{i:'flag',t:'Report or feedback',at:'data-go="help"'},
     {sep:1},{i:'out',t:'Log out',at:'data-act="logout"',danger:true}],'Profile options')
    :kebab('person',[{i:'eyeoff',t:'Restrict or block…',at:`data-sheet="who" data-about="${esc(uid)}"`},{i:'flag',t:'Report',at:`data-sheet="report" data-about="${esc(uid)}"`,danger:true}],'Options for '+shortName(uid));
  loadProfileNotes(uid);
  const tab=isMe&&PTABS.includes(S.ptab)?S.ptab:'notes',c=S.pnotes[uid];
  const name=org?'tack':handleOf(uid)?'@'+handleOf(uid):shortName(uid);
  const meta=org?'':[str(d.year,12),str(d.branch,24),campusName(campusOf(uid))].filter(Boolean).join(' · ');
  const r=st.doer.n?{v:st.avg,n:st.doer.n,x:''}:st.poster.n?{v:st.poster.avg.toFixed(1),n:st.poster.n,x:' as a poster'}:null;
  const bits=[r?`<span class="pstar">${ic('star',14,2,'currentColor','currentColor')}</span><b>${r.v}</b><span>(${r.n})${r.x}</span>`:'<span>New on tack</span>',
    st.done?`<span>${st.done} ${st.done===1?'job':'jobs'} done</span>`:'',isMe&&st.earned?`<b class="money">₹${fmt(st.earned)}</b><span>earned</span>`:''].filter(Boolean);
  const trust=bits.join('<i class="psep" aria-hidden="true"></i>');
  const revs=!isMe&&!org?reviewsOf(uid):null,rv=revs&&revs[0];
  let body='';
  if(tab==='notes'){const items=boardItems(uid,D),hid=items.filter(x=>x.j.hidden).length;
    body=items.length?`${isMe?'':`<div class="psh"><h2>Board</h2><span>${items.length} ${items.length===1?'job':'jobs'}</span></div>`}${profileWall(items)}${hid?`<p class="ignote">${ic('eyeoff',12,2.2)} Hidden jobs are only visible to you.</p>`:''}`
      :!c||c.busy&&!c.ok?'<p class="ignote">Loading…</p>'
      :isMe?`<div class="empty igempty"><b>Your board is empty</b><p>Jobs you pin and jobs you do show up here.</p><button class="cta" data-go="post">Pin a job</button></div>`:''}
  else if(tab==='bids'){const l=Object.values(S.pitchMine).filter(p=>p&&num(p.amt)>0&&D.jobByKey[p.job]&&D.jobByKey[p.job].owner!==me).map(p=>({j:D.jobByKey[p.job],amt:num(p.amt),at:num(p.at)})).sort((a,b)=>b.at-a.at);
    body=l.length?`${profileWall(l.map(({j,amt})=>({j,o:{tag:j.accepted===me?'Picked you':j.accepted?'Someone else got it':jobState(j)==='open'?`Your bid ₹${fmt(amt)}`:'Closed',on:j.accepted===me||jobState(j)==='open'&&!j.accepted}})))}<p class="ignote">${ic('shield',12,2.2)} Only you see your bids.</p>`
      :'<div class="empty igempty"><b>No bids yet</b><p>Bids you place show up here. Only you see them.</p><button class="btn2" data-go="board">Find a job</button></div>'}
  else{const keys=Array.isArray(S.priv.saved)?S.priv.saved:[],l=keys.map(k=>D.jobByKey[k]).filter(j=>j&&j.status!=='removed');
    body=l.length?`${profileWall(l.map(j=>({j,o:{tag:stTag(j)||'Open',on:jobState(j)==='open'}})))}<p class="ignote">${ic('shield',12,2.2)} Only you see what you've saved.</p>`
      :'<div class="empty igempty"><b>Nothing saved yet</b><p>Tap the bookmark on a job, or hold a note on the board, to keep it here.</p><button class="btn2" data-go="board">Browse the board</button></div>'}
  return`<div class="pad pv3">
   <div class="pnav">${isMe?'<span></span>':`<button class="back" data-act="goBack" data-to="board" aria-label="Back">${ic('back',20)}</button>`}${menu}</div>
   <div class="phero">
     <span class="ring${onlineNow(uid)?' live':''}" style="width:96px;height:96px">${face(uid,86)}</span>
     <h1 class="pname">${esc(name)}</h1>
     ${real?`<p class="preal">${esc(real)}</p>`:''}
     ${meta?`<p class="pmeta">${esc(meta)}</p>`:''}
     ${r?`<button class="ptrust" data-sheet="ratings" data-about="${esc(uid)}" aria-label="See ratings">${trust}</button>`:`<p class="ptrust">${trust}</p>`}
     ${bio?`<p class="pbio">${esc(bio)}</p>`:''}
     ${isMe?`<div class="pacts"><button class="btn2" data-go="edit">Edit profile</button><button class="btn2" data-act="shareMe">Share</button></div>`:relBtns(uid,D)}
   </div>
   ${isMe?profileNudge(uid):''}
   ${rv?`<section class="psec"><div class="psh"><h2>Reviews</h2>${revs.length>1?`<button class="linkbtn" data-sheet="ratings" data-about="${esc(uid)}">See all ${revs.length}</button>`:''}</div>
     <p class="pquote">${esc(rv.text)}</p><p class="pqby">${rv.stars?`<span class="pstars">${'★'.repeat(Math.round(rv.stars))}</span>`:''}A poster · ${new Date(rv.at).toLocaleDateString('en-IN',{month:'long'})}</p></section>`:''}
   ${isMe?`<div class="ptabs" role="tablist">${PTAB_ICONS.map(([k,,l])=>`<button class="${tab===k?'on':''}" role="tab" aria-selected="${tab===k}" data-act="ptab" data-k="${k}">${l}</button>`).join('')}</div>`:'<div class="psec"></div>'}
   ${body}
  </div><div style="height:24px"></div>`;
}
function viewSettings(D){const me=S.me.id,blocked=arr(S.priv.blocked).filter(u=>typeof u==='string'),rs=restricted(),t=S.priv.terms||{};
  const row=(t1,t2,attrs,end='')=>`<button class="setrow" ${attrs}><span class="rowtext"><span class="t1">${t1}</span>${t2?`<span class="t2">${t2}</span>`:''}</span>${end||`<span class="chev">${ic('chev',16)}</span>`}</button>`;
  const tog=(on,t1,t2,attrs)=>`<button class="setrow" role="switch" aria-checked="${on}" ${attrs}><span class="rowtext"><span class="t1">${t1}</span><span class="t2">${t2}</span></span><span class="switch ${on?'on':''}" aria-hidden="true"></span></button>`;
  return`<div class="pad">${back('me')}<div class="stack narrow" style="margin-top:6px;gap:24px">
   <h1 class="pageh">Settings</h1>
   <section class="setsec"><h2 class="seth">Account</h2><div class="setcard">
     <div class="setrow static"><span class="rowtext"><span class="t1">Email</span><span class="t2">${esc(S.me.email)}</span></span></div>
     ${row('Change password','You’ll need your current password.',`data-act="togglePwForm" aria-expanded="${S.pwOpen}"`,`<span class="chev" style="transform:rotate(${S.pwOpen?90:0}deg)">${ic('chev',16)}</span>`)}
     ${S.pwOpen?`<div class="setform">
       <label class="formlabel" for="pwCur">Current password</label><input id="pwCur" class="inp" type="password" autocomplete="current-password" value="${esc(S.pw.cur)}" data-bind="pw.cur">
       <label class="formlabel" for="pwNew">New password</label><input id="pwNew" class="inp" type="password" autocomplete="new-password" placeholder="At least 8 characters" value="${esc(S.pw.nw)}" data-bind="pw.nw">
       ${S.err.pw?`<p class="err" role="alert">${esc(S.err.pw)}</p>`:''}
       <button class="cta" data-act="changePw" data-need="pw" ${S.busy?'disabled':''}>${S.busy?'Saving…':'Save new password'}</button></div>`:''}
     ${row('Edit profile','Name, photo, year, branch, what you’re good at and ring colour.','data-go="edit"')}
   </div></section>
   <section class="setsec"><h2 class="seth">Privacy</h2><div class="setcard">
     <div class="setrow static"><span class="rowtext"><span class="t1">Who can see your bids</span><span class="t2">Only the poster of that job. Other members never see who bid or how much.</span></span><span class="setval">${ic('shield',14,2.2)} Poster only</span></div>
     ${tog(pref('near'),'Show Near you on my bids','Tells the poster you were close to the job when you bid. Never your location.','data-pref="near"')}
     ${tog(pref('receipts'),'Read receipts','Let people see when you’ve read their messages. If you turn this off, you won’t see theirs either.','data-pref="receipts"')}
     ${tog(locOptIn(),'Use my location','Shows jobs near you and lets you tag jobs. Your location stays on this device.','data-act="toggleLocPref"')}
     ${tog(!S.priv.hideOnline,'Show when I’m online','People you’ve made a deal with see you at the top of their board while you’re online.','data-act="toggleOnline"')}
   </div></section>
   <section class="setsec"><h2 class="seth">Restricted people</h2><div class="setcard">
     ${rs.length?rs.map(u=>`<div class="setrow static">${ring(u,34)}<span class="rowtext"><span class="t1">${esc(shortName(u))}</span><span class="t2">They can’t see when you’re online or send you offers.</span></span><button class="btn2 setbtn" data-act="unrestrict" data-uid="${esc(u)}">Unrestrict</button></div>`).join('')
       :`<div class="setrow static"><span class="rowtext"><span class="t2">You haven’t restricted anyone. Hold someone in Chats or open their profile to restrict them.</span></span></div>`}
   </div></section>
   <section class="setsec"><h2 class="seth">Blocked people</h2><div class="setcard">
     ${blocked.length?blocked.map(u=>`<div class="setrow static">${ring(u,34)}<span class="rowtext"><span class="t1">${esc(shortName(u))}</span><span class="t2">You don’t see their jobs, bids or messages, and they can’t see when you’re online.</span></span><button class="btn2 setbtn" data-act="unblock" data-uid="${esc(u)}">Unblock</button></div>`).join('')
       :`<div class="setrow static"><span class="rowtext"><span class="t2">You haven’t blocked anyone.</span></span></div>`}
   </div></section>
   <section class="setsec"><h2 class="seth">Help</h2><div class="setcard">
     ${row('Report or feedback','Report a problem with a job or a person, or tell us what to improve.','data-go="help"')}
     ${SUPPORT_EMAIL?`<a class="setrow" href="mailto:${esc(SUPPORT_EMAIL)}"><span class="rowtext"><span class="t1">Contact support</span><span class="t2">${esc(SUPPORT_EMAIL)}</span></span><span class="chev">${ic('chev',16)}</span></a>`:''}
     ${row('How tack works','Replay the introduction.','data-act="replayIntro"')}
   </div></section>
   <section class="setsec"><h2 class="seth">Legal</h2><div class="setcard">
     ${row('Privacy Policy','','data-doc="privacy"')}
     ${row('Terms of Use','','data-doc="terms"')}
     <div class="setrow static"><span class="rowtext"><span class="t2">${t.at?`You accepted the current Terms on ${new Date(num(t.at)).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}.`:`Effective ${EFFECTIVE}.`}</span></span></div>
   </div></section>
   <section class="setsec"><h2 class="seth">Your data</h2><div class="setcard">
     ${row('Download my data','A copy of your profile, jobs, bids, offers, picks, settings and the messages you sent.','data-act="exportData"',`<span class="chev">${ic('chev',16)}</span>`)}
     <button class="setrow danger" data-sheet="erase"><span class="rowtext"><span class="t1">Delete my account</span><span class="t2">Erases your profile, jobs, bids, photos and messages for good.</span></span></button>
   </div></section>
  </div></div><div style="height:28px"></div>`;
}
const HELP_KINDS=[['past','Report a problem with a past job','Something went wrong on a job you posted or did.','flag'],['board','Report something on the board','A job that breaks the rules, or someone acting unsafely.','board'],
  ['feedback','Send feedback or an idea','Tell us what to fix, or what you’d like next.','chat'],['data','Account, privacy or data request','Ask about your data, correct something, or raise a complaint.','shield']];
const HELP_WHY={past:['No-show','Didn’t pay or paid less','Work not as agreed','Unsafe or harassing','Something else'],board:['Breaks the posting rules','Assignment or exam work','Scam or spam','Unsafe or harassing','Something else']};
function viewHelp(D){const h=S.help,me=S.me.id;
  const head=(t,sub,backAct)=>`<div class="pad">${backAct?`<button class="back" data-act="${backAct}" aria-label="Back">${ic('back',20)}</button>`:back('settings')}<div class="stack narrow" style="margin-top:6px;gap:18px"><div class="stack gap8"><h1 class="pageh">${t}</h1>${sub?`<p class="note" style="text-align:left;margin:0">${sub}</p>`:''}</div>`;
  const tail=`</div></div><div style="height:28px"></div>`;
  if(h.sent)return head(h.sent==='feedback'?'Thank you.':'We’ve got it.','',null)+`<div class="sentcard"><span class="bigpin"></span><p>${h.sent==='feedback'?'Your feedback goes straight to the organiser. Ideas like yours shape what tack does next.':'Your report has been sent to the organiser. You’ll get an acknowledgement within 24 hours, and we aim to resolve it within 15 days. Nobody else can see what you sent.'}</p>
    <button class="cta" data-act="helpDone">Done</button></div>`+tail;
  if(!h.kind)return head('Report or feedback','Tell us what happened or what could be better. Only the organiser sees what you send.')+`<div class="setcard">${HELP_KINDS.map(([k,t,sub,icn])=>`<button class="setrow" data-helpkind="${k}"><span class="seticon">${ic(icn,18)}</span><span class="rowtext"><span class="t1">${t}</span><span class="t2">${sub}</span></span><span class="chev">${ic('chev',16)}</span></button>`).join('')}</div>`+tail;
  const kt=HELP_KINDS.find(x=>x[0]===h.kind);
  if((h.kind==='past'||h.kind==='board')&&!h.job){
    const list=h.kind==='past'?D.jobs.filter(j=>(j.owner===me&&j.accepted)||j.accepted===me).sort((a,b)=>Math.max(b.doneAt||0,b.at)-Math.max(a.doneAt||0,a.at))
      :boardJobs(D).filter(j=>j.owner!==me);
    return head(kt[1],h.kind==='past'?'Which job was it?':'Which job is it about?','helpBack')+(list.length?`<div class="stack gap8">${list.map(j=>{const other=j.owner===me?j.accepted:j.owner;
      return`<button class="item" data-helpjob="${esc(j.key)}">${ring(other,38)}<span class="itext"><span class="t1" style="font-weight:500;color:var(--fg)">${esc(j.text)}</span><span class="t2">${esc(j.owner===me?'You posted · '+shortName(other)+' did it':shortName(j.owner)+' posted')} · ${since(Math.max(j.doneAt||0,j.at))}</span></span><span class="amt" style="font-size:var(--t-16);color:var(--fg2)">₹${fmt(j.agreed||j.price)}</span></button>`}).join('')}</div>`
      :`<p class="note" style="text-align:left">${h.kind==='past'?'You don’t have any jobs with someone yet.':'Nothing else is on the board right now.'}</p>`)+tail}
  const j=h.job?D.jobByKey[h.job]:null,other=j?(j.owner===me?j.accepted:j.owner):null;
  return head(kt[1],'',h.job?'helpUnjob':'helpBack')+`${j?`<div class="card">${ring(other,38)}<span class="rowtext"><span class="t1">${esc(j.text)}</span><span class="t2">${esc(j.owner===me?'With '+shortName(other):'Posted by '+shortName(j.owner))}</span></span></div>`:''}
    ${HELP_WHY[h.kind]?`<div class="stack gap8"><span class="formlabel" id="hw">What happened?</span><div class="chips" role="group" aria-labelledby="hw">${HELP_WHY[h.kind].map(w=>`<button class="chip ${h.why===w?'on':''}" data-helpwhy="${esc(w)}" aria-pressed="${h.why===w}">${esc(w)}</button>`).join('')}</div></div>`:''}
    <div class="stack gap8"><label class="formlabel" for="helpN">${h.kind==='feedback'?'Your feedback':h.kind==='data'?'Your request':'Details'} ${HELP_WHY[h.kind]?'<span class="muted">(optional)</span>':''}</label>
      <textarea id="helpN" class="inp" rows="5" maxlength="1000" style="resize:vertical" placeholder="${h.kind==='feedback'?'What would make tack better for you?':h.kind==='data'?'Tell us what you need. For example: a copy of my data, correcting my details, or a complaint.':'What happened, and when? Include anything that helps us understand.'}" data-bind="help.note">${esc(h.note)}</textarea></div>
    ${S.err.help?`<p class="err">${esc(S.err.help)}</p>`:''}
    <button class="cta" data-act="sendHelp" data-need="help">${h.kind==='feedback'?'Send feedback':h.kind==='data'?'Send request':'Send report'}</button>
    <p class="note">Only the organiser sees this. ${h.kind==='past'||h.kind==='board'?'The person you report isn’t told who reported them.':''}</p>`+tail;
}
function openDoc(k){let r=$('docRoot');if(!r){r=document.createElement('div');r.id='docRoot';document.body.appendChild(r)}
  r.innerHTML=`<div class="docview" role="dialog" aria-modal="true" aria-labelledby="docT"><div class="dochead"><span class="mark">tack</span><button class="iconbtn" data-act="closeDoc" aria-label="Close">${ic('x',18,2.4)}</button></div>
    <div class="docscroll"><article class="prose legal"><h1 id="docT" class="pageh">${k==='terms'?'Terms of Use':'Privacy Policy'}</h1><p class="effective">Effective ${EFFECTIVE}</p>${k==='terms'?TERMS:PRIVACY}</article></div></div>`;
  requestAnimationFrame(()=>r.querySelector('.iconbtn')?.focus({preventScroll:true}))}
function closeDoc(){$('docRoot')?.remove()}
function renderTermsGate(){let r=$('termsRoot');
  if(!needTerms()){if(r)r.remove();return}
  if(r)return;r=document.createElement('div');r.id='termsRoot';document.body.appendChild(r);
  r.innerHTML=`<div class="termsgate" role="dialog" aria-modal="true" aria-labelledby="tgT"><div class="tgbox"><span class="mark">tack</span>
    <h1 id="tgT">We’ve updated our terms.</h1>
    <p>To keep using tack, please read and accept the Terms of Use and Privacy Policy. In short:</p>
    <ul><li>tack is a noticeboard. Jobs and payments are agreed directly between members, at their own risk.</li><li>tack never handles money and isn’t responsible for disputes between members.</li>
      <li>No academic work, nothing illegal or unsafe. Breaking the rules can get your account removed.</li><li>New controls in Settings: read receipts, showing when you’re online, blocked people and downloading your data.</li></ul>
    <div class="tglinks"><button class="btn2" data-doc="terms">Read Terms of Use</button><button class="btn2" data-doc="privacy">Read Privacy Policy</button></div>
    <button class="cta" data-act="acceptTerms">I agree</button><button class="linkbtn" data-act="logout">Log out</button></div></div>`}
const NEED_EXTRA={cpost:()=>S.draft.text.trim().length>=2,pw:()=>!!S.pw.cur&&S.pw.nw.length>=8,help:()=>{const h=S.help;return h.kind==='past'||h.kind==='board'?!!(h.job&&h.why):h.note.trim().length>=10}};
const inviteLink=e=>`${SITE}?invite=${encodeURIComponent(e)}`;
const inviteText=e=>`You're invited to tack, the ${campus()} noticeboard for small jobs. Post something you need done, or bid on a classmate's job.\n\nSign up with this email address (${e}):\n${inviteLink(e)}`;
function shareButtons(e){
  return`<div class="slogos">${slogo('mail','Email',`href="mailto:${encodeURIComponent(e)}?subject=${encodeURIComponent('You’re invited to tack')}&body=${encodeURIComponent(inviteText(e))}"`)}${slogo('wa','WhatsApp',`href="https://wa.me/?text=${encodeURIComponent(inviteText(e))}" target="_blank" rel="noopener"`)}${slogo('link','Copy',`data-act="copy" data-text="${esc(inviteText(e))}"`)}</div>`;
}
function campusList(){const n={};for(const[u,d]of Object.entries(S.peopleDocs))if(d&&d.adult&&!d.removed){const c=str(d.campus,40)||'mit-wpu';n[c]=(n[c]||0)+1}
  const ids=new Set([...Object.keys(S.campuses),...Object.keys(n),curCampus()]);
  return[...ids].map(id=>({id,name:campusName(id),auto:!!S.campuses[id]?.auto,n:n[id]||0})).sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name))}
function viewInvites(D){
  if(!S.me.isOwner)return viewBoard(D);
  const list=Object.entries(S.invites).filter(([e])=>e!==S.me.email).map(([e,x])=>({email:e,camp:typeof x?.campus==='string'?x.campus:'',at:num(x?.at),uid:typeof x?.uid==='string'?x.uid:null,by:typeof x?.by==='string'?x.by:null,code:typeof x?.code==='string'})).sort((a,b)=>b.at-a.at);
  const li=S.lastInvite;
  return`<div class="pad">${back('me')}<div class="stack narrow" style="margin-top:6px;gap:20px">
   <div><h1 class="pageh" style="margin-bottom:6px">Invites and members</h1>
   <p style="margin:0;font-size:var(--t-14);line-height:1.55;color:var(--fg2)">Anyone with a college email can sign up and lands on their campus board. Invite everyone else here: add their email and campus, then send them the invite.</p></div>
   <div class="stack gap8"><label class="formlabel" for="invE">Invite by email</label>
     <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="invE" class="inp" style="flex:1;min-width:200px" type="email" inputmode="email" autocapitalize="off" spellcheck="false" autocomplete="off" placeholder="name@college.edu.in" value="${esc(S.inv.email)}" data-bind="inv.email">
     <button class="pick" style="padding:12px 18px;font-size:var(--t-14)" data-act="invite" data-need="invite">Add invite</button></div>
     <label class="formlabel" for="invCamp" style="margin-top:6px">Their campus</label>
     <select id="invCamp" class="inp" data-bind="inv.camp">${campusList().map(c=>`<option value="${esc(c.id)}" ${(S.inv.camp||curCampus())===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
     <p class="note" style="text-align:left">People with a college email don’t need an invite. They sign up and land on their campus board. Invite people who use Gmail or another personal email.</p>
     ${S.err.inv?`<p class="err">${esc(S.err.inv)}</p>`:''}</div>
   ${li?`<div class="box stack" style="gap:10px;border:1px solid rgba(170,226,84,.35)">
     <span class="t1" style="font-size:var(--t-14)">${esc(li)} can sign up now. Send them the invite:</span>${shareButtons(li)}</div>`:''}
   <div class="stack gap8"><div class="sect"><h2 class="h2">Invited</h2><span class="time">${list.length}</span></div>
    ${list.length?list.map(x=>{const joined=x.uid&&S.peopleDocs[x.uid]?.adult;return`<div class="row">${joined?ring(x.uid,40):`<span class="add" style="width:40px;height:40px">${ic('clock',16)}</span>`}
      <span class="rowtext"><span class="t1">${esc(x.email)}</span><span class="t2" style="color:${joined?'var(--accent)':'var(--muted)'}">${joined?'Joined as '+esc(shortName(x.uid)):(x.uid?'Signed up, setting up profile':'Not signed up yet · invited '+since(x.at))}${x.code&&x.by?' · invited by '+esc(shortName(x.by)):''}${campusList().length>1&&x.camp?' · '+esc(campusName(x.camp)):''}</span></span>
      ${joined?'':`<button class="iconbtn" data-act="reshare" data-email="${esc(x.email)}" aria-label="Send ${esc(x.email)} the invite again">${ic('mail',16)}</button>`}
      <button class="iconbtn" data-sheet="uninvite" data-about="${esc(x.email)}" aria-label="Remove ${esc(x.email)}">${ic('trash',16)}</button></div>`}).join('')
     :'<p class="note" style="text-align:left">Nobody invited yet. Add the first email above.</p>'}</div>
   <div class="stack gap8"><div class="sect"><h2 class="h2">Reports</h2><span class="time">${S.reports.length}</span></div>
    ${S.reports.length?S.reports.map(r=>`<div class="row" style="align-items:flex-start"><span class="rowtext" style="gap:3px"><span class="t1">${esc(shortName(str(r.by,128)))} reported ${esc(shortName(str(r.about,128)))}</span>
      <span class="t2">${esc(str(r.why,40))}${r.note?' · '+esc(str(r.note,200)):''}</span><span class="time">${stamp(num(r.at))}</span></span>
      <button class="btn2" style="width:auto;padding:8px 12px;font-size:var(--t-12)" data-person="${esc(str(r.about,128))}">View</button></div>`).join(''):'<p class="note" style="text-align:left">No reports.</p>'}</div>
   <div class="stack gap8"><div class="sect"><h2 class="h2">Boards</h2><span class="time">${campusList().length}</span></div>
    ${campusList().map(c=>`<div class="row"><span class="rowtext"><span class="t1">${esc(c.name)}${c.id===curCampus()?' <span style="color:var(--accent)">· viewing</span>':''}</span><span class="t2">${c.n} ${c.n===1?'member':'members'}${c.auto?' · made from a college email':''}</span></span>
      ${c.id===curCampus()?'':`<button class="btn2" style="width:auto;padding:8px 12px;font-size:var(--t-12)" data-act="viewCampus" data-id="${esc(c.id)}">View</button>`}</div>`).join('')}</div>
   <div class="stack gap8"><label class="formlabel" for="invC">Name of the board you’re viewing</label>
     <div style="display:flex;gap:8px"><input id="invC" class="inp" maxlength="60" value="${esc(S.inv.campus||campus())}" data-bind="inv.campus"><button class="btn2" style="width:auto;padding:12px 18px" data-act="saveCampus">Save</button></div></div>
  </div></div><div style="height:24px"></div>`;
}
function railHTML(D){
  const online=onlinePeople(D),me=S.me.id;
  const myBids=Object.values(S.pitchMine).filter(p=>p&&num(p.amt)>0).map(p=>({b:{amt:num(p.amt),at:num(p.at)},j:D.jobByKey[p.job]})).filter(x=>x.j&&x.j.owner!==me).sort((a,b)=>num(b.b.at)-num(a.b.at)).slice(0,4);
  return`<span style="font-size:var(--t-12);font-weight:500;color:var(--dim)">${D.members.length} on the board</span>
  ${online.length?`<p class="label" style="margin:0">Online</p><div class="stack gap8">${online.map(u=>`<button class="rowmain" data-person="${esc(u)}" data-hold="${esc(u)}">${ring(u,40)}
     <span class="rowtext"><span style="font-size:var(--t-14);font-weight:600">${esc(shortName(u))}</span><span style="font-size:var(--t-11);font-weight:500;color:var(--muted)">${esc([metaOf(u),str(pdoc(u).does,40)].filter(Boolean).join(' · '))}</span></span></button>`).join('')}</div>`:''}
  <div style="height:1px;background:var(--line)"></div>
  <h2 class="h2">Your bids</h2>
  <div class="stack gap8">${myBids.length?myBids.map(({b,j})=>{const ok=j.accepted===me;return`<button data-job="${esc(j.key)}" style="display:flex;align-items:center;gap:10px;background:var(--surface);border-radius:var(--r-sm);padding:11px 13px;width:100%;text-align:left">
     <span class="rowtext"><span style="font-size:var(--t-12);font-weight:500;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(j.text)}</span>
     <span style="font-size:var(--t-11);font-weight:500;color:${ok?'var(--accent)':'var(--muted)'}">${ok?'Accepted · ₹'+fmt(j.agreed):j.accepted?'Went to someone else':jobState(j)==='open'?'Waiting for '+firstName(j.owner)+' to pick':'Closed'}</span></span>
     <span style="font-family:var(--display);font-size:var(--t-16);font-weight:700;color:var(--fg2);font-variant-numeric:tabular-nums">₹${fmt(b.amt)}</span></button>`}).join('')
   :''}</div>`;
}

function sheetHTML(D){
  const s=S.sheet;if(!s)return'';let b='';
  const j=S.openJob?D.jobByKey[S.openJob]:null;
  switch(s.type){
  case'rel':{const k=['friends','followers','following'].includes(s.about)?s.about:'followers',bl=new Set(arr(S.priv.blocked));
    const ids=(k==='friends'?friendIds():Object.keys(k==='following'?S.following:S.followers)).filter(u=>!bl.has(u)).sort((a,b)=>shortName(a).localeCompare(shortName(b)));
    const act=u=>{const x=esc(u);return k==='followers'?(isFollowing(u)?'':`<button class="pick" data-act="follow" data-uid="${x}">Follow back</button>`)+`<button class="ghostbtn" data-act="removeFollower" data-uid="${x}">Remove</button>`
      :k==='following'?`<button class="ghostbtn" data-act="follow" data-uid="${x}">Following</button>`:''};
    b=`<h2 id="sheetT">${{friends:'Friends',followers:'Followers',following:'Following'}[k]}</h2>
      ${ids.length?`<div class="menu cmlist">${ids.map(u=>`<div class="cmrow"><button class="relwho" data-person="${esc(u)}">${face(u,30)}<span class="cn">${esc(shortName(u))}</span></button>${act(u)}</div>`).join('')}</div>`
        :`<p class="note">${{friends:'No friends yet. You become friends when you both follow each other.',followers:'Nobody follows you yet.',following:'You aren’t following anyone yet. Follow people to hear when they pin a job.'}[k]}</p>`}
      ${k==='followers'&&ids.length?'<p class="note">Removing a follower doesn’t tell them.</p>':''}`;break}
  case'unfollow':{const u=s.about,fr=isFriend(u);b=`<h2 id="sheetT">Unfollow ${esc(shortName(u))}?</h2>
      <p>${fr?'You’ll stop being friends, so you can only message each other inside a job, and you won’t see each other’s friends-only jobs. They aren’t told.':'You won’t hear when they pin a job. They aren’t told.'}</p>
      <button class="cta destructive" data-act="unfollow" data-uid="${esc(u)}">Unfollow</button><button class="linkbtn" data-act="closeSheet">Cancel</button>`;break}
  case'pnmenu':{const x=pnoteByKey(s.about,D);if(!x){b='<h2 id="sheetT">This note is gone</h2>';break}
    b=`<h2 id="sheetT">${esc(x.text.length>70?x.text.slice(0,70)+'…':x.text)}</h2><div class="menu">${D.jobByKey[x.key]?`<button data-job="${esc(x.key)}">${ic('board',18)} Open note</button>`:''}
      <button data-act="pnHide" data-key="${esc(x.key)}" data-val="${x.hidden?'0':'1'}">${ic('eyeoff',18)} ${x.hidden?'Show on my profile':'Hide from my profile'}</button></div>
      <p class="note">${x.hidden?'Right now only you can see it on your profile.':'It stays on the board while it’s open. This only takes it off your profile.'}</p>`;break}
  case'pnote':{const x=pnoteByKey(s.about,D);if(!x){b='<h2 id="sheetT">This note is gone</h2>';break}const st=jobState(x);
    b=`<div class="jmhead" style="--nc:${noteOf(x)}">${isOrg(x.owner)?'':`<span class="jmprice">₹${fmt(x.price)}</span>`}<h2 id="sheetT">${esc(x.text)}</h2></div>
      <div class="chips">${[x.when,x.where].filter(Boolean).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}<span class="chip">${{open:'Open',assigned:'Taken',done:'Done',closed:'Closed',expired:'Ended'}[st]||''}</span></div>
      <p class="note">Pinned ${since(x.at)} on the ${esc(campusName(x.campus))} board.</p><button class="btn2" data-act="closeSheet">Close</button>`;break}
  case'ratings':{const u=s.about,rt=stats(u,D),me=u===S.me.id,l=reviewsOf(u);
    const box=(t,x)=>x.n?`<div class="box stack" style="gap:8px"><span class="formlabel">${t} · from ${x.n} ${x.n===1?'rating':'ratings'}</span>${x.per.map(c=>`<div class="critrow"><span>${c.l}</span><span class="critbar"><span style="width:${(c.v/5*100).toFixed(0)}%"></span></span><b>${c.v.toFixed(1)}</b></div>`).join('')}</div>`:'';
    b=`<h2 id="sheetT">${me?'Your ratings':esc(shortName(u))+'’s ratings'}</h2><div class="stack" style="gap:14px">${box('As a doer',rt.doer)}${box('As a poster',rt.poster)}
      ${me?(l&&l.length?'<button class="btn2" data-go="reviews">Read your reviews</button>':''):reviewList(u)}</div>`;break}
  case'gig':{const x=D.jobByKey[s.key];if(!x||!x.pick){b='<h2 id="sheetT">This gig is no longer here</h2>';break}const pk=x.pick,pay=payOf(x),sent=sentOf(x),me=S.me.id,done=pk.status==='done';
    const row=(l,v)=>`<div class="gigrow"><span>${l}</span><b>${v}</b></div>`;
    b=`<p class="gigtag${done?' done':''}">${done?'Completed':'In progress'}</p><h2 id="sheetT">${esc(x.text)}</h2>
    <div class="gigrows">${row('Agreed','₹'+fmt(x.agreed||x.price))}${x.where||x.when?row('Where · when',esc([x.where,x.when].filter(Boolean).join(' · '))):''}${row('Posted by',x.owner===me?'You':esc(shortName(x.owner)))}${row('Done by',x.accepted===me?'You':esc(shortName(x.accepted)))}${row('Started',stamp(num(pk.at)||x.takenAt))}${done?row('Completed',stamp(num(pk.doneAt)||x.doneAt)):''}${PAY_ON?row('Payment',pay?.ok?'Paid':sent?'Sent, waiting for them to confirm':pay&&!pay.ok?'Not arrived yet':'Not paid yet'):''}</div>
    <button class="cta" data-gigopen="${esc(x.key)}">Open the job</button>`;break}
  case'msgmenu':{const m=chatMsg(s.mid);if(!m){b='<h2 id="sheetT">This message is gone</h2>';break}const mine=m.reactions?.[S.me.id];
    b=`<p id="sheetT" class="msgprev">${esc(msgSnip(m))}</p><p class="msgwhen">${m.by===S.me.id?'Sent':'Received'} ${stamp(m.at)}</p><div class="rxpick" role="group" aria-label="React">${REACTS.map(e=>`<button class="${mine===e?'on':''}" data-act="reactMsg" data-to="${m.id}" data-e="${e}" aria-label="React with ${e}" aria-pressed="${mine===e}">${e}</button>`).join('')}</div>
    <div class="menu"><button data-act="replyMsg" data-to="${m.id}">${ic('reply',18)} Reply</button>${m.kind==='text'?`<button data-act="copyMsg" data-to="${m.id}">${ic('copy',18)} Copy</button>`:''}${m.by===S.me.id?`<button class="danger" data-act="unsendMsg" data-to="${m.id}">${ic('trash',18)} Unsend</button>`:''}</div>`;break}
  case'who':{const u=s.about,rs=restricted().includes(u),bl=arr(S.priv.blocked).includes(u),fn=esc(firstName(u));
    b=`<h2 id="sheetT">${esc(shortName(u))}</h2>
    <div class="menu whomenu">
      <button data-act="${rs?'unrestrict':'restrict'}" data-uid="${esc(u)}">${ic('eyeoff',18)}<span class="rowtext"><span class="t1">${rs?'Unrestrict':'Restrict'}</span><span class="t2">${rs?`${fn} can see when you’re online again.`:`${fn} won’t see when you’re online or be able to send you offers. Chats about jobs still work. They aren’t told.`}</span></span></button>
      <button class="danger" data-act="${bl?'unblock':'blockWho'}" data-uid="${esc(u)}">${ic('ban',18)}<span class="rowtext"><span class="t1">${bl?'Unblock':'Block'}</span><span class="t2">${bl?`You’ll see ${fn}’s jobs, bids and messages again.`:`You won’t see ${fn}’s jobs, bids or messages, and they can’t see when you’re online. They aren’t told.`}</span></span></button>
      <button class="danger" data-sheet="report" data-about="${esc(u)}">${ic('flag',18)}<span class="rowtext"><span class="t1">Report</span><span class="t2">The organiser looks at it. ${fn} isn’t told who reported.</span></span></button></div>`;break}
  case'pick':b=`<h2 id="sheetT">Pick ${esc(firstName(s.uid))} for ₹${fmt(s.amt)}?</h2><p>The job leaves the board and you two can sort out the details in chat. Pay them directly, in cash or UPI, once it\u2019s done.</p>
    <button class="cta" data-act="confirmPick">Pick ${esc(firstName(s.uid))}</button><button class="linkbtn" data-act="closeSheet">Not yet</button>`;break;
  case'done':case'ratePoster':{const side=s.type==='done'?'d':'p',who=j?(side==='d'?j.accepted:j.owner):null,fn=esc(who?firstName(who):'them');
    const vals=['a','b','c','d'].map(x=>S.rate[x]),filled=vals.filter(Boolean),avg=filled.length===4?(vals.reduce((a,b)=>a+b,0)/4).toFixed(1):null;
    b=`<h2 id="sheetT">${side==='d'?`How did ${fn} do?`:`How was ${fn} as a poster?`}</h2>
    <p>Rate each from 1 to 5. Their profile shows only the averages, never your name or the job.</p>
    <div class="stack" style="gap:12px">${CRIT[side].map(([k,l,h],i)=>{const x='abcd'[i];return`<div class="critpick"><span class="rowtext"><span class="t1">${l}</span><span class="t2">${h}</span></span>
      <span class="stars sm" role="group" aria-label="${l}">${[1,2,3,4,5].map(n=>`<button class="star ${S.rate[x]>=n?'on':''}" data-star="${x}${n}" aria-label="${l}: ${n} of 5" aria-pressed="${S.rate[x]>=n}">${ic('star',16,2,'currentColor',S.rate[x]>=n?'currentColor':'none')}</button>`).join('')}</span></div>`}).join('')}</div>
    <div class="overall"><span>Overall</span><b>${avg?'★'+avg:'–'}</b></div>
    ${side==='d'&&!j?.pick?.review?reviewFields(fn):''}
    <input id="rateT" class="inp" maxlength="200" placeholder="Private note to ${fn} (optional)" value="${esc(S.rate.text)}" data-bind="rate.text" aria-label="Private note">
    <p class="note" style="text-align:left">Only ${fn} sees your note. Something felt unsafe? <button class="linkbtn" style="padding:0" data-sheet="report" data-about="${esc(who||'')}">Report it</button> instead.</p>
    ${S.err.rate?`<p class="err">${esc(S.err.rate)}</p>`:''}<button class="cta" data-act="${side==='d'?'confirmDone':'confirmRatePoster'}" data-need="rate" ${S.busy?'disabled':''}>${side==='d'?(j&&j.status==='done'?'Save rating':'Mark as done'):'Save rating'}</button>`;break}
  case'close':b=`<h2 id="sheetT">Close this job?</h2><p>It comes off the board. Bids on it are kept so people can see it closed.</p>
    <button class="cta" data-act="confirmClose">Close job</button><button class="linkbtn" data-act="closeSheet">Keep it open</button>`;break;
  case'review':{const fn=esc(j?firstName(j.accepted):'them');
    b=`<h2 id="sheetT">Review ${fn}</h2>${reviewFields(fn)}${S.err.rate?`<p class="err">${esc(S.err.rate)}</p>`:''}
    <button class="cta" data-act="postReview" data-need="review" ${S.busy?'disabled':''}>${S.busy?'Posting…':'Post review'}</button><button class="linkbtn" data-act="closeSheet">Not now</button>`;break}
  case'iosPush':b=`<h2 id="sheetT">Add tack to your Home Screen</h2><p>On iPhone, notifications only work when tack is opened from your Home Screen.</p>
    <ol class="howto"><li>In Safari, tap the Share button.</li><li>Choose Add to Home Screen.</li><li>Open tack from your Home Screen, go to Me and turn on Notifications.</li></ol>
    <button class="cta" data-act="closeSheet">Got it</button>`;break;
  case'delReview':b=`<h2 id="sheetT">Delete this review?</h2><p>It comes off ${esc(firstName(s.about))}'s profile for good. It can't be written again for this job.</p>
    <button class="cta destructive" data-act="confirmDelReview">Delete review</button><button class="linkbtn" data-act="closeSheet">Keep it</button>`;break;
  case'blocked':b=`<h2 id="sheetT">That can\u2019t go on tack</h2><p>Your ${esc(MOD_AREA[s.area]||'post')} includes words about ${esc(MOD_CAT[s.cat]||'something that isn\u2019t allowed')}, which tack doesn\u2019t allow. Nothing was posted.</p>
    <div class="modwarn"><b>This attempt has been recorded${s.n>1?` (${s.n} so far)`:''}.</b> Repeated attempts to post hate, abuse or illegal content can get your account removed from tack.</div>
    <button class="cta" data-act="closeSheet">Edit it</button><button class="linkbtn" data-doc="terms">Read the rules</button>`;break;
  case'pic':{const l=S.pics[s.k]||[],src=l[s.i];
    b=`<h2 id="sheetT" class="sr">Photo ${s.i+1} of ${l.length}</h2>${src?`<img class="bigpic" src="${src}" alt="Photo ${s.i+1} of ${l.length}">`:''}
    ${l.length>1?`<button class="btn2" data-act="nextPic">Show photo ${(s.i+1)%l.length+1} of ${l.length}</button>`:''}<button class="linkbtn" data-act="closeSheet">Close</button>`;break}
  case'remove':b=`<h2 id="sheetT">Take this job off the board?</h2><p>Use this for jobs that break the rules. The poster sees it marked as removed.</p>
    <button class="cta destructive" data-act="confirmRemove">Remove job</button><button class="linkbtn" data-act="closeSheet">Cancel</button>`;break;
  case'uninvite':b=`<h2 id="sheetT">Remove ${esc(s.about)}?</h2><p>They can't sign up with this email, and if they already joined they're locked out straight away and their jobs leave the board.</p>
    <button class="cta destructive" data-act="confirmUninvite">Remove</button><button class="linkbtn" data-act="closeSheet">Keep them</button>`;break;
  case'offer':{const o=S.offer,fn=esc(firstName(o.to));
    b=`<h2 id="sheetT">Hire ${fn} again</h2>
    <p>Only ${fn} sees this. If they accept, it becomes a job between you two, and you can chat about it.</p>
    <textarea id="oft" class="inp" rows="2" maxlength="200" style="resize:none" placeholder="Grab my print-outs from Sai Xerox on your way back?" data-bind="offer.text" aria-label="What do you need?">${esc(o.text)}</textarea>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><label class="field" for="ofp" style="flex:1 1 140px"><span class="fl">You'll pay ₹</span><input id="ofp" inputmode="numeric" maxlength="5" placeholder="60" value="${esc(o.price)}" data-bind="offer.price"></label>
      <input id="ofw" class="inp" style="flex:1 1 140px;border-radius:999px" maxlength="40" placeholder="Where? Gate 1" value="${esc(o.where)}" data-bind="offer.where" aria-label="Where"></div>
    <div class="chips" role="group" aria-label="By when">${WHENS.map(w=>`<button class="chip ${o.when===w?'on':''}" data-ofwhen="${w}" aria-pressed="${o.when===w}">${w}</button>`).join('')}</div>
    ${S.err.offer?`<p class="err">${esc(S.err.offer)}</p>`:''}
    <button class="cta" data-act="sendOffer" data-need="offer">Send to ${fn}</button>`;break}
  case'share':{const sj=D.jobByKey[s.key];if(!sj){b='<h2 id="sheetT">This job is gone</h2>';break}const img=S.shareImg?.key===s.key?S.shareImg.url:'';
    b=`<h2 id="sheetT">Share this job</h2>
    <div class="sharepreview">${img?`<img src="${img}" alt="Share image: ₹${fmt(sj.price)}, ${esc(sj.text)}">`:'<span class="pic wait"></span>'}</div>
    <div class="slogos">${slogo('wa','WhatsApp','data-act="shareTo" data-to="wa"')}${slogo('ig','Instagram','data-act="shareTo" data-to="ig"')}${navigator.share?slogo('share','More','data-act="shareTo" data-to="sys"'):''}${slogo('download','Save image','data-act="shareTo" data-to="save"')}${slogo('link','Copy link','data-act="shareTo" data-to="copy"')}</div>`;break}
  case'crop':{const c=S.crop;if(!c){b='';break}
    b=`<h2 id="sheetT">${c.target==='banner'?'Crop your banner':'Crop your photo'}</h2>
    <div id="cropBox" class="cropbox ${c.target==='banner'?'wide':'round'}"><img id="cropImg" src="${c.url}" alt="" draggable="false"></div>
    <input id="cropZoom" class="cropzoom" type="range" min="1" max="4" step="0.01" value="${c.z}" aria-label="Zoom">
    <button class="cta" data-act="cropUse">${c.target==='banner'?'Use banner':'Use photo'}</button><button class="linkbtn" data-act="cropCancel">Cancel</button>`;break}
  case'repick':{if(!j||!j.accepted){b='';break}const dn=esc(firstName(j.accepted));
    b=`<h2 id="sheetT">Pick someone else?</h2><p>${dn} will stop being picked for this job and see that you chose someone else. The job stays off the board, and you can pick from the other bids.</p>
    <div class="chips" role="group" aria-label="Why">${['Didn’t show up','Can’t do it any more','Stopped replying','Something else'].map(r=>`<button class="chip ${S.repick===r?'on':''}" data-act="repickWhy" data-val="${esc(r)}" aria-pressed="${S.repick===r}">${esc(r)}</button>`).join('')}</div>
    <button class="cta" data-act="confirmRepick" ${S.repick?'':'disabled'}>Pick someone else</button>
    <button class="linkbtn" data-sheet="report" data-about="${esc(j.accepted)}" data-prewhy="No-show or didn’t pay">Report ${dn} instead</button>
    <button class="linkbtn" data-act="closeSheet">Keep ${dn}</button>`;break}
  case'paysafe':{if(!j||!upiOf(j)){b='<h2 id="sheetT">Payment</h2><p>This job has no UPI ID to pay yet.</p>';break}const dn=esc(firstName(j.accepted)),full=esc(shortName(j.accepted));
    b=`<h2 id="sheetT">Pay ${dn} ₹${fmt(j.agreed)}</h2>
    <ul class="safelist">
      <li>${ic('tick',14,3)}<span>Only pay once the work is done and you’ve checked it.</span></li>
      <li>${ic('tick',14,3)}<span>Your UPI app shows the name on the account. Check it says <b>${full}</b> before you pay.</span></li>
      <li>${ic('tick',14,3)}<span>Pay exactly ₹${fmt(j.agreed)}, the amount you agreed. Never send extra or a “refundable” deposit.</span></li>
      <li>${ic('tick',14,3)}<span>You never need your UPI PIN to receive money. Don’t approve requests you didn’t start.</span></li></ul>
    <div class="copyrow"><span>${esc(upiOf(j))}</span><button data-act="copy" data-text="${esc(upiOf(j))}">Copy</button></div>
    <a class="cta" href="${esc(upiLink(j))}">Open UPI app · ₹${fmt(j.agreed)}</a>
    <p class="note">On a computer? Pay to this UPI ID from any UPI app on your phone.</p>
    <div class="stack gap8"><label class="formlabel" for="payRef">UPI reference, after you pay <span class="labelhint">(optional, 12 digits)</span></label>
      <input id="payRef" class="inp" inputmode="numeric" maxlength="22" placeholder="e.g. 412345678901" value="${esc(S.pay.ref||'')}" data-bind="pay.ref"></div>
    <button class="btn2" data-act="markSent">I’ve paid ${dn}</button>`;break}
  case'jobmenu':{const mj=D.jobByKey[s.key];if(!mj){b='<h2 id="sheetT">This job is gone</h2>';break}const own=mj.owner===S.me.id,sv=isSaved(mj.key);
    b=`<div class="jmhead${gcls(mj)}" style="--nc:${noteOf(mj)}">${isOrg(mj.owner)?'':`<span class="jmprice">₹${fmt(mj.price)}</span>`}<h2 id="sheetT">${esc(mj.text.length>70?mj.text.slice(0,70)+'…':mj.text)}</h2></div>
    <div class="menu"><button data-act="openShare" data-key="${esc(mj.key)}">${ic('share',18)} Share</button>
      ${own?'':`<button data-act="toggleSave" data-key="${esc(mj.key)}">${ic('bookmark',18,2,'currentColor',sv?'currentColor':'none')} ${sv?'Remove from saved':'Save for later'}</button>`}
      ${own&&jobState(mj)==='open'?`<button data-act="editJob" data-key="${esc(mj.key)}">${ic('edit',18)} Edit</button>`:''}
      ${own?'':`<button class="danger" data-sheet="report" data-about="${esc(mj.owner)}">${ic('flag',18)} Report</button>`}</div>`;break}
  case'campus':{const q=(S.camp?.q||'').toLowerCase().trim(),l=campusList().filter(c=>c.n>0&&(!q||c.name.toLowerCase().includes(q)));
    b=`<h2 id="sheetT">Switch board</h2><input id="campQ" class="inp" autocomplete="off" placeholder="Search campuses" value="${esc(S.camp?.q||'')}" data-bind="camp.q">
    <div class="menu camplist">${l.length?l.map(c=>`<button data-act="viewCampus" data-id="${esc(c.id)}">${c.id===curCampus()?ic('tick',16,2.6,'var(--accent)'):'<span style="width:16px"></span>'} <span class="cn">${esc(c.name)}</span><span class="muted">${c.n} ${c.n===1?'member':'members'}</span></button>`).join(''):'<p class="note">No campus with members matches that.</p>'}</div>`;break}
  case'cnew':b=`<h2 id="sheetT">New board</h2><p>Start an invite-only board. You\u2019ll be its organiser.</p>
    <input id="cnName" class="inp" maxlength="40" placeholder="Name, e.g. Film club" value="${esc(S.cdraft.name)}" data-bind="cdraft.name">
    <input id="cnAbout" class="inp" maxlength="200" placeholder="What it\u2019s for (optional)" value="${esc(S.cdraft.about)}" data-bind="cdraft.about">
    ${S.err.cnew?`<p class="err">${esc(S.err.cnew)}</p>`:''}<button class="cta" data-act="comCreate">Create board</button>`;break;
  case'cinvite':b=`<h2 id="sheetT">Invite to ${esc(comName(S.cid))}</h2><p>Invite people by their tack username.</p>
    <label class="field hfield" for="ciIn"><span class="hat">@</span><input id="ciIn" maxlength="21" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="username" value="${esc(S.cdraft.handle)}" data-bind="cdraft.handle"></label>
    <div id="ciSugs" class="stack gap8">${ciSugsHTML()}</div>
    ${S.err.cinv?`<p class="err">${esc(S.err.cinv)}</p>`:''}<button class="cta" data-act="comInvite">Send invite</button>`;break;
  case'cjoin':{const c=S.coms[s.about],iv=S.cinv[s.about];b=`<h2 id="sheetT">${esc(c?.name||'Board')}</h2>${c?.about?`<p>${esc(c.about)}</p>`:''}<p>${esc(shortName(iv?.by))} invited you to this board.</p>
    <button class="cta" data-act="comJoin" data-id="${esc(s.about)}">Join board</button><button class="btn2" data-act="comDecline" data-id="${esc(s.about)}">Decline</button>`;break}
  case'cmembers':{const id=S.cid,owner=comOwner(id),me=S.me.id,l=Object.entries(S.cmembers).sort((a,b)=>(a[1]==='owner'?-1:1)-(b[1]==='owner'?-1:1));
    b=`<h2 id="sheetT">Members</h2><div class="menu cmlist">${l.map(([u,r])=>`<div class="cmrow">${face(u,30)}<span class="cn">${esc(shortName(u))}${r==='owner'?' <span class="muted">· organiser</span>':''}</span>${owner&&r!=='owner'?`<button class="ghostbtn" data-act="comKick" data-uid="${esc(u)}">Remove</button>`:''}</div>`).join('')}</div>
    ${owner?'<button class="linkbtn danger" data-act="comDelete">Delete this board</button>':'<button class="linkbtn" data-act="comLeave">Leave this board</button>'}`;break}
  case'cnoteNew':b=`<h2 id="sheetT">Add a note</h2>
    <textarea id="cnText" class="inp" rows="3" maxlength="400" placeholder="What do you want to share?" data-bind="cdraft.text">${esc(S.cdraft.text)}</textarea>
    <textarea id="cnMore" class="inp" rows="2" maxlength="600" placeholder="More details (optional)" data-bind="cdraft.more">${esc(S.cdraft.more)}</textarea>
    <div class="ccolors" role="group" aria-label="Note colour">${['#7FA2FF','#C6F24E','#FF7AD1','#FFC53D','#4FE3E0','#FF8A5B'].map(x=>`<button class="ccol ${S.cdraft.color===x?'on':''}" data-act="cnoteColor" data-c="${x}" style="--nc:${x}" aria-label="Colour"></button>`).join('')}</div>
    ${S.err.cnote?`<p class="err">${esc(S.err.cnote)}</p>`:''}<button class="cta" data-act="cnoteAdd">Pin it</button>`;break;
  case'invitefriend':{const c=S.lastCode,jt=`Join me on tack, the ${campus()} board for quick jobs and favours. Sign up with your college email:\n${SITE}`;
    b=!S.me.isOwner?`<h2 id="sheetT">Invite a friend</h2><p>Anyone from ${esc(campus())} can join with their college email. Send them the link.</p>
      <div class="copyrow"><span>${esc(SITE)}</span></div>
      <div class="slogos">${slogo('wa','WhatsApp',`href="https://wa.me/?text=${encodeURIComponent(jt)}" target="_blank" rel="noopener"`)}${slogo('ig','Instagram',`data-act="igText" data-text="${esc(jt)}"`)}</div>
      <button class="linkbtn" data-act="closeSheet">Done</button>`
     :`<h2 id="sheetT">Invite a friend</h2><p>Each link works for one person. They sign up with any email. You're vouching for them, so only invite people you know.</p>
      ${c?codeShare(c):`<button class="cta noglow" data-act="makeCode">Create invite link</button>`}
      ${c?'<button class="linkbtn" data-act="makeCode">Make another link</button>':''}`;break}
  case'reshare':b=`<h2 id="sheetT">Send the invite again</h2><p>${esc(s.about)}</p>${shareButtons(s.about)}<button class="linkbtn" data-act="closeSheet">Done</button>`;break;
  case'report':b=`<h2 id="sheetT">Report ${esc(shortName(s.about))}</h2><p>${esc(organiser())} sees your report and can read chats with them.</p>
    <div class="chips" role="group" aria-label="Reason">${REASONS.map(r=>`<button class="chip ${S.rep.why===r?'on':''}" data-why="${esc(r)}" aria-pressed="${S.rep.why===r}">${esc(r)}</button>`).join('')}</div>
    <input id="repN" class="inp" maxlength="200" placeholder="What happened? (optional)" value="${esc(S.rep.note)}" data-bind="rep.note" aria-label="What happened">
    <label class="check" for="repB"><input type="checkbox" id="repB" data-bind="rep.block" ${S.rep.block?'checked':''}> Also block them. You won't see their jobs, bids or messages, and they can't see when you're online.</label>
    ${S.err.rep?`<p class="err">${esc(S.err.rep)}</p>`:''}<button class="cta" data-act="confirmReport" data-need="report">Send report</button>
    <button class="linkbtn" data-act="blockOnly">Just block them</button>`;break;
  case'erase':b=`<h2 id="sheetT">Delete your account?</h2><p>This erases your profile, the jobs you pinned, your bids, ratings you gave and your messages, and removes your login. It can't be undone.</p>
    <div class="stack gap8"><label class="formlabel" for="erPw">Your password</label>
    <input id="erPw" class="inp" type="password" autocomplete="current-password" value="${esc(S.erase.pw)}" data-bind="erase.pw"></div>
    ${S.err.erase?`<p class="err" role="alert">${esc(S.err.erase)}</p>`:''}
    <button class="cta destructive" data-act="confirmErase" data-need="erase" ${S.busy?'disabled':''}>${S.busy?'Deleting…':'Delete everything'}</button><button class="linkbtn" data-act="closeSheet">Keep my account</button>`;break;
  }
  return`<div class="scrim" data-act="closeSheet"></div><div class="sheet sheet-${s.type}" role="dialog" aria-modal="true" aria-labelledby="sheetT">${b}</div>`;
}

const VIEWS={cboard:viewCBoard,cnote:viewCNote,board:viewBoard,job:viewJob,post:viewPost,bids:viewBids,chats:viewChats,chat:viewChat,me:D=>viewPerson(S.me.id,D),person:D=>viewPerson(S.personOf,D),privacy:viewSettings,settings:viewSettings,help:viewHelp,invites:viewInvites,saved:viewSaved,reviews:viewReviews,review:viewReview,edit:()=>`<div class="pad">${onboardHTML(true)}</div>`};
let lastView=null,lastSheet=null;const scrollMem={};
const INTRO=[
  {k:'board',t:'This is the board.',b:'Classmates pin small jobs here. A print run, a lift down four floors, an hour of help before a deadline. People you’ve made a deal with show up at the top when they’re online.'},
  {k:'pin',t:'Need something? Pin it.',b:'Write it on a note, set a price, pick a colour. It goes up for everyone on campus to see.'},
  {k:'bid',t:'Bid what it’s worth.',b:'Name your price and pitch yourself in a line. Only the poster sees your bid.'},
  {k:'pick',t:'Get picked. Sort it out in chat.',b:'The poster picks one person and you plan it in chat. You pay each other directly, in cash or UPI. tack never touches the money.'},
  {k:'safe',t:'Keep it safe.',b:'tack is for students who are 18 or older. No assignments or exam work. Report or block anyone in two taps, and abusive posts never go up.'},
  {k:'rate',t:'Rate each other.',b:'When it’s done, you both rate the other. Profiles show the averages, never who gave them.'},
  {k:'end'}];
const inote=(h,p,t,meta,cls='',st='')=>`<span class="inote ${cls}" style="--h:${h};${st}"><span class="ipinhead"></span><b>${p}</b><i>${t}</i>${meta?`<em>${meta}</em>`:''}</span>`;
function introScene(k){const me=S.me?.id;
  if(k==='board')return`<div class="isc isc-board" aria-hidden="true">
    ${inote(128,'₹120','Print 40 pages at Sai Xerox','Gate 1 · Today','n1')}${inote(262,'₹300','20 photos at golden hour','Lawn · Tomorrow','n2')}${inote(350,'₹60','Parcel from Gate 1','Hostel B · Now','n3')}
    <span class="ichip c1"><span class="ilive"></span>Online now</span></div>`;
  if(k==='pin')return`<div class="isc isc-pin" aria-hidden="true">
    <span class="inote ibig"><span class="ipinhead"></span><b class="iprice">₹150</b><i class="itype">Xerox 40 pages by 5</i><em>Design block · Now</em></span>
    <span class="ihue"><span class="ithumb"></span></span><span class="ipinit">Pin it</span></div>`;
  if(k==='bid')return`<div class="isc isc-bid" aria-hidden="true">${inote(75,'₹150','Help me move a cupboard','','n1')}
    <span class="ibubble c1">${me?face(me,28):''}<b>₹120</b><span>I can do it by 5</span></span><span class="ichip c2">${ic('shield',13,2.2)} Only the poster sees this</span></div>`;
  if(k==='pick')return`<div class="isc isc-pick" aria-hidden="true">
    <span class="iwho w1">${me?face(me,52):''}</span><span class="ilink"></span><span class="iwho w2"><span class="av av-empty" style="width:52px;height:52px;font-size:20px">S</span></span>
    <span class="ibubble c1 msg">On my way. 10 minutes.</span>
    <span class="ipay c2"><span class="ipayrow"><span>Done · ₹120</span><span class="iok">${ic('tick',13,3)} Rated</span></span></span></div>`;
  if(k==='safe')return`<div class="isc isc-safe" aria-hidden="true"><span class="ishield">${ic('shield',44,1.8)}</span>
    <span class="irules"><span class="ichip r1">18+ only</span><span class="ichip r2">No assignments or exams</span><span class="ichip r3">${ic('flag',12,2.2)} Report or block in two taps</span></span></div>`;
  if(k==='rate')return`<div class="isc isc-rate" aria-hidden="true"><span class="istars">${[0,1,2,3,4].map(i=>`<span class="ist" style="--i:${i}">${ic('star',30,2,'currentColor','currentColor')}</span>`).join('')}</span>
    <span class="ichip c2">${ic('shield',13,2.2)} Anonymous, always</span></div>`;
  return`<div class="isc isc-end" aria-hidden="true"><span class="iicon"></span></div>`}
function introPushState(){if(IOS_APP)return NPush?(pushOn()?'on':'ask'):'none';if(pushOn())return'on';if(isIOS()&&!standalone())return'ios';return pushReady()?'ask':'none'}
function introSlideHTML(i){const sl=INTRO[i],fn=esc(S.me?firstName(S.me.id):'');
  if(sl.k!=='end')return`${introScene(sl.k)}<div class="itext"><span class="ik">${i+1} of ${INTRO.length-1}</span><h1 class="ia">${sl.t}</h1><p class="ib">${sl.b}</p></div>`;
  const ps=introPushState();
  return`${introScene('end')}<div class="itext"><h1 class="ia">You’re in${fn?', '+fn:''}.</h1>
    <p class="ib">${ps==='on'?'Pin something you need, or find something to do. The board is yours.':ps==='ios'?'One last thing. To get a ping when someone bids or picks you, add tack to your Home Screen: tap Share, then Add to Home Screen, and open tack from there.':ps==='ask'?'One last thing. Turn on notifications so you know the moment someone bids, picks you or messages.':'Pin something you need, or find something to do. The board is yours.'}</p></div>`}
function introFoot(i){const last=INTRO[i].k==='end',ps=introPushState();
  if(!last)return`<button class="cta inext" data-act="introNext">${i===INTRO.length-2?'Got it':'Next'}</button>`;
  return ps==='ask'?`<button class="cta inext" data-act="introPush">${ic('bell',16)} Turn on notifications</button><button class="btn2 inext2" data-act="introPost">Pin my first job</button><button class="linkbtn inow" data-act="introDone">Not now</button>`
    :`<button class="cta inext" data-act="introDone">Show me the board</button><button class="btn2 inext2" data-act="introPost">Pin my first job</button>`}
let introAnim=null;
function renderIntro(dir=1){let r=$('introRoot');
  if(!S.intro.on){if(r){const w=r.firstElementChild;if(reduceMotion.matches||!w)r.remove();else w.animate([{opacity:1},{opacity:0}],{duration:220,easing:'ease',fill:'forwards'}).finished.then(()=>r.remove(),()=>r.remove())}return}
  const i=S.intro.i,last=INTRO[i].k==='end';
  if(!r){r=document.createElement('div');r.id='introRoot';document.body.appendChild(r);
    let x0=null;r.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});
    r.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>50)introStep(dx<0?1:-1)},{passive:true});
    r.innerHTML=`<div class="iw" role="dialog" aria-modal="true" aria-label="How tack works">
      <div class="itop"><span class="mark">tack</span><button class="linkbtn iskip" data-act="introSkip">Skip</button></div>
      <div class="istage"><div class="islide">${introSlideHTML(i)}</div></div>
      <div class="ifoot"><div class="idots" aria-hidden="true">${INTRO.slice(0,-1).map(()=>'<span></span>').join('')}</div><div class="ibtns">${introFoot(i)}</div></div></div>`;
    if(!reduceMotion.matches)r.firstElementChild.animate([{opacity:0},{opacity:1}],{duration:260,easing:'ease'});
    r.dataset.i=i}
  else if(+r.dataset.i!==i){r.dataset.i=i;const stage=r.querySelector('.istage');
    if(introAnim){introAnim.finish()}
    const old=stage.querySelector('.islide:not(.gone)'),nx=document.createElement('div');nx.className='islide';nx.innerHTML=introSlideHTML(i);
    if(reduceMotion.matches||!old){old?.remove();stage.appendChild(nx)}
    else{old.classList.add('gone');nx.classList.add('wait');nx.style.opacity='0';stage.appendChild(nx);
      const a=old.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${-28*dir}px)`}],{duration:180,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
      const done=()=>{old.remove();nx.style.opacity='';nx.classList.remove('wait');introAnim=null};
      introAnim={finish:()=>{a.cancel();done()}};
      a.finished.then(()=>{if(!introAnim)return;done();nx.animate([{opacity:0,transform:`translateX(${28*dir}px)`},{opacity:1,transform:'translateX(0)'}],{duration:280,easing:'cubic-bezier(.2,.8,.2,1)'})},()=>{})}}
  r.querySelectorAll('.idots span').forEach((d,j)=>d.classList.toggle('on',j===i));
  r.querySelector('.idots').style.visibility=last?'hidden':'';
  r.querySelector('.iskip').style.visibility=last?'hidden':'';
  const fb=r.querySelector('.ibtns'),fh=introFoot(i);if(fb.dataset.h!==fh){const had=!!fb.dataset.h;fb.dataset.h=fh;fb.innerHTML=fh;if(had&&last&&!reduceMotion.matches)fb.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:320,delay:250,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'})}
  requestAnimationFrame(()=>r.querySelector('.inext')?.focus({preventScroll:true}))}
// New members pick dark or light first, then see the intro.
let themePick=null;
function openThemePick(then){if(themePick)return;themePick={sel:themePref()||(lightMQ.matches?'light':'dark'),then};applyTheme(themePick.sel);renderThemePick()}
function renderThemePick(){let r=$('themeRoot');
  if(!themePick){if(r)r.remove();return}
  const sel=themePick.sel,opt=k=>`<button class="tpopt ${sel===k?'on':''}" data-act="pickTheme" data-k="${k}" aria-pressed="${sel===k}"><span class="tpprev tp-${k}" aria-hidden="true"><i></i><i></i><i></i><i></i><b></b></span>${k==='dark'?'Dark':'Light'}</button>`;
  const html=`<div class="iw" role="dialog" aria-modal="true" aria-labelledby="tpT"><div class="itop"><span class="mark">tack</span></div>
    <div class="tpbody"><h1 id="tpT">Dark or light?</h1><p>Pick how tack looks. You can switch any time on your profile.</p><div class="tpopts">${opt('dark')}${opt('light')}</div></div>
    <div class="ifoot"><div class="ibtns"><button class="cta inext" data-act="themeDone">Continue</button></div></div></div>`;
  if(!r){r=document.createElement('div');r.id='themeRoot';document.body.appendChild(r);r.innerHTML=html;if(!reduceMotion.matches)r.firstElementChild.animate([{opacity:0},{opacity:1}],{duration:260,easing:'ease'})}
  else r.innerHTML=html}
function openIntro(back){if(S.intro.on)return;if(S.momentOn||S.joining){setTimeout(()=>openIntro(back),200);return}if(!back&&!S.priv.theme&&!themePref()&&!themePick){openThemePick(()=>openIntro());return}if(themePick)return;S.intro={on:true,i:0,back:back||null};renderIntro()}
function introStep(d){const i=S.intro.i+d;if(i<0||i>=INTRO.length)return;S.intro.i=i;renderIntro(d)}
function closeIntro(to){const back=S.intro.back;S.intro={on:false,i:0};renderIntro();if(!S.priv.introSeen)savePriv({introSeen:Date.now()});go(to||back||'board')}
function moment(title,sub,ms=1300){
  const r=document.createElement('div');r.className='momentroot';r.setAttribute('role','status');
  r.innerHTML=`<div class="moment"><span class="bigpin"></span><h2>${esc(title)}</h2>${sub?`<p>${esc(sub)}</p>`:''}</div>`;
  document.body.appendChild(r);S.momentOn=true;const t=reduceMotion.matches?Math.min(ms,700):ms;
  return new Promise(res=>setTimeout(()=>{r.classList.add('out');setTimeout(()=>{r.remove();S.momentOn=false;res();if(S.phase==='app')render()},reduceMotion.matches?0:260)},t))}
function stepsCard(D){if(!S.priv.introSeen||S.priv.stepsHidden||S.priv.stepsDone)return'';const me=S.me.id,d=S.myDoc||{};
  const steps=[[!!d.photo,'Add a profile photo','A real face helps people say yes.','data-go="edit"'],...(IOS_APP&&!NPush?[]:[[pushOn(),'Turn on notifications','Know the moment someone bids, picks you or messages.','data-act="pushOn"']]),
    [D.jobs.some(j=>j.owner===me)||Object.keys(S.pitchMine).length>0,'Pin or bid on a job','The first one is the hardest.','data-go="post"']];
  const n=steps.filter(x=>x[0]).length;
  // Once all three are done the card is gone for good, even if a step is undone later.
  if(n===steps.length){if(!S.stepsSaving){S.stepsSaving=true;setTimeout(()=>savePriv({stepsDone:Date.now()}))}return''}
  return`<section class="steps" aria-label="Your first steps"><div class="stepshead"><b>Your first steps</b><span>${n} of ${steps.length} done</span><button class="iconbtn" data-act="hideSteps" aria-label="Hide first steps">${ic('x',14,2.4)}</button></div>
    <div class="stepbar"><span style="width:${Math.round(n/steps.length*100)}%"></span></div>
    ${steps.map(([done,t,h,at])=>`<button class="step ${done?'done':''}" ${done?'disabled':at}><span class="stepdot">${done?ic('tick',12,3.2):''}</span><span class="rowtext"><span class="t1">${t}</span><span class="t2">${done?'Done':h}</span></span>${done?'':`<span class="chev">${ic('chev',16)}</span>`}</button>`).join('')}</section>`}
const NEED={
  signup:()=>S.form.name.trim().length>=2&&validEmail(S.form.email.trim())&&S.form.pw.length>=8,
  login:()=>validEmail(S.form.email.trim())&&!!S.form.pw,
  reset:()=>validEmail(S.form.email.trim()),
  handle:()=>S.hcheck?.st==='ok',
  join:()=>(S.hcheck?.st==='ok')&&S.onb.name.trim().length>=2&&!!S.onb.year&&!!S.onb.branch.trim()&&!!S.onb.adult&&!!S.onb.rules,
  profile:()=>(handleLockedUntil()||['ok','mine'].includes(S.hcheck?.st||'mine'))&&!!S.onb.year&&!!S.onb.branch.trim(),
  bid:()=>{const a=digits(S.bid.amt);return a>=1&&a<=50000},
  post:()=>{const p=digits(S.draft.price);return S.draft.text.trim().length>=8&&S.draft.text.length<=NOTE_MAX&&p>=10&&p<=20000},
  rate:()=>!!(S.rate.a&&S.rate.b&&S.rate.c&&S.rate.d),
  review:()=>S.rate.rev.trim().length>=3,
  offer:()=>{const p=digits(S.offer.price);return S.offer.text.trim().length>=6&&p>=10&&p<=20000},
  report:()=>!!S.rep.why,
  erase:()=>!!S.erase.pw,
  invite:()=>validEmail(S.inv.email.trim().toLowerCase()),
};
Object.assign(NEED,NEED_EXTRA);
function syncNeed(){document.querySelectorAll('[data-need]').forEach(b=>{let ok=true;try{ok=!!NEED[b.dataset.need]?.()}catch{}b.classList.toggle('wait',!ok);if(ok)b.removeAttribute('aria-disabled');else b.setAttribute('aria-disabled','true')})}
let lastGate=null;
function gateHandoff(gate,m0){const mk=gate.querySelector('.mark');if(!mk)return;const m1=mk.getBoundingClientRect();
  const dx=(m0.left+m0.width/2)-(m1.left+m1.width/2),dy=(m0.top+m0.height/2)-(m1.top+m1.height/2),k=m0.width/(m1.width||1);
  mk.animate([{transform:`translate(${dx}px,${dy}px) scale(${k})`},{transform:'none'}],{duration:720,easing:'cubic-bezier(.65,0,.25,1)'});
  const rest=[...mk.parentElement.children].filter(x=>x!==mk);
  rest.forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(18px) scale(.98)'},{opacity:1,transform:'none'}],{duration:520,delay:360+i*80,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}))}
function render(){
  queueMicrotask(syncNeed);queueMicrotask(renderTermsGate);
  const a=document.activeElement,fid=a&&a.id;let s0=null,s1=null;try{s0=a.selectionStart;s1=a.selectionEnd}catch{}
  const gate=$('gate'),app=$('app');
  if(S.phase!=='app'){
    const from=lastGate,m0=from==='loading'?gate.querySelector('.mark')?.getBoundingClientRect():null;
    app.hidden=true;gate.hidden=false;document.title='tack';gate.className='gate'+(['onboard','auth','campus'].includes(S.phase)?' scroll':'')+(S.phase==='onboard'?'':' anim');gate.innerHTML=gateHTML();$('sheetRoot').innerHTML='';lastView=null;
    if(m0&&S.phase!=='loading'&&!reduceMotion.matches)gateHandoff(gate,m0);lastGate=S.phase;
  }else{
    gate.hidden=true;app.hidden=false;if(gate.innerHTML)gate.innerHTML='';lastGate=null;
    const D=derive(),main=$('main');syncDealNames();if(S.me.isOwner)loadNames(D);if(jobParam&&!S.deepDone&&D.jobByKey[jobParam]){S.deepDone=true;S.openJob=jobParam;S.bid={key:null};S.view='job'}if(chatParam&&!S.chatDeep){const t=D.threads.find(x=>x.key===chatParam);if(t){S.chatDeep=true;setTimeout(()=>openThread(t),0)}}if(lastView&&lastView!==S.view)scrollMem[lastView]=main.scrollTop;
    const keep=lastView===S.view?main.scrollTop:((DEPTH[S.view]??1)===0?scrollMem[S.view]||0:0);
    main.dataset.view=S.view;main.innerHTML=((DEPTH[S.view]??1)===0?bannerHTML():'')+(VIEWS[S.view]||viewBoard)(D);main.scrollTop=keep;
    if(lastView!==S.view&&S.view==='chat')requestAnimationFrame(()=>{main.scrollTop=main.scrollHeight});
    if(S.navScroll&&S.navScroll.v===S.view){main.scrollTop=S.navScroll.y;S.navScroll=null}
    lastView=S.view;CUR=snap();nbCheck(D);
    $('rail').innerHTML=railHTML(D);
    const navOn=v=>S.view===v||(v==='board'&&['job','person'].includes(S.view))||(v==='chats'&&S.view==='chat')||(v==='me'&&['privacy','edit','settings','help'].includes(S.view))||(v==='invites'&&S.view==='invites');
    $('sidebar').innerHTML=`<div style="padding:0 6px"><div class="mark">tack</div><div class="sub"><span class="dot"></span><span>${S.me.isOwner?`<button class="campbtn" data-sheet="campus">${esc(campus())}${ic('chev',12,2.4)}</button>`:esc(campus())} · ${boardJobs(D).length} pinned</span></div></div>
      <button class="cta" data-go="post" style="padding:13px 10px;font-size:var(--t-16)">+ Pin a job</button>
      <nav style="display:flex;flex-direction:column;gap:3px" aria-label="Sections">${[['board','Board','board'],['bids','Activity','bids'],['chats','Chats','chat'],['saved','Saved','bookmark']].concat(S.me.isOwner?[['invites','Invites','users']]:[])
        .map(([v,l,i])=>`<button class="navitem ${navOn(v)?'on':''}" data-go="${v}" ${navOn(v)?'aria-current="page"':''}>${ic(i,18)} ${l}${v==='chats'&&D.unread?'<span class="udot" aria-label="Unread"></span>':''}${v==='bids'&&(D.toConfirm||D.offersWaiting||D.newNotes)?'<span class="udot" aria-label="New activity"></span>':''}</button>`).join('')}</nav>
      <button class="card" style="margin-top:auto;padding:10px 12px;border-radius:var(--r-sm)" data-go="me">${ring(S.me.id,38)}<span class="rowtext"><span style="font-size:var(--t-12);font-weight:600">${esc(shortName(S.me.id))}</span>
        <span style="font-size:var(--t-11);font-weight:500;color:var(--muted)">${esc(metaOf(S.me.id)||campus())}</span></span></button>`;
    $('tabbar').innerHTML=[['board','Board','board'],['bids','Activity','bids'],['post','','plus'],['chats','Chats','chat'],['saved','Saved','bookmark']].map(([v,l,i])=>v==='post'
      ?`<button class="tab" data-go="post" aria-label="Pin a job"><span class="fab">${ic('plus',24,3)}</span></button>`
      :`<button class="tab ${navOn(v)?'on':''}" data-go="${v}">${ic(i,20)}<span>${l}</span>${(v==='chats'&&D.unread)||(v==='bids'&&(D.toConfirm||D.offersWaiting||D.newNotes))?'<span class="udot"></span>':''}</button>`).join('');
    const attn=D.unread+D.offersWaiting+D.toConfirm+D.newNotes;document.title=attn?`(${attn}) tack`:'tack';
    const st=S.sheet?S.sheet.type:null;$('sheetRoot').innerHTML=sheetHTML(D);if(S.sheet?.type==='crop')requestAnimationFrame(cropApply);
    if(st&&st!==lastSheet)$('sheetRoot').classList.add('enter');else if(!st)$('sheetRoot').classList.remove('enter');
    if(st!==lastSheet&&st)requestAnimationFrame(()=>requestAnimationFrame(()=>$('sheetRoot').classList.remove('enter')));
    lastSheet=st;
    if(pendingLink){const l=pendingLink;pendingLink='';setTimeout(()=>openLink(l),0)}
  }
  syncNativeTabs();
  if(fid){const el=$(fid);if(el&&el!==document.activeElement){el.focus({preventScroll:true});try{if(s0!=null)el.setSelectionRange(s0,s1)}catch{}}}
}
// The iOS app draws the tab bar natively. The web bar keeps its space (invisible) so layouts don't move,
// and its CSS rules (hidden in chat, while typing) decide when the native bar shows.
const NTAB_ITEMS=[{key:'board',title:'Board',icon:'square.grid.2x2'},{key:'bids',title:'Activity',icon:'bell'},{key:'post',title:'Pin',icon:'plus.circle.fill'},{key:'chats',title:'Chats',icon:'bubble.left'},{key:'saved',title:'Saved',icon:'bookmark'}];
let ntLast='';
function syncNativeTabs(D){if(!NTabs)return;const tb=$('tabbar'),on=S.phase==='app'&&!!tb&&!$('app').hidden&&getComputedStyle(tb).display!=='none';
  let active='',dots=[];
  if(S.phase==='app'){D=D||derive();active=NTAB_ITEMS.some(x=>x.key===S.view)?S.view:['job','person'].includes(S.view)?'board':S.view==='chat'?'chats':'';
    if(D.unread)dots.push('chats');if(D.toConfirm||D.offersWaiting||D.newNotes)dots.push('bids')}
  const st={items:NTAB_ITEMS,active,dots,visible:on,dark:document.documentElement.dataset.theme!=='light'},k=JSON.stringify(st);
  if(k===ntLast)return;ntLast=k;Promise.resolve(NTabs.setTabs(st)).catch(e=>console.warn(e))}
whenPlug('TackNative',p=>{NTabs=p;document.documentElement.classList.add('nativetabs');ntLast='';
  NTabs.addListener('tab',e=>{const k=String(e&&e.tab||'');if(S.phase!=='app'||!NTAB_ITEMS.some(x=>x.key===k))return;S.sheet=null;go(k)});
  new MutationObserver(()=>syncNativeTabs()).observe(document.documentElement,{attributes:true,attributeFilter:['class','data-theme']});syncNativeTabs()});
const NB={since:0,seen:new Set(),q:[],on:null,t:0};
const nbKey=n=>n.at+'|'+n.who+'|'+n.html;
function nbCheck(D){const now=Date.now();
  if(!NB.since){NB.since=now;for(const n of D.notes)NB.seen.add(nbKey(n));return}
  for(const n of D.notes){const k=nbKey(n);if(NB.seen.has(k))continue;NB.seen.add(k);if(n.at>=NB.since-5e3&&n.at<=now+6e4&&S.view!=='bids')NB.q.push(n)}
  if(!NB.on)nbNext()}
function nbRoot(){let r=$('nbanners');if(!r){r=document.createElement('div');r.id='nbanners';r.className='nbanners';r.setAttribute('aria-live','polite');document.body.appendChild(r)}return r}
// A board invite can be answered right on the notice, in Activity or in the banner.
const actBtns=f=>f.mreq?`<span class="ninvbtns"><button class="pick" data-thread="${esc(f.mreq)}">Read</button><button class="ghostbtn" data-act="answerMsgReq" data-key="${esc(f.mreq)}" data-ok="0">Decline</button></span>`:f.fb?`<span class="ninvbtns"><button class="pick" data-act="follow" data-uid="${esc(f.fb)}">Follow back</button></span>`:invBtns(f.cinv);
const invBtns=id=>`<span class="ninvbtns"><button class="pick" data-act="comJoin" data-id="${esc(id)}">Accept</button><button class="ghostbtn" data-act="comDecline" data-id="${esc(id)}">Decline</button></span>`;
function nbNext(){const n=NB.q.shift();if(!n){NB.on=null;return}NB.on=n;const r=nbRoot(),go2=n.rev?`data-review="${esc(n.rev)}"`:n.job?`data-job="${esc(n.job)}"`:n.person?`data-person="${esc(n.person)}"`:`data-go="${n.go}"`;
  r.innerHTML=n.cinv||n.fb||n.mreq?`<div class="nbanner ninv" role="status">${ring(n.who,36)}<span class="nbbody"><span class="ntext">${n.html}</span>${actBtns(n)}</span></div>`:`<button class="nbanner" ${go2}>${n.who==='tack'?tackFace(36):ring(n.who,36)}<span class="ntext">${n.html}</span>${n.earn?`<b class="earn">+\u20b9${fmt(n.earn)}</b>`:''}${miniNote(n.job&&derive().jobByKey[n.job])}</button>`;
  const el=r.firstChild;let y0=null;
  el.addEventListener('pointerdown',e=>{y0=e.clientY});el.addEventListener('pointermove',e=>{if(y0!=null&&e.clientY-y0<-18){y0=null;nbHide()}});
  el.addEventListener('click',()=>{clearTimeout(NB.t);nbHide(true)});
  clearTimeout(NB.t);NB.t=setTimeout(()=>nbHide(),n.cinv||n.fb||n.mreq?9000:4500)}
function nbHide(now){const el=$('nbanners')?.firstChild;clearTimeout(NB.t);if(!el){nbNext();return}
  if(now||reduceMotion.matches){el.remove();setTimeout(nbNext,200);return}
  el.classList.add('out');el.addEventListener('animationend',()=>{el.remove();setTimeout(nbNext,250)},{once:true})}
let toastT;
function toast(msg){const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true},2800)}
const DEPTH={cboard:1,cnote:2,board:0,bids:0,chats:0,me:0,saved:0,invites:1,post:1,job:1,person:1,chat:1,privacy:1,settings:1,help:2,edit:2,reviews:1,review:2};
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const typingEl=e=>e&&(e.tagName==='TEXTAREA'||e.isContentEditable||(e.tagName==='INPUT'&&!['range','checkbox','radio','button','submit','file','color'].includes(e.type)));
let kbT=null;document.addEventListener('focusin',e=>{if(typingEl(e.target)){clearTimeout(kbT);document.documentElement.classList.add('typing')}});
document.addEventListener('focusout',()=>{clearTimeout(kbT);kbT=setTimeout(()=>{if(!typingEl(document.activeElement))document.documentElement.classList.remove('typing')},120)});
const kbBase={h:window.innerHeight};
function kbCheck(){const vv=window.visualViewport,h=window.innerHeight,vh=vv?vv.height*vv.scale:h;
  if(!typingEl(document.activeElement))kbBase.h=Math.max(kbBase.h,h);
  const open=typingEl(document.activeElement)&&(kbBase.h-vh>120||kbBase.h-h>120);document.documentElement.classList.toggle('kb',open)}
window.visualViewport?.addEventListener('resize',kbCheck);window.addEventListener('resize',kbCheck);
document.addEventListener('focusin',()=>setTimeout(kbCheck,300));document.addEventListener('focusout',()=>setTimeout(kbCheck,200));
window.addEventListener('orientationchange',()=>{kbBase.h=0;setTimeout(()=>{kbBase.h=window.innerHeight;kbCheck()},400)});
// Back follows the way you came. Every screen you leave is remembered with what it showed and how far you'd scrolled;
// the tabs (Board, Activity, Chats, Saved, Profile) start a fresh trail. Forms you've submitted aren't stepped back into.
const NAV=[];let CUR=null;
const snap=()=>({view:S.view,openJob:S.openJob,personOf:S.personOf,cid:S.cid,cnote:S.cnote,openRev:S.openRev,ptab:S.ptab,chat:S.chat?.key?{key:S.chat.key,other:S.chat.other,jobKey:S.chat.jobKey||null}:null});
const sameNav=(a,b)=>a.view===b.view&&({job:a.openJob===b.openJob,person:a.personOf===b.personOf,chat:a.chat?.other===b.chat?.other,cboard:a.cid===b.cid,cnote:a.cnote===b.cnote,review:a.openRev===b.openRev}[a.view]??true);
function goBack(fb='board'){const x=NAV.pop();if(!x){go(fb);return}
  S.navRestoring=true;S.navScroll={v:x.view,y:x.y||0};
  try{S.openJob=x.openJob;S.personOf=x.personOf;S.openRev=x.openRev;S.ptab=x.ptab||'notes';
    if(x.view==='chat'&&x.chat)openThread(x.chat);
    else if((x.view==='cboard'||x.view==='cnote')&&x.cid&&S.cid!==x.cid){S.cnote=x.cnote;openCom(x.cid);if(x.view==='cnote')go('cnote')}
    else{if(x.view==='cnote')S.cnote=x.cnote;go(x.view)}}
  finally{S.navRestoring=false}}
function go(v,keepThread){const restoring=!!S.navRestoring;
  if(!restoring&&S.phase==='app'){if((DEPTH[v]??1)===0)NAV.length=0;
    else if(CUR&&!['post','edit'].includes(CUR.view)&&!sameNav(CUR,{...snap(),view:v})){NAV.push({...CUR,y:$('main')?.scrollTop||0});if(NAV.length>40)NAV.shift()}}
  if(v==='job')S.tkSeen=null;if(v==='post'&&S.view!=='post')S.postEnter=true;
  const from=S.view;
  if(v!=='chat'&&!keepThread)closeThread();
  const apply=()=>{if(v==='post'&&from!=='post'&&(S.draft.editId||S.draft.cid)&&!S.editEnter)S.draft=blankDraft();S.editEnter=false;if(v==='bids'&&from!=='bids'){S.actSeenAt=num(S.priv.actSeen);setTimeout(()=>savePriv({actSeen:Date.now()}),0)}if((v==='person'||v==='me')&&from!==v&&!restoring)S.ptab='notes';S.view=v;S.sheet=null;S.omenu=null;S.err={};if(v==='help'&&from!=='help')S.help={kind:null,job:null,why:'',note:'',sent:null};if(v==='settings'){S.pwOpen=false}if(v==='person'||v==='me'){delete S.revs[v==='me'?S.me.id:S.personOf];S.allRevs=null}if(v==='edit'){seedOnb();S.hcheck={h:handleOf(S.me.id),st:'mine'}}if(v==='invites')S.inv.campus='';render();
    if(v==='board'&&from==='job'&&S.openJob){const p=document.querySelector(`.tile[data-job="${CSS.escape(S.openJob)}"] .price`);if(p)p.style.viewTransitionName='jp'}};
  if(from===v||S.phase!=='app'||!document.startViewTransition||reduceMotion.matches){apply();return}
  const d=(DEPTH[v]??1)-(DEPTH[from]??1),root=document.documentElement;
  root.dataset.nav=restoring?'back':d>0?'fwd':d<0?'back':'tab';
  const t=document.startViewTransition(apply);
  t.ready.catch(()=>{});t.updateCallbackDone.catch(()=>{});
  t.finished.catch(()=>{}).finally(()=>{document.querySelectorAll('.tile .price').forEach(e=>{e.style.viewTransitionName=''});delete root.dataset.nav});
}
function closeSheet(){
  const r=$('sheetRoot');if(!S.sheet)return;
  if(reduceMotion.matches){S.sheet=null;S.err={};render();return}
  r.classList.add('leave');setTimeout(()=>{r.classList.remove('leave');S.sheet=null;S.err={};render()},170);
}

function need(ok,key,msg){if(!ok){S.err={[key]:msg};render();return false}return true}
const ACT={
  noteWhite(){S.draft.white=true;$('jwhite')?.classList.add('on');syncNoteTone()},
  reload(){location.reload()},
  togglePw(){S.showPw=!S.showPw;render();$('fPw')?.focus()},
  logout(){logOut()},
  closeSheet(){closeSheet()},
  pushOn(){enablePush()},
  pushOff(){disablePush()},
  hideBanner(el){try{localStorage.setItem(el.dataset.k,'1')}catch{}render()},
  async resendVerify(){try{await sendVerify(S.user);S.form.otp='';S.err={};render();toast('New code sent. Check your inbox and spam.')}catch(e){toast(/rate|seconds/i.test(e?.message||'')?'Wait a minute before asking for another code.':authMsg(e))}},
  clearPhoto(){S.onb.photo='';render()},
  cropUse(){cropDone()},
  cropCancel(){if(S.crop)URL.revokeObjectURL(S.crop.url);S.crop=null;S.cropImg=null;S.sheet=null;render()},
  pickBanner(el){S.onb.banner=el.dataset.val||'';render()},
  async join(){const o=S.onb;
    if(!need(S.hcheck?.st==='ok','onb','Pick a username that’s available.'))return;
    if(!need(o.name.trim().length>=2,'onb','Add your full name.')||!need(o.year,'onb','Pick your year.')||!need(o.branch.trim(),'onb','Add your branch.')||!need(o.adult,'onb','tack is for students who are 18 or older.')||!need(o.rules,'onb','Agree to the Terms of Use and Privacy Policy to continue.'))return;
    if(modBlock('profile',o.name,o.does,o.branch))return;
    const h=S.hcheck.h;S.myName=o.name.trim().slice(0,60);
    try{await claimHandle(h)}catch(e){console.warn(e);S.hcheck={h,st:'taken'};S.err={onb:'That username was just taken. Try another.'};render();return}
    savePriv({terms:{v:TERMS_V,at:Date.now()}});
    saveMine(d=>{const x={...d,handle:h,handleAt:Date.now(),photo:o.photo||'',year:o.year,branch:o.branch.trim().slice(0,24),bio:o.does.trim().slice(0,BIO_MAX),does:o.does.trim().slice(0,60),ring:o.ring,adult:true,joinedAt:d.joinedAt||Date.now(),jobs:d.jobs||{}};delete x.name;return x});
    S.err={};S.view='board';S.joining=true;computePhase();render();
    moment(`You\u2019re on the board, ${o.name.trim().split(/\s+/)[0]}.`,'Give us a second to show you around.',1600).then(()=>{S.joining=false;if(!S.priv.introSeen)openIntro()})},
  async saveProfile(){const o=S.onb;if(!need(o.year,'onb','Pick your year.')||!need(o.branch.trim(),'onb','Add your branch.'))return;if(modBlock('profile',o.does,o.branch))return;
    let h=handleOf(S.me.id),hAt=num(S.myDoc?.handleAt);const want=S.hcheck?.h;
    if(want&&want!==h&&!handleLockedUntil()){if(S.hcheck.st!=='ok'){S.err={onb:'That username isn’t available.'};render();return}try{await claimHandle(want);h=want;hAt=Date.now()}catch(e){console.warn(e);S.err={onb:'That username was just taken. Try another.'};render();return}}
    saveMine(d=>{const x={...d,handle:h,handleAt:hAt||Date.now(),photo:o.photo||'',year:o.year,branch:o.branch.trim().slice(0,24),bio:o.does.trim().slice(0,BIO_MAX),does:o.does.trim().slice(0,60),banner:bannerOk(o.banner)?o.banner:'',ring:o.ring};delete x.name;return x});go('me');toast('Profile saved')},
  post(){const d=S.draft,text=d.text.trim(),price=digits(d.price);
    if(d.cid){if(!need(text.length>=2,'post','Write your note first.')||!need(text.length<=NOTE_MAX,'post','Keep the note to '+NOTE_MAX+' characters.'))return;if(modBlock('job',text,d.more,d.whereText))return;
      const id=rid(),cid=d.cid,pics=cleanPics(d.pics),where=(d.whereText.trim()||d.where).slice(0,40),at=Date.now();
      S.fb.setDoc(S.fb.doc(S.db,'cnotes',id),{community:cid,by:S.me.id,text:text.slice(0,400),more:d.more.trim().slice(0,600),color:d.white?NOTE_WHITE:hueHex(d.hue),at,when:d.when,where,...(pics.length?{pics:pics.length}:{})})
        .then(()=>pics.length?S.fb.setDoc(S.fb.doc(S.db,'cnotepics',id),{community:cid,pics}):null).catch(e=>{console.warn(e);toast('Couldn\u2019t pin it. Try again.')});
      if(pics.length)S.pics['c:'+id]=pics;S.draft=blankDraft();go('cboard');moment('Pinned.','',900);return}
    if(!need(text.length<=NOTE_MAX,'post','Keep the note to '+NOTE_MAX+' characters. Put the rest in the details.')||!need(text.length>=8,'post','Say what you need in a few more words.')||!need(price>=10&&price<=20000,'post','Set a price between ₹10 and ₹20,000.'))return;
    if(modBlock('job',text,d.more,d.whereText))return;
    if(d.editId){const id=d.editId,key=S.me.id+'~'+id,old=(S.myDoc?.jobs||{})[id];if(!old||old.status!=='open'){toast('This job can\u2019t be edited any more.');S.draft=blankDraft();go('job');return}
      const where=(d.whereText.trim()||d.where).slice(0,40),pics=cleanPics(d.pics),now=Date.now(),hadPics=num(old.pics)>0;
      saveMine(x=>{const o={...((x.jobs||{})[id]||old)},n={...o,text:text.slice(0,400),more:d.more.trim().slice(0,600),price,when:d.when,where,color:d.white?NOTE_WHITE:hueHex(d.hue),friendsOnly:!!d.friendsOnly,editedAt:now,
        deadline:d.when!==o.when?deadlineFor(d.when,now):o.deadline};if(pics.length)n.pics=pics.length;else delete n.pics;x.jobs={...(x.jobs||{}),[id]:n};return x});
      if(pics.length){S.pics['j:'+key]=pics;S.fb.setDoc(S.fb.doc(S.db,'jobpics',key),{owner:S.me.id,job:id,pics,at:now}).catch(e=>{console.warn(e);toast('Saved, but the photos didn\u2019t upload.')})}
      else if(hadPics){S.pics['j:'+key]=[];S.fb.deleteDoc(S.fb.doc(S.db,'jobpics',key)).catch(()=>{})}
      S.draft=blankDraft();S.openJob=key;go('job');toast('Changes saved');return}
    const id=rid(),at=Date.now(),where=(d.whereText.trim()||d.where).slice(0,40);
    const pics=cleanPics(d.pics),geo=d.useLoc&&LOC.pos?{lat:Math.round(LOC.pos.lat*1e3)/1e3,lng:Math.round(LOC.pos.lng*1e3)/1e3}:null;
    saveMine(x=>{x.jobs={...(x.jobs||{}),[id]:{text:text.slice(0,400),more:d.more.trim().slice(0,600),price,kind:d.kind,when:d.when,where,at,deadline:deadlineFor(d.when,at),status:'open',color:d.white?NOTE_WHITE:hueHex(d.hue),...(d.friendsOnly?{friendsOnly:true}:{}),...(pics.length?{pics:pics.length}:{}),...(geo?{geo}:{}),...(S.me.isOwner?{campus:curCampus()}:{})}};return x});
    if(pics.length){S.pics['j:'+S.me.id+'~'+id]=pics;S.fb.setDoc(S.fb.doc(S.db,'jobpics',S.me.id+'~'+id),{owner:S.me.id,job:id,pics,at}).catch(e=>{console.warn(e);toast('Your job is up, but the photos didn\u2019t upload.')})}
    S.draft=blankDraft();S.sort='newest';S.fresh=S.me.id+'~'+id;go('board');haptic('success');moment('Pinned.','Classmates can bid on it now.',1100);setTimeout(()=>{S.fresh=null},4000)},
  async editJob(el){const k=el?.dataset?.key||S.openJob,j=derive().jobByKey[k];if(!j||j.owner!==S.me.id||jobState(j)!=='open')return;
    let pics=S.pics['j:'+j.key];if(j.pics&&!Array.isArray(pics)){try{const x=await S.fb.getDoc(S.fb.doc(S.db,'jobpics',j.key));pics=x.exists()?cleanPics(x.data().pics):[]}catch{pics=[]}S.pics['j:'+j.key]=pics}
    const c=noteOf(j);S.draft={...blankDraft(),editId:j.id,hue:hexHue(c),white:c===NOTE_WHITE,text:j.text,price:String(j.price),kind:j.kind||'Errand',when:WHENS.includes(j.when)?j.when:'Today',
      where:WHERES.includes(j.where)?j.where:'Gate 1',whereText:WHERES.includes(j.where)?'':j.where,more:j.more,pics:[...(pics||[])],useLoc:false,friendsOnly:!!j.friendsOnly};
    S.openJob=j.key;S.editEnter=true;S.sheet=null;go('post')},
  repost(){const j=derive().jobByKey[S.openJob];if(!j)return;S.draft={...blankDraft(),hue:hexHue(noteOf(j)),white:noteOf(j)===NOTE_WHITE,text:j.text,price:String(j.price),kind:KINDS.includes(j.kind)?j.kind:'Other',where:WHERES.includes(j.where)?j.where:'Gate 1',whereText:WHERES.includes(j.where)?'':j.where,more:j.more,pics:[...(S.pics['j:'+j.key]||[])]};
    saveMine(x=>{if(x.jobs?.[j.id])x.jobs[j.id].status='closed';return x});go('post')},
  editBid(){const j=derive().jobByKey[S.openJob],b=j&&myBidOn(j.key);if(!b)return;S.bidEdit=j.key;S.bid={key:j.key,amt:String(num(b.amt)),say:b.say||'',pics:num(b.pics)?null:[]};S.err={};render();setTimeout(()=>$('bidAmt')?.focus(),0)},
  cancelBidEdit(){S.bidEdit=null;S.bid={key:null};S.err={};render()},
  bid(){const j=derive().jobByKey[S.openJob];if(!j)return;const amt=digits(S.bid.amt);
    if(!need(amt>=1&&amt<=50000,'bid','Enter a bid in rupees.'))return;if(!need(!sayOver(S.bid.say),'bid',SAY_MAX<1000?'Keep your pitch under '+SAY_MAX+' characters.':'Keep your pitch under '+SAY_WORDS+' words.'))return;if(modBlock('bid',S.bid.say))return;const had=!!myBidOn(j.key);
    const id=j.key+'~'+S.me.id,old=num(myBidOn(j.key)?.pics),pics=S.bid.pics?cleanPics(S.bid.pics):null,n=pics?pics.length:old;
    S.bidEdit=null;savePitch(j.key,S.bid.say.trim(),amt,n,!!(pref('near')&&j.geo&&LOC.pos&&distM(LOC.pos,j.geo)<=NEAR_M));render();S.err={};haptic('medium');toast(had?'Bid updated':'Bid placed');
    if(pics){const {doc,setDoc,deleteDoc}=S.fb;S.pics['b:'+id]=pics;
      if(pics.length)setDoc(doc(S.db,'bidpics',id),{owner:j.owner,by:S.me.id,job:j.key,pics,at:Date.now()}).catch(e=>{console.warn(e);toast('Your bid is in, but the photos didn\u2019t upload.')});
      else if(old)deleteDoc(doc(S.db,'bidpics',id)).catch(()=>{})}},
  withdraw(){S.bidEdit=null;const k=S.openJob,id=k+'~'+S.me.id,had=num(myBidOn(k)?.pics);savePitch(k,'',0);
    if(had){delete S.pics['b:'+id];S.fb.deleteDoc(S.fb.doc(S.db,'bidpics',id)).catch(()=>{})}
    render();S.bid={key:null};toast('Bid withdrawn')},
  async postReview(){const j=derive().jobByKey[S.openJob];if(!j||!j.pick||j.pick.review||j.owner!==S.me.id||jobState(j)!=='done')return;
    const text=S.rate.rev.trim().slice(0,400);if(!need(text.length>=3,'rate','Write a few words first.'))return;if(modBlock('review',text))return;
    S.busy=true;render();
    try{await reviewBatch(j.key,j.accepted,text,cleanPics(S.rate.pics),num((S.priv.gave||{})[j.key]));S.sheet=null;toast('Review posted')}
    catch(e){console.warn(e);S.err={rate:'Couldn\u2019t post your review. Try again.'}}
    S.busy=false;render()},
  confirmDelReview(){const s=S.sheet;if(!s?.rid)return;S.fb.rpc('delete_review',{p_id:s.rid}).then(()=>{delete S.revs[s.about];toast('Review deleted');render()}).catch(writeErr);
    S.sheet=null;render()},
  allReviews(el){S.allRevs=el.dataset.uid;render()},
  introNext(){if(S.intro.i>=INTRO.length-1)return closeIntro();introStep(1)},
  introSkip(){closeIntro()},
  introDone(){closeIntro('board')},
  introPost(){closeIntro('post')},
  async comCreate(){const d=S.cdraft,n=d.name.trim();if(n.length<2){S.err={cnew:'Give the board a name.'};render();return}if(modBlock('job',n,d.about))return;
    try{const id=await S.fb.rpc('create_community',{p_name:n,p_about:d.about.trim()||null});S.cdraft.name='';S.cdraft.about='';S.sheet=null;S.err={};S.coms={...S.coms,[id]:{name:n,about:d.about.trim(),owner:S.me.id}};S.cmine={...S.cmine,[id]:'owner'};openCom(id);toast('Board created. Invite people from the board.')}
    catch(e){console.warn(e);S.err={cnew:/10 boards/.test(e.message)?'You can start up to 10 boards.':'Couldn\u2019t create the board. Try again.'};render()}},
  comInviteH(el){S.cdraft.handle=el.dataset.h||'';ACT.comInvite()},
  async comInvite(){const h=S.cdraft.handle.trim().replace(/^@/,'').toLowerCase();if(!h){S.err={cinv:'Type a username.'};render();return}
    try{const r=await S.fb.rpc('invite_to_community',{p_id:S.cid,p_handle:h});if(r==='invited'){S.cdraft.handle='';S.err={};S.sheet=null;toast('Invited @'+h)}else{S.err={cinv:r==='member'?'@'+h+' is already a member.':'No one on '+campus()+' has that username.'};render()}}
    catch(e){console.warn(e);S.err={cinv:'Couldn\u2019t send the invite.'};render()}},
  async comJoin(el){const id=el.dataset.id;try{await S.fb.rpc('join_community',{p_id:id});S.sheet=null;S.cmine={...S.cmine,[id]:'member'};const v={...S.cinv};delete v[id];S.cinv=v;openCom(id);toast('You joined '+comName(id))}catch(e){console.warn(e);toast('Couldn\u2019t join. The invite may have been removed.')}},
  comDecline(el){const id=el.dataset.id;S.fb.deleteDoc(S.fb.doc(S.db,'cinvites',id+'~'+S.me.id)).catch(()=>{});const v={...S.cinv};delete v[id];S.cinv=v;S.sheet=null;render()},
  comKick(el){const u=el.dataset.uid;S.fb.deleteDoc(S.fb.doc(S.db,'cmembers',S.cid+'~'+u)).then(()=>toast('Removed '+firstName(u))).catch(()=>toast('Couldn\u2019t remove them.'))},
  comLeave(){const id=S.cid;S.fb.deleteDoc(S.fb.doc(S.db,'cmembers',id+'~'+S.me.id)).then(()=>{S.sheet=null;closeCom();go('board');toast('You left the board')}).catch(()=>toast('Couldn\u2019t leave.'))},
  comDelete(){if(!confirm('Delete '+comName(S.cid)+' and all its notes?'))return;const id=S.cid;S.fb.deleteDoc(S.fb.doc(S.db,'communities',id)).then(()=>{S.sheet=null;closeCom();go('board');toast('Board deleted')}).catch(()=>toast('Couldn\u2019t delete it.'))},
  cnoteStart(){S.draft={...blankDraft(),cid:S.cid,useLoc:false};S.editEnter=true;go('post')},
  cnoteColor(el){S.cdraft.color=el.dataset.c;render()},
  cnoteAdd(){const d=S.cdraft,t=d.text.trim();if(!t){S.err={cnote:'Write something first.'};render();return}if(modBlock('job',t,d.more))return;
    S.fb.addDoc(S.fb.collection(S.db,'cnotes'),{community:S.cid,by:S.me.id,text:t.slice(0,400),more:d.more.trim().slice(0,600),color:d.color,at:Date.now()}).then(()=>toast('Pinned')).catch(e=>{console.warn(e);toast('Couldn\u2019t pin it.')});
    S.cdraft.text='';S.cdraft.more='';S.sheet=null;S.err={};render()},
  cnoteDel(){const id=S.cnote;S.fb.deleteDoc(S.fb.doc(S.db,'cnotes',id)).then(()=>toast('Note removed')).catch(()=>toast('Couldn\u2019t remove it.'));go('cboard')},
  ccomSend(){const t=S.cdraft.comment.trim();if(!t)return;if(modBlock('chat',t))return;S.cdraft.comment='';
    S.fb.addDoc(S.fb.collection(S.db,'ccomments'),{note:S.cnote,community:S.cid,by:S.me.id,t:t.slice(0,500),at:Date.now()}).catch(e=>{console.warn(e);toast('Couldn\u2019t post your comment.')});render()},
  ccomDel(el){S.fb.deleteDoc(S.fb.doc(S.db,'ccomments',el.dataset.id)).catch(()=>toast('Couldn\u2019t delete it.'))},
  recStart(){recStart()},recCancel(){recStop(false)},recSend(){recStop(true)},
  playVoice(el){playVoice(el.dataset.src)},
  pickCollege(el){S.form.college=el.dataset.id;S.form.notListed=false;S.authErr='';render()},
  clearCollege(){S.form.college='';render();setTimeout(()=>$('fCol')?.focus(),0)},
  colMissing(){S.form.notListed=true;S.form.college='';render();setTimeout(()=>$('fNcol')?.focus(),0)},
  colList(){S.form.notListed=false;render();setTimeout(()=>$('fCol')?.focus(),0)},
  async pickBranch(el){const c=S.cpick;if(!c||c.busy)return;c.busy=true;c.err='';render();
    try{await S.fb.rpc('choose_campus',{p_id:el.dataset.id});S.cpick=null;handleUser(S.user)}catch(e){c.busy=false;c.err='Couldn’t join that campus. Try again.';render()}},
  branchMissing(){S.cpick.add=true;S.cpick.err='';render()},
  branchList(){S.cpick.add=false;S.cpick.err='';render()},
  async addBranch(){const c=S.cpick;if(!c||c.busy)return;if(c.ncol.trim().length<2){c.err='Add your college name.';render();return}c.busy=true;c.err='';render();
    try{await S.fb.rpc('add_my_campus',{p_college:c.ncol.trim(),p_city:c.ncity.trim()});S.cpick=null;handleUser(S.user)}catch(e){c.busy=false;c.err='Couldn’t make the board. Try again.';render()}},
  introPush(){closeIntro('board');setTimeout(enablePush,350)},
  async follow(el){const u=el.dataset.uid;if(isFollowing(u)){S.sheet={type:'unfollow',about:u};render();return}
    setRel('following',u,Date.now());
    try{await S.fb.rpc('follow_user',{p:u});toast(followsMe(u)?'You and '+shortName(u)+' are friends now. You can message each other anytime.':'Following '+shortName(u))}
    catch(e){console.warn(e);setRel('following',u,null);toast('Couldn\u2019t do that. Try again.')}},
  async answerMsgReq(el){const k=el.dataset.key,ok=el.dataset.ok==='1',d=S.threadDocs[k];
    if(ok&&d){S.threadDocs={...S.threadDocs,[k]:{...d,req:null}}}if(!ok){const t={...S.threadDocs};delete t[k];S.threadDocs=t;if(S.chat.keys?.includes(k)){closeThread();go('chats')}}render();
    try{await S.fb.rpc('answer_msg_request',{p_thread:k,p_ok:ok});toast(ok?'Accepted. You can chat now.':'Request declined')}catch(e){console.warn(e);if(d)S.threadDocs={...S.threadDocs,[k]:d};render();toast('Couldn\u2019t do that. Try again.')}},
  async unfollow(el){const u=el.dataset.uid,o=S.following[u];S.sheet=null;setRel('following',u,null);
    try{await S.fb.rpc('unfollow_user',{p:u});toast('Unfollowed '+shortName(u))}catch(e){console.warn(e);setRel('following',u,o);toast('Couldn\u2019t do that. Try again.')}},
  async removeFollower(el){const u=el.dataset.uid,o=S.followers[u];S.sheet=null;setRel('followers',u,null);
    try{await S.fb.rpc('remove_follower',{p:u});toast(shortName(u)+' no longer follows you')}catch(e){console.warn(e);setRel('followers',u,o);toast('Couldn\u2019t do that. Try again.')}},
  toggleFriendsOnly(){S.draft.friendsOnly=!S.draft.friendsOnly;render()},
  ptab(el){S.ptab=PTABS.includes(el.dataset.k)?el.dataset.k:'notes';render()},
  shareMe(){const h=handleOf(S.me.id),t=`Find me on tack, the ${campus()} board for quick jobs: @${h}\n${SITE}`;
    if(navigator.share)navigator.share({text:t}).catch(()=>{});else navigator.clipboard?.writeText(t).then(()=>toast('Copied. Paste it anywhere.'),()=>toast('Couldn\u2019t copy that.'))},
  async pnHide(el){const k=el.dataset.key,h=el.dataset.val==='1',c=S.pnotes[S.me.id],x=c?.list?.find(y=>y.key===k);S.sheet=null;
    if(!c?.ok||!x){render();toast('Couldn\u2019t change that right now. Try again in a minute.');return}
    x.hidden=h;render();
    try{if(!await S.fb.rpc('set_profile_hidden',{p_job:k.split('~')[1],p_hidden:h}))throw new Error('not updated');toast(h?'Hidden from your profile':'Back on your profile')}
    catch(e){console.warn(e);x.hidden=!h;render();toast('Couldn\u2019t change that. Try again.')}},
  goBack(el){goBack(el?.dataset?.to||'board')},
  omenu(el){const id=el.dataset.id;S.omenu=S.omenu===id?null:id;render();if(S.omenu)requestAnimationFrame(()=>document.querySelector('.opop [role=menuitem]')?.focus({preventScroll:true}));else document.querySelector(`.obtn[data-id="${id}"]`)?.focus({preventScroll:true})},
  replayIntro(){openIntro(S.view)},
  pickTheme(el){if(!themePick)return;themePick.sel=el.dataset.k;applyTheme(themePick.sel);renderThemePick()},
  themeDone(){if(!themePick)return;const {sel,then}=themePick;themePick=null;setTheme(sel);const r=$('themeRoot');
    if(r&&!reduceMotion.matches){r.firstElementChild.animate([{opacity:1},{opacity:0}],{duration:200,easing:'ease',fill:'forwards'});setTimeout(()=>r.remove(),210)}else r?.remove();then&&setTimeout(then,220)},
  setThemeTo(el){setTheme(el.dataset.k)},
  hideSteps(){savePriv({stepsHidden:true})},
  acceptTerms(){savePriv({terms:{v:TERMS_V,at:Date.now()}});$('termsRoot')?.remove();
    if(!S.introChecked){S.introChecked=true;if(!S.priv.introSeen)setTimeout(()=>{if(!S.intro.on)openIntro()},400)}},
  closeDoc(){closeDoc()},
  togglePwForm(){S.pwOpen=!S.pwOpen;S.pw={cur:'',nw:''};S.err={};render();if(S.pwOpen)$('pwCur')?.focus()},
  setNewPw(){setNewPw()},
  async changePw(){
    if(!need(S.pw.cur,'pw','Enter your current password.')||!need(S.pw.nw.length>=8,'pw','Use a new password of at least 8 characters.'))return;
    S.busy=true;render();
    try{await checkPw(S.pw.cur)}catch(e){S.busy=false;S.err={pw:e.code==='auth/too-many-requests'?authMsg(e):'That isn\u2019t your current password.'};render();return}
    {const {error}=await S.sb.auth.updateUser({password:S.pw.nw});if(error)S.err={pw:authMsg(authErr(error))};else{S.pwOpen=false;S.pw={cur:'',nw:''};S.err={};toast('Password changed')}}
    S.busy=false;render()},
  unblock(el){savePriv({blocked:arr(S.priv.blocked).filter(u=>u!==el.dataset.uid)});toast('Unblocked')},
  toggleLocPref(){if(locOptIn()){try{localStorage.removeItem('tack.loc')}catch{}LOC.pos=null;S.near=false;if(S.draft)S.draft.useLoc=false;render();toast('Location off')}
    else getLoc().then(p=>{render();toast(p?'Location on':'Couldn\u2019t get your location. Allow location for this site in your browser settings.')})},
  async exportData(){const {collection,query,where,getDocs}=S.fb,me=S.me.id;toast('Preparing your data…');
    const msgs={};for(const k of Object.keys(S.threadDocs)){try{const q=await getDocs(query(collection(S.db,'threads',k,'msgs'),where('by','==',me)));msgs[k]=q.docs.map(d=>d.data())}catch{}}
    const data={exportedAt:new Date().toISOString(),account:{uid:me,email:S.me.email},profile:S.myDoc,settings:S.priv,bids:S.pitchMine,picks:S.picks,offersSent:S.offersOut,offersReceived:S.offersIn,messagesSent:msgs};
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=`tack-my-data-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000)},
  helpBack(){S.help={kind:null,job:null,why:'',note:'',sent:null};S.err={};render()},
  helpUnjob(){S.help.job=null;S.help.why='';S.err={};render()},
  helpDone(){S.help={kind:null,job:null,why:'',note:'',sent:null};go('settings')},
  sendHelp(){const h=S.help,D=derive(),j=h.job?D.jobByKey[h.job]:null,me=S.me.id;
    if(h.kind==='past'||h.kind==='board'){if(!need(j,'help','Pick the job first.')||!need(h.why,'help','Pick what happened.'))return}
    else if(!need(h.note.trim().length>=10,'help','Write a little more so we can help.'))return;
    const about=j?(j.owner===me?j.accepted:j.owner):null;
    if(about)strikeAdd(about);
    S.fb.addDoc(S.fb.collection(S.db,'reports'),{by:me,kind:h.kind,...(about?{about}:{}),...(j?{job:j.key}:{}),...(h.why?{why:h.why}:{}),note:h.note.trim().slice(0,1000),at:Date.now()}).catch(writeErr);
    S.help={kind:null,job:null,why:'',note:'',sent:h.kind};S.err={};render()},
  toggleNear(){if(S.near){S.near=false;render();return}
    if(LOC.pos){S.near=true;render();return}
    toast('Finding where you are…');getLoc().then(p=>{if(p){S.near=true;render()}else toast('Couldn\u2019t get your location. Allow location for this site in your browser settings.')})},
  clearFind(){S.find.q='';S.near=false;render()},
  toggleJobLoc(){const d=S.draft;if(d.useLoc){d.useLoc=false;render();return}
    getLoc().then(p=>{if(p){d.useLoc=true;render()}else toast('Couldn\u2019t get your location. Allow location for this site in your browser settings.')})},
  nextPic(){const s=S.sheet,l=S.pics[s?.k];if(!l||!l.length)return;S.sheet={...s,i:(s.i+1)%l.length};render()},
  confirmPick(){const j=derive().jobByKey[S.openJob],s=S.sheet;if(!j||!s)return;haptic('success');
    saveMine(x=>{const o=x.jobs?.[j.id];if(o){o.status='assigned';o.takenAt=Date.now();delete o.repickAt}return x});
    S.picks={...S.picks,[j.key]:{owner:S.me.id,job:j.id,doer:s.uid,agreed:s.amt,at:Date.now(),status:'assigned',posterName:myRealName()}};
    S.fb.setDoc(S.fb.doc(S.db,'picks',j.key),{owner:S.me.id,job:j.id,doer:s.uid,agreed:s.amt,at:Date.now(),status:'assigned',posterName:myRealName()}).catch(e=>{console.warn(e);toast('Couldn\u2019t save the pick. Try again.')});
    S.sheet=null;toast('Picked '+firstName(s.uid)+'. Sort out the details in chat.');openThread({key:jobThreadKey(j.key,s.uid),other:s.uid,jobKey:j.key})},
  async confirmDone(){const j=derive().jobByKey[S.openJob];if(!j||!j.pick||j.pick.ratedDoer)return;const r=S.rate;
    if(!need(r.a&&r.b&&r.c&&r.d,'rate','Rate all four, from 1 to 5.'))return;
    if(modBlock('review',r.rev,r.text))return;
    const vals={timing:r.a,quality:r.b,comm:r.c,care:r.d},at=Date.now(),note=r.text.trim().slice(0,200);
    if(j.status!=='done')saveMine(x=>{const o=x.jobs?.[j.id];if(o){o.status='done';o.doneAt=at}return x});
    S.busy=true;render();
    try{await rateBatch(j.key,j.accepted,'d',vals,{status:'done',doneAt:num(j.pick.doneAt)||at,ratedDoer:true,...(note?{noteToDoer:note}:{})});
      savePriv({gave:{...(S.priv.gave||{}),[j.key]:(r.a+r.b+r.c+r.d)/4}});S.sheet=null;haptic('success');toast('Marked done. Thanks for rating.');
      const rev=r.rev.trim().slice(0,400);if(rev){try{await reviewBatch(j.key,j.accepted,rev,cleanPics(r.pics),(r.a+r.b+r.c+r.d)/4)}catch(e){console.warn(e);toast('Rating saved, but the review didn\u2019t post. Try again from the job.')}}}
    catch(e){console.warn(e);S.err={rate:'Couldn\u2019t save your rating. Try again.'}}
    S.busy=false;render()},
  async confirmRatePoster(){const j=derive().jobByKey[S.openJob];if(!j||!j.pick||j.pick.ratedPoster||j.accepted!==S.me.id)return;const r=S.rate;
    if(!need(r.a&&r.b&&r.c&&r.d,'rate','Rate all four, from 1 to 5.'))return;
    const vals={payment:r.a,clarity:r.b,comm:r.c,respect:r.d},note=r.text.trim().slice(0,200);
    S.busy=true;render();
    try{await rateBatch(j.key,j.owner,'p',vals,{ratedPoster:true,...(note?{noteToPoster:note}:{})});
      savePriv({gave:{...(S.priv.gave||{}),[j.key]:(r.a+r.b+r.c+r.d)/4}});S.sheet=null;haptic('success');toast('Thanks for rating.')}
    catch(e){console.warn(e);S.err={rate:'Couldn\u2019t save your rating. Try again.'}}
    S.busy=false;render()},
  confirmClose(){const j=derive().jobByKey[S.openJob];if(!j)return;saveMine(x=>{if(x.jobs?.[j.id])x.jobs[j.id].status='closed';return x});S.sheet=null;toast('Job closed')},
  confirmRemove(){const j=derive().jobByKey[S.openJob];if(!j||!S.me.isOwner)return;const {doc,updateDoc,FieldPath}=S.fb;
    updateDoc(doc(S.db,'people',j.owner),new FieldPath('jobs',j.id,'status'),'removed').catch(writeErr);
    if(j.pics){delete S.pics['j:'+j.key];S.fb.deleteDoc(doc(S.db,'jobpics',j.key)).catch(()=>{})}S.sheet=null;toast('Job removed from the board');go('board')},
  confirmReport(){const s=S.sheet;if(!need(S.rep.why,'rep','Pick a reason.'))return;const {collection,addDoc}=S.fb;
    addDoc(collection(S.db,'reports'),{by:S.me.id,about:s.about,why:S.rep.why,note:S.rep.note.trim().slice(0,200),at:Date.now()}).catch(writeErr);strikeAdd(s.about);
    if(S.rep.block)savePriv({blocked:[...new Set([...arr(S.priv.blocked),s.about])]});
    S.sheet=null;toast(S.rep.block?'Reported and blocked':'Report sent to '+organiser());if(S.rep.block)go('board');else render()},
  blockOnly(){const s=S.sheet;savePriv({blocked:[...new Set([...arr(S.priv.blocked),s.about])]});S.sheet=null;toast('Blocked');go('board')},
  async confirmErase(){
    const {doc,deleteDoc,collection,query,where,getDocs}=S.fb,me=S.me.id;
    if(!need(S.erase.pw,'erase','Enter your password to confirm.'))return;
    S.busy=true;S.err={};render();
    try{await checkPw(S.erase.pw)}
    catch(e){S.busy=false;S.err={erase:e.code==='auth/too-many-requests'?authMsg(e):'That password isn\u2019t right.'};render();return}
    try{
      for(const[k,t]of Object.entries(S.threadDocs)){const q=await getDocs(query(collection(S.db,'threads',k,'msgs'),where('by','==',me)));const files=q.docs.map(m=>m.data().media).filter(Boolean);if(files.length)await S.sb.storage.from('chat').remove(files).catch(()=>{});for(const m of q.docs)await deleteDoc(m.ref);
        if(t&&t.lastBy===me)await S.fb.updateDoc(doc(S.db,'threads',k),{lastText:'Message deleted'}).catch(()=>{})}
      for(const[id,p]of Object.entries(S.pitchMine)){if(num(p?.pics))await deleteDoc(doc(S.db,'bidpics',id)).catch(()=>{});await deleteDoc(doc(S.db,'pitches',id))}
      for(const pk of Object.values(S.picks))if(pk&&pk.owner===me&&typeof pk.review==='string'){await deleteDoc(doc(S.db,'reviewpics',pk.review)).catch(()=>{});await deleteDoc(doc(S.db,'reviews',pk.review)).catch(()=>{})}
      for(const[id,j]of Object.entries(S.myDoc?.jobs||{}))if(num(j?.pics))await deleteDoc(doc(S.db,'jobpics',me+'~'+id)).catch(()=>{});
      for(const id of Object.keys(S.offersOut))await deleteDoc(doc(S.db,'offers',id)).catch(()=>{});
      for(const[id,c]of Object.entries(S.myCodes))if(!c.usedBy)await deleteDoc(doc(S.db,'invcodes',id)).catch(()=>{});
      await deleteDoc(doc(S.db,'people',me));await deleteDoc(doc(S.db,'private',me));
      S.erased=true;stopSubs();await S.fb.rpc('delete_me');await S.sb.auth.signOut({scope:'local'}).catch(()=>{});
      S.busy=false;S.sheet=null;S.erase={pw:''};S.phase='erased';render();
    }catch(e){S.busy=false;S.err={erase:'Couldn\u2019t delete everything. Check your connection and try again.'};render();console.warn(e)}},
  paid(el){const j=derive().jobByKey[S.openJob];if(!j||j.accepted!==S.me.id)return;const ok=el.dataset.val==='yes';
    S.picks={...S.picks,[j.key]:{...S.picks[j.key],paid:{ok,at:Date.now()}}};render();
    S.fb.updateDoc(S.fb.doc(S.db,'picks',j.key),{paid:{ok,at:Date.now()}}).catch(e=>{console.warn(e);toast('Couldn\u2019t save that. Try again.')});
    if(ok&&!j.pick?.ratedPoster){S.rate={a:0,b:0,c:0,d:0,text:'',rev:'',pics:[]};S.err={};S.sheet={type:'ratePoster'};render()}else toast(ok?'Marked as paid. Thanks!':'Noted. '+firstName(j.owner)+' will see it.')},
  send(){sendMsg()},
  invite(){const e=S.inv.email.trim().toLowerCase();
    if(!need(validEmail(e),'inv','That doesn’t look like an email address.'))return;
    if(!need(!S.invites[e],'inv','That email is already invited.'))return;
    const {doc,setDoc}=S.fb;
    S.invites={...S.invites,[e]:{at:Date.now()}};
    setDoc(doc(S.db,'invites',e),{at:Date.now(),by:S.me.id,campus:S.inv.camp||curCampus()}).catch(writeErr);
    S.inv.email='';S.lastInvite=e;S.err={};render();toast('Invited. Now send it to them.')},
  reshare(el){S.sheet={type:'reshare',about:el.dataset.email};render()},
  confirmUninvite(){const e=S.sheet?.about;if(!e)return;const {doc,deleteDoc,updateDoc}=S.fb,inv=S.invites[e];
    deleteDoc(doc(S.db,'invites',e)).catch(writeErr);
    if(inv&&typeof inv.uid==='string'&&S.peopleDocs[inv.uid])updateDoc(doc(S.db,'people',inv.uid),{removed:true}).catch(()=>{});
    if(S.lastInvite===e)S.lastInvite=null;S.sheet=null;toast('Removed '+e)},
  async makeCode(){const {doc,setDoc}=S.fb,open=Object.values(S.myCodes).filter(c=>c&&!c.usedBy).length;
    if(open>=10){toast('You have 10 unused links. Use those first.');return}
    const c=Array.from(crypto.getRandomValues(new Uint8Array(10)),x=>'abcdefghjkmnpqrstuvwxyz23456789'[x%31]).join('');
    try{await setDoc(doc(S.db,'invcodes',c),{by:S.me.id,at:Date.now()});S.lastCode=c;render()}catch(e){writeErr(e)}},
  async shareCode(el){const c=el.dataset.code;try{await navigator.share({title:'Join me on tack',text:codeText(c).replace(/\n.*$/s,''),url:codeLink(c)})}catch{}},
  sendOffer(){const o=S.offer,text=o.text.trim(),price=digits(o.price),me=S.me.id;
    if(!need(text.length>=6,'offer','Say what you need in a few more words.')||!need(price>=10&&price<=20000,'offer','Set a price between ₹10 and ₹20,000.'))return;
    if(modBlock('offer',text,o.where))return;
    const id=rid(),key=`${me}~${id}~${o.to}`,d={owner:me,to:o.to,job:id,text:text.slice(0,200),price,when:o.when,where:o.where.trim().slice(0,40),at:Date.now(),status:'pending',...(o.prevJob?{prevJob:o.prevJob}:{})};
    S.offersOut={...S.offersOut,[key]:d};S.sheet=null;render();
    S.fb.setDoc(S.fb.doc(S.db,'offers',key),d).then(()=>toast('Sent to '+firstName(o.to)+'. You\u2019ll see their answer in Activity.')).catch(e=>{const m={...S.offersOut};delete m[key];S.offersOut=m;render();
      if(!(e&&e.code==='permission-denied')){toast('Couldn\u2019t send it. Try again.');return}
      S.sb.rpc('ask_block_reason',{p_to:o.to,p_prev:o.prevJob||null}).then(({data})=>toast({quiet:'At night (11 pm to 7 am) offers only go to people who are online.',limit:'You can ask up to 5 people a day. Try again tomorrow.',
        again:'You\u2019ve already asked '+firstName(o.to)+' today.'}[data]||'You can only send this to someone you\u2019ve hired before.'),()=>toast('Couldn\u2019t send it. Try again.'))})},
  acceptOffer(el){const k=el.dataset.key;S.fb.updateDoc(S.fb.doc(S.db,'offers',k),{status:'accepted',respondedAt:Date.now()}).then(()=>toast('Accepted. It\u2019s now a job between you two.')).catch(writeErr)},
  declineOffer(el){const k=el.dataset.key;S.fb.updateDoc(S.fb.doc(S.db,'offers',k),{status:'declined',respondedAt:Date.now()}).then(()=>toast('Declined. They won\u2019t be told.')).catch(writeErr)},
  reactMsg(el){S.sheet=null;S.rxFor=null;reactTo(+el.dataset.to,el.dataset.e)},
  replyMsg(el){S.rxFor=null;startReply(+el.dataset.to)},
  rxOpen(el){const id=+el.dataset.to;S.rxFor=S.rxFor===id?null:id;render()},
  msgMore(el){S.rxFor=null;S.sheet={type:'msgmenu',mid:+el.dataset.to};render()},
  pickChatPhoto(){chatPicker.click()},
  cancelReply(){S.chatDraft.reply=null;render()},
  copyMsg(el){const m=chatMsg(+el.dataset.to);S.sheet=null;render();if(m)navigator.clipboard?.writeText(m.t).then(()=>toast('Copied'),()=>toast('Couldn\u2019t copy that.'))},
  unsendMsg(el){const id=+el.dataset.to,c=S.chat;S.sheet=null;c.msgs=c.msgs.filter(x=>x.id!==id);for(const k in c.parts||{})c.parts[k]=c.parts[k].filter(x=>x.id!==id);if(S.chatDraft.reply?.id===id)S.chatDraft.reply=null;render();
    S.fb.rpc('unsend_msg',{p_id:id}).then(path=>{if(path)S.sb.storage.from('chat').remove([path]).catch(()=>{});toast('Unsent')}).catch(()=>toast('Couldn\u2019t unsend that. Try again.'))},
  jumpMsg(el){const t=document.querySelector(`.msgs [data-mid="${el.dataset.to}"]`);if(!t)return;t.scrollIntoView({block:'center',behavior:'smooth'});t.classList.remove('flash');void t.offsetWidth;t.classList.add('flash')},
  toggleOnline(){savePriv({hideOnline:!S.priv.hideOnline});toast(S.priv.hideOnline?'Nobody sees when you’re online now':'People you’ve made a deal with can see when you’re online')},
  restrict(el){const u=el.dataset.uid;savePriv({restricted:[...new Set([...restricted(),u])]});S.sheet=null;toast('Restricted. '+firstName(u)+' isn\u2019t told.')},
  unrestrict(el){const u=el.dataset.uid;savePriv({restricted:restricted().filter(x=>x!==u)});if(S.sheet?.type==='who')S.sheet=null;toast('Unrestricted')},
  blockWho(el){const u=el.dataset.uid;S.fb.rpc('cut_ties',{p:u}).catch(()=>{});['following','followers'].forEach(m=>{if(S[m][u]){S[m]={...S[m]};delete S[m][u]}});savePriv({blocked:[...new Set([...arr(S.priv.blocked),u])]});S.sheet=null;toast('Blocked. '+firstName(u)+' isn\u2019t told.');if(['chat','person'].includes(S.view))go('board')},
  withdrawOffer(el){const k=el.dataset.key,m={...S.offersOut};delete m[k];S.offersOut=m;render();S.fb.deleteDoc(S.fb.doc(S.db,'offers',k)).catch(writeErr)},
  toggleMemberInvites(el){S.config={...S.config,memberInvites:!!el.checked};render();S.fb.setDoc(S.fb.doc(S.db,'config','app'),S.config).catch(writeErr);toast(el.checked?'Members can invite friends':'Member invites are off')},
  saveCampus(){const c=(S.inv.campus||'').trim();if(!c)return;const {doc,setDoc}=S.fb;
    const id=curCampus();S.campuses={...S.campuses,[id]:{...(S.campuses[id]||{}),name:c.slice(0,60)}};S.fb.updateDoc(doc(S.db,'campuses',id),{name:c.slice(0,60)}).catch(writeErr);S.inv.campus='';toast('Board renamed');render()},
  viewCampus(el){S.viewCampus=el.dataset.id;if(S.sheet?.type==='campus'){S.sheet=null;S.camp={q:''}}try{localStorage.setItem('tack.viewCampus',S.viewCampus)}catch{}S.inv.campus='';toast('Viewing '+campusName(S.viewCampus));render()},
  openShare(el){openShare(el.dataset.key)},
  toggleSave(el){const k=el.dataset.key,was=isSaved(k),l=(S.priv.saved||[]).filter(x=>x!==k);if(!was)l.unshift(k);if(S.sheet?.type==='jobmenu')S.sheet=null;savePriv({saved:l.slice(0,100)});toast(was?'Removed from saved':'Saved. Find it under Profile, Saved jobs')},
  async tackShare(el){const j=derive().jobByKey[S.openJob];if(!j)return;if(S.shareImg?.key!==j.key){toast('Making the image, try again in a second.');return}await ACT.shareTo(el,j.key)},
  tackFeedback(){S.help={kind:'feedback',job:null,why:'',note:'',sent:null};S.err={};go('help')},
  async shareTo(el,key){const j=derive().jobByKey[key||S.sheet?.key];if(!j)return;const to=el.dataset.to,text=jobShareText(j),img=S.shareImg?.key===j.key?S.shareImg:null;
    const f=img&&typeof File==='function'?new File([img.blob],'tack-job.png',{type:'image/png'}):null,files=f&&navigator.canShare?.({files:[f]})?[f]:null;
    try{if(to==='wa'){if(files)await navigator.share({files,text});else window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener')}
      else if(to==='ig'){if(files)await navigator.share({files});else{saveImg();toast(img?'Image saved. Add it to your Instagram story.':'Making the image, try again in a second.')}}
      else if(to==='sys')await navigator.share(files?{files,text}:{text,url:jobLink(j)});
      else if(to==='save'){if(img){saveImg();toast('Image saved')}else toast('Making the image, try again in a second.')}
      else if(to==='copy')navigator.clipboard.writeText(jobLink(j)).then(()=>toast('Link copied'),()=>toast('Couldn’t copy'))}catch{}},
  async igText(el){const t=el.dataset.text||'';if(navigator.share){try{await navigator.share({text:t})}catch{}return}try{await navigator.clipboard.writeText(t);toast('Copied. Paste it in an Instagram DM or story.')}catch{toast('Couldn’t copy.')}},
  markSent(el){const j=derive().jobByKey[S.openJob];if(!j||j.owner!==S.me.id)return;const cash=el.dataset.val==='cash',ref=cash?'cash':String(S.pay.ref||'').replace(/\s+/g,'').slice(0,22);
    if(ref&&!cash&&!/^[0-9A-Za-z]{6,22}$/.test(ref)){toast('That reference doesn’t look right. Leave it empty if unsure.');return}
    const sent={at:Date.now(),...(ref?{ref}:{})};S.picks={...S.picks,[j.key]:{...S.picks[j.key],sent}};S.sheet=null;S.pay.ref='';render();
    S.fb.updateDoc(S.fb.doc(S.db,'picks',j.key),{sent}).then(()=>toast(firstName(j.accepted)+' will be asked to confirm')).catch(e=>{console.warn(e);toast('Couldn’t save that. Try again in a bit.')})},
  shareUpi(){const j=derive().jobByKey[S.openJob];if(!j||j.accepted!==S.me.id)return;const u=String(S.pay.upi??(S.priv.upi||'')).trim();
    if(!UPI_RE.test(u)){S.err={...S.err,upi:'Enter a UPI ID like name@okaxis'};render();return}
    S.err={};S.upiEdit=false;S.pay.upi=null;if(S.priv.upi!==u)savePriv({upi:u});S.picks={...S.picks,[j.key]:{...S.picks[j.key],upi:u}};render();
    S.fb.updateDoc(S.fb.doc(S.db,'picks',j.key),{upi:u}).then(()=>toast('Shared with '+firstName(j.owner))).catch(e=>{console.warn(e);toast('Couldn’t share it yet. Try again in a bit.')})},
  editUpi(){S.upiEdit=true;S.pay.upi=null;render()},
  repickWhy(el){S.repick=el.dataset.val;render()},
  confirmRepick(){const j=derive().jobByKey[S.openJob];if(!j||j.owner!==S.me.id||!j.accepted||!S.repick)return;const doer=j.accepted,why=S.repick;
    S.fb.deleteDoc(S.fb.doc(S.db,'picks',j.key)).then(()=>{
      const p={...S.picks};delete p[j.key];S.picks=p;
      saveMine(x=>{const o=x.jobs?.[j.id];if(o){o.repickAt=Date.now();o.dropped=[...arr(o.dropped).filter(u=>u!==doer),doer].slice(-5);o.dropWhy=why.slice(0,40)}return x});
      S.sheet=null;S.repick=null;render();toast('Pick someone else from the bids')
    }).catch(e=>{console.warn(e);toast('Couldn’t change the pick yet. Try again in a bit.')})},
  reopenJob(){const j=derive().jobByKey[S.openJob];if(!j||j.owner!==S.me.id||j.accepted)return;
    saveMine(x=>{const o=x.jobs?.[j.id];if(o){o.status='open';delete o.repickAt;delete o.takenAt;if(num(o.deadline)<Date.now()+36e5)o.deadline=Date.now()+864e5}return x});toast('Back on the board')},
  async saveHandle(){if(S.hcheck?.st!=='ok')return;const h=S.hcheck.h;
    try{await claimHandle(h)}catch(e){console.warn(e);S.hcheck={h,st:'taken'};S.err={onb:'That username was just taken. Try another.'};render();return}
    S.err={};saveMine(d=>{const x={...d,handle:h,handleAt:Date.now()};delete x.name;return x});computePhase();render();toast('Your username is @'+h)},
  clearSearch(){S.find.q='';render();setTimeout(()=>$('q')?.focus(),0)},
  copy(el){const t=el.dataset.text||'';
    try{navigator.clipboard.writeText(t).then(()=>toast('Copied'),()=>toast('Couldn’t copy. Select the text and copy it.'))}catch{toast('Couldn’t copy.')}}
};

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-com],[data-cnote],[data-doc],[data-pref],[data-helpkind],[data-helpjob],[data-helpwhy],[data-acttab],[data-pic],[data-review],[data-unpic],[data-go],[data-job],[data-sort],[data-set],[data-bump],[data-person],[data-thread],[data-thread-job],[data-thread-with],[data-pick],[data-sheet],[data-act],[data-onb],[data-free],[data-star],[data-why],[data-auth],[data-ask],[data-ofwhen],[data-msgwith],[data-gig],[data-gigopen]');
  if(!el)return;const ds=el.dataset;
  if(ds.ask!==undefined){if(ds.ask===S.me?.id)return;S.offer={to:ds.ask,prevJob:ds.prev||null,text:'',price:'',when:'Next hour',where:''};S.err={};S.sheet={type:'offer'};render();return}
  if(ds.ofwhen!==undefined){S.offer.when=ds.ofwhen;render();return}
  if(ds.auth!==undefined){S.authMode=ds.auth;S.authErr='';S.authMsg='';render();return}
  if(ds.act!==undefined){const f=ACT[ds.act];if(f){e.preventDefault();f(el)}return}
  if(ds.go!==undefined){go(ds.go);return}
  if(ds.job!==undefined){const pr=el.classList.contains('tile')&&el.querySelector('.price');if(pr&&document.startViewTransition&&!reduceMotion.matches)pr.style.viewTransitionName='jp';S.openJob=ds.job;S.bid={key:null};for(const k of Object.keys(S.pics))if(k.startsWith('b:'+ds.job+'~'))delete S.pics[k];go('job');return}
  if(ds.doc!==undefined){e.preventDefault();openDoc(ds.doc);return}
  if(ds.pref!==undefined){savePriv({prefs:{...(S.priv.prefs||{}),[ds.pref]:!pref(ds.pref)}});return}
  if(ds.helpkind!==undefined){S.help={kind:ds.helpkind,job:null,why:'',note:'',sent:null};S.err={};render();return}
  if(ds.helpjob!==undefined){S.help.job=ds.helpjob;S.err={};render();return}
  if(ds.helpwhy!==undefined){S.help.why=ds.helpwhy;render();return}
  if(ds.acttab!==undefined){S.actTab=ds.acttab;render();return}
  if(ds.sort!==undefined){S.sort=ds.sort;render();return}
  if(ds.set!==undefined){S.draft[ds.set]=ds.val;if(ds.set==='where')S.draft.whereText='';render();return}
  if(ds.bump!==undefined){S.draft.price=String((digits(S.draft.price)||0)+ +ds.bump);render();return}
  if(ds.person!==undefined){if(ds.person===S.me?.id){go('me');return}S.personOf=ds.person;go('person');return}
  if(ds.onb!==undefined){S.onb[ds.onb]=ds.val;render();return}
  if(ds.pick!==undefined){const b=bidsFor(derive(),S.openJob).find(x=>x.by===ds.pick);if(b){S.sheet={type:'pick',uid:b.by,amt:b.amt};render()}return}
  if(ds.sheet!==undefined){if(ds.sheet==='invitefriend')S.lastCode=null;S.err={};S.erase={pw:''};if(ds.sheet==='done'||ds.sheet==='ratePoster'||ds.sheet==='review')S.rate={a:0,b:0,c:0,d:0,text:'',rev:'',pics:[]};if(ds.sheet==='report')S.rep={why:ds.prewhy||'',note:'',block:false};S.sheet={type:ds.sheet,about:ds.about,rid:ds.rid};render();return}
  if(ds.review!==undefined){S.openRev=ds.review;go('review');return}
  if(ds.com!==undefined){openCom(ds.com);return}
  if(ds.cnote!==undefined){S.cnote=ds.cnote;go('cnote');return}
  if(ds.pic!==undefined){S.sheet={type:'pic',k:ds.pic,i:+ds.i||0};render();return}
  if(ds.unpic!==undefined){const o=ds.unpic==='draft'?S.draft:ds.unpic==='rev'?S.rate:S.bid;o.pics=(o.pics||[]).filter((_,i)=>i!==+ds.i);render();return}
  if(ds.star!==undefined){S.rate[ds.star[0]]=+ds.star.slice(1);haptic('light');render();return}
  if(ds.why!==undefined){S.rep.why=ds.why;render();return}
  const D=derive(),me=S.me.id;
  if(ds.thread!==undefined){const t=D.threads.find(x=>x.key===ds.thread);if(t)openThread(t);return}
  if(ds.threadJob!==undefined){const j=D.jobByKey[S.openJob];if(j&&canMessage({key:jobThreadKey(j.key,me),other:j.owner,jobKey:j.key},D))openThread({key:jobThreadKey(j.key,me),other:j.owner,jobKey:j.key});return}
  if(ds.gig!==undefined){S.sheet={type:'gig',key:ds.gig};render();return}
  if(ds.gigopen!==undefined){S.sheet=null;S.openJob=ds.gigopen;S.bid={key:null};go('job');return}
  if(ds.msgwith!==undefined){const u=ds.msgwith,j=activeDeal(u,D);openThread(j?{key:jobThreadKey(j.key,j.accepted),other:u,jobKey:j.key}:{key:dmKey(u),other:u,jobKey:null});return}
  if(ds.threadWith!==undefined){const j=D.jobByKey[S.openJob];if(j)openThread({key:jobThreadKey(j.key,ds.threadWith),other:ds.threadWith,jobKey:j.key});return}
});
// Tapping outside an open ⋯ menu only closes it. Picking an item closes it and runs the item.
document.addEventListener('click',e=>{if(!S.omenu)return;if(!e.target.closest('.omenu')){S.omenu=null;e.stopPropagation();e.preventDefault();render();return}
  if(e.target.closest('.opop [role=menuitem]')){S.omenu=null;setTimeout(()=>{if(!S.omenu&&document.querySelector('.opop'))render()},0)}},true);
let lp=null;
function openJobMenu(k){S.sheet={type:'jobmenu',key:k};render()}
// Hold a note for its menu, or hold a person (chats, the free row) to restrict, block or report them.
const holdOpen=t=>{haptic('medium');if(t.dataset.mid){if(S.view==='chat'){S.sheet={type:'msgmenu',mid:+t.dataset.mid};render()}return}if(t.dataset.job)openJobMenu(t.dataset.job);else if(t.dataset.hold&&t.dataset.hold!==S.me?.id){S.sheet={type:'who',about:t.dataset.hold};render()}};
document.addEventListener('pointerdown',e=>{const t=e.target.closest('.tile[data-job],[data-hold],.msgs [data-mid]');if(!t||e.button>0)return;if(lp)clearTimeout(lp.t);
  lp={x:e.clientX,y:e.clientY,fired:false,t:setTimeout(()=>{lp.fired=true;navigator.vibrate?.(12);holdOpen(t)},480)}});
document.addEventListener('pointermove',e=>{if(lp&&!lp.fired&&Math.hypot(e.clientX-lp.x,e.clientY-lp.y)>10)clearTimeout(lp.t)});
['pointerup','pointercancel'].forEach(n=>document.addEventListener(n,()=>{if(!lp)return;clearTimeout(lp.t);if(lp.fired){lp.until=Date.now()+400;lp.fired=false}}));
document.addEventListener('click',e=>{if(lp&&lp.until>Date.now()){lp=null;e.stopPropagation();e.preventDefault()}},true);
document.addEventListener('contextmenu',e=>{const t=e.target.closest('.tile[data-job],[data-hold],.msgs [data-mid]');if(!t)return;e.preventDefault();if(lp?.fired||lp?.until>Date.now())return;if(lp)clearTimeout(lp.t);holdOpen(t)});
// Swipe a message right to reply to it; double-tap to heart it.
let sw=null,lastTap=null;
document.addEventListener('pointerdown',e=>{const t=e.target.closest('.msgs [data-mid]');if(!t||e.button>0){sw=null;return}sw={t,x:e.clientX,y:e.clientY,dx:0,on:false,armed:false}});
document.addEventListener('pointermove',e=>{if(!sw)return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y;
  if(!sw.on){if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){sw=null;return}if(dx>12&&dx>Math.abs(dy)*1.4){sw.on=true;sw.t.classList.add('swiping');if(lp)clearTimeout(lp.t)}else return}
  sw.dx=Math.max(0,Math.min(dx,90));sw.t.style.transform=`translateX(${sw.dx}px)`;const armed=sw.dx>56;if(armed!==sw.armed){sw.armed=armed;sw.t.classList.toggle('armed',armed);if(armed)navigator.vibrate?.(8)}});
['pointerup','pointercancel'].forEach(n=>document.addEventListener(n,()=>{if(!sw)return;const {t,on,armed}=sw;sw=null;if(!on)return;
  t.classList.remove('swiping','armed');t.style.transform='';lp={until:Date.now()+350,fired:false};if(armed)startReply(+t.dataset.mid)}));
document.addEventListener('click',e=>{if(S.rxFor&&!e.target.closest('.rxbar,[data-act="rxOpen"]')){S.rxFor=null;render()}},true);
document.addEventListener('click',e=>{const t=e.target.closest('.msgs [data-mid]');if(!t||e.target.closest('button,a'))return;const id=+t.dataset.mid,now=Date.now();
  if(lastTap&&lastTap.id===id&&now-lastTap.t<320){lastTap=null;reactTo(id,'❤️',true);return}lastTap={id,t:now}});
document.addEventListener('submit',e=>{
  const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();
  if(S.busy)return;({signup:doSignup,login:doLogin,reset:doReset,newpw:setNewPw,otp:doVerifyOtp})[f.dataset.form]?.();
});
function bind(e){const b=e.target.dataset?.bind;if(!b)return;const[o,k]=b.split('.');S[o][k]=e.target.type==='checkbox'?e.target.checked:e.target.value}
document.addEventListener('input',e=>{if(e.target.id==='cropZoom'&&S.crop){S.crop.z=+e.target.value;cropApply();return}bind(e);if(e.target.id==='ciIn'){const c=$('ciSugs');if(c)c.innerHTML=ciSugsHTML();return}if(e.target.id==='ohd'){checkHandle(e.target.value);paintHandle();return}if(e.target.id==='msg'){$('composer')?.classList.toggle('hastext',!!e.target.value.trim())}if(e.target.id==='ccomIn'){$('ccomposer')?.classList.toggle('hastext',!!e.target.value.trim())}if(e.target.id==='q'||e.target.id==='campQ')render();else if(e.target.id==='fCol'||e.target.id==='cpQ')paintCol();else{if(e.target.id==='bidSay'){const w=$('bidWc');if(w){w.textContent=sayCount(e.target.value);w.classList.toggle('over',sayOver(e.target.value))}}if(e.target.id==='jt'){const w=$('jtWc');if(w){const n=e.target.value.length;w.textContent=noteCount(e.target.value);if(n>=NOTE_MAX){if(!w.classList.contains('full')){void w.offsetWidth;w.classList.add('full')}}else w.classList.remove('full')}}if(e.target.id==='jhue'&&S.draft.white){S.draft.white=false;$('jwhite')?.classList.remove('on')}if(e.target.id==='jp'||e.target.id==='jhue')syncNoteTone();if(e.target.id==='jm'){const w=e.target.closest('.pitchbox')?.querySelector('.wc');if(w)w.textContent=e.target.value.length+' / 600'}syncNeed()}});
document.addEventListener('change',async e=>{
  bind(e);syncNeed();
  if(e.target.dataset?.toggle==='memberInvites'){ACT.toggleMemberInvites(e.target);return}
  if(e.target.id==='chatPic'){const f=e.target.files?.[0];e.target.value='';if(f)sendChatPhoto(f);return}
  if(e.target.matches('[data-pics]')){const t=e.target.dataset.pics,o=t==='draft'?S.draft:t==='rev'?S.rate:S.bid,ek=t==='draft'?'post':t==='rev'?'rate':'bid';
    const files=[...e.target.files].slice(0,Math.max(0,MAX_PICS-(o.pics||[]).length));e.target.value='';let bad=0;
    for(const f of files){try{o.pics=[...(o.pics||[]),await readPic(f)]}catch{bad++}}
    S.err=bad?{[ek]:'One photo didn\u2019t work. Use a JPG or PNG.'}:{};render();return}
  if(e.target.matches('[data-photo]')||e.target.matches('[data-bannerfile]')){const f=e.target.files&&e.target.files[0];e.target.value='';openCrop(f,e.target.matches('[data-bannerfile]')?'banner':'photo');return}
});
document.addEventListener('pointerdown',e=>{if(e.target.id==='jhue')$('notewrap')?.classList.add('straight')});
document.addEventListener('focusout',e=>{if(e.target.closest?.('#notewrap'))setTimeout(()=>{const w=$('notewrap');if(w&&!noteHeld())w.classList.remove('flat')},0)});
['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,()=>$('notewrap')?.classList.remove('straight')));
window.__tackBack=()=>{
  if(S.omenu){S.omenu=null;render();return true}
  if($('docRoot')){closeDoc();return true}
  if(S.intro.on){introStep(-1);return true}
  if(S.sheet){closeSheet();return true}
  const b=document.querySelector('#main .back');if(b){b.click();return true}
  if(NAV.length){goBack();return true}
  return false};
document.addEventListener('keydown',e=>{
  if(S.omenu&&e.key==='Escape'){const id=S.omenu;S.omenu=null;render();document.querySelector(`.obtn[data-id="${id}"]`)?.focus({preventScroll:true});return}
  if(S.omenu&&(e.key==='ArrowDown'||e.key==='ArrowUp')){const it=[...document.querySelectorAll('.opop [role=menuitem]')];if(it.length){e.preventDefault();const k=it.indexOf(document.activeElement);it[(k+(e.key==='ArrowDown'?1:-1)+it.length)%it.length].focus()}return}
  if($('docRoot')){if(e.key==='Escape')closeDoc();return}
  if(S.intro.on){if(e.key==='ArrowRight'){e.preventDefault();introStep(1)}else if(e.key==='ArrowLeft'){e.preventDefault();introStep(-1)}else if(e.key==='Escape')closeIntro();return}
  if(e.key==='Escape'&&S.sheet){closeSheet();return}
  if(e.key==='Enter'&&e.target.id==='msg'){e.preventDefault();sendMsg();return}
  if(e.key==='Enter'&&e.target.id==='invE'){e.preventDefault();ACT.invite();return}
});
setInterval(()=>{if(S.phase==='app'&&!document.activeElement?.matches?.('input,textarea'))render()},30000);
setInterval(()=>{if(FOLLOW_ON&&S.phase==='app'&&!document.hidden)loadFeed()},18e4);
if(locOptIn())getLoc();setInterval(()=>{if(S.phase==='app'&&locOptIn()&&!document.hidden)getLoc()},3e5);
boot();
