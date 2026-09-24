// Builds dist/index.html (+ bundle.js/bundle.css) from the CURRENT files in
// frontend/src — nothing is copied, so the page can never drift from the
// project's CSS. Also writes dist/build-info.json: a sha256 of every source
// file that went into the bundle, so a check log can say exactly which
// version of the CSS/JSX it ran against.
//
// Env: NODE_PATH must reach a `react`, `react-dom` and `esbuild` install
// (offline environment: the global npm dir + tsx's nested esbuild).
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const esbuildPath = process.env.ESBUILD_PATH || 'esbuild';
const esbuild = require(esbuildPath);
const reactRoot = process.env.REACT_NODE_MODULES; // dir that contains react/ and react-dom/

const dist = path.join(here, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const stubs = {
  name: 'natra-check-stubs',
  setup(build) {
    build.onResolve({ filter: /^react-router-dom$/ }, () => ({ path: path.join(here, 'stubs/router.jsx') }));
    // Any import that resolves to src/api/client(.js)
    build.onResolve({ filter: /(^|\/)api\/client(\.js)?$/ }, () => ({ path: path.join(here, 'stubs/apiClient.js') }));
  },
};

const result = await esbuild.build({
  entryPoints: [path.join(here, 'entry.jsx')],
  outdir: dist,
  entryNames: 'bundle',
  bundle: true,
  format: 'iife',
  minify: false,
  sourcemap: false,
  metafile: true,
  jsx: 'automatic',
  loader: { '.js': 'jsx', '.ttf': 'dataurl', '.jpg': 'dataurl', '.png': 'dataurl', '.svg': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}' },
  nodePaths: reactRoot ? [reactRoot] : [],
  plugins: [stubs],
  logLevel: 'warning',
});

writeFileSync(
  path.join(dist, 'index.html'),
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>NATRA Home — standalone check page</title>
<link rel="stylesheet" href="bundle.css" /></head>
<body><div id="root"></div><script src="bundle.js"></script></body></html>
`
);

const sources = Object.keys(result.metafile.inputs)
  .filter((p) => !p.includes('node_modules') && existsSync(path.resolve(p)))
  .sort();
const info = {
  builtAt: new Date().toISOString(),
  note: 'sha256 of every project/stub source in the bundle',
  files: Object.fromEntries(
    sources.map((p) => [p, createHash('sha256').update(readFileSync(path.resolve(p))).digest('hex').slice(0, 16)])
  ),
};
writeFileSync(path.join(dist, 'build-info.json'), JSON.stringify(info, null, 2));
console.log(`built ${sources.length} project/stub files -> ${path.relative(process.cwd(), dist)}`);
