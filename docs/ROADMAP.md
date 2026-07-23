# 🗺️ `@media-runtime` Open Contributor Roadmap

We welcome open-source contributions from developers worldwide! Below is a list of high-priority tasks and feature ideas categorized by difficulty and domain. Pick any task that interests you, open an issue/PR, and let's build the future of native browser media together!

---

## 🟢 Good First Issues (Beginner Friendly)

- [ ] **Custom Container Demuxers**:
  - Add demuxer support for `.wav` (RIFF WAVE header parser).
  - Add demuxer support for `.aac` (ADTS frame header parser).
  - Add demuxer support for `.mp3` (ID3v2 tag stripper & MP3 frame header parser).
- [ ] **UI Controls & Skins**:
  - Add a Playback Speed Selector dropdown component (`0.5x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`).
  - Add Quality / Rendition Selector popup menu component.
  - Create an alternative sleek "Light Glassmorphism" UI theme CSS.
- [ ] **Stream Adapters**:
  - Implement a `FetchStreamSource` with custom retry/exponential backoff strategy.
  - Implement a `LocalFileStreamSource` with Drag-and-Drop file picker support.

---

## 🟡 Core & Parser Features (Intermediate)

- [ ] **Manifest & Adaptive Streaming**:
  - Add support for HLS `#EXT-X-KEY` AES-128 segment decryption in `@media-runtime/manifest`.
  - Enhance DASH `.mpd` parser to support SegmentTimeline with `$Time$` and `$Number$` variable replacements.
  - Add Low-Latency HLS (LL-HLS) partial segment (`#EXT-X-PART`) prefetching.
- [ ] **Subtitle Engine (`@media-runtime/subtitle`)**:
  - Implement WebVTT Cue settings parsing (`align`, `line`, `position`, `size`).
  - Add WebGL text outline shader for crisp SSA/ASS karaoke rendering at 4K resolution.
  - Add TTML / DFXP XML subtitle parser adapter.
- [ ] **OS & Hardware Integration (`@media-runtime/os-integration`)**:
  - Implement AirPlay target detection and presentation controller.
  - Implement Chrome / Edge Remote Playback API adapter.

---

## 🔴 Advanced Engine & Security Tasks (Advanced)

- [ ] **WebGPU Video Renderer (`@media-runtime/renderer`)**:
  - Complete the WebGPU fragment shader pipeline using `importExternalTexture(videoFrame)` for zero-copy 1080p/4K rendering.
- [ ] **WebWorker Pipeline & OffscreenCanvas**:
  - Implement `OffscreenCanvas` transfer in `@media-runtime/worker` so video rendering happens 100% off the main thread.
- [ ] **Fuzzing & Security Targets (`@media-runtime/security`)**:
  - Expand `FuzzTarget` coverage for Matroska EBML variable-size integer parsers.
  - Add automated CI fuzzing report generator.

---

## 🤝 How to Claim a Roadmap Task

1. Check open GitHub issues or create an issue titled `[Claim Task]: <Task Name>`.
2. Follow the setup instructions in [`CONTRIBUTING.md`](../CONTRIBUTING.md).
3. Submit your PR and tag `@media-runtime/maintainers` for review!
