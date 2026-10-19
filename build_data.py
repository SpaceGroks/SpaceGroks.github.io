#!/usr/bin/env python3
"""Descarga lanzamientos de SpaceX de Launch Library 2 y genera data.json reducido."""
import json, sys, urllib.request, datetime, os
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
      "stages":st,**photo(r),
      "video":vids[0]["url"] if vids else None,"updated":r.get("last_updated")}
up=get("upcoming",20,"up.json"); prev=get("previous",60,"prev.json")
lsp=(prev["results"][0].get("launch_service_provider") or {}) if prev["results"] else {}
out={"generated":datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
 "source":"Launch Library 2 (The Space Devs)",
 "stats":{k:lsp.get(k) for k in ["total_launch_count","successful_launches","failed_launches","consecutive_successful_launches","successful_landings","attempted_landings","consecutive_successful_landings","pending_launches"]},
 "upcoming":[slim(r) for r in up["results"]],"previous":[slim(r) for r in prev["results"]]}
try: es=json.load(open("i18n/desc_es.json"))
except Exception: es={}
out["missing_es"]=[l["id"] for l in out["upcoming"]+out["previous"] if l["desc"] and l["id"] not in es]
json.dump(out,open("data.json","w"),ensure_ascii=False,separators=(",",":"))
print("ok",len(out["upcoming"]),len(out["previous"]),out["generated"])
