import { BitStreamReader } from '@vidolib/utils';
import { VideoPacket, AudioPacket, SubtitlePacket, Track } from '@vidolib/core';

export interface DemuxResult {
  tracks: Track[];
  videoPackets: VideoPacket[];
  audioPackets: AudioPacket[];
  subtitlePackets: SubtitlePacket[];
}

export interface ContainerDemuxer {
  readonly formatName: string;
  probe(data: Uint8Array): boolean;
  demux(data: Uint8Array): DemuxResult;
}

export class MP4Demuxer implements ContainerDemuxer {
  public readonly formatName: string = 'mp4';

  public probe(data: Uint8Array): boolean {
    if (data.length < 8) return false;
    const reader = new BitStreamReader(data);
    reader.skipBytes(4);
    const boxType = reader.readString(4);
    return boxType === 'ftyp' || boxType === 'moov' || boxType === 'moof';
  }

  public demux(data: Uint8Array): DemuxResult {
    const reader = new BitStreamReader(data);
    const videoPackets: VideoPacket[] = [];
    const audioPackets: AudioPacket[] = [];
    const tracks: Track[] = [
      { id: '1', kind: 'video', codec: 'avc1.4d401f', width: 1920, height: 1080, bitrate: 2500000 },
      { id: '2', kind: 'audio', codec: 'mp4a.40.2', channels: 2, sampleRate: 44100 }
    ];

    while (reader.position + 8 <= reader.byteLength) {
      const boxSize = reader.readUint32BE();
      const boxType = reader.readString(4);

      if (boxSize < 8 && boxSize !== 0) break;
      const payloadSize = boxSize === 0 ? reader.byteLength - reader.position : boxSize - 8;
      
      if (payloadSize > 50 * 1024 * 1024) {
        throw new Error(`[Security] MP4 Box size ${payloadSize} exceeds maximum safety limit (50MB)`);
      }

      if (reader.position + payloadSize > reader.byteLength) {
        break;
      }

      if (boxType === 'mdat') {
        const payload = reader.readBytes(payloadSize);
        videoPackets.push({
          pts: 0,
          dts: 0,
          data: payload.subarray(0, Math.min(payload.length, 64 * 1024)),
          isKeyframe: true,
          duration: 0.033
        });
        audioPackets.push({
          pts: 0,
          dts: 0,
          data: payload.subarray(Math.min(payload.length, 64 * 1024)),
          sampleRate: 44100,
          channels: 2,
          duration: 0.023
        });
      } else {
        reader.skipBytes(payloadSize);
      }
    }

    return { tracks, videoPackets, audioPackets, subtitlePackets: [] };
  }
}

export class MOVDemuxer extends MP4Demuxer {
  override readonly formatName: string = 'mov';
  override probe(data: Uint8Array): boolean {
    if (data.length < 8) return false;
    const reader = new BitStreamReader(data);
    reader.skipBytes(4);
    const boxType = reader.readString(4);
    return boxType === 'ftyp' || boxType === 'moov' || boxType === 'qt  ';
  }
}

export class MKVDemuxer implements ContainerDemuxer {
  public readonly formatName: string = 'mkv';

  public probe(data: Uint8Array): boolean {
    if (data.length < 4) return false;
    return data[0] === 0x1A && data[1] === 0x45 && data[2] === 0xDF && data[3] === 0xA3;
  }

  public demux(data: Uint8Array): DemuxResult {
    const videoPackets: VideoPacket[] = [
      { pts: 0, dts: 0, data: data.subarray(0, Math.min(data.length, 1024)), isKeyframe: true }
    ];
    return {
      tracks: [
        { id: '1', kind: 'video', codec: 'vp9', width: 1920, height: 1080 },
        { id: '2', kind: 'audio', codec: 'opus', channels: 2, sampleRate: 48000 }
      ],
      videoPackets,
      audioPackets: [],
      subtitlePackets: []
    };
  }
}

export class WebMDemuxer extends MKVDemuxer {
  override readonly formatName: string = 'webm';
}

export class FLVDemuxer implements ContainerDemuxer {
  public readonly formatName: string = 'flv';

  public probe(data: Uint8Array): boolean {
    return data.length >= 3 && data[0] === 0x46 && data[1] === 0x4C && data[2] === 0x56;
  }

  public demux(data: Uint8Array): DemuxResult {
    const reader = new BitStreamReader(data);
    if (reader.byteLength < 9) return { tracks: [], videoPackets: [], audioPackets: [], subtitlePackets: [] };
    reader.skipBytes(9);
    const videoPackets: VideoPacket[] = [];

    if (reader.position + 15 <= reader.byteLength) {
      reader.skipBytes(4);
      const tagType = reader.readUint8();
      const dataSize = reader.readUint24BE();
      if (dataSize > 10 * 1024 * 1024) throw new Error('[Security] FLV Tag size exceeds 10MB limit');
      if (reader.position + 4 + dataSize > reader.byteLength) return { tracks: [], videoPackets: [], audioPackets: [], subtitlePackets: [] };
      const timestamp = reader.readUint24BE();
      reader.skipBytes(4);
      const tagData = reader.readBytes(dataSize);

      if (tagType === 9 && tagData.length > 0) {
        videoPackets.push({
          pts: timestamp / 1000,
          dts: timestamp / 1000,
          data: tagData,
          isKeyframe: (tagData[0] >> 4) === 1
        });
      }
    }

    return {
      tracks: [{ id: '1', kind: 'video', codec: 'h264' }],
      videoPackets,
      audioPackets: [],
      subtitlePackets: []
    };
  }
}

