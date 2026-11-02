// Visual building blocks for the module animations: 3D frame stacks (videos), isometric tensors
// (latents / feature maps), glass cards (modules) and animated flows between them.
import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { C } from './theme';

export const lr = (i: number) => staticFile(`frames/lr_${i % 8}.jpg`);
export const sr = (i: number) => staticFile(`frames/sr_${i % 8}.jpg`);

// A short video clip drawn as a perspective stack of real frames; frames fly in one by one with `appear`.
export const FrameStack: React.FC<{
  x: number; y: number; w: number; src: (i: number) => string; n?: number; gap?: number; appear?: number;
  blur?: number; rot?: number; label?: React.ReactNode; color?: string; glow?: string; opacity?: number; offset?: number;
}> = ({ x, y, w, src, n = 5, gap = 16, appear = 1, blur = 0, rot = -32, label, color = 'rgba(255,255,255,0.35)', glow, opacity = 1, offset = 0 }) => {
  const h = (w * 704) / 1280;
  const items = [];
  for (let i = n - 1; i >= 0; i--) {
    const a = Math.min(1, Math.max(0, appear * n - (n - 1 - i)));
    items.push(
      <Img key={i} src={src(i + offset)} style={{
        position: 'absolute', left: 0, top: 0, width: w, height: h, objectFit: 'cover', borderRadius: 6,
        border: `1.5px solid ${color}`, opacity: a * (1 - i * 0.11),
        transform: `translateZ(${-i * gap - (1 - a) * 90}px)`,
        filter: blur ? `blur(${blur}px) brightness(${1 - i * 0.06})` : `brightness(${1 - i * 0.06})`,
        boxShadow: i === 0 ? `0 14px 34px rgba(0,0,0,0.55)${glow ? `, 0 0 26px ${glow}` : ''}` : '0 8px 20px rgba(0,0,0,0.4)',
      }} />,
    );
  }
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, perspective: 1100, opacity }}>
      <div style={{ position: 'relative', width: w, height: h, transformStyle: 'preserve-3d', transform: `rotateY(${rot}deg) rotateX(7deg)` }}>{items}</div>
      {label && <div style={{ position: 'absolute', top: h + 14, left: -20, right: -20, textAlign: 'center', fontSize: 17, color: C.soft, opacity: Math.min(1, appear * 1.5) }}>{label}</div>}
    </div>
  );
};

// Oblique 3D box with a grid on the front face; (x, y) is the top-left of its bounding box.
export const Tensor: React.FC<{
  x: number; y: number; w: number; h: number; d: number; color: string; appear?: number; grid?: [number, number];
  label?: React.ReactNode; labelColor?: string; glow?: boolean; opacity?: number;
}> = ({ x, y, w, h, d, color, appear = 1, grid = [4, 3], label, labelColor = C.soft, glow = true, opacity = 1 }) => {
  const dx = d * 0.72, dy = d * 0.48;
  const lines = [];
  for (let i = 1; i < grid[0]; i++) lines.push(<line key={`v${i}`} x1={(w * i) / grid[0]} y1={dy} x2={(w * i) / grid[0]} y2={dy + h} />);
  for (let j = 1; j < grid[1]; j++) lines.push(<line key={`h${j}`} x1={0} y1={dy + (h * j) / grid[1]} x2={w} y2={dy + (h * j) / grid[1]} />);
  for (let i = 1; i < grid[0]; i++) lines.push(<line key={`t${i}`} x1={(w * i) / grid[0]} y1={dy} x2={(w * i) / grid[0] + dx} y2={0} />);
  const s = 0.7 + 0.3 * appear;
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: appear * opacity, transform: `scale(${s})`, transformOrigin: 'center' }}>
      <svg width={w + dx + 2} height={h + dy + 2} style={{ overflow: 'visible', filter: glow ? `drop-shadow(0 0 12px ${color}66)` : undefined }}>
        <polygon points={`0,${dy} ${dx},0 ${dx + w},0 ${w},${dy}`} fill={color} fillOpacity={0.62} stroke={color} strokeWidth={1.2} />
        <polygon points={`${w},${dy} ${w + dx},0 ${w + dx},${h} ${w},${h + dy}`} fill={color} fillOpacity={0.28} stroke={color} strokeWidth={1.2} />
        <rect x={0} y={dy} width={w} height={h} fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1.4} />
        <g stroke="#ffffff" strokeOpacity={0.22} strokeWidth={1}>{lines}</g>
      </svg>
      {label && <div style={{ position: 'absolute', top: h + dy + 10, left: -40, width: w + dx + 80, textAlign: 'center', fontSize: 16, color: labelColor }}>{label}</div>}
    </div>
  );
};

