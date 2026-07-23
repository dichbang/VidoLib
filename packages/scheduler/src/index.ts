import { Clock, VideoPacket } from '@media-runtime/core';

export interface SchedulerStats {
  renderedFrames: number;
  droppedFrames: number;
  driftMs: number;
}

export class AVSynchronizer {
  private renderedFramesCount: number = 0;
  private droppedFramesCount: number = 0;
  private maxDriftThresholdMs: number = 40; // 40ms A/V sync tolerance window

  constructor(private clock: Clock) {}

  public processVideoPacket(packet: VideoPacket, audioPts: number): 'render' | 'drop' | 'wait' {
    const videoPts = packet.pts;
    const diffMs = (videoPts - audioPts) * 1000;

    if (diffMs < -this.maxDriftThresholdMs) {
      // Video is too far behind audio -> drop frame to catch up
      this.droppedFramesCount++;
      return 'drop';
    } else if (diffMs > this.maxDriftThresholdMs) {
      // Video is ahead of audio -> wait for audio clock to advance
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
