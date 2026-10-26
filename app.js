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
let ES={},FES={};
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
Promise.all([fetch('data.json?'+Date.now()).then(r=>r.json()),fetch('i18n/desc_es.json?'+Date.now()).then(r=>r.ok?r.json():{}).catch(()=>({})),fetch('i18n/fail_es.json?'+Date.now()).then(r=>r.ok?r.json():{}).catch(()=>({}))]).then(([d,es,fes])=>{D=d;ES=es||{};FES=fes||{};init();translateDescs()}).catch(e=>{$('main').innerHTML='<p class="ko">No se han podido cargar los datos.</p>'});

function init(){
  initTabs();checkIn();
  resolvePredictions();resolveExpert();resolveBets();resolveRbet();resolveVida();renderNext();renderPredict();renderQuiz();renderFlight();renderFleet();bindVida();renderLog();renderDaily();renderLogros();resolveRitmo();renderRacha();bindRacha();renderRitmo();bindRitmo();resolveCli();renderClientes();bindClientes();resolveVen();renderVentanas();bindVentanas();resolveZon();renderZonas();bindZonas();resolveMes();renderMeses();bindMeses();renderCohetes();resolveHora();renderHora();bindHora();renderBarcazas();resolveTipo();renderTipos();bindTipos();renderStarlink();renderMeteo();resolveVet();renderVeterania();bindVeterania();resolveOrb();renderOrbitas();bindOrbitas();renderRetrasos();resolvePrec();renderPrecision();resolveDir();renderDirectos();renderEstados();bindDirectos();bindPrecision();renderReloj();resolveTur();renderTierra();bindTierra();resolveHito();renderHitos();bindHitos();renderPlataformas();resolveAnu();renderAnual();bindAnual();renderEmpleo();bindEmpleo();setInterval(refreshRacha,20*6e4);renderScore();startAlerts();
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
function renderScore(){const p=points(),t=(p.pred||0)+(p.quiz||0)+(p.bet||0)+(p.expert||0)+(p.streak||0)+(p.flight||0)+(p.ach||0)+(p.rapid||0)+(p.hilo||0)+(p.racha||0)+(p.ritmo||0)+(p.adonde||0)+(p.cli||0)+(p.ven||0)+(p.zon||0)+(p.mes||0)+(p.hora||0)+(p.tipo||0)+(p.vet||0)+(p.orb||0)+(p.vida||0)+(p.tur||0)+(p.hito||0)+(p.anu||0)+(p.prec||0),st=LS.get('streak',null),rn=st&&(st.last===dayKey()||st.last===dayKey(-1))?st.n:0;
  const lv=t<50?'Becario de control':t<150?'Ingeniero de lanzamiento':t<400?'Director de vuelo':'Leyenda de Starbase';
  $('#score').innerHTML=`<b>${t}</b> puntos · ${lv}${rn?` · racha de ${rn} ${rn===1?'día':'días'}`:''}`;checkAch()}
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
    <p class="mut">${tdesc(n)}</p>${learnHTML(n,true)}${n.video?`<a class="live" href="${n.video}" target="_blank" rel="noopener"><span aria-hidden="true">▶</span> Ver directo<span class="sr"> (se abre en otra pestaña)</span></a>`:''}${misBtn(n,'u')}${alertBtns(n)}${ph?credit(ph).replace('Foto:',ph===n?'Foto:':`Foto de ${esc(mname(ph))}:`):''}</div></div>`;
    const tick=()=>{const ms=new Date(n.net)-Date.now();const el=$('#cd');if(!el)return;
      if(ms<0){el.textContent='¡Despegando o ya en vuelo!';return}
      const d=Math.floor(ms/DAY),hh=Math.floor(ms%DAY/H),m=Math.floor(ms%H/6e4),sec=Math.floor(ms%6e4/1e3);
      el.textContent=`T- ${d}d ${String(hh).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`};
    tick();setInterval(tick,1000);}
  h+='<div id="alerts"></div><div id="daily"></div><div id="rlive"></div><div id="ritmo"></div><div id="hitos"></div><div id="plataformas"></div><div id="anual"></div><div id="meses"></div><div id="cohetes"></div><div id="hora"></div><div id="barcazas"></div><div id="tipos"></div><div id="starlink"></div><div id="meteo"></div><div id="veterania"></div><div id="orbitas"></div><div id="retrasos"></div><div id="precision"></div><div id="directos"></div><div id="estados"></div><div id="reloj"></div><div id="tierra"></div><div id="clientes"></div><div id="ventanas"></div><div id="zonas"></div><div id="empleo"></div><div id="logros"></div><div id="install"></div>';
  h+=`<div class="stats"><div><b>${s.total_launch_count}</b>lanzamientos totales</div><div><b>${s.successful_launches}</b>con éxito</div>
  <div><b>${s.consecutive_successful_launches}</b>éxitos seguidos</div><div><b>${s.successful_landings}</b>aterrizajes de propulsor</div>
  <div><b>${s.consecutive_successful_landings}</b>aterrizajes seguidos</div><div><b>${s.pending_launches}</b>lanzamientos pendientes</div></div>`;
  h+=`<h3 style="margin-top:22px">Siguientes lanzamientos</h3>`+ups.slice(1,8).map(l=>`<div class="card"><h3>${mname(l)}</h3><div class="mut">${fmt(l.net)}${/TBD|MON|YEAR|QUARTER/i.test(l.net_precision||'')?' (fecha aproximada)':''} · ${l.rocket} · ${l.loc||''}</div>${alertBtns(l)}${learnHTML(l)}${misBtn(l,'u')}</div>`).join('');
  $('#next').innerHTML=h;
}
// ---------- Predicciones ----------
function predictable(l){return new Date(l.net)>Date.now()&&!/TBD/i.test(l.status)&&new Date(l.net)-Date.now()<21*DAY}
// ---------- Meteo real en las predicciones (Launch Library 2: probability y weather_concerns) ----------
const WX_ES={'Cumulus Cloud Rule':'nubes de tipo cúmulo','Thick Cloud Layers Rule':'capas de nubes gruesas','Anvil Cloud Rules':'nubes de yunque de tormenta',
 'Liftoff Winds':'viento en el despegue','Flight Through Precipitation':'volar a través de lluvia','Surface Electric Fields Rule':'campos eléctricos en el suelo',
 'Upper Level Winds':'vientos en altura','Disturbed Weather Rule':'tiempo perturbado','Lightning Rule':'rayos','Lightning':'rayos','Triboelectrification Rule':'carga eléctrica por fricción',
 'Attached Anvil Clouds':'nubes de yunque cercanas','Detached Anvil Clouds':'nubes de yunque sueltas','Ground Winds':'viento en el suelo','Booster Recovery Weather':'tiempo en la zona de recuperación del propulsor',
 'Solar Activity':'actividad solar','Smoke Plumes Rule':'columnas de humo'};
const wxList=l=>(l&&l.wx||[]).map(w=>WX_ES[w]||w);
const wxCls=p=>p>=80?'ok':p>=60?'warn':'ko';
function wxStats(){// datos reales: meteo con la que despegaron los últimos lanzamientos que tenían previsión
  const v=D.previous.filter(l=>l.prob!=null);if(!v.length)return null;
  const s=v.map(l=>l.prob).sort((a,b)=>a-b),lo=v.reduce((m,l)=>l.prob<m.prob?l:m,v[0]);
  const c={},w=v.filter(l=>Array.isArray(l.wx));w.forEach(l=>wxList(l).forEach(x=>c[x]=(c[x]||0)+1));
  const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];
  return{n:v.length,med:s[Math.floor(s.length/2)],lo,top:top&&w.length?{name:top[0],c:top[1],n:w.length}:null}}
function wxHTML(l){const ws=wxStats(),wx=wxList(l);
  const ref=ws?`<div class="mut">Referencia real: en los últimos ${ws.n} lanzamientos de SpaceX con previsión, despegaron con una meteo favorable mediana del ${ws.med}% y la más baja fue del ${ws.lo.prob}% (${esc(mname(ws.lo))})${ws.top?`; lo que más preocupó: ${esc(ws.top.name)} (${ws.top.c} de ${ws.top.n})`:''}.</div>`:'';
  return `<div class="wxp" style="margin-top:8px">${l.prob!=null?`<div><b>Meteo:</b> <span class="tag ${wxCls(l.prob)}">${l.prob}% favorable</span>${wx.length?` Preocupa: ${esc(wx.join(', '))}.`:''}</div>`:
   '<div class="mut"><b>Meteo:</b> la fuente aún no da previsión para este lanzamiento; saldrá aquí en cuanto la publique.</div>'}${ref}</div>`}
function renderPredict(){
  const preds=LS.get('preds',{});
  let h=`<div class="card"><b>Cómo se juega:</b> antes de cada despegue responde a tres preguntas. Cuando el lanzamiento ocurra, comparamos con lo que pasó de verdad. Cada acierto da 10 puntos, acertar las tres da 5 de bonus, y si apuestas por un fallo y aciertas te llevas 50. Abre «Análisis de experto» en cada lanzamiento para razonar y predecir los minutos de retraso (hasta 40 puntos más).</div>`;
  h+='<div id="mystats">'+statsHTML()+'</div>';
  const list=D.upcoming.filter(predictable);
  if(!list.length)h+='<p class="mut">Ahora mismo no hay lanzamientos confirmados en las próximas tres semanas. Vuelve mañana.</p>';
  list.forEach(l=>{const p=preds[l.id]||{a:{}};const b=(l.stages||[])[0]||{};
    const qs=[['ok','¿Llegará la carga a su órbita?'],...(b.land_attempt?[['land',`¿Aterrizará el propulsor ${b.serial||''} en ${b.land_loc_name||'su zona'}?`]]:[]),['time',`¿Despegará dentro de las 24 h de la hora prevista ahora (${fmt(l.net)})?`]];
    h+=`<div class="card" data-id="${l.id}"><h3>${mname(l)}</h3><div class="mut">${l.rocket} · ${l.loc||''}${b.flight?` · vuelo nº ${b.flight} del propulsor`:''}</div>${wxHTML(l)}`+
    qs.map(([k,q])=>`<div style="margin-top:8px"><div id="q-${l.id}-${k}">${q}</div><div class="opts" role="group" aria-labelledby="q-${l.id}-${k}">${['Sí','No'].map(v=>`<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${p.a[k]===v}" class="${p.a[k]===v?'sel':''}">${v}</button>`).join('')}</div></div>`).join('')+
    `<div class="mut">${p.saved?'Predicción guardada ✔ (puedes cambiarla hasta el despegue)':'Sin predicción todavía'}</div>${expertHTML(l)}</div>`});
  const done=Object.values(preds).filter(p=>p.res);
  if(done.length)h+=`<h3>Tus resultados</h3>`+done.sort((a,b)=>b.resAt-a.resAt).map(p=>`<div class="card"><h3>${p.name}</h3>${p.wx0!=null?`<div class="mut">Meteo al predecir: ${p.wx0}% favorable</div>`:''}${p.res.map(r=>`<div>${ic(r.ok)} ${r.q}: dijiste ${r.you}, pasó ${r.real}</div>`).join('')}<b>+${p.pts} puntos</b></div>`).join('');
  h+=expertResultsHTML();
  $('#predict').innerHTML=h;
  bindExpert();bindStats();
  $('#predict').querySelectorAll('.opts button[data-k]').forEach(bt=>bt.onclick=()=>{
    const id=bt.closest('.card').dataset.id,l=D.upcoming.find(x=>x.id===id);const ps=LS.get('preds',{});
    const p=ps[id]||{a:{},name:mname(l),land:!!((l.stages||[])[0]||{}).land_attempt};p.a[bt.dataset.k]=bt.dataset.v;p.net=l.net;if(l.prob!=null)p.wx0=l.prob;p.saved=Date.now();ps[id]=p;LS.set('preds',ps);completeDaily('pred');renderPredict()});
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
  const key=mon.toISOString().slice(0,10),r=rng(key);
  return{key,title,qs:shuffle(quizQs(pool,D.previous,r),r).slice(0,10)};
}
// Preguntas con datos reales de los lanzamientos de pool (opciones sacadas de all). Cada una lleva la misión en .m
function quizQs(pool,all,r){
  const uniq=a=>[...new Set(a.filter(Boolean))];
  const serials=uniq(all.flatMap(l=>(l.stages||[]).map(s=>s.serial)).filter(s=>!/Unknown/.test(s)));
  const lands=uniq(all.flatMap(l=>(l.stages||[]).map(s=>s.land_loc_name)));
  const pads=uniq(all.map(l=>l.loc));const orbs=uniq(all.map(l=>l.orbit)).filter(o=>o!=='N/A');
  const mk=(q,right,cands)=>{const wrong=shuffle(cands.filter(c=>c!==right),r).slice(0,3);return{q,right,opts:shuffle([right,...wrong],r)}};
  const Q=[];
  pool.forEach(l=>{const b=(l.stages||[])[0]||{},m=mname(l),n0=Q.length;
    if(b.serial&&!/Unknown/.test(b.serial))Q.push(mk(`¿Qué propulsor lanzó ${m}?`,b.serial,serials));
    if(b.flight>1){const f=b.flight;Q.push(mk(`¿Qué número de vuelo hacía el propulsor en ${m}?`,String(f),[f-3,f-1,f+1,f+2,f+4].filter(x=>x>0).map(String)))}
    if(b.land_loc_name&&b.land_success)Q.push(mk(`¿Dónde aterrizó el propulsor de ${m}?`,b.land_loc_name,lands));
    if(l.loc)Q.push(mk(`¿Desde dónde despegó ${m}?`,l.loc,pads));
    const td=tdays(b.turnaround);
    if(td!=null&&td>0){const c=[td-20,td-10,td-5,td+5,td+10,td+20].filter(x=>x>0);Q.push(mk(`¿Cuántos días pasaron entre el vuelo anterior del propulsor ${b.serial} y ${m}?`,`${td} días`,c.map(x=>`${x} días`)))}
    if(b.land_success&&(DRONE.test(b.land_loc_name||'')||LZ.test(b.land_loc_name||''))){const right=DRONE.test(b.land_loc_name)?'En un barco dron en el mar':'En una plataforma en tierra';Q.push({q:`¿Cómo se recuperó el propulsor de ${m}?`,right,opts:shuffle(['En un barco dron en el mar','En una plataforma en tierra','No se recuperó (se perdió en el mar)'],r)})}
    {const dd=new Date(l.net),right=dd.toLocaleDateString('es-ES',{weekday:'long'});Q.push(mk(`¿Qué día de la semana despegó ${m}? (hora de tu dispositivo)`,right,['lunes','martes','miércoles','jueves','viernes','sábado','domingo']))}
    if(l.orbit&&l.orbit!=='N/A'&&orbs.length>2)Q.push(mk(`¿A qué órbita iba ${m}?`,orb(l.orbit),orbs.map(orb)));
    for(let i=n0;i<Q.length;i++)Q[i].m=l.id;});
  return Q;
}
function quizBoxes(){const s=$('#quiz');if(s&&!s.querySelector('#qwk'))s.innerHTML='<div id="rapid"></div><div id="hilo"></div><div id="adonde"></div><div id="qwk"></div>';return $('#qwk')}
function renderQuiz(){
  const QW=quizBoxes();if(!RP||!RP.run)renderRapid();if(!HL||!HL.run)renderHilo();if(!AD||!AD.run)renderAdonde();
  const Z=buildQuiz(),st=LS.get('quiz_'+Z.key,{ans:{}}),answered=Object.keys(st.ans).length;
  const correct=Z.qs.filter((q,i)=>st.ans[i]===q.right).length;
  let h=`<div class="card"><b>Reto semanal</b><div class="mut">${Z.title}. Cada lunes sale un reto nuevo. 10 puntos por acierto.</div>
  <div style="margin-top:6px">${answered}/${Z.qs.length} respondidas · ${correct} aciertos</div><div class="bar"><i style="width:${Z.qs.length?100*answered/Z.qs.length:0}%"></i></div></div>`;
  h+=Z.qs.map((q,i)=>{const a=st.ans[i];return `<div class="card"><div id="qz-${i}">${i+1}. ${q.q}</div><div class="opts" role="group" aria-labelledby="qz-${i}">${q.opts.map(o=>`<button type="button" data-i="${i}" data-v="${esc(o)}" ${a?'disabled':''} class="${a?(o===q.right?'right':(o===a?'wrong':'')):''}">${esc(o)}${a&&o===q.right?'<span class="sr"> (respuesta correcta)</span>':a&&o===a?'<span class="sr"> (tu respuesta, incorrecta)</span>':''}</button>`).join('')}</div>${a?`<div class="sr" role="status">${a===q.right?'Acierto':'Fallo. La correcta era '+esc(q.right)}</div>`:''}</div>`}).join('');
  if(!Z.qs.length)h+='<p class="mut">No hay datos suficientes para el reto de esta semana.</p>';
  QW.innerHTML=h;
  QW.querySelectorAll('.opts button').forEach(b=>b.onclick=()=>{const s=LS.get('quiz_'+Z.key,{ans:{}});const i=b.dataset.i;if(s.ans[i])return;
    s.ans[i]=b.dataset.v;LS.set('quiz_'+Z.key,s);if(b.dataset.v===Z.qs[i].right)addPts('quiz',10);completeDaily('quiz');renderQuiz();
    const nx=QW.querySelector(`.opts button[data-i="${+i+1}"]`)||$('#qz-'+i);if(nx&&nx.focus)nx.focus({preventScroll:false})});
}
// ---------- Reto rápido: 3 preguntas en 30 segundos ----------
const RAPID_S=30;
let RP=null;
const rapidPts=(ok,left)=>ok*5+(ok===3?5+Math.min(10,Math.floor(left/2)):0);
function rapidState(){const s=LS.get('rapid',{best:0,plays:0});if(s.d!==dayKey()){s.d=dayKey();s.today=0;s.todayPlays=0}return s}
function rapidQs(){// 3 preguntas al azar sobre 3 misiones distintas de los últimos lanzamientos
  if(!D||!D.previous||!D.previous.length)return[];const r=Math.random,seen=new Set(),out=[];
  for(const q of shuffle(quizQs(D.previous.slice(0,40),D.previous,r),r)){if(seen.has(q.m)||q.opts.length<2)continue;seen.add(q.m);out.push(q);if(out.length===3)break}
  return out.length===3?out:[]}
function renderRapid(){const el=$('#rapid');if(!el||!D)return;const s=rapidState(),ok=rapidQs().length===3;
  let h=`<div class="card rapid"><div class="kick">Reto rápido · ${RAPID_S} segundos</div>
  <p class="mut">Tres preguntas sobre misiones reales de SpaceX y ${RAPID_S} segundos para todas. 5 puntos por acierto; si aciertas las tres, 5 más y 1 punto por cada 2 segundos que te sobren (hasta 10). Puedes jugar las veces que quieras: cada día cuenta tu mejor partida, y repetir solo suma si la mejoras.</p>
  <div class="stats"><div><b>${s.today||0}</b>tu mejor hoy (de 30)</div><div><b>${s.best||0}</b>récord</div><div><b>${s.plays||0}</b>partidas jugadas</div></div>`;
  if(RP&&RP.done)h+=rapidSummary();
  h+=ok?`<div class="opts"><button type="button" class="rp-go">${RP&&RP.done?'Jugar otra vez':'Empezar (30 s)'}</button></div>`:'<p class="mut">No hay datos suficientes para el reto rápido ahora mismo.</p>';
  el.innerHTML=h+'</div>';const b=el.querySelector('.rp-go');if(b)b.onclick=rapidStart}
function rapidSummary(){const R=RP;return `<div class="rp-res" role="status"><h3>${R.ok} de 3 · +${R.pts} puntos${R.gain<R.pts?` <span class="mut">(suma ${R.gain}: ${R.gain?'mejoras tu partida de hoy':'no mejora tu mejor partida de hoy'})</span>`:''}</h3>
  ${R.timeout?'<p class="mut">Se acabó el tiempo.</p>':R.ok===3?`<p class="mut">Te sobraron ${R.left} segundos.</p>`:''}
  ${R.qs.map((q,i)=>{const a=R.ans[i],ok=a===q.right;return `<div class="rp-q">${ic(ok)} ${esc(q.q)}<br><span class="mut">${a==null?'Sin responder':'Tu respuesta: '+esc(a)}</span>${ok?'':` <span class="mut">· Correcta:</span> <b>${esc(q.right)}</b>`}</div>`}).join('')}</div>`}
function rapidStart(){const qs=rapidQs();if(qs.length<3)return;clearInterval(RP&&RP.iv);
  RP={qs,i:0,ans:{},end:Date.now()+RAPID_S*1e3,run:true,lock:false,warned:false};
  $('#rapid').innerHTML=`<div class="card rapid on"><div class="kick">Reto rápido · ${RAPID_S} segundos</div>
  <div class="rp-top"><span id="rp-n"></span><b id="rp-t" aria-hidden="true">${RAPID_S} s</b></div><div class="bar" aria-hidden="true"><i id="rp-bar" style="width:100%"></i></div>
  <div class="sr" id="rp-live" role="status" aria-live="polite"></div>
  <div id="rp-q" class="rp-qt"></div><div class="opts" id="rp-o" role="group" aria-labelledby="rp-q"></div></div>`;
  rapidShow();RP.iv=setInterval(rapidTick,200);rapidTick()}
function rapidShow(){const q=RP.qs[RP.i];$('#rp-n').textContent=`Pregunta ${RP.i+1} de 3`;$('#rp-q').textContent=q.q;
  const o=$('#rp-o');o.innerHTML=q.opts.map(v=>`<button type="button" data-v="${esc(v)}">${esc(v)}</button>`).join('');
  o.querySelectorAll('button').forEach(b=>b.onclick=()=>rapidAnswer(b));const f=o.querySelector('button');if(f&&f.focus)f.focus({preventScroll:true})}
function rapidTick(){if(!RP||!RP.run)return;const ms=Math.max(0,RP.end-Date.now()),sec=Math.ceil(ms/1e3);
  const t=$('#rp-t'),b=$('#rp-bar');if(t){t.textContent=sec+' s';t.classList.toggle('low',sec<=10)}if(b)b.style.width=(100*ms/(RAPID_S*1e3))+'%';
  if(sec<=10&&!RP.warned){RP.warned=true;const lv=$('#rp-live');if(lv)lv.textContent='Quedan 10 segundos.'}
  if(ms<=0&&!RP.lock)rapidEnd(true)}
function rapidAnswer(b){if(!RP||!RP.run||RP.lock)return;const q=RP.qs[RP.i],v=b.dataset.v,ok=v===q.right;RP.ans[RP.i]=v;RP.lock=true;RP.end+=450;// la pausa para ver la respuesta no cuenta
  $('#rp-o').querySelectorAll('button').forEach(x=>{x.disabled=true;if(x.dataset.v===q.right)x.classList.add('right');else if(x===b)x.classList.add('wrong')});
  const lv=$('#rp-live');if(lv)lv.textContent=ok?'Acierto':'Fallo. La correcta era '+q.right;
  setTimeout(()=>{if(!RP||!RP.run)return;RP.lock=false;if(RP.i<2){RP.i++;rapidShow()}else rapidEnd(false)},450)}
function rapidEnd(timeout){if(!RP||!RP.run)return;RP.run=false;clearInterval(RP.iv);
  const left=timeout?0:Math.min(RAPID_S,Math.max(0,Math.floor((RP.end-Date.now())/1e3))),ok=RP.qs.filter((q,i)=>RP.ans[i]===q.right).length,pts=rapidPts(ok,left);
  const s=rapidState(),gain=Math.max(0,pts-(s.today||0));s.today=Math.max(s.today||0,pts);s.best=Math.max(s.best||0,pts);s.plays=(s.plays||0)+1;s.todayPlays=(s.todayPlays||0)+1;LS.set('rapid',s);
  Object.assign(RP,{done:true,timeout,left,ok,pts,gain});if(gain)addPts('rapid',gain);completeDaily('rapid');
  renderRapid();const g=$('#rapid').querySelector('.rp-go');if(g&&g.focus)g.focus({preventScroll:true})}
// ---------- ¿Más o menos? Propulsores encadenados por número de vuelos (datos reales) ----------
let HL=null;
const HILO_MAX=10;// cada día cuenta la mejor racha, hasta 10 aciertos (2 puntos cada uno)
function hiloState(){const s=LS.get('hilo',{best:0,plays:0});if(s.d!==dayKey()){s.d=dayKey();s.today=0}return s}
function hiloPool(){// por propulsor: su vuelo más reciente en Launch Library 2 (número de vuelo, misión y fecha)
  if(!D||!D.previous)return[];const B={};
  for(const l of D.previous)for(const s of(l.stages||[])){const x=s.serial;if(!x||/Unknown/i.test(x)||!s.flight)continue;
    if(!B[x]||s.flight>B[x].n)B[x]={serial:x,n:s.flight,m:mname(l),net:l.net,rocket:l.rocket||''}}
  const a=Object.values(B);return new Set(a.map(b=>b.n)).size>=3?a:[]}
function hiloPick(pool,a,used){const c=pool.filter(b=>b.n!==a.n&&!used.has(b.serial));const r=c.length?c:pool.filter(b=>b.n!==a.n);return r[Math.floor(Math.random()*r.length)]}
function hiloCard(b,show){return `<div class="hl-b"><div class="hl-s">${esc(b.serial)}</div><div class="mut">${esc(b.rocket)} · último vuelo: ${esc(b.m)}, ${fmtD(b.net)}</div><div class="hl-n">${show?`<b>${b.n}</b> ${b.n===1?'vuelo':'vuelos'}`:'<b>¿?</b> vuelos'}</div></div>`}
function renderHilo(){const el=$('#hilo');if(!el||!D)return;const s=hiloState(),ok=hiloPool().length>0;
  let h=`<div class="card rapid hilo"><div class="kick">¿Más o menos?</div>
  <p class="mut">Dos propulsores reales de SpaceX: ¿el segundo ha volado más o menos veces que el primero? Si aciertas, el segundo pasa a ser el de referencia y sigues hasta fallar. 2 puntos por acierto; cada día cuenta tu mejor racha (hasta ${HILO_MAX} aciertos, 20 puntos) y repetir solo suma si la mejoras. Los vuelos son los de su último lanzamiento en Launch Library 2.</p>
  <div class="stats"><div><b>${s.today||0}</b>tu mejor racha hoy</div><div><b>${s.best||0}</b>récord</div><div><b>${s.plays||0}</b>partidas jugadas</div></div>`;
  if(HL&&HL.done)h+=`<div class="rp-res" role="status"><h3>${HL.n} ${HL.n===1?'acierto':'aciertos'} seguidos · +${HL.gain} puntos</h3><p class="mut">${HL.msg}</p></div>`;
  h+=ok?`<div class="opts"><button type="button" class="hl-go">${HL&&HL.done?'Jugar otra vez':'Empezar'}</button></div>`:'<p class="mut">No hay datos suficientes de propulsores ahora mismo.</p>';
  el.innerHTML=h+'</div>';const b=el.querySelector('.hl-go');if(b)b.onclick=hiloStart}
function hiloStart(){const pool=hiloPool();if(!pool.length)return;const a=pool[Math.floor(Math.random()*pool.length)],used=new Set([a.serial]),b=hiloPick(pool,a,used);used.add(b.serial);
  HL={pool,a,b,used,n:0,run:true,lock:false};hiloShow();completeDaily('hilo')}
function hiloShow(){$('#hilo').innerHTML=`<div class="card rapid hilo on"><div class="kick">¿Más o menos? · ${HL.n} ${HL.n===1?'acierto':'aciertos'}</div>
  <div class="hl-pair">${hiloCard(HL.a,true)}${hiloCard(HL.b,false)}</div>
  <div id="hl-q" class="rp-qt">¿${esc(HL.b.serial)} ha volado más o menos veces que ${esc(HL.a.serial)} (${HL.a.n})?</div>
  <div class="sr" id="hl-live" role="status" aria-live="polite"></div>
  <div class="opts" role="group" aria-labelledby="hl-q"><button type="button" data-v="mas">Más</button><button type="button" data-v="menos">Menos</button></div></div>`;
  const o=$('#hilo').querySelectorAll('.opts button');o.forEach(b=>b.onclick=()=>hiloAnswer(b));if(o[0]&&o[0].focus)o[0].focus({preventScroll:true})}
function hiloAnswer(btn){if(!HL||!HL.run||HL.lock)return;HL.lock=true;const{a,b}=HL,right=b.n>a.n?'mas':'menos',ok=btn.dataset.v===right;
  const card=$('#hilo').querySelectorAll('.hl-n')[1];if(card)card.innerHTML=`<b>${b.n}</b> ${b.n===1?'vuelo':'vuelos'}`;
  $('#hilo').querySelectorAll('.opts button').forEach(x=>{x.disabled=true;if(x.dataset.v===right)x.classList.add('right');else if(x===btn)x.classList.add('wrong')});
  const lv=$('#hl-live');if(lv)lv.textContent=(ok?'Acierto. ':'Fallo. ')+`${b.serial} lleva ${b.n} vuelos.`;
  setTimeout(()=>{if(!HL||!HL.run)return;if(ok){HL.n++;if(HL.n>=HILO_MAX)return hiloEnd(`¡Racha máxima de ${HILO_MAX}! ${b.serial} lleva ${b.n} vuelos.`);HL.a=b;HL.b=hiloPick(HL.pool,b,HL.used);HL.used.add(HL.b.serial);HL.lock=false;hiloShow()}
    else hiloEnd(`${b.serial} lleva ${b.n} ${b.n===1?'vuelo':'vuelos'} y ${a.serial}, ${a.n}: ${b.n>a.n?'más':'menos'}.`)},ok?700:1200)}
function hiloEnd(msg){HL.run=false;HL.done=true;HL.msg=msg;const s=hiloState(),n=Math.min(HILO_MAX,HL.n),gain=2*Math.max(0,n-(s.today||0));
  s.today=Math.max(s.today||0,n);s.best=Math.max(s.best||0,HL.n);s.plays=(s.plays||0)+1;LS.set('hilo',s);HL.gain=gain;if(gain)addPts('hilo',gain);
  renderHilo();const g=$('#hilo').querySelector('.hl-go');if(g&&g.focus)g.focus({preventScroll:true})}
// ---------- ¿Adónde va? Adivina la órbita y la plataforma de misiones reales ----------
let AD=null;
const AD_N=5;// misiones por partida; 2 preguntas cada una, 2 puntos por acierto (hasta 20 al día, cuenta la mejor partida)
const padAbbr=p=>String(p||'').replace(/^Space Launch Complex /,'SLC-').replace(/^Launch Complex /,'LC-');
const padLbl=l=>`${padAbbr(l.pad)}${l.loc?' ('+l.loc.split(',')[0]+')':''}`;
const mtShort=t=>{const s=TYPE_LEARN[t];return s?s.split(/[:.]/)[0]:(t||'')};
function adState(){const s=LS.get('adonde',{best:0,plays:0});if(s.d!==dayKey()){s.d=dayKey();s.today=0}return s}
function adPool(){if(!D||!D.previous)return[];return D.previous.filter(l=>l.orbit&&l.orbit!=='N/A'&&l.pad&&!/^Unknown/i.test(l.pad)&&l.loc)}
function adOpts(){const all=(D.previous||[]).concat(D.upcoming||[]),u=a=>[...new Set(a)];
  return{orbs:u(all.map(l=>l.orbit).filter(o=>o&&o!=='N/A')),pads:u(adPool().map(padLbl))}}
function adRounds(){const pool=adPool(),O=adOpts();if(pool.length<AD_N||O.orbs.length<3||O.pads.length<2)return[];
  const r=Math.random,out=[];let sl=0;
  for(const l of shuffle(pool.slice(),r)){const isSl=/starlink/i.test(l.name||'');if(isSl&&sl>=2)continue;if(isSl)sl++;out.push(l);if(out.length===AD_N)break}
  if(out.length<AD_N)return[];
  return out.map(l=>{const ro=orb(l.orbit),oo=shuffle([ro,...shuffle(O.orbs.filter(o=>o!==l.orbit).map(orb),r).slice(0,3)],r),rp=padLbl(l);
    return{l,qs:[{k:'orb',q:`¿A qué órbita fue ${mname(l)}?`,right:ro,opts:oo},{k:'pad',q:`¿Desde qué plataforma despegó ${mname(l)}?`,right:rp,opts:shuffle(O.pads.slice(),r)}]}})}
function renderAdonde(){const el=$('#adonde');if(!el||!D)return;const s=adState(),ok=adRounds().length===AD_N;
  let h=`<div class="card rapid adonde"><div class="kick">¿Adónde va?</div>
  <p class="mut">${AD_N} misiones reales recientes de SpaceX. Con las pistas (cohete, tipo de misión, cliente y fecha), adivina a qué órbita fue cada una y desde qué plataforma despegó. 2 puntos por acierto; cada día cuenta tu mejor partida (hasta ${AD_N*4} puntos) y repetir solo suma si la mejoras. Las respuestas son las de Launch Library 2.</p>
  <div class="stats"><div><b>${s.today||0}</b>tu mejor hoy (de ${AD_N*4})</div><div><b>${s.best||0}</b>récord</div><div><b>${s.plays||0}</b>partidas jugadas</div></div>`;
  if(AD&&AD.done)h+=adSummary();
  h+=ok?`<div class="opts"><button type="button" class="ad-go">${AD&&AD.done?'Jugar otra vez':'Empezar'}</button></div>`:'<p class="mut">No hay datos suficientes de órbitas y plataformas ahora mismo.</p>';
  el.innerHTML=h+'</div>';const b=el.querySelector('.ad-go');if(b)b.onclick=adStart}
function adSummary(){const A=AD;return `<div class="rp-res" role="status"><h3>${A.ok} de ${AD_N*2} · +${A.pts} puntos${A.gain<A.pts?` <span class="mut">(suma ${A.gain}: ${A.gain?'mejoras tu partida de hoy':'no mejora tu mejor partida de hoy'})</span>`:''}</h3>
  ${A.rs.map((R,i)=>{const a=A.ans[i]||[];return `<div class="rp-q"><b>${esc(mname(R.l))}</b> <span class="mut">${fmtD(R.l.net)}</span><br>${R.qs.map((q,j)=>`${ic(a[j]===q.right)} ${q.k==='orb'?'Órbita':'Plataforma'}: <b>${esc(q.right)}</b>${a[j]===q.right?'':` <span class="mut">(dijiste ${esc(a[j]||'nada')})</span>`}`).join('<br>')}</div>`}).join('')}</div>`}
function adStart(){const rs=adRounds();if(rs.length<AD_N)return;AD={rs,i:0,j:0,ans:{},run:true,lock:false};adShow();completeDaily('adonde')}
function adShow(){const R=AD.rs[AD.i],l=R.l,q=R.qs[AD.j],cu=(l.cust||[]).filter(Boolean);
  $('#adonde').innerHTML=`<div class="card rapid adonde on"><div class="kick">¿Adónde va? · misión ${AD.i+1} de ${AD_N}</div>
  <div class="hl-b"><div class="hl-s">${esc(mname(l))}</div><div class="mut">${esc(l.rocket||'')} · ${fmtD(l.net)}${l.mtype?' · '+esc(mtShort(l.mtype)):''}${cu.length?' · Cliente: '+cu.map(esc).join(', '):''}</div>
  ${AD.j?`<div class="mut">Órbita: ${esc(R.qs[0].right)}</div>`:''}</div>
  <div id="ad-q" class="rp-qt">${esc(q.q)}</div><div class="sr" id="ad-live" role="status" aria-live="polite"></div>
  <div class="opts" role="group" aria-labelledby="ad-q">${q.opts.map(v=>`<button type="button" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div><div id="ad-why"></div></div>`;
  const o=$('#adonde').querySelectorAll('.opts button');o.forEach(b=>b.onclick=()=>adAnswer(b));if(o[0]&&o[0].focus)o[0].focus({preventScroll:true})}
function adAnswer(btn){if(!AD||!AD.run||AD.lock)return;AD.lock=true;const R=AD.rs[AD.i],q=R.qs[AD.j],v=btn.dataset.v,ok=v===q.right,l=R.l;
  (AD.ans[AD.i]||(AD.ans[AD.i]=[]))[AD.j]=v;
  $('#adonde').querySelectorAll('.opts button').forEach(x=>{x.disabled=true;if(x.dataset.v===q.right)x.classList.add('right');else if(x===btn)x.classList.add('wrong')});
  const lv=$('#ad-live');if(lv)lv.textContent=ok?'Acierto':'Fallo. La correcta era '+q.right;
  const all=D.previous||[];let why='';
  if(q.k==='orb'){const n=all.filter(x=>x.orbit===l.orbit).length,ol=ORB_LEARN[l.orbit]||'';why=`${ol?esc(ol)+' ':''}De los últimos ${all.length} lanzamientos de SpaceX, ${n} fueron a esta órbita.`}
  else{const n=adPool().filter(x=>padLbl(x)===q.right).length;why=`${esc(l.pad)}, ${esc(l.loc)}. De los últimos ${all.length} lanzamientos, ${n} salieron de aquí.`}
  const last=AD.i===AD_N-1&&AD.j===1;
  $('#ad-why').innerHTML=`<p class="mut">${ic(ok)} ${why}</p><div class="opts"><button type="button" class="ad-nx">${last?'Ver resultado':'Siguiente'}</button></div>`;
  const nx=$('#adonde').querySelector('.ad-nx');if(nx){nx.onclick=()=>{AD.lock=false;if(last)return adEnd();if(AD.j===0)AD.j=1;else{AD.i++;AD.j=0}adShow()};if(nx.focus)nx.focus({preventScroll:true})}}
function adEnd(){if(!AD||!AD.run)return;AD.run=false;AD.done=true;let ok=0;AD.rs.forEach((R,i)=>R.qs.forEach((q,j)=>{if((AD.ans[i]||[])[j]===q.right)ok++}));
  const pts=2*ok,s=adState(),gain=Math.max(0,pts-(s.today||0));s.today=Math.max(s.today||0,pts);s.best=Math.max(s.best||0,pts);s.plays=(s.plays||0)+1;LS.set('adonde',s);
  Object.assign(AD,{ok,pts,gain});if(gain)addPts('adonde',gain);renderAdonde();const g=$('#adonde').querySelector('.ad-go');if(g&&g.focus)g.focus({preventScroll:true})}
// ---------- Propulsores ----------
let fleetSort='flights';
// ---------- Comparar dos propulsores ----------
let CMP=[null,null];
function boosterSum(serial){
  const h=boosterHist(serial);if(!h.length)return null;
  const last=h.at(-1),flights=Math.max(...h.map(x=>x.s.flight||0),last.s.booster_flights||0);
  const tds=h.map(x=>tdays(x.s.turnaround)).filter(x=>x!=null&&x>0);
  const zones=[...new Set(h.filter(x=>x.s.land_success&&x.s.land_loc_name&&!/Unknown/.test(x.s.land_loc_name)).map(x=>x.s.land_loc_name))];
  const next=D.upcoming.find(l=>(l.stages||[]).some(s=>s.serial===serial));
  return{serial,flights,landings:last.s.booster_landings??null,avg:tds.length?Math.round(tds.reduce((a,b)=>a+b,0)/tds.length):null,best:tds.length?Math.min(...tds):null,
    zones,inData:h.length,last,next,since:Math.floor((Date.now()-new Date(last.l.net))/DAY)};
}
function cmpHTML(rows){
  if(rows.length<2)return'';
  const ser=rows.map(r=>r.serial);
  if(!ser.includes(CMP[0]))CMP[0]=ser[0];
  if(!ser.includes(CMP[1])||CMP[1]===CMP[0])CMP[1]=ser.find(x=>x!==CMP[0]);
  const A=boosterSum(CMP[0]),B=boosterSum(CMP[1]);if(!A||!B)return'';
  const opt=i=>`<select data-cmp="${i}" id="cmp-${i}" aria-label="Propulsor ${i+1} a comparar">${ser.map(x=>`<option value="${esc(x)}"${x===CMP[i]?' selected':''}>${esc(x)}</option>`).join('')}</select>`;
  // win: 1 si gana A, -1 si gana B, 0 empate o sin dato
  const cmpN=(a,b,hi)=>a==null||b==null||a===b?0:((a>b)===hi?1:-1);
  const cell=(v,w,side)=>`<td${w===side?' class="ok"':''}>${v}${w===side?' <span aria-label="mejor">★</span>':''}</td>`;
  const row=(lbl,va,vb,w)=>`<tr><th scope="row">${lbl}</th>${cell(va,w,1)}${cell(vb,w,-1)}</tr>`;
  const lastT=x=>`${fmtD(x.last.l.net)}<div class="mut">${esc(mname(x.last.l))} · hace ${x.since} días</div>`;
  const nextT=x=>x.next?`${esc(mname(x.next))}<div class="mut">${fmtD(x.next.net)}</div>`:'<span class="mut">Sin misión anunciada</span>';
  const zT=x=>x.zones.length?x.zones.map(esc).join(', '):'<span class="mut">—</span>';
  return `<div class="card" id="cmp"><b>Comparar dos propulsores</b><div class="mut">Elige dos primeras etapas y míralas lado a lado. La estrella marca cuál va por delante en cada dato.</div>
  <div class="opts" style="align-items:center">${opt(0)} <span aria-hidden="true">frente a</span> ${opt(1)}</div>
  <div class="tscroll"><table><caption class="sr">Comparación entre ${esc(A.serial)} y ${esc(B.serial)}</caption><tr><th scope="col">Dato</th><th scope="col">${esc(A.serial)}</th><th scope="col">${esc(B.serial)}</th></tr>
  ${row('Vuelos totales',A.flights,B.flights,cmpN(A.flights,B.flights,true))}
  ${row('Aterrizajes con éxito',A.landings??'—',B.landings??'—',cmpN(A.landings,B.landings,true))}
  ${row('Días medios en tierra entre vuelos',A.avg!=null?A.avg+' d':'—',B.avg!=null?B.avg+' d':'—',cmpN(A.avg,B.avg,false))}
  ${row('Récord de días en tierra',A.best!=null?A.best+' d':'—',B.best!=null?B.best+' d':'—',cmpN(A.best,B.best,false))}
  ${row('Zonas de aterrizaje usadas',zT(A),zT(B),0)}
  ${row('Último vuelo',lastT(A),lastT(B),cmpN(+new Date(A.last.l.net),+new Date(B.last.l.net),true))}
  ${row('Próxima misión',nextT(A),nextT(B),0)}
  </table></div>
  <p class="mut">Totales de vuelos y aterrizajes según Launch Library 2; días en tierra y zonas, de sus vuelos entre los últimos ${D.previous.length} lanzamientos (${esc(A.serial)}: ${A.inData}, ${esc(B.serial)}: ${B.inData}).</p></div>`;
}
// ---------- Carrera por el récord de la flota ----------
function raceData(){
  const okS=x=>x&&!/Unknown/i.test(x),B={};
  for(const l of [...D.previous].sort((a,b)=>new Date(a.net)-new Date(b.net)))for(const s of(l.stages||[])){if(!okS(s.serial)||!s.flight)continue;
    const b=B[s.serial]||(B[s.serial]={serial:s.serial,flights:0,rocket:l.rocket||''});
    if(s.flight>=b.flights){b.flights=s.flight;b.lost=s.land_attempt===false||s.land_success===false;b.last=l}}
  const nx={};
  for(const l of [...D.upcoming].sort((a,b)=>new Date(a.net)-new Date(b.net)))for(const s of(l.stages||[])){if(!okS(s.serial))continue;
    const b=B[s.serial]||(B[s.serial]={serial:s.serial,flights:s.booster_flights||0,rocket:l.rocket||'',upOnly:true});
    if(b.upOnly)b.flights=Math.max(b.flights,s.booster_flights||0);
    if(!nx[s.serial]&&s.flight){nx[s.serial]=1;b.next=l;b.nextFlight=s.flight}}
  const all=Object.values(B).filter(b=>b.flights>0);if(!all.length)return null;
  const rec=Math.max(...all.map(b=>b.flights)),holders=all.filter(b=>b.flights===rec);
  const act=all.filter(b=>!b.lost||b.next).sort((a,b)=>b.flights-a.flights||(a.next?new Date(a.next.net):Infinity)-(b.next?new Date(b.next.net):Infinity));
  const alerts=act.filter(b=>b.next&&b.nextFlight>=rec).sort((a,b)=>new Date(a.next.net)-new Date(b.next.net));
  return{rec,holders,act,alerts,lost:all.filter(b=>b.lost&&!b.next).length};
}
function raceHTML(){
  const r=raceData();if(!r)return'';const{rec,holders,act,alerts}=r,hs=holders.map(h=>h.serial).join(' y ');
  const al=alerts.map(b=>{const own=holders.some(h=>h.serial===b.serial),t=b.nextFlight>rec?(own?'ampliará el récord':'batirá el récord'):'igualará el récord';
    return `<div style="margin-top:6px"><span role="img" aria-label="Aviso">🏁</span> <b>${esc(b.serial)}</b> ${t} con su vuelo nº ${b.nextFlight} en ${esc(mname(b.next))}, ${fmtD(b.next.net)}</div>`}).join('');
  const top=act.slice(0,10);
  return `<div class="card"><b>Carrera por el récord de la flota</b>
  <div class="mut">El más veterano en los datos es ${esc(hs)}, con ${rec} vuelos. Cuántos vuelos le faltan a cada propulsor en activo para igualarlo o batirlo.</div>
  ${al||`<div class="mut" style="margin-top:6px">Ninguna misión prevista con propulsor asignado iguala ni bate ahora mismo el récord.</div>`}
  <div class="tscroll"><table><caption class="sr">Vuelos que le faltan a cada propulsor para el récord de ${rec}</caption><tr><th scope="col">Propulsor</th><th scope="col">Vuelos</th><th scope="col">Para igualar</th><th scope="col">Próxima misión</th></tr>
  ${top.map(b=>{const f=rec-b.flights;return `<tr><td><b>${esc(b.serial)}</b><div class="mut">${esc(b.rocket)}</div></td><td>${b.flights}<div class="bar"><i style="width:${100*b.flights/rec}%"></i></div></td><td>${f===0?'Tiene el récord':`${f} ${f===1?'vuelo':'vuelos'}`}</td><td>${b.next?`${esc(mname(b.next))} (vuelo nº ${b.nextFlight})<div class="mut">${fmtD(b.next.net)}</div>`:'—'}</td></tr>`}).join('')}</table></div>
  <p class="mut">Vuelos según Launch Library 2 de los propulsores de los últimos ${D.previous.length} lanzamientos y de los próximos con propulsor asignado; en activo quiere decir que su último vuelo no acabó en pérdida o que ya tiene otra misión. Puede haber propulsores retirados fuera de estos datos.</p></div>`;
}
function renderFleet(){
  const m={};
  [...D.previous].reverse().forEach(l=>(l.stages||[]).forEach(s=>{if(!s.serial||/Unknown/.test(s.serial))return;
    const b=m[s.serial]||(m[s.serial]={serial:s.serial,flights:0,landings:0,last:null,missions:[]});
    b.flights=Math.max(b.flights,s.flight||0);b.landings=Math.max(b.landings,(s.booster_landings||0)+(s.land_success?1:0));b.last=l.net;b.missions.push(mname(l))}));
  D.upcoming.forEach(l=>(l.stages||[]).forEach(s=>{const b=m[s.serial];if(b&&!b.next)b.next=l}));
  const rows=Object.values(m).sort((a,b)=>fleetSort==='flights'?b.flights-a.flights:new Date(b.last)-new Date(a.last));
  const max=Math.max(...rows.map(r=>r.flights),1);
  $('#fleet').innerHTML=`<div class="card"><b>Flota de propulsores</b><div class="mut">Las primeras etapas que han volado en los últimos ${D.previous.length} lanzamientos. Pulsa una columna para ordenar y un propulsor para ver su ficha y apostar si volverá a volar.</div></div>${betsHTML()}${cmpHTML(rows)}${raceHTML()}${vidaHTML()}
  <div class="tscroll"><table><caption class="sr">Flota de propulsores, ordenada por ${fleetSort==='flights'?'número de vuelos':'último vuelo'}</caption><tr><th scope="col">Propulsor</th><th scope="col" aria-sort="${fleetSort==='flights'?'descending':'none'}"><button type="button" class="lnk" data-s="flights">Vuelos</button></th><th scope="col" aria-sort="${fleetSort==='last'?'descending':'none'}"><button type="button" class="lnk" data-s="last">Último vuelo</button></th><th scope="col">Próximo</th></tr>
  ${rows.map(r=>`<tr class="clic" data-serial="${r.serial}"><td><button type="button" class="lnk" data-open="${r.serial}" aria-label="Abrir la ficha del propulsor ${r.serial}"><b>${r.serial}</b> <span class="mut" aria-hidden="true">ficha ›</span></button></td><td>${r.flights}<div class="bar"><i style="width:${100*r.flights/max}%"></i></div></td><td>${fmtD(r.last)}<div class="mut">${r.missions.at(-1)}</div></td><td>${r.next?`${mname(r.next)}<div class="mut">${fmtD(r.next.net)}</div>`:'—'}</td></tr>`).join('')}</table></div>`;
  $('#fleet').querySelectorAll('button[data-s]').forEach(t=>t.onclick=()=>{fleetSort=t.dataset.s;renderFleet();const f=$('#fleet').querySelector(`button[data-s="${t.dataset.s}"]`);f&&f.focus()});
  $('#fleet').querySelectorAll('select[data-cmp]').forEach(sel=>sel.onchange=()=>{CMP[+sel.dataset.cmp]=sel.value;renderFleet();const f=$('#fleet').querySelector(`select[data-cmp="${sel.dataset.cmp}"]`);f&&f.focus()});
  $('#fleet').querySelectorAll('tr[data-serial]').forEach(t=>t.onclick=e=>{if(e.target.closest('button[data-s]'))return;openBooster(t.dataset.serial)});
}
// ---------- Mapa ----------
let mapDone=false,mapObj=null;
const LZ_T={ASDS:'Barcaza autónoma en el mar',RTLS:'Vuelta a tierra, junto a la plataforma',Ocean:'Amerizaje controlado en el mar',EXP:'Sin recuperación: la etapa se pierde en el mar'};
const lzLabel=t=>LZ_T[t]||t||'Tipo no indicado';
function landZones(){const Z={},LZD=D.lzones||{},pid=new Set(D.previous.map(l=>l.id));
  [...D.previous.map(l=>({l,up:0})),...D.upcoming.filter(l=>!pid.has(l.id)).map(l=>({l,up:1}))].forEach(({l,up})=>(l.stages||[]).forEach(s=>{const k=s.land_loc;
    if(!k||!LZD[k]||s.land_attempt===false&&s.land_type!=='EXP')return;
    const z=Z[k]||(Z[k]={k,...LZD[k],done:0,okR:0,up:0,last:null,next:null});
    if(up){z.up++;if(!z.next||new Date(l.net)<new Date(z.next.net))z.next=l}
    else{z.done++;if(s.land_success)z.okR++;if(!z.last||new Date(l.net)>new Date(z.last.net))z.last=l}}));
  return Object.values(Z).sort((a,b)=>(b.done+b.up)-(a.done+a.up))}
function lzInfo(z){const rec=z.type!=='EXP';
  return `${esc(lzLabel(z.type))}${z.loc?' · '+esc(z.loc):''}<br>${z.done} usos recientes${rec&&z.done?` (${z.okR} con éxito)`:''} · ${z.up} próximos`+
   (rec&&z.att?`<br>Historial total: ${z.ok} de ${z.att} aterrizajes con éxito`:'')+
   (z.last?`<br>Último: ${esc(mname(z.last))} (${fmtD(z.last.net)})`:'')+(z.next?`<br>Siguiente: ${esc(mname(z.next))} (${fmtD(z.next.net)})`:'')+
   (z.active===false?'<br>Ya no está en servicio':'')}
function drawMap(){if(mapDone)return;mapDone=true;
  const map=mapObj=L.map('mapdiv').setView([31,-100],3);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'© OpenStreetMap, © CARTO'}).addTo(map);
  const pads={};[...D.previous.map(l=>({...l,up:0})),...D.upcoming.map(l=>({...l,up:1}))].forEach(l=>{if(l.lat==null)return;
    const k=l.pad;const p=pads[k]||(pads[k]={pad:l.pad,loc:l.loc,lat:l.lat,lon:l.lon,done:0,up:0});l.up?p.up++:p.done++});
  const gP=L.layerGroup().addTo(map),gZ=L.layerGroup().addTo(map);
  Object.values(pads).forEach(p=>L.circleMarker([p.lat,p.lon],{radius:6+Math.sqrt(p.done+p.up)*2,color:'#4fb3ff',fillColor:'#8a7dff',fillOpacity:.5,weight:2}).addTo(gP).bindPopup(`<b>Plataforma ${esc(p.pad)}</b><br>${esc(p.loc)}<br>${p.done} recientes · ${p.up} próximos`));
  const zs=landZones(),land=zs.filter(z=>z.lat!=null&&z.lon!=null),sea=zs.filter(z=>z.lat==null||z.lon==null);
  land.forEach(z=>L.circleMarker([z.lat,z.lon],{radius:5+Math.sqrt(z.done+z.up)*1.6,color:'#4fe3a1',fillColor:'#4fe3a1',fillOpacity:.35,weight:2,dashArray:'3 3'}).addTo(gZ).bindPopup(`<b>Zona de aterrizaje ${esc(z.k)}</b> · ${esc(z.name)}<br>${lzInfo(z)}`));
  L.control.layers(null,{'<span style="color:#8a7dff">●</span> Plataformas de lanzamiento':gP,'<span style="color:#4fe3a1">●</span> Zonas de aterrizaje en tierra':gZ},{collapsed:false}).addTo(map);
  const card=z=>`<div class="card"><b>${esc(z.name)}</b>${z.k!==z.name?` <span class="mut">(${esc(z.k)})</span>`:''}<div class="mut">${lzInfo(z)}</div></div>`;
  $('#maplist').innerHTML=padListHTML()+
   (land.length?`<h3>Zonas de aterrizaje en tierra</h3><p class="mut">Los propulsores que vuelven a tierra aterrizan aquí, a pocos kilómetros de donde despegaron (en verde en el mapa).</p>`+land.map(card).join(''):'')+
   (sea.length?`<h3>Aterrizajes en el mar</h3><p class="mut">Las barcazas autónomas se colocan en cada misión a cientos de kilómetros de la costa, según la trayectoria, así que Launch Library 2 no les da una posición fija y no salen en el mapa.</p>`+sea.map(card).join(''):'')+
   `<p class="mut">Usos recientes: de los últimos ${D.previous.length} lanzamientos; próximos: de los ${D.upcoming.length} siguientes. Historial total según Launch Library 2.</p>`;
}
// ---------- Ritmo de cada plataforma ----------
// Con los lanzamientos reales de data.json (Launch Library 2): días entre lanzamientos desde la misma plataforma, récord de rapidez
// en los datos y si el siguiente previsto lo batiría si sale a su hora. Solo lectura: no toca puntuaciones.
function padStats(){const P={},pid=new Set(D.previous.map(l=>l.id)),now=Date.now();
  const ok=l=>l.pad&&!/^Unknown/i.test(l.pad)&&!isNaN(new Date(l.net));
  D.previous.filter(ok).forEach(l=>{(P[l.pad]||(P[l.pad]={pad:l.pad,loc:l.loc,past:[],next:[]})).past.push(l)});
  D.upcoming.filter(l=>ok(l)&&!pid.has(l.id)&&new Date(l.net)>now-3*H).forEach(l=>{(P[l.pad]||(P[l.pad]={pad:l.pad,loc:l.loc,past:[],next:[]})).next.push(l)});
  return Object.values(P).map(p=>{const T=l=>new Date(l.net).getTime();p.past.sort((a,b)=>T(a)-T(b));p.next.sort((a,b)=>T(a)-T(b));
    const g=[];for(let i=1;i<p.past.length;i++)g.push({ms:T(p.past[i])-T(p.past[i-1]),a:p.past[i-1],b:p.past[i]});
    const s=g.map(x=>x.ms).sort((a,b)=>a-b);p.gaps=g;p.med=s.length?s[Math.floor((s.length-1)/2)]:null;p.rec=g.length?g.reduce((m,x)=>x.ms<m.ms?x:m):null;
    p.last=p.past[p.past.length-1]||null;p.nx=p.next[0]||null;p.since=p.last?now-T(p.last):null;
    p.precise=p.nx&&/^(SEC|MIN|HOUR)$/i.test(p.nx.net_precision||'');p.gapNx=p.nx&&p.last?T(p.nx)-T(p.last):null;
    p.beat=!!(p.precise&&p.rec&&p.gapNx!=null&&p.gapNx>0&&p.gapNx<p.rec.ms);return p}).sort((a,b)=>b.past.length-a.past.length||b.next.length-a.next.length)}
function padHTML(p){const d=ms=>rtHrs(ms),n=p.past.length;
  let h=`<div class="card pad"><b>${esc(p.pad)}</b><div class="mut">${esc(p.loc||'')} · ${n} ${n===1?'lanzamiento reciente':'lanzamientos recientes'} · ${p.next.length} ${p.next.length===1?'próximo':'próximos'}</div>`;
  if(p.med!=null)h+=`<div class="stats"><div><b>${d(p.med)}</b>mediana entre lanzamientos desde aquí</div>${p.rec?`<div><b>${d(p.rec.ms)}</b>récord en los datos</div>`:''}${p.since!=null?`<div><b>${d(p.since)}</b>desde el último</div>`:''}</div>`;
  if(p.rec)h+=`<p class="mut">Récord: de ${esc(mname(p.rec.a))} (${fmtD(p.rec.a.net)}) a ${esc(mname(p.rec.b))} (${fmtD(p.rec.b.net)}).</p>`;
  if(p.last)h+=`<p class="mut">Último: ${esc(mname(p.last))} (${esc(p.last.rocket||'')}, ${fmtD(p.last.net)}).</p>`;
  if(p.nx)h+=`<p class="mut">Siguiente: ${esc(mname(p.nx))}, ${p.precise?fmt(p.nx.net):'fecha aún sin hora fijada ('+fmtD(p.nx.net)+')'}${p.precise&&p.gapNx!=null&&p.gapNx>0?`, ${d(p.gapNx)} después del último`:''}.</p>`;
  if(p.beat)h+=`<p><span aria-hidden="true">🏁</span> <b>Si despega a su hora, batirá el récord de rapidez de esta plataforma en los datos</b> (${d(p.gapNx)} frente a ${d(p.rec.ms)}).</p>`;
  return h+'</div>'}
function padListHTML(){const S=padStats();if(!S.length)return '';
  return `<h3>Plataformas de lanzamiento</h3><p class="mut">Cada plataforma necesita días para reparar, limpiar y preparar el siguiente cohete. Aquí ves cada cuánto despega SpaceX desde cada una, con los últimos ${D.previous.length} lanzamientos de Launch Library 2.</p>`+S.map(padHTML).join('')}
// ---------- Historial ----------
function renderLog(){
  $('#log').innerHTML=fallosHTML()+D.previous.map(l=>{const b=(l.stages||[])[0]||{};const ok=l.status==='Success';
    return `<div class="card row">${l.img?`<figure class="ph"><img loading="lazy" src="${esc(l.img)}" alt="">${credit(l)}</figure>`:''}<div><h3>${ic(ok,'Éxito','Fallo')} ${mname(l)}</h3>
    <div class="mut">${fmt(l.net)} · ${l.rocket} · ${l.loc||''}</div>
    <div>${l.orbit?`<span class="tag">${orb(l.orbit)}</span>`:''}${b.serial&&!/Unknown/.test(b.serial)?`<span class="tag">${b.serial} · vuelo ${b.flight}</span>`:''}
    ${b.land_attempt?`<span class="tag ${b.land_success?'ok':'ko'}">${b.land_success?'Aterrizó':'No aterrizó'} ${b.land_loc?'en '+b.land_loc:''}</span>`:''}</div>
    ${l.fail?`<div class="ko">${l.fail}</div>`:''}${learnHTML(l)}${misBtn(l,'p')}</div></div>`}).join('');
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
// «Fórmate»: la página oficial de una misión y, de vez en cuando (1 de cada 3), las ofertas reales de trabajo de SpaceX.
function formateJobs(){const J=D.jobs;if(!J||!J.total)return null;
  const locs=(J.locs||[]).slice(0,3).map(([n,c])=>`${n} (${c})`),r=(J.recent||[])[0];
  return {t:'Fórmate',f:'jobs',m:`SpaceX tiene ahora mismo ${J.total.toLocaleString('es-ES')} ofertas de trabajo abiertas${locs.length?`, sobre todo en ${locs.length>1?locs.slice(0,-1).join(', ')+' y '+locs.at(-1):locs[0]}`:''}${J.intern?`, y ${J.intern} son de prácticas`:''}.${r?` La más reciente: «${r.t}»${r.loc?` en ${r.loc}`:''}.`:''} ¿Te ves trabajando en cohetes? Mira qué piden y qué estudiar para llegar.`,url:J.url||'https://www.spacex.com/careers/',btn:'Ver ofertas de SpaceX',k:'learn'}}
function formateMision(){const now=Date.now();
  const u=D.upcoming.find(l=>l.info&&new Date(l.net)>now),p=D.previous.find(l=>l.info);
  if(u)return {t:'Fórmate',f:'mision',m:`${mname(u)} despega ${fmt(u.net)}.${u.orbit&&u.orbit!=='N/A'?` Órbita de destino: ${orb(u.orbit)}.`:''} Lee su página oficial en spacex.com y llega a tus predicciones con información de primera mano.`,url:u.info,btn:'Ver la página de la misión',k:'learn'};
  if(p)return {t:'Fórmate',f:'mision',m:`Repasa la página oficial de ${mname(p)} en spacex.com${p.orbit&&p.orbit!=='N/A'?` (fue a esta órbita: ${orb(p.orbit)})`:''}. Entender misiones reales es la mejor forma de acertar las siguientes.`,url:p.info,btn:'Ver la página de la misión',k:'learn'};
  const o=D.previous.find(l=>l.orbit&&l.orbit!=='LEO'&&l.orbit!=='N/A');
  return o?{t:'Fórmate',f:'orbita',m:`${mname(o)} fue a esta órbita: ${orb(o.orbit)}. ¿Sabes por qué no todas las misiones van a la misma órbita? Aprende cómo funciona y vuelve a por el reto.`,url:'https://es.wikipedia.org/wiki/%C3%93rbita',btn:'Aprender (Wikipedia)',k:'learn'}:null}
function formate(){const n=LS.get('formate_n',0);return (n%3===2&&formateJobs())||formateMision()||formateJobs()}
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
  if(rapidQs().length===3){const rs=rapidState();R.push({t:'Reto rápido',m:`Tres preguntas sobre misiones reales de SpaceX en 30 segundos. ${rs.best?`Tu récord es de ${rs.best} puntos. ¿Lo superas?`:'Hasta 30 puntos si las aciertas todas rápido.'}`,tab:'quiz',btn:'Jugar 30 segundos',k:'rapid'});}
  if(hiloPool().length){const hs=hiloState();R.push({t:'¿Más o menos?',m:`¿Qué propulsor de SpaceX ha volado más veces? Encadena aciertos con los vuelos reales de cada uno. ${hs.best?`Tu récord es de ${hs.best} seguidos. ¿Lo superas?`:'Hasta 20 puntos al día.'}`,tab:'quiz',btn:'Jugar a ¿Más o menos?',k:'hilo'});}
  if(adRounds().length===AD_N){const as=adState();R.push({t:'¿Adónde va?',m:`¿Sabrías decir a qué órbita fue cada misión real de SpaceX y desde qué plataforma despegó? ${as.best?`Tu récord es de ${as.best} puntos. ¿Lo superas?`:`Hasta ${AD_N*4} puntos al día.`}`,tab:'quiz',btn:'Jugar a ¿Adónde va?',k:'adonde'});}
  {const m=fdMissions()[0];if(m)R.push({t:'Modo director de vuelo',m:`Dirige la cuenta atrás real de ${mname(m)}: pulsa en el momento justo de cada paso, de la carga de combustible a la separación de etapas${fdSteps(m).some(s=>s.ids.includes(19))?' y el aterrizaje':''}. Hasta 50 puntos.`,tab:'flight',btn:'Dirigir la cuenta atrás',k:'flight'});}
  const fl=D.previous.flatMap(l=>(l.stages||[]).map(s=>({...s,l}))).filter(s=>s.flight).sort((a,b)=>b.flight-a.flight)[0];
  if(fl)R.push({t:'Récord de reutilización',m:`El propulsor ${fl.serial} ya lleva ${fl.flight} vuelos. Antes los cohetes se tiraban tras un solo uso. ¿Sabrías decir cuál es el siguiente en llegar a esa cifra?`,tab:'fleet',btn:'Ver la flota',k:'fleet'});
  {const bs=LS.get('bets',{});const cand=D.previous.flatMap(l=>(l.stages||[]).map(s=>s.serial)).find(x=>{if(!x||/Unknown/.test(x)||(bs[x]&&!bs[x].res))return false;const u=boosterHist(x).at(-1);return u&&u.s.land_attempt!==false&&u.s.land_success!==false});
   if(cand)R.push({t:'¿Volverá a volar?',m:`Abre la ficha del propulsor ${cand}: mira cuántos días suele pasar en tierra entre vuelos y apuesta si volverá a despegar en los próximos 30 días. Se resuelve solo con los datos reales.`,tab:'fleet',btn:'Ver propulsores',k:'bet'});}
  const s=D.stats;if(s&&s.consecutive_successful_landings!=null){const W=rbWeek(),w=(LS.get('rbet',{})[W.k]||{}).bets||{},libre=Date.now()<W.close&&(!w.land||!w.launch);R.push({t:'Racha en directo',m:`SpaceX lleva ${s.consecutive_successful_landings} aterrizajes seguidos sin fallar y ${s.consecutive_successful_launches} lanzamientos seguidos con éxito. ${libre?`¿Seguirá la racha el domingo? Apuesta antes del viernes: «No» da ${RB_PTS.no} puntos si se rompe.`:'Sigue el contador en directo en Próximo.'}`,tab:'next',btn:libre?'Apostar por la racha':'Ver la racha',k:libre?'racha':null,sel:'#rlive'});}
  {const I=rtInfo(),W=rtWeek();if(I){const libre=Date.now()<W.close&&!LS.get('ritmo',{})[W.k];R.push({t:'Ritmo de lanzamientos',m:`SpaceX ha lanzado ${I.l30} cohetes en los últimos 30 días y esta semana ${I.thisW.length===1?'va 1':'van '+I.thisW.length}. ${libre?`¿Cuántos habrá hasta el domingo? Apuesta antes del jueves: el número exacto da ${RT_PTS.exact} puntos.`:'Mira el récord de cadencia y cómo va la semana.'}`,tab:'next',btn:libre?'Apostar por el ritmo':'Ver el ritmo',k:libre?'ritmo':null,sel:'#ritmo'})}}
  {const I=cliInfo();if(I&&I.opts.length){const cur=cliState().cur,top=I.rows.find(r=>r.c!=='SpaceX');R.push({t:'Clientes de SpaceX',m:`${top?`${cliN(top.c)} es el cliente externo con más lanzamientos recientes (${top.n}). `:''}${cur?'Tu apuesta sigue en juego: mira quién encarga los próximos.':`¿De quién será el siguiente lanzamiento que no sea Starlink ni de la propia SpaceX? Acertar da hasta ${CLI_PTS.other} puntos.`}`,tab:'next',btn:cur?'Ver los clientes':'Apostar por un cliente',k:cur?null:'cli',sel:'#clientes'})}}
  {const I=venInfo(),l=I&&I.U.find(venOpen);if(l){const cur=!!venState().cur[l.id];R.push({t:'Ventanas de lanzamiento',m:`La ventana de ${mname(l)} dura ${venTxt(venDur(l))}. Solo ${I.first} de los últimos ${I.W.length} lanzamientos con ventana salieron en su primer minuto. ${cur?'Tu apuesta sigue en juego.':`¿Saldrá este en el primer minuto? Acertar «Sí» da ${VEN_PTS.si} puntos.`}`,tab:'next',btn:cur?'Ver las ventanas':'Apostar por la ventana',k:cur?null:'ven',sel:'#ventanas'})}}
  {const I=zonInfo();if(I&&I.opts.length){const cur=zonState().cur,top=I.rows[0];R.push({t:'Zonas de aterrizaje',m:`${top&&top.rn?`${top.name||top.k} es la zona más usada en los últimos lanzamientos (${top.rn} veces). `:''}${cur?'Tu apuesta sigue en juego: mira qué zona usa el próximo propulsor.':`¿Dónde aterrizará el próximo propulsor? Acertar una zona poco usada da hasta ${ZON_MAX} puntos.`}`,tab:'next',btn:cur?'Ver las zonas':'Apostar por una zona',k:cur?null:'zon',sel:'#zonas'})}}
  {const I=horaInfo();if(I){const b=horaState().cur,f=I.first;R.push({t:'Hora del despegue',m:`El ${Math.round(100*I.nN/I.P.length)} % de los últimos despegues de SpaceX fueron de noche en la plataforma. ${b?'Tu apuesta sigue en juego: mira cuándo despega el siguiente.':`¿Despegará de noche el próximo?${f?` ${mname(f.l)} está previsto ${f.night?'de noche':'de día'}, pero un retraso lo puede cambiar.`:''}`}`,tab:'next',btn:b?'Ver la hora del despegue':'Apostar por la hora',k:b?null:'hora',sel:'#hora'})}}
  {const I=mesInfo();if(I&&I.Pv){const b=LS.get('mes',{})[I.cur],need=I.Pv.n-I.C.n+1,libre=!b&&need>0&&Date.now()<I.close;if(b||libre)R.push({t:'Lanzamientos por mes',m:`Este mes SpaceX lleva ${I.C.n} lanzamientos y el anterior hizo ${I.Pv.n}. ${libre?`¿Lo superará? Acertar «Sí» da ${mesSiPts(need)} puntos.`:'Tu apuesta sigue en juego: mira cómo va el mes.'}`,tab:'next',btn:libre?'Apostar por el mes':'Ver el gráfico',k:libre?'mes':null,sel:'#meses'})}}
  {const I=tipoInfo();if(I){const b=tipoState().cur;R.push({t:'Tipos de misión',m:`El ${Math.round(100*I.sl/I.P.length)} % de los últimos lanzamientos de SpaceX fueron Starlink. ${b?`Tu apuesta (${b.pick} de ${TIPO_N}) sigue en juego.`:`¿Cuántos de los próximos ${TIPO_N} serán Starlink?`}`,tab:'next',btn:b?'Ver los tipos de misión':'Apostar por Starlink',k:b?null:'tipo',sel:'#tipos'})}}
  {const I=vetInfo();if(I){const b=vetState().cur;R.push({t:'Veteranía de los propulsores',m:`El ${Math.round(100*I.old/I.P.length)} % de los últimos lanzamientos de SpaceX volaron con un propulsor de más de 20 vuelos. ${b?'Tu apuesta sigue en juego: mira con qué propulsor despega el siguiente.':`¿Volará el próximo con uno de más de 20?${I.nf!=null?` ${mname(I.nxt)} lleva asignado ${I.nc.serial} en su vuelo nº ${I.nf}.`:''}`}`,tab:'next',btn:b?'Ver la veteranía':'Apostar por la veteranía',k:b?null:'vet',sel:'#veterania'})}}
  {const I=turInfo();if(I){const b=turState().cur;R.push({t:'Tiempo en tierra',m:`El ${Math.round(100*I.under/I.n)} % de los últimos propulsores de SpaceX volvieron a volar en menos de 30 días; el récord en los datos es de ${turF(I.fast.d)} días. ${b?'Tu apuesta sigue en juego: mira cuánto lleva en tierra el siguiente.':'¿Volverá a volar el próximo en menos de 30 días?'}`,tab:'next',btn:b?'Ver el tiempo en tierra':'Apostar por el tiempo en tierra',k:b?null:'tur',sel:'#tierra'})}}
  {const I=orbInfo();if(I&&I.K.length){const b=orbState().cur,top=I.rows[0];R.push({t:'Órbitas en juego',m:`El ${Math.round(100*top.n/I.K.length)} % de los últimos lanzamientos de SpaceX fueron a ${orbName(top.k)}. ${b?'Tu apuesta sigue en juego: mira adónde va el próximo que no sea Starlink.':'¿A qué órbita irá el próximo que no sea Starlink?'}`,tab:'next',btn:b?'Ver las órbitas':'Apostar por la órbita',k:b?null:'orb',sel:'#orbitas'})}}
  {const I=anuInfo();if(I){const b=anuState().cur,libre=!b&&Date.now()<I.close;R.push({t:'Ritmo del año',m:`SpaceX lleva ${I.yN} lanzamientos en ${I.yr}; al ritmo de los últimos ${I.win} días acabaría el año con unos ${Math.round(I.projR)}. ${b?'Tu apuesta sigue en juego.':libre?`¿Cuántos llevará el ${fmtD(I.T)}?`:''}`,tab:'next',btn:libre?'Apostar por el ritmo del año':'Ver el ritmo del año',k:libre?'anu':null,sel:'#anual'})}}
  {const f=formate();if(f)R.push(f);}
  return R;
}
function mostrarGlobo(forzar){
  if(!D)return;const last=LS.get('globo_last',0);if(!forzar&&Date.now()-last<GLOBO_CADA)return;
  checkIn();const dd=retoDelDia();let r,diario=false;
  if(dd&&!dd.done&&LS.get('globo_dd','')!==dayKey()){r=dd;diario=true;LS.set('globo_dd',dayKey())}
  else{const R=retosGlobo();if(!R.length)return;const n=LS.get('globo_n',0);r=R[n%R.length];LS.set('globo_n',n+1);if(r.f)LS.set('formate_n',LS.get('formate_n',0)+1)}
  LS.set('globo_last',Date.now());
  const g=document.createElement('div');g.className='globo';
  g.setAttribute('role','complementary');g.setAttribute('aria-label','Desafío');g.setAttribute('aria-live','polite');
  g.innerHTML=`<button type="button" class="x" aria-label="Cerrar">×</button>${diario?`<div class="gk">Desafío del día · +${dailyPts()} puntos</div>`:''}<h4>${esc(r.t)}</h4><p>${esc(r.m)}</p><button type="button" class="go">${esc(r.btn)}${r.url?'<span class="sr"> (se abre en otra pestaña)</span>':''}</button><button type="button" class="later">Luego</button>`;
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

// ---------- Ficha de misión (al pulsar un lanzamiento) ----------
const ST_ES={Success:'Éxito',Failure:'Fallo','Partial Failure':'Fallo parcial',Go:'Confirmado (Go)',TBD:'Fecha por confirmar',TBC:'Pendiente de confirmar','In Flight':'En vuelo',Hold:'En espera'};
const stES=l=>ST_ES[l.status]||l.status_name||l.status||'';
function landKind(s){const n=s.land_loc_name||'';if(DRONE.test(n))return 'barco dron en el mar';if(LZ.test(n)||/^LZ/.test(s.land_loc||''))return 'zona de aterrizaje en tierra';if(/Ocean|Gulf|Sea/i.test(n))return 'amerizaje en el mar';return ''}
function misBtn(l,src){return `<button type="button" class="lnk misb" data-mis="${esc(l.id)}" data-src="${src}" aria-label="Abrir la ficha de la misión ${esc(mname(l))}">Ficha de la misión <span aria-hidden="true">›</span></button>`}
function findMis(id,src){const a=src==='p'?D.previous:D.upcoming,b=src==='p'?D.upcoming:D.previous;return a.find(x=>x.id===id)||b.find(x=>x.id===id)}
function openMission(id,src,from){const l=findMis(id,src);if(!l)return;
  const fut=new Date(l.net)>Date.now(),ok=l.status==='Success',st=(l.stages||[]).filter(s=>s.serial||s.land_loc),approx=/TBD|MON|YEAR|QUARTER|DAY/i.test(l.net_precision||'');
  const win=l.ws&&l.we?Math.round((new Date(l.we)-new Date(l.ws))/6e4):null;
  const stH=st.length?st.map(s=>{const known=s.serial&&!/Unknown/.test(s.serial),hist=known&&boosterHist(s.serial).length,td=tdays(s.turnaround),lk=landKind(s);
    return `<div class="card mstage"><b>${known?(hist?`<button type="button" class="lnk" data-bst="${esc(s.serial)}" aria-label="Abrir la ficha del propulsor ${esc(s.serial)}">Propulsor ${esc(s.serial)} <span aria-hidden="true">›</span></button>`:`Propulsor ${esc(s.serial)}`):'Propulsor aún sin asignar'}</b>${s.type&&s.type!=='Core'?` <span class="tag">${s.type==='Strap-On Booster'?'Lateral':esc(s.type)}</span>`:''}
     <div class="mut">${s.flight?`Vuelo nº ${s.flight} de este propulsor${s.reused?' (reutilizado)':' (primer vuelo)'}`:''}${td!=null&&td>0?` · ${td} días en tierra desde su vuelo anterior`:''}</div>
     <div>${s.land_attempt===false?'<span class="tag">Sin intento de aterrizaje</span>':s.land_loc_name&&s.land_loc_name!=='Unknown'?`<span class="tag${s.land_success===true?' ok':s.land_success===false?' ko':''}">${s.land_success===true?'Aterrizó en':s.land_success===false?'No aterrizó en':'Aterrizará en'} ${esc(s.land_loc_name)}${s.land_loc&&s.land_loc!==s.land_loc_name?' ('+esc(s.land_loc)+')':''}</span>${lk?` <span class="mut">${lk}</span>`:''}`:'<span class="mut">Zona de aterrizaje todavía sin publicar</span>'}</div></div>`}).join(''):'<p class="mut">Launch Library 2 todavía no da el propulsor ni la zona de aterrizaje de esta misión.</p>';
  const cu=(l.cust||[]).filter(Boolean),canPred=predictable(l),canFd=/Falcon 9/.test(l.rocket||'')&&fdSteps(l).length>=5;
  const live=l.video?`<a class="live" href="${esc(l.video)}" target="_blank" rel="noopener"><span aria-hidden="true">▶</span> ${fut||l.status==='In Flight'?'Ver directo':'Ver la retransmisión'}<span class="sr"> (se abre en otra pestaña)</span></a>`:`<p class="mut">${fut?'Todavía no hay enlace al directo; suele publicarse unos días antes del despegue.':'Launch Library 2 no da enlace a la retransmisión.'}</p>`;
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="box" role="dialog" aria-modal="true" aria-labelledby="mis-h"><button type="button" class="x" aria-label="Cerrar la ficha">×</button>
   <div class="kick">Ficha de misión</div><h2 id="mis-h">${esc(mname(l))}</h2>
   <div class="mut">${fmt(l.net)}${approx?' (fecha aproximada)':''} · ${esc(l.rocket)} · ${esc(l.pad||'')}${l.loc?', '+esc(l.loc):''}</div>
   <div style="margin:8px 0">${l.status?`<span class="tag ${ok||l.status==='Go'?'ok':/Fail/.test(l.status)?'ko':'warn'}">${esc(stES(l))}</span>`:''}${l.orbit&&l.orbit!=='N/A'?`<span class="tag">${esc(orb(l.orbit))}</span>`:''}${l.prob!=null&&fut?`<span class="tag ${wxCls(l.prob)}">Meteo favorable ${l.prob}%</span>`:''}</div>${fut&&wxList(l).length?`<div class="mut">Preocupa a la meteo: ${esc(wxList(l).join(', '))}.</div>`:''}
   ${l.img?`<figure class="ph mph"><img loading="lazy" src="${esc(l.img)}" alt="">${credit(l)}</figure>`:''}
   ${l.fail?`<p class="ko">${esc(l.fail)}</p>`:''}
   <h3>Descripción</h3><p>${l.desc?tdesc(l):'<span class="mut">Launch Library 2 todavía no da la descripción.</span>'}</p>
   ${cu.length?`<p class="mut">Cliente: ${cu.map(esc).join(', ')}</p>`:''}
   ${win!=null&&fut?`<p class="mut">Ventana de lanzamiento: ${win?`${win} minutos, de ${new Date(l.ws).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})} a ${new Date(l.we).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}`:'instantánea (hay que despegar a la hora exacta)'}.</p>`:''}
   <h3>Propulsor y aterrizaje</h3>${stH}
   <h3>Cronología del vuelo</h3>${tlHTML(l)}
   <h3>Directo</h3>${live}
   ${canPred||canFd?`<div class="opts">${canPred?'<button type="button" data-go="predict">Predecir este lanzamiento</button>':''}${canFd?'<button type="button" data-go="flight">Jugar su cuenta atrás</button>':''}</div>`:''}
   ${l.info?`<p><a href="${esc(l.info)}" target="_blank" rel="noopener">Página oficial de la misión<span class="sr"> (se abre en otra pestaña)</span></a></p>`:''}
   <p class="mut">Datos de Launch Library 2 (última actualización: ${fmt(D.generated)}).</p></div>`;
  const prevFocus=from||document.activeElement;
  document.body.appendChild(m);document.body.classList.add('noscroll');
  const close=(keep)=>{m.remove();document.body.classList.remove('noscroll');document.removeEventListener('keydown',onKey);
    if(keep!==true){try{prevFocus&&prevFocus.isConnected&&prevFocus.focus()}catch(e){}}},
   onKey=e=>{if(e.key==='Escape')close();else if(e.key==='Tab'){const f=[...m.querySelectorAll('button,a[href],[tabindex]:not([tabindex="-1"])')];if(!f.length)return;
     const a=f[0],z=f.at(-1);if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}};
  document.addEventListener('keydown',onKey);m.querySelector('.x').focus();
  m.onclick=e=>{if(e.target===m)close()};m.querySelector('.x').onclick=close;
  m.querySelectorAll('[data-bst]').forEach(b=>b.onclick=()=>{close(true);openBooster(b.dataset.bst)});
  m.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const t=b.dataset.go;close(true);if(t==='flight'){fdSel=l.id;if(!(FD&&FD.run)){FD=null;renderFlight()}}
    showTab(t);try{history.replaceState(null,'','#'+t);scrollTo({top:0})}catch(e){}const tb=document.querySelector(`nav [data-tab="${t}"]`);try{tb&&tb.focus({preventScroll:true})}catch(e){}});
}
// ---------- Cronología del vuelo (línea de tiempo publicada en Launch Library 2) ----------
const tFmt=t=>{const a=Math.abs(t),h=Math.floor(a/3600),m=Math.floor(a%3600/60),x=a%60;return (t<0?'T−':'T+')+(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')};
function tlMedians(l){// mediana de cada paso en los otros lanzamientos del mismo cohete con cronología
  const M={},o=(D.previous||[]).concat(D.upcoming||[]).filter(x=>x.id!==l.id&&x.rocket===l.rocket&&(x.tl||[]).length);
  for(const x of o){const seen=new Set();for(const[id,t]of x.tl){if(seen.has(id))continue;seen.add(id);(M[id]=M[id]||[]).push(t)}}
  const R={};for(const id in M){const v=M[id].sort((a,b)=>a-b);if(v.length>=3)R[id]={m:v.length%2?v[(v.length-1)/2]:Math.round((v[v.length/2-1]+v[v.length/2])/2),n:v.length}}return R}
function tlHTML(l){const tl=(l.tl||[]).slice().sort((a,b)=>a[1]-b[1]);if(!tl.length)return '<p class="mut">Launch Library 2 todavía no publica la cronología de este vuelo.</p>';
  const M=tlMedians(l),fut=new Date(l.net)>Date.now(),meco=tl.find(e=>e[0]===12),land=tl.find(e=>e[0]===19),last=tl.at(-1);
  const rows=tl.map(([id,t])=>{const md=M[id],d=md&&t>0?t-md.m:null,cmp=d==null?'':Math.abs(d)<5?'<span class="mut">como de costumbre</span>':`<span class="mut">${Math.abs(d)} s ${d<0?'antes':'después'} que la mediana (${tFmt(md.m)})</span>`;
    return `<li${id===10?' class="tl-lift"':''}><span class="tl-t">${tFmt(t)}</span> <span><b>${esc(tlName(id))}</b>${tlDesc(id)?` <span class="mut">· ${esc(tlDesc(id))}</span>`:''}${cmp?`<br>${cmp}`:''}</span></li>`}).join('');
  const sum=[meco?`apagado del motor principal a ${tFmt(meco[1])}`:'',land?`aterrizaje de la primera etapa a ${tFmt(land[1])}`:'',last&&last!==land&&last[1]>0?`último paso a ${tFmt(last[1])}`:''].filter(Boolean).join(', ');
  const nM=Object.values(M).reduce((a,b)=>Math.max(a,b.n),0);
  return `<details class="tlx"><summary>Cronología del vuelo (${tl.length} pasos)</summary>
   <p class="mut">Horario ${fut?'previsto':'publicado'} por Launch Library 2, en minutos y segundos respecto al despegue${sum?': '+sum:''}.${nM?` Las comparaciones usan la mediana de ese paso en los otros ${nM>1?'lanzamientos':'lanzamiento'} de ${esc(l.rocket)} con cronología que hay en los datos (hasta ${nM}).`:''}</p>
   <ol class="tl">${rows}</ol></details>`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button[data-mis]');if(b&&!b.closest('.modal'))openMission(b.dataset.mis,b.dataset.src,b)});
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
    l.prob!=null?`meteo favorable ${l.prob}%${wxList(l).length?` (preocupa: ${esc(wxList(l).join(', '))})`:''}`:'aún sin previsión meteo',`estado: ${esc(l.status_name)}`,
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
    X[id]={name:mname(l),txt,delay,conf:b.land_attempt?conf:null,net0:new Date(l.net).getTime(),land:!!b.land_attempt,serial:b.serial||null,prob0:l.prob??null,saved:Date.now()};
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
    return `<div class="card"><h3>${esc(x.name)}</h3>${x.prob0!=null?`<div class="mut">Meteo al guardar: ${x.prob0}% favorable</div>`:''}${r.void?'<div class="mut">La fuente no da la hora exacta del despegue, así que el retraso no se puede medir.</div>':
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
  const nd={d:t,k:r.k,t:r.t,m:r.m,btn:r.btn,tab:r.tab||null,url:r.url||null,sel:r.sel||null,done:false};LS.set('daily',nd);return nd}
function completeDaily(k){try{const d=LS.get('daily',null);if(!d||d.d!==dayKey()||d.done||d.k!==k)return;
  d.done=true;d.pts=dailyPts();d.at=Date.now();LS.set('daily',d);addPts('streak',d.pts);
  const st=LS.get('streak',{});st.retos=(st.retos||0)+1;LS.set('streak',st);
  aviso(`Desafío del día completado: +${d.pts} puntos.`);renderDaily()}catch(e){}}
function goReto(r){if(r.url){window.open(r.url,'_blank','noopener');completeDaily(r.k)}else{const b=document.querySelector(`nav button[data-tab="${r.tab}"]`);if(b)b.click();try{const t=r.sel&&document.querySelector(r.sel);if(t)t.scrollIntoView({block:'start'});else scrollTo({top:0})}catch(e){}}}
function aviso(t){let a=$('#aviso');if(!a){a=document.createElement('div');a.id='aviso';a.className='aviso';a.setAttribute('role','status');document.body.appendChild(a)}
  a.textContent=a.classList.contains('show')&&a.textContent&&!a.textContent.includes(t)?a.textContent+' '+t:t;a.classList.add('show');clearTimeout(a._t);a._t=setTimeout(()=>a.classList.remove('show'),4500)}
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

// ---------- Modo director de vuelo (pasos reales de la cuenta atrás de Launch Library 2) ----------
const TL_ES={1:['Luz verde a la carga de propelente','El director de lanzamiento confirma que se puede cargar el propelente'],
 2:['Carga de propelente','Empieza la carga de propelente'],3:['Oxígeno líquido en la 1.ª etapa','Empieza la carga de oxígeno líquido en la primera etapa'],
 4:['Oxígeno líquido en la 2.ª etapa','Empieza la carga de oxígeno líquido en la segunda etapa'],5:['Enfriamiento de motores','Empieza el enfriamiento de los motores'],
 6:['Arranque del ordenador de vuelo','El ordenador de a bordo toma el control de la cuenta atrás y hace las últimas comprobaciones'],
 7:['Presurización de tanques','Los tanques se presurizan a nivel de vuelo'],8:['Luz verde al lanzamiento','El director de lanzamiento confirma que se puede lanzar'],
 9:['Ignición','Empieza la secuencia de encendido de los motores'],10:['Despegue','Primer movimiento hacia arriba del cohete'],
 11:['Max-Q','Momento de máxima presión aerodinámica sobre el cohete'],12:['MECO','Se apagan los motores de la primera etapa'],
 13:['Separación de etapas','La segunda etapa se separa de la primera'],14:['SES-1','Primer encendido del motor de la segunda etapa'],
 15:['Separación de la cofia','Se suelta la cofia que protege la carga'],16:['Encendido de reentrada','Empieza el encendido de la primera etapa para entrar en la atmósfera'],
 17:['Fin del encendido de reentrada','Termina el encendido de reentrada en la atmósfera'],18:['Encendido de aterrizaje','Empieza el encendido de aterrizaje de la primera etapa'],
 19:['Aterrizaje de la 1.ª etapa','La primera etapa se posa'],20:['SECO-1','Primer apagado del motor de la segunda etapa'],
 21:['SES-2','Segundo encendido del motor de la segunda etapa'],22:['SECO-2','Segundo apagado del motor de la segunda etapa'],
 23:['Despliegue de los Starlink','Se sueltan los satélites Starlink'],35:['Separación de la carga','La carga se separa del cohete'],
 36:['Retirada del brazo de la tripulación','Se retira el brazo de acceso de la tripulación'],37:['Escape de Dragon armado','Se arma el sistema de escape de Dragon'],
 38:['Dragon con energía propia','Dragon pasa a su energía interna'],39:['Encendido de regreso','Empieza el encendido de regreso (boostback) de la primera etapa'],
 40:['Fin del encendido de regreso','Termina el encendido de regreso (boostback)'],41:['Separación de Dragon','Dragon se separa de la segunda etapa'],
 42:['Apertura del cono de Dragon','Empieza a abrirse el cono delantero de Dragon'],78:['Inicio del despliegue de la carga','Empieza la secuencia de despliegue de la carga'],
 79:['Fin del despliegue de la carga','Termina la secuencia de despliegue de la carga'],107:['Giro de la primera etapa','La primera etapa gira para orientarse'],
 108:['Carga de propelente de la 1.ª etapa','Empieza la carga de propelente en la primera etapa'],109:['Carga de propelente de la 2.ª etapa','Empieza la carga de propelente en la segunda etapa'],
 110:['Apagado de los laterales (SBECO)','Se apagan los motores de los propulsores laterales'],111:['Separación de los laterales','Los propulsores laterales se separan'],
 259:['Giro de los laterales','Los propulsores laterales giran para orientarse'],112:['Encendido de regreso de los laterales','Empieza el encendido de regreso (boostback) de los laterales'],
 113:['Fin del regreso de los laterales','Termina el encendido de regreso (boostback) de los laterales'],114:['Encendido de reentrada de los laterales','Empieza el encendido de reentrada de los laterales'],
 115:['Fin de la reentrada de los laterales','Termina el encendido de reentrada de los laterales'],116:['Encendido de aterrizaje de los laterales','Empieza el encendido de aterrizaje de los laterales'],
 117:['Aterrizaje de los laterales','Los propulsores laterales se posan'],87:['Carga de metano de la 1.ª etapa','Empieza la carga de metano líquido en la primera etapa'],
 86:['Carga de metano de la 2.ª etapa','Empieza la carga de metano líquido en la segunda etapa'],88:['Fin de la carga de la 1.ª etapa','Termina la carga de propelente en la primera etapa'],
 89:['Fin de la carga de la 2.ª etapa','Termina la carga de propelente en la segunda etapa'],90:['Activación del deflector de llamas','Se activa el deflector de llamas antes del encendido'],
 91:['«Emoción garantizada»','Nombre que da Launch Library 2 a este paso (en inglés, «Excitement Guaranteed»)']};
const tlName=id=>(TL_ES[id]||(D.tl_types||{})[id]||['Paso '+id])[0];
const tlDesc=id=>(TL_ES[id]||(D.tl_types||{})[id]||['',''])[1];
// Se juega hasta el aterrizaje si lo hay (si no, hasta T+10 min); pasos a la misma hora van juntos
function fdSteps(l){const tl=(l.tl||[]).filter(e=>e[1]<=1200),land=tl.find(e=>e[0]===19),end=land?land[1]:600,g=[];
  tl.filter(e=>e[1]<=end).forEach(([id,t])=>{const p=g.at(-1);if(p&&p.t===t){if(!p.ids.includes(id))p.ids.push(id)}else g.push({t,ids:[id]})});return g}
function fdMissions(){const now=Date.now(),ok=l=>/Falcon 9/.test(l.rocket||'')&&fdSteps(l).length>=5;
  return [...D.upcoming.filter(l=>ok(l)&&new Date(l.net)>now-3*H),...D.previous.filter(ok)].filter((l,i,a)=>a.findIndex(x=>x.id===l.id)===i).slice(0,16)}
// Velocidad del reloj: x40 en la carga, x3 del último minuto a T+3 min, x8 después (fija, no depende de la misión)
const FD_SEG=[[-Infinity,-60,40],[-60,180,3],[180,Infinity,8]];
const fdSpeed=m=>FD_SEG.find(s=>m>=s[0]&&m<s[1])[2];
function fdReal(a,b){if(a>b)return -fdReal(b,a);let r=0;for(const[x,y,v]of FD_SEG){const lo=Math.max(a,x),hi=Math.min(b,y);if(hi>lo)r+=(hi-lo)/v}return r}
const fdPts=e=>{e=Math.abs(e);return e<=.5?10:e<=1.5?6:e<=3?3:0};
const fdClock=m=>{const a=Math.abs(Math.round(m));return (m<0&&a?'T- ':'T+ ')+String(Math.floor(a/60)).padStart(2,'0')+':'+String(a%60).padStart(2,'0')};
let FD=null,fdSel=null;
function fdLabel(l){const f=new Date(l.net)>Date.now();return `${mname(l)} · ${f?'próximo, '+fmt(l.net):fmtD(l.net)}`}
function renderFlight(){const el=$('#flight');if(!el||!D)return;if(FD&&FD.run)return;
  const ms=fdMissions();if(!ms.length){el.innerHTML='<div class="card"><b>Modo director de vuelo</b><p class="mut">Ahora mismo Launch Library 2 no da los pasos de la cuenta atrás de ningún Falcon 9.</p></div>';return}
  const l=ms.find(x=>x.id===fdSel)||ms[0];fdSel=l.id;const st=fdSteps(l),rec=LS.get('flight',{})[l.id],b=(l.stages||[])[0]||{};
  let h=`<div class="card"><div class="kick">Modo director de vuelo</div><b>Dirige la cuenta atrás real de un Falcon 9</b>
  <p class="mut">Los pasos y sus tiempos son los que publica Launch Library 2 para esta misión. El reloj corre a x40 durante la carga de combustible, a x3 desde el último minuto hasta T+3 min y a x8 después. Te decimos qué toca, pero no cuándo: pulsa «¡Ahora!» (o la barra espaciadora) justo en ese momento. Acertar con medio segundo de margen da 10, con 1,5 s 6 y con 3 s 3. Al acabar ganas hasta 50 puntos por misión; repetirla solo suma si mejoras tu mejor marca.</p>
  <label class="fdl" for="fd-m">Misión</label><select id="fd-m">${ms.map(x=>`<option value="${esc(x.id)}"${x.id===l.id?' selected':''}>${esc(fdLabel(x))}</option>`).join('')}</select>
  <div class="mut" style="margin-top:6px">${st.length} pasos, de ${fdClock(st[0].t)} a ${fdClock(st.at(-1).t)}${b.land_loc_name&&st.some(s=>s.ids.includes(19))?` · aterriza en ${esc(b.land_loc_name)}`:''}${rec?` · tu mejor marca: ${rec.best} de 50`:''}</div>
  <button type="button" class="fdgo" id="fd-start">Empezar la cuenta atrás</button></div><div id="fd-play"></div>`;
  if(FD&&FD.done&&FD.l.id===l.id)h+=fdSummary();
  el.innerHTML=h;$('#fd-m').onchange=e=>{fdSel=e.target.value;FD=null;renderFlight()};$('#fd-start').onclick=()=>fdStart(l)}
function fdStart(l){const st=fdSteps(l);FD={l,st,i:0,m:st[0].t-90,res:[],run:true,last:null};
  $('#flight').innerHTML=`<div class="card fd"><div class="kick">${esc(mname(l))} · director de vuelo</div>
  <div class="big fdclock" id="fd-clock" role="timer" aria-live="off">${fdClock(FD.m)}</div><div class="mut" id="fd-speed"></div>
  <div class="fdnext"><div class="mut">Siguiente paso (<span id="fd-n"></span>)</div><b id="fd-name"></b><div class="mut" id="fd-desc"></div></div>
  <button type="button" class="fdnow" id="fd-now">¡Ahora!</button>
  <div id="fd-res" role="status" aria-live="polite" class="fdres"></div>
  <button type="button" class="lnk" id="fd-stop">Abandonar</button></div>`;
  $('#fd-now').onclick=fdPress;$('#fd-stop').onclick=()=>{FD.run=false;FD=null;renderFlight()};
  FD.key=e=>{if(e.code==='Space'&&FD&&FD.run&&$('#flight').classList.contains('on')&&document.activeElement!==$('#fd-now')){e.preventDefault();fdPress()}};
  addEventListener('keydown',FD.key);fdShow();$('#fd-now').focus({preventScroll:true});requestAnimationFrame(fdTick)}
function fdShow(){const s=FD.st[FD.i];if(!s)return;$('#fd-n').textContent=`${FD.i+1} de ${FD.st.length}`;
  $('#fd-name').textContent=s.ids.map(tlName).join(' + ');$('#fd-desc').textContent=s.ids.map(tlDesc).filter(Boolean).join('. ')}
function fdTick(ts){if(!FD||!FD.run)return;const dt=FD.last==null?0:Math.min(.1,(ts-FD.last)/1e3);FD.last=ts;
  const c=$('#fd-clock');if(!c){FD.run=false;return}
  if($('#flight').classList.contains('on')&&!document.hidden)FD.m+=dt*fdSpeed(FD.m);// se pausa al cambiar de pestaña
  c.textContent=fdClock(FD.m);$('#fd-speed').textContent='Velocidad x'+fdSpeed(FD.m);
  const s=FD.st[FD.i];if(s&&FD.m>s.t&&fdReal(s.t,FD.m)>3)fdResolve(null);
  if(FD.run)requestAnimationFrame(fdTick)}
function fdPress(){if(!FD||!FD.run)return;const s=FD.st[FD.i];if(!s)return;fdResolve(fdReal(s.t,FD.m))}
function fdResolve(err){const s=FD.st[FD.i],tooSoon=err!=null&&err<-3,p=err==null||tooSoon?0:fdPts(err);
  FD.res.push({t:s.t,ids:s.ids,err,p});
  $('#fd-res').textContent=`${s.ids.map(tlName).join(' + ')} fue en ${fdClock(s.t)}: `+(err==null?'no pulsaste a tiempo, 0 puntos.':tooSoon?`demasiado pronto (${Math.abs(err).toFixed(1)} s antes), 0 puntos.`:`${Math.abs(err)<.05?'clavado':Math.abs(err).toFixed(1)+' s '+(err<0?'antes':'tarde')}, ${p} puntos.`);
  FD.i++;if(FD.i>=FD.st.length)fdEnd();else fdShow()}
function fdEnd(){FD.run=false;FD.done=true;removeEventListener('keydown',FD.key);
  const sum=FD.res.reduce((a,r)=>a+r.p,0),pts=Math.round(50*sum/(10*FD.st.length)),all=LS.get('flight',{}),old=all[FD.l.id]||{best:0,n:0},gain=Math.max(0,pts-old.best);
  all[FD.l.id]={best:Math.max(old.best,pts),n:old.n+1,at:Date.now()};LS.set('flight',all);if(gain)addPts('flight',gain);
  FD.pts=pts;FD.gain=gain;completeDaily('flight');checkAch();renderFlight();const r=$('#fd-sum');if(r&&r.focus)r.focus({preventScroll:false})}
function fdSummary(){const R=FD.res,ok=R.filter(r=>r.p>=6).length;
  return `<div class="card" id="fd-sum" tabindex="-1"><b>Cuenta atrás terminada: ${FD.pts} de 50</b><div class="mut">${ok} de ${R.length} pasos con 1,5 s de margen o menos.${FD.gain?` Sumas ${FD.gain} puntos nuevos.`:' No mejoras tu mejor marca, así que no suma puntos.'}</div>
  <div class="tscroll"><table><thead><tr><th>Paso</th><th>Hora real</th><th>Tu pulsación</th><th>Puntos</th></tr></thead><tbody>${R.map(r=>`<tr><td>${esc(r.ids.map(tlName).join(' + '))}</td><td>${fdClock(r.t)}</td><td>${r.err==null?'sin pulsar':r.err<-3?'demasiado pronto':Math.abs(r.err).toFixed(1)+' s '+(r.err<0?'antes':'tarde')}</td><td>${r.p}</td></tr>`).join('')}</tbody></table></div>
  <div class="mut">Tiempos de Launch Library 2 para ${esc(mname(FD.l))}. El margen se mide en segundos reales de juego, no de misión.</div></div>`}

// ---------- Logros ----------
// Se calculan con lo que ya guarda el navegador (predicciones, análisis, apuestas, retos, partidas y racha) frente a los datos reales.
// Cada logro da sus puntos una sola vez (categoría ach); los desbloqueados se guardan en sxp_ach.
function predAnswers(){return Object.values(LS.get('preds',{})).filter(p=>p.res).sort((a,b)=>(new Date(a.net)-new Date(b.net))||((a.resAt||0)-(b.resAt||0))).flatMap(p=>p.res)}
function bestRun(a){let r=0,b=0;for(const x of a){r=x.ok?r+1:0;b=Math.max(b,r)}return b}
const xDone=()=>Object.values(LS.get('expert',{})).filter(x=>x.res);
const ACH=[
 {id:'first',i:'🎯',t:'Primer acierto',d:'Acierta una pregunta de predicción.',p:10,pr:()=>[predAnswers().filter(r=>r.ok).length,1]},
 {id:'full',i:'💯',t:'Pleno',d:'Acierta todas las preguntas de un mismo lanzamiento.',p:15,pr:()=>[Object.values(LS.get('preds',{})).some(p=>p.res&&p.res.length>=2&&p.res.every(r=>r.ok))?1:0,1]},
 {id:'run5',i:'🔥',t:'Cinco seguidas',d:'Acierta 5 preguntas de predicción seguidas, por orden de lanzamiento.',p:20,pr:()=>[bestRun(predAnswers()),5]},
 {id:'contra',i:'🦅',t:'Contra la racha',d:'Di que algo saldrá mal (la carga no llega a su órbita o el propulsor no aterriza) y acierta.',p:30,pr:()=>[predAnswers().some(r=>r.ok&&r.real==='No'&&r.q!=='A tiempo')?1:0,1]},
 {id:'eng',i:'🛠️',t:'Ojo de ingeniero',d:'En un análisis de experto, acierta los minutos de retraso con 2 minutos de error o menos.',p:20,pr:()=>[xDone().some(x=>!x.res.void&&x.res.err<=2)?1:0,1]},
 {id:'xp3',i:'🧠',t:'Analista',d:'Ten 3 análisis de experto resueltos con los datos reales.',p:10,pr:()=>[xDone().length,3]},
 {id:'quiz',i:'🏆',t:'Reto perfecto',d:'Acierta todas las preguntas del reto semanal (con al menos 5 preguntas).',p:25,pr:()=>{const Z=buildQuiz(),s=LS.get('quiz_'+Z.key,{ans:{}});return[Z.qs.filter((q,i)=>s.ans[i]===q.right).length,Math.max(5,Z.qs.length)]}},
 {id:'bet',i:'♻️',t:'Ojo para la flota',d:'Gana una apuesta «¿volverá a volar?» de un propulsor.',p:10,pr:()=>[Object.values(LS.get('bets',{})).some(b=>b.res&&b.res.ok)?1:0,1]},
 {id:'fd1',i:'🕹️',t:'Primera cuenta atrás',d:'Termina una partida en modo director de vuelo.',p:5,pr:()=>[Object.values(LS.get('flight',{})).some(f=>f.n>0)?1:0,1]},
 {id:'fd40',i:'⏱️',t:'Nervios de acero',d:'Consigue 40 de 50 o más en una cuenta atrás del modo director de vuelo.',p:20,pr:()=>[Math.max(0,...Object.values(LS.get('flight',{})).map(f=>f.best||0)),40]},
 {id:'hilo5',i:'🔧',t:'Ojo de mecánico',d:'Encadena 5 aciertos seguidos en el juego «¿Más o menos?».',p:10,pr:()=>[(LS.get('hilo',{}).best)||0,5]},
 {id:'st3',i:'📅',t:'Tres días seguidos',d:'Entra 3 días seguidos.',p:10,pr:()=>[(LS.get('streak',{}).best)||0,3]},
 {id:'st7',i:'🌕',t:'Una semana sin fallar',d:'Entra 7 días seguidos.',p:25,pr:()=>[(LS.get('streak',{}).best)||0,7]},
 {id:'dd5',i:'⭐',t:'Cinco desafíos',d:'Completa 5 desafíos del día.',p:15,pr:()=>[(LS.get('streak',{}).retos)||0,5]}
];
let ACH_BUSY=false;
function checkAch(){if(!D||ACH_BUSY)return;ACH_BUSY=true;
  try{const got=LS.get('ach',{}),nw=[];
    for(const a of ACH){if(got[a.id])continue;let pr;try{pr=a.pr()}catch(e){continue}if(pr[1]>0&&pr[0]>=pr[1]){got[a.id]={at:Date.now(),p:a.p};nw.push(a)}}
    if(!nw.length)return;
    LS.set('ach',got);const pts=nw.reduce((s,a)=>s+a.p,0),p=points();p.ach=(p.ach||0)+pts;LS.set('points',p);
    aviso(nw.length===1?`Logro desbloqueado: ${nw[0].t} (+${pts} puntos).`:`${nw.length} logros desbloqueados: ${nw.map(a=>a.t).join(', ')} (+${pts} puntos).`);
    renderLogros();renderScore();
  }catch(e){}finally{ACH_BUSY=false}}
function renderLogros(){const el=$('#logros');if(!el||!D)return;const got=LS.get('ach',{}),on=ACH.filter(a=>got[a.id]),pts=on.reduce((s,a)=>s+(got[a.id].p||a.p),0);
  const li=a=>{const g=got[a.id];let pr=[0,1];try{pr=a.pr()}catch(e){}const c=Math.min(pr[0],pr[1]);
    return `<li class="ach${g?' on':''}"><span class="ai" aria-hidden="true">${g?a.i:'🔒'}</span><div><b>${esc(a.t)}</b> <span class="tag${g?' ok':''}">+${a.p}</span><span class="sr">${g?' (conseguido)':' (bloqueado)'}</span><div class="mut">${esc(a.d)}</div><div class="mut">${g?'Conseguido el '+fmtD(g.at):pr[1]>1?`Llevas ${c} de ${pr[1]}`:'Todavía no'}</div>${!g&&pr[1]>1?`<div class="bar" aria-hidden="true"><i style="width:${100*c/pr[1]}%"></i></div>`:''}</div></li>`};
  el.innerHTML=`<details class="card achc"${LS.get('ach_open',false)?' open':''}><summary><b>Logros</b> · ${on.length} de ${ACH.length} · ${pts} puntos</summary>
  <p class="mut">Se desbloquean solos cuando tus predicciones, análisis, apuestas, retos y partidas se comparan con lo que pasó de verdad. Cada logro da sus puntos una vez.</p>
  <div class="bar" aria-hidden="true"><i style="width:${100*on.length/ACH.length}%"></i></div>
  <ul class="achs">${ACH.filter(a=>got[a.id]).concat(ACH.filter(a=>!got[a.id])).map(li).join('')}</ul></details>`;
  const d=el.querySelector('details');d.ontoggle=()=>LS.set('ach_open',d.open)}
// ---------- Mis estadísticas: tus aciertos por tipo de pregunta y por categoría, frente a lo que pasó de verdad ----------
const pct=(a,b)=>b?Math.round(100*a/b)+'%':'—';
function statsData(){const Q=[['Carga en órbita','¿Llegará la carga a su órbita?'],['Aterrizaje','¿Aterrizará el propulsor?'],['A tiempo','¿Despegará dentro de las 24 h?']];
  const ans=predAnswers(),rows=Q.map(([k,t])=>{const a=ans.filter(r=>r.q===k);return{k,t,n:a.length,ok:a.filter(r=>r.ok).length,si:a.filter(r=>r.you==='Sí').length,realSi:a.filter(r=>r.real==='Sí').length}});
  const P=D.previous,land=P.map(l=>(l.stages||[])[0]||{}).filter(b=>b.land_attempt);
  const real={'Carga en órbita':[P.filter(l=>l.status==='Success').length,P.length],'Aterrizaje':[land.filter(b=>b.land_success).length,land.length]};
  const xs=xDone(),xm=xs.filter(x=>!x.res.void),xc=xs.filter(x=>x.res.cpts!=null);
  const errs=xm.map(x=>x.res.err).sort((a,b)=>a-b),med=errs.length?errs[Math.floor((errs.length-1)/2)]:null;
  const bets=Object.values(LS.get('bets',{})).filter(b=>b.res);
  const Z=buildQuiz(),qs=LS.get('quiz_'+Z.key,{ans:{}}),qn=Object.keys(qs.ans).length,qok=Z.qs.filter((q,i)=>qs.ans[i]===q.right).length;
  return{rows,real,nP:P.length,xs,xm,xc,med,xcal:xc.filter(x=>(x.conf>=50)===x.res.landed).length,bets,qn,qok,pts:points()}}
function statsHTML(){if(!D)return '';const S=statsData(),tot=S.rows.reduce((s,r)=>s+r.n,0),okT=S.rows.reduce((s,r)=>s+r.ok,0);
  const row=r=>{const re=S.real[r.k];return `<tr><th scope="row">${esc(r.t)}</th><td>${r.n?`<b>${pct(r.ok,r.n)}</b> <span class="mut">(${r.ok} de ${r.n})</span>`:'<span class="mut">sin datos</span>'}</td><td>${r.n?`${pct(r.si,r.n)} Sí`:'—'}</td><td>${r.n?`${pct(r.realSi,r.n)} Sí`:'—'}</td><td>${re?`${pct(re[0],re[1])} Sí <span class="mut">(${re[0]} de ${re[1]})</span>`:'<span class="mut">la fuente no guarda la hora prevista original</span>'}</td></tr>`};
  const P=S.pts,cats=[['pred','Predicciones'],['expert','Análisis de experto'],['quiz','Reto semanal'],['rapid','Reto rápido'],['hilo','¿Más o menos?'],['adonde','¿Adónde va?'],['flight','Director de vuelo'],['bet','Apuestas de propulsores'],['racha','Apuesta de la racha'],['ritmo','Ritmo de lanzamientos'],['cli','Apuesta de clientes'],['ven','Ventanas de lanzamiento'],['zon','Apuesta de aterrizaje'],['mes','Apuesta del mes'],['hora','Apuesta de la hora'],['tipo','Apuesta de Starlink'],['vet','Apuesta de veteranía'],['orb','Apuesta de órbita'],['vida','Vida de los propulsores'],['tur','Apuesta del tiempo en tierra'],['hito','Apuesta de hitos'],['anu','Ritmo del año'],['prec','Apuesta de precisión'],['dir','Apuesta de retransmisión'],['streak','Racha y desafíos'],['ach','Logros']],ptot=cats.reduce((s,[k])=>s+(P[k]||0),0);
  const best=S.rows.filter(r=>r.n>=2).sort((a,b)=>b.ok/b.n-a.ok/a.n)[0];
  return `<details class="card achc stats"${LS.get('stats_open',false)?' open':''}><summary><b>Mis estadísticas</b> · ${tot?`${pct(okT,tot)} de aciertos en ${tot} ${tot===1?'pregunta':'preguntas'}`:'aún sin predicciones resueltas'}</summary>
  <p class="mut">Se calculan con lo que guardas en este navegador y los datos reales de Launch Library 2.</p>
  <h4>Predicciones por tipo de pregunta</h4>
  <div class="tblw"><table class="stt"><thead><tr><th scope="col">Pregunta</th><th scope="col">Tus aciertos</th><th scope="col">Tú dijiste</th><th scope="col">Pasó en tus lanzamientos</th><th scope="col">SpaceX, últimos ${S.nP}</th></tr></thead><tbody>${S.rows.map(row).join('')}</tbody></table></div>
  ${tot?`<p class="mut">Si hubieras dicho siempre «Sí», habrías acertado ${pct(S.rows.reduce((s,r)=>s+r.realSi,0),tot)}.${best?` Tu mejor tipo de pregunta: ${esc(best.k.toLowerCase())}.`:''}</p>`:'<p class="mut">Predice en los lanzamientos de abajo; cuando despeguen, verás aquí tus porcentajes.</p>'}
  <h4>Por categoría</h4><ul class="stl">
  <li>Análisis de experto: ${S.xs.length?`${S.xs.length} resueltos${S.med!=null?`, error mediano de ${S.med} min en el retraso`:''}${S.xc.length?`, confianza en el aterrizaje bien orientada en ${S.xcal} de ${S.xc.length}`:''}`:'<span class="mut">ninguno resuelto todavía</span>'}</li>
  <li>Reto semanal: ${S.qn?`${S.qok} de ${S.qn} respondidas bien esta semana (${pct(S.qok,S.qn)})`:'<span class="mut">sin respuestas esta semana</span>'}</li>
  <li>Apuestas de propulsores: ${S.bets.length?`${S.bets.filter(b=>b.res.ok).length} ganadas de ${S.bets.length} (${pct(S.bets.filter(b=>b.res.ok).length,S.bets.length)})`:'<span class="mut">ninguna resuelta todavía</span>'}</li>
  <li>Reto rápido: récord ${(LS.get('rapid',{}).best)||0} puntos · ¿Más o menos?: mejor racha de ${(LS.get('hilo',{}).best)||0} aciertos</li></ul>
  <h4>De dónde salen tus ${ptot} puntos</h4><ul class="stl">${cats.map(([k,t])=>`<li>${t}: <b>${P[k]||0}</b>${ptot?` <span class="mut">(${pct(P[k]||0,ptot)})</span>`:''}${ptot?`<div class="bar" aria-hidden="true"><i style="width:${100*(P[k]||0)/ptot}%"></i></div>`:''}</li>`).join('')}</ul></details>`}
function bindStats(){const d=document.querySelector('#mystats details');if(d)d.ontoggle=()=>LS.set('stats_open',d.open)}
// ---------- Racha en directo y apuesta semanal «¿seguirá la racha el domingo?» ----------
// Los contadores salen de las estadísticas de SpaceX en Launch Library 2; la apuesta se resuelve con los lanzamientos reales de la semana.
// Se guarda en sxp_rbet (por semana) y los puntos van a la categoría racha.
let RL=null;// datos más recientes leídos en segundo plano (cada 20 minutos)
const rlD=()=>RL||D;
const RB_PTS={si:10,no:40};
const RB_Q={land:['aterrizajes','consecutive_successful_landings','¿Seguirá la racha de aterrizajes de propulsores sin fallos hasta el domingo?'],
  launch:['lanzamientos','consecutive_successful_launches','¿Seguirá la racha de lanzamientos con éxito hasta el domingo?']};
function rbWeek(){const m=weekKey(),k=m.getFullYear()+'-'+String(m.getMonth()+1).padStart(2,'0')+'-'+String(m.getDate()).padStart(2,'0');
  const end=new Date(m.getFullYear(),m.getMonth(),m.getDate()+7).getTime()-1,close=new Date(m.getFullYear(),m.getMonth(),m.getDate()+5).getTime();return{k,end,close}}
const landFail=l=>(l.stages||[]).some(s=>s.land_attempt&&s.land_success===false);
const landPend=l=>(l.stages||[]).some(s=>s.land_attempt&&s.land_success!==true&&s.land_success!==false);
const launchFail=l=>/Failure/i.test(l.status||'');
function rlInfo(){const d=rlD(),P=(d.previous||[]).slice().sort((a,b)=>new Date(b.net)-new Date(a.net)),s=d.stats||{};
  const okL=P.filter(l=>(l.stages||[]).some(x=>x.land_attempt&&x.land_success===true)),lf=P.find(landFail),lnf=P.find(launchFail);
  const since=lf?P.filter(l=>new Date(l.net)>new Date(lf.net)).reduce((n,l)=>n+(l.stages||[]).filter(x=>x.land_attempt&&x.land_success===true).length,0):null;
  const nx=(d.upcoming||[]).filter(l=>new Date(l.net)>Date.now()-3*H&&(l.stages||[]).some(x=>x.land_attempt)).sort((a,b)=>new Date(a.net)-new Date(b.net))[0];
  return{s,P,lastOk:okL[0],lf,lnf,since,nx,gen:d.generated}}
function resolveRbet(){const d=rlD();if(!d||!d.previous)return;const all=LS.get('rbet',{});let ch=false,won=0;const gen=new Date(d.generated).getTime();
  for(const w of Object.values(all))for(const [k,b] of Object.entries(w.bets||{})){if(b.res)continue;if(!(gen>w.end))continue;
    const win=d.previous.filter(l=>{const t=new Date(l.net).getTime();return t>b.at&&t<=w.end});
    const fail=k==='land'?win.find(landFail):win.find(launchFail);
    if(!fail&&k==='land'&&win.some(landPend)&&gen<w.end+2*DAY)continue;// espera a que la fuente confirme el aterrizaje
    let held=!fail;const old=d.previous.reduce((m,l)=>Math.min(m,new Date(l.net).getTime()),Infinity);
    if(!fail&&old>b.at)held=((d.stats||{})[RB_Q[k][1]]||0)>=b.v0;// la lista no cubre la semana: se usa el contador
    const ok=(b.pick==='Sí')===held;b.res={held,ok,by:fail?mname(fail):null,n:k==='land'?win.reduce((n,l)=>n+(l.stages||[]).filter(x=>x.land_attempt&&x.land_success===true).length,0):win.filter(l=>l.status==='Success').length};
    b.won=ok?(b.pick==='Sí'?RB_PTS.si:RB_PTS.no):0;b.resAt=Date.now();if(b.won)won+=b.won;ch=true}
  if(ch){LS.set('rbet',all);if(won){addPts('racha',won);aviso(`Apuesta de la racha resuelta: +${won} puntos.`)}}}
function rbetHTML(){const W=rbWeek(),all=LS.get('rbet',{}),w=all[W.k]||{bets:{}},I=rlInfo(),open=Date.now()<W.close;
  const q=k=>{const b=(w.bets||{})[k],[nm,f,t]=RB_Q[k],v=I.s[f];if(v==null)return '';
    return `<div style="margin-top:10px"><div id="rb-${k}">${t} <span class="mut">(ahora ${v} ${nm} seguidos)</span></div>
    ${b?`<p>${b.res?ic(b.res.ok):'<span role="img" aria-label="Pendiente">⏳</span>'} Dijiste <b>${b.pick}</b> con la racha en ${b.v0}${b.res?` · ${b.res.held?'la racha aguantó':'se rompió'+(b.res.by?' en '+esc(b.res.by):'')} (${b.res.n} ${k==='land'?'aterrizajes':'lanzamientos'} con éxito en la semana desde tu apuesta) · +${b.won} puntos`:` · se resuelve con los datos de después del domingo ${fmtD(W.end)} a las 23:59`}</p>`
    :open?`<div class="opts" role="group" aria-labelledby="rb-${k}"><button type="button" data-rb="${k}" data-v="Sí">Sí, aguanta (+${RB_PTS.si})</button><button type="button" data-rb="${k}" data-v="No">No, se romperá (+${RB_PTS.no})</button></div>`
    :'<p class="mut">Las apuestas de esta semana cerraron el viernes a las 23:59. El lunes empieza otra.</p>'}</div>`};
  const past=Object.entries(all).filter(([k])=>k!==W.k).sort((a,b)=>b[0]<a[0]?-1:1).slice(0,4).flatMap(([k,x])=>Object.entries(x.bets||{}).map(([q,b])=>`<div class="mut">Semana del ${fmtD(k+'T12:00:00')} · ${RB_Q[q][0]}: dijiste ${b.pick} · ${b.res?`${b.res.ok?'acertaste':'fallaste'}, +${b.won} puntos`:'pendiente de datos'}</div>`));
  return `<h3>Apuesta de la semana</h3><p class="mut">Apuesta hasta el viernes a las 23:59 por la racha tal como está al apostar. «Sí» da ${RB_PTS.si} puntos y «No», que es más difícil, ${RB_PTS.no}. Se resuelve sola con los lanzamientos reales hasta el domingo a las 23:59.</p>${q('land')}${q('launch')}${past.length?`<div style="margin-top:8px">${past.join('')}</div>`:''}`}
function renderRacha(){const el=$('#rlive');if(!el||!D)return;const I=rlInfo(),s=I.s;if(s.consecutive_successful_landings==null){el.innerHTML='';return}
  const lo=I.lastOk,lb=lo&&(lo.stages||[]).find(x=>x.land_attempt&&x.land_success===true),nb=I.nx&&(I.nx.stages||[]).find(x=>x.land_attempt);
  el.innerHTML=`<div class="card daily rlive"><div class="kick">Racha en directo</div>
  <div class="stats"><div><b>${s.consecutive_successful_landings}</b>aterrizajes seguidos sin fallos</div><div><b>${s.consecutive_successful_launches}</b>lanzamientos seguidos con éxito</div>
  <div><b>${pct(s.successful_landings,s.attempted_landings)}</b>aterrizajes con éxito en total (${s.successful_landings} de ${s.attempted_landings})</div></div>
  ${lb?`<p class="mut">Último aterrizaje que sumó: ${esc(lb.serial)} en ${esc(mname(lo))}, ${fmt(lo.net)}${lb.land_loc_name?` (${esc(lb.land_loc_name)})`:''}.</p>`:''}
  ${I.lf&&I.since===s.consecutive_successful_landings?`<p class="mut">La racha empezó tras el último fallo: ${esc(mname(I.lf))} (${esc(I.lf.rocket||'')}), ${fmtD(I.lf.net)}.</p>`:''}
  ${I.nx?`<p class="mut">Próximo intento de aterrizaje: ${esc(mname(I.nx))}, ${fmt(I.nx.net)}${nb&&nb.serial&&!/Unknown/.test(nb.serial)?` con ${esc(nb.serial)}`:''}${nb&&nb.land_loc_name?` en ${esc(nb.land_loc_name)}`:''}.</p>`:''}
  ${rbetHTML()}<div class="mut" style="margin-top:6px">Contadores de Launch Library 2, actualizados ${fmt(I.gen)}. Se vuelven a leer cada 20 minutos.</div></div>`}
function bindRacha(){const el=$('#next');if(!el||el._rb)return;el._rb=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-rb]');if(!b)return;
  const W=rbWeek();if(Date.now()>=W.close){renderRacha();return}const all=LS.get('rbet',{}),w=all[W.k]||(all[W.k]={end:W.end,bets:{}}),k=b.dataset.rb;if(w.bets[k])return;
  const v0=(rlD().stats||{})[RB_Q[k][1]];if(v0==null)return;w.end=W.end;w.bets[k]={pick:b.dataset.v,at:Date.now(),v0};LS.set('rbet',all);
  aviso(`Apuesta guardada: ${b.dataset.v==='Sí'?'la racha aguanta':'la racha se romperá'} (${RB_Q[k][0]}).`);completeDaily('racha');renderRacha();
  const f=document.querySelector(`#rlive [id="rb-${k}"]`);try{f&&f.focus()}catch(e){}})}
async function refreshRacha(){try{const d=await fetch('data.json?'+Date.now()).then(r=>r.json());if(d&&d.stats&&Array.isArray(d.previous)){RL=d;resolveRbet();resolveVida();renderRacha();resolveRitmo();renderRitmo();resolveCli();renderClientes();resolveVen();renderVentanas();resolveZon();renderZonas();resolveMes();renderMeses();renderCohetes();resolveHora();renderHora();renderBarcazas();resolveTipo();renderTipos();renderStarlink();renderMeteo();resolveVet();renderVeterania();resolveOrb();renderOrbitas();renderRetrasos();resolvePrec();renderPrecision();resolveDir();renderDirectos();renderEstados();renderReloj();resolveHito();renderHitos();renderPlataformas();resolveAnu();renderAnual()}}catch(e){}}
// ---------- Ritmo de lanzamientos y apuesta «¿cuántos lanzamientos habrá esta semana?» ----------
// Todo sale de los lanzamientos reales de SpaceX que hay en data.json (Launch Library 2). La apuesta se guarda en sxp_ritmo (por semana)
// y se resuelve sola contando los lanzamientos de lunes a domingo; los puntos van a la categoría ritmo.
const RT_PTS={exact:30,near:10},RT_MAX=10;
function rtWeek(){const W=rbWeek(),m=new Date(W.k+'T00:00:00');return{...W,start:m.getTime(),close:new Date(m.getFullYear(),m.getMonth(),m.getDate()+3).getTime()}}// se apuesta hasta el miércoles a las 23:59
const rtNum=n=>n>=RT_MAX?RT_MAX+' o más':String(n);
const rtHrs=ms=>{const h=ms/H,m=Math.round(ms/6e4),r=Math.round(h);return m<60?`${m} ${m===1?'minuto':'minutos'}`:h<48?`${r} ${r===1?'hora':'horas'}`:`${(ms/DAY).toFixed(1).replace('.',',')} días`};
function rtInfo(){const d=rlD(),P=(d.previous||[]).filter(l=>!isNaN(new Date(l.net))).slice().sort((a,b)=>new Date(a.net)-new Date(b.net));
  if(P.length<3)return null;const t=P.map(l=>new Date(l.net).getTime()),gaps=[];for(let i=1;i<t.length;i++)gaps.push({ms:t[i]-t[i-1],a:P[i-1],b:P[i]});
  const gs=gaps.map(g=>g.ms).sort((a,b)=>a-b),med=gs[Math.floor((gs.length-1)/2)],mean=gs.reduce((s,x)=>s+x,0)/gs.length;
  const min=gaps.reduce((m,g)=>g.ms<m.ms?g:m),max=gaps.reduce((m,g)=>g.ms>m.ms?g:m),now=Date.now(),W=rtWeek();
  // semanas completas (lunes a domingo, hora local) que cubren los datos: desde la primera tras el lanzamiento más antiguo hasta la última terminada
  const wk=x=>{const z=new Date(x),dd=(z.getDay()+6)%7;return new Date(z.getFullYear(),z.getMonth(),z.getDate()-dd).getTime()};
  const weeks=[];let w0=new Date(wk(t[0]));w0=new Date(w0.getFullYear(),w0.getMonth(),w0.getDate()+7);
  while(true){const s=w0.getTime(),e=new Date(w0.getFullYear(),w0.getMonth(),w0.getDate()+7).getTime();if(e>W.start)break;
    weeks.push({s,n:t.filter(x=>x>=s&&x<e).length});w0=new Date(w0.getFullYear(),w0.getMonth(),w0.getDate()+7)}
  const best=weeks.reduce((m,x)=>!m||x.n>m.n?x:m,null),avgW=weeks.length?weeks.reduce((s,x)=>s+x.n,0)/weeks.length:null;
  const dist={};for(const x of weeks)dist[Math.min(RT_MAX,x.n)]=(dist[Math.min(RT_MAX,x.n)]||0)+1;
  const thisW=P.filter(l=>{const x=new Date(l.net).getTime();return x>=W.start&&x<=W.end});
  const left=(d.upcoming||[]).filter(l=>{const x=new Date(l.net).getTime();return x>Math.max(now,W.start)-3*H&&x<=W.end&&/^(SEC|MIN|HOUR)$/i.test(l.net_precision||'')&&!thisW.some(p=>p.id===l.id)});
  const last=P[P.length-1],l7=t.filter(x=>x>now-7*DAY).length,l30=t.filter(x=>x>now-30*DAY).length;
  return{P,med,mean,min,max,weeks,best,avgW,dist,thisW,left,last,sinceLast:now-t[t.length-1],l7,l30,W,gen:d.generated}}
function resolveRitmo(){const d=rlD();if(!d||!d.previous||!d.previous.length)return;const all=LS.get('ritmo',{}),gen=new Date(d.generated).getTime();let ch=false,won=0;
  const old=d.previous.reduce((m,l)=>Math.min(m,new Date(l.net).getTime()),Infinity);
  for(const [k,b] of Object.entries(all)){if(b.res||!b.end||!(gen>b.end+6*H))continue;// espera unas horas a que la fuente pase los lanzamientos del domingo a la lista de pasados
    const s=new Date(k+'T00:00:00').getTime();if(old>s)continue;// la lista ya no cubre esa semana
    const n=d.previous.filter(l=>{const x=new Date(l.net).getTime();return x>=s&&x<=b.end}).length,diff=Math.abs(Math.min(RT_MAX,n)-b.pick);
    b.res={n,ok:diff===0,near:diff===1};b.won=diff===0?RT_PTS.exact:diff===1?RT_PTS.near:0;b.resAt=Date.now();if(b.won)won+=b.won;ch=true}
  if(ch){LS.set('ritmo',all);if(won){addPts('ritmo',won);aviso(`Apuesta del ritmo resuelta: +${won} puntos.`)}}}
function ritmoBetHTML(I){const W=I.W,all=LS.get('ritmo',{}),b=all[W.k],open=Date.now()<W.close;
  const past=Object.entries(all).filter(([k])=>k!==W.k).sort((a,c)=>c[0]<a[0]?-1:1).slice(0,4).map(([k,x])=>`<div class="mut">Semana del ${fmtD(k+'T12:00:00')}: dijiste ${rtNum(x.pick)} · ${x.res?`hubo ${x.res.n} · ${x.res.ok?'exacto':x.res.near?'por uno':'fallaste'}, +${x.won} puntos`:'pendiente de datos'}</div>`).join('');
  let h=`<h3 id="rt-q">¿Cuántos lanzamientos de SpaceX habrá esta semana?</h3><p class="mut">De lunes a domingo ${fmtD(W.end)} a las 23:59, contando todos los cohetes de SpaceX que despeguen según Launch Library 2. Se apuesta hasta el miércoles a las 23:59. Exacto da ${RT_PTS.exact} puntos y quedarse a uno, ${RT_PTS.near}.</p>`;
  if(b)h+=`<p>${b.res?ic(b.res.ok||b.res.near,'Acierto','Fallo'):'<span role="img" aria-label="Pendiente">⏳</span>'} Dijiste <b>${rtNum(b.pick)}</b> cuando iban ${b.n0}${b.res?` · hubo ${b.res.n} · +${b.won} puntos`:' · se resuelve sola con los datos de después del domingo'}</p>`;
  else if(open)h+=`<div class="opts rt-opts" role="group" aria-labelledby="rt-q">${Array.from({length:RT_MAX+1},(_,i)=>i).filter(i=>i>=I.thisW.length).map(i=>`<button type="button" data-rt="${i}">${rtNum(i)}</button>`).join('')}</div>`;
  else h+='<p class="mut">La apuesta de esta semana cerró el miércoles a las 23:59. El lunes empieza otra.</p>';
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
function renderRitmo(){const el=$('#ritmo');if(!el||!D)return;const I=rtInfo();if(!I){el.innerHTML='';return}
  const dl=Object.entries(I.dist).sort((a,b)=>a[0]-b[0]).map(([n,c])=>`${rtNum(+n)}: ${c} ${c===1?'semana':'semanas'}`).join(' · ');
  el.innerHTML=`<div class="card daily ritmo"><div class="kick">Ritmo de lanzamientos</div>
  <div class="stats"><div><b>${rtHrs(I.med)}</b>mediana entre lanzamientos</div><div><b>${I.l7}</b>en los últimos 7 días</div><div><b>${I.l30}</b>en los últimos 30 días</div>${I.avgW!=null?`<div><b>${I.avgW.toFixed(1).replace('.',',')}</b>de media por semana</div>`:''}</div>
  <p class="mut">Récord de cadencia en los datos: ${rtHrs(I.min.ms)} entre ${esc(mname(I.min.a))} (${esc(I.min.a.rocket||'')}, ${fmt(I.min.a.net)}) y ${esc(mname(I.min.b))} (${esc(I.min.b.rocket||'')}).${I.best&&I.best.n?` Semana con más lanzamientos: ${I.best.n}, la del ${fmtD(I.best.s)}.`:''} Parón más largo: ${rtHrs(I.max.ms)}, antes de ${esc(mname(I.max.b))} (${fmtD(I.max.b.net)}).</p>
  <p class="mut">Último lanzamiento: ${esc(mname(I.last))}, hace ${rtHrs(I.sinceLast)}. Esta semana ${I.thisW.length===1?'va':'van'} <b>${I.thisW.length}</b>${I.left.length?` y ${I.left.length===1?'queda 1 previsto':`quedan ${I.left.length} previstos`} con hora fijada antes del domingo (${I.left.map(l=>esc(mname(l))).join(', ')})`:' y no queda ninguno con hora fijada antes del domingo'}.</p>
  ${dl?`<p class="mut">Lanzamientos por semana en las ${I.weeks.length} semanas completas de los datos: ${dl}.</p>`:''}
  ${ritmoBetHTML(I)}<div class="mut" style="margin-top:6px">Calculado con los últimos ${I.P.length} lanzamientos de SpaceX en Launch Library 2 (desde el ${fmtD(I.P[0].net)}), actualizados ${fmt(I.gen)}.</div></div>`}
function bindRitmo(){const el=$('#next');if(!el||el._rt)return;el._rt=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-rt]');if(!b)return;
  const I=rtInfo();if(!I)return;const W=I.W,all=LS.get('ritmo',{});if(Date.now()>=W.close||all[W.k]){renderRitmo();return}
  all[W.k]={pick:+b.dataset.rt,at:Date.now(),end:W.end,n0:I.thisW.length};LS.set('ritmo',all);
  aviso(`Apuesta guardada: ${rtNum(+b.dataset.rt)} lanzamientos esta semana.`);completeDaily('ritmo');renderRitmo();
  const q=$('#rt-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}
// ---------- Clientes de SpaceX y apuesta «¿de quién será el siguiente lanzamiento que no sea Starlink?» ----------
// Los clientes salen del campo cust de Launch Library 2 (data.json). La apuesta se guarda en sxp_cli y se resuelve sola con el primer
// lanzamiento real con cliente externo (o sin cliente indicado y que no sea Starlink) que despegue al menos 2 horas después de apostar.
const CLI_ES={'National Aeronautics and Space Administration':'NASA','United States Space Force':'Fuerza Espacial de EE. UU.','National Reconnaissance Office':'NRO (Oficina Nacional de Reconocimiento de EE. UU.)','Space Development Agency':'SDA (Agencia de Desarrollo Espacial de EE. UU.)','Canadian Space Agency':'Agencia Espacial Canadiense','Russian Federal Space Agency (ROSCOSMOS)':'Roscosmos (Agencia Espacial Rusa)','European Space Agency':'Agencia Espacial Europea (ESA)','Japan Aerospace Exploration Agency':'JAXA (Agencia Espacial Japonesa)'};
const cliN=c=>CLI_ES[c]||c,CLI_OTRO='__otro',CLI_PTS={fav:10,other:30},CLI_GAP=2*H,CLI_MAXO=5;
const cliExt=l=>!/^Starlink/i.test(mname(l))&&!((l.cust||[]).length&&(l.cust||[]).every(c=>c==='SpaceX'));
function cliInfo(){const d=rlD(),P=(d.previous||[]).filter(l=>!isNaN(new Date(l.net))).slice().sort((a,b)=>new Date(b.net)-new Date(a.net));if(!P.length)return null;
  const by={};for(const l of P)for(const c of (l.cust||[])){const x=by[c]||(by[c]={c,n:0,orb:{},last:null});x.n++;x.orb[l.orbit||'?']=(x.orb[l.orbit||'?']||0)+1;if(!x.last)x.last=l}
  const rows=Object.values(by).sort((a,b)=>b.n-a.n||new Date(b.last.net)-new Date(a.last.net));
  const star=P.filter(l=>/^Starlink/i.test(mname(l))).length,ext=P.filter(cliExt),noC=P.filter(l=>!(l.cust||[]).length).length,lastExt=ext[0]||null;
  const U=(d.upcoming||[]).filter(l=>!isNaN(new Date(l.net))&&cliExt(l)).slice().sort((a,b)=>new Date(a.net)-new Date(b.net));
  const opts=[];for(const l of U)for(const c of (l.cust||[]))if(c!=='SpaceX'&&!opts.some(o=>o.c===c)&&opts.length<CLI_MAXO)opts.push({c,l});
  const fav=U.length&&(U[0].cust||[]).length?U[0].cust.find(c=>c!=='SpaceX')||null:null;
  return{P,rows,star,ext,noC,lastExt,U,opts,fav,gen:d.generated}}
// Clientes recurrentes: clientes externos de la lista de próximos que ya han volado con SpaceX en los lanzamientos recientes de los datos,
// con los días entre sus dos últimos lanzamientos y cuánto pasará hasta el siguiente si sale en la fecha prevista.
function cliRep(I){const t=l=>new Date(l.net).getTime(),now=Date.now(),R={};
  for(const l of I.U)for(const c of (l.cust||[])){if(c==='SpaceX')continue;const r=R[c]||(R[c]={c,U:[]});if(!r.U.includes(l))r.U.push(l)}
  const rows=Object.values(R).map(r=>{const P=I.P.filter(l=>(l.cust||[]).includes(r.c)).sort((a,b)=>t(b)-t(a));const nx=r.U[0];
    return{c:r.c,U:r.U,P,nx,gap:P.length>=2?(t(P[0])-t(P[1]))/DAY:null,since:P.length?(now-t(P[0]))/DAY:null,toNext:P.length&&nx?(t(nx)-t(P[0]))/DAY:null}});
  const rep=rows.filter(r=>r.P.length).sort((a,b)=>t(a.nx)-t(b.nx)),neu=rows.filter(r=>!r.P.length).sort((a,b)=>t(a.nx)-t(b.nx));
  const t0=I.P.length?t(I.P[I.P.length-1]):null;return{rep,neu,t0}}
function cliRepHTML(I){const X=cliRep(I);if(!X.rep.length&&!X.neu.length)return'';
  const dd=x=>x==null?'—':(Math.abs(x)<10?x.toFixed(1).replace('.',','):String(Math.round(x)));
  const apx=l=>precise(l)||/^HOUR$/i.test(l.net_precision||'')?'':' (fecha aproximada)';
  const row=r=>`<tr><th scope="row">${esc(cliN(r.c))}</th><td>${r.P.length}<div class="mut">${r.P.slice(0,2).map(l=>`${esc(mname(l))}, ${fmtD(l.net)}`).join('<br>')}</div></td><td>${r.gap!=null?`<b>${dd(r.gap)} días</b>`:'<span class="mut">solo uno en los datos</span>'}</td><td>hace ${dd(r.since)} días</td><td>${esc(mname(r.nx))}<div class="mut">${fmtD(r.nx.net)}${apx(r.nx)}${r.toNext!=null&&r.toNext>=0?` · ${dd(r.toNext)} días después del último`:''}${r.U.length>1?` · y ${r.U.length-1} más en la lista`:''}</div></td></tr>`;
  return`<h4>Clientes que repiten</h4><p class="mut">${X.rep.length?`${X.rep.length} de los ${X.rep.length+X.neu.length} clientes externos de la lista de próximos ya han volado con SpaceX en los últimos ${I.P.length} lanzamientos de los datos${X.t0?` (desde el ${fmtD(X.t0)})`:''}.`:`Ninguno de los clientes externos de la lista de próximos aparece en los últimos ${I.P.length} lanzamientos de los datos.`}${X.neu.length?` Sin lanzamientos en ese periodo: ${X.neu.map(r=>esc(cliN(r.c))).join(', ')}.`:''}</p>
  ${X.rep.length?`<div class="tblw"><table class="stt"><caption class="sr">Clientes de la lista de próximos que ya han volado con SpaceX</caption><thead><tr><th scope="col">Cliente</th><th scope="col">Lanzamientos recientes</th><th scope="col">Entre sus dos últimos</th><th scope="col">Último</th><th scope="col">Siguiente en la lista</th></tr></thead><tbody>${X.rep.map(row).join('')}</tbody></table></div>`:''}`}
function cliState(){const s=LS.get('cli',{cur:null,hist:[]});s.hist=s.hist||[];return s}
function resolveCli(){const d=rlD();if(!d||!d.previous||!d.previous.length)return;const s=cliState(),b=s.cur;if(!b)return;
  const gen=new Date(d.generated).getTime();if(!(gen>b.at))return;
  const c=d.previous.filter(l=>new Date(l.net).getTime()>=b.at+CLI_GAP&&cliExt(l)).sort((x,y)=>new Date(x.net)-new Date(y.net))[0];if(!c)return;
  const cust=(c.cust||[]).filter(x=>x!=='SpaceX'),ok=b.pick===CLI_OTRO?!cust.some(x=>(b.opts||[]).includes(x)):cust.includes(b.pick);
  const won=ok?(b.pick===b.fav?CLI_PTS.fav:CLI_PTS.other):0;
  s.hist.unshift({...b,res:{m:mname(c),net:c.net,cust},ok,won,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('cli',s);
  if(won)addPts('cli',won);aviso(`Apuesta de clientes resuelta: fue ${mname(c)}${cust.length?` (${cust.map(cliN).join(', ')})`:''}. ${ok?`+${won} puntos.`:'Esta vez no.'}`)}
const cliPick=p=>p===CLI_OTRO?'otro cliente o uno sin indicar':cliN(p);
function cliBetHTML(I){const s=cliState(),b=s.cur;
  let h=`<h3 id="cli-q">¿De quién será el siguiente lanzamiento para un cliente externo?</h3><p class="mut">Ni Starlink ni misiones propias de SpaceX: cuenta el primer lanzamiento con un cliente distinto de la propia SpaceX (o sin cliente indicado en Launch Library 2, que va a «otro») que despegue al menos 2 horas después de apostar. Acertar el favorito (el cliente del primero previsto) da ${CLI_PTS.fav} puntos; cualquier otro, ${CLI_PTS.other}. Al resolverse puedes volver a apostar.</p>`;
  if(b)h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Apostaste por <b>${esc(cliPick(b.pick))}</b> el ${fmt(b.at)} · se resuelve sola cuando despegue el siguiente lanzamiento con cliente.</p>`;
  else if(I.opts.length)h+=`<div class="opts cli-opts" role="group" aria-labelledby="cli-q">${I.opts.map(o=>`<button type="button" data-cli="${esc(o.c)}">${esc(cliN(o.c))} (+${o.c===I.fav?CLI_PTS.fav:CLI_PTS.other})</button>`).join('')}<button type="button" data-cli="${CLI_OTRO}">Otro (+${CLI_PTS.other})</button></div>`;
  else h+='<p class="mut">Ahora no hay lanzamientos con cliente externo en la lista de próximos de Launch Library 2.</p>';
  const past=s.hist.slice(0,4).map(x=>`<div class="mut">${ic(x.ok)} Dijiste ${esc(cliPick(x.pick))} · fue ${esc(x.res.m)} (${x.res.cust.length?esc(x.res.cust.map(cliN).join(', ')):'sin cliente indicado'}, ${fmtD(x.res.net)}) · +${x.won} puntos</div>`).join('');
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
function renderClientes(){const el=$('#clientes');if(!el||!D)return;const I=cliInfo();if(!I){el.innerHTML='';return}
  const orbs=r=>Object.entries(r.orb).sort((a,b)=>b[1]-a[1]).map(([o,n])=>`${o==='N/A'||o==='?'?'sin órbita indicada':esc(orb(o))}${n>1?` (${n})`:''}`).join(', ');
  const row=r=>`<tr><th scope="row">${esc(cliN(r.c))}${cliN(r.c)!==r.c?`<div class="mut">${esc(r.c)}</div>`:''}</th><td>${r.n}</td><td>${orbs(r)}</td><td>${esc(mname(r.last))}<div class="mut">${fmtD(r.last.net)}</div></td></tr>`;
  const when=l=>precise(l)||/^HOUR$/i.test(l.net_precision||'')?fmt(l.net):`hacia el ${fmtD(l.net)} (fecha aún sin fijar)`;
  const nx=I.U.slice(0,4).map(l=>`<li>${esc(mname(l))} · ${(l.cust||[]).length?esc(l.cust.map(cliN).join(', ')):'sin cliente indicado'} · ${esc(orb(l.orbit))} · ${when(l)}</li>`).join('');
  const nC=I.rows.filter(r=>r.c!=='SpaceX').length;
  el.innerHTML=`<div class="card daily clientes"><div class="kick">Clientes de SpaceX</div>
  <div class="stats"><div><b>${I.ext.length}</b>de ${I.P.length} con cliente externo o sin indicar</div><div><b>${I.star}</b>de Starlink</div><div><b>${nC}</b>${nC===1?'cliente externo':'clientes externos'}</div></div>
  <p class="mut">Quién figura como cliente en los últimos ${I.P.length} lanzamientos de SpaceX según Launch Library 2, cuántos ha contratado cada uno y a qué órbitas fueron.${I.noC?` ${I.noC===1?'1 lanzamiento no tiene':`${I.noC} lanzamientos no tienen`} cliente indicado en la fuente y no sale${I.noC===1?'':'n'} en la tabla.`:''}${I.lastExt?` Último lanzamiento con cliente externo: ${esc(mname(I.lastExt))} (${fmtD(I.lastExt.net)}).`:''}</p>
  <div class="tblw"><table class="stt"><thead><tr><th scope="col">Cliente</th><th scope="col">Lanzamientos</th><th scope="col">Órbitas</th><th scope="col">Último</th></tr></thead><tbody>${I.rows.map(row).join('')}</tbody></table></div>
  ${nx?`<h4>Próximos con cliente externo</h4><ul class="mut">${nx}</ul>`:''}
  ${cliRepHTML(I)}
  ${cliBetHTML(I)}<div class="mut" style="margin-top:6px">Datos de Launch Library 2 actualizados ${fmt(I.gen)}.</div></div>`}
function bindClientes(){const el=$('#next');if(!el||el._cli)return;el._cli=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-cli]');if(!b)return;
  const I=cliInfo(),s=cliState();if(!I||s.cur){renderClientes();return}
  const pick=b.dataset.cli;if(pick!==CLI_OTRO&&!I.opts.some(o=>o.c===pick)){renderClientes();return}
  s.cur={pick,at:Date.now(),fav:I.fav,opts:I.opts.map(o=>o.c)};LS.set('cli',s);
  aviso(`Apuesta guardada: ${cliPick(pick)}.`);completeDaily('cli');renderClientes();
  const q=$('#cli-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}
// ---------- Ventanas de lanzamiento y apuesta «¿saldrá en el primer minuto de la ventana?» ----------
// Apertura (ws), cierre (we) y hora real (net) salen de Launch Library 2 (data.json). La apuesta se guarda en sxp_ven por lanzamiento,
// con la ventana que había al apostar, y se resuelve sola cuando el lanzamiento aparece en el historial (o si se aplaza fuera de esa ventana).
const VEN_PTS={si:30,no:5},VEN_CLOSE=30*6e4,VEN_MAXB=3;
const venDur=l=>l.ws&&l.we?Math.round((new Date(l.we)-new Date(l.ws))/6e4):null;
const venTxt=m=>m==null?'—':m===0?'instantánea':m<60?`${m} min`:`${Math.floor(m/60)} h${m%60?` ${m%60} min`:''}`;
const venOff=l=>(new Date(l.net)-new Date(l.ws))/6e4;
function venInfo(){const d=rlD(),P=(d.previous||[]).filter(l=>l.ws&&l.we&&!isNaN(new Date(l.net))&&precise(l)).slice().sort((a,b)=>new Date(b.net)-new Date(a.net));
  const W=P.filter(l=>venDur(l)>=1&&venOff(l)>=0&&venOff(l)<=venDur(l)+1);if(!W.length)return null;
  const med=a=>{const s=a.slice().sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:null};
  const first=W.filter(l=>venOff(l)<1).length,inst=P.filter(l=>venDur(l)===0).length;
  const U=(d.upcoming||[]).filter(l=>l.ws&&l.we&&precise(l)&&new Date(l.ws)>Date.now()-6*H).slice().sort((a,b)=>new Date(a.ws)-new Date(b.ws));
  return{P,W,first,inst,medDur:med(W.map(venDur)),medOff:med(W.map(l=>Math.floor(venOff(l)))),U,gen:d.generated}}
function venState(){const s=LS.get('ven',{cur:{},hist:[]});s.cur=s.cur||{};s.hist=s.hist||[];return s}
const venOpen=l=>venDur(l)>=1&&new Date(l.ws).getTime()-VEN_CLOSE>Date.now();
function resolveVen(){const d=rlD();if(!d||!d.previous)return;const s=venState();let ch=false;const gen=new Date(d.generated).getTime();
  for(const [id,b] of Object.entries(s.cur)){if(!(gen>b.at))continue;const ws0=new Date(b.ws).getTime(),we0=new Date(b.we).getTime();
    const p=d.previous.find(l=>l.id===id),u=(d.upcoming||[]).find(l=>l.id===id);let res=null;
    if(p&&!isNaN(new Date(p.net))){const off=(new Date(p.net).getTime()-ws0)/6e4;res={m:mname(p),net:p.net,first:off>=0&&off<1,off,txt:off>=0&&off<1?'despegó en el primer minuto':off<0?'despegó antes de la ventana prevista':off*6e4<=we0-ws0+6e4?`despegó en el minuto ${Math.floor(off)} de la ventana`:'despegó otro día, fuera de esa ventana'}}
    else if(u&&u.ws&&new Date(u.ws).getTime()>we0&&Date.now()>we0)res={m:mname(u),net:null,first:false,txt:`se aplazó fuera de esa ventana (nueva apertura ${fmt(u.ws)})`};
    else if(!p&&!u&&Date.now()>we0+3*DAY){delete s.cur[id];ch=true;continue}
    if(!res)continue;const ok=(b.pick==='si')===res.first,won=ok?VEN_PTS[b.pick]:0;
    s.hist.unshift({...b,id,res,ok,won,resAt:Date.now()});delete s.cur[id];ch=true;if(won)addPts('ven',won);
    aviso(`Apuesta de ventana resuelta: ${res.m} ${res.txt}. ${ok?`+${won} puntos.`:'Esta vez no.'}`)}
  if(ch){s.hist=s.hist.slice(0,20);LS.set('ven',s)}}
function renderVentanas(){const el=$('#ventanas');if(!el||!D)return;const I=venInfo();if(!I){el.innerHTML='';return}const s=venState();
  const up=I.U.slice(0,4).map(l=>{const dur=venDur(l),b=s.cur[l.id];
    let bet='';if(b)bet=`<div class="mut"><span role="img" aria-label="Pendiente">⏳</span> Apostaste «${b.pick==='si'?'Sí, en el primer minuto':'No'}» · se resuelve sola</div>`;
    else if(venOpen(l))bet=`<div class="opts" role="group" aria-label="¿Saldrá ${esc(mname(l))} en el primer minuto de su ventana?"><button type="button" data-ven="${esc(l.id)}" data-v="si">Sí, en el primer minuto (+${VEN_PTS.si})</button><button type="button" data-ven="${esc(l.id)}" data-v="no">No (+${VEN_PTS.no})</button></div>`;
    else if(dur>=1)bet='<div class="mut">Apuestas cerradas: faltan menos de 30 minutos para que abra la ventana o ya está abierta.</div>';
    return `<li><b>${esc(mname(l))}</b> · ${dur===0?`ventana instantánea a las ${fmt(l.ws)}`:`abre ${fmt(l.ws)} y cierra ${fmt(l.we)} (${venTxt(dur)})`}${bet}</li>`}).join('');
  const rows=I.W.slice(0,8).map(l=>`<tr><th scope="row">${esc(mname(l))}<div class="mut">${fmtD(l.net)}</div></th><td>${venTxt(venDur(l))}</td><td>${venOff(l)<1?'<b>primer minuto</b>':`minuto ${Math.floor(venOff(l))}`}</td></tr>`).join('');
  const past=s.hist.slice(0,4).map(x=>`<div class="mut">${ic(x.ok)} ${esc(x.m)}: dijiste ${x.pick==='si'?'«primer minuto»':'«no»'} · ${esc(x.res.txt)} · +${x.won} puntos</div>`).join('');
  const pc=Math.round(I.first/I.W.length*100);
  el.innerHTML=`<div class="card daily ventanas"><div class="kick">Ventanas de lanzamiento</div>
  <div class="stats"><div><b>${venTxt(I.medDur)}</b>duración mediana de la ventana</div><div><b>min ${I.medOff}</b>mediana del despegue dentro de la ventana</div><div><b>${pc}%</b>salieron en el primer minuto (${I.first} de ${I.W.length})</div></div>
  <p class="mut">Cada lanzamiento tiene una ventana: el intervalo en el que puede despegar. Calculado con la apertura, el cierre y la hora real de despegue que da Launch Library 2 para los últimos lanzamientos de SpaceX con hora exacta y ventana de al menos 1 minuto.${I.inst?` Otros ${I.inst} tuvieron ventana instantánea (un único momento posible, típico de los viajes a la Estación Espacial) y no cuentan aquí.`:''}</p>
  ${up?`<h4 id="ven-q">Próximas ventanas · ¿saldrá en el primer minuto?</h4><p class="mut">Apuesta hasta 30 minutos antes de que abra la ventana. Cuenta la ventana que había al apostar: si despega en su primer minuto gana «Sí» (${VEN_PTS.si} puntos); si sale más tarde o se aplaza a otra ventana, gana «No» (${VEN_PTS.no}).</p><ul class="ven-up">${up}</ul>`:'<p class="mut">Ahora no hay próximos lanzamientos con ventana fijada en Launch Library 2.</p>'}
  <h4>En qué minuto de su ventana despegaron</h4><div class="tblw"><table class="stt"><thead><tr><th scope="col">Misión</th><th scope="col">Ventana</th><th scope="col">Despegue</th></tr></thead><tbody>${rows}</tbody></table></div>
  ${past?`<div style="margin-top:8px">${past}</div>`:''}<div class="mut" style="margin-top:6px">Datos de Launch Library 2 actualizados ${fmt(I.gen)}.</div></div>`}
function bindVentanas(){const el=$('#next');if(!el||el._ven)return;el._ven=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-ven]');if(!b)return;
  const s=venState(),id=b.dataset.ven,l=(rlD().upcoming||[]).find(x=>x.id===id);
  if(!l||s.cur[id]||!venOpen(l)||Object.keys(s.cur).length>=VEN_MAXB){if(Object.keys(s.cur).length>=VEN_MAXB)aviso(`Puedes tener ${VEN_MAXB} apuestas de ventana a la vez.`);renderVentanas();return}
  s.cur[id]={pick:b.dataset.v==='si'?'si':'no',at:Date.now(),ws:l.ws,we:l.we,m:mname(l)};LS.set('ven',s);
  aviso(`Apuesta guardada: ${mname(l)} ${b.dataset.v==='si'?'saldrá en el primer minuto':'no saldrá en el primer minuto'}.`);completeDaily('ven');renderVentanas();
  const q=$('#ven-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}

// ---------- Zonas de aterrizaje y apuesta «¿dónde aterrizará el próximo propulsor?» ----------
// Historial total (lzones: aterrizajes logrados e intentados) y usos recientes (stages[].land_loc) salen de Launch Library 2 (data.json).
// La apuesta se guarda en sxp_zon y se resuelve sola con el primer lanzamiento del historial con zona indicada que despegue al menos
// 2 horas después de apostar (si lleva varios propulsores, vale cualquiera de sus zonas).
const ZON_GAP=2*H,ZON_FAV=5,ZON_MIN=5,ZON_MAX=50;
function zonInfo(){const d=rlD(),Z=d&&d.lzones;if(!Z||!Object.keys(Z).length)return null;
  const P=(d.previous||[]).filter(l=>!isNaN(new Date(l.net))).slice().sort((a,b)=>new Date(b.net)-new Date(a.net));
  const R={};let tot=0;for(const l of P)for(const s of (l.stages||[])){const k=s.land_loc;if(!k||!Z[k])continue;
    const r=R[k]||(R[k]={n:0,ok:0,last:null});r.n++;tot++;if(s.land_success)r.ok++;if(!r.last)r.last=l}
  const U=(d.upcoming||[]).filter(l=>!isNaN(new Date(l.net))&&new Date(l.net)>Date.now()-3*H).slice().sort((a,b)=>new Date(a.net)-new Date(b.net));
  const nx={};for(const l of U)for(const s of (l.stages||[])){const k=s.land_loc;if(k&&Z[k]&&!nx[k])nx[k]=l}
  const firstL=U.find(l=>(l.stages||[]).some(s=>s.land_loc&&Z[s.land_loc]))||null;
  const fav=firstL?(firstL.stages.find(s=>s.land_loc&&Z[s.land_loc])||{}).land_loc:null;
  const rows=Object.entries(Z).map(([k,z])=>({k,...z,rn:(R[k]||{}).n||0,rok:(R[k]||{}).ok||0,last:(R[k]||{}).last||null,next:nx[k]||null}))
    .sort((a,b)=>b.rn-a.rn||(b.att||0)-(a.att||0));
  const pts=k=>{if(k===fav)return ZON_FAV;const n=(R[k]||{}).n||0;return n&&tot?Math.max(ZON_MIN,Math.min(ZON_MAX,Math.round(5*tot/n))):ZON_MAX};
  const opts=rows.filter(r=>r.active!==false&&(r.rn||r.next)).map(r=>({k:r.k,pts:pts(r.k)}));
  return{P,rows,tot,fav,firstL,opts,gen:d.generated}}
function zonState(){const s=LS.get('zon',{cur:null,hist:[]});s.hist=s.hist||[];return s}
function resolveZon(){const d=rlD();if(!d||!d.previous||!d.lzones)return;const s=zonState(),b=s.cur;if(!b)return;
  const gen=new Date(d.generated).getTime();if(!(gen>b.at))return;
  const c=d.previous.filter(l=>new Date(l.net).getTime()>=b.at+ZON_GAP&&(l.stages||[]).some(x=>x.land_loc&&d.lzones[x.land_loc])).sort((x,y)=>new Date(x.net)-new Date(y.net))[0];if(!c)return;
  const ks=[...new Set(c.stages.filter(x=>x.land_loc&&d.lzones[x.land_loc]).map(x=>x.land_loc))],ok=ks.includes(b.pick),won=ok?b.pts:0;
  s.hist.unshift({...b,res:{m:mname(c),net:c.net,ks},ok,won,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('zon',s);
  if(won)addPts('zon',won);aviso(`Apuesta de aterrizaje resuelta: ${mname(c)} usó ${ks.join(', ')}. ${ok?`+${won} puntos.`:'Esta vez no.'}`)}
const zonPct=(a,b)=>b?Math.round(100*a/b)+' %':'—';
function zonName(I,k){const z=(I.rows.find(r=>r.k===k)||{});return z.name&&z.name!==k?`${z.name} (${k})`:k}
function zonBetHTML(I){const s=zonState(),b=s.cur;
  let h=`<h3 id="zon-q">¿Dónde aterrizará el próximo propulsor?</h3><p class="mut">Cuenta el primer lanzamiento que despegue al menos 2 horas después de apostar con zona de recuperación indicada en Launch Library 2 (barcaza, zona en tierra o el mar si la etapa no se recupera). Los puntos dependen de lo raro que sea: ${I.fav?`la zona asignada al primer lanzamiento previsto (${esc(I.fav)}, para ${esc(mname(I.firstL))}) da solo ${ZON_FAV}; `:''}las demás, según lo poco que se han usado en los últimos lanzamientos, hasta ${ZON_MAX}.</p>`;
  if(b)h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Apostaste por <b>${esc(b.name||b.pick)}</b> (+${b.pts}) el ${fmt(b.at)} · se resuelve sola con el siguiente lanzamiento con zona.</p>`;
  else if(I.opts.length)h+=`<div class="opts zon-opts" role="group" aria-labelledby="zon-q">${I.opts.map(o=>`<button type="button" data-zon="${esc(o.k)}">${esc(o.k)} (+${o.pts})</button>`).join('')}</div>`;
  else h+='<p class="mut">Ahora no hay zonas activas con usos recientes o previstos en Launch Library 2.</p>';
  const past=s.hist.slice(0,4).map(x=>`<div class="mut">${ic(x.ok)} Dijiste ${esc(x.pick)} · ${esc(x.res.m)} usó ${esc(x.res.ks.join(', '))} (${fmtD(x.res.net)}) · +${x.won} puntos</div>`).join('');
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
function renderZonas(){const el=$('#zonas');if(!el||!D)return;const I=zonInfo();if(!I){el.innerHTML='';return}
  const rec=I.rows.filter(r=>r.type!=='EXP'),ok=rec.reduce((a,r)=>a+(r.ok||0),0),att=rec.reduce((a,r)=>a+(r.att||0),0);
  const row=r=>`<tr><th scope="row">${esc(r.k)}<div class="mut">${esc(r.name||'')}${r.active===false?' · ya no está en servicio':''}</div></th><td>${esc(lzLabel(r.type))}</td><td>${r.type==='EXP'?`${r.att||0} etapas sin recuperar`:`${zonPct(r.ok||0,r.att||0)}<div class="mut">${r.ok||0} de ${r.att||0}</div>`}</td><td>${r.rn}${r.rn&&r.type!=='EXP'?`<div class="mut">${r.rok} con éxito</div>`:''}</td><td>${r.next?`${esc(mname(r.next))}<div class="mut">${fmtD(r.next.net)}</div>`:'—'}</td></tr>`;
  el.innerHTML=`<div class="card daily zonas"><div class="kick">Zonas de aterrizaje</div>
  <div class="stats"><div><b>${zonPct(ok,att)}</b>aterrizajes con éxito en todas las zonas (${ok} de ${att})</div><div><b>${I.tot}</b>usos en los últimos ${I.P.length} lanzamientos</div><div><b>${I.rows.filter(r=>r.active!==false).length}</b>zonas en servicio</div></div>
  <p class="mut">Porcentaje de éxito de cada barcaza y zona en tierra con los aterrizajes logrados e intentados de todo su historial según Launch Library 2, cuántas veces se usó cada una en los últimos ${I.P.length} lanzamientos de SpaceX y cuál es su siguiente misión prevista.</p>
  <div class="tblw"><table class="stt"><thead><tr><th scope="col">Zona</th><th scope="col">Tipo</th><th scope="col">Éxito histórico</th><th scope="col">Usos recientes</th><th scope="col">Siguiente</th></tr></thead><tbody>${I.rows.map(row).join('')}</tbody></table></div>
  ${zonBetHTML(I)}<div class="mut" style="margin-top:6px">Datos de Launch Library 2 actualizados ${fmt(I.gen)}.</div></div>`}
function bindZonas(){const el=$('#next');if(!el||el._zon)return;el._zon=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-zon]');if(!b)return;
  const I=zonInfo(),s=zonState();if(!I||s.cur){renderZonas();return}
  const o=I.opts.find(x=>x.k===b.dataset.zon);if(!o){renderZonas();return}
  s.cur={pick:o.k,name:zonName(I,o.k),pts:o.pts,at:Date.now()};LS.set('zon',s);
  aviso(`Apuesta guardada: ${o.k} (+${o.pts} si aciertas).`);completeDaily('zon');renderZonas();
  const q=$('#zon-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}

// ---------- Trabajar en SpaceX por ciudades ----------
// Ofertas reales del tablón público de SpaceX en Greenhouse (data.json → jobs.cities y jobs.interns), agrupadas por ubicación.
let EMP_SEL=null;
const empLoc=n=>{n=(n||'').trim();if(/^Flexible\b/i.test(n))return 'Cualquier sede de SpaceX (flexible)';const r=n.match(/^Remote\s*-\s*(.+)$/i);return r?`En remoto (${r[1]})`:n};
function empInfo(){const J=D&&D.jobs;if(!J||!J.total||!Array.isArray(J.cities)||!J.cities.length)return null;return J}
function renderEmpleo(){const el=$('#empleo');if(!el||!D)return;const J=empInfo();if(!J){el.innerHTML='';return}
  const C=J.cities,sel=C.find(c=>c.loc===EMP_SEL)||C[0],max=C[0].n,top=C.slice(0,8);
  const bar=c=>`<li><button type="button" class="linkish" data-emp="${esc(c.loc)}"${c.loc===sel.loc?' aria-current="true"':''}>${esc(empLoc(c.loc))}</button> <b>${c.n.toLocaleString('es-ES')}</b>${c.intern?` · ${c.intern} de prácticas`:''}<div class="empbar" aria-hidden="true"><span style="width:${Math.max(2,Math.round(c.n/max*100))}%"></span></div></li>`;
  const job=j=>`<li><a href="${esc(j.url)}" target="_blank" rel="noopener">${esc(j.t)}<span class="sr"> (se abre en otra pestaña)</span></a>${j.loc?` · ${esc(empLoc(j.loc))}`:''}${j.pub?` <span class="mut">· publicada el ${fmtD(j.pub+'T12:00:00Z')}</span>`:''}</li>`;
  const ints=(J.interns||[]).slice(0,12);
  el.innerHTML=`<div class="card daily empleo"><div class="kick">Trabajar en SpaceX por ciudades</div>
  <div class="stats"><div><b>${J.total.toLocaleString('es-ES')}</b>ofertas abiertas</div><div><b>${C.length}</b>ubicaciones</div><div><b>${J.intern||0}</b>de prácticas</div></div>
  <p class="mut">Todas las ofertas publicadas ahora mismo en el tablón de empleo de SpaceX (Greenhouse), agrupadas por la ubicación que indica cada una. Elige una ciudad para ver sus ofertas más recientes.</p>
  <label for="emp-sel">Ciudad</label> <select id="emp-sel">${C.map(c=>`<option value="${esc(c.loc)}"${c.loc===sel.loc?' selected':''}>${esc(empLoc(c.loc))} (${c.n})</option>`).join('')}</select>
  <h4 id="emp-city">${esc(empLoc(sel.loc))}: ${sel.n.toLocaleString('es-ES')} ${sel.n===1?'oferta':'ofertas'}${sel.intern?`, ${sel.intern} de prácticas`:''}</h4>
  <ul>${(sel.recent||[]).map(job).join('')}</ul>${sel.n>(sel.recent||[]).length?`<p class="mut">Estas son las ${(sel.recent||[]).length} más recientes; el resto está en la <a href="${esc(J.url||'https://www.spacex.com/careers/')}" target="_blank" rel="noopener">página de empleo de SpaceX</a>.</p>`:''}
  <h4>Dónde hay más ofertas</h4><ul class="emp-top">${top.map(bar).join('')}</ul>
  ${ints.length?`<h4><span aria-hidden="true">⭐</span> Prácticas</h4><ul class="emp-int">${ints.map(job).join('')}</ul>`:'<p class="mut">Ahora mismo no hay ofertas de prácticas publicadas.</p>'}
  <div class="mut" style="margin-top:6px">Fuente: ${esc(J.source||'SpaceX en Greenhouse')}, actualizado ${fmt(J.at)}.</div></div>`}
function bindEmpleo(){const el=$('#next');if(!el||el._emp)return;el._emp=true;
  const go=(v,f)=>{EMP_SEL=v;renderEmpleo();const q=$(f?'#emp-sel':'#emp-city');try{q&&(q.tabIndex=q.tabIndex<0?-1:q.tabIndex,q.focus())}catch(e){}};
  el.addEventListener('change',e=>{if(e.target&&e.target.id==='emp-sel')go(e.target.value,true)});
  el.addEventListener('click',e=>{const b=e.target.closest('button[data-emp]');if(b)go(b.dataset.emp,false)})}

// ---------- Lanzamientos por mes y apuesta «¿superará este mes al anterior?» ----------
// Barras por mes (hora local) y por cohete con los últimos lanzamientos de SpaceX de data.json (Launch Library 2).
// La apuesta se guarda en sxp_mes (por mes), cierra 7 días antes de que acabe el mes y se resuelve sola con los datos de después.
const MES_PTS={no:20,min:10,max:40},MES_CLOSE=7*DAY;
const MES_N=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const mesKey=t=>{const z=new Date(t);return z.getFullYear()+'-'+String(z.getMonth()+1).padStart(2,'0')};
const mesStart=k=>{const[y,m]=k.split('-').map(Number);return new Date(y,m-1,1).getTime()};
const mesEnd=k=>{const[y,m]=k.split('-').map(Number);return new Date(y,m,1).getTime()-1};
const mesPrev=k=>{const[y,m]=k.split('-').map(Number);return mesKey(new Date(y,m-2,1))};
const mesName=k=>{const[y,m]=k.split('-').map(Number);return MES_N[m-1]+' de '+y};
const mesRk=r=>/Starship/i.test(r||'')?'Starship':/Heavy/i.test(r||'')?'Falcon Heavy':/Falcon 9/i.test(r||'')?'Falcon 9':(r||'Otro');
const MES_COL={'Falcon 9':'#cfd8e3','Falcon Heavy':'#6ea8ff','Starship':'#ffb547'};
function mesInfo(){const d=rlD(),P=(d.previous||[]).filter(l=>!isNaN(new Date(l.net))).slice().sort((a,b)=>new Date(a.net)-new Date(b.net));if(!P.length)return null;
  const now=Date.now(),cur=mesKey(now),prev=mesPrev(cur),old=new Date(P[0].net).getTime(),M={};
  for(const l of P){const k=mesKey(l.net),m=M[k]||(M[k]={k,n:0,by:{}});m.n++;const r=mesRk(l.rocket);m.by[r]=(m.by[r]||0)+1}
  const keys=[];for(let k=mesKey(old);k<=cur;){keys.push(k);const[y,m]=k.split('-').map(Number);k=mesKey(new Date(y,m,1))}
  const rows=keys.map(k=>({...(M[k]||{k,n:0,by:{}}),part:mesStart(k)<old,cur:k===cur}));// part: los datos no cubren el mes entero
  const C=rows.find(r=>r.k===cur),Pv=rows.find(r=>r.k===prev),full=rows.filter(r=>!r.part&&!r.cur);
  const left=(d.upcoming||[]).filter(l=>{const x=new Date(l.net).getTime();return precise(l)&&x>now-3*H&&x<=mesEnd(cur)&&!P.some(p=>p.id===l.id)});
  const rk=[...new Set(P.map(l=>mesRk(l.rocket)))].sort((a,b)=>(a==='Falcon 9'?-1:b==='Falcon 9'?1:a<b?-1:1));
  const best=full.reduce((m,r)=>!m||r.n>m.n?r:m,null),avg=full.length?full.reduce((s,r)=>s+r.n,0)/full.length:null;
  const close=mesEnd(cur)+1-MES_CLOSE;
  return{P,rows,cur,prev,C:C||{k:cur,n:0,by:{}},Pv:Pv&&!Pv.part?Pv:null,left,rk,best,avg,full,close,gen:d.generated}}
function mesSiPts(need){return Math.max(MES_PTS.min,Math.min(MES_PTS.max,10*need))}
function resolveMes(){const d=rlD();if(!d||!d.previous||!d.previous.length)return;const all=LS.get('mes',{}),gen=new Date(d.generated).getTime();let ch=false,won=0;
  const old=d.previous.reduce((m,l)=>Math.min(m,new Date(l.net).getTime()),Infinity);
  for(const [k,b] of Object.entries(all)){if(b.res)continue;const e=mesEnd(k);if(!(gen>e+6*H))continue;// espera unas horas a que la fuente pase los últimos lanzamientos del mes al historial
    if(old>mesStart(k)){if(Date.now()>e+30*DAY){delete all[k];ch=true}continue}// la lista ya no cubre ese mes
    const n=d.previous.filter(l=>mesKey(l.net)===k).length,beat=n>b.prev,ok=(b.pick==='si')===beat;
    b.res={n,beat};b.won=ok?b.pts:0;b.ok=ok;b.resAt=Date.now();if(b.won)won+=b.won;ch=true}
  if(ch){LS.set('mes',all);if(won){addPts('mes',won);aviso(`Apuesta del mes resuelta: +${won} puntos.`)}}}
function mesBetHTML(I){const all=LS.get('mes',{}),b=all[I.cur],open=Date.now()<I.close,pv=I.Pv,need=pv?pv.n-I.C.n+1:null;
  const past=Object.entries(all).filter(([k])=>k!==I.cur).sort((a,c)=>c[0]<a[0]?-1:1).slice(0,4).map(([k,x])=>`<div class="mut">${x.res?ic(x.ok):''} ${esc(mesName(k))}: dijiste ${x.pick==='si'?'que superaría':'que no superaría'} los ${x.prev} del mes anterior · ${x.res?`hubo ${x.res.n} · +${x.won} puntos`:'pendiente de datos'}</div>`).join('');
  let h=`<h3 id="mes-q">¿Superará ${esc(mesName(I.cur).split(' de ')[0])} a ${esc(mesName(I.prev).split(' de ')[0])}?</h3>`;
  if(!pv)return h+'<p class="mut">Los datos no cubren el mes anterior entero, así que este mes no hay apuesta.</p>'+past;
  h+=`<p class="mut">Gana «Sí» si este mes hay más lanzamientos de SpaceX que los ${pv.n} de ${esc(mesName(I.prev).split(' de ')[0])}; empatar cuenta como «No». Se apuesta hasta 7 días antes de que acabe el mes (${fmt(I.close-1)}). «Sí» da más puntos cuantos más lanzamientos falten (10 por cada uno, de ${MES_PTS.min} a ${MES_PTS.max}); «No», ${MES_PTS.no}. Se resuelve sola con los datos del mes ya cerrado.</p>`;
  if(b)h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Dijiste <b>${b.pick==='si'?'Sí, lo superará':'No lo superará'}</b> cuando iban ${b.n0} de ${b.prev} (+${b.pts} si aciertas) · se resuelve sola cuando acabe el mes.</p>`;
  else if(need<=0)h+=`<p class="mut">Este mes ya lleva ${I.C.n} y ha superado los ${pv.n} del anterior, así que la apuesta está decidida. El mes que viene hay otra.</p>`;
  else if(open)h+=`<div class="opts" role="group" aria-labelledby="mes-q"><button type="button" data-mes="si">Sí, lo superará (+${mesSiPts(need)})</button><button type="button" data-mes="no">No (+${MES_PTS.no})</button></div>`;
  else h+='<p class="mut">La apuesta de este mes cerró 7 días antes de su final. El día 1 empieza otra.</p>';
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
function renderMeses(){const el=$('#meses');if(!el||!D)return;const I=mesInfo();if(!I){el.innerHTML='';return}
  const max=Math.max(1,...I.rows.map(r=>r.n)),pv=I.Pv,dif=pv?I.C.n-pv.n:null;
  const bar=r=>{const segs=I.rk.filter(k=>r.by[k]).map(k=>`<span style="height:${r.by[k]/max*100}%;background:${MES_COL[k]||'#888'}" title="${esc(k)}: ${r.by[k]}"></span>`).join('');
    const lab=mesName(r.k).split(' de ')[0].slice(0,3);
    return `<li class="${r.cur?'cur':''}${r.part?' part':''}"><div class="mb-n">${r.n}</div><div class="mb-b" aria-hidden="true">${segs}</div><div class="mb-l">${lab}${r.cur?'*':r.part?'†':''}</div><span class="sr">${esc(mesName(r.k))}: ${r.n} ${r.n===1?'lanzamiento':'lanzamientos'}${Object.keys(r.by).length?' ('+I.rk.filter(k=>r.by[k]).map(k=>`${k} ${r.by[k]}`).join(', ')+')':''}${r.cur?', mes en curso':r.part?', los datos no cubren el mes entero':''}</span></li>`};
  const leg=I.rk.map(k=>`<span class="mb-k"><i style="background:${MES_COL[k]||'#888'}"></i>${esc(k)}</span>`).join('');
  el.innerHTML=`<div class="card daily meses"><div class="kick">Lanzamientos por mes</div>
  <div class="stats"><div><b>${I.C.n}</b>en ${esc(mesName(I.cur).split(' de ')[0])} (hasta hoy)</div>${pv?`<div><b>${pv.n}</b>en ${esc(mesName(I.prev).split(' de ')[0])}</div>`:''}${I.avg!=null?`<div><b>${I.avg.toFixed(1).replace('.',',')}</b>de media en los meses completos</div>`:''}</div>
  <ul class="mbars" role="list" aria-label="Lanzamientos de SpaceX por mes">${I.rows.map(bar).join('')}</ul><div class="mb-leg">${leg}</div>
  <p class="mut">${pv?(dif>0?`Este mes ya lleva ${dif} más que el anterior.`:dif===0?'Este mes va empatado con el anterior.':`A este mes le ${-dif+1===1?'falta 1 lanzamiento':`faltan ${-dif+1} lanzamientos`} para superar al anterior.`):''} ${I.left.length?`Quedan ${I.left.length} ${I.left.length===1?'previsto':'previstos'} con hora fijada antes de que acabe el mes (${I.left.map(l=>`${esc(mname(l))}, ${fmtD(l.net)}`).join('; ')}).`:'No queda ningún lanzamiento con hora fijada antes de que acabe el mes.'}${I.best?` Mes con más lanzamientos en los datos: ${esc(mesName(I.best.k))}, con ${I.best.n}.`:''}</p>
  <p class="mut">* mes en curso${I.rows.some(r=>r.part)?' · † los datos no cubren el mes entero':''}.</p>
  ${mesBetHTML(I)}<div class="mut" style="margin-top:6px">Calculado con los últimos ${I.P.length} lanzamientos de SpaceX en Launch Library 2 (desde el ${fmtD(I.P[0].net)}), por mes en tu hora local, actualizados ${fmt(I.gen)}.</div></div>`}
function bindMeses(){const el=$('#next');if(!el||el._mes)return;el._mes=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-mes]');if(!b)return;
  const I=mesInfo();if(!I||!I.Pv){renderMeses();return}const all=LS.get('mes',{}),need=I.Pv.n-I.C.n+1;if(Date.now()>=I.close||all[I.cur]||need<=0){renderMeses();return}
  const pick=b.dataset.mes==='si'?'si':'no',pts=pick==='si'?mesSiPts(need):MES_PTS.no;
  all[I.cur]={pick,pts,at:Date.now(),n0:I.C.n,prev:I.Pv.n};LS.set('mes',all);
  aviso(`Apuesta guardada: ${pick==='si'?'este mes superará':'este mes no superará'} al anterior (+${pts} si aciertas).`);completeDaily('mes');renderMeses();
  const q=$('#mes-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}

// ---------- Récord de cada cohete (Falcon 9, Falcon Heavy, Starship) ----------
// Solo cuenta lo que hay en data.json: lanzamientos recientes («previous») y próximos («upcoming») de Launch Library 2.
const COH_RK=['Falcon 9','Falcon Heavy','Starship'];
function cohNet(l){const p=String(l.net_precision||'').toUpperCase(),d=new Date(l.net);
  if(/^(SEC|MIN|HOUR)$/.test(p))return fmt(l.net);
  if(/^(DAY)$/.test(p))return `${fmtD(l.net)} (sin hora fijada)`;
  const y=d.getUTCFullYear(),q=p.match(/^Q([1-4])$/),hf=p.match(/^H([12])$/);
  if(p==='M')return `sin día fijado (previsto para ${d.toLocaleDateString('es-ES',{month:'long',year:'numeric',timeZone:'UTC'})})`;
  if(q)return `sin día fijado (previsto para el ${['primer','segundo','tercer','cuarto'][q[1]-1]} trimestre de ${y})`;
  if(hf)return `sin día fijado (previsto para el ${hf[1]==='1'?'primer':'segundo'} semestre de ${y})`;
  if(p==='Y')return `sin día fijado (previsto para ${y})`;
  return 'sin fecha fijada todavía'}
function cohInfo(){const d=rlD();if(!d||!Array.isArray(d.previous)||!d.previous.length)return null;const now=Date.now();
  const P=[...d.previous].sort((a,b)=>new Date(a.net)-new Date(b.net)),U=[...(d.upcoming||[])].filter(l=>new Date(l.net).getTime()>now-3*H).sort((a,b)=>new Date(a.net)-new Date(b.net));
  const rows=COH_RK.map(k=>{const L=P.filter(l=>mesRk(l.rocket)===k),ok=L.filter(l=>/^Success$/i.test(l.status||'')).length;
    let att=0,land=0;for(const l of L)for(const s of (l.stages||[]))if(s.land_attempt){att++;if(s.land_success===true)land++}
    const last=L[L.length-1],next=U.find(l=>mesRk(l.rocket)===k&&!P.some(p=>p.id===l.id));
    return{k,n:L.length,ok,att,land,last,days:last?Math.floor((now-new Date(last.net).getTime())/DAY):null,next}});
  return{rows,P,gen:d.generated}}
function renderCohetes(){const el=$('#cohetes');if(!el||!D)return;const I=cohInfo();if(!I){el.innerHTML='';return}
  const col=k=>`<i class="coh-dot" style="background:${MES_COL[k]||'#888'}" aria-hidden="true"></i>`;
  const card=r=>`<div class="coh"><h3>${col(r.k)}${esc(r.k)}</h3>${r.n?`<div class="stats"><div><b>${r.n}</b>${r.n===1?'lanzamiento':'lanzamientos'}${r.ok<r.n?` (${r.ok} con éxito)`:r.n>1?', todos con éxito':', con éxito'}</div><div><b>${r.att?`${r.land}/${r.att}`:'—'}</b>${r.att?'aterrizajes logrados':'sin intentos de aterrizaje'}</div><div><b>${r.days}</b>${r.days===1?'día':'días'} desde su último vuelo</div></div>
    <p class="mut">Último: ${esc(mname(r.last))}, ${fmtD(r.last.net)}.</p>`:'<p class="mut">No ha volado en el periodo que cubren los datos.</p>'}
    <p class="mut">Próximo: ${r.next?`${esc(mname(r.next))}, ${esc(cohNet(r.next))}.`:'no hay ninguno en la lista de próximos lanzamientos.'}</p></div>`;
  const busy=I.rows.filter(r=>r.n).sort((a,b)=>a.days-b.days)[0];
  el.innerHTML=`<div class="card daily cohetes"><div class="kick">Récord de cada cohete</div>
  <div class="coh-grid">${I.rows.map(card).join('')}</div>
  ${busy?`<p class="mut">El último en volar fue el ${esc(busy.k)}, hace ${busy.days} ${busy.days===1?'día':'días'}. Los aterrizajes cuentan cada propulsor que intentó volver (en el Falcon Heavy, los laterales y el central por separado).</p>`:''}
  <div class="mut" style="margin-top:6px">Calculado con los últimos ${I.P.length} lanzamientos de SpaceX en Launch Library 2 (desde el ${fmtD(I.P[0].net)}) y su lista de próximos, actualizados ${fmt(I.gen)}.</div></div>`}

// ---------- Hora del despegue y apuesta «¿despegará de noche el próximo?» ----------
// Con la hora real de despegue de Launch Library 2 y las coordenadas de la plataforma: hora local de la plataforma,
// hora de España y si el Sol estaba bajo el horizonte (cálculo astronómico estándar, sin datos inventados).
// La apuesta se guarda en sxp_hora ({cur,hist}) y se resuelve sola con el primer lanzamiento que despegue al menos 2 h después de apostar.
const HORA_GAP=2*H,HORA_PTS={fav:5,contra:25,base:10,dudosa:20};
const HORA_TZ=[[/Vandenberg/i,'America/Los_Angeles'],[/Canaveral|Kennedy|Florida/i,'America/New_York'],[/Starbase|Boca Chica|Texas/i,'America/Chicago']];
const horaTz=l=>{const m=HORA_TZ.find(([r])=>r.test(l.loc||''));return m?m[1]:null};
const horaLoc=l=>String(l.loc||'').split(',')[0];
function horaH(t,tz){try{const p=new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(t));
  return +p.find(x=>x.type==='hour').value+(+p.find(x=>x.type==='minute').value)/60}catch(e){return null}}
const horaFmt=(t,tz)=>{try{return new Date(t).toLocaleTimeString('es-ES',{timeZone:tz,hour:'2-digit',minute:'2-digit'})}catch(e){return ''}};
function sunEl(t,lat,lon){// elevación del Sol en grados (aproximación del Astronomical Almanac, error < 1°)
  const r=Math.PI/180,d=t/DAY+2440587.5-2451545,g=(357.529+0.98560028*d)*r,q=280.459+0.98564736*d,L=(q+1.915*Math.sin(g)+0.02*Math.sin(2*g))*r,e=(23.439-3.6e-7*d)*r;
  const ra=Math.atan2(Math.cos(e)*Math.sin(L),Math.cos(L)),dec=Math.asin(Math.sin(e)*Math.sin(L)),gmst=((18.697374558+24.06570982441908*d)%24+24)%24;
  const ha=(gmst*15+lon)*r-ra;return Math.asin(Math.sin(lat*r)*Math.sin(dec)+Math.cos(lat*r)*Math.cos(dec)*Math.cos(ha))/r}
const HORA_FR=[['Madrugada','de 0:00 a 6:00',0,6],['Mañana','de 6:00 a 12:00',6,12],['Tarde','de 12:00 a 20:00',12,20],['Noche','de 20:00 a 24:00',20,24]];
const horaFr=h=>h==null?null:HORA_FR.find(f=>h>=f[2]&&h<f[3]);
function horaOf(l){const t=new Date(l.net).getTime(),tz=horaTz(l);if(isNaN(t)||l.lat==null||l.lon==null)return null;
  const el=sunEl(t,+l.lat,+l.lon),h=tz?horaH(t,tz):null;
  return{l,t,tz,h,fr:horaFr(h),es:horaFr(horaH(t,'Europe/Madrid')),el,night:el<-0.833,tw:el<-0.833&&el>=-6}}
function horaInfo(){const d=rlD();if(!d||!Array.isArray(d.previous)||!d.previous.length)return null;const now=Date.now();
  const P=d.previous.filter(l=>precise(l)).map(horaOf).filter(Boolean).sort((a,b)=>b.t-a.t);if(!P.length)return null;
  const U=(d.upcoming||[]).filter(l=>precise(l)&&!/TBD/i.test(l.status||'')&&new Date(l.net).getTime()>now+HORA_GAP&&!d.previous.some(p=>p.id===l.id)).map(horaOf).filter(Boolean).sort((a,b)=>a.t-b.t);
  const cnt=(arr,f)=>HORA_FR.map(x=>({x,n:arr.filter(o=>f(o)&&f(o)[0]===x[0]).length}));
  const nN=P.filter(o=>o.night).length,tw=P.filter(o=>o.tw).length;
  const by={};for(const o of P){const k=horaLoc(o.l),b=by[k]||(by[k]={k,n:0,night:0});b.n++;if(o.night)b.night++}
  const first=U[0]||null,base=nN*2>=P.length;// sin hora prevista, favorito = lo más habitual en los datos
  const pts=pick=>first?((pick==='si')===first.night?HORA_PTS.fav:HORA_PTS.contra):((pick==='si')===base?HORA_PTS.base:HORA_PTS.dudosa);
  return{P,U,fr:cnt(P,o=>o.fr),es:cnt(P,o=>o.es),nN,tw,by:Object.values(by).sort((a,b)=>b.n-a.n),first,pts,gen:d.generated}}
function horaState(){const s=LS.get('hora',{cur:null,hist:[]});s.hist=s.hist||[];return s}
function resolveHora(){const d=rlD();if(!d||!d.previous)return;const s=horaState(),b=s.cur;if(!b)return;
  if(!(new Date(d.generated).getTime()>b.at))return;
  const c=d.previous.filter(l=>precise(l)&&new Date(l.net).getTime()>=b.at+HORA_GAP).map(horaOf).filter(Boolean).sort((x,y)=>x.t-y.t)[0];if(!c)return;
  const ok=(b.pick==='si')===c.night,won=ok?b.pts:0;
  s.hist.unshift({...b,res:{m:mname(c.l),net:c.l.net,night:c.night,tw:c.tw,loc:horaLoc(c.l),lh:c.tz?horaFmt(c.t,c.tz):''},ok,won,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('hora',s);
  if(won)addPts('hora',won);aviso(`Apuesta de la hora resuelta: ${mname(c.l)} despegó ${c.night?'de noche':'de día'}. ${ok?`+${won} puntos.`:'Esta vez no.'}`)}
function horaBetHTML(I){const s=horaState(),b=s.cur,f=I.first;
  let h=`<h3 id="hora-q">¿Despegará de noche el próximo lanzamiento?</h3><p class="mut">Cuenta el primer lanzamiento de SpaceX que despegue al menos 2 horas después de apostar, sea cual sea. «De noche» quiere decir con el Sol bajo el horizonte en la plataforma, calculado con la hora real de despegue de Launch Library 2 y sus coordenadas. ${f?`El primero con hora fijada es ${esc(mname(f.l))} (${esc(horaLoc(f.l))}), previsto a las ${esc(horaFmt(f.t,f.tz))} hora local, ${f.night?'de noche':'de día'}: acertar con el horario previsto da ${HORA_PTS.fav} puntos y apostar a que un retraso lo cambia, ${HORA_PTS.contra}.`:`Ahora no hay ninguno con hora fijada, así que lo más habitual en los datos (${I.nN*2>=I.P.length?'de noche':'de día'}) da ${HORA_PTS.base} puntos y lo contrario, ${HORA_PTS.dudosa}.`}</p>`;
  if(b)h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Dijiste <b>${b.pick==='si'?'Sí, de noche':'No, de día'}</b> (+${b.pts}) el ${fmt(b.at)} · se resuelve sola con el siguiente despegue.</p>`;
  else h+=`<div class="opts" role="group" aria-labelledby="hora-q"><button type="button" data-hora="si">Sí, de noche (+${I.pts('si')})</button><button type="button" data-hora="no">No, de día (+${I.pts('no')})</button></div>`;
  const past=s.hist.slice(0,4).map(x=>`<div class="mut">${ic(x.ok)} Dijiste ${x.pick==='si'?'de noche':'de día'} · ${esc(x.res.m)} despegó ${x.res.night?(x.res.tw?'de noche (en el crepúsculo)':'de noche'):'de día'}${x.res.lh?` a las ${esc(x.res.lh)} hora local`:''} (${fmtD(x.res.net)}) · +${x.won} puntos</div>`).join('');
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
function renderHora(){const el=$('#hora');if(!el||!D)return;const I=horaInfo();if(!I){el.innerHTML='';return}
  const n=I.P.length,mx=a=>Math.max(1,...a.map(r=>r.n));
  const bars=(a,lbl)=>{const m=mx(a);return `<ul class="emp-top" aria-label="${esc(lbl)}">${a.map(r=>`<li>${esc(r.x[0])} <span class="mut">(${esc(r.x[1])})</span> <b>${r.n}</b> <span class="mut">· ${Math.round(100*r.n/n)} %</span><div class="empbar" aria-hidden="true"><span style="width:${Math.max(2,Math.round(r.n/m*100))}%"></span></div></li>`).join('')}</ul>`};
  const last=I.P.slice(0,5).map(o=>`<li>${esc(mname(o.l))} <span class="mut">· ${esc(horaLoc(o.l))}, ${fmtD(o.l.net)}</span><div class="mut">${o.tz?`${esc(horaFmt(o.t,o.tz))} hora local · `:''}${esc(horaFmt(o.t,'Europe/Madrid'))} en España · ${o.night?(o.tw?'de noche, en el crepúsculo':'de noche'):'de día'}</div></li>`).join('');
  const nx=I.U.slice(0,3).map(o=>`<li>${esc(mname(o.l))} <span class="mut">· ${esc(horaLoc(o.l))}</span><div class="mut">${o.tz?`${esc(horaFmt(o.t,o.tz))} hora local · `:''}${esc(fmt(o.t))} en tu hora · ${o.night?'sería de noche':'sería de día'}</div></li>`).join('');
  const sites=I.by.map(b=>`${esc(b.k)} ${b.night} de ${b.n}`).join('; ');
  el.innerHTML=`<div class="card daily hora"><div class="kick">Hora del despegue</div>
  <div class="stats"><div><b>${Math.round(100*I.nN/n)} %</b>de noche en la plataforma (${I.nN} de ${n})</div><div><b>${I.tw}</b>en el crepúsculo, con el Sol hasta 6° bajo el horizonte</div><div><b>${n-I.nN}</b>de día</div></div>
  <p class="mut">De noche por sitio: ${sites}.</p>
  <h4>Hora local de la plataforma</h4>${bars(I.fr,'Despegues por franja horaria en la hora local de la plataforma')}
  <h4>Hora de España</h4>${bars(I.es,'Despegues por franja horaria en la hora de España')}
  <h4>Últimos despegues</h4><ul class="emp-top">${last}</ul>
  ${nx?`<h4>Próximos con hora fijada</h4><ul class="emp-top">${nx}</ul>`:''}
  ${horaBetHTML(I)}<div class="mut" style="margin-top:6px">Calculado con los ${n} últimos lanzamientos de SpaceX con hora exacta en Launch Library 2 y las coordenadas de cada plataforma, actualizados ${fmt(I.gen)}. Día o noche según la posición del Sol en la plataforma a la hora del despegue.</div></div>`}
function bindHora(){const el=$('#next');if(!el||el._hora)return;el._hora=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-hora]');if(!b)return;
  const I=horaInfo(),s=horaState();if(!I||s.cur){renderHora();return}
  const pick=b.dataset.hora==='si'?'si':'no',pts=I.pts(pick);
  s.cur={pick,pts,at:Date.now(),ref:I.first?{m:mname(I.first.l),net:I.first.l.net,night:I.first.night}:null};LS.set('hora',s);
  aviso(`Apuesta guardada: el próximo despegará ${pick==='si'?'de noche':'de día'} (+${pts} si aciertas).`);completeDaily('hora');renderHora();
  const q=$('#hora-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}

// ---------- Turnos de las barcazas ----------
// Con los aterrizajes en barcaza (stages[].land_type ASDS y land_loc) de los últimos lanzamientos de Launch Library 2:
// días entre un aterrizaje y el siguiente de cada barcaza, su turno más rápido en los datos y el margen que le deja
// cada misión ya asignada en la lista de próximos (desde su último aterrizaje o desde la misión asignada anterior).
const barExact=l=>/^(SEC|MIN|HR|HOUR|D|DAY)$/i.test(l.net_precision||''),barDays=ms=>ms/DAY,barFmt=d=>d<10?d.toFixed(1).replace('.',','):String(Math.round(d));
function barInfo(){const d=rlD();if(!d||!Array.isArray(d.previous))return null;const Z=d.lzones||{},now=Date.now();
  const isB=(s,k)=>k&&k!=='N/A'&&!/unknown/i.test(s.land_loc_name||'')&&(s.land_type==='ASDS'||(Z[k]&&Z[k].type==='ASDS'));
  const P=d.previous.filter(l=>!isNaN(new Date(l.net))).slice().sort((a,b)=>new Date(a.net)-new Date(b.net));
  const B={};for(const l of P)for(const s of (l.stages||[])){const k=s.land_loc;if(!isB(s,k)||!s.land_attempt)continue;
    const b=B[k]||(B[k]={k,name:s.land_loc_name||(Z[k]||{}).name||k,L:[],U:[]});if(!b.L.some(x=>x.l.id===l.id))b.L.push({l,t:new Date(l.net).getTime(),ok:s.land_success})}
  const pid=new Set(P.map(l=>l.id));
  const U=(d.upcoming||[]).filter(l=>!pid.has(l.id)&&!isNaN(new Date(l.net))&&new Date(l.net).getTime()>now-3*H).slice().sort((a,b)=>new Date(a.net)-new Date(b.net));
  for(const l of U)for(const s of (l.stages||[])){const k=s.land_loc;if(!isB(s,k))continue;
    const b=B[k]||(B[k]={k,name:s.land_loc_name||(Z[k]||{}).name||k,L:[],U:[]});if(!b.U.some(x=>x.l.id===l.id))b.U.push({l,t:new Date(l.net).getTime(),ex:barExact(l)})}
  const rows=Object.values(B).map(b=>{const G=[];for(let i=1;i<b.L.length;i++)G.push({d:barDays(b.L[i].t-b.L[i-1].t),a:b.L[i-1].l,b:b.L[i].l});
    const rec=G.length?G.reduce((m,g)=>g.d<m.d?g:m):null,avg=G.length?G.reduce((s,g)=>s+g.d,0)/G.length:null,last=b.L[b.L.length-1]||null;
    let prev=last?{t:last.t,l:last.l,past:true}:null;const N=b.U.map(u=>{if(!u.ex)return{...u,from:null,m:null,tight:false};const m=prev?barDays(u.t-prev.t):null,o={...u,from:prev,m,tight:rec!=null&&m!=null&&m<rec.d};prev={t:u.t,l:u.l,past:false};return o});
    return{...b,G,rec,avg,last,N,since:last?barDays(now-last.t):null}}).filter(r=>r.L.length||r.N.length).sort((a,b)=>b.L.length-a.L.length);
  if(!rows.length)return null;
  const all=rows.flatMap(r=>r.G.map(g=>({...g,k:r.k}))).sort((a,b)=>a.d-b.d);
  return{rows,all,P,gen:d.generated,from:P.length?P[0].net:null}}
function renderBarcazas(){const el=$('#barcazas');if(!el||!D)return;const I=barInfo();if(!I){el.innerHTML='';return}
  const nm=r=>r.name&&r.name!==r.k?`${esc(r.name)} (${esc(r.k)})`:esc(r.k);
  const card=r=>{const n=r.N[0];return `<div class="coh"><h3>${nm(r)}</h3><div class="stats"><div><b>${r.L.length}</b>${r.L.length===1?'aterrizaje':'aterrizajes'} en los datos</div><div><b>${r.rec?barFmt(r.rec.d):'—'}</b>${r.rec?'días, su turno más rápido':'sin dos aterrizajes para medir'}</div><div><b>${r.avg!=null?barFmt(r.avg):'—'}</b>días de media entre aterrizajes</div></div>
    ${r.rec?`<p class="mut">Récord: de ${esc(mname(r.rec.a))} (${fmtD(r.rec.a.net)}) a ${esc(mname(r.rec.b))} (${fmtD(r.rec.b.net)}).</p>`:''}
    ${r.last?`<p class="mut">Último aterrizaje: ${esc(mname(r.last.l))}, ${fmtD(r.last.l.net)} (hace ${barFmt(r.since)} días)${r.last.ok===false?', fallido':''}.</p>`:''}
    ${n?`<p${n.tight?' class="warn"':' class="mut"'}>${n.tight?'<span role="img" aria-label="Aviso">⚠️</span> ':''}Próxima misión asignada: ${esc(mname(n.l))}, ${n.ex?fmtD(n.l.net):'con fecha aún sin concretar'}${n.m!=null?`, ${barFmt(n.m)} días después de ${n.from.past?'su último aterrizaje':esc(mname(n.from.l))}`:''}. ${n.tight?`Le deja menos margen que su récord de ${barFmt(r.rec.d)} días: si se cumple la fecha, sería su turno más rápido en los datos.`:n.m!=null&&r.rec?`Tiene ${barFmt(n.m-r.rec.d)} días más que su récord.`:''}</p>`:'<p class="mut">No tiene misiones asignadas en la lista de próximos lanzamientos.</p>'}
    ${r.N.slice(1).filter(x=>x.tight).map(x=>`<p class="warn"><span role="img" aria-label="Aviso">⚠️</span> Después: ${esc(mname(x.l))} (${fmtD(x.l.net)}) quedaría a ${barFmt(x.m)} días de ${esc(mname(x.from.l))}, por debajo de su récord.</p>`).join('')}</div>`};
  const top=I.all.slice(0,5).map(g=>`<li><b>${barFmt(g.d)} días</b> · ${esc(g.k)} <span class="mut">· de ${esc(mname(g.a))} (${fmtD(g.a.net)}) a ${esc(mname(g.b))} (${fmtD(g.b.net)})</span></li>`).join('');
  el.innerHTML=`<div class="card daily barcazas"><div class="kick">Turnos de las barcazas</div>
  <p class="mut">Cuántos días pasan entre un aterrizaje y el siguiente en cada barcaza (el tiempo de volver a puerto, descargar el propulsor y salir otra vez), y si la próxima misión asignada le deja menos margen que su turno más rápido.</p>
  <div class="coh-grid">${I.rows.map(card).join('')}</div>
  ${top?`<h4>Turnos más rápidos</h4><ol class="stl">${top}</ol>`:''}
  <div class="mut" style="margin-top:6px">Calculado con los aterrizajes en barcaza de los últimos ${I.P.length} lanzamientos de SpaceX en Launch Library 2${I.from?` (desde el ${fmtD(I.from)})`:''} y las barcazas asignadas en su lista de próximos, actualizados ${fmt(I.gen)}. Las fechas futuras son previstas y pueden cambiar.</div></div>`}

// ---------- Tipos de misión ----------
// Reparto de los últimos lanzamientos por tipo de misión (Launch Library 2) y apuesta «¿cuántos Starlink habrá en los próximos 5?».
// La apuesta se guarda en sxp_tipo ({cur,hist}) y se resuelve sola con los 5 primeros lanzamientos que despeguen al menos 2 h después de apostar.
const TIPO_N=5,TIPO_GAP=2*H,TIPO_PTS={exacto:30,cerca:10};
const TIPO_ES={'Communications':'Comunicaciones','Government/Top Secret':'Gobierno o defensa','Dedicated Rideshare':'Vuelo compartido','Resupply':'Reabastecimiento','Human Exploration':'Vuelo tripulado','Astrophysics':'Astrofísica','Test Flight':'Vuelo de prueba','Mission Extension':'Extensión de vida de satélites','Technology':'Tecnología','Earth Science':'Ciencias de la Tierra','Lunar Exploration':'Exploración lunar','Planetary Science':'Ciencia planetaria','Heliophysics':'Física solar','Navigation':'Navegación','Robotic Exploration':'Exploración robótica','Tourism':'Turismo espacial','Unknown':'Sin especificar'};
const isStarlink=l=>/starlink/i.test((l.mission||'')+' '+(l.name||''));
const tipoK=l=>isStarlink(l)?'Starlink':(l.mtype||'Unknown');
const tipoN=k=>k==='Starlink'?'Starlink':(TIPO_ES[k]||k);
function tipoInfo(){const d=rlD();if(!d||!Array.isArray(d.previous)||!d.previous.length)return null;const now=Date.now();
  const P=[...d.previous].sort((a,b)=>new Date(b.net)-new Date(a.net));
  const cnt=L=>{const c={};for(const l of L){const k=tipoK(l);c[k]=(c[k]||0)+1}return Object.entries(c).map(([k,n])=>({k,n})).sort((a,b)=>b.n-a.n||(a.k<b.k?-1:1))};
  const U=(d.upcoming||[]).filter(l=>new Date(l.net).getTime()>now-3*H&&!d.previous.some(p=>p.id===l.id)).sort((a,b)=>new Date(a.net)-new Date(b.net));
  const sl=P.filter(isStarlink).length;
  const g=[];for(let i=0;i+TIPO_N<=P.length;i+=TIPO_N)g.push(P.slice(i,i+TIPO_N).filter(isStarlink).length);// tandas de 5 seguidos en los datos
  const freq=[...Array(TIPO_N+1)].map((_,n)=>g.filter(x=>x===n).length);
  let run=0;for(const l of P){if(isStarlink(l))run++;else break}
  return{P,rows:cnt(P),U,nx:U.slice(0,10),nxRows:cnt(U.slice(0,10)),sl,g,freq,run,gen:d.generated}}
function tipoState(){const s=LS.get('tipo',{cur:null,hist:[]});s.hist=s.hist||[];return s}
function resolveTipo(){const d=rlD();if(!d||!d.previous)return;const s=tipoState(),b=s.cur;if(!b)return;
  if(!(new Date(d.generated).getTime()>b.at))return;
  const L=d.previous.filter(l=>new Date(l.net).getTime()>=b.at+TIPO_GAP).sort((x,y)=>new Date(x.net)-new Date(y.net));
  if(L.length<TIPO_N){const old=d.previous.reduce((m,l)=>Math.min(m,new Date(l.net).getTime()),Infinity);if(old>b.at+TIPO_GAP&&Date.now()>b.at+120*DAY){s.cur=null;LS.set('tipo',s)}return}
  const five=L.slice(0,TIPO_N),n=five.filter(isStarlink).length,diff=Math.abs(n-b.pick),won=diff===0?TIPO_PTS.exacto:diff===1?TIPO_PTS.cerca:0;
  s.hist.unshift({...b,res:{n,ms:five.map(l=>mname(l)),last:five[TIPO_N-1].net},ok:diff===0,won,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('tipo',s);
  if(won)addPts('tipo',won);aviso(`Apuesta de Starlink resuelta: ${n} de los ${TIPO_N} lanzamientos fueron Starlink. ${won?`+${won} puntos.`:'Esta vez no.'}`)}
function tipoBetHTML(I){const s=tipoState(),b=s.cur;
  let h=`<h3 id="tipo-q">¿Cuántos de los próximos ${TIPO_N} lanzamientos serán Starlink?</h3><p class="mut">Cuentan los ${TIPO_N} primeros lanzamientos de SpaceX que despeguen al menos 2 horas después de apostar, sean cuales sean (los de la lista de próximos pueden cambiar de orden o retrasarse). Acertar el número exacto da ${TIPO_PTS.exacto} puntos y quedarse a uno, ${TIPO_PTS.cerca}. Se resuelve sola cuando la fuente pasa el quinto al historial.${I.g.length?` En los datos, de cada ${TIPO_N} lanzamientos seguidos: ${I.freq.map((f,n)=>f?`${n} Starlink ${f} ${f===1?'vez':'veces'}`:'').filter(Boolean).join(', ')} (${I.g.length} tandas).`:''}</p>`;
  if(b)h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Dijiste <b>${b.pick} de ${TIPO_N}</b> el ${fmt(b.at)} · se resuelve sola cuando hayan despegado ${TIPO_N}.</p>`;
  else h+=`<div class="opts" role="group" aria-labelledby="tipo-q">${[...Array(TIPO_N+1)].map((_,n)=>`<button type="button" data-tipo="${n}">${n}</button>`).join('')}</div>`;
  const past=s.hist.slice(0,4).map(x=>`<div class="mut">${ic(x.won>0)} Dijiste ${x.pick} de ${TIPO_N} · fueron ${x.res.n} (hasta ${esc(x.res.ms[x.res.ms.length-1]||'')}, ${fmtD(x.res.last)}) · +${x.won} puntos</div>`).join('');
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
function renderTipos(){const el=$('#tipos');if(!el||!D)return;const I=tipoInfo();if(!I){el.innerHTML='';return}
  const n=I.P.length,bars=(a,tot,lbl)=>{const m=Math.max(1,...a.map(r=>r.n));return `<ul class="emp-top" aria-label="${esc(lbl)}">${a.map(r=>`<li>${esc(tipoN(r.k))} <b>${r.n}</b> <span class="mut">· ${Math.round(100*r.n/tot)} %</span><div class="empbar" aria-hidden="true"><span style="width:${Math.max(2,Math.round(r.n/m*100))}%"></span></div></li>`).join('')}</ul>`};
  const learn=I.rows.filter(r=>r.k!=='Starlink'&&TYPE_LEARN[r.k]).slice(0,3).map(r=>{const t=TYPE_LEARN[r.k],i=t.indexOf(': ');return i>0&&i<40?`<li><b>${esc(t.slice(0,i))}:</b> ${esc(t.slice(i+2))}</li>`:`<li><b>${esc(tipoN(r.k))}.</b> ${esc(t)}</li>`}).join('');
  const nx=I.nx.length?`<h4>Próximos ${I.nx.length} de la lista</h4>${bars(I.nxRows,I.nx.length,'Próximos lanzamientos por tipo de misión')}<p class="mut">Los ${Math.min(TIPO_N,I.nx.length)} primeros: ${I.nx.slice(0,TIPO_N).map(l=>`${esc(mname(l))} (${esc(tipoN(tipoK(l)))})`).join('; ')}.</p>`:'';
  el.innerHTML=`<div class="card daily tipos"><div class="kick">Tipos de misión</div>
  <div class="stats"><div><b>${Math.round(100*I.sl/n)} %</b>Starlink (${I.sl} de ${n})</div><div><b>${n-I.sl}</b>para otros clientes y misiones</div><div><b>${I.run}</b>Starlink seguidos en los últimos despegues</div></div>
  <p class="mut">Starlink es la red de satélites de internet de la propia SpaceX; aquí va aparte del resto de misiones de comunicaciones.</p>
  <h4>Últimos ${n} lanzamientos</h4>${bars(I.rows,n,'Últimos lanzamientos por tipo de misión')}
  ${learn?`<ul class="stl">${learn}</ul>`:''}
  ${nx}
  ${tipoBetHTML(I)}<div class="mut" style="margin-top:6px">Calculado con los últimos ${n} lanzamientos de SpaceX en Launch Library 2 (desde el ${fmtD(I.P[n-1].net)}) y su lista de próximos, con el tipo de misión que da la fuente, actualizados ${fmt(I.gen)}.</div></div>`}
function bindTipos(){const el=$('#next');if(!el||el._tipo)return;el._tipo=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-tipo]');if(!b)return;
  const I=tipoInfo(),s=tipoState();if(!I||s.cur){renderTipos();return}
  const pick=Math.max(0,Math.min(TIPO_N,parseInt(b.dataset.tipo,10)||0));
  s.cur={pick,at:Date.now()};LS.set('tipo',s);
  aviso(`Apuesta guardada: ${pick} de los próximos ${TIPO_N} serán Starlink (+${TIPO_PTS.exacto} si aciertas, +${TIPO_PTS.cerca} si te quedas a uno).`);completeDaily('tipo');renderTipos();
  const q=$('#tipo-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}

// ---------- Previsión del tiempo ----------
// Con probability y weather_concerns de Launch Library 2: la previsión publicada para los próximos lanzamientos,
// lo que más preocupa a los meteorólogos y cómo fue la previsión de los que ya despegaron (con su resultado real
// y el minuto de la ventana en que salieron, de window_start y net).
function meteoInfo(){const d=rlD();if(!d||!Array.isArray(d.previous))return null;const now=Date.now();
  const pid=new Set(d.previous.map(l=>l.id));
  const U=(d.upcoming||[]).filter(l=>!pid.has(l.id)&&!isNaN(new Date(l.net))&&new Date(l.net).getTime()>now-3*H).slice().sort((a,b)=>new Date(a.net)-new Date(b.net));
  const P=d.previous.filter(l=>l.prob!=null&&!isNaN(new Date(l.net))).slice().sort((a,b)=>new Date(b.net)-new Date(a.net));
  const Uf=U.filter(l=>l.prob!=null);
  const cnt={};P.forEach(l=>wxList(l).forEach(x=>cnt[x]=(cnt[x]||0)+1));const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]);
  const min=l=>{const a=new Date(l.ws).getTime(),b=new Date(l.net).getTime();return isNaN(a)||isNaN(b)?null:Math.round((b-a)/6e4)};
  const ok=l=>/Success/i.test(l.status||'');
  const bands=[['90 % o más',p=>p>=90],['80–89 %',p=>p>=80&&p<90],['60–79 %',p=>p>=60&&p<80],['menos del 60 %',p=>p<60]].map(([t,f])=>{const L=P.filter(l=>f(l.prob)),M=L.map(min).filter(m=>m!=null);
    return{t,n:L.length,ok:L.filter(ok).length,open:M.filter(m=>m<=1).length,m:M.length}}).filter(b=>b.n);
  return{U,Uf,P,top,bands,min,ok,tot:d.previous.length,gen:d.generated}}
function renderMeteo(){const el=$('#meteo');if(!el||!D)return;const I=meteoInfo();if(!I){el.innerHTML='';return}
  const pct=(a,b)=>b?Math.round(100*a/b)+' %':'—';
  const up=I.U.slice(0,6).map(l=>`<li><b>${esc(mname(l))}</b> <span class="mut">· ${fmt(l.net)}</span> ${l.prob!=null?`<span class="tag ${wxCls(l.prob)}">${l.prob}% favorable</span>${wxList(l).length?` <span class="mut">Preocupa: ${esc(wxList(l).join(', '))}.</span>`:''}`:'<span class="mut">aún sin previsión publicada</span>'}</li>`).join('');
  const minTxt=m=>m==null?'':m<=1?'en la apertura de la ventana':`${m} min después de abrir la ventana`;
  const past=I.P.slice(0,8).map(l=>{const m=I.min(l);return `<tr><td>${esc(mname(l))}<div class="mut">${fmtD(l.net)}</div></td><td><span class="tag ${wxCls(l.prob)}">${l.prob}%</span></td><td>${wxList(l).length?esc(wxList(l).join(', ')):'<span class="mut">nada destacado</span>'}</td><td>${I.ok(l)?'Despegó con éxito':esc(l.status_name||l.status||'')}${m!=null?`<div class="mut">${minTxt(m)}</div>`:''}</td></tr>`}).join('');
  const nP=I.P.length;
  el.innerHTML=`<div class="card daily meteo"><div class="kick">Previsión del tiempo</div>
  <p class="mut">Antes de muchos lanzamientos se publica la probabilidad de que el tiempo permita despegar y qué reglas meteorológicas podrían impedirlo. Launch Library 2 la recoge cuando sale, así que aparece a medida que se acerca cada lanzamiento.</p>
  <h4>Próximos lanzamientos</h4>${up?`<ul class="stl">${up}</ul>`:'<p class="mut">No hay lanzamientos próximos en la lista.</p>'}
  ${I.Uf.length?'':'<p class="mut">Ninguno de los próximos tiene aún previsión publicada.</p>'}
  ${nP?`<h4>Lo que más preocupa</h4><ul class="stl">${I.top.slice(0,5).map(([t,c])=>`<li>${esc(t)}: <b>${c}</b> de ${nP} <span class="mut">(${pct(c,nP)})</span><div class="bar" aria-hidden="true"><i style="width:${100*c/nP}%"></i></div></li>`).join('')||'<li class="mut">Ninguna regla destacada en los datos.</li>'}</ul>
  <h4>Cómo fue la previsión de los que ya despegaron</h4>
  <ul class="stl">${I.bands.map(b=>`<li>Con meteo favorable del ${b.t}: <b>${b.n}</b> ${b.n===1?'lanzamiento':'lanzamientos'}, ${b.ok} con éxito${b.m?`, ${b.open} de ${b.m} salieron en la apertura de su ventana`:''}.</li>`).join('')}</ul>
  <div class="tblw"><table class="stt"><thead><tr><th>Misión</th><th>Meteo</th><th>Preocupaba</th><th>Qué pasó</th></tr></thead><tbody>${past}</tbody></table></div>`:'<p class="mut">Ninguno de los lanzamientos recientes tiene previsión en los datos.</p>'}
  <div class="mut" style="margin-top:6px">Datos de Launch Library 2 (probability y weather_concerns), actualizados ${fmt(I.gen)}: ${nP} de los últimos ${I.tot} lanzamientos de SpaceX tienen previsión publicada (${I.P.filter(l=>/FL/.test(l.loc||"")).length} de ellos en Florida). Es la última previsión que guarda la fuente, no la de días antes.</div></div>`}

// ---------- Veteranía de los propulsores por lanzamiento ----------
// Con el número de vuelo del propulsor principal (stages[].flight del núcleo) de cada lanzamiento en Launch Library 2:
// veteranía en los últimos lanzamientos, media por mes, cuántos estrenaron propulsor y apuesta «¿más de 20 vuelos?».
// La apuesta se guarda en sxp_vet ({cur,hist}) y se resuelve sola con el primer lanzamiento con número de vuelo conocido
// que despegue al menos 2 h después de apostar.
const VET_MIN=21,VET_GAP=2*H,VET_PTS={fav:5,contra:25,base:10,dudosa:20};
const vetCore=l=>{const S=(l.stages||[]).filter(s=>s&&s.serial&&!/Unknown/i.test(s.serial));return S.find(s=>/Core/i.test(s.type||''))||S[0]||null};
const vetMesN=k=>{const[y,m]=k.split('-');return new Date(+y,+m-1,15).toLocaleDateString('es-ES',{month:'long',year:'numeric'})};
function vetInfo(){const d=rlD();if(!d||!Array.isArray(d.previous)||!d.previous.length)return null;const now=Date.now(),pid=new Set(d.previous.map(l=>l.id));
  const P=d.previous.filter(l=>!isNaN(new Date(l.net))).map(l=>({l,t:new Date(l.net).getTime(),c:vetCore(l),nw:(l.stages||[]).filter(s=>s&&s.flight===1).length})).filter(o=>o.c&&o.c.flight).sort((a,b)=>b.t-a.t);
  if(!P.length)return null;
  const old=P.filter(o=>o.c.flight>=VET_MIN).length,nw=P.filter(o=>o.nw>0),avg=P.reduce((s,o)=>s+o.c.flight,0)/P.length;
  const srt=P.map(o=>o.c.flight).sort((a,b)=>a-b),med=srt.length%2?srt[(srt.length-1)/2]:(srt[srt.length/2-1]+srt[srt.length/2])/2;
  const top=P.slice().sort((a,b)=>b.c.flight-a.c.flight||b.t-a.t)[0];
  const mk=t=>{const x=new Date(t);return x.getUTCFullYear()+'-'+String(x.getUTCMonth()+1).padStart(2,'0')};
  const M={};for(const o of P){const k=mk(o.t),m=M[k]||(M[k]={k,n:0,sum:0,max:0,old:0,nw:0});m.n++;m.sum+=o.c.flight;m.max=Math.max(m.max,o.c.flight);if(o.c.flight>=VET_MIN)m.old++;if(o.nw)m.nw++}
  const first=P[P.length-1].t,months=Object.values(M).sort((a,b)=>a.k<b.k?-1:1).map(m=>({...m,avg:m.sum/m.n,part:m.k===mk(first)&&new Date(first).getUTCDate()>1}));
  const U=(d.upcoming||[]).filter(l=>!pid.has(l.id)&&precise(l)&&!/TBD/i.test(l.status||'')&&new Date(l.net).getTime()>now+VET_GAP).sort((a,b)=>new Date(a.net)-new Date(b.net));
  const nxt=U[0]||null,nc=nxt&&vetCore(nxt),nf=nc&&nc.flight?nc.flight:null,base=old*2>=P.length;
  const pts=pick=>nf!=null?((pick==='si')===(nf>=VET_MIN)?VET_PTS.fav:VET_PTS.contra):((pick==='si')===base?VET_PTS.base:VET_PTS.dudosa);
  const asg=(d.upcoming||[]).filter(l=>!pid.has(l.id)&&new Date(l.net).getTime()>now-3*H).map(l=>({l,c:vetCore(l)})).filter(o=>o.c&&o.c.flight).sort((a,b)=>new Date(a.l.net)-new Date(b.l.net)).slice(0,5);
  return{P,old,nw,avg,med,top,months,nxt,nc,nf,base,pts,asg,gen:d.generated}}
function vetState(){const s=LS.get('vet',{cur:null,hist:[]});s.hist=s.hist||[];return s}
function resolveVet(){const d=rlD();if(!d||!d.previous)return;const s=vetState(),b=s.cur;if(!b)return;
  if(!(new Date(d.generated).getTime()>b.at))return;
  const c=d.previous.filter(l=>new Date(l.net).getTime()>=b.at+VET_GAP).map(l=>({l,c:vetCore(l)})).filter(o=>o.c&&o.c.flight).sort((x,y)=>new Date(x.l.net)-new Date(y.l.net))[0];if(!c)return;
  const vet=c.c.flight>=VET_MIN,ok=(b.pick==='si')===vet,won=ok?b.pts:0;
  s.hist.unshift({...b,res:{m:mname(c.l),net:c.l.net,serial:c.c.serial,flight:c.c.flight},ok,won,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('vet',s);
  if(won)addPts('vet',won);aviso(`Apuesta de veteranía resuelta: ${mname(c.l)} voló con ${c.c.serial} en su vuelo nº ${c.c.flight}. ${ok?`+${won} puntos.`:'Esta vez no.'}`)}
function vetBetHTML(I){const s=vetState(),b=s.cur,l=I.nxt;
  let h=`<h3 id="vet-q">¿Volará el próximo lanzamiento con un propulsor de más de 20 vuelos?</h3><p class="mut">Cuenta el primer lanzamiento de SpaceX que despegue al menos 2 horas después de apostar y cuyo propulsor principal tenga número de vuelo en Launch Library 2 (en el Falcon Heavy, el núcleo central). «Más de 20» quiere decir del vuelo nº ${VET_MIN} en adelante. ${I.nf!=null?`El primero con hora fijada es ${esc(mname(l))}, con ${esc(I.nc.serial)} asignado a su vuelo nº ${I.nf}: acertar con esa asignación da ${VET_PTS.fav} puntos y apostar a que cambia (otro propulsor o un retraso que deje pasar a otro lanzamiento), ${VET_PTS.contra}.`:`${l?`El primero con hora fijada (${esc(mname(l))}) aún no tiene propulsor asignado en la fuente`:'Ahora no hay ninguno con hora fijada'}, así que lo más habitual en los datos (${I.base?'más de 20 vuelos':'20 vuelos o menos'}) da ${VET_PTS.base} puntos y lo contrario, ${VET_PTS.dudosa}.`}</p>`;
  if(b)h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Dijiste <b>${b.pick==='si'?'Sí, más de 20':'No, 20 o menos'}</b> (+${b.pts}) el ${fmt(b.at)} · se resuelve sola con el siguiente despegue.</p>`;
  else h+=`<div class="opts" role="group" aria-labelledby="vet-q"><button type="button" data-vet="si">Sí, más de 20 (+${I.pts('si')})</button><button type="button" data-vet="no">No, 20 o menos (+${I.pts('no')})</button></div>`;
  const past=s.hist.slice(0,4).map(x=>`<div class="mut">${ic(x.ok)} Dijiste ${x.pick==='si'?'más de 20':'20 o menos'} · ${esc(x.res.m)} voló con ${esc(x.res.serial)} en su vuelo nº ${x.res.flight} (${fmtD(x.res.net)}) · +${x.won} puntos</div>`).join('');
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
function renderVeterania(){const el=$('#veterania');if(!el||!D)return;const I=vetInfo();if(!I){el.innerHTML='';return}
  const n=I.P.length,f1=x=>x.toFixed(1).replace('.',','),mx=Math.max(1,...I.months.map(m=>m.avg));
  const months=I.months.map(m=>`<li>${esc(vetMesN(m.k))}${m.part?' <span class="mut">(parcial en los datos)</span>':''}: media <b>${f1(m.avg)}</b> vuelos <span class="mut">· ${m.n} ${m.n===1?'lanzamiento':'lanzamientos'}, máximo ${m.max}, ${m.old} con más de 20, ${m.nw} ${m.nw===1?'estreno':'estrenos'}</span><div class="empbar" aria-hidden="true"><span style="width:${Math.max(2,Math.round(m.avg/mx*100))}%"></span></div></li>`).join('');
  const last=I.P.slice(0,6).map(o=>`<li>${esc(mname(o.l))} <span class="mut">· ${esc(o.l.rocket||'')}, ${fmtD(o.l.net)}</span><div class="mut">${esc(o.c.serial)} en su vuelo nº <b>${o.c.flight}</b>${o.c.flight===1?' (estreno)':''}${o.nw&&o.c.flight!==1?` · estrenó ${o.nw===1?'un propulsor lateral':o.nw+' propulsores laterales'}`:''}</div></li>`).join('');
  const news=I.nw.slice(0,5).map(o=>`${esc(mname(o.l))} (${esc((o.l.stages||[]).filter(s=>s&&s.flight===1).map(s=>s.serial).join(', '))}, ${fmtD(o.l.net)})`).join('; ');
  const asg=I.asg.map(o=>`<li>${esc(mname(o.l))} <span class="mut">· ${fmt(o.l.net)}</span><div class="mut">${esc(o.c.serial)} en su vuelo nº <b>${o.c.flight}</b>${o.c.flight>=VET_MIN?' · más de 20':''}</div></li>`).join('');
  el.innerHTML=`<div class="card daily veter"><div class="kick">Veteranía de los propulsores</div>
  <div class="stats"><div><b>${f1(I.avg)}</b>vuelos de media del propulsor principal (mediana ${String(I.med).replace('.',',')})</div><div><b>${Math.round(100*I.old/n)} %</b>con más de 20 vuelos (${I.old} de ${n})</div><div><b>${I.nw.length}</b>${I.nw.length===1?'estrenó':'estrenaron'} algún propulsor nuevo</div><div><b>${I.top.c.flight}</b>el más veterano: ${esc(I.top.c.serial)}</div></div>
  <h4>Media por mes</h4><ul class="emp-top" aria-label="Número de vuelo medio del propulsor por mes">${months}</ul>
  <h4>Últimos lanzamientos</h4><ul class="emp-top">${last}</ul>
  ${news?`<p class="mut">Estrenos de propulsor en los datos: ${news}.</p>`:''}
  ${asg?`<h4>Próximos con propulsor asignado</h4><ul class="emp-top">${asg}</ul>`:''}
  ${vetBetHTML(I)}<div class="mut" style="margin-top:6px">Calculado con los ${n} últimos lanzamientos de SpaceX con número de vuelo del propulsor en Launch Library 2 (desde el ${fmtD(I.P[n-1].l.net)}), actualizados ${fmt(I.gen)}. El número de vuelo es el del propulsor principal en ese lanzamiento; meses en hora UTC.</div></div>`}
function bindVeterania(){const el=$('#next');if(!el||el._vet)return;el._vet=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-vet]');if(!b)return;
  const I=vetInfo(),s=vetState();if(!I||s.cur){renderVeterania();return}
  const pick=b.dataset.vet==='si'?'si':'no',pts=I.pts(pick);
  s.cur={pick,pts,at:Date.now(),ref:I.nf!=null?{m:mname(I.nxt),serial:I.nc.serial,flight:I.nf}:null};LS.set('vet',s);
  aviso(`Apuesta guardada: el próximo volará con un propulsor de ${pick==='si'?'más de 20 vuelos':'20 vuelos o menos'} (+${pts} si aciertas).`);completeDaily('vet');renderVeterania();
  const q=$('#vet-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}

// ---------- Órbitas en juego ----------
// Reparto de los últimos lanzamientos por órbita (campo orbit de Launch Library 2) y por plataforma, y apuesta
// «¿a qué órbita irá el próximo lanzamiento que no sea Starlink?». Se guarda en sxp_orb ({cur,hist}) y se resuelve sola
// con el primer lanzamiento no Starlink con órbita conocida que despegue al menos 2 h después de apostar.
const ORB_GAP=2*H;
const ORB_ES={'LEO':'Órbita baja','VLEO':'Órbita muy baja','SSO':'Heliosíncrona','PO':'Polar','GTO':'Transferencia geoestacionaria','GEO':'Geoestacionaria','GSO':'Geosíncrona','MEO':'Órbita media','HEO':'Órbita muy elíptica','Elliptical':'Órbita elíptica','Sub':'Suborbital','L1':'Punto de Lagrange L1','L2':'Punto de Lagrange L2','ES-L1':'Punto de Lagrange L1','LO':'Órbita lunar','TLI':'Camino a la Luna','Helio-N/A':'Alrededor del Sol','Heliocentric N/A':'Alrededor del Sol','Mars':'Camino a Marte'};
const ORB_G=[{k:'baja',t:'Órbita baja (LEO)',d:'entre unos 160 y 2.000 km; la de Starlink, la estación espacial y muchas constelaciones',c:['LEO','VLEO']},
  {k:'polar',t:'Polar o heliosíncrona (PO, SSO)',d:'pasa sobre los polos; muy usada para observar la Tierra, casi siempre desde Vandenberg',c:['PO','SSO']},
  {k:'geo',t:'Geoestacionaria o de transferencia (GTO, GEO)',d:'a 35.786 km, donde un satélite parece quieto sobre el ecuador; típica de los satélites de comunicaciones grandes',c:['GTO','GEO','GSO']},
  {k:'otra',t:'Otra (media, suborbital, lunar, Lagrange...)',d:'todo lo demás: navegación en órbita media, vuelos de prueba suborbitales, la Luna o puntos de Lagrange',c:null}];
const orbCode=l=>{const o=(l.orbit||'').trim();return !o||/^(N\/A|Unknown|TBD)$/i.test(o)?null:o};
const orbGrp=o=>o==null?null:(ORB_G.find(g=>g.c&&g.c.includes(o))||ORB_G[3]).k;
const orbName=o=>ORB_ES[o]?`${ORB_ES[o]} (${o})`:o;
const orbPad=l=>{const p=/^Unknown/i.test(l.pad||'')?'Plataforma por decidir':(l.pad||'').replace(/^Space Launch Complex /,'SLC-').replace(/^Launch Complex /,'LC-').replace(/^Orbital Launch Pad /,'Plataforma orbital '),c=(l.loc||'').split(',')[0].replace(/ (SFB|SFS|Space Center)$/,'').replace(/^SpaceX /,'');return p+(c?` (${c})`:'')};
function orbInfo(){const d=rlD();if(!d||!Array.isArray(d.previous)||!d.previous.length)return null;const now=Date.now(),pid=new Set(d.previous.map(l=>l.id));
  const P=d.previous.filter(l=>!isNaN(new Date(l.net))).sort((a,b)=>new Date(b.net)-new Date(a.net));if(!P.length)return null;
  const K=P.filter(l=>orbCode(l)),N=K.filter(l=>!isStarlink(l));
  const cnt=(L,f)=>{const c={};for(const l of L){const k=f(l);c[k]=(c[k]||0)+1}return Object.entries(c).map(([k,n])=>({k,n})).sort((a,b)=>b.n-a.n||(a.k<b.k?-1:1))};
  const rows=cnt(K,orbCode),slRows=cnt(K.filter(isStarlink),orbCode),grp=ORB_G.map(g=>({...g,n:N.filter(l=>orbGrp(orbCode(l))===g.k).length}));
  const pads=cnt(K,orbPad).map(p=>{const L=K.filter(l=>orbPad(l)===p.k);return{...p,orb:cnt(L,orbCode),sl:L.filter(isStarlink).length}});
  const pts=k=>{const g=grp.find(x=>x.k===k),p=N.length?(g.n+1)/(N.length+ORB_G.length):.25;return Math.max(5,Math.min(40,Math.round(5/p/5)*5))};
  const U=(d.upcoming||[]).filter(l=>!pid.has(l.id)&&!isStarlink(l)&&!isNaN(new Date(l.net))&&new Date(l.net).getTime()>now-3*H).sort((a,b)=>new Date(a.net)-new Date(b.net));
  const nx=U.filter(l=>precise(l)&&!/TBD/i.test(l.status||'')&&new Date(l.net).getTime()>now+ORB_GAP)[0]||null;
  const lastN=N[0]||null;
  return{P,K,N,rows,slRows,grp,pads,pts,U,nx,lastN,gen:d.generated}}
function orbState(){const s=LS.get('orb',{cur:null,hist:[]});s.hist=s.hist||[];return s}
function resolveOrb(){const d=rlD();if(!d||!d.previous)return;const s=orbState(),b=s.cur;if(!b)return;
  if(!(new Date(d.generated).getTime()>b.at))return;
  const L=d.previous.filter(l=>!isStarlink(l)&&orbCode(l)&&new Date(l.net).getTime()>=b.at+ORB_GAP).sort((x,y)=>new Date(x.net)-new Date(y.net));
  if(!L.length){const old=d.previous.reduce((m,l)=>Math.min(m,new Date(l.net).getTime()),Infinity);if(old>b.at+ORB_GAP&&Date.now()>b.at+120*DAY){s.cur=null;LS.set('orb',s)}return}
  const l=L[0],o=orbCode(l),g=orbGrp(o),ok=g===b.pick,won=ok?b.pts:0;
  s.hist.unshift({...b,res:{m:mname(l),net:l.net,o,g},ok,won,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('orb',s);
  if(won)addPts('orb',won);aviso(`Apuesta de órbita resuelta: ${mname(l)} fue a ${orbName(o)}. ${ok?`+${won} puntos.`:'Esta vez no.'}`)}
function orbBetHTML(I){const s=orbState(),b=s.cur,gt=k=>(ORB_G.find(g=>g.k===k)||{}).t||k;
  let h=`<h3 id="orb-q">¿A qué órbita irá el próximo lanzamiento que no sea Starlink?</h3><p class="mut">Cuenta el primer lanzamiento de SpaceX que no sea Starlink, con órbita indicada en Launch Library 2, que despegue al menos 2 horas después de apostar. Cuanto menos habitual es la órbita en los datos (${I.N.length} lanzamientos no Starlink recientes con órbita), más puntos da. ${I.nx?`El primero con hora fijada en la lista es ${esc(mname(I.nx))} (${fmt(I.nx.net)}), que la fuente da como ${esc(orbCode(I.nx)?orbName(orbCode(I.nx)):'órbita aún sin indicar')}; puede retrasarse y dejar pasar a otro.`:'Ahora ninguno de los no Starlink de la lista tiene hora fijada.'}</p>`;
  if(b)h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Dijiste <b>${esc(gt(b.pick))}</b> (+${b.pts}) el ${fmt(b.at)} · se resuelve sola con el siguiente despegue que no sea Starlink.</p>`;
  else h+=`<div class="opts" role="group" aria-labelledby="orb-q">${ORB_G.map(g=>`<button type="button" data-orb="${g.k}">${esc(g.t)} (+${I.pts(g.k)})</button>`).join('')}</div>`;
  const past=s.hist.slice(0,4).map(x=>`<div class="mut">${ic(x.ok)} Dijiste ${esc(gt(x.pick))} · ${esc(x.res.m)} fue a ${esc(orbName(x.res.o))} (${fmtD(x.res.net)}) · +${x.won} puntos</div>`).join('');
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
function renderOrbitas(){const el=$('#orbitas');if(!el||!D)return;const I=orbInfo();if(!I||!I.K.length){el.innerHTML='';return}
  const n=I.K.length,bars=(a,tot,lbl,nm)=>{const m=Math.max(1,...a.map(r=>r.n));return `<ul class="emp-top" aria-label="${esc(lbl)}">${a.map(r=>`<li>${esc(nm(r.k))} <b>${r.n}</b> <span class="mut">· ${Math.round(100*r.n/tot)} %</span><div class="empbar" aria-hidden="true"><span style="width:${Math.max(2,Math.round(r.n/m*100))}%"></span></div></li>`).join('')}</ul>`};
  const nN=I.N.length,slTxt=I.slRows.map(r=>`${r.n} a ${esc(orbName(r.k))}`).join(', ');
  const grp=nN?`<h4>Sin contar Starlink (${nN})</h4><ul class="stl">${I.grp.map(g=>`<li><b>${esc(g.t)}</b>: ${g.n} <span class="mut">· ${Math.round(100*g.n/nN)} % · ${esc(g.d)}</span></li>`).join('')}</ul>`:'';
  const pads=I.pads.map(p=>`<li><b>${esc(p.k)}</b>: ${p.n} ${p.n===1?'lanzamiento':'lanzamientos'}${p.sl?`, ${p.sl} Starlink`:''}<div class="mut">${p.orb.map(o=>`${esc(orbName(o.k))} ${o.n}`).join(' · ')}</div></li>`).join('');
  const up=I.U.slice(0,5).map(l=>`<li>${esc(mname(l))} <span class="mut">· ${precise(l)&&!/TBD/i.test(l.status||'')?fmt(l.net):'fecha sin concretar'} · ${esc(orbCode(l)?orbName(orbCode(l)):'órbita sin indicar')} · ${esc(orbPad(l))}</span></li>`).join('');
  el.innerHTML=`<div class="card daily orbitas"><div class="kick">Órbitas en juego</div>
  <div class="stats"><div><b>${Math.round(100*I.rows[0].n/n)} %</b>a ${esc(orbName(I.rows[0].k))}</div><div><b>${I.rows.length}</b>órbitas distintas en ${n} lanzamientos</div>${I.lastN?`<div><b>${esc(orbCode(I.lastN))}</b>el último no Starlink: ${esc(mname(I.lastN))}</div>`:''}</div>
  <h4>Últimos ${n} lanzamientos por órbita</h4>${bars(I.rows,n,'Últimos lanzamientos por órbita',orbName)}
  ${slTxt?`<p class="mut">Los Starlink: ${slTxt}.</p>`:''}
  ${grp}
  <h4>Por plataforma</h4><ul class="emp-top">${pads}</ul>
  ${up?`<h4>Próximos que no son Starlink</h4><ul class="emp-top">${up}</ul>`:''}
  ${orbBetHTML(I)}<div class="mut" style="margin-top:6px">Calculado con los ${n} últimos lanzamientos de SpaceX con órbita indicada en Launch Library 2 (desde el ${fmtD(I.K[n-1].net)}${I.P.length>n?`; ${I.P.length-n===1?'1 sin órbita no cuenta':`${I.P.length-n} sin órbita no cuentan`}`:''}) y su lista de próximos, actualizados ${fmt(I.gen)}.</div></div>`}
function bindOrbitas(){const el=$('#next');if(!el||el._orb)return;el._orb=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-orb]');if(!b)return;
  const I=orbInfo(),s=orbState();if(!I||s.cur){renderOrbitas();return}
  const g=ORB_G.find(x=>x.k===b.dataset.orb);if(!g)return;const pts=I.pts(g.k);
  s.cur={pick:g.k,pts,at:Date.now(),ref:I.nx?{m:mname(I.nx),o:orbCode(I.nx)}:null};LS.set('orb',s);
  aviso(`Apuesta guardada: el próximo no Starlink irá a ${g.t} (+${pts} si aciertas).`);completeDaily('orb');renderOrbitas();
  const q=$('#orb-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}

// ---------- Retrasos de la lista ----------
// Cuántas veces ha cambiado la fecha prevista (net) de cada lanzamiento entre una actualización de data.json y la
// siguiente. build_data.py guarda el historial real en data.nethist ({id:[[visto, net, precisión], ...]}), reconstruido
// desde el historial de data.json en el repositorio (desde el 18 oct) y ampliado en cada actualización horaria. Solo informativa.
const durTxt=ms=>{const a=Math.abs(ms),th=Math.round(a/H),d=Math.floor(th/24),h=th%24;if(a<H)return `${Math.max(1,Math.round(a/6e4))} min`;
  return d?`${d} ${d===1?'día':'días'}${h?` y ${h} h`:''}`:`${h} h`};
const netTxt=(n,p)=>/^(SEC|MIN|HOUR)$/i.test(p||'')?fmt(n):/^DAY$/i.test(p||'')?fmtD(n):/^MONTH$/i.test(p||'')?new Date(n).toLocaleDateString('es-ES',{month:'long',year:'numeric',timeZone:'UTC'}):fmtD(n)+' (aprox.)';
function retInfo(){const d=rlD();if(!d||!d.nethist||!Array.isArray(d.upcoming))return null;const NH=d.nethist,pid=new Set((d.previous||[]).map(l=>l.id));
  const row=l=>{const h=(NH[l.id]||[]).filter(x=>x&&x[1]&&!isNaN(new Date(x[1])));if(!h.length)return null;
    const f=h[0],c=h[h.length-1],sh=new Date(c[1])-new Date(f[1]);
    const ev=h.slice(1).map((x,i)=>({l,at:x[0],from:h[i][1],fp:h[i][2],to:x[1],tp:x[2],sh:new Date(x[1])-new Date(h[i][1])})).filter(e=>new Date(e.at)<new Date(e.to));// sin las correcciones de la hora real tras el despegue
    return{l,h,n:ev.length,first:f,sh,ev}};
  const U=d.upcoming.filter(l=>!pid.has(l.id)).map(row).filter(Boolean);
  const P=(d.previous||[]).map(row).filter(r=>r&&r.h.length&&new Date(r.first[0])<new Date(r.l.net));
  const all=U.concat(P),start=all.reduce((m,r)=>Math.min(m,new Date(r.h[0][0]).getTime()),Infinity);
  const mov=U.filter(r=>r.n).sort((a,b)=>b.n-a.n||Math.abs(b.sh)-Math.abs(a.sh));
  const ev=all.flatMap(r=>r.ev).sort((a,b)=>new Date(b.at)-new Date(a.at));
  const Pm=P.filter(r=>r.n),late=P.filter(r=>r.sh>H);
  return{U,P,mov,ev,Pm,late,start,nch:U.reduce((s,r)=>s+r.n,0),gen:d.generated}}
function renderRetrasos(){const el=$('#retrasos');if(!el||!D)return;const I=retInfo();if(!I||!I.U.length){el.innerHTML='';return}
  const sg=ms=>ms>0?`${durTxt(ms)} más tarde`:ms<0?`${durTxt(ms)} antes`:'misma fecha';
  const top=I.mov.slice(0,6).map(r=>`<li>${esc(mname(r.l))} <b>${r.n}</b> ${r.n===1?'cambio':'cambios'}<div class="mut">Primera fecha vista: ${esc(netTxt(r.first[1],r.first[2]))} · ahora: ${esc(netTxt(r.l.net,r.l.net_precision))} · ${sg(r.sh)}</div></li>`).join('');
  const ev=I.ev.slice(0,6).map(e=>`<li>${esc(mname(e.l))} <span class="mut">· detectado ${fmt(e.at)}</span><div class="mut">de ${esc(netTxt(e.from,e.fp))} a ${esc(netTxt(e.to,e.tp))} (${sg(e.sh)})</div></li>`).join('');
  const big=I.mov.slice().sort((a,b)=>b.sh-a.sh)[0];
  const nP=I.P.length,pTxt=nP?`<h4>Los que ya despegaron</h4><p class="mut">De los ${nP} lanzamientos ya despegados que estaban en la lista desde antes de su despegue, ${nP-I.Pm.length} salieron en la primera fecha que vimos y ${I.Pm.length} la cambiaron antes de despegar${I.late.length?`; ${I.late.length} ${I.late.length===1?'despegó':'despegaron'} más de una hora después de la primera fecha vista`:''}${I.Pm.length?` (${I.Pm.slice(0,4).map(r=>`${esc(mname(r.l))}: ${r.n} ${r.n===1?'cambio':'cambios'}, ${sg(r.sh)}`).join('; ')})`:''}.</p>`:'';
  el.innerHTML=`<div class="card daily retrasos"><div class="kick">Retrasos de la lista</div>
  <div class="stats"><div><b>${I.mov.length}</b>de los ${I.U.length} próximos han cambiado de fecha</div><div><b>${I.nch}</b>${I.nch===1?'cambio de fecha':'cambios de fecha'} en total</div>${big&&big.sh>0?`<div><b>${esc(durTxt(big.sh))}</b>el que más se ha retrasado: ${esc(mname(big.l))}</div>`:''}</div>
  ${top?`<h4>Los que más se han movido</h4><ul class="emp-top">${top}</ul>`:'<p class="mut">Ningún próximo lanzamiento ha cambiado de fecha desde que lo vimos en la lista.</p>'}
  ${ev?`<h4>Últimos cambios detectados</h4><ul class="emp-top">${ev}</ul>`:''}
  ${pTxt}<div class="mut" style="margin-top:6px">Comparando la fecha prevista de Launch Library 2 entre cada actualización de los datos y la siguiente (cada hora), desde el ${fmtD(I.start)}; un cambio de precisión (por ejemplo, de «noviembre» a un día concreto) también cuenta. Actualizados ${fmt(I.gen)}.</div></div>`}

// ---------- Vida de los propulsores y apuesta «¿cuál de dos propulsores volará antes?» ----------
// Fechas del primer y del último vuelo de cada propulsor según Launch Library 2 (first/lastd en cada etapa de data.json).
// La apuesta se guarda en sxp_vida y se resuelve sola con el primer lanzamiento del historial que lleve uno de los dos
// propulsores y despegue al menos 2 horas después de apostar; los puntos van a la categoría vida.
const VIDA_GAP=2*H,VIDA_MAX=120*DAY,MES=30.44*DAY;
function vidaData(){const d=rlD();if(!d)return null;const B={};const okS=x=>x&&!/Unknown/i.test(x);
  const add=(l,s,up)=>{if(!okS(s.serial))return;const b=B[s.serial]||(B[s.serial]={serial:s.serial,rocket:l.rocket||'',flights:0});
    if(s.first&&(!b.first||new Date(s.first)<new Date(b.first)))b.first=s.first;
    if(s.lastd&&(!b.lastd||new Date(s.lastd)>new Date(b.lastd)))b.lastd=s.lastd;
    if(!up&&(!b.lastL||new Date(l.net)>new Date(b.lastL.net))){b.lastL=l;b.lost=s.land_attempt===false||s.land_success===false}
    b.flights=Math.max(b.flights,s.booster_flights||0,up?0:(s.flight||0));if(s.bstatus)b.status=s.bstatus;
    if(up&&(!b.next||new Date(l.net)<new Date(b.next.net)))b.next=l};
  (d.previous||[]).forEach(l=>(l.stages||[]).forEach(s=>add(l,s,false)));
  const pid=new Set((d.previous||[]).map(l=>l.id));
  (d.upcoming||[]).filter(l=>!pid.has(l.id)&&new Date(l.net)>Date.now()-6*H).forEach(l=>(l.stages||[]).forEach(s=>add(l,s,true)));
  const rows=Object.values(B).filter(b=>b.first&&b.lastd).map(b=>{const span=new Date(b.lastd)-new Date(b.first);
    return{...b,span,days:Math.round(span/DAY),pm:span>=MES&&b.flights>1?(b.flights-1)/(span/MES):null}});
  if(!rows.length)return null;
  const act=rows.filter(b=>(b.status||'').toLowerCase()==='active'&&(!b.lost||b.next)&&b.lastL);
  return{rows,act,gen:d.generated}}
function vidaState(){const s=LS.get('vida',{cur:null,hist:[]});s.hist=s.hist||[];return s}
function vidaPair(I){const c=I.act.slice().sort((a,b)=>a.serial<b.serial?-1:1);if(c.length<2)return null;
  const k=dayKey().split('-').reduce((a,x)=>a*31+(+x),7),n=c.length,i=k%n,j=(i+1+(Math.floor(k/n)%(n-1)))%n;return[c[i],c[j]]}
function vidaPts(p){const[a,b]=p,na=a.next?new Date(a.next.net):null,nb=b.next?new Date(b.next.net):null;
  if(na&&(!nb||na<nb))return[5,25];if(nb&&(!na||nb<na))return[25,5];if(na&&nb)return[15,15];
  const la=new Date(a.lastL.net),lb=new Date(b.lastL.net);// sin misión asignada: favorito el que lleva más tiempo en tierra
  return la<lb?[10,20]:lb<la?[20,10]:[15,15]}
function resolveVida(){const d=rlD();if(!d||!d.previous)return;const s=vidaState(),b=s.cur;if(!b)return;
  const gen=new Date(d.generated).getTime();if(!(gen>b.at))return;
  const c=d.previous.filter(l=>new Date(l.net).getTime()>=b.at+VIDA_GAP&&(l.stages||[]).some(x=>x.serial===b.a||x.serial===b.b)).sort((x,y)=>new Date(x.net)-new Date(y.net))[0];
  if(!c){if(Date.now()-b.at>VIDA_MAX){s.hist.unshift({...b,res:null,ok:false,won:0,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('vida',s);aviso(`Apuesta ${b.a} contra ${b.b} anulada: ninguno ha vuelto a volar en 120 días.`)}return}
  const ss=(c.stages||[]).map(x=>x.serial),both=ss.includes(b.a)&&ss.includes(b.b),w=both?null:ss.includes(b.a)?b.a:b.b,ok=w===b.pick,won=ok?b.pts:0;
  s.hist.unshift({...b,res:{m:mname(c),net:c.net,w,both},ok,won,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('vida',s);
  if(won)addPts('vida',won);aviso(both?`Empate: ${b.a} y ${b.b} volaron juntos en ${mname(c)}. Sin puntos.`:`Apuesta de propulsores resuelta: ${w} voló antes, en ${mname(c)}. ${ok?`+${won} puntos.`:'Esta vez no.'}`)}
const pmTxt=x=>x==null?'—':x.toLocaleString('es-ES',{maximumFractionDigits:2});
function vidaBetHTML(I){const s=vidaState(),b=s.cur;
  let h=`<h3 id="vida-q">¿Cuál de estos dos propulsores volará antes?</h3><p class="mut">Cada día sale una pareja de propulsores en activo. Gana el primero que aparezca en un lanzamiento que despegue al menos 2 horas después de apostar; si vuelan juntos no hay puntos y si ninguno vuela en 120 días se anula. El que tiene misión asignada antes da menos puntos y, si ninguno la tiene, el que lleva más tiempo en tierra.</p>`;
  if(b)h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Apostaste por <b>${esc(b.pick)}</b> frente a ${esc(b.pick===b.a?b.b:b.a)} (+${b.pts}) el ${fmt(b.at)} · se resuelve sola con el historial.</p>`;
  else{const p=vidaPair(I);if(p){const pt=vidaPts(p);
    h+=`<div class="opts" role="group" aria-labelledby="vida-q">${p.map((x,i)=>`<button type="button" data-vida="${esc(x.serial)}" data-vo="${esc(p[1-i].serial)}" data-vp="${pt[i]}">${esc(x.serial)} (+${pt[i]})</button>`).join('')}</div>
    ${p.map(x=>`<div class="mut">${esc(x.serial)}: último vuelo ${fmtD(x.lastL.net)} (${esc(mname(x.lastL))}) · ${x.next?`próxima misión ${esc(mname(x.next))}, ${fmtD(x.next.net)}`:'sin misión asignada'}</div>`).join('')}`}
    else h+='<p class="mut">Ahora no hay dos propulsores en activo en los datos para apostar.</p>'}
  const past=s.hist.slice(0,4).map(x=>x.res?`<div class="mut">${x.res.both?'Empate':ic(x.ok)} ${esc(x.a)} contra ${esc(x.b)}: dijiste ${esc(x.pick)} · ${x.res.both?'volaron juntos':`voló antes ${esc(x.res.w)}`} en ${esc(x.res.m)} (${fmtD(x.res.net)}) · +${x.won} puntos</div>`:`<div class="mut">${esc(x.a)} contra ${esc(x.b)}: anulada, ninguno voló en 120 días</div>`).join('');
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
function vidaHTML(){const I=vidaData();if(!I)return'';
  const act=I.act.slice().sort((a,b)=>new Date(a.first)-new Date(b.first)),old=act[0];
  const fast=I.act.filter(b=>b.pm!=null&&b.flights>=5).sort((a,b)=>b.pm-a.pm)[0];
  const sp=I.act.map(b=>b.days).sort((a,b)=>a-b),med=sp.length?sp[Math.floor(sp.length/2)]:null;
  const yr=x=>{const y=x/365.25;return y>=1?`${y.toLocaleString('es-ES',{maximumFractionDigits:1})} años`:`${x} días`};
  const row=b=>`<tr><td><b>${esc(b.serial)}</b><div class="mut">${esc(b.rocket)}</div></td><td>${fmtD(b.first)}</td><td>${fmtD(b.lastd)}</td><td>${b.days}<div class="mut">${yr(b.days)}</div></td><td>${b.flights}</td><td>${pmTxt(b.pm)}</td><td>${b.next?`${esc(mname(b.next))}<div class="mut">${fmtD(b.next.net)}</div>`:'—'}</td></tr>`;
  return `<div class="card" id="vida"><b>Vida de los propulsores</b>
  <div class="stats"><div><b>${old?esc(old.serial):'—'}</b>el más antiguo en activo${old?`, desde el ${fmtD(old.first)}`:''}</div>${fast?`<div><b>${pmTxt(fast.pm)}</b>vuelos al mes de ${esc(fast.serial)}, el que más vuela</div>`:''}${med!=null?`<div><b>${yr(med)}</b>vida mediana de los ${I.act.length} en activo</div>`:''}</div>
  <div class="mut">Días entre el primer y el último vuelo de cada propulsor en activo y cuántos vuelos hace al mes de media en ese tiempo (vuelos después del primero entre los meses transcurridos).</div>
  <div class="tscroll"><table><caption class="sr">Vida de los propulsores en activo, del más antiguo al más nuevo</caption><tr><th scope="col">Propulsor</th><th scope="col">Primer vuelo</th><th scope="col">Último vuelo</th><th scope="col">Días en servicio</th><th scope="col">Vuelos</th><th scope="col">Vuelos al mes</th><th scope="col">Próxima misión</th></tr>
  ${act.map(row).join('')}</table></div>
  ${vidaBetHTML(I)}
  <p class="mut">Fechas del primer y del último vuelo, vuelos y estado de cada propulsor según Launch Library 2, para los que aparecen en los últimos ${(rlD().previous||[]).length} lanzamientos o en los próximos. Actualizados ${fmt(I.gen)}.</p></div>`}
function bindVida(){const el=$('#fleet');if(!el||el._vida)return;el._vida=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-vida]');if(!b)return;
  const s=vidaState();if(s.cur){renderFleet();return}
  const pick=b.dataset.vida,o=b.dataset.vo,pts=+b.dataset.vp||0;const[a2,b2]=[pick,o].sort();
  s.cur={a:a2,b:b2,pick,pts,at:Date.now()};LS.set('vida',s);aviso(`Apuesta guardada: ${pick} volará antes que ${o} (+${pts} si aciertas).`);renderFleet();
  const q=$('#vida-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}

// ---------- Reloj del aterrizaje ----------
// Segundo T+ del paso «Stage 1 Landing» (19) y del encendido de aterrizaje (18) en la cronología publicada por Launch Library 2 (campo tl).
const LAND_T={ASDS:'en barcaza',RTLS:'en tierra',Ocean:'en el mar'};
function relInfo(){const d=rlD();if(!d||!d.previous)return null;
  const med=a=>{const s=a.slice().sort((x,y)=>x-y),n=s.length;return n?(n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2):null};
  const row=(l,up)=>{const tl=l.tl||[],g=id=>{const x=tl.find(t=>t[0]===id);return x?x[1]:null},t=g(19);if(t==null||t<=0)return null;
    const st=(l.stages||[])[0]||{},b=g(18);return{l,up,t,burn:b!=null&&b<t?t-b:null,lt:st.land_type||'',loc:st.land_loc||'',locN:st.land_loc_name||'',ok:st.land_success,serial:st.serial||''}};
  const P=(d.previous||[]).map(l=>row(l,false)).filter(Boolean);if(!P.length)return null;
  const pid=new Set(d.previous.map(l=>l.id));
  const U=(d.upcoming||[]).filter(l=>!pid.has(l.id)&&new Date(l.net)>Date.now()-H).map(l=>row(l,true)).filter(Boolean);
  const grp=(arr,key)=>{const G={};arr.forEach(r=>{const k=key(r);(G[k]=G[k]||[]).push(r)});
    return Object.entries(G).map(([k,a])=>{const ts=a.map(r=>r.t),bs=a.map(r=>r.burn).filter(x=>x!=null);
      return{k,a,n:a.length,med:med(ts),min:Math.min(...ts),max:Math.max(...ts),burn:med(bs),fast:a.reduce((x,y)=>y.t<x.t?y:x)}}).sort((x,y)=>y.n-x.n)};
  const byType=grp(P,r=>`${r.l.rocket}|${r.lt}`),byLoc=grp(P.filter(r=>r.loc),r=>r.loc);
  const medOf=r=>{const g=byType.find(x=>x.k===`${r.l.rocket}|${r.lt}`);return g?g.med:null};
  const F=P.filter(r=>/^Falcon/.test(r.l.rocket||'')),Q=F.length?F:P;
  return{P,U,byType,byLoc,medOf,fast:Q.reduce((x,y)=>y.t<x.t?y:x),slow:Q.reduce((x,y)=>y.t>x.t?y:x),gen:d.generated,nPrev:d.previous.length}}
function renderReloj(){const el=$('#reloj');if(!el||!D)return;const I=relInfo();if(!I){el.innerHTML='';return}
  const mm=s=>s==null?'—':tFmt(Math.round(s)),sec=s=>s==null?'—':`${Math.round(s)} s`;
  const tName=k=>{const[r,t]=k.split('|');return `${esc(r)} ${esc(LAND_T[t]||t||'')}`};
  const diff=(t,m)=>{if(m==null)return'';const x=Math.round(t-m);return x===0?'justo en la mediana':`${Math.abs(x)} s ${x<0?'antes':'después'} de la mediana`};
  const typ=I.byType.map(g=>`<tr><th scope="row">${tName(g.k)}</th><td>${g.n}</td><td><b>${mm(g.med)}</b></td><td>${mm(g.min)}<div class="mut">${esc(mname(g.fast.l))}</div></td><td>${mm(g.max)}</td><td>${sec(g.burn)}</td></tr>`).join('');
  const loc=I.byLoc.slice(0,8).map(g=>`<li><b>${esc(g.k)}</b>${g.a[0].locN&&g.a[0].locN!==g.k?` <span class="mut">(${esc(g.a[0].locN)})</span>`:''}: mediana ${mm(g.med)} en ${g.n} ${g.n===1?'aterrizaje':'aterrizajes'} · de ${mm(g.min)} a ${mm(g.max)}</li>`).join('');
  const ok=r=>r.ok===true?' · aterrizó':r.ok===false?' · no aterrizó':'';
  const up=I.U.slice(0,5).map(r=>`<li>${esc(mname(r.l))} <span class="mut">· ${fmt(r.l.net)}</span><div class="mut">Aterrizaje previsto en ${mm(r.t)} ${esc(LAND_T[r.lt]||'')}${r.loc?` (${esc(r.loc)})`:''}, ${diff(r.t,I.medOf(r))}${r.burn!=null?` · encendido de aterrizaje de ${sec(r.burn)}`:''}</div></li>`).join('');
  const last=I.P.slice(0,5).map(r=>`<li>${esc(mname(r.l))} <span class="mut">· ${fmtD(r.l.net)}${r.serial?` · ${esc(r.serial)}`:''}</span><div class="mut">${mm(r.t)} ${esc(LAND_T[r.lt]||'')}${r.loc?` (${esc(r.loc)})`:''}, ${diff(r.t,I.medOf(r))}${ok(r)}</div></li>`).join('');
  el.innerHTML=`<div class="card daily reloj"><div class="kick">Reloj del aterrizaje</div>
  <div class="stats"><div><b>${mm(I.byType[0].med)}</b>mediana del aterrizaje de ${tName(I.byType[0].k)}</div><div><b>${mm(I.fast.t)}</b>el más rápido: ${esc(mname(I.fast.l))}, ${esc(I.fast.l.rocket)}${I.fast.loc?` (${esc(I.fast.loc)})`:''}</div><div><b>${mm(I.slow.t)}</b>el más tardío: ${esc(mname(I.slow.l))}, ${esc(I.slow.l.rocket)}${I.slow.loc?` (${esc(I.slow.loc)})`:''}</div></div>
  <p class="mut">Cuánto tarda el propulsor en tocar la barcaza o la zona de aterrizaje desde el despegue. Volver a tierra suele llevar menos tiempo porque el propulsor da la vuelta enseguida; en barcaza vuela más lejos antes de bajar.</p>
  <div class="tscroll"><table><caption class="sr">Momento del aterrizaje por cohete y tipo de aterrizaje</caption><tr><th scope="col">Cohete y aterrizaje</th><th scope="col">Lanzamientos</th><th scope="col">Mediana</th><th scope="col">Más rápido</th><th scope="col">Más tardío</th><th scope="col">Encendido de aterrizaje (mediana)</th></tr>${typ}</table></div>
  ${loc?`<h4>Por barcaza o zona</h4><ul class="emp-top">${loc}</ul>`:''}
  ${up?`<h4>Próximos con hora de aterrizaje publicada</h4><ul class="emp-top">${up}</ul>`:''}
  <h4>Últimos aterrizajes</h4><ul class="emp-top">${last}</ul>
  <div class="mut" style="margin-top:6px">Tiempos de la cronología de vuelo publicada por Launch Library 2 (pasos «aterrizaje de la primera etapa» y «encendido de aterrizaje») en ${I.P.length} de los últimos ${I.nPrev} lanzamientos de SpaceX; son los tiempos que publica la fuente para cada misión, no una medida propia. Actualizados ${fmt(I.gen)}.</div></div>`}

// ---------- Tiempo en tierra por lanzamiento ----------
// Días desde el vuelo anterior del propulsor principal (turn_around_time de Launch Library 2, guardado en stages[].turnaround)
// en cada lanzamiento reciente, récord, media por mes y apuesta «¿volverá a volar el próximo en menos de 30 días?».
// Se guarda en sxp_tur ({cur,hist}) y se resuelve sola con el primer lanzamiento con tiempo en tierra conocido
// que despegue al menos 2 h después de apostar.
const TUR_MAX=30,TUR_GAP=2*H,TUR_PTS={fav:5,contra:25,base:10,dudosa:20};
function isoDays(s){const m=/^P(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(String(s||'').trim());
  if(!m||m[1]||m[2])return null;const v=i=>+(m[i]||0),d=v(3)*7+v(4)+v(5)/24+v(6)/1440+v(7)/86400;return d>0?d:null}
const turOf=l=>{const c=vetCore(l);if(!c||c.flight===1)return null;const d=isoDays(c.turnaround);return d==null?null:{c,d}};
function turInfo(){const d=rlD();if(!d||!Array.isArray(d.previous)||!d.previous.length)return null;const now=Date.now(),pid=new Set(d.previous.map(l=>l.id));
  const P=d.previous.filter(l=>!isNaN(new Date(l.net))).map(l=>{const x=turOf(l);return x&&{l,t:new Date(l.net).getTime(),...x}}).filter(Boolean).sort((a,b)=>b.t-a.t);
  if(P.length<3)return null;
  const ds=P.map(o=>o.d).sort((a,b)=>a-b),n=ds.length,med=n%2?ds[(n-1)/2]:(ds[n/2-1]+ds[n/2])/2,avg=ds.reduce((s,x)=>s+x,0)/n;
  const fast=P.reduce((x,y)=>y.d<x.d?y:x),slow=P.reduce((x,y)=>y.d>x.d?y:x),under=P.filter(o=>o.d<TUR_MAX).length;
  const mk=t=>{const x=new Date(t);return x.getUTCFullYear()+'-'+String(x.getUTCMonth()+1).padStart(2,'0')};
  const M={};for(const o of P){const k=mk(o.t),m=M[k]||(M[k]={k,n:0,sum:0,min:Infinity,under:0});m.n++;m.sum+=o.d;m.min=Math.min(m.min,o.d);if(o.d<TUR_MAX)m.under++}
  const first=P[P.length-1].t,months=Object.values(M).sort((a,b)=>a.k<b.k?-1:1).map(m=>({...m,avg:m.sum/m.n,part:m.k===mk(first)&&new Date(first).getUTCDate()>1}));
  const fut=(d.upcoming||[]).filter(l=>!pid.has(l.id)&&new Date(l.net).getTime()>now-3*H).sort((a,b)=>new Date(a.net)-new Date(b.net));
  const asg=fut.map(l=>{const x=turOf(l);return x&&{l,...x}}).filter(Boolean).slice(0,5);
  const U=fut.filter(l=>precise(l)&&!/TBD/i.test(l.status||'')&&new Date(l.net).getTime()>now+TUR_GAP),nxt=U[0]||null,nt=nxt?turOf(nxt):null,base=under*2>=n;
  const pts=pick=>nt?((pick==='si')===(nt.d<TUR_MAX)?TUR_PTS.fav:TUR_PTS.contra):((pick==='si')===base?TUR_PTS.base:TUR_PTS.dudosa);
  return{P,n,med,avg,fast,slow,under,months,asg,nxt,nt,base,pts,gen:d.generated}}
function turState(){const s=LS.get('tur',{cur:null,hist:[]});s.hist=s.hist||[];return s}
function resolveTur(){const d=rlD();if(!d||!d.previous)return;const s=turState(),b=s.cur;if(!b)return;
  if(!(new Date(d.generated).getTime()>b.at))return;
  const c=d.previous.filter(l=>new Date(l.net).getTime()>=b.at+TUR_GAP).map(l=>{const x=turOf(l);return x&&{l,...x}}).filter(Boolean).sort((x,y)=>new Date(x.l.net)-new Date(y.l.net))[0];
  if(!c){if(Date.now()>b.at+120*DAY){s.cur=null;LS.set('tur',s)}return}
  const ok=(b.pick==='si')===(c.d<TUR_MAX),won=ok?b.pts:0,dd=Math.round(c.d*10)/10;
  s.hist.unshift({...b,res:{m:mname(c.l),net:c.l.net,serial:c.c.serial,d:dd},ok,won,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('tur',s);
  if(won)addPts('tur',won);aviso(`Apuesta del tiempo en tierra resuelta: ${mname(c.l)} voló con ${c.c.serial} tras ${String(dd).replace('.',',')} días en tierra. ${ok?`+${won} puntos.`:'Esta vez no.'}`)}
const turF=x=>(Math.round(x*10)/10).toFixed(1).replace('.',',');
function turBetHTML(I){const s=turState(),b=s.cur,l=I.nxt;
  let h=`<h3 id="tur-q">¿Volverá a volar el próximo propulsor en menos de ${TUR_MAX} días?</h3><p class="mut">Cuenta el primer lanzamiento de SpaceX que despegue al menos 2 horas después de apostar y cuyo propulsor principal tenga tiempo en tierra en Launch Library 2 (los estrenos no cuentan). ${I.nt?`El primero con hora fijada es ${esc(mname(l))}: ${esc(I.nt.c.serial)} llevaría ${turF(I.nt.d)} días en tierra. Acertar con eso da ${TUR_PTS.fav} puntos y apostar a que cambia (otro propulsor o un retraso), ${TUR_PTS.contra}.`:`${l?`El primero con hora fijada (${esc(mname(l))}) aún no tiene propulsor reutilizado asignado en la fuente`:'Ahora no hay ninguno con hora fijada'}, así que lo más habitual en los datos (${I.base?`menos de ${TUR_MAX} días`:`${TUR_MAX} días o más`}) da ${TUR_PTS.base} puntos y lo contrario, ${TUR_PTS.dudosa}.`}</p>`;
  if(b)h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Dijiste <b>${b.pick==='si'?`Sí, menos de ${TUR_MAX}`:`No, ${TUR_MAX} o más`}</b> (+${b.pts}) el ${fmt(b.at)} · se resuelve sola con el siguiente despegue.</p>`;
  else h+=`<div class="opts" role="group" aria-labelledby="tur-q"><button type="button" data-tur="si">Sí, menos de ${TUR_MAX} (+${I.pts('si')})</button><button type="button" data-tur="no">No, ${TUR_MAX} o más (+${I.pts('no')})</button></div>`;
  const past=s.hist.slice(0,4).map(x=>`<div class="mut">${ic(x.ok)} Dijiste ${x.pick==='si'?`menos de ${TUR_MAX}`:`${TUR_MAX} o más`} · ${esc(x.res.m)} voló con ${esc(x.res.serial)} tras ${turF(x.res.d)} días (${fmtD(x.res.net)}) · +${x.won} puntos</div>`).join('');
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
function renderTierra(){const el=$('#tierra');if(!el||!D)return;const I=turInfo();if(!I){el.innerHTML='';return}
  const mx=Math.max(1,...I.months.map(m=>m.avg));
  const months=I.months.map(m=>`<li>${esc(vetMesN(m.k))}${m.part?' <span class="mut">(parcial en los datos)</span>':''}: media <b>${turF(m.avg)}</b> días <span class="mut">· ${m.n} ${m.n===1?'lanzamiento':'lanzamientos'}, el más rápido ${turF(m.min)}, ${m.under} en menos de ${TUR_MAX}</span><div class="empbar" aria-hidden="true"><span style="width:${Math.max(2,Math.round(m.avg/mx*100))}%"></span></div></li>`).join('');
  const top=I.P.slice().sort((a,b)=>a.d-b.d).slice(0,5).map(o=>`<li><b>${turF(o.d)} días</b> · ${esc(o.c.serial)} en ${esc(mname(o.l))} <span class="mut">(${fmtD(o.l.net)}, vuelo nº ${o.c.flight})</span></li>`).join('');
  const last=I.P.slice(0,6).map(o=>`<li>${esc(mname(o.l))} <span class="mut">· ${esc(o.l.rocket||'')}, ${fmtD(o.l.net)}</span><div class="mut">${esc(o.c.serial)} volvió a volar tras <b>${turF(o.d)}</b> días en tierra${o.d<TUR_MAX?` · menos de ${TUR_MAX}`:''}</div></li>`).join('');
  const asg=I.asg.map(o=>`<li>${esc(mname(o.l))} <span class="mut">· ${fmt(o.l.net)}</span><div class="mut">${esc(o.c.serial)} llevaría ${turF(o.d)} días en tierra${o.d<I.fast.d?' · ¡sería un récord en los datos!':''}</div></li>`).join('');
  el.innerHTML=`<div class="card daily tierra"><div class="kick">Tiempo en tierra por lanzamiento</div>
  <div class="stats"><div><b>${turF(I.med)}</b>días de mediana entre dos vuelos del mismo propulsor (media ${turF(I.avg)})</div><div><b>${turF(I.fast.d)}</b>récord de rapidez: ${esc(I.fast.c.serial)} en ${esc(mname(I.fast.l))}</div><div><b>${Math.round(100*I.under/I.n)} %</b>volvieron a volar en menos de ${TUR_MAX} días (${I.under} de ${I.n})</div><div><b>${turF(I.slow.d)}</b>el más largo: ${esc(I.slow.c.serial)} en ${esc(mname(I.slow.l))}</div></div>
  <p class="mut">Es el tiempo que pasa el propulsor entre un vuelo y el siguiente: aterrizar, volver a puerto, revisarlo y prepararlo otra vez.</p>
  <h4>Los más rápidos</h4><ul class="emp-top">${top}</ul>
  <h4>Media por mes</h4><ul class="emp-top" aria-label="Días medios en tierra por mes">${months}</ul>
  <h4>Últimos lanzamientos</h4><ul class="emp-top">${last}</ul>
  ${asg?`<h4>Próximos con propulsor asignado</h4><ul class="emp-top">${asg}</ul>`:''}
  ${turBetHTML(I)}<div class="mut" style="margin-top:6px">Calculado con los ${I.n} últimos lanzamientos de SpaceX con tiempo en tierra del propulsor principal en Launch Library 2 (dato turn_around_time; en el Falcon Heavy, el núcleo central), desde el ${fmtD(I.P[I.n-1].l.net)}, actualizados ${fmt(I.gen)}. En los próximos, el tiempo es el que da la fuente con la fecha prevista y puede cambiar. Meses en hora UTC.</div></div>`}
function bindTierra(){const el=$('#next');if(!el||el._tur)return;el._tur=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-tur]');if(!b)return;
  const I=turInfo(),s=turState();if(!I||s.cur){renderTierra();return}
  const pick=b.dataset.tur==='si'?'si':'no',pts=I.pts(pick);
  s.cur={pick,pts,at:Date.now(),ref:I.nt?{m:mname(I.nxt),serial:I.nt.c.serial,d:Math.round(I.nt.d*10)/10}:null};LS.set('tur',s);
  aviso(`Apuesta guardada: el próximo propulsor volverá a volar ${pick==='si'?`en menos de ${TUR_MAX} días`:`tras ${TUR_MAX} días o más`} (+${pts} si aciertas).`);completeDaily('tur');renderTierra();
  const q=$('#tur-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}

// ---------- Historial de fallos (lanzamientos fallidos de SpaceX en Launch Library 2, con el motivo publicado) ----------
const fname=f=>{if(!f)return '';let t=/Starship/.test(f.rocket||f.name||'')?(f.name||'').replace(/\s*\|\s*/,' '):mname(f);return t.replace('(Failure before launch)','(fallo antes del lanzamiento)')};
function falInfo(){const F=Array.isArray(D.fails)?D.fails.filter(f=>f&&f.net):[];if(!F.length)return null;const s=D.stats||{};
  const asc=F.slice().sort((a,b)=>new Date(a.net)-new Date(b.net)),last=asc.at(-1),total=s.total_launch_count;
  const cur=s.consecutive_successful_launches!=null?s.consecutive_successful_launches:(total!=null&&last.n!=null?total-last.n:null);
  const okN=asc.every(f=>Number.isFinite(f.n));let streaks=[];
  if(okN){for(let i=1;i<asc.length;i++)streaks.push({n:asc[i].n-asc[i-1].n-1,a:asc[i-1],b:asc[i]});
    if(asc[0].n>1)streaks.push({n:asc[0].n-1,a:null,b:asc[0]});if(cur!=null)streaks.push({n:cur,a:last,b:null});
    streaks.sort((x,y)=>y.n-x.n)}
  const byR={};for(const f of F){const r=f.rocket||'Otro';byR[r]=byR[r]||{r,n:0,p:0};byR[r].n++;if(f.status==='Partial Failure')byR[r].p++}
  const land=[];for(const l of D.previous||[])for(const st of l.stages||[])if(st.land_attempt&&st.land_success===false)land.push({l,st});
  return {F:asc.slice().reverse(),last,cur,total,failed:s.failed_launches!=null?s.failed_launches:F.length,partial:F.filter(f=>f.status==='Partial Failure').length,
    streaks,best:streaks[0]||null,rows:Object.values(byR).sort((a,b)=>b.n-a.n),land,s,days:Math.floor((Date.now()-new Date(last.net))/DAY)}}
function falReason(f){if(!f.fail)return '<div class="mut">La fuente no publica el motivo.</div>';const t=FES[f.id];
  if(t&&t.en===f.fail&&t.es)return `<div>${esc(t.es)}</div><details class="xp"><summary>Texto original de la fuente (inglés)</summary><div class="mut">${esc(f.fail)}</div></details>`;
  return `<div>${esc(f.fail)}</div>`}
function fallosHTML(){let I;try{I=falInfo()}catch(e){I=null}if(!I)return '';const s=I.s,pct=I.total?(100*I.failed/I.total).toLocaleString('es-ES',{maximumFractionDigits:1}):null;
  const stName=f=>f.status==='Partial Failure'?'Fallo parcial':'Fallo';
  const strTxt=x=>x.b?(x.a?`entre ${esc(fname(x.a))} (${fmtD(x.a.net)}) y ${esc(fname(x.b))} (${fmtD(x.b.net)})`:`antes del primer fallo, ${esc(fname(x.b))} (${fmtD(x.b.net)})`):`desde ${esc(fname(x.a))} (${fmtD(x.a.net)}) hasta hoy · es la racha actual`;
  const lf=s.attempted_landings!=null&&s.successful_landings!=null?s.attempted_landings-s.successful_landings:null;
  const list=I.F.map(f=>`<li><b>${esc(fname(f))}</b> <span class="tag ko">${stName(f)}</span> <span class="mut">· ${esc(f.rocket||'')}, ${fmtD(f.net)}${f.n?` · lanzamiento nº ${f.n} de SpaceX`:''}${f.loc?` · ${esc(f.loc)}`:''}</span>${falReason(f)}</li>`).join('');
  const rows=I.rows.map(r=>`<li>${esc(r.r)}: <b>${r.n}</b> ${r.n===1?'fallo':'fallos'}${r.p?` (${r.p} ${r.p===1?'parcial':'parciales'})`:''}</li>`).join('');
  const str=I.streaks.slice(0,5).map(x=>`<li><b>${x.n}</b> lanzamientos seguidos sin fallo <span class="mut">${strTxt(x)}</span></li>`).join('');
  const land=I.land.map(o=>`<li>${esc(fname(o.l))} <span class="mut">· ${esc(o.l.rocket||'')}, ${fmtD(o.l.net)} · ${esc(o.st.serial||'propulsor')}${o.st.land_loc_name?` en ${esc(o.st.land_loc_name)}`:''}${o.l.status==='Success'?' · el lanzamiento sí fue un éxito':''}</span></li>`).join('');
  return `<div class="card daily fallos" id="fallos"><div class="kick">Historial de fallos</div>
  <div class="stats"><div><b>${I.failed}</b>lanzamientos fallidos${I.total?` de ${I.total} (${pct} %)`:''}${I.partial?`, ${I.partial} parciales`:''}</div>${I.cur!=null?`<div><b>${I.cur}</b>lanzamientos seguidos sin fallo ahora mismo</div>`:''}${I.best?`<div><b>${I.best.n}</b>la racha más larga sin fallos${I.best.b?'':' (es la actual)'}</div>`:''}<div><b>${I.days.toLocaleString('es-ES')}</b>días desde el último fallo (${esc(fname(I.last))}, ${fmtD(I.last.net)})</div>${lf!=null?`<div><b>${lf}</b>aterrizajes fallidos de ${s.attempted_landings} intentos; ahora lleva ${s.consecutive_successful_landings} seguidos bien</div>`:''}</div>
  <p class="mut">Un fallo es un lanzamiento que no cumplió su misión; uno parcial solo cumplió una parte de lo previsto. Starship cuenta sus vuelos de prueba.</p>
  <h4>Fallos por cohete</h4><ul class="emp-top">${rows}</ul>
  ${str?`<h4>Rachas más largas sin fallos</h4><ul class="emp-top">${str}</ul>`:''}
  <details class="xp"><summary>Todos los fallos con el motivo publicado (${I.F.length})</summary><ul class="emp-top">${list}</ul></details>
  ${land?`<h4>Aterrizajes fallidos en los últimos ${(D.previous||[]).length} lanzamientos</h4><ul class="emp-top">${land}</ul>`:''}
  <div class="mut" style="margin-top:6px">Lanzamientos de SpaceX con estado «fallo» o «fallo parcial» en Launch Library 2, con el motivo que publica la fuente (traducido al español; el texto original está debajo de cada uno). Las rachas se cuentan con el número de intento de lanzamiento de SpaceX de la fuente. Actualizado ${fmt(D.generated)}.</div></div>`}

// ---------- Hitos de SpaceX ----------
// Número de intento de lanzamiento de SpaceX y del año de cada lanzamiento (agency_launch_attempt_count y
// agency_launch_attempt_count_year de Launch Library 2, guardados en n y ny), próximo número redondo y apuesta
// «¿será Starlink el lanzamiento nº X?». Se guarda en sxp_hito ({cur,hist}) y se resuelve sola cuando el lanzamiento
// con ese número aparece en el historial; si despegó menos de 2 h después de apostar, se anula. Puntos en la categoría hito.
const HITO_STEP=50,HITO_Y=25,HITO_GAP=2*H,HITO_PTS={fav:10,contra:25};
function hitoInfo(){const d=rlD();if(!d||!Array.isArray(d.previous))return null;const s=d.stats||{},now=Date.now();
  const P=d.previous.filter(l=>Number.isFinite(l.n)&&!isNaN(new Date(l.net))).sort((a,b)=>b.n-a.n);if(!P.length)return null;
  const total=Math.max(P[0].n,Number.isFinite(s.total_launch_count)?s.total_launch_count:0);
  const M=Math.floor(total/HITO_STEP)*HITO_STEP+HITO_STEP,falta=M-total;
  const pid=new Set(d.previous.map(l=>l.id));
  const fut=(d.upcoming||[]).filter(l=>!pid.has(l.id)&&!isNaN(new Date(l.net))&&new Date(l.net).getTime()>now-3*H).sort((a,b)=>new Date(a.net)-new Date(b.net));
  const U=fut.map((l,i)=>({l,k:total+i+1})),tgt=U.find(o=>o.k===M)||null;
  const last=P[0],yN=Number.isFinite(last.ny)&&total===last.n?last.ny:null,yr=new Date(last.net).getUTCFullYear();
  let yM=null,yT=null;if(yN!=null){yM=Math.floor(yN/HITO_Y)*HITO_Y+HITO_Y;const o=U[yM-yN-1];yT=o&&new Date(o.l.net).getUTCFullYear()===yr?o:null}
  const r30=P.filter(l=>new Date(l.net).getTime()>now-30*DAY).length,eta=r30?now+falta*30*DAY/r30:null;
  const round=P.filter(l=>l.n%HITO_STEP===0),sl=P.filter(isStarlink).length,base=sl*2>=P.length;
  const fav=tgt?(isStarlink(tgt.l)?'si':'no'):(base?'si':'no'),pts=pick=>pick===fav?HITO_PTS.fav:HITO_PTS.contra;
  return{P,total,M,falta,U,tgt,last,yN,yM,yT,yr,r30,eta,round,sl,base,fav,pts,gen:d.generated}}
function hitoState(){const s=LS.get('hito',{cur:null,hist:[]});s.hist=s.hist||[];return s}
function resolveHito(){const d=rlD();if(!d||!d.previous)return;const s=hitoState(),b=s.cur;if(!b)return;
  if(!(new Date(d.generated).getTime()>b.at))return;
  const l=d.previous.find(x=>x.n===b.M);
  if(!l){const tot=(d.stats||{}).total_launch_count;if(Number.isFinite(tot)&&tot>=b.M+HITO_STEP){s.cur=null;LS.set('hito',s)}return}
  const t=new Date(l.net).getTime(),sl=isStarlink(l);
  if(t<b.at+HITO_GAP){s.hist.unshift({...b,res:{m:mname(l),net:l.net,sl},ok:false,won:0,void:true,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('hito',s);
    aviso(`Apuesta del lanzamiento nº ${b.M} anulada: despegó menos de 2 horas después de apostar.`);return}
  const ok=(b.pick==='si')===sl,won=ok?b.pts:0;
  s.hist.unshift({...b,res:{m:mname(l),net:l.net,sl},ok,won,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('hito',s);
  if(won)addPts('hito',won);aviso(`Lanzamiento nº ${b.M} de SpaceX: ${mname(l)}, ${sl?'un Starlink':'no es Starlink'}. ${ok?`+${won} puntos.`:'Esta vez no.'}`)}
function hitoBetHTML(I){const s=hitoState(),b=s.cur;
  let h=`<h3 id="hito-q">¿Será Starlink el lanzamiento nº ${I.M} de SpaceX?</h3><p class="mut">Se resuelve sola cuando Launch Library 2 pase al historial el lanzamiento con el número de intento ${I.M} de SpaceX, sea cual sea (las fechas de la lista cambian y pueden adelantarse otros). Si despega menos de 2 horas después de apostar, la apuesta se anula. ${I.tgt?`Si se lanzan en el orden previsto, sería ${esc(mname(I.tgt.l))} (${fmt(I.tgt.l.net)}), ${isStarlink(I.tgt.l)?'un Starlink':'que no es Starlink'}: acertar con eso da ${HITO_PTS.fav} puntos y apostar a que cambia el orden, ${HITO_PTS.contra}.`:`La lista de próximos no llega tan lejos, así que lo más habitual en los datos (${I.base?'Starlink':'no Starlink'}, ${I.sl} de ${I.P.length}) da ${HITO_PTS.fav} puntos y lo contrario, ${HITO_PTS.contra}.`}</p>`;
  if(b&&b.M===I.M)h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Dijiste <b>${b.pick==='si'?'Sí, Starlink':'No, otra misión'}</b> (+${b.pts}) el ${fmt(b.at)} · se resuelve sola.</p>`;
  else if(b)h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Tienes pendiente la apuesta del nº ${b.M} (${b.pick==='si'?'Starlink':'otra misión'}, +${b.pts}); se resolverá con la próxima actualización de los datos.</p>`;
  else h+=`<div class="opts" role="group" aria-labelledby="hito-q"><button type="button" data-hito="si">Sí, Starlink (+${I.pts('si')})</button><button type="button" data-hito="no">No, otra misión (+${I.pts('no')})</button></div>`;
  const past=s.hist.slice(0,4).map(x=>x.void?`<div class="mut">Nº ${x.M}: anulada, ${esc(x.res.m)} despegó menos de 2 h después de apostar</div>`:`<div class="mut">${ic(x.ok)} Nº ${x.M}: dijiste ${x.pick==='si'?'Starlink':'otra misión'} · fue ${esc(x.res.m)} (${fmtD(x.res.net)}) · +${x.won} puntos</div>`).join('');
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
function renderHitos(){const el=$('#hitos');if(!el||!D)return;let I;try{I=hitoInfo()}catch(e){I=null}if(!I){el.innerHTML='';return}
  const up=I.U.slice(0,Math.min(I.U.length,Math.max(5,I.falta))).map(o=>`<li${o.k===I.M?' class="hito-m"':''}><b>nº ${o.k}</b> · ${esc(mname(o.l))} <span class="mut">· ${esc(o.l.rocket||'')}, ${fmt(o.l.net)}${/^(SEC|MIN|HOUR)$/i.test(o.l.net_precision||'')?'':' (fecha aproximada)'}${o.k===I.M?' · ¡sería el nº '+I.M+'!':''}${I.yT&&o===I.yT?` · sería el nº ${I.yM} del año`:''}</span></li>`).join('');
  const last=I.P.slice(0,6).map(l=>`<li><b>nº ${l.n}</b>${Number.isFinite(l.ny)?` <span class="mut">(nº ${l.ny} de ${new Date(l.net).getUTCFullYear()})</span>`:''} · ${esc(mname(l))} <span class="mut">· ${esc(l.rocket||'')}, ${fmtD(l.net)}${l.status&&l.status!=='Success'?' · '+esc(l.status_name||l.status):''}</span></li>`).join('');
  const round=I.round.map(l=>`<li><b>nº ${l.n}</b> · ${esc(mname(l))} <span class="mut">· ${esc(l.rocket||'')}, ${fmtD(l.net)}</span></li>`).join('');
  el.innerHTML=`<div class="card daily hitos"><div class="kick">Hitos de SpaceX</div>
  <div class="stats"><div><b>${I.total}</b>intentos de lanzamiento de SpaceX hasta ahora; el último, ${esc(mname(I.last))}</div>${I.yN!=null?`<div><b>${I.yN}</b>lanzamientos en ${I.yr}</div>`:''}<div><b>${I.falta}</b>${I.falta===1?'lanzamiento falta':'lanzamientos faltan'} para el nº ${I.M}</div>${I.eta?`<div><b>${fmtD(I.eta)}</b>fecha aproximada del nº ${I.M} al ritmo de los últimos 30 días (${I.r30} lanzamientos)</div>`:''}</div>
  ${I.yT?`<p class="mut">El nº ${I.yM} del año ${I.yr} sería ${esc(mname(I.yT.l))} si se lanzan en el orden previsto.</p>`:''}
  ${up?`<h4>Próximos números si se lanzan en el orden previsto</h4><ul class="emp-top">${up}</ul>`:''}
  <h4>Últimos lanzamientos con su número</h4><ul class="emp-top">${last}</ul>
  ${round?`<h4>Números redondos en los datos</h4><ul class="emp-top">${round}</ul>`:''}
  ${hitoBetHTML(I)}<div class="mut" style="margin-top:6px">Números de intento de lanzamiento de SpaceX y del año que publica Launch Library 2 para cada lanzamiento (cuentan también los fallidos), en los últimos ${I.P.length} lanzamientos. En los próximos, el número es una cuenta propia siguiendo el orden de la lista de la fuente, que puede cambiar. Actualizados ${fmt(I.gen)}.</div></div>`}
function bindHitos(){const el=$('#next');if(!el||el._hito)return;el._hito=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-hito]');if(!b)return;
  const I=hitoInfo(),s=hitoState();if(!I||s.cur){renderHitos();return}
  const pick=b.dataset.hito==='si'?'si':'no',pts=I.pts(pick);
  s.cur={M:I.M,pick,pts,at:Date.now(),ref:I.tgt?{m:mname(I.tgt.l),sl:isStarlink(I.tgt.l)}:null};LS.set('hito',s);
  aviso(`Apuesta guardada: el lanzamiento nº ${I.M} ${pick==='si'?'será Starlink':'no será Starlink'} (+${pts} si aciertas).`);completeDaily('hito');renderHitos();
  const q=$('#hito-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}
// ---------- Ritmo del año ----------
// Lanzamientos de SpaceX en lo que va de año según el contador anual de Launch Library 2 (ny), media por semana y
// proyección a 31 de diciembre con el ritmo de los últimos 60 días. Apuesta «¿cuántos lanzamientos llevará SpaceX el
// último día del mes que viene?» por tramos alrededor de la proyección; se cierra al acabar el mes en curso y se
// resuelve sola con el contador anual del último lanzamiento hasta esa fecha. Se guarda en sxp_anu ({cur,hist}).
const ANU_WIN=60,ANU_PTS={mid:10,out:20};
function anuEnd(y,m){return new Date(y,m+1,1).getTime()-1000}// último segundo (hora local) del mes m
function anuCount(P,T){const y=new Date(T).getUTCFullYear(),L=P.filter(l=>new Date(l.net).getTime()<=T&&new Date(l.net).getUTCFullYear()===y);
  return L.length?Math.max(...L.map(l=>l.ny)):0}
function anuInfo(){const d=rlD();if(!d||!Array.isArray(d.previous))return null;const now=Date.now();
  const P=d.previous.filter(l=>Number.isFinite(l.ny)&&!isNaN(new Date(l.net))).sort((a,b)=>new Date(b.net)-new Date(a.net));if(P.length<10)return null;
  const nd=new Date(now),yr=nd.getUTCFullYear(),last=P[0],ly=new Date(last.net).getUTCFullYear();
  if(ly>yr)return null;const yN=ly===yr?last.ny:0;
  const y0=Date.UTC(yr,0,1),y1=Date.UTC(yr+1,0,1),el=(now-y0)/DAY,left=(y1-now)/DAY;
  const oldest=new Date(P[P.length-1].net).getTime(),win=Math.min(ANU_WIN,(now-oldest)/DAY);
  const rN=P.filter(l=>new Date(l.net).getTime()>now-win*DAY).length,rate=rN/win;
  const wkY=el>=7?yN/(el/7):null,wkR=rate*7,projR=yN+rate*left,projY=el>=14?yN*(y1-y0)/DAY/el:null;
  const T=anuEnd(nd.getFullYear(),nd.getMonth()+1),close=anuEnd(nd.getFullYear(),nd.getMonth());
  const ty=new Date(T).getUTCFullYear(),base=ty===yr?yN:0,toT=(T-now)/DAY,proj=base+rate*toT,c=Math.round(proj);
  const B=[{k:'a',lo:-Infinity,hi:c-3,p:ANU_PTS.out},{k:'b',lo:c-2,hi:c,p:ANU_PTS.mid},{k:'c',lo:c+1,hi:c+3,p:ANU_PTS.mid},{k:'d',lo:c+4,hi:Infinity,p:ANU_PTS.out}];
  const fp=(d.upcoming||[]).filter(l=>!P.some(p=>p.id===l.id)&&!isNaN(new Date(l.net))&&new Date(l.net).getTime()>now-3*H&&new Date(l.net).getTime()<=T&&new Date(l.net).getUTCFullYear()===ty).length;
  const mo=[];for(const l of P){const t=new Date(l.net);if(t.getUTCFullYear()!==yr)continue;const k=t.getUTCMonth();(mo[k]=mo[k]||[]).push(l)}
  const months=mo.map((L,k)=>L&&{k,n:L.length,hi:Math.max(...L.map(l=>l.ny))}).filter(Boolean);
  return{P,yr,yN,last,el,left,win:Math.round(win),rN,rate,wkY,wkR,projR,projY,T,close,ty,base,proj,c,B,fp,months,gen:d.generated}}
function anuState(){const s=LS.get('anu',{cur:null,hist:[]});s.hist=s.hist||[];return s}
function anuLab(b){return b.lo===-Infinity||b.lo==null?`${b.hi} o menos`:b.hi===Infinity||b.hi==null?`${b.lo} o más`:`de ${b.lo} a ${b.hi}`}
function resolveAnu(){const d=rlD();if(!d||!Array.isArray(d.previous))return;const s=anuState(),b=s.cur;if(!b)return;
  if(!(new Date(d.generated).getTime()>b.T+6*H))return;
  const P=d.previous.filter(l=>Number.isFinite(l.ny)&&!isNaN(new Date(l.net)));if(!P.length)return;
  const ty=new Date(b.T).getUTCFullYear(),cover=P.some(l=>new Date(l.net).getTime()<=b.T&&new Date(l.net).getUTCFullYear()===ty)||P.every(l=>new Date(l.net).getTime()>b.T);
  if(!cover)return;const n=anuCount(P,b.T),lo=b.lo==null?-Infinity:b.lo,hi=b.hi==null?Infinity:b.hi,ok=n>=lo&&n<=hi,won=ok?b.pts:0;
  s.hist.unshift({...b,res:n,ok,won,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('anu',s);
  if(won)addPts('anu',won);aviso(`SpaceX llevaba ${n} lanzamientos en ${ty} el ${fmtD(b.T)}. ${ok?`+${won} puntos.`:'Esta vez no.'}`)}
function anuBetHTML(I){const s=anuState(),b=s.cur,open=Date.now()<I.close,lab=fmtD(I.T);
  let h=`<h3 id="anu-q">¿Cuántos lanzamientos llevará SpaceX en ${I.ty} el ${lab}?</h3><p class="mut">Al ritmo de los últimos ${I.win} días llevaría unos ${String(Math.round(I.proj*10)/10).replace('.',',')}${I.fp?` (en la lista hay ${I.fp} con fecha prevista hasta entonces)`:''}. Los tramos del centro dan ${ANU_PTS.mid} puntos y los de los extremos, ${ANU_PTS.out}. Se puede apostar hasta el ${fmtD(I.close)} y se resuelve sola con el contador anual de Launch Library 2 del último lanzamiento hasta el final del ${lab}, en cuanto se actualicen los datos.</p>`;
  if(b)h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Dijiste <b>${anuLab(b)}</b> para el ${fmtD(b.T)} (+${b.pts}) · se resuelve sola.</p>`;
  else if(open)h+=`<div class="opts" role="group" aria-labelledby="anu-q">${I.B.map(x=>`<button type="button" data-anu="${x.k}">${anuLab(x)} (+${x.p})</button>`).join('')}</div>`;
  else h+=`<p class="mut">Las apuestas para esta fecha ya están cerradas.</p>`;
  const past=s.hist.slice(0,4).map(x=>`<div class="mut">${ic(x.ok)} ${fmtD(x.T)}: dijiste ${anuLab(x)} · fueron ${x.res} · +${x.won} puntos</div>`).join('');
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
const ANU_MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function renderAnual(){const el=$('#anual');if(!el||!D)return;let I;try{I=anuInfo()}catch(e){I=null}if(!I){el.innerHTML='';return}
  const f1=x=>String(Math.round(x*10)/10).replace('.',',');
  const mrows=I.months.map(m=>`<li><b>${ANU_MES[m.k]}</b> · ${m.n} lanzamiento${m.n===1?'':'s'} en los datos <span class="mut">· acabó en el nº ${m.hi} del año</span></li>`).join('');
  el.innerHTML=`<div class="card daily anual"><div class="kick">Ritmo del año</div>
  <div class="stats"><div><b>${I.yN}</b>lanzamientos de SpaceX en ${I.yr}${I.yN?`; el último, ${esc(mname(I.last))} (${fmtD(I.last.net)})`:''}</div>${I.wkY!=null?`<div><b>${f1(I.wkY)}</b>por semana de media en ${I.yr}</div>`:''}<div><b>${f1(I.wkR)}</b>por semana en los últimos ${I.win} días (${I.rN} lanzamientos)</div><div><b>${Math.round(I.projR)}</b>al acabar ${I.yr} si sigue el ritmo de los últimos ${I.win} días</div>${I.projY!=null?`<div><b>${Math.round(I.projY)}</b>al acabar ${I.yr} con la media del año</div>`:''}</div>
  ${mrows?`<h4>Meses de ${I.yr} que entran en los datos</h4><ul class="emp-top">${mrows}</ul><p class="mut">Los datos guardan los últimos ${I.P.length} lanzamientos, así que el primer mes de la lista puede estar incompleto.</p>`:''}
  ${anuBetHTML(I)}<div class="mut" style="margin-top:6px">Contador de lanzamientos de SpaceX del año que publica Launch Library 2 para cada lanzamiento (cuenta también los fallidos). Las proyecciones son una cuenta propia con el ritmo indicado. Actualizados ${fmt(I.gen)}.</div></div>`}
function bindAnual(){const el=$('#next');if(!el||el._anu)return;el._anu=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-anu]');if(!b)return;
  const I=anuInfo(),s=anuState();if(!I||s.cur||Date.now()>=I.close){renderAnual();return}
  const x=I.B.find(o=>o.k===b.dataset.anu);if(!x)return;
  s.cur={T:I.T,lo:Number.isFinite(x.lo)?x.lo:null,hi:Number.isFinite(x.hi)?x.hi:null,pts:x.p,at:Date.now(),proj:Math.round(I.proj*10)/10};LS.set('anu',s);
  aviso(`Apuesta guardada: ${anuLab(s.cur)} lanzamientos el ${fmtD(I.T)} (+${x.p} si aciertas).`);completeDaily('anu');renderAnual();
  const q=$('#anu-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}
// ---------- Veteranía de las plataformas ----------
// Número total de lanzamientos de cada plataforma (pad_launch_attempt_count de Launch Library 2, guardado en pn; cuenta
// lanzamientos de cualquier empresa desde esa plataforma). El valor actual es el mayor pn del historial; para los próximos,
// la fuente solo da números fiables en los más cercanos, así que se cuenta siguiendo el orden de la lista. Solo lectura.
const padStep=n=>n<25?5:25;
function padInfo(){const d=rlD();if(!d||!Array.isArray(d.previous))return null;const now=Date.now(),known=p=>p&&!/^unknown/i.test(p);
  const A={};for(const l of d.previous){if(!known(l.pad)||!Number.isFinite(l.pn))continue;const x=A[l.pad]||(A[l.pad]={pad:l.pad,loc:l.loc,n:0,last:null,sx:0});
    x.sx++;if(l.pn>x.n){x.n=l.pn;x.last=l}}
  const rows=Object.values(A);if(!rows.length)return null;
  const pid=new Set(d.previous.map(l=>l.id));
  const fut=(d.upcoming||[]).filter(l=>!pid.has(l.id)&&known(l.pad)&&A[l.pad]&&!isNaN(new Date(l.net))&&new Date(l.net).getTime()>now-3*H).sort((a,b)=>new Date(a.net)-new Date(b.net));
  const c={};for(const r of rows){c[r.pad]=r.n;r.M=Math.floor(r.n/padStep(r.n))*padStep(r.n)+padStep(r.n);r.falta=r.M-r.n;r.up=[];r.tgt=null;r.ord=null}
  fut.forEach((l,i)=>{const r=A[l.pad];c[l.pad]++;r.up.push({l,k:c[l.pad]});if(!r.tgt&&c[l.pad]===r.M){r.tgt=l;r.ord=i}});
  rows.sort((a,b)=>b.n-a.n);
  const first=rows.filter(r=>r.tgt).sort((a,b)=>a.ord-b.ord)[0]||null;
  return{rows,first,P:d.previous.length,gen:d.generated}}
function renderPlataformas(){const el=$('#plataformas');if(!el||!D)return;let I;try{I=padInfo()}catch(e){I=null}if(!I){el.innerHTML='';return}
  const apx=l=>/^(SEC|MIN|HOUR)$/i.test(l.net_precision||'')?'':' (fecha aproximada)';
  const row=r=>`<tr><th scope="row">${esc(r.pad)}<div class="mut">${esc(r.loc||'')}</div></th><td><b>${r.n}</b><div class="mut">el último, ${esc(mname(r.last))} (${fmtD(r.last.net)})</div></td><td>${r.falta}<div class="mut">para el nº ${r.M}</div></td><td>${r.tgt?`${esc(mname(r.tgt))}<div class="mut">${fmt(r.tgt.net)}${apx(r.tgt)}</div>`:`<span class="mut">${r.up.length?`la lista solo trae ${r.up.length} ${r.up.length===1?'lanzamiento':'lanzamientos'} más desde aquí`:'no hay lanzamientos previstos aquí en la lista'}</span>`}</td></tr>`;
  const f=I.first;
  el.innerHTML=`<div class="card daily plataformas"><div class="kick">Veteranía de las plataformas</div>
  ${f?`<p><b>${esc(f.pad)}</b> llegará antes a un número redondo: su lanzamiento nº ${f.M} sería ${esc(mname(f.tgt))} (${fmt(f.tgt.net)}${apx(f.tgt)}), si se lanzan en el orden previsto.</p>`:'<p class="mut">Ninguna plataforma llega a su siguiente número redondo con los lanzamientos de la lista actual.</p>'}
  <div class="tscroll"><table><caption class="sr">Lanzamientos totales de cada plataforma y su próximo número redondo</caption><thead><tr><th scope="col">Plataforma</th><th scope="col">Lanzamientos</th><th scope="col">Faltan</th><th scope="col">Lo haría</th></tr></thead><tbody>${I.rows.map(row).join('')}</tbody></table></div>
  <div class="mut" style="margin-top:6px">Número de lanzamientos desde cada plataforma que publica Launch Library 2 (cuenta los de todas las empresas y también los fallidos), tomado del último lanzamiento de SpaceX desde ella en los últimos ${I.P} lanzamientos. En los próximos, el número es una cuenta propia siguiendo el orden de la lista de la fuente, que puede cambiar. Actualizados ${fmt(I.gen)}.</div></div>`}

// ---------- Grupos de Starlink ----------
function slkInfo(){const d=D;if(!d||!Array.isArray(d.previous))return null;const now=Date.now();
  const pid=new Set(d.previous.map(l=>l.id)),re=/^Starlink Group (\d+)-(\d+)/i,G={};
  const add=(l,fut)=>{const m=re.exec(mname(l)||'');if(!m)return;const t=new Date(l.net).getTime();if(isNaN(t))return;const g=m[1],k=+m[2];
    const r=G[g]||(G[g]={g,P:[],U:[],pads:{},max:0});(fut?r.U:r.P).push({l,t,k});if(!fut){r.pads[l.pad||'¿?']=(r.pads[l.pad||'¿?']||0)+1;if(k>r.max)r.max=k}};
  d.previous.forEach(l=>add(l,false));(d.upcoming||[]).filter(l=>!pid.has(l.id)&&new Date(l.net).getTime()>now-3*H).forEach(l=>add(l,true));
  const rows=Object.values(G);if(!rows.length)return null;
  const med=a=>{if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
  for(const r of rows){r.P.sort((a,b)=>a.t-b.t);r.U.sort((a,b)=>a.t-b.t);r.last=r.P[r.P.length-1]||null;r.first=r.P[0]||null;
    const gaps=[];for(let i=1;i<r.P.length;i++)gaps.push(r.P[i].t-r.P[i-1].t);r.gap=r.P.length>=3?med(gaps):null;
    r.n30=r.P.filter(x=>x.t>now-30*DAY).length;r.next=r.U[0]||null;r.since=r.last?now-r.last.t:null}
  rows.sort((a,b)=>(b.next?1:0)-(a.next?1:0)||(b.last?b.last.t:0)-(a.last?a.last.t:0));
  const nS=rows.reduce((s,r)=>s+r.P.length,0),nU=rows.reduce((s,r)=>s+r.U.length,0),uAll=(d.upcoming||[]).filter(l=>!pid.has(l.id)).length;
  const t0=d.previous.reduce((m,l)=>{const t=new Date(l.net).getTime();return isNaN(t)?m:Math.min(m,t)},Infinity);
  const top30=rows.filter(r=>r.n30).sort((a,b)=>b.n30-a.n30)[0]||null;
  return{rows,nS,nP:d.previous.length,nU,uAll,t0,top30,gen:d.generated}}
function renderStarlink(){const el=$('#starlink');if(!el||!D)return;let I;try{I=slkInfo()}catch(e){I=null}if(!I){el.innerHTML='';return}
  const dd=ms=>{const x=ms/DAY;return x<10?x.toFixed(1).replace('.',','):String(Math.round(x))};
  const apx=l=>/^(SEC|MIN|HOUR)$/i.test(l.net_precision||'')?'':' (fecha aproximada)';
  const pads=r=>Object.entries(r.pads).sort((a,b)=>b[1]-a[1]).map(([p,n])=>`${esc(p)} (${n})`).join(', ');
  const row=r=>`<tr><th scope="row">Grupo ${esc(r.g)}<div class="mut">${r.P.length?pads(r):'sin lanzamientos en los datos'}</div></th><td><b>${r.P.length}</b>${r.max?`<div class="mut">número más alto: ${esc(r.g)}-${r.max}</div>`:''}</td><td>${r.last?`${esc(mname(r.last.l))}<div class="mut">${fmtD(r.last.t)}, hace ${dd(r.since)} días</div>`:'<span class="mut">—</span>'}</td><td>${r.gap!=null?`${dd(r.gap)} días`:'<span class="mut">pocos datos</span>'}</td><td>${r.next?`${esc(mname(r.next.l))}<div class="mut">${fmt(r.next.l.net)}${apx(r.next.l)}${r.U.length>1?` · y ${r.U.length-1} más en la lista`:''}</div>`:'<span class="mut">ninguno en la lista</span>'}</td></tr>`;
  const nx=I.rows.filter(r=>r.next).map(r=>r.next).sort((a,b)=>a.t-b.t)[0];
  el.innerHTML=`<div class="card daily starlink"><div class="kick">Grupos de Starlink</div>
  <div class="stats"><div><b>${I.nS}</b>de los últimos ${I.nP} lanzamientos fueron de Starlink</div><div><b>${I.nU}</b>de los ${I.uAll} próximos de la lista son de Starlink</div>${I.top30?`<div><b>Grupo ${esc(I.top30.g)}</b>el que más ha volado en 30 días (${I.top30.n30})</div>`:''}</div>
  ${nx?`<p>El próximo Starlink es <b>${esc(mname(nx.l))}</b>, ${fmt(nx.l.net)}${apx(nx.l)}${nx.l.pad?`, desde ${esc(nx.l.pad)}`:''}.</p>`:'<p class="mut">Ahora mismo no hay ningún lanzamiento de Starlink en la lista de próximos.</p>'}
  <div class="tscroll"><table><caption class="sr">Lanzamientos de Starlink por grupo</caption><thead><tr><th scope="col">Grupo</th><th scope="col">Lanzamientos</th><th scope="col">Último</th><th scope="col">Entre lanzamientos (mediana)</th><th scope="col">Siguiente</th></tr></thead><tbody>${I.rows.map(row).join('')}</tbody></table></div>
  <div class="mut" style="margin-top:6px">Grupo y número tomados del nombre de cada misión en Launch Library 2 (por ejemplo, «Starlink Group 17-54» es el grupo 17), en los últimos ${I.nP} lanzamientos de SpaceX de los datos (desde el ${fmtD(I.t0)}) y en la lista de próximos. Entre paréntesis, los lanzamientos de cada grupo desde cada plataforma. Actualizados ${fmt(I.gen)}.</div></div>`}

// ---------- Precisión de las fechas de la lista ----------
// Precisión de la fecha prevista (net_precision) y estado (Go, TBC, TBD) de cada próximo lanzamiento según Launch Library 2,
// con cuánto hace que la fuente actualizó cada uno (campo updated). Apuesta semanal «¿tendrá hora exacta antes del domingo
// el siguiente sin fecha fija?»: se guarda en sxp_prec ({cur,hist}) y se resuelve sola con el historial real de la fecha
// prevista (data.nethist, que guarda también los cambios de precisión) en cuanto los datos son de después del domingo.
const PREC_PTS={si:25,no:10};
const precExact=p=>/^(SEC|MIN)$/i.test(p||'');
const precG=p=>{const c=String(p||'').toUpperCase();if(c==='SEC'||c==='MIN')return{k:'min',o:0,t:'Al minuto'};if(c==='HR'||c==='HOUR')return{k:'hora',o:1,t:'A la hora'};
  if(c==='D'||c==='DAY')return{k:'dia',o:2,t:'Día'};if(c==='W'||c==='WEEK')return{k:'sem',o:3,t:'Semana'};if(c==='M'||c==='MONTH')return{k:'mes',o:4,t:'Mes'};
  if(/^Q/.test(c))return{k:'tri',o:5,t:'Trimestre'};if(/^H\d/.test(c))return{k:'semes',o:6,t:'Semestre'};if(c==='Y'||c==='FY'||c==='YEAR')return{k:'anio',o:7,t:'Solo año'};
  return{k:'otro',o:8,t:c||'Sin indicar'}};
const PREC_MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function precDate(l){const t=new Date(l.net);if(isNaN(t))return '—';const c=String(l.net_precision||'').toUpperCase(),y=t.getUTCFullYear(),g=precG(c);
  if(g.k==='min')return fmt(l.net);if(g.k==='hora')return fmt(l.net)+' (hora aprox.)';if(g.k==='dia')return t.toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  if(g.k==='sem')return 'semana del '+t.toLocaleDateString('es-ES',{day:'numeric',month:'short',timeZone:'UTC'});if(g.k==='mes')return PREC_MES[t.getUTCMonth()]+' de '+y;
  if(g.k==='tri'){const q=/^Q([1-4])/.exec(c);return `${q?q[1]:Math.floor(t.getUTCMonth()/3)+1}.º trimestre de ${y}`}
  if(g.k==='semes'){const h=/^H([12])/.exec(c);return `${h?h[1]:t.getUTCMonth()<6?1:2}.º semestre de ${y}`}if(g.k==='anio')return 'en '+y;return fmtD(l.net)+' (aprox.)'}
const PREC_ST={Go:'Go: confirmado',TBC:'TBC: por confirmar',TBD:'TBD: por determinar'};
function precDeadline(now){const d=new Date(now),day=d.getDay(),add=day===0?7:7-day;let e=new Date(d.getFullYear(),d.getMonth(),d.getDate()+add+1).getTime()-1000;
  if(e-now<2*DAY)e=new Date(d.getFullYear(),d.getMonth(),d.getDate()+add+8).getTime()-1000;return e}
function precInfo(){const d=rlD();if(!d||!Array.isArray(d.upcoming))return null;const now=Date.now(),pid=new Set((d.previous||[]).map(l=>l.id));
  const U=d.upcoming.filter(l=>!pid.has(l.id)&&!isNaN(new Date(l.net))).map(l=>({l,g:precG(l.net_precision),upd:l.updated?now-new Date(l.updated).getTime():null}))
    .sort((a,b)=>new Date(a.l.net)-new Date(b.l.net)||a.g.o-b.g.o);if(!U.length)return null;
  const byG={},byS={};for(const x of U){(byG[x.g.k]=byG[x.g.k]||{t:x.g.t,o:x.g.o,n:0}).n++;const s=x.l.status||'—';byS[s]=(byS[s]||0)+1}
  const groups=Object.values(byG).sort((a,b)=>a.o-b.o),exact=U.filter(x=>x.g.k==='min').length;
  const target=U.find(x=>!precExact(x.l.net_precision))||null,stale=U.filter(x=>x.upd!=null).sort((a,b)=>b.upd-a.upd)[0]||null;
  const fresh=U.filter(x=>x.upd!=null&&x.upd<DAY).length;
  return{U,groups,byS,exact,target,stale,fresh,dl:precDeadline(now),gen:d.generated}}
function precState(){const s=LS.get('prec',{cur:null,hist:[]});s.hist=s.hist||[];return s}
function resolvePrec(){const d=rlD();if(!d||!d.nethist)return;const s=precState(),b=s.cur;if(!b)return;if(!(new Date(d.generated).getTime()>b.dl))return;
  const h=d.nethist[b.id],prev=(d.previous||[]).find(l=>l.id===b.id),inUp=(d.upcoming||[]).some(l=>l.id===b.id);
  let got=null;
  if(h)for(const x of h){const t=new Date(x[0]).getTime();if(t>b.at-H&&t<=b.dl&&precExact(x[2])){got=x;break}}
  if(!got&&prev&&new Date(prev.net).getTime()<=b.dl)got=[prev.net,prev.net,'SEC'];
  if(!got&&!h&&!prev&&!inUp){s.hist.unshift({...b,res:null,ok:null,won:0,resAt:Date.now(),gone:true});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('prec',s);
    aviso(`Apuesta de precisión anulada: ${b.name} ya no aparece en la fuente.`);return}
  const yes=!!got,ok=(b.pick==='Sí')===yes,won=ok?(b.pick==='Sí'?PREC_PTS.si:PREC_PTS.no):0;
  s.hist.unshift({...b,res:yes,at2:got?got[0]:null,net2:got?got[1]:null,ok,won,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('prec',s);
  if(won)addPts('prec',won);aviso(`Apuesta de precisión resuelta: ${b.name} ${yes?'ya tiene hora exacta':'sigue sin hora exacta'}. ${won?`+${won} puntos.`:'Esta vez no.'}`)}
function precBetHTML(I){const s=precState(),b=s.cur,t=I.target;
  let h=`<h3 id="prec-q">¿Tendrá hora exacta antes del domingo ${fmtD(b?b.dl:I.dl)} el siguiente lanzamiento sin fecha fija?</h3>`;
  if(b)h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Dijiste <b>${b.pick}</b> para ${esc(b.name)} (entonces: ${esc(b.d0)}) · se resuelve sola con los datos de después del domingo ${fmtD(b.dl)} a las 23:59.</p>`;
  else if(t)h+=`<p class="mut">Es <b>${esc(mname(t.l))}</b>, que la fuente da para ${esc(precDate(t.l))} (${esc(PREC_ST[t.l.status]||t.l.status_name||t.l.status||'')}). Cuenta si antes del domingo ${fmtD(I.dl)} a las 23:59 Launch Library 2 le pone hora al minuto o al segundo, o si despega antes. «Sí» da ${PREC_PTS.si} puntos y «No», ${PREC_PTS.no}.</p><div class="opts" role="group" aria-labelledby="prec-q"><button type="button" data-prec="Sí">Sí, tendrá hora (+${PREC_PTS.si})</button><button type="button" data-prec="No">No, seguirá sin hora (+${PREC_PTS.no})</button></div>`;
  else h+='<p class="mut">Ahora todos los lanzamientos de la lista tienen hora exacta, así que no hay apuesta.</p>';
  const past=s.hist.slice(0,4).map(x=>x.gone?`<div class="mut">${esc(x.name)}: anulada, la fuente lo quitó de la lista</div>`:`<div class="mut">${ic(x.ok)} ${esc(x.name)} (domingo ${fmtD(x.dl)}): dijiste ${x.pick} · ${x.res?`tuvo hora${x.net2?` (${fmt(x.net2)})`:''}`:'siguió sin hora'} · +${x.won} puntos</div>`).join('');
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
function renderPrecision(){const el=$('#precision');if(!el||!D)return;let I;try{I=precInfo()}catch(e){I=null}if(!I){el.innerHTML='';return}
  const ago=ms=>{if(ms==null)return '—';if(ms<H)return `hace ${Math.max(1,Math.round(ms/6e4))} min`;if(ms<DAY)return `hace ${Math.round(ms/H)} h`;const n=Math.round(ms/DAY);return `hace ${n} ${n===1?'día':'días'}`};
  const st=Object.entries(I.byS).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${n} ${esc(k)}`).join(', ');
  const row=x=>`<tr><th scope="row">${esc(mname(x.l))}<div class="mut">${esc(x.l.rocket||'')}</div></th><td>${esc(precDate(x.l))}</td><td>${esc(x.g.t)}<div class="mut">${esc(x.l.net_precision||'')}</div></td><td>${esc(x.l.status||'—')}</td><td>${ago(x.upd)}</td></tr>`;
  el.innerHTML=`<div class="card daily precision"><div class="kick">Precisión de las fechas</div>
  <div class="stats"><div><b>${I.exact}</b>de ${I.U.length} próximos con hora al minuto</div>${I.groups.filter(g=>g.o>0).map(g=>`<div><b>${g.n}</b>${g.t==='Solo año'?'solo con el año':'con precisión de '+g.t.toLowerCase()}</div>`).join('')}<div><b>${I.fresh}</b>actualizados por la fuente en las últimas 24 h</div></div>
  <p class="mut">Estados en la lista: ${st}. Go es confirmado, TBC por confirmar y TBD por determinar.${I.stale?` El que lleva más tiempo sin tocar es ${esc(mname(I.stale.l))} (${ago(I.stale.upd)}).`:''}</p>
  ${precBetHTML(I)}
  <details style="margin-top:8px"><summary>Ver los ${I.U.length} próximos lanzamientos</summary><div class="tscroll"><table><caption class="sr">Precisión de la fecha, estado y última actualización de cada próximo lanzamiento</caption><thead><tr><th scope="col">Misión</th><th scope="col">Fecha prevista</th><th scope="col">Precisión</th><th scope="col">Estado</th><th scope="col">Actualizado</th></tr></thead><tbody>${I.U.map(row).join('')}</tbody></table></div></details>
  <div class="mut" style="margin-top:6px">Precisión de la fecha (net_precision), estado y fecha de la última actualización de cada lanzamiento según Launch Library 2. Actualizados ${fmt(I.gen)}.</div></div>`}
function bindPrecision(){const el=$('#next');if(!el||el._prec)return;el._prec=true;el.addEventListener('click',e=>{const b=e.target.closest('button[data-prec]');if(!b)return;
  const I=precInfo(),s=precState();if(!I||s.cur||!I.target){renderPrecision();return}const t=I.target.l;
  s.cur={id:t.id,name:mname(t),d0:precDate(t),p0:t.net_precision||'',pick:b.dataset.prec,at:Date.now(),dl:I.dl};LS.set('prec',s);
  aviso(`Apuesta guardada: ${b.dataset.prec==='Sí'?'tendrá':'no tendrá'} hora exacta antes del domingo (${mname(t)}).`);completeDaily('prec');renderPrecision();
  const q=$('#prec-q');try{q&&(q.tabIndex=-1,q.focus())}catch(e){}})}

// ---------- Retransmisiones ----------
// Qué lanzamientos recientes y próximos tienen enlace al directo en Launch Library 2 (vidURLs) y con cuánta antelación
// apareció. build_data.py guarda en data.vidseen {id:[primera vez visto, primera vez con enlace]} (reconstruido con el
// historial de data.json desde el 18 oct). Si el lanzamiento ya llegó con enlace la primera vez que se vio, la antelación
// es «al menos» esa; si se vio antes sin enlace, es exacta (con la precisión de la actualización horaria).
function vidHost(u){try{const h=new URL(u).hostname.replace(/^www\./,'');return /youtu/.test(h)?'YouTube':/^(x|twitter)\.com$/.test(h)?'X':h}catch(e){return null}}
function dirInfo(){const d=rlD();if(!d||!Array.isArray(d.upcoming)||!Array.isArray(d.previous))return null;const V=d.vidseen||{},now=Date.now(),pid=new Set(d.previous.map(l=>l.id));
  const mk=(l,up)=>{const t=new Date(l.net).getTime(),v=V[l.id]||null,seen=v&&v[1]?new Date(v[1]).getTime():null,first=v?new Date(v[0]).getTime():null;
    const lead=seen!=null&&seen<t?t-seen:null,exact=lead!=null&&first!=null&&seen>first;return{l,t,up,host:l.video?vidHost(l.video):null,lead,exact}};
  const U=d.upcoming.filter(l=>!pid.has(l.id)&&!isNaN(new Date(l.net))).map(l=>mk(l,true)).sort((a,b)=>a.t-b.t);
  const P=d.previous.filter(l=>!isNaN(new Date(l.net))).map(l=>mk(l,false)).sort((a,b)=>b.t-a.t);if(!U.length&&!P.length)return null;
  const hosts={};for(const x of P)if(x.host)hosts[x.host]=(hosts[x.host]||0)+1;
  const hostsU={};for(const x of U)if(x.host)hostsU[x.host]=(hostsU[x.host]||0)+1;
  const wU=U.filter(x=>x.l.video),noU=U.filter(x=>!x.l.video),nextNo=noU[0]||null,lastWith=wU[wU.length-1]||null;
  const L=U.concat(P).filter(x=>x.lead!=null),ex=L.filter(x=>x.exact),lb=L.filter(x=>!x.exact&&x.up);
  const maxLb=lb.sort((a,b)=>b.lead-a.lead)[0]||null;
  return{U,P,hosts,hostsU,wU,noU,nextNo,lastWith,ex,maxLb,now,gen:d.generated,t0:Object.values(V).reduce((m,v)=>{const t=new Date(v[0]).getTime();return isNaN(t)?m:Math.min(m,t)},Infinity)}}
function renderDirectos(){const el=$('#directos');if(!el||!D)return;let I;try{I=dirInfo()}catch(e){I=null}if(!I){el.innerHTML='';return}
  const dd=ms=>{const x=ms/DAY;return x<10?x.toFixed(1).replace('.',','):String(Math.round(x))};
  const lead=x=>x.lead==null?'<span class="mut">—</span>':`${x.exact?'':'al menos '}${dd(x.lead)} días antes`;
  const link=x=>x.l.video&&/^https:\/\//.test(x.l.video)?`<a href="${esc(x.l.video)}" target="_blank" rel="noopener">${esc(x.host||'enlace')}</a>`:'<span class="mut">sin enlace</span>';
  const row=x=>`<tr><th scope="row">${esc(mname(x.l))}<div class="mut">${x.up?(x.l.net_precision&&!/^(SEC|MIN|HOUR)$/i.test(x.l.net_precision)?'fecha aproximada: ':'')+fmt(x.l.net):fmtD(x.l.net)}</div></th><td>${link(x)}</td><td>${lead(x)}</td></tr>`;
  const hs=Object.entries(I.hosts).sort((a,b)=>b[1]-a[1]).map(([h,n])=>`${n} en ${esc(h)}`).join(' y ');
  const hsU=Object.entries(I.hostsU).sort((a,b)=>b[1]-a[1]).map(([h,n])=>`${n} en ${esc(h)}`).join(' y ');
  const nWithP=I.P.filter(x=>x.l.video).length,nx=I.nextNo;
  el.innerHTML=`<div class="card daily directos"><div class="kick">Retransmisiones</div>
  <div class="stats"><div><b>${nWithP}</b>de los últimos ${I.P.length} lanzamientos tienen enlace al directo</div><div><b>${I.wU.length}</b>de los ${I.U.length} próximos ya tienen enlace</div>${I.maxLb?`<div><b>${dd(I.maxLb.lead)} días</b>de antelación como mínimo: ${esc(mname(I.maxLb.l))}</div>`:''}</div>
  <p>${hs?`Los directos de los lanzamientos recientes están ${hs}${hsU?`, y los de los próximos que ya tienen enlace, ${hsU}`:''}. `:''}${I.lastWith?`El más lejano que ya tiene enlace es <b>${esc(mname(I.lastWith.l))}</b> (${fmt(I.lastWith.l.net)}).`:'Ningún próximo lanzamiento tiene todavía enlace al directo.'}${nx?` El siguiente sin enlace es <b>${esc(mname(nx.l))}</b>, ${nx.l.net_precision&&!/^(SEC|MIN|HOUR)$/i.test(nx.l.net_precision)?'con fecha aproximada ':''}${fmt(nx.l.net)}, dentro de ${dd(Math.max(0,nx.t-I.now))} días.`:''}</p>
  ${I.ex.length?`<p class="mut">Visto aparecer el enlace en los datos: ${I.ex.slice(0,5).map(x=>`${esc(mname(x.l))}, ${dd(x.lead)} días antes`).join('; ')}.</p>`:'<p class="mut">Desde que se guardan los datos, todos los lanzamientos han entrado en la lista ya con su enlace o siguen sin él, así que de momento solo se sabe la antelación mínima. En cuanto a uno de la lista le aparezca el enlace en una actualización, aquí saldrá la antelación exacta.</p>'}
  ${dirBetHTML(I)}
  <details style="margin-top:8px"><summary>Ver próximos y recientes</summary><div class="tscroll"><table><caption class="sr">Enlace al directo de cada lanzamiento y con cuánta antelación apareció</caption><thead><tr><th scope="col">Misión</th><th scope="col">Directo</th><th scope="col">Enlace visto</th></tr></thead><tbody>${I.U.map(row).join('')}<tr><th scope="rowgroup" colspan="3" class="mut">Recientes</th></tr>${I.P.slice(0,15).map(row).join('')}</tbody></table></div></details>
  <div class="mut" style="margin-top:6px">Enlace al directo (vidURLs) de cada lanzamiento según Launch Library 2. La antelación se mide entre la primera actualización de datos en que aparece el enlace ${isFinite(I.t0)?` (los datos guardados empiezan el ${fmtD(I.t0)})`:''} y la hora del lanzamiento; «al menos» significa que el lanzamiento ya llegó con enlace la primera vez que se vio. Actualizados ${fmt(I.gen)}.</div></div>`}

// ---------- Apuesta de retransmisión «¿tendrá enlace al directo 3 días antes del despegue?» ----------
// Se apuesta por el siguiente lanzamiento sin enlace al directo cuya fecha de corte (3 días antes de la hora prevista) quede a
// más de 12 h. Se guarda en sxp_dir y se resuelve sola con data.vidseen: gana «Sí» si el enlace aparece en los datos antes de
// esa hora de corte (calculada con la hora prevista más reciente de la fuente) y «No» si llega el corte sin enlace.
const DIR_PTS={si:15,no:10},DIR_CUT=3*DAY,DIR_MARGIN=12*H;
function dirState(){const s=LS.get('dir',{cur:null,hist:[]});s.hist=s.hist||[];return s}
function dirTarget(I){return I.noU.find(x=>x.t-DIR_CUT-DIR_MARGIN>I.now)||null}
function resolveDir(){const d=rlD();if(!d||!Array.isArray(d.upcoming))return;const s=dirState(),b=s.cur;if(!b)return;
  const gen=new Date(d.generated).getTime();if(isNaN(gen)||gen<b.at)return;
  const l=d.upcoming.find(x=>x.id===b.id)||(d.previous||[]).find(x=>x.id===b.id);
  if(!l){s.hist.unshift({...b,gone:true,ok:null,won:0,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('dir',s);
    aviso(`Apuesta de retransmisión anulada: ${b.name} ya no aparece en la fuente.`);return}
  const t=new Date(l.net).getTime();if(isNaN(t))return;const cut=t-DIR_CUT,v=(d.vidseen||{})[b.id],seen=v&&v[1]?new Date(v[1]).getTime():null;
  let yes=null;if(seen!=null&&seen<=cut)yes=true;else if(gen>=cut)yes=false;if(yes===null)return;
  const ok=(b.pick==='Sí')===yes,won=ok?(b.pick==='Sí'?DIR_PTS.si:DIR_PTS.no):0;
  s.hist.unshift({...b,res:yes,seen:seen?new Date(seen).toISOString():null,net2:l.net,ok,won,resAt:Date.now()});s.hist=s.hist.slice(0,20);s.cur=null;LS.set('dir',s);
  if(won)addPts('dir',won);aviso(`Apuesta de retransmisión resuelta: ${b.name} ${yes?'tuvo enlace al directo a tiempo':'no tuvo enlace 3 días antes'}. ${won?`+${won} puntos.`:'Esta vez no.'}`)}
function dirBetHTML(I){const s=dirState(),b=s.cur,t=dirTarget(I);
  let h=`<h4 id="dir-q">¿Tendrá enlace al directo 3 días antes del despegue?</h4>`;
  if(b){const l=I.U.find(x=>x.l.id===b.id);h+=`<p><span role="img" aria-label="Pendiente">⏳</span> Dijiste <b>${b.pick}</b> para ${esc(b.name)}${l?` · se resuelve sola cuando aparezca el enlace o el ${fmt(new Date(l.t-DIR_CUT).toISOString())}, 3 días antes de la hora que da ahora la fuente`:' · se resuelve sola con la próxima actualización'}.</p>`}
  else if(t)h+=`<p class="mut">Es <b>${esc(mname(t.l))}</b>, previsto ${t.l.net_precision&&!/^(SEC|MIN|HOUR)$/i.test(t.l.net_precision)?'con fecha aproximada ':''}para ${esc(fmt(t.l.net))} y todavía sin enlace. Gana «Sí» si Launch Library 2 le pone enlace al directo antes de 3 días de la hora prevista (si la fecha cambia, cuenta la nueva) y «No» si llega ese momento sin enlace. Se apuesta hasta 12 h antes del corte. «Sí» da ${DIR_PTS.si} puntos y «No», ${DIR_PTS.no}.</p><div class="opts" role="group" aria-labelledby="dir-q"><button type="button" data-dir="Sí">Sí, tendrá enlace (+${DIR_PTS.si})</button><button type="button" data-dir="No">No, seguirá sin enlace (+${DIR_PTS.no})</button></div>`;
  else h+='<p class="mut">Ahora no hay ningún lanzamiento sin enlace con más de 3 días y medio por delante, así que no hay apuesta.</p>';
  const past=s.hist.slice(0,4).map(x=>x.gone?`<div class="mut">${esc(x.name)}: anulada, la fuente lo quitó de la lista</div>`:`<div class="mut">${ic(x.ok)} ${esc(x.name)}: dijiste ${x.pick} · ${x.res?`tuvo enlace${x.seen?` (visto el ${fmt(x.seen)})`:''}`:'no tuvo enlace 3 días antes'} · +${x.won} puntos</div>`).join('');
  return h+(past?`<div style="margin-top:8px">${past}</div>`:'')}
function bindDirectos(){const el=$('#next');if(!el||el._dir)return;el._dir=true;el.addEventListener('click',e=>{const bt=e.target.closest('button[data-dir]');if(!bt)return;
  let I;try{I=dirInfo()}catch(err){I=null}const s=dirState();const t=I&&dirTarget(I);if(!t||s.cur){renderDirectos();return}
  s.cur={id:t.l.id,name:mname(t.l),net0:t.l.net,pick:bt.dataset.dir,at:Date.now()};LS.set('dir',s);
  aviso(`Apuesta guardada: ${mname(t.l)} ${bt.dataset.dir==='Sí'?'tendrá':'no tendrá'} enlace al directo 3 días antes.`);completeDaily('dir');renderDirectos();
  const q=$('#dir-q');try{q&&(q.tabIndex=-1,q.focus())}catch(err){}})}

// ---------- Cambios de estado ----------
// Cuándo pasa cada lanzamiento de TBD (por determinar) a TBC (por confirmar) y a Go (confirmado) según Launch Library 2.
// build_data.py guarda en data.sthist {id:[[hora de los datos, estado], ...]} cada vez que cambia el estado (reconstruido con
// el historial de data.json desde el 18 oct). Un paso es «visto» si en la actualización anterior tenía el estado de antes;
// si el lanzamiento ya llegó con ese estado la primera vez que se vio, solo se sabe que lo tenía «al menos» desde entonces.
const EST_PRE={TBD:0,TBC:1},EST_TXT={Go:'Go (confirmado)',TBC:'TBC (por confirmar)',TBD:'TBD (por determinar)',Hold:'Hold (en espera)','In Flight':'en vuelo',Success:'éxito',Failure:'fallo','Partial Failure':'fallo parcial'};
function estInfo(){const d=rlD();if(!d||!Array.isArray(d.upcoming)||!d.sthist)return null;const S=d.sthist,now=Date.now(),pid=new Set((d.previous||[]).map(l=>l.id));
  const all=d.upcoming.filter(l=>!pid.has(l.id)).map(l=>({l,up:true})).concat((d.previous||[]).map(l=>({l,up:false})));
  const steps=[],U=[];let t0=Infinity;
  for(const {l,up} of all){const h=S[l.id];if(!Array.isArray(h)||!h.length)continue;const t=new Date(l.net).getTime();if(isNaN(t))continue;
    const f=new Date(h[0][0]).getTime();if(!isNaN(f))t0=Math.min(t0,f);
    for(let i=1;i<h.length;i++){const a=h[i-1][1],b=h[i][1],at=new Date(h[i][0]).getTime();if(isNaN(at))continue;
      if((b==='Go'&&a in EST_PRE)||(b==='TBC'&&a==='TBD'))steps.push({l,up,from:a,to:b,at,lead:t-at})}
    if(up){const last=h[h.length-1],since=new Date(last[0]).getTime();U.push({l,t,st:l.status||last[1],since,first:h.length===1,chain:h.map(x=>x[1])})}}
  U.sort((a,b)=>a.t-b.t);steps.sort((a,b)=>b.at-a.at);if(!U.length&&!steps.length)return null;
  const med=a=>{if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
  const pos=x=>x.lead>0,goL=steps.filter(x=>x.to==='Go'&&pos(x)).map(x=>x.lead),tbcL=steps.filter(x=>x.to==='TBC'&&pos(x)).map(x=>x.lead);
  const byS={};for(const x of U)byS[x.st]=(byS[x.st]||0)+1;
  const week=steps.filter(x=>now-x.at<7*DAY).length,nextNoGo=U.find(x=>x.st!=='Go')||null,lastGo=U.filter(x=>x.st==='Go').pop()||null;
  return{U,steps,byS,goMed:med(goL),goN:goL.length,tbcMed:med(tbcL),tbcN:tbcL.length,week,nextNoGo,lastGo,now,t0,gen:d.generated}}
function renderEstados(){const el=$('#estados');if(!el||!D)return;let I;try{I=estInfo()}catch(e){I=null}if(!I){el.innerHTML='';return}
  const dd=ms=>{const x=Math.abs(ms)/DAY;return x<10?x.toFixed(1).replace('.',','):String(Math.round(x))};
  const ld=x=>x.lead>0?`${dd(x.lead)} días antes del despegue`:'ya pasada la hora prevista';
  const aprox=l=>l.net_precision&&!/^(SEC|MIN|HOUR)$/i.test(l.net_precision)?'fecha aproximada: ':'';
  const st=['Go','TBC','TBD','Hold'].filter(k=>I.byS[k]).concat(Object.keys(I.byS).filter(k=>!['Go','TBC','TBD','Hold'].includes(k))).map(k=>`<div><b>${I.byS[k]}</b>${esc(EST_TXT[k]||k)}</div>`).join('');
  const since=x=>x.first?`al menos desde el ${fmtD(x.since)}`:`desde el ${fmt(new Date(x.since).toISOString())}`;
  const row=x=>`<tr><th scope="row">${esc(mname(x.l))}<div class="mut">${aprox(x.l)}${fmtD(x.l.net)}</div></th><td>${esc(x.st)}</td><td>${since(x)}</td><td>${esc(x.chain.join(' → '))}</td></tr>`;
  const medTxt=(m,n,what)=>m==null?`Todavía no se ha visto a ningún lanzamiento pasar a ${what} antes del despegue.`:`Mediana para pasar a ${what}: <b>${dd(m)} días</b> antes del despegue (${n} ${n===1?'caso visto':'casos vistos'}).`;
  const nx=I.nextNoGo;
  el.innerHTML=`<div class="card daily estados"><div class="kick">Cambios de estado</div>
  <div class="stats">${st}<div><b>${I.week}</b>${I.week===1?'cambio':'cambios'} a TBC o Go en los últimos 7 días</div></div>
  <p>${medTxt(I.goMed,I.goN,'Go')} ${medTxt(I.tbcMed,I.tbcN,'TBC')}${nx?` El siguiente lanzamiento que aún no es Go es <b>${esc(mname(nx.l))}</b> (${esc(nx.st)}, ${aprox(nx.l)}${fmt(nx.l.net)}, dentro de ${dd(Math.max(0,nx.t-I.now))} días).`:' Todos los próximos lanzamientos de la lista ya son Go.'}${I.lastGo?` El más lejano que ya es Go es ${esc(mname(I.lastGo.l))} (${fmtD(I.lastGo.l.net)}).`:''}</p>
  ${I.steps.length?`<p class="mut">Últimos cambios vistos: ${I.steps.slice(0,6).map(x=>`${esc(mname(x.l))}, de ${esc(x.from)} a ${esc(x.to)} el ${fmtD(x.at)} (${ld(x)})`).join('; ')}.</p>`:'<p class="mut">Desde que se guardan los datos, ningún lanzamiento ha cambiado de TBD a TBC o a Go: todos llegaron a la lista con el estado que tienen. En cuanto alguno cambie en una actualización, aquí saldrá cuándo y con cuántos días de antelación.</p>'}
  ${I.U.length?`<details style="margin-top:8px"><summary>Ver los ${I.U.length} próximos lanzamientos</summary><div class="tscroll"><table><caption class="sr">Estado actual de cada próximo lanzamiento, desde cuándo lo tiene y estados por los que ha pasado</caption><thead><tr><th scope="col">Misión</th><th scope="col">Estado</th><th scope="col">Desde</th><th scope="col">Historial</th></tr></thead><tbody>${I.U.map(row).join('')}</tbody></table></div></details>`:''}
  <div class="mut" style="margin-top:6px">Estado de cada lanzamiento según Launch Library 2, guardado en cada actualización horaria${isFinite(I.t0)?` desde el ${fmtD(I.t0)}`:''}. Los días antes del despegue se cuentan con la hora prevista que da ahora la fuente, que en los próximos todavía puede cambiar. «Al menos desde» significa que ya tenía ese estado la primera vez que se vio. Actualizados ${fmt(I.gen)}.</div></div>`}
