#!/usr/bin/env python3
"""Descarga lanzamientos de SpaceX de Launch Library 2 y genera data.json reducido."""
import json, sys, urllib.request, datetime, os, re
BASE="https://ll.thespacedevs.com/2.3.0/launches/{}/?lsp__name=SpaceX&limit={}&mode=detailed"
def get(kind, n, cache):
    if os.environ.get("USE_CACHE") and os.path.exists(cache):
        return json.load(open(cache))
    req=urllib.request.Request(BASE.format(kind,n),headers={"User-Agent":"spacex-play"})
    d=json.load(urllib.request.urlopen(req,timeout=300))
    json.dump(d,open(cache,"w")); return d
def cut(t,n=400):
    return t if len(t)<=n else t[:n].rsplit(" ",1)[0].rstrip(",.;:")+"…"
def photo(r):
    """Solo fotos con licencia clara (nombre y enlace); devuelve url, autor y licencia."""
    i=r.get("image") or {}; lic=i.get("license") or {}
    if not i.get("thumbnail_url") or not lic.get("link") or (lic.get("name") or "Unknown")=="Unknown":
        return {"img":None}
    return {"img":i["thumbnail_url"],"img_credit":i.get("credit") or "Autor no indicado",
      "img_lic":lic.get("name"),"img_lic_url":lic.get("link")}
def dur(t):
    """Duración ISO 8601 relativa al despegue (-PT38M, PT1M7S, P0D) en segundos."""
    m=re.fullmatch(r"(-)?P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?",t or "")
    if not m: return None
    v=int(m[2] or 0)*86400+int(m[3] or 0)*3600+int(m[4] or 0)*60+float(m[5] or 0)
    return round(-v if m[1] else v)
TLT={}
LZ={}
def lzone(loc,ld):
    """Zonas de aterrizaje reales (Launch Library 2): coordenadas solo si las da (las barcazas se mueven)."""
    a=loc.get("abbrev") or loc.get("name")
    if not a or (loc.get("name") or "Unknown")=="Unknown": return
    f=lambda v: float(v) if v not in (None,"") else None
    LZ[a]={"name":loc.get("name"),"lat":f(loc.get("latitude")),"lon":f(loc.get("longitude")),
      "loc":(loc.get("location") or {}).get("name"),"type":(ld.get("type") or {}).get("abbrev"),
      "ok":loc.get("successful_landings"),"att":loc.get("attempted_landings"),"active":loc.get("active")}
def timeline(r):
    """Pasos reales de la cuenta atrás y del vuelo (Launch Library 2), de T-1 h a T+20 min: [id de tipo, segundos]."""
    out=[]
    for e in r.get("timeline") or []:
        ty=e.get("type") or {}; t=dur(e.get("relative_time"))
        if ty.get("id") is None or t is None or not -3600<=t<=1200: continue
        TLT[str(ty["id"])]=[ty.get("abbrev") or "",ty.get("description") or ""]
        out.append([ty["id"],t])
    return sorted(out,key=lambda x:x[1])
