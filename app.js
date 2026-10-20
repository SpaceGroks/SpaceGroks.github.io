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
const ic=(ok,si='Acierto',no='Fallo')=>`<span role="img" aria-label="${ok?si:no}">${ok?'✅':'❌'}</span>`;
let D;
const credit=l=>l&&l.img?`<div class="credit">Foto: ${esc(l.img_credit)} · <a href="${esc(l.img_lic_url)}" target="_blank" rel="noopener license">${esc(l.img_lic)}<span class="sr"> (licencia, se abre en otra pestaña)</span></a></div>`:'';
const LANG=((navigator.languages&&navigator.languages[0])||navigator.language||'es').toLowerCase();
let ES={};
const esc=t=>String(t||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
function tdesc(l){if(!l||!l.desc)return '';let t=l.desc;
  if(LANG.startsWith('es')&&ES[l.id])t=ES[l.id];
  else if(!LANG.startsWith('es')&&!LANG.startsWith('en')){try{const c=localStorage.getItem('sxp_tr_'+LANG+'_'+l.id);if(c)t=c}catch(e){}}
  return `<span class="desc" data-id="${esc(l.id)}">${esc(t)}</span>`}
async function translateDescs(){try{
  if(LANG.startsWith('es')||LANG.startsWith('en')||!('Translator' in self))return;
  const tl=LANG.split('-')[0];
  const av=await Translator.availability({sourceLanguage:'en',targetLanguage:tl});
  if(av==='unavailable')return;
  const tr=await Translator.create({sourceLanguage:'en',targetLanguage:tl});
  const all=[...(D.upcoming||[]),...(D.previous||[])];
  for(const el of document.querySelectorAll('span.desc[data-id]')){
    const id=el.dataset.id,k='sxp_tr_'+tl+'_'+id,l=all.find(x=>x.id===id);if(!l)continue;
    let t=null;try{t=localStorage.getItem(k)}catch(e){}
    if(!t){t=await tr.translate(l.desc);try{localStorage.setItem(k,t);localStorage.setItem('sxp_tr_'+LANG+'_'+id,t)}catch(e){}}
    el.textContent=t}
}catch(e){}}
Promise.all([fetch('data.json?'+Date.now()).then(r=>r.json()),fetch('i18n/desc_es.json?'+Date.now()).then(r=>r.ok?r.json():{}).catch(()=>({}))]).then(([d,es])=>{D=d;ES=es||{};init();translateDescs()}).catch(e=>{$('main').innerHTML='<p class="ko">No se han podido cargar los datos.</p>'});

function init(){
  initTabs();checkIn();
  resolvePredictions();resolveExpert();resolveBets();renderNext();renderPredict();renderQuiz();renderFleet();renderLog();renderDaily();renderScore();startAlerts();
  $('#foot').innerHTML=`Datos: <a href="https://thespacedevs.com/llapi" target="_blank">Launch Library 2 (The Space Devs)</a>. Actualizado: ${fmt(D.generated)}. Tus puntos se guardan solo en este navegador.`;
  renderInstall();offlineNote();
}
// ---------- Pestañas (accesibles con teclado y enlazables con #) ----------
const TABS=()=>[...document.querySelectorAll('nav [role=tab]')];
function showTab(id,focus){const b=TABS().find(x=>x.dataset.tab===id);if(!b)return;
  TABS().forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1});
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x.id===id));
  if(focus)b.focus({preventScroll:true});const bar=b.parentNode;if(bar&&bar.scrollWidth>bar.clientWidth){const l=b.offsetLeft-bar.offsetLeft,r=l+b.offsetWidth;if(l<bar.scrollLeft||r>bar.scrollLeft+bar.clientWidth)bar.scrollLeft=Math.max(0,l-(bar.clientWidth-b.offsetWidth)/2)}
  if(id==='map'){drawMap();setTimeout(()=>{try{mapObj&&mapObj.invalidateSize()}catch(e){}},50)}}
function initTabs(){
  const bar=$('nav .tabs'),tb=TABS();
  tb.forEach(b=>b.onclick=()=>{showTab(b.dataset.tab);try{history.replaceState(null,'','#'+b.dataset.tab)}catch(e){}});
  if(bar){bar.onkeydown=e=>{const i=tb.indexOf(document.activeElement);if(i<0)return;let j=null;
      if(e.key==='ArrowRight')j=(i+1)%tb.length;else if(e.key==='ArrowLeft')j=(i-1+tb.length)%tb.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=tb.length-1;
      if(j!=null){e.preventDefault();tb[j].click();tb[j].focus({preventScroll:true})}};
    const fade=()=>bar.classList.toggle('end',bar.scrollLeft+bar.clientWidth>=bar.scrollWidth-4);bar.onscroll=fade;fade();addEventListener('resize',fade)}
  const fromHash=()=>{const h=(location.hash||'').slice(1);if(tb.some(b=>b.dataset.tab===h))showTab(h)};
  addEventListener('hashchange',fromHash);if(location.hash.length>1){fromHash();setTimeout(()=>{try{scrollTo(0,0)}catch(e){}},0)}
}
// ---------- Puntuación ----------
function points(){return LS.get('points',{pred:0,quiz:0})}
function addPts(kind,n){const p=points();p[kind]=(p[kind]||0)+n;LS.set('points',p);renderScore()}
function renderScore(){const p=points(),t=(p.pred||0)+(p.quiz||0)+(p.bet||0)+(p.expert||0)+(p.streak||0),st=LS.get('streak',null),rn=st&&(st.last===dayKey()||st.last===dayKey(-1))?st.n:0;
  const lv=t<50?'Becario de control':t<150?'Ingeniero de lanzamiento':t<400?'Director de vuelo':'Leyenda de Starbase';
  $('#score').innerHTML=`<b>${t}</b> puntos · ${lv}${rn?` · racha de ${rn} ${rn===1?'día':'días'}`:''}`}
