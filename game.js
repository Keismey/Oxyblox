/* Keismey Studio — outils communs aux jeux du hub (même fichier dans chaque jeu).

   KS.support()                      ouvre la page de soutien (Ko-fi) dans un nouvel onglet
   KS.bug(jeu, lang)                 ouvre le formulaire du hub, type « Bug », titre prérempli avec le nom du jeu
   KS.saveDialog({ jeu, keys, lang })
                                     fenêtre « Sauvegarde » : exporter (code à copier ou fichier) et importer.
                                     keys = clés localStorage de la partie ; la première est la sauvegarde principale.
   Au premier toucher, le jeu demande au navigateur de garder ses données (stockage persistant).

   Import : le code est rangé, la page se recharge, et ce fichier l'écrit dans le stockage AVANT
   que le jeu ne démarre (le jeu ne peut donc pas l'écraser en sauvegardant au moment de quitter). */
(function () {
  'use strict';
  var DIR = location.pathname.split('/')[1] || '';
  var PENDING = 'ks-import:' + DIR;

  // 1. import en attente : appliqué avant le jeu
  try {
    var p = sessionStorage.getItem(PENDING);
    if (p) {
      sessionStorage.removeItem(PENDING);
      var d = JSON.parse(p);
      Object.keys(d).forEach(function (k) {
        if (d[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, d[k]);
      });
    }
  } catch (e) {}

  // 2. stockage persistant, demandé une fois au premier geste du joueur
  var asked = false;
  function persist(e) {
    if (asked || (e && e.isTrusted === false)) return;
    asked = true;
    try {
      if (navigator.storage && navigator.storage.persist && navigator.storage.persisted)
        navigator.storage.persisted().then(function (ok) { if (!ok) navigator.storage.persist().catch(function () {}); }).catch(function () {});
    } catch (err) {}
  }
  window.addEventListener('pointerup', persist, true);
  window.addEventListener('keydown', persist, true);

  // 3. textes
  var TX = {
    fr: { title: 'Sauvegarde', intro: 'Garde ce code ou le fichier en lieu sûr : il permet de retrouver ta partie sur un autre appareil ou après avoir effacé les données du navigateur.',
      copy: 'Copier le code', copied: 'Code copié', file: 'Télécharger le fichier', load: 'Charger une partie',
      paste: 'Colle un code de sauvegarde, ou choisis un fichier.', pick: 'Choisir un fichier', go: 'Charger',
      confirm: 'Remplacer ta partie actuelle par celle-ci ? Ta partie actuelle sera perdue.', yes: 'Oui, remplacer', no: 'Annuler',
      bad: 'Code invalide, ou code d’un autre jeu.', close: 'Fermer', empty: 'Aucune partie à sauvegarder pour l’instant.' },
    en: { title: 'Save', intro: 'Keep this code or the file somewhere safe: it lets you get your game back on another device or after clearing your browser data.',
      copy: 'Copy the code', copied: 'Code copied', file: 'Download the file', load: 'Load a game',
      paste: 'Paste a save code, or choose a file.', pick: 'Choose a file', go: 'Load',
      confirm: 'Replace your current game with this one? Your current game will be lost.', yes: 'Yes, replace', no: 'Cancel',
      bad: 'Invalid code, or a code from another game.', close: 'Close', empty: 'No game to save yet.' }
  };

  // 4. code de sauvegarde : KS1.<jeu>.<base64 du JSON>
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))); }
  function b64d(s) { return decodeURIComponent(escape(atob(s))); }
  function makeCode(keys) {
    var d = {}, any = false;
    keys.forEach(function (k) { var v = null; try { v = localStorage.getItem(k); } catch (e) {} d[k] = v; if (v !== null) any = true; });
    return any ? 'KS1.' + DIR + '.' + b64e(JSON.stringify(d)) : '';
  }
  function readCode(txt, keys) {
    try {
      var m = String(txt || '').replace(/\s+/g, '').match(/^KS1\.([^.]*)\.(.+)$/);
      if (!m || m[1] !== DIR) return null;
      var d = JSON.parse(b64d(m[2]));
      if (!d || typeof d !== 'object' || typeof d[keys[0]] !== 'string') return null;
      var out = {};
      keys.forEach(function (k) { out[k] = typeof d[k] === 'string' ? d[k] : null; });
      return out;
    } catch (e) { return null; }
  }

  // 5. fenêtre commune (neutre, sur fond sombre ; la police est celle du jeu)
  var CSS = '#ks-dlg{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.66);font:inherit;color:#f3ecdf}' +
    '#ks-dlg .kb{width:min(100%,380px);max-height:calc(100% - 32px);overflow:auto;background:#1d1a22;border:2px solid var(--ks-accent,#c9a45c);border-radius:14px;padding:16px;box-shadow:0 10px 40px rgba(0,0,0,.5)}' +
    '#ks-dlg h2{margin:0 0 8px;font-size:20px}#ks-dlg p{margin:0 0 10px;font-size:14px;line-height:1.4;opacity:.9}' +
    '#ks-dlg textarea{width:100%;box-sizing:border-box;height:84px;margin:0 0 8px;background:#0f0d12;color:#f3ecdf;border:1px solid #4a4452;border-radius:8px;padding:8px;font:12px/1.3 monospace;resize:none}' +
    '#ks-dlg button{display:block;width:100%;margin:0 0 8px;padding:11px 10px;border-radius:10px;border:0;font:inherit;font-weight:700;font-size:15px;background:#3a3442;color:#f3ecdf;cursor:pointer}' +
    '#ks-dlg button.ks-main{background:var(--ks-accent,#c9a45c);color:#16121a}#ks-dlg hr{border:0;border-top:1px solid #3a3442;margin:12px 0}' +
    '#ks-dlg .ks-err{color:#ff8f7a}';

  function saveDialog(o) {
    var L = TX[o.lang === 'en' ? 'en' : 'fr'], keys = o.keys;
    if (document.getElementById('ks-dlg')) return;
    if (!document.getElementById('ks-css')) { var st = document.createElement('style'); st.id = 'ks-css'; st.textContent = CSS; document.head.appendChild(st); }
    if (o.save) try { o.save(); } catch (e) {}
    var code = makeCode(keys);
    var d = document.createElement('div'); d.id = 'ks-dlg'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    if (o.accent) d.style.setProperty('--ks-accent', o.accent);
    d.innerHTML = '<div class="kb"><h2>' + L.title + '</h2>' +
      (code ? '<p>' + L.intro + '</p><textarea readonly id="ks-out"></textarea><button class="ks-main" id="ks-copy">' + L.copy + '</button><button id="ks-file">' + L.file + '</button>' : '<p>' + L.empty + '</p>') +
      '<hr><h2>' + L.load + '</h2><p>' + L.paste + '</p><textarea id="ks-in" autocomplete="off" spellcheck="false" placeholder="KS1…"></textarea>' +
      '<button id="ks-pick">' + L.pick + '</button><button class="ks-main" id="ks-go">' + L.go + '</button><p class="ks-err" id="ks-msg" hidden></p>' +
      '<hr><button id="ks-close">' + L.close + '</button><input type="file" id="ks-f" accept=".txt,text/plain" hidden></div>';
    document.body.appendChild(d);
    var $ = function (id) { return d.querySelector('#' + id); };
    var close = function () { d.remove(); };
    if (code) {
      $('ks-out').value = code;
      $('ks-copy').onclick = function () {
        var done = function () { $('ks-copy').textContent = L.copied; };
        try { navigator.clipboard.writeText(code).then(done, function () { $('ks-out').select(); document.execCommand('copy'); done(); }); }
        catch (e) { $('ks-out').select(); try { document.execCommand('copy'); done(); } catch (err) {} }
      };
      $('ks-file').onclick = function () {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
        a.download = (o.file || DIR) + '-sauvegarde-' + new Date().toISOString().slice(0, 10) + '.txt';
        document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      };
    }
    $('ks-pick').onclick = function () { $('ks-f').click(); };
    $('ks-f').onchange = function () {
      var f = $('ks-f').files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () { $('ks-in').value = String(r.result).trim(); }; r.readAsText(f);
    };
    $('ks-go').onclick = function () {
      var data = readCode($('ks-in').value, keys), msg = $('ks-msg');
      if (!data) { msg.textContent = L.bad; msg.hidden = false; return; }
      if ($('ks-go').dataset.sure !== '1') {
        msg.textContent = L.confirm; msg.hidden = false;
        $('ks-go').textContent = L.yes; $('ks-go').dataset.sure = '1';
        return;
      }
      try { sessionStorage.setItem(PENDING, JSON.stringify(data)); } catch (e) { return; }
      location.reload();
    };
    $('ks-close').onclick = close;
    d.addEventListener('pointerdown', function (e) { if (e.target === d) close(); });
    d.ksClose = close;
  }

  window.KS = {
    SUPPORT_URL: 'https://ko-fi.com/keismey',
    support: function () { window.open('https://ko-fi.com/keismey', '_blank', 'noopener'); },
    bugUrl: function (jeu, lang) { return '/?contact=bug&jeu=' + encodeURIComponent(jeu || '') + (lang === 'en' ? '&lang=en' : '&lang=fr'); },
    bug: function (jeu, lang) { location.assign(window.KS.bugUrl(jeu, lang)); },
    saveDialog: saveDialog,
    // pour le bouton retour : la fenêtre « Sauvegarde » est-elle ouverte ? la ferme si oui.
    closeDialog: function () { var d = document.getElementById('ks-dlg'); if (!d) return false; d.remove(); return true; }
  };
})();

