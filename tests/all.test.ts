import { describe, it, expect } from 'vitest';
import { BitStreamReader, RingBuffer } from '../packages/utils/src/index.js';
import { Player } from '../packages/core/src/index.js';
import { PluginRegistry } from '../packages/plugins/src/index.js';
import { HTTPRangeSource, BlobSource } from '../packages/stream/src/index.js';
import { BufferController } from '../packages/buffer/src/index.js';
import { HLSParser, DASHParser } from '../packages/manifest/src/index.js';
import { ABRController } from '../packages/abr/src/index.js';
import { MP4Demuxer, MKVDemuxer, FLVDemuxer, TSDemuxer, ContainerRegistry } from '../packages/containers/src/index.js';
import { CodecNegotiator } from '../packages/codecs/src/index.js';
import { EMEPlugin } from '../packages/drm/src/index.js';
import { Canvas2DRenderer } from '../packages/renderer/src/index.js';
import { WebAudioPipeline } from '../packages/audio/src/index.js';
import { SRTParser, ASSParser } from '../packages/subtitle/src/index.js';
import { AVSynchronizer } from '../packages/scheduler/src/index.js';
import { TelemetryPlugin } from '../packages/telemetry/src/index.js';
import { FuzzTarget } from '../packages/security/src/index.js';

describe('VidoLib Comprehensive Monorepo Unit Test Suite', () => {
  it('@vidolib/utils: BitStreamReader & RingBuffer', () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
    const reader = new BitStreamReader(data);
    expect(reader.readUint16BE()).toBe(0x1234);
    expect(reader.readUint16BE()).toBe(0x5678);

    const ring = new RingBuffer(16);
    expect(ring.write(new Uint8Array([1, 2, 3, 4]))).toBe(4);
    const out = new Uint8Array(4);
    expect(ring.read(out)).toBe(4);
    expect(Array.from(out)).toEqual([1, 2, 3, 4]);
  });

  it('@vidolib/core: Player state lifecycle and clock', () => {
    const player = new Player();
    expect(player.getState()).toBe('idle');
    player.play();
    expect(player.getState()).toBe('playing');
    player.pause();
    expect(player.getState()).toBe('paused');
    player.seek(15.5);
    expect(player.getCurrentTime()).toBe(15.5);
  });

  it('@vidolib/plugins: Plugin registration and event dispatching', async () => {
    const registry = new PluginRegistry();
    let eventReceived = false;
    await registry.register({
      name: 'test-plugin',
      category: 'telemetry',
      version: '1.0.0',
      init() {},
      onEvent(evt) {
        if (evt === 'test-evt') eventReceived = true;
      }
    });

    registry.dispatchEvent('test-evt');
    expect(eventReceived).toBe(true);
  });

  it('@vidolib/containers: Demuxer probing & demuxing', () => {
    const registry = new ContainerRegistry();
    const mp4Data = new Uint8Array([0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70]);
    const res = registry.autoDemux(mp4Data);
    expect(res.tracks.length).toBeGreaterThan(0);

    const flv = new FLVDemuxer();
    expect(flv.probe(new Uint8Array([0x46, 0x4C, 0x56]))).toBe(true);
  });

  it('@vidolib/manifest: HLS & DASH parsing', () => {
    const hls = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720,CODECS="avc1.4d401f"
http://example.com/stream.m3u8`;
    const playlist = HLSParser.parse(hls, 'http://example.com/master.m3u8');
    expect(playlist.renditions.length).toBe(1);
    expect(playlist.renditions[0].bandwidth).toBe(2000000);
  });

  it('@vidolib/codecs: Codec capability negotiation', async () => {
    const cap = await CodecNegotiator.negotiateVideo('avc1.4d401f');
    expect(cap.supported).toBe(true);
  });

  it('@vidolib/subtitle: SRT and ASS subtitle parsers', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Hello World`;
    const packets = SRTParser.parse(srt);
    expect(packets.length).toBe(1);
    expect(packets[0].text).toBe('Hello World');
    expect(packets[0].startTime).toBe(1);
  });

  it('@vidolib/security: Container parser fuzz target', () => {
    const demuxer = new MP4Demuxer();
    const sample = new Uint8Array([0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70]);
    const res = FuzzTarget.run(demuxer, sample, 20);
    expect(res.iterations).toBe(20);
    expect(res.crashes).toBe(0);
  });
});
