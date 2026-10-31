/* ---------- notes de mise à jour (la plus récente en premier) ---------- */
const PATCH_NOTES=[
 {v:'1.0.7',d:['31 octobre 2026','31 October 2026'],fr:['Le voile derrière les fenêtres est plus léger : on voit la planète dès le journal de bord.','Au toucher, plus de cadre autour du premier bouton des fenêtres (il reste au clavier).','Textes des panneaux plus grands (descriptions, conseils, alertes).','Les mises à jour du jeu ne retéléchargent plus les musiques (6 Mo) quand elles n’ont pas changé.'],en:['The veil behind windows is lighter: you can see the planet from the ship’s log onward.','On touch screens, no more outline around a window’s first button (it stays for keyboard users).','Larger text in panels (descriptions, tips, warnings).','Game updates no longer re-download the music (6 MB) when it hasn’t changed.']},
 {v:'1.0.6',d:['31 octobre 2026','31 October 2026'],fr:['Boutons plus faciles à toucher au pouce : Options, Fermer, Renommer, Pause, Plans, langue et volumes.','Clavier : Entrée lance la partie depuis l’écran titre, et le focus reste dans la fenêtre ou le panneau ouvert.','Lecteur d’écran : chaque case du hangar dit ce qu’elle contient.'],en:['Buttons easier to tap with a thumb: Options, Close, Rename, Pause, Blueprints, language and volume.','Keyboard: Enter starts the game from the title screen, and focus stays inside the open window or panel.','Screen reader: each hangar cell says what it holds.']},
 {v:'1.0.5',d:['29 octobre 2026','29 October 2026'],fr:['Options : bouton « Retour au hub », et le même ordre que dans les autres jeux du studio (son, langue, sauvegarde, puis le studio).'],en:['Options: a “Back to the hub” button, in the same order as the studio’s other games (sound, language, save, then the studio).']},
 {v:'1.0.4',d:['26 octobre 2026','26 October 2026'],fr:['Options : crédits du jeu ; « Bruitages » au lieu de « Effets sonores », comme dans les autres jeux du studio.'],en:['Options: game credits.']},
 {v:'1.0.3',d:['19 octobre 2026','19 October 2026'],fr:['Options : sauvegarde à exporter ou importer, signaler un bug, soutenir le studio, retour à l’écran titre.'],en:['Options: save export and import, bug report, support the studio, back to the title screen.']},
 {v:'1.0.2',d:['19 octobre 2026','19 October 2026'],fr:['Le bouton retour du téléphone ne quitte plus le jeu d’un coup : il ferme les fenêtres, met le vol en pause, revient à la planète, puis propose de revenir à l’écran titre. Depuis l’écran titre, il propose d’aller au hub Keismey Studio.'],en:['The phone’s back button no longer leaves the game at once: it closes windows, pauses the flight, returns to the planet, then offers to go back to the title screen. From the title screen, it offers to go to the Keismey Studio hub.']},
 {v:'1.0.1',d:['16 octobre 2026','16 October 2026'],fr:['Nouveau : ces notes de mise à jour, dans les Réglages. Elles s’affichent une fois après chaque mise à jour.'],en:['New: these patch notes, in Settings. They show once after each update.']},
 {v:'1.0',d:['9 octobre 2026','9 October 2026'],fr:['Première version : terraformation de la planète, hangar, missions de vol et colons.'],en:['First release: planet terraforming, the hangar, flight missions and colonists.']},
];

/* ---------- UI génériques ---------- */
function toast(t,k=''){if(SIM)return;const d=document.createElement('div');d.className='tst '+k;d.textContent=t;$('toast').appendChild(d);setTimeout(()=>d.remove(),2900);while($('toast').children.length>3)$('toast').firstChild.remove()}
let lastRes={};
function bumpRes(keys){if(SIM)return;keys.forEach(r=>{const e=$('r-'+r);if(e){e.classList.remove('bump');void e.offsetWidth;e.classList.add('bump')}});renderRes()}
function renderRes(){for(const r in RES){const v=Math.floor((S.res[r]||0)+1e-9);if(lastRes[r]!==v){lastRes[r]=v;const el=$('r-'+r),full=BAL.cap[r]!=null&&v>=BAL.cap[r];el.classList.toggle('full',full);el.title=r==='p'?`${tl('Colons','Colonists')}${tl(' :',':')} ${v} / ${popCap()}`:`${RES[r].n}${tl(' :',':')} ${fmt(v)} / ${fmt(BAL.cap[r])} max`;el.innerHTML=ic(RES[r].i)+`<span>${fmtS(v)}</span>`}}}
let SHEET=null;
function openSheet(kind,arg){const was=!!SHEET;if(!was)sheetBack=modalOpen?modalBack:fKey(document.activeElement);SHEET={kind,arg};sheetHTML='';renderSheet();$('sheet').classList.add('open');$('scrim').classList.add('on');lockFocus();if(!was&&$('modal').hidden)$('sheet').focus({preventScroll:true})}
function closeSheet(){const was=!!SHEET;SHEET=null;$('sheet').classList.remove('open');$('scrim').classList.remove('on');if(!was)return;lockFocus();if($('modal').hidden)focusBackTo(sheetBack);sheetBack=null}
/* clavier : seule la couche du dessus (écran titre, fenêtre, feuille) reçoit le focus ; il revient où il était à la fermeture */
let sheetBack=null,modalBack=null,modalOpen=false;
function lockFocus(){
 const sp=$('spl'),m=!$('modal').hidden,sh=!!SHEET,top=m?$('modal'):sp&&!sp.classList.contains('out')?sp:sh?$('sheet'):null;
 for(const el of $('app').children)el.inert=top?el!==top&&!(el.id==='upd'&&top.id==='sheet'):el.id==='sheet'&&!sh;
}
// cadre de focus seulement au clavier : après un toucher, le focus posé par le jeu sur un bouton reste invisible
addEventListener('pointerdown',e=>{if(e.isTrusted)document.documentElement.classList.remove('kbd')},true);
addEventListener('keydown',e=>{if(/^(Tab|Enter| |Escape|Arrow)/.test(e.key))document.documentElement.classList.add('kbd')},true);
// on retient l'élément et son data-act/data-arg : s'il a été redessiné entre-temps, on retrouve son remplaçant
function fKey(el){return el&&el!==document.body&&el.dataset?{el,act:el.dataset.act,arg:el.dataset.arg}:null}
const focusable=el=>el&&el.focus&&document.contains(el)&&!el.disabled&&!el.closest('[inert],[hidden]');
function focusBackTo(k){if(!k)return;let el=k.el;if(!focusable(el)&&k.act)el=[...document.querySelectorAll('[data-act]')].find(x=>x.dataset.act===k.act&&x.dataset.arg===k.arg&&focusable(x));if(focusable(el))el.focus({preventScroll:true})}
let sheetHold=0,sheetHTML='';
$('sheet').addEventListener('pointerdown',()=>{sheetHold=performance.now()},true);
function renderSheet(auto){if(!SHEET||SIM)return;const f=SHEETS[SHEET.kind];if(!f)return;const h=f(SHEET.arg);if(h===sheetHTML&&$('sheetc').innerHTML)return;if(auto&&performance.now()-sheetHold<800)return;const a=document.activeElement,inS=!!a&&$('sheetc').contains(a);if(auto&&inS)return;sheetHTML=h;const sc=$('sheetc').scrollTop,k=inS?fKey(a):null;$('sheetc').innerHTML=h;$('sheetc').scrollTop=sc;
 const hd=$('sheetc').querySelector('h3,h2');if(hd)$('sheet').setAttribute('aria-label',hd.textContent);else $('sheet').removeAttribute('aria-label');
 if(inS){focusBackTo(k);if(!$('sheet').contains(document.activeElement))$('sheet').focus({preventScroll:true})}}
let modalQ=[];
function modal(o){if(SIM)return;modalQ.push(o);if(modalQ.length===1)showModal()}
function showModal(){const o=modalQ[0];if(!o){$('modal').hidden=true;if(modalOpen){modalOpen=false;lockFocus();focusBackTo(modalBack);modalBack=null;if(SHEET&&!$('sheet').contains(document.activeElement))$('sheet').focus({preventScroll:true})}return}
 if(!modalOpen){modalOpen=true;modalBack=fKey(document.activeElement)}
 $('mbox').innerHTML=`${o.eyebrow?`<div class="eyebrow">${o.eyebrow}</div>`:''}<h2 id="mttl">${o.title}</h2>${o.text?`<p>${o.text}</p>`:''}${o.html||''}<div class="ch">${(o.choices||[{l:'Continuer'}]).map((c,k)=>`<button class="btn ${c.cls||''}" data-mc="${k}" ${c.dis?'disabled':''}>${c.l}</button>`).join('')}</div>`;
 $('modal').hidden=false;lockFocus();const fb=$('mbox').querySelector('[data-mc].ghost:not([disabled])')||$('mbox').querySelector('[data-mc]:not([disabled])');if(fb)fb.focus({preventScroll:true});else $('mbox').focus({preventScroll:true})}
