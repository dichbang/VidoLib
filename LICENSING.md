# Codec Licensing & Software Decoder Guardrails Policy

## Overview & Scope
`media-runtime` is built on a strict hardware-first, zero-copy architecture. To protect downstream integrators and the media-runtime ecosystem from patent licensing claims and royalty exposure, this repository enforces explicit guardrails around software/WASM decoders and encoders.

---

## 1. Hardware-Only Codecs (Strictly Prohibited in WASM/Software)

The following codecs belong to patent licensing pools (such as MPEG-LA, Via Licensing, Velos Media, Access Advance, etc.) and MUST NEVER be compiled or distributed as WASM software decoders/encoders in `@media-runtime/*` packages:

- **H.264 / AVC** (`avc1.*`)
- **H.265 / HEVC** (`hev1.*`, `hvc1.*`)
- **AC-3 / Dolby Digital**
- **E-AC-3 / Dolby Digital Plus**
- **DTS / DTS-HD**

### Mandatory Decoder Resolution Strategy for Patented Codecs:
1. **WebCodecs API** (`VideoDecoder.isConfigSupported`, `AudioDecoder`) using underlying OS/hardware decoders.
2. **Native HTML5 `<video>` / Media Source Extensions (MSE)** hardware acceleration.
3. If hardware decoding is unsupported by the OS/browser device, `media-runtime` will cleanly reject playback with a typed capability error (`CODEC_HARDWARE_UNSUPPORTED`).

---

## 2. Royalty-Free Codec Allow-list for Software/WASM Fallbacks

Software decoders implemented in WASM or TypeScript are strictly limited to royalty-free / open codecs:

- **AV1** (`av01.*`) - AOMedia Video 1
- **VP8** (`vp8`) - WebM / Google
- **VP9** (`vp09.*`) - WebM / Google
- **Opus** (`opus`) - IETF / Xiph.Org
- **FLAC** (`flac`) - Xiph.Org
- **Vorbis** (`vorbis`) - Xiph.Org
- **Theora** (`theora`) - Xiph.Org
- **Uncompressed PCM / Wave** (`pcm-u8`, `pcm-s16le`, `pcm-f32le`)

---

## 3. Automated CI Enforcement (`check-licensing.js`)

A continuous integration lint rule (`scripts/check-licensing.js`) scans all committed files and compiled artifacts. Build pipelines will immediately fail if:
- Any software decoder implementation targeting a non-allow-listed codec is detected.
- Any WASM file is placed in `packages/codecs` without explicit inclusion in the royalty-free allow-list.

---

## 4. Optional FFmpeg Fallback Plugin

If an integrator explicitly chooses to opt into FFmpeg WASM for legacy offline software decoding in an environment they license independently, `@media-runtime/codec-ffmpeg-fallback` is isolated in a separate optional package. It emits a prominent runtime console warning detailing bundle size impact and patent licensing obligations.