/* Keismey Studio — bouton retour du téléphone (même fichier dans chaque jeu du hub).

   Le jeu appelle KSBack.init({ back, lang }) :
   - back() est appelé à chaque retour (bouton ou geste retour du téléphone, touche Échap).
     Il ferme la fenêtre ouverte, revient à l'écran précédent, met en pause ou ouvre une
     confirmation. Il renvoie 'hub' quand le joueur doit quitter le jeu pour le hub.
   - lang() renvoie 'fr' ou 'en' : la langue du hub qui s'ouvre.
   KSBack.toHub() quitte vers le hub (par exemple après une confirmation du joueur).

   Le navigateur ne connaît que l'historique de l'onglet. À chaque toucher, on empile
   quelques entrées « tampon » sur la page du jeu (Chrome ignore celles créées sans action
   du joueur) ; chaque retour en consomme une et le jeu décide quoi faire.
   Pour quitter : si on vient du hub, on y revient comme avec un retour normal (position
   de défilement gardée) ; sinon le hub remplace le jeu dans l'historique, et un retour de
   plus ramène là d'où le joueur venait. */
(function () {
  'use strict';
  var N = 10;             // retours d'affilée possibles sans toucher l'écran
  var cfg = null, idx = 0, fromHub = false, leaving = false, resetting = false, timer = 0;

  function state() { try { return history.state; } catch (e) { return null; } }
  function depth(s) { return s && typeof s.ksb === 'number' ? s.ksb : 0; }
  function refIsHub() {
    try {
      var r = new URL(document.referrer);
      return r.origin === location.origin && (r.pathname === '/' || r.pathname === '/index.html');
    } catch (e) { return false; }
  }
  function mark(k) { var s = {}, o = state(); if (o && typeof o === 'object') for (var p in o) s[p] = o[p]; s.ksb = k; s.ksh = fromHub ? 1 : 0; return s; }

  // changement de langue ou rechargement par le jeu : on se souvient qu'on venait du hub
  var dir = location.pathname.split('/')[1] || '';
  function sameGameRef() {
    try { var r = new URL(document.referrer); return r.origin === location.origin && r.pathname.split('/')[1] === dir; } catch (e) { return false; }
  }
  function memo(v) { try { if (v === undefined) return sessionStorage.getItem('ks-hub:' + dir) === '1'; sessionStorage.setItem('ks-hub:' + dir, v ? '1' : '0'); } catch (e) { return false; } }

  (function boot() {
    var s = state();
    fromHub = !!(s && s.ksh) || refIsHub() || (sameGameRef() && memo());
    memo(fromHub);
    idx = depth(s);
    if (idx > 0) {
      // page rechargée (mise à jour, glisser pour actualiser) sur une entrée tampon :
      // on redescend à l'entrée de base pour repartir proprement.
      resetting = true;
      try { history.go(-idx); } catch (e) { resetting = false; }
      return;
    }
    try { history.replaceState(mark(0), ''); } catch (e) {}
  })();

  function topUp(e) {
    if (!cfg || leaving || resetting) return;
    // seulement un vrai geste du joueur : un clic simulé par le jeu (button.click()) créerait des
    // entrées sans action du joueur, que Chrome saute ensuite au retour… et le joueur sortirait du jeu.
    if (e && e.isTrusted === false) return;
    try { if (navigator.userActivation && !navigator.userActivation.isActive) return; } catch (err) {}
    idx = depth(state());
    try { while (idx < N) { idx++; history.pushState(mark(idx), ''); } } catch (e) {}
  }

  function finish() {
    var url = '/' + (cfg && cfg.lang && cfg.lang() === 'en' ? '?lang=en' : '');
    if (fromHub) {
      history.back();
      // filet de sécurité si aucune page ne précède le jeu
      timer = setTimeout(function () { location.replace(url); }, 700);
    } else {
      location.replace(url);
    }
  }

  function toHub() {
    if (leaving) return;
    leaving = true;
    var k = depth(state());
    if (k > 0) history.go(-k); else finish();
  }

  function back(fromKey) {
    var r;
    if (window.KS && window.KS.closeDialog && window.KS.closeDialog()) return;   // fenêtre « Sauvegarde » commune
    try { r = cfg.back(); } catch (e) { r = null; if (window.console) console.error(e); }
    if (r === 'hub' && !fromKey) toHub();
  }

  window.addEventListener('popstate', function (e) {
    var k = depth(e.state);
    if (resetting) { if (k === 0) { resetting = false; idx = 0; } return; }
    if (leaving) { if (k === 0) finish(); return; }
    if (!cfg) { idx = k; return; }
    if (k >= idx) { idx = k; return; }   // bouton « suivant » : rien à faire
    idx = k;
    back(false);
  });

  // chaque action du joueur réarme les entrées tampon
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(function (t) {
    window.addEventListener(t, topUp, true);
  });

  // touche Échap sur ordinateur : même effet, sauf quitter le jeu
  window.addEventListener('keydown', function (e) {
    if (!cfg || e.key !== 'Escape' || e.repeat || e.defaultPrevented) return;
    var t = e.target && e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    back(true);
  });

  window.addEventListener('pagehide', function () { clearTimeout(timer); });
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;            // page revenue depuis le cache du navigateur
    clearTimeout(timer); leaving = false; resetting = false; idx = depth(state());
  });

  window.KSBack = {
    init: function (o) { cfg = o; },
    toHub: toHub,
    fromHub: function () { return fromHub; }
  };
})();

