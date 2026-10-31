'use strict';
const DEV=/*DEV*/true;
const VERSION='1.0.7';
const $=id=>document.getElementById(id);
/* ---------- langue ---------- */
const LANG_KEY='oxyblox-lang';
let LANG=(()=>{try{const q=new URLSearchParams(location.search).get('lang');if(q==='fr'||q==='en'){try{localStorage.setItem(LANG_KEY,q)}catch(e){}return q}}catch(e){}try{const v=localStorage.getItem(LANG_KEY);if(v==='fr'||v==='en')return v}catch(e){}try{return/^fr\b/i.test(navigator.language||'fr')?'fr':'en'}catch(e){return'fr'}})();
const tl=(fr,en)=>LANG==='en'?en:fr;
const LOC=()=>LANG==='en'?'en-US':'fr-FR';
const DPS=()=>tl('dég/s','dmg/s'),PCT=()=>LANG==='en'?'%':'\u202f%';
const dsep=v=>LANG==='en'?v:v.replace('.',',');
let rnd=Math.random;
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1)),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>{n=Math.floor(n+1e-9);const sp=LANG==='en'?'':' ';if(n>=1e6)return dsep((n/1e6).toFixed(1))+sp+'M';if(n>=100000)return Math.round(n/1000)+sp+'k';if(n>=10000)return dsep((n/1000).toFixed(1))+sp+'k';return n.toLocaleString(LOC())};
const fmtS=n=>{n=Math.floor(n+1e-9);if(n>=1e6)return dsep((n/1e6).toFixed(n>=1e7?0:1))+'M';if(n>=1e4)return Math.round(n/1000)+'k';return n.toLocaleString(LOC())};
const f1=v=>(Math.round(v*10)/10).toLocaleString(LOC());
const f2=v=>(Math.round(v*100)/100).toLocaleString(LOC());
const fmtT=s=>{s=Math.max(0,Math.ceil(s));if(s<60)return s+' s';const m=Math.floor(s/60),r=s%60;if(m<60)return m+' min'+(r?' '+String(r).padStart(2,'0')+' s':'');const h=Math.floor(m/60);if(h<48)return h+' h '+String(m%60).padStart(2,'0');return Math.floor(h/24)+tl(' j ',' d ')+(h%24)+' h'};

