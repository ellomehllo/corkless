const ms=()=>Date.now();
const snake=k=>k.replace(/[A-Z]/g,c=>'_'+c.toLowerCase());
const camel=k=>k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase());
const split=(k,n)=>{const p=String(k).split('~');return p.length===n?p:null};

const COLS={
  config:['id','campus','admin_uid','member_invites','banner'],
  invites:['email','at','by','uid','joined_at','code'],
  invcodes:['code','by','at','used_by','used_at'],
  people:['id','name','photo','year','branch','does','bio','banner','ring','adult','joined_at','free_until','removed','asks','handle','handle_at'],
  names:['id','name'],
  jobs:['owner','id','text','more','price','kind','when_label','place','at','deadline','status','done_at','taken_at','edited_at','repick_at','offer','pics','geo','color','dropped','drop_why'],
  jobpics:['owner','job','pics','at'],
  pitches:['owner','job','by','amt','say','at','pics','near'],
  bidpics:['owner','job','by','pics','at'],
  offers:['owner','job','recipient','text','price','when_label','place','at','status','prev_job','responded_at'],
  picks:['owner','job','doer','agreed','at','status','done_at','rated_doer','rated_poster','note_to_doer','note_to_poster','review','paid','sent','upi','poster_name','doer_name'],
  rep:['id','d','p'],
  strikes:['id','n','cleared'],
  reviews:['id','about','text','stars','pics','at'],
  reviewpics:['id','pics'],
  campuses:['id','name','auto','at'],
  threads:['id','members','job','open','last_text','last_at','last_by','read'],
  msgs:['id','thread','by','t','at'],
  reports:['by','about','why','note','kind','job','at'],
  flags:['by','area','cat','at'],
};
const REN={when:'when_label',where:'place',to:'recipient'};
const UNREN={when_label:'when',place:'where',recipient:'to'};

const one=()=>({pk:r=>({id:r}),key:r=>String(r.id),strip:['id']});
const C={
  config:{t:'config',pk:()=>({id:1}),key:()=>'app',strip:['id']},
  invites:{t:'invites',pk:k=>({email:k}),key:r=>r.email,strip:['email']},
  invcodes:{t:'invcodes',pk:k=>({code:k}),key:r=>r.code,strip:['code']},
  people:{t:'people',...one()},
  names:{t:'names',...one()},
  private:{t:'private',...one()},
  rep:{t:'rep',...one()},
  strikes:{t:'strikes',...one()},
  reviews:{t:'reviews',...one()},
  reviewpics:{t:'reviewpics',...one()},
  threads:{t:'threads',...one()},
  campuses:{t:'campuses',...one()},
  msgs:{t:'msgs',...one()},
  reports:{t:'reports',...one()},
  flags:{t:'flags',...one()},
  jobpics:{t:'jobpics',pk:k=>{const p=split(k,2);return{owner:p[0],job:p[1]}},key:r=>r.owner+'~'+r.job,strip:[]},
  picks:{t:'picks',pk:k=>{const p=split(k,2);return{owner:p[0],job:p[1]}},key:r=>r.owner+'~'+r.job,strip:['key']},
  pitches:{t:'pitches',pk:k=>{const p=split(k,3);return{owner:p[0],job:p[1],by:p[2]}},key:r=>r.owner+'~'+r.job+'~'+r.by,strip:[],jobKey:true},
  bidpics:{t:'bidpics',pk:k=>{const p=split(k,3);return{owner:p[0],job:p[1],by:p[2]}},key:r=>r.owner+'~'+r.job+'~'+r.by,strip:[],jobKey:true},
  offers:{t:'offers',pk:k=>{const p=split(k,3);return{owner:p[0],job:p[1],recipient:p[2]}},key:r=>r.owner+'~'+r.job+'~'+r.recipient,strip:[]},
  jobs:{t:'jobs',pk:k=>{const p=split(k,2);return{owner:p[0],id:p[1]}},key:r=>r.owner+'~'+r.id,strip:['owner','id','key']},
};

function toRow(col,d){const c=C[col],cols=COLS[c.t],r={};
  for(const[k,v]of Object.entries(d||{})){if(v===undefined||v===DEL)continue;const s=REN[k]||snake(k);if(!cols.includes(s))continue;r[s]=v}
  if(c.jobKey&&typeof r.job==='string'&&r.job.includes('~'))r.job=r.job.split('~')[1];
  return r}
function fromRow(col,row){const c=C[col];if(col==='private')return row.data&&typeof row.data==='object'?{...row.data}:{};const d={};
  for(const[k,v]of Object.entries(row)){if(v===null||c.strip.includes(k))continue;d[UNREN[k]||camel(k)]=v}
  if(c.jobKey&&typeof d.job==='string'&&d.owner)d.job=d.owner+'~'+d.job;
  return d}