// ---------- Próximo ----------
function upcomingFuture(){const now=Date.now();return D.upcoming.filter(l=>new Date(l.net)>now-3*H)}
function renderNext(){
  const s=D.stats,ups=upcomingFuture(),n=ups[0];
  let h='';
  if(n){const b=(n.stages||[])[0]||{};
    const ph=n.img?n:D.previous.find(x=>x.img&&x.img_lic_url);
    h+=`<div class="card hero"><div class="bg" style="background-image:url('${ph?esc(ph.img):''}')"></div><div class="in">
    <div class="kick">Próximo lanzamiento</div><h2>${mname(n)}</h2>
    <div class="big" id="cd" role="timer" aria-live="off" aria-label="Cuenta atrás hasta el despegue"></div>
    <div class="mut">${fmt(n.net)} · ${n.rocket} · ${n.loc||''}</div>
    <div style="margin-top:8px">${n.status==='Go'?'<span class="tag ok">Confirmado (Go)</span>':`<span class="tag warn">${n.status_name}</span>`}
    ${n.orbit?`<span class="tag">${orb(n.orbit)}</span>`:''}${b.serial&&!/Unknown/.test(b.serial)?`<span class="tag">Propulsor ${b.serial} · vuelo ${b.flight}</span>`:''}
    ${b.land_loc?`<span class="tag">Aterriza en ${b.land_loc_name}</span>`:''}${n.prob?`<span class="tag">Meteo favorable ${n.prob}%</span>`:''}</div>
    <p class="mut">${tdesc(n)}</p>${learnHTML(n,true)}${n.video?`<a class="live" href="${n.video}" target="_blank" rel="noopener"><span aria-hidden="true">▶</span> Ver directo<span class="sr"> (se abre en otra pestaña)</span></a>`:''}${alertBtns(n)}${ph?credit(ph).replace('Foto:',ph===n?'Foto:':`Foto de ${esc(mname(ph))}:`):''}</div></div>`;
    const tick=()=>{const ms=new Date(n.net)-Date.now();const el=$('#cd');if(!el)return;
      if(ms<0){el.textContent='¡Despegando o ya en vuelo!';return}
      const d=Math.floor(ms/DAY),hh=Math.floor(ms%DAY/H),m=Math.floor(ms%H/6e4),sec=Math.floor(ms%6e4/1e3);
      el.textContent=`T- ${d}d ${String(hh).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`};
    tick();setInterval(tick,1000);}
  h+='<div id="alerts"></div><div id="daily"></div><div id="install"></div>';
  h+=`<div class="stats"><div><b>${s.total_launch_count}</b>lanzamientos totales</div><div><b>${s.successful_launches}</b>con éxito</div>
  <div><b>${s.consecutive_successful_launches}</b>éxitos seguidos</div><div><b>${s.successful_landings}</b>aterrizajes de propulsor</div>
  <div><b>${s.consecutive_successful_landings}</b>aterrizajes seguidos</div><div><b>${s.pending_launches}</b>lanzamientos pendientes</div></div>`;
  h+=`<h3 style="margin-top:22px">Siguientes lanzamientos</h3>`+ups.slice(1,8).map(l=>`<div class="card"><h3>${mname(l)}</h3><div class="mut">${fmt(l.net)}${/TBD|MON|YEAR|QUARTER/i.test(l.net_precision||'')?' (fecha aproximada)':''} · ${l.rocket} · ${l.loc||''}</div>${alertBtns(l)}${learnHTML(l)}</div>`).join('');
  $('#next').innerHTML=h;
}
// ---------- Predicciones ----------
function predictable(l){return new Date(l.net)>Date.now()&&!/TBD/i.test(l.status)&&new Date(l.net)-Date.now()<21*DAY}
function renderPredict(){
  const preds=LS.get('preds',{});
  let h=`<div class="card"><b>Cómo se juega:</b> antes de cada despegue responde a tres preguntas. Cuando el lanzamiento ocurra, comparamos con lo que pasó de verdad. Cada acierto da 10 puntos, acertar las tres da 5 de bonus, y si apuestas por un fallo y aciertas te llevas 50. Abre «Análisis de experto» en cada lanzamiento para razonar y predecir los minutos de retraso (hasta 40 puntos más).</div>`;
  const list=D.upcoming.filter(predictable);
  if(!list.length)h+='<p class="mut">Ahora mismo no hay lanzamientos confirmados en las próximas tres semanas. Vuelve mañana.</p>';
  list.forEach(l=>{const p=preds[l.id]||{a:{}};const b=(l.stages||[])[0]||{};
    const qs=[['ok','¿Llegará la carga a su órbita?'],...(b.land_attempt?[['land',`¿Aterrizará el propulsor ${b.serial||''} en ${b.land_loc_name||'su zona'}?`]]:[]),['time',`¿Despegará dentro de las 24 h de la hora prevista ahora (${fmt(l.net)})?`]];
    h+=`<div class="card" data-id="${l.id}"><h3>${mname(l)}</h3><div class="mut">${l.rocket} · ${l.loc||''}${b.flight?` · vuelo nº ${b.flight} del propulsor`:''}</div>`+
    qs.map(([k,q])=>`<div style="margin-top:8px"><div id="q-${l.id}-${k}">${q}</div><div class="opts" role="group" aria-labelledby="q-${l.id}-${k}">${['Sí','No'].map(v=>`<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${p.a[k]===v}" class="${p.a[k]===v?'sel':''}">${v}</button>`).join('')}</div></div>`).join('')+
    `<div class="mut">${p.saved?'Predicción guardada ✔ (puedes cambiarla hasta el despegue)':'Sin predicción todavía'}</div>${expertHTML(l)}</div>`});
  const done=Object.values(preds).filter(p=>p.res);
  if(done.length)h+=`<h3>Tus resultados</h3>`+done.sort((a,b)=>b.resAt-a.resAt).map(p=>`<div class="card"><h3>${p.name}</h3>${p.res.map(r=>`<div>${ic(r.ok)} ${r.q}: dijiste ${r.you}, pasó ${r.real}</div>`).join('')}<b>+${p.pts} puntos</b></div>`).join('');
  h+=expertResultsHTML();
  $('#predict').innerHTML=h;
  bindExpert();
  $('#predict').querySelectorAll('.opts button[data-k]').forEach(bt=>bt.onclick=()=>{
    const id=bt.closest('.card').dataset.id,l=D.upcoming.find(x=>x.id===id);const ps=LS.get('preds',{});
    const p=ps[id]||{a:{},name:mname(l),land:!!((l.stages||[])[0]||{}).land_attempt};p.a[bt.dataset.k]=bt.dataset.v;p.net=l.net;p.saved=Date.now();ps[id]=p;LS.set('preds',ps);completeDaily('pred');renderPredict()});
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
  h+=Z.qs.map((q,i)=>{const a=st.ans[i];return `<div class="card"><div id="qz-${i}">${i+1}. ${q.q}</div><div class="opts" role="group" aria-labelledby="qz-${i}">${q.opts.map(o=>`<button type="button" data-i="${i}" data-v="${esc(o)}" ${a?'disabled':''} class="${a?(o===q.right?'right':(o===a?'wrong':'')):''}">${esc(o)}${a&&o===q.right?'<span class="sr"> (respuesta correcta)</span>':a&&o===a?'<span class="sr"> (tu respuesta, incorrecta)</span>':''}</button>`).join('')}</div>${a?`<div class="sr" role="status">${a===q.right?'Acierto':'Fallo. La correcta era '+esc(q.right)}</div>`:''}</div>`}).join('');
  if(!Z.qs.length)h+='<p class="mut">No hay datos suficientes para el reto de esta semana.</p>';
  $('#quiz').innerHTML=h;
  $('#quiz').querySelectorAll('.opts button').forEach(b=>b.onclick=()=>{const s=LS.get('quiz_'+Z.key,{ans:{}});const i=b.dataset.i;if(s.ans[i])return;
    s.ans[i]=b.dataset.v;LS.set('quiz_'+Z.key,s);if(b.dataset.v===Z.qs[i].right)addPts('quiz',10);completeDaily('quiz');renderQuiz();
    const nx=$('#quiz').querySelector(`.opts button[data-i="${+i+1}"]`)||$('#qz-'+i);if(nx&&nx.focus)nx.focus({preventScroll:false})});
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
  $('#fleet').innerHTML=`<div class="card"><b>Flota de propulsores</b><div class="mut">Las primeras etapas que han volado en los últimos ${D.previous.length} lanzamientos. Pulsa una columna para ordenar y un propulsor para ver su ficha y apostar si volverá a volar.</div></div>${betsHTML()}
  <div class="tscroll"><table><caption class="sr">Flota de propulsores, ordenada por ${fleetSort==='flights'?'número de vuelos':'último vuelo'}</caption><tr><th scope="col">Propulsor</th><th scope="col" aria-sort="${fleetSort==='flights'?'descending':'none'}"><button type="button" class="lnk" data-s="flights">Vuelos</button></th><th scope="col" aria-sort="${fleetSort==='last'?'descending':'none'}"><button type="button" class="lnk" data-s="last">Último vuelo</button></th><th scope="col">Próximo</th></tr>
  ${rows.map(r=>`<tr class="clic" data-serial="${r.serial}"><td><button type="button" class="lnk" data-open="${r.serial}" aria-label="Abrir la ficha del propulsor ${r.serial}"><b>${r.serial}</b> <span class="mut" aria-hidden="true">ficha ›</span></button></td><td>${r.flights}<div class="bar"><i style="width:${100*r.flights/max}%"></i></div></td><td>${fmtD(r.last)}<div class="mut">${r.missions.at(-1)}</div></td><td>${r.next?`${mname(r.next)}<div class="mut">${fmtD(r.next.net)}</div>`:'—'}</td></tr>`).join('')}</table></div>`;
  $('#fleet').querySelectorAll('button[data-s]').forEach(t=>t.onclick=()=>{fleetSort=t.dataset.s;renderFleet();const f=$('#fleet').querySelector(`button[data-s="${t.dataset.s}"]`);f&&f.focus()});
  $('#fleet').querySelectorAll('tr[data-serial]').forEach(t=>t.onclick=e=>{if(e.target.closest('button[data-s]'))return;openBooster(t.dataset.serial)});
}
// ---------- Mapa ----------
let mapDone=false,mapObj=null;
function drawMap(){if(mapDone)return;mapDone=true;
  const map=mapObj=L.map('mapdiv').setView([31,-100],3);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'© OpenStreetMap, © CARTO'}).addTo(map);
  const pads={};[...D.previous.map(l=>({...l,up:0})),...D.upcoming.map(l=>({...l,up:1}))].forEach(l=>{if(l.lat==null)return;
    const k=l.pad;const p=pads[k]||(pads[k]={pad:l.pad,loc:l.loc,lat:l.lat,lon:l.lon,done:0,up:0});l.up?p.up++:p.done++});
  Object.values(pads).forEach(p=>L.circleMarker([p.lat,p.lon],{radius:6+Math.sqrt(p.done+p.up)*2,color:'#4fb3ff',fillColor:'#8a7dff',fillOpacity:.5,weight:2}).addTo(map).bindPopup(`<b>${p.pad}</b><br>${p.loc}<br>${p.done} recientes · ${p.up} próximos`));
  $('#maplist').innerHTML=Object.values(pads).sort((a,b)=>b.done-a.done).map(p=>`<div class="card"><b>${p.pad}</b><div class="mut">${p.loc} · ${p.done} lanzamientos recientes · ${p.up} próximos</div></div>`).join('');
}
// ---------- Historial ----------
function renderLog(){
  $('#log').innerHTML=D.previous.map(l=>{const b=(l.stages||[])[0]||{};const ok=l.status==='Success';
    return `<div class="card row">${l.img?`<figure class="ph"><img loading="lazy" src="${esc(l.img)}" alt="">${credit(l)}</figure>`:''}<div><h3>${ic(ok,'Éxito','Fallo')} ${mname(l)}</h3>
    <div class="mut">${fmt(l.net)} · ${l.rocket} · ${l.loc||''}</div>
    <div>${l.orbit?`<span class="tag">${orb(l.orbit)}</span>`:''}${b.serial&&!/Unknown/.test(b.serial)?`<span class="tag">${b.serial} · vuelo ${b.flight}</span>`:''}
    ${b.land_attempt?`<span class="tag ${b.land_success?'ok':'ko'}">${b.land_success?'Aterrizó':'No aterrizó'} ${b.land_loc?'en '+b.land_loc:''}</span>`:''}</div>
    ${l.fail?`<div class="ko">${l.fail}</div>`:''}${learnHTML(l)}</div></div>`}).join('');
}
// ---------- Aprende en 1 minuto (qué lleva, a qué órbita va y para qué sirve) ----------
const ORB_LEARN={LEO:'Entre unos 160 y 2.000 km de altura. Una vuelta a la Tierra dura unos 90 minutos. Es la órbita más barata de alcanzar: allí están Starlink y la Estación Espacial Internacional.',
 SSO:'Órbita baja casi polar (normalmente entre 500 y 800 km) inclinada para pasar sobre cada lugar a la misma hora solar todos los días. Es ideal para fotografiar la Tierra siempre con la misma luz.',
 PO:'Pasa por encima o cerca de los polos y, como la Tierra gira debajo, acaba sobrevolando todo el planeta. Se lanza hacia el norte o el sur, por eso SpaceX suele usar Vandenberg (California), con el océano al sur.',
 GTO:'Órbita muy alargada cuyo punto más alto llega a unos 35.786 km. Desde ahí el satélite enciende su propio motor para quedarse en la órbita geoestacionaria, donde parece quieto sobre el ecuador.',
 GEO:'A 35.786 km sobre el ecuador el satélite tarda un día en dar la vuelta, lo mismo que la Tierra en girar, así que parece quieto en el cielo. La usan satélites de televisión y meteorológicos.',
 MEO:'Entre unos 2.000 y 35.786 km de altura. Es la zona de los sistemas de navegación como GPS o Galileo, a unos 20.000 km.',
 HEO:'Muy alargada: pasa cerca de la Tierra y luego se aleja mucho. Así el satélite pasa la mayor parte del tiempo sobre la misma zona del planeta.',
 Sub:'Sube al espacio pero no llega a la velocidad orbital (unos 7,8 km/s a baja altura), así que vuelve a caer. Se usa en vuelos de prueba.',
 L2:'El punto de Lagrange L2 está a unos 1,5 millones de km de la Tierra, en el lado contrario al Sol. Un telescopio allí tiene el Sol, la Tierra y la Luna siempre a su espalda, como el James Webb.',
 LO:'Alrededor de la Luna, a unos 384.000 km de media de la Tierra. La nave tiene que frenar al llegar para que la gravedad lunar la atrape.',
 TLI:'Inyección translunar: el cohete acelera la nave para que viaje hasta la Luna, a unos 384.000 km.'};
