const LIST={
  hate:['nigger','nigga','faggot','fag','chink','kike','spic','tranny','retard','retarded','paki','towelhead','katua','katuwa','chamar','bhangi','chuhra','mleccha','sulla','kafir'],
  abuse:['madarchod','maderchod','madharchod','bhenchod','behenchod','bhenchodd','bhencho','chutiya','chutiye','chutia','chootiya','bhosdike','bhosdiwale','bhosda','bhosdi','gandu','gaandu','lund','lauda','lavda','lawda','lodu','randi','randwa','motherfucker','cunt','whore','slut','bitch','kill yourself','kys','rape','rapist'],
  illegal:['ganja','charas','weed','marijuana','cannabis','hashish','mdma','ecstasy','lsd','cocaine','heroin','meth','methamphetamine','opium','afeem','brown sugar','drugs','drug dealer',
    'gun','pistol','revolver','katta','rifle','ammo','ammunition','bullets','bomb','explosive','grenade',
    'fake id','fake certificate','fake marksheet','fake aadhaar','fake aadhar','forged','stolen phone','stolen laptop','hack account','hack instagram'],
  alcohol:['alcohol','liquor','daaru','daru','beer','vodka','whisky','whiskey','booze','cigarette','cigarettes','cigs','vape','hookah','gutka','tobacco','betting','satta','gambling','casino'],
  adult:['escort','escorts','hookup','nudes','nude','sex','sexting','porn','onlyfans'],
  academic:['proxy attendance','give proxy','exam answers','exam leak','paper leak','leaked paper','write my assignment','do my assignment','complete my assignment','solve my assignment','write my exam','take my exam'],
};
export const MOD_CAT={hate:'hate or slurs',abuse:'abuse or harassment',illegal:'illegal items or services',alcohol:'alcohol, tobacco or gambling',adult:'sexual content',academic:'exam or assignment cheating'};
const LEET={'0':'o','1':'i','!':'i','|':'i','3':'e','4':'a','@':'a','5':'s','$':'s','7':'t','8':'b','9':'g'};
const norm=t=>String(t||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[0-9!|@$]/g,c=>LEET[c]||c);
const pat=w=>w.split(' ').map(word=>[...word].map(c=>c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'+').join('[._*\\-]*')).join('[\\s._*\\-]+');
const RES=Object.entries(LIST).flatMap(([cat,ws])=>ws.map(w=>({cat,re:new RegExp('(?<![a-z])'+pat(w)+'(?:e?s)?(?![a-z])')})));
export function modHit(...texts){
  for(const t of texts){const n=norm(t);if(!n.trim())continue;const sq=n.replace(/(^|\s)((?:[a-z]\s){2,}[a-z])(?=\s|$)/g,(m,p,l)=>p+l.replace(/\s/g,''));for(const r of RES)if(r.re.test(n)||r.re.test(sq))return r.cat}
  return null;
}
