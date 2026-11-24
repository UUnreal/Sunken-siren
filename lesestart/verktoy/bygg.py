#!/usr/bin/env python3
"""Bygger lesestart/index.html (én fil, virker uten nett) fra mal.html.
Bruk:  python3 lesestart/verktoy/gen.py   (bare når ord/fraser endres; krever piper-tts + no_NO-talesyntese-medium.onnx)
       python3 lesestart/verktoy/bygg.py
"""
import base64, json, os
d = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(d, 'mal.html'), encoding='utf-8').read()
font = base64.b64encode(open(os.path.join(d, 'andika-700-latin.woff2'), 'rb').read()).decode()
lyd = json.load(open(os.path.join(d, 'lyd.json')))
s = s.replace('__FONT__', font, 1).replace('const LYD = __LYD__;', 'const LYD = ' + json.dumps(lyd, separators=(',', ':')) + ';', 1)
assert '__FONT__' not in s and '__LYD__' not in s
out = os.path.join(d, '..', 'index.html')
open(out, 'w', encoding='utf-8').write(s)
print('skrev', os.path.normpath(out), len(s) // 1024, 'KB')
