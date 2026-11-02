"""Write static/cases.json from the packed videos in static/videos and tools/meta/<case>/case.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# 30 s clips, shown as a grid like the gallery
LONGS = {
    'long_watch': 'Watch movement',
    'long_reef': 'Coral reef tank',
    'long_jelly': 'Blue jellyfish',
    'long_ktv_zhaodaoni': '陈明《我要找到你》',
    'long_ktv_wenhelei': '周子寒《吻和泪》',
    'long_ktv_huore': '林志颖《火热的心》',
}
GALLERY = {  # id: (title, category)
    'g_flycity': ('Flying cars at night', 'CG / Game'),
    'a_owl': ('Burrowing owl', 'Animals'),
    'n_lilac': ('Lilac basket', 'Nature'),
    'c_windmill': ('Windmill village', 'Places'),
    'v_wheel': ('Supercar wheel', 'Objects'),
    'w_shorthair': ('Short hair, soft light', 'People'),
    'g_spaceship': ('Ring ship at sunset', 'CG / Game'),
    'n_yak': ('Highland yak', 'Animals'),
    'f_kitchen': ('Fresh vegetables', 'Food'),
    'n_protea': ('Protea macro', 'Nature'),
    's_redcar': ('Red sports car', 'Objects'),
    'g_neoncube': ('Neon hologram', 'CG / Game'),
    'a_orangecat': ('Orange cat', 'Animals'),
    'f_pastry': ('Pastries', 'Food'),
    'n_calendula': ('Marigolds', 'Nature'),
    'l_mountain': ('Icelandic highlands', 'Nature'),
    's_pool': ('Marble pool', 'Places'),
    't_thatch': ('Thatched roof', 'Places'),
    'l_seastack': ('Sea stack', 'Nature'),
    'w_red': ('Portrait in red', 'People'),
}

def entry(cid, title, cat=None):
    m = json.load(open(ROOT / 'tools/meta' / cid / 'case.json'))
    e = {'id': cid, 'title': title, 'video': f'static/videos/{cid}_cmp.mp4', 'poster': f'static/videos/{cid}_poster.jpg',
         'frames': m['n_frames'], 'fps': round(m['fps'], 2)}
    e['small'] = f'static/videos/{cid}_cmp_s.mp4'
    if cat:
        e['cat'] = cat
    return e

done = {p.name[:-8] for p in (ROOT / 'static/videos').glob('*_cmp.mp4')}
longs = [entry(c, t) for c, t in LONGS.items() if c in done]
cases = [entry(c, t, k) for c, (t, k) in GALLERY.items() if c in done]
(ROOT / 'static/cases.json').write_text(json.dumps({'longs': longs, 'cases': cases}, indent=1))
print(f'cases.json: {len(longs)} long candidates, {len(cases)} gallery cases')
