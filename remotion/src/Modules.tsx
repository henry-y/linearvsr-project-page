// One short animation per LinearVSR component (Sec. 3 of the paper).
// Latencies are the 2K (1408x2560, 33 frames, one H200) speed ladder of the paper's Fig. 1(c);
// DiT speedups vs. full attention are the measured 1.17x / 1.32x / 1.72x at 1080p / 2K / 4K.
import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { C } from './theme';
import { LatencyBar, Scene, Tag, clamp, ramp } from './ui';
import { Card, Flow, FrameStack, Pill, Tensor, lr, sr } from './viz';

// ---------------------------------------------------------------- 1. encoder
export const EncoderAnim: React.FC = () => {
  const f = useCurrentFrame();
  const a = (s: number, d = 14) => ramp(f, s, s + d);
  const dimStd = interpolate(f, [100, 118], [1, 0.3], clamp);
  const b0 = 104;
  return (
    <Scene step="Module 1" title="Cascaded latent-upsampling encoder"
      sub="Encoding the ×4-upsampled video dominates the VAE cost. LinearVSR encodes at ×2 and lifts the latent to the target grid with bilinear interpolation plus a learned residual 𝓡φ.">
      {/* standard path */}
      <div style={{ opacity: dimStd }}>
        <Pill x={60} y={196} color={C.muted}>Standard</Pill>
        <FrameStack x={70} y={262} w={120} src={lr} blur={1.4} appear={a(10, 18)} label="LR video" />
        <Flow x1={205} y1={296} x2={262} y2={296} p={a(24)} color={C.muted} />
        <FrameStack x={280} y={232} w={230} src={lr} blur={2.2} appear={a(30, 18)} label={<span>pixel ↑4 &nbsp;<b style={{ color: C.bad }}>16× pixels</b></span>} />
        <Flow x1={530} y1={296} x2={590} y2={296} p={a(46)} color={C.enc} />
        <Card x={600} y={240} w={200} h={112} color={C.enc} title="VAE encoder" sub="full output resolution" appear={a(52)} active={f > 60 && f < 100 ? 1 : 0} />
        <Flow x1={810} y1={296} x2={872} y2={296} p={a(64)} color={C.enc} />
        <Tensor x={884} y={250} w={92} h={70} d={44} grid={[6, 4]} color={C.enc} appear={a(72)} label="latent z" />
      </div>
      <svg style={{ position: 'absolute', left: 0, top: 0 }} width={1280} height={720}>
        <line x1={590} y1={300} x2={590 + 230 * a(98, 12)} y2={300 - 40 * a(98, 12)} stroke={C.bad} strokeWidth={4} strokeLinecap="round" opacity={a(98, 4)} />
      </svg>

      {/* ours */}
      <Pill x={60} y={404} color={C.accent} opacity={a(b0)}>LinearVSR</Pill>
      <FrameStack x={70} y={470} w={120} src={lr} blur={1.4} appear={a(b0 + 4, 18)} label="LR video" />
      <Flow x1={205} y1={504} x2={262} y2={504} p={a(b0 + 14)} color={C.accent} />
      <FrameStack x={280} y={460} w={165} src={lr} blur={1.8} appear={a(b0 + 18, 18)} label={<span>pixel ↑2 &nbsp;<b style={{ color: C.good }}>4× pixels</b></span>} />
      <Flow x1={462} y1={504} x2={505} y2={504} p={a(b0 + 30)} color={C.enc} />
      <Card x={515} y={462} w={150} h={86} color={C.enc} title="VAE encoder" fontSize={18} appear={a(b0 + 34)} active={f > b0 + 40 && f < b0 + 70 ? 1 : 0} />
      <Flow x1={672} y1={504} x2={705} y2={504} p={a(b0 + 42)} color={C.enc} />
      <Tensor x={714} y={484} w={46} h={35} d={22} grid={[3, 2]} color={C.enc} appear={a(b0 + 48)} />
      <Flow x1={780} y1={504} x2={815} y2={504} p={a(b0 + 54)} color={C.warn} />
      <Card x={825} y={458} w={170} h={94} color={C.warn} title={<span>bilinear ↑2</span>} sub={<span>+ residual 𝓡<sub>φ</sub></span>} fontSize={18} appear={a(b0 + 58)} active={f > b0 + 64 && f < b0 + 90 ? 1 : 0} />
      <Flow x1={1003} y1={504} x2={1050} y2={504} p={a(b0 + 68)} color={C.accent} />
      <Tensor x={1060} y={458} w={92} h={70} d={44} grid={[6, 4]} color={C.accent} appear={a(b0 + 74)} label="same latent grid" labelColor={C.accent} />

      <LatencyBar x={60} y={640} w={1160} label="VAE encode at 2K" before={696} after={171} start={178} color={C.enc} scale={720} />
    </Scene>
  );
};

