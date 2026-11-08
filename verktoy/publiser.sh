#!/usr/bin/env bash
# Bygger, tester og publiserer nettstedet. Bruk: publiser.sh <repo-mappe> "<commit-melding>"
set -euo pipefail
REPO=$1; MSG=$2; HERE=$(cd "$(dirname "$0")" && pwd); SRC=${SRC:-/mnt/project-files/spill/sunken-siren.html}
cd "$REPO" && git pull -q origin main && # fjern bare det bygg.py lager; andre mapper (f.eks. lesestart/) beholdes
rm -rf index.html spill bilder ikoner last-ned sw.js manifest.webmanifest CHANGELOG.md README.md verktoy .nojekyll
python3 "$HERE/bygg.py" "$SRC" . | grep -E "offline-versjon|språk"
grep -q '"\.git' sw.js && { echo "FEIL: .git i sw.js"; exit 1; }
mkdir -p verktoy && cp -r "$HERE"/{README.md,SIKKERHET.md,CHANGELOG.md,bygg.py,publiser.sh,forside.html,sw.js,manifest.webmanifest,test.js,test-offline.js,bilder,ikoner} verktoy/ && cp verktoy/README.md README.md
pkill -f "http.server 8765" || true; (python3 -m http.server 8765 >/dev/null 2>&1 &); sleep 1
R=$(cd "$HERE" && node test.js); echo "$R" | grep -E '"(csp|ext|errs|xss|gameRoom|codeOK)"'
echo "$R" | grep -q '"xss": false' && echo "$R" | grep -q '"errs": \[\]' && echo "$R" | grep -q '"ext": \[\]' || { echo "FEIL: test.js"; exit 1; }
O=$(cd "$HERE" && timeout 250 node test-offline.js); echo "$O" | tail -2; echo "$O" | grep -q "errs \[\] csp \[\]" || { echo "FEIL: offline"; exit 1; }
git add -A && git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -qm "$MSG" && git push -q origin main
SHA=$(git rev-parse --short HEAD); echo "pushet $SHA"
until gh api "repos/UUnreal/Sunken-siren/actions/runs?per_page=1" --jq ".workflow_runs[0]|select(.head_sha|startswith(\"$SHA\"))|select(.status==\"completed\")|.conclusion" | grep -q .; do sleep 5; done
gh api "repos/UUnreal/Sunken-siren/actions/runs?per_page=1" --jq '.workflow_runs[0].conclusion'
