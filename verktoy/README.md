# Relic of the Sunken Siren: nettstedet

Et gratis gåte-eventyr som kjøres rett i nettleseren. Ingen konto, ingen sporing, ingen reklame.

- **Spill her:** https://uunreal.github.io/sunken-siren/
- **Eier:** Jørund (GitHub: `UUnreal`)

Dette dokumentet er skrevet slik at en person som aldri har sett prosjektet før kan ta over, bygge, teste og publisere på nytt.

---

## 1. Hva er dette?

| Del | Hva det er |
|---|---|
| Spillet | Ett point-and-click eventyr med 100 kapitler, laget med HTML og Canvas 2D. Ingen biblioteker, ingen server. Norsk tekst (nordnorsk dialekt). |
| Forsiden | En spillportal i 2000-tallsstil som starter spillet og viser spillerens egen fremgang. |
| Lyd | Stemmer laget med Piper (talesyntese, `no-talesyntese-medium`) og musikk laget med MusicGen. |
| Hosting | GitHub Pages: gratis, statisk, ingen backend. |

### Prinsipper som ikke skal brytes
Dette er eierens faste regler. Les dem før du endrer noe.

1. **Spillbarhet og kvalitet først**, alltid.
2. **Ingen konto, ingen innlogging, ingen sporing, ingen cookies, ingen analyse.**
3. **Ingen reklame og ingen kjøp** (ingen pay-to-win).
4. **Ingen avhengighetsskapende mekanikker**: ingen poeng som vokser, ingen streaks, ingen loot-kister, ingen varsler, ingen ledertavler.
5. **Kunnskap og gåteløsning først.** Svar skal kunne finnes i ekte kilder (Wikipedia, Store norske leksikon, forskning).
6. Hjelp skal alltid være tilgjengelig: 🧭-knappen viser neste steg gratis.
7. Fremgang lagres **bare lokalt** på spillerens enhet.

---

## 2. Mappestruktur

```
/                         ← roten i repoet = det som publiseres
├── index.html            forsiden (bygget fra verktoy/forside.html)
├── .nojekyll             sier til GitHub Pages at filene skal serveres som de er
├── bilder/*.jpg          skjermbilder til forsiden
├── spill/
│   ├── index.html        selve spillet på norsk (uten innebygd lyd)
│   ├── index.en.html     engelsk versjon
│   └── lyd/
│       ├── musikk.js     window.MU = { port, jungel, tempel, taverna, hardcore } (base64 mp3), felles for alle språk
│       ├── stemmer.js    window.VO = { <hash>: base64 mp3, ... } (én per replikk), norsk
│       └── stemmer.en.js   engelske stemmer (window.VO_EN)
├── sw.js                 service worker: gjør at alt virker uten nett (lages av bygg.py)
├── manifest.webmanifest  gjør nettstedet installerbart som app
├── ikoner/               app-ikoner
└── verktoy/
    ├── README.md         dette dokumentet
    ├── SIKKERHET.md      sikkerhetsmodell og pentest-resultater
    ├── bygg.py           byggeskriptet
    ├── forside.html      kilden til forsiden
    ├── test.js           automatisk funksjons- og sikkerhetstest
    ├── test-offline.js   test av offline-modus
    ├── sw.js, manifest.webmanifest, ikoner/   kilder til offline/app-delen
    └── bilder/           kilden til skjermbildene
```

**Kilden til spillet** har egen dokumentasjon og egne tester (`spill/README.md` og `spill/verktoy/tester/` i prosjektmappen). Kilden er én fil, `sunken-siren.html` (ca. 14 MB), med all lyd innebygd. Den kan spilles alene, også uten nett. Byggeskriptet lager nettstedversjonen av den.

---

## 3. Bygge nettstedet

Krav: Python 3.8 eller nyere. Ingen pakker trengs.

```bash
python3 verktoy/bygg.py sti/til/sunken-siren.html ut/
```

Skriptet gjør dette:
1. Flytter `<script id="mu">` (musikk) og `<script id="vo">` (stemmer) ut til `spill/lyd/*.js`, som lastes med `async`. Første lasting blir da ca. 80 KB (gzip) i stedet for 14 MB. Til lyden er lastet, bruker spillet nettleserens egen stemme og syntetisk musikk.
2. Legger inn sikkerhetsregler (Content-Security-Policy og `no-referrer`) i spillet. Se `SIKKERHET.md`.
3. Gjør søkeknappene i spillet sikre (`noopener,noreferrer`).
4. Henter emoji og navn på tingene i sekken fra spillet, så forsiden alltid viser riktig.
5. Kopierer forsiden og bildene.
6. Bygger engelsk hvis `sunken-siren.en.html` ligger ved siden av kildefila (lages med `python3 spill/lang/sprak.py alle spill/sunken-siren.html`). Engelsk er også bakt inn i selve spillfila, så språkknappene bytter på stedet uten å laste en annen side; på nettstedet hentes de engelske stemmene fra `lyd/stemmer.en.js`. Lagringen er felles, så fremgangen følger med ved språkbytte.

