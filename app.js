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
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/>',
 search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',
 camera:'<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>'
};
const ic=(n,s=20,w=2,c='currentColor',fill='none')=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${fill}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

const blankDraft=()=>({text:'',price:'',kind:'Errand',when:'Today',where:'Gate 1',whereText:'',more:'',pics:[],useLoc:locOptIn()});
const inviteParam=(new URLSearchParams(location.search).get('invite')||'').trim().toLowerCase();
const codeParam=((new URLSearchParams(location.search).get('code')||'').trim().toLowerCase().match(/^[a-z0-9]{8,24}$/)||[''])[0];
const S={
  phase:'loading', fb:null, db:null, auth:null, user:null, me:null, signingUp:false, erased:false,
  authMode:inviteParam||codeParam?'signup':'login', authErr:'', authMsg:'', busy:false,
  form:{name:'',email:inviteParam,pw:''},
  ready:{config:false,people:false,priv:false}, subs:[],
  config:{}, peopleDocs:{}, priv:{}, threadDocs:{}, pitchIn:{}, pitchMine:{}, offersIn:{}, offersOut:{}, myCodes:{}, lastCode:null,
  offer:{to:null,prevJob:null,text:'',price:'',when:'Next hour',where:''}, invites:{}, reports:[], myInvite:null,
  myDoc:null, pendingMine:0,
  view:'board', openJob:null, personOf:null, sort:'high', find:{q:''}, near:false,
  draft:blankDraft(), bid:{key:null,amt:'',say:'',pics:[]}, pics:{}, revs:{}, allRevs:null, actTab:'all', actSeenAt:0, intro:{on:false,i:0}, fresh:null, chatDraft:{text:''},
  onb:{name:'',photo:'',year:'',branch:'',does:'',ring:'',adult:false,rules:false},
  inv:{email:'',campus:''}, lastInvite:null,
  picks:{}, repDocs:{},
  sheet:null, rate:{a:0,b:0,c:0,d:0,text:'',rev:'',pics:[]}, rep:{why:'',note:'',block:false}, erase:{pw:''},
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
function face(uid,s){const src=photoOf(uid);return src?`<img class="av" src="${src}" width="${s}" height="${s}" alt="">`:`<span class="av av-empty" style="background:${ringOf(uid)}2e;color:${ringOf(uid)};width:${s}px;height:${s}px;font-size:${Math.round(s*.4)}px">${esc(firstName(uid)[0]||'?')}</span>`}
function ring(uid,s){return `<span class="ring" style="border-color:${ringOf(uid)};width:${s}px;height:${s}px">${face(uid,s-8)}</span>`}
const campus=()=>str(S.config.campus,40)||DEFAULT_CAMPUS;
const ownerId=()=>typeof S.config.adminUid==='string'?S.config.adminUid:null;
const organiser=()=>{const o=ownerId();return o&&fullName(o)?firstName(o):'the organiser'};
const isMember=uid=>{const d=pdoc(uid);return !!d.adult&&!d.removed};

function normJob(id,j,uid){
  return{id,owner:uid,key:uid+'~'+id,text:str(j.text,200),more:str(j.more,600),price:num(j.price),kind:str(j.kind,20),
    when:str(j.when,20),where:str(j.where,40),at:num(j.at),deadline:num(j.deadline),
    status:STATUSES.includes(j.status)?j.status:'open',doneAt:num(j.doneAt),pics:Math.min(MAX_PICS,Math.max(0,Math.floor(num(j.pics)))),geo:geoOk(j.geo),accepted:null,agreed:0,pick:null};
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
  for(const p of [...Object.values(S.pitchIn),...Object.values(S.pitchMine)]){
    if(!p||typeof p.job!=='string'||typeof p.by!=='string'||!jobByKey[p.job]||!members.includes(p.by)||!(num(p.amt)>0))continue;
    const l=(bidsByJob[p.job]=bidsByJob[p.job]||[]);if(!l.some(b=>b.by===p.by))l.push({by:p.by,amt:num(p.amt),say:str(p.say,90),at:num(p.at),pics:Math.min(MAX_PICS,num(p.pics)),near:p.near===true})}
  for(const[k,pk]of Object.entries(S.picks)){const j=jobByKey[k];if(!j||!pk||typeof pk.doer!=='string')continue;
    j.accepted=pk.doer;j.agreed=num(pk.agreed);j.pick=pk;if(pk.doneAt)j.doneAt=num(pk.doneAt)}
  const D={members,jobs,jobByKey,bidsByJob,blocked};
  D.threads=threadsOf(D);D.unread=D.threads.filter(t=>t.unread).length;
  D.notes=notesOf(D);D.newNotes=S.view==='bids'?0:D.notes.filter(n=>n.at>num(S.priv.actSeen)&&n.at<=Date.now()+6e4).length;
  D.toConfirm=jobs.filter(j=>j.accepted===me&&j.status==='done'&&!payOf(j)?.ok).length;
  D.offersWaiting=offerList(S.offersIn).filter(o=>o.status==='pending'&&D.members.includes(o.owner)&&!D.blocked.has(o.owner)).length;
  return D;
}
function myBidOn(jobKey){const p=S.pitchMine[jobKey+'~'+S.me.id];return p&&num(p.amt)>0?{amt:num(p.amt),say:str(p.say,90),at:num(p.at),pics:Math.min(MAX_PICS,num(p.pics))}:null}
function threadOpen(k){return !!S.threadDocs[k]}
function canMessage(t,D){const me=S.me.id;
  if(!t.jobKey)return false;
  const j=D.jobByKey[t.jobKey];if(!j)return threadOpen(t.key);return j.owner===me||j.accepted===me||threadOpen(t.key)}
function workedWith(uid,D){const me=S.me.id;return D.jobs.filter(j=>(j.status==='assigned'||j.status==='done')&&((j.owner===me&&j.accepted===uid)||(j.owner===uid&&j.accepted===me)))}
function lastJobFor(uid,D){return D.jobs.filter(j=>j.owner===S.me.id&&j.accepted===uid&&(j.status==='assigned'||j.status==='done')).sort((a,b)=>b.at-a.at)[0]||null}
const offerList=o=>Object.entries(o).map(([k,v])=>({key:k,...v})).filter(x=>x&&typeof x.text==='string');
function bidsFor(D,key){return (D.bidsByJob[key]||[]).filter(b=>!D.blocked.has(b.by))}
function notesOf(D){const me=S.me.id,out=[],J=k=>D.jobByKey[k],t=j=>{const x=str(j.text,200).trim().replace(/[.!?\s]+$/,'');return'<i>\u201c'+esc(x.length>56?x.slice(0,55).trim()+'\u2026':x)+'\u201d</i>'},nm=u=>'<b>'+esc(firstName(u))+'</b>',ok=u=>u&&D.members.includes(u)&&!D.blocked.has(u);
  const add=(at,who,html,go)=>{if(at>0)out.push({at,who,html,...go})};
  const joined=num(S.myDoc?.joinedAt);add(joined,'tack','Welcome to tack. Pin a small job or bid on one from the board.',{go:'board'});
  for(const j of D.jobs){
    if(j.owner===me){
      for(const b of bidsFor(D,j.key))if(b.by!==me&&ok(b.by))add(b.at,b.by,`${nm(b.by)} bid ₹${fmt(b.amt)} on ${t(j)}`,{job:j.key});
      const pk=j.pick;if(pk&&ok(pk.doer)){const pay=payOf(j);
        if(pay)add(pay.at,pk.doer,pay.ok?`${nm(pk.doer)} confirmed they got ₹${fmt(j.agreed)} for ${t(j)}`:`${nm(pk.doer)} hasn\u2019t got your ₹${fmt(j.agreed)} for ${t(j)} yet`,{job:j.key})}
      const st=jobState(j);
      if(st==='expired')add(j.deadline,'tack',`Time ran out on ${t(j)}. Pin it again if you still need it.`,{job:j.key});
      if(st==='removed')add(j.at,'tack',`${t(j)} was taken off the board by ${esc(organiser())}.`,{job:j.key});
    }else if(j.accepted===me&&j.pick){const pk=j.pick;
      add(num(pk.at),j.owner,`${nm(j.owner)} picked you for ${t(j)} · ₹${fmt(j.agreed)}`,{job:j.key});
      if(pk.status==='done')add(num(pk.doneAt),j.owner,`${nm(j.owner)} marked ${t(j)} as done. Did you get ₹${fmt(j.agreed)}?`,{job:j.key});
      if(typeof pk.review==='string')add(num(pk.doneAt)+1,'tack','Someone you worked for left you a public review.',{person:me});
    }
  }
  for(const o of offerList(S.offersIn))if(ok(o.owner))add(num(o.at),o.owner,`${nm(o.owner)} asked you: ${esc(str(o.text,60))} · ₹${fmt(num(o.price))}`,{go:'bids'});
  for(const o of offerList(S.offersOut))if(ok(o.to)&&o.status!=='pending')add(num(o.respondedAt),o.to,o.status==='accepted'?`${nm(o.to)} said yes to ${esc(str(o.text,60))}`:`${nm(o.to)} can\u2019t do ${esc(str(o.text,60))} this time`,{go:'bids'});
  return out.sort((a,b)=>b.at-a.at).slice(0,80);
}
function tackFace(s){return`<span class="tackav" style="width:${s}px;height:${s}px" role="img" aria-label="tack"></span>`}
function boardJobs(D){
  const now=Date.now();
  const l=D.jobs.filter(j=>j.status==='open'&&j.deadline>now&&!D.blocked.has(j.owner));
  return sortJobs(l);
}
function findJobs(l){const q=S.find.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if(q.length)l=l.filter(j=>{const h=[j.text,j.more,j.kind,j.when,j.where,firstName(j.owner),'₹'+j.price].join(' ').toLowerCase();return q.every(w=>h.includes(w))});
  if(S.near)l=l.filter(nearMe);
  return l;
}
function sortJobs(l){
  if(S.sort==='high')l.sort((a,b)=>b.price-a.price||b.at-a.at);
  else if(S.sort==='closing')l.sort((a,b)=>a.deadline-b.deadline);
  else l.sort((a,b)=>b.at-a.at);
  return l;
}
function freePeople(D){const now=Date.now();return D.members.filter(u=>num(pdoc(u).freeUntil)>now&&!D.blocked.has(u))}
function payOf(j){const x=j.pick&&j.pick.paid;return x&&typeof x==='object'&&typeof x.ok==='boolean'?{ok:x.ok,at:num(x.at)}:null}
const PAY_GRACE=3*864e5;
function repOf(uid,side){const r=S.repDocs[uid],x=r&&r[side]&&typeof r[side]==='object'?r[side]:{},n=Math.max(0,Math.round(num(x.n)));
  const per=CRIT[side].map(([k,l])=>({k,l,v:n?num(x[k])/n:0}));return{n,per,avg:n?(per.reduce((a,c)=>a+c.v,0)/per.length):0}}
function stats(uid,D){
  const d=repOf(uid,'d'),p=repOf(uid,'p');let earned=0;
  if(uid===S.me.id)for(const j of D.jobs)if(j.accepted===uid&&payOf(j)?.ok)earned+=j.agreed||j.price;
  return{done:d.n,avg:d.n?d.avg.toFixed(1):null,doer:d,poster:p,earned};
}
function rateLine(uid,D){const s=stats(uid,D);return s.avg?` · ★${s.avg} from ${s.done} ${s.done===1?'job':'jobs'}`:''}
function posterLine(uid){const p=repOf(uid,'p');return p.n?` · ★${p.avg.toFixed(1)} as a poster`:''}
const jobThreadKey=(jobKey,bidder)=>`j~${jobKey}~${bidder}`;
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
  const jobs=Object.entries(d.jobs||{});const live=jobs.filter(([,j])=>j.status==='open'||j.status==='assigned');
  const rest=jobs.filter(([,j])=>!(j.status==='open'||j.status==='assigned')).sort((a,b)=>num(b[1].at)-num(a[1].at)).slice(0,80);
  d.jobs=Object.fromEntries([...live,...rest]);delete d.paid;delete d.bids;
  return d;
}
async function rateBatch(pickKey,about,side,vals,pickPatch){
  const {doc,writeBatch}=S.fb,me=S.me.id,t=Array.from(crypto.getRandomValues(new Uint8Array(12)),x=>x.toString(16).padStart(2,'0')).join('');
  const cur=S.repDocs[about]||{},sideCur=cur[side]&&typeof cur[side]==='object'?cur[side]:{},next={n:Math.round(num(sideCur.n))+1};
  for(const[k]of CRIT[side])next[k]=Math.round(num(sideCur[k]))+vals[k];
  const other=side==='d'?'p':'d',repDoc={[side]:next,proof:t};if(cur[other])repDoc[other]=cur[other];
  const b=writeBatch(S.db);
  b.update(doc(S.db,'picks',pickKey),pickPatch);
  b.set(doc(S.db,'tokens',t),{by:me,about,pick:pickKey,role:side});
  b.set(doc(S.db,'rep',about),repDoc);
  await b.commit();
}
async function reviewBatch(pickKey,about,text,pics,stars){
  const {doc,writeBatch}=S.fb,me=S.me.id,rid=Array.from(crypto.getRandomValues(new Uint8Array(12)),x=>x.toString(16).padStart(2,'0')).join(''),now=new Date();
  const b=writeBatch(S.db);
  b.set(doc(S.db,'tokens',rid),{by:me,about,pick:pickKey,role:'r'});
  b.set(doc(S.db,'reviews',rid),{about,text,at:new Date(now.getFullYear(),now.getMonth(),1).getTime(),...(stars?{stars:Math.round(stars*10)/10}:{}),...(pics.length?{pics:pics.length}:{})});
  if(pics.length)b.set(doc(S.db,'reviewpics',rid),{pics});
  b.update(doc(S.db,'picks',pickKey),{review:rid});
  await b.commit();
  S.picks={...S.picks,[pickKey]:{...S.picks[pickKey],review:rid}};if(pics.length)S.pics['r:'+rid]=pics;delete S.revs[about];
}
function reviewsOf(uid){const v=S.revs[uid];if(v!==undefined)return v;S.revs[uid]=null;const {collection,query,where,limit,getDocs}=S.fb;
  getDocs(query(collection(S.db,'reviews'),where('about','==',uid),limit(60))).then(q=>{const l=[];q.forEach(d=>{const r=d.data();if(r&&typeof r.text==='string'&&r.text.trim())
    l.push({id:d.id,text:str(r.text,400),at:num(r.at),stars:num(r.stars)>=1&&num(r.stars)<=5?num(r.stars):0,pics:Math.min(MAX_PICS,num(r.pics))})});S.revs[uid]=l.sort((a,b)=>b.at-a.at)})
    .catch(e=>{console.warn(e);S.revs[uid]=[]}).finally(()=>{if(S.phase==='app')render()});
  return null}
