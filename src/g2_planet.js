
/* ---------- fond étoilé ---------- */
const bg=$('bg'),bgx=bg.getContext('2d');let BW=0,BH=0,DPR=1,stars=[],neb=null;
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function sizeBg(){
 const r=$('app').getBoundingClientRect();DPR=Math.min(2,window.devicePixelRatio||1);BW=r.width;BH=r.height;bg.width=BW*DPR;bg.height=BH*DPR;
 const R=mulberry(7);stars=[];for(let i=0;i<170;i++)stars.push({x:R()*BW,y:R()*BH,z:.2+R()*.8,p:R()*6.28});
 neb=document.createElement('canvas');neb.width=bg.width||1;neb.height=bg.height||1;const g=neb.getContext('2d');g.scale(DPR,DPR);
 [[.85,.12,.7,'59,42,107',.38],[.1,.45,.6,'19,74,90',.3],[.6,.75,.55,'90,38,60',.18]].forEach(([x,y,r,c,a])=>{const gr=g.createRadialGradient(x*BW,y*BH,0,x*BW,y*BH,r*Math.max(BW,BH)||1);gr.addColorStop(0,`rgba(${c},${a})`);gr.addColorStop(1,`rgba(${c},0)`);g.fillStyle=gr;g.fillRect(0,0,BW,BH)});
}
function drawBg(dt,T){
 bgx.setTransform(DPR,0,0,DPR,0,0);bgx.fillStyle='#05070d';bgx.fillRect(0,0,BW,BH);
 const fly=view==='expe'&&SH&&SH.started&&!SH.paused,inFlight=view==='expe'&&SH;
 if(inFlight)drawSecBg(bgx,dt,fly);else if(neb)bgx.drawImage(neb,0,0,BW,BH);
 const _f=0,sp=fly?140*(SH.mode==='arena'?1.3:1):0;
 for(const s of stars){if(fly){s.y+=s.z*dt*sp;if(s.y>BH+2)s.y-=BH+4}else{s.x-=s.z*dt*3;if(s.x<-2)s.x+=BW+4}const a=.35+.45*s.z*(.75+.25*Math.sin(T*1.7+s.p));bgx.fillStyle=`rgba(225,232,255,${a})`;const sz=s.z>.85?1.8:s.z>.5?1.2:.8;bgx.fillRect(s.x,s.y,sz,sz)}
}

