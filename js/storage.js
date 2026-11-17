const K='fluencymind_v1',day=(d=new Date())=>d.toLocaleDateString('en-CA');
const def=()=>({streak:0,last:null,xp:0,dayXp:0,day:null,done:0,cp:0,onboarded:false,skills:{listening:{c:0,t:0},speaking:{c:0,t:0},thinking:{c:0,t:0}},weak_history:[]});
let saved={};try{saved=JSON.parse(localStorage.getItem(K)||'{}')}catch{}
export const S=Object.assign(def(),saved);
export const save=()=>localStorage.setItem(K,JSON.stringify(S));
export function touch(){const d=day();if(S.day!==d){S.dayXp=0;S.day=d}
 if(S.last!==d){S.streak=S.last===day(new Date(Date.now()-864e5))?S.streak+1:1;S.last=d}}
export function gain(n){touch();S.xp+=n;S.dayXp+=n;save()}
export function rec(sk,ok){const s=S.skills[sk];s.t++;if(ok)s.c++;gain(ok?10:2)}
export function fixWeak(r){for(const x of r){if(!x.n)continue;const i=S.weak_history.indexOf(x.n);
 if(x.ok&&i>-1)S.weak_history.splice(i,1);if(!x.ok&&i<0)S.weak_history.push(x.n)}
 S.weak_history=S.weak_history.slice(-30);save()}
export function exportData(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download='fluencymind-progreso.json';a.click()}
export async function importData(f){Object.assign(S,def(),JSON.parse(await f.text()));save()}