function reviewList(uid){const l=reviewsOf(uid);if(!l||!l.length)return'';const shown=S.allRevs===uid?l:l.slice(0,5),fn=esc(firstName(uid));
  return`<div class="stack gap8"><div style="display:flex;align-items:baseline;gap:8px"><h2 class="h2">Reviews</h2><span style="font-size:var(--t-12);font-weight:600;color:var(--muted)">${l.length} from posters ${fn} worked for</span></div>
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
      status:'assigned',offer:true};return x});
    enqueue('me',()=>S.fb.setDoc(S.fb.doc(S.db,'picks',S.me.id+'~'+o.job),{owner:S.me.id,job:o.job,doer:o.to,agreed:num(o.price),at:num(o.respondedAt)||Date.now(),status:'assigned'}))
      .then(()=>S.fb.deleteDoc(S.fb.doc(S.db,'offers',o.key))).catch(e=>console.warn(e));
  }
}
function savePitch(jobKey,say,amt,pics,near){const {doc,setDoc,deleteDoc}=S.fb,me=S.me.id,id=jobKey+'~'+me,owner=jobKey.split('~')[0];
  if(amt){const p={owner,by:me,job:jobKey,amt,say:(say||'').slice(0,90),at:Date.now(),...(pics?{pics}:{}),...(near?{near:true}:{})};S.pitchMine={...S.pitchMine,[id]:p};return setDoc(doc(S.db,'pitches',id),p).catch(writeErr)}
  const m={...S.pitchMine};delete m[id];S.pitchMine=m;return deleteDoc(doc(S.db,'pitches',id)).catch(()=>{})}
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
  const pk={own:{},doer:{}},mergePicks=()=>{S.picks={...pk.doer,...pk.own};if(S.phase==='app')render()};
  S.subs.push(onSnapshot(query(collection(db,'picks'),where('owner','==',me)),snap=>{pk.own={};snap.forEach(x=>{pk.own[x.id]=x.data()});mergePicks()},e=>console.warn(e)));
  S.subs.push(onSnapshot(query(collection(db,'picks'),where('doer','==',me)),snap=>{pk.doer={};snap.forEach(x=>{pk.doer[x.id]=x.data()});mergePicks()},e=>console.warn(e)));
  S.subs.push(onSnapshot(collection(db,'rep'),snap=>{const r={};snap.forEach(x=>{r[x.id]=x.data()});S.repDocs=r;if(S.phase==='app')render()},e=>console.warn(e)));
  S.subs.push(onSnapshot(query(collection(db,'offers'),where('to','==',me)),snap=>{const o={};snap.forEach(x=>{o[x.id]=x.data()});S.offersIn=o;if(S.phase==='app')render()},e=>console.warn(e)));
  S.subs.push(onSnapshot(query(collection(db,'offers'),where('owner','==',me)),snap=>{const o={};snap.forEach(x=>{o[x.id]=x.data()});S.offersOut=o;convertOffers();if(S.phase==='app')render()},e=>console.warn(e)));
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
  const {doc,setDoc,updateDoc}=S.fb,me=S.me.id;
  if(!firstLoadDone){
    firstLoadDone=true;
    if(S.me.isOwner&&ownerId()!==me)setDoc(doc(S.db,'config','app'),{...S.config,adminUid:me,campus:str(S.config.campus,40)||DEFAULT_CAMPUS}).catch(writeErr);
    if(!S.me.isOwner&&S.myInvite&&S.myInvite.uid!==me)updateDoc(doc(S.db,'invites',S.me.email),{uid:me,joinedAt:Date.now()}).catch(()=>{});
    if(S.myDoc&&S.myDoc.removed)saveMine(d=>{delete d.removed;return d});
  }
  computePhase();render();
  if(S.phase==='app'&&!S.introChecked&&!S.joining){S.introChecked=true;if(!S.priv.introSeen)setTimeout(()=>{if(!S.intro.on&&S.phase==='app'&&!S.priv.introSeen)openIntro()},700)}
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
  let codeMsg='';
  if(!ok&&codeParam){
    try{const cs=await getDoc(doc(S.db,'invcodes',codeParam));
      if(cs.exists()&&!cs.data().usedBy){const b=S.fb.writeBatch(S.db),now=Date.now();
        b.set(doc(S.db,'invites',email),{code:codeParam,by:cs.data().by,at:now});
        b.update(doc(S.db,'invcodes',codeParam),{usedBy:cred.user.uid,usedAt:now});
        await b.commit();ok=true}
      else codeMsg=cs.exists()?'This invite link has already been used. Ask your friend for a new one.':'This invite link isn\u2019t valid. Check you copied all of it, or ask your friend for a new one.'}
    catch{codeMsg='This invite link didn\u2019t work. Ask your friend for a new one.'}
  }
  if(!ok){
    try{await deleteUser(cred.user)}catch{try{await signOut(S.auth)}catch{}}
    S.signingUp=false;S.busy=false;S.phase='auth';
    return authFail(codeMsg||`${email} isn’t on the invite list. Use the email address your invite was sent to, or ask the organiser to invite you.`);
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
async function logOut(){stopSubs();firstLoadDone=false;S.view='board';S.myDoc=null;S.authMode='login';S.authErr='';S.authMsg='';S.form.pw='';try{await S.fb.signOut(S.auth)}catch{}}

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
  if(!canMessage(c,derive())){toast('You can\u2019t message them yet.');return}
  const {collection,addDoc,doc,setDoc}=S.fb,me=S.me.id,at=Date.now();
  S.chatDraft.text='';
  addDoc(collection(S.db,'threads',c.key,'msgs'),{by:me,t:t.slice(0,1000),at}).catch(writeErr);
  setDoc(doc(S.db,'threads',c.key),{members:[me,c.other],job:c.jobKey||null,open:true,lastText:t.slice(0,80),lastAt:at,lastBy:me},{merge:true}).catch(writeErr);
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
  const [col,id]=k.split(':');S.fb.getDoc(S.fb.doc(S.db,{j:'jobpics',b:'bidpics',r:'reviewpics'}[col],id)).then(d=>{S.pics[k]=d.exists()?cleanPics(d.data().pics):[]}).catch(()=>{S.pics[k]=[]}).finally(()=>{if(S.phase==='app')render()});
  return null}
function picStrip(k,n,cls=''){if(!n)return'';const l=picsOf(k);
  return`<div class="pics ${cls}">${l?l.map((src,i)=>`<button class="pic" data-pic="${esc(k)}" data-i="${i}" aria-label="Open photo ${i+1} of ${l.length}"><img src="${src}" alt=""></button>`).join('')
    :Array.from({length:n},()=>'<span class="pic wait" aria-hidden="true"></span>').join('')}</div>`}
function picEdit(t,l){l=l||[];
  return`<div class="pics">${l.map((src,i)=>`<span class="pic"><img src="${src}" alt="Photo ${i+1}"><button class="picx" data-unpic="${t}" data-i="${i}" aria-label="Remove photo ${i+1}">${ic('x',14,2.6)}</button></span>`).join('')}
    ${l.length<MAX_PICS?`<label class="pic add" for="pk-${t}">${ic('camera',20)}<span>${l.length?'Add':'Add photos'}</span><input id="pk-${t}" type="file" accept="image/jpeg,image/png,image/webp" multiple data-pics="${t}"></label>`:''}</div>`}

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
     ${field('fEmail','Email','email','email',codeParam?'you@college.edu.in':'The address you were invited on','email')}
     ${field('fPw','Password','password','pw','At least 8 characters','new-password')}
     ${S.authErr?`<p class="err" role="alert">${esc(S.authErr)}</p>`:''}
     <button class="cta" type="submit" data-need="signup" ${S.busy?'disabled':''}>${S.busy?'Creating your account…':'Create account'}</button>
     <p class="note">Only invited emails can join. We'll email you a link to confirm your address.</p></form>`;
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
   <button class="cta" data-act="${edit?'saveProfile':'join'}" data-need="${edit?'profile':'join'}">${edit?'Save profile':'Join the board'}</button>
   ${edit?'<button class="linkbtn" data-go="me">Cancel</button>':'<button class="linkbtn" data-act="logout">Log out</button>'}
  </div>`;
}

function back(to,label){return`<button class="back" data-go="${to}">${ic('back',16)} ${label}</button>`}
const NOTES=['#A18CFF','#4FE3E0','#FF7AD1','#FFC53D','#FF9F45','#6CB6FF'];
function noteOf(k){let h=2166136261;for(const c of String(k)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return NOTES[(h>>>0)%NOTES.length]}
function tile(j,D,i=0){
  const c=noteOf(j.key),n=bidsFor(D,j.key).length,left=j.deadline-Date.now();
  const ph=j.pics?(picsOf('j:'+j.key)||[])[0]:'',d=-((Date.now()/1000+i*2.3)%32).toFixed(2);
  return`<button class="tile ntile r${i%3} ${S.fresh===j.key?'fresh':''}" data-job="${esc(j.key)}" style="--nc:${c};--i:${i};--d:${d}s">
    <span class="tbg ${ph?'ph':''}" aria-hidden="true">${ph?`<img src="${ph}" alt="">`:''}</span>
    <span class="pin"></span>
    <span class="price">₹${fmt(j.price)}</span>
    ${left<36e5?`<span class="flag">${Math.max(1,Math.round(left/6e4))} min left</span>`:''}${nearMe(j)?nearTag():''}
    <p>${esc(j.text)}</p>
    ${j.where||j.when?`<span class="where">${ic('place',12,2.2)}<span>${esc([j.where,left<36e5?'':j.when].filter(Boolean).join(' · '))}</span></span>`:''}
    <span class="by">${face(j.owner,22)}<span class="nm">${esc(firstName(j.owner))}</span><span class="n">${j.pics?ic('camera',12,2.2)+' ':''}${j.owner===S.me.id?`${n} ${n===1?'bid':'bids'}`:since(j.at)}</span></span>
  </button>`;
}
const wideMQ=matchMedia('(min-width:900px)');
function wallHTML(list,D){const n=wideMQ.matches?3:2,cols=Array.from({length:n},()=>[]);
  list.forEach((j,i)=>cols[i%n].push(tile(j,D,i)));
  return`<div class="wall">${cols.map(c=>`<div class="wcol">${c.join('')}</div>`).join('')}</div>`}
wideMQ.addEventListener?.('change',()=>{if(S.phase==='app')render()});
function viewBoard(D){
  const drop=!S.boardDropped&&!S.intro.on&&!S.momentOn&&!S.joining&&S.priv.introSeen&&!reduceMotion.matches;if(drop){S.boardDropped=true;S.dropping=true;setTimeout(()=>{S.dropping=false},2200)}
  const all=boardJobs(D),list=findJobs(all),filtered=!!(S.find.q.trim()||S.near),free=freePeople(D).filter(u=>u!==S.me.id),meFree=num(S.myDoc?.freeUntil)>Date.now();
  return`<div class="boardpage"><header class="top">
    <div><div class="mark">tack</div><div class="sub"><span class="dot"></span><span>${esc(campus())} · ${all.length} pinned</span></div></div>
    <button data-go="me" aria-label="Your profile">${ring(S.me.id,48)}</button>
  </header>
  <section class="stripwrap" aria-label="Free right now"><p class="label">Free right now${free.length?' <span class="labelhint">· tap a face to ask for a favour</span>':''}</p>
    <div class="strip">
      <button class="person" data-sheet="free" aria-label="${meFree?'Change when you’re free':'Mark yourself free'}">${meFree?ring(S.me.id,50):`<span class="add">${ic('plus',18)}</span>`}<span>You</span></button>
      ${free.map(u=>`<button class="person" data-ask="${esc(u)}" aria-label="Ask ${esc(firstName(u))} for a favour">${ring(u,50)}<span>${esc(firstName(u))}</span></button>`).join('')}
      ${free.length?'':`<span class="stripnote">Nobody else is marked free. Tap + to say you're around.</span>`}
    </div></section>
  ${stepsCard(D)}
  <div class="dhead"><h1 class="h1">The board</h1><span class="muted">${all.length} pinned at ${esc(campus())}</span></div>
  <label class="search" for="q">${ic('search',17)}<input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Search jobs: print, shawarma, today, library" value="${esc(S.find.q)}" data-bind="find.q" aria-label="Search jobs"></label>
  <div class="pills" role="group" aria-label="Filter and sort jobs"><button class="pill ${S.near?'on':''}" data-act="toggleNear" aria-pressed="${S.near}">${ic('place',13,2.2)} Near you</button><span class="pillsep" aria-hidden="true"></span>${[['high','Top pay'],['newest','Newest'],['closing','Closing soon']].map(([k,l])=>`<button class="pill ${S.sort===k?'on':''}" data-sort="${k}" aria-pressed="${S.sort===k}">${l}</button>`).join('')}</div>
  <div class="wallzone ${S.dropping?'dropin':''}">${filtered&&!list.length&&all.length?`<div class="empty"><b>${S.near&&!S.find.q.trim()?'Nothing near you right now':'No jobs match that'}</b><p>${S.near?'Only jobs pinned with a location can show as near you.':'Try another word, like the place, the time or what you need.'}</p><button class="btn2" data-act="clearFind">Show all jobs</button></div>`:list.length?wallHTML(list,D)+`<div class="boardend"><span class="endpin" aria-hidden="true"></span><p>${filtered?`${list.length} of ${all.length} jobs shown.`:`That's everything pinned at ${esc(campus())}.`}</p><button class="btn2" data-go="post">Pin a job</button></div>`
    :`<div class="empty"><b>Nothing pinned yet</b><p>Pin the first job: a xerox run, a lift down four floors, an hour of help before a submission.</p><button class="cta" data-go="post">Pin a job</button></div>`}</div></div>`;
}
function viewJob(D){
  const j=D.jobByKey[S.openJob];
  if(!j)return`<div class="pad">${back('board','Back to the board')}<div class="empty" style="margin:18px 0"><b>This job is gone</b><p>The poster closed it or it was taken off the board.</p></div></div>`;
  const me=S.me.id,mine=j.owner===me,st=jobState(j),bids=bidsFor(D,j.key).sort((a,b)=>a.amt-b.amt||a.at-b.at);
  const myBid=myBidOn(j.key);
  if(S.bid.key!==j.key)S.bid={key:j.key,amt:String(myBid?num(myBid.amt):j.price),say:myBid?myBid.say:'',pics:myBid&&num(myBid.pics)?null:[]};
  if(S.bid.pics===null){const l=picsOf('b:'+j.key+'~'+me);if(l)S.bid.pics=[...l]}
  const stTag={expired:'<span class="tag warn">Closed · time ran out</span>',closed:'<span class="tag">Closed</span>',removed:'<span class="tag warn">Removed</span>',
    assigned:mine||j.accepted===me?`<span class="tag ok">Picked ${esc(shortName(j.accepted))}</span>`:'<span class="tag">Taken</span>',done:payOf(j)?.ok?'<span class="tag ok">Done · Paid ✓</span>':'<span class="tag ok">Done</span>'}[st]||'';
  let foot='';
  if(mine){
    if(st==='open')foot=`<div class="foot"><button class="btn2" data-sheet="close">Close this job</button><p class="note">Pick someone from the bids to take it off the board.</p></div>`;
    else if(st==='assigned')foot=`<div class="foot"><div class="banner">${ic('tick',13,3.4,'var(--accent)')} You picked ${esc(firstName(j.accepted))} for ₹${fmt(j.agreed)}. Pay on UPI after.</div>
      <button class="cta" data-sheet="done">Mark as done</button><button class="btn2" data-thread-with="${esc(j.accepted)}">Message ${esc(firstName(j.accepted))}</button></div>`;
    else if(st==='done'){const pay=payOf(j),dn=esc(firstName(j.accepted));
      foot=`<div class="foot">${pay?.ok?`<div class="banner">${ic('tick',13,3.4,'var(--accent)')} ${dn} confirmed they got ₹${fmt(j.agreed)}</div>`
        :pay?`<div class="banner warnbanner">${dn} hasn’t got your payment yet</div><p class="note">Pay ₹${fmt(j.agreed)} on UPI or cash, then they’ll confirm it here.</p>`
        :`<div class="banner mutedbanner">Waiting for ${dn} to confirm they got ₹${fmt(j.agreed)}</div>`}
        ${j.pick?.ratedDoer?`<p class="note">You rated ${dn}${(S.priv.gave||{})[j.key]?' ★'+num(S.priv.gave[j.key]).toFixed(1):''}.</p>`:`<button class="btn2" data-sheet="done">Rate ${dn}</button>`}
        ${j.pick?.review?`<p class="note">Your review is on ${dn}'s profile, without your name. <button class="linkbtn" style="padding:0" data-sheet="delReview" data-rid="${esc(j.pick.review)}" data-about="${esc(j.accepted)}">Delete it</button></p>`
          :j.pick?.ratedDoer?`<button class="btn2" data-sheet="review">Write a public review of ${dn}</button>`:''}
        ${j.pick?.noteToPoster?`<div class="box stack" style="gap:4px"><span class="formlabel">${dn}'s private note to you</span><span class="t2" style="color:var(--fg)">${esc(str(j.pick.noteToPoster,200))}</span></div>`:''}</div>`}
    else if(st==='expired')foot=`<div class="foot"><button class="btn2" data-act="repost">Pin it again</button></div>`;
  }else{
    if(st==='open')foot=`<div class="foot">
      <div style="display:flex;gap:9px"><label class="field" for="bidAmt"><span class="fl">Your bid ₹</span>
        <input id="bidAmt" type="text" inputmode="numeric" maxlength="6" value="${esc(S.bid.amt)}" data-bind="bid.amt" aria-label="Your bid in rupees"
         style="font-family:var(--display);font-size:var(--t-19);font-weight:800;letter-spacing:-.035em;font-variant-numeric:tabular-nums"></label>
        ${threadOpen(jobThreadKey(j.key,me))?`<button class="iconbtn" style="width:52px;height:auto;border-radius:999px;background:var(--surface)" data-thread-job aria-label="Message ${esc(firstName(j.owner))}">${ic('chat',20)}</button>`:''}</div>
      <label class="field" for="bidSay"><input id="bidSay" maxlength="90" placeholder="Pitch yourself in one line (only ${esc(firstName(j.owner))} sees it)" value="${esc(S.bid.say)}" data-bind="bid.say"></label>
      ${S.bid.pics?picEdit('bid',S.bid.pics):'<div class="pics"><span class="pic wait" aria-hidden="true"></span></div>'}
      ${S.err.bid?`<p class="err">${esc(S.err.bid)}</p>`:''}
      <button class="cta" data-act="bid" data-need="bid">${myBid?'Update my bid':'Place bid'}</button>
      ${myBid?'<button class="linkbtn" data-act="withdraw">Withdraw my bid</button>':''}
      <p class="note">${threadOpen(jobThreadKey(j.key,me))?`${esc(firstName(j.owner))} messaged you about this job.`:`You can message ${esc(firstName(j.owner))} once they pick you.`} You pay each other on UPI.</p></div>`;
    else if(j.accepted===me&&st==='done'){const pay=payOf(j),pn=esc(firstName(j.owner)),late=pay&&!pay.ok&&Date.now()-(j.doneAt||pay.at)>PAY_GRACE;
      foot=pay?.ok?`<div class="foot"><div class="banner">${ic('tick',13,3.4,'var(--accent)')} Paid · you confirmed ₹${fmt(j.agreed)} ${since(pay.at)}</div>
          ${j.pick?.ratedPoster?`<p class="note">You rated ${pn}${(S.priv.gave||{})[j.key]?' ★'+num(S.priv.gave[j.key]).toFixed(1):''}.</p>`:`<button class="cta" data-sheet="ratePoster">Rate ${pn}</button>`}
          ${j.pick?.noteToDoer?`<div class="box stack" style="gap:4px"><span class="formlabel">${pn}'s private note to you</span><span class="t2" style="color:var(--fg)">${esc(str(j.pick.noteToDoer,200))}</span></div>`:''}
          <button class="linkbtn" data-act="paid" data-val="no">I marked this by mistake</button></div>`
        :`<div class="foot"><div class="stack gap8 box" style="border:1px solid rgba(198,242,78,.3)">
          <span class="t1" style="font-size:var(--t-16)">Did ${pn} pay you ₹${fmt(j.agreed)}?</span>
          <span class="t2">${pay?'You said not yet. Tap Yes once the money reaches you.':`${pn} marked this job done. Confirm once the money reaches you.`}</span></div>
          <button class="cta" data-act="paid" data-val="yes">Yes, I got it</button>
          ${pay?'':'<button class="btn2" data-act="paid" data-val="no">Not yet</button>'}
          ${late?`<button class="linkbtn" data-sheet="report" data-about="${esc(j.owner)}" data-prewhy="No-show or didn’t pay">Still not paid? Report it</button>`:''}
          <p class="note">tack never holds your money. This only records what you tell us.</p></div>`}
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
    <div class="chips">${[j.when,j.where].filter(Boolean).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}${nearMe(j)?nearTag():''}${stTag}</div>
    ${j.more?`<p style="margin:0;font-size:var(--t-14);line-height:1.55;color:var(--fg2);max-width:52ch;overflow-wrap:anywhere;white-space:pre-wrap">${esc(j.more)}</p>`:''}
    ${picStrip('j:'+j.key,j.pics)}
    <button class="card" data-person="${esc(j.owner)}">${ring(j.owner,50)}
      <span class="rowtext" style="gap:3px"><span style="font-size:var(--t-16);font-weight:700;letter-spacing:-.015em">${esc(shortName(j.owner))}${mine?' <span class="muted">(you)</span>':''}</span>
      <span style="font-size:var(--t-12);font-weight:500;color:var(--muted)">${esc(metaOf(j.owner)||campus())}${esc(posterLine(j.owner))} · posted ${since(j.at)}</span></span></button>
   </div>
   <div class="stack">
    ${mine?`<div style="display:flex;align-items:baseline;gap:8px"><h2 class="h2">${bids.length} ${bids.length===1?'bid':'bids'}</h2><span style="font-size:var(--t-12);font-weight:600;color:var(--muted)">only you see these</span></div>`
      :`<div style="display:flex;align-items:baseline;gap:8px"><h2 class="h2">${myBid?'Your bid':'Bids'}</h2><span style="font-size:var(--t-12);font-weight:600;color:var(--muted)">only ${esc(firstName(j.owner))} sees who bids</span></div>`}
    ${bids.length?bids.map(b=>`<div class="row">
      <button class="rowmain" data-person="${esc(b.by)}">${ring(b.by,42)}<span class="rowtext">
        <span class="t1">${esc(shortName(b.by))}${b.by===me?' (you)':''}${mine&&b.near?' '+nearTag():''} <span class="muted">· ${esc(metaOf(b.by))}${esc(rateLine(b.by,D))}</span></span>
        ${b.say?`<span class="t2">${esc(b.say)}</span>`:''}</span></button>
      <span class="amt">₹${fmt(b.amt)}</span>
      ${mine&&st==='open'?`<button class="pick" data-pick="${esc(b.by)}" aria-label="Pick ${esc(firstName(b.by))} for ₹${fmt(b.amt)}">Pick</button>`:''}
      ${mine&&st==='open'?`<button class="iconbtn" data-thread-with="${esc(b.by)}" aria-label="Message ${esc(firstName(b.by))}">${ic('chat',17)}</button>`:''}
      ${j.accepted===b.by?'<span class="tag ok">Picked</span>':''}
    </div>${picStrip('b:'+j.key+'~'+b.by,b.pics,'sub')}`).join(''):`<p class="note" style="text-align:left">${mine?'No bids yet. Classmates see this on the board now.':'Bids are private. Place yours below.'}</p>`}
   </div>
  </div></div>${foot}
  ${!mine?`<div class="reportrow"><button class="linkbtn" data-sheet="report" data-about="${esc(j.owner)}">Report this job</button>${mod}</div>`:''}`;
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
   ${group('By when','when',WHENS)}${group('Where','where',WHERES)}
   <input id="jw" class="inp" maxlength="40" placeholder="Or type a place: Seminar hall, B-wing 4th floor…" value="${esc(d.whereText)}" data-bind="draft.whereText" aria-label="Other place">
   <div class="stack gap8"><label for="jm" class="formlabel">Anything else <span class="muted">(optional)</span></label>
     <textarea id="jm" class="inp" rows="2" maxlength="600" style="resize:vertical" placeholder="Details the person doing it should know." data-bind="draft.more">${esc(d.more)}</textarea>
     ${picEdit('draft',d.pics)}</div>
   <button class="locbtn" data-act="toggleJobLoc" aria-pressed="${!!d.useLoc}">${ic(d.useLoc?'tick':'place',16,2.4)}<span class="rowtext"><span class="t1">${d.useLoc?'Tagged with where you are now':'Tag this job with where you are'}</span><span class="t2">${d.useLoc?'Members nearby see a Near you tag. Turn off if the job is somewhere else.':'Helps people close by find it. Rounded to about 100 m, never shown on a map.'}</span></span></button>
   <div class="card">${ring(S.me.id,38)}<span style="font-size:var(--t-12);font-weight:500;color:var(--fg2)">Posting as <b style="color:var(--fg)">${esc(shortName(S.me.id))}${metaOf(S.me.id)?' · '+esc(metaOf(S.me.id)):''}</b>. Your photo and name show on the board.</span></div>
  </div></div>
  <div class="foot">${S.err.post?`<p class="err">${esc(S.err.post)}</p>`:''}<button class="cta" data-act="post" data-need="post">Put it on the board</button>
   <p class="note">No assignment or exam work. Nothing illegal, nothing that puts someone at risk.</p></div>`;
}
function viewBids(D){
  const me=S.me.id;
  const myJobs=D.jobs.filter(j=>j.owner===me&&j.status!=='removed').sort((a,b)=>{const o=x=>({open:0,assigned:1}[jobState(x)]??2);return o(a)-o(b)||b.at-a.at});
  const myBids=Object.values(S.pitchMine).filter(p=>p&&num(p.amt)>0).map(p=>({k:p.job,b:{amt:num(p.amt),at:num(p.at)},j:D.jobByKey[p.job]})).filter(x=>x.j&&x.j.owner!==me).sort((a,b)=>num(b.b.at)-num(a.b.at));
  const jobLine=j=>{const st=jobState(j),n=bidsFor(D,j.key).length;
    return st==='open'?[`${n} ${n===1?'bid':'bids'} in`,'']:st==='assigned'?[`Picked ${shortName(j.accepted)} · ₹${fmt(j.agreed)}`,'ok']:st==='done'?(payOf(j)?.ok?[j.pick?.ratedDoer?'Done · Paid ✓':'Done · Paid ✓ · rate them','ok']:[`Done · ${payOf(j)?'they haven\u2019t got your payment':'waiting for them to confirm payment'}`,payOf(j)?'warn':'']):st==='expired'?['Time ran out','warn']:['Closed','']};
  const bidLine=({j})=>{const st=jobState(j);return j.accepted===me?(st==='done'?(payOf(j)?.ok?['Done · Paid ✓','ok']:['Done · confirm you got paid','warn']):[`Accepted · ₹${fmt(j.agreed)}`,'ok']):j.accepted?['Went to someone else','']:st==='open'?[`Waiting for ${firstName(j.owner)} to pick`,'']:['Closed','']};
  const row=(j,[line,cls],amt,who)=>`<button class="item" data-job="${esc(j.key)}">${ring(who||j.owner,38)}<span class="itext"><span class="t1" style="font-weight:600;color:var(--fg)">${esc(j.text)}</span>
    <span style="font-size:var(--t-11);font-weight:700;color:${cls==='ok'?'var(--accent)':cls==='warn'?'var(--coral-ink)':'var(--muted)'}">${esc(line)}</span></span><span class="amt" style="font-size:var(--t-16);color:var(--fg2)">₹${fmt(amt)}</span></button>`;
  const oin=offerList(S.offersIn).filter(o=>D.members.includes(o.owner)&&!D.blocked.has(o.owner)&&o.status!=='declined').sort((a,b)=>num(b.at)-num(a.at));
  const oout=offerList(S.offersOut).filter(o=>o.status!=='accepted').sort((a,b)=>num(b.at)-num(a.at));
  const doing=D.jobs.filter(j=>j.accepted===me&&!myBidOn(j.key)&&j.status!=='removed').sort((a,b)=>b.at-a.at);
  const offerCard=o=>`<div class="box stack" style="gap:10px;border:1px solid rgba(198,242,78,.3)">
    <div style="display:flex;align-items:center;gap:10px">${ring(o.owner,38)}<span class="rowtext"><span class="t1">${esc(shortName(o.owner))} asked you</span><span class="t2">${esc([o.where,o.when].filter(Boolean).join(' · '))}</span></span><span class="amt" style="color:var(--accent)">₹${fmt(o.price)}</span></div>
    <span style="font-size:var(--t-14);line-height:1.4;color:var(--fg);overflow-wrap:anywhere">${esc(o.text)}</span>
    ${o.status==='pending'?`<div style="display:flex;gap:8px"><button class="pick" style="flex:1;padding:11px" data-act="acceptOffer" data-key="${esc(o.key)}">Accept</button><button class="btn2" style="flex:1;padding:11px" data-act="declineOffer" data-key="${esc(o.key)}">Can't do it</button></div>`
      :`<p class="okmsg">Accepted. ${esc(firstName(o.owner))} will message you here.</p>`}</div>`;
  return`<div class="pad narrow"><h1 class="pageh">Activity</h1>
   <div class="stack">
    ${oin.length?`<div class="sect"><h2 class="h2">Offers for you</h2></div><div class="stack gap8">${oin.map(offerCard).join('')}</div>`:''}
    ${oout.length?`<div class="sect"><h2 class="h2">Offers you sent</h2></div><div class="stack gap8">${oout.map(o=>`<div class="row">${ring(o.to,38)}<span class="rowtext"><span class="t1">${esc(shortName(o.to))} · ₹${fmt(o.price)}</span><span class="t2">${o.status==='declined'?'Can\u2019t do it this time':'Waiting for them to answer'} · ${esc(o.text)}</span></span>
      <button class="btn2" style="width:auto;padding:8px 12px;font-size:var(--t-12)" data-act="withdrawOffer" data-key="${esc(o.key)}">${o.status==='declined'?'Dismiss':'Withdraw'}</button></div>`).join('')}</div>`:''}
    ${(()=>{const pastJob=j=>{const st=jobState(j);return st==='closed'||st==='expired'||st==='removed'||(st==='done'&&payOf(j)?.ok&&j.pick?.ratedDoer)};
      const all=[...doing.map(j=>({j,amt:j.agreed||j.price,at:num(j.pick?.at)||j.at})),...myBids.map(x=>({j:x.j,amt:num(x.b.amt),at:x.b.at,x}))];
      const pastBid=({j})=>j.accepted===me?(jobState(j)==='done'&&payOf(j)?.ok&&j.pick?.ratedPoster):jobState(j)!=='open'||!!j.accepted;
      const jobsNow=myJobs.filter(j=>!pastJob(j)),active=all.filter(y=>y.j.accepted===me&&!pastBid(y)),waiting=all.filter(y=>y.j.accepted!==me&&!pastBid(y));
      const hist=[...D.jobs.filter(j=>j.owner===me&&pastJob(j)).map(j=>({j,mine:true,amt:j.agreed||j.price,at:Math.max(j.doneAt||0,j.at)})),...all.filter(pastBid).map(y=>({...y,at:Math.max(y.j.doneAt||0,y.at||0,y.j.at)}))].sort((a,b)=>b.at-a.at);
      const tabs=[['all','All',0],['jobs','Your jobs',jobsNow.length],['bids','Your bids',active.length+waiting.length],['history','History',hist.length]];
      const grp=(t,l)=>l.length?`<div class="sect"><h2 class="h2">${t}</h2></div><div class="stack gap8">${l.map(y=>row(y.j,bidLine(y.x||{j:y.j}),y.amt)).join('')}</div>`:'';
      const empty=t=>`<p class="note" style="text-align:left">${t}</p>`;
      return`<div class="pills" style="padding:4px 0 0" role="group" aria-label="Show">${tabs.map(([k,l,n])=>`<button class="pill ${S.actTab===k?'on':''}" data-acttab="${k}" aria-pressed="${S.actTab===k}">${l}${n?' · '+n:''}</button>`).join('')}</div>
      ${S.actTab==='all'?(()=>{const feed=[...D.notes.map(n=>({...n,kind:'n'})),...jobsNow.map(j=>({kind:'j',j,at:j.at})),...[...active,...waiting].map(y=>({kind:'b',y,at:y.at||y.j.at}))].sort((a,b)=>b.at-a.at);
        return feed.length?`<div class="stack gap8">${feed.map(f=>f.kind==='j'?row(f.j,jobLine(f.j),f.j.price,me):f.kind==='b'?row(f.y.j,bidLine(f.y.x||{j:f.y.j}),f.y.amt)
          :`<button class="item notif ${f.at>S.actSeenAt?'new':''}" ${f.job?`data-job="${esc(f.job)}"`:f.person?`data-person="${esc(f.person)}"`:`data-go="${f.go}"`}>${f.who==='tack'?tackFace(38):ring(f.who,38)}<span class="itext"><span class="ntext">${f.html}</span><span class="t2">${since(f.at)}</span></span>${f.at>S.actSeenAt?'<span class="udot" aria-label="New"></span>':''}</button>`).join('')}</div>`:empty('Bids, picks and payments show up here.')})()
      :S.actTab==='jobs'?`${jobsNow.length?`<div class="stack gap8">${jobsNow.map(j=>row(j,jobLine(j),j.price,me)).join('')}</div>`:empty('Nothing pinned right now.')}
        <button class="linkbtn" data-go="post" style="align-self:flex-start;padding:0">Pin a job</button>`
      :S.actTab==='bids'?(active.length||waiting.length?grp('Active',active)+grp('Waiting',waiting):empty('Bids you place on the board show up here.'))
      :hist.length?`<div class="stack gap8">${hist.map(y=>y.mine?row(y.j,jobLine(y.j),y.amt,me):row(y.j,bidLine(y.x||{j:y.j}),y.amt)).join('')}</div>`:empty('Finished and closed jobs and bids show up here.')}`})()}
   </div></div><div style="height:24px"></div>`;
}
const codeLink=c=>`${SITE}?code=${c}`;
const codeText=c=>`Join me on tack, the ${campus()} board for quick jobs and favours. This invite link is just for you:\n${codeLink(c)}`;
function codeShare(c){return`<div class="copyrow"><span>${esc(codeLink(c))}</span></div>
  <div class="sharebtns">${navigator.share?`<button class="primary" data-act="shareCode" data-code="${esc(c)}">Share…</button>`:''}
    <a ${navigator.share?'':'class="primary"'} href="https://wa.me/?text=${encodeURIComponent(codeText(c))}" target="_blank" rel="noopener">WhatsApp</a>
    <button data-act="copy" data-text="${esc(codeText(c))}">Copy for Discord or Instagram</button></div>`}
function inviteCard(D,big){
  if(S.config.memberInvites===false&&!S.me.isOwner)return big?'<div class="empty" style="margin:8px 0"><b>No chats yet</b><p>Bid on a job, or tap Ask on someone who\u2019s free, to start talking.</p></div>':'';
  const used=Object.values(S.myCodes).filter(c=>c&&c.usedBy).length;
  return`<div class="${big?'empty':'box stack'}" style="${big?'margin:8px 0':'gap:10px'}">
    ${big?'<b>No chats yet</b><p>Chats open when you work with someone: message your bidders, or ask someone who\u2019s free for a favour. Bring your friends onto the board too.</p>':'<span class="t1" style="font-size:var(--t-16)">Invite friends to tack</span><span class="t2">More people on the board means jobs get picked up faster. Each link lets one person join.</span>'}
    <button class="${big?'cta':'btn2'}" data-sheet="invitefriend">Invite a friend</button>
    ${used?`<p class="note">${used} ${used===1?'person has':'people have'} joined with your links.</p>`:''}</div>`}
function viewChats(D){
  return`<div class="pad narrow"><h1 class="pageh">Chats</h1>
  ${D.threads.length?`<div class="stack gap8">${D.threads.map(t=>`<button class="item" data-thread="${esc(t.key)}">${ring(t.other,46)}
    <span class="itext"><span class="t1">${esc(shortName(t.other))}${t.job?` <span class="muted">· ₹${fmt(t.job.agreed||t.job.price)}</span>`:''}</span><span class="t2" style="${t.unread?'color:var(--fg);font-weight:600':''}">${esc(t.sub)}</span></span>
    <span class="iend"><span class="time">${t.last?ago(t.last.at):''}</span>${t.unread?'<span class="udot" aria-label="Unread"></span>':''}</span></button>`).join('')}</div>`
   :inviteCard(D,true)}
  ${D.threads.length?`<div style="margin-top:18px">${inviteCard(D,false)}</div>`:''}
  </div><div style="height:24px"></div>`;
}
function viewChat(D){
  const c=S.chat;if(!c.key)return viewChats(D);
  const j=c.jobKey?D.jobByKey[c.jobKey]:null,me=S.me.id;
  const accepted=j&&j.accepted&&[j.owner,j.accepted].includes(me)&&[j.owner,j.accepted].includes(c.other);
  const can=canMessage(c,D);
  return`<div class="pad" style="padding-bottom:10px"><div style="display:flex;align-items:center;gap:10px">
     <button class="back" data-go="chats" aria-label="Back to chats" style="padding:0">${ic('back',20)}</button>
     <button class="rowmain" data-person="${esc(c.other)}">${ring(c.other,42)}<span class="rowtext"><span style="font-size:var(--t-16);font-weight:700;letter-spacing:-.015em">${esc(shortName(c.other))}</span>
       <span style="font-size:var(--t-12);font-weight:500;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${j?`₹${fmt(j.agreed||j.price)} · ${esc(j.text)}`:esc(metaOf(c.other)||campus())}</span></span></button>
     <button class="iconbtn" data-sheet="report" data-about="${esc(c.other)}" aria-label="Report or block">${ic('flag',17)}</button></div></div>
  <div class="msgs">
   ${accepted?`<div class="banner">${ic('tick',13,3.4,'var(--accent)')} ${payOf(j)?.ok?`Paid ✓ · ₹${fmt(j.agreed)}`:`Bid accepted · ₹${fmt(j.agreed)} · pay on UPI after`}</div>`:''}
   ${j&&!accepted?`<button class="banner" style="background:var(--surface2);color:var(--fg2)" data-job="${esc(j.key)}">About: ${esc(j.text.slice(0,40))}${j.text.length>40?'…':''}</button>`:''}
   ${!c.msgs.length?`<p class="note" style="margin:10px 0">${c.loaded?'Say hi. Sort out the time and place here.':'Loading messages…'}</p>`:''}
   ${c.msgs.map(m=>`<div class="${m.by===me?'out':'in'}">${esc(m.t)}<span class="time">${stamp(m.at)}</span></div>`).join('')}
   <p class="note" style="margin-top:4px">Keep it here. If you report someone, we can see this chat.</p>
  </div>
  ${!can?`<div class="foot"><p class="note">${c.jobKey?`You can message ${esc(firstName(c.other))} once they pick you for this job.`:`Direct messages are closed. Chats now happen inside jobs: ask ${esc(firstName(c.other))} for a favour when they're free, or hire them again from their profile.`}</p></div>`:`
  <div class="foot" style="position:sticky;bottom:0;background:linear-gradient(transparent,var(--bg) 30%)"><div style="display:flex;gap:9px">
    <label class="field" for="msg"><input id="msg" type="text" maxlength="1000" placeholder="Message…" value="${esc(S.chatDraft.text)}" data-bind="chatDraft.text" aria-label="Message ${esc(firstName(c.other))}" autocomplete="off"></label>
    <button data-act="send" aria-label="Send" style="width:50px;height:50px;flex-shrink:0;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(198,242,78,.35)">${ic('send',19,2,'var(--bg)')}</button>
  </div></div>`}`;
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
       ${uid===ownerId()?'<span class="chip vio">Organiser</span>':''}${uid!==S.me.id&&workedWith(uid,D).length?`<span class="chip">Worked together · ${workedWith(uid,D).length} ${workedWith(uid,D).length===1?'job':'jobs'}</span>`:''}${free?'<span class="chip on">Free right now</span>':''}</div>
   </div>
   <div class="stats"><div><b>${st.done}</b><span>${st.done===1?'job':'jobs'} done</span></div><div><b style="color:var(--accent)">${st.avg??'New'}</b><span>rating</span></div>${isMe?`<div><b>${fmt(st.earned)}</b><span>₹ earned · only you</span></div>`:`<div><b>${st.poster.n?st.poster.avg.toFixed(1):'–'}</b><span>as a poster</span></div>`}</div>
   ${st.doer.n?`<div class="box stack" style="gap:8px"><span class="formlabel">As a doer · from ${st.doer.n} ${st.doer.n===1?'rating':'ratings'}</span>${st.doer.per.map(c=>`<div class="critrow"><span>${c.l}</span><span class="critbar"><span style="width:${(c.v/5*100).toFixed(0)}%"></span></span><b>${c.v.toFixed(1)}</b></div>`).join('')}</div>`:''}
   ${reviewList(uid)}
   ${st.poster.n?`<div class="box stack" style="gap:8px"><span class="formlabel">As a poster · from ${st.poster.n} ${st.poster.n===1?'rating':'ratings'}</span>${st.poster.per.map(c=>`<div class="critrow"><span>${c.l}</span><span class="critbar"><span style="width:${(c.v/5*100).toFixed(0)}%"></span></span><b>${c.v.toFixed(1)}</b></div>`).join('')}</div>`:''}
   ${isMe?`<button class="card" data-sheet="free">${ic('clock',20)}<span class="rowtext"><span class="t1">${free?'You’re free until '+clock(num(d.freeUntil)):'Free right now?'}</span><span class="t2">${free?'Anyone can message you until then. Tap to change.':'Show you’re around and open to quick requests'}</span></span><span class="chev">${ic('chev',18)}</span></button>`:''}
   ${does.length?`<div class="chips">${does.map((x,i)=>`<span class="chip" style="background:${tints[i%4][0]};color:${tints[i%4][1]};font-weight:700">${esc(x)}</span>`).join('')}</div>`:''}
   ${isMe?`<div class="menu">
       <button data-go="edit">${ic('edit',18)} Edit profile<span class="chev">${ic('chev',16)}</span></button>
       ${S.me.isOwner?`<button data-go="invites">${ic('users',18)} Invites and members<span class="chev">${ic('chev',16)}</span></button>`:''}
       <button data-act="replayIntro">${ic('board',18)} How tack works<span class="chev">${ic('chev',16)}</span></button>
       <button data-go="privacy">${ic('shield',18)} Privacy<span class="chev">${ic('chev',16)}</span></button>
       <button data-act="logout">${ic('out',18)} Log out</button>
       <button data-sheet="erase" class="danger">${ic('trash',18)} Delete my account</button></div>
       <p class="note">Logged in as ${esc(S.me.email)}</p>`
     :`${(()=>{const fn=esc(firstName(uid)),freeNow=num(d.freeUntil)>Date.now(),prev=lastJobFor(uid,D);
        return (freeNow?`<button class="cta" data-ask="${esc(uid)}">Ask ${fn} for a favour</button>`:'')
          +(prev?`<button class="${freeNow?'btn2':'cta'}" data-ask="${esc(uid)}" data-prev="${esc(prev.id)}">Hire ${fn} again</button>`:'')
          +(!freeNow&&!prev?`<p class="note">You can ask ${fn} for a favour when they're marked Free right now.</p>`:'')})()}
       <button class="linkbtn" data-sheet="report" data-about="${esc(uid)}">Report or block</button>`}
  </div></div><div style="height:24px"></div>`;
}
function viewPrivacy(){
  return`<div class="pad">${back('me','Back')}<div class="prose" style="margin-top:6px">
   <h1 class="pageh" style="margin-bottom:6px">Privacy</h1>
   <p>tack is private to people ${esc(organiser())} invited. Nothing on the board is public.</p>
   <h2>What tack keeps</h2>
   <p>Your email address and a password to log in. Your name, photo, year, branch, what you're good at and your ring colour. The jobs you pin, the bids you place, any photos you add to them, the ratings and reviews you give and your messages. Photos are shrunk on your phone first, which also strips their location data. When you mark yourself free, the time it ends. If you tag a job with your location, that spot rounded to about 100 m.</p>
   <h2>Location</h2>
   <p>Near you works on your phone: your location is used there to sort out which jobs are close, and is never saved. A job only has a location if its poster tagged it, rounded to about 100 m and never shown on a map. When you bid, tack saves only whether you were near the job, not where you were.</p>
   <h2>What other members see</h2>
   <p>Your name, photo, year and branch, the jobs you post, your ratings and reviews. They never see your email address. Your bids are private: only the poster of that job sees your bid, pitch and bid photos. Other members can't see who bid on a job or who took it.</p>
   <h2>Ratings</h2>
   <p>After a job, the poster and the doer rate each other from 1 to 5 on four things. Profiles show only the averages and how many ratings there are, never who gave them or for which job. A note you write goes only to the person you rated.</p>
   <p>A poster can also write a short public review, with photos, of the person who did the job. It shows on that person's profile with the month, never the poster's name or the job. The poster can delete it later, and the organiser can remove reviews that break the rules.</p>
   <h2>Invite links</h2>
   <p>Invite links are personal: whoever joins with yours is recorded as invited by you.</p>
   <h2>Chats</h2>
   <p>Chats only happen inside a job: between a poster and their bidders, or between two people working on a job together, including favours you ask for and accept. There are no direct messages. Only the two people in a chat can read it in the app. ${esc(organiser())} runs this board and can read chats to handle a report.</p>
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
  const list=Object.entries(S.invites).map(([e,x])=>({email:e,at:num(x?.at),uid:typeof x?.uid==='string'?x.uid:null,by:typeof x?.by==='string'?x.by:null,code:typeof x?.code==='string'})).sort((a,b)=>b.at-a.at);
  const li=S.lastInvite;
  return`<div class="pad">${back('me','Back')}<div class="stack narrow" style="margin-top:6px;gap:20px">
   <div><h1 class="pageh" style="margin-bottom:6px">Invites and members</h1>
   <p style="margin:0;font-size:var(--t-14);line-height:1.55;color:var(--fg2)">Only emails on this list can sign up. Add someone, then send them the invite. They create an account with that email and confirm it.</p></div>
   <div class="stack gap8"><label class="formlabel" for="invE">Invite by email</label>
     <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="invE" class="inp" style="flex:1;min-width:200px" type="email" inputmode="email" autocapitalize="off" spellcheck="false" autocomplete="off" placeholder="name@college.edu.in" value="${esc(S.inv.email)}" data-bind="inv.email">
     <button class="pick" style="padding:12px 18px;font-size:var(--t-14)" data-act="invite" data-need="invite">Add invite</button></div>
     ${S.err.inv?`<p class="err">${esc(S.err.inv)}</p>`:''}</div>
   ${li?`<div class="box stack" style="gap:10px;border:1px solid rgba(198,242,78,.35)">
     <span class="t1" style="font-size:var(--t-14)">${esc(li)} can sign up now. Send them the invite:</span>${shareButtons(li)}
     <p class="note" style="text-align:left">The invite has a link to the sign-up page with their email filled in.</p></div>`:''}
   <div class="stack gap8"><div class="sect"><h2 class="h2">Invited</h2><span class="time">${list.length}</span></div>
    ${list.length?list.map(x=>{const joined=x.uid&&S.peopleDocs[x.uid]?.adult;return`<div class="row">${joined?ring(x.uid,40):`<span class="add" style="width:40px;height:40px">${ic('clock',16)}</span>`}
      <span class="rowtext"><span class="t1">${esc(x.email)}</span><span class="t2" style="color:${joined?'var(--accent)':'var(--muted)'}">${joined?'Joined as '+esc(shortName(x.uid)):(x.uid?'Signed up, setting up profile':'Not signed up yet · invited '+since(x.at))}${x.code&&x.by?' · invited by '+esc(shortName(x.by)):''}</span></span>
      ${joined?'':`<button class="iconbtn" data-act="reshare" data-email="${esc(x.email)}" aria-label="Send ${esc(x.email)} the invite again">${ic('mail',16)}</button>`}
      <button class="iconbtn" data-sheet="uninvite" data-about="${esc(x.email)}" aria-label="Remove ${esc(x.email)}">${ic('trash',16)}</button></div>`}).join('')
     :'<p class="note" style="text-align:left">Nobody invited yet. Add the first email above.</p>'}</div>
   <div class="stack gap8"><div class="sect"><h2 class="h2">Reports</h2><span class="time">${S.reports.length}</span></div>
    ${S.reports.length?S.reports.map(r=>`<div class="row" style="align-items:flex-start"><span class="rowtext" style="gap:3px"><span class="t1">${esc(shortName(str(r.by,128)))} reported ${esc(shortName(str(r.about,128)))}</span>
      <span class="t2">${esc(str(r.why,40))}${r.note?' · '+esc(str(r.note,200)):''}</span><span class="time">${stamp(num(r.at))}</span></span>
      <button class="btn2" style="width:auto;padding:8px 12px;font-size:var(--t-12)" data-person="${esc(str(r.about,128))}">View</button></div>`).join(''):'<p class="note" style="text-align:left">No reports.</p>'}</div>
   <label class="check box" for="memInv" style="padding:14px 16px"><input type="checkbox" id="memInv" data-toggle="memberInvites" ${S.config.memberInvites===false?'':'checked'}>
     <span><b style="color:var(--fg)">Members can invite friends</b><br>Each member can share personal invite links. Each link lets one person join, and the invite list shows who invited them.</span></label>
   <div class="stack gap8"><label class="formlabel" for="invC">Campus name</label>
     <div style="display:flex;gap:8px"><input id="invC" class="inp" maxlength="40" value="${esc(S.inv.campus||campus())}" data-bind="inv.campus"><button class="btn2" style="width:auto;padding:12px 18px" data-act="saveCampus">Save</button></div></div>
   <p class="note" style="text-align:left">Removing an invite locks that person out straight away and takes their jobs off the board.</p>
  </div></div><div style="height:24px"></div>`;
}
function railHTML(D){
  const free=freePeople(D).filter(u=>u!==S.me.id),me=S.me.id;
  const myBids=Object.values(S.pitchMine).filter(p=>p&&num(p.amt)>0).map(p=>({b:{amt:num(p.amt),at:num(p.at)},j:D.jobByKey[p.job]})).filter(x=>x.j&&x.j.owner!==me).sort((a,b)=>num(b.b.at)-num(a.b.at)).slice(0,4);
  return`<div style="display:flex;align-items:baseline;gap:8px"><h2 class="h2">Free right now</h2><span style="font-size:var(--t-12);font-weight:600;color:var(--dim)">${D.members.length} on the board</span></div>
  <div class="stack gap8">${free.length?free.map(u=>`<div style="display:flex;align-items:center;gap:10px"><button class="rowmain" data-person="${esc(u)}">${ring(u,40)}
     <span class="rowtext"><span style="font-size:var(--t-14);font-weight:700">${esc(shortName(u))}</span><span style="font-size:var(--t-11);font-weight:500;color:var(--muted)">${esc([metaOf(u),str(pdoc(u).does,40)].filter(Boolean).join(' · '))}</span></span></button>
     <button data-ask="${esc(u)}" style="background:var(--surface2);border-radius:999px;padding:7px 13px;font-size:var(--t-12);font-weight:700">Ask</button></div>`).join('')
   :`<p class="note" style="text-align:left">Nobody else is marked free right now.</p>`}
   <button class="btn2" style="padding:10px;font-size:var(--t-12)" data-sheet="free">${num(S.myDoc?.freeUntil)>Date.now()?'You’re free until '+clock(num(S.myDoc.freeUntil)):'I’m free right now'}</button></div>
  <div style="height:1px;background:var(--line)"></div>
  <h2 class="h2">Your bids</h2>
  <div class="stack gap8">${myBids.length?myBids.map(({b,j})=>{const ok=j.accepted===me;return`<button data-job="${esc(j.key)}" style="display:flex;align-items:center;gap:10px;background:var(--surface);border-radius:var(--r-sm);padding:11px 13px;width:100%;text-align:left">
     <span class="rowtext"><span style="font-size:var(--t-12);font-weight:600;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(j.text)}</span>
     <span style="font-size:var(--t-11);font-weight:600;color:${ok?'var(--accent)':'var(--muted)'}">${ok?'Accepted · ₹'+fmt(j.agreed):j.accepted?'Went to someone else':jobState(j)==='open'?'Waiting for '+firstName(j.owner)+' to pick':'Closed'}</span></span>
     <span style="font-family:var(--display);font-size:var(--t-16);font-weight:800;color:var(--fg2);font-variant-numeric:tabular-nums">₹${fmt(b.amt)}</span></button>`}).join('')
   :'<p class="note" style="text-align:left">Bids you place show up here.</p>'}</div>`;
}

function sheetHTML(D){
  const s=S.sheet;if(!s)return'';let b='';
  const j=S.openJob?D.jobByKey[S.openJob]:null;
  switch(s.type){
  case'free':{const f=num(S.myDoc?.freeUntil)>Date.now();
    b=`<h2 id="sheetT">When are you free?</h2><p>You'll show at the top of the board, and anyone can message you directly until then.</p>
    <div class="stack gap8">${[['1h','For the next hour'],['3h','Next 3 hours'],['day','Rest of today']].map(([k,l])=>`<button class="btn2" data-free="${k}">${l}</button>`).join('')}
    ${f?'<button class="btn2 danger" data-free="off">I’m not free any more</button>':''}</div>`;break}
  case'pick':b=`<h2 id="sheetT">Pick ${esc(firstName(s.uid))} for ₹${fmt(s.amt)}?</h2><p>The job leaves the board and you two can sort out the details in chat. Pay them on UPI or cash after.</p>
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
  case'delReview':b=`<h2 id="sheetT">Delete this review?</h2><p>It comes off ${esc(firstName(s.about))}'s profile for good. It can't be written again for this job.</p>
    <button class="cta destructive" data-act="confirmDelReview">Delete review</button><button class="linkbtn" data-act="closeSheet">Keep it</button>`;break;
  case'pic':{const l=S.pics[s.k]||[],src=l[s.i];
    b=`<h2 id="sheetT" class="sr">Photo ${s.i+1} of ${l.length}</h2>${src?`<img class="bigpic" src="${src}" alt="Photo ${s.i+1} of ${l.length}">`:''}
    ${l.length>1?`<button class="btn2" data-act="nextPic">Show photo ${(s.i+1)%l.length+1} of ${l.length}</button>`:''}<button class="linkbtn" data-act="closeSheet">Close</button>`;break}
  case'remove':b=`<h2 id="sheetT">Take this job off the board?</h2><p>Use this for jobs that break the rules. The poster sees it marked as removed.</p>
    <button class="cta destructive" data-act="confirmRemove">Remove job</button><button class="linkbtn" data-act="closeSheet">Cancel</button>`;break;
  case'uninvite':b=`<h2 id="sheetT">Remove ${esc(s.about)}?</h2><p>They can't sign up with this email, and if they already joined they're locked out straight away and their jobs leave the board.</p>
    <button class="cta destructive" data-act="confirmUninvite">Remove</button><button class="linkbtn" data-act="closeSheet">Keep them</button>`;break;
  case'offer':{const o=S.offer,fn=esc(firstName(o.to));
    b=`<h2 id="sheetT">${o.prevJob?`Hire ${fn} again`:`Ask ${fn} for a favour`}</h2>
    <p>Only ${fn} sees this. If they accept, it becomes a job between you two, and you can chat about it.</p>
    <textarea id="oft" class="inp" rows="2" maxlength="200" style="resize:none" placeholder="Grab my print-outs from Sai Xerox on your way back?" data-bind="offer.text" aria-label="What do you need?">${esc(o.text)}</textarea>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><label class="field" for="ofp" style="flex:1 1 140px"><span class="fl">You'll pay ₹</span><input id="ofp" inputmode="numeric" maxlength="5" placeholder="60" value="${esc(o.price)}" data-bind="offer.price"></label>
      <input id="ofw" class="inp" style="flex:1 1 140px;border-radius:999px" maxlength="40" placeholder="Where? Gate 1" value="${esc(o.where)}" data-bind="offer.where" aria-label="Where"></div>
    <div class="chips" role="group" aria-label="By when">${WHENS.map(w=>`<button class="chip ${o.when===w?'on':''}" data-ofwhen="${w}" aria-pressed="${o.when===w}">${w}</button>`).join('')}</div>
    ${S.err.offer?`<p class="err">${esc(S.err.offer)}</p>`:''}
    <button class="cta" data-act="sendOffer" data-need="offer">Send to ${fn}</button>`;break}
  case'invitefriend':{const off=S.config.memberInvites===false&&!S.me.isOwner,c=S.lastCode;
    b=off?`<h2 id="sheetT">Invites are off</h2><p>${esc(Organiser())} has turned off member invites for now.</p><button class="linkbtn" data-act="closeSheet">OK</button>`
     :`<h2 id="sheetT">Invite a friend</h2><p>Each link works for one person. They sign up with any email. You're vouching for them, so only invite people you know.</p>
      ${c?codeShare(c):`<button class="cta" data-act="makeCode">Create invite link</button>`}
      ${c?'<button class="linkbtn" data-act="makeCode">Make another link</button>':''}`;break}
  case'reshare':b=`<h2 id="sheetT">Send the invite again</h2><p>${esc(s.about)}</p>${shareButtons(s.about)}<button class="linkbtn" data-act="closeSheet">Done</button>`;break;
  case'report':b=`<h2 id="sheetT">Report ${esc(shortName(s.about))}</h2><p>${esc(organiser())} sees your report and can read chats with them.</p>
    <div class="chips" role="group" aria-label="Reason">${REASONS.map(r=>`<button class="chip ${S.rep.why===r?'on':''}" data-why="${esc(r)}" aria-pressed="${S.rep.why===r}">${esc(r)}</button>`).join('')}</div>
    <input id="repN" class="inp" maxlength="200" placeholder="What happened? (optional)" value="${esc(S.rep.note)}" data-bind="rep.note" aria-label="What happened">
    <label class="check" for="repB"><input type="checkbox" id="repB" data-bind="rep.block" ${S.rep.block?'checked':''}> Also block them. You won't see their jobs, bids or messages.</label>
    ${S.err.rep?`<p class="err">${esc(S.err.rep)}</p>`:''}<button class="cta" data-act="confirmReport" data-need="report">Send report</button>
    <button class="linkbtn" data-act="blockOnly">Just block them</button>`;break;
  case'erase':b=`<h2 id="sheetT">Delete your account?</h2><p>This erases your profile, the jobs you pinned, your bids, ratings you gave and your messages, and removes your login. It can't be undone.</p>
    <div class="stack gap8"><label class="formlabel" for="erPw">Your password</label>
    <input id="erPw" class="inp" type="password" autocomplete="current-password" value="${esc(S.erase.pw)}" data-bind="erase.pw"></div>
    ${S.err.erase?`<p class="err" role="alert">${esc(S.err.erase)}</p>`:''}
    <button class="cta destructive" data-act="confirmErase" data-need="erase" ${S.busy?'disabled':''}>${S.busy?'Deleting…':'Delete everything'}</button><button class="linkbtn" data-act="closeSheet">Keep my account</button>`;break;
  }
  return`<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetT">${b}</div>`;
}

const VIEWS={board:viewBoard,job:viewJob,post:viewPost,bids:viewBids,chats:viewChats,chat:viewChat,me:D=>viewPerson(S.me.id,D),person:D=>viewPerson(S.personOf,D),privacy:viewPrivacy,invites:viewInvites,edit:()=>`<div class="pad">${onboardHTML(true)}</div>`};
let lastView=null,lastSheet=null;const scrollMem={};
const INTRO=[
  {k:'board',t:'This is the board.',b:'Classmates pin small jobs here. A print run, a lift down four floors, an hour of help before a deadline.'},
  {k:'bid',t:'Bid what it\u2019s worth.',b:'Name your price and pitch yourself in one line. Only the poster sees your bid.'},
  {k:'pick',t:'Get picked. Sort it in chat.',b:'The poster picks one person and you plan it together. You pay each other on UPI or cash. tack never touches the money.'},
  {k:'rate',t:'Rate each other.',b:'When it\u2019s done, you both rate the other. Profiles show the averages, never who gave them.'},
  {k:'end'}];
function introScene(k){const me=S.me?.id;
  if(k==='board')return`<div class="sc sc-board" aria-hidden="true">${[['₹120','Print 40 pages at Sai Xerox','#A18CFF'],['₹60','Parcel from Gate 1','#FF7AD1'],['₹300','20 photos at golden hour','#4FE3E0']].map(([p,t,c],i)=>`<span class="sct" style="--i:${i}"><span class="pin" style="background:${c};box-shadow:0 0 10px ${c}"></span><b>${p}</b><i>${t}</i></span>`).join('')}</div>`;
  if(k==='bid')return`<div class="sc sc-bid" aria-hidden="true"><span class="sct" style="--i:0"><span class="pin" style="background:#FFC53D;box-shadow:0 0 10px #FFC53D"></span><b>₹150</b><i>Help me move a cupboard</i></span>
    <span class="bubble" style="--i:1">${me?face(me,26):''}<b>₹120</b><span>I can do it by 5</span></span><span class="lock" style="--i:2">${ic('shield',13,2.2)} Only the poster sees this</span></div>`;
  if(k==='pick')return`<div class="sc sc-pick" aria-hidden="true"><span class="who" style="--i:0">${me?ring(me,56):''}</span><span class="link" style="--i:1"></span><span class="who" style="--i:0"><span class="ring" style="border-color:#4FE3E0;width:56px;height:56px"><span class="av av-empty" style="background:#4FE3E02e;color:#4FE3E0;width:48px;height:48px;font-size:19px">S</span></span></span>
    <span class="bubble b2" style="--i:2">On my way. 10 minutes.</span><span class="lock" style="--i:3">UPI or cash, between you two</span></div>`;
  if(k==='rate')return`<div class="sc sc-rate" aria-hidden="true"><span class="stars">${[0,1,2,3,4].map(i=>`<span class="st" style="--i:${i}">${ic('star',30,2,'currentColor','currentColor')}</span>`).join('')}</span><span class="lock" style="--i:6">${ic('shield',13,2.2)} Anonymous, always</span></div>`;
  return`<div class="sc sc-end" aria-hidden="true"><span class="bigpin"></span></div>`}
function renderIntro(){let r=$('introRoot');
  if(!S.intro.on){if(r)r.remove();return}
  if(!r){r=document.createElement('div');r.id='introRoot';document.body.appendChild(r);
    let x0=null;r.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});
    r.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>50)introStep(dx<0?1:-1)},{passive:true})}
  const i=S.intro.i,sl=INTRO[i],last=sl.k==='end',fn=esc(S.me?firstName(S.me.id):'');
  r.innerHTML=`<div class="intro" role="dialog" aria-modal="true" aria-labelledby="introT">
    <div class="introtop"><span class="mark">tack</span>${last?'':'<button class="linkbtn" data-act="introSkip">Skip</button>'}</div>
    <div class="introbody" data-k="${sl.k}">${introScene(sl.k)}
      <div class="introtext">${last?`<h1 id="introT" class="ia">You\u2019re in${fn?', '+fn:''}.</h1><p class="ib">Pin something you need, or find something to do. The board is yours.</p>`
        :`<span class="ik">${i+1} of ${INTRO.length-1}</span><h1 id="introT" class="ia">${sl.t}</h1><p class="ib">${sl.b}</p>`}</div></div>
    <div class="introfoot">${last?`<button class="cta inext" data-act="introDone">Show me the board</button><button class="btn2 inext2" data-act="introPost">Pin my first job</button>`
      :`<div class="idots" aria-hidden="true">${INTRO.slice(0,-1).map((_,j)=>`<span class="${j===i?'on':''}"></span>`).join('')}</div><button class="cta inext" data-act="introNext">${i===INTRO.length-2?'Got it':'Next'}</button>`}</div></div>`;
  requestAnimationFrame(()=>r.querySelector('.inext')?.focus({preventScroll:true}))}
