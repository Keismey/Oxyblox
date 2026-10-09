
/* ---------- vol : shoot'em up ---------- */
let SH=null;
const CS=13,HB=.8;
const FOE={
 drone:{hp:2,r:11,vy:105,fire:2.8,col:'#ff7a6b',loot:{m:3},pts:10},
 fighter:{hp:5,r:14,vy:80,fire:1.8,col:'#ff5f9e',loot:{m:3,c:2},pts:25},
 rock:{hp:6,r:17,vy:65,col:'#8d7b68',loot:{m:9},pts:15},
 kami:{hp:3,r:12,vy:130,col:'#ffb35a',loot:{c:3},pts:20},
 cruiser:{hp:24,r:30,vy:45,fire:2.3,col:'#d24b62',loot:{m:12,c:10},pts:120,xc:.15},
 sniper:{hp:7,r:13,vy:75,fire:3.4,col:'#ffd23f',loot:{m:4,c:4},pts:60,xc:.05},
 splitter:{hp:12,r:18,vy:58,fire:2.6,col:'#9be15d',loot:{m:6,c:3},pts:70,xc:.08},
 mini:{hp:1.5,r:8,vy:150,col:'#c7f08a',loot:{},pts:8},
 layer:{hp:16,r:20,vy:48,fire:1.7,col:'#ff9f43',loot:{m:8,c:8},pts:90,xc:.18},
 mine:{hp:2,r:9,vy:22,col:'#ff6b3d',loot:{},pts:5},
 boss:{hp:200,r:48,col:'#ff4f6a',loot:{},pts:2000}
};
function mkFlight(I){
 const sh={I,parts:I.parts.map(p=>({...p,x0:p.cx*CS,y0:p.cy*CS})),half:I.w*CS/2,top:-I.h*CS/2,bot:I.h*CS/2,
  W:[],drones:[],hullMax:I.hull,lay:I.lay,shRech:I.shRech,speed:I.spd,mag:I.mag,crit:I.crit/100,nrgRegen:I.nrg,nrgMax:I.nrgMax,regen:I.regen.map(iv=>({iv,t:0})),stasis:I.stasis,cargo:I.cargo,loot:I.loot/100,skills:I.skills,empCost:I.empCost};
 I.W.forEach(w=>{const o={...w,t:rnd()*.25,ox:(w.cx+.5)*CS,oy:w.cy*CS,ph:0,on:true};
  if(w.id==='drone'){for(let k=0;k<w.st.n;k++)sh.drones.push({dmg:w.st.dmg*w.dm,iv:w.st.iv/w.rm,t:rnd()*.5});return}
  sh.W.push(o)});
 return sh;
}
function mkSH(mode,sec,I,W,H){
 const T=mode==='arena'?1:SEC[sec].T,fl=mkFlight(I);fl.name=I.name;if(mode!=='arena')fl.cargo=Math.round(fl.cargo*Math.pow(BAL.cargoF,T-1));
 return{mode,sec,T,D:mode==='arena'?1e9:SEC[sec].dur,t:0,ship:fl,x:W/2,y:H*.74,W,H,pend:{x:0,y:0},hull:fl.hullMax,sh:fl.lay,shT:0,shF:0,inv:0,nrg:40,
  over:null,overT:0,paused:true,started:false,pb:[],eb:[],foes:[],loot:[],parts:[],floats:[],arcs:[],waves:mode==='arena'?[]:genWaves(T,SEC[sec].dur),wi:0,boss:null,
  zone:0,cargo:{m:0,c:0,x:0},lost:0,shake:0,buff:0,drA:0,sfxT:0,kills:0,fullT:0,score:0,mult:1,nextF:1.5,nextBoss:150,bosses:0,dmgTaken:0,beamFx:[]};
}
const hpm=T=>BAL.hpm(T);
function genWaves(T,D){
 const ev=[];let t=1.6;
 while(t<D){const p=t/D;formation(ev,pickForm(T,p),t,T,p);t+=Math.max(.9,2.6-p*1.0-(T-1)*.28+rnd()*.8)}
 return ev.sort((a,b)=>a.t-b.t);
}
function pickForm(T,p){
 const F=[['drones',3,0,1],['vee',2,.08,1],['fighters',2,.12,1],['rocks',1.4,0,1],['kami',1.4,.25,1],['cruiser',1.1,.3,1],['sniper',1.4,0,2],['splitter',1.3,0,3],['layer',1,.2,4]];
 const av=F.filter(f=>p>=f[2]&&T>=f[3]);let k=rnd()*av.reduce((a,f)=>a+f[1],0),f;for(f of av){k-=f[1];if(k<=0)break}return f[0];
}
function formation(ev,k,t,T,p){
 const X=()=>.15+rnd()*.7;
 if(k==='drones'){const x=X(),n=3+Math.round(p*2+T*.4);for(let i=0;i<n;i++)ev.push({t:t+i*.33,type:'drone',x})}
 else if(k==='vee')for(let i=0;i<5;i++){const o=i-2;ev.push({t:t+Math.abs(o)*.18,type:'drone',x:.5+o*.14})}
 else if(k==='fighters'){const n=2+(T>1?1:0)+(T>3?1:0);for(let i=0;i<n;i++)ev.push({t:t+i*.55,type:'fighter',x:.2+rnd()*.6,ph:rnd()*6})}
 else if(k==='rocks'){const n=2+ri(0,2);for(let i=0;i<n;i++)ev.push({t:t+i*.6,type:'rock',x:X()})}
 else if(k==='kami')for(let i=0;i<3+(T>2?1:0);i++)ev.push({t:t+i*.4,type:'kami',x:X()});
 else if(k==='cruiser')ev.push({t,type:'cruiser',x:.3+rnd()*.4});
 else if(k==='sniper'){const n=T>3?2:1;for(let i=0;i<n;i++)ev.push({t:t+i*.8,type:'sniper',x:.15+rnd()*.7})}
 else if(k==='splitter')ev.push({t,type:'splitter',x:X()});
 else if(k==='layer')ev.push({t,type:'layer',x:.25+rnd()*.5});
}
function spawnFoe(e){
 const s=SH,d=FOE[e.type],W=s.W,m=hpm(s.T);
 const f={type:e.type,x:e.x*W,x0:e.x*W,y:e.y!=null?e.y:-34,hp:d.hp*m,max:d.hp*m,r:d.r,t:0,ft:rnd()*(d.fire||1),ph:e.ph||0,flash:0,rot:rnd()*6,vx:e.vx||0,vy:e.vy!=null?e.vy:d.vy||0,st:0};
 if(e.type==='rock'){f.pts=Array.from({length:8},()=>.75+rnd()*.35);f.vx=(rnd()-.5)*30}
 s.foes.push(f);return f;
}
/* sprites des gardiens + masque de collision */
const BOSS_SRC=/*BOSSES*/[];
const BOSS_IMG=BOSS_SRC.map(src=>{const o={im:new Image(),mask:null,mw:0,mh:0};o.im.onload=()=>{try{const mw=64,mh=Math.round(64*o.im.naturalHeight/o.im.naturalWidth),c=document.createElement('canvas');c.width=mw;c.height=mh;const x=c.getContext('2d');x.drawImage(o.im,0,0,mw,mh);const d=x.getImageData(0,0,mw,mh).data,m=new Uint8Array(mw*mh);for(let k=0;k<mw*mh;k++)m[k]=d[k*4+3]>110?1:0;o.mask=m;o.mw=mw;o.mh=mh}catch(e){}};o.im.src=src;return o});
function bossSprite(f){const o=BOSS_IMG[f.img-1];return o&&o.im.complete&&o.im.naturalWidth?o:null}
function bossHit(f,x,y,pad=3){const o=bossSprite(f);if(!o||!o.mask){const dx=f.x-x,dy=f.y-y;return dx*dx+dy*dy<(f.r+pad)*(f.r+pad)}
 const u=(x-f.x)/f.bw+.5,v=(y-f.y)/f.bh+.5;if(u<0||u>=1||v<0||v>=1)return false;
 const px=Math.floor(u*o.mw),py=Math.floor(v*o.mh),pr=Math.ceil(pad/f.bw*o.mw);
 for(let yy=Math.max(0,py-pr);yy<=Math.min(o.mh-1,py+pr);yy++)for(let xx=Math.max(0,px-pr);xx<=Math.min(o.mw-1,px+pr);xx++)if(o.mask[yy*o.mw+xx])return true;return false}