// Glass card for a network module.
export const Card: React.FC<{
  x: number; y: number; w: number; h: number; color: string; title: React.ReactNode; sub?: React.ReactNode;
  appear?: number; opacity?: number; active?: number; fontSize?: number;
}> = ({ x, y, w, h, color, title, sub, appear = 1, opacity = 1, active = 0, fontSize = 20 }) => (
  <div style={{
    position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 16, opacity: appear * opacity,
    transform: `translateY(${(1 - appear) * 14}px)`,
    background: `linear-gradient(145deg, ${color}38 0%, ${color}10 55%, rgba(255,255,255,0.02) 100%)`,
    border: `1.5px solid ${color}aa`,
    boxShadow: `0 0 ${18 + 30 * active}px ${color}${active > 0.05 ? '88' : '33'}, inset 0 1px 0 rgba(255,255,255,0.12)`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
  }}>
    <div style={{ fontSize, fontWeight: 700, lineHeight: 1.15 }}>{title}</div>
    {sub && <div style={{ fontSize: 15, color: C.soft, marginTop: 6, lineHeight: 1.25 }}>{sub}</div>}
  </div>
);

// Horizontal data-flow connector: drawn progressively (p), then particles stream along it.
export const Flow: React.FC<{ x1: number; y1: number; x2: number; y2: number; p?: number; color?: string; flow?: number; dots?: number }> = ({ x1, y1, x2, y2, p = 1, color = C.accent, flow = 1, dots = 3 }) => {
  const f = useCurrentFrame();
  const mx = (x1 + x2) / 2;
  const pt = (t: number) => {
    const u = 1 - t;
    return [u * u * u * x1 + 3 * u * u * t * mx + 3 * u * t * t * mx + t * t * t * x2, u * u * u * y1 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y2];
  };
  const pts = [];
  for (let i = 0; i <= 24; i++) pts.push(pt((i / 24) * p).join(','));
  const [hx, hy] = pt(p);
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeOpacity={0.45} strokeWidth={2.5} strokeLinecap="round" />
      {p > 0 && p < 1 && <circle cx={hx} cy={hy} r={4} fill={color} />}
      {p >= 1 && flow > 0 && Array.from({ length: dots }, (_, k) => {
        const t = ((f / 34 + k / dots) % 1);
        const [cx, cy] = pt(t);
        return <circle key={k} cx={cx} cy={cy} r={3.6} fill={color} opacity={flow * Math.sin(Math.PI * t)} style={{ filter: `drop-shadow(0 0 5px ${color})` }} />;
      })}
      {p >= 1 && <polygon points={`${x2},${y2} ${x2 - 9},${y2 - 5} ${x2 - 9},${y2 + 5}`} fill={color} opacity={0.8} />}
    </svg>
  );
};

export const Pill: React.FC<{ x: number; y: number; color: string; children: React.ReactNode; opacity?: number; size?: number }> = ({ x, y, color, children, opacity = 1, size = 16 }) => (
  <div style={{ position: 'absolute', left: x, top: y, opacity, padding: '4px 12px', borderRadius: 999, fontSize: size, fontWeight: 700, color, background: `${color}1f`, border: `1px solid ${color}77`, whiteSpace: 'nowrap' }}>{children}</div>
);
