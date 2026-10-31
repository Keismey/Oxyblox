
/* ---------- modèle du vaisseau ---------- */
const curShip=()=>S.edit==='arena'?S.arenaShip:S.ship;
const sandbox=()=>S.edit==='arena';
function shipInfo(ship){
 const cells=ship.cells;
 const I={parts:[],pwr:0,pwu:0,hull:10,spd:240,mag:50,crit:0,nrg:.5,nrgMax:100,lay:0,shL:0,shAdj:false,regen:[],stasis:0,cargo:120,loot:0,W:[],skills:[],links:[],dps:0,area:0,count:{},reasons:[],empCost:60};
 let mnC=9,mxC=-1,mnR=9,mxR=-1;
 cells.forEach((c,i)=>{if(c.s!=='ok'||!c.m)return;const col=i%GC,r=i/GC|0;mnC=Math.min(mnC,col);mxC=Math.max(mxC,col);mnR=Math.min(mnR,r);mxR=Math.max(mxR,r)});
 const cMid=(mnC+mxC+1)/2,rMid=(mnR+mxR+1)/2;I.w=mxC-mnC+1;I.h=mxR-mnR+1;
 const modAt=j=>cells[j].s==='ok'&&cells[j].m?cells[j].m.id:null;
 let pilotAdjEng=false,cargoRaw=0;
 cells.forEach((c,i)=>{
  if(c.s!=='ok'||!c.m)return;const e=SHP[c.sh].e,col=i%GC,r=i/GC|0;
  I.parts.push({i,c:col,r,cx:col-cMid,cy:r-rMid,sh:c.sh,rot:c.rot,e,m:c.m});
  I.area+=SHP[c.sh].a;I.hull+=2*e;
  if(!c.m)return;const id=c.m.id,L=c.m.lvl,st=mStat(id,L,WEAP.includes(id)?Math.sqrt(e):e),adj=nb(i).map(modAt);
  I.count[id]=(I.count[id]||0)+1;I.pwu+=pwOf(id,L);
  const lk=(nid,t)=>nb(i).forEach(j=>{if(modAt(j)===nid)I.links.push({a:i,b:j,t})});
  switch(id){
   case'bay':I.hull+=4;break;
   case'reac':I.pwr+=st.pwr;I.nrg+=st.nrg;break;
   case'pilot':I.mag+=st.mag;I.crit+=st.crit;if(adj.includes('eng')){pilotAdjEng=true;lk('eng',tl('Vitesse +15 %','Speed +15%'))}break;
   case'eng':I.spd+=st.spd;break;
   case'shld':I.lay+=st.lay;I.shL+=L;if(adj.includes('reac')){I.shAdj=true;lk('reac',tl('Recharge des boucliers +25 %','Shield recharge +25%'))}break;
   case'armor':I.hull+=st.hp;break;
   case'regen':I.regen.push(st.iv);break;
   case'stasis':I.stasis=Math.max(I.stasis,st.rad);break;
   case'emp':I.nrgMax+=st.nrg;I.empCost=Math.min(I.empCost,st.cost);break;
   case'cargo':{let v=st.cap;if(adj.includes('bay')){v=Math.round(v*1.3);lk('bay',tl('Soute +30 %','Cargo +30%'))}cargoRaw+=v;break}
   case'scan':I.loot+=st.loot;break;
  }
  if(WEAP.includes(id)){
   let dm=1,rm=1;
   nb(i).forEach(j=>{const n=modAt(j);if(!n)return;const ne=SHP[cells[j].sh].e,nL=cells[j].m.lvl;
    if(n==='amp'){dm+=mStat('amp',nL,ne).dmgB/100;I.links.push({a:i,b:j,t:tl(`Dégâts +${Math.round(mStat('amp',nL,ne).dmgB)} %`,`Damage +${Math.round(mStat('amp',nL,ne).dmgB)}%`)})}
    if(n==='cool'){rm+=mStat('cool',nL,ne).rateB/100;I.links.push({a:i,b:j,t:tl(`Cadence +${Math.round(mStat('cool',nL,ne).rateB)} %`,`Fire rate +${Math.round(mStat('cool',nL,ne).rateB)}%`)})}
    if(n==='reac'){rm+=.1;I.links.push({a:i,b:j,t:tl('Cadence +10 %','Fire rate +10%')})}});
   I.W.push({id,i,cx:col-cMid,cy:r-rMid,col,L,e,st,dm,rm,dir:DIRS[col]});
   I.dps+=st.dps*dm*rm;
  }
 });
 I.cargo+=cargoRaw;I.hull=Math.round(I.hull);I.name=ship.name||'';
 if(pilotAdjEng)I.spd*=1.15;
 if(!I.count.eng)I.spd=0;I.spd=Math.min(780,Math.round(I.spd));
 I.shRech=3.2/(1+.12*I.shL)*(I.shAdj?.8:1);
 I.dps*=1+I.crit/100;
 if(I.count.reac)I.skills.push({id:'over',n:tl('Surcharge','Overload'),i:'bolt',cost:35});
 if(I.lay)I.skills.push({id:'emsh',n:tl('Bouclier','Shield'),i:'shld',cost:45});
 if(I.count.mis)I.skills.push({id:'salvo',n:tl('Salve','Salvo'),i:'mis',cost:55});
 if(I.count.emp)I.skills.push({id:'emp',n:tl('Onde EMP','EMP Wave'),i:'emp',cost:I.empCost});
 if(!I.count.pilot)I.reasons.push(tl('Installe un cockpit.','Install a cockpit.'));
 if(!I.count.eng)I.reasons.push(tl('Installe au moins un propulseur.','Install at least one thruster.'));
 if(!I.W.length)I.reasons.push(tl('Installe au moins une arme.','Install at least one weapon.'));
 if(I.pwu>I.pwr)I.reasons.push(tl(`Puissance insuffisante : ${I.pwu} utilisée pour ${I.pwr} produite.`,`Not enough power: ${I.pwu} used, ${I.pwr} produced.`));
 return I;
}
/* ---------- connexité : tous les modules doivent être reliés à la baie ---------- */
function linkedSet(ship,occ){
 const cells=ship.cells,has=occ||(j=>cells[j].s==='ok'&&!!cells[j].m);
 const bay=cells.findIndex(c=>c.m&&c.m.id==='bay');const seen=new Set();if(bay<0)return seen;
 const st=[bay];seen.add(bay);while(st.length){const i=st.pop();for(const j of nb(i))if(!seen.has(j)&&has(j)){seen.add(j);st.push(j)}}
 return seen;
}
const touchesModule=(ship,i)=>nb(i).some(j=>ship.cells[j].s==='ok'&&ship.cells[j].m);
// retire les modules qui ne sont plus reliés à la baie : réserve (campagne) ou suppression (arène)
function pruneShip(ship,toReserve,ghost){
 const ok=linkedSet(ship);let n=0;
 ship.cells.forEach((c,i)=>{if(c.m&&!ok.has(i)&&!MD[c.m.id].fixed){if(toReserve)S.reserve.push({id:c.m.id,lvl:c.m.lvl});if(ghost)c.g=c.m.id;c.m=null;n++}});
 return n;
}
const effOf=(id,sh)=>WEAP.includes(id)?Math.sqrt(SHP[sh].e):SHP[sh].e;
function repCost(){const n=S.ship.cells.filter(c=>c.s==='ok').length;return{m:Math.round(BAL.repairM*Math.pow(BAL.repairFM,n-2)),c:Math.round(BAL.repairC*Math.pow(BAL.repairFC,n-2))}}
const maxMsg=b=>b.multi>1?tl(`Maximum ${b.multi} modules de ce type.`,`Maximum ${b.multi} modules of this type.`):tl('Un seul module de ce type.','Only one module of this type.');
function maxLvl(sand){return sand||plotLvl('yard')>=4?5:3}
function mWhy(id,L,i){
 const sand=sandbox(),b=MD[id],ship=curShip(),I=shipInfo(ship);
 if(SH)return tl('Le vaisseau est en mission.','The ship is on a mission.');
 if(L>=b.max)return tl('Niveau maximum atteint.','Maximum level reached.');
 if(L>=maxLvl(sand))return tl('Niveaux 4 et 5 : chantier orbital niveau 4.','Levels 4 and 5: orbital shipyard level 4.');
 if(!bpOk(id,sand))return tl(`Schéma à récupérer sur le gardien du secteur ${b.bp} (${SEC[b.bp].n}).`,`Schematic dropped by the guardian of sector ${b.bp} (${SEC[b.bp].n}).`);
 if(L===0&&(I.count[id]||0)>=(b.multi||1))return maxMsg(b);
 if(L===0&&i!=null&&!ship.cells[i].m&&!touchesModule(ship,i))return tl('Doit toucher un module déjà installé.','Must touch an installed module.');
 if(b.pw&&id!=='reac'){const dp=L===0?pwOf(id,1):pwOf(id,L+1)-pwOf(id,L);if(dp>0&&I.pwu+dp>I.pwr)return tl('Puissance insuffisante : ajoute ou améliore un réacteur.','Not enough power: add or upgrade a reactor.')}
 if(!sand&&!canPay(mCost(id,L)))return tl('Ressources insuffisantes.','Not enough resources.');
 return null;
}

