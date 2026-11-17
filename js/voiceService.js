const syn=window.speechSynthesis;let vs=[];
const load=()=>{vs=syn?syn.getVoices():[]};if(syn){load();syn.onvoiceschanged=load}
const best=p=>{const l=vs.filter(v=>v.lang.toLowerCase().startsWith(p));
 return l.find(v=>/google|natural|samantha|aria|jenny|daniel/i.test(v.name))||l.find(v=>v.lang.replace('_','-')===(p==='en'?'en-US':'es-MX'))||l[0]};
export const V={
 speak(text,rate=1,lang){return new Promise(res=>{if(!syn||!text)return res();syn.cancel();
  const l=lang||(/[¿¡áéíóúñÁÉÍÓÚÑ]/.test(text)?'es-MX':'en-US'),u=new SpeechSynthesisUtterance(text);
  u.lang=l;u.rate=rate;const v=best(l.slice(0,2));if(v)u.voice=v;u.onend=u.onerror=()=>res();syn.speak(u)})},
 listen(onPartial){return new Promise((res,rej)=>{
  if(!window.isSecureContext)return rej(new Error('El micrófono solo funciona en HTTPS o en localhost.'));
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR)return rej(new Error('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.'));
  const r=new SR();r.lang='en-US';r.interimResults=true;let t='';
  r.onresult=e=>{t=[...e.results].map(x=>x[0].transcript).join(' ');onPartial&&onPartial(t)};
  r.onerror=e=>rej(new Error(e.error==='not-allowed'?'Permiso de micrófono denegado. Actívalo desde el candado de la barra de direcciones.':e.error==='no-speech'?'No te escuché. Intenta de nuevo.':'Error de voz: '+e.error));
  r.onend=()=>res(t);r.start()})}};
