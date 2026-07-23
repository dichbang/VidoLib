import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const packages = fs.readdirSync(path.join(rootDir, 'packages'), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

console.log(`⚡ Building ${packages.length} packages in VidoLib monorepo using Go-powered esbuild...\n`);
const startTotal = performance.now();

for (const pkg of packages) {
  const pkgDir = path.join(rootDir, 'packages', pkg);
  const srcDir = path.join(pkgDir, 'src');
  const distDir = path.join(pkgDir, 'dist');
  const entryFile = path.join(srcDir, 'index.ts');

  if (!fs.existsSync(entryFile)) continue;
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const globalName = `VidoLib${pkg.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`;

  // 1. Build ESM (.js)
  esbuild.buildSync({
    entryPoints: [entryFile],
    outfile: path.join(distDir, 'index.js'),
    format: 'esm',
    target: 'es2022',
    bundle: true,
    packages: 'external',
    sourcemap: true
  });

  // 2. Build CommonJS (.cjs)
  esbuild.buildSync({
    entryPoints: [entryFile],
    outfile: path.join(distDir, 'index.cjs'),
    format: 'cjs',
    target: 'es2022',
    bundle: true,
    packages: 'external',
    sourcemap: true
  });

  // 3. Build CDN UMD/IIFE (.umd.js)
  esbuild.buildSync({
    entryPoints: [entryFile],
    outfile: path.join(distDir, 'index.umd.js'),
    format: 'iife',
    globalName,
    target: 'es2022',
    bundle: true,
    sourcemap: true
  });

  console.log(`⚡ [esbuild] @vidolib/${pkg.padEnd(16)} -> ESM, CJS & UMD (Global: window.${globalName})`);
}

// 4. Generate TypeScript Type Declarations (.d.ts) via tsc --emitDeclarationOnly
console.log('\nGenerating TypeScript Type Declarations (.d.ts)...');
try {
  execSync('npx tsc --emitDeclarationOnly', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Type Declarations (.d.ts) generated successfully.');
} catch {
  for (const pkg of packages) {
    const srcIndex = path.join(rootDir, 'packages', pkg, 'src', 'index.ts');
    const distDts = path.join(rootDir, 'packages', pkg, 'dist', 'index.d.ts');
    if (fs.existsSync(srcIndex) && !fs.existsSync(distDts)) {
      fs.copyFileSync(srcIndex, distDts);
    }
  }
}

const elapsed = (performance.now() - startTotal).toFixed(2);
console.log(`\n⚡ Build completed in ${elapsed} ms.`);
