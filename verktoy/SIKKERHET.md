# Sikkerhet og personvern

Sist gjennomgått: 6. november 2026.

## Trusselmodell

Nettstedet er helt statisk. Det finnes ingen server vi styrer, ingen database, ingen kontoer, ingen API-nøkler og ingen hemmeligheter i repoet. Det eneste som lagres er spillerens egen fremgang i `localStorage` på spillerens egen enhet.

Det betyr at de reelle risikoene er:

| Risiko | Tiltak |
|---|---|
| Nettstedet sender data et sted (sporing, lekkasje) | CSP med `connect-src 'none'` på begge sider. Nettleseren nekter `fetch`, XHR, WebSocket og `sendBeacon`. Ingen eksterne skript, fonter eller bilder. |
| Kode kjøres fra manipulert lagring (XSS) | Forsiden setter all tekst med `textContent` og validerer tall og lister. Sekk-ikoner hentes bare fra en fast tabell. Spillet slår opp ting i en fast tabell og setter aldri lagringsdata som HTML. |
| Søkelenker gir fremmede sider tilgang til fanen | `window.open(..., 'noopener,noreferrer')` og `<meta name="referrer" content="no-referrer">`. |
| Ondsinnet kode i avhengigheter | Det finnes ingen avhengigheter. Alt er skrevet for hånd. |
| Noen endrer repoet | Bare eieren har skrivetilgang. Slå på 2-faktor på GitHub-kontoen. |
| Juks med lagringskoder | Bevisst akseptert. Det finnes ingen konkurranse eller ledertavle å jukse i. |

## Sikkerhetsregler (Content-Security-Policy)

Forsiden:
```
default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self';
connect-src 'none'; form-action 'none'; base-uri 'none'
```

Spillet (legges inn av `bygg.py`):
```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; media-src 'self' data: blob:; connect-src 'none';
object-src 'none'; base-uri 'none'; form-action 'none'
```

`'unsafe-inline'` trengs fordi spillet med vilje er én selvstendig fil. Det er akseptabelt her fordi ingen brukerdata noen gang settes inn som HTML eller kode.

## Offline (service worker)

`sw.js` svarer bare på forespørsler til nettstedets egen adresse (samme opphav) og lagrer bare nettstedets egne filer. Den sender ingenting. CSP tillater bare `worker-src 'self'` og `manifest-src 'self'`.

## Pentest 6. november 2026

Kjørt med `verktoy/test.js` (Playwright, Chromium):

| Test | Resultat |
|---|---|
| XSS via `room`, `ch`, `hl` og `inv` i lagringen på forsiden | ✅ Ingen kode kjørt. Verdiene ble rensket (kapittel 1, 📦 for ukjente ting). |
| Ødelagt lagring (`null`, tekst, liste, feil type, ugyldig JSON) | ✅ Forsiden faller tilbake til «ingen lagring». |
| `__proto__` og `constructor` som ting i sekken | ✅ Ignorert. |
| Forespørsler ut av nettstedet ved lasting og spilling | ✅ Ingen. |
| CSP-brudd | ✅ Ingen. Lyd og spill virker med CSP på. |
| XSS via sekken i spillet | ✅ Ingen kode kjørt. |
| Ukjent ting i sekken i spillet | ✅ Rettet i kilden: `cleanSave()` validerer lagringen (ukjente ting fjernes, tall begrenses, ugyldig rom gir nytt spill). Testet på nytt uten feil. |
| Søkeknapper uten `noopener` | ✅ Rettet i kilden (byggeskriptet har samme vern som reserve). |

Spillets egne tester for manipulert lagring ligger i spillmappen (`verktoy/tester/tamper.js`, se spillets README).

## Personvern

- Ingen personopplysninger samles inn av oss.
- GitHub Pages (Microsoft/GitHub) ser IP-adressen ved lasting, slik alle webservere gjør. Se GitHubs personvernerklæring.
- Dette står i klartekst på forsiden under «Personvern», sammen med en knapp som sletter all lagret fremgang.

## Melde fra om sikkerhetsproblemer

Opprett en issue i repoet, eller kontakt eieren på GitHub (`UUnreal`). Ikke legg inn personopplysninger i issues.