// ---------------------------------------------------------------- 2. DiT
const RES = [
  { name: '720p', n: 1, sp: '' },
  { name: '1080p', n: 2.25, sp: '1.17×' },
  { name: '2K', n: 4, sp: '1.32×' },
  { name: '4K', n: 9.2, sp: '1.72×' },
];
const heat = (r: number, c: number, t: number) =>
  0.5 + 0.5 * Math.sin(r * 0.9 + t) * Math.cos(c * 0.7 - t * 0.6) * Math.exp(-Math.abs(r - c) * 0.05);

export const DiTAnim: React.FC = () => {
  const f = useCurrentFrame();
  const step = 46;
  const idx = Math.min(3, Math.max(0, Math.floor((f - 20) / step)));
  const tt = idx === 0 ? 1 : ramp(f, 20 + idx * step, 40 + idx * step);
  const n = idx === 0 ? 1 : RES[idx - 1].n + (RES[idx].n - RES[idx - 1].n) * tt;

  // cost chart (left)
  const X0 = 110, X1 = 570, Y0 = 470, Y1 = 250;
  const xOf = (v: number) => X0 + ((v - 1) / 8.2) * (X1 - X0);
  const yOf = (v: number) => Y0 - (v / 84.6) * (Y0 - Y1);
  const curve = (g: (v: number) => number) => {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const v = 1 + ((n - 1) * i) / 40; pts.push(`${xOf(v)},${yOf(g(v))}`); }
    return pts.join(' ');
  };

  // softmax heat map (right top) and linear state (right bottom)
  const k = Math.min(26, Math.round(4 + 2.4 * n));
  const side = Math.min(150, 28 + 13 * n);
  const cell = side / k;
  const cells = [];
  for (let r = 0; r < k; r++)
    for (let c = 0; c < k; c++) {
      const v = heat(r, c, f / 14);
      cells.push(<div key={`${r}-${c}`} style={{ position: 'absolute', left: c * cell, top: r * cell, width: cell + 0.5, height: cell + 0.5, background: `rgba(239,107,107,${0.12 + 0.75 * v})` }} />);
    }
  const nTok = Math.min(46, Math.round(6 * n));
  const tokX = (i: number, x0: number) => x0 + (i % 23) * 9;
  const tokY = (i: number, y0: number) => y0 + Math.floor(i / 23) * 9;
  return (
    <Scene step="Module 2" title="Linear-attention DiT backbone"
      sub="Softmax attention builds an N×N map, so its cost explodes with resolution. Linear attention summarizes all tokens in a fixed d×d state. 3 of every 4 blocks are linear; 1 keeps softmax.">
      {/* chart */}
      <div style={{ position: 'absolute', left: 60, top: 200, width: 560, height: 400, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }} />
      <Tag x={80} y={212} color={C.soft} size={18}>Attention cost vs. output resolution</Tag>
      <svg style={{ position: 'absolute', left: 0, top: 0 }} width={1280} height={720}>
        <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={C.border} strokeWidth={1.5} />
        {RES.map((r) => <line key={r.name} x1={xOf(r.n)} y1={Y0} x2={xOf(r.n)} y2={Y1 - 6} stroke="rgba(255,255,255,0.06)" />)}
        <polyline points={curve((v) => v * v)} fill="none" stroke={C.bad} strokeWidth={4} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${C.bad})` }} />
        <polyline points={curve((v) => v)} fill="none" stroke={C.accent} strokeWidth={4} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${C.accent})` }} />
        <circle cx={xOf(n)} cy={yOf(n * n)} r={7} fill={C.bad} />
        <circle cx={xOf(n)} cy={yOf(n)} r={7} fill={C.accent} />
      </svg>
      <Tag x={xOf(n) - 120} y={yOf(n * n) - 6} color={C.bad} size={17}>softmax O(N²)</Tag>
      <Tag x={X1 - 120} y={yOf(n) - 32} color={C.accent} size={17}>linear O(N)</Tag>
      {RES.map((r, i) => (
        <div key={r.name} style={{ position: 'absolute', left: xOf(r.n) - 40, top: Y0 + 10, width: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: i <= idx ? C.text : C.muted }}>{r.name}</div>
          {r.sp && <div style={{ marginTop: 8, fontSize: 15, fontWeight: 800, color: C.good, opacity: i < idx || (i === idx && tt > 0.9) ? 1 : 0 }}>{r.sp}</div>}
        </div>
      ))}
      <Tag x={80} y={548} color={C.muted} size={15}>green: measured DiT speedup vs. full softmax attention</Tag>
      {/* hybrid stack */}
      <div style={{ position: 'absolute', left: 80, top: 572, display: 'flex', gap: 5, alignItems: 'center' }}>
        {Array.from({ length: 12 }, (_, i) => {
          const s = i % 4 === 3;
          return <div key={i} style={{ width: 18, height: 14, borderRadius: 3, background: s ? `${C.soft2}aa` : `${C.lin}66`, border: `1px solid ${s ? C.soft2 : C.lin}` }} />;
        })}
        <span style={{ marginLeft: 10, fontSize: 15, color: C.soft }}>hybrid: <b style={{ color: C.lin }}>linear</b> ×3 : <b style={{ color: C.soft2 }}>softmax</b> ×1</span>
      </div>

      {/* softmax panel */}
      <div style={{ position: 'absolute', left: 650, top: 200, width: 570, height: 194, borderRadius: 16, background: 'rgba(239,107,107,0.05)', border: `1px solid ${C.bad}55` }} />
      <Tag x={670} y={212} color={C.bad} size={18}>Softmax: every token attends to every token</Tag>
      <div style={{ position: 'absolute', left: 990 - side / 2, top: 312 - side / 2 + 6, width: side, height: side, borderRadius: 4, overflow: 'hidden', border: `1.5px solid ${C.bad}`, boxShadow: `0 0 24px ${C.bad}55` }}>{cells}</div>
      <div style={{ position: 'absolute', left: 672, top: 270, fontSize: 15, color: C.soft }}>N × N map</div>
      <div style={{ position: 'absolute', left: 672, top: 292, fontSize: 40, fontWeight: 800, color: C.bad, fontVariantNumeric: 'tabular-nums' }}>{(n * n).toFixed(1)}×</div>
      <div style={{ position: 'absolute', left: 672, top: 342, fontSize: 14, color: C.muted }}>relative to 720p</div>

      {/* linear panel */}
      <div style={{ position: 'absolute', left: 650, top: 406, width: 570, height: 194, borderRadius: 16, background: 'rgba(108,182,255,0.05)', border: `1px solid ${C.accent}55` }} />
      <Tag x={670} y={418} color={C.accent} size={18}>Linear: tokens are summarized in a fixed d × d state</Tag>
      <svg style={{ position: 'absolute', left: 0, top: 0 }} width={1280} height={720}>
        {Array.from({ length: nTok }, (_, i) => (
          <React.Fragment key={i}>
            <line x1={tokX(i, 672) + 3} y1={tokY(i, 486) + 3} x2={938} y2={518} stroke={C.accent} strokeOpacity={0.12} />
            <line x1={1004} y1={518} x2={tokX(i, 1012) + 3} y2={tokY(i, 486) + 3} stroke={C.accent} strokeOpacity={0.12} />
          </React.Fragment>
        ))}
      </svg>
      {Array.from({ length: nTok }, (_, i) => (
        <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: tokX(i, 672), top: tokY(i, 486), width: 6, height: 6, borderRadius: 3, background: C.lin }} />
          <div style={{ position: 'absolute', left: tokX(i, 1012), top: tokY(i, 486), width: 6, height: 6, borderRadius: 3, background: C.lin }} />
        </React.Fragment>
      ))}
      <div style={{ position: 'absolute', left: 938, top: 486, width: 66, height: 66, borderRadius: 6, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2, padding: 4, background: 'rgba(108,182,255,0.12)', border: `1.5px solid ${C.accent}`, boxShadow: `0 0 ${16 + 8 * Math.sin(f / 6)}px ${C.accent}88` }}>
        {Array.from({ length: 36 }, (_, i) => <div key={i} style={{ background: C.accent, opacity: 0.25 + 0.6 * Math.abs(Math.sin(i * 1.7 + f / 10)), borderRadius: 1 }} />)}
      </div>
      <Tag x={672} y={560} color={C.soft} size={15}>{nTok >= 46 ? 'many' : nTok} tokens in</Tag>
      <Tag x={925} y={560} color={C.accent} size={15}>state stays d × d</Tag>
      <Tag x={1100} y={560} color={C.soft} size={15}>tokens out</Tag>

      <LatencyBar x={60} y={640} w={1160} label="DiT forward at 2K" before={806} after={608} start={200} color={C.dit} scale={850} />
    </Scene>
  );
};