/* ---------- icônes ---------- */
const ICON={
 metal:'M4 15l4-6h8l4 6z M4 15v3h16v-3',
 crystal:'M12 3l5 6-5 12-5-12z M7 9h10',
 xeno:'M12 2l2.6 6.9L21.5 12l-6.9 2.6L12 21.5l-2.6-6.9L2.5 12l6.9-3.1z',
 people:'M6 8a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M3 20c0-4 3-6 6-6s6 2 6 6 M15 9a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0 M15.5 14c3 0 5.5 2 5.5 5',
 planet:'M5 12a7 7 0 1 0 14 0a7 7 0 1 0-14 0 M2 16c5 1 15-4 20-9',
 ship:'M12 3l5 7v8l-5 3-5-3v-8z M12 8v8 M7 14l-3 3 M17 14l3 3',
 map:'M5 19a2 2 0 1 0 .01 0 M19 5a2 2 0 1 0 .01 0 M12 12a2 2 0 1 0 .01 0 M6 17l5-4 M13 11l5-4',
 gear:'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M4.9 19.1L7 17 M17 7l2.1-2.1',
 bay:'M3 7h18v11H3z M12 9v6 M9 12l3 3 3-3',
 reac:'M5 12a7 7 0 1 0 14 0a7 7 0 1 0-14 0 M13 7l-4 6h4l-1 4 4-6h-4z',
 pilot:'M4 17a8 8 0 0 1 16 0 M12 17l4-5 M3 20h18',
 eng:'M8 3h8l-1 10H9z M9 13l-2 7 M15 13l2 7 M12 13v8',
 laser:'M12 21V8 M9 8h6 M12 8V3 M10 21h4',
 spread:'M12 20V9 M12 20L5 10 M12 20l7-10 M12 5v1 M5 6v1 M19 6v1',
 mis:'M12 3l3 5v9l-3 3-3-3V8z M9 14l-3 3 M15 14l3 3',
 drone:'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M5 5l4 4 M19 5l-4 4 M5 19l4-4 M19 19l-4-4',
 plasma:'M7 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M12 2v4 M12 18v4 M4 8l3 2 M20 8l-3 2',
 tesla:'M12 2v5 M8 7h8 M9 7l-3 6h12l-3-6 M12 13l-2 4h4l-2 5',
 beam:'M10 21V5 M14 21V5 M8 5h8 M12 3v2',
 shld:'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
 armor:'M4 5h16v6c0 5-4 8-8 9-4-1-8-4-8-9z M4 10h16 M12 5v15',
 regen:'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z M12 9v6 M9 12h6',
 stasis:'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0 M7 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M11 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0',
 emp:'M3 12h4l2-5 3 10 2-7 2 2h5',
 amp:'M12 4l8 16H4z M12 10v4 M12 17v.5',
 cool:'M12 3v18 M4.2 7.5l15.6 9 M19.8 7.5l-15.6 9',
 cargo:'M4 8l8-4 8 4v9l-8 4-8-4z M4 8l8 4 8-4 M12 12v9',
 scan:'M4 12a8 8 0 1 0 16 0a8 8 0 1 0-16 0 M12 12l5-4 M12 4v3',
 pause:'M8 5v14 M16 5v14', play:'M7 5l12 7-12 7z',
 jump:'M4 12h12 M12 6l6 6-6 6 M20 5v14',
 lock:'M6 11h12v9H6z M8 11V8a4 4 0 0 1 8 0v3',
 wrench:'M15 4a4 4 0 0 0-4 5l-7 7 4 4 7-7a4 4 0 0 0 5-4l-3 1-2-2z',
 home:'M4 11l8-7 8 7 M6 10v10h12V10',
 check:'M5 12l5 5 9-10', cross:'M6 6l12 12 M18 6L6 18',
 bolt:'M13 3l-7 10h5l-1 8 7-10h-5z',
 crack:'M4 4l6 6-3 3 5 5 M14 4l-2 5 6 2 M20 14l-5 2',
 leaf:'M5 19c0-8 6-14 15-14 0 9-6 15-14 15 M5 19l8-8',
 move:'M12 3v18 M3 12h18 M9 6l3-3 3 3 M9 18l3 3 3-3 M6 9l-3 3 3 3 M18 9l3 3-3 3',
 trophy:'M8 4h8v5a4 4 0 0 1-8 0z M8 6H5a3 3 0 0 0 3 4 M16 6h3a3 3 0 0 1-3 4 M12 13v4 M8 20h8',
 inf:'M7 9a3 3 0 1 0 0 6c3 0 7-6 10-6a3 3 0 1 1 0 6c-3 0-7-6-10-6z',
 up:'M12 19V5 M6 11l6-6 6 6',
 trash:'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
 edit:'M4 20h4L19 9l-4-4L4 16z M13 7l4 4',
 plans:'M4 4h16v16H4z M4 10h16 M10 10v10',
 save:'M5 4h11l3 3v13H5z M8 4v5h7V4 M8 14h8v6H8z',
 load:'M12 4v11 M7 10l5 5 5-5 M5 20h14',
 recycle:'M6.5 9.5a6.5 6.5 0 0 1 11.5-2 M18.5 3.5v4.5H14 M17.5 14.5a6.5 6.5 0 0 1-11.5 2 M5.5 20.5V16H10'
};
const ic=(n,cls='')=>`<svg viewBox="0 0 24 24" class="ic ${cls}" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
const P2D={};const path2d=n=>P2D[n]||(P2D[n]=new Path2D(ICON[n]));
const RES={m:{n:'métal',i:'metal',cl:'r-m'},c:{n:'cristal',i:'crystal',cl:'r-c'},x:{n:'xéno',i:'xeno',cl:'r-x'},p:{n:'colons',i:'people',cl:'r-p'}};

/* ---------- équilibrage ---------- */
const BAL={
 capBase:2,           // heures de stock hors-ligne de base
 stageV:[0,15,40,65,100],
 habCap:12,           // colons logés par niveau d'habitat à 100 % de viabilité
 popRate:L=>.1+.08*L, // arrivées de colons par minute
 crewReq:[0,0,4,12,35,70], // colons requis pour atteindre le niveau N d'un module
 cap:{m:1e7,c:1e7,x:5000}, // stock maximal
 loot:1.6,            // multiplicateur de butin par secteur
 hpm:T=>Math.pow(2,T-1),
 repairM:40,repairC:12,repairFM:1.36,repairFC:1.33,
 bossLoot:400,bossLootF:2.5,cargoF:1.4,keepOnLoss:.5
};

/* ---------- bâtiments ---------- */
const BASE='<path class="b-base" d="M6 60h52l-5-9H11z"/>';
const BSVG={
 mineM:BASE+'<path class="b-metal2" d="M13 51h11v-9l-4-4h-7z"/><path class="b-metal2" d="M42 51h9V36h-9z"/><path class="b-dark" d="M44 39h5v3h-5z"/><path class="b-metal" d="M25 51V19l7-11 7 11v32z"/><path class="b-dark" d="M29 51V24h6v27z"/><path class="b-line" d="M25 27l14 9M39 27l-14 9M25 39l14 9M39 39l-14 9"/><rect class="b-amb blink" x="30" y="12" width="4" height="4" rx="1"/>',
 mineC:BASE+'<path class="b-metal2" d="M11 51h42v-4H11z"/><path class="b-cry" d="M32 8l8 15-8 26-8-26z"/><path class="b-cry2" d="M32 8l8 15-8 26z"/><path class="b-cry" d="M19 29l5 8-5 12-5-12z"/><path class="b-cry2" d="M19 29l5 8-5 12z" opacity=".6"/><path class="b-cry" d="M45 25l5 9-5 15-5-15z"/><path class="b-line" d="M13 47V35h5 M51 47V32h-5" style="stroke:#5b6880"/>',
 labX:BASE+'<path class="b-metal2" d="M12 51V30h40v21z"/><path class="b-dark" d="M16 34h32v6H16z"/><path class="b-xe" d="M32 6l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/><circle class="b-xe2 blink" cx="32" cy="19" r="3"/><path class="b-line" d="M20 44h24" style="stroke:#b892ff;stroke-width:2"/>',
 habitat:BASE+'<path class="b-metal2" d="M10 51h44v-4H10z"/><path class="b-glass" d="M14 47a18 18 0 0 1 36 0z"/><path class="b-line" d="M32 29v18 M20 38h24 M23 33l18 0" style="stroke:#9fd9ec;stroke-width:1.2;opacity:.6"/><rect class="b-amb" x="29" y="41" width="6" height="6" rx="1"/><circle class="b-amb blink" cx="46" cy="44" r="1.6"/><circle class="b-amb" cx="19" cy="43" r="1.4"/>',
 atmo:BASE+'<path class="b-metal2" d="M16 51V30h12v21z"/><path class="b-metal" d="M30 51V14h9v37z"/><path class="b-dark" d="M32 18h5v4h-5zM32 28h5v4h-5z"/><path class="b-metal2" d="M41 51V34h9v17z"/><circle class="b-puff" cx="35" cy="9" r="5"/><circle class="b-puff" cx="42" cy="5" r="3.5" opacity=".6"/><circle class="b-puff" cx="22" cy="25" r="3" opacity=".7"/><rect class="b-cy blink" x="18" y="33" width="8" height="2"/>',
 water:BASE+'<rect class="b-metal2" x="12" y="20" width="12" height="31" rx="2"/><rect class="b-metal2" x="40" y="24" width="12" height="27" rx="2"/><path class="b-line" d="M14 26h8M14 32h8M42 30h8M42 36h8" style="stroke:#1a2030"/><rect class="b-water" x="25" y="34" width="14" height="17" rx="3"/><rect class="b-water2" x="25" y="34" width="14" height="5" rx="2"/><path class="b-line" d="M18 20v-6h28v10" style="stroke:#8d98ad;stroke-width:3"/>',
 bio:BASE+'<path class="b-glass" d="M8 51V38a10 10 0 0 1 20 0v13z"/><path class="b-glass" d="M28 51V32a12 12 0 0 1 24 0v19z"/><path class="b-leaf" d="M12 51c0-5 3-8 6-8s6 3 6 8z M32 51c0-7 4-11 8-11s8 4 8 11z"/><path class="b-leaf2" d="M38 44c2-4 5-4 6-2 M16 47c1-2 3-2 4-1"/>',
 yard:BASE+'<path class="b-metal" d="M9 51V9h5v42z"/><path class="b-metal" d="M9 9h46v5H9z"/><path class="b-line" d="M11 14l-2 6 M14 14l-3 6 M14 9l6-5h4" style="stroke:#5b6880"/><path class="b-line" d="M45 14v13" style="stroke:#c3cbd9"/><rect class="b-amb" x="42" y="27" width="7" height="5" rx="1"/><path class="b-line2" d="M20 51V35h34v16 M20 43h34 M28 35v16 M37 35v16 M46 35v16"/><circle class="b-amb blink" cx="54" cy="11" r="2"/>',
 depot:BASE+'<path class="b-metal2" d="M10 51V28l22-10 22 10v23z"/><path class="b-dark" d="M24 51V36h16v15z"/><path class="b-line" d="M24 40h16M24 45h16" style="stroke:#5b6880"/><path class="b-metal" d="M10 28l22-10 22 10-3 2-19-8-19 8z"/><rect class="b-amb" x="44" y="34" width="5" height="4"/>',
 cons:BASE+'<path class="b-line2" d="M16 51V21h32v30 M16 30h32 M16 40h32 M16 21l32 30 M48 21L16 51"/><rect class="b-amb" x="13" y="49" width="38" height="3"/>'
};
const bsvg=(id,cls='bd')=>`<svg viewBox="0 0 64 64" class="${cls}" aria-hidden="true">${BSVG[id]}</svg>`;
const PB={
 mineM:{n:'Mine de métal',d:'Fore la croûte de § et remonte du minerai de fer.',res:'m',base:20,cost:{m:60,c:15},f:1.55,t:8,tf:1.45,max:20,xFrom:8},
 mineC:{n:'Extracteur de cristal',d:'Découpe les veines cristallines du sous-sol.',res:'c',base:12,cost:{m:48,c:24},f:1.6,t:10,tf:1.45,max:20,xFrom:8},
 habitat:{n:'Habitat',d:'Dômes où s’installent les colons : 12 places par niveau. Personne ne vient vivre sur une planète morte, donc seule la part viable des dômes se remplit.',cost:{m:150,c:80},f:1.75,t:30,tf:1.45,max:10},
 labX:{n:'Synthétiseur xéno',d:'Reproduit lentement les composants xéno à partir des échantillons rapportés de mission.',res:'x',base:.05,lin:1,pq:[0,5,5,8,10,15,20,25,30,40,50],cost:{m:400,c:300},xl:[4,3],f:1.9,t:90,tf:1.45,max:10,stage:1},
 atmo:{n:'Processeur atmosphérique',d:'Épaissit l’atmosphère. Chaque niveau ajoute 8 % de viabilité.',cost:{m:300,c:200},xl:[3,2],f:2.2,t:60,tf:1.6,max:5,vp:8},
 water:{n:'Condenseur d’eau',d:'Libère l’eau piégée dans le sol. Chaque niveau ajoute 7 % de viabilité.',cost:{m:500,c:400},xl:[5,3],f:2.3,t:90,tf:1.6,max:5,vp:7,stage:1},
 bio:{n:'Serres d’ensemencement',d:'Dispersent lichens et micro-organismes. Chaque niveau ajoute 6 % de viabilité.',cost:{m:900,c:800},xl:[8,4],f:2.4,t:120,tf:1.6,max:5,vp:6,stage:2},
 yard:{n:'Chantier orbital',d:'Agrandit la coque du vaisseau, débloque de nouvelles formes de pièces puis les niveaux 4 et 5 des modules.',pq:[0,0,10,25,50],cost:{m:600,c:400,x:5},f:3,t:90,tf:2,max:4},
 depot:{n:'Entrepôt',d:'Les bâtiments accumulent plus longtemps en ton absence : +2 h de stock par niveau.',cost:{m:120,c:60},f:1.6,t:20,tf:1.5,max:6}
};
const PB_ORDER=['mineM','mineC','habitat','atmo','water','bio','labX','yard','depot'];
const YARD_TXT=['','Agrandit la coque et débloque les pièces triangulaires.','Agrandit la coque et débloque les pièces en quart de cercle.','Complète la coque et débloque les pièces en demi-cercle.','Débloque les niveaux 4 et 5 des modules.'];
const STAGES=[{n:'Planète morte',txt:''},
 {n:'Atmosphère ténue',txt:'L’atmosphère s’épaissit et le ciel de § commence à bleuir. Les premiers colons acceptent de venir.'},
 {n:'Premières pluies',txt:'Pour la première fois depuis des siècles, il pleut sur §. Des lacs se forment au fond des cratères.'},
 {n:'Premiers lichens',txt:'Des lichens s’accrochent aux roches humides. Des taches vertes apparaissent autour des lacs.'},
 {n:'Planète viable',txt:'§ est viable. Les colons peuvent enfin sortir des dômes et respirer à l’air libre.'}];
function pCost(id,L){const b=PB[id],k=Math.pow(b.f,L),o={};for(const r in b.cost)o[r]=Math.round(b.cost[r]*k);if(b.xl)o.x=b.xl[0]+b.xl[1]*L;if(b.xFrom&&L+1>=b.xFrom)o.x=(o.x||0)+(L+2-b.xFrom);if(b.pq&&b.pq[L+1])o.p=b.pq[L+1];return o}
const pTime=(id,L)=>PB[id].t*Math.pow(PB[id].tf,L);
function viab(s=S){let v=0;for(const id of['atmo','water','bio'])v+=PB[id].vp*plotLvl(id,s);return Math.min(100,v)}
function stageOf(v){let k=0;BAL.stageV.forEach((t,i)=>{if(v>=t)k=i});return k}
function prod(id,L,s=S){const b=PB[id];if(!b.res||L<=0)return 0;return b.base*L*(b.lin?1:Math.pow(1.06,L))}
const popCap=(s=S)=>Math.floor(BAL.habCap*plotLvl('habitat',s)*viab(s)/100+1e-9);
const popRate=(s=S)=>{const L=plotLvl('habitat',s);return L?BAL.popRate(L)*(1+stageOf(viab(s))*.25):0};
const capH=(s=S)=>BAL.capBase+2*plotLvl('depot',s);
function pReq(id,s=S){const b=PB[id];if(b.stage&&stageOf(viab(s))<b.stage)return tl(`Nécessite le palier « ${STAGES[b.stage].n} ».`,`Requires the “${STAGES[b.stage].n}” stage.`);if(id==='atmo'&&plotLvl('habitat',s)<1&&false)return'';return null}

/* ---------- formes ---------- */
const SHP={
 sq:{n:'Carré',e:1,a:1,yard:0,d:'M0 0H1V1H0Z'},
 qt:{n:'Quart de cercle',e:.9,a:.785,yard:2,d:'M0 1L0 0A1 1 0 0 1 1 1Z'},
 tr:{n:'Triangle',e:.78,a:.5,yard:1,d:'M0 0L0 1L1 1Z'},
 is:{n:'Triangle isocèle',e:.78,a:.5,yard:1,d:'M.5 0L1 1L0 1Z',rots:[0,2]},
 hf:{n:'Demi-cercle',e:.68,a:.393,yard:3,d:'M0 1A.5 .5 0 0 1 1 1Z'}
};
const SHP_ORDER=['sq','qt','tr','is','hf'];
const P2S={};const shpPath=k=>P2S[k]||(P2S[k]=new Path2D(SHP[k].d));
function inShape(sh,rot,u,v){
 for(let k=0;k<rot;k++){const t=u;u=v;v=1-t}
 if(u<0||u>1||v<0||v>1)return false;
 if(sh==='sq')return true;
 if(sh==='tr')return v>=u;
 if(sh==='is')return v>=2*Math.abs(u-.5);
 if(sh==='qt')return u*u+(1-v)*(1-v)<=1;
 if(sh==='hf')return(u-.5)*(u-.5)+(1-v)*(1-v)<=.25;
 return false;
}
const shpSvg=(sh,rot,fill,stroke,sw=.06)=>`<path d="${SHP[sh].d}" transform="rotate(${rot*90} .5 .5)" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" vector-effect="non-scaling-stroke"/>`;

