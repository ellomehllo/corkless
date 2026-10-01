import firebaseConfig from './firebase-config.js';

const FB = window.__TACK_FB_BASE || 'https://www.gstatic.com/firebasejs/12.19.0/';
const SITE = location.origin + location.pathname.replace(/index\.html$/, '');

const RINGS=['#C6F24E','#A18CFF','#FF5B6E','#4FE3E0','#FF7AD1','#FFC53D'];
const GLOW={'#A18CFF':'rgba(161,140,255,.45)','#FF5B6E':'rgba(255,91,110,.5)','#FFC53D':'rgba(255,197,61,.35)','#4FE3E0':'rgba(79,227,224,.4)','#FF7AD1':'rgba(255,122,209,.38)','#C6F24E':'rgba(198,242,78,.32)'};
const KINDS=['Errand','Lifting','Ride','Print','Teach','Photo','Notes','Music','Other'];
const WHENS=['Next hour','Today','Tomorrow','This week','No rush'];
const WHERES=['Gate 1','Hostel B','Canteen','Library','Off campus'];
const YEARS=['FY','SY','TY','Final year','PG'];
const STATUSES=['open','assigned','done','closed','removed'];
const REASONS=['Unsafe or harassing','Assignment or exam work','No-show or didn’t pay','Something else'];
const DEFAULT_CAMPUS='MIT-WPU';
const ID_RE=/^[A-Za-z0-9_-]{6,128}$/, JOB_RE=/^[a-z0-9]{4,24}$/;
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
 clock:'<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
 out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/>',
 camera:'<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>'
};
const ic=(n,s=20,w=2,c='currentColor',fill='none')=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${fill}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

