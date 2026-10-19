// SpaceX Play: juego con datos reales de Launch Library 2 (data.json se regenera cada día)
const $=s=>document.querySelector(s);
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem('sxp_'+k))??d}catch(e){return d}},set:(k,v)=>localStorage.setItem('sxp_'+k,JSON.stringify(v))};
const fmt=d=>new Date(d).toLocaleString('es-ES',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const fmtD=d=>new Date(d).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
const H=36e5,DAY=864e5;
const mname=l=>l.mission||l.name.split('|').pop().trim();
const ORB={LEO:'Órbita baja (LEO)',SSO:'Heliosíncrona (SSO)',PO:'Polar',GTO:'Transferencia geoestacionaria (GTO)',MEO:'Media (MEO)',GEO:'Geoestacionaria',TLI:'Hacia la Luna',Sub:'Suborbital',HEO:'Muy elíptica (HEO)',L2:'Punto de Lagrange L2 (Sol-Tierra)',LO:'Órbita lunar'};
const tdays=t=>{const m=/P(?:(\d+)D)?/.exec(t||'');return m&&t.length>1?+(m[1]||0):null};
const DRONE=/Of Course I Still Love You|A Shortfall of Gravitas|Just Read the Instructions/,LZ=/Landing Zone|^LZ/;
const orb=o=>ORB[o]||o||'¿?';
let D;
fetch('data.json?'+Date.now()).then(r=>r.json()).then(d=>{D=d;init()}).catch(e=>{$('main').innerHTML='<p class="ko">No se han podido cargar los datos.</p>'});

function init(){
  document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('nav button,.tab').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');$('#'+b.dataset.tab).classList.add('on');if(b.dataset.tab==='map')drawMap();});
  resolvePredictions();resolveBets();renderNext();renderPredict();renderQuiz();renderFleet();renderLog();renderScore();
  $('#foot').innerHTML=`Datos: <a href="https://thespacedevs.com/llapi" target="_blank">Launch Library 2 (The Space Devs)</a>. Actualizado: ${fmt(D.generated)}. Tus puntos se guardan solo en este navegador.`;
}
// ---------- Puntuación ----------
function points(){return LS.get('points',{pred:0,quiz:0})}
function addPts(kind,n){const p=points();p[kind]=(p[kind]||0)+n;LS.set('points',p);renderScore()}
function renderScore(){const p=points(),t=(p.pred||0)+(p.quiz||0)+(p.bet||0);
  const lv=t<50?'Becario de control':t<150?'Ingeniero de lanzamiento':t<400?'Director de vuelo':'Leyenda de Starbase';
  $('#score').innerHTML=`<b>${t}</b> puntos · ${lv}`}
// ---------- Próximo ----------
function upcomingFuture(){const now=Date.now();return D.upcoming.filter(l=>new Date(l.net)>now-3*H)}
function renderNext(){
  const s=D.stats,ups=upcomingFuture(),n=ups[0];
  let h='';
  if(n){const b=(n.stages||[])[0]||{};
    h+=`<div class="card hero"><div class="bg" style="background-image:url('${n.img||(D.previous.find(x=>x.img)||{}).img||''}')"></div><div class="in">
    <div class="kick">Próximo lanzamiento</div><h2>${mname(n)}</h2>
    <div class="big" id="cd"></div>
    <div class="mut">${fmt(n.net)} · ${n.rocket} · ${n.loc||''}</div>
    <div style="margin-top:8px">${n.status==='Go'?'<span class="tag ok">Confirmado (Go)</span>':`<span class="tag warn">${n.status_name}</span>`}
    ${n.orbit?`<span class="tag">${orb(n.orbit)}</span>`:''}${b.serial&&!/Unknown/.test(b.serial)?`<span class="tag">Propulsor ${b.serial} · vuelo ${b.flight}</span>`:''}
    ${b.land_loc?`<span class="tag">Aterriza en ${b.land_loc_name}</span>`:''}${n.prob?`<span class="tag">Meteo favorable ${n.prob}%</span>`:''}</div>
    <p class="mut">${n.desc}</p>${n.video?`<a class="live" href="${n.video}" target="_blank">▶ Ver directo</a>`:''}</div></div>`;
    const tick=()=>{const ms=new Date(n.net)-Date.now();const el=$('#cd');if(!el)return;
      if(ms<0){el.textContent='¡Despegando o ya en vuelo!';return}
      const d=Math.floor(ms/DAY),hh=Math.floor(ms%DAY/H),m=Math.floor(ms%H/6e4),sec=Math.floor(ms%6e4/1e3);
      el.textContent=`T- ${d}d ${String(hh).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`};
    tick();setInterval(tick,1000);}
  h+=`<div class="stats"><div><b>${s.total_launch_count}</b>lanzamientos totales</div><div><b>${s.successful_launches}</b>con éxito</div>
  <div><b>${s.consecutive_successful_launches}</b>éxitos seguidos</div><div><b>${s.successful_landings}</b>aterrizajes de propulsor</div>
  <div><b>${s.consecutive_successful_landings}</b>aterrizajes seguidos</div><div><b>${s.pending_launches}</b>lanzamientos pendientes</div></div>`;
  h+=`<h3 style="margin-top:22px">Siguientes lanzamientos</h3>`+ups.slice(1,8).map(l=>`<div class="card"><h3>${mname(l)}</h3><div class="mut">${fmt(l.net)}${/TBD|MON|YEAR|QUARTER/i.test(l.net_precision||'')?' (fecha aproximada)':''} · ${l.rocket} · ${l.loc||''}</div></div>`).join('');
  $('#next').innerHTML=h;
}
// ---------- Predicciones ----------
function predictable(l){return new Date(l.net)>Date.now()&&!/TBD/i.test(l.status)&&new Date(l.net)-Date.now()<21*DAY}
function renderPredict(){
  const preds=LS.get('preds',{});
  let h=`<div class="card"><b>Cómo se juega:</b> antes de cada despegue responde a tres preguntas. Cuando el lanzamiento ocurra, comparamos con lo que pasó de verdad. Cada acierto da 10 puntos, acertar las tres da 5 de bonus, y si apuestas por un fallo y aciertas te llevas 50.</div>`;
  const list=D.upcoming.filter(predictable);
  if(!list.length)h+='<p class="mut">Ahora mismo no hay lanzamientos confirmados en las próximas tres semanas. Vuelve mañana.</p>';
  list.forEach(l=>{const p=preds[l.id]||{a:{}};const b=(l.stages||[])[0]||{};
    const qs=[['ok','¿Llegará la carga a su órbita?'],...(b.land_attempt?[['land',`¿Aterrizará el propulsor ${b.serial||''} en ${b.land_loc_name||'su zona'}?`]]:[]),['time',`¿Despegará dentro de las 24 h de la hora prevista ahora (${fmt(l.net)})?`]];
    h+=`<div class="card" data-id="${l.id}"><h3>${mname(l)}</h3><div class="mut">${l.rocket} · ${l.loc||''}${b.flight?` · vuelo nº ${b.flight} del propulsor`:''}</div>`+
    qs.map(([k,q])=>`<div style="margin-top:8px">${q}<div class="opts">${['Sí','No'].map(v=>`<button data-k="${k}" data-v="${v}" class="${p.a[k]===v?'sel':''}">${v}</button>`).join('')}</div></div>`).join('')+
    `<div class="mut">${p.saved?'Predicción guardada ✔ (puedes cambiarla hasta el despegue)':'Sin predicción todavía'}</div></div>`});
  const done=Object.values(preds).filter(p=>p.res);
  if(done.length)h+=`<h3>Tus resultados</h3>`+done.sort((a,b)=>b.resAt-a.resAt).map(p=>`<div class="card"><h3>${p.name}</h3>${p.res.map(r=>`<div>${r.ok?'✅':'❌'} ${r.q}: dijiste ${r.you}, pasó ${r.real}</div>`).join('')}<b>+${p.pts} puntos</b></div>`).join('');
  $('#predict').innerHTML=h;
  $('#predict').querySelectorAll('.opts button').forEach(bt=>bt.onclick=()=>{
    const id=bt.closest('.card').dataset.id,l=D.upcoming.find(x=>x.id===id);const ps=LS.get('preds',{});
    const p=ps[id]||{a:{},name:mname(l),land:!!((l.stages||[])[0]||{}).land_attempt};p.a[bt.dataset.k]=bt.dataset.v;p.net=l.net;p.saved=Date.now();ps[id]=p;LS.set('preds',ps);renderPredict()});
}
function resolvePredictions(){
  const ps=LS.get('preds',{});let changed=false;
  for(const [id,p] of Object.entries(ps)){if(p.res)continue;const l=D.previous.find(x=>x.id===id);if(!l)continue;
    const b=(l.stages||[])[0]||{};const res=[];let pts=0;
    const add=(q,you,realBool)=>{if(you==null||realBool==null)return;const real=realBool?'Sí':'No';const ok=you===real;res.push({q,you,real,ok});if(ok)pts+=(real==='No'&&q!=='A tiempo')?50:10};
    add('Carga en órbita',p.a.ok,l.status==='Success');
    if(p.land)add('Aterrizaje',p.a.land,b.land_success);
    add('A tiempo',p.a.time,Math.abs(new Date(l.net)-new Date(p.net))<=24*H);
    if(res.length>=2&&res.every(r=>r.ok))pts+=5;
    p.res=res;p.pts=pts;p.resAt=Date.now();changed=true;addPts('pred',pts);}
  if(changed)LS.set('preds',ps);
}
// ---------- Reto semanal ----------
function rng(seed){let s=0;for(const c of seed)s=(s*31+c.charCodeAt(0))>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function weekKey(){const d=new Date();const day=(d.getDay()+6)%7;const mon=new Date(d.getFullYear(),d.getMonth(),d.getDate()-day);return mon}
function buildQuiz(){
  const mon=weekKey(),from=mon.getTime()-7*DAY;
  let pool=D.previous.filter(l=>{const t=new Date(l.net).getTime();return t>=from&&t<mon.getTime()});
  let title=`Misiones de la semana del ${fmtD(from)} al ${fmtD(mon.getTime()-DAY)}`;
  if(pool.length<2){pool=D.previous.slice(0,6);title='Últimas misiones'}
  const key=mon.toISOString().slice(0,10),r=rng(key),all=D.previous;
  const uniq=a=>[...new Set(a.filter(Boolean))];
  const serials=uniq(all.flatMap(l=>(l.stages||[]).map(s=>s.serial)).filter(s=>!/Unknown/.test(s)));
  const lands=uniq(all.flatMap(l=>(l.stages||[]).map(s=>s.land_loc_name)));
  const pads=uniq(all.map(l=>l.loc));const orbs=uniq(all.map(l=>l.orbit)).filter(o=>o!=='N/A');
  const mk=(q,right,cands)=>{const wrong=shuffle(cands.filter(c=>c!==right),r).slice(0,3);return{q,right,opts:shuffle([right,...wrong],r)}};
  const Q=[];
  pool.forEach(l=>{const b=(l.stages||[])[0]||{},m=mname(l);
    if(b.serial&&!/Unknown/.test(b.serial))Q.push(mk(`¿Qué propulsor lanzó ${m}?`,b.serial,serials));
    if(b.flight>1){const f=b.flight;Q.push(mk(`¿Qué número de vuelo hacía el propulsor en ${m}?`,String(f),[f-3,f-1,f+1,f+2,f+4].filter(x=>x>0).map(String)))}
    if(b.land_loc_name&&b.land_success)Q.push(mk(`¿Dónde aterrizó el propulsor de ${m}?`,b.land_loc_name,lands));
    if(l.loc)Q.push(mk(`¿Desde dónde despegó ${m}?`,l.loc,pads));
    const td=tdays(b.turnaround);
    if(td!=null&&td>0){const c=[td-20,td-10,td-5,td+5,td+10,td+20].filter(x=>x>0);Q.push(mk(`¿Cuántos días pasaron entre el vuelo anterior del propulsor ${b.serial} y ${m}?`,`${td} días`,c.map(x=>`${x} días`)))}
    if(b.land_success&&(DRONE.test(b.land_loc_name||'')||LZ.test(b.land_loc_name||''))){const right=DRONE.test(b.land_loc_name)?'En un barco dron en el mar':'En una plataforma en tierra';Q.push({q:`¿Cómo se recuperó el propulsor de ${m}?`,right,opts:shuffle(['En un barco dron en el mar','En una plataforma en tierra','No se recuperó (se perdió en el mar)'],r)})}
    {const dd=new Date(l.net),right=dd.toLocaleDateString('es-ES',{weekday:'long'});Q.push(mk(`¿Qué día de la semana despegó ${m}? (hora de tu dispositivo)`,right,['lunes','martes','miércoles','jueves','viernes','sábado','domingo']))}
    if(l.orbit&&l.orbit!=='N/A'&&orbs.length>2)Q.push(mk(`¿A qué órbita iba ${m}?`,orb(l.orbit),orbs.map(orb)));});
  return{key,title,qs:shuffle(Q,r).slice(0,10)};
}
function renderQuiz(){
  const Z=buildQuiz(),st=LS.get('quiz_'+Z.key,{ans:{}}),answered=Object.keys(st.ans).length;
  const correct=Z.qs.filter((q,i)=>st.ans[i]===q.right).length;
  let h=`<div class="card"><b>Reto semanal</b><div class="mut">${Z.title}. Cada lunes sale un reto nuevo. 10 puntos por acierto.</div>
  <div style="margin-top:6px">${answered}/${Z.qs.length} respondidas · ${correct} aciertos</div><div class="bar"><i style="width:${Z.qs.length?100*answered/Z.qs.length:0}%"></i></div></div>`;
  h+=Z.qs.map((q,i)=>{const a=st.ans[i];return `<div class="card"><div>${i+1}. ${q.q}</div><div class="opts">${q.opts.map(o=>`<button data-i="${i}" data-v="${o}" ${a?'disabled':''} class="${a?(o===q.right?'right':(o===a?'wrong':'')):''}">${o}</button>`).join('')}</div></div>`}).join('');
  if(!Z.qs.length)h+='<p class="mut">No hay datos suficientes para el reto de esta semana.</p>';
  $('#quiz').innerHTML=h;
  $('#quiz').querySelectorAll('.opts button').forEach(b=>b.onclick=()=>{const s=LS.get('quiz_'+Z.key,{ans:{}});const i=b.dataset.i;if(s.ans[i])return;
    s.ans[i]=b.dataset.v;LS.set('quiz_'+Z.key,s);if(b.dataset.v===Z.qs[i].right)addPts('quiz',10);renderQuiz()});
}
// ---------- Propulsores ----------
let fleetSort='flights';
function renderFleet(){
  const m={};
  [...D.previous].reverse().forEach(l=>(l.stages||[]).forEach(s=>{if(!s.serial||/Unknown/.test(s.serial))return;
    const b=m[s.serial]||(m[s.serial]={serial:s.serial,flights:0,landings:0,last:null,missions:[]});
    b.flights=Math.max(b.flights,s.flight||0);b.landings=Math.max(b.landings,(s.booster_landings||0)+(s.land_success?1:0));b.last=l.net;b.missions.push(mname(l))}));
  D.upcoming.forEach(l=>(l.stages||[]).forEach(s=>{const b=m[s.serial];if(b&&!b.next)b.next=l}));
  const rows=Object.values(m).sort((a,b)=>fleetSort==='flights'?b.flights-a.flights:new Date(b.last)-new Date(a.last));
  const max=Math.max(...rows.map(r=>r.flights),1);
  $('#fleet').innerHTML=`<div class="card"><b>Flota de propulsores</b><div class="mut">Los primeros fases que han volado en los últimos ${D.previous.length} lanzamientos. Pulsa una columna para ordenar y un propulsor para ver su ficha y apostar si volverá a volar.</div></div>${betsHTML()}
  <table><tr><th data-s="flights">Propulsor</th><th data-s="flights">Vuelos</th><th data-s="last">Último vuelo</th><th>Próximo</th></tr>
  ${rows.map(r=>`<tr class="clic" data-serial="${r.serial}"><td><b>${r.serial}</b> <span class="mut">ficha ›</span></td><td>${r.flights}<div class="bar"><i style="width:${100*r.flights/max}%"></i></div></td><td>${fmtD(r.last)}<div class="mut">${r.missions.at(-1)}</div></td><td>${r.next?`${mname(r.next)}<div class="mut">${fmtD(r.next.net)}</div>`:'—'}</td></tr>`).join('')}</table>`;
  $('#fleet').querySelectorAll('th[data-s]').forEach(t=>t.onclick=()=>{fleetSort=t.dataset.s;renderFleet()});
  $('#fleet').querySelectorAll('tr[data-serial]').forEach(t=>t.onclick=()=>openBooster(t.dataset.serial));
}
// ---------- Mapa ----------
let mapDone=false;
function drawMap(){if(mapDone)return;mapDone=true;
  const map=L.map('mapdiv').setView([31,-100],3);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'© OpenStreetMap, © CARTO'}).addTo(map);
  const pads={};[...D.previous.map(l=>({...l,up:0})),...D.upcoming.map(l=>({...l,up:1}))].forEach(l=>{if(l.lat==null)return;
    const k=l.pad;const p=pads[k]||(pads[k]={pad:l.pad,loc:l.loc,lat:l.lat,lon:l.lon,done:0,up:0});l.up?p.up++:p.done++});
  Object.values(pads).forEach(p=>L.circleMarker([p.lat,p.lon],{radius:6+Math.sqrt(p.done+p.up)*2,color:'#4fb3ff',fillColor:'#8a7dff',fillOpacity:.5,weight:2}).addTo(map).bindPopup(`<b>${p.pad}</b><br>${p.loc}<br>${p.done} recientes · ${p.up} próximos`));
  $('#maplist').innerHTML=Object.values(pads).sort((a,b)=>b.done-a.done).map(p=>`<div class="card"><b>${p.pad}</b><div class="mut">${p.loc} · ${p.done} lanzamientos recientes · ${p.up} próximos</div></div>`).join('');
}
// ---------- Historial ----------
function renderLog(){
  $('#log').innerHTML=D.previous.map(l=>{const b=(l.stages||[])[0]||{};const ok=l.status==='Success';
    return `<div class="card row">${l.img?`<img loading="lazy" src="${l.img}" alt="">`:''}<div><h3>${ok?'✅':'❌'} ${mname(l)}</h3>
    <div class="mut">${fmt(l.net)} · ${l.rocket} · ${l.loc||''}</div>
    <div>${l.orbit?`<span class="tag">${orb(l.orbit)}</span>`:''}${b.serial&&!/Unknown/.test(b.serial)?`<span class="tag">${b.serial} · vuelo ${b.flight}</span>`:''}
    ${b.land_attempt?`<span class="tag ${b.land_success?'ok':'ko'}">${b.land_success?'Aterrizó':'No aterrizó'} ${b.land_loc?'en '+b.land_loc:''}</span>`:''}</div>
    ${l.fail?`<div class="ko">${l.fail}</div>`:''}</div></div>`}).join('');
}
// ---------- Globo de desafío (cada pocas horas, con datos reales) ----------
const GLOBO_CADA=4*H;
function retosGlobo(){
  const R=[],ups=D.upcoming.filter(predictable),preds=LS.get('preds',{});
  const sin=ups.filter(l=>!preds[l.id]);
  if(sin.length){const l=sin[0],b=(l.stages||[])[0]||{};
    R.push({t:'¿Te la juegas?',m:`${mname(l)} despega ${fmt(l.net)}${b.flight?` con el propulsor ${b.serial} en su vuelo nº ${b.flight}`:''}. ¿Aterrizará? Haz tu predicción antes del despegue y gana hasta 35 puntos.`,tab:'predict',btn:'Predecir ahora'});}
  const Z=buildQuiz(),st=LS.get('quiz_'+Z.key,{ans:{}}),falta=Z.qs.length-Object.keys(st.ans).length;
  if(falta>0)R.push({t:'Reto semanal',m:`Te quedan ${falta} preguntas sobre las misiones reales de esta semana. Solo los mejores directores de vuelo las aciertan todas. ¿Tú qué?`,tab:'quiz',btn:'Aceptar el reto'});
  const fl=D.previous.flatMap(l=>(l.stages||[]).map(s=>({...s,l}))).filter(s=>s.flight).sort((a,b)=>b.flight-a.flight)[0];
  if(fl)R.push({t:'Récord de reutilización',m:`El propulsor ${fl.serial} ya lleva ${fl.flight} vuelos. Antes los cohetes se tiraban tras un solo uso. ¿Sabrías decir cuál es el siguiente en llegar a esa cifra?`,tab:'fleet',btn:'Ver la flota'});
  {const bs=LS.get('bets',{});const cand=D.previous.flatMap(l=>(l.stages||[]).map(s=>s.serial)).find(x=>x&&!/Unknown/.test(x)&&!(bs[x]&&!bs[x].res));
   if(cand)R.push({t:'¿Volverá a volar?',m:`Abre la ficha del propulsor ${cand}: mira cuántos días suele pasar en tierra entre vuelos y apuesta si volverá a despegar en los próximos 30 días. Se resuelve solo con los datos reales.`,tab:'fleet',btn:'Ver propulsores'});}
  const s=D.stats;if(s&&s.consecutive_successful_landings)R.push({t:'Racha en directo',m:`SpaceX lleva ${s.consecutive_successful_landings} aterrizajes seguidos sin fallar y ${s.consecutive_successful_launches} lanzamientos seguidos con éxito. ¿Crees que la racha aguanta esta semana? Demuéstralo con tus predicciones.`,tab:'predict',btn:'Apostar'});
  const o=D.previous.find(l=>l.orbit&&l.orbit!=='LEO');
  if(o)R.push({t:'Fórmate',m:`${mname(o)} fue a una órbita ${orb(o.orbit)}. ¿Sabes por qué no todas las misiones van a la misma órbita? Aprende cómo funciona y vuelve a por el reto.`,url:'https://es.wikipedia.org/wiki/%C3%93rbita',btn:'Aprender (Wikipedia)'});
  return R;
}
function mostrarGlobo(forzar){
  if(!D)return;const last=LS.get('globo_last',0);if(!forzar&&Date.now()-last<GLOBO_CADA)return;
  const R=retosGlobo();if(!R.length)return;const n=LS.get('globo_n',0);const r=R[n%R.length];
  LS.set('globo_last',Date.now());LS.set('globo_n',n+1);
  const g=document.createElement('div');g.className='globo';
  g.innerHTML=`<button class="x" aria-label="Cerrar">×</button><h4>${r.t}</h4><p>${r.m}</p><button class="go">${r.btn}</button><button class="later">Luego</button>`;
  document.body.appendChild(g);requestAnimationFrame(()=>requestAnimationFrame(()=>g.classList.add('show')));
  const close=()=>{g.classList.remove('show');setTimeout(()=>g.remove(),500)};
  g.querySelector('.x').onclick=close;g.querySelector('.later').onclick=close;
  g.querySelector('.go').onclick=()=>{close();if(r.url)window.open(r.url,'_blank');else document.querySelector(`nav button[data-tab="${r.tab}"]`).click()};
}
setTimeout(()=>mostrarGlobo(false),4000);
setInterval(()=>mostrarGlobo(false),10*60*1000);