function openIntro(back){S.intro={on:true,i:0,back:back||null};renderIntro()}
function introStep(d){const i=S.intro.i+d;if(i<0||i>=INTRO.length)return;S.intro.i=i;renderIntro()}
function closeIntro(to){const back=S.intro.back;S.intro={on:false,i:0};renderIntro();if(!S.priv.introSeen)savePriv({introSeen:Date.now()});go(to||back||'board')}
function moment(title,sub,ms=1300){
  const r=document.createElement('div');r.className='momentroot';r.setAttribute('role','status');
  r.innerHTML=`<div class="moment"><span class="bigpin"></span><h2>${esc(title)}</h2>${sub?`<p>${esc(sub)}</p>`:''}</div>`;
  document.body.appendChild(r);S.momentOn=true;const t=reduceMotion.matches?Math.min(ms,700):ms;
  return new Promise(res=>setTimeout(()=>{r.classList.add('out');setTimeout(()=>{r.remove();S.momentOn=false;res();if(S.phase==='app')render()},reduceMotion.matches?0:260)},t))}
function stepsCard(D){if(!S.priv.introSeen||S.priv.stepsHidden)return'';const me=S.me.id,d=S.myDoc||{};
  const steps=[[!!d.photo,'Add a profile photo','A real face helps people say yes.','data-go="edit"'],[num(d.freeUntil)>0,'Mark yourself free','Free people show up first for quick asks.','data-sheet="free"'],
    [D.jobs.some(j=>j.owner===me)||Object.keys(S.pitchMine).length>0,'Pin or bid on a job','The first one is the hardest.','data-go="post"']];
  const n=steps.filter(x=>x[0]).length;if(n===steps.length)return'';
  return`<section class="steps" aria-label="Your first steps"><div class="stepshead"><b>Your first steps</b><span>${n} of ${steps.length} done</span><button class="iconbtn" data-act="hideSteps" aria-label="Hide first steps">${ic('x',14,2.4)}</button></div>
    <div class="stepbar"><span style="width:${Math.round(n/steps.length*100)}%"></span></div>
    ${steps.map(([done,t,h,at])=>`<button class="step ${done?'done':''}" ${done?'disabled':at}><span class="stepdot">${done?ic('tick',12,3.2):''}</span><span class="rowtext"><span class="t1">${t}</span><span class="t2">${done?'Done':h}</span></span>${done?'':`<span class="chev">${ic('chev',16)}</span>`}</button>`).join('')}</section>`}
