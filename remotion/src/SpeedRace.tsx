// Streaming race: a live 30 fps input processed in 33-frame chunks (stride 32) by two systems
// whose throughput is the measured 2K FPS of the paper's Tab. 2 (one H200).
// public/race.mp4 is [FlashVSR-Tiny-Long output | LinearVSR output] on the same degraded watch clip,
// both from the real checkpoints; only the playback timing is simulated.
import React from 'react';
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from './theme';

const SRC_FPS = 29.97;
const N_FRAMES = 897;

function schedule(fps: number) {
  const proc = 33 / fps;
  const avail = new Array<number>(N_FRAMES);
  let done = 0;
  for (let k = 0; ; k++) {
    const last = k === 0 ? 33 : 33 + 32 * k;
    if (last > N_FRAMES) break;
    const arrive = last / SRC_FPS;
    done = Math.max(arrive, done) + proc;
    for (let i = k === 0 ? 0 : last - 32; i < last; i++) avail[i] = done;
  }
  for (let i = 0; i < N_FRAMES; i++) if (avail[i] === undefined) avail[i] = Infinity;
  const show = new Array<number>(N_FRAMES);
  show[0] = avail[0];
  for (let i = 1; i < N_FRAMES; i++) show[i] = Math.max(show[i - 1] + 1 / SRC_FPS, avail[i]);
  return show;
}
const OURS = schedule(47.6);
const FLASH = schedule(8.86);

function shownAt(show: number[], t: number) {
  let lo = -1, hi = show.length - 1;
  while (lo < hi) { const mid = Math.ceil((lo + hi + 1) / 2); if (show[mid] <= t) lo = mid; else hi = mid - 1; }
  return lo;
}

const Half: React.FC<{ side: 'flash' | 'sr'; frame: number; w: number; h: number }> = ({ side, frame, w, h }) => {
  const { fps } = useVideoConfig();
  return (
    <div style={{ width: w, height: h, overflow: 'hidden', position: 'relative', borderRadius: 10, background: '#000' }}>
      <Freeze frame={Math.max(0, Math.round((frame / SRC_FPS) * fps))}>
        <OffthreadVideo src={staticFile('race.mp4')} muted style={{ position: 'absolute', top: 0, left: side === 'sr' ? -w : 0, width: 2 * w, height: h }} />
      </Freeze>
    </div>
  );
};

const Panel: React.FC<{ x: number; y: number; w: number; title: string; fpsLabel: string; color: string; show: number[]; side: 'flash' | 'sr'; note?: string }> = ({ x, y, w, title, fpsLabel, color, show, side, note }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const i = shownAt(show, t);
  const live = Math.min(N_FRAMES - 1, Math.floor(t * SRC_FPS));
  const behind = i < 0 ? t : (live - i) / SRC_FPS;
  const stalled = i < 0 || (i < N_FRAMES - 1 && show[i + 1] > t + 0.5 / SRC_FPS && show[i + 1] - show[i] > 1.5 / SRC_FPS);
  const h = Math.round((w * 704) / 1280);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontSize: 26, fontWeight: 800, color }}>{title}</span>
        <span style={{ fontSize: 20, color: C.soft }}>{fpsLabel}</span>
      </div>
      <div style={{ position: 'relative', border: `2px solid ${color}`, borderRadius: 12, padding: 0 }}>
        {i >= 0 ? <Half side={side} frame={i} w={w - 4} h={h} /> : <div style={{ width: w - 4, height: h, background: '#000', borderRadius: 10 }} />}
        {stalled && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 10 }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', border: '6px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', transform: `rotate(${f * 14}deg)` }} />
            <span style={{ marginLeft: 14, fontSize: 22, fontWeight: 700 }}>{i < 0 ? 'processing first chunk…' : 'buffering…'}</span>
          </div>
        )}
        {note && <div style={{ position: 'absolute', left: 10, bottom: 10, fontSize: 15, background: 'rgba(0,0,0,0.65)', padding: '3px 8px', borderRadius: 6, color: C.soft }}>{note}</div>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 21 }}>
        <span style={{ color: C.soft }}>shown <b style={{ color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{Math.max(0, i + 1)}</b> / {live + 1} live frames</span>
        <span style={{ color: behind > 2.5 ? C.bad : C.good, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{behind.toFixed(1)} s behind live</span>
      </div>
      <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, marginTop: 8, overflow: 'hidden' }}>
        <div style={{ width: `${(Math.max(0, i + 1) / Math.max(1, live + 1)) * 100}%`, height: '100%', background: color }} />
      </div>
    </div>
  );
};

export const SpeedRace: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 700px at 70% 0%, #111a2e 0%, ${C.bg} 60%)`, fontFamily: FONT, color: C.text }}>
      <div style={{ position: 'absolute', left: 56, top: 30 }}>
        <div style={{ fontSize: 18, letterSpacing: 3, color: C.accent, fontWeight: 700, textTransform: 'uppercase' }}>Streaming at 2K, one H200</div>
        <div style={{ fontSize: 34, fontWeight: 700, marginTop: 4 }}>Live 30 fps input: LinearVSR keeps up, FlashVSR-Tiny falls behind</div>
      </div>
      <div style={{ position: 'absolute', right: 56, top: 30, fontSize: 24, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: C.soft }}>t = {t.toFixed(1)} s</div>
      <Panel x={56} y={150} w={570} title="LinearVSR" fpsLabel="47.6 FPS > 30 fps input" color={C.accent} show={OURS} side="sr" />
      <Panel x={654} y={150} w={570} title="FlashVSR-Tiny" fpsLabel="8.86 FPS < 30 fps input" color={C.warn} show={FLASH} side="flash" />
      <div style={{ position: 'absolute', left: 56, right: 56, bottom: 26, fontSize: 17, color: C.muted }}>
        Frames are each model's real ×4 output on the same input. Both are paced in 33-frame chunks at their measured 2K throughput (Tab. 2). Playback starts once the first chunk is ready and pauses when the next frame is not yet restored.
      </div>
    </AbsoluteFill>
  );
};