const TYPE_LEARN={'Communications':'Comunicaciones: satélites que llevan internet, telefonía o televisión a cualquier parte del mundo.',
 'Government/Top Secret':'Misión de un gobierno o un ejército. Muchos detalles son secretos, así que solo se sabe lo que se ha hecho público.',
 'Dedicated Rideshare':'Vuelo compartido: muchos satélites pequeños de distintos clientes viajan juntos y se reparten el precio del cohete.',
 'Resupply':'Reabastecimiento: lleva comida, agua, piezas de recambio y experimentos a una estación espacial, normalmente la Estación Espacial Internacional.',
 'Test Flight':'Vuelo de prueba: sirve para comprobar un cohete o una nave nuevos antes de usarlos en misiones de verdad.',
 'Lunar Exploration':'Exploración de la Luna: estudiar su superficie o preparar las futuras misiones con astronautas.',
 'Earth Science':'Ciencias de la Tierra: medir desde el espacio el clima, los océanos, el hielo o la atmósfera.',
 'Human Exploration':'Vuelo tripulado: lleva personas al espacio.',
 'Tourism':'Turismo espacial: lleva al espacio a personas que no son astronautas profesionales.',
 'Astrophysics':'Astrofísica: observar estrellas, galaxias y el universo sin la atmósfera de por medio.',
 'Planetary Science':'Ciencia planetaria: estudiar otros planetas, lunas o asteroides.',
 'Heliophysics':'Heliofísica: estudiar el Sol y cómo afecta a la Tierra.',
 'Navigation':'Navegación: satélites que permiten saber dónde estás, como el GPS.',
 'Mission Extension':'Alargar la vida útil de satélites que ya están en órbita, por ejemplo dándoles impulso o servicio en el espacio.',
 'Technology':'Demostración tecnológica: probar en el espacio un sistema nuevo antes de usarlo a gran escala.',
 'Robotic Exploration':'Exploración robótica: sondas o robots que viajan a otros mundos.'};
