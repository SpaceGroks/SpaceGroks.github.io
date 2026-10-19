#!/usr/bin/env python3
"""Genera og.png (1200x630), la imagen de vista previa al compartir el enlace. Sin fotos de terceros."""
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W,H=1200,630
ORB="/usr/share/fonts/truetype/sand-box/google/Orbitron/Orbitron-VariableFont_wght.ttf"
INT="/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"
def font(path,size,style):
    f=ImageFont.truetype(path,size)
    try: f.set_variation_by_name(style)
    except Exception: pass
    return f
img=Image.new("RGB",(W,H),(5,7,13))
# Resplandores como en la web
glow=Image.new("RGB",(W,H),(0,0,0)); g=ImageDraw.Draw(glow)
g.ellipse((700,-350,1500,250),fill=(70,60,140)); g.ellipse((-300,-150,500,350),fill=(30,80,130)); g.ellipse((250,450,950,950),fill=(110,50,25))
glow=glow.filter(ImageFilter.GaussianBlur(140))
img=Image.blend(img,glow,0.55)
d=ImageDraw.Draw(img)
random.seed(7)
for _ in range(260):
    x,y=random.randrange(W),random.randrange(H); r=random.choice([0.6,0.8,1,1.4]); c=random.randint(150,255)
    d.ellipse((x-r,y-r,x+r,y+r),fill=(c,c,min(255,c+20)))
# Logo triangular
cx,cy=600,150
d.polygon([(cx,cy-55),(cx-48,cy+30),(cx+48,cy+30)],fill=(79,179,255))
d.polygon([(cx,cy-18),(cx-20,cy+30),(cx+20,cy+30)],fill=(5,7,13))
t1=font(ORB,96,"ExtraBold")
a="SPACEX ";b="PLAY"
wa=d.textlength(a,font=t1); wb=d.textlength(b,font=t1); x0=(W-wa-wb)/2
d.text((x0,215),a,font=t1,fill=(238,243,251)); d.text((x0+wa,215),b,font=t1,fill=(79,179,255))
s=font(INT,40,"SemiBold")
def center(txt,y,f,fill):
    d.text(((W-d.textlength(txt,font=f))/2,y),txt,font=f,fill=fill)
center("Juega con las misiones reales de SpaceX",355,s,(238,243,251))
s2=font(INT,30,"Medium")
center("Predicciones con puntos · Reto semanal · Propulsores · Mapa",420,s2,(147,161,184))
center("Datos en directo cada hora (Launch Library 2)",462,s2,(147,161,184))
s3=font(INT,24,"Regular")
center("spacegroks.github.io  ·  Proyecto de aficionados, no oficial ni afiliado a SpaceX",565,s3,(120,135,160))
img.save("og.png",optimize=True)
print("ok",img.size)
