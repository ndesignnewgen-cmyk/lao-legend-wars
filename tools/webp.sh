#!/bin/bash
# Makes the in-game copies of the card art: art/<name>.jpg -> art/w/<name>.webp (560px wide, about 1/4 the size) for
# hands and boards, and art/w2/<name>.webp (full master size, at most 1100px wide, better quality) for big views:
# card info, the card popup and the summon showcase background. A bigger master (e.g. the original 1024x1536) gives a sharper w2.
# Most w2 files were made from the original ~1062x1482 pictures (Documents/Codex/.../outputs, matched to the masters by
# picture similarity, 2026-11-01); this script only rewrites a w2 when its master is newer.
# Run it after adding or replacing any card picture. Only new or changed pictures are converted.
cd "$(dirname "$0")/../art" || exit 1
mkdir -p w w2
n=0
for f in *.jpg; do
  out="w/${f%.jpg}.webp"
  if [ ! -f "$out" ] || [ "$f" -nt "$out" ]; then cwebp -quiet -q 75 -m 6 -resize 560 0 "$f" -o "$out" && n=$((n+1)); fi
  big="w2/${f%.jpg}.webp"
  if [ ! -f "$big" ] || [ "$f" -nt "$big" ]; then
    w=$(sips -g pixelWidth "$f" | awk '/pixelWidth/{print $2}'); r=""; [ "$w" -gt 1100 ] && r="-resize 1100 0"
    cwebp -quiet -q 84 -m 6 -sharp_yuv $r "$f" -o "$big" && n=$((n+1)); fi
done
echo "converted $n"