'use strict';
const DEV=false;
const VERSION='1.0.3';
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


/* ---------- planète en rotation (WebGL) ---------- */
const PLANET_MAPS=['a/map0.webp','a/map1.webp','a/map2.webp','a/map3.webp','a/map4.webp'];
const ROT_PERIOD=300; // secondes pour un tour complet
let GLB={ok:false};
function initGlobe(){
 try{
  const cv=document.createElement('canvas');cv.id='pgl';cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  $('v-planet').insertBefore(cv,$('pc'));
  const gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:false});
  if(!gl||gl.getParameter(gl.MAX_TEXTURE_SIZE)<2560)return;
  const vs=`attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
  const fs=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uA,uB;uniform float uMix,uRot,uR;uniform vec2 uC;uniform vec3 uTint;
void main(){
 vec2 p=(gl_FragCoord.xy-uC)/uR;float d=length(p);
 if(d>1.0)discard;
 float z=sqrt(max(0.,1.-d*d));
 const float CA=.5736,SA=.8192;
 vec3 b=vec3(p.x,p.y*CA-z*SA,p.y*SA+z*CA);
 float lat=asin(clamp(b.y,-1.,1.));
 float lon=atan(b.x,b.z)+uRot;
 vec2 uv=vec2(fract(lon/6.2831853),clamp(.5-lat/3.1415927,0.,1.));
 vec3 c=mix(texture2D(uA,uv).rgb,texture2D(uB,uv).rgb,uMix);
 float g=dot(c,vec3(.299,.587,.114));c=clamp(mix(vec3(g),c,1.22),0.,1.);c=(c-.5)*1.06+.5;
 vec3 n=vec3(p.x,p.y,z);vec3 L=normalize(vec3(-.45,.55,.7));
 c*=.55+.55*max(dot(n,L),0.);
 float rim=smoothstep(.95,1.,d);c=mix(c,c*.6+uTint*.4,rim*.5);
 float aa=1.-smoothstep(1.-1.5/uR,1.,d);
 gl_FragColor=vec4(c*aa,aa);
}`;
  const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error('link');
  gl.useProgram(pr);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
  const U={};['uA','uB','uMix','uRot','uR','uC','uTint'].forEach(k=>U[k]=gl.getUniformLocation(pr,k));
  gl.uniform1i(U.uA,0);gl.uniform1i(U.uB,1);
  const tex=PLANET_MAPS.map(src=>{const t={id:gl.createTexture(),ready:false};const im=new Image();im.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,t.id);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,im);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);t.ready=true};im.src=src;return t});
  cv.addEventListener('webglcontextlost',e=>{e.preventDefault();GLB.ok=false;cv.style.display='none'});
  GLB={ok:true,cv,gl,U,tex,cur:-1,prev:-1,mix:1,rot:2.1};
 }catch(e){console.warn('Planète 3D indisponible',e);GLB={ok:false}}
}
function drawGlobe(dt,tint){
 if(!GLB.ok||!PG)return false;
 const st=stageOf(viab()),t=GLB.tex[st];if(!t||!t.ready)return false;
 if(GLB.cur!==st){if(GLB.cur>=0&&GLB.tex[GLB.cur].ready){GLB.prev=GLB.cur;GLB.mix=0}else GLB.mix=1;GLB.cur=st}
 GLB.mix=Math.min(1,GLB.mix+dt/2.5);GLB.rot=(GLB.rot+dt*2*Math.PI/ROT_PERIOD)%(Math.PI*2);
 const{gl,cv,U}=GLB,w=Math.round(PW*DPR),h=Math.round(PH*DPR);
 if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
 gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
 const a=GLB.mix<1?GLB.tex[GLB.prev]:t;
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,a.id);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,t.id);
 gl.uniform1f(U.uMix,GLB.mix<1?GLB.mix*GLB.mix*(3-2*GLB.mix):1);gl.uniform1f(U.uRot,GLB.rot);gl.uniform1f(U.uR,PG.R*DPR);
 gl.uniform2f(U.uC,PG.cx*DPR,(PH-PG.cy)*DPR);gl.uniform3f(U.uTint,tint[0]/255,tint[1]/255,tint[2]/255);
 gl.drawArrays(gl.TRIANGLES,0,3);
 return true;
}

