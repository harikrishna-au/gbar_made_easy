#!/bin/bash
# Regenerates the PWA icons in public/icons from public/favicon.svg using headless Chrome.
#   any       : the logo tile on a transparent background
#   maskable  : full-bleed brand background, logo shrunk into Android's circular safe zone
#   apple     : opaque square for iOS (iOS rounds the corners itself)
set -e
cd "$(dirname "$0")/.."
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
TMP=$(mktemp -d)
SVG=$(cat public/favicon.svg)
render() { # name size scale background("transparent" | "brand")
  local bg="transparent"; [ "$4" = "brand" ] && bg="linear-gradient(135deg,#18181a,#2c2b2e)"
  cat > "$TMP/$1.html" <<HTML
<!doctype html><html><body style="margin:0;width:$2px;height:$2px;background:$bg;display:flex;align-items:center;justify-content:center;overflow:hidden">
<div style="width:$(python3 -c "print(round($2*$3))")px;height:$(python3 -c "print(round($2*$3))")px">$SVG</div>
<style>svg{width:100%;height:100%;display:block}</style></body></html>
HTML
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 \
    --window-size=$2,$2 --screenshot="public/icons/$1.png" "file://$TMP/$1.html" >/dev/null 2>&1
}
render icon-192 192 1 transparent
render icon-512 512 1 transparent
render icon-maskable-512 512 0.66 brand
render apple-touch-icon 180 0.86 brand
rm -rf "$TMP"
ls -la public/icons