/* ---------- grille du vaisseau ---------- */
const GC=5,GR=6;
const TIER=[
 3,2,1,2,3,
 2,1,0,1,2,
 2,0,0,0,2,
 1,0,0,0,1,
 2,1,0,1,2,
 3,3,2,3,3];
const DIRS=[-.34,-.14,0,.14,.34];
function nb(i){const r=i/GC|0,c=i%GC,o=[];if(c>0)o.push(i-1);if(c<GC-1)o.push(i+1);if(r>0)o.push(i-GC);if(r<GR-1)o.push(i+GC);return o}

/* ---------- modules ---------- */
const CAT=[['sys','Systèmes'],['arm','Armes'],['def','Défense'],['ut','Utilitaires']];
const MD={
 bay:{n:'Baie de déchargement',s:'Baie',cat:'sys',d:'Le cœur de l’épave. Elle ne se démonte pas, mais tu peux la déplacer.',fixed:1,max:1,pw:0,col:'#c3b4ff'},
 reac:{n:'Réacteur',s:'Réacteur',cat:'sys',cost:{m:60,c:30},f:2,max:5,multi:3,pw:0,col:'#ffd36a',d:'Fournit la puissance des modules et recharge l’énergie des compétences. Débloque Surcharge.'},
 pilot:{n:'Cockpit',s:'Cockpit',cat:'sys',cost:{m:50,c:20},f:2.1,max:5,multi:1,pw:1,col:'#8cc8ff',d:'Indispensable. Agrandit l’aimant à butin et donne des coups critiques.'},
 eng:{n:'Propulseur',s:'Propuls.',cat:'sys',cost:{m:70,c:25},f:2.05,max:5,multi:3,pw:1,col:'#ffa36b',d:'Indispensable. Rend le vaisseau plus rapide. À côté du cockpit : +15 % de vitesse.'},
 laser:{n:'Laser',s:'Laser',cat:'arm',cost:{m:80,c:40},f:2.1,max:5,multi:6,pw:1,col:'#ff8b7d',d:'Tir rapide et précis. Double canon dès le niveau 3.'},
 spread:{n:'Dispersion',s:'Dispers.',cat:'arm',cost:{m:110,c:50},f:2.1,max:5,multi:4,pw:1,col:'#ffb35a',d:'Gerbe de plombs à courte portée, dévastatrice au contact.',bp:1},
 mis:{n:'Lance-missiles',s:'Missiles',cat:'arm',cost:{m:120,c:60,x:2},f:2.15,max:5,multi:3,pw:1,col:'#ff8fc9',d:'Missiles à tête chercheuse. Débloque la compétence Salve.',bp:1},
 drone:{n:'Baie de drones',s:'Drones',cat:'arm',cost:{m:100,c:80,x:2},f:2.15,max:5,multi:2,pw:1,col:'#7fdc95',d:'Des drones escortent le vaisseau et tirent sur l’ennemi le plus proche.',bp:2},
 plasma:{n:'Canon à plasma',s:'Plasma',cat:'arm',cost:{m:160,c:120,x:4},f:2.2,max:5,multi:3,pw:2,col:'#b892ff',d:'Projectile lent et lourd qui traverse plusieurs ennemis.',bp:3,crew:8},
 tesla:{n:'Bobine tesla',s:'Tesla',cat:'arm',cost:{m:180,c:160,x:6},f:2.2,max:5,multi:2,pw:1,col:'#9ff0ff',d:'Foudroie l’ennemi le plus proche, puis l’arc rebondit sur ses voisins.',bp:4,crew:20},
 beam:{n:'Rayon',s:'Rayon',cat:'arm',cost:{m:220,c:200,x:8},f:2.25,max:5,multi:2,pw:2,col:'#ff5f9e',d:'Rayon pulsé qui traverse tout ce qui se trouve devant lui.',bp:5,crew:35},
 shld:{n:'Bouclier',s:'Bouclier',cat:'def',cost:{m:60,c:50},f:2.15,max:5,multi:3,pw:1,col:'#62d6e8',d:'Chaque couche absorbe un tir puis se recharge. Débloque la compétence Bouclier.'},
 armor:{n:'Blindage',s:'Blindage',cat:'def',cost:{m:70,c:10},f:2,max:5,multi:10,pw:0,col:'#c3cbd9',d:'Plaques épaisses : beaucoup de points de coque, aucune puissance.'},
 regen:{n:'Nano-réparateur',s:'Répar.',cat:'def',cost:{m:140,c:120,x:3},f:2.15,max:5,multi:2,pw:1,col:'#a6e3a1',d:'Répare la coque pendant la mission.',bp:3,crew:8},
 stasis:{n:'Champ de stase',s:'Stase',cat:'def',cost:{m:200,c:200,x:6},f:2.2,max:5,multi:1,pw:2,col:'#7aa8ff',d:'Ralentit de moitié les tirs ennemis qui entrent dans le champ.',bp:4,crew:20},
 emp:{n:'Générateur EMP',s:'EMP',cat:'def',cost:{m:220,c:220,x:8},f:2.2,max:5,multi:1,pw:1,col:'#e3d27a',d:'Débloque l’Onde EMP qui efface les tirs ennemis. Augmente l’énergie maximale.',bp:5,crew:35},
 amp:{n:'Amplificateur',s:'Ampli',cat:'ut',cost:{m:120,c:140,x:3},f:2.15,max:5,multi:3,pw:1,col:'#ff7ab0',d:'Augmente les dégâts des armes voisines (haut, bas, gauche, droite).',bp:2,crew:4},
 cool:{n:'Refroidisseur',s:'Refroid.',cat:'ut',cost:{m:120,c:140,x:3},f:2.15,max:5,multi:3,pw:1,col:'#9fd9ec',d:'Augmente la cadence des armes voisines.',bp:2,crew:4},
 cargo:{n:'Soute',s:'Soute',cat:'ut',cost:{m:50,c:10},f:2,max:5,multi:3,pw:0,col:'#aab3c5',d:'Augmente le butin rapportable par mission. À côté de la baie : +30 %.'},
 scan:{n:'Scanner',s:'Scanner',cat:'ut',cost:{m:150,c:150,x:4},f:2.1,max:5,multi:2,pw:1,col:'#d0a6ff',d:'Les ennemis lâchent plus de butin et de xéno.',bp:3,crew:6}
};
const MD_ORDER=['laser','spread','mis','drone','plasma','tesla','beam','shld','armor','regen','stasis','emp','reac','pilot','eng','amp','cool','cargo','scan'];
const WEAP=['laser','spread','mis','drone','plasma','tesla','beam'];
function mCost(id,L){const b=MD[id],k=Math.pow(b.f,L),o={};for(const r in b.cost)o[r]=Math.round(b.cost[r]*k);
 const req=Math.max(b.crew||0,BAL.crewReq[L+1]||0);if(req)o.p=req;if(L>=2)o.x=(o.x||0)+(L-1)*2;if(o.x)o.x=Math.round(o.x*(1+.75*L));return o}
