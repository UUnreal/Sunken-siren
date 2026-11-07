#!/usr/bin/env python3
"""Bygger nettstedet for Relic of the Sunken Siren.

Inn:  spillfila (én stor HTML med innebygd lyd) + forside.html + bilder/
Ut:   <utmappe>/index.html               forsiden
      <utmappe>/spill/index.html         spillet på norsk, uten innebygd lyd
      <utmappe>/spill/index.en.html      engelsk (hvis sunken-siren.en.html finnes)
      <utmappe>/spill/lyd/musikk.js      musikk, felles for alle språk
      <utmappe>/spill/lyd/stemmer*.js    stemmer per språk, lastes i bakgrunnen
      <utmappe>/bilder/*.jpg        skjermbilder til forsiden

Bruk: python3 bygg.py <sunken-siren.html> <utmappe>
Se README.md for hele oppskriften."""
import re, sys, os, json, shutil
src, out = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))

# Sikkerhetsregler for spillet (Content-Security-Policy). Lyd lastes fra egne filer og
# dekodes lokalt; spillet trenger aldri å hente noe fra nettet, så connect-src er 'none'.
GAME_CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; media-src 'self' data: blob:; connect-src 'none'; "
            "worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'")

g = os.path.join(out, 'spill')
os.makedirs(os.path.join(g, 'lyd'), exist_ok=True)
head = ('<meta http-equiv="Content-Security-Policy" content="%s">\n<meta name="referrer" content="no-referrer">\n'
        '<link rel="manifest" href="../manifest.webmanifest">\n<link rel="icon" href="../ikoner/ikon-192.png">\n'
        '<link rel="apple-touch-icon" href="../ikoner/apple-touch-icon.png">\n' % GAME_CSP)
# Registrerer service workeren (offline) også når spilleren går rett til spillet.
# Når en ny versjon er lastet ned, lastes siden på nytt, men bare mens startskjermen vises (ikke midt i spillet).
SW_REG = ("<script>if('serviceWorker'in navigator){const h=!!navigator.serviceWorker.controller;"
          "navigator.serviceWorker.addEventListener('controllerchange',()=>{const t=document.getElementById('title');"
          "if(h&&t&&getComputedStyle(t).display!=='none')location.reload()});"
          "navigator.serviceWorker.register('../sw.js',{scope:'../'}).catch(()=>{})}</script>")


def bygg_spill(fil, lang):
    """Lager spill/index[.lang].html. Musikken er lik for alle språk (lyd/musikk.js),
    stemmene er egne per språk (lyd/stemmer[.lang].js)."""
    suf = '' if lang == 'no' else '.' + lang
    s = open(fil, encoding='utf-8').read()
    # 1) Flytt innebygd lyd ut i egne filer som lastes async (spillet tåler at de kommer sent).
    for sid, name in (('mu', 'musikk.js'), ('vo', 'stemmer%s.js' % suf)):
        m = re.search(r'<script id="%s">(.*?)</script>' % sid, s, re.S)
        if not m: sys.exit('FEIL: fant ikke <script id="%s"> i %s' % (sid, fil))
        if sid == 'vo' or lang == 'no':
            body = m.group(1)
            if sid == 'vo' and lang != 'no':  # egne stemmer per språk; spillet leser window.VO_EN før VO
                body = body.replace('window.VO=', 'window.VO_%s=' % lang.upper(), 1)
            open(os.path.join(g, 'lyd', name), 'w', encoding='utf-8').write(body)
        s = s[:m.start()] + '<script id="%s" src="lyd/%s" async></script>' % (sid, name) + s[m.end():]
    # 2) Sikkerhet: CSP + ingen referrer, og søkelenker åpnes uten tilgang tilbake til spillet.
    if 'Content-Security-Policy' not in s:
        s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + head, 1)
    if 'sw.js' not in s:
        s = s.replace('</body>', SW_REG + '</body>', 1) if '</body>' in s else s + SW_REG
    s = s.replace("window.open(u+qq,'_blank')", "window.open(u+qq,'_blank','noopener,noreferrer')")
    open(os.path.join(g, 'index%s.html' % suf), 'w', encoding='utf-8').write(s)
    return s

# Norsk først (den eier musikk.js), så de andre språkene hvis filene finnes ved siden av.
# Originalfilene (med all lyd inni) legges også i last-ned/, så de kan spilles uten nett fra en fil.
dl = os.path.join(out, 'last-ned'); os.makedirs(dl, exist_ok=True)
s = bygg_spill(src, 'no')
shutil.copy(src, os.path.join(dl, 'sunken-siren.html'))
sprak = ['no']
for lang in ('en',):
    f = re.sub(r'\.html$', '.%s.html' % lang, src)
    if os.path.exists(f):
        bygg_spill(f, lang); sprak.append(lang)
        shutil.copy(f, os.path.join(dl, 'sunken-siren.%s.html' % lang))

# 3) Forsiden: tingene i sekken (emoji + navn) hentes fra spillet, så den alltid er i takt.
blk = s[s.find('ITEMS='):].split('};')[0]
items = {k: [e, n] for k, e, n in re.findall(r"(\w+):\['([^']*)','([^']*)'\]", blk)}
f = open(os.path.join(here, 'forside.html'), encoding='utf-8').read()
f = f.replace('/*ITEMS*/{}', json.dumps(items, ensure_ascii=False).replace('</', '<\\/'))
open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(f)
shutil.copytree(os.path.join(here, 'bilder'), os.path.join(out, 'bilder'), dirs_exist_ok=True)
shutil.copytree(os.path.join(here, 'ikoner'), os.path.join(out, 'ikoner'), dirs_exist_ok=True)
shutil.copy(os.path.join(here, 'manifest.webmanifest'), out)

# 4) Offline: service worker med liste over alle filer og en versjon (hash av innholdet),
#    så nye versjoner av spillet automatisk erstatter den gamle kopien på enhetene.
import hashlib
alle, h = [], hashlib.sha256()
for root, dirs, files in os.walk(out):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'verktoy']  # aldri .git o.l.
    for n in sorted(files):
        if n in ('sw.js', '.nojekyll') or root.startswith(dl): continue
        rel = os.path.relpath(os.path.join(root, n), out).replace(os.sep, '/')
        alle.append(rel)
for rel in sorted(alle):
    h.update(rel.encode()); h.update(open(os.path.join(out, rel), 'rb').read())
lazy = sorted(r for r in alle if re.match(r'spill/lyd/stemmer\.\w+\.js$', r))
pre = ['./'] + sorted(r for r in alle if r not in lazy) + ['spill/']
sw = open(os.path.join(here, 'sw.js'), encoding='utf-8').read()
sw = sw.replace('__VERSION__', h.hexdigest()[:12]).replace('__PRECACHE__', json.dumps(pre)).replace('__LAZY__', json.dumps(lazy))
open(os.path.join(out, 'sw.js'), 'w', encoding='utf-8').write(sw)
print('offline-versjon:', h.hexdigest()[:12], '| lastes ned med en gang:', len(pre), 'filer | ved behov:', ', '.join(lazy))
open(os.path.join(out, '.nojekyll'), 'w').close()

for root, _, files in os.walk(out):
    for n in sorted(files):
        p = os.path.join(root, n)
        if n.endswith(('.html', '.js')): print(os.path.relpath(p, out), round(os.path.getsize(p) / 1e6, 2), 'MB')
print('språk:', ', '.join(sprak))
print('ting i sekken-tabellen:', len(items))
