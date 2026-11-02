// Render test stills: node stills.mjs outdir id:frame ...
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
const [out, ...specs] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
for (const s of specs) {
  const [id, frame] = s.split(':');
  const composition = await selectComposition({ serveUrl, id });
  await renderStill({ composition, serveUrl, frame: +frame, output: path.join(out, `st_${id}_${frame}.png`) });
}
