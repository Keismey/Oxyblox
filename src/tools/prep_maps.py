import numpy as np, os
from PIL import Image
U='/root/.claude/uploads/5ac26d16-58ec-5e25-be27-83cdeb768404/'
PH=[('0a838542',0),('83712771',1),('8ce0e95a',2),('3ac125d3',3),('84a0a408',4)]
CX,CY,RB=511.5,515.5,458
RS=450.0
W,H=2560,1280
def unshade(im,K=1.0):
  Hh,Ww,_=im.shape;yy,xx=np.mgrid[0:Hh,0:Ww];dx=xx-CX;dy=yy-CY;r=np.hypot(dx,dy);th=np.arctan2(dy,dx)
  L=np.log(im.mean(2)+10);bins=np.linspace(0,RB,24);bs=[];cs=[];rc=[]
  for a,b in zip(bins[:-1],bins[1:]):
    m=(r>=a)&(r<b)
    if m.sum()<200: continue
    A=np.stack([np.ones(m.sum()),np.cos(th[m]),np.sin(th[m])],1);sol,*_=np.linalg.lstsq(A,L[m],rcond=None)
    bs.append(sol[1]);cs.append(sol[2]);rc.append((a+b)/2)
  k=np.ones(3)/3;bs=np.convolve(np.pad(bs,1,mode='edge'),k,'valid');cs=np.convolve(np.pad(cs,1,mode='edge'),k,'valid')
  B=np.interp(r,rc,bs);C=np.interp(r,rc,cs);corr=np.exp(-K*(B*np.cos(th)+C*np.sin(th)))
  out=np.clip(im*corr[...,None],0,255)
  # normalise la luminosité moyenne du disque pour égaler l'original éclairé
  body=r<RB;out*= (im[body].mean()/max(1,out[body].mean()))*1.08
  return np.clip(out,0,255)
def bilinear(img,x,y):
  x0=np.floor(x).astype(int);y0=np.floor(y).astype(int);fx=x-x0;fy=y-y0
  x0=np.clip(x0,0,img.shape[1]-2);y0=np.clip(y0,0,img.shape[0]-2)
  a=img[y0,x0];b=img[y0,x0+1];c=img[y0+1,x0];d=img[y0+1,x0+1]
  return (a*(1-fx)[...,None]+b*fx[...,None])*(1-fy)[...,None]+(c*(1-fx)[...,None]+d*fx[...,None])*fy[...,None]
ii,jj=np.meshgrid(np.arange(W),np.arange(H))
D=np.deg2rad
lon=(ii+.5)/W*2*np.pi
lat=(.5-(jj+.5)/H)*np.pi
per=2*np.pi/3
lonT=np.mod(lon,per)-per/2
sg=np.where(lonT>=0,1,-1)
lonN=lonT-sg*per
w=np.clip((np.abs(lonT)-D(48))/D(12),0,1);w=w*w*(3-2*w)*.5
def coords(lf):return CX+np.cos(lat)*np.sin(lf)*RS,CY-np.sin(lat)*RS
pxA,pyA=coords(lonT);pxB,pyB=coords(lonN)
for f,ph in PH:
  im=np.asarray(Image.open(U+f+'-image.jpg').convert('RGB')).astype(np.float64)
  im=unshade(im)
  tex=(bilinear(im,pxA,pyA)*(1-w)[...,None]+bilinear(im,pxB,pyB)*w[...,None]).astype(np.uint8)
  Image.fromarray(tex).save(f'/home/claude/v2/assets/map{ph}.webp','WEBP',quality=80,method=6)
  Image.fromarray(tex).resize((W//4,H//4)).save(f'/tmp/claude-0/-home-claude/5ac26d16-58ec-5e25-be27-83cdeb768404/scratchpad/planets/mapprev{ph}.png')
print({f:os.path.getsize('/home/claude/v2/assets/'+f)//1024 for f in sorted(os.listdir('/home/claude/v2/assets')) if f.endswith('.webp')})
