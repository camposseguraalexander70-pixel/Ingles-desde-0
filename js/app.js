import {S,save,gain,rec,fixWeak,exportData,importData} from './storage.js';
import {V} from './voiceService.js';
import {LEVELS,GOAL} from './curriculum.js';
const $=s=>document.querySelector(s),main=$('#main'),ALL=LEVELS.flatMap(l=>l.items);
const esc=t=>String(t).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const md=t=>esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
const shuf=a=>[...a].sort(()=>Math.random()-.5);
const norm=s=>s.toLowerCase().replace(/[^a-z ]/g,'').split(/\s+/).filter(Boolean);
const lvl=()=>S.done<3?'A0':S.done<6?'A1':'A2';
const say=(t,r,l)=>V.speak(t,r,l).catch(()=>{});
let ctx={exercise_type:'map',target_phrase:'',user_input:''},hist=[],tally=null;
const bar=()=>{$('#streak').textContent='🔥 '+S.streak;$('#xp').textContent='⭐ '+S.xp;$('#goal').style.width=Math.min(100,S.dayXp/GOAL*100)+'%'};
const R=(sk,ok)=>{rec(sk,ok);if(tally){tally[sk].t++;if(ok)tally[sk].c++}bar()};
const cmp=(t,s)=>{const sw=s.toLowerCase().replace(/[^a-z ]/g,'').split(/\s+/);return t.split(/\s+/).map(w=>{const n=norm(w)[0]||'';return{w,n,ok:!n||sw.includes(n)}})};
const opts=it=>shuf([it.en,...shuf(ALL.filter(x=>x!==it)).slice(0,2).map(x=>x.en)]);

// ---- Instructor IA ----
async function askTutor(q){
 try{const r=await fetch('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({history:hist.slice(-6),context:{user_level:lvl(),...ctx,weak_history:S.weak_history.slice(-8),user_question:q}})});
  if(!r.ok)throw 0;const j=await r.json();hist.push({role:'user',text:q},{role:'model',text:j.display_markdown});return j}
 catch{return{display_markdown:'No pude conectar con el instructor. Revisa tu conexión y que la función esté desplegada.',speech_text:''}}}
async function tutorSend(q){if(!q.trim())return;const m=$('#msgs');m.insertAdjacentHTML('beforeend',`<p class="me">${esc(q)}</p>`);
 const j=await askTutor(q);m.insertAdjacentHTML('beforeend',`<p class="ai">${md(j.display_markdown)}</p>`);m.scrollTop=m.scrollHeight;say(j.speech_text)}
$('#tutorBtn').onclick=()=>$('#tutor').showModal();$('#tx').onclick=()=>$('#tutor').close();
$('#tf').onsubmit=e=>{e.preventDefault();const q=$('#tq').value;$('#tq').value='';tutorSend(q)};
$('#tmic').onclick=async()=>{try{tutorSend(await V.listen())}catch(e){alert(e.message)}};

// ---- Pasos ----
function choice(o,done){ctx={exercise_type:o.type,target_phrase:o.ans,user_input:''};
 main.innerHTML=`<div class="card"><p>${o.q}</p>${o.emoji?`<div class="big">${o.emoji}</div>`:''}${o.audio?'<div class="row"><button data-r="1">🔊 1.0x</button><button data-r=".75">🐢 0.75x</button></div>':''}<div class="opts">${o.opts.map(x=>`<button class="opt">${esc(x)}</button>`).join('')}</div><div id="fb"></div></div>`;
 main.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>say(o.ans,+b.dataset.r,'en-US'));if(o.audio)say(o.ans,1,'en-US');
 main.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{if(main.querySelector('.fin'))return;const ok=b.textContent===o.ans;ctx.user_input=b.textContent;
  main.querySelectorAll('.opt').forEach(x=>{x.classList.add('fin');if(x.textContent===o.ans)x.classList.add('ok')});if(!ok)b.classList.add('bad');
  R(o.sk,ok);$('#fb').innerHTML='<button class="primary" id="nx">Continuar</button>';$('#nx').onclick=()=>done(ok)})}
