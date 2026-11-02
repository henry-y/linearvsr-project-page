"""Faint page backdrop: a 4x3 collage of LinearVSR output frames (the posters)."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
posters = sorted((ROOT / 'static/videos').glob('*_poster.jpg'))
cols, rows, w, h = 4, 3, 480, 264
canvas = Image.new('RGB', (cols * w, rows * h))
for i in range(cols * rows):
    im = Image.open(posters[i % len(posters)]).convert('RGB').resize((w, h))
    canvas.paste(im, ((i % cols) * w, (i // cols) * h))
canvas.save(ROOT / 'static/images/backdrop.jpg', quality=82)
print('backdrop from', len(posters), 'posters')
