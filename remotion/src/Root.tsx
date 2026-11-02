import React from 'react';
import { Composition } from 'remotion';
import { DecoderAnim, DiTAnim, EncoderAnim, KernelAnim, StreamAnim } from './Modules';
import { SpeedRace } from './SpeedRace';

const base = { width: 1280, height: 720, fps: 30 } as const;

export const Root: React.FC = () => (
  <>
    <Composition id="mod-encoder" component={EncoderAnim} durationInFrames={240} {...base} />
    <Composition id="mod-dit" component={DiTAnim} durationInFrames={270} {...base} />
    <Composition id="mod-stream" component={StreamAnim} durationInFrames={300} {...base} />
    <Composition id="mod-decoder" component={DecoderAnim} durationInFrames={240} {...base} />
    <Composition id="mod-kernel" component={KernelAnim} durationInFrames={270} {...base} />
    <Composition id="speed-race" component={SpeedRace} durationInFrames={480} {...base} />
  </>
);
