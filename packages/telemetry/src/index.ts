import { MediaPlugin, PluginContext } from '@media-runtime/plugins';

export interface QoEMetrics {
  startupTimeMs: number;
  totalPlayTimeSeconds: number;
  totalRebufferTimeSeconds: number;
  rebufferRatio: number; // rebufferTime / totalPlayTime
  bitrateSwitchCount: number;
  droppedFramesCount: number;
  currentBitrate: number;
}

export type TelemetryListener = (metrics: QoEMetrics) => void;

export class TelemetryPlugin implements MediaPlugin {
  public readonly name = 'telemetry-plugin';
  public readonly category = 'telemetry';
  public readonly version = '1.0.0';

  private loadStartTime: number = 0;
  private startupTimeMs: number = 0;
  private playStartTime: number = 0;
  private totalPlayTimeSec: number = 0;
  private totalRebufferTimeSec: number = 0;
  private lastStallStart: number = 0;
  private bitrateSwitchCount: number = 0;
  private listeners: Set<TelemetryListener> = new Set();
  private currentBitrate: number = 0;

  public init(ctx: PluginContext): void {
    ctx.on('loadstart', () => {
      this.loadStartTime = performance.now();
    });

    ctx.on('playing', () => {
      if (this.startupTimeMs === 0 && this.loadStartTime > 0) {
        this.startupTimeMs = performance.now() - this.loadStartTime;
      }
      this.playStartTime = performance.now();
      if (this.lastStallStart > 0) {
        this.totalRebufferTimeSec += (performance.now() - this.lastStallStart) / 1000;
        this.lastStallStart = 0;
      }
      this.emitMetrics();
    });

    ctx.on('waiting', () => {
      this.lastStallStart = performance.now();
    });

    ctx.on('bitratechange', (evt: any) => {
      this.bitrateSwitchCount++;
      if (evt && evt.bitrate) this.currentBitrate = evt.bitrate;
      this.emitMetrics();
    });
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getMetrics(): QoEMetrics {
    const totalPlay = this.totalPlayTimeSec + (this.playStartTime > 0 ? (performance.now() - this.playStartTime) / 1000 : 0);
    const rebufferRatio = totalPlay > 0 ? this.totalRebufferTimeSec / totalPlay : 0;

    return {
      startupTimeMs: this.startupTimeMs,
      totalPlayTimeSeconds: totalPlay,
      totalRebufferTimeSeconds: this.totalRebufferTimeSec,
      rebufferRatio,
      bitrateSwitchCount: this.bitrateSwitchCount,
      droppedFramesCount: 0,
      currentBitrate: this.currentBitrate
    };
  }

  private emitMetrics(): void {
    const metrics = this.getMetrics();
    for (const listener of this.listeners) {
      try {
        listener(metrics);
      } catch (err) {
        console.error('Error in telemetry listener:', err);
      }
    }
  }
}