/* ---------- vue hangar ---------- */
let MOVE=null;
// nom lisible d'une case pour le lecteur d'écran (le dessin seul ne dit rien)
function cellLbl(c,i){
 if(c.s==='void')return tl(`verrouillée, chantier ${TIER[i]}`,`locked, yard ${TIER[i]}`);
 if(c.s==='dmg')return tl('fissurée, à réparer','cracked, needs repair');
 const m=c.m;if(m)return MD[m.id].s+(MD[m.id].fixed?'':tl(` niveau ${m.lvl}`,` level ${m.lvl}`));
 if(c.g&&MD[c.g])return tl(`vide, prévu : ${MD[c.g].s}`,`empty, planned: ${MD[c.g].s}`);
 return tl('vide','empty');
}
function renderShip(){
 const el=$('v-ship');const W=el.clientWidth||360;const ship=curShip(),sand=sandbox(),I=shipInfo(ship);
 const cs=Math.floor(Math.min(60,(W-24)/GC)),gw=cs*GC,gh=cs*GR;
 let svg='';
 for(let i=0;i<GC*GR;i++){const x=(i%GC)*cs,y=(i/GC|0)*cs;svg+=`<rect x="${x+1}" y="${y+1}" width="${cs-2}" height="${cs-2}" rx="3" fill="none" stroke="#62d6e8" stroke-opacity=".08"/>`}
 I.links.forEach(l=>{const ax=(l.a%GC+.5)*cs,ay=((l.a/GC|0)+.5)*cs,bx=(l.b%GC+.5)*cs,by=((l.b/GC|0)+.5)*cs,mx=(ax+bx)/2,my=(ay+by)/2,h=ay===by;svg+=`<rect x="${mx-(h?2.5:8)}" y="${my-(h?8:2.5)}" width="${h?5:16}" height="${h?16:5}" rx="2" fill="var(--amber)"/>`});
 const objMod=!inTuto()&&!sand&&{4:'reac',5:'pilot',6:'eng',7:'laser'}[S.obj];let hinted=false;
 const cellsHTML=ship.cells.map((c,i)=>{const x=(i%GC)*cs,y=(i/GC|0)*cs,st=`style="left:${x}px;top:${y}px;width:${cs}px;height:${cs}px"`;
  let cls='hc',inner='';
  if(MOVE===i)cls+=' sel';else if(MOVE!=null&&c.s==='ok')cls+=' tgt';
  if(c.s==='void'){cls+=' void';inner=`<div class="hi">${ic('lock')}<span>${tl('Chantier','Yard')} ${TIER[i]}</span></div>`}
  else if(c.s==='dmg'){cls+=' dmg';inner=`<div class="hi">${ic('crack')}<span>${tl('Réparer','Repair')}</span></div>`;if(!sand&&S.obj===3&&!hinted){cls+=' hint';hinted=true}}
  else{const m=c.m,col=m?MD[m.id].col:'#46546f';
   inner=`<svg viewBox="-.04 -.04 1.08 1.08">${shpSvg(c.sh,c.rot,m?col+'38':'#1d2537',m?col:'#46546f',1.5)}</svg>`;
   if(m){if(!sand&&!MD[m.id].fixed&&!mWhy(m.id,m.lvl,i))inner+=`<span class="upb" title="${tl('Amélioration possible','Upgrade available')}">${ic('up')}</span>`;const dir=WEAP.includes(m.id)?`<i class="dir" style="color:${col};transform:rotate(${DIRS[i%GC]}rad)"></i>`:'';
    inner+=`${dir}<div class="hi" style="color:${col}">${ic(m.id)}<span>${MD[m.id].s}</span>${MD[m.id].fixed?'':`<span class="pips">${Array.from({length:MD[m.id].max},(_,k)=>`<i class="${k<m.lvl?'on':''}"></i>`).join('')}</span>`}</div>`}
   else if(c.g&&MD[c.g]){const gc=MD[c.g].col;cls+=' gh';inner=`<svg viewBox="-.04 -.04 1.08 1.08">${shpSvg(c.sh,c.rot,gc+'10',gc+'aa',1.5)}</svg><div class="hi" style="color:${gc}">${ic(c.g)}<span>${tl('Prévu','Planned')}</span></div>`}
   else{const near=touchesModule(ship,i);if(!near)cls+=' far';inner+=`<div class="hi" style="color:#56627c"><b style="font:700 16px var(--f-disp)">+</b></div>`;if(near&&objMod&&!hinted&&!I.count[objMod]){cls+=' hint';hinted=true}}}
  return`<button class="${cls}" ${st} data-act="cell" data-arg="${i}" aria-label="${tl('Case','Cell')} ${i+1} : ${cellLbl(c,i)}">${inner}</button>`}).join('');
 const segs=Math.max(1,I.pwr);
 el.innerHTML=`<div class="shipwrap">
  ${arenaOpen()?`<div class="seg2"><button class="${!sand?'on':''}" data-act="editMode" data-arg="camp">${tl('Vaisseau de campagne','Campaign ship')}</button><button class="${sand?'on':''}" data-act="editMode" data-arg="arena">${tl('Vaisseau d’arène','Arena ship')}</button></div>`:''}
  <div class="shn"><div class="shn-t"><small>${sand?tl('Vaisseau d’arène','Arena ship'):tl('Ton vaisseau','Your ship')}</small><b>${esc(ship.name||'')}</b></div><button class="edb" data-act="rename" data-arg="ship" aria-label="${tl('Renommer le vaisseau','Rename the ship')}">${ic('edit')}</button><button class="btn sm ghost" data-act="plans">${ic('plans')}${tl('Plans','Blueprints')}${!sand&&S.reserve.length?`<span class="nb">${S.reserve.length}</span>`:''}</button></div>
  ${sand?tl('<p class="tip"><b>Bac à sable :</b> tout est débloqué et gratuit. Ce vaisseau ne sert que dans la Zone infinie.</p>','<p class="tip"><b>Sandbox:</b> everything is unlocked and free. This ship is only used in the Endless Zone.</p>'):''}
  ${SH?`<div class="away">${ic('map')} ${tl('Le vaisseau est en mission.','The ship is on a mission.')}</div>`:''}
  ${MOVE!=null?`<div class="movebar">${ic('move')}${tl('Touche la case de destination (le module prend sa forme)','Tap the destination cell (the module takes its shape)')}<button class="btn sm ghost" data-act="moveCancel">${tl('Annuler','Cancel')}</button></div>`:''}
  <div id="hang" style="width:${gw}px;height:${gh}px"><svg class="hsvg" width="${gw}" height="${gh}">${svg}</svg>${cellsHTML}</div>
  <p class="tip" style="text-align:center">${tl('▲ avant du vaisseau ▲ · les armes des flancs tirent en diagonale','▲ ship’s nose ▲ · side weapons fire diagonally')}<br>${tl('Seules les cases avec un module sont touchables. Chaque module doit toucher le reste du vaisseau.','Only cells with a module can be hit. Every module must touch the rest of the ship.')}</p>
  ${ship.cells.some(c=>c.m&&!MD[c.m.id].fixed)?`<div class="row" style="justify-content:center"><button class="btn sm ghost red-t" data-act="clearAll" ${SH?'disabled':''}>${ic('trash')}${tl('Tout retirer','Remove all')}</button></div>`:''}
  ${I.reasons.length?`<div class="warn">${I.reasons.map(r=>`<span>${r}</span>`).join('')}</div>`:''}
  <div class="panel">
   <div class="prow"><span>${tl('Puissance','Power')}</span><div class="bar seg" style="--sw:calc(100% / ${segs})"><i style="width:${I.pwr?Math.min(100,I.pwu/I.pwr*100):0}%;background:${I.pwu>I.pwr?'var(--red)':'var(--amber2)'}"></i></div><b>${I.pwu}/${I.pwr}</b></div>
   <div class="stats">
    <div class="stat"><span>${tl('Puissance de feu','Firepower')}</span><b>${f1(I.dps)} ${DPS()}</b></div>
    <div class="stat"><span>${tl('Coque','Hull')}</span><b>${I.hull} ${tl('pts','pts')}</b></div>
    <div class="stat"><span>${tl('Boucliers','Shields')}</span><b>${I.lay} × ${f1(I.shRech)} s</b></div>
    <div class="stat"><span>${tl('Vitesse','Speed')}</span><b>${I.spd||'—'}</b></div>
    <div class="stat"><span>${tl('Surface touchable','Hittable area')}</span><b>${f1(I.area)} ${tl('cases','cells')}</b></div>
    <div class="stat"><span>${sand?tl('Critique','Critical'):tl('Soute','Cargo')}</span><b>${sand?Math.round(I.crit)+PCT():I.cargo}</b></div>
   </div>
   ${I.skills.length?`<div class="row" style="flex-wrap:wrap;gap:6px">${I.skills.map(k=>`<span class="cost" style="color:var(--amber2)">${ic(k.i)}${k.n}</span>`).join('')}</div>`:''}
  </div>
  <p class="tip">${tl('<b>Theorycraft :</b> un carré donne 100 % d’efficacité. Un quart de cercle 90 %, un triangle 78 % (rectangle ou isocèle), un demi-cercle 68 % (les armes perdent moins : 95, 88 et 82 %), mais la pièce est bien plus difficile à toucher. Les barres orange signalent un bonus de voisinage.','<b>Theorycraft:</b> a square gives 100% efficiency. A quarter circle 90%, a triangle 78% (right or isosceles), a half circle 68% (weapons lose less: 95, 88 and 82%), but the part is much harder to hit. Orange bars show a neighbour bonus.')}</p>
 </div>`;
}

