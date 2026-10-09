
/* ---------- textes anglais des données ---------- */
const EN_DATA=()=>[
 [RES,{m:{n:'metal'},c:{n:'crystal'},x:{n:'xeno'},p:{n:'colonists'}}],
 [PB,{
  mineM:{n:'Metal Mine',d:'Drills into the crust of § and hauls up iron ore.'},
  mineC:{n:'Crystal Extractor',d:'Cuts the crystal veins running under the surface.'},
  habitat:{n:'Habitat',d:'Domes where colonists settle: 12 berths per level. Nobody moves to a dead planet, so only the viable share of the domes fills up.'},
  labX:{n:'Xeno Synthesizer',d:'Slowly reproduces xeno components from the samples brought back from missions.'},
  atmo:{n:'Atmospheric Processor',d:'Thickens the atmosphere. Each level adds 8% viability.'},
  water:{n:'Water Condenser',d:'Releases the water trapped in the ground. Each level adds 7% viability.'},
  bio:{n:'Seeding Greenhouses',d:'Spread lichens and microorganisms. Each level adds 6% viability.'},
  yard:{n:'Orbital Shipyard',d:'Expands the ship’s hull, unlocks new part shapes, then module levels 4 and 5.'},
  depot:{n:'Depot',d:'Buildings keep stockpiling longer while you are away: +2 h of storage per level.'}}],
 [STAGES,[{n:'Dead planet'},
  {n:'Thin atmosphere',txt:'The atmosphere thickens and the sky of § starts turning blue. The first colonists agree to come.'},
  {n:'First rains',txt:'For the first time in centuries, it rains on §. Lakes form at the bottom of the craters.'},
  {n:'First lichens',txt:'Lichens cling to the wet rocks. Green patches appear around the lakes.'},
  {n:'Viable planet',txt:'§ is viable. Colonists can finally leave the domes and breathe the open air.'}]],
 [YARD_TXT,['','Expands the hull and unlocks triangular parts.','Expands the hull and unlocks quarter-circle parts.','Completes the hull and unlocks half-circle parts.','Unlocks module levels 4 and 5.']],
 [SHP,{sq:{n:'Square'},qt:{n:'Quarter circle'},tr:{n:'Triangle'},is:{n:'Isosceles triangle'},hf:{n:'Half circle'}}],
 [CAT,[[,'Systems'],[,'Weapons'],[,'Defense'],[,'Utility']]],
 [MD,{
  bay:{n:'Unloading Bay',s:'Bay',d:'The heart of the wreck. It can’t be dismantled, but you can move it.'},
  reac:{n:'Reactor',s:'Reactor',d:'Powers the modules and recharges the skill gauge. Unlocks Overload.'},
  pilot:{n:'Cockpit',s:'Cockpit',d:'Required. Widens the loot magnet and grants critical hits.'},
  eng:{n:'Thruster',s:'Thruster',d:'Required. Makes the ship faster. Next to the cockpit: +15% speed.'},
  laser:{n:'Laser',s:'Laser',d:'Fast, accurate fire. Twin barrels from level 3.'},
  spread:{n:'Scattergun',s:'Scatter',d:'A short-range spray of pellets, devastating up close.'},
  mis:{n:'Missile Launcher',s:'Missiles',d:'Homing missiles. Unlocks the Salvo skill.'},
  drone:{n:'Drone Bay',s:'Drones',d:'Drones escort the ship and shoot the nearest enemy.'},
  plasma:{n:'Plasma Cannon',s:'Plasma',d:'A slow, heavy projectile that pierces several enemies.'},
  tesla:{n:'Tesla Coil',s:'Tesla',d:'Zaps the nearest enemy, then the arc jumps to its neighbours.'},
  beam:{n:'Beam',s:'Beam',d:'A pulsing beam that cuts through everything in front of it.'},
  shld:{n:'Shield',s:'Shield',d:'Each layer absorbs one shot, then recharges. Unlocks the Shield skill.'},
  armor:{n:'Armor',s:'Armor',d:'Thick plating: lots of hull points, no power needed.'},
  regen:{n:'Nano-repairer',s:'Repair',d:'Repairs the hull during the mission.'},
  stasis:{n:'Stasis Field',s:'Stasis',d:'Halves the speed of enemy shots entering the field.'},
  emp:{n:'EMP Generator',s:'EMP',d:'Unlocks the EMP Wave, which wipes enemy shots. Raises maximum energy.'},
  amp:{n:'Amplifier',s:'Amp',d:'Boosts the damage of neighbouring weapons (up, down, left, right).'},
  cool:{n:'Cooler',s:'Cooler',d:'Boosts the fire rate of neighbouring weapons.'},
  cargo:{n:'Cargo Hold',s:'Cargo',d:'Raises how much loot a mission can bring back. Next to the bay: +30%.'},
  scan:{n:'Scanner',s:'Scanner',d:'Enemies drop more loot and xeno.'}}],
 [SEC,[null,
  {n:'Kessler Belt',d:'A ring of debris where raider drones prowl.'},
  {n:'Orsa Nebula',d:'An ionized fog. Snipers lock onto their target before firing.'},
  {n:'Vael Ice Fields',d:'Cruisers hide among the ice blocks. Some enemies split when they die.'},
  {n:'Black Frontier',d:'Minelayers saturate space. Shots hit harder.'},
  {n:'Xeno Core',d:'The source of xeno components. Whatever guards it has never been defeated.'}]],
 [BOSSN,['','Kessler Sentinel','Orsa Warden','Vael Leviathan','Frontier Colossus','Xeno Core']],
 [OBJ,OBJ.map(o=>({t:o.en}))]
];
function setF(o,f,en){if(!o||en==null)return;if(!o.__fr)Object.defineProperty(o,'__fr',{value:{},enumerable:false});if(!(f in o.__fr))o.__fr[f]=o[f];o[f]=LANG==='en'?en:o.__fr[f]}
function ovl(tbl,en){for(const k in en){const e=en[k];if(e&&typeof e==='object')ovl(tbl[k],e);else setF(tbl,k,e)}}
function applyShell(){
 if(SIM||typeof document==='undefined')return;
 document.documentElement.lang=LANG;
 const set=(sel,t)=>{const e=document.querySelector(sel);if(e)e.textContent=t};
 set('#spltag',tl('Construis. Tire. Respire.','Build. Shoot. Breathe.'));
 set('#splgo',matchMedia('(hover:hover) and (pointer:fine)').matches?tl('Clique pour commencer','Click to start'):tl('Touche pour commencer','Tap to start'));
 set('#rot span',tl('Tourne ton téléphone en mode portrait','Turn your phone to portrait'));
 set('#v-planet .vt>span',tl('Planète tellurique · orbite basse','Rocky planet · low orbit'));
 set('#colAll',tl('Tout récupérer','Collect all'));
 const al=(sel,t)=>{const e=document.querySelector(sel);if(e)e.setAttribute('aria-label',t)};
 al('#gear',tl('Réglages','Settings'));al('#terra',tl('Viabilité de la planète','Planet viability'));al('.shx',tl('Fermer','Close'));al('#v-planet .edb',tl('Renommer la planète','Rename the planet'));
}
function applyLang(){EN_DATA().forEach(([t,e])=>ovl(t,e));applyShell()}
function setLang(l){
 if(l===LANG)return;LANG=l;try{localStorage.setItem(LANG_KEY,l)}catch(e){}
 applyLang();lastRes={};plotSig='';renderAll();if(view==='planet')renderPlots(true);renderSheet();fitPName();
}