const STARLINK='Starlink: satélites de SpaceX que dan internet por satélite a casas, barcos, aviones y zonas sin cobertura.';
function learnHTML(l,top){if(!l)return '';
  const all=D.previous||[],oc=l.orbit&&l.orbit!=='N/A'?all.filter(x=>x.orbit===l.orbit).length:0;
  const cu=(l.cust||[]).filter(Boolean),para=/starlink/i.test(l.name||'')?STARLINK:TYPE_LEARN[l.mtype]||(l.mtype?esc(l.mtype)+'.':'');
  const ol=l.orbit&&l.orbit!=='N/A'?ORB_LEARN[l.orbit]:'';
  if(!l.desc&&!ol&&!para)return '';
  return `<details class="xp learn" data-learn="${esc(l.id)}"><summary>Aprende en 1 minuto</summary>
  <dl class="lrn"><dt>Qué lleva</dt><dd>${l.desc?(top?'Lo que cuenta la descripción de arriba.':tdesc(l)):'Launch Library 2 todavía no da detalles de la carga.'}${cu.length?`<div class="mut">Cliente: ${cu.map(esc).join(', ')}</div>`:''}</dd>
  <dt>A qué órbita va</dt><dd>${l.orbit&&l.orbit!=='N/A'?`<b>${esc(orb(l.orbit))}</b>${ol?'. '+ol:''}${oc?`<div class="mut">De los últimos ${all.length} lanzamientos de SpaceX, ${oc} fueron a esta órbita.</div>`:''}`:'Todavía no se ha publicado.'}</dd>
  ${para?`<dt>Para qué sirve</dt><dd>${para}</dd>`:''}</dl>
  ${l.info?`<a href="${esc(l.info)}" target="_blank" rel="noopener">Página oficial de la misión<span class="sr"> (se abre en otra pestaña)</span></a>`:''}</details>`}
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.matches&&d.matches('details.learn')&&d.open){try{completeDaily('learn')}catch(x){}}},true);
// ---------- Globo de desafío (cada pocas horas, con datos reales) ----------
const GLOBO_CADA=4*H;
function retosGlobo(){
  const R=[],ups=D.upcoming.filter(predictable),preds=LS.get('preds',{});
  const sin=ups.filter(l=>!preds[l.id]);
  if(sin.length){const l=sin[0],b=(l.stages||[])[0]||{};
    R.push({t:'¿Te la juegas?',m:`${mname(l)} despega ${fmt(l.net)}${b.flight?` con el propulsor ${b.serial} en su vuelo nº ${b.flight}`:''}. ¿Aterrizará? Haz tu predicción antes del despegue y gana hasta 35 puntos.`,tab:'predict',btn:'Predecir ahora',k:'pred'});}
  {const X=LS.get('expert',{}),l=ups.find(l=>precise(l)&&!X[l.id]);if(l)R.push({t:'Análisis de experto',m:`¿Cuántos minutos se retrasará ${mname(l)} respecto a su hora prevista (${fmt(l.net)})? Razona como un ingeniero con las pistas reales y gana hasta 60 puntos.`,tab:'predict',btn:'Analizar',k:'expert'});}
  const Z=buildQuiz(),st=LS.get('quiz_'+Z.key,{ans:{}}),falta=Z.qs.length-Object.keys(st.ans).length;
  if(falta>0)R.push({t:'Reto semanal',m:`Te quedan ${falta} preguntas sobre las misiones reales de esta semana. Solo los mejores directores de vuelo las aciertan todas. ¿Tú qué?`,tab:'quiz',btn:'Aceptar el reto',k:'quiz'});
  const fl=D.previous.flatMap(l=>(l.stages||[]).map(s=>({...s,l}))).filter(s=>s.flight).sort((a,b)=>b.flight-a.flight)[0];
  if(fl)R.push({t:'Récord de reutilización',m:`El propulsor ${fl.serial} ya lleva ${fl.flight} vuelos. Antes los cohetes se tiraban tras un solo uso. ¿Sabrías decir cuál es el siguiente en llegar a esa cifra?`,tab:'fleet',btn:'Ver la flota',k:'fleet'});
  {const bs=LS.get('bets',{});const cand=D.previous.flatMap(l=>(l.stages||[]).map(s=>s.serial)).find(x=>{if(!x||/Unknown/.test(x)||(bs[x]&&!bs[x].res))return false;const u=boosterHist(x).at(-1);return u&&u.s.land_attempt!==false&&u.s.land_success!==false});
   if(cand)R.push({t:'¿Volverá a volar?',m:`Abre la ficha del propulsor ${cand}: mira cuántos días suele pasar en tierra entre vuelos y apuesta si volverá a despegar en los próximos 30 días. Se resuelve solo con los datos reales.`,tab:'fleet',btn:'Ver propulsores',k:'bet'});}
  const s=D.stats;if(s&&s.consecutive_successful_landings)R.push({t:'Racha en directo',m:`SpaceX lleva ${s.consecutive_successful_landings} aterrizajes seguidos sin fallar y ${s.consecutive_successful_launches} lanzamientos seguidos con éxito. ¿Crees que la racha aguanta esta semana? Demuéstralo con tus predicciones.`,tab:'predict',btn:'Apostar',k:ups.length?'pred':null});
  const o=D.previous.find(l=>l.orbit&&l.orbit!=='LEO');
  if(o)R.push({t:'Fórmate',m:`${mname(o)} fue a una órbita ${orb(o.orbit)}. ¿Sabes por qué no todas las misiones van a la misma órbita? Aprende cómo funciona y vuelve a por el reto.`,url:'https://es.wikipedia.org/wiki/%C3%93rbita',btn:'Aprender (Wikipedia)',k:'learn'});
  return R;
}
function mostrarGlobo(forzar){
  if(!D)return;const last=LS.get('globo_last',0);if(!forzar&&Date.now()-last<GLOBO_CADA)return;
  checkIn();const dd=retoDelDia();let r,diario=false;
  if(dd&&!dd.done&&LS.get('globo_dd','')!==dayKey()){r=dd;diario=true;LS.set('globo_dd',dayKey())}
  else{const R=retosGlobo();if(!R.length)return;const n=LS.get('globo_n',0);r=R[n%R.length];LS.set('globo_n',n+1)}
  LS.set('globo_last',Date.now());
  const g=document.createElement('div');g.className='globo';
  g.setAttribute('role','complementary');g.setAttribute('aria-label','Desafío');g.setAttribute('aria-live','polite');
  g.innerHTML=`<button type="button" class="x" aria-label="Cerrar">×</button>${diario?`<div class="gk">Desafío del día · +${dailyPts()} puntos</div>`:''}<h4>${r.t}</h4><p>${r.m}</p><button type="button" class="go">${r.btn}</button><button type="button" class="later">Luego</button>`;
  document.body.appendChild(g);requestAnimationFrame(()=>requestAnimationFrame(()=>g.classList.add('show')));
  const close=()=>{g.classList.remove('show');setTimeout(()=>g.remove(),500)};
  g.querySelector('.x').onclick=close;g.querySelector('.later').onclick=close;
  g.querySelector('.go').onclick=()=>{close();goReto(r)};
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
  return `<div class="card"><b>Tus apuestas de propulsores</b>${bs.sort((a,b)=>b.at-a.at).map(b=>`<div style="margin-top:6px">${b.res?ic(b.res.ok):'<span role="img" aria-label="Pendiente">⏳</span>'} ${b.serial} · vuelo nº ${b.target} antes del ${fmtD(b.deadline)}: dijiste <b>${b.pick}</b>${b.res?` · ${b.res.real?`voló${b.res.mission?' en '+b.res.mission:''}`:'no voló a tiempo'} · +${b.won} puntos`:' · pendiente'}</div>`).join('')}</div>`;
}
function openBooster(serial){
  const h=boosterHist(serial);if(!h.length)return;completeDaily('fleet');
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
    <div class="opts" role="group" aria-label="Tu apuesta"><button type="button" data-b="Sí">Sí (+${P.si})</button><button type="button" data-b="No">No (+${P.no})</button></div>`;
  const rows=h.slice().reverse().map(({l,s})=>{const td=tdays(s.turnaround);
    return `<tr><td>${fmtD(l.net)}</td><td>${mname(l)}</td><td>${s.flight??'—'}</td><td>${td!=null&&td>0?td+' d':'—'}</td><td>${s.land_attempt?`<span class="tag ${s.land_success?'ok':'ko'}">${s.land_success?'Sí':'No'}${s.land_loc?' · '+s.land_loc:''}</span>`:'Sin intento'}</td></tr>`}).join('');
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="box" role="dialog" aria-modal="true" aria-label="Ficha del propulsor ${serial}"><button type="button" class="x" aria-label="Cerrar la ficha">×</button>
   <div class="kick">Ficha del propulsor</div><h2>${serial}</h2>
   <div class="stats"><div><b>${tot}</b>vuelos totales</div><div><b>${last.s.booster_landings??'—'}</b>aterrizajes con éxito</div><div><b>${avg??'—'}</b>días medios entre vuelos</div><div><b>${since}</b>días desde su último vuelo</div></div>
   ${betH}
   <h3>Vuelos en los últimos ${D.previous.length} lanzamientos de SpaceX</h3>
   <div class="scroll"><table><tr><th scope="col">Fecha</th><th scope="col">Misión</th><th scope="col">Vuelo nº</th><th scope="col">Días en tierra</th><th scope="col">Aterrizó</th></tr>${rows}</table></div>
   <p class="mut">Datos de Launch Library 2. Los totales de vuelos y aterrizajes son los que da la fuente en la última actualización.</p></div>`;
  const prevFocus=document.activeElement;
  document.body.appendChild(m);document.body.classList.add('noscroll');
  const close=(keep)=>{m.remove();document.body.classList.remove('noscroll');document.removeEventListener('keydown',onKey);
    if(keep!==true){const t=document.querySelector(`#fleet button[data-open="${serial}"]`)||prevFocus;try{t&&t.focus&&t.focus()}catch(e){}}},
   onKey=e=>{if(e.key==='Escape')close();else if(e.key==='Tab'){const f=[...m.querySelectorAll('button,a[href],[tabindex]:not([tabindex="-1"])')];if(!f.length)return;
     const a=f[0],z=f.at(-1);if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}};
  document.addEventListener('keydown',onKey);m.querySelector('.x').focus();
  m.onclick=e=>{if(e.target===m)close()};m.querySelector('.x').onclick=close;
  m.querySelectorAll('[data-b]').forEach(bt=>bt.onclick=()=>{const b2=LS.get('bets',{});
    b2[serial]={serial,pick:bt.dataset.b,target,deadline:deadline.getTime(),si:P.si,no:P.no,at:Date.now()};LS.set('bets',b2);completeDaily('bet');close(true);renderFleet();openBooster(serial)});
}

