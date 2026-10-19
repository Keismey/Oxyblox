#!/usr/bin/env python3
"""Oxyblox — assemble le jeu à partir des sources de src/.

  python3 src/build.py                    -> le site (index.html, game.js, style.css, sw.js) à la racine du dépôt
  python3 src/build.py --artifact F.html  -> une seule page autonome (images et musiques intégrées, mode test visible)
"""
import base64, hashlib, os, re, sys

SRC = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SRC)
JS_FILES = ['ks-back.js', 'g1_core.js', 'g2_planet.js', 'g2b_globe.js', 'g3_hangar.js', 'g4_flight.js', 'g6_audio.js', 'g7_lang.js', 'g5_ui.js', 'g8_back.js']
IMG = {'MAPS': ['map%d.webp' % k for k in range(5)], 'BGS': ['bg%d.webp' % k for k in range(1, 6)], 'BOSSES': ['boss%d.webp' % k for k in range(1, 6)]}
MUSIC = {'calm': 'mus_calm.mp3', 'mission': 'mus_mission.mp3', 'boss': 'mus_boss.mp3'}

# Suivi Cloudflare Web Analytics (version publiée uniquement, pas l'aperçu de test)
CF_ANALYTICS = """<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "cdb82226cd1b401d9e4f4e899f9b8425"}'></script><!-- End Cloudflare Web Analytics -->"""

def read(p): return open(p, encoding='utf-8').read()
def data_uri(name):
    mime = 'audio/mpeg' if name.endswith('.mp3') else 'image/webp'
    return 'data:%s;base64,%s' % (mime, base64.b64encode(open(os.path.join(ROOT, 'a', name), 'rb').read()).decode())

def assemble(inline):
    ref = data_uri if inline else (lambda n: 'a/' + n)
    js = ''.join(read(os.path.join(SRC, f)) + '\n' for f in JS_FILES)
    for key, names in IMG.items():
        js = js.replace('/*%s*/[]' % key, '[' + ','.join("'%s'" % ref(n) for n in names) + ']')
    js = js.replace('/*MUSIC*/{}', '{' + ','.join("%s:'%s'" % (k, ref(v)) for k, v in MUSIC.items()) + '}')
    js = js.replace("/*TITLE*/''", "'%s'" % ref('title.webp'))
    if not inline:
        js = js.replace('const DEV=/*DEV*/true;', 'const DEV=false;')
    css = read(os.path.join(SRC, 'old.css')) + read(os.path.join(SRC, 'extra.css'))
    shell = read(os.path.join(SRC, 'shell.html')).replace('__LOGO__', ref('logo.webp'))
    return js, css, shell

FONT_CSS = """@font-face{font-family:'Oxanium';src:url(fonts/oxanium.woff) format('woff');font-weight:200 800;font-display:swap}
@font-face{font-family:'Barlow Semi Condensed';src:url(fonts/barlow-400.woff) format('woff');font-weight:400;font-display:swap}
@font-face{font-family:'Barlow Semi Condensed';src:url(fonts/barlow-500.woff) format('woff');font-weight:500;font-display:swap}
@font-face{font-family:'Barlow Semi Condensed';src:url(fonts/barlow-600.woff) format('woff');font-weight:600;font-display:swap}
@font-face{font-family:'Barlow Semi Condensed';src:url(fonts/barlow-700.woff) format('woff');font-weight:700;font-display:swap}
@font-face{font-family:'Share Tech Mono';src:url(fonts/sharetechmono.woff) format('woff');font-weight:400;font-display:swap}
"""

HEAD = """<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Oxyblox</title>
<meta name="description" content="Construis ton vaisseau bloc par bloc, fais revivre une planète morte et affronte ses gardiens. Un shoot'em up de Keismey Studio, jouable dans le navigateur.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Keismey Studio">
<meta property="og:title" content="Oxyblox">
<meta property="og:description" content="Construis ton vaisseau bloc par bloc, fais revivre une planète morte et affronte ses gardiens. Gratuit, sans pub, dans le navigateur.">
<meta property="og:url" content="https://keismey.github.io/Oxyblox/">
<meta property="og:image" content="https://keismey.github.io/Oxyblox/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Oxyblox · Keismey Studio">
<meta property="og:locale" content="fr_FR">
<meta property="og:locale:alternate" content="en_GB">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Oxyblox">
<meta name="twitter:description" content="Construis ton vaisseau bloc par bloc, fais revivre une planète morte et affronte ses gardiens. Gratuit, sans pub, dans le navigateur.">
<meta name="twitter:image" content="https://keismey.github.io/Oxyblox/og.jpg">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#05070d">
<link rel="icon" href="icons/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Oxyblox">
<link rel="preload" href="fonts/oxanium.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="fonts/barlow-500.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="style.css?v=%s">
</head><body>
"""

def strip_head(shell):
    # la coquille de travail commence par <title>, les polices Google et <style>/*CSS*/</style>
    body = re.sub(r'^.*?</style>\s*', '', shell, count=1, flags=re.S)
    return body

def site():
    js, css, shell = assemble(inline=False)
    css = FONT_CSS + css
    h = hashlib.sha1((js + css + shell + CF_ANALYTICS).encode()).hexdigest()[:8]
    ver = re.search(r"const VERSION='([^']+)'", js).group(1)
    body = strip_head(shell).replace('<script>\n/*JS*/\n</script>', '<script src="game.js?v=%s"></script>' % h)
    assert 'game.js' in body, 'balise script introuvable dans shell.html'
    open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(HEAD % h + body + '\n' + CF_ANALYTICS + '\n</body></html>\n')
    open(os.path.join(ROOT, 'game.js'), 'w', encoding='utf-8').write(js)
    open(os.path.join(ROOT, 'style.css'), 'w', encoding='utf-8').write(css)
    files = ['./', './index.html', './game.js?v=' + h, './style.css?v=' + h, './manifest.webmanifest']
    for d in ['icons', 'fonts', 'a']:
        for f in sorted(os.listdir(os.path.join(ROOT, d))):
            if not f.endswith('.txt'): files.append('./%s/%s' % (d, f))
    sw = read(os.path.join(SRC, 'sw.template.js')).replace('__VERSION__', 'oxyblox-%s-%s' % (ver, h)).replace('__FILES__', ',\n  '.join("'%s'" % f for f in files))
    open(os.path.join(ROOT, 'sw.js'), 'w', encoding='utf-8').write(sw)
    print('site', ver, h, 'game.js', len(js), 'style.css', len(css), 'fichiers en cache', len(files))

def artifact(path):
    js, css, shell = assemble(inline=True)
    out = shell.replace('/*CSS*/', css).replace('/*JS*/', js)
    open(path, 'w', encoding='utf-8').write(out)
    print('artefact', path, len(out))
    return out

if __name__ == '__main__':
    if '--artifact' in sys.argv:
        artifact(sys.argv[sys.argv.index('--artifact') + 1])
    else:
        site()
