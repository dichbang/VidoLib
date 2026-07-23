# 🤝 Contributing to `@media-runtime`

Welcome! We are excited that you want to contribute to `media-runtime`. Our goal is to build the fastest, cleanest, zero-dependency native web media runtime in TypeScript — with zero reliance on heavy FFmpeg WASM binaries.

---

## 🎯 Community Values

1. **Native Browser First**: Always prefer native browser APIs (`WebCodecs`, `WebAudio`, `WebGL`, `WebGPU`, `Streams`) over third-party C/C++ ports.
2. **Micro Bundle Sizes**: Core packages must remain micro-scale (gzipped core < 5 KB).
3. **Hardware Acceleration**: Always prioritize hardware decoding over software fallbacks.
4. **Security & Hostile Input Defense**: Treat every media input from the network as hostile. Ensure strict length bounds checking.
5. **Aesthetics & Accessibility**: User interfaces must be responsive, modern, dark glassmorphic, and WCAG 2.1 AA compliant.

---

## 🛠️ Local Development Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone & Install

```bash
git clone https://github.com/media-runtime/media-runtime.git
cd media-runtime
npm install
```

### 2. Fast Build (< 1 Second)

We use Go-powered **`esbuild`** for sub-second monorepo compilation across all 19 packages:

```bash
npm run build
```

This generates ESM (`index.js`), CommonJS (`index.cjs`), and CDN UMD/IIFE (`index.umd.js`) bundles alongside TypeScript typings (`index.d.ts`).

### 3. Run Tests & Audits

```bash
# Run unit test suite
node scripts/test-runner.js

# Run licensing policy audit
npm run check-licensing

# Run bundle size budget audit
npm run size-limit
```

---

## 📦 How to Add a New Container Demuxer

Adding a demuxer for a new media format (e.g. WAV, AAC, MP3) takes under 50 lines of code!

1. Open `packages/containers/src/index.ts`.
2. Implement the `ContainerDemuxer` interface:

```typescript
export class MyFormatDemuxer implements ContainerDemuxer {
  public readonly formatName: string = 'myformat';

  // Return true if the initial bytes match your format magic header
  public probe(data: Uint8Array): boolean {
    return data.length >= 4 && data[0] === 0x4D && data[1] === 0x59;
  }

  // Parse header and extract VideoPacket / AudioPacket / SubtitlePacket
  public demux(data: Uint8Array): DemuxResult {
    // Perform bounds checking on input
    return {
      tracks: [{ id: '1', kind: 'audio', codec: 'opus' }],
      videoPackets: [],
      audioPackets: [{ pts: 0, dts: 0, data: data, sampleRate: 48000, channels: 2 }],
      subtitlePackets: []
    };
  }
}
```

3. Register your class in `ContainerRegistry`.
4. Add a test in `scripts/test-runner.js` and submit your PR!

---

## 📋 Pull Request (PR) Checklist

Before submitting a PR, ensure:
- [ ] `npm run build` succeeds cleanly in < 1 second.
- [ ] `node scripts/test-runner.js` passes all tests (0 failures).
- [ ] `npm run check-licensing` passes (no disallowed WASM decoders for patented codecs).
- [ ] `npm run size-limit` passes (packages stay within gzipped budgets).
- [ ] Your code is cleanly typed in TypeScript strict mode with no `any` in public APIs.

Thank you for building the native web media ecosystem with us! 🚀
