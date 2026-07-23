import { RingBuffer } from '@media-runtime/utils';

export interface SeekEntry {
  timestampSeconds: number;
  byteOffset: number;
  isKeyframe: boolean;
}

export class SeekIndex {
  private entries: SeekEntry[] = [];

  public addEntry(entry: SeekEntry): void {
    this.entries.push(entry);
  }

  public findNearestKeyframe(targetTimeSeconds: number): SeekEntry | undefined {
    if (this.entries.length === 0) return undefined;
    
    let best = this.entries[0];
    let minDiff = Math.abs(best.timestampSeconds - targetTimeSeconds);

    for (const entry of this.entries) {
      if (entry.isKeyframe) {
        const diff = Math.abs(entry.timestampSeconds - targetTimeSeconds);
        if (diff < minDiff) {
          minDiff = diff;
          best = entry;
        }
      }
    }
    return best;
  }

  public clear(): void {
    this.entries = [];
  }
}

export class BufferController {
  private ringBuffer: RingBuffer;
  private highWaterMarkBytes: number;
  private lowWaterMarkBytes: number;
  public seekIndex: SeekIndex = new SeekIndex();

  constructor(maxCapacityBytes: number = 10 * 1024 * 1024) { // 10MB default
    this.ringBuffer = new RingBuffer(maxCapacityBytes);
    this.highWaterMarkBytes = Math.floor(maxCapacityBytes * 0.8);
    this.lowWaterMarkBytes = Math.floor(maxCapacityBytes * 0.2);
  }

  public shouldPauseIngestion(): boolean {
    return this.ringBuffer.availableRead >= this.highWaterMarkBytes;
  }

  public shouldResumeIngestion(): boolean {
    return this.ringBuffer.availableRead <= this.lowWaterMarkBytes;
  }

  public write(data: Uint8Array): number {
    return this.ringBuffer.write(data);
  }

  public read(out: Uint8Array): number {
    return this.ringBuffer.read(out);
  }

  public get bufferedBytes(): number {
    return this.ringBuffer.availableRead;
  }

  public clear(): void {
    this.ringBuffer.clear();
    this.seekIndex.clear();
  }
}