/* ---------- planète ---------- */
const pc=$('pc'),px=pc.getContext('2d');let PW=0,PH=0,pTex=null,PG=null,shuttles=[];
function sizePlanet(){
 const r=$('v-planet').getBoundingClientRect();if(r.width<10||r.height<10)return;if(PG&&r.width===PW&&r.height===PH&&pc.width===Math.round(PW*DPR))return;
 PW=r.width;PH=r.height;pc.width=PW*DPR;pc.height=PH*DPR;
 const R=Math.max(PW*1.2,420),cx=PW/2,cy=PH*.6+R,amax=Math.asin(Math.min(.95,(PW/2-72)/R));
 const ang=[-1,-.5,0,.5,1].map(k=>k*amax),R2=R-Math.min(130,PH*.2);
 const back=ang.map(a=>({a,x:cx+R*Math.sin(a),y:cy-R*Math.cos(a)}));
 const front=[.13,.38,.62,.87].map(f=>{const x=PW*f,a=Math.asin((x-cx)/R2);return{a,x,y:cy-R2*Math.cos(a)}});
 PG={R,cx,cy,plots:back.concat(front),ship:{x:PW*.5,y:PH*.3}};
 planetTex();plotSig='';renderPlots(true);
}
function planetTex(){if(!PG)return;const st=stageOf(viab()),key=PG.R+'|'+st;if(!pTex||pTex._k!==key){pTex=makePlanet(PG.R,st);pTex._k=key}}
function makePlanet(R,stage=0){
 const s=Math.ceil(R*2),c=document.createElement('canvas');c.width=c.height=Math.min(2400,s);const k=c.width/s,g=c.getContext('2d');g.scale(k,k);
 const rr=mulberry(17);g.save();g.beginPath();g.arc(R,R,R,0,7);g.clip();
 let gr=g.createRadialGradient(R*.75,R*.25,R*.05,R,R,R);gr.addColorStop(0,'#cf9459');gr.addColorStop(.55,'#8c4f2c');gr.addColorStop(1,'#341a10');g.fillStyle=gr;g.fillRect(0,0,s,s);
 for(let i=0;i<70;i++){g.fillStyle=`rgba(${rr()<.5?'45,20,10':'235,180,120'},${.03+rr()*.07})`;g.beginPath();g.ellipse(rr()*s,rr()*s*.5,R*(.2+rr()*.8),R*(.006+rr()*.03),(rr()-.5)*.25,0,7);g.fill()}
 for(let i=0;i<140;i++){const x=rr()*s,y=rr()*s*.35,r=1.5+rr()*rr()*R*.05;g.fillStyle='rgba(255,210,160,.13)';g.beginPath();g.arc(x-r*.25,y-r*.25,r,0,7);g.fill();g.fillStyle='rgba(35,14,6,.38)';g.beginPath();g.arc(x,y,r*.85,0,7);g.fill()}
 if(stage>=1){g.fillStyle='rgba(120,170,230,.07)';g.fillRect(0,0,s,s)}
 if(stage>=2){const sr=mulberry(99);for(let i=0;i<9;i++){const x=sr()*s,y=R*(.03+sr()*.45),w=R*(.08+sr()*.16),h=w*(.25+sr()*.15);
   g.fillStyle='rgba(28,62,108,.85)';g.beginPath();g.ellipse(x,y,w,h,(sr()-.5)*.3,0,7);g.fill();g.strokeStyle='rgba(140,200,255,.35)';g.lineWidth=2;g.stroke();
   if(stage>=3){const g2=mulberry(200+i);for(let k=0;k<(stage>=4?7:4);k++){g.fillStyle=`rgba(${stage>=4?'86,168,82':'92,140,74'},${.45+g2()*.3})`;g.beginPath();g.ellipse(x+(g2()-.5)*w*2.6,y+(g2()-.5)*h*3,w*(.15+g2()*.3),h*(.4+g2()*.6),0,0,7);g.fill()}}}}
 if(stage>=4){g.fillStyle='rgba(60,110,70,.16)';g.fillRect(0,0,s,s)}
 gr=g.createRadialGradient(R*.55,R*.1,R*.3,R,R*.9,R*1.05);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.75,'rgba(0,0,0,.15)');gr.addColorStop(1,'rgba(0,0,0,.65)');g.fillStyle=gr;g.fillRect(0,0,s,s);
 g.restore();return c;
}
function drawMiniShip(g,x,y,T){
 const cells=S.ship.cells,sz=6;let mnC=9,mxC=-1,mnR=9,mxR=-1;
 cells.forEach((c,i)=>{if(c.s!=='ok'||!c.m)return;const cc=i%GC,r=i/GC|0;mnC=Math.min(mnC,cc);mxC=Math.max(mxC,cc);mnR=Math.min(mnR,r);mxR=Math.max(mxR,r)});
 if(mxC<0)return;
 const w=(mxC-mnC+1)*sz,h=(mxR-mnR+1)*sz,ox=x-w/2,oy=y-h/2;
 g.save();g.translate(x,y);g.rotate(-Math.PI/2+.08*Math.sin(T*.4));g.translate(-x,-y);
 if(cells.some(c=>c.m&&c.m.id==='eng')){g.fillStyle=`rgba(255,160,90,${.5+.3*Math.sin(T*20)})`;g.beginPath();g.moveTo(x-w*.25,oy+h);g.lineTo(x,oy+h+sz*(1.6+.3*Math.sin(T*30)));g.lineTo(x+w*.25,oy+h);g.fill()}
 cells.forEach((c,i)=>{if(c.s!=='ok'||!c.m)return;const X=ox+(i%GC-mnC)*sz,Y=oy+((i/GC|0)-mnR)*sz;g.save();g.translate(X,Y);g.scale(sz,sz);g.fillStyle=c.m?(MD[c.m.id].col):'#7d899f';g.translate(.5,.5);g.rotate(c.rot*Math.PI/2);g.translate(-.5,-.5);g.fill(shpPath(c.sh));g.restore()});
 g.restore();
}
function drawPlanet(dt,T){
 if(!PG)return;const g=px,{R,cx,cy}=PG;g.setTransform(DPR,0,0,DPR,0,0);g.clearRect(0,0,PW,PH);
 const sx=PG.ship.x+Math.sin(T*.25)*PW*.12,sy=PG.ship.y+Math.sin(T*.6)*4;PG.ship.cx=sx;PG.ship.cy=sy;
 if(!SH)drawMiniShip(g,sx,sy,T);
 const ta=viab()/100,ac=[255+(110-255)*ta,165+(190-165)*ta,95+(255-95)*ta].map(Math.round).join(',');
 let gr=g.createRadialGradient(cx,cy,R*.97,cx,cy,R*(1.09+.03*ta));gr.addColorStop(0,`rgba(${ac},${.5+.15*ta})`);gr.addColorStop(.4,`rgba(${ac},.16)`);gr.addColorStop(1,`rgba(${ac},0)`);g.fillStyle=gr;g.beginPath();g.arc(cx,cy,R*1.12,0,7);g.fill();
 const glob=drawGlobe(dt,ac.split(',').map(Number));
 if(!glob){planetTex();g.drawImage(pTex,cx-R,cy-R,R*2,R*2);
 if(stageOf(viab())>=2){g.save();g.beginPath();g.arc(cx,cy,R,0,7);g.clip();const cr=mulberry(5);for(let i=0;i<8;i++){const sp=4+cr()*6,w=35+cr()*55,x=((cr()*PW*1.6+T*sp)%(PW+2*w))-w,y=cy-R+12+cr()*PH*.22;g.fillStyle=`rgba(240,246,255,${.05+cr()*.07})`;g.beginPath();g.ellipse(x,y,w,w*.18,0,0,7);g.fill()}g.restore()}}
 S.plots.forEach((p,i)=>{if(!p||!p.lvl)return;const q=PG.plots[i];const a=.18+.08*Math.sin(T*2+i);gr=g.createRadialGradient(q.x,q.y,0,q.x,q.y,46);gr.addColorStop(0,`rgba(255,200,120,${a})`);gr.addColorStop(1,'rgba(255,200,120,0)');g.fillStyle=gr;g.fillRect(q.x-50,q.y-50,100,100)});
 for(let k=shuttles.length-1;k>=0;k--){const s=shuttles[k];s.t+=dt/s.d;if(s.t>=1){shuttles.splice(k,1);continue}
  const tx=s.tx!=null?s.tx:(PG.ship.cx||PG.ship.x),ty=s.ty!=null?s.ty:(PG.ship.cy||PG.ship.y),e=s.t*s.t*(3-2*s.t),mx=(s.x+tx)/2+s.bend,my=Math.min(s.y,ty)-30;
  const bx=(1-e)*(1-e)*s.x+2*(1-e)*e*mx+e*e*tx,by=(1-e)*(1-e)*s.y+2*(1-e)*e*my+e*e*ty;
  g.fillStyle=s.col;g.shadowColor=s.col;g.shadowBlur=10;g.beginPath();g.arc(bx,by,2.6,0,7);g.fill();g.shadowBlur=0}
}
let plotSig='';
const consProg=()=>S.cons?clamp(1-(S.cons.end-Date.now())/(S.cons.dur*1000/S.cons.spd),0,1):0;
function bufCap(p){return prod(p.id,p.lvl)*60*capH()}
const canUpP=i=>{const p=S.plots[i];return!!p&&p.lvl>0&&!S.cons&&p.lvl<PB[p.id].max&&!pReq(p.id)&&canPay(pCost(p.id,p.lvl))};
function renderPlots(force){
 if(!PG||view!=='planet'&&!force)return;
 const hintIdx=inTuto()&&S.obj<2?S.plots.findIndex(p=>!p):-1;
 const sig=PW+'|'+hintIdx+'|'+S.plots.map((p,i)=>p?[p.id,p.lvl,S.cons&&S.cons.p===i?1:0,PB[p.id].res&&p.buf>=1?1:0,PB[p.id].res&&p.buf>=bufCap(p)-1?1:0,canUpP(i)?1:0].join(','):'-').join(';');
 if(sig===plotSig&&!force){
  S.plots.forEach((p,i)=>{if(!p)return;const b=document.getElementById('bub'+i);if(b)b.textContent=fmt(p.buf);const r=document.getElementById('ring'+i);if(r)r.setAttribute('stroke-dasharray',(consProg()*100.5).toFixed(1)+' 101')});
 }else{plotSig=sig;
 $('plots').innerHTML=S.plots.map((p,i)=>{const q=PG.plots[i];const st=`left:${q.x}px;top:${q.y}px;transform:rotate(${q.a}rad)`;
  if(!p)return`<button class="plot ${i===hintIdx?'hint':''}" style="${st}" data-act="plot" data-arg="${i}" aria-label="${tl('Emplacement libre','Free plot')}"><div class="plus">+</div><div class="pad"></div></button>`;
  const cons=S.cons&&S.cons.p===i;
  let inner=bsvg(cons&&p.lvl===0?'cons':p.id);
  if(cons){inner+=`<svg class="ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" stroke="#00000088"/><circle cx="20" cy="20" r="16" stroke="var(--amber)" id="ring${i}" stroke-dasharray="${(consProg()*100.5).toFixed(1)} 101" transform="rotate(-90 20 20)"/></svg>`}
  else if(PB[p.id].res&&p.buf>=1){const r=PB[p.id].res,full=p.buf>=bufCap(p)-1;inner+=`<span class="bub ${RES[r].cl} ${full?'full':''}" data-act="collect" data-arg="${i}">${ic(RES[r].i)}<span id="bub${i}">${fmt(p.buf)}</span></span>`}
  if(p.lvl)inner+=`<span class="lv">${tl('niv.','lv.')} ${p.lvl}</span>`;
  if(canUpP(i))inner+=`<span class="upb" title="${tl('Amélioration possible','Upgrade available')}">${ic('up')}</span>`;
  return`<button class="plot" style="${st}" data-act="plot" data-arg="${i}" aria-label="${PB[p.id].n}">${inner}</button>`}).join('');}
 const any=S.plots.some(p=>p&&PB[p.id].res&&p.buf>=1);{const h=!any||inTuto()&&S.obj<2;if($('colAll').hidden!==h){$('colAll').hidden=h;if(!SIM)fitPName()}}
 const cb=$('consbar');
 if(S.cons){const p=S.plots[S.cons.p];cb.hidden=false;cb.innerHTML=`${ic('wrench')}<div style="min-width:0;flex:1"><div style="font-size:13px;margin-bottom:4px">${PB[p.id].n} → ${tl('niv.','lv.')} ${p.lvl+1} · <span style="font-family:var(--f-mono)">${fmtT((S.cons.end-Date.now())/1000)}</span></div><div class="bar"><i style="width:${consProg()*100}%"></i></div></div>${S.test?`<button class="btn sm ghost" data-act="finishCons">${tl('Finir','Finish')}</button>`:''}`}
 else cb.hidden=true;
}
function renderTerra(){
 const el=$('terra');if(!el)return;el.hidden=inTuto();if(el.hidden)return;
 const v=viab(),st=stageOf(v),hab=plotLvl('habitat'),cap=popCap();
 el.innerHTML=`<div class="tr1"><b>${tl('Palier','Stage')} ${st}/4 · ${STAGES[st].n}</b><span class="tp">${ic('people')}${hab?`${Math.floor(S.res.p)} / ${cap}`:tl('aucun habitat','no habitat')}</span></div><div class="tr2" style="grid-template-columns:1fr auto"><div class="g" style="color:var(--green)">${ic('leaf')}<div class="bar"><i style="width:${v}%;background:linear-gradient(90deg,#ffb35a,#62d6e8 45%,#7fdc95)"></i></div></div><span style="font:13px var(--f-mono);color:var(--green)">${Math.round(v)}${PCT()}</span></div>`;
}
function collect(i,silent){
 const p=S.plots[i];if(!p||!PB[p.id].res)return 0;const n=Math.floor(p.buf);if(n<1)return 0;
 const r=PB[p.id].res,take=Math.min(n,Math.floor(room(r)));if(take<1){if(!silent){toast(tl(`Stock de ${RES[r].n} plein`,`${RES[r].n[0].toUpperCase()+RES[r].n.slice(1)} storage full`),'bad');SFX.err()}return 0}S.res[r]+=take;p.buf-=take;S.flags.collected=1;
 if(PG){const q=PG.plots[i];shuttles.push({x:q.x,y:q.y-40,t:0,d:.9+rnd()*.3,bend:(rnd()-.5)*80,col:r==='m'?'#dfe5ef':r==='c'?'#62d6e8':r==='x'?'#b892ff':'#ffd089'})}
 if(!silent){SFX.collect();bumpRes([r]);toast(`+${fmt(take)} ${RES[r].n}`,'ok')}
 return take;
}

