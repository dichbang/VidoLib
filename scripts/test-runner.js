import test from 'node:test';
import assert from 'node:assert/strict';

import { BitStreamReader, RingBuffer } from '../packages/utils/dist/index.js';
import { Player } from '../packages/core/dist/index.js';
import { PluginRegistry } from '../packages/plugins/dist/index.js';
import { HTTPRangeSource } from '../packages/stream/dist/index.js';
import { BufferController } from '../packages/buffer/dist/index.js';
import { HLSParser, DASHParser } from '../packages/manifest/dist/index.js';
import { ABRController } from '../packages/abr/dist/index.js';
import { MP4Demuxer, FLVDemuxer, TSDemuxer, ContainerRegistry } from '../packages/containers/dist/index.js';
import { CodecNegotiator } from '../packages/codecs/dist/index.js';
import { SRTParser, ASSParser } from '../packages/subtitle/dist/index.js';
import { FuzzTarget } from '../packages/security/dist/index.js';

test('Utils: BitStreamReader & RingBuffer', () => {
  const data = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
  const reader = new BitStreamReader(data);
  assert.equal(reader.readUint16BE(), 0x1234);
  assert.equal(reader.readUint16BE(), 0x5678);

  const ring = new RingBuffer(16);
  assert.equal(ring.write(new Uint8Array([1, 2, 3, 4])), 4);
  const out = new Uint8Array(4);
  assert.equal(ring.read(out), 4);
  assert.deepEqual(Array.from(out), [1, 2, 3, 4]);
});

test('Core: Player state lifecycle and clock', () => {
  const player = new Player();
  assert.equal(player.getState(), 'idle');
  player.play();
  assert.equal(player.getState(), 'playing');
  player.pause();
  assert.equal(player.getState(), 'paused');
  player.seek(15.5);
  assert.equal(player.getCurrentTime(), 15.5);
});

test('Plugins: Plugin registration and event dispatching', async () => {
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
  assert.equal(eventReceived, true);
});

test('Containers: Demuxer probing & demuxing', () => {
  const registry = new ContainerRegistry();
  const mp4Data = new Uint8Array([0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70]);
  const res = registry.autoDemux(mp4Data);
  assert.ok(res.tracks.length > 0);

  const flv = new FLVDemuxer();
  assert.equal(flv.probe(new Uint8Array([0x46, 0x4C, 0x56])), true);
});

test('Manifest: HLS & DASH parsing', () => {
  const hls = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720,CODECS="avc1.4d401f"
http://example.com/stream.m3u8`;
  const playlist = HLSParser.parse(hls, 'http://example.com/master.m3u8');
  assert.equal(playlist.renditions.length, 1);
  assert.equal(playlist.renditions[0].bandwidth, 2000000);
});

test('Codecs: Capability negotiation', async () => {
  const cap = await CodecNegotiator.negotiateVideo('avc1.4d401f');
  assert.equal(cap.supported, true);
});

test('Subtitle: SRT and ASS subtitle parsers', () => {
  const srt = `1\n00:00:01,000 --> 00:00:04,000\nHello World`;
  const packets = SRTParser.parse(srt);
  assert.equal(packets.length, 1);
  assert.equal(packets[0].text, 'Hello World');
  assert.equal(packets[0].startTime, 1);
});

test('Security: Container parser fuzz target', () => {
  const demuxer = new MP4Demuxer();
  const sample = new Uint8Array([0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70]);
  const res = FuzzTarget.run(demuxer, sample, 20);
  assert.equal(res.iterations, 20);
  assert.equal(res.crashes, 0);
});
