# media-runtime Architecture Specification

## Overview & Core Principles

`media-runtime` is a zero-copy, worker-isolated, hardware-first TypeScript media engine for modern web browsers.

```
       +----------------------------------------------------------------+
       |                         Host Application                       |
       +----------------------------------------------------------------+
                                       |
    +----------------------------------------------------------------------+
    |                         @media-runtime/ui                            |
    +----------------------------------------------------------------------+
                                       |
    +----------------------------------------------------------------------+
    |                        @media-runtime/core                           |
    |  [Player] <---> [Clock] <---> [Pipeline] <---> [Plugin Registry]    |
    +----------------------------------------------------------------------+
          |                   |                  |                   |
    +-----------+     +---------------+    +------------+    +---------------+
    |  stream/  |     |  containers/  |    |  codecs/   |    |   renderer/   |
    |  buffer/  |     |  (10 demuxers)|    | (Hardware) |    | (WebGL/WebGPU)|
    +-----------+     +---------------+    +------------+    +---------------+
          |                   |                  |                   |
    +-----------+     +---------------+    +------------+    +---------------+
    | manifest/ |     |    worker/    |    |    audio/  |    |   subtitle/   |
    |   abr/    |     |  (Transfer)   |    | (Worklet)  |    | (ASS/SRT/VTT) |
    +-----------+     +---------------+    +------------+    +---------------+
```

### Key Architectural Pillars:
1. **Hardware Decode Priority Chain**:
   `WebCodecs API → Native <video>/MSE → WASM Royalty-Free Only (AV1/VP8/VP9/Opus/FLAC) → FFmpeg WASM (Opt-in Plugin)`
2. **Strict Codec Licensing Boundary**:
   Patented codecs (H.264, H.265/HEVC, AC-3, EAC-3, DTS) are restricted to hardware-decoders or native browser execution to eliminate patent pool liability.
3. **Zero-Copy & Off-Main-Thread Processing**:
   Heavy demuxing and decoding tasks execute inside dedicated Web Workers using `Transferable` ArrayBuffers and `VideoFrame` references.
4. **Security Hardened Parsers**:
   All 10 container parsers treat network inputs as hostile, enforcing upper bounds on byte allocations and undergoing fuzz testing.