function mStat(id,L,e){
 const g=x=>1+x*(L-1);
 switch(id){
  case'reac':return{pwr:Math.round((4+3*L)*e),nrg:(1+1.2*L)*e};
  case'pilot':return{mag:30*L*e,crit:4*L*e};
  case'eng':return{spd:70*L*e};
  case'laser':{const dmg=g(.25)*e,iv=.30/g(.1),b=L>=3?2:1;return{dmg,iv,b,dps:b*dmg/iv}}
  case'spread':{const dmg=.75*g(.25)*e,iv=.75/g(.08),n=L>=3?7:5;return{dmg,iv,n,dps:n*dmg/iv*.55}}
  case'mis':{const dmg=4*g(.3)*e,iv=1.6/g(.12);return{dmg,iv,dps:dmg/iv}}
  case'drone':{const n=[0,1,2,2,3,3][L],dmg=.7*g(.2)*e,iv=.55;return{n,dmg,iv,dps:n*dmg/iv*.8}}
  case'plasma':{const dmg=5*g(.3)*e,iv=1.4/g(.08),pierce=2+Math.floor(L/2);return{dmg,iv,pierce,dps:dmg/iv*1.4}}
  case'tesla':{const dmg=2.4*g(.3)*e,iv=.9,chain=L>=3?3:2;return{dmg,iv,chain,dps:dmg*(1+chain*.6)/iv}}
  case'beam':{const dps0=5*g(.3)*e,w=6+2*L;return{dps0,w,dps:dps0*1.3/2.1*1.3}}
  case'shld':return{lay:Math.max(1,Math.round(L*e)),rech:3.2/(1+.12*L)};
  case'armor':return{hp:Math.round((6+4*L)*e)};
  case'regen':return{iv:Math.max(2,9-1.2*L)/e};
  case'stasis':return{rad:(60+15*L)*e};
  case'emp':return{nrg:20*L*e,cost:Math.max(35,62-5*L)};
  case'amp':return{dmgB:(15+5*L)*e};
  case'cool':return{rateB:(12+4*L)*e};
  case'cargo':return{cap:Math.round(60*L*e)};
  case'scan':return{loot:15*L*e};
 }
 return{};
}
const pwOf=(id,L)=>MD[id].pw*(L>=5?3:L>=3?2:1);