// ---------- Análisis de experto (razonamiento + predicción medible que se puntúa sola) ----------
const XDRAFT={},XOPEN=new Set();
const precise=l=>/^(SEC|MIN)$/i.test(l.net_precision||'');
function winStats(){// datos reales: minutos entre la apertura de la ventana y el despegue en los lanzamientos recientes
  const v=D.previous.filter(l=>l.ws&&l.net&&precise(l)).map(l=>Math.round((new Date(l.net)-new Date(l.ws))/6e4)).filter(x=>x>=0).sort((a,b)=>a-b);
  if(!v.length)return null;return{n:v.length,med:v[Math.floor(v.length/2)],at0:v.filter(x=>x<=1).length}}
function xDelayPts(err){return err<=2?40:err<=10?25:err<=60?10:err<=240?5:0}
function xConfPts(c,o){return Math.max(0,Math.round(20*(1-2*Math.pow(c/100-(o?1:0),2))))}
function expertHTML(l){
  if(!precise(l))return '';
  const X=LS.get('expert',{}),x=X[l.id],dr=XDRAFT[l.id]||{},b=(l.stages||[])[0]||{};
  const txt=dr.txt??(x?x.txt:''),del=dr.delay??(x?x.delay:''),conf=dr.conf??(x&&x.conf!=null?x.conf:'');
  const ws=winStats(),wmin=l.ws&&l.we?Math.round((new Date(l.we)-new Date(l.ws))/6e4):null;
  const pist=[wmin!=null?(wmin>0?`la ventana dura ${wmin} min (de ${fmt(l.ws)} a ${fmt(l.we)})`:'la ventana es instantánea: si algo falla, se aplaza'):null,
    l.prob!=null?`meteo favorable ${l.prob}%`:null,`estado: ${esc(l.status_name)}`,
    ws?`en los últimos ${ws.n} lanzamientos el despegue fue una mediana de ${ws.med} min después de abrirse la ventana (${ws.at0} justo al abrirse)`:null].filter(Boolean).join('; ');
  const id=esc(l.id);
  return `<details class="xp" data-xid="${id}"${XOPEN.has(l.id)?' open':''}><summary>Análisis de experto${x?' <span class="tag ok">guardado</span>':''}</summary>
  <p class="mut">Razona como un ingeniero (física, meteo, historial del propulsor) y haz una predicción concreta que se puntúa sola con los datos reales. Pistas reales: ${pist}.</p>
  <label for="xt-${id}">Tu razonamiento</label>
  <textarea id="xt-${id}" data-f="txt" maxlength="1500" rows="4" placeholder="Por ejemplo: ventana corta, propulsor con pocos días en tierra, viento en la zona de recuperación...">${esc(txt)}</textarea>
  <div class="xrow"><div><label for="xd-${id}">Minutos de retraso respecto a la hora prevista ahora (${fmt(l.net)})</label>
  <input id="xd-${id}" data-f="delay" type="number" inputmode="numeric" min="0" max="20160" step="1" value="${esc(String(del))}" aria-describedby="xdh-${id}"><div class="mut" id="xdh-${id}">0 si despega a la hora. Hasta 2 min de error: 40 puntos; 10 min: 25; 1 h: 10; 4 h: 5.</div></div>
  ${b.land_attempt?`<div><label for="xc-${id}">Confianza en que aterrice ${esc(b.serial||'el propulsor')} (%)</label>
  <input id="xc-${id}" data-f="conf" type="number" inputmode="numeric" min="0" max="100" step="1" value="${esc(String(conf))}" aria-describedby="xch-${id}"><div class="mut" id="xch-${id}">Opcional. Se puntúa por calibración: hasta 20 puntos; decir 50% da 10 pase lo que pase.</div></div>`:''}</div>
  <div class="opts"><button type="button" class="xsave" data-xid="${id}">${x?'Actualizar análisis':'Guardar análisis'}</button></div>
  <div class="mut" role="status" id="xs-${id}">${x?`Guardado ${fmt(x.saved)}. Puedes cambiarlo hasta el despegue.`:'Sin guardar.'}</div></details>`}
