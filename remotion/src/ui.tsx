import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { C, FONT } from './theme';

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// 0 -> 1 between two frames, eased
export const ramp = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.bezier(0.33, 0, 0.2, 1) });

export const Scene: React.FC<{ step: string; title: string; sub: string; children: React.ReactNode }> = ({ step, title, sub, children }) => {
  const f = useCurrentFrame();
  const o = ramp(f, 0, 12);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 700px at 70% 0%, #111a2e 0%, ${C.bg} 60%)`, fontFamily: FONT, color: C.text }}>
      <div style={{ position: 'absolute', left: 56, top: 40, opacity: o, transform: `translateY(${(1 - o) * 10}px)` }}>
        <div style={{ fontSize: 18, letterSpacing: 3, color: C.accent, fontWeight: 700, textTransform: 'uppercase' }}>{step}</div>
        <div style={{ fontSize: 40, fontWeight: 700, marginTop: 6 }}>{title}</div>
        <div style={{ fontSize: 21, color: C.muted, marginTop: 6, maxWidth: 1080 }}>{sub}</div>
      </div>
      {children}
    </AbsoluteFill>
  );
};

export const Box: React.FC<{
  x: number; y: number; w: number; h: number; color?: string; fill?: string; label?: React.ReactNode;
  opacity?: number; radius?: number; fontSize?: number; style?: React.CSSProperties;
}> = ({ x, y, w, h, color = C.border, fill = C.panel, label, opacity = 1, radius = 12, fontSize = 20, style }) => (
  <div style={{
    position: 'absolute', left: x, top: y, width: w, height: h, border: `2px solid ${color}`, background: fill,
    borderRadius: radius, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    fontSize, fontWeight: 600, opacity, lineHeight: 1.2, ...style,
  }}>{label}</div>
);

// straight arrow drawn progressively (p in 0..1)
export const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; p?: number; color?: string; dashed?: boolean; width?: number }> = ({ x1, y1, x2, y2, p = 1, color = '#c9d2e3', dashed, width = 3 }) => {
  const xe = x1 + (x2 - x1) * p, ye = y1 + (y2 - y1) * p;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const h = 11;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
      <line x1={x1} y1={y1} x2={xe} y2={ye} stroke={color} strokeWidth={width} strokeDasharray={dashed ? '8 7' : undefined} opacity={p > 0 ? 1 : 0} />
      {p > 0.98 && (
        <polygon
          points={`${x2},${y2} ${x2 - h * Math.cos(ang - 0.45)},${y2 - h * Math.sin(ang - 0.45)} ${x2 - h * Math.cos(ang + 0.45)},${y2 - h * Math.sin(ang + 0.45)}`}
          fill={color}
        />
      )}
    </svg>
  );
};

// before -> after latency bar
export const LatencyBar: React.FC<{ x: number; y: number; w: number; label: string; before: number; after: number; unit?: string; start: number; color: string; scale: number }> = ({ x, y, w, label, before, after, unit = 'ms', start, color, scale }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - start, fps, config: { damping: 200 }, durationInFrames: 40 });
  const v = before + (after - before) * s;
  const speed = before / after;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, color: C.soft, marginBottom: 8 }}>
        <span>{label}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          <b style={{ color: C.text }}>{Math.round(v)} {unit}</b>
          <span style={{ color: C.good, marginLeft: 12, opacity: s }}>{speed.toFixed(2)}&times; faster</span>
        </span>
      </div>
      <div style={{ height: 22, background: 'rgba(255,255,255,0.07)', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(before / scale) * 100}%`, background: 'rgba(255,255,255,0.12)', borderRadius: 6 }} />
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(v / scale) * 100}%`, background: color, borderRadius: 6, boxShadow: `0 0 16px ${color}66` }} />
      </div>
    </div>
  );
};

export const Tag: React.FC<{ x: number; y: number; children: React.ReactNode; color?: string; opacity?: number; size?: number }> = ({ x, y, children, color = C.muted, opacity = 1, size = 18 }) => (
  <div style={{ position: 'absolute', left: x, top: y, color, fontSize: size, opacity, whiteSpace: 'nowrap' }}>{children}</div>
);
