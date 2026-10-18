// SpaceX Play: juego con datos reales de Launch Library 2 (data.json se regenera cada día)
const $=s=>document.querySelector(s);
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem('sxp_'+k))??d}catch(e){return d}},set:(k,v)=>localStorage.setItem('sxp_'+k,JSON.stringify(v))};
const fmt=d=>new Date(d).toLocaleString('es-ES',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const fmtD=d=>new Date(d).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
const H=36e5,DAY=864e5;
const mname=l=>l.mission||l.name.split('|').pop().trim();
const ORB={LEO:'Órbita baja (LEO)',SSO:'Heliosíncrona (SSO)',PO:'Polar',GTO:'Transferencia geoestacionaria (GTO)',MEO:'Media (MEO)',GEO:'Geoestacionaria',TLI:'Hacia la Luna',Sub:'Suborbital',HEO:'Muy elíptica (HEO)'};
const orb=o=>ORB[o]||o||'¿?';
let D;
fetch('data.json?'+Date.now()).then(r=>r.json()).then(d=>{D=d;init()}).catch(e=>{$('main').innerHTML='<p class="ko">No se han podido cargar los datos.</p>'});

function init(){
  document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('nav button,.tab').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');$('#'+b.dataset.tab).classList.add('on');if(b.dataset.tab==='map')drawMap();});
  resolvePredictions();renderNext();renderPredict();renderQuiz();renderFleet();renderLog();renderScore();
  $('#foot').innerHTML=`Datos: <a href="https://thespacedevs.com/llapi" target="_blank">Launch Library 2 (The Space Devs)</a>. Actualizado: ${fmt(D.generated)}. Tus puntos se guardan solo en este navegador.`;
}
// ---------- Puntuación ----------
function points(){return LS.get('points',{pred:0,quiz:0})}
function addPts(kind,n){const p=points();p[kind]=(p[kind]||0)+n;LS.set('points',p);renderScore()}
function renderScore(){const p=points(),t=(p.pred||0)+(p.quiz||0);
  const lv=t<50?'Becario de control':t<150?'Ingeniero de lanzamiento':t<400?'Director de vuelo':'Leyenda de Starbase';
  $('#score').innerHTML=`⭐ <b>${t}</b> puntos · ${lv}`}
// ---------- Próximo ----------
function upcomingFuture(){const now=Date.now();return D.upcoming.filter(l=>new Date(l.net)>now-3*H)}
function renderNext(){
  const s=D.stats,ups=upcomingFuture(),n=ups[0];
  let h='';
  if(n){const b=(n.stages||[])[0]||{};
    h+=`<div class="card"><div class="mut">Próximo lanzamiento</div><h3>${mname(n)}</h3>
    <div class="big" id="cd"></div>
    <div class="mut">${fmt(n.net)} · ${n.rocket} · ${n.loc||''}</div>
    <div>${n.status==='Go'?'<span class="tag ok">Confirmado (Go)</span>':`<span class="tag warn">${n.status_name}</span>`}
    ${n.orbit?`<span class="tag">${orb(n.orbit)}</span>`:''}${b.serial&&!/Unknown/.test(b.serial)?`<span class="tag">Propulsor ${b.serial} · vuelo ${b.flight}</span>`:''}
    ${b.land_loc?`<span class="tag">Aterriza en ${b.land_loc_name}</span>`:''}${n.prob?`<span class="tag">Meteo favorable ${n.prob}%</span>`:''}</div>
    <p class="mut">${n.desc}</p>${n.video?`<a href="${n.video}" target="_blank">▶ Ver directo</a>`:''}</div>`;
    const tick=()=>{const ms=new Date(n.net)-Date.now();const el=$('#cd');if(!el)return;
      if(ms<0){el.textContent='¡Despegando o ya en vuelo!';return}
      const d=Math.floor(ms/DAY),hh=Math.floor(ms%DAY/H),m=Math.floor(ms%H/6e4),sec=Math.floor(ms%6e4/1e3);
      el.textContent=`T- ${d}d ${String(hh).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`};
    tick();setInterval(tick,1000);}
  h+=`<div class="stats"><div><b>${s.total_launch_count}</b>lanzamientos totales</div><div><b>${s.successful_launches}</b>con éxito</div>
  <div><b>${s.consecutive_successful_launches}</b>éxitos seguidos</div><div><b>${s.successful_landings}</b>aterrizajes de propulsor</div>
  <div><b>${s.consecutive_successful_landings}</b>aterrizajes seguidos</div><div><b>${s.pending_launches}</b>lanzamientos pendientes</div></div>`;
  h+=`<h3 style="margin-top:18px">Siguientes</h3>`+ups.slice(1,8).map(l=>`<div class="card"><h3>${mname(l)}</h3><div class="mut">${fmt(l.net)}${/TBD|MON|YEAR|QUARTER/i.test(l.net_precision||'')?' (fecha aproximada)':''} · ${l.rocket} · ${l.loc||''}</div></div>`).join('');
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
  const pads=uniq(all.map(l=>l.loc));const orbs=uniq(all.map(l=>l.orbit));
  const mk=(q,right,cands)=>{const wrong=shuffle(cands.filter(c=>c!==right),r).slice(0,3);return{q,right,opts:shuffle([right,...wrong],r)}};
  const Q=[];
  pool.forEach(l=>{const b=(l.stages||[])[0]||{},m=mname(l);
    if(b.serial&&!/Unknown/.test(b.serial))Q.push(mk(`¿Qué propulsor lanzó ${m}?`,b.serial,serials));
    if(b.flight>1){const f=b.flight;Q.push(mk(`¿Qué número de vuelo hacía el propulsor en ${m}?`,String(f),[f-3,f-1,f+1,f+2,f+4].filter(x=>x>0).map(String)))}
    if(b.land_loc_name&&b.land_success)Q.push(mk(`¿Dónde aterrizó el propulsor de ${m}?`,b.land_loc_name,lands));
    if(l.loc)Q.push(mk(`¿Desde dónde despegó ${m}?`,l.loc,pads));
    if(l.orbit&&orbs.length>2)Q.push(mk(`¿A qué órbita iba ${m}?`,orb(l.orbit),orbs.map(orb)));});
  return{key,title,qs:shuffle(Q,r).slice(0,8)};
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
  $('#fleet').innerHTML=`<div class="card"><b>Flota de propulsores</b><div class="mut">Los primeros fases que han volado en los últimos ${D.previous.length} lanzamientos. Pulsa una columna para ordenar.</div></div>
  <table><tr><th data-s="flights">Propulsor</th><th data-s="flights">Vuelos</th><th data-s="last">Último vuelo</th><th>Próximo</th></tr>
  ${rows.map(r=>`<tr><td><b>${r.serial}</b></td><td>${r.flights}<div class="bar"><i style="width:${100*r.flights/max}%"></i></div></td><td>${fmtD(r.last)}<div class="mut">${r.missions.at(-1)}</div></td><td>${r.next?`${mname(r.next)}<div class="mut">${fmtD(r.next.net)}</div>`:'—'}</td></tr>`).join('')}</table>`;
  $('#fleet').querySelectorAll('th[data-s]').forEach(t=>t.onclick=()=>{fleetSort=t.dataset.s;renderFleet()});
}
// ---------- Mapa ----------
let mapDone=false;
function drawMap(){if(mapDone)return;mapDone=true;
  const map=L.map('mapdiv').setView([31,-100],3);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'© OpenStreetMap, © CARTO'}).addTo(map);
  const pads={};[...D.previous.map(l=>({...l,up:0})),...D.upcoming.map(l=>({...l,up:1}))].forEach(l=>{if(l.lat==null)return;
    const k=l.pad;const p=pads[k]||(pads[k]={pad:l.pad,loc:l.loc,lat:l.lat,lon:l.lon,done:0,up:0});l.up?p.up++:p.done++});
  Object.values(pads).forEach(p=>L.circleMarker([p.lat,p.lon],{radius:6+Math.sqrt(p.done+p.up)*2,color:'#3ea6ff'}).addTo(map).bindPopup(`<b>${p.pad}</b><br>${p.loc}<br>${p.done} recientes · ${p.up} próximos`));
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