// ---------- Ficha de propulsor y apuestas "¿volverá a volar?" ----------
const BET_DIAS=30;
function boosterHist(serial){
  return D.previous.flatMap(l=>(l.stages||[]).filter(s=>s.serial===serial).map(s=>({l,s}))).sort((a,b)=>new Date(a.l.net)-new Date(b.l.net));
}
function betPts(serial){const nx=D.upcoming.some(l=>(l.stages||[]).some(s=>s.serial===serial));return{si:nx?5:15,no:25}}
function resolveBets(){
  const bs=LS.get('bets',{});let ch=false;
  for(const [serial,b] of Object.entries(bs)){if(b.res)continue;
    const hit=boosterHist(serial).find(x=>(x.s.flight||0)>=b.target);
    let real=null;
    if(hit)real=new Date(hit.l.net).getTime()<=b.deadline;else if(Date.now()>b.deadline)real=false;
    if(real===null)continue;
    const ok=(b.pick==='Sí')===real;b.res={real,ok,mission:hit&&new Date(hit.l.net).getTime()<=b.deadline?mname(hit.l):null};b.resAt=Date.now();b.won=ok?(b.pick==='Sí'?b.si:b.no):0;
    if(b.won)addPts('bet',b.won);ch=true;}
  if(ch)LS.set('bets',bs);
}
function betsHTML(){
  const bs=Object.values(LS.get('bets',{}));if(!bs.length)return'';
  return `<div class="card"><b>Tus apuestas de propulsores</b>${bs.sort((a,b)=>b.at-a.at).map(b=>`<div style="margin-top:6px">${b.res?(b.res.ok?'✅':'❌'):'⏳'} ${b.serial} · vuelo nº ${b.target} antes del ${fmtD(b.deadline)}: dijiste <b>${b.pick}</b>${b.res?` · ${b.res.real?`voló${b.res.mission?' en '+b.res.mission:''}`:'no voló a tiempo'} · +${b.won} puntos`:' · pendiente'}</div>`).join('')}</div>`;
}
function openBooster(serial){
  const h=boosterHist(serial);if(!h.length)return;
  const last=h.at(-1),flights=Math.max(...h.map(x=>x.s.flight||0)),tot=Math.max(flights,last.s.booster_flights||0);
  const tds=h.map(x=>tdays(x.s.turnaround)).filter(x=>x!=null&&x>0);
  const avg=tds.length?Math.round(tds.reduce((a,b)=>a+b,0)/tds.length):null,best=tds.length?Math.min(...tds):null;
  const since=Math.floor((Date.now()-new Date(last.l.net))/DAY);
  const next=D.upcoming.find(l=>(l.stages||[]).some(s=>s.serial===serial));
  const lost=last.s.land_attempt===false||last.s.land_success===false;
  const bs=LS.get('bets',{}),bet=bs[serial],open=bet&&!bet.res,P=betPts(serial);
  const target=flights+1,deadline=new Date(Date.now()+BET_DIAS*DAY);deadline.setHours(23,59,59,0);
  let betH;
  if(lost)betH=`<p class="ko">En su último vuelo no se recuperó (${last.s.land_attempt===false?'no intentó aterrizar':'el aterrizaje falló'}), así que no se puede apostar por él.</p>`;
  else if(open)betH=`<p>Ya has apostado <b>${bet.pick}</b> a que hace el vuelo nº ${bet.target} antes del ${fmtD(bet.deadline)}. Se resolverá solo cuando lleguen los datos.</p>`;
  else betH=`<p><b>¿Hará el vuelo nº ${target} antes del ${fmtD(deadline)}?</b></p>
    <div class="mut">Pistas reales: ${avg!=null?`suele pasar ${avg} días en tierra entre vuelos (récord en estos datos: ${best} días)`:'no hay tiempos entre vuelos en estos datos'}; lleva ${since} días sin volar.${next?` Ya tiene asignada ${mname(next)} para el ${fmtD(next.net)}, aunque las fechas pueden cambiar.`:' No tiene misión anunciada todavía.'}</div>
    <div class="opts"><button data-b="Sí">Sí (+${P.si})</button><button data-b="No">No (+${P.no})</button></div>`;
  const rows=h.slice().reverse().map(({l,s})=>{const td=tdays(s.turnaround);
    return `<tr><td>${fmtD(l.net)}</td><td>${mname(l)}</td><td>${s.flight??'—'}</td><td>${td!=null&&td>0?td+' d':'—'}</td><td>${s.land_attempt?`<span class="tag ${s.land_success?'ok':'ko'}">${s.land_success?'Sí':'No'}${s.land_loc?' · '+s.land_loc:''}</span>`:'Sin intento'}</td></tr>`}).join('');
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="box" role="dialog" aria-modal="true" aria-label="Ficha del propulsor ${serial}"><button class="x" aria-label="Cerrar">×</button>
   <div class="kick">Ficha del propulsor</div><h2>${serial}</h2>
   <div class="stats"><div><b>${tot}</b>vuelos totales</div><div><b>${last.s.booster_landings??'—'}</b>aterrizajes con éxito</div><div><b>${avg??'—'}</b>días medios entre vuelos</div><div><b>${since}</b>días desde su último vuelo</div></div>
   ${betH}
   <h3>Vuelos en los últimos ${D.previous.length} lanzamientos de SpaceX</h3>
   <div class="scroll"><table><tr><th>Fecha</th><th>Misión</th><th>Vuelo nº</th><th>Días en tierra</th><th>Aterrizó</th></tr>${rows}</table></div>
   <p class="mut">Datos de Launch Library 2. Los totales de vuelos y aterrizajes son los que da la fuente en la última actualización.</p></div>`;
  document.body.appendChild(m);
  const close=()=>{m.remove();document.removeEventListener('keydown',esc)},esc=e=>{if(e.key==='Escape')close()};
  document.addEventListener('keydown',esc);
  m.onclick=e=>{if(e.target===m)close()};m.querySelector('.x').onclick=close;
  m.querySelectorAll('[data-b]').forEach(bt=>bt.onclick=()=>{const b2=LS.get('bets',{});
    b2[serial]={serial,pick:bt.dataset.b,target,deadline:deadline.getTime(),si:P.si,no:P.no,at:Date.now()};LS.set('bets',b2);close();renderFleet();openBooster(serial)});
}
