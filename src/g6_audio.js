
/* ---------- musique ---------- */
const MUS_SRC=/*MUSIC*/{};
const TITLE_BG=/*TITLE*/'';
const MUS={tracks:{},want:'calm',duck:1,unlocked:false};
function musInit(){for(const k in MUS_SRC){const a=new Audio();a.loop=true;a.preload=k==='calm'?'auto':'none';a.volume=0;a.src=MUS_SRC[k];MUS.tracks[k]={a,v:0}}}
const musVol=()=>S&&S.vol?S.vol.mus:.6;
function audioUnlock(){
 ac();
 if(MUS.unlocked)return;MUS.unlocked=true;
 const t=MUS.tracks[MUS.want];if(t&&musVol()>0){t.a.play().catch(()=>{MUS.unlocked=false})}
 try{const a=AC;if(a){const b=a.createBuffer(1,1,22050),s=a.createBufferSource();s.buffer=b;s.connect(a.destination);s.start(0)}}catch(e){}
}
['touchend','pointerup','click','keydown'].forEach(ev=>document.addEventListener(ev,audioUnlock,true));
function musTick(dt){
 if(SIM)return;
 let want='calm',duck=1;
 if(SH&&SH.started){want=SH.boss?'boss':'mission';if(SH.paused||view!=='expe')duck=.35}
 MUS.want=want;MUS.duck=duck;
 if(!MUS.unlocked)return;
 const tv=musVol();
 for(const k in MUS.tracks){const t=MUS.tracks[k],target=k===want?tv*duck:0;
  const step=dt/(target>t.v?1.4:.9);t.v=target>t.v?Math.min(target,t.v+step):Math.max(target,t.v-step);
  try{t.a.volume=Math.max(0,Math.min(1,t.v))}catch(e){}
  if(target>0&&t.a.paused){t.a.play().catch(()=>{})}
  if(target===0&&t.v<=.001&&!t.a.paused){t.a.pause();if(k!=='calm')try{t.a.currentTime=0}catch(e){}}}
}
document.addEventListener('visibilitychange',()=>{for(const k in MUS.tracks){const t=MUS.tracks[k];if(document.hidden)t.a.pause()}});
document.addEventListener('input',e=>{const el=e.target;if(!el.dataset||!el.dataset.vol)return;S.vol[el.dataset.vol]=+el.value/100;if(el.dataset.vol==='sfx'){setSfxVol();SFX.click()}const o=el.parentNode.querySelector('output');if(o)o.textContent=el.value+PCT();save()});
