import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@vidolib/utils': path.resolve(__dirname, 'packages/utils/src/index.ts'),
      '@vidolib/plugins': path.resolve(__dirname, 'packages/plugins/src/index.ts'),
      '@vidolib/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
      '@vidolib/stream': path.resolve(__dirname, 'packages/stream/src/index.ts'),
      '@vidolib/buffer': path.resolve(__dirname, 'packages/buffer/src/index.ts'),
      '@vidolib/manifest': path.resolve(__dirname, 'packages/manifest/src/index.ts'),
      '@vidolib/abr': path.resolve(__dirname, 'packages/abr/src/index.ts'),
      '@vidolib/containers': path.resolve(__dirname, 'packages/containers/src/index.ts'),
      '@vidolib/codecs': path.resolve(__dirname, 'packages/codecs/src/index.ts'),
      '@vidolib/drm': path.resolve(__dirname, 'packages/drm/src/index.ts'),
      '@vidolib/renderer': path.resolve(__dirname, 'packages/renderer/src/index.ts'),
      '@vidolib/audio': path.resolve(__dirname, 'packages/audio/src/index.ts'),
      '@vidolib/subtitle': path.resolve(__dirname, 'packages/subtitle/src/index.ts'),
      '@vidolib/worker': path.resolve(__dirname, 'packages/worker/src/index.ts'),
      '@vidolib/scheduler': path.resolve(__dirname, 'packages/scheduler/src/index.ts'),
      '@vidolib/os-integration': path.resolve(__dirname, 'packages/os-integration/src/index.ts'),
      '@vidolib/telemetry': path.resolve(__dirname, 'packages/telemetry/src/index.ts'),
      '@vidolib/security': path.resolve(__dirname, 'packages/security/src/index.ts'),
      '@vidolib/ui': path.resolve(__dirname, 'packages/ui/src/index.ts'),
      '@vidolib/transcoder': path.resolve(__dirname, 'packages/transcoder/src/index.ts'),
      '@vidolib/filters': path.resolve(__dirname, 'packages/filters/src/index.ts'),
      '@vidolib/recorder': path.resolve(__dirname, 'packages/recorder/src/index.ts')
    }
  },
  test: {
    environment: 'happy-dom'
  }
});
