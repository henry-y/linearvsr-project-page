// Before/after video comparison for the LinearVSR page.
// Each case is one side-by-side video (left half = bicubic-upscaled LR input, right half = LinearVSR).
// A single <video> is drawn onto a canvas twice, so both sides are always the same frame.

class CompareViewer {
  constructor(root, opts = {}) {
    this.root = root;
    this.split = 0.5;
    this.zoom = false;
    this.focus = { x: 0.5, y: 0.5 };
    this.dragging = false;

    root.classList.add('cmp');
    if (opts.compact) root.classList.add('compact');
    root.innerHTML = `
      <canvas></canvas>
      <video muted playsinline loop preload="auto" crossorigin="anonymous"></video>
      <div class="divider"></div>
      <div class="knob"><i class="fas fa-caret-left"></i><i class="fas fa-caret-right"></i></div>
      <div class="tag l">LR input <span class="sub"></span></div>
      <div class="tag r"><b>LinearVSR</b> &times;4</div>
      <div class="zoom-badge"><i class="fas fa-search-plus"></i> 3&times; zoom &middot; move to pan</div>
      <div class="loading">loading&hellip;</div>
      ${opts.onExpand ? '<button class="expand" title="View large" aria-label="View large"><i class="fas fa-expand"></i></button>' : ''}`;
    if (opts.onExpand) {
      const b = root.querySelector('.expand');
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('click', (e) => { e.stopPropagation(); opts.onExpand(); });
    }
    this.canvas = root.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.video = root.querySelector('video');
    this.divider = root.querySelector('.divider');
    this.knob = root.querySelector('.knob');
    this.loadingEl = root.querySelector('.loading');
    this.subEl = root.querySelector('.tag.l .sub');

    this.bar = opts.bar || null;
    if (this.bar) this._bindBar();
    this._bindPointer();
    this._layout();
    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);

    // only play while on screen
    new IntersectionObserver((es) => es.forEach((e) => {
      this.visible = e.isIntersecting;
      if (!this.visible) this.video.pause();
      else if (!this.userPaused) this.video.play().catch(() => {});
    }), { threshold: 0.15 }).observe(root);
  }

  load(c, src) {
    this.case = c;
    this.loadingEl.style.display = 'flex';
    this.subEl.textContent = c.lrNote || '(bicubic ×4)';
    this.video.src = src || c.video;
    this.video.playbackRate = this.rate || 1;
    this.video.onloadeddata = () => {
      this.loadingEl.style.display = 'none';
      this.half = this.video.videoWidth / 2;
      this.canvas.width = this.half;
      this.canvas.height = this.video.videoHeight;
      if (this.visible !== false && !this.userPaused) this.video.play().catch(() => {});
    };
  }

  _bindPointer() {
    const r = this.root;
    const pos = (e) => {
      const b = r.getBoundingClientRect();
      return { x: Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), y: Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)) };
    };
    r.addEventListener('pointerdown', (e) => { this.dragging = true; r.setPointerCapture(e.pointerId); const p = pos(e); this.split = p.x; this.focus = p; this._layout(); });
    r.addEventListener('pointermove', (e) => {
      const p = pos(e);
      if (this.dragging) { this.split = p.x; this._layout(); }
      if (this.zoom) this.focus = p;
    });
    const up = () => { this.dragging = false; };
    r.addEventListener('pointerup', up);
    r.addEventListener('pointercancel', up);
    r.addEventListener('dblclick', () => this.toggleZoom());
  }

  _bindBar() {
    const b = this.bar;
    b.innerHTML = `
      <button class="play"><i class="fas fa-pause"></i><span>Pause</span></button>
      <button class="slow">0.5&times;</button>
      <button class="zoom"><i class="fas fa-search-plus"></i> Zoom</button>
      <input class="seek" type="range" min="0" max="1000" value="0" aria-label="Seek">
      <span class="time">0:00 / 0:00</span>
      <span class="hint">Drag on the video to move the divider &middot; double-click or press Zoom to inspect details at 3&times;.</span>`;
    this.btnPlay = b.querySelector('.play');
    this.btnSlow = b.querySelector('.slow');
    this.btnZoom = b.querySelector('.zoom');
    this.seek = b.querySelector('.seek');
    this.timeEl = b.querySelector('.time');
    this.btnPlay.onclick = () => {
      if (this.video.paused) { this.userPaused = false; this.video.play(); } else { this.userPaused = true; this.video.pause(); }
    };
    this.btnSlow.onclick = () => {
      this.rate = this.rate === 0.5 ? 1 : 0.5;
      this.video.playbackRate = this.rate;
      this.btnSlow.classList.toggle('on', this.rate === 0.5);
    };
    this.btnZoom.onclick = () => this.toggleZoom();
    this.seek.oninput = () => {
      if (this.video.duration) this.video.currentTime = this.seek.value / 1000 * this.video.duration;
    };
  }

  stop() {
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.load();
    this.half = 0;
  }

  toggleZoom() {
    this.zoom = !this.zoom;
    this.root.classList.toggle('zoomed', this.zoom);
    if (this.btnZoom) this.btnZoom.classList.toggle('on', this.zoom);
  }

  _layout() {
    const pct = (this.split * 100).toFixed(3) + '%';
    this.divider.style.left = pct;
    this.knob.style.left = pct;
    this.root.querySelector('.tag.l').style.opacity = this.split < 0.18 ? 0 : 1;
    this.root.querySelector('.tag.r').style.opacity = this.split > 0.82 ? 0 : 1;
  }

  _tick() {
    const v = this.video, ctx = this.ctx;
    if (this.half && v.readyState >= 2 && (this.visible !== false || this._dirty !== this.split)) {
      this._dirty = this.split;
      const W = this.half, H = v.videoHeight;
      // source window (zoomed or full) in single-panel coordinates
      let sw = W, sh = H, sx = 0, sy = 0;
      if (this.zoom) {
        sw = W / 3; sh = H / 3;
        sx = Math.min(W - sw, Math.max(0, this.focus.x * W - sw / 2));
        sy = Math.min(H - sh, Math.max(0, this.focus.y * H - sh / 2));
      }
      const cut = this.split * W;               // divider in canvas pixels
      const cutSrc = sx + this.split * sw;      // same divider in source pixels
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      // left: LR (left half of the video)
      if (cut > 0) ctx.drawImage(v, sx, sy, cutSrc - sx, sh, 0, 0, cut, H);
      // right: LinearVSR (right half of the video)
      if (cut < W) ctx.drawImage(v, W + cutSrc, sy, sx + sw - cutSrc, sh, cut, 0, W - cut, H);
      if (this.bar && v.duration) {
        if (document.activeElement !== this.seek) this.seek.value = Math.round(v.currentTime / v.duration * 1000);
        this.timeEl.textContent = `${fmt(v.currentTime)} / ${fmt(v.duration)}`;
        const playing = !v.paused;
        if (this._lastPlaying !== playing) {
          this._lastPlaying = playing;
          this.btnPlay.innerHTML = playing ? '<i class="fas fa-pause"></i><span>Pause</span>' : '<i class="fas fa-play"></i><span>Play</span>';
        }
      }
    }
    requestAnimationFrame(this._tick);
  }
}

function fmt(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

window.CompareViewer = CompareViewer;