/* ---------- feuille d'une case ---------- */
function shapePicker(i){
 const c=curShip().cells[i],sand=sandbox(),yl=plotLvl('yard');
 const btns=[];SHP_ORDER.forEach(k=>{const rots=k==='sq'?[0]:SHP[k].rots||[0,1,2,3];rots.forEach(r=>{const ok=sand||yl>=SHP[k].yard,on=c.sh===k&&(k==='sq'||c.rot===r);
  btns.push(`<button class="shp-b ${on?'on':''}" data-act="shape" data-arg="${i}:${k}:${r}" ${ok&&!SH?'':'disabled'} aria-label="${SHP[k].n}"><svg viewBox="-.06 -.06 1.12 1.12">${shpSvg(k,r,on?'#f2a43a55':'#ffffff18',on?'#ffd089':'#8a96ae',1.5)}</svg>${r===0?`<small>${Math.round(SHP[k].e*100)}%</small>`:''}</button>`)})});
 const lockTxt=sand?'':SHP_ORDER.filter(k=>yl<SHP[k].yard).map(k=>tl(`${SHP[k].n} : chantier niv. ${SHP[k].yard}`,`${SHP[k].n}: shipyard lv. ${SHP[k].yard}`)).join(' · ');
 return`<div class="cat">${tl('Forme de la pièce','Part shape')} · ${SHP[c.sh].n} (${Math.round(SHP[c.sh].e*100)}${PCT()})</div><div class="shapes">${btns.join('')}</div>${lockTxt?`<p class="tip" style="padding:0">${lockTxt}</p>`:''}`;
}
function statLines(id,L,e,max){
 const a=mStat(id,L,e),b=max?null:mStat(id,L+1,e),o=[];
 const nx=(k,fmtF,lab)=>o.push([lab,`<b>${fmtF(a[k])}${b?` <span class="up">→ ${fmtF(b[k])}</span>`:''}</b>`]);
 const pc=v=>Math.round(v)+PCT(),s1=v=>f1(v)+' s',n=v=>f1(v);
 switch(id){
  case'reac':nx('pwr',n,tl('Puissance produite','Power output'));nx('nrg',v=>f1(v)+'/s',tl('Recharge compétences','Skill recharge'));break;
  case'pilot':nx('mag',v=>'+'+Math.round(v),tl('Aimant à butin','Loot magnet'));nx('crit',pc,tl('Coups critiques','Critical hits'));break;
  case'eng':nx('spd',v=>'+'+Math.round(v),tl('Vitesse','Speed'));break;
  case'laser':nx('dmg',n,tl('Dégâts','Damage'));nx('iv',s1,tl('Intervalle','Interval'));nx('b',n,tl('Canons','Barrels'));nx('dps',n,tl('Dégâts/s','Damage/s'));break;
  case'spread':nx('n',n,tl('Plombs','Pellets'));nx('dmg',n,tl('Dégâts par plomb','Damage per pellet'));nx('iv',s1,tl('Intervalle','Interval'));break;
  case'mis':nx('dmg',n,tl('Dégâts','Damage'));nx('iv',s1,tl('Intervalle','Interval'));break;
  case'drone':nx('n',n,tl('Drones','Drones'));nx('dmg',n,tl('Dégâts','Damage'));break;
  case'plasma':nx('dmg',n,tl('Dégâts','Damage'));nx('pierce',n,tl('Ennemis traversés','Enemies pierced'));nx('iv',s1,tl('Intervalle','Interval'));break;
  case'tesla':nx('dmg',n,tl('Dégâts','Damage'));nx('chain',n,tl('Rebonds','Jumps'));break;
  case'beam':nx('dps0',n,tl('Dégâts/s (actif)','Damage/s (active)'));nx('w',n,tl('Largeur','Width'));break;
  case'shld':nx('lay',n,tl('Couches','Layers'));nx('rech',s1,tl('Recharge','Recharge'));break;
  case'armor':nx('hp',n,tl('Coque','Hull'));break;
  case'regen':nx('iv',s1,tl('1 point de coque toutes les','1 hull point every'));break;
  case'stasis':nx('rad',v=>Math.round(v)+' px',tl('Rayon','Radius'));break;
  case'emp':nx('nrg',v=>'+'+Math.round(v),tl('Énergie max','Max energy'));nx('cost',n,tl('Coût de l’onde','Wave cost'));break;
  case'amp':nx('dmgB',pc,tl('Dégâts des voisines','Neighbour damage'));break;
  case'cool':nx('rateB',pc,tl('Cadence des voisines','Neighbour fire rate'));break;
  case'cargo':nx('cap',n,tl('Capacité','Capacity'));break;
  case'scan':nx('loot',pc,tl('Butin bonus','Bonus loot'));break;
 }
 if(MD[id].pw)o.push([tl('Puissance utilisée','Power used'),`<b>${pwOf(id,L)}${max?'':` <span class="up">→ ${pwOf(id,L+1)}</span>`}</b>`]);
 return o;
}
const SHEETS={};
SHEETS.cell=i=>{
 const ship=curShip(),c=ship.cells[i],sand=sandbox(),I=shipInfo(ship);
 if(c.s==='void')return`<div class="sh-h"><div class="big" style="background:#0f2a30;color:var(--cyan)">${ic('lock')}</div><div><h3>${tl('Emplacement verrouillé','Locked slot')}</h3><p>${tl('Coque du vaisseau · case','Ship hull · cell')} ${i+1}</p></div></div><p class="desc">${tl(`Le <b>chantier orbital niveau ${TIER[i]}</b> permettra de construire la structure ici.`,`The <b>orbital shipyard level ${TIER[i]}</b> will let you build the frame here.`)}</p>`;
 if(c.s==='dmg'){const rc=repCost();return`<div class="sh-h"><div class="big" style="background:#2b1d0c;color:var(--amber2)">${ic('crack')}</div><div><h3>${tl('Structure endommagée','Damaged frame')}</h3><p>${tl('À réparer','Needs repair')}</p></div></div><p class="desc">${tl('Une fois réparée, la case accueille une pièce de coque, avec la forme et le module de ton choix.','Once repaired, the cell holds a hull part with the shape and module of your choice.')}</p>${costHTML(rc)}<button class="btn wide" data-act="repairCell" data-arg="${i}" ${canPay(rc)&&!SH?'':'disabled'}>${tl('Réparer la structure','Repair the frame')}</button>`}
 const head=c.m?`<div class="sh-h"><div class="big" style="background:${MD[c.m.id].col}22;color:${MD[c.m.id].col}">${ic(c.m.id)}</div><div><h3>${MD[c.m.id].n}</h3><p>${MD[c.m.id].fixed?tl('Module d’origine','Original module'):`${tl('Niveau','Level')} ${c.m.lvl} / ${maxLvl(sand)}`} · ${SHP[c.sh].n}</p></div></div>`
  :`<div class="sh-h"><div class="big" style="background:#ffffff08">${ic('ship')}</div><div><h3>${tl('Pièce de coque','Hull part')}</h3><p>${SHP[c.sh].n} · ${Math.round(SHP[c.sh].e*100)}${PCT()} ${tl('d’efficacité','efficiency')}</p></div></div>`;
 let body='';
 if(c.m){const m=c.m,b=MD[m.id],e=SHP[c.sh].e,max=m.lvl>=Math.min(b.max,maxLvl(sand));
  const lines=b.fixed?[]:statLines(m.id,m.lvl,effOf(m.id,c.sh),max);
  const links=I.links.filter(l=>l.a===i||l.b===i).map(l=>`<div><span style="color:var(--amber2)">${ic('bolt')}</span><b style="font-family:var(--f-body)">${l.t}</b></div>`).join('');
  let act='';
  if(!b.fixed){
   if(sand)act=`<div class="cat">${tl('Niveau','Level')}</div><div class="lvpick">${[1,2,3,4,5].map(l=>`<button class="${l===m.lvl?'on':''}" data-act="setLvl" data-arg="${i}:${l}">${l}</button>`).join('')}</div>`;
   else if(!max){const why=mWhy(m.id,m.lvl,i);act=`<div class="sep"></div><b style="font:700 15px var(--f-disp)">${tl('Niveau','Level')} ${m.lvl+1}</b>${costHTML(mCost(m.id,m.lvl))}${why?`<div class="why">${why}</div>`:''}<button class="btn wide" data-act="upM" data-arg="${i}" ${why?'disabled':''}>${ic('up')}${tl('Améliorer','Upgrade')}</button>`}
   else act=`<p class="desc" style="color:var(--green)">${m.lvl<b.max?tl('Niveau maximum pour l’instant (chantier niv. 4 requis).','Maximum level for now (shipyard lv. 4 required).'):tl('Niveau maximum atteint.','Maximum level reached.')}</p>`;
  }
  if(!sand&&!b.fixed){const lv=[...new Set(resvOf(m.id))].filter(L=>L!==m.lvl);if(lv.length)act+=`<div class="sep"></div><div class="resv">${ic('plans')}${tl('Échanger avec la réserve, niveau :','Swap with a spare part, level:')}</div><div class="rpick">${lv.map(L=>`<button class="lvc" data-act="swapR" data-arg="${i}:${L}" ${SH?'disabled':''}>${L}</button>`).join('')}</div>`}
  act+=`<div class="row"><button class="btn ghost" data-act="moveStart" data-arg="${i}" ${SH?'disabled':''}>${ic('move')}${tl('Déplacer','Move')}</button>${b.fixed?'':`<button class="btn ghost" data-act="rmM" data-arg="${i}" ${SH?'disabled':''}>${ic('trash')}${sand?tl('Retirer','Remove'):tl('Vers la réserve','To spare parts')}</button>`}</div>`;
  body=`<p class="desc">${b.d}</p>${lines.length?`<div class="kv">${lines.map(([k,v])=>`<div><span>${k}</span>${v}</div>`).join('')}</div>`:''}${links?`<div class="kv">${links}</div>`:''}${act}`;
 }else{
  const item=id=>{const b=MD[id],why=mWhy(id,0,i),cost=mCost(id,0),locked=!bpOk(id,sand);
   const st=mStat(id,1,effOf(id,c.sh)),key=WEAP.includes(id)?`${f1(st.dps)} ${DPS()}`:'';
   const rv=sand?[]:resvOf(id),rb=rv.find(L=>!rWhy(id,L,i)),lv=[...new Set(rv)];
   const rHTML=rv.length?`<div class="resv">${ic('plans')}${tl('Installer depuis la réserve, niveau :','Install a spare part, level:')}</div><div class="rpick">${lv.map(L=>{const n=rv.filter(x=>x===L).length,w=rWhy(id,L,i);return`<button class="lvc" data-act="putR" data-arg="${i}:${id}:${L}" ${w?`disabled title="${esc(w)}"`:''}>${L}${n>1?`<small>×${n}</small>`:''}</button>`}).join('')}</div>${rb?'':`<div class="why">${rWhy(id,rv[0],i)}</div>`}`:'';
   return`<div class="li ${locked&&!rv.length?'lock':''}"><div class="lic" style="background:${b.col}22;color:${b.col}">${ic(locked&&!rv.length?'lock':id)}</div><div><h4>${b.n}${key?` <span style="font:12px var(--f-mono);color:var(--dim)">${key}</span>`:''}</h4><p>${b.d}</p>${rHTML}${sand?'':`<div class="row" style="justify-content:space-between">${costHTML(cost)}${b.pw?`<span class="cost" style="color:var(--amber2)">${ic('bolt')}${b.pw}</span>`:''}</div>`}${why&&!rb?`<div class="why">${why}</div>`:''}<div class="row"><button class="btn ${rb?'ghost':''}" data-act="buildM" data-arg="${i}:${id}" ${why?'disabled':''}>${tl('Installer','Install')}${rb?tl(' un neuf',' new'):''}</button></div></div></div>`};
  body=(c.g&&MD[c.g]?`<div class="cat" style="color:var(--cyan)">${tl('Prévu par le plan','Planned by the blueprint')}</div><div class="list">${item(c.g)}</div>`:'')+CAT.map(([k,lab])=>{const ids=MD_ORDER.filter(id=>MD[id].cat===k);return`<div class="cat">${lab}</div><div class="list">${ids.map(item).join('')}</div>`}).join('');
  body=`<p class="tip" style="padding:0">${tl(`Puissance ${I.pwu}/${I.pwr}. La forme de la pièce multiplie l’efficacité du module installé.`,`Power ${I.pwu}/${I.pwr}. The part’s shape multiplies the efficiency of the installed module.`)}</p>${body}`;
 }
 return head+shapePicker(i)+body;
};