/* ---------- fonds de secteur (vol) ---------- */
const SEC_BG=['a/bg1.webp','a/bg2.webp','a/bg3.webp','a/bg4.webp','a/bg5.webp'];
const BGI=SEC_BG.map(src=>{const im=new Image();im.src=src;return im});
const BGS={a:1,b:1,mix:1,y:0};
function bgSet(k,instant){if(instant){BGS.a=BGS.b=k;BGS.mix=1;return}if(k===BGS.b)return;BGS.a=BGS.b;BGS.b=k;BGS.mix=0}
function drawSecBg(g,dt,moving){
 BGS.mix=Math.min(1,BGS.mix+dt/3.5);if(moving)BGS.y+=dt*16;
 const draw=(k,al)=>{const im=BGI[k-1];if(!im||!im.complete||!im.naturalWidth||al<=0)return;
  const sc=Math.max(BW/im.naturalWidth,BH/im.naturalHeight),w=im.naturalWidth*sc,h=im.naturalHeight*sc,x=(BW-w)/2,o=BGS.y%(2*h);
  g.globalAlpha=al*.9;
  for(let j=0;j<4;j++){const y=o-2*h+j*h;if(y>BH||y+h<0)continue;if(j%2){g.save();g.translate(0,y+h);g.scale(1,-1);g.drawImage(im,x,0,w,h);g.restore()}else g.drawImage(im,x,y,w,h)}
  g.globalAlpha=1};
 const e=BGS.mix*BGS.mix*(3-2*BGS.mix);
 if(BGS.mix<1)draw(BGS.a,1);draw(BGS.b,BGS.mix<1?e:1);
}


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
  return`<button class="${cls}" ${st} data-act="cell" data-arg="${i}" aria-label="${tl('Case','Cell')} ${i+1}">${inner}</button>`}).join('');
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
const BOSS_SRC=['a/boss1.webp','a/boss2.webp','a/boss3.webp','a/boss4.webp','a/boss5.webp'];
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