function spawnBoss(){
 const s=SH,T=s.T,easy=s.mode!=='arena'&&T===1,hp=FOE.boss.hp*hpm(T)*(s.mode==='arena'?1.2:easy?.75:1);
 const img=s.mode==='arena'?(s.zone%5)+1:Math.min(5,T),bw=Math.min(176,s.W*.46),spr=BOSS_IMG[img-1],bh=spr&&spr.im.naturalWidth?bw*spr.im.naturalHeight/spr.im.naturalWidth:bw*.58;
 s.boss={type:'boss',img,bw,bh,x:s.W/2,y:-90,hp,max:hp,r:Math.min(48,bh*.45),t:0,pt:0,pat:0,flash:0,dir:1,ft:0,spin:0,fz:easy?65:45,col:BOSSC[((s.mode==='arena'?s.zone:T-1)%5)+1]};s.foes.push(s.boss);s.bosses++;
 SFX.alarm();addFloatS(s.W/2,s.H*.35,s.mode==='arena'?BOSSN[(s.zone%5)+1].toUpperCase():BOSSN[T].toUpperCase(),'#ffd089',2.2);
}
function addFloatS(x,y,txt,col,life=1){if(SH)SH.floats.push({x,y,txt,col,life,max:life})}
function burstS(x,y,col,n=14,sp=110){if(SIM)return;for(let k=0;k<n;k++){const a=rnd()*6.28,v=sp*(.3+rnd());SH.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.35+rnd()*.5,col,s:1.5+rnd()*2.5})}}
const bSpeed=()=>140+30*Math.min(SH.T,6);
const dmgN=()=>Math.ceil(Math.min(SH.T,8)*.6);
const dmgH=()=>Math.ceil(Math.min(SH.T,8)*.9);
function ebullet(x,y,ang,sp,r=4.5,dmg=1,ex){SH.eb.push(Object.assign({x,y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r,dmg},ex||{}))}
const aimAt=(x,y)=>Math.atan2(SH.y-y,SH.x-x);
function nearestFoe(x,y,maxD=1e9,excl){let best=null,bd=maxD*maxD;for(const f of SH.foes){if(f.dead||f.y<-20||(excl&&excl.has(f)))continue;const d=(f.x-x)**2+(f.y-y)**2;if(d<bd){bd=d;best=f}}return best}
function dronePos(k){const s=SH,n=s.ship.drones.length,a=s.drA+k*6.283/n,R=s.ship.half+20;return{x:s.x+Math.cos(a)*R,y:s.y+Math.sin(a)*R*.7}}
function hitShip(bx,by,pad=0){
 const s=SH,sh=s.ship,lx=bx-s.x,ly=by-s.y;
 if(lx<-sh.half-pad||lx>sh.half+pad||ly<sh.top-pad||ly>sh.bot+pad)return false;
 for(const p of sh.parts){const u=((lx-p.x0)/CS-.5)/HB+.5,v=((ly-p.y0)/CS-.5)/HB+.5;if(u<0||u>1||v<0||v>1)continue;if(inShape(p.sh,p.rot,u,v))return true}
 return false;
}
const KEYS={x:0,y:0},KD={};
function keyAxis(){KEYS.x=(KD.ArrowRight||KD.KeyD?1:0)-(KD.ArrowLeft||KD.KeyA||KD.KeyQ?1:0);KEYS.y=(KD.ArrowDown||KD.KeyS?1:0)-(KD.ArrowUp||KD.KeyW||KD.KeyZ?1:0)}
addEventListener('keydown',e=>{if(!SH||view!=='expe')return;const c=e.code;
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','KeyZ','KeyQ'].includes(c)){KD[c]=1;keyAxis();e.preventDefault();return}
 if(c==='Escape'||c==='KeyP'){if(!SH.started)return;if(SH.paused)ACT.shResume();else ACT.shPause();e.preventDefault();return}
 if(c==='Space'||c==='Enter'){if(!SH.started){ACT.shStart();e.preventDefault()}return}
 const n=['Digit1','Digit2','Digit3','Digit4'].indexOf(c);if(n>=0&&SH.ship.skills[n]){useSkill(SH.ship.skills[n].id);e.preventDefault()}});
