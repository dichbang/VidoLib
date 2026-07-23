# 🎥 Native Browser FFmpeg Equivalent Capabilities in VidoLib

This document maps classic **FFmpeg CLI commands** to their **100% native, zero-WASM browser TypeScript implementations** inside `VidoLib`.

---

## 1. Hardware Video & Audio Encoding / Transcoding

### FFmpeg CLI:
```bash
ffmpeg -i input.mp4 -c:v libx264 -b:v 2M output.mp4
```

### VidoLib Native Implementation (`@vidolib/transcoder`):
```typescript
import { HardwareVideoEncoder } from '@vidolib/transcoder';

const encoder = new HardwareVideoEncoder();
await encoder.init({
  codec: 'avc1.4d401f', // H.264 High Profile
  width: 1920,
  height: 1080,
  bitrate: 2_000_000,
  frameRate: 30
}, (videoPacket) => {
  // Transcoded packet ready for streaming or packaging
});

// Pass raw VideoFrame directly from Canvas / WebCodecs / Camera
encoder.encodeFrame(videoFrame, true);
```

---

## 2. Video Processing Filters (Chroma Key, Brightness, Blur, Watermark)

### FFmpeg CLI:
```bash
ffmpeg -i input.mp4 -vf "eq=brightness=0.1:contrast=1.2,boxblur=2,drawtext=text='VidoLib':x=10:y=10" output.mp4
```

### VidoLib Native Implementation (`@vidolib/filters`):
```typescript
import { VideoFilterProcessor } from '@vidolib/filters';

const canvas = document.createElement('canvas');
const processor = new VideoFilterProcessor(canvas);

// Apply real-time hardware-accelerated video filters
processor.applyFilters(videoFrame, {
  brightness: 1.1,
  contrast: 1.2,
  blurPx: 2,
  chromaKeyGreen: true // Green screen removal
});

// Add custom watermark overlay
processor.addWatermark('VidoLib 2026', 'bottom-right');
```

---

## 3. Media Stream & Canvas Recording

### FFmpeg CLI:
```bash
ffmpeg -f gdigrab -i desktop -c:v libx264 output.mkv
```

### VidoLib Native Implementation (`@vidolib/recorder`):
```typescript
import { MediaRecorderPipeline } from '@vidolib/recorder';

const stream = canvas.captureStream(60);
const recorder = new MediaRecorderPipeline(stream, { videoBitsPerSecond: 5_000_000 });

recorder.start();
// Stop recording after 10 seconds and download
setTimeout(async () => {
  const blob = await recorder.stop();
  recorder.download('my-canvas-recording.webm', blob);
}, 10000);
```

---

## 4. Multi-Container Demuxing (10 Formats)

### FFmpeg CLI:
```bash
ffmpeg -i input.mkv -c copy output.mp4
```

### VidoLib Native Implementation (`@vidolib/containers`):
```typescript
import { ContainerRegistry } from '@vidolib/containers';

const registry = new ContainerRegistry();
// Probes MP4, MKV, WebM, AVI, MOV, FLV, TS, PS, OGG, ASF
const demuxResult = registry.autoDemux(u8ArrayBuffer);
console.log('Demuxed Video Packets:', demuxResult.videoPackets.length);
```