function shadow(it,done){ctx={exercise_type:'shadowing',target_phrase:it.en,user_input:''};
 main.innerHTML=`<div class="card"><p>Escucha y repite:</p><div class="big">${it.e}</div><h2 id="ph">${esc(it.en)}</h2><div class="row"><button data-r="1">🔊 1.0x</button><button data-r=".75">🐢 0.75x</button></div><button class="primary" id="mic">🎤 Hablar</button><p id="fb"></p></div>`;
 main.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>say(it.en,+b.dataset.r,'en-US'));say(it.en,1,'en-US');
 $('#mic').onclick=async()=>{const fb=$('#fb');fb.textContent='Escuchando…';
  try{const t=await V.listen(x=>fb.textContent='… '+x);ctx.user_input=t;const r=cmp(it.en,t);
   $('#ph').innerHTML=r.map(x=>`<span class="${x.ok?'ok':'bad'}">${esc(x.w)}</span>`).join(' ');
   const good=r.filter(x=>x.ok).length/r.length>=.8;fixWeak(r);R('speaking',good);
   fb.innerHTML=`${good?'¡Muy bien!':'Casi. Toca 🎤 para reintentar.'} Dijiste: “${esc(t)||'…'}” <button class="primary" id="nx">${good?'Continuar':'Seguir'}</button>`;$('#nx').onclick=()=>done(good)}
  catch(e){fb.textContent=e.message}}}
const roleplay=l=>done=>{ctx={exercise_type:'roleplay',target_phrase:l.rp,user_input:''};
 main.innerHTML=`<div class="card"><h3>🎭 ${esc(l.title)}</h3><p>${esc(l.rp)}</p><div id="chat" class="chat"></div><div class="row"><input id="ri" placeholder="Write in English…"><button id="rs">➤</button><button id="rm">🎤</button></div><button class="primary" id="nx">Terminar</button></div>`;
 const send=async t=>{if(!t.trim())return;const c=$('#chat');c.insertAdjacentHTML('beforeend',`<p class="me">${esc(t)}</p>`);ctx.user_input=t;
  const j=await askTutor(`Roleplay (${l.rp}). El usuario dijo: "${t}". Continúa la charla como el otro personaje y adáptate a su nivel.`);
  c.insertAdjacentHTML('beforeend',`<p class="ai">${md(j.display_markdown)}</p>`);R('thinking',true);say(j.speech_text)};
 $('#rs').onclick=()=>{const v=$('#ri').value;$('#ri').value='';send(v)};
 $('#rm').onclick=async()=>{try{send(await V.listen())}catch(e){alert(e.message)}};$('#nx').onclick=()=>done(true)};
const mk={visual:it=>d=>choice({q:'Mira la imagen. ¿Qué dirías? (piensa en inglés)',emoji:it.e,opts:opts(it),ans:it.en,sk:'thinking',type:'visual_association'},d),
 listen:it=>d=>choice({q:'Escucha y elige lo que oíste:',audio:1,opts:opts(it),ans:it.en,sk:'listening',type:'listening'},d),shadow:it=>d=>shadow(it,d)};
function run(steps,onDone){let i=0;const t=tally={listening:{c:0,t:0},speaking:{c:0,t:0},thinking:{c:0,t:0}};
 const go=()=>{$('#prog').style.width=i/steps.length*100+'%';if(i>=steps.length){tally=null;$('#prog').style.width='0';return onDone(t)}steps[i++](go)};go()}
function end(msg,btn='Volver al mapa',fn=map){ctx={exercise_type:'result',target_phrase:'',user_input:''};bar();
 main.innerHTML=`<div class="card"><div class="big">🎉</div><p>${msg}</p><button class="primary" id="nx">${btn}</button></div>`;$('#nx').onclick=fn}