const NN={people:{adult:false,removed:false},jobs:{more:'',kind:'Errand',status:'open'},pitches:{say:''},picks:{rated_doer:false,rated_poster:false,status:'assigned'},
  offers:{status:'pending'},config:{campus:'MIT-WPU',member_invites:true},threads:{open:true,read:{}},invites:{at:0},invcodes:{at:0},jobpics:{at:0},bidpics:{at:0}};
const fullRow=(col,d)=>{const t=C[col].t,r=toRow(col,d),dflt=NN[t]||{};for(const s of COLS[t])if(!(s in r))r[s]=s in dflt?(s==='at'?ms():dflt[s]):null;return r};

export const DEL={__del:1};
export const deleteField=()=>DEL;
export class FieldPath{constructor(...p){this.p=p}}

function err(e){if(!e)return e;const x=new Error(e.message||String(e));x.cause=e;
  x.code=e.code==='42501'||/row-level security|permission denied/i.test(e.message||'')?'permission-denied':e.code==='23505'?'already-exists':e.code||'unknown';return x}
const chk=({data,error})=>{if(error)throw err(error);return data};

export function makeDb(sb){
  let chN=0;
  const ref=(col,id,sub)=>({col,id,sub,path:[col,id,sub].filter(Boolean).join('/')});
  const api={sb,
    doc:(_,col,id,sub,subId)=>sub?{col:sub,id:subId,parent:id}:ref(col,id),
    collection:(_,col,id,sub)=>sub?{col:sub,parent:id,q:true}:{col,q:true},
    query:(c,...ops)=>({...c,ops:[...(c.ops||[]),...ops]}),
    where:(f,op,v)=>({w:[f,op,v]}),orderBy:(f,dir='asc')=>({o:[f,dir]}),limit:n=>({l:n}),
    deleteField,FieldPath,
  };
  const snapOf=(col,row)=>{const d=row?fromRow(col,row):null,id=row?C[col].key(row):null;return{id,exists:()=>!!row,data:()=>d,ref:row?{col,id}:null}};
  const qsnap=(col,rows)=>{const docs=rows.map(r=>snapOf(col,r));return{docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)}};

  function sel(q){const col=q.col,c=C[col];let b=sb.from(c.t).select('*');
    if(col==='msgs')b=b.eq('thread',q.parent);
    let o=null,l=null;
    for(const x of q.ops||[]){if(x.w){const[f,op,v]=x.w,s=REN[f]||snake(f);if(op==='==')b=b.eq(s,v);else if(op==='array-contains')b=b.contains(s,[v]);else throw new Error('op '+op)}
      if(x.o)o=x.o;if(x.l)l=x.l}
    if(o)b=b.order(REN[o[0]]||snake(o[0]),{ascending:o[1]!=='desc'});if(l)b=b.limit(l);
    return{b,o,l}}
  function match(q,row){for(const x of q.ops||[]){if(!x.w)continue;const[f,op,v]=x.w,s=REN[f]||snake(f);
      if(op==='=='&&row[s]!==v)return false;if(op==='array-contains'&&!(Array.isArray(row[s])&&row[s].includes(v)))return false}
    return col2parent(q,row)}
  const col2parent=(q,row)=>q.col!=='msgs'||row.thread===q.parent;

  api.getDoc=async r=>{if(r.col==='adminCheck')throw err({code:'42501'});
    const c=C[r.col];const{data,error}=await sb.from(c.t).select('*').match(c.pk(r.id)).maybeSingle();if(error)throw err(error);return snapOf(r.col,data)};
  api.getDocs=async q=>{const{b}=sel(q);return qsnap(q.col,chk(await b))};

  api.setDoc=async(r,d,opt)=>{
    if(r.col==='people')return setPerson(r.id,d);
    if(r.col==='private'){if(!opt?.merge)throw new Error('private needs merge');return chk(await sb.rpc('priv_merge',{p:d}))}
    const c=C[r.col],row={...(opt?.merge?toRow(r.col,d):fullRow(r.col,d)),...c.pk(r.id)};
    if(r.col==='threads'&&!opt?.merge)throw new Error('threads use rpc');
    chk(await sb.from(c.t).upsert(row))};
  api.updateDoc=async(r,a,b)=>{
    if(a instanceof FieldPath){
      if(r.col==='people'&&a.p[0]==='jobs'){const patch={[REN[a.p[2]]||snake(a.p[2])]:b};return chk(await sb.from('jobs').update(patch).match({owner:r.id,id:a.p[1]}))}
      if(r.col==='private'&&b===DEL)return chk(await sb.rpc('priv_unset',{path:a.p}));
      throw new Error('field path')}
    const c=C[r.col],row=toRow(r.col,a);for(const k of Object.keys(a))if(a[k]===DEL)row[REN[k]||snake(k)]=null;
    const{data,error}=await sb.from(c.t).update(row).match(c.pk(r.id)).select(Object.keys(c.pk(r.id)).join(','));
    if(error)throw err(error);if(!data.length)throw err({code:'42501',message:'no row updated'})};
  api.deleteDoc=async r=>{const col=r.col,c=C[col];
    if(col==='msgs')return chk(await sb.from('msgs').delete().eq('id',r.id));
    chk(await sb.from(c.t).delete().match(c.pk(r.id)))};
  api.addDoc=async(q,d)=>{const c=C[q.col];chk(await sb.from(c.t).insert(toRow(q.col,d)))};

  const mine={jobs:{}};
  async function setPerson(uid,d){
    const {jobs={},...p}=d||{};
    chk(await sb.from('people').upsert({...fullRow('people',p),id:uid}));
    const rows=[];for(const[id,j]of Object.entries(jobs)){const s=JSON.stringify(j);if(mine.jobs[id]===s)continue;rows.push({...fullRow('jobs',j),owner:uid,id});mine.jobs[id]=s}
    if(rows.length){const{error}=await sb.from('jobs').upsert(rows);if(error){for(const r of rows)delete mine.jobs[r.id];throw err(error)}}
  }

  function live(table,filter,onRows,onErr,keyOf){
    const rows=new Map(),name='c'+(++chN)+'-'+table;let alive=true,t=null;
    const load=async()=>{let b=sb.from(table).select('*');if(filter)b=b.eq(filter[0],filter[1]);
      const{data,error}=await b;if(!alive)return;if(error){onErr&&onErr(err(error));return}
      rows.clear();for(const r of data)rows.set(keyOf(r),r);onRows(rows)};
    const ch=sb.channel(name).on('postgres_changes',{event:'*',schema:'public',table,...(filter?{filter:`${filter[0]}=eq.${filter[1]}`}:{})},p=>{
      if(p.eventType==='DELETE'){rows.delete(keyOf(p.old));onRows(rows);return}
      if(p.errors&&p.errors.length){clearTimeout(t);t=setTimeout(load,300);return}
      rows.set(keyOf(p.new),p.new);onRows(rows)}).subscribe(st=>{if(st==='SUBSCRIBED')load();else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT')setTimeout(()=>alive&&load(),3000)});
    return()=>{alive=false;sb.removeChannel(ch)}}

  api.onSnapshot=(q,next,onErr)=>{
    const col=q.col,c=C[col];
    if(col==='people'&&q.q){let P=null,J=null;
      const emit=()=>{if(!P||!J)return;const out={};for(const[id,r]of P)out[id]={...fromRow('people',r),jobs:{}};
        for(const r of J.values()){const o=out[r.owner];if(o)o.jobs[r.id]=fromRow('jobs',r)}
        const me=sb.__uid;if(me)mine.jobs=Object.fromEntries(Object.entries(out[me]?.jobs||{}).map(([k,v])=>[k,JSON.stringify(v)]));
        next({forEach:f=>Object.entries(out).forEach(([id,d])=>f({id,exists:()=>true,data:()=>d}))})};
      const u1=live('people',null,m=>{P=new Map(m);emit()},onErr,r=>r.id),u2=live('jobs',null,m=>{J=new Map(m);emit()},onErr,r=>r.owner+'~'+r.id);
      return()=>{u1();u2()}}
    if(!q.q){const pk=c.pk(q.id),f=Object.entries(pk)[0];
      return live(c.t,f,m=>{const r=[...m.values()].find(x=>Object.entries(pk).every(([k,v])=>String(x[k])===String(v)));next(snapOf(col,r||null))},onErr,c.key)}
    const{o,l}=sel(q);let filt=null;
    for(const x of q.ops||[])if(x.w&&x.w[1]==='=='){filt=[REN[x.w[0]]||snake(x.w[0]),x.w[2]];break}
    if(col==='msgs')filt=['thread',q.parent];
    return live(c.t,filt,m=>{let rs=[...m.values()].filter(r=>match(q,r));
      if(o){const s=REN[o[0]]||snake(o[0]),d=o[1]==='desc'?-1:1;rs.sort((a,b)=>(a[s]>b[s]?1:a[s]<b[s]?-1:0)*d)}
      if(l)rs=rs.slice(0,l);next(qsnap(col,rs))},onErr,c.key)};

  api.rpc=async(fn,args)=>chk(await sb.rpc(fn,args));
  return api;
}

export {toRow,fullRow,COLS};