$('mbox').addEventListener('click',e=>{const b=e.target.closest('[data-mc]');if(!b||b.disabled)return;const o=modalQ[0];const c=(o.choices||[{}])[+b.dataset.mc];SFX.click();modalQ.shift();$('modal').hidden=true;if(c&&c.f)c.f();showModal()});
function flash(){const f=$('flash');f.classList.remove('go');void f.offsetWidth;f.classList.add('go')}

/* ---------- objectifs ---------- */
const OBJ=[
 {id:'mineM',t:'Construis une mine de métal sur la planète',en:'Build a metal mine on the planet',chk:()=>plotOf('mineM')>=0,forced:1,tab:'planet'},
 {id:'mineC',t:'Construis un extracteur de cristal',en:'Build a crystal extractor',chk:()=>plotOf('mineC')>=0,forced:1,tab:'planet'},
 {id:'collect',t:'Récupère ta première production : touche la bulle au-dessus d’un bâtiment',en:'Collect your first output: tap the bubble above a building',chk:()=>!!S.flags.collected,forced:1,tab:'planet'},
 {id:'repair',t:'Hangar : touche une case fissurée pour réparer la structure',en:'Hangar: tap a cracked cell to repair the frame',chk:()=>S.ship.cells.filter(c=>c.s==='ok').length>=3,rw:{m:40},tab:'ship'},
 {id:'reac',t:'Installe un réacteur : il alimente les autres modules',en:'Install a reactor: it powers the other modules',chk:()=>shipInfo(S.ship).count.reac>0,rw:{m:40,c:20},tab:'ship'},
 {id:'pilot',t:'Installe un cockpit',en:'Install a cockpit',chk:()=>shipInfo(S.ship).count.pilot>0,rw:{m:40},tab:'ship'},
 {id:'eng',t:'Installe un propulseur',en:'Install a thruster',chk:()=>shipInfo(S.ship).count.eng>0,rw:{c:30},tab:'ship'},
 {id:'laser',t:'Installe un laser',en:'Install a laser',chk:()=>shipInfo(S.ship).count.laser>0,rw:{m:60},tab:'ship'},
 {id:'mission1',t:'Lance ta première mission',en:'Launch your first mission',chk:()=>S.stats.missions>0,rw:{m:80,c:40},tab:'expe'},
 {id:'boss1',t:'Détruis la Sentinelle de Kessler (un 2ᵉ laser aide beaucoup)',en:'Destroy the Kessler Sentinel (a second laser helps a lot)',chk:()=>!!S.cleared[1],rw:{x:2},tab:'expe'},
 {id:'shipName',t:'Baptise ton vaisseau : touche le crayon en haut du hangar',en:'Name your ship: tap the pencil at the top of the hangar',chk:()=>!!S.flags.shipNamed,rw:{c:40},tab:'ship'},
 {id:'atmo',t:'Construis un processeur atmosphérique',en:'Build an atmospheric processor',chk:()=>plotLvl('atmo')>=1,rw:{m:150},tab:'planet'},
 {id:'habitat',t:'Construis un habitat',en:'Build a habitat',chk:()=>plotLvl('habitat')>=1,rw:{c:100},tab:'planet'},
 {id:'stage1',t:'Atteins le palier « Atmosphère ténue » (15 % de viabilité)',en:'Reach the “Thin atmosphere” stage (15% viability)',chk:()=>stageOf(viab())>=1,rw:{x:3},tab:'planet'},
 {id:'planetName',t:'La planète revit : donne-lui un nom avec le crayon',en:'The planet is waking up: give it a name with the pencil',chk:()=>!!S.flags.planetNamed,rw:{m:100},tab:'planet'},
 {id:'colonists',t:'Accueille tes premiers colons',en:'Welcome your first colonists',chk:()=>S.res.p>=1,rw:{m:150,c:100},tab:'planet'},
 {id:'upgrade',t:'Améliore un module au niveau 2 (4 colons requis, jamais consommés)',en:'Upgrade a module to level 2 (needs 4 colonists, never spent)',chk:()=>!!S.flags.upgraded,rw:{x:2},tab:'ship'},
 {id:'move',t:'Déplace un module : touche-le, puis « Déplacer »',en:'Move a module: tap it, then “Move”',chk:()=>!!S.flags.moved,rw:{c:60},tab:'ship'},
 {id:'yard',t:'Construis le chantier orbital',en:'Build the orbital shipyard',chk:()=>plotLvl('yard')>=1,rw:{m:200,c:150},tab:'planet'},
 {id:'shape',t:'Donne une forme triangulaire à une pièce : plus dure à toucher, un peu moins efficace',en:'Give a part a triangular shape: harder to hit, slightly less efficient',chk:()=>!!S.flags.shaped,rw:{c:150},tab:'ship'},
 {id:'plan',t:'Hangar : enregistre ton vaisseau dans un plan',en:'Hangar: save your ship to a blueprint',chk:()=>S.plans.some(Boolean),rw:{m:150},tab:'ship'},
 {id:'boss2',t:'Détruis le Gardien d’Orsa',en:'Destroy the Orsa Warden',chk:()=>!!S.cleared[2],rw:{x:4},tab:'expe'},
 {id:'water',t:'Construis un condenseur d’eau',en:'Build a water condenser',chk:()=>plotLvl('water')>=1,rw:{m:300,c:200},tab:'planet'},
 {id:'stage2',t:'Atteins le palier « Premières pluies »',en:'Reach the “First rains” stage',chk:()=>stageOf(viab())>=2,rw:{x:4},tab:'planet'},
 {id:'boss3',t:'Détruis le Léviathan de Vael',en:'Destroy the Vael Leviathan',chk:()=>!!S.cleared[3],rw:{x:6},tab:'expe'},
 {id:'bio',t:'Construis des serres d’ensemencement',en:'Build the seeding greenhouses',chk:()=>plotLvl('bio')>=1,rw:{m:500,c:400},tab:'planet'},
 {id:'stage3',t:'Atteins le palier « Premiers lichens »',en:'Reach the “First lichens” stage',chk:()=>stageOf(viab())>=3,rw:{x:6},tab:'planet'},
 {id:'boss4',t:'Détruis le Colosse de la Frontière',en:'Destroy the Frontier Colossus',chk:()=>!!S.cleared[4],rw:{x:8},tab:'expe'},
 {id:'viable',t:'Rends § viable',en:'Make § viable',chk:()=>stageOf(viab())>=4,rw:{x:10},tab:'planet'},
 {id:'boss5',t:'Détruis le Cœur xéno',en:'Destroy the Xeno Core',chk:()=>!!S.cleared[5],rw:{x:10},tab:'expe'},
 {id:'arena',t:'Établis un score dans la Zone infinie',en:'Set a score in the Endless Zone',chk:()=>S.arena.runs>0,tab:'expe'}
];
const OBJ_OLD=['mineM','mineC','collect','repair','reac','pilot','eng','laser','mission1','boss1','atmo','habitat','stage1','colonists','upgrade','yard','shape','boss2','water','stage2','boss3','bio','stage3','boss4','viable','boss5','arena'];
const objIdx=id=>{const k=OBJ.findIndex(o=>o.id===id);return k<0?OBJ.length:k};
const inTuto=()=>S.obj<3;
function checkObj(){
 let n=0;
 while(S.obj<OBJ.length&&OBJ[S.obj].chk()&&n++<30){const o=OBJ[S.obj];S.obj++;if(o.rw){gain(o.rw);toast(tl('Objectif rempli · récompense reçue','Objective complete · reward received'),'ok')}else toast(tl('Objectif rempli','Objective complete'),'ok');
  if(!SIM){SFX.done();$('obj').classList.remove('done');void $('obj').offsetWidth;$('obj').classList.add('done')}if(S.obj===3)toast(tl('Le hangar et les missions sont débloqués','Hangar and missions unlocked'),'amb');renderNav()}
 renderObj();
}
function renderObj(){if(SIM)return;
 const el=$('obj');
 if(S.obj>=OBJ.length){el.innerHTML=`<div class="ot"><b>${tl('Tous les objectifs remplis','All objectives complete')}</b>${tl('Bats ton record dans la Zone infinie.','Beat your record in the Endless Zone.')}</div>`;return}
 const o=OBJ[S.obj];
 el.innerHTML=`<div class="ot"><b>${o.forced?tl('Tutoriel','Tutorial'):tl('Objectif','Objective')} · ${S.obj+1}/${OBJ.length}</b>${pt(o.t)}</div>${o.rw?`<div class="rw">${Object.keys(o.rw).map(r=>`<span class="${RES[r].cl}" style="display:inline-flex;align-items:center;gap:2px">${ic(RES[r].i)}${o.rw[r]}</span>`).join('')}</div>`:''}`;
}