addEventListener('keyup',e=>{if(KD[e.code]){KD[e.code]=0;keyAxis()}});
addEventListener('blur',()=>{for(const k in KD)KD[k]=0;keyAxis()});
function shUpdate(dt){
 const s=SH,sh=s.ship,W=s.W,H=s.H;
 physS(dt);
 if(s.over){s.overT-=dt;if(s.over==='win'&&rnd()<.6&&s.boss)burstS(s.boss.x+(rnd()-.5)*90,s.boss.y+(rnd()-.5)*40,rnd()<.5?'#ffb35a':'#ff5b4e',8,170);if(s.overT<=0)finishMission(s.over);return}
 if(s.paused)return;
 s.t+=dt;
 if(s.mode==='arena')s.T=1+s.t/55;
 if(KEYS.x||KEYS.y){const kl=Math.hypot(KEYS.x,KEYS.y);s.pend.x=KEYS.x/kl*sh.speed*dt;s.pend.y=KEYS.y/kl*sh.speed*dt}
 const mx=sh.speed*dt,len=Math.hypot(s.pend.x,s.pend.y);
 if(len>0){const k=Math.min(1,mx/len);s.x+=s.pend.x*k;s.y+=s.pend.y*k;s.pend.x*=1-k;s.pend.y*=1-k}
 s.x=clamp(s.x,sh.half+4,W-sh.half-4);s.y=clamp(s.y,100-sh.top,H-110);
 // apparitions
 if(s.mode==='arena'){s.nextF-=dt;if(s.nextF<=0){const ev=[];formation(ev,pickForm(s.T,.5+rnd()*.5),0,s.T,.6);ev.forEach(e=>{e.t+=s.t});s.waves.push(...ev);s.waves.sort((a,b)=>a.t-b.t);s.nextF=Math.max(.85,2.4-s.T*.22)+rnd()*.6}
  if(s.t>=s.nextBoss&&!s.boss){spawnBoss();s.nextBoss=s.t+150}}
 while(s.wi<s.waves.length&&s.waves[s.wi].t<=s.t)spawnFoe(s.waves[s.wi++]);
 if(s.mode==='arena'&&s.wi>200){s.waves.splice(0,s.wi);s.wi=0}
 if(s.mode!=='arena'&&s.t>=s.D&&!s.boss)spawnBoss();
 if(s.mode!=='arena'&&s.boss&&!s.over){s.trk=(s.trk||0)+dt;if(s.trk>6-Math.min(3,s.T*.5)){s.trk=0;const ev=[];formation(ev,rnd()<.5?'drones':'kami',0,s.T,.5);ev.forEach(e=>{e.t+=s.t});s.waves.push(...ev);s.waves.sort((a,b)=>a.t-b.t)}}
 // jauges
 s.nrg=Math.min(sh.nrgMax,s.nrg+dt*sh.nrgRegen);s.buff=Math.max(0,s.buff-dt);s.inv=Math.max(0,s.inv-dt);s.shF=Math.max(0,s.shF-dt*2.5);
 if(s.sh<sh.lay){s.shT+=dt;if(s.shT>=sh.shRech){s.sh++;s.shT=0}}
 for(const r of sh.regen){r.t+=dt;if(r.t>=r.iv){r.t=0;if(s.hull<sh.hullMax){s.hull++;addFloatS(s.x,s.y+sh.top-8,'+1','#a6e3a1',.7)}}}
 // armes
 const boost=s.buff>0?2:1;
 for(const w of sh.W){const bx=s.x+w.ox,by=s.y+w.oy,st=w.st;
  if(w.id==='beam'){w.ph+=dt*w.rm*boost;const cyc=2.1;if(w.ph>=cyc)w.ph-=cyc;w.on=w.ph<1.3;
   if(w.on){const half=st.w/2;for(const f of s.foes){if(f.dead||f.y>by||f.y<-20)continue;if(Math.abs(f.x-bx)<(f.type==='boss'?f.bw*.42:f.r)+half)hitFoe(f,st.dps0*w.dm*dt*(rnd()<sh.crit?2:1))}}continue}
  w.t+=dt*w.rm*boost;if(w.t<st.iv)continue;w.t-=st.iv;
  const a=-Math.PI/2+w.dir,crit=()=>rnd()<sh.crit?2:1;
  if(w.id==='laser'){const offs=st.b>1?[-3.5,3.5]:[0];offs.forEach(o=>s.pb.push({x:bx+o,y:by,vx:Math.cos(a)*580,vy:Math.sin(a)*580,dmg:st.dmg*w.dm*crit(),r:3,kind:'las'}));if(s.sfxT<=0&&!SIM){tone(1500,500,.07,'square',0.03);s.sfxT=.09}}
  else if(w.id==='spread'){for(let k=0;k<st.n;k++){const aa=a+(k-(st.n-1)/2)*(.76/(st.n-1))+(rnd()-.5)*.05;s.pb.push({x:bx,y:by,vx:Math.cos(aa)*470,vy:Math.sin(aa)*470,dmg:st.dmg*w.dm*crit(),r:2.5,kind:'spr',life:.5})}}
  else if(w.id==='mis'){s.pb.push({x:bx,y:by,vx:Math.cos(a)*120+(rnd()-.5)*60,vy:-200,dmg:st.dmg*w.dm*crit(),r:4,kind:'mis',life:3.2});if(!SIM)tone(300,140,.2,'triangle',0.075)}
  else if(w.id==='plasma'){s.pb.push({x:bx,y:by,vx:Math.cos(a)*330,vy:Math.sin(a)*330,dmg:st.dmg*w.dm*crit(),r:6,kind:'pla',pierce:st.pierce,hit:new Set()});if(!SIM)tone(220,90,.25,'sawtooth',0.09)}
  else if(w.id==='tesla'){let f=nearestFoe(bx,by,200);if(!f){w.t=st.iv;continue}const seen=new Set();let px=bx,py=by,dmg=st.dmg*w.dm*crit();
   for(let k=0;k<=st.chain&&f;k++){seen.add(f);s.arcs.push({x1:px,y1:py,x2:f.x,y2:f.y,life:.14});hitFoe(f,dmg);px=f.x;py=f.y;dmg*=.8;f=nearestFoe(px,py,130,seen)}
   if(!SIM)SFX.zap()}
 }
 s.sfxT-=dt;
 // drones
 if(sh.drones.length){s.drA+=dt*2.2;sh.drones.forEach((d,k)=>{d.t+=dt*boost;if(d.t>=d.iv){d.t=0;const p=dronePos(k),tg=nearestFoe(p.x,p.y);const a=tg?Math.atan2(tg.y-p.y,tg.x-p.x):-Math.PI/2;s.pb.push({x:p.x,y:p.y,vx:Math.cos(a)*470,vy:Math.sin(a)*470,dmg:d.dmg,r:2.5,kind:'dr'})}})}
 // projectiles du joueur
 for(let i=s.pb.length-1;i>=0;i--){const b=s.pb[i];
  if(b.kind==='mis'){b.life-=dt;const tg=nearestFoe(b.x,b.y);if(tg){const a=Math.atan2(tg.y-b.y,tg.x-b.x),sp=Math.min(440,Math.hypot(b.vx,b.vy)+520*dt),ca=Math.atan2(b.vy,b.vx);let d=a-ca;while(d>Math.PI)d-=6.283;while(d<-Math.PI)d+=6.283;const na=ca+clamp(d,-5*dt,5*dt);b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp}
   if(!SIM&&rnd()<.6)s.parts.push({x:b.x,y:b.y,vx:(rnd()-.5)*20,vy:(rnd()-.5)*20,life:.3,col:'#ff9ccf',s:2})}
  if(b.life!=null&&b.kind!=='mis')b.life-=dt;
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(b.y<-20||b.y>H+20||b.x<-20||b.x>W+20||(b.life!=null&&b.life<=0)){s.pb.splice(i,1);continue}
  for(const f of s.foes){if(f.dead||(b.hit&&b.hit.has(f)))continue;const dx=f.x-b.x,dy=f.y-b.y;if(f.type==='boss'?bossHit(f,b.x,b.y,b.r):dx*dx+dy*dy<(f.r+b.r)*(f.r+b.r)){hitFoe(f,b.dmg,b);
   if(b.kind==='pla'){b.hit.add(f);b.pierce--;if(b.pierce>0)continue}s.pb.splice(i,1);break}}}
 // ennemis
 for(let i=s.foes.length-1;i>=0;i--){const f=s.foes[i];if(f.dead){s.foes.splice(i,1);continue}
  f.t+=dt;f.flash=Math.max(0,f.flash-dt*6);updFoe(f,dt);if(f.dead){s.foes.splice(i,1);continue}
  if(f.type!=='boss'&&(f.y>H+50||f.x<-60||f.x>W+60)){s.foes.splice(i,1);continue}
  if(!s.over&&Math.abs(f.x-s.x)<f.r+sh.half&&f.y+f.r>s.y+sh.top&&f.y-f.r<s.y+sh.bot){
   let touch=false;for(const p of sh.parts){const cx=s.x+p.x0+CS/2,cy=s.y+p.y0+CS/2,rr=CS*.5*Math.sqrt(SHP[p.sh].a);if((f.x-cx)**2+(f.y-cy)**2<(f.r+rr)**2){touch=true;break}}
   if(touch){if(f.type==='boss')playerHit(dmgH());else{playerHit(f.type==='kami'?dmgH()+1:dmgH());hitFoe(f,1e6)}}}}
 // projectiles ennemis
 const st2=sh.stasis*sh.stasis;
 for(let i=s.eb.length-1;i>=0;i--){const b=s.eb[i];
  if(b.home){b.life-=dt;const a=Math.atan2(s.y-b.y,s.x-b.x),ca=Math.atan2(b.vy,b.vx),sp=Math.hypot(b.vx,b.vy);let d=a-ca;while(d>Math.PI)d-=6.283;while(d<-Math.PI)d+=6.283;const na=ca+clamp(d,-1.1*dt,1.1*dt);b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp;if(b.life<=0){s.eb.splice(i,1);continue}}
  let k=1;if(st2&&(b.x-s.x)**2+(b.y-s.y)**2<st2)k=.5;
  b.x+=b.vx*dt*k;b.y+=b.vy*dt*k;
  if(b.y<-30||b.y>H+30||b.x<-30||b.x>W+30){s.eb.splice(i,1);continue}
  if(hitShip(b.x,b.y)){s.eb.splice(i,1);playerHit(b.dmg)}}
 // butin
 for(let i=s.loot.length-1;i>=0;i--){const l=s.loot[i];l.t+=dt;const dx=s.x-l.x,dy=s.y-l.y,d=Math.hypot(dx,dy)||1;
  if(d<sh.mag||l.t>8){const sp=Math.max(280,540-d);l.vx=dx/d*sp;l.vy=dy/d*sp}else{l.vx*=.97;l.vy=Math.min(70,l.vy+60*dt)}
  l.x+=l.vx*dt;l.y+=l.vy*dt;if(d<20){s.loot.splice(i,1);takeLoot(l)}else if(l.y>H+30)s.loot.splice(i,1)}
 for(let i=s.arcs.length-1;i>=0;i--){s.arcs[i].life-=dt;if(s.arcs[i].life<=0)s.arcs.splice(i,1)}
}
function updFoe(f,dt){
 const s=SH,d=FOE[f.type],bs=bSpeed();
 switch(f.type){
  case'drone':f.y+=f.vy*dt;f.ft+=dt;if(f.ft>d.fire&&f.y>20&&f.y<s.H*.6){f.ft=0;if(s.T>1||rnd()<.6)ebullet(f.x,f.y+8,aimAt(f.x,f.y),bs,4.5,dmgN())}break;
  case'fighter':f.y+=f.vy*dt;f.x=f.x0+Math.sin(f.t*1.8+f.ph)*Math.min(70,s.W*.18);f.ft+=dt;if(f.ft>d.fire/(.8+.2*Math.min(s.T,5))&&f.y>20&&f.y<s.H*.65){f.ft=0;const a=aimAt(f.x,f.y);ebullet(f.x,f.y+10,a,bs,4.5,dmgN());if(s.T>=2){ebullet(f.x,f.y+10,a-.18,bs,4.5,dmgN());ebullet(f.x,f.y+10,a+.18,bs,4.5,dmgN())}}break;
  case'rock':f.y+=f.vy*dt;f.x+=f.vx*dt;f.rot+=dt*.8;break;
  case'mini':f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.99;break;
  case'kami':if(f.t<.9)f.y+=f.vy*dt;else{if(!f.lock){f.lock=1;const a=aimAt(f.x,f.y),sp=230+35*Math.min(s.T,6);f.vx=Math.cos(a)*sp;f.vy=Math.sin(a)*sp}f.x+=f.vx*dt;f.y+=f.vy*dt}break;
  case'cruiser':if(f.y<165||f.t>9)f.y+=f.vy*dt;else f.x+=Math.sin(f.t)*20*dt;f.ft+=dt;if(f.ft>d.fire&&f.y>40){f.ft=0;const n=3+2*Math.min(3,Math.floor(s.T)),a0=aimAt(f.x,f.y);for(let k=0;k<n;k++)ebullet(f.x,f.y+20,a0+(k-(n-1)/2)*.17,bs*.85,4.5,dmgH())}break;
  case'sniper':if(f.st===0){f.y+=f.vy*dt;if(f.y>130+f.x0%70){f.st=1;f.ft=d.fire*.6}}else{f.ft+=dt;if(f.st===1&&f.ft>d.fire-.75){f.st=2;f.aim=aimAt(f.x,f.y)}if(f.st===2&&f.ft>d.fire){f.st=1;f.ft=0;ebullet(f.x,f.y+12,f.aim,bs*2.3,4,dmgH());f.shots=(f.shots||0)+1;if(f.shots>=3)f.st=3}}if(f.st===3)f.y+=f.vy*1.5*dt;break;
  case'splitter':f.y+=f.vy*dt;f.x=f.x0+Math.sin(f.t*1.2)*40;f.ft+=dt;if(f.ft>d.fire&&f.y>20){f.ft=0;for(let k=-1;k<=1;k++)ebullet(f.x,f.y+14,Math.PI/2+k*.3,bs*.8,4.5,dmgN())}break;
  case'layer':if(f.y<120||f.t>11)f.y+=f.vy*dt;else f.x=f.x0+Math.sin(f.t*.8)*Math.min(110,s.W*.3);f.ft+=dt;if(f.ft>d.fire&&f.y>30){f.ft=0;const m=spawnFoe({type:'mine',x:f.x/s.W,y:f.y+18,vy:22});m.fuse=2.2}break;
  case'mine':f.y+=f.vy*dt;f.fuse-=dt;if(f.fuse<=0){f.dead=1;const n=8;for(let k=0;k<n;k++)ebullet(f.x,f.y,k*6.283/n+f.rot,bs*.7,4.5,dmgH());burstS(f.x,f.y,'#ff6b3d',10,90)}break;
  case'boss':updBoss(f,dt);break;
 }
}
function updBoss(b,dt){
 const s=SH,bs=bSpeed(),T=Math.min(s.T,7);
 if(b.y<175){b.y+=55*dt;return}
 b.x+=b.dir*(40+12*T)*dt;if(b.x<70||b.x>s.W-70)b.dir*=-1;b.x=clamp(b.x,70,s.W-70);
 b.pt+=dt;b.ft+=dt;b.age=(b.age||0)+dt;const enr=b.hp<b.max*.4||b.age>b.fz;if(b.age>b.fz&&!b.enrT){b.enrT=1;addFloatS(b.x,b.y+60,tl('FUREUR','FURY'),'#ff5b4e',1.5)}const sp=b.age>b.fz?1.35:1;
 const pats=[0,1,2];if(T>=3)pats.push(3);if(T>=4)pats.push(4);
 const pat=pats[b.pat%pats.length],dur=[3.2,3,4,3.6,4][pat];
 if(sp>1)b.ft+=dt*(sp-1);
 if(pat===0&&b.ft>(enr?.22:.32)){b.ft=0;const a=aimAt(b.x,b.y);for(let k=-1;k<=1;k++)ebullet(b.x,b.y+30,a+k*.14,bs*1.1,4.5,dmgH())}
 if(pat===1&&b.ft>(enr?.9:1.3)){b.ft=0;const n=12+2*Math.floor(T);b.spin+=.2;for(let k=0;k<n;k++)ebullet(b.x,b.y,b.spin+k*6.283/n,bs*.75,5,dmgN())}
 if(pat===2){if(b.ft>(T>=2?.1:.16)){b.ft=0;b.spin+=.42;ebullet(b.x-30,b.y+20,Math.PI/2+Math.sin(b.spin)*1.1,bs*.8,4.5,dmgN());if(T>=2)ebullet(b.x+30,b.y+20,Math.PI/2-Math.sin(b.spin)*1.1,bs*.8,4.5,dmgN())}
  if(b.pt<dt*1.5)for(let k=0;k<2+Math.floor(T/2);k++)spawnFoe({type:'drone',x:clamp((b.x+(k-1)*50)/s.W,.1,.9)})}
 if(pat===3&&b.ft>1.25){b.ft=0;const gap=s.ship.half*2+44,gx=40+rnd()*(s.W-80-gap);for(let x=10;x<s.W;x+=22){if(x>gx&&x<gx+gap)continue;ebullet(x,b.y+40,Math.PI/2,bs*.62,4.5,dmgN())}}
 if(pat===4&&b.ft>1.3){b.ft=0;for(let k=-1;k<=1;k++)ebullet(b.x+k*36,b.y+30,Math.PI/2+k*.4,bs*.45,6.5,dmgH(),{home:1,life:5})}
 if(b.pt>dur){b.pt=0;b.ft=0;b.pat++}
}
function hitFoe(f,dmg,b){
 const s=SH;if(f.dead)return;f.hp-=dmg;f.flash=1;
 if(b&&!SIM)burstS(b.x,b.y,b.kind==='mis'?'#ff9ccf':b.kind==='pla'?'#b892ff':'#ffd089',3,60);
 if(f.hp>0)return;
 f.dead=1;s.kills++;
 if(s.mode==='arena'){s.score+=Math.round(FOE[f.type].pts*s.mult*Math.max(1,s.T));s.mult=Math.min(8,s.mult+.05)}
 if(f.type==='boss'){
  if(s.mode==='arena'){s.boss=null;burstS(f.x,f.y,'#ffb35a',80,260);s.shake=.6;SFX.boom();addFloatS(f.x,f.y,'+'+fmt(FOE.boss.pts*s.mult*s.T),'#ffd089',1.6);s.zone++;const k=(s.zone%5)+1;if(!SIM)bgSet(k);addFloatS(s.W/2,s.H*.42,`${tl('ZONE','ZONE')} ${s.zone+1} · ${SEC[k].n.toUpperCase()}`,'#9fd9ec',3);return}
  s.over='win';s.overT=2.6;SFX.boom();burstS(f.x,f.y,'#ffb35a',80,260);s.shake=.6;s.eb.length=0;
  const T=s.T,bl=BAL.bossLoot*Math.pow(BAL.bossLootF,T-1);s.bossLoot={m:Math.round(bl*.6),c:Math.round(bl*.4),x:2*T+1};for(const k in s.bossLoot)s.cargo[k]+=s.bossLoot[k];
  s.foes.forEach(o=>{if(o!==f&&!o.dead){o.dead=1;burstS(o.x,o.y,'#ffb35a',10,120)}});return}
 burstS(f.x,f.y,'#ffb35a',f.r>20?40:18,f.r>20?200:130);
 if(!SIM)noise(f.r>20?.6:.22,f.r>20?.4:.18,f.r>20?500:900);if(f.r>20)s.shake=Math.max(s.shake,.25);
 if(f.type==='splitter')for(let k=0;k<3;k++){const a=Math.PI/2+(k-1)*.7;spawnFoe({type:'mini',x:f.x/s.W,y:f.y,vx:Math.cos(a)*90,vy:Math.sin(a)*120+40})}
 if(s.mode==='arena')return;
 const L=FOE[f.type].loot,T=s.T,lm=Math.pow(BAL.loot,T-1)*(1+s.ship.loot);
 for(const r in L){let v=Math.round(L[r]*lm*(.8+rnd()*.5));const n=v>8?3:v>3?2:1;for(let k=0;k<n;k++){const part=Math.round(v/(n-k));v-=part;dropLoot(f.x,f.y,r,part)}}
 const xc=FOE[f.type].xc;if(xc&&rnd()<(xc+.04*T)*(1+s.ship.loot))dropLoot(f.x,f.y,'x',1);
}
function dropLoot(x,y,res,v){if(v<=0)return;const a=rnd()*6.28;SH.loot.push({x,y,vx:Math.cos(a)*60,vy:Math.sin(a)*60-30,res,v,t:0})}
function takeLoot(l){
 const s=SH;
 if(l.res==='x'){s.cargo.x+=l.v;addFloatS(s.x,s.y-30,'+'+l.v+' '+RES.x.n,'#b892ff');if(!SIM)tone(880,1760,.15,'sine',0.15);return}
 const room=s.ship.cargo-(s.cargo.m+s.cargo.c),v=Math.max(0,Math.min(room,l.v));
 if(v>0){s.cargo[l.res]+=v;if(s.sfxT<=0&&!SIM)tone(1100,1500,.05,'sine',0.09)}
 if(v<l.v){s.lost+=l.v-v;if(s.fullT<=0){addFloatS(s.x,s.y-34,tl('SOUTE PLEINE','CARGO FULL'),'#ff9a90');s.fullT=2}}
}
function playerHit(d){
 const s=SH;if(s.inv>0||s.over)return;
 s.mult=1;
 if(s.sh>0){s.sh--;s.shT=0;s.shF=1;s.inv=.25;SFX.shield();return}
 s.hull=Math.max(0,s.hull-d);s.dmgTaken+=d;s.inv=.9;s.shake=.35;SFX.hit();addFloatS(s.x,s.y-30,'−'+d,'#ff9a90');burstS(s.x,s.y,'#ff5b4e',14,120);
 if(s.hull<=0){s.over=s.mode==='arena'?'arenaEnd':'lose';s.overT=1.8;SFX.boom();burstS(s.x,s.y,'#ffb35a',70,240);s.shake=.6}
}
function physS(dt){
 const s=SH;
 for(let k=s.parts.length-1;k>=0;k--){const q=s.parts[k];q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.95;q.vy*=.95;q.life-=dt;if(q.life<=0)s.parts.splice(k,1)}
 for(let k=s.floats.length-1;k>=0;k--){const f=s.floats[k];f.y-=24*dt;f.life-=dt;if(f.life<=0)s.floats.splice(k,1)}
 s.shake=Math.max(0,s.shake-dt);s.fullT=Math.max(0,s.fullT-dt);
}
function useSkill(id){
 const s=SH;if(!s||s.paused||s.over)return;const k=s.ship.skills.find(q=>q.id===id);if(!k||s.nrg<k.cost){SFX.err();return}
 s.nrg-=k.cost;
 if(id==='over'){s.buff=4.5;addFloatS(s.x,s.y-50,tl('SURCHARGE','OVERLOAD'),'#ffd089');SFX.build()}
 if(id==='emsh'){s.sh=s.ship.lay;s.inv=Math.max(s.inv,2);s.shF=1;SFX.shield();addFloatS(s.x,s.y-50,tl('BOUCLIER','SHIELD'),'#62d6e8')}
 if(id==='salvo'){for(let q=0;q<8;q++){const a=-Math.PI/2+(q-3.5)*.22;s.pb.push({x:s.x,y:s.y+s.ship.top,vx:Math.cos(a)*260,vy:Math.sin(a)*260,dmg:4*(1+.3*((s.ship.I.W.find(w=>w.id==='mis')||{L:1}).L-1)),r:4,kind:'mis',life:3.5})}SFX.mis()}
 if(id==='emp'){s.eb.length=0;s.foes.forEach(f=>{if(!f.dead)hitFoe(f,6*hpm(s.T)*.5)});addFloatS(s.x,s.y-50,tl('ONDE EMP','EMP WAVE'),'#e3d27a');if(!SIM){flash();SFX.boom()}}
 if(!SIM)shHud(true);
}