function bindExpert(){
  const root=$('#predict');
  root.querySelectorAll('details.xp').forEach(d=>d.ontoggle=()=>{d.open?XOPEN.add(d.dataset.xid):XOPEN.delete(d.dataset.xid)});
  root.querySelectorAll('details.xp [data-f]').forEach(el=>el.oninput=()=>{const id=el.closest('details').dataset.xid;(XDRAFT[id]||(XDRAFT[id]={}))[el.dataset.f]=el.value});
  root.querySelectorAll('button.xsave').forEach(bt=>bt.onclick=()=>{const id=bt.dataset.xid,d=bt.closest('details'),l=D.upcoming.find(x=>x.id===id);if(!l)return;
    const st=$('#xs-'+CSS.escape(id)),g=f=>{const e=d.querySelector(`[data-f="${f}"]`);return e?e.value.trim():''};
    if(new Date(l.net)<=Date.now()){st.textContent='El lanzamiento ya ha empezado: no se puede cambiar.';return}
    const txt=g('txt').slice(0,1500),dv=g('delay'),cv=g('conf');
    const delay=dv===''?NaN:Math.round(+dv),conf=cv===''?null:Math.round(+cv);
    if(!Number.isFinite(delay)||delay<0||delay>20160){st.textContent='Escribe los minutos de retraso: un número entre 0 y 20160 (14 días).';return}
    if(conf!=null&&!(conf>=0&&conf<=100)){st.textContent='La confianza debe ser un número de 0 a 100.';return}
    const b=(l.stages||[])[0]||{},X=LS.get('expert',{});
    X[id]={name:mname(l),txt,delay,conf:b.land_attempt?conf:null,net0:new Date(l.net).getTime(),land:!!b.land_attempt,serial:b.serial||null,saved:Date.now()};
    LS.set('expert',X);delete XDRAFT[id];XOPEN.add(id);completeDaily('expert');renderPredict();
    const s2=$('#xs-'+CSS.escape(id));if(s2)s2.textContent='Análisis guardado. Se puntuará solo cuando despegue.'});
}
function resolveExpert(){
  const X=LS.get('expert',{});let ch=false;
  for(const [id,x] of Object.entries(X)){if(x.res)continue;const l=D.previous.find(y=>y.id===id);if(!l)continue;
    const b=(l.stages||[])[0]||{},r={};let pts=0;
    if(precise(l)){r.realDelay=Math.round((new Date(l.net)-x.net0)/6e4);r.err=Math.abs(r.realDelay-x.delay);r.dpts=xDelayPts(r.err);pts+=r.dpts}else r.void=true;
    if(x.land&&x.conf!=null&&b.land_success!=null){r.landed=!!b.land_success;r.cpts=xConfPts(x.conf,r.landed);pts+=r.cpts}
    x.res=r;x.pts=pts;x.resAt=Date.now();ch=true;if(pts)addPts('expert',pts);}
  if(ch)LS.set('expert',X);
}
function expertResultsHTML(){
  const done=Object.values(LS.get('expert',{})).filter(x=>x.res);if(!done.length)return '';
  return `<h3>Tus análisis de experto</h3>`+done.sort((a,b)=>b.resAt-a.resAt).map(x=>{const r=x.res;
    return `<div class="card"><h3>${esc(x.name)}</h3>${r.void?'<div class="mut">La fuente no da la hora exacta del despegue, así que el retraso no se puede medir.</div>':
    `<div>${ic(r.err<=10,'Muy cerca','Lejos')} Retraso: dijiste ${x.delay} min, fue ${r.realDelay} min (error de ${r.err} min) · +${r.dpts}</div>`}
    ${r.cpts!=null?`<div>${ic((x.conf>=50)===r.landed,'Bien calibrado','Mal calibrado')} Confianza en el aterrizaje: ${x.conf}% · ${r.landed?'aterrizó':'no aterrizó'} · +${r.cpts}</div>`:''}
    ${x.txt?`<blockquote class="xq">${esc(x.txt)}</blockquote>`:''}<b>+${x.pts} puntos</b></div>`}).join('');
}

