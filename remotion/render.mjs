// Render every composition at 2x (2560x1440) to ../static/videos/anim_<id>.mp4 (usage: node render.mjs [id ...]).
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const ids = process.argv.slice(2).length ? process.argv.slice(2)
  : ['mod-encoder', 'mod-dit', 'mod-stream', 'mod-decoder', 'mod-kernel', 'speed-race'];
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
for (const id of ids) {
  const composition = await selectComposition({ serveUrl, id });
  const outputLocation = path.resolve('..', 'static', 'videos', `anim_${id}.mp4`);
  await renderMedia({ composition, serveUrl, codec: 'h264', crf: 10, x264Preset: 'slow', imageFormat: 'png', scale: 2, outputLocation, concurrency: 6 });
  console.log('rendered', id, '->', outputLocation);
}