/* ---------- musique ---------- */
const MUS_SRC={calm:'a/mus_calm.mp3',mission:'a/mus_mission.mp3',boss:'a/mus_boss.mp3'};
const TITLE_BG='a/title.webp';
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
 al('#gear',tl('Options','Options'));al('#terra',tl('Viabilité de la planète','Planet viability'));al('.shx',tl('Fermer','Close'));al('#v-planet .edb',tl('Renommer la planète','Rename the planet'));
}
function applyLang(){EN_DATA().forEach(([t,e])=>ovl(t,e));applyShell()}
function setLang(l){
 if(l===LANG)return;LANG=l;try{localStorage.setItem(LANG_KEY,l)}catch(e){}
 applyLang();lastRes={};plotSig='';renderAll();if(view==='planet')renderPlots(true);renderSheet();fitPName();
}

/* ---------- notes de mise à jour (la plus récente en premier) ---------- */
const PATCH_NOTES=[
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
function openSheet(kind,arg){SHEET={kind,arg};sheetHTML='';renderSheet();$('sheet').classList.add('open');$('scrim').classList.add('on')}
function closeSheet(){SHEET=null;$('sheet').classList.remove('open');$('scrim').classList.remove('on')}
let sheetHold=0,sheetHTML='';
$('sheet').addEventListener('pointerdown',()=>{sheetHold=performance.now()},true);
function renderSheet(auto){if(!SHEET||SIM)return;const f=SHEETS[SHEET.kind];if(!f)return;const h=f(SHEET.arg);if(h===sheetHTML&&$('sheetc').innerHTML)return;if(auto&&performance.now()-sheetHold<800)return;sheetHTML=h;const sc=$('sheetc').scrollTop;$('sheetc').innerHTML=h;$('sheetc').scrollTop=sc}
let modalQ=[];
function modal(o){if(SIM)return;modalQ.push(o);if(modalQ.length===1)showModal()}
function showModal(){const o=modalQ[0];if(!o){$('modal').hidden=true;return}
 $('mbox').innerHTML=`${o.eyebrow?`<div class="eyebrow">${o.eyebrow}</div>`:''}<h2>${o.title}</h2>${o.text?`<p>${o.text}</p>`:''}${o.html||''}<div class="ch">${(o.choices||[{l:'Continuer'}]).map((c,k)=>`<button class="btn ${c.cls||''}" data-mc="${k}" ${c.dis?'disabled':''}>${c.l}</button>`).join('')}</div>`;
 $('modal').hidden=false}
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
  <div class="volr"><span>${tl('Langue','Language')}</span><div class="seg2" style="grid-column:span 2"><button class="${LANG==='fr'?'on':''}" data-act="lang" data-arg="fr">Français</button><button class="${LANG==='en'?'on':''}" data-act="lang" data-arg="en">English</button></div></div>
  ${[['mus',tl('Musique','Music')],['sfx',tl('Effets sonores','Sound effects')]].map(([k,l])=>`<label class="volr"><span>${l}</span><input type="range" id="vol-${k}" min="0" max="100" step="5" value="${Math.round(S.vol[k]*100)}" data-vol="${k}"><output>${Math.round(S.vol[k]*100)}${PCT()}</output></label>`).join('')}
  ${DEV?`<button class="tog" data-act="togTest"><span>${tl('Mode test','Test mode')}<small>${tl('Production et chantiers ×20, Zone infinie ouverte, bouton pour finir les chantiers.','Output and construction ×20, Endless Zone open, button to finish constructions.')}</small></span><span class="sw ${S.test?'on':''}"></span></button>
  ${S.test?`<button class="btn ghost wide" data-act="testRes">${tl('+5 000 métal et cristal, +100 xéno','+5,000 metal and crystal, +100 xeno')}</button><button class="btn ghost wide" data-act="testTerra">${tl('Planète viable et habitats pleins','Viable planet and full habitats')}</button><button class="btn ghost wide" data-act="testBp">${tl('Débloquer tous les schémas et secteurs','Unlock all schematics and sectors')}</button>`:''}`:''}
  <button class="btn ghost wide" data-act="notes">${tl('Notes de mise à jour','Patch notes')}</button>
  <button class="btn ghost wide" data-act="saveIo">${tl('Sauvegarde : exporter, importer','Save: export, import')}</button>
  <button class="btn ghost wide" data-act="bug">${tl('Signaler un bug','Report a bug')}</button>
  <button class="btn ghost wide" data-act="support">${tl('Soutenir le studio','Support the studio')}</button>
  <button class="btn ghost wide" data-act="toTitle">${tl('Écran titre','Title screen')}</button>
  <div class="sep"></div>
  <button class="btn red wide" data-act="reset">${SHEET&&SHEET.confirm==='reset'?tl('Confirmer : tout effacer','Confirm: erase everything'):tl('Recommencer une partie','Start a new game')}</button>`
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
 spl.addEventListener('pointerdown',e=>{e.stopPropagation();ac();if(!st){toT();return}if(st===2)return;st=2;spl.classList.add('out');setTimeout(()=>spl.remove(),650);if(fresh){S.intro=1;S.pnV=VERSION;intro()}else if(S.pnV!==VERSION)setTimeout(()=>{openSheet('notes');save()},700)});
 requestAnimationFrame(loop);
 swInit();
}
function swInit(){
 if(DEV||!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
 const ban=w=>{if($('upd'))return;const d=document.createElement('div');d.id='upd';d.innerHTML=`<span>${tl('Nouvelle version disponible','New version available')}</span><button class="btn sm">${tl('Mettre à jour','Update')}</button><button class="x" aria-label="${tl('Plus tard','Later')}">×</button>`;d.querySelector('.x').onclick=()=>d.remove();d.querySelector('.btn').onclick=()=>{save();let done=false;const go=()=>{if(!done){done=true;location.reload()}};navigator.serviceWorker.addEventListener('controllerchange',go);w.postMessage('skip');setTimeout(go,3000)};$('app').appendChild(d)};
 try{navigator.serviceWorker.register('sw.js').then(r=>{if(r.waiting&&navigator.serviceWorker.controller)ban(r.waiting);r.addEventListener('updatefound',()=>{const w=r.installing;w&&w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)ban(w)})});setInterval(()=>r.update().catch(()=>{}),36e5)}).catch(()=>{})}catch(e){}
}
if(!window.__NOBOOT)(window.claude&&window.claude.hot&&window.claude.hot.ready?window.claude.hot.ready(boot):boot((window.claude&&window.claude.hot&&window.claude.hot.data)||{}));

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

