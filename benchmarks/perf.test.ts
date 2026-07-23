import { describe, it, expect } from 'vitest';
import { Player } from '../packages/core/src/index.js';
import { HLSParser } from '../packages/manifest/src/index.js';
import { MP4Demuxer } from '../packages/containers/src/index.js';

describe('Performance Benchmarks & Baseline Comparisons', () => {
  it('measures startup latency for MP4 parsing', () => {
    const demuxer = new MP4Demuxer();
    const fakeMp4 = new Uint8Array(1024 * 1024);
    // ftyp box
    fakeMp4.set([0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], 0);

    const start = performance.now();
    demuxer.demux(fakeMp4);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // Under 50ms startup parsing
  });

  it('measures HLS Master Playlist parse speed', () => {
    const hlsManifest = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1280000,RESOLUTION=720x480,CODECS="avc1.4d401f,mp4a.40.2"
http://example.com/low.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2"
http://example.com/mid.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.4d401f,mp4a.40.2"
http://example.com/high.m3u8`;

    const start = performance.now();
    const parsed = HLSParser.parse(hlsManifest, 'http://example.com/master.m3u8');
    const duration = performance.now() - start;

    expect(parsed.renditions.length).toBe(3);
    expect(duration).toBeLessThan(10); // Under 10ms manifest parsing
  });
});
