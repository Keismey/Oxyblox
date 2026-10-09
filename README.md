# Oxyblox

**Construis. Tire. Respire.** Un shoot'em up vertical de Keismey Studio, jouable dans le navigateur et installable sur téléphone.

Construis ton vaisseau bloc par bloc, fais revivre une planète morte pour attirer des colons, et affronte les gardiens des cinq secteurs. Ensuite, la Zone infinie.

Jouer : https://keismey.github.io/Oxyblox/ (aussi dans le hub : https://keismey.github.io/)

Le jeu est en français et en anglais (détection automatique, choix dans les Réglages, ou `?lang=fr` / `?lang=en` dans l'adresse).

## Fichiers

- `index.html`, `game.js`, `style.css`, `sw.js` — **générés** par `src/build.py`, ne pas les modifier à la main
- `manifest.webmanifest` — installation sur téléphone
- `a/` — images et musiques du jeu
- `icons/` — icônes de l'appli
- `fonts/` — Oxanium, Barlow Semi Condensed et Share Tech Mono (licence SIL OFL, voir `fonts/OFL.txt`)
- `src/` — les sources :
  - `g1_core.js` données, équilibrage (`BAL`), sauvegarde, sons
  - `g2_planet.js`, `g2b_globe.js` planète et fonds
  - `g3_hangar.js` hangar, formes, réserve, plans
  - `g4_flight.js` le shoot'em up
  - `g5_ui.js` interface, objectifs, missions, démarrage
  - `g6_audio.js` musique
  - `g7_lang.js` textes anglais des données et changement de langue
  - `shell.html`, `old.css`, `extra.css` structure et styles
  - `sw.template.js` modèle du service worker

## Mettre à jour le jeu

1. Modifier les fichiers de `src/`.
2. Lancer `python3 src/build.py` à la racine du dépôt : ça régénère `index.html`, `game.js`, `style.css` et `sw.js`
   (le nom du cache change à chaque build, donc les joueurs voient « Nouvelle version disponible »).
3. Pousser sur `main`. GitHub Pages publie depuis la racine de `main`.

`python3 src/build.py --artifact oxyblox.html` produit une page unique autonome, avec le mode test visible dans les Réglages
(production ×20, ressources de test). La version en ligne n'a pas de mode test.

La sauvegarde est dans le `localStorage` du navigateur (clé `keismey-epave-stellaire-v2`).