const blankDraft=()=>({text:'',price:'',kind:'Errand',when:'Today',where:'Gate 1',whereText:'',more:''});
const inviteParam=(new URLSearchParams(location.search).get('invite')||'').trim().toLowerCase();
const S={
  phase:'loading', fb:null, db:null, auth:null, user:null, me:null, signingUp:false, erased:false,
  authMode:inviteParam?'signup':'login', authErr:'', authMsg:'', busy:false,
  form:{name:'',email:inviteParam,pw:''},
  ready:{config:false,people:false,priv:false}, subs:[],
  config:{}, peopleDocs:{}, priv:{}, threadDocs:{}, invites:{}, reports:[], myInvite:null,
  myDoc:null, pendingMine:0,
  view:'board', openJob:null, personOf:null, sort:'high',
  draft:blankDraft(), bid:{key:null,amt:'',say:''}, chatDraft:{text:''},
  onb:{name:'',photo:'',year:'',branch:'',does:'',ring:'',adult:false,rules:false},
  inv:{email:'',campus:''}, lastInvite:null,
  sheet:null, rate:{stars:0,text:''}, rep:{why:'',note:'',block:false}, erase:{pw:''},
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
function stamp(t){const d=new Date(t),today=new Date();return d.toDateString()===today.toDateString()?clock(t):d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+', '+clock(t)}
function deadlineFor(when,at){
  const eod=k=>{const x=new Date(at);x.setDate(x.getDate()+k);x.setHours(23,59,59,0);return +x};
  switch(when){case'Next hour':return at+36e5;case'Today':return eod(0);case'Tomorrow':return eod(1);case'This week':return at+7*864e5;default:return at+30*864e5}
}

function pdoc(uid){return uid===S.me?.id?(S.myDoc||{}):(S.peopleDocs[uid]||{})}
function fullName(uid){const n=str(pdoc(uid).name,60).trim();if(n)return n;if(uid===S.me?.id)return (S.onb.name||S.user?.displayName||'').trim();return''}
function shortName(uid){const n=fullName(uid);if(!n)return uid===S.me?.id?'You':'Someone';const p=n.split(/\s+/);return p.length>1?`${p[0]} ${p[p.length-1][0].toUpperCase()}.`:p[0]}
function firstName(uid){const n=fullName(uid);return n?n.split(/\s+/)[0]:(uid===S.me?.id?'You':'Someone')}
function photoOf(uid){const p=uid===S.me?.id&&(S.phase==='onboard'||S.view==='edit')?S.onb.photo:pdoc(uid).photo;return typeof p==='string'&&p.length<300000&&PHOTO_RE.test(p)?p:''}
function ringOf(uid){const r=uid===S.me?.id&&S.onb.ring&&(S.phase==='onboard'||S.view==='edit')?S.onb.ring:pdoc(uid).ring;if(RINGS.includes(r))return r;let h=0;for(const c of String(uid))h=(h*31+c.charCodeAt(0))|0;return RINGS[Math.abs(h)%RINGS.length]}
function metaOf(uid){const d=pdoc(uid);return [str(d.year,12),str(d.branch,24)].filter(Boolean).join(' ')}
function face(uid,s){const src=photoOf(uid);return src?`<img class="av" src="${src}" width="${s}" height="${s}" alt="">`:`<span class="av av-empty" style="width:${s}px;height:${s}px;font-size:${Math.round(s*.4)}px">${esc(firstName(uid)[0]||'?')}</span>`}
function ring(uid,s){return `<span class="ring" style="border-color:${ringOf(uid)};width:${s}px;height:${s}px">${face(uid,s-8)}</span>`}
const campus=()=>str(S.config.campus,40)||DEFAULT_CAMPUS;
const ownerId=()=>typeof S.config.adminUid==='string'?S.config.adminUid:null;
const organiser=()=>{const o=ownerId();return o&&fullName(o)?firstName(o):'the organiser'};
const isMember=uid=>{const d=pdoc(uid);return !!d.adult&&!d.removed};

function normJob(id,j,uid){
  const r=j.rating&&typeof j.rating==='object'?j.rating:null;
  return{id,owner:uid,key:uid+'~'+id,text:str(j.text,200),more:str(j.more,600),price:num(j.price),kind:str(j.kind,20),
    when:str(j.when,20),where:str(j.where,40),at:num(j.at),deadline:num(j.deadline),
    status:STATUSES.includes(j.status)?j.status:'open',accepted:typeof j.accepted==='string'?j.accepted:null,agreed:num(j.agreed),
    rating:r?{stars:Math.max(1,Math.min(5,Math.round(num(r.stars))||1)),text:str(r.text,140),at:num(r.at)}:null};
}
function jobState(j){return j.status==='open'&&j.deadline<Date.now()?'expired':j.status}
function derive(){
  const me=S.me.id,blocked=new Set(arr(S.priv.blocked));
  const members=Object.keys(S.peopleDocs).filter(u=>u!==me&&ID_RE.test(u)&&isMember(u));
  if(S.myDoc?.adult)members.push(me);
  const jobs=[],jobByKey={},bidsByJob={};
  for(const uid of members){const d=pdoc(uid);
    if(d.jobs&&typeof d.jobs==='object')for(const[id,j]of Object.entries(d.jobs)){if(!JOB_RE.test(id)||!j||typeof j!=='object')continue;const n=normJob(id,j,uid);jobs.push(n);jobByKey[n.key]=n}
  }
  for(const uid of members){const d=pdoc(uid);
    if(d.bids&&typeof d.bids==='object')for(const[k,b]of Object.entries(d.bids)){if(!jobByKey[k]||!b||k.startsWith(uid+'~'))continue;(bidsByJob[k]=bidsByJob[k]||[]).push({by:uid,amt:num(b.amt),say:str(b.say,90),at:num(b.at)})}
  }
  const D={members,jobs,jobByKey,bidsByJob,blocked};
  D.threads=threadsOf(D);D.unread=D.threads.filter(t=>t.unread).length;
  return D;
}
function bidsFor(D,key){return (D.bidsByJob[key]||[]).filter(b=>!D.blocked.has(b.by))}
function boardJobs(D){
  const now=Date.now();
  const l=D.jobs.filter(j=>j.status==='open'&&j.deadline>now&&!D.blocked.has(j.owner));
  if(S.sort==='high')l.sort((a,b)=>b.price-a.price||b.at-a.at);
  else if(S.sort==='closing')l.sort((a,b)=>a.deadline-b.deadline);
  else l.sort((a,b)=>b.at-a.at);
  return l;
}
function freePeople(D){const now=Date.now();return D.members.filter(u=>num(pdoc(u).freeUntil)>now&&!D.blocked.has(u))}
function stats(uid,D){
  let done=0,earned=0,sum=0,cnt=0;const reviews=[];
  for(const j of D.jobs){if(j.accepted===uid&&j.status==='done'){done++;earned+=j.agreed||j.price;if(j.rating){sum+=j.rating.stars;cnt++;if(j.rating.text)reviews.push({from:j.owner,text:j.rating.text,stars:j.rating.stars,at:j.rating.at})}}}
  return{done,earned,avg:cnt?(sum/cnt).toFixed(1):null,cnt,reviews:reviews.sort((a,b)=>b.at-a.at).slice(0,6)};
}
function rateLine(uid,D){const s=stats(uid,D);return s.avg?` · ★${s.avg} from ${s.done} ${s.done===1?'job':'jobs'}`:''}
const jobThreadKey=(jobKey,bidder)=>`j~${jobKey}~${bidder}`;
const dmKey=(a,b)=>'d~'+[a,b].sort().join('~');
function parseKey(k){const p=k.split('~');if(p[0]==='j'&&p.length===4)return{members:[p[1],p[3]],jobKey:p[1]+'~'+p[2]};if(p[0]==='d'&&p.length===3)return{members:[p[1],p[2]],jobKey:null};return null}
function threadsOf(D){
  const me=S.me.id,out={};
  const add=(k,other,jobKey)=>{if(out[k])return out[k];if(!other||other===me||!D.members.includes(other)||D.blocked.has(other))return null;return out[k]={key:k,other,jobKey,last:null}};
  for(const[k,t]of Object.entries(S.threadDocs)){const p=parseKey(k);if(!p||!p.members.includes(me))continue;
    const th=add(k,p.members.find(x=>x!==me),p.jobKey);if(th&&t&&num(t.lastAt))th.last={at:num(t.lastAt),text:str(t.lastText,80),from:str(t.lastBy,128)}}
  for(const j of D.jobs)if(j.accepted&&(j.status==='assigned'||j.status==='done')&&(j.owner===me||j.accepted===me))add(jobThreadKey(j.key,j.accepted),j.owner===me?j.accepted:j.owner,j.key);
  const seen=S.priv.seen||{};
  return Object.values(out).map(t=>{const j=t.jobKey?D.jobByKey[t.jobKey]:null;t.job=j;
    t.unread=!!(t.last&&t.last.from!==me&&t.last.at>num(seen[t.key]));
    t.sub=t.last?(t.last.from===me?'You: ':'')+t.last.text:(j?`₹${fmt(j.agreed||j.price)} · ${j.text}`:'Say hi');return t})
    .filter(t=>t.last||t.job).sort((a,b)=>(b.last?.at||b.job?.at||0)-(a.last?.at||a.job?.at||0));
}

const queues={};
function enqueue(k,fn){const q=(queues[k]||Promise.resolve()).catch(()=>{}).then(fn);queues[k]=q;return q}
function writeErr(e){
  const c=e&&e.code;
  if(c==='permission-denied'){lostAccess();return}
  toast(c==='unavailable'?'You’re offline. It will save when you reconnect.':'Couldn’t save that. Try again.');
  console.warn(e);
}
function prune(d){
  const keep=(o,n,by)=>{if(!o||typeof o!=='object')return{};const e=Object.entries(o);if(e.length<=n)return o;e.sort((a,b)=>by(b[1])-by(a[1]));return Object.fromEntries(e.slice(0,n))};
  const jobs=Object.entries(d.jobs||{});const live=jobs.filter(([,j])=>j.status==='open'||j.status==='assigned');
  const rest=jobs.filter(([,j])=>!(j.status==='open'||j.status==='assigned')).sort((a,b)=>num(b[1].at)-num(a[1].at)).slice(0,80);
  d.jobs=Object.fromEntries([...live,...rest]);d.bids=keep(d.bids,150,b=>num(b.at));
  return d;
}
function saveMine(mut){
  const {doc,setDoc}=S.fb;
  S.myDoc=prune(mut(clone(S.myDoc)));S.pendingMine++;render();
  return enqueue('me',()=>setDoc(doc(S.db,'people',S.me.id),S.myDoc)).catch(writeErr).finally(()=>{S.pendingMine--});
}
function savePriv(patch){
  const {doc,setDoc}=S.fb;
  S.priv={...S.priv,...patch,seen:{...(S.priv.seen||{}),...(patch.seen||{})}};render();
  return enqueue('priv',()=>setDoc(doc(S.db,'private',S.me.id),patch,{merge:true})).catch(writeErr);
}

async function boot(){
  render();
  if(!firebaseConfig||!firebaseConfig.apiKey){S.phase='setup';render();return}
  try{
    const [app,auth,fs]=await Promise.all([import(FB+'firebase-app.js'),import(FB+'firebase-auth.js'),import(FB+'firebase-firestore.js')]);
    S.fb={...app,...auth,...fs};
    const fbApp=app.initializeApp(firebaseConfig);
    S.auth=auth.getAuth(fbApp);S.db=fs.getFirestore(fbApp);
  }catch(e){console.error(e);S.phase='offline';render();return}
  S.fb.onAuthStateChanged(S.auth,u=>{handleUser(u)});
}
function stopSubs(){S.subs.forEach(u=>{try{u()}catch{}});S.subs=[];closeThread()}
let verifyTimer=null;
function stopVerifyPoll(){clearInterval(verifyTimer);verifyTimer=null}
async function handleUser(user){
  stopSubs();stopVerifyPoll();S.user=user;S.me=null;
  if(S.signingUp)return;
  if(!user){if(!S.erased)S.phase='auth';render();return}
  if(!user.emailVerified){S.phase='verify';render();verifyTimer=setInterval(checkVerified,5000);return}
  S.phase='loading';render();
  try{await user.getIdToken(true)}catch{}
  const {doc,getDoc}=S.fb,email=(user.email||'').toLowerCase();
  let isOwner=false;
  try{await getDoc(doc(S.db,'adminCheck','probe'));isOwner=true}catch{}
  if(!isOwner){
    let inv=null;try{inv=await getDoc(doc(S.db,'invites',email))}catch{}
    if(!inv||!inv.exists()){S.phase='notinvited';render();return}
    S.myInvite=inv.data();
  }
  S.me={id:user.uid,email,isOwner};
  startSubs();
}
async function checkVerified(){
  const u=S.auth.currentUser;if(!u)return;
  try{await S.fb.reload(u)}catch{return}
  if(u.emailVerified){stopVerifyPoll();await u.getIdToken(true);handleUser(u)}
}
let retried=false;
function lostAccess(){if(S.phase==='notinvited')return;stopSubs();
  const u=S.auth.currentUser;
  if(u&&!retried){retried=true;u.getIdToken(true).then(()=>handleUser(u),()=>{S.phase='notinvited';render()});return}
  S.phase='notinvited';render()}
function startSubs(){
  const {doc,collection,onSnapshot,query,where,orderBy,limit}=S.fb,db=S.db,me=S.me.id;
  S.ready={config:false,people:false,priv:false};S.config={};S.peopleDocs={};S.priv={};S.threadDocs={};S.invites={};S.reports=[];
  const fail=e=>{if(e&&e.code==='permission-denied')lostAccess();else console.warn(e)};
  S.subs.push(onSnapshot(doc(db,'config','app'),s=>{S.config=s.exists()?s.data():{};S.ready.config=true;afterData()},fail));
  S.subs.push(onSnapshot(collection(db,'people'),snap=>{
    const d={};snap.forEach(x=>{d[x.id]=x.data()});
    S.peopleDocs=d;if(!S.pendingMine)S.myDoc=d[me]?clone(d[me]):null;S.ready.people=true;afterData();
  },fail));
  S.subs.push(onSnapshot(doc(db,'private',me),s=>{S.priv=s.exists()?s.data():{};S.ready.priv=true;afterData()},fail));
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
  const {doc,setDoc,updateDoc}=S.fb,me=S.me.id;
  if(!firstLoadDone){
    firstLoadDone=true;
    if(S.me.isOwner&&ownerId()!==me)setDoc(doc(S.db,'config','app'),{...S.config,adminUid:me,campus:str(S.config.campus,40)||DEFAULT_CAMPUS}).catch(writeErr);
    if(!S.me.isOwner&&S.myInvite&&S.myInvite.uid!==me)updateDoc(doc(S.db,'invites',S.me.email),{uid:me,joinedAt:Date.now()}).catch(()=>{});
    if(S.myDoc&&S.myDoc.removed)saveMine(d=>{delete d.removed;return d});
  }
  computePhase();render();
}
function computePhase(){
  if(!S.me)return;
  if(S.erased){S.phase='erased';return}
  if(!(S.ready.config&&S.ready.people&&S.ready.priv)){S.phase='loading';return}
  if(!S.myDoc||!S.myDoc.adult){if(S.phase!=='onboard')seedOnb();S.phase='onboard';return}
  S.phase='app';
}
function seedOnb(){const d=S.myDoc||{};S.onb={name:str(d.name,60)||S.user?.displayName||'',photo:PHOTO_RE.test(d.photo||'')?d.photo:'',year:str(d.year,12),branch:str(d.branch,24),does:str(d.does,60),ring:RINGS.includes(d.ring)?d.ring:ringOf(S.me.id),adult:!!d.adult,rules:!!d.adult}}

const AUTH_ERR={
  'auth/invalid-credential':'Wrong email or password.','auth/wrong-password':'Wrong email or password.','auth/user-not-found':'Wrong email or password.',
  'auth/email-already-in-use':'That email already has an account. Log in instead.','auth/weak-password':'Use a longer password: at least 8 characters.',
  'auth/invalid-email':'That doesn’t look like an email address.','auth/too-many-requests':'Too many tries. Wait a few minutes and try again.',
  'auth/network-request-failed':'You look offline. Check your connection.','auth/requires-recent-login':'For safety, log in again first.',
  'auth/password-does-not-meet-requirements':'That password is too simple. Use at least 8 characters.'
};
const authMsg=e=>AUTH_ERR[e&&e.code]||'Something went wrong. Try again.';
const verifySettings=()=>({url:SITE});
async function sendVerify(u){try{await S.fb.sendEmailVerification(u,verifySettings())}catch(e){if(String(e.code).includes('continue-uri')||String(e.code).includes('unauthorized'))await S.fb.sendEmailVerification(u);else throw e}}
async function doSignup(){
  const f=S.form,name=f.name.trim(),email=f.email.trim().toLowerCase();
  if(name.length<2)return authFail('Add your full name.');
  if(!validEmail(email))return authFail('That doesn’t look like an email address.');
  if(f.pw.length<8)return authFail('Use a password of at least 8 characters.');
  const {createUserWithEmailAndPassword,updateProfile,deleteUser,signOut,doc,getDoc}=S.fb;
  S.busy=true;S.authErr='';S.signingUp=true;render();
  let cred;
  try{cred=await createUserWithEmailAndPassword(S.auth,email,f.pw)}catch(e){S.signingUp=false;S.busy=false;return authFail(authMsg(e))}
  let ok=false;
  try{ok=(await getDoc(doc(S.db,'invites',email))).exists()}catch{}
  if(!ok){try{await getDoc(doc(S.db,'adminCheck','probe'));ok=true}catch{}}
  if(!ok){
    try{await deleteUser(cred.user)}catch{try{await signOut(S.auth)}catch{}}
    S.signingUp=false;S.busy=false;S.phase='auth';
    return authFail(`${email} isn’t on the invite list. Use the email address your invite was sent to, or ask the organiser to invite you.`);
  }
  try{await updateProfile(cred.user,{displayName:name})}catch{}
  try{await sendVerify(cred.user)}catch{}
  S.onb.name=name;S.form.pw='';S.signingUp=false;S.busy=false;
  handleUser(S.auth.currentUser);
}
async function doLogin(){
  const f=S.form,email=f.email.trim().toLowerCase();
  if(!validEmail(email))return authFail('That doesn’t look like an email address.');
  if(!f.pw)return authFail('Enter your password.');
  S.busy=true;S.authErr='';render();
  try{await S.fb.signInWithEmailAndPassword(S.auth,email,f.pw);S.form.pw=''}catch(e){authFail(authMsg(e))}
  S.busy=false;render();
}
async function doReset(){
  const email=S.form.email.trim().toLowerCase();
  if(!validEmail(email))return authFail('Enter the email you signed up with.');
  S.busy=true;S.authErr='';render();
  try{await S.fb.sendPasswordResetEmail(S.auth,email,{url:SITE})}catch(e){if(e.code==='auth/too-many-requests'){S.busy=false;return authFail(authMsg(e))}}
  S.busy=false;S.authMsg=`If ${email} has an account, a reset link is on its way. Check spam too.`;render();
}
function authFail(m){S.authErr=m;S.busy=false;render();return false}
async function logOut(){stopSubs();firstLoadDone=false;S.view='board';S.myDoc=null;try{await S.fb.signOut(S.auth)}catch{}}

function closeThread(){if(S.chat.unsub)try{S.chat.unsub()}catch{};S.chat={key:null}}
function openThread(t){
  const {collection,query,orderBy,limit,onSnapshot}=S.fb;
  closeThread();S.chatDraft={text:''};
  const k=t.key;
  S.chat={key:k,other:t.other,jobKey:t.jobKey||null,msgs:[],loaded:false,unsub:null};
  S.chat.unsub=onSnapshot(query(collection(S.db,'threads',k,'msgs'),orderBy('at','desc'),limit(300)),snap=>{
    if(S.chat.key!==k)return;
    S.chat.msgs=snap.docs.map(d=>d.data()).filter(m=>m&&typeof m.t==='string').map(m=>({t:m.t.slice(0,1000),at:num(m.at),by:str(m.by,128)})).reverse();
    S.chat.loaded=true;markSeen();render();
    requestAnimationFrame(()=>{const m=$('main');if(S.view==='chat')m.scrollTop=m.scrollHeight});
  },e=>{S.chat.loaded=true;render();console.warn(e)});
  go('chat',true);
}
function markSeen(){
  const c=S.chat;if(!c.key||S.view!=='chat')return;
  const last=Math.max(0,...c.msgs.filter(m=>m.by!==S.me.id).map(m=>m.at));
  if(last>num((S.priv.seen||{})[c.key]))savePriv({seen:{[c.key]:last}});
}
function sendMsg(){
  const c=S.chat,t=S.chatDraft.text.trim();if(!c.key||!t)return;
  const {collection,addDoc,doc,setDoc}=S.fb,me=S.me.id,at=Date.now();
  S.chatDraft.text='';
  addDoc(collection(S.db,'threads',c.key,'msgs'),{by:me,t:t.slice(0,1000),at}).catch(writeErr);
  setDoc(doc(S.db,'threads',c.key),{members:[me,c.other],job:c.jobKey||null,lastText:t.slice(0,80),lastAt:at,lastBy:me},{merge:true}).catch(writeErr);
  savePriv({seen:{[c.key]:at}});
  requestAnimationFrame(()=>{$('msg')?.focus()});
}

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

function authHTML(){
  const m=S.authMode,f=S.form;
  const field=(id,label,type,key,ph,ac)=>`<div class="stack gap8"><label class="formlabel" for="${id}">${label}</label>
    <input id="${id}" class="inp" type="${type}" autocomplete="${ac}" placeholder="${esc(ph)}" value="${esc(f[key])}" data-bind="form.${key}" ${type==='email'?'inputmode="email" autocapitalize="off" spellcheck="false"':''}></div>`;
  const tabs=`<div class="authtabs" role="tablist"><button type="button" role="tab" aria-selected="${m==='login'}" class="${m==='login'?'on':''}" data-auth="login">Log in</button>
    <button type="button" role="tab" aria-selected="${m==='signup'}" class="${m==='signup'?'on':''}" data-auth="signup">Sign up</button></div>`;
  let body='';
  if(m==='signup')body=`<form class="stack" id="authForm" data-form="signup" novalidate style="gap:14px">
     ${inviteParam?`<div class="invitebanner">You're invited. Create your account with <b>${esc(inviteParam)}</b>, the address your invite went to.</div>`:''}
     ${field('fName','Full name','text','name','Sana Qureshi','name')}
     ${field('fEmail','Email','email','email','The address you were invited on','email')}
     ${field('fPw','Password','password','pw','At least 8 characters','new-password')}
     ${S.authErr?`<p class="err" role="alert">${esc(S.authErr)}</p>`:''}
     <button class="cta" type="submit" ${S.busy?'disabled':''}>${S.busy?'Creating your account…':'Create account'}</button>
     <p class="note">Only invited emails can join. We'll email you a link to confirm your address.</p></form>`;
  else if(m==='login')body=`<form class="stack" id="authForm" data-form="login" novalidate style="gap:14px">
     ${field('fEmail','Email','email','email','you@college.edu.in','email')}
     ${field('fPw','Password','password','pw','Your password','current-password')}
     ${S.authErr?`<p class="err" role="alert">${esc(S.authErr)}</p>`:''}
     <button class="cta" type="submit" ${S.busy?'disabled':''}>${S.busy?'Logging in…':'Log in'}</button>
     <button type="button" class="linkbtn" data-auth="reset">Forgot your password?</button></form>`;
  else body=`<form class="stack" id="authForm" data-form="reset" novalidate style="gap:14px">
     <p>Enter the email you signed up with and we'll send a link to set a new password.</p>
     ${field('fEmail','Email','email','email','you@college.edu.in','email')}
     ${S.authErr?`<p class="err" role="alert">${esc(S.authErr)}</p>`:''}${S.authMsg?`<p class="okmsg" role="status">${esc(S.authMsg)}</p>`:''}
     <button class="cta" type="submit" ${S.busy?'disabled':''}>Send reset link</button>
     <button type="button" class="linkbtn" data-auth="login">Back to log in</button></form>`;
  return`<div class="gatebox"><div class="mark">tack</div>
    <h1>${m==='signup'?'Create your account':m==='reset'?'Reset your password':'The campus noticeboard'}</h1>
    ${m==='login'?'<p>Pin a small job, classmates bid, you pick someone. Invite-only.</p>':''}
    ${m!=='reset'?tabs:''}${body}</div>`;
}
function gateHTML(){
  const email=esc(S.user?.email||'');
  switch(S.phase){
  case'loading':return`<div class="loading"><div class="mark">tack</div><span>Opening the board…</span></div>`;
  case'setup':return`<div class="gatebox"><div class="mark">tack</div><h1>Almost ready</h1><p>This site isn't connected to its database yet. Add the Firebase web config to <b>firebase-config.js</b> and reload.</p></div>`;
  case'offline':return`<div class="gatebox"><div class="mark">tack</div><h1>Can't reach tack</h1><p>Check your connection and reload the page.</p><button class="cta" data-act="reload">Reload</button></div>`;
  case'auth':return authHTML();
  case'verify':return`<div class="gatebox"><div class="mark">tack</div><h1>Confirm your email</h1>
    <p>We sent a link to <b>${email}</b>. Open it to confirm this is your address, then come back here. Check your spam folder if it isn't there in a minute.</p>
    <button class="cta" data-act="checkVerified">I've confirmed it</button>
    <button class="btn2" data-act="resendVerify">Send the email again</button>
    <button class="linkbtn" data-act="logout">Use a different email</button></div>`;
  case'notinvited':return`<div class="gatebox"><div class="mark">tack</div><h1>This email isn't on the invite list</h1>
    <p><b>${email}</b> hasn't been invited to tack, or its invite was removed. Ask the organiser to invite this address, then log in again.</p>
    <button class="btn2" data-act="logout">Log out</button></div>`;
  case'erased':return`<div class="gatebox"><div class="mark">tack</div><h1>Your account is deleted</h1>
    <p>Your profile, jobs, bids and messages are erased, and your login is gone.</p></div>`;
  case'onboard':return onboardHTML(false);
  }
  return'';
}
function onboardHTML(edit){
  const o=S.onb,me=S.me.id;
  return`<div class="gatebox" style="gap:20px">
   ${edit?'':'<div class="mark">tack</div>'}
   <div><h1>${edit?'Edit your profile':'Set up your profile'}</h1>
   ${edit?'':`<p style="margin-top:8px">Classmates see this when you post or bid. A real photo helps people trust you.</p>`}</div>
   <div class="photopick">${ring(me,76)}<div class="stack gap8">
     <label class="upload" for="oph">${ic('camera',16)} ${o.photo?'Change photo':'Add a photo'}<input id="oph" type="file" accept="image/jpeg,image/png,image/webp" data-photo></label>
     ${o.photo?'<button class="linkbtn" style="align-self:flex-start;padding:0" data-act="clearPhoto">Remove photo</button>':''}</div></div>
   <div class="stack gap8"><label class="formlabel" for="onm">Full name</label>
     <input id="onm" class="inp" maxlength="60" autocomplete="name" value="${esc(o.name)}" data-bind="onb.name"></div>
   <div class="stack gap8"><span class="formlabel" id="yl">Year</span>
     <div class="chips" role="group" aria-labelledby="yl">${YEARS.map(y=>`<button class="chip ${o.year===y?'on':''}" data-onb="year" data-val="${y}" aria-pressed="${o.year===y}">${y}</button>`).join('')}</div></div>
   <div class="stack gap8"><label class="formlabel" for="obr">Branch</label>
     <input id="obr" class="inp" maxlength="24" placeholder="CSE, ECE, BDes…" value="${esc(o.branch)}" data-bind="onb.branch" autocomplete="off"></div>
   <div class="stack gap8"><label class="formlabel" for="odo">Good at <span class="muted">(optional)</span></label>
     <input id="odo" class="inp" maxlength="60" placeholder="photo, notes, rides" value="${esc(o.does)}" data-bind="onb.does" autocomplete="off"></div>
   <div class="stack gap8"><span class="formlabel" id="rl">Your ring colour</span>
     <div class="chips" role="group" aria-labelledby="rl">${RINGS.map(r=>`<button class="swatch ${o.ring===r?'on':''}" style="background:${r}" data-onb="ring" data-val="${r}" aria-label="Ring colour ${r}" aria-pressed="${o.ring===r}"></button>`).join('')}</div></div>
   ${edit?'':`<label class="check" for="oad"><input type="checkbox" id="oad" data-bind="onb.adult" ${o.adult?'checked':''}> I'm 18 or older.</label>
   <label class="check" for="oru"><input type="checkbox" id="oru" data-bind="onb.rules" ${o.rules?'checked':''}> I won't post assignment or exam work, anything illegal, or anything that puts someone at risk.</label>`}
   ${S.err.onb?`<p class="err" role="alert">${esc(S.err.onb)}</p>`:''}
   <button class="cta" data-act="${edit?'saveProfile':'join'}">${edit?'Save profile':'Join the board'}</button>
   ${edit?'<button class="linkbtn" data-go="me">Cancel</button>':'<button class="linkbtn" data-act="logout">Log out</button>'}
  </div>`;
}

function back(to,label){return`<button class="back" data-go="${to}">${ic('back',16)} ${label}</button>`}
function tile(j,D,i=0){
  const r=ringOf(j.owner),n=bidsFor(D,j.key).length,left=j.deadline-Date.now();
  return`<button class="tile r${i%3}" data-job="${esc(j.key)}" style="--glow:${GLOW[r]}">
    <span class="pin" style="background:${r};box-shadow:0 0 10px ${r}"></span>
    <span class="price">₹${fmt(j.price)}</span>
    ${left<36e5?`<span class="flag">${Math.max(1,Math.round(left/6e4))} min left</span>`:''}
    <p>${esc(j.text)}</p>
    <span class="by">${face(j.owner,22)}<span class="nm">${esc(firstName(j.owner))}</span><span class="n">${n} ${n===1?'bid':'bids'}</span></span>
  </button>`;
}
const wideMQ=matchMedia('(min-width:900px)');
function wallHTML(list,D){const n=wideMQ.matches?3:2,cols=Array.from({length:n},()=>[]);
  list.forEach((j,i)=>cols[i%n].push(tile(j,D,i)));
  return`<div class="wall">${cols.map(c=>`<div class="wcol">${c.join('')}</div>`).join('')}</div>`}
wideMQ.addEventListener?.('change',()=>{if(S.phase==='app')render()});
function viewBoard(D){
  const list=boardJobs(D),free=freePeople(D).filter(u=>u!==S.me.id),meFree=num(S.myDoc?.freeUntil)>Date.now();
  return`<header class="top">
    <div><div class="mark">tack</div><div class="sub"><span class="dot"></span><span>${esc(campus())} · ${list.length} pinned</span></div></div>
    <button data-go="me" aria-label="Your profile">${ring(S.me.id,48)}</button>
  </header>
  <section class="stripwrap" aria-label="Free right now"><p class="label">Free right now</p>
    <div class="strip">
      <button class="person" data-sheet="free" aria-label="${meFree?'Change when you’re free':'Mark yourself free'}">${meFree?ring(S.me.id,50):`<span class="add">${ic('plus',18)}</span>`}<span>You</span></button>
      ${free.map(u=>`<button class="person" data-person="${esc(u)}">${ring(u,50)}<span>${esc(firstName(u))}</span></button>`).join('')}
      ${free.length?'':`<span class="stripnote">Nobody else is marked free. Tap + to say you're around.</span>`}
    </div></section>
  <div class="dhead"><h1 class="h1">The board</h1><span class="muted">${list.length} pinned at ${esc(campus())}</span></div>
  <div class="pills" role="group" aria-label="Sort jobs">${[['high','Top pay'],['newest','Newest'],['closing','Closing soon']].map(([k,l])=>`<button class="pill ${S.sort===k?'on':''}" data-sort="${k}" aria-pressed="${S.sort===k}">${l}</button>`).join('')}</div>
  ${list.length?wallHTML(list,D):`<div class="empty"><b>Nothing pinned yet</b><p>Pin the first job: a xerox run, a lift down four floors, an hour of help before a submission.</p><button class="cta" data-go="post">Pin a job</button></div>`}`;
}
function viewJob(D){
  const j=D.jobByKey[S.openJob];
  if(!j)return`<div class="pad">${back('board','Back to the board')}<div class="empty" style="margin:18px 0"><b>This job is gone</b><p>The poster closed it or it was taken off the board.</p></div></div>`;
  const me=S.me.id,mine=j.owner===me,st=jobState(j),bids=bidsFor(D,j.key).sort((a,b)=>a.amt-b.amt||a.at-b.at);
  const myBid=(S.myDoc?.bids||{})[j.key];
  if(S.bid.key!==j.key)S.bid={key:j.key,amt:String(myBid?num(myBid.amt):j.price),say:myBid?str(myBid.say,90):''};
  const stTag={expired:'<span class="tag warn">Closed · time ran out</span>',closed:'<span class="tag">Closed</span>',removed:'<span class="tag warn">Removed</span>',
    assigned:`<span class="tag ok">Picked ${esc(shortName(j.accepted))}</span>`,done:'<span class="tag ok">Done</span>'}[st]||'';
  let foot='';
  if(mine){
    if(st==='open')foot=`<div class="foot"><button class="btn2" data-sheet="close">Close this job</button><p class="note">Pick someone from the bids to take it off the board.</p></div>`;
    else if(st==='assigned')foot=`<div class="foot"><div class="banner">${ic('tick',13,3.4,'var(--accent)')} You picked ${esc(firstName(j.accepted))} for ₹${fmt(j.agreed)}. Pay on UPI after.</div>
      <button class="cta" data-sheet="done">Mark as done</button><button class="btn2" data-thread-with="${esc(j.accepted)}">Message ${esc(firstName(j.accepted))}</button></div>`;
    else if(st==='done')foot=`<div class="foot"><p class="note">Done. You rated ${esc(firstName(j.accepted))} ${j.rating?'★'+j.rating.stars:''}.</p></div>`;
    else if(st==='expired')foot=`<div class="foot"><button class="btn2" data-act="repost">Pin it again</button></div>`;
  }else{
    if(st==='open')foot=`<div class="foot">
      <div style="display:flex;gap:9px"><label class="field" for="bidAmt"><span class="fl">Your bid ₹</span>
        <input id="bidAmt" type="text" inputmode="numeric" maxlength="6" value="${esc(S.bid.amt)}" data-bind="bid.amt" aria-label="Your bid in rupees"
         style="font-family:var(--display);font-size:var(--t-19);font-weight:800;letter-spacing:-.035em;font-variant-numeric:tabular-nums"></label>
        <button class="iconbtn" style="width:52px;height:auto;border-radius:999px;background:var(--surface)" data-thread-job aria-label="Message ${esc(firstName(j.owner))}">${ic('chat',20)}</button></div>
      <label class="field" for="bidSay"><input id="bidSay" maxlength="90" placeholder="One line on why you (optional)" value="${esc(S.bid.say)}" data-bind="bid.say"></label>
      ${S.err.bid?`<p class="err">${esc(S.err.bid)}</p>`:''}
      <button class="cta" data-act="bid">${myBid?'Update my bid':'Place bid'}</button>
      ${myBid?'<button class="linkbtn" data-act="withdraw">Withdraw my bid</button>':''}
      <p class="note">You pay each other on UPI. tack never holds your money.</p></div>`;
    else if(j.accepted===me)foot=`<div class="foot"><div class="banner">${ic('tick',13,3.4,'var(--accent)')} ${esc(firstName(j.owner))} picked you for ₹${fmt(j.agreed)}</div>
      <button class="cta" data-thread-job>Message ${esc(firstName(j.owner))}</button><p class="note">You pay each other on UPI. tack never holds your money.</p></div>`;
    else foot=`<div class="foot"><p class="note">${st==='assigned'||st==='done'?'This job went to someone else.':'This job is closed.'}</p></div>`;
  }
  const mod=!mine&&S.me.isOwner&&st!=='removed'?`<button class="linkbtn" data-sheet="remove">Take this job off the board</button>`:'';
  return`<div class="pad">${back('board','Back to the board')}
  <div class="wide">
   <div class="stack" style="margin-top:6px">
    <span class="big" style="view-transition-name:jp">₹${fmt(j.price)}</span>
    <h1 class="h1">${esc(j.text)}</h1>
    <div class="chips">${[j.when,j.where,j.kind].filter(Boolean).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}${stTag}</div>
    ${j.more?`<p style="margin:0;font-size:var(--t-14);line-height:1.55;color:var(--fg2);max-width:52ch;overflow-wrap:anywhere;white-space:pre-wrap">${esc(j.more)}</p>`:''}
    <button class="card" data-person="${esc(j.owner)}">${ring(j.owner,50)}
      <span class="rowtext" style="gap:3px"><span style="font-size:var(--t-16);font-weight:700;letter-spacing:-.015em">${esc(shortName(j.owner))}${mine?' <span class="muted">(you)</span>':''}</span>
      <span style="font-size:var(--t-12);font-weight:500;color:var(--muted)">${esc(metaOf(j.owner)||campus())}${esc(rateLine(j.owner,D))} · posted ${since(j.at)}</span></span></button>
    ${!mine?`<div style="display:flex;gap:16px"><button class="linkbtn" data-sheet="report" data-about="${esc(j.owner)}">Report</button>${mod}</div>`:''}
   </div>
   <div class="stack">
    <div style="display:flex;align-items:baseline;gap:8px"><h2 class="h2">${bids.length} ${bids.length===1?'bid':'bids'}</h2><span style="font-size:var(--t-12);font-weight:600;color:var(--muted)">lowest first</span></div>
    ${bids.length?bids.map(b=>`<div class="row">
      <button class="rowmain" data-person="${esc(b.by)}">${ring(b.by,42)}<span class="rowtext">
        <span class="t1">${esc(shortName(b.by))}${b.by===me?' (you)':''} <span class="muted">· ${esc(metaOf(b.by))}${esc(rateLine(b.by,D))}</span></span>
        ${b.say?`<span class="t2">${esc(b.say)}</span>`:''}</span></button>
      <span class="amt">₹${fmt(b.amt)}</span>
      ${mine&&st==='open'?`<button class="pick" data-pick="${esc(b.by)}" aria-label="Pick ${esc(firstName(b.by))} for ₹${fmt(b.amt)}">Pick</button>`:''}
      ${mine&&st==='open'?`<button class="iconbtn" data-thread-with="${esc(b.by)}" aria-label="Message ${esc(firstName(b.by))}">${ic('chat',17)}</button>`:''}
      ${j.accepted===b.by?'<span class="tag ok">Picked</span>':''}
    </div>`).join(''):`<p class="note" style="text-align:left">${mine?'No bids yet. Classmates see this on the board now.':'No bids yet. Be the first.'}</p>`}
   </div>
  </div></div>${foot}`;
}
function viewPost(){
  const d=S.draft;
  const group=(t,g,list)=>`<div class="stack gap8"><span class="formlabel" id="g-${g}">${t}</span><div class="chips" role="group" aria-labelledby="g-${g}">${list.map(v=>`<button class="chip ${d[g]===v&&!(g==='where'&&d.whereText.trim())?'on':''}" data-set="${g}" data-val="${esc(v)}" aria-pressed="${d[g]===v}">${esc(v)}</button>`).join('')}</div></div>`;
  return`<div class="pad">${back('board','Close')}
  <div class="stack narrow" style="margin-top:6px;gap:22px">
   <div class="stack gap8"><label for="jt" class="formlabel">What do you need?</label>
     <textarea id="jt" class="ta" rows="3" maxlength="200" placeholder="Pick up my print-outs from Sai Xerox before 4. Roll no. is on the slip." data-bind="draft.text">${esc(d.text)}</textarea></div>
   <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap">
     <label for="jp" class="stack" style="gap:4px"><span class="formlabel">You'll pay</span>
       <span class="priceIn">₹<input id="jp" type="text" inputmode="numeric" maxlength="5" placeholder="150" value="${esc(d.price)}" data-bind="draft.price"></span></label>
     <div style="display:flex;gap:7px;padding-bottom:8px"><button class="pill" data-bump="50">+50</button><button class="pill" data-bump="100">+100</button></div>
   </div>
   ${group('What kind','kind',KINDS)}${group('By when','when',WHENS)}${group('Where','where',WHERES)}
   <input id="jw" class="inp" maxlength="40" placeholder="Or type a place: Seminar hall, B-wing 4th floor…" value="${esc(d.whereText)}" data-bind="draft.whereText" aria-label="Other place">
   <div class="stack gap8"><label for="jm" class="formlabel">Anything else <span class="muted">(optional)</span></label>
     <textarea id="jm" class="inp" rows="2" maxlength="600" style="resize:vertical" placeholder="Details the person doing it should know." data-bind="draft.more">${esc(d.more)}</textarea></div>
   <div class="card">${ring(S.me.id,38)}<span style="font-size:var(--t-12);font-weight:500;color:var(--fg2)">Posting as <b style="color:var(--fg)">${esc(shortName(S.me.id))}${metaOf(S.me.id)?' · '+esc(metaOf(S.me.id)):''}</b>. Your photo and name show on the board.</span></div>
  </div></div>
  <div class="foot">${S.err.post?`<p class="err">${esc(S.err.post)}</p>`:''}<button class="cta" data-act="post">Put it on the board</button>
   <p class="note">No assignment or exam work. Nothing illegal, nothing that puts someone at risk.</p></div>`;
}
function viewBids(D){
  const me=S.me.id;
  const myJobs=D.jobs.filter(j=>j.owner===me&&j.status!=='removed').sort((a,b)=>{const o=x=>({open:0,assigned:1}[jobState(x)]??2);return o(a)-o(b)||b.at-a.at});
  const myBids=Object.entries(S.myDoc?.bids||{}).map(([k,b])=>({k,b,j:D.jobByKey[k]})).filter(x=>x.j&&x.j.owner!==me).sort((a,b)=>num(b.b.at)-num(a.b.at));
  const jobLine=j=>{const st=jobState(j),n=bidsFor(D,j.key).length;
    return st==='open'?[`${n} ${n===1?'bid':'bids'} in`,'']:st==='assigned'?[`Picked ${shortName(j.accepted)} · ₹${fmt(j.agreed)}`,'ok']:st==='done'?[`Done${j.rating?' · you gave ★'+j.rating.stars:''}`,'ok']:st==='expired'?['Time ran out','warn']:['Closed','']};
  const bidLine=({j})=>{const st=jobState(j);return j.accepted===me?[`Accepted · ₹${fmt(j.agreed)}`,'ok']:j.accepted?['Went to someone else','']:st==='open'?[`Waiting · ${bidsFor(D,j.key).length} bids in`,'']:['Closed','']};
  const row=(j,[line,cls],amt)=>`<button class="item" data-job="${esc(j.key)}"><span class="itext"><span class="t1" style="font-weight:600;color:var(--fg)">${esc(j.text)}</span>
    <span style="font-size:var(--t-11);font-weight:700;color:${cls==='ok'?'var(--accent)':cls==='warn'?'var(--coral-ink)':'var(--muted)'}">${esc(line)}</span></span><span class="amt" style="font-size:var(--t-16);color:var(--fg2)">₹${fmt(amt)}</span></button>`;
  return`<div class="pad narrow"><h1 class="pageh">Bids</h1>
   <div class="stack">
    <div class="sect"><h2 class="h2">On your jobs</h2><button class="linkbtn" data-go="post" style="padding:0">Pin a job</button></div>
    ${myJobs.length?`<div class="stack gap8">${myJobs.map(j=>row(j,jobLine(j),j.price)).join('')}</div>`:'<p class="note" style="text-align:left">You haven’t pinned anything yet.</p>'}
    <div class="sect"><h2 class="h2">Your bids</h2></div>
    ${myBids.length?`<div class="stack gap8">${myBids.map(x=>row(x.j,bidLine(x),num(x.b.amt))).join('')}</div>`:'<p class="note" style="text-align:left">Bids you place on the board show up here.</p>'}
   </div></div><div style="height:24px"></div>`;
}
function viewChats(D){
  return`<div class="pad narrow"><h1 class="pageh">Chats</h1>
  ${D.threads.length?`<div class="stack gap8">${D.threads.map(t=>`<button class="item" data-thread="${esc(t.key)}">${ring(t.other,46)}
    <span class="itext"><span class="t1">${esc(shortName(t.other))}${t.job?` <span class="muted">· ₹${fmt(t.job.agreed||t.job.price)}</span>`:''}</span><span class="t2" style="${t.unread?'color:var(--fg);font-weight:600':''}">${esc(t.sub)}</span></span>
    <span class="iend"><span class="time">${t.last?ago(t.last.at):''}</span>${t.unread?'<span class="udot" aria-label="Unread"></span>':''}</span></button>`).join('')}</div>`
   :'<div class="empty" style="margin:8px 0"><b>No chats yet</b><p>Message someone from a job, or tap Ask next to a person who’s free.</p></div>'}
  </div><div style="height:24px"></div>`;
}
function viewChat(D){
  const c=S.chat;if(!c.key)return viewChats(D);
  const j=c.jobKey?D.jobByKey[c.jobKey]:null,me=S.me.id;
  const accepted=j&&j.accepted&&[j.owner,j.accepted].includes(me)&&[j.owner,j.accepted].includes(c.other);
  return`<div class="pad" style="padding-bottom:10px"><div style="display:flex;align-items:center;gap:10px">
     <button class="back" data-go="chats" aria-label="Back to chats" style="padding:0">${ic('back',20)}</button>
     <button class="rowmain" data-person="${esc(c.other)}">${ring(c.other,42)}<span class="rowtext"><span style="font-size:var(--t-16);font-weight:700;letter-spacing:-.015em">${esc(shortName(c.other))}</span>
       <span style="font-size:var(--t-12);font-weight:500;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${j?`₹${fmt(j.agreed||j.price)} · ${esc(j.text)}`:esc(metaOf(c.other)||campus())}</span></span></button>
     <button class="iconbtn" data-sheet="report" data-about="${esc(c.other)}" aria-label="Report or block">${ic('flag',17)}</button></div></div>
  <div class="msgs">
   ${accepted?`<div class="banner">${ic('tick',13,3.4,'var(--accent)')} Bid accepted · ₹${fmt(j.agreed)} · pay on UPI after</div>`:''}
   ${j&&!accepted?`<button class="banner" style="background:var(--surface2);color:var(--fg2)" data-job="${esc(j.key)}">About: ${esc(j.text.slice(0,40))}${j.text.length>40?'…':''}</button>`:''}
   ${!c.msgs.length?`<p class="note" style="margin:10px 0">${c.loaded?'Say hi. Sort out the time and place here.':'Loading messages…'}</p>`:''}
   ${c.msgs.map(m=>`<div class="${m.by===me?'out':'in'}">${esc(m.t)}<span class="time">${stamp(m.at)}</span></div>`).join('')}
   <p class="note" style="margin-top:4px">Keep it here. If you report someone, we can see this chat.</p>
  </div>
  <div class="foot" style="position:sticky;bottom:0;background:linear-gradient(transparent,var(--bg) 30%)"><div style="display:flex;gap:9px">
    <label class="field" for="msg"><input id="msg" type="text" maxlength="1000" placeholder="Message…" value="${esc(S.chatDraft.text)}" data-bind="chatDraft.text" aria-label="Message ${esc(firstName(c.other))}" autocomplete="off"></label>
    <button data-act="send" aria-label="Send" style="width:50px;height:50px;flex-shrink:0;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(198,242,78,.35)">${ic('send',19,2,'var(--bg)')}</button>
  </div></div>`;
}
function viewPerson(uid,D){
  const d=pdoc(uid),st=stats(uid,D),isMe=uid===S.me.id,free=num(d.freeUntil)>Date.now();
  const does=str(d.does,60).split(',').map(s=>s.trim()).filter(Boolean).slice(0,6);
  const tints=[['rgba(79,227,224,.16)','var(--cyan-ink)'],['rgba(255,122,209,.16)','var(--pink-ink)'],['rgba(255,197,61,.16)','var(--amber-ink)'],['rgba(161,140,255,.18)','var(--violet-ink)']];
  return`<div class="pad">${isMe?'':back('board','Back to the board')}
  <div class="stack narrow" style="margin:6px auto 0;gap:18px">
   <div class="prof">
     <span class="ring" style="border-color:${ringOf(uid)};width:108px;height:108px;box-shadow:0 0 34px ${GLOW[ringOf(uid)]}">${face(uid,94)}</span>
     <span class="pname">${esc(shortName(uid))}</span>
     <div class="chips" style="justify-content:center">${metaOf(uid)?`<span class="chip">${esc(metaOf(uid))}</span>`:''}<span class="chip">${esc(campus())}</span>
       <span class="chip vio">${uid===ownerId()?'Organiser':'Invited member'}</span>${free?'<span class="chip on">Free right now</span>':''}</div>
   </div>
   <div class="stats"><div><b>${st.done}</b><span>jobs done</span></div><div><b style="color:var(--accent)">${st.avg??'–'}</b><span>rating</span></div><div><b>${fmt(st.earned)}</b><span>₹ earned</span></div></div>
   ${isMe?`<button class="card" data-sheet="free">${ic('clock',20)}<span class="rowtext"><span class="t1">${free?'You’re free until '+clock(num(d.freeUntil)):'Free right now?'}</span><span class="t2">${free?'Tap to change or turn it off':'Show classmates you’re around for a job'}</span></span><span class="chev">${ic('chev',18)}</span></button>`:''}
   ${does.length?`<div class="chips">${does.map((x,i)=>`<span class="chip" style="background:${tints[i%4][0]};color:${tints[i%4][1]};font-weight:700">${esc(x)}</span>`).join('')}</div>`:''}
   ${st.reviews.length?`<h2 class="h2">What people said</h2>${st.reviews.map(r=>`<div class="row" style="align-items:flex-start">${face(r.from,36)}<span class="rowtext" style="gap:3px">
       <span class="t1" style="font-size:var(--t-12)">${esc(shortName(r.from))} <span class="muted">· ${'★'.repeat(r.stars)}</span></span><span style="font-size:var(--t-14);line-height:1.45;color:var(--fg2);overflow-wrap:anywhere">${esc(r.text)}</span></span></div>`).join('')}`:''}
   ${isMe?`<div class="menu">
       <button data-go="edit">${ic('edit',18)} Edit profile<span class="chev">${ic('chev',16)}</span></button>
       ${S.me.isOwner?`<button data-go="invites">${ic('users',18)} Invites and members<span class="chev">${ic('chev',16)}</span></button>`:''}
       <button data-go="privacy">${ic('shield',18)} Privacy<span class="chev">${ic('chev',16)}</span></button>
       <button data-act="logout">${ic('out',18)} Log out</button>
       <button data-sheet="erase" class="danger">${ic('trash',18)} Delete my account</button></div>
       <p class="note">Logged in as ${esc(S.me.email)}</p>`
     :`<button class="cta" data-dm="${esc(uid)}">Message ${esc(firstName(uid))}</button>
       <button class="linkbtn" data-sheet="report" data-about="${esc(uid)}">Report or block</button>`}
  </div></div><div style="height:24px"></div>`;
}
function viewPrivacy(){
  return`<div class="pad">${back('me','Back')}<div class="prose" style="margin-top:6px">
   <h1 class="pageh" style="margin-bottom:6px">Privacy</h1>
   <p>tack is private to people ${esc(organiser())} invited. Nothing on the board is public.</p>
   <h2>What tack keeps</h2>
   <p>Your email address and a password to log in. Your name, photo, year, branch, what you're good at and your ring colour. The jobs you pin, the bids you place, the ratings you give and your messages. When you mark yourself free, the time it ends.</p>
   <h2>What other members see</h2>
   <p>Your name, photo, year and branch, your jobs, bids, ratings and reviews. They never see your email address.</p>
   <h2>Chats</h2>
   <p>Only you and the other person can read a chat in the app. ${esc(organiser())} runs this board and can read chats to handle a report.</p>
   <h2>Money</h2>
   <p>tack never touches money. You pay each other directly in cash or UPI.</p>
   <h2>Deleting your account</h2>
   <p>Go to Me, then Delete my account. It erases your profile, jobs, bids and messages and removes your login straight away.</p>
   <h2>Questions or complaints</h2>
   <p>Message ${esc(organiser())}${ownerId()&&ownerId()!==S.me.id?' from their profile':''}.</p>
  </div></div><div style="height:24px"></div>`;
}
const inviteLink=e=>`${SITE}?invite=${encodeURIComponent(e)}`;
const inviteText=e=>`You're invited to tack, the ${campus()} noticeboard for small jobs. Post something you need done, or bid on a classmate's job.\n\nSign up with this email address (${e}):\n${inviteLink(e)}`;
function shareButtons(e){
  return`<div class="sharebtns">
    <a class="primary" href="mailto:${encodeURIComponent(e)}?subject=${encodeURIComponent('You’re invited to tack')}&body=${encodeURIComponent(inviteText(e))}">${ic('mail',15)} Email invite</a>
    <a href="https://wa.me/?text=${encodeURIComponent(inviteText(e))}" target="_blank" rel="noopener">${ic('chat',15)} WhatsApp</a>
    <button data-act="copy" data-text="${esc(inviteText(e))}">Copy invite</button></div>`;
}
function viewInvites(D){
  if(!S.me.isOwner)return viewBoard(D);
  const list=Object.entries(S.invites).map(([e,x])=>({email:e,at:num(x?.at),uid:typeof x?.uid==='string'?x.uid:null})).sort((a,b)=>b.at-a.at);
  const li=S.lastInvite;
  return`<div class="pad">${back('me','Back')}<div class="stack narrow" style="margin-top:6px;gap:20px">
   <div><h1 class="pageh" style="margin-bottom:6px">Invites and members</h1>
   <p style="margin:0;font-size:var(--t-14);line-height:1.55;color:var(--fg2)">Only emails on this list can sign up. Add someone, then send them the invite. They create an account with that email and confirm it.</p></div>
   <div class="stack gap8"><label class="formlabel" for="invE">Invite by email</label>
     <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="invE" class="inp" style="flex:1;min-width:200px" type="email" inputmode="email" autocapitalize="off" spellcheck="false" autocomplete="off" placeholder="name@college.edu.in" value="${esc(S.inv.email)}" data-bind="inv.email">
     <button class="pick" style="padding:12px 18px;font-size:var(--t-14)" data-act="invite">Add invite</button></div>
     ${S.err.inv?`<p class="err">${esc(S.err.inv)}</p>`:''}</div>
   ${li?`<div class="box stack" style="gap:10px;border:1px solid rgba(198,242,78,.35)">
     <span class="t1" style="font-size:var(--t-14)">${esc(li)} can sign up now. Send them the invite:</span>${shareButtons(li)}
     <p class="note" style="text-align:left">The invite has a link to the sign-up page with their email filled in.</p></div>`:''}
   <div class="stack gap8"><div class="sect"><h2 class="h2">Invited</h2><span class="time">${list.length}</span></div>
    ${list.length?list.map(x=>{const joined=x.uid&&S.peopleDocs[x.uid]?.adult;return`<div class="row">${joined?ring(x.uid,40):`<span class="add" style="width:40px;height:40px">${ic('clock',16)}</span>`}
      <span class="rowtext"><span class="t1">${esc(x.email)}</span><span class="t2" style="color:${joined?'var(--accent)':'var(--muted)'}">${joined?'Joined as '+esc(shortName(x.uid)):(x.uid?'Signed up, setting up profile':'Not signed up yet · invited '+since(x.at))}</span></span>
      ${joined?'':`<button class="iconbtn" data-act="reshare" data-email="${esc(x.email)}" aria-label="Send ${esc(x.email)} the invite again">${ic('mail',16)}</button>`}
      <button class="iconbtn" data-sheet="uninvite" data-about="${esc(x.email)}" aria-label="Remove ${esc(x.email)}">${ic('trash',16)}</button></div>`}).join('')
     :'<p class="note" style="text-align:left">Nobody invited yet. Add the first email above.</p>'}</div>
   <div class="stack gap8"><div class="sect"><h2 class="h2">Reports</h2><span class="time">${S.reports.length}</span></div>
    ${S.reports.length?S.reports.map(r=>`<div class="row" style="align-items:flex-start"><span class="rowtext" style="gap:3px"><span class="t1">${esc(shortName(str(r.by,128)))} reported ${esc(shortName(str(r.about,128)))}</span>
      <span class="t2">${esc(str(r.why,40))}${r.note?' · '+esc(str(r.note,200)):''}</span><span class="time">${stamp(num(r.at))}</span></span>
      <button class="btn2" style="width:auto;padding:8px 12px;font-size:var(--t-12)" data-person="${esc(str(r.about,128))}">View</button></div>`).join(''):'<p class="note" style="text-align:left">No reports.</p>'}</div>
   <div class="stack gap8"><label class="formlabel" for="invC">Campus name</label>
     <div style="display:flex;gap:8px"><input id="invC" class="inp" maxlength="40" value="${esc(S.inv.campus||campus())}" data-bind="inv.campus"><button class="btn2" style="width:auto;padding:12px 18px" data-act="saveCampus">Save</button></div></div>
   <p class="note" style="text-align:left">Removing an invite locks that person out straight away and takes their jobs off the board.</p>
  </div></div><div style="height:24px"></div>`;
}
function railHTML(D){
  const free=freePeople(D).filter(u=>u!==S.me.id),me=S.me.id;
  const myBids=Object.entries(S.myDoc?.bids||{}).map(([k,b])=>({b,j:D.jobByKey[k]})).filter(x=>x.j&&x.j.owner!==me).sort((a,b)=>num(b.b.at)-num(a.b.at)).slice(0,4);
  return`<div style="display:flex;align-items:baseline;gap:8px"><h2 class="h2">Free right now</h2><span style="font-size:var(--t-12);font-weight:600;color:var(--dim)">${D.members.length} on the board</span></div>
  <div class="stack gap8">${free.length?free.map(u=>`<div style="display:flex;align-items:center;gap:10px"><button class="rowmain" data-person="${esc(u)}">${ring(u,40)}
     <span class="rowtext"><span style="font-size:var(--t-14);font-weight:700">${esc(shortName(u))}</span><span style="font-size:var(--t-11);font-weight:500;color:var(--muted)">${esc([metaOf(u),str(pdoc(u).does,40)].filter(Boolean).join(' · '))}</span></span></button>
     <button data-dm="${esc(u)}" style="background:var(--surface2);border-radius:999px;padding:7px 13px;font-size:var(--t-12);font-weight:700">Ask</button></div>`).join('')
   :`<p class="note" style="text-align:left">Nobody else is marked free right now.</p>`}
   <button class="btn2" style="padding:10px;font-size:var(--t-12)" data-sheet="free">${num(S.myDoc?.freeUntil)>Date.now()?'You’re free until '+clock(num(S.myDoc.freeUntil)):'I’m free right now'}</button></div>
  <div style="height:1px;background:var(--line)"></div>
  <h2 class="h2">Your bids</h2>
  <div class="stack gap8">${myBids.length?myBids.map(({b,j})=>{const ok=j.accepted===me;return`<button data-job="${esc(j.key)}" style="display:flex;align-items:center;gap:10px;background:var(--surface);border-radius:var(--r-sm);padding:11px 13px;width:100%;text-align:left">
     <span class="rowtext"><span style="font-size:var(--t-12);font-weight:600;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(j.text)}</span>
     <span style="font-size:var(--t-11);font-weight:600;color:${ok?'var(--accent)':'var(--muted)'}">${ok?'Accepted · ₹'+fmt(j.agreed):j.accepted?'Went to someone else':jobState(j)==='open'?'Waiting · '+bidsFor(D,j.key).length+' bids in':'Closed'}</span></span>
     <span style="font-family:var(--display);font-size:var(--t-16);font-weight:800;color:var(--fg2);font-variant-numeric:tabular-nums">₹${fmt(b.amt)}</span></button>`}).join('')
   :'<p class="note" style="text-align:left">Bids you place show up here.</p>'}</div>`;
}

function sheetHTML(D){
  const s=S.sheet;if(!s)return'';let b='';
  const j=S.openJob?D.jobByKey[S.openJob]:null;
  switch(s.type){
  case'free':{const f=num(S.myDoc?.freeUntil)>Date.now();
    b=`<h2 id="sheetT">When are you free?</h2><p>Classmates see you at the top of the board until then.</p>
    <div class="stack gap8">${[['1h','For the next hour'],['3h','Next 3 hours'],['day','Rest of today']].map(([k,l])=>`<button class="btn2" data-free="${k}">${l}</button>`).join('')}
    ${f?'<button class="btn2 danger" data-free="off">I’m not free any more</button>':''}</div>`;break}
  case'pick':b=`<h2 id="sheetT">Pick ${esc(firstName(s.uid))} for ₹${fmt(s.amt)}?</h2><p>The job leaves the board and you two can sort out the details in chat. Pay them on UPI or cash after.</p>
    <button class="cta" data-act="confirmPick">Pick ${esc(firstName(s.uid))}</button><button class="linkbtn" data-act="closeSheet">Not yet</button>`;break;
  case'done':b=`<h2 id="sheetT">How did ${esc(j?firstName(j.accepted):'it')} do?</h2><p>Your stars and one line show on their profile. Other posters see them when they bid.</p>
    <div class="stars" role="group" aria-label="Rating">${[1,2,3,4,5].map(n=>`<button class="star ${S.rate.stars>=n?'on':''}" data-star="${n}" aria-label="${n} star${n>1?'s':''}" aria-pressed="${S.rate.stars>=n}">${ic('star',22,2,'currentColor',S.rate.stars>=n?'currentColor':'none')}</button>`).join('')}</div>
    <input id="rateT" class="inp" maxlength="140" placeholder="Showed up early, did it well…" value="${esc(S.rate.text)}" data-bind="rate.text" aria-label="One line about how it went">
    ${S.err.rate?`<p class="err">${esc(S.err.rate)}</p>`:''}<button class="cta" data-act="confirmDone">Mark as done</button>`;break;
  case'close':b=`<h2 id="sheetT">Close this job?</h2><p>It comes off the board. Bids on it are kept so people can see it closed.</p>
    <button class="cta" data-act="confirmClose">Close job</button><button class="linkbtn" data-act="closeSheet">Keep it open</button>`;break;
  case'remove':b=`<h2 id="sheetT">Take this job off the board?</h2><p>Use this for jobs that break the rules. The poster sees it marked as removed.</p>
    <button class="cta" style="background:var(--coral);box-shadow:none" data-act="confirmRemove">Remove job</button><button class="linkbtn" data-act="closeSheet">Cancel</button>`;break;
  case'uninvite':b=`<h2 id="sheetT">Remove ${esc(s.about)}?</h2><p>They can't sign up with this email, and if they already joined they're locked out straight away and their jobs leave the board.</p>
    <button class="cta" style="background:var(--coral);box-shadow:none" data-act="confirmUninvite">Remove</button><button class="linkbtn" data-act="closeSheet">Keep them</button>`;break;
  case'reshare':b=`<h2 id="sheetT">Send the invite again</h2><p>${esc(s.about)}</p>${shareButtons(s.about)}<button class="linkbtn" data-act="closeSheet">Done</button>`;break;
  case'report':b=`<h2 id="sheetT">Report ${esc(shortName(s.about))}</h2><p>${esc(organiser())} sees your report and can read chats with them.</p>
    <div class="chips" role="group" aria-label="Reason">${REASONS.map(r=>`<button class="chip ${S.rep.why===r?'on':''}" data-why="${esc(r)}" aria-pressed="${S.rep.why===r}">${esc(r)}</button>`).join('')}</div>
    <input id="repN" class="inp" maxlength="200" placeholder="What happened? (optional)" value="${esc(S.rep.note)}" data-bind="rep.note" aria-label="What happened">
    <label class="check" for="repB"><input type="checkbox" id="repB" data-bind="rep.block" ${S.rep.block?'checked':''}> Also block them. You won't see their jobs, bids or messages.</label>
    ${S.err.rep?`<p class="err">${esc(S.err.rep)}</p>`:''}<button class="cta" data-act="confirmReport">Send report</button>
    <button class="linkbtn" data-act="blockOnly">Just block them</button>`;break;
  case'erase':b=`<h2 id="sheetT">Delete your account?</h2><p>This erases your profile, the jobs you pinned, your bids, ratings you gave and your messages, and removes your login. It can't be undone.</p>
    <div class="stack gap8"><label class="formlabel" for="erPw">Your password</label>
    <input id="erPw" class="inp" type="password" autocomplete="current-password" value="${esc(S.erase.pw)}" data-bind="erase.pw"></div>
    ${S.err.erase?`<p class="err" role="alert">${esc(S.err.erase)}</p>`:''}
    <button class="cta" style="background:var(--coral);box-shadow:none" data-act="confirmErase" ${S.busy?'disabled':''}>${S.busy?'Deleting…':'Delete everything'}</button><button class="linkbtn" data-act="closeSheet">Keep my account</button>`;break;
  }
  return`<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetT">${b}</div>`;
}

const VIEWS={board:viewBoard,job:viewJob,post:viewPost,bids:viewBids,chats:viewChats,chat:viewChat,me:D=>viewPerson(S.me.id,D),person:D=>viewPerson(S.personOf,D),privacy:viewPrivacy,invites:viewInvites,edit:()=>`<div class="pad">${onboardHTML(true)}</div>`};
let lastView=null,lastSheet=null;const scrollMem={};
function render(){
  const a=document.activeElement,fid=a&&a.id;let s0=null,s1=null;try{s0=a.selectionStart;s1=a.selectionEnd}catch{}
  const gate=$('gate'),app=$('app');
  if(S.phase!=='app'){
    app.hidden=true;gate.hidden=false;gate.className='gate'+(['onboard','auth'].includes(S.phase)?' scroll':'');gate.innerHTML=gateHTML();$('sheetRoot').innerHTML='';lastView=null;
  }else{
    gate.hidden=true;app.hidden=false;
    const D=derive(),main=$('main');if(lastView&&lastView!==S.view)scrollMem[lastView]=main.scrollTop;
    const keep=lastView===S.view?main.scrollTop:((DEPTH[S.view]??1)===0?scrollMem[S.view]||0:0);
    main.innerHTML=(VIEWS[S.view]||viewBoard)(D);main.scrollTop=keep;
    if(lastView!==S.view&&S.view==='chat')requestAnimationFrame(()=>{main.scrollTop=main.scrollHeight});
    lastView=S.view;
    $('rail').innerHTML=railHTML(D);
    const navOn=v=>S.view===v||(v==='board'&&['job','person'].includes(S.view))||(v==='chats'&&S.view==='chat')||(v==='me'&&['privacy','edit'].includes(S.view))||(v==='invites'&&S.view==='invites');
    $('sidebar').innerHTML=`<div style="padding:0 6px"><div class="mark">tack</div><div class="sub"><span class="dot"></span><span>${esc(campus())} · ${boardJobs(D).length} pinned</span></div></div>
      <button class="cta" data-go="post" style="padding:13px 10px;font-size:var(--t-16)">+ Pin a job</button>
      <nav style="display:flex;flex-direction:column;gap:3px" aria-label="Sections">${[['board','Board','board'],['bids','Bids','bids'],['chats','Chats','chat'],['me','Profile','me']].concat(S.me.isOwner?[['invites','Invites','users']]:[])
        .map(([v,l,i])=>`<button class="navitem ${navOn(v)?'on':''}" data-go="${v}" ${navOn(v)?'aria-current="page"':''}>${ic(i,18)} ${l}${v==='chats'&&D.unread?'<span class="udot" aria-label="Unread"></span>':''}</button>`).join('')}</nav>
      <button class="card" style="margin-top:auto;padding:10px 12px;border-radius:var(--r-sm)" data-go="me">${ring(S.me.id,38)}<span class="rowtext"><span style="font-size:var(--t-12);font-weight:700">${esc(shortName(S.me.id))}</span>
        <span style="font-size:var(--t-11);font-weight:500;color:var(--muted)">${esc(metaOf(S.me.id)||campus())}</span></span></button>`;
    $('tabbar').innerHTML=[['board','Board','board'],['bids','Bids','bids'],['post','','plus'],['chats','Chats','chat'],['me','Me','me']].map(([v,l,i])=>v==='post'
      ?`<button class="tab" data-go="post" aria-label="Pin a job"><span class="fab">${ic('plus',24,3,'var(--bg)')}</span></button>`
      :`<button class="tab ${navOn(v)||(v==='me'&&S.view==='invites')?'on':''}" data-go="${v}">${ic(i,20)}<span>${l}</span>${v==='chats'&&D.unread?'<span class="udot"></span>':''}</button>`).join('');
    const st=S.sheet?S.sheet.type:null;$('sheetRoot').innerHTML=sheetHTML(D);
    if(st&&st!==lastSheet)$('sheetRoot').classList.add('enter');else if(!st)$('sheetRoot').classList.remove('enter');
    if(st!==lastSheet&&st)requestAnimationFrame(()=>requestAnimationFrame(()=>$('sheetRoot').classList.remove('enter')));
    lastSheet=st;
  }
  if(fid){const el=$(fid);if(el&&el!==document.activeElement){el.focus({preventScroll:true});try{if(s0!=null)el.setSelectionRange(s0,s1)}catch{}}}
}
let toastT;
function toast(msg){const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true},2800)}
const DEPTH={board:0,bids:0,chats:0,me:0,invites:1,post:1,job:1,person:1,chat:1,privacy:1,edit:1};
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
function go(v,keepThread){
  const from=S.view;
  if(v!=='chat'&&!keepThread)closeThread();
  const apply=()=>{S.view=v;S.sheet=null;S.err={};if(v==='edit')seedOnb();if(v==='invites')S.inv.campus='';render();
    if(v==='board'&&from==='job'&&S.openJob){const p=document.querySelector(`.tile[data-job="${CSS.escape(S.openJob)}"] .price`);if(p)p.style.viewTransitionName='jp'}};
  if(from===v||S.phase!=='app'||!document.startViewTransition||reduceMotion.matches){apply();return}
  const d=(DEPTH[v]??1)-(DEPTH[from]??1),root=document.documentElement;
  root.dataset.nav=d>0?'fwd':d<0?'back':'tab';
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
  reload(){location.reload()},
  logout(){logOut()},
  closeSheet(){closeSheet()},
  checkVerified(){checkVerified().then(()=>{if(S.phase==='verify')toast('Not confirmed yet. Open the link in the email first.')})},
  async resendVerify(){try{await sendVerify(S.auth.currentUser);toast('Sent. Check your inbox and spam.')}catch(e){toast(authMsg(e))}},
  clearPhoto(){S.onb.photo='';render()},
  join(){const o=S.onb;
    if(!need(o.name.trim().length>=2,'onb','Add your full name.')||!need(o.year,'onb','Pick your year.')||!need(o.branch.trim(),'onb','Add your branch.')||!need(o.adult,'onb','tack is for students who are 18 or older.')||!need(o.rules,'onb','Tick the posting rule to continue.'))return;
    saveMine(d=>({...d,name:o.name.trim().slice(0,60),photo:o.photo||'',year:o.year,branch:o.branch.trim().slice(0,24),does:o.does.trim().slice(0,60),ring:o.ring,adult:true,joinedAt:d.joinedAt||Date.now(),jobs:d.jobs||{},bids:d.bids||{}}));
    S.err={};S.view='board';computePhase();render();toast('You’re on the board')},
  saveProfile(){const o=S.onb;if(!need(o.name.trim().length>=2,'onb','Add your full name.')||!need(o.year,'onb','Pick your year.')||!need(o.branch.trim(),'onb','Add your branch.'))return;
    saveMine(d=>({...d,name:o.name.trim().slice(0,60),photo:o.photo||'',year:o.year,branch:o.branch.trim().slice(0,24),does:o.does.trim().slice(0,60),ring:o.ring}));go('me');toast('Profile saved')},
  post(){const d=S.draft,text=d.text.trim(),price=digits(d.price);
    if(!need(text.length>=8,'post','Say what you need in a few more words.')||!need(price>=10&&price<=20000,'post','Set a price between ₹10 and ₹20,000.'))return;
    const id=rid(),at=Date.now(),where=(d.whereText.trim()||d.where).slice(0,40);
    saveMine(x=>{x.jobs={...(x.jobs||{}),[id]:{text:text.slice(0,200),more:d.more.trim().slice(0,600),price,kind:d.kind,when:d.when,where,at,deadline:deadlineFor(d.when,at),status:'open'}};return x});
    S.draft=blankDraft();S.sort='newest';go('board');toast('Pinned to the board')},
  repost(){const j=derive().jobByKey[S.openJob];if(!j)return;S.draft={...blankDraft(),text:j.text,price:String(j.price),kind:KINDS.includes(j.kind)?j.kind:'Other',where:WHERES.includes(j.where)?j.where:'Gate 1',whereText:WHERES.includes(j.where)?'':j.where,more:j.more};
    saveMine(x=>{if(x.jobs?.[j.id])x.jobs[j.id].status='closed';return x});go('post')},
  bid(){const j=derive().jobByKey[S.openJob];if(!j)return;const amt=digits(S.bid.amt);
    if(!need(amt>=1&&amt<=50000,'bid','Enter a bid in rupees.'))return;const had=!!(S.myDoc?.bids||{})[j.key];
    saveMine(x=>{x.bids={...(x.bids||{}),[j.key]:{amt,say:S.bid.say.trim().slice(0,90),at:Date.now()}};return x});S.err={};toast(had?'Bid updated':'Bid placed')},
  withdraw(){const k=S.openJob;saveMine(x=>{if(x.bids)delete x.bids[k];return x});S.bid={key:null};toast('Bid withdrawn')},
  confirmPick(){const j=derive().jobByKey[S.openJob],s=S.sheet;if(!j||!s)return;
    saveMine(x=>{const o=x.jobs?.[j.id];if(o){o.status='assigned';o.accepted=s.uid;o.agreed=s.amt;o.assignedAt=Date.now()}return x});
    S.sheet=null;toast('Picked '+firstName(s.uid)+'. Sort out the details in chat.');openThread({key:jobThreadKey(j.key,s.uid),other:s.uid,jobKey:j.key})},
  confirmDone(){const j=derive().jobByKey[S.openJob];if(!j)return;if(!need(S.rate.stars>0,'rate','Pick a star rating.'))return;
    const r={stars:S.rate.stars,text:S.rate.text.trim().slice(0,140),at:Date.now()};
    saveMine(x=>{const o=x.jobs?.[j.id];if(o){o.status='done';o.doneAt=r.at;o.rating=r}return x});S.sheet=null;toast('Marked done. Thanks for rating.')},
  confirmClose(){const j=derive().jobByKey[S.openJob];if(!j)return;saveMine(x=>{if(x.jobs?.[j.id])x.jobs[j.id].status='closed';return x});S.sheet=null;toast('Job closed')},
  confirmRemove(){const j=derive().jobByKey[S.openJob];if(!j||!S.me.isOwner)return;const {doc,updateDoc,FieldPath}=S.fb;
    updateDoc(doc(S.db,'people',j.owner),new FieldPath('jobs',j.id,'status'),'removed').catch(writeErr);S.sheet=null;toast('Job removed from the board');go('board')},
  confirmReport(){const s=S.sheet;if(!need(S.rep.why,'rep','Pick a reason.'))return;const {collection,addDoc}=S.fb;
    addDoc(collection(S.db,'reports'),{by:S.me.id,about:s.about,why:S.rep.why,note:S.rep.note.trim().slice(0,200),at:Date.now()}).catch(writeErr);
    if(S.rep.block)savePriv({blocked:[...new Set([...arr(S.priv.blocked),s.about])]});
    S.sheet=null;toast(S.rep.block?'Reported and blocked':'Report sent to '+organiser());if(S.rep.block)go('board');else render()},
  blockOnly(){const s=S.sheet;savePriv({blocked:[...new Set([...arr(S.priv.blocked),s.about])]});S.sheet=null;toast('Blocked');go('board')},
  async confirmErase(){
    const {doc,deleteDoc,collection,query,where,getDocs,deleteUser,EmailAuthProvider,reauthenticateWithCredential}=S.fb,me=S.me.id,user=S.auth.currentUser;
    if(!need(S.erase.pw,'erase','Enter your password to confirm.'))return;
    S.busy=true;S.err={};render();
    try{await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,S.erase.pw))}
    catch(e){S.busy=false;S.err={erase:e.code==='auth/too-many-requests'?authMsg(e):'That password isn\u2019t right.'};render();return}
    try{
      for(const[k,t]of Object.entries(S.threadDocs)){const q=await getDocs(query(collection(S.db,'threads',k,'msgs'),where('by','==',me)));for(const m of q.docs)await deleteDoc(m.ref);
        if(t&&t.lastBy===me)await S.fb.setDoc(doc(S.db,'threads',k),{lastText:'Message deleted'},{merge:true})}
      await deleteDoc(doc(S.db,'people',me));await deleteDoc(doc(S.db,'private',me));
      S.erased=true;stopSubs();await deleteUser(user);
      S.busy=false;S.sheet=null;S.erase={pw:''};S.phase='erased';render();
    }catch(e){S.busy=false;S.err={erase:'Couldn\u2019t delete everything. Check your connection and try again.'};render();console.warn(e)}},
  send(){sendMsg()},
  invite(){const e=S.inv.email.trim().toLowerCase();
    if(!need(validEmail(e),'inv','That doesn’t look like an email address.'))return;
    if(!need(!S.invites[e],'inv','That email is already invited.'))return;
    const {doc,setDoc}=S.fb;
    S.invites={...S.invites,[e]:{at:Date.now()}};
    setDoc(doc(S.db,'invites',e),{at:Date.now(),by:S.me.id}).catch(writeErr);
    S.inv.email='';S.lastInvite=e;S.err={};render();toast('Invited. Now send it to them.')},
  reshare(el){S.sheet={type:'reshare',about:el.dataset.email};render()},
  confirmUninvite(){const e=S.sheet?.about;if(!e)return;const {doc,deleteDoc,updateDoc}=S.fb,inv=S.invites[e];
    deleteDoc(doc(S.db,'invites',e)).catch(writeErr);
    if(inv&&typeof inv.uid==='string'&&S.peopleDocs[inv.uid])updateDoc(doc(S.db,'people',inv.uid),{removed:true}).catch(()=>{});
    if(S.lastInvite===e)S.lastInvite=null;S.sheet=null;toast('Removed '+e)},
  saveCampus(){const c=(S.inv.campus||'').trim();if(!c)return;const {doc,setDoc}=S.fb;
    S.config={...S.config,campus:c.slice(0,40)};setDoc(doc(S.db,'config','app'),S.config).catch(writeErr);toast('Campus name saved');render()},
  copy(el){const t=el.dataset.text||'';
    try{navigator.clipboard.writeText(t).then(()=>toast('Copied'),()=>toast('Couldn’t copy. Select the text and copy it.'))}catch{toast('Couldn’t copy.')}}
};

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-go],[data-job],[data-sort],[data-set],[data-bump],[data-person],[data-thread],[data-thread-job],[data-thread-with],[data-dm],[data-pick],[data-sheet],[data-act],[data-onb],[data-free],[data-star],[data-why],[data-auth]');
  if(!el)return;const ds=el.dataset;
  if(ds.auth!==undefined){S.authMode=ds.auth;S.authErr='';S.authMsg='';render();return}
  if(ds.act!==undefined){const f=ACT[ds.act];if(f){e.preventDefault();f(el)}return}
  if(ds.go!==undefined){go(ds.go);return}
  if(ds.job!==undefined){const pr=el.classList.contains('tile')&&el.querySelector('.price');if(pr&&document.startViewTransition&&!reduceMotion.matches)pr.style.viewTransitionName='jp';S.openJob=ds.job;S.bid={key:null};go('job');return}
  if(ds.sort!==undefined){S.sort=ds.sort;render();return}
  if(ds.set!==undefined){S.draft[ds.set]=ds.val;if(ds.set==='where')S.draft.whereText='';render();return}
  if(ds.bump!==undefined){S.draft.price=String((digits(S.draft.price)||0)+ +ds.bump);render();return}
  if(ds.person!==undefined){if(ds.person===S.me?.id){go('me');return}S.personOf=ds.person;go('person');return}
  if(ds.onb!==undefined){S.onb[ds.onb]=ds.val;render();return}
  if(ds.pick!==undefined){const b=bidsFor(derive(),S.openJob).find(x=>x.by===ds.pick);if(b){S.sheet={type:'pick',uid:b.by,amt:b.amt};render()}return}
  if(ds.sheet!==undefined){S.err={};S.erase={pw:''};if(ds.sheet==='done')S.rate={stars:0,text:''};if(ds.sheet==='report')S.rep={why:'',note:'',block:false};S.sheet={type:ds.sheet,about:ds.about};render();return}
  if(ds.free!==undefined){const now=new Date(),t={'1h':+now+36e5,'3h':+now+3*36e5,day:new Date(now).setHours(23,59,0,0),off:0}[ds.free];
    saveMine(d=>{d.freeUntil=t;return d});S.sheet=null;toast(t?'You’re on the Free right now row':'Marked not free');return}
  if(ds.star!==undefined){S.rate.stars=+ds.star;render();return}
  if(ds.why!==undefined){S.rep.why=ds.why;render();return}
  const D=derive(),me=S.me.id;
  if(ds.thread!==undefined){const t=D.threads.find(x=>x.key===ds.thread);if(t)openThread(t);return}
  if(ds.threadJob!==undefined){const j=D.jobByKey[S.openJob];if(j)openThread({key:jobThreadKey(j.key,me),other:j.owner,jobKey:j.key});return}
  if(ds.threadWith!==undefined){const j=D.jobByKey[S.openJob];if(j)openThread({key:jobThreadKey(j.key,ds.threadWith),other:ds.threadWith,jobKey:j.key});return}
  if(ds.dm!==undefined){if(ds.dm!==me)openThread({key:dmKey(me,ds.dm),other:ds.dm,jobKey:null});return}
});
document.addEventListener('submit',e=>{
  const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();
  if(S.busy)return;({signup:doSignup,login:doLogin,reset:doReset})[f.dataset.form]?.();
});
function bind(e){const b=e.target.dataset?.bind;if(!b)return;const[o,k]=b.split('.');S[o][k]=e.target.type==='checkbox'?e.target.checked:e.target.value}
document.addEventListener('input',bind);
document.addEventListener('change',async e=>{
  bind(e);
  if(e.target.matches('[data-photo]')){
    try{S.onb.photo=await readPhoto(e.target.files[0]);S.err={}}catch{S.err={onb:'That photo didn’t work. Use a JPG or PNG.'}}
    render();
  }
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&S.sheet){closeSheet();return}
  if(e.key==='Enter'&&e.target.id==='msg'){e.preventDefault();sendMsg();return}
  if(e.key==='Enter'&&e.target.id==='invE'){e.preventDefault();ACT.invite();return}
});
setInterval(()=>{if(S.phase==='app'&&!document.activeElement?.matches?.('input,textarea'))render()},30000);
boot();
