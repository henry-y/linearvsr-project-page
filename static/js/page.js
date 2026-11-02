// Wires the page to static/cases.json: 30 s clip grid, module animations,
// grid gallery of compact comparison tiles, and the large-view modal.
(async function () {
  const data = await (await fetch('static/cases.json')).json();

  const meta = (c) =>
    `<b>${c.title}</b> &middot; ${c.frames} frames @ ${c.fps} fps (${(c.frames / c.fps).toFixed(1)} s) &middot; ` +
    `320&times;176 &rarr; 1280&times;704`;

  // ---------------- module animations (auto-advance)
  const MODS = [
    ['mod-encoder', 'Cascaded encoder'],
    ['mod-dit', 'Linear-attention DiT'],
    ['mod-stream', 'Streaming KV-cache'],
    ['mod-decoder', 'Pruned decoder'],
    ['mod-kernel', 'Kernel fusion'],
  ];
  const mv = document.getElementById('mod-video');
  const mt = document.getElementById('mod-tabs');
  let mi = 0;
  MODS.forEach(([id, name], i) => {
    const b = document.createElement('button');
    b.innerHTML = `${i + 1}. ${name}<span class="prog"></span>`;
    b.onclick = () => playMod(i);
    mt.appendChild(b);
  });
  function playMod(i) {
    mi = i;
    mv.src = `static/videos/anim_${MODS[i][0]}.mp4`;
    mv.play().catch(() => {});
    mt.querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === i));
  }
  mv.addEventListener('ended', () => playMod((mi + 1) % MODS.length));
  mv.addEventListener('timeupdate', () => {
    const p = mt.querySelectorAll('.prog')[mi];
    if (p && mv.duration) p.style.width = `${(mv.currentTime / mv.duration) * 100}%`;
  });
  new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? mv.play().catch(() => {}) : mv.pause())), { threshold: 0.2 }).observe(mv);
  playMod(0);

  // ---------------- large-view modal
  const modal = document.getElementById('modal');
  const modalViewer = new CompareViewer(document.getElementById('modal-viewer'), { bar: document.getElementById('modal-bar') });
  function openModal(c) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalViewer.visible = true;
    modalViewer.userPaused = false;
    modalViewer.load(c);
    document.getElementById('modal-meta').innerHTML = meta(c);
  }
  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    modalViewer.stop();
  }
  document.getElementById('modal-close').onclick = closeModal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  // ---------------- tile grids (30 s clips + gallery)
  function addTile(grid, c, label) {
    const fig = document.createElement('figure');
    fig.className = 'tile';
    const box = document.createElement('div');
    fig.appendChild(box);
    fig.insertAdjacentHTML('beforeend', `<figcaption>${c.title}<span>${label}</span></figcaption>`);
    grid.appendChild(fig);
    const v = new CompareViewer(box, { compact: true, onExpand: () => openModal(c) });
    // load the video only once the tile is near the viewport, so dozens of clips don't starve the page
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); v.load(c); }
    }, { rootMargin: '300px' });
    io.observe(fig);
    return { c, fig };
  }
  const longGrid = document.getElementById('long-grid');
  data.longs.forEach((c) => addTile(longGrid, c, `${(c.frames / c.fps).toFixed(0)} s`));

  const cats = ['All', ...new Set(data.cases.map((c) => c.cat))];
  const tabs = document.getElementById('tabs');
  const grid = document.getElementById('grid');
  const tiles = data.cases.map((c) => addTile(grid, c, c.cat));
  let cat = 'All';
  const PAGE = 6;
  let shown = PAGE;
  const moreWrap = document.createElement('div');
  moreWrap.className = 'more-wrap';
  moreWrap.innerHTML = '<button class="more-btn"><i class="fas fa-chevron-down"></i>&nbsp; Show more</button>';
  grid.after(moreWrap);
  moreWrap.querySelector('button').onclick = () => { shown += PAGE; applyFilter(); };
  function applyFilter() {
    const match = tiles.filter((t) => cat === 'All' || t.c.cat === cat);
    tiles.forEach((t) => { t.fig.style.display = 'none'; });
    match.slice(0, shown).forEach((t) => { t.fig.style.display = ''; });
    moreWrap.style.display = match.length > shown ? '' : 'none';
  }
  function renderTabs() {
    tabs.innerHTML = '';
    cats.forEach((k) => {
      const b = document.createElement('button');
      b.textContent = k;
      b.className = k === cat ? 'on' : '';
      b.onclick = () => { cat = k; shown = PAGE; renderTabs(); applyFilter(); };
      tabs.appendChild(b);
    });
  }
  renderTabs();
  applyFilter();
})();