// ---------- Racha de días y desafío del día ----------
// Volver cada día suma 2 puntos por día de racha (máximo 14). Completar el desafío del día da 10, +5 con racha de 3 días y +10 con racha de 7.
function dayKey(off){const d=new Date();d.setDate(d.getDate()+(off||0));return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
const visitPts=n=>2*Math.min(n,7);
function streakNow(){const st=LS.get('streak',null);return st&&(st.last===dayKey()||st.last===dayKey(-1))?st.n:0}
function dailyPts(){const n=streakNow();return 10+(n>=7?10:n>=3?5:0)}
function checkIn(){try{const t=dayKey(),st=LS.get('streak',{n:0,best:0,last:null,days:0});if(st.last===t)return;
  st.n=st.last===dayKey(-1)?(st.n||0)+1:1;st.best=Math.max(st.best||0,st.n);st.days=(st.days||0)+1;st.last=t;st.got=visitPts(st.n);
  LS.set('streak',st);addPts('streak',st.got);if($('#daily'))renderDaily()}catch(e){}}
function retoDelDia(){const t=dayKey(),d=LS.get('daily',null);if(d&&d.d===t)return d;
  const R=retosGlobo().filter(r=>r.k);if(!R.length)return null;
  const num=Math.round(new Date(t+'T12:00:00')/DAY),r=R[num%R.length];
  const nd={d:t,k:r.k,t:r.t,m:r.m,btn:r.btn,tab:r.tab||null,url:r.url||null,done:false};LS.set('daily',nd);return nd}
function completeDaily(k){try{const d=LS.get('daily',null);if(!d||d.d!==dayKey()||d.done||d.k!==k)return;
  d.done=true;d.pts=dailyPts();d.at=Date.now();LS.set('daily',d);addPts('streak',d.pts);
  const st=LS.get('streak',{});st.retos=(st.retos||0)+1;LS.set('streak',st);
  aviso(`Desafío del día completado: +${d.pts} puntos.`);renderDaily()}catch(e){}}
function goReto(r){if(r.url){window.open(r.url,'_blank','noopener');completeDaily(r.k)}else{const b=document.querySelector(`nav button[data-tab="${r.tab}"]`);if(b)b.click();try{scrollTo({top:0})}catch(e){}}}
function aviso(t){let a=$('#aviso');if(!a){a=document.createElement('div');a.id='aviso';a.className='aviso';a.setAttribute('role','status');document.body.appendChild(a)}
  a.textContent=t;a.classList.add('show');clearTimeout(a._t);a._t=setTimeout(()=>a.classList.remove('show'),4500)}
function renderDaily(){const el=$('#daily');if(!el||!D)return;const st=LS.get('streak',{n:0,best:0}),n=streakNow(),d=retoDelDia();
  const sig=visitPts(n+1);
  el.innerHTML=`<div class="card daily"><div class="kick">Racha y desafío del día</div>
  <div class="stats"><div><b>${n}</b>${n===1?'día seguido':'días seguidos'}</div><div><b>${st.best||n}</b>récord de racha</div><div><b>+${st.last===dayKey()?st.got||0:0}</b>puntos hoy por volver</div><div><b>${st.retos||0}</b>desafíos completados</div></div>
  ${d?`<h3>${esc(d.t)}</h3><p class="mut">${esc(d.m)}</p>${d.done?`<p>${ic(true,'Completado')} Completado hoy · +${d.pts} puntos. Mañana hay otro.</p>`:`<div class="opts"><button type="button" class="dgo">${esc(d.btn)} (+${dailyPts()})</button></div>`}`:'<p class="mut">Hoy no hay desafío disponible con los datos actuales.</p>'}
  <div class="mut">Vuelve mañana para mantener la racha: +${sig} puntos por volver${n+1>=3&&n<3?' y el desafío del día pasa a dar +15':n+1>=7&&n<7?' y el desafío del día pasa a dar +20':''}. Volver da 2 puntos por día de racha (hasta 14); el desafío da 10, 15 con 3 días seguidos y 20 con 7. Si un día no entras, la racha vuelve a empezar.</div></div>`;
  const b=el.querySelector('.dgo');if(b)b.onclick=()=>goReto(d);renderScore()}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&D){checkIn();renderDaily()}});
// ---------- Avisos 15 minutos antes del despegue ----------
const AVISO_MIN=15,SITE='https://spacegroks.github.io/';
let AL_UP=null;// copia de los próximos lanzamientos que se refresca para seguir los cambios de hora
const alertable=l=>l&&precise(l)&&!/TBD/i.test(l.status||'')&&new Date(l.net)>Date.now()-10*6e4;
const alSet=()=>{const a=LS.get('alerts',{all:false,ids:{},sent:{}});a.ids=a.ids||{};a.sent=a.sent||{};return a};
const wanted=(a,l)=>a.all||!!a.ids[l.id];
const notifOK=()=>typeof Notification!=='undefined';
function alertBtns(l){if(!alertable(l))return '';const a=alSet(),on=wanted(a,l);
  return `<div class="opts al" data-alid="${esc(l.id)}"><button type="button" data-al="one" aria-pressed="${on}" class="${on?'sel':''}"${a.all?' disabled':''}>${a.all?'Aviso activado (todos)':on?'Aviso activado: 15 min antes':'Avisarme 15 min antes'}</button><button type="button" data-al="ics">Añadir al calendario</button></div>`}
function renderAlerts(){const el=$('#alerts');if(!el||!D)return;const a=alSet(),ups=(AL_UP||D.upcoming).filter(alertable);
  const perm=notifOK()?Notification.permission:'none',n=ups.filter(l=>wanted(a,l)).length;
  const st=perm==='granted'?'Notificaciones del navegador activadas.':perm==='denied'?'Has bloqueado las notificaciones de esta web: el aviso saldrá dentro de la página.':perm==='none'?'Este navegador no permite notificaciones: el aviso saldrá dentro de la página.':'Al activar un aviso, el navegador te pedirá permiso para mostrar notificaciones.';
  el.innerHTML=`<div class="card"><div class="kick">Avisos de lanzamiento</div>
  <p class="mut">Te avisamos ${AVISO_MIN} minutos antes de cada despegue con hora exacta, con enlace al directo. ${n?`Tienes ${n===1?'1 aviso activo':n+' avisos activos'} de ${ups.length} lanzamientos con hora exacta.`:`Hay ${ups.length} lanzamientos con hora exacta.`}</p>
  <div class="opts"><button type="button" data-al="all" aria-pressed="${!!a.all}" class="${a.all?'sel':''}">${a.all?'Avisos de todos los lanzamientos: activados':'Avisarme de todos los lanzamientos'}</button></div>
  <div class="mut">${st} El aviso llega mientras SpaceX Play esté abierta en una pestaña, aunque sea en segundo plano. Si se retrasa el lanzamiento, el aviso sigue la nueva hora. Para que te llegue con la página cerrada, usa «Añadir al calendario» (el evento trae su propia alarma ${AVISO_MIN} minutos antes).</div></div>`;
  document.querySelectorAll('.al[data-alid]').forEach(w=>{const l=(AL_UP||D.upcoming).find(x=>x.id===w.dataset.alid);if(l)w.outerHTML=alertBtns(l)||''})}
