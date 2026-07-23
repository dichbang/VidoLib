# 🎬 `@media-runtime`

<div align="center">

### **The Native, Zero-Dependency Browser Media Engine**
*High-performance hardware-accelerated playback for HLS, DASH, MP4, WebM, MKV, FLV, TS & Subtitles — without 30MB FFmpeg WASM bloat.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSING.md)
[![Bundle Size](https://img.shields.io/badge/Core_Size-3.4KB_gzipped-brightgreen.svg)](#package-ecosystem)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

[Quick Start](#-quick-start) • [Why No FFmpeg?](#-why-no-ffmpeg-wasm) • [Architecture](#-architecture) • [Package Ecosystem](#-package-ecosystem) • [Contributing](#-contributing) • [Roadmap](./docs/ROADMAP.md)

</div>

---

## ✨ Why `media-runtime`?

Traditional web media players fall into two traps:
1. **Monolithic & Heavy**: Bundling giant 15MB–40MB FFmpeg WASM binaries that drain mobile battery, stall startup by 3+ seconds, and consume hundreds of megabytes of RAM.
2. **Standard Player Lock-in**: Hardcoding layout, network logic, and UI into rigid single-package players that are difficult to customize or extend.

`media-runtime` takes a **runtime-first, modular approach**:
- 🚀 **Zero-Copy & Hardware-Accelerated**: Direct integration with browser `WebCodecs API`, `WebAudio/AudioWorklet`, and `WebGL/WebGPU` hardware decoding paths.
- ⚡ **Lightweight Core**: `@media-runtime/core` weighs **only 3.4 KB gzipped** with zero bundled decoders.
- 🧩 **100% Plugin-Based**: Every container parser, ABR algorithm, subtitle renderer, and UI component is an independent plugin.
- 🛡️ **Patent Safe**: Hardware decoding for patented codecs (H.264, HEVC, AC-3) eliminates patent pool liabilities for web applications.

---

## 🚀 Quick Start

### 1. Installation

Install only the packages your application needs:

```bash
npm install @media-runtime/core @media-runtime/containers @media-runtime/ui
```

### 2. Basic Player Setup

```typescript
import { Player } from '@media-runtime/core';
import { MP4Demuxer } from '@media-runtime/containers';
import { PlayerUI } from '@media-runtime/ui';

// Initialize core runtime
const player = new Player();

// Bind WCAG 2.1 AA accessible UI controls
const container = document.getElementById('player-root');
const ui = new PlayerUI(player, container);

// Load and play media
await player.load('https://example.com/video.mp4');
player.play();
```

---

## ⚡ Why No FFmpeg WASM?

> *Read our full breakdown: [NO_FFMPEG_MANIFESTO.md](./docs/NO_FFMPEG_MANIFESTO.md)*

| Metric | Native `media-runtime` | FFmpeg WASM Players |
|---|---|---|
| **Engine Download Size** | **3.4 KB – 30 KB** | 15 MB – 40 MB |
| **Startup Latency** | **< 110 ms** | 1,500 ms – 4,000 ms |
| **Battery Impact** | **Minimal (OS Hardware Decoders)** | Heavy (CPU-bound WASM threads) |
| **Memory Footprint** | **< 18 MB RAM** | 150 MB – 400 MB RAM |
| **Mobile Web Compatibility** | **100% Native OS Support** | Often crashes iOS Safari OOM |

By leaning into native browser capabilities (`VideoDecoder`, `AudioDecoder`, `MediaSource`, `WebGPU`, `AudioWorklet`), `media-runtime` achieves near-native performance while keeping bundle sizes micro-scale.

---

## 📦 Package Ecosystem

Every package is independently versioned, typed, and available via npm or CDN `<script>` tags:

| Package | Purpose | Size (gzipped) | CDN Bundle |
|---|---|---|---|
| [`@media-runtime/core`](./packages/core) | Player, Clock, Pipeline, EventBus | **3.47 KB** | `MediaRuntimeCore` |
| [`@media-runtime/stream`](./packages/stream) | Range HTTP, Blob, File, WS, WebRTC, S3, IPFS | **2.86 KB** | `MediaRuntimeStream` |
| [`@media-runtime/containers`](./packages/containers) | MP4, MKV, WebM, AVI, MOV, FLV, TS, PS, OGG, ASF | **5.15 KB** | `MediaRuntimeContainers` |
| [`@media-runtime/manifest`](./packages/manifest) | HLS (`.m3u8`) & DASH (`.mpd`) parsers | **3.07 KB** | `MediaRuntimeManifest` |
| [`@media-runtime/abr`](./packages/abr) | EWMA throughput & buffer-based ABR | **1.76 KB** | `MediaRuntimeAbr` |
| [`@media-runtime/codecs`](./packages/codecs) | WebCodecs / Native / Royalty-free WASM negotiator | **3.02 KB** | `MediaRuntimeCodecs` |
| [`@media-runtime/renderer`](./packages/renderer) | Canvas2D, WebGL, WebGPU backends | **1.85 KB** | `MediaRuntimeRenderer` |
| [`@media-runtime/subtitle`](./packages/subtitle) | ASS, SSA, SRT, VTT, PGS GPU engine | **2.54 KB** | `MediaRuntimeSubtitle` |
| [`@media-runtime/ui`](./packages/ui) | WCAG 2.1 AA accessible glassmorphic UI controls | **3.53 KB** | `MediaRuntimeUi` |
| [`@media-runtime/telemetry`](./packages/telemetry) | Zero-tracking QoE metrics event surface | **1.76 KB** | `MediaRuntimeTelemetry` |
| [`@media-runtime/os-integration`](./packages/os-integration) | Media Session API, PiP, Fullscreen, Cast | **1.88 KB** | `MediaRuntimeOsIntegration` |

---

## 🌐 CDN Usage (No Build Step Required)

Use `@media-runtime` directly in plain HTML:

```html
<div id="player-container" style="width: 800px; height: 450px;"></div>

<script src="https://cdn.jsdelivr.net/npm/@media-runtime/core/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@media-runtime/ui/dist/index.umd.js"></script>
<script>
  const player = new MediaRuntimeCore.Player();
  const ui = new MediaRuntimeUi.PlayerUI(player, document.getElementById('player-container'));
</script>
```

---

## 🛠️ Contributing & Developer Guide

We welcome contributions from developers of all skill levels! Whether you want to add a new container demuxer, write a custom ABR algorithm, design a sleek UI skin, or improve test coverage:

- 📖 **[Contributor Guide (`CONTRIBUTING.md`)](./CONTRIBUTING.md)**: Setup, build system, and PR guidelines.
- 🏗️ **[Architecture Deep-Dive (`docs/ARCHITECTURE.md`)](./docs/ARCHITECTURE.md)**: Core engine flow, Web Worker pipelines, and memory model.
- 🔌 **[Plugin Authoring Guide (`docs/PLUGINS.md`)](./docs/PLUGINS.md)**: Build custom plugins in < 30 lines of code.
- 🗺️ **[Open Contributor Roadmap (`docs/ROADMAP.md`)](./docs/ROADMAP.md)**: Pick up an open feature task!

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/media-runtime/media-runtime.git
cd media-runtime

# Install dependencies
npm install

# Build all packages in <1s (Go-powered esbuild)
npm run build

# Run unit tests
node scripts/test-runner.js

# Run licensing & size audits
npm run check-licensing
npm run size-limit
```

---

## 📄 License & Codec Policy

Distributed under the **MIT License**. See [`LICENSING.md`](./LICENSING.md) for full codec licensing guardrails and royalty-free allow-list details.
