import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@media-runtime/utils': path.resolve(__dirname, 'packages/utils/src/index.ts'),
      '@media-runtime/plugins': path.resolve(__dirname, 'packages/plugins/src/index.ts'),
      '@media-runtime/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
      '@media-runtime/stream': path.resolve(__dirname, 'packages/stream/src/index.ts'),
      '@media-runtime/buffer': path.resolve(__dirname, 'packages/buffer/src/index.ts'),
      '@media-runtime/manifest': path.resolve(__dirname, 'packages/manifest/src/index.ts'),
      '@media-runtime/abr': path.resolve(__dirname, 'packages/abr/src/index.ts'),
      '@media-runtime/containers': path.resolve(__dirname, 'packages/containers/src/index.ts'),
      '@media-runtime/codecs': path.resolve(__dirname, 'packages/codecs/src/index.ts'),
      '@media-runtime/drm': path.resolve(__dirname, 'packages/drm/src/index.ts'),
      '@media-runtime/renderer': path.resolve(__dirname, 'packages/renderer/src/index.ts'),
      '@media-runtime/audio': path.resolve(__dirname, 'packages/audio/src/index.ts'),
      '@media-runtime/subtitle': path.resolve(__dirname, 'packages/subtitle/src/index.ts'),
      '@media-runtime/worker': path.resolve(__dirname, 'packages/worker/src/index.ts'),
      '@media-runtime/scheduler': path.resolve(__dirname, 'packages/scheduler/src/index.ts'),
      '@media-runtime/os-integration': path.resolve(__dirname, 'packages/os-integration/src/index.ts'),
      '@media-runtime/telemetry': path.resolve(__dirname, 'packages/telemetry/src/index.ts'),
      '@media-runtime/security': path.resolve(__dirname, 'packages/security/src/index.ts'),
      '@media-runtime/ui': path.resolve(__dirname, 'packages/ui/src/index.ts')
    }
  },
  test: {
    environment: 'happy-dom'
  }
});