/* ---------- navigation ---------- */
let view='planet';
function renderNav(){if(SIM)return;
 [['planet','planet',tl('Planète','Planet')],['ship','ship','Hangar'],['expe','map','Missions']].forEach(([k,i,l])=>{const b=$('t-'+k);b.className=view===k?'on':'';b.disabled=inTuto()&&k!=='planet';
  const dot=!inTuto()&&OBJ[S.obj]&&OBJ[S.obj].tab===k&&view!==k;b.innerHTML=ic(i)+l+(dot?'<span class="dot"></span>':'')});
}
function setView(v){
 if(inTuto()&&v!=='planet')return;
 if(SH&&view==='expe'&&v!=='expe'&&SH.started&&!SH.over){SH.paused=true}
 view=v;['planet','ship','expe'].forEach(k=>$('v-'+k).hidden=k!==v);
 closeSheet();if(v!=='ship')MOVE=null;renderNav();
 if(v==='planet'){sizePlanet();renderPlots(true);renderTerra();fitPName()}if(v==='ship'){renderShip();tipOnce('hangar')}if(v==='expe')renderExpe();
}

/* ---------- feuilles planète ---------- */
Object.assign(SHEETS,{
 pempty:i=>{
  const used=new Set(S.plots.filter(Boolean).map(p=>p.id));
  const allowed=inTuto()?[['mineM','mineC'][S.obj]].filter(Boolean):PB_ORDER;
  const items=PB_ORDER.filter(id=>!used.has(id)).map(id=>{const b=PB[id],c=pCost(id,0),why=!allowed.includes(id)?tl('Suis d’abord le tutoriel.','Follow the tutorial first.'):pReq(id)||(S.cons?tl('Un chantier est déjà en cours.','A construction is already underway.'):null);const can=!why&&canPay(c);
   const info=b.res?`${id==='labX'?f2(prod(id,1)):f1(prod(id,1))} ${RES[b.res].n}/min`:id==='habitat'?tl(`${BAL.habCap} places × ${Math.round(viab())} % de viabilité`,`${BAL.habCap} berths × ${Math.round(viab())}% viability`):b.vp?tl(`+${b.vp} % de viabilité par niveau`,`+${b.vp}% viability per level`):'';
   return`<div class="li ${why?'lock':''}"><div class="lic">${bsvg(id)}</div><div><h4>${b.n}</h4><p>${pt(b.d)}</p>${info?`<div class="kv"><div><span>${tl('Effet','Effect')}</span><b style="font-size:13px">${info}</b></div></div>`:''}<div class="row" style="justify-content:space-between;margin-top:8px">${costHTML(c)}<span class="cost">${ic('wrench')}${fmtT(pTime(id,0)/SPD())}</span></div>${why?`<div class="why">${why}</div>`:''}<div class="row"><button class="btn" data-act="buildP" data-arg="${i}:${id}" ${can?'':'disabled'}>${tl('Construire','Build')}</button></div></div></div>`}).join('');
  return`<div class="sh-h"><div class="big" style="background:#ffffff08">${ic('planet')}</div><div><h3>${tl('Emplacement libre','Free plot')}</h3><p>${tl('Surface de','Surface of')} ${PN()} · zone ${+i+1}</p></div></div><div class="list">${items||`<p class="desc">${tl('Tous les bâtiments sont construits.','Every building is built.')}</p>`}</div>`},
 pbuild:i=>{
  const p=S.plots[i],b=PB[p.id],cons=S.cons&&S.cons.p===i,c=pCost(p.id,p.lvl),max=p.lvl>=b.max;let kv='';
  if(b.res){const pr=prod(p.id,p.lvl),nx=prod(p.id,p.lvl+1);kv=`<div class="kv"><div><span>${tl('Production','Output')}</span><b>${p.id==='labX'?f2(pr):fmt(pr)}/min${!max?` <span class="up">→ ${p.id==='labX'?f2(nx):fmt(nx)}</span>`:''}</b></div><div><span>${tl('En attente','Waiting')}</span><b class="${RES[b.res].cl}">${fmt(p.buf)} / ${fmt(bufCap(p))}</b></div></div><p class="tip">${tl(`Le stock s’accumule en ton absence pendant ${capH()} h.`,`Output keeps stockpiling for ${capH()} h while you are away.`)}</p>`}
  if(p.id==='habitat'){const cap=popCap();kv=`<div class="kv"><div><span>${tl('Places','Berths')}</span><b>${BAL.habCap*p.lvl}${!max?` <span class="up">→ ${BAL.habCap*(p.lvl+1)}</span>`:''}</b></div><div><span>${tl(`Habitables (${Math.round(viab())} % de viabilité)`,`Livable (${Math.round(viab())}% viability)`)}</span><b>${cap}</b></div><div><span>${tl('Colons','Colonists')}</span><b class="r-p">${Math.floor(S.res.p)} / ${cap}</b></div><div><span>${tl('Arrivées','Arrivals')}</span><b>${S.res.p<cap?f1(popRate()*60)+'/h':tl('complet','full')}</b></div></div>${viab()<=0?`<div class="why">${tl('Aucun colon ne viendra tant que la planète est morte : construis un processeur atmosphérique.','No colonist will come while the planet is dead: build an atmospheric processor.')}</div>`:''}`}
  if(b.vp)kv=`<div class="kv"><div><span>${tl('Viabilité apportée','Viability added')}</span><b>${b.vp*p.lvl}${PCT()}${!max?` <span class="up">→ ${b.vp*(p.lvl+1)}${PCT()}</span>`:''}</b></div><div><span>${tl('Viabilité totale','Total viability')}</span><b>${Math.round(viab())}${PCT()}</b></div></div>`;
  if(p.id==='yard')kv=`<div class="kv">${[1,2,3,4].map(l=>`<div><span>${tl('Niveau','Level')} ${l}</span><b style="font-family:var(--f-body);font-size:13px;max-width:72%;color:${p.lvl>=l?'var(--green)':'var(--dim)'}">${YARD_TXT[l]}</b></div>`).join('')}</div>`;
  if(p.id==='depot')kv=`<div class="kv"><div><span>${tl('Stock hors-ligne','Offline storage')}</span><b>${capH()} h${!max?` <span class="up">→ ${capH()+2} h</span>`:''}</b></div></div>`;
  let act='';
  if(cons)act=`<div class="kv"><div><span>${p.lvl?tl('Amélioration en cours','Upgrading'):tl('Construction en cours','Under construction')}</span><b>${fmtT((S.cons.end-Date.now())/1000)}</b></div><div class="bar"><i style="width:${consProg()*100}%"></i></div></div>${S.test?`<button class="btn ghost wide" data-act="finishCons">${tl('Terminer (mode test)','Finish (test mode)')}</button>`:''}`;
  else if(max)act=`<p class="desc" style="color:var(--green)">${tl('Niveau maximum atteint.','Maximum level reached.')}</p>`;
  else{const why=S.cons?tl('Un autre chantier est en cours.','Another construction is underway.'):null;act=`<div class="sep"></div><div class="row" style="justify-content:space-between"><b style="font:700 15px var(--f-disp)">${tl('Niveau','Level')} ${p.lvl+1}</b><span class="cost">${ic('wrench')}${fmtT(pTime(p.id,p.lvl)/SPD())}</span></div>${costHTML(c)}${why?`<div class="why">${why}</div>`:''}<button class="btn wide" data-act="upP" data-arg="${i}" ${!why&&canPay(c)?'':'disabled'}>${tl('Améliorer','Upgrade')}</button>`}
  const col=b.res&&p.buf>=1&&!cons?`<button class="btn cyan wide" data-act="collect" data-arg="${i}">${ic(RES[b.res].i)}${tl('Récupérer','Collect')} ${fmt(p.buf)} ${RES[b.res].n}</button>`:'';
  return`<div class="sh-h"><div class="big" style="background:#ffffff08">${bsvg(cons&&!p.lvl?'cons':p.id)}</div><div><h3>${b.n}</h3><p>${p.lvl?`${tl('Niveau','Level')} ${p.lvl} / ${b.max}`:tl('En construction','Under construction')}</p></div></div><p class="desc">${pt(b.d)}</p>${kv}${col}${act}`},
 terra:()=>{const v=viab(),st=stageOf(v),nx=STAGES[st+1],hab=plotLvl('habitat');
  const rows=['atmo','water','bio'].map(id=>`<div><span>${PB[id].n}</span><b>${PB[id].vp*plotLvl(id)}${PCT()} <span style="color:var(--dim)">/ ${PB[id].vp*5}${PCT()}</span></b></div>`).join('');
  return`<div class="sh-h"><div class="big" style="background:#0f2a1c;color:var(--green)">${ic('leaf')}</div><div><h3>${tl('Viabilité de','Viability of')} ${PN()}</h3><p>${tl('Palier','Stage')} ${st}/4 · ${STAGES[st].n}</p></div></div>
  <p class="desc">${tl('Les colons n’arrivent qu’une fois la planète assez viable (premier palier). Ils ne se dépensent pas : leur nombre débloque les niveaux supérieurs des modules et les modules avancés. On ne les trouve pas en mission.','Colonists only arrive once the planet is viable enough (first stage). They are never spent: their number unlocks higher module levels and advanced modules. Missions never bring any.')}</p>
  <div style="display:flex;flex-direction:column;gap:5px"><div style="display:flex;justify-content:space-between"><span style="color:var(--green)">${tl('Viabilité','Viability')}</span><b style="font:15px var(--f-mono)">${Math.round(v)}${PCT()}</b></div><div class="bar" style="height:10px"><i style="width:${v}%;background:linear-gradient(90deg,#ffb35a,#62d6e8 45%,#7fdc95)"></i></div></div>
  <div class="kv">${rows}</div>
  <div class="kv"><div><span>Habitats</span><b>${tl(`niveau ${hab} · ${BAL.habCap*hab} places`,`level ${hab} · ${BAL.habCap*hab} berths`)}</b></div><div><span>${tl('Colons','Colonists')}</span><b class="r-p">${Math.floor(S.res.p)} / ${popCap()}</b></div><div><span>${tl('Arrivées','Arrivals')}</span><b>${hab?(S.res.p<popCap()?f1(popRate()*60)+'/h':tl('complet','full')):'—'}</b></div></div>
  <div class="kv">${[2,3,4,5].map(l=>`<div><span>${tl('Module niveau','Module level')} ${l}</span><b>${BAL.crewReq[l]} ${RES.p.n}</b></div>`).join('')}</div>
  ${nx?`<p class="desc">${tl(`<b>Prochain palier : ${nx.n}</b> à ${BAL.stageV[st+1]} % de viabilité.`,`<b>Next stage: ${nx.n}</b> at ${BAL.stageV[st+1]}% viability.`)}</p>`:`<p class="desc" style="color:var(--green)">${tl(`${PN()} est viable.`,`${PN()} is viable.`)}</p>`}`},
 notes:()=>{S.pnV=VERSION;return `<div class="sh-h"><div class="big" style="background:#ffffff08">${ic('gear')}</div><div><h3>${tl('Notes de mise à jour','Patch notes')}</h3><p>Oxyblox · v${VERSION}</p></div></div>
  ${PATCH_NOTES.map((n,i)=>`<details${i?'':' open'} style="margin-bottom:8px"><summary style="cursor:pointer"><b>${tl('Version','Version')} ${n.v}</b> · ${tl(n.d[0],n.d[1])}</summary><ul style="margin:6px 0 0;padding-left:20px">${(LANG==='en'?n.en:n.fr).map(l=>`<li class="desc" style="margin-bottom:4px">${l}</li>`).join('')}</ul></details>`).join('')}
  <button class="btn ghost wide" data-act="settings">${tl('Retour aux options','Back to options')}</button>`},
 settings:()=>`<div class="sh-h"><div class="big" style="background:#ffffff08">${ic('gear')}</div><div><h3>${tl('Options','Options')}</h3><p>Oxyblox · v${VERSION}${DEV?' (prototype)':''} · Keismey Studio</p></div></div>
  ${[['mus',tl('Musique','Music')],['sfx',tl('Bruitages','Sound effects')]].map(([k,l])=>`<label class="volr"><span>${l}</span><input type="range" id="vol-${k}" min="0" max="100" step="5" value="${Math.round(S.vol[k]*100)}" data-vol="${k}"><output>${Math.round(S.vol[k]*100)}${PCT()}</output></label>`).join('')}
  <div class="volr"><span>${tl('Langue','Language')}</span><div class="seg2" style="grid-column:span 2"><button class="${LANG==='fr'?'on':''}" data-act="lang" data-arg="fr">Français</button><button class="${LANG==='en'?'on':''}" data-act="lang" data-arg="en">English</button></div></div>
  ${DEV?`<button class="tog" data-act="togTest"><span>${tl('Mode test','Test mode')}<small>${tl('Production et chantiers ×20, Zone infinie ouverte, bouton pour finir les chantiers.','Output and construction ×20, Endless Zone open, button to finish constructions.')}</small></span><span class="sw ${S.test?'on':''}"></span></button>
  ${S.test?`<button class="btn ghost wide" data-act="testRes">${tl('+5 000 métal et cristal, +100 xéno','+5,000 metal and crystal, +100 xeno')}</button><button class="btn ghost wide" data-act="testTerra">${tl('Planète viable et habitats pleins','Viable planet and full habitats')}</button><button class="btn ghost wide" data-act="testBp">${tl('Débloquer tous les schémas et secteurs','Unlock all schematics and sectors')}</button>`:''}`:''}
  <button class="btn ghost wide" data-act="saveIo">${tl('Sauvegarde : exporter, importer','Save: export, import')}</button>
  <button class="btn ghost wide" data-act="notes">${tl('Notes de mise à jour','Patch notes')}</button>
  <button class="btn ghost wide" data-act="toTitle">${tl('Écran titre','Title screen')}</button>
  <button class="btn ghost wide" data-act="bug">${tl('Signaler un bug','Report a bug')}</button>
  <button class="btn ghost wide" data-act="support">${tl('Soutenir le studio','Support the studio')}</button>
  <button class="btn ghost wide" data-act="toHub">${tl('Retour au hub','Back to the hub')}</button>
  <div class="sep"></div>
  <button class="btn red wide" data-act="reset">${SHEET&&SHEET.confirm==='reset'?tl('Confirmer : tout effacer','Confirm: erase everything'):tl('Recommencer une partie','Start a new game')}</button>
  <p style="text-align:center;font-size:12px;opacity:.6;margin:12px 0 0">${tl('Conception et direction : Keismey · Développé avec l’aide d’outils IA','Design and direction: Keismey · Developed with the help of AI tools')}</p>`
});

