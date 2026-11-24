# Lesestart

Barneversjonen av *Relic of the Sunken Siren* for barn på 5–7 år. Barnet lærer bokstavlydene
**I S O L E V A T** og leser og lager korte, lydrette ord sammen med professoren.

- Spill: `lesestart/index.html` (én fil, ca. 480 KB, virker uten nett).
- Plan og kilder: Claude-dokumentet «Barneversjon: lær å lese med Sunken Siren».

## Pedagogikk
- Systematisk bokstav-lyd. Rekkefølgen følger Lesesenterets eksempel (Språkløyper, UiS): nyttige bokstaver først, like bokstaver langt fra hverandre.
- Én ny bokstav om gangen. Neste bokstav kommer når den nyeste er lært (minst 4 av de 5 siste riktige).
- Tre oppgavetyper: hør lyden og finn bokstaven, les ordet og velg bildet, lag ordet av bokstaver.
- Feil gir aldri straff. Lyden spilles igjen, og etter to feil lyser riktig svar.
- Riktig ord vises som langsom lydering og så vanlig ord, slik at barnet hører hvordan lydene glir sammen.
- Økta stopper etter 10 minutter (5–20 i voksenpanelet). Ingen poeng, streaks eller premier.

## Voksenpanel
Hold ⚙️ inne i 2 sekunder. Viser fremgang per bokstav, lar en voksen spille inn egne bokstavlyder
(lagres bare på enheten), endre øktlengde og nullstille.

## Bygging
```
python3 lesestart/verktoy/gen.py    # bare når ord.json/fraser.json endres. Krever piper-tts og no_NO-talesyntese-medium.onnx i samme mappe
python3 lesestart/verktoy/bygg.py   # setter sammen mal.html + Andika-skrift + lyd.json til lesestart/index.html
```
Bokstavlydene lages fra fonemer (ikke tekst), så Piper sier /sss/ og ikke «ess». De er ikke kontrollert av et menneske ennå.

## Personvern
Ingen konto, ingen reklame, ingen sporing, ingen nettverkskall (CSP `connect-src 'none'`). Fremgang og opptak ligger i `localStorage` (`lesestart`).

## Lisenser
Skrift: Andika (SIL Open Font License). Stemme: Piper `no_NO-talesyntese-medium`.