/* ---------- actions hangar ---------- */
Object.assign(ACT,{
 cell:i=>{i=+i;const ship=curShip();
  if(MOVE!=null){const c=ship.cells[i];if(i===MOVE){MOVE=null;renderShip();return}if(c.s!=='ok'){toast(tl('Choisis une case réparée','Pick a repaired cell'),'bad');SFX.err();return}
   const a=ship.cells[MOVE];if(!c.m){const occ=j=>j===i||(j!==MOVE&&ship.cells[j].s==='ok'&&!!ship.cells[j].m);const nOcc=ship.cells.filter((x,j)=>occ(j)).length;const tmpM=a.m;a.m=null;c.m=tmpM;const ok=linkedSet(ship).size===nOcc;c.m=null;a.m=tmpM;if(!ok){toast(tl('Le vaisseau doit rester d’un seul tenant, relié à la baie','The ship must stay in one piece, linked to the bay'),'bad');SFX.err();return}}
   [a.m,c.m]=[c.m,a.m];[a.g,c.g]=[c.g,a.g];MOVE=null;if(!sandbox()&&(a.m||c.m))S.flags.moved=1;SFX.build();renderShip();checkObj();return}
  SFX.click();openSheet('cell',i)},
 repairCell:i=>{const c=repCost();if(!canPay(c)||SH){SFX.err();return}pay(c);S.ship.cells[+i].s='ok';SFX.build();toast(tl('Structure réparée','Frame repaired'),'ok');renderShip();openSheet('cell',+i);checkObj()},
 shape:a=>{const[i,k,r]=a.split(':');const c=curShip().cells[+i];if(busy()||!sandbox()&&plotLvl('yard')<SHP[k].yard)return;c.sh=k;c.rot=+r;S.flags.shaped=S.flags.shaped||k!=='sq';SFX.click();renderShip();renderSheet();checkObj()},
 buildM:a=>{const[i,id]=a.split(':');const why=mWhy(id,0,+i);if(why){SFX.err();toast(why,'bad');return}if(!sandbox())pay(mCost(id,0));const cc=curShip().cells[+i];cc.m={id,lvl:1};delete cc.g;SFX.build();renderShip();openSheet('cell',+i);checkObj()},
 upM:i=>{const m=curShip().cells[+i].m;const why=mWhy(m.id,m.lvl,+i);if(why){SFX.err();toast(why,'bad');return}pay(mCost(m.id,m.lvl));m.lvl++;S.flags.upgraded=1;SFX.build();renderShip();renderSheet();checkObj()},
 setLvl:a=>{if(busy())return;const[i,l]=a.split(':');curShip().cells[+i].m.lvl=+l;SFX.click();renderShip();renderSheet()},
 rmM:i=>{i=+i;const c=curShip().cells[i],m=c.m;if(!m||MD[m.id].fixed||busy())return;
  if(!sandbox()){S.reserve.push({id:m.id,lvl:m.lvl});S.flags.reserved=1;tipOnce('reserve')}
  c.m=null;const cut=pruneShip(curShip(),!sandbox());SFX.click();toast((sandbox()?tl('Module retiré','Module removed'):tl(`${MD[m.id].n} niv. ${m.lvl} rangé en réserve`,`${MD[m.id].n} lv. ${m.lvl} moved to spare parts`))+(cut?tl(` · ${cut} module${cut>1?'s':''} isolé${cut>1?'s':''} ${sandbox()?'retiré':'rangé'}${cut>1?'s':''} aussi`,` · ${cut} isolated module${cut>1?'s':''} ${sandbox()?'removed':'stored'} too`):''),'amb');renderShip();openSheet('cell',i);save()},
 clearAll:()=>{if(busy())return;const sand=sandbox(),n=curShip().cells.filter(c=>c.m&&!MD[c.m.id].fixed).length;SFX.click();
  modal({eyebrow:tl('Hangar','Hangar'),title:tl('Tout retirer ?','Remove everything?'),text:sand?tl(`Les ${n} modules du vaisseau d’arène seront retirés. Seule la baie reste en place.`,`All ${n} modules of the arena ship will be removed. Only the bay stays.`):tl(`Les ${n} modules partent en réserve avec leur niveau : tu pourras les réinstaller gratuitement. Seule la baie reste en place.`,`All ${n} modules go to spare parts with their level: you can reinstall them for free. Only the bay stays.`),
   choices:[{l:tl('Tout retirer','Remove all'),cls:'red',f:()=>{curShip().cells.forEach(c=>{delete c.g;if(c.m&&!MD[c.m.id].fixed){if(!sand)S.reserve.push({id:c.m.id,lvl:c.m.lvl});c.m=null}});MOVE=null;closeSheet();renderShip();save();toast(sand?tl('Vaisseau vidé','Ship cleared'):tl(`${n} modules rangés en réserve`,`${n} modules moved to spare parts`),'amb')}},{l:tl('Annuler','Cancel'),cls:'ghost'}]})},
 moveStart:i=>{if(busy())return;MOVE=+i;closeSheet();renderShip()},
 moveCancel:()=>{MOVE=null;renderShip()},
 editMode:m=>{S.edit=m;MOVE=null;SFX.click();renderShip()}
});

