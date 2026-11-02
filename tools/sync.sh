#!/usr/bin/env bash
# Pull packed videos + case metadata from b200, make half-size gallery copies, regenerate cases.json + backdrop.
set -euo pipefail
cd "$(dirname "$0")/.."
R=b200-node23-codex:/pfs/pfs-7jnepv/henry/linearvsr_showcase
rsync -a --exclude 'long_snow_*' --exclude 'w_ocean_*' --exclude 'w_redhead_*' --exclude 'w_smile_*' --exclude 'a_crow_*' --exclude 'f_dumpling_*' --exclude 'long_*' "$R/web/" static/videos/
used=$(grep -o "'long_[a-z0-9_]*'" tools/make_cases.py | tr -d "'")  # long clips currently on the page
for b in $used; do rsync -a "$R/web/${b}_cmp.mp4" "$R/web/${b}_poster.jpg" static/videos/ || echo "not ready: $b"; done
mkdir -p tools/meta
ssh b200-node23-codex 'cd /pfs/pfs-7jnepv/henry/linearvsr_showcase/cases && tar cf - */case.json' | tar xf - -C tools/meta
for v in static/videos/*_cmp.mp4; do
  s=${v%.mp4}_s.mp4
  b=$(basename "$v" _cmp.mp4)
  case $b in anim_*) continue;; long_*) grep -qx "$b" <<<"$used" || continue;; esac
  [[ -f $s && $s -nt $v ]] || ffmpeg -v error -y -i "$v" -vf scale=1280:-2:flags=lanczos -c:v libx264 -preset slow -crf 20 -movflags +faststart -an "$s"
done
python3 -I tools/make_cases.py
python3 -I tools/make_backdrop.py