/* ---------- actions ---------- */
Object.assign(ACT,{
 tab:v=>{SFX.click();setView(v)},
 closeSheet:()=>closeSheet(),
 objGo:()=>{const o=OBJ[S.obj];if(o&&o.tab&&!inTuto())setView(o.tab)},
 plot:i=>{SFX.click();openSheet(S.plots[+i]?'pbuild':'pempty',+i)},
 collect:i=>{collect(+i);renderPlots(true);checkObj()},
 collectAll:()=>{let n=0;S.plots.forEach((p,i)=>{if(p&&PB[p.id].res)n+=collect(i,true)});if(!n){SFX.err();toast(tl('Stocks pleins : rien n’a pu être récupéré','Storage full: nothing could be collected'),'bad');renderPlots(true);return}SFX.collect();bumpRes(['m','c','x']);toast(tl('Cargaisons reçues dans la baie','Cargo received in the bay'),'ok');renderPlots(true);checkObj()},
 buildP:a=>{const[i,id]=a.split(':');const c=pCost(id,0);if(S.cons){toast(tl('Un chantier est déjà en cours','A construction is already underway'),'bad');SFX.err();return}if(!canPay(c)||pReq(id)){SFX.err();return}
  pay(c);S.plots[+i]={id,lvl:0,buf:0};startCons(+i);SFX.build();closeSheet();renderPlots(true)},
 upP:i=>{const p=S.plots[+i];const c=pCost(p.id,p.lvl);if(S.cons||!canPay(c)){SFX.err();return}pay(c);startCons(+i);SFX.build();renderPlots(true);renderSheet()},
 finishCons:()=>{if(!DEV)return;if(S.cons){S.cons.end=Date.now()-1;econ(0)}},
 terra:()=>{SFX.click();openSheet('terra')},
 settings:()=>{SFX.click();openSheet('settings')},
 saveIo:()=>{SFX.click();save();KS.saveDialog({lang:LANG,keys:[KEY],save,file:'oxyblox',accent:'#f2b544'})},
 bug:()=>KS.bug('Oxyblox',LANG),
 support:()=>KS.support(),
 toTitle:()=>{closeSheet();titleAgain()},
 toHub:()=>{save();KSBack.toHub()},
 notes:()=>{SFX.click();openSheet('notes');save()},
 togTest:()=>{if(!DEV)return;S.test=!S.test;renderSheet();toast(S.test?tl('Mode test activé','Test mode on'):tl('Mode test désactivé','Test mode off'),'amb');if(view==='expe')renderExpe();if(view==='ship')renderShip()},
 testRes:()=>{if(!DEV)return;gain({m:5000,c:5000,x:100});toast(tl('Ressources de test ajoutées','Test resources added'),'amb')},
 testTerra:()=>{if(!DEV)return;const put=(id,L)=>{let i=plotOf(id);if(i<0)i=S.plots.findIndex(p=>!p);if(i<0)return;S.plots[i]={id,lvl:L,buf:0}};put('atmo',5);put('water',5);put('bio',5);put('habitat',10);S.res.p=popCap();pTex=null;planetTex();plotSig='';renderPlots(true);renderTerra();renderSheet();toast(tl('Planète viable, 120 colons','Viable planet, 120 colonists'),'amb')},
 testBp:()=>{if(!DEV)return;[1,2,3,4,5].forEach(k=>S.cleared[k]=1);toast(tl('Schémas et secteurs débloqués','Schematics and sectors unlocked'),'amb');checkObj()},
 reset:()=>{if(SHEET.confirm!=='reset'){SHEET.confirm='reset';renderSheet();return}try{localStorage.removeItem(KEY)}catch(e){}S=newGame();SH=null;MOVE=null;closeSheet();lastRes={};pTex=null;renderAll();setView('planet');intro()},
 lang:l=>{SFX.click();setLang(l)},
 resInfo:r=>{const d={m:tl('Mines de la planète et missions. Sert à tout construire.','From planet mines and missions. Used to build everything.'),c:tl('Extracteurs de la planète et missions. Sert à tout construire.','From planet extractors and missions. Used to build everything.'),x:tl('Composants rares lâchés en mission, puis produits par le synthétiseur. Pour les modules avancés et les hauts niveaux.','Rare components dropped in missions, later made by the synthesizer. For advanced modules and high levels.'),p:tl(`Arrivent selon les habitats et la viabilité (max ${popCap()}). Jamais consommés : c’est un seuil requis.`,`Arrive based on habitats and viability (max ${popCap()}). Never spent: they are a threshold.`)}[r];const n=RES[r].n;toast(`${n[0].toUpperCase()+n.slice(1)} · ${d}`,'')},
 sector:s=>startMission('mission',+s),
 arena:()=>startMission('arena',0),
 skill:id=>useSkill(id),
 shStart:()=>{if(!SH)return;SH.started=true;SH.paused=false;SFX.jump();shOverlay()},
 shPause:()=>{if(!SH||SH.over||!SH.started)return;SH.paused=true;SFX.click();shOverlay()},
 shResume:()=>{if(!SH)return;SH.paused=false;shOverlay()},
 shRetreat:()=>{if(!SH)return;finishMission(SH.mode==='arena'?'arenaEnd':'retreat')}
});
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el||el.disabled)return;const f=ACT[el.dataset.act];if(f){e.stopPropagation();f(el.dataset.arg,el)}});

