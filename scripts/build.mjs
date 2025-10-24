#!/usr/bin/env node
/**
 * Build Script (esbuild)
 * Purpose:
 * - Bundle React + TSX entry (src/main.tsx) to dist/main.js
 * - Copy public assets and rewrite index.html script to built output
 * - Support production flag via --production
 */

import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const isProd = args.includes('--production');
const outdir = resolve('dist');

/**
 * Run esbuild with sane defaults for React 18 app
 */
await build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outdir,
  entryNames: 'main',
  sourcemap: !isProd,
  minify: isProd,
  target: ['es2020'],
  format: 'esm',
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
  },
});

/**
 * Ensure output directory exists and copy public files
 */
if (!existsSync(outdir)) {
  mkdirSync(outdir, { recursive: true });
}
cpSync('public', outdir, { recursive: true });

/**
 * Rewrite index.html to load the built bundle instead of /src/main.tsx
 */
const indexPath = resolve(outdir, 'index.html');
try {
  const html = readFileSync(indexPath, 'utf8');
  const updated = html.replace('/src/main.tsx', './main.js');
  writeFileSync(indexPath, updated);
} catch {
  // If public/index.html is missing, skip silently
}

console.log(`Build complete (${isProd ? 'production' : 'development'}) -> ${outdir}`);
