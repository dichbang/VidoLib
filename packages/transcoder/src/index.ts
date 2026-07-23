import { VideoPacket, AudioPacket } from '@vidolib/core';

export interface TranscoderConfig {
  codec: string; // e.g. 'avc1.4d401f' or 'vp09.00.10.08'
  width: number;
  height: number;
  bitrate: number;
  frameRate?: number;
}

export class HardwareVideoEncoder {
  private encoder?: unknown;

  public async init(config: TranscoderConfig, onChunk: (packet: VideoPacket) => void): Promise<void> {
    if (typeof (globalThis as any).VideoEncoder === 'undefined') {
      throw new Error('WebCodecs VideoEncoder API is not supported in this browser environment.');
    }

    this.encoder = new (globalThis as any).VideoEncoder({
      output: (chunk: any, metadata: any) => {
        const buffer = new Uint8Array(chunk.byteLength);
        chunk.copyTo(buffer);
        onChunk({
          pts: chunk.timestamp / 1_000_000,
          dts: chunk.timestamp / 1_000_000,
          data: buffer,
          isKeyframe: chunk.type === 'key'
        });
      },
      error: (err: any) => console.error('VideoEncoder Error:', err)
    });

    (this.encoder as any).configure({
      codec: config.codec,
      width: config.width,
      height: config.height,
      bitrate: config.bitrate,
      framerate: config.frameRate || 30,
      hardwareAcceleration: 'prefer-hardware'
    });
  }

  public encodeFrame(frame: any, keyFrame: boolean = false): void {
    if (!this.encoder) return;
    (this.encoder as any).encode(frame, { keyFrame });
  }

  public async flush(): Promise<void> {
    if (this.encoder) {
      await (this.encoder as any).flush();
    }
  }

  public close(): void {
    if (this.encoder) {
      (this.encoder as any).close();
    }
  }
}