// ---- Niveles, examen, refuerzo, diagnóstico ----
function play(i){const l=LEVELS[i];run([...l.items.flatMap(it=>[mk.visual(it),mk.listen(it),mk.shadow(it)]),roleplay(l)],()=>{if(S.done===i)S.done=i+1;gain(20);end('¡Nivel completado! +20 XP')})}
function reinforce(items,after){run(items.flatMap(it=>[mk.shadow(it),mk.listen(it)]),()=>{gain(15);after()})}
function exam(k){const p=shuf(LEVELS.slice(k*3-3,k*3).flatMap(l=>l.items)),q=n=>p[n%p.length];
 run([mk.listen(q(0)),mk.listen(q(1)),mk.shadow(q(2)),mk.shadow(q(3)),mk.visual(q(4)),mk.visual(q(5))],t=>{
  const pc=Object.entries(t).map(([s,v])=>[s,v.t?Math.round(v.c/v.t*100):100]),pass=pc.every(x=>x[1]>=70);
  const weak=ALL.filter(it=>S.weak_history.some(w=>norm(it.en).includes(w))).slice(0,4);
  const unlock=()=>{if(pass){S.cp=Math.max(S.cp,k);gain(50);end('¡Checkpoint aprobado! Siguiente unidad desbloqueada. +50 XP')}else end('Aún no alcanzas 70% en todas las habilidades. Repite el examen cuando quieras.')};
  const sum=pc.map(([s,v])=>`${s}: <b class="${v>=70?'ok':'bad'}">${v}%</b>`).join(' · ');
  if(!pass||weak.length){ctx={exercise_type:'checkpoint_result',target_phrase:'',user_input:sum.replace(/<[^>]+>/g,'')};
   main.innerHTML=`<div class="card"><h3>Resultado</h3><p>${sum}</p><p>Vamos con una sesión de refuerzo en tus puntos débiles.</p><button class="primary" id="nx">Empezar refuerzo</button></div>`;
   $('#nx').onclick=()=>reinforce(weak.length?weak:p.slice(0,3),unlock)}else unlock()})}
function diag(){const p=shuf(LEVELS.slice(3).flatMap(l=>l.items));
 run([mk.listen(p[0]),mk.shadow(p[1]),mk.listen(p[2]),mk.shadow(p[3]),mk.visual(p[4])],t=>{
  const c=Object.values(t).reduce((a,v)=>a+v.c,0),n=Object.values(t).reduce((a,v)=>a+v.t,0),hi=c/n>=.6;
  S.onboarded=true;if(hi){S.done=3;S.cp=1}save();end(hi?'¡Buen oído! Empiezas en el nivel A1.':'Empezarás desde A0 para construir una base sólida.','Ver mi ruta')})}
function onboard(){main.innerHTML=`<div class="card"><h2>Think in English.</h2><p>Aprende inglés sin traducir, de cero a conversación.</p><div class="opts"><button class="primary" id="a0">Empezar desde 0 absoluto (Nivel A0)</button><button id="dg">Diagnóstico rápido de 5 pasos</button></div></div>`;
 $('#a0').onclick=()=>{S.onboarded=true;save();map()};$('#dg').onclick=diag}
function map(){ctx={exercise_type:'map',target_phrase:'',user_input:''};bar();let h='<div class="path">';
 LEVELS.forEach((l,i)=>{const open=i===S.done&&!(i>0&&i%3===0&&S.cp<i/3),st=i<S.done?'done':open?'open':'lock';
  h+=`<button class="node ${st}" data-l="${i}" ${st==='lock'?'disabled':''}><span>${l.e}</span>${esc(l.title)}</button>`;
  if((i+1)%3===0){const k=(i+1)/3,cs=S.cp>=k?'done':S.done>=i+1?'open':'lock';h+=`<button class="node cp ${cs}" data-c="${k}" ${cs==='lock'?'disabled':''}><span>🏆</span>Checkpoint ${k}</button>`}});
 const pc=s=>S.skills[s].t?Math.round(S.skills[s].c/S.skills[s].t*100)+'%':'–';
 main.innerHTML=h+`</div><div class="chips"><span>👂 ${pc('listening')}</span><span>🗣️ ${pc('speaking')}</span><span>💭 ${pc('thinking')}</span></div><div class="row"><button id="ex">⬇ Exportar</button><label class="btn">⬆ Importar<input id="im" type="file" accept=".json" hidden></label></div>`;
 main.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>play(+b.dataset.l));main.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>exam(+b.dataset.c));
 $('#ex').onclick=exportData;$('#im').onchange=async e=>{try{await importData(e.target.files[0]);map()}catch{alert('Archivo JSON no válido.')}}}
bar();S.onboarded?map():onboard();
if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js');
