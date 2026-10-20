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
        st.append({"serial":L.get("serial_number"),"flight":s.get("launcher_flight_number"),
          "reused":s.get("reused"),"type":s.get("type"),"turnaround":s.get("turn_around_time"),
          "land_attempt":ld.get("attempt"),"land_success":ld.get("success"),
          "land_loc":loc.get("abbrev") or loc.get("name"),"land_loc_name":loc.get("name"),
          "booster_flights":L.get("flights"),"booster_landings":L.get("successful_landings")})
    vids=r.get("vid_urls") or []
    return {"id":r["id"],"name":r.get("name"),"mission":m.get("name"),"mtype":m.get("type"),
      "desc":cut(m.get("description") or ""),"orbit":(m.get("orbit") or {}).get("abbrev"),
      "orbit_name":(m.get("orbit") or {}).get("name"),
      "cust":[a.get("name") for a in m.get("agencies") or [] if a.get("name")],
      "info":next((u.get("url") for u in sorted(r.get("info_urls") or [],key=lambda u:-(u.get("priority") or 0)) if u.get("url")),None),
      "status":(r.get("status") or {}).get("abbrev"),"status_name":(r.get("status") or {}).get("name"),
      "net":r.get("net"),"net_precision":(r.get("net_precision") or {}).get("abbrev"),
      "ws":r.get("window_start"),"we":r.get("window_end"),"prob":r.get("probability"),
      "fail":r.get("failreason") or "","rocket":(ro.get("configuration") or {}).get("name"),
      "pad":p.get("name"),"loc":(p.get("location") or {}).get("name"),
      "lat":float(p["latitude"]) if p.get("latitude") else None,"lon":float(p["longitude"]) if p.get("longitude") else None,
      "stages":st,**photo(r),"tl":timeline(r),
      "video":vids[0]["url"] if vids else None,"updated":r.get("last_updated")}
up=get("upcoming",20,"up.json"); prev=get("previous",60,"prev.json")
lsp=(prev["results"][0].get("launch_service_provider") or {}) if prev["results"] else {}
out={"generated":datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
 "source":"Launch Library 2 (The Space Devs)",
 "stats":{k:lsp.get(k) for k in ["total_launch_count","successful_launches","failed_launches","consecutive_successful_launches","successful_landings","attempted_landings","consecutive_successful_landings","pending_launches"]},
 "upcoming":[slim(r) for r in up["results"]],"previous":[slim(r) for r in prev["results"]]}
out["tl_types"]=TLT
try: es=json.load(open("i18n/desc_es.json"))
except Exception: es={}
out["missing_es"]=[l["id"] for l in out["upcoming"]+out["previous"] if l["desc"] and l["id"] not in es]
json.dump(out,open("data.json","w"),ensure_ascii=False,separators=(",",":"))
print("ok",len(out["upcoming"]),len(out["previous"]),out["generated"])