def slim(r):
    m=r.get("mission") or {}; ro=r.get("rocket") or {}; p=r.get("pad") or {}
    st=[]
    for s in ro.get("launcher_stage") or []:
        L=s.get("launcher") or {}; ld=s.get("landing") or {}; loc=ld.get("landing_location") or {}
        if loc: lzone(loc,ld)
        st.append({"serial":L.get("serial_number"),"flight":s.get("launcher_flight_number"),
          "reused":s.get("reused"),"type":s.get("type"),"turnaround":s.get("turn_around_time"),
          "land_attempt":ld.get("attempt"),"land_success":ld.get("success"),
          "land_loc":loc.get("abbrev") or loc.get("name"),"land_loc_name":loc.get("name"),"land_type":(ld.get("type") or {}).get("abbrev"),
          "booster_flights":L.get("flights"),"booster_landings":L.get("successful_landings"),
          "first":L.get("first_launch_date"),"lastd":L.get("last_launch_date"),"bstatus":(L.get("status") or {}).get("name")})
    vids=r.get("vid_urls") or []
    return {"id":r["id"],"name":r.get("name"),"mission":m.get("name"),"mtype":m.get("type"),
      "desc":cut(m.get("description") or ""),"orbit":(m.get("orbit") or {}).get("abbrev"),
      "orbit_name":(m.get("orbit") or {}).get("name"),
      "cust":[a.get("name") for a in m.get("agencies") or [] if a.get("name")],
      "info":next((u.get("url") for u in sorted(r.get("info_urls") or [],key=lambda u:-(u.get("priority") or 0)) if u.get("url")),None),
      "status":(r.get("status") or {}).get("abbrev"),"status_name":(r.get("status") or {}).get("name"),
      "net":r.get("net"),"net_precision":(r.get("net_precision") or {}).get("abbrev"),
      "ws":r.get("window_start"),"we":r.get("window_end"),"prob":r.get("probability"),
      "wx":[w.strip() for w in (r.get("weather_concerns") or "").split(",") if w.strip()],
      "fail":r.get("failreason") or "","rocket":(ro.get("configuration") or {}).get("name"),
      "pad":p.get("name"),"loc":(p.get("location") or {}).get("name"),
      "lat":float(p["latitude"]) if p.get("latitude") else None,"lon":float(p["longitude"]) if p.get("longitude") else None,
      "stages":st,**photo(r),"tl":timeline(r),
      "video":vids[0]["url"] if vids else None,"updated":r.get("last_updated"),
      "n":r.get("agency_launch_attempt_count"),"ny":r.get("agency_launch_attempt_count_year"),"pn":r.get("pad_launch_attempt_count")}
def jobs():
    """Ofertas de trabajo reales de SpaceX (tablón público de Greenhouse). Si falla, se conservan las últimas."""
    try:
        req=urllib.request.Request("https://boards-api.greenhouse.io/v1/boards/spacex/jobs",headers={"User-Agent":"spacex-play"})
        J=json.load(urllib.request.urlopen(req,timeout=120))["jobs"]
        if not J: raise ValueError("sin ofertas")
        loc={}
        for j in J:
            n=(j.get("location") or {}).get("name") or ""
            if n: loc[n]=loc.get(n,0)+1
        intern=[j for j in J if re.search(r"\bintern(ship)?s?\b",j.get("title") or "",re.I)]
        rec=sorted([j for j in J if j.get("first_published") and j.get("absolute_url")],key=lambda j:j["first_published"],reverse=True)[:5]
        job=lambda j:{"t":j["title"],"url":j["absolute_url"],"pub":(j.get("first_published") or "")[:10]}
        byc={}
        for j in J:
            n=((j.get("location") or {}).get("name") or "").strip()
            if n and j.get("absolute_url"): byc.setdefault(n,[]).append(j)
        cities=[{"loc":n,"n":len(v),"intern":sum(1 for j in v if j in intern),
          "recent":[job(j) for j in sorted(v,key=lambda j:j.get("first_published") or "",reverse=True)[:3]]}
          for n,v in sorted(byc.items(),key=lambda x:(-len(x[1]),x[0]))]
        return {"total":len(J),"intern":len(intern),"url":"https://www.spacex.com/careers/",
          "cities":cities,"interns":[{**job(j),"loc":((j.get("location") or {}).get("name") or "").strip()} for j in intern if j.get("absolute_url")],
          "locs":sorted(loc.items(),key=lambda x:-x[1])[:5],
          "recent":[{"t":j["title"],"loc":(j.get("location") or {}).get("name"),"url":j["absolute_url"],"pub":j["first_published"][:10]} for j in rec],
          "at":datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),"source":"SpaceX en Greenhouse"}
    except Exception as e:
        print("ofertas no disponibles:",e,file=sys.stderr)
        try: return json.load(open("data.json")).get("jobs")
        except Exception: return None

up=get("upcoming",20,"up.json"); prev=get("previous",60,"prev.json")
lsp=(prev["results"][0].get("launch_service_provider") or {}) if prev["results"] else {}
out={"generated":datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
 "source":"Launch Library 2 (The Space Devs)",
 "stats":{k:lsp.get(k) for k in ["total_launch_count","successful_launches","failed_launches","consecutive_successful_launches","successful_landings","attempted_landings","consecutive_successful_landings","pending_launches"]},
 "upcoming":[slim(r) for r in up["results"]],"previous":[slim(r) for r in prev["results"]]}