/* ---------- réserve et plans ---------- */
const busy=()=>{if(!SH)return false;SFX.err();toast(tl('Le vaisseau est en mission.','The ship is on a mission.'),'bad');return true};
const resvOf=id=>S.reserve.filter(r=>r.id===id).map(r=>r.lvl).sort((a,b)=>b-a);
function rWhy(id,L,i){
 const ship=curShip(),I=shipInfo(ship),b=MD[id];
 if(SH)return tl('Le vaisseau est en mission.','The ship is on a mission.');
 if((I.count[id]||0)>=(b.multi||1))return maxMsg(b);
 if(i!=null&&!ship.cells[i].m&&!touchesModule(ship,i))return tl('Doit toucher un module déjà installé.','Must touch an installed module.');
 if(b.pw&&id!=='reac'&&I.pwu+pwOf(id,L)>I.pwr)return tl(`Puissance insuffisante pour le niveau ${L} : ajoute ou améliore un réacteur.`,`Not enough power for level ${L}: add or upgrade a reactor.`);
 return null;
}
function refundOf(m){const o={m:0,c:0};for(let k=0;k<m.lvl;k++){const q=mCost(m.id,k);o.m+=Math.floor((q.m||0)/2);o.c+=Math.floor((q.c||0)/2)}return o}
const slotOpen=k=>sandbox()||plotLvl('yard')>=k+1;
function shipMini(cells,px=64){
 const w=px,h=px*GR/GC;let g='';
 cells.forEach((c,i)=>{if(c.s&&c.s!=='ok')return;const x=i%GC,y=i/GC|0,m=c.m,col=m&&MD[m.id]?MD[m.id].col:'#46546f';
  g+=`<g transform="translate(${x} ${y})">${shpSvg(c.sh,c.rot,m?col+'55':'#1d2537',m?col:'#46546f',1)}</g>`});
 return`<svg class="mini" width="${w}" height="${h}" viewBox="-.1 -.1 ${GC+.2} ${GR+.2}">${g}</svg>`;
}
function planOf(ship){
 const I=shipInfo(ship);
 return{name:ship.name||tl('Sans nom','Unnamed'),t:Date.now(),src:sandbox()?'arena':'camp',dps:I.dps,hull:I.hull,area:I.area,
  cells:ship.cells.map(c=>({s:c.s,sh:c.sh,rot:c.rot,m:c.m?{id:c.m.id,lvl:c.m.lvl}:(c.g?{id:c.g,lvl:1}:null)}))};
}
function applyPlan(P){
 const ship=curShip();
 if(sandbox()){ship.cells=P.cells.map(c=>({s:'ok',sh:c.sh,rot:c.rot,m:c.m?{id:c.m.id,lvl:c.m.id==='bay'?1:Math.min(5,c.m.lvl)}:null}));
  if(!ship.cells.some(c=>c.m&&c.m.id==='bay'))ship.cells[17].m={id:'bay',lvl:1};pruneShip(ship,false);ship.name=P.name;return{miss:[],shp:0}}
 const yl=plotLvl('yard'),out={miss:[],shp:0};
 ship.cells.forEach(c=>{delete c.g;if(c.m&&!MD[c.m.id].fixed){S.reserve.push({id:c.m.id,lvl:c.m.lvl});c.m=null}});
 const cb=ship.cells.findIndex(c=>c.m&&c.m.id==='bay'),pb=P.cells.findIndex(c=>c.m&&c.m.id==='bay');
 if(pb>=0&&pb!==cb&&ship.cells[pb].s==='ok'){ship.cells[pb].m=ship.cells[cb].m;ship.cells[cb].m=null}
 ship.cells.forEach((c,i)=>{if(c.s!=='ok')return;const q=P.cells[i];if(yl>=SHP[q.sh].yard){c.sh=q.sh;c.rot=q.rot}else{if(q.sh!=='sq')out.shp++;c.sh='sq';c.rot=0}});
 const cnt={};
 const order=P.cells.map((q,i)=>({q,i})).filter(o=>o.q.m&&o.q.m.id!=='bay').sort((a,b)=>(b.q.m.id==='reac')-(a.q.m.id==='reac'));
 order.forEach(({q,i})=>{const id=q.m.id,c=ship.cells[i];
  if(c.s!=='ok'||c.m||(cnt[id]||0)>=(MD[id].multi||1)){out.miss.push(id);return}
  let k=-1,bd=99;S.reserve.forEach((r,j)=>{if(r.id!==id)return;const d=Math.abs(r.lvl-q.m.lvl)*2-(r.lvl>q.m.lvl?1:0);if(d<bd){bd=d;k=j}});
  if(k<0){c.g=id;out.miss.push(id);return}
  c.m=S.reserve.splice(k,1)[0];cnt[id]=(cnt[id]||0)+1});
 out.cut=pruneShip(ship,true,true);
 ship.name=P.name;return out;
}
SHEETS.plans=()=>{
 const sand=sandbox(),ship=curShip(),cf=SHEET&&SHEET.confirm;
 const slots=[0,1,2].map(k=>{const P=S.plans[k];
  if(!slotOpen(k))return`<div class="plan lock"><div class="mini ph">${ic('lock')}</div><div><h4>${tl('Emplacement','Slot')} ${k+1}</h4><p>${tl(`Se débloque avec le <b>chantier orbital niveau ${k+1}</b>.`,`Unlocks with the <b>orbital shipyard level ${k+1}</b>.`)}</p></div></div>`;
  return`<div class="plan">${P?shipMini(P.cells):`<div class="mini ph">${ic('plans')}</div>`}<div><h4>${P?esc(P.name):`${tl('Emplacement','Slot')} ${k+1}`}${P&&P.src==='arena'?` <span class="tagx">${tl('arène','arena')}</span>`:''}</h4>
   ${P?`<p class="pst"><span>${f1(P.dps)} ${DPS()}</span><span>· ${P.hull} ${tl('coque','hull')}</span><span>· ${new Date(P.t).toLocaleDateString(LOC(),{day:'numeric',month:'short'})}</span></p>`:`<p>${tl('Emplacement vide.','Empty slot.')}</p>`}
   <div class="row"><button class="btn sm ${cf==='sv'+k?'red':'ghost'}" data-act="savePlan" data-arg="${k}">${ic('save')}${cf==='sv'+k?tl('Écraser ?','Overwrite?'):tl('Enregistrer','Save')}</button>${P?`<button class="btn sm ${cf==='ld'+k?'red':''}" data-act="loadPlan" data-arg="${k}" ${SH?'disabled':''}>${ic('load')}${cf==='ld'+k?tl('Confirmer','Confirm'):tl('Charger','Load')}</button>`:''}</div></div></div>`}).join('');
 let rsv='';
 if(!sand){const grp={};S.reserve.forEach(r=>{const key=r.id+':'+r.lvl;grp[key]=(grp[key]||0)+1});
  const keys=Object.keys(grp).sort((a,b)=>MD_ORDER.indexOf(a.split(':')[0])-MD_ORDER.indexOf(b.split(':')[0])||b.split(':')[1]-a.split(':')[1]);
  rsv=`<div class="cat">${tl('Réserve','Spare parts')}${S.reserve.length?` · ${S.reserve.length} module${S.reserve.length>1?'s':''}`:''}</div>${keys.length?`<div class="list">${keys.map(key=>{const[id,L]=key.split(':'),b=MD[id],rf=refundOf({id,lvl:+L});
   return`<div class="li rsv"><div class="lic" style="background:${b.col}22;color:${b.col}">${ic(id)}</div><div><h4>${b.n} <span style="font:12px var(--f-mono);color:var(--dim)">${tl('niv.','lv.')} ${L}${grp[key]>1?' × '+grp[key]:''}</span></h4><div class="row" style="justify-content:space-between">${lootHTML(rf)}<button class="btn sm ${cf==='rc'+key?'red':'ghost'}" data-act="recycle" data-arg="${key}">${ic('recycle')}${cf==='rc'+key?tl('Confirmer','Confirm'):tl('Recycler','Recycle')}</button></div></div></div>`}).join('')}</div>`:`<p class="tip" style="padding:0">${tl('Vide. Un module démonté arrive ici avec son niveau : tu peux le réinstaller gratuitement sur une case vide, ou le recycler contre la moitié de son métal et de son cristal.','Empty. A dismantled module lands here with its level: you can reinstall it for free on an empty cell, or recycle it for half of its metal and crystal.')}</p>`}`}
 return`<div class="sh-h"><div class="big" style="background:#0f2a30;color:var(--cyan)">${ic('plans')}</div><div><h3>${tl(`Plans de ${esc(ship.name)}`,`${esc(ship.name)} · blueprints`)}</h3><p>${sand?tl('Vaisseau d’arène · copie gratuite','Arena ship · free copy'):tl('3 emplacements partagés avec l’arène','3 slots shared with the arena')}</p></div></div>
 <p class="desc">${sand?tl('Charger un plan copie la configuration à l’identique, sans rien coûter.','Loading a blueprint copies the layout exactly, at no cost.'):tl('Charger un plan range tous tes modules en réserve, puis les replace selon le plan, au niveau le plus proche de celui enregistré. Les modules que tu ne possèdes pas apparaissent en pointillés : touche la case pour les construire.','Loading a blueprint moves all your modules to spare parts, then puts them back following the blueprint, at the level closest to the saved one. Modules you don’t own show as dotted outlines: tap the cell to build them.')}</p>
 <div class="list">${slots}</div>${rsv}`;
};
Object.assign(ACT,{
 plans:()=>{SFX.click();MOVE=null;openSheet('plans')},
 savePlan:k=>{k=+k;if(!slotOpen(k))return;if(S.plans[k]&&SHEET.confirm!=='sv'+k){SHEET.confirm='sv'+k;renderSheet();return}
  S.plans[k]=planOf(curShip());SHEET.confirm=null;SFX.build();toast(tl(`Plan enregistré dans l’emplacement ${k+1}`,`Blueprint saved to slot ${k+1}`),'ok');renderSheet();save()},
 loadPlan:k=>{k=+k;const P=S.plans[k];if(!P||!slotOpen(k))return;if(SH){toast(tl('Le vaisseau est en mission','The ship is on a mission'),'bad');SFX.err();return}
  if(SHEET.confirm!=='ld'+k){SHEET.confirm='ld'+k;renderSheet();return}
  const o=applyPlan(P);MOVE=null;SFX.build();closeSheet();renderShip();checkObj();save();
  if(o.miss.length){const g={};o.miss.forEach(id=>g[id]=(g[id]||0)+1);toast(`${tl('Plan chargé · manquent :','Blueprint loaded · missing:')} ${Object.keys(g).map(id=>(g[id]>1?g[id]+' × ':'')+MD[id].n).join(', ')}${o.cut?tl(` · ${o.cut} en réserve faute de liaison`,` · ${o.cut} in spare parts (not linked)`):''}`,'amb')}
  else toast(o.shp?tl(`Plan chargé · ${o.shp} forme${o.shp>1?'s':''} pas encore débloquée${o.shp>1?'s':''}, remplacée${o.shp>1?'s':''} par des carrés`,`Blueprint loaded · ${o.shp} locked shape${o.shp>1?'s':''} replaced by squares`):tl('Plan chargé','Blueprint loaded'),'ok')},
 putR:a=>{const[i,id,L]=a.split(':');const why=rWhy(id,+L,+i);if(why){SFX.err();toast(why,'bad');return}
  const j=S.reserve.findIndex(r=>r.id===id&&r.lvl===+L);if(j<0)return;const c=curShip().cells[+i];c.m=S.reserve.splice(j,1)[0];delete c.g;SFX.build();renderShip();openSheet('cell',+i);checkObj();save()},
 swapR:a=>{const[i,L]=a.split(':').map(Number);const c=curShip().cells[i],m=c.m;if(!m||busy())return;const j=S.reserve.findIndex(r=>r.id===m.id&&r.lvl===L);if(j<0)return;
  if(MD[m.id].pw&&m.id!=='reac'){const I=shipInfo(curShip()),dp=pwOf(m.id,L)-pwOf(m.id,m.lvl);if(dp>0&&I.pwu+dp>I.pwr){SFX.err();toast(tl(`Puissance insuffisante pour le niveau ${L} : ajoute ou améliore un réacteur.`,`Not enough power for level ${L}: add or upgrade a reactor.`),'bad');return}}
  c.m=S.reserve.splice(j,1)[0];S.reserve.push(m);SFX.build();toast(tl(`${MD[m.id].n} : niv. ${m.lvl} rangé, niv. ${L} installé`,`${MD[m.id].n}: lv. ${m.lvl} stored as spare, lv. ${L} installed`),'ok');renderShip();renderSheet();save()},
 recycle:key=>{if(SHEET.confirm!=='rc'+key){SHEET.confirm='rc'+key;renderSheet();return}
  const[id,L]=key.split(':'),j=S.reserve.findIndex(r=>r.id===id&&r.lvl===+L);if(j<0)return;const m=S.reserve.splice(j,1)[0],rf=refundOf(m);
  const lost=gain(rf);SHEET.confirm=null;SFX.collect();toast(tl(`${MD[id].n} recyclé${lost?` · ${fmt(lost)} perdus, stock plein`:''}`,`${MD[id].n} recycled${lost?` · ${fmt(lost)} lost, storage full`:''}`),'ok');renderShip();renderSheet();save()}
});