const NEED={
  signup:()=>S.form.name.trim().length>=2&&validEmail(S.form.email.trim())&&S.form.pw.length>=8,
  login:()=>validEmail(S.form.email.trim())&&!!S.form.pw,
  reset:()=>validEmail(S.form.email.trim()),
  join:()=>S.onb.name.trim().length>=2&&!!S.onb.year&&!!S.onb.branch.trim()&&!!S.onb.adult&&!!S.onb.rules,
  profile:()=>S.onb.name.trim().length>=2&&!!S.onb.year&&!!S.onb.branch.trim(),
  bid:()=>{const a=digits(S.bid.amt);return a>=1&&a<=50000},
  post:()=>{const p=digits(S.draft.price);return S.draft.text.trim().length>=8&&p>=10&&p<=20000},
  rate:()=>!!(S.rate.a&&S.rate.b&&S.rate.c&&S.rate.d),
  review:()=>S.rate.rev.trim().length>=3,
  offer:()=>{const p=digits(S.offer.price);return S.offer.text.trim().length>=6&&p>=10&&p<=20000},
  report:()=>!!S.rep.why,
  erase:()=>!!S.erase.pw,
  invite:()=>validEmail(S.inv.email.trim().toLowerCase()),
};
function syncNeed(){document.querySelectorAll('[data-need]').forEach(b=>{let ok=true;try{ok=!!NEED[b.dataset.need]?.()}catch{}b.classList.toggle('wait',!ok);if(ok)b.removeAttribute('aria-disabled');else b.setAttribute('aria-disabled','true')})}
function render(){
  queueMicrotask(syncNeed);
  const a=document.activeElement,fid=a&&a.id;let s0=null,s1=null;try{s0=a.selectionStart;s1=a.selectionEnd}catch{}
  const gate=$('gate'),app=$('app');
  if(S.phase!=='app'){
    app.hidden=true;gate.hidden=false;document.title='tack';gate.className='gate'+(['onboard','auth'].includes(S.phase)?' scroll':'');gate.innerHTML=gateHTML();$('sheetRoot').innerHTML='';lastView=null;
  }else{
    gate.hidden=true;app.hidden=false;if(gate.innerHTML)gate.innerHTML='';
    const D=derive(),main=$('main');if(lastView&&lastView!==S.view)scrollMem[lastView]=main.scrollTop;
    const keep=lastView===S.view?main.scrollTop:((DEPTH[S.view]??1)===0?scrollMem[S.view]||0:0);
    main.innerHTML=(VIEWS[S.view]||viewBoard)(D);main.scrollTop=keep;
    if(lastView!==S.view&&S.view==='chat')requestAnimationFrame(()=>{main.scrollTop=main.scrollHeight});
    lastView=S.view;
    $('rail').innerHTML=railHTML(D);
    const navOn=v=>S.view===v||(v==='board'&&['job','person'].includes(S.view))||(v==='chats'&&S.view==='chat')||(v==='me'&&['privacy','edit'].includes(S.view))||(v==='invites'&&S.view==='invites');
    $('sidebar').innerHTML=`<div style="padding:0 6px"><div class="mark">tack</div><div class="sub"><span class="dot"></span><span>${esc(campus())} · ${boardJobs(D).length} pinned</span></div></div>
      <button class="cta" data-go="post" style="padding:13px 10px;font-size:var(--t-16)">+ Pin a job</button>
      <nav style="display:flex;flex-direction:column;gap:3px" aria-label="Sections">${[['board','Board','board'],['bids','Activity','bids'],['chats','Chats','chat'],['me','Profile','me']].concat(S.me.isOwner?[['invites','Invites','users']]:[])
        .map(([v,l,i])=>`<button class="navitem ${navOn(v)?'on':''}" data-go="${v}" ${navOn(v)?'aria-current="page"':''}>${ic(i,18)} ${l}${v==='chats'&&D.unread?'<span class="udot" aria-label="Unread"></span>':''}${v==='bids'&&(D.toConfirm||D.offersWaiting||D.newNotes)?'<span class="udot" aria-label="New activity"></span>':''}</button>`).join('')}</nav>
      <button class="card" style="margin-top:auto;padding:10px 12px;border-radius:var(--r-sm)" data-go="me">${ring(S.me.id,38)}<span class="rowtext"><span style="font-size:var(--t-12);font-weight:700">${esc(shortName(S.me.id))}</span>
        <span style="font-size:var(--t-11);font-weight:500;color:var(--muted)">${esc(metaOf(S.me.id)||campus())}</span></span></button>`;
    $('tabbar').innerHTML=[['board','Board','board'],['bids','Activity','bids'],['post','','plus'],['chats','Chats','chat'],['me','Me','me']].map(([v,l,i])=>v==='post'
      ?`<button class="tab" data-go="post" aria-label="Pin a job"><span class="fab">${ic('plus',24,3,'var(--bg)')}</span></button>`
      :`<button class="tab ${navOn(v)||(v==='me'&&S.view==='invites')?'on':''}" data-go="${v}">${ic(i,20)}<span>${l}</span>${(v==='chats'&&D.unread)||(v==='bids'&&(D.toConfirm||D.offersWaiting||D.newNotes))?'<span class="udot"></span>':''}</button>`).join('');
    const attn=D.unread+D.offersWaiting+D.toConfirm+D.newNotes;document.title=attn?`(${attn}) tack`:'tack';
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
  const apply=()=>{if(v==='bids'&&from!=='bids'){S.actSeenAt=num(S.priv.actSeen);setTimeout(()=>savePriv({actSeen:Date.now()}),0)}S.view=v;S.sheet=null;S.err={};if(v==='person'||v==='me'){delete S.revs[v==='me'?S.me.id:S.personOf];S.allRevs=null}if(v==='edit')seedOnb();if(v==='invites')S.inv.campus='';render();
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
  togglePw(){S.showPw=!S.showPw;render();$('fPw')?.focus()},
  logout(){logOut()},
  closeSheet(){closeSheet()},
  checkVerified(){checkVerified().then(()=>{if(S.phase==='verify')toast('Not confirmed yet. Open the link in the email first.')})},
  async resendVerify(){try{await sendVerify(S.auth.currentUser);toast('Sent. Check your inbox and spam.')}catch(e){toast(authMsg(e))}},
  clearPhoto(){S.onb.photo='';render()},
  join(){const o=S.onb;
    if(!need(o.name.trim().length>=2,'onb','Add your full name.')||!need(o.year,'onb','Pick your year.')||!need(o.branch.trim(),'onb','Add your branch.')||!need(o.adult,'onb','tack is for students who are 18 or older.')||!need(o.rules,'onb','Tick the posting rule to continue.'))return;
    saveMine(d=>({...d,name:o.name.trim().slice(0,60),photo:o.photo||'',year:o.year,branch:o.branch.trim().slice(0,24),does:o.does.trim().slice(0,60),ring:o.ring,adult:true,joinedAt:d.joinedAt||Date.now(),jobs:d.jobs||{}}));
    S.err={};S.view='board';S.joining=true;computePhase();render();
    moment(`You\u2019re on the board, ${o.name.trim().split(/\s+/)[0]}.`,'Give us a second to show you around.',1600).then(()=>{S.joining=false;if(!S.priv.introSeen)openIntro()})},
  saveProfile(){const o=S.onb;if(!need(o.name.trim().length>=2,'onb','Add your full name.')||!need(o.year,'onb','Pick your year.')||!need(o.branch.trim(),'onb','Add your branch.'))return;
    saveMine(d=>({...d,name:o.name.trim().slice(0,60),photo:o.photo||'',year:o.year,branch:o.branch.trim().slice(0,24),does:o.does.trim().slice(0,60),ring:o.ring}));go('me');toast('Profile saved')},
  post(){const d=S.draft,text=d.text.trim(),price=digits(d.price);
    if(!need(text.length>=8,'post','Say what you need in a few more words.')||!need(price>=10&&price<=20000,'post','Set a price between ₹10 and ₹20,000.'))return;
    const id=rid(),at=Date.now(),where=(d.whereText.trim()||d.where).slice(0,40);
    const pics=cleanPics(d.pics),geo=d.useLoc&&LOC.pos?{lat:Math.round(LOC.pos.lat*1e3)/1e3,lng:Math.round(LOC.pos.lng*1e3)/1e3}:null;
    saveMine(x=>{x.jobs={...(x.jobs||{}),[id]:{text:text.slice(0,200),more:d.more.trim().slice(0,600),price,kind:d.kind,when:d.when,where,at,deadline:deadlineFor(d.when,at),status:'open',...(pics.length?{pics:pics.length}:{}),...(geo?{geo}:{})}};return x});
    if(pics.length){S.pics['j:'+S.me.id+'~'+id]=pics;S.fb.setDoc(S.fb.doc(S.db,'jobpics',S.me.id+'~'+id),{owner:S.me.id,job:id,pics,at}).catch(e=>{console.warn(e);toast('Your job is up, but the photos didn\u2019t upload.')})}
    S.draft=blankDraft();S.sort='newest';S.fresh=S.me.id+'~'+id;go('board');moment('Pinned.','Classmates can bid on it now.',1100);setTimeout(()=>{S.fresh=null},4000)},
  repost(){const j=derive().jobByKey[S.openJob];if(!j)return;S.draft={...blankDraft(),text:j.text,price:String(j.price),kind:KINDS.includes(j.kind)?j.kind:'Other',where:WHERES.includes(j.where)?j.where:'Gate 1',whereText:WHERES.includes(j.where)?'':j.where,more:j.more,pics:[...(S.pics['j:'+j.key]||[])]};
    saveMine(x=>{if(x.jobs?.[j.id])x.jobs[j.id].status='closed';return x});go('post')},
  bid(){const j=derive().jobByKey[S.openJob];if(!j)return;const amt=digits(S.bid.amt);
    if(!need(amt>=1&&amt<=50000,'bid','Enter a bid in rupees.'))return;const had=!!myBidOn(j.key);
    const id=j.key+'~'+S.me.id,old=num(myBidOn(j.key)?.pics),pics=S.bid.pics?cleanPics(S.bid.pics):null,n=pics?pics.length:old;
    savePitch(j.key,S.bid.say.trim(),amt,n,!!(j.geo&&LOC.pos&&distM(LOC.pos,j.geo)<=NEAR_M));render();S.err={};toast(had?'Bid updated':'Bid placed');
    if(pics){const {doc,setDoc,deleteDoc}=S.fb;S.pics['b:'+id]=pics;
      if(pics.length)setDoc(doc(S.db,'bidpics',id),{owner:j.owner,by:S.me.id,job:j.key,pics,at:Date.now()}).catch(e=>{console.warn(e);toast('Your bid is in, but the photos didn\u2019t upload.')});
      else if(old)deleteDoc(doc(S.db,'bidpics',id)).catch(()=>{})}},
  withdraw(){const k=S.openJob,id=k+'~'+S.me.id,had=num(myBidOn(k)?.pics);savePitch(k,'',0);
    if(had){delete S.pics['b:'+id];S.fb.deleteDoc(S.fb.doc(S.db,'bidpics',id)).catch(()=>{})}
    render();S.bid={key:null};toast('Bid withdrawn')},
  async postReview(){const j=derive().jobByKey[S.openJob];if(!j||!j.pick||j.pick.review||j.owner!==S.me.id||jobState(j)!=='done')return;
    const text=S.rate.rev.trim().slice(0,400);if(!need(text.length>=3,'rate','Write a few words first.'))return;
    S.busy=true;render();
    try{await reviewBatch(j.key,j.accepted,text,cleanPics(S.rate.pics),num((S.priv.gave||{})[j.key]));S.sheet=null;toast('Review posted')}
    catch(e){console.warn(e);S.err={rate:'Couldn\u2019t post your review. Try again.'}}
    S.busy=false;render()},
  confirmDelReview(){const s=S.sheet;if(!s?.rid)return;const {doc,deleteDoc}=S.fb;
    deleteDoc(doc(S.db,'reviewpics',s.rid)).catch(()=>{});deleteDoc(doc(S.db,'reviews',s.rid)).then(()=>{delete S.revs[s.about];toast('Review deleted');render()}).catch(writeErr);
    S.sheet=null;render()},
  allReviews(el){S.allRevs=el.dataset.uid;render()},
  introNext(){if(S.intro.i>=INTRO.length-1)return closeIntro();introStep(1)},
  introSkip(){closeIntro()},
  introDone(){closeIntro('board')},
  introPost(){closeIntro('post')},
  replayIntro(){openIntro(S.view)},
  hideSteps(){savePriv({stepsHidden:true})},
  toggleNear(){if(S.near){S.near=false;render();return}
    if(LOC.pos){S.near=true;render();return}
    toast('Finding where you are…');getLoc().then(p=>{if(p){S.near=true;render()}else toast('Couldn\u2019t get your location. Allow location for this site in your browser settings.')})},
  clearFind(){S.find.q='';S.near=false;render()},
  toggleJobLoc(){const d=S.draft;if(d.useLoc){d.useLoc=false;render();return}
    getLoc().then(p=>{if(p){d.useLoc=true;render()}else toast('Couldn\u2019t get your location. Allow location for this site in your browser settings.')})},
  nextPic(){const s=S.sheet,l=S.pics[s?.k];if(!l||!l.length)return;S.sheet={...s,i:(s.i+1)%l.length};render()},
  confirmPick(){const j=derive().jobByKey[S.openJob],s=S.sheet;if(!j||!s)return;
    saveMine(x=>{const o=x.jobs?.[j.id];if(o){o.status='assigned'}return x});
    S.picks={...S.picks,[j.key]:{owner:S.me.id,job:j.id,doer:s.uid,agreed:s.amt,at:Date.now(),status:'assigned'}};
    S.fb.setDoc(S.fb.doc(S.db,'picks',j.key),{owner:S.me.id,job:j.id,doer:s.uid,agreed:s.amt,at:Date.now(),status:'assigned'}).catch(e=>{console.warn(e);toast('Couldn\u2019t save the pick. Try again.')});
    S.sheet=null;toast('Picked '+firstName(s.uid)+'. Sort out the details in chat.');openThread({key:jobThreadKey(j.key,s.uid),other:s.uid,jobKey:j.key})},
  async confirmDone(){const j=derive().jobByKey[S.openJob];if(!j||!j.pick||j.pick.ratedDoer)return;const r=S.rate;
    if(!need(r.a&&r.b&&r.c&&r.d,'rate','Rate all four, from 1 to 5.'))return;
    const vals={timing:r.a,quality:r.b,comm:r.c,care:r.d},at=Date.now(),note=r.text.trim().slice(0,200);
    if(j.status!=='done')saveMine(x=>{const o=x.jobs?.[j.id];if(o){o.status='done';o.doneAt=at}return x});
    S.busy=true;render();
    try{await rateBatch(j.key,j.accepted,'d',vals,{status:'done',doneAt:num(j.pick.doneAt)||at,ratedDoer:true,...(note?{noteToDoer:note}:{})});
      savePriv({gave:{...(S.priv.gave||{}),[j.key]:(r.a+r.b+r.c+r.d)/4}});S.sheet=null;toast('Marked done. Thanks for rating.');
      const rev=r.rev.trim().slice(0,400);if(rev){try{await reviewBatch(j.key,j.accepted,rev,cleanPics(r.pics),(r.a+r.b+r.c+r.d)/4)}catch(e){console.warn(e);toast('Rating saved, but the review didn\u2019t post. Try again from the job.')}}}
    catch(e){console.warn(e);S.err={rate:'Couldn\u2019t save your rating. Try again.'}}
    S.busy=false;render()},
  async confirmRatePoster(){const j=derive().jobByKey[S.openJob];if(!j||!j.pick||j.pick.ratedPoster||j.accepted!==S.me.id)return;const r=S.rate;
    if(!need(r.a&&r.b&&r.c&&r.d,'rate','Rate all four, from 1 to 5.'))return;
    const vals={payment:r.a,clarity:r.b,comm:r.c,respect:r.d},note=r.text.trim().slice(0,200);
    S.busy=true;render();
    try{await rateBatch(j.key,j.owner,'p',vals,{ratedPoster:true,...(note?{noteToPoster:note}:{})});
      savePriv({gave:{...(S.priv.gave||{}),[j.key]:(r.a+r.b+r.c+r.d)/4}});S.sheet=null;toast('Thanks for rating.')}
    catch(e){console.warn(e);S.err={rate:'Couldn\u2019t save your rating. Try again.'}}
    S.busy=false;render()},
  confirmClose(){const j=derive().jobByKey[S.openJob];if(!j)return;saveMine(x=>{if(x.jobs?.[j.id])x.jobs[j.id].status='closed';return x});S.sheet=null;toast('Job closed')},
  confirmRemove(){const j=derive().jobByKey[S.openJob];if(!j||!S.me.isOwner)return;const {doc,updateDoc,FieldPath}=S.fb;
    updateDoc(doc(S.db,'people',j.owner),new FieldPath('jobs',j.id,'status'),'removed').catch(writeErr);
    if(j.pics){delete S.pics['j:'+j.key];S.fb.deleteDoc(doc(S.db,'jobpics',j.key)).catch(()=>{})}S.sheet=null;toast('Job removed from the board');go('board')},
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
        if(t&&t.lastBy===me)await S.fb.setDoc(doc(S.db,'threads',k),{lastText:'Message deleted'},{merge:true}).catch(()=>{})}
      for(const[id,p]of Object.entries(S.pitchMine)){if(num(p?.pics))await deleteDoc(doc(S.db,'bidpics',id)).catch(()=>{});await deleteDoc(doc(S.db,'pitches',id))}
      for(const pk of Object.values(S.picks))if(pk&&pk.owner===me&&typeof pk.review==='string'){await deleteDoc(doc(S.db,'reviewpics',pk.review)).catch(()=>{});await deleteDoc(doc(S.db,'reviews',pk.review)).catch(()=>{})}
      for(const[id,j]of Object.entries(S.myDoc?.jobs||{}))if(num(j?.pics))await deleteDoc(doc(S.db,'jobpics',me+'~'+id)).catch(()=>{});
      for(const id of Object.keys(S.offersOut))await deleteDoc(doc(S.db,'offers',id)).catch(()=>{});
      for(const[id,c]of Object.entries(S.myCodes))if(!c.usedBy)await deleteDoc(doc(S.db,'invcodes',id)).catch(()=>{});
      await deleteDoc(doc(S.db,'people',me));await deleteDoc(doc(S.db,'private',me));
      S.erased=true;stopSubs();await deleteUser(user);
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
    setDoc(doc(S.db,'invites',e),{at:Date.now(),by:S.me.id}).catch(writeErr);
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
    const id=rid(),key=`${me}~${id}~${o.to}`,d={owner:me,to:o.to,job:id,text:text.slice(0,200),price,when:o.when,where:o.where.trim().slice(0,40),at:Date.now(),status:'pending',...(o.prevJob?{prevJob:o.prevJob}:{})};
    S.offersOut={...S.offersOut,[key]:d};S.sheet=null;render();
    S.fb.setDoc(S.fb.doc(S.db,'offers',key),d).then(()=>toast('Sent to '+firstName(o.to)+'. You\u2019ll see their answer in Activity.')).catch(e=>{const m={...S.offersOut};delete m[key];S.offersOut=m;render();
      toast(e&&e.code==='permission-denied'?firstName(o.to)+' isn\u2019t free any more. Try again when they are.':'Couldn\u2019t send it. Try again.')})},
  acceptOffer(el){const k=el.dataset.key;S.fb.updateDoc(S.fb.doc(S.db,'offers',k),{status:'accepted',respondedAt:Date.now()}).then(()=>toast('Accepted. It\u2019s now a job between you two.')).catch(writeErr)},
  declineOffer(el){const k=el.dataset.key;S.fb.updateDoc(S.fb.doc(S.db,'offers',k),{status:'declined',respondedAt:Date.now()}).then(()=>toast('Declined')).catch(writeErr)},
  withdrawOffer(el){const k=el.dataset.key,m={...S.offersOut};delete m[k];S.offersOut=m;render();S.fb.deleteDoc(S.fb.doc(S.db,'offers',k)).catch(writeErr)},
  toggleMemberInvites(el){S.config={...S.config,memberInvites:!!el.checked};render();S.fb.setDoc(S.fb.doc(S.db,'config','app'),S.config).catch(writeErr);toast(el.checked?'Members can invite friends':'Member invites are off')},
  saveCampus(){const c=(S.inv.campus||'').trim();if(!c)return;const {doc,setDoc}=S.fb;
    S.config={...S.config,campus:c.slice(0,40)};setDoc(doc(S.db,'config','app'),S.config).catch(writeErr);toast('Campus name saved');render()},
  copy(el){const t=el.dataset.text||'';
    try{navigator.clipboard.writeText(t).then(()=>toast('Copied'),()=>toast('Couldn’t copy. Select the text and copy it.'))}catch{toast('Couldn’t copy.')}}
};

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-acttab],[data-pic],[data-unpic],[data-go],[data-job],[data-sort],[data-set],[data-bump],[data-person],[data-thread],[data-thread-job],[data-thread-with],[data-pick],[data-sheet],[data-act],[data-onb],[data-free],[data-star],[data-why],[data-auth],[data-ask],[data-ofwhen]');
  if(!el)return;const ds=el.dataset;
  if(ds.ask!==undefined){if(ds.ask===S.me?.id)return;S.offer={to:ds.ask,prevJob:ds.prev||null,text:'',price:'',when:'Next hour',where:''};S.err={};S.sheet={type:'offer'};render();return}
  if(ds.ofwhen!==undefined){S.offer.when=ds.ofwhen;render();return}
  if(ds.auth!==undefined){S.authMode=ds.auth;S.authErr='';S.authMsg='';render();return}
  if(ds.act!==undefined){const f=ACT[ds.act];if(f){e.preventDefault();f(el)}return}
  if(ds.go!==undefined){go(ds.go);return}
  if(ds.job!==undefined){const pr=el.classList.contains('tile')&&el.querySelector('.price');if(pr&&document.startViewTransition&&!reduceMotion.matches)pr.style.viewTransitionName='jp';S.openJob=ds.job;S.bid={key:null};for(const k of Object.keys(S.pics))if(k.startsWith('b:'+ds.job+'~'))delete S.pics[k];go('job');return}
  if(ds.acttab!==undefined){S.actTab=ds.acttab;render();return}
  if(ds.sort!==undefined){S.sort=ds.sort;render();return}
  if(ds.set!==undefined){S.draft[ds.set]=ds.val;if(ds.set==='where')S.draft.whereText='';render();return}
  if(ds.bump!==undefined){S.draft.price=String((digits(S.draft.price)||0)+ +ds.bump);render();return}
  if(ds.person!==undefined){if(ds.person===S.me?.id){go('me');return}S.personOf=ds.person;go('person');return}
  if(ds.onb!==undefined){S.onb[ds.onb]=ds.val;render();return}
  if(ds.pick!==undefined){const b=bidsFor(derive(),S.openJob).find(x=>x.by===ds.pick);if(b){S.sheet={type:'pick',uid:b.by,amt:b.amt};render()}return}
  if(ds.sheet!==undefined){if(ds.sheet==='invitefriend')S.lastCode=null;S.err={};S.erase={pw:''};if(ds.sheet==='done'||ds.sheet==='ratePoster'||ds.sheet==='review')S.rate={a:0,b:0,c:0,d:0,text:'',rev:'',pics:[]};if(ds.sheet==='report')S.rep={why:ds.prewhy||'',note:'',block:false};S.sheet={type:ds.sheet,about:ds.about,rid:ds.rid};render();return}
  if(ds.free!==undefined){const now=new Date(),t={'1h':+now+36e5,'3h':+now+3*36e5,day:new Date(now).setHours(23,59,0,0),off:0}[ds.free];
    saveMine(d=>{d.freeUntil=t;return d});S.sheet=null;toast(t?'You’re on the Free right now row':'Marked not free');return}
  if(ds.pic!==undefined){S.sheet={type:'pic',k:ds.pic,i:+ds.i||0};render();return}
  if(ds.unpic!==undefined){const o=ds.unpic==='draft'?S.draft:ds.unpic==='rev'?S.rate:S.bid;o.pics=(o.pics||[]).filter((_,i)=>i!==+ds.i);render();return}
  if(ds.star!==undefined){S.rate[ds.star[0]]=+ds.star.slice(1);render();return}
  if(ds.why!==undefined){S.rep.why=ds.why;render();return}
  const D=derive(),me=S.me.id;
  if(ds.thread!==undefined){const t=D.threads.find(x=>x.key===ds.thread);if(t)openThread(t);return}
  if(ds.threadJob!==undefined){const j=D.jobByKey[S.openJob];if(j&&canMessage({key:jobThreadKey(j.key,me),other:j.owner,jobKey:j.key},D))openThread({key:jobThreadKey(j.key,me),other:j.owner,jobKey:j.key});return}
  if(ds.threadWith!==undefined){const j=D.jobByKey[S.openJob];if(j)openThread({key:jobThreadKey(j.key,ds.threadWith),other:ds.threadWith,jobKey:j.key});return}
});
document.addEventListener('submit',e=>{
  const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();
  if(S.busy)return;({signup:doSignup,login:doLogin,reset:doReset})[f.dataset.form]?.();
});
function bind(e){const b=e.target.dataset?.bind;if(!b)return;const[o,k]=b.split('.');S[o][k]=e.target.type==='checkbox'?e.target.checked:e.target.value}
document.addEventListener('input',e=>{bind(e);if(e.target.id==='q')render();else syncNeed()});
document.addEventListener('change',async e=>{
  bind(e);syncNeed();
  if(e.target.dataset?.toggle==='memberInvites'){ACT.toggleMemberInvites(e.target);return}
  if(e.target.matches('[data-pics]')){const t=e.target.dataset.pics,o=t==='draft'?S.draft:t==='rev'?S.rate:S.bid,ek=t==='draft'?'post':t==='rev'?'rate':'bid';
    const files=[...e.target.files].slice(0,Math.max(0,MAX_PICS-(o.pics||[]).length));e.target.value='';let bad=0;
    for(const f of files){try{o.pics=[...(o.pics||[]),await readPic(f)]}catch{bad++}}
    S.err=bad?{[ek]:'One photo didn\u2019t work. Use a JPG or PNG.'}:{};render();return}
  if(e.target.matches('[data-photo]')){
    try{S.onb.photo=await readPhoto(e.target.files[0]);S.err={}}catch{S.err={onb:'That photo didn’t work. Use a JPG or PNG.'}}
    render();
  }
});
document.addEventListener('keydown',e=>{
  if(S.intro.on){if(e.key==='ArrowRight'){e.preventDefault();introStep(1)}else if(e.key==='ArrowLeft'){e.preventDefault();introStep(-1)}else if(e.key==='Escape')closeIntro();return}
  if(e.key==='Escape'&&S.sheet){closeSheet();return}
  if(e.key==='Enter'&&e.target.id==='msg'){e.preventDefault();sendMsg();return}
  if(e.key==='Enter'&&e.target.id==='invE'){e.preventDefault();ACT.invite();return}
});
setInterval(()=>{if(S.phase==='app'&&!document.activeElement?.matches?.('input,textarea'))render()},30000);
if(locOptIn())getLoc();setInterval(()=>{if(S.phase==='app'&&locOptIn()&&!document.hidden)getLoc()},3e5);
boot();
