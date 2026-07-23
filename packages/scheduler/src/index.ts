import { Clock, VideoPacket } from '@vidolib/core';

export interface SchedulerStats {
  renderedFrames: number;
  droppedFrames: number;
  driftMs: number;
}

export class AVSynchronizer {
  private renderedFramesCount: number = 0;
  private droppedFramesCount: number = 0;
  private maxDriftThresholdMs: number = 40;

  constructor(private clock: Clock) {}

  public processVideoPacket(packet: VideoPacket, audioPts: number): 'render' | 'drop' | 'wait' {
    const videoPts = packet.pts;
    const diffMs = (videoPts - audioPts) * 1000;

    if (diffMs < -this.maxDriftThresholdMs) {
      this.droppedFramesCount++;
      return 'drop';
    } else if (diffMs > this.maxDriftThresholdMs) {
      return 'wait';
    }

    this.renderedFramesCount++;
    return 'render';
  }

  public getStats(): SchedulerStats {
    return {
      renderedFrames: this.renderedFramesCount,
      droppedFrames: this.droppedFramesCount,
      driftMs: 0
    };
  }

  public resetStats(): void {
    this.renderedFramesCount = 0;
    this.droppedFramesCount = 0;
  }
}