**Viktig for den som endrer spillet:** behold de to script-elementene med `id="mu"` og `id="vo"`, og la koden tåle at `window.MU`/`window.VO` mangler i starten. Ellers stopper byggeskriptet med en feilmelding.

---

## 4. Teste

Krav: Node.js og Playwright med Chromium (`npm i playwright && npx playwright install chromium`).

```bash
cd ut && python3 -m http.server 8765 &
node verktoy/test.js
```

Testen sjekker:
- at ingen sikkerhetsregler (CSP) brytes og at **ingen forespørsler går ut av nettstedet**
- at forsiden ikke kjører kode fra en manipulert lagring (XSS-forsøk)
- at forsiden tåler ødelagt lagring
- at spillet laster, at lyden kommer, og at et nytt spill starter
- at lagringskoden på forsiden har riktig format

Forventet resultat: `"csp": []`, `"ext": []`, `"xss": false`, `"gameRoom": "port"`, og ingen feil i `errs`.

Test også for hånd på en ekte mobil (stående skjerm) før publisering.

---

## 5. Publisere en ny versjon

1. Hent siste `sunken-siren.html`, og lag språkfilene på nytt med `python3 spill/lang/sprak.py alle spill/sunken-siren.html`.
2. Bygg: `python3 verktoy/bygg.py sunken-siren.html /tmp/site`
3. Test (se over).
4. Kopier innholdet i `/tmp/site/` til roten i repoet (behold `verktoy/`).
5. `git add -A && git commit -m "Ny versjon av spillet" && git push`
6. GitHub Pages oppdaterer seg selv etter 1–2 minutter. Sjekk https://uunreal.github.io/sunken-siren/

**Første gang:** i repoet på GitHub går du til *Settings → Pages*, velger *Deploy from a branch*, grenen `main` og mappen `/ (root)`, og lagrer.

---

## 6. Offline (virker uten nett)

Nettstedet er en installerbar app (PWA), slik at det virker uten nett etter første besøk.

- `sw.js` (service worker) laster ned forsiden, det norske spillet med stemmer og musikk, alle språkversjonene av spillsiden, bilder og ikoner ved første besøk (ca. 15 MB).
- Engelske stemmer (ca. 11 MB) lastes ned i bakgrunnen etter at det norske er klart. Forsiden viser fremdriften, og til slutt «Hele spillet, på alle språk, virker nå uten nett». Uten dem virker spillet likevel, men med nettleserens egen stemme.
- `last-ned/` inneholder originalfilene med all lyd inni. De kan lastes ned fra forsiden og åpnes fra disk eller minnepinne helt uten nett. Service workeren lagrer dem ikke i cache.
- Ingen nettside kan åpnes uten nett før første besøk. Første besøk krever nett én gang, eller at man bruker nedlastet fil.
- `bygg.py` gir hver versjon et eget versjonsnummer (hash av alle filene). Når du publiserer en ny versjon, henter enhetene den automatisk neste gang de er på nett, og den gamle kopien slettes.
- Forsiden viser «✈️ Klar! Spillet virker nå uten nett» når alt er lagret, og en «Installer som app»-knapp der nettleseren støtter det (på iPhone: Del → Legg til på Hjem-skjerm).
- Test: `node verktoy/test-offline.js` (laster siden, skrur av nettet i nettleseren og sjekker forside, spill og alle språk).
- Søkeknappene i spillet (Wikipedia, SNL, Google) trenger naturligvis nett.

## 7. Hvordan fremgang og lagring virker

- Spillet lagrer hele tilstanden som JSON i `localStorage` under nøkkelen **`siren`** (rom, kapittel, sekk, flagg, jokere `hl`, stjerner `st`).
- Forsiden leser den samme nøkkelen og viser den. Den oppdateres live via `storage`-hendelsen når spillet lagrer i en annen fane, og hvert 5. sekund.
- **Lagringskode** (for å bytte enhet): `KAP<kapittel>-J<jokere>-S<stjerner><kontrollbokstav>`, f.eks. `KAP12-J2-S20N`. Kontrollbokstaven er `A + (k*7 + j*13 + s*31 + 11) mod 26`. Koden er en bekvemmelighet, ikke en sikkerhetsmekanisme: det er greit at noen kan lage sin egen.
- Ingenting synkes mellom enheter. Det ville krevd en server og personopplysninger, og det er valgt bort med vilje.

---

## 8. Lage nye skjermbilder til forsiden

Skjermbildene i `verktoy/bilder/` er tatt med Playwright fra spillet med `?fast`, med et rom lagt inn i `localStorage`, og beskåret til spillvinduet (360 px bredt). Hold hvert bilde under ca. 20 KB (JPEG, kvalitet ca. 70).

---

## 9. Kjente begrensninger

- Fremgang forsvinner hvis spilleren sletter nettleserdata eller bruker privat modus. Lagringskoden er reserven.
- `localStorage` deles mellom alle sider under `uunreal.github.io`. Andre prosjekter på samme domene må ikke bruke nøkkelen `siren`.
- GitHub Pages lar oss ikke sette egne HTTP-headere. CSP ligger derfor som `<meta>`, og `frame-ancestors` (vern mot innramming) kan ikke settes. Spillet har ingen kontoer eller hemmeligheter, så risikoen er lav.