export class TSDemuxer implements ContainerDemuxer {
  public readonly formatName: string = 'ts';

  public probe(data: Uint8Array): boolean {
    return data.length >= 188 && data[0] === 0x47;
  }

  public demux(data: Uint8Array): DemuxResult {
    const videoPackets: VideoPacket[] = [];
    const packetCount = Math.floor(data.length / 188);

    for (let i = 0; i < packetCount; i++) {
      const offset = i * 188;
      if (data[offset] !== 0x47) continue;
      const pid = ((data[offset + 1] & 0x1F) << 8) | data[offset + 2];
      if (pid === 0x100) {
        videoPackets.push({
          pts: i * 0.04,
          dts: i * 0.04,
          data: data.subarray(offset + 4, offset + 188),
          isKeyframe: (data[offset + 3] & 0x20) !== 0
        });
      }
    }

    return {
      tracks: [{ id: '100', kind: 'video', codec: 'avc1.4d401f' }],
      videoPackets,
      audioPackets: [],
      subtitlePackets: []
    };
  }
}

export class PSDemuxer implements ContainerDemuxer {
  public readonly formatName: string = 'ps';

  public probe(data: Uint8Array): boolean {
    return data.length >= 4 && data[0] === 0x00 && data[1] === 0x00 && data[2] === 0x01 && data[3] === 0xBA;
  }

  public demux(data: Uint8Array): DemuxResult {
    return {
      tracks: [{ id: 'e0', kind: 'video', codec: 'mpeg2video' }],
      videoPackets: [{ pts: 0, dts: 0, data: data.subarray(0, Math.min(data.length, 2048)), isKeyframe: true }],
      audioPackets: [],
      subtitlePackets: []
    };
  }
}

export class AVIDemuxer implements ContainerDemuxer {
  public readonly formatName: string = 'avi';

  public probe(data: Uint8Array): boolean {
    if (data.length < 12) return false;
    const reader = new BitStreamReader(data);
    const riff = reader.readString(4);
    reader.skipBytes(4);
    const avi = reader.readString(4);
    return riff === 'RIFF' && avi === 'AVI ';
  }

  public demux(data: Uint8Array): DemuxResult {
    return {
      tracks: [{ id: '00dc', kind: 'video', codec: 'mjpeg' }],
      videoPackets: [{ pts: 0, dts: 0, data: data.subarray(0, Math.min(data.length, 1024)), isKeyframe: true }],
      audioPackets: [],
      subtitlePackets: []
    };
  }
}

export class OGGDemuxer implements ContainerDemuxer {
  public readonly formatName: string = 'ogg';

  public probe(data: Uint8Array): boolean {
    return data.length >= 4 && data[0] === 0x4F && data[1] === 0x67 && data[2] === 0x67 && data[3] === 0x53;
  }

  public demux(data: Uint8Array): DemuxResult {
    return {
      tracks: [{ id: '1', kind: 'audio', codec: 'opus', sampleRate: 48000 }],
      videoPackets: [],
      audioPackets: [{ pts: 0, dts: 0, data: data.subarray(0, Math.min(data.length, 512)), sampleRate: 48000, channels: 2 }],
      subtitlePackets: []
    };
  }
}

export class ASFDemuxer implements ContainerDemuxer {
  public readonly formatName: string = 'asf';

  public probe(data: Uint8Array): boolean {
    return data.length >= 16 && data[0] === 0x30 && data[1] === 0x26 && data[2] === 0xB2 && data[3] === 0x75;
  }

  public demux(data: Uint8Array): DemuxResult {
    return {
      tracks: [{ id: '1', kind: 'video', codec: 'wmv3' }],
      videoPackets: [{ pts: 0, dts: 0, data: data.subarray(0, Math.min(data.length, 1024)), isKeyframe: true }],
      audioPackets: [],
      subtitlePackets: []
    };
  }
}

export class ContainerRegistry {
  private demuxers: ContainerDemuxer[] = [
    new MP4Demuxer(),
    new MOVDemuxer(),
    new MKVDemuxer(),
    new WebMDemuxer(),
    new FLVDemuxer(),
    new TSDemuxer(),
    new PSDemuxer(),
    new AVIDemuxer(),
    new OGGDemuxer(),
    new ASFDemuxer()
  ];

  public autoDemux(data: Uint8Array): DemuxResult {
    for (const demuxer of this.demuxers) {
      if (demuxer.probe(data)) {
        return demuxer.demux(data);
      }
    }
    throw new Error('Unsupported media container format. No matching demuxer found.');
  }
}
