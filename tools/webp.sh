#!/bin/bash
# Makes the small in-game copies of the card art: art/<name>.jpg -> art/w/<name>.webp (560px wide, about 1/4 the size).
# Run it after adding or replacing any card picture. Only new or changed pictures are converted.
cd "$(dirname "$0")/../art" || exit 1
mkdir -p w
n=0
for f in *.jpg; do
  out="w/${f%.jpg}.webp"
  if [ ! -f "$out" ] || [ "$f" -nt "$out" ]; then cwebp -quiet -q 75 -m 6 -resize 560 0 "$f" -o "$out" && n=$((n+1)); fi
done
echo "converted $n"
