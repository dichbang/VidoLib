import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const packages = [
  'utils', 'plugins', 'core', 'stream', 'buffer', 'containers', 'manifest',
  'abr', 'codecs', 'drm', 'renderer', 'audio', 'subtitle', 'worker',
  'scheduler', 'os-integration', 'telemetry', 'security', 'ui',
  'transcoder', 'filters', 'recorder'
];

console.log('Building UMD/IIFE CDN bundles for VidoLib packages...');

for (const pkg of packages) {
  const pkgDir = path.join(rootDir, 'packages', pkg);
  const distDir = path.join(pkgDir, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const indexJs = path.join(distDir, 'index.js');
  if (fs.existsSync(indexJs)) {
    const code = fs.readFileSync(indexJs, 'utf8');
    const globalName = `VidoLib${pkg.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`;
    
    const umdContent = `(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    factory(exports);
  } else {
    factory((root.${globalName} = {}));
  }
}(typeof self !== 'undefined' ? self : this, function (exports) {
  'use strict';
  ${code}
}));
//# sourceMappingURL=index.umd.js.map`;

    fs.writeFileSync(path.join(distDir, 'index.umd.js'), umdContent, 'utf8');
    fs.writeFileSync(path.join(distDir, 'index.umd.js.map'), `{"version":3,"sources":["index.js"],"names":[],"mappings":""}`, 'utf8');
    console.log(`  Created UMD bundle: @vidolib/${pkg} -> dist/index.umd.js (Global: window.${globalName})`);
  }
}

console.log('✅ UMD CDN bundles built successfully.');
