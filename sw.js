// SpaceX Play: service worker para instalar la web como app y abrirla sin conexión.
// La web y los datos van primero a la red (siempre lo último) y, si no hay conexión, salen de la copia guardada.
const V='sxp-v32',SHELL=['./','index.html','app.js','style.css','data.json','i18n/desc_es.json','i18n/fail_es.json','manifest.webmanifest','og.png','icons/icon-192.png','icons/icon-512.png','icons/favicon-32.png'];
const CDN=/^https:\/\/(unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('sxp-')&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin===location.origin){
    // Copia guardada sin la parte ?… (data.json?123 y data.json son lo mismo)
    const key=r.mode==='navigate'?new Request('index.html'):new Request(u.origin+u.pathname);
    e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(key,cp))}return res})
      .catch(()=>caches.match(key).then(m=>m||caches.match(r,{ignoreSearch:true})).then(m=>m||(r.mode==='navigate'?caches.match('./'):undefined)).then(m=>m||Response.error())));
  }else if(CDN.test(r.url)){
    // Leaflet y tipografías: de la copia guardada y se refresca en segundo plano
    e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>{const n=fetch(r).then(res=>{if(res.ok||res.type==='opaque')c.put(r,res.clone());return res}).catch(()=>m||Response.error());return m||n})));
  }});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=(e.notification.data&&e.notification.data.url)||'./';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    if(url.startsWith(self.registration.scope)){const w=cs.find(c=>c.url.startsWith(self.registration.scope));if(w)return w.focus().then(()=>w.navigate?w.navigate(url):w)}
    return self.clients.openWindow(url)}))});