/* ---------- secteurs ---------- */
const SEC=[null,
 {n:'Ceinture de Kessler',d:'Un anneau de débris où rôdent des drones pillards.',T:1,dur:70},
 {n:'Nébuleuse d’Orsa',d:'Un brouillard ionisé. Des tireurs d’élite y verrouillent leur cible avant de tirer.',T:2,dur:80},
 {n:'Champs de glace de Vael',d:'Des croiseurs se cachent entre les blocs de glace. Certains ennemis se divisent en mourant.',T:3,dur:90},
 {n:'Frontière Noire',d:'Des poseurs de mines saturent l’espace. Les tirs font plus mal.',T:4,dur:100},
 {n:'Cœur xéno',d:'La source des composants xéno. Ce qui la garde n’a jamais été vaincu.',T:5,dur:110}];
const BOSSN=['','Sentinelle de Kessler','Gardien d’Orsa','Léviathan de Vael','Colosse de la Frontière','Cœur xéno'];
const BOSSC=['','#ff4f6a','#ff7a3a','#5fc8ff','#c46bff','#7dff9e'];

/* ---------- état ---------- */
let S;
function newShip(full){
 const cells=Array.from({length:GC*GR},(_,i)=>({s:full?'ok':(TIER[i]===0?'dmg':'void'),sh:'sq',rot:0,m:null}));
 if(!full){cells[17].s='ok';cells[17].m={id:'bay',lvl:1};cells[12].s='ok'}
 else{cells[17].m={id:'bay',lvl:1}}
 return{cells};
}
const esc=v=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const PN=()=>S&&S.pname||'KS-17';
const pt=t=>String(t).replace(/§/g,PN());
const cleanName=(v,max)=>String(v||'').replace(/[<>&"`\\\u0000-\u001f]/g,'').replace(/\s+/g,' ').trim().slice(0,max);
const NAME_MAX={planet:12,ship:16};
function newGame(){
 return{v:2,pname:'KS-17',reserve:[],plans:[null,null,null],res:{m:420,c:170,x:0,p:0},t:Date.now(),plots:Array(9).fill(null),cons:null,ship:Object.assign(newShip(false),{name:tl('Rescapé','Survivor')}),arenaShip:Object.assign(newShip(true),{name:'Prototype'}),edit:'camp',
  obj:0,flags:{},cleared:{},stats:{missions:0,wins:0,kills:0},arena:{best:0,bestT:0,bestC:0,bestTC:0,bestA:0,bestTA:0,runs:0},test:false,vol:{mus:.6,sfx:.8},stageSeen:0,intro:0};
}
const KEY='keismey-epave-stellaire-v2';
function save(){try{S.t=Date.now();if(typeof OBJ!=='undefined')S.objId=OBJ[S.obj]?OBJ[S.obj].id:'end';localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.v===2)return s}catch(e){}return null}
const SPD=()=>S.test?20:1;
const plotOf=(id,s=S)=>s.plots.findIndex(p=>p&&p.id===id);
const plotLvl=(id,s=S)=>{const i=plotOf(id,s);return i<0?0:s.plots[i].lvl};
const canPay=(c,s=S)=>Object.keys(c).every(r=>(s.res[r]||0)+1e-9>=c[r]);
function pay(c){for(const r in c){if(r!=='p')S.res[r]-=c[r]}bumpRes(Object.keys(c).filter(r=>r!=='p'))}
const room=r=>BAL.cap[r]==null?Infinity:Math.max(0,BAL.cap[r]-(S.res[r]||0));
function gain(c){let lost=0;for(const r in c)if(c[r]&&r!=='p'){const v=Math.min(c[r],room(r));lost+=c[r]-v;S.res[r]=(S.res[r]||0)+v}bumpRes(Object.keys(c).filter(r=>c[r]));return lost}
const costHTML=c=>`<div class="costs">${Object.keys(c).filter(r=>c[r]).map(r=>r==='p'?`<span class="cost req ${RES.p.cl} ${S.res.p+1e-9<c.p?'no':''}" title="${tl('Colons requis (non consommés)','Colonists required (not spent)')}">${ic('people')}${fmt(c.p)} ${tl('requis','needed')}</span>`:`<span class="cost ${RES[r].cl} ${S.res[r]+1e-9<c[r]?'no':''}">${ic(RES[r].i)}${fmt(c[r])}</span>`).join('')}</div>`;
const lootHTML=c=>`<div class="loot">${Object.keys(c).filter(r=>c[r]).map(r=>`<span class="cost ${RES[r].cl}">${ic(RES[r].i)}+${fmt(c[r])}</span>`).join('')||`<span class="cost">${tl('Rien','Nothing')}</span>`}</div>`;
const bpOk=(id,sand)=>sand||!MD[id].bp||!!S.cleared[MD[id].bp];
const arenaOpen=()=>!!S.cleared[5]||S.test;

/* ---------- son ---------- */
let AC=null;
let BUS=null;
function bus(){const a=AC;if(!a)return null;if(BUS)return BUS;const c=a.createDynamicsCompressor();c.threshold.value=-16;c.ratio.value=3;const m=a.createGain();m.gain.value=sfxVol();c.connect(m).connect(a.destination);BUS={in:c,out:m};return BUS}
const sfxVol=()=>S&&S.vol?S.vol.sfx:.8;
function setSfxVol(){if(BUS)BUS.out.gain.value=sfxVol()}
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){AC=null}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f0,f1,dur,type,vol,delay=0){if(SIM)return;const a=sfxVol()>0&&ac();if(!a)return;const t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(bus().in);o.start(t);o.stop(t+dur+.03)}
function noise(dur,vol,freq,delay=0){if(SIM)return;const a=sfxVol()>0&&ac();if(!a)return;const t=a.currentTime+delay,len=Math.floor(a.sampleRate*dur),b=a.createBuffer(1,len,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=freq;g.gain.value=vol;s.connect(f).connect(g).connect(bus().in);s.start(t)}
let SIM=false;
const SFX={
 click:()=>tone(880,620,.05,'square',0.075),
 build:()=>{tone(180,360,.14,'sawtooth',0.12);tone(360,720,.12,'square',0.075,.09)},
 collect:()=>{tone(660,990,.08,'sine',0.24);tone(990,1320,.1,'sine',0.18,.06)},
 mis:()=>{noise(.4,0.18,900);tone(300,120,.4,'triangle',0.09)},
 hit:()=>{noise(.25,0.45,700);tone(150,50,.25,'square',0.18)},
 shield:()=>tone(480,1300,.18,'sine',0.18),
 boom:()=>{noise(1.2,0.45,420);tone(110,28,1,'sawtooth',0.3)},
 jump:()=>{tone(110,1700,.6,'sawtooth',0.135);noise(.7,0.15,3200,.15)},
 done:()=>[523,659,784].forEach((f,k)=>tone(f,f,.2,'triangle',0.18,k*.08)),
 err:()=>tone(220,150,.16,'square',0.12),
 alarm:()=>{tone(700,500,.18,'square',0.12);tone(700,500,.18,'square',0.12,.22)},
 zap:()=>tone(2200,400,.08,'sawtooth',0.06)
};
const ACT={};