/* ---------- rendu du vol ---------- */
function drawSShip(g,s,T){
 const sh=s.ship;g.save();g.translate(s.x,s.y);
 if(s.inv>0&&s.sh===0&&Math.floor(T*20)%2===0&&!s.over)g.globalAlpha=.45;
 if(s.over==='lose'||s.over==='arenaEnd')g.globalAlpha=Math.max(0,s.overT/1.8);
 const rear=Math.max(...sh.parts.map(p=>p.y0));
 sh.parts.filter(p=>p.y0===rear).forEach(p=>{const L=CS*(.9+.4*Math.sin(T*30+p.x0)),x=p.x0+CS/2,y=p.y0+CS;g.fillStyle='rgba(255,170,100,.9)';g.beginPath();g.moveTo(x-CS*.3,y);g.lineTo(x,y+L);g.lineTo(x+CS*.3,y);g.fill()});
 for(const p of sh.parts){g.save();g.translate(p.x0,p.y0);g.scale(CS,CS);g.translate(.5,.5);g.rotate(p.rot*Math.PI/2);g.translate(-.5,-.5);
  const path=shpPath(p.sh);g.fillStyle='#5a6987';g.fill(path);
  g.save();g.translate(.5,.5);g.scale(.82,.82);g.translate(-.5,-.5);g.fillStyle=p.m?MD[p.m.id].col:'#26304a';g.fill(path);g.restore();g.restore()}
 sh.W.forEach(w=>{if(w.id==='beam'||w.id==='tesla')return;g.save();g.translate(w.ox,w.oy);g.rotate(w.dir);g.fillStyle='#ffd089';g.fillRect(-1.2,-5,2.4,5);g.restore()});
 if(s.sh>0||s.shF>0){const R=Math.max(sh.half,(sh.bot-sh.top)/2)+10;g.strokeStyle=`rgba(98,214,232,${.22+.12*s.sh+s.shF*.5})`;g.lineWidth=1.2+Math.min(4,s.sh);g.beginPath();g.ellipse(0,0,R*.95,R,0,0,7);g.stroke()}
 if(sh.stasis){g.strokeStyle='rgba(122,168,255,.18)';g.setLineDash([4,6]);g.lineWidth=1;g.beginPath();g.arc(0,0,sh.stasis,0,7);g.stroke();g.setLineDash([])}
 g.restore();
 if(!s.over)sh.drones.forEach((d,k)=>{const p=dronePos(k);g.fillStyle='#7fdc95';g.beginPath();g.arc(p.x,p.y,4,0,7);g.fill()});
 for(const w of sh.W){if(w.id!=='beam'||!w.on||s.over)continue;const bx=s.x+w.ox,by=s.y+w.oy;g.fillStyle='rgba(255,95,158,.25)';g.fillRect(bx-w.st.w,0,w.st.w*2,by);g.fillStyle='rgba(255,200,225,.9)';g.fillRect(bx-w.st.w/4,0,w.st.w/2,by)}
}
function drawFoe(g,f,T){
 const d=FOE[f.type],col=f.flash>0&&f.type!=='boss'?'#ffffff':(f.col||d.col);g.save();g.translate(f.x,f.y);
 switch(f.type){
  case'drone':case'mini':{const k=f.type==='mini'?.7:1;g.scale(k,k);g.fillStyle=col;g.beginPath();g.moveTo(0,12);g.lineTo(-11,-8);g.lineTo(0,-3);g.lineTo(11,-8);g.fill();g.fillStyle='#2a0f12';g.beginPath();g.arc(0,0,3.5,0,7);g.fill();break}
  case'fighter':g.fillStyle=col;g.beginPath();g.moveTo(0,15);g.lineTo(-15,-4);g.lineTo(-6,-12);g.lineTo(0,-6);g.lineTo(6,-12);g.lineTo(15,-4);g.fill();g.fillStyle='#ffd1e4';g.fillRect(-2,2,4,6);break;
  case'rock':g.rotate(f.rot);g.fillStyle=f.flash>0?'#fff':'#6e5f50';g.beginPath();f.pts.forEach((k,i)=>{const a=i/8*6.283,x=Math.cos(a)*f.r*k,y=Math.sin(a)*f.r*k;i?g.lineTo(x,y):g.moveTo(x,y)});g.fill();g.fillStyle='#4f4338';g.beginPath();g.arc(-4,-3,4,0,7);g.arc(5,5,3,0,7);g.fill();break;
  case'kami':g.fillStyle='rgba(255,179,90,.35)';g.beginPath();g.arc(0,-10,6+Math.sin(T*30)*2,0,7);g.fill();g.fillStyle=col;g.beginPath();g.moveTo(0,13);g.lineTo(-9,0);g.lineTo(0,-11);g.lineTo(9,0);g.fill();break;
  case'cruiser':g.fillStyle=col;g.beginPath();g.moveTo(-14,-24);g.lineTo(14,-24);g.lineTo(24,0);g.lineTo(10,26);g.lineTo(-10,26);g.lineTo(-24,0);g.fill();g.fillStyle='#4a1420';g.fillRect(-32,-10,10,22);g.fillRect(22,-10,10,22);g.fillStyle='#ffd089';g.fillRect(-4,8,8,8);hpBar(g,f,-24,-34,48);break;
  case'sniper':g.fillStyle=col;g.beginPath();g.moveTo(0,18);g.lineTo(-9,-10);g.lineTo(0,-5);g.lineTo(9,-10);g.fill();g.fillStyle='#3a2a00';g.fillRect(-1.5,0,3,16);
   if(f.st===2){g.restore();g.strokeStyle=`rgba(255,210,63,${.3+.5*Math.sin(T*40)**2})`;g.lineWidth=1.2;g.beginPath();g.moveTo(f.x,f.y);g.lineTo(f.x+Math.cos(f.aim)*900,f.y+Math.sin(f.aim)*900);g.stroke();return}break;
  case'splitter':g.fillStyle=col;for(let k=0;k<3;k++){const a=k*2.094+T;g.beginPath();g.arc(Math.cos(a)*7,Math.sin(a)*7,9,0,7);g.fill()}g.fillStyle='#24400f';g.beginPath();g.arc(0,0,5,0,7);g.fill();hpBar(g,f,-18,-26,36);break;
  case'layer':g.fillStyle=col;g.beginPath();g.moveTo(-20,-12);g.lineTo(20,-12);g.lineTo(14,14);g.lineTo(-14,14);g.fill();g.fillStyle='#3a1a00';g.fillRect(-6,4,12,8);hpBar(g,f,-20,-22,40);break;
  case'mine':g.fillStyle=(f.fuse<.6&&Math.floor(T*16)%2)?'#ffffff':col;g.beginPath();g.arc(0,0,7,0,7);g.fill();g.strokeStyle=col;g.lineWidth=2;for(let k=0;k<6;k++){const a=k*1.047+f.rot;g.beginPath();g.moveTo(Math.cos(a)*7,Math.sin(a)*7);g.lineTo(Math.cos(a)*11,Math.sin(a)*11);g.stroke()}break;
  case'boss':{const spr=bossSprite(f);if(spr){g.drawImage(spr.im,-f.bw/2,-f.bh/2,f.bw,f.bh);
   if(f.flash>0){g.globalCompositeOperation='lighter';g.globalAlpha=.3*f.flash;g.drawImage(spr.im,-f.bw/2,-f.bh/2,f.bw,f.bh);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
   if(f.hp<f.max*.4||f.age>f.fz){const pr=.5+.5*Math.sin(T*10),gr=g.createRadialGradient(0,0,0,0,0,f.bh*.45);gr.addColorStop(0,`rgba(255,80,60,${.45*pr})`);gr.addColorStop(1,'rgba(255,80,60,0)');g.globalCompositeOperation='lighter';g.fillStyle=gr;g.beginPath();g.arc(0,0,f.bh*.45,0,7);g.fill();g.globalCompositeOperation='source-over'}
   break}
   const c=f.col||d.col;g.fillStyle='#2a1020';g.beginPath();g.moveTo(-70,-10);g.lineTo(-44,-34);g.lineTo(44,-34);g.lineTo(70,-10);g.lineTo(40,30);g.lineTo(-40,30);g.fill();
   g.fillStyle=c;g.beginPath();g.moveTo(-30,-40);g.lineTo(30,-40);g.lineTo(46,0);g.lineTo(22,44);g.lineTo(-22,44);g.lineTo(-46,0);g.fill();
   g.fillStyle=f.flash>0?'#ffffff':(f.hp<f.max*.4?`rgba(255,${120+80*Math.sin(T*12)},90,1)`:'#ffd089');g.beginPath();g.arc(0,8,10+Math.sin(T*5)*1.5,0,7);g.fill();
   g.fillStyle='#1a0a14';g.fillRect(-64,-14,12,24);g.fillRect(52,-14,12,24);break}
 }
 g.restore();
}
function hpBar(g,f,x,y,w){if(f.hp>=f.max)return;g.fillStyle='rgba(0,0,0,.5)';g.fillRect(x,y,w,3);g.fillStyle='#ff5b4e';g.fillRect(x,y,w*Math.max(0,f.hp/f.max),3)}
function shFrame(dt,T){
 if(!SH||!SH.cx)return;
 shUpdate(dt);if(!SH||!SH.cx)return;
 const s=SH,g=s.cx;g.setTransform(DPR,0,0,DPR,0,0);g.clearRect(0,0,s.W,s.H);
 if(s.shake>0)g.translate((rnd()-.5)*s.shake*16,(rnd()-.5)*s.shake*16);
 for(const l of s.loot){const c=l.res==='m'?'#dfe5ef':l.res==='c'?'#62d6e8':'#b892ff',z=l.res==='x'?7:4+Math.min(3,l.v/4);g.save();g.translate(l.x,l.y);g.rotate(T*2+l.v);g.fillStyle=c;g.beginPath();g.moveTo(0,-z);g.lineTo(z,0);g.lineTo(0,z);g.lineTo(-z,0);g.fill();g.restore()}
 for(const f of s.foes)if(!f.dead)drawFoe(g,f,T);
 drawSShip(g,s,T);
 for(const b of s.pb){if(b.kind==='las'){g.fillStyle='#ffd089';g.save();g.translate(b.x,b.y);g.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);g.fillRect(-1.5,-7,3,12);g.restore()}
  else if(b.kind==='mis'){g.fillStyle='#ffd2ea';g.beginPath();g.arc(b.x,b.y,3.5,0,7);g.fill()}
  else if(b.kind==='pla'){g.fillStyle='rgba(184,146,255,.4)';g.beginPath();g.arc(b.x,b.y,10,0,7);g.fill();g.fillStyle='#efe4ff';g.beginPath();g.arc(b.x,b.y,5,0,7);g.fill()}
  else if(b.kind==='spr'){g.fillStyle='#ffc46b';g.fillRect(b.x-1.5,b.y-1.5,3,3)}
  else{g.fillStyle='#9ff0b3';g.beginPath();g.arc(b.x,b.y,2.5,0,7);g.fill()}}
 g.strokeStyle='#bff6ff';g.lineWidth=2;for(const a of s.arcs){g.globalAlpha=a.life/.14;g.beginPath();g.moveTo(a.x1,a.y1);const n=4;for(let k=1;k<n;k++){const t=k/n;g.lineTo(a.x1+(a.x2-a.x1)*t+(rnd()-.5)*12,a.y1+(a.y2-a.y1)*t+(rnd()-.5)*12)}g.lineTo(a.x2,a.y2);g.stroke()}g.globalAlpha=1;
 for(const b of s.eb){const big=b.r>5;g.fillStyle=b.home?'rgba(196,107,255,.35)':'rgba(255,91,78,.35)';g.beginPath();g.arc(b.x,b.y,b.r+3,0,7);g.fill();g.fillStyle=b.home?'#c46bff':(b.dmg>1?'#ff2d55':'#ff5b4e');g.beginPath();g.arc(b.x,b.y,b.r,0,7);g.fill();g.fillStyle='#ffe0dc';g.beginPath();g.arc(b.x,b.y,b.r*(big?.35:.45),0,7);g.fill()}
 for(const q of s.parts){g.globalAlpha=Math.max(0,Math.min(1,q.life*2.5));g.fillStyle=q.col;g.fillRect(q.x-q.s/2,q.y-q.s/2,q.s,q.s)}g.globalAlpha=1;
 g.textAlign='center';
 for(const f of s.floats){g.font=`700 ${f.max>1?17:13}px Oxanium, sans-serif`;g.globalAlpha=Math.min(1,f.life*1.6);g.fillStyle='#05070d';g.fillText(f.txt,f.x+1,f.y+1);g.fillStyle=f.col;g.fillText(f.txt,f.x,f.y)}g.globalAlpha=1;
 shHud(false);
}