const icsT=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
const icsE=s=>String(s||'').replace(/[\\;,]/g,m=>'\\'+m).replace(/\r?\n/g,'\\n');
const icsFold=s=>{const o=[];let r=s;while(r.length>60){o.push(r.slice(0,60));r=' '+r.slice(60)}o.push(r);return o.join('\r\n')};
function icsFor(l){const u=l.video||SITE+'#next';
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SpaceX Play//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT','UID:'+l.id+'@spacegroks.github.io','DTSTAMP:'+icsT(Date.now()),'DTSTART:'+icsT(l.net),'DURATION:PT30M',
    'SUMMARY:'+icsE('Lanzamiento '+l.rocket+': '+mname(l)),'LOCATION:'+icsE([l.pad,l.loc].filter(Boolean).join(', ')),
    'DESCRIPTION:'+icsE(`Hora prevista según Launch Library 2 (${fmt(D.generated)}). Puede cambiar: consulta ${SITE}. Directo: ${u}`),'URL:'+u,
    'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsE(mname(l)+' despega en '+AVISO_MIN+' minutos'),'TRIGGER:-PT'+AVISO_MIN+'M','END:VALARM','END:VEVENT','END:VCALENDAR'].map(icsFold).join('\r\n')+'\r\n'}
function downloadIcs(l){try{const b=new Blob([icsFor(l)],{type:'text/calendar;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');
  a.href=u;a.download='spacex-'+mname(l).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)+'.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5e3);
  aviso('Evento descargado: ábrelo para añadirlo a tu calendario.')}catch(e){aviso('No se ha podido crear el evento de calendario.')}}
async function askPerm(){try{if(notifOK()&&Notification.permission==='default')await Notification.requestPermission()}catch(e){}}
function alertBar(l,mins){let b=$('#alertbar');if(!b){b=document.createElement('div');b.id='alertbar';b.className='alertbar';b.setAttribute('role','alert');document.body.appendChild(b)}
  const u=l.video||SITE+'#next';
  b.innerHTML=`<b>${esc(mname(l))}</b> despega ${mins>0?`en ${mins} min`:'ahora'} · ${esc(l.rocket)}${l.loc?' · '+esc(l.loc):''} <a class="live" href="${esc(u)}" target="_blank" rel="noopener">${l.video?'Ver directo':'Abrir SpaceX Play'}<span class="sr"> (se abre en otra pestaña)</span></a> <button type="button" class="x" aria-label="Cerrar aviso">×</button>`;
  b.classList.add('show');b.querySelector('.x').onclick=()=>b.classList.remove('show')}
function fireAlert(l,mins){const u=l.video||SITE+'#next';alertBar(l,mins);
  if(notifOK()&&Notification.permission==='granted'){const ti=`${mname(l)} despega ${mins>0?'en '+mins+' min':'ahora'}`,op={body:`${l.rocket}${l.loc?' · '+l.loc:''}. ${l.video?'Pulsa para ver el directo.':'Pulsa para abrir SpaceX Play.'}`,tag:'sxp-'+l.id,icon:'icons/icon-192.png',badge:'icons/icon-192.png',data:{url:u}};
    if(SW_REG&&SW_REG.showNotification){SW_REG.showNotification(ti,op).catch(()=>{});return}
    try{const n=new Notification(`${mname(l)} despega ${mins>0?'en '+mins+' min':'ahora'}`,{body:`${l.rocket}${l.loc?' · '+l.loc:''}. ${l.video?'Pulsa para ver el directo.':'Pulsa para abrir SpaceX Play.'}`,tag:'sxp-'+l.id,icon:'icons/icon-192.png'});
    n.onclick=()=>{try{window.focus()}catch(e){}window.open(u,'_blank','noopener');n.close()}}catch(e){}}}
function checkAlerts(){if(!D)return;const a=alSet(),now=Date.now();let ch=false;
  for(const l of (AL_UP||D.upcoming)){if(!alertable(l)||!wanted(a,l))continue;const ms=new Date(l.net)-now;
    if(ms<=AVISO_MIN*6e4&&ms>-10*6e4&&a.sent[l.id]!==l.net){a.sent[l.id]=l.net;ch=true;fireAlert(l,Math.max(0,Math.ceil(ms/6e4)))}}
  for(const id of Object.keys(a.sent))if(!(AL_UP||D.upcoming).some(x=>x.id===id)){delete a.sent[id];ch=true}
  if(ch)LS.set('alerts',a)}
async function refreshAlertData(){const a=alSet();if(!a.all&&!Object.keys(a.ids).length)return;
  try{const d=await fetch('data.json?'+Date.now()).then(r=>r.json());if(d&&Array.isArray(d.upcoming)){AL_UP=d.upcoming;checkAlerts()}}catch(e){}}
function startAlerts(){renderAlerts();checkAlerts();setInterval(checkAlerts,20e3);setInterval(refreshAlertData,20*6e4);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkAlerts()});
  $('#next').addEventListener('click',async e=>{const b=e.target.closest('button[data-al]');if(!b)return;const a=alSet(),k=b.dataset.al;
    if(k==='ics'){const l=(AL_UP||D.upcoming).find(x=>x.id===b.closest('[data-alid]').dataset.alid);if(l)downloadIcs(l);return}
    const w=b.closest('[data-alid]'),id=w?w.dataset.alid:'',inHero=!!b.closest('.hero');
    if(k==='all')a.all=!a.all;else if(a.ids[id])delete a.ids[id];else a.ids[id]=true;
    const on=k==='all'?a.all:!!a.ids[id];LS.set('alerts',a);if(on)await askPerm();
    renderAlerts();const f=k==='all'?$('#alerts button[data-al="all"]'):document.querySelector(`${inHero?'.hero ':'.card:not(.hero) '}[data-alid="${id}"] button[data-al="one"]`);try{f&&f.focus()}catch(e){}
    aviso(on?`Aviso activado: ${AVISO_MIN} minutos antes${k==='all'?' de cada lanzamiento':''}.`:'Aviso desactivado.');checkAlerts()})}

// App instalable (manifest y service worker): se abre como app desde la pantalla de inicio y funciona sin conexión con los últimos datos guardados.
let SW_REG=null,INST_EV=null;
const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function renderInstall(){const el=$('#install');if(!el)return;const ins=LS.get('installed',false);
  if(standalone()){el.innerHTML='';return}
  let body='';
  if(INST_EV)body=`<p class="mut">Instala SpaceX Play en tu móvil u ordenador: se abre desde la pantalla de inicio como una app, a pantalla completa, y sin conexión enseña los últimos datos guardados.</p><div class="opts"><button type="button" data-inst="go">Instalar la app</button></div>`;
  else if(isIOS())body=`<p class="mut">En iPhone o iPad: abre esta página en Safari, pulsa el botón Compartir y elige «Añadir a pantalla de inicio». Se abrirá como una app, a pantalla completa, y sin conexión enseñará los últimos datos guardados.</p>`;
  else if(ins)body=`<p class="mut">Ya tienes SpaceX Play instalada: búscala en tu pantalla de inicio o en tus aplicaciones.</p>`;
  else{el.innerHTML='';return}
  el.innerHTML=`<div class="card"><div class="kick">Llévatela como app</div>${body}</div>`;
  const b=el.querySelector('[data-inst="go"]');if(b)b.onclick=async()=>{const ev=INST_EV;if(!ev)return;INST_EV=null;try{ev.prompt();const r=await ev.userChoice;if(r&&r.outcome==='accepted'){LS.set('installed',true);aviso('SpaceX Play se está instalando.')}}catch(e){}renderInstall()}}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();INST_EV=e;renderInstall()});
addEventListener('appinstalled',()=>{INST_EV=null;LS.set('installed',true);renderInstall()});
function offlineNote(){const f=$('#foot');if(!f)return;let n=$('#offline');
  if(navigator.onLine===false){if(!n){n=document.createElement('div');n.id='offline';n.className='mut';n.setAttribute('role','status');f.appendChild(n)}
    n.textContent=`Sin conexión: estás viendo los últimos datos guardados${D&&D.generated?' ('+fmt(D.generated)+')':''}.`}else if(n)n.remove()}
addEventListener('online',offlineNote);addEventListener('offline',offlineNote);
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').then(r=>{SW_REG=r}).catch(()=>{})})}
