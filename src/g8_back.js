/* ---------- bouton retour du téléphone (voir ks-back.js) ----------
   fenêtre ou feuille ouverte → fermée ; déplacement de module → annulé ; décollage pas encore lancé → annulé ;
   vol → pause (un 2e retour reprend) ; hangar ou missions → planète ; planète → écran titre (confirmé) ;
   écran titre → hub (confirmé). */
const SPL0=$('spl')?$('spl').cloneNode(true):null;
function backAsk(eyebrow,title,text,yes,fn,above){
 if(above)$('modal').style.zIndex=70;
 modal({eyebrow,title,text,choices:[{l:yes,f:()=>{$('modal').style.zIndex='';fn()}},{l:tl('Annuler','Cancel'),cls:'ghost',f:()=>{$('modal').style.zIndex=''}}]});
}
function titleAgain(){
 if(!SPL0||$('spl'))return;
 const spl=SPL0.cloneNode(true),lg=spl.querySelector('.lg');if(lg)lg.remove();
 const tt=spl.querySelector('.tt');if(tt&&TITLE_BG)tt.style.background=`linear-gradient(#05070dcc,#05070d00 32%,#05070d00 70%,#05070dcc),url(${TITLE_BG}) center/cover`;
 $('app').appendChild(spl);
 let out=false;
 spl.addEventListener('pointerdown',e=>{e.stopPropagation();if(out)return;out=true;spl.classList.add('out');setTimeout(()=>spl.remove(),650)});
}
function onBack(){
 if(!$('modal').hidden){const bs=[...$('mbox').querySelectorAll('[data-mc]')];const b=bs.find(x=>x.classList.contains('ghost'))||(bs.length===1?bs[0]:bs[bs.length-1]);if(b&&!b.disabled)b.click();return}
 const spl=$('spl');
 if(spl&&!spl.classList.contains('out')){if(spl.querySelector('.lg'))return;backAsk('Oxyblox',tl('Quitter le jeu ?','Leave the game?'),tl('Ta partie est enregistrée. Tu retrouveras les autres jeux de Keismey Studio sur le hub.','Your game is saved. You’ll find the other Keismey Studio games on the hub.'),tl('Aller au hub','Go to the hub'),()=>KSBack.toHub(),true);return}
 if(SHEET){closeSheet();return}
 if(MOVE!=null){MOVE=null;renderShip();return}
 if(view==='expe'&&SH){
  if(!SH.started){SH=null;shPtr=null;renderExpe();return}
  if(SH.over)return;
  if(SH.paused)ACT.shResume();else ACT.shPause();
  return;
 }
 if(view!=='planet'){setView('planet');return}
 backAsk('Oxyblox',tl('Retour à l’écran titre ?','Back to the title screen?'),tl('Ta partie est enregistrée.','Your game is saved.'),tl('Écran titre','Title screen'),titleAgain);
}
KSBack.init({back:onBack,lang:()=>LANG==='en'?'en':'fr'});