// ---------------------------------------------------------------- 3. streaming
const LAYERS = ['L', 'L', 'L', 'S', 'L', 'L', 'L', 'S'];
export const StreamAnim: React.FC = () => {
  const f = useCurrentFrame();
  const P = 75;
  const k = Math.floor(f / P);
  const ph = f % P;
  const enter = ramp(ph, 0, 20);
  const proc = (ph - 20) / 30; // 0..1 while processing
  const lit = proc >= 0 && proc <= 1 ? Math.floor(proc * LAYERS.length) : -1;
  const leave = ramp(ph, 50, 72);
  const MX = 560, MY = 262, MW = 190;
  const slabY = (i: number) => MY + i * 30;
  const cacheFill = (i: number) => {
    // softmax layer i writes its keys/values when it is processed; they are read by the next chunk
    const writeAt = 20 + ((i + 0.5) / LAYERS.length) * 30;
    return k > 0 || ph >= writeAt ? 1 : 0;
  };
  return (
    <Scene step="Module 3" title="One-step streaming with a cross-chunk KV-cache"
      sub="The video is processed as a stream of 33-frame chunks, one denoising step each. Only the softmax layers keep the previous chunk's keys and values, so memory and latency per chunk stay constant.">
      <Pill x={60} y={204} color={C.muted}>live LR input · 33-frame chunks</Pill>
      <Pill x={1000} y={204} color={C.good}>restored output</Pill>
      {/* waiting chunk and entering chunk */}
      <FrameStack x={60} y={330} w={130} src={lr} n={4} gap={12} blur={1.2} appear={ramp(ph, 8, 26)} offset={k + 1} opacity={0.5} label={`chunk ${k + 2}`} />
      <FrameStack x={60 + (360 - 60) * enter} y={330} w={140} src={lr} n={4} gap={12} blur={1.2} appear={1} offset={k} opacity={1 - ramp(ph, 18, 26)} label={`chunk ${k + 1}`} />
      <Flow x1={225} y1={368} x2={540} y2={368} p={1} color={C.muted} flow={0.6} />
      {/* model */}
      <div style={{ position: 'absolute', left: MX - 14, top: MY - 46, width: MW + 64, height: 300, borderRadius: 18, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.025)' }} />
      <Tag x={MX + 4} y={MY - 36} color={C.soft} size={16}>DiT · 1 step · chunk {k + 1}</Tag>
      {LAYERS.map((t, i) => {
        const col = t === 'S' ? C.soft2 : C.lin;
        const on = lit === i;
        const done = lit > i || (proc > 1 && ph < 75);
        return (
          <Tensor key={i} x={MX} y={slabY(i)} w={MW} h={14} d={30} grid={[8, 1]} color={col} glow={on}
            opacity={on ? 1 : done ? 0.75 : 0.42} />
        );
      })}
      {/* KV-cache */}
      <div style={{ position: 'absolute', left: MX + MW + 70, top: MY + 40, width: 170, height: 170, borderRadius: 16, border: `1.5px dashed ${C.soft2}`, background: 'rgba(242,142,43,0.06)' }} />
      <Tag x={MX + MW + 84} y={MY + 52} color={C.soft2} size={16}>KV-cache</Tag>
      <Tag x={MX + MW + 84} y={MY + 74} color={C.muted} size={13}>previous chunk, softmax only</Tag>
      {[3, 7].map((i, j) => {
        const y = slabY(i) + 18;
        const cx = MX + MW + 100 + j * 64;
        const fill = cacheFill(i);
        const writing = lit === i;
        return (
          <React.Fragment key={i}>
            <Flow x1={MX + MW + 26} y1={y} x2={cx} y2={MY + 130} p={1} color={C.soft2} flow={writing ? 1 : 0.25} dots={2} />
            <div style={{ position: 'absolute', left: cx - 22, top: MY + 112, width: 44, height: 70, borderRadius: 10, border: `1.5px solid ${C.soft2}`, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${fill * 100}%`, background: `${C.soft2}77`, boxShadow: writing ? `0 0 16px ${C.soft2}` : undefined }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>K,V</div>
            </div>
          </React.Fragment>
        );
      })}
      {/* output */}
      <FrameStack x={1000 + 60 * (1 - leave)} y={300} w={190} src={sr} n={4} gap={12} appear={leave} offset={k} glow={`${C.good}66`} label={`chunk ${k + 1} restored`} />
      {/* constant latency strip */}
      <div style={{ position: 'absolute', left: 60, top: 560, width: 420, fontSize: 15, color: C.soft }}>latency per chunk</div>
      <div style={{ position: 'absolute', left: 60, top: 584, display: 'flex', gap: 6, alignItems: 'flex-end', height: 40 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} style={{ width: 26, height: 30, borderRadius: 4, background: i < k + (ph > 50 ? 1 : 0) ? C.accent : 'rgba(255,255,255,0.08)' }} />
        ))}
        <span style={{ marginLeft: 12, fontSize: 15, color: C.good, fontWeight: 700 }}>flat: 693 ms per 33 frames at 2K</span>
      </div>
    </Scene>
  );
};

// ---------------------------------------------------------------- 4. decoder
type Stage = { n: string; c0: number; c1: number; d0: number; d1: number; H: number; side: 'L' | 'P' };
const STAGES: Stage[] = [
  { n: 'in', c0: 512, c1: 512, d0: 1, d1: 1, H: 64, side: 'L' },
  { n: 'mid', c0: 512, c1: 512, d0: 2, d1: 2, H: 64, side: 'L' },
  { n: 'up₀', c0: 512, c1: 512, d0: 3, d1: 3, H: 64, side: 'L' },
  { n: 'up₁', c0: 512, c1: 384, d0: 3, d1: 3, H: 100, side: 'P' },
  { n: 'up₂', c0: 256, c1: 128, d0: 3, d1: 3, H: 140, side: 'P' },
  { n: 'up₃', c0: 128, c1: 64, d0: 3, d1: 1, H: 180, side: 'P' },
  { n: 'out', c0: 128, c1: 64, d0: 1, d1: 1, H: 180, side: 'P' },
];
export const DecoderAnim: React.FC = () => {
  const f = useCurrentFrame();
  const show = ramp(f, 8, 40);
  const p = ramp(f, 56, 104);
  const adapt = ramp(f, 118, 140);
  const CY = 410;
  let x = 170;
  const groupX: Record<string, [number, number]> = { L: [9999, 0], P: [9999, 0] };
  const slabs: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  STAGES.forEach((s, si) => {
    const cw = (s.c0 + (s.c1 - s.c0) * p) / 512;
    const w = 8 + 20 * cw;
    const d = s.H * 0.5;
    const col = adapt > 0.5 ? (s.side === 'L' ? C.enc : C.warn) : C.dec;
    const x0 = x;
    for (let j = 0; j < s.d0; j++) {
      const gone = j >= s.d1;
      const a = Math.min(1, Math.max(0, show * STAGES.length - si));
      slabs.push(
        <Tensor key={`${s.n}${j}`} x={x} y={CY - (s.H + d * 0.48) / 2 + (gone ? 60 * p : 0)} w={w} h={s.H} d={d} grid={[1, 4]} color={col}
          appear={a} opacity={gone ? 1 - p : 1} glow={!gone} />,
      );
      const adv = gone ? (w + 8) * (1 - p) : w + 8;
      x += adv;
    }
    x += d * 0.72 + 18;
    groupX[s.side][0] = Math.min(groupX[s.side][0], x0);
    groupX[s.side][1] = Math.max(groupX[s.side][1], x - 18);
    labels.push(<Tag key={s.n} x={x0 + 4} y={CY + 118} color={C.soft} size={15}>{s.n}</Tag>);
  });
  const outX = Math.max(x + 30, 1000);
  return (
    <Scene step="Module 4" title="Pruned decoder with predicted-latent adaptation"
      sub="Thinner up-sampling blocks and fewer res-blocks at the highest resolution; the latent side stays frozen and the pixel side is adapted to the DiT's predicted latents.">
      <Tensor x={70} y={CY - 40} w={44} h={52} d={34} grid={[3, 3]} color={C.accent} appear={show} label="ẑ (DiT output)" labelColor={C.accent} />
      <Flow x1={140} y1={CY} x2={168} y2={CY} p={show} color={C.accent} />
      {slabs}
      {labels}
      {/* group brackets */}
      {(['L', 'P'] as const).map((g) => {
        const [g0, g1] = groupX[g];
        const col = g === 'L' ? C.enc : C.warn;
        return (
          <div key={g} style={{ position: 'absolute', left: g0, top: 226, width: g1 - g0, opacity: adapt }}>
            <div style={{ height: 10, borderTop: `2px solid ${col}`, borderLeft: `2px solid ${col}`, borderRight: `2px solid ${col}`, borderRadius: '6px 6px 0 0' }} />
            <div style={{ position: 'absolute', top: -30, left: 0, right: 0, textAlign: 'center', fontSize: 16, fontWeight: 700, color: col, whiteSpace: 'nowrap' }}>
              {g === 'L' ? 'latent side · frozen · 258M' : 'pixel side · adapted to ẑ · 86M'}
            </div>
          </div>
        );
      })}
      <Flow x1={x + 4} y1={CY} x2={outX - 10} y2={CY} p={ramp(f, 40, 56)} color={C.good} />
      <FrameStack x={outX} y={CY - 70} w={200} src={sr} n={5} appear={ramp(f, 46, 70)} glow={`${C.good}55`} label="decoded 2K video" />
      <div style={{ position: 'absolute', left: 1010, top: 196, textAlign: 'right', width: 210 }}>
        <div style={{ fontSize: 15, color: C.muted }}>decoder params</div>
        <div style={{ fontSize: 38, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{Math.round(407 - 62 * p)}M</div>
        <div style={{ fontSize: 14, color: C.muted, opacity: p }}>from 407M</div>
      </div>
      <LatencyBar x={60} y={640} w={1160} label="VAE decode at 2K" before={714} after={349} start={170} color={C.dec} scale={760} />
    </Scene>
  );
};

// ---------------------------------------------------------------- 5. kernels
const OPS = [
  { n: 'norm', w: 16, col: '#9db9d9', fw: 10 },
  { n: 'SiLU', w: 12, col: '#c39bff', fw: 8 },
  { n: 'pad', w: 12, col: '#7fd1c7', fw: 8 },
  { n: 'conv', w: 56, col: '#6cb6ff', fw: 56 },
  { n: 'res', w: 14, col: '#f2cc70', fw: 8 },
];
const GROUPS = 6;
export const KernelAnim: React.FC = () => {
  const f = useCurrentFrame();
  const sweep1 = ramp(f, 16, 80);
  const m = ramp(f, 92, 138);
  const sweep2 = ramp(f, 150, 186);
  const lay = ramp(f, 150, 170);
  const T0 = 210, GAP = 10;
  const beforeGroupW = OPS.reduce((s, o) => s + o.w, 0) + GAP * OPS.length;
  const fusedW = OPS.reduce((s, o) => s + o.fw, 0);
  const afterGroupW = fusedW + GAP;
  const totalBefore = beforeGroupW * GROUPS - GAP;
  const totalAfter = afterGroupW * GROUPS - GAP;
  const total = totalBefore + (totalAfter - totalBefore) * m;
  const bars: React.ReactNode[] = [];
  const ticks: React.ReactNode[] = [];
  for (let g = 0; g < GROUPS; g++) {
    let xb = T0 + g * beforeGroupW;
    let xa = T0 + g * afterGroupW;
    OPS.forEach((o, i) => {
      const x = xb + (xa - xb) * m;
      const w = o.w + (o.fw - o.w) * m;
      bars.push(<div key={`${g}${i}`} style={{ position: 'absolute', left: x, top: 222, width: w, height: 40, background: o.col, opacity: 0.9, borderRadius: m > 0.95 ? 0 : 4 }} />);
      const inner = i !== 0 && i !== OPS.length - 1;
      const op = inner ? 1 - m : 1;
      ticks.push(<div key={`r${g}${i}`} style={{ position: 'absolute', left: x, top: 292, width: 3, height: 22, background: m > 0.5 && !inner ? C.good : C.bad, opacity: i === OPS.length - 1 ? 0 : op }} />);
      ticks.push(<div key={`w${g}${i}`} style={{ position: 'absolute', left: x + w - 3, top: 292, width: 3, height: 22, background: m > 0.5 && !inner ? C.good : C.warn, opacity: i === 0 ? 0 : op }} />);
      xb += o.w + GAP;
      xa += o.fw;
    });
    const xa0 = T0 + g * afterGroupW;
    bars.push(<div key={`f${g}`} style={{ position: 'absolute', left: xa0 - 2, top: 220, width: fusedW + 4, height: 44, borderRadius: 6, border: `2px solid ${C.good}`, boxShadow: `0 0 14px ${C.good}88`, opacity: ramp(f, 132, 144) }} />);
  }
  const sweepX = f < 140 ? T0 + totalBefore * sweep1 : T0 + totalAfter * sweep2;
  const ms = Math.round(1133 - (1133 - 693) * m);
  // memory layout inset
  const cells = (order: 'nchw' | 'nhwc') => Array.from({ length: 24 }, (_, i) => {
    const ch = order === 'nchw' ? Math.floor(i / 8) : i % 3;
    const px = order === 'nchw' ? i % 8 : Math.floor(i / 3);
    const hit = px === Math.floor((f / 10) % 8);
    const col = ['#ef6b6b', '#52e0a3', '#6cb6ff'][ch];
    return <div key={i} style={{ width: 20, height: 26, borderRadius: 3, background: col, opacity: hit ? 1 : 0.28, boxShadow: hit ? `0 0 10px ${col}` : undefined }} />;
  });
  return (
    <Scene step="Module 5" title="End-to-end kernel fusion"
      sub="Chains of small ops (norm, activation, padding, residual) are fused into their neighboring conv / attention kernels in Triton, with channels-last layouts across encoder, DiT and decoder.">
      <Tag x={60} y={232} color={C.soft} size={16}>GPU kernels</Tag>
      <Tag x={60} y={292} color={C.soft} size={16}>HBM traffic</Tag>
      {bars}
      {ticks}
      <div style={{ position: 'absolute', left: sweepX, top: 210, width: 2, height: 116, background: '#fff', opacity: (f > 16 && f < 82) || (f > 150 && f < 188) ? 0.8 : 0, boxShadow: '0 0 10px #fff' }} />
      <div style={{ position: 'absolute', left: T0, top: 334, width: total, height: 2, background: C.border }} />
      <div style={{ position: 'absolute', left: T0 + total - 120, top: 342, width: 120, textAlign: 'right', fontSize: 16, fontWeight: 700, color: m > 0.5 ? C.good : C.soft }}>{ms} ms</div>
      <Tag x={T0} y={342} color={C.muted} size={14}>schematic trace</Tag>
      <div style={{ position: 'absolute', left: 60, top: 196, display: 'flex', gap: 14, fontSize: 14, color: C.soft }}>
        {OPS.map((o) => <span key={o.n}><span style={{ display: 'inline-block', width: 12, height: 12, background: o.col, borderRadius: 3, marginRight: 5 }} />{o.n}</span>)}
      </div>
      <Pill x={T0 + totalAfter + 40} y={226} color={C.good} opacity={ramp(f, 138, 150)}>5 kernels → 1</Pill>
      <Pill x={T0 + totalAfter + 40} y={286} color={C.good} opacity={ramp(f, 144, 156)}>10 memory trips → 2</Pill>

      {/* layout inset */}
      <div style={{ position: 'absolute', left: 60, top: 392, width: 1160, height: 200, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, opacity: 0.4 + 0.6 * lay }} />
      <Tag x={80} y={404} color={C.soft} size={17}>Memory layout: reading the channels of one pixel</Tag>
      <Tag x={80} y={452} color={C.bad} size={16}>NCHW</Tag>
      <div style={{ position: 'absolute', left: 200, top: 446, display: 'flex', gap: 4 }}>{cells('nchw')}</div>
      <Tag x={790} y={452} color={C.bad} size={16}>3 strided reads</Tag>
      <Tag x={80} y={512} color={C.good} size={16}>channels-last</Tag>
      <div style={{ position: 'absolute', left: 200, top: 506, display: 'flex', gap: 4 }}>{cells('nhwc')}</div>
      <Tag x={790} y={512} color={C.good} size={16}>1 contiguous read</Tag>
      <Tag x={80} y={556} color={C.muted} size={14}>colors = channels; highlighted = the values one pixel needs</Tag>

      <LatencyBar x={60} y={640} w={820} label="End-to-end at 2K (33 frames)" before={1133} after={693} start={200} color={C.accent} scale={1180} />
      <div style={{ position: 'absolute', left: 930, top: 612, textAlign: 'right', width: 290, opacity: ramp(f, 220, 240) }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: C.accent, lineHeight: 1 }}>47.6</div>
        <div style={{ fontSize: 18, color: C.soft }}>FPS at 2K, one H200</div>
      </div>
    </Scene>
  );
};
