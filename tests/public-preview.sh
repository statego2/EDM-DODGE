#!/usr/bin/env bash
set -euo pipefail
BASE="https://rawcdn.githack.com/statego2/EDM-DODGE/bffcd37f42876bf5453720fd142a62d707124d87/dist"
dir="$(mktemp -d)"
trap 'rm -rf "$dir"' EXIT

get() {
  local file="$1"
  curl --fail --silent --show-error --location --retry 3 --retry-delay 1 --max-time 25 \
    --dump-header "$dir/$file.headers" --output "$dir/$file" "$BASE/$file"
  test -s "$dir/$file" || { echo "Empty CDN asset: $file" >&2; exit 1; }
}
for asset in index.html game.js engine.js visuals.js missions.js progression.js audio.js style.css visual-upgrade.css; do
  get "$asset"
  printf '%s\n' "CDN OK: $asset ($(wc -c < "$dir/$asset") bytes)"
done
grep -Fq 'id="game"' "$dir/index.html" || { echo 'Missing canvas in public HTML'; exit 1; }
grep -Fq 'visual-upgrade.css' "$dir/index.html" || { echo 'Public HTML is stale'; exit 1; }
grep -Fq "from './visuals.js'" "$dir/game.js" || { echo 'Public game.js is stale'; exit 1; }
grep -Fq 'paintWorld' "$dir/visuals.js" || { echo 'Missing visual engine'; exit 1; }
for asset in game.js engine.js visuals.js missions.js progression.js audio.js; do
  if ! grep -Ei 'content-type: (text|application)/(javascript|ecmascript)' "$dir/$asset.headers" > /dev/null; then
    echo "Bad JS MIME for $asset:" >&2
    grep -i 'content-type' "$dir/$asset.headers" >&2 || true
    exit 1
  fi
done
if grep -Ei 'content-type: text/html' "$dir/index.html.headers" > /dev/null; then
  echo 'CDN HTML MIME: OK'
else
  echo 'Bad HTML MIME type' >&2
  exit 1
fi
echo "PUBLIC_CDN_PREVIEW_OK=$BASE/index.html"

# Pages requires repository settings. Report status without hiding a working fallback CDN.
PAGES="https://statego2.github.io/EDM-DODGE"
if curl --fail --silent --show-error --location --max-time 15 \
    --output "$dir/pages.index.html" "$PAGES/"; then
  if ! grep -Fq 'id="game"' "$dir/pages.index.html"; then
    echo 'GITHUB_PAGES_NOT_READY (unexpected HTML response)' >&2
    exit 1
  fi
  cmp "$dir/index.html" "$dir/pages.index.html" || { echo 'GitHub Pages serves the wrong HTML release' >&2; exit 1; }
  for asset in game.js engine.js visuals.js missions.js progression.js audio.js style.css visual-upgrade.css; do
    curl --fail --silent --show-error --location --retry 2 --max-time 20 \
      --output "$dir/pages.$asset" "$PAGES/$asset"
    cmp "$dir/$asset" "$dir/pages.$asset" || { echo "GitHub Pages release mismatch: $asset" >&2; exit 1; }
    echo "PAGES RELEASE MATCH: $asset"
  done
  echo "GITHUB_PAGES_RELEASE_VERIFIED=$PAGES/"
else
  echo 'GITHUB_PAGES_NOT_READY (activate GitHub Pages in repository Settings if desired)'
fi