out["tl_types"]=TLT
out["lzones"]=LZ
out["jobs"]=jobs()
try: es=json.load(open("i18n/desc_es.json"))
except Exception: es={}
def nethist(o):
    """Historial real de la fecha prevista (net) de cada lanzamiento: se añade una entrada cada vez que cambia
    entre una actualización y la siguiente. Se guarda en data.json y solo se conservan los lanzamientos actuales."""
    try: H=json.load(open("data.json")).get("nethist") or {}
    except Exception: H={}
    for l in o["upcoming"]+o["previous"]:
        if not l.get("net"): continue
        h=H.setdefault(l["id"],[])
        if not h or h[-1][1]!=l["net"] or (len(h[-1])>2 and h[-1][2]!=l.get("net_precision")): h.append([o["generated"],l["net"],l.get("net_precision")])
    ids={l["id"] for l in o["upcoming"]+o["previous"]}
    return {k:v[-30:] for k,v in H.items() if k in ids}
def vidseen(o):
    """Primer momento real en que se vio cada lanzamiento en los datos y primer momento en que tuvo enlace al directo
    (vidURLs de Launch Library 2): {id:[primera vez visto, primera vez con enlace o None]}. Se conserva en data.json."""
    try: V=json.load(open("data.json")).get("vidseen") or {}
    except Exception: V={}
    for l in o["upcoming"]+o["previous"]:
        v=V.setdefault(l["id"],[o["generated"],None])
        if l.get("video") and not v[1]: v[1]=o["generated"]
    ids={l["id"] for l in o["upcoming"]+o["previous"]}
    return {k:v for k,v in V.items() if k in ids}
def sthist(o):
    """Historial real del estado (Go, TBC, TBD, Hold...) de cada lanzamiento: se añade [hora de los datos, estado] cada vez
    que cambia entre una actualización y la siguiente. Reconstruido con el historial de data.json desde el 18 oct."""
    try: S=json.load(open("data.json")).get("sthist") or {}
    except Exception: S={}
    for l in o["upcoming"]+o["previous"]:
        st=l.get("status")
        if not st: continue
        h=S.setdefault(l["id"],[])
        if not h or h[-1][1]!=st: h.append([o["generated"],st])
    ids={l["id"] for l in o["upcoming"]+o["previous"]}
    return {k:v[-20:] for k,v in S.items() if k in ids}
def fails():
    """Historial completo de lanzamientos fallidos o parcialmente fallidos de SpaceX (Launch Library 2) con el motivo
    publicado por la fuente y el número de intento de SpaceX. Si falla la descarga, se conserva el último."""
    try:
        if os.environ.get("USE_CACHE") and os.path.exists("fails.json"): F=json.load(open("fails.json"))
        else:
            req=urllib.request.Request("https://ll.thespacedevs.com/2.3.0/launches/previous/?lsp__name=SpaceX&status__ids=4,7&limit=50&mode=normal",headers={"User-Agent":"spacex-play"})
            F=json.load(urllib.request.urlopen(req,timeout=300))
        return [{"id":r["id"],"name":r.get("name"),"mission":(r.get("mission") or {}).get("name"),"net":r.get("net"),
          "status":(r.get("status") or {}).get("abbrev"),"status_name":(r.get("status") or {}).get("name"),
          "fail":(r.get("failreason") or "").strip(),"rocket":((r.get("rocket") or {}).get("configuration") or {}).get("name"),
          "pad":(r.get("pad") or {}).get("name"),"loc":((r.get("pad") or {}).get("location") or {}).get("name"),
          "n":r.get("agency_launch_attempt_count")} for r in F["results"]]
    except Exception as e:
        print("fallos no disponibles:",e,file=sys.stderr)
        try: return json.load(open("data.json")).get("fails")
        except Exception: return None
out["fails"]=fails()
out["nethist"]=nethist(out)
out["vidseen"]=vidseen(out)
out["sthist"]=sthist(out)
out["missing_es"]=[l["id"] for l in out["upcoming"]+out["previous"] if l["desc"] and l["id"] not in es]
json.dump(out,open("data.json","w"),ensure_ascii=False,separators=(",",":"))
print("ok",len(out["upcoming"]),len(out["previous"]),out["generated"])