/* ---------- économie ---------- */
function econ(sec,s=S,quiet){
 const k=sec*(s.test?20:1)/60;
 s.plots.forEach(p=>{if(!p||!p.lvl||!PB[p.id].res)return;const pr=prod(p.id,p.lvl,s);const cap=pr*60*(BAL.capBase+2*plotLvl('depot',s));p.buf=Math.min(Math.max(cap,p.buf||0),(p.buf||0)+pr*k)});
 const pc=popCap(s);if(s.res.p<pc)s.res.p=Math.min(pc,s.res.p+popRate(s)*k);else if(s.res.p>pc)s.res.p=pc;
 if(s.cons&&Date.now()>=s.cons.end)finishBuild(s,quiet);
}
function finishBuild(s,quiet){
 const p=s.plots[s.cons.p];const before=stageOf(viab(s));p.lvl++;s.cons=null;
 if(p.id==='yard'){const L=p.lvl;s.ship.cells.forEach((c,i)=>{if(c.s==='void'&&TIER[i]<=L)c.s='dmg'})}
 if(quiet)return;
 if(p.id==='yard')tipOnce('yard',p.lvl);
 toast(tl(`${PB[p.id].n} niveau ${p.lvl} terminé`,`${PB[p.id].n} level ${p.lvl} complete`),'amb');SFX.done();renderPlots(true);renderTerra();if(view==='ship')renderShip();renderSheet();
 const after=stageOf(viab(s));
 if(after>before){for(let st=before+1;st<=after;st++){const x=STAGES[st];modal({eyebrow:tl(`Palier ${st} / 4 atteint`,`Stage ${st} / 4 reached`),title:x.n,text:pt(x.txt),choices:[{l:tl('Magnifique','Beautiful')}]})}planetTex()}
}
function startCons(i){const p=S.plots[i];const d=pTime(p.id,p.lvl);S.cons={p:i,dur:d,spd:SPD(),end:Date.now()+d*1000/SPD()}}
