#!/usr/bin/env python3
"""Genera los iconos de la app instalable (logo triangular de SpaceX Play sobre fondo oscuro). Sin imágenes de terceros."""
from PIL import Image, ImageDraw, ImageFilter
BG=(5,7,13); BLUE=(79,179,255)
def icon(size, maskable=False):
    S=size*4
    img=Image.new("RGB",(S,S),BG)
    glow=Image.new("RGB",(S,S),(0,0,0)); g=ImageDraw.Draw(glow)
    g.ellipse((int(S*.15),int(S*.1),int(S*.85),int(S*.8)),fill=(40,70,130))
    img=Image.blend(img,glow.filter(ImageFilter.GaussianBlur(S//8)),0.6)
    d=ImageDraw.Draw(img)
    k=0.62 if maskable else 0.8   # zona segura del 80 % en iconos enmascarables
    cx,cy,h=S/2,S/2+S*0.04*k,S*0.62*k; w=h*0.9
    top,base=cy-h*0.6,cy+h*0.4
    d.polygon([(cx,top),(cx-w/2,base),(cx+w/2,base)],fill=BLUE)
    ih=h*0.42
    d.polygon([(cx,base-ih),(cx-w*0.21,base),(cx+w*0.21,base)],fill=BG)
    return img.resize((size,size),Image.LANCZOS)
for n,s,m in [("icon-192.png",192,False),("icon-512.png",512,False),("maskable-512.png",512,True),("apple-touch-icon.png",180,True),("favicon-32.png",32,False)]:
    icon(s,m).save("icons/"+n,optimize=True)
print("ok")