/* ---------- vue missions ---------- */
const recDps=T=>[0,4,12,35,60,110][T]||0;
function renderExpe(){
 const el=$('v-expe');
 if(SH){renderMissionDOM();return}
 const I=shipInfo(S.ship),ok=!I.reasons.length;
 const open=s=>s===1||!!S.cleared[s-1]||S.test;
 el.innerHTML=`<div class="exwrap"><div class="vt"><b>Missions</b><span>${tl('Les missions sont gratuites : rejoue-les pour compléter tes ressources. Les colons, eux, viennent uniquement de la planète.','Missions are free: replay them to top up your resources. Colonists, though, only come from the planet.')}</span></div>
 ${ok?'':`<div class="warn">${I.reasons.map(r=>`<span>${r}</span>`).join('')}</div>`}
 <div class="panel" style="flex-direction:row;justify-content:space-around;text-align:center"><div class="stat"><span>${esc(S.ship.name)}</span><b>${f1(I.dps)} ${DPS()}</b></div><div class="stat"><span>${tl('Coque','Hull')}</span><b>${I.hull}</b></div><div class="stat"><span>${tl('Soute','Cargo')}</span><b>${I.cargo}</b></div></div>
 ${[1,2,3,4,5].map(s=>{const sc=SEC[s],o=open(s),rd=recDps(sc.T),weak=I.dps<rd;const bps=MD_ORDER.filter(id=>MD[id].bp===s).map(id=>MD[id].n);
  return`<div class="sec s${((s-1)%3)+1} ${o?'':'lock'}" style="background:linear-gradient(90deg,#0b1120f5 30%,#0b1120b3),url(${SEC_BG[s-1]}) center 30%/cover">${S.cleared[s]?`<span class="badge">${tl('Nettoyé','Cleared')}</span>`:''}<h3>${s}. ${sc.n}</h3><p>${sc.d}</p><div class="meta"><span>Danger ${'◆'.repeat(sc.T)}${'◇'.repeat(5-sc.T)}</span><span style="${weak?'color:#ffb27a':''}">${tl('Conseillé :','Recommended:')} ${rd} ${DPS()}</span><span>${tl('Butin','Loot')} ×${f1(Math.pow(BAL.loot,sc.T-1))}</span></div>
  ${bps.length&&!S.cleared[s]?`<p style="font-size:13px;color:var(--amber2)">${ic('lock')} ${tl('Schémas sur le gardien :','Guardian schematics:')} ${bps.join(', ')}</p>`:''}
  ${o?`<button class="btn" data-act="sector" data-arg="${s}" ${ok?'':'disabled'}>${ic('jump')}${S.cleared[s]?tl('Rejouer la mission','Replay mission'):tl('Lancer la mission','Launch mission')}</button>`:`<div class="why">${ic('lock')} ${tl(`Détruis d’abord le gardien du secteur ${s-1}.`,`Destroy the sector ${s-1} guardian first.`)}</div>`}</div>`}).join('')}
 <div class="sec s3 ${arenaOpen()?'':'lock'}"><h3>${ic('inf')} ${tl('Zone infinie','Endless Zone')}</h3><p>${tl('Des vagues sans fin de plus en plus dures, un multiplicateur qui grimpe tant que tu n’es pas touché. Pas de butin : seulement le score. Choisis ton vaisseau de campagne ou ton vaisseau d’arène, où tout est débloqué.','Endless, ever-harder waves and a multiplier that climbs as long as you aren’t hit. No loot: just the score. Pick your campaign ship or your arena ship, where everything is unlocked.')}</p>
  <div class="recs"><div><span>${tl('Vaisseau de campagne','Campaign ship')}</span><b>${fmt(S.arena.bestC||0)}</b><small>${tl('survie','survival')} ${fmtT(S.arena.bestTC||0)}</small></div><div><span>${tl('Vaisseau d’arène','Arena ship')}</span><b>${fmt(S.arena.bestA||0)}</b><small>${tl('survie','survival')} ${fmtT(S.arena.bestTA||0)}</small></div></div>
  ${arenaOpen()?`<div class="seg2"><button class="${S.arenaPick!=='arena'?'on':''}" data-act="editMode2" data-arg="camp">${tl('Vaisseau de campagne','Campaign ship')}</button><button class="${S.arenaPick==='arena'?'on':''}" data-act="editMode2" data-arg="arena">${tl('Vaisseau d’arène','Arena ship')}</button></div><button class="btn" data-act="arena">${ic('inf')}${tl('Entrer dans la Zone infinie','Enter the Endless Zone')}</button>`:`<div class="why">${ic('lock')} ${tl('Détruis le Cœur xéno pour l’ouvrir.','Destroy the Xeno Core to open it.')}</div>`}</div>
 </div>`;
}
ACT.editMode2=m=>{S.arenaPick=m;SFX.click();renderExpe()};
function startMission(mode,sec){
 const ar=mode==='arena'&&S.arenaPick==='arena',ship=ar?S.arenaShip:S.ship,I=shipInfo(ship);
 if(I.reasons.length){toast(I.reasons[0],'bad');SFX.err();if(ar){S.edit='arena';setView('ship')}return}
 const r=$('v-expe').getBoundingClientRect();
 SH=mkSH(mode,sec,I,r.width||390,r.height||600);SH.kind=ar?'A':'C';bgSet(mode==='arena'?1:sec,true);
 save();setView('expe');
}
function renderMissionDOM(){
 const el=$('v-expe');
 el.innerHTML=`<div id="shwrap"><canvas id="shc"></canvas>
  <div class="shtop"><button class="btn sm ghost shpb" data-act="shPause" aria-label="Pause">${ic('pause')}</button>
   <div class="col"><div class="cbline"><div class="bar gr seg" id="shh"><i></i></div><span class="num" id="shhn"></span></div>
   <div class="cbline"><div class="shp" id="shs"></div><div class="bar" id="shp" style="height:6px"><i></i></div><span id="shpl" style="font:12px var(--f-mono);color:var(--dim)"></span></div></div></div>
  <div class="shloot" id="shl"></div>${SH.mode==='arena'?'<div class="mult" id="shm"></div>':''}
  <div class="shbot"><div class="cbline"><span style="font:700 11px var(--f-disp);letter-spacing:.1em;color:var(--amber2)">${tl('ÉNERGIE','ENERGY')}</span><div class="bar" id="shn" style="height:6px"><i style="background:var(--amber2)"></i></div></div><div class="skills" id="shk"></div></div>
  <div class="ovl" id="shov" hidden></div></div>`;
 SH.cv=$('shc');SH.cx=SH.cv.getContext('2d');sizeSH(true);
 SH.cv.addEventListener('pointerdown',shDown);SH.cv.addEventListener('pointermove',shMove);SH.cv.addEventListener('pointerup',shUp);SH.cv.addEventListener('pointercancel',shUp);
 $('shk').innerHTML=SH.ship.skills.map(k=>`<button class="sk" data-act="skill" data-arg="${k.id}" id="sk-${k.id}"><i class="fill"></i>${ic(k.i)}<span>${k.n}</span><small>${k.cost}</small></button>`).join('');
 shOverlay();shHud(true);
}
function sizeSH(init){
 if(!SH||!SH.cv)return;const r=SH.cv.getBoundingClientRect();if(r.width<10)return;const oW=SH.W;
 SH.W=r.width;SH.H=r.height;SH.cv.width=r.width*DPR;SH.cv.height=r.height*DPR;
 if(oW&&oW!==SH.W)SH.x=SH.x*SH.W/oW;if(init&&!SH.started){SH.x=SH.W/2;SH.y=SH.H*.74}
 SH.x=clamp(SH.x,SH.ship.half+4,SH.W-SH.ship.half-4);SH.y=clamp(SH.y,100-SH.ship.top,SH.H-110);
}
let shPtr=null;
function shDown(e){if(!SH||SH.paused||SH.over)return;shPtr={id:e.pointerId,x:e.clientX,y:e.clientY};try{SH.cv.setPointerCapture(e.pointerId)}catch(_){}}
function shMove(e){if(!shPtr||e.pointerId!==shPtr.id||!SH)return;SH.pend.x+=(e.clientX-shPtr.x)*1.15;SH.pend.y+=(e.clientY-shPtr.y)*1.15;shPtr.x=e.clientX;shPtr.y=e.clientY}
function shUp(e){if(shPtr&&e.pointerId===shPtr.id)shPtr=null}
function shOverlay(){
 const o=$('shov');if(!o||!SH)return;const ar=SH.mode==='arena';
 if(!SH.started){o.hidden=false;o.innerHTML=`<div class="mbox"><div class="eyebrow">${esc(SH.ship.name||'')} · ${ar?tl('Zone infinie','Endless Zone'):SEC[SH.sec].n}</div><h2>${ar?tl('Jusqu’où iras-tu ?','How far will you go?'):tl('Prêt au décollage','Ready for launch')}</h2><p>${matchMedia('(hover:hover) and (pointer:fine)').matches?tl('Pilote à la souris (clic maintenu) ou au clavier : flèches ou ZQSD, 1 à 4 pour les compétences, Échap pour la pause.','Fly with the mouse (hold click) or the keyboard: arrows or WASD, 1 to 4 for skills, Esc to pause.'):tl('Fais glisser ton doigt n’importe où pour piloter.','Drag your finger anywhere to fly.')} ${tl('Le tir est automatique.','Firing is automatic.')} ${ar?tl('Chaque ennemi rapporte des points, multipliés tant que tu n’es pas touché.','Each enemy scores points, multiplied as long as you aren’t hit.'):tl('Ramasse le butin, puis détruis le gardien qui arrive en fin de mission. En pause, tu peux battre en retraite en gardant le butin.','Grab the loot, then destroy the guardian that shows up at the end. From the pause menu you can retreat and keep the loot.')}</p>${SH.ship.skills.length?`<p style="font-size:14px;color:var(--dim)">${tl('Les compétences en bas à droite consomment de l’énergie.','The skills at the bottom right use energy.')}</p>`:''}<div class="ch"><button class="btn" data-act="shStart">${ic('jump')}${tl('Décoller','Launch')}</button></div></div>`;return}
 if(SH.paused&&!SH.over){o.hidden=false;o.innerHTML=`<div class="mbox"><div class="eyebrow">Pause</div><h2>${ar?tl('Partie en pause','Game paused'):tl('Mission en pause','Mission paused')}</h2><p>${ar?`Score${tl(' :',':')} ${fmt(SH.score)}`:`${tl('Butin à bord :','Loot on board:')} ${SH.cargo.m} ${RES.m.n}, ${SH.cargo.c} ${RES.c.n}, ${SH.cargo.x} ${RES.x.n}.`}</p><div class="ch"><button class="btn" data-act="shResume">${ic('play')}${tl('Reprendre','Resume')}</button><button class="btn ghost" data-act="shRetreat">${ic('home')}${ar?tl('Arrêter et enregistrer le score','Stop and save the score'):tl('Battre en retraite avec le butin','Retreat with the loot')}</button></div></div>`;return}
 o.hidden=true;
}
let shHudT=0;
function shHud(force){
 if(SIM)return;const now=performance.now();if(!force&&now-shHudT<100)return;shHudT=now;if(!$('shwrap')||!SH)return;
 const s=SH,sh=s.ship,ar=s.mode==='arena';
 const hb=$('shh');hb.style.setProperty('--sw',`calc(100% / ${Math.min(60,sh.hullMax)})`);hb.firstChild.style.width=(s.hull/sh.hullMax*100)+'%';$('shhn').textContent=`${s.hull}/${sh.hullMax}`;
 $('shs').innerHTML=Array.from({length:Math.min(8,sh.lay)},(_,k)=>`<i class="${k<s.sh?'on':''}"></i>`).join('');
 const pb=$('shp');if(s.boss){pb.className='bar rd';pb.firstChild.style.width=Math.max(0,s.boss.hp/s.boss.max*100)+'%';$('shpl').textContent=tl('Gardien','Guardian')}
 else if(ar){pb.className='bar';pb.firstChild.style.width=Math.min(100,(s.t%150)/150*100)+'%';$('shpl').textContent='Zone '+(s.zone+1)}
 else{pb.className='bar';pb.firstChild.style.width=Math.min(100,s.t/s.D*100)+'%';$('shpl').textContent=Math.round(Math.min(100,s.t/s.D*100))+PCT()}
 $('shl').innerHTML=ar?`<span class="chip" style="color:var(--amber2)">${ic('trophy')}${fmt(s.score)}</span><span class="chip">${fmtT(s.t)}</span>`:`<span class="chip">${ic('cargo')}${s.cargo.m+s.cargo.c}/${sh.cargo}</span><span class="chip r-m">${ic('metal')}${s.cargo.m}</span><span class="chip r-c">${ic('crystal')}${s.cargo.c}</span><span class="chip r-x">${ic('xeno')}${s.cargo.x}</span>`;
 if(ar)$('shm').textContent='×'+f1(s.mult);
 $('shn').firstChild.style.width=(s.nrg/sh.nrgMax*100)+'%';
 sh.skills.forEach(k=>{const b=$('sk-'+k.id);if(!b)return;b.classList.toggle('ready',s.nrg>=k.cost);b.querySelector('.fill').style.height=Math.min(100,s.nrg/k.cost*100)+'%'});
}
function finishMission(kind){
 const s=SH;if(!s)return;const c=s.cargo,sec=s.sec;
 SH=null;shPtr=null;
 if(s.mode==='arena'){const K=s.kind||'C',A=S.arena;A.runs++;const rec=s.score>(A['best'+K]||0);if(rec)A['best'+K]=s.score;A['bestT'+K]=Math.max(A['bestT'+K]||0,s.t);A.best=Math.max(A.best||0,s.score);A.bestT=Math.max(A.bestT||0,s.t);const kn=K==='A'?tl('vaisseau d’arène','arena ship'):tl('vaisseau de campagne','campaign ship');
  if(!SIM)modal({eyebrow:tl('Zone infinie','Endless Zone'),title:rec?tl('Nouveau record !','New record!'):tl('Fin de partie','Game over'),html:`<div class="score">${fmt(s.score)}</div><p>${tl(`${s.kills} ennemis abattus · survie ${fmtT(s.t)} · zone ${s.zone+1} atteinte`,`${s.kills} enemies destroyed · survived ${fmtT(s.t)} · reached zone ${s.zone+1}`)}</p><p style="color:var(--dim);font-size:14px">${tl('Record','Record')} (${kn}) : ${fmt(A['best'+K])}</p>`,choices:[{l:tl('Retour','Back')}]});
  save();if(!SIM)renderExpe();checkObj();return}
 S.stats.missions++;S.stats.kills+=s.kills;
 if(kind==='lose'){const k=BAL.keepOnLoss,half={m:Math.floor(c.m*k),c:Math.floor(c.c*k),x:Math.floor(c.x*k)};gain(half);save();modal({eyebrow:tl(`${esc(S.ship.name)} abattu`,`${esc(S.ship.name)} shot down`),title:tl('Épave à la dérive','Drifting wreck'),text:tl(`Les drones de secours ramènent le vaisseau en orbite de ${PN()}. La moitié du butin a pu être sauvée.`,`Rescue drones tow the ship back into orbit around ${PN()}. Half of the loot was saved.`),html:lootHTML(half)+`<p class="tip" style="padding:0">${tl('Astuce : un 2ᵉ laser, du blindage ou un bouclier font une grosse différence. Pense aussi à la retraite depuis la pause.','Tip: a second laser, armor or a shield makes a big difference. Remember you can retreat from the pause menu.')}</p>`,choices:[{l:tl('Retour au hangar','Back to the hangar'),f:()=>setView('ship')}]});if(!SIM)renderExpe();checkObj();return}
 const over=gain({m:c.m,c:c.c,x:c.x});if(over)toast(tl(`Stock plein : ${fmt(over)} unités perdues`,`Storage full: ${fmt(over)} units lost`),'bad');
 if(kind==='win'){const first=!S.cleared[sec];S.cleared[sec]=1;S.stats.wins++;const bps=first?MD_ORDER.filter(id=>MD[id].bp===sec).map(id=>MD[id].n):[];
  modal({eyebrow:tl('Mission accomplie','Mission complete'),title:tl(`${BOSSN[sec]} détruit`,`${BOSSN[sec]} destroyed`),text:tl(`${s.kills} ennemis abattus. Le butin est déchargé dans la baie.`,`${s.kills} enemies destroyed. The loot is unloaded into the bay.`),html:lootHTML({m:c.m,c:c.c,x:c.x})+(bps.length?`<p style="color:var(--amber2)">${tl(`Schémas récupérés : ${bps.join(', ')}. Ces modules sont disponibles dans le hangar.`,`Schematics recovered: ${bps.join(', ')}. These modules are now available in the hangar.`)}</p>`:'')+(first&&sec<5?`<p>${tl(`Le secteur ${sec+1} est ouvert.`,`Sector ${sec+1} is open.`)}</p>`:'')+(first&&sec===5?`<p style="color:var(--amber2)">${tl('La Zone infinie est ouverte, avec ton vaisseau d’arène.','The Endless Zone is open, along with your arena ship.')}</p>`:'')+(s.lost?`<p class="why">${tl(`${s.lost} unités laissées derrière, faute de place en soute.`,`${s.lost} units left behind for lack of cargo space.`)}</p>`:''),choices:[{l:tl('Parfait','Perfect')}]})}
 else modal({eyebrow:tl('Retraite','Retreat'),title:tl('Retour en orbite','Back in orbit'),text:tl('Tu rentres avant d’affronter le gardien. Le butin est déchargé dans la baie.','You head home before facing the guardian. The loot is unloaded into the bay.'),html:lootHTML({m:c.m,c:c.c,x:c.x}),choices:[{l:'OK'}]});
 save();if(!SIM)renderExpe();checkObj();
}

