import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ROYALTY_FREE_ALLOWLIST = new Set([
  'av1', 'vp8', 'vp9', 'opus', 'flac', 'vorbis', 'theora', 'pcm', 'pcm-u8', 'pcm-s16le', 'pcm-f32le'
]);

const PROHIBITED_WASM_CODECS = ['h264', 'avc', 'hevc', 'h265', 'ac3', 'eac3', 'dts'];

function scanDirectory(dirPath) {
  let errors = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        errors = errors.concat(scanDirectory(fullPath));
      }
    } else if (entry.isFile()) {
      const lowerName = entry.name.toLowerCase();

      // Check WASM files
      if (lowerName.endsWith('.wasm')) {
        let isAllowed = false;
        for (const allowed of ROYALTY_FREE_ALLOWLIST) {
          if (lowerName.includes(allowed)) {
            isAllowed = true;
            break;
          }
        }
        if (!isAllowed) {
          errors.push(`[LICENSING FAILURE] Disallowed WASM binary found: ${fullPath}. Only royalty-free decoders (${[...ROYALTY_FREE_ALLOWLIST].join(', ')}) are permitted as WASM.`);
        }
      }

      // Check JS/TS files in packages/codecs/software for prohibited patent pool software implementations
      if ((lowerName.endsWith('.ts') || lowerName.endsWith('.js')) && fullPath.includes('packages/codecs/src/software')) {
        const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
        for (const prohibited of PROHIBITED_WASM_CODECS) {
          if (content.includes(`software_${prohibited}_decoder`) || content.includes(`wasm_${prohibited}`)) {
            errors.push(`[LICENSING FAILURE] Software/WASM decoder logic for patented codec '${prohibited}' detected in ${fullPath}. Software decoding of patented codecs is strictly forbidden by policy.`);
          }
        }
      }
    }
  }

  return errors;
}

const packagesDir = path.join(rootDir, 'packages');
console.log('Running media-runtime Codec Licensing Audit...');
const errors = scanDirectory(packagesDir);

if (errors.length > 0) {
  console.error('\n=== LICENSING CHECK FAILED ===');
  errors.forEach(err => console.error(err));
  process.exit(1);
} else {
  console.log('✅ Licensing Audit Passed: All decoders comply with LICENSING.md royalty-free & hardware-first policy.');
}
