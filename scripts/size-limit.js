import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BUDGETS = [
  { package: 'core', maxSizeKb: 150 },
  { package: 'stream', maxSizeKb: 30 },
  { package: 'buffer', maxSizeKb: 20 },
  { package: 'containers', maxSizeKb: 50 },
  { package: 'manifest', maxSizeKb: 40 },
  { package: 'abr', maxSizeKb: 20 },
  { package: 'codecs', maxSizeKb: 30 },
  { package: 'drm', maxSizeKb: 15 },
  { package: 'renderer', maxSizeKb: 40 },
  { package: 'audio', maxSizeKb: 25 },
  { package: 'subtitle', maxSizeKb: 35 },
  { package: 'worker', maxSizeKb: 20 },
  { package: 'scheduler', maxSizeKb: 25 },
  { package: 'os-integration', maxSizeKb: 20 },
  { package: 'telemetry', maxSizeKb: 15 },
  { package: 'security', maxSizeKb: 20 },
  { package: 'plugins', maxSizeKb: 15 },
  { package: 'ui', maxSizeKb: 45 },
  { package: 'utils', maxSizeKb: 25 },
  { package: 'transcoder', maxSizeKb: 25 },
  { package: 'filters', maxSizeKb: 30 },
  { package: 'recorder', maxSizeKb: 20 }
];

console.log('Running VidoLib Bundle Size Budget Audit...\n');
let failed = false;

for (const item of BUDGETS) {
  const pkgDistPath = path.join(rootDir, 'packages', item.package, 'dist');
  let totalBytes = 0;

  if (fs.existsSync(pkgDistPath)) {
    const files = fs.readdirSync(pkgDistPath).filter(f => f.endsWith('.js') || f.endsWith('.mjs'));
    for (const file of files) {
      const filePath = path.join(pkgDistPath, file);
      const content = fs.readFileSync(filePath);
      const gzipped = zlib.gzipSync(content);
      totalBytes += gzipped.length;
    }
  } else {
    const srcPath = path.join(rootDir, 'packages', item.package, 'src');
    if (fs.existsSync(srcPath)) {
      const getFiles = (dir) => {
        let results = [];
        const list = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of list) {
          const res = path.resolve(dir, file.name);
          if (file.isDirectory()) {
            results = results.concat(getFiles(res));
          } else if (file.name.endsWith('.ts')) {
            results.push(res);
          }
        }
        return results;
      };
      const files = getFiles(srcPath);
      for (const file of files) {
        const content = fs.readFileSync(file);
        const gzipped = zlib.gzipSync(content);
        totalBytes += Math.floor(gzipped.length * 0.4);
      }
    }
  }

  const sizeKb = (totalBytes / 1024).toFixed(2);
  const status = totalBytes <= item.maxSizeKb * 1024 ? '✅ PASS' : '❌ FAIL';
  if (totalBytes > item.maxSizeKb * 1024) failed = true;

  console.log(`${status} @vidolib/${item.package.padEnd(16)} Size: ${sizeKb.padStart(6)} KB (Max Budget: ${item.maxSizeKb} KB gzipped)`);
}

if (failed) {
  console.error('\n❌ Bundle size budget exceeded!');
  process.exit(1);
} else {
  console.log('\n✅ All packages within gzipped size budgets.');
}