/* ---------- intro, boucle, démarrage ---------- */
function migrate(s){
 if(s.arena&&s.arena.bestC==null){s.arena.bestC=s.arena.best||0;s.arena.bestTC=s.arena.bestT||0;s.arena.bestA=0;s.arena.bestTA=0}
 if(!s.objId)s.objId=typeof s.obj==='number'?(OBJ_OLD[s.obj]||'end'):'mineM';s.obj=objIdx(s.objId);
 const d=newGame();for(const k in d){if(s[k]==null)s[k]=d[k];else if(typeof d[k]==='object'&&!Array.isArray(d[k])&&d[k]&&typeof s[k]==='object')for(const j in d[k])if(s[k][j]==null)s[k][j]=d[k][j]}
 if(!Array.isArray(s.plots)||s.plots.length!==9)s.plots=d.plots;if(!s.ship.cells||s.ship.cells.length!==GC*GR)s.ship=d.ship;if(!s.arenaShip.cells||s.arenaShip.cells.length!==GC*GR)s.arenaShip=d.arenaShip;
 if(!s.pname)s.pname='KS-17';if(!s.reserve)s.reserve=[];if(!s.plans)s.plans=[null,null,null];
 if(!s.ship.name)s.ship.name=tl('Rescapé','Survivor');if(!s.arenaShip.name)s.arenaShip.name='Prototype';
}
function renameDlg(kind){
 const pl=kind==='planet',cur=pl?PN():curShip().name,max=NAME_MAX[pl?'planet':'ship'];
 modal({eyebrow:pl?tl('Planète','Planet'):(sandbox()?tl('Vaisseau d’arène','Arena ship'):tl('Vaisseau','Ship')),title:pl?tl('Renommer la planète','Rename the planet'):tl('Renommer le vaisseau','Rename the ship'),
  html:`<label class="rn"><input id="rn-in" type="text" maxlength="${max}" value="${esc(cur)}" autocomplete="off" spellcheck="false" enterkeyhint="done"><small id="rn-n">${cur.length}/${max}</small></label>`,
  choices:[{l:tl('Valider','Confirm'),f:()=>{const v=cleanName($('rn-in').value,max);if(!v){toast(tl('Nom vide : rien n’a changé','Empty name: nothing changed'),'bad');return}
   if(pl){S.pname=v;S.flags.planetNamed=1;renderPName();if(SHEET)renderSheet();checkObj()}else{curShip().name=v;if(!sandbox())S.flags.shipNamed=1;renderShip();checkObj();if(view==='expe')renderExpe()}save();toast(pl?tl(`La planète s’appelle désormais ${v}`,`The planet is now called ${v}`):tl(`Nouveau nom : ${v}`,`New name: ${v}`),'ok')}},{l:tl('Annuler','Cancel'),cls:'ghost'}]});
 setTimeout(()=>{const i=$('rn-in');if(!i)return;i.focus();i.select();
},60);
}
$('mbox').addEventListener('input',e=>{if(e.target.id==='rn-in'){const n=$('rn-n');if(n)n.textContent=e.target.value.length+'/'+e.target.maxLength}});
$('mbox').addEventListener('keydown',e=>{if(e.target.id!=='rn-in')return;e.stopPropagation();const k=e.key==='Enter'?0:e.key==='Escape'?1:-1;if(k<0)return;e.preventDefault();const b=$('mbox').querySelector(`[data-mc="${k}"]`);if(b)b.click()});
ACT.rename=k=>{SFX.click();renameDlg(k)};
document.addEventListener('keydown',e=>{
 if(e.target&&e.target.tagName==='INPUT')return;
 if(!$('modal').hidden){if((e.key==='Enter'||e.key===' ')&&!(e.target&&e.target.tagName==='BUTTON')){const b=$('mbox').querySelector('[data-mc="0"]');if(b){e.preventDefault();b.click()}}return}
 if(e.key==='Escape'&&SHEET){e.preventDefault();closeSheet();return}
 if(e.key==='Escape'&&MOVE!=null){e.preventDefault();MOVE=null;renderShip()}
});
const TIPS={
 hangar:()=>({eyebrow:tl('Aide','Help'),title:tl('Le hangar','The hangar'),html:`<p>${tl('Le nez du vaisseau est en haut. Chaque case accueille une pièce de coque et un module.','The ship’s nose points up. Each cell holds a hull part and a module.')}</p><ul class="tips"><li>${tl('<b>Case fissurée</b> : touche-la pour la réparer.','<b>Cracked cell</b>: tap it to repair it.')}</li><li>${tl('<b>Cadenas et chiffre</b> : la case se débloque à ce niveau du chantier orbital.','<b>Lock and number</b>: the cell unlocks at that orbital shipyard level.')}</li><li>${tl('<b>Puissance</b> : les modules consomment ce que fournit le réacteur.','<b>Power</b>: modules use what the reactor provides.')}</li><li>${tl('<b>Barres orange</b> : bonus entre modules voisins.','<b>Orange bars</b>: bonus between neighbouring modules.')}</li></ul>`}),
 reserve:()=>({eyebrow:tl('Aide','Help'),title:tl('La réserve','Spare parts'),text:tl('Un module démonté n’est pas perdu : il part en réserve avec son niveau. Réinstalle-le gratuitement depuis une case vide, ou recycle-le contre la moitié de son métal et de son cristal depuis le bouton « Plans ».','A dismantled module isn’t lost: it goes to spare parts with its level. Reinstall it for free from an empty cell, or recycle it for half its metal and crystal from the “Blueprints” button.')}),
 yard:L=>({eyebrow:tl(`Chantier orbital niveau ${L}`,`Orbital shipyard level ${L}`),title:tl('Coque agrandie','Hull expanded'),html:`<p>${YARD_TXT[L]}</p>${L<=3?`<p>${tl(`De nouvelles cases fissurées sont apparues dans le hangar, et l’emplacement de plan n° ${L} est disponible pour enregistrer ton vaisseau.`,`New cracked cells have appeared in the hangar, and blueprint slot ${L} is now available to save your ship.`)}</p>`:''}`})
};
function tipOnce(k,arg){if(SIM||!S||inTuto())return;const f='tip_'+k+(arg||'');if(S.flags[f])return;S.flags[f]=1;const o=TIPS[k](arg);modal(Object.assign({choices:[{l:tl('Compris','Got it')}]},o))}
function intro(){
 modal({eyebrow:tl('Journal de bord · jour 1','Ship’s log · day 1'),title:tl('Ce qu’il reste du vaisseau','What’s left of the ship'),text:tl(`Ton vaisseau n’est plus qu’une épave en orbite de ${PN()}, une planète morte. Il ne reste que la baie de déchargement et quelques caisses de matériaux.`,`Your ship is nothing but a wreck orbiting ${PN()}, a dead planet. All that remains is the cargo bay and a few crates of materials.`),choices:[{l:tl('Suite','Next')}]});
 modal({eyebrow:tl('Journal de bord · jour 1','Ship’s log · day 1'),title:tl('Premier objectif','First objective'),text:tl(`Installe des mines sur la planète. Elles financeront la reconstruction du vaisseau, pièce par pièce. Plus tard, il faudra rendre ${PN()} assez vivable pour attirer des colons.`,`Set up mines on the planet. They will pay for rebuilding the ship, part by part. Later, you’ll need to make ${PN()} livable enough to attract colonists.`),choices:[{l:tl('Au travail','Let’s go')}]});
}
function fitPName(){const n=$('pnm');if(!n||!n.clientWidth)return;let f=20;n.style.fontSize=f+'px';while(n.scrollWidth>n.clientWidth&&f>11){f--;n.style.fontSize=f+"px"}}
function renderPName(){if(SIM)return;$('pnm').textContent=PN();requestAnimationFrame(fitPName);const b=document.querySelector('#v-planet .edb');if(b&&!b.innerHTML)b.innerHTML=ic('edit')}
function renderAll(){if(SIM)return;renderPName();renderRes();renderObj();renderNav();renderPlots(true);renderTerra();if(view==='ship')renderShip();if(view==='expe')renderExpe()}
function resize(){sizeBg();sizePlanet();fitPName();if(view==='ship')renderShip();if(view==='expe'&&SH)sizeSH()}
let lastF=performance.now(),acc=0,acc2=0,saveAcc=0;
function loop(now){requestAnimationFrame(loop);try{frame(now)}catch(e){console.error(e)}}
function frame(now){
 const dt=Math.min(.1,(now-lastF)/1000);lastF=now;const T=now/1000;
 const real=(Date.now()-S.t)/1000;S.t=Date.now();econ(Math.max(0,real));
 drawBg(dt,T);
 musTick(dt);
 if(view==='planet')drawPlanet(dt,T);
 if(view==='expe'&&SH)shFrame(dt,T);
 acc+=dt;if(acc>.25){acc=0;renderRes()}
 acc2+=dt;if(acc2>.5){acc2=0;const hideObj=!!(SH&&view==='expe');if($('obj').hidden!==hideObj)$('obj').hidden=hideObj;
  if(view==='planet'){renderPlots();renderTerra()}checkObj();if(SHEET&&['pbuild','pempty','terra'].includes(SHEET.kind))renderSheet(true)}
 saveAcc+=dt;if(saveAcc>4){saveAcc=0;save()}
}
function boot(d){
 try{S=(d&&d.S)||load()||newGame();migrate(S);shipInfo(S.ship);shipInfo(S.arenaShip)}catch(e){console.error(e);try{localStorage.setItem(KEY+'-bak',localStorage.getItem(KEY)||'')}catch(_){}S=newGame()}
 if(!S.vol)S.vol={mus:.6,sfx:S.snd===false?0:.8};
 migrate(S);if(!DEV)S.test=false;applyLang();{const pc=pruneShip(S.ship,true);pruneShip(S.arenaShip,false);if(pc)setTimeout(()=>toast(tl(`${pc} module${pc>1?'s':''} non relié${pc>1?'s':''} à la baie rangé${pc>1?'s':''} en réserve`,`${pc} module${pc>1?'s':''} not linked to the bay moved to spare parts`),'amb'),2500)}
 const fresh=!S.intro;
 $('gear').innerHTML=ic('gear');document.querySelector('.shx').innerHTML=ic('cross');
 initGlobe();musInit();if(TITLE_BG)document.body.style.setProperty('--deskbg',`url(${TITLE_BG})`);const tt=$('spl').querySelector('.tt');if(TITLE_BG)tt.style.background=`linear-gradient(#05070dcc,#05070d00 32%,#05070d00 70%,#05070dcc),url(${TITLE_BG}) center/cover`;sizeBg();sizePlanet();renderAll();setView('planet');
 $('app').addEventListener('scroll',()=>{$('app').scrollTop=0;$('app').scrollLeft=0});
 const ro=new ResizeObserver(()=>resize());ro.observe($('app'));ro.observe(document.querySelector('main'));
 document.addEventListener('visibilitychange',()=>{if(document.hidden){save();if(SH&&SH.started&&!SH.over){SH.paused=true;shOverlay()}}});
 try{window.claude&&window.claude.hot&&window.claude.hot.snapshot&&window.claude.hot.snapshot(()=>({S}))}catch(e){}
 const spl=$('spl'),lg=spl.querySelector('.lg');let st=0;
 const toT=()=>{if(st)return;st=1;lg.style.opacity=0;setTimeout(()=>lg.remove(),700)};
 setTimeout(toT,2200);
 spl.addEventListener('pointerdown',e=>{e.stopPropagation();ac();if(!st){toT();return}if(st===2)return;st=2;spl.classList.add('out');lockFocus();setTimeout(()=>spl.remove(),650);if(fresh){S.intro=1;S.pnV=VERSION;intro()}else if(S.pnV!==VERSION)setTimeout(()=>{openSheet('notes');save()},700)});
 lockFocus();
 requestAnimationFrame(loop);
 swInit();
}
function swInit(){
 if(DEV||!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
 const ban=w=>{if($('upd'))return;const d=document.createElement('div');d.id='upd';d.innerHTML=`<span>${tl('Nouvelle version disponible','New version available')}</span><button class="btn sm">${tl('Mettre à jour','Update')}</button><button class="x" aria-label="${tl('Plus tard','Later')}">×</button>`;d.querySelector('.x').onclick=()=>d.remove();d.querySelector('.btn').onclick=()=>{save();let done=false;const go=()=>{if(!done){done=true;location.reload()}};navigator.serviceWorker.addEventListener('controllerchange',go);w.postMessage('skip');setTimeout(go,3000)};$('app').appendChild(d)};
 try{navigator.serviceWorker.register('sw.js').then(r=>{if(r.waiting&&navigator.serviceWorker.controller)ban(r.waiting);r.addEventListener('updatefound',()=>{const w=r.installing;w&&w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)ban(w)})});setInterval(()=>r.update().catch(()=>{}),36e5)}).catch(()=>{})}catch(e){}
}
if(!window.__NOBOOT)(window.claude&&window.claude.hot&&window.claude.hot.ready?window.claude.hot.ready(boot):boot((window.claude&&window.claude.hot&&window.claude.hot.data)||{}));
