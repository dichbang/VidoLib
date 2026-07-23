import { PluginRegistry, MediaPlugin, PluginContext } from '@vidolib/plugins';

export interface VideoPacket {
  pts: number;
  dts: number;
  data: Uint8Array;
  isKeyframe: boolean;
  duration?: number;
}

export interface AudioPacket {
  pts: number;
  dts: number;
  data: Uint8Array;
  sampleRate?: number;
  channels?: number;
  duration?: number;
}

export interface SubtitlePacket {
  startTime: number;
  endTime: number;
  text: string;
  styledMarkup?: string;
  image?: Uint8Array;
}

export type TrackKind = 'video' | 'audio' | 'subtitle';

export interface Track {
  id: string;
  kind: TrackKind;
  codec: string;
  language?: string;
  bitrate?: number;
  width?: number;
  height?: number;
  channels?: number;
  sampleRate?: number;
}

export interface StreamConfig {
  url?: string;
  source?: unknown;
  autoplay?: boolean;
  muted?: boolean;
  volume?: number;
}

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'seeking' | 'ended' | 'error';

export interface PlayerEvents {
  statechange: PlayerState;
  timeupdate: number;
  durationchange: number;
  volumechange: { volume: number; muted: boolean };
  bitratechange: { bitrate: number; renditionId: string };
  error: Error;
  ended: void;
}

export class Clock {
  private currentTimeSeconds: number = 0;
  private playbackRate: number = 1.0;
  private isRunning: boolean = false;
  private lastUpdatePerformanceTime: number = 0;

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastUpdatePerformanceTime = performance.now();
  }

  public pause(): void {
    this.update();
    this.isRunning = false;
  }

  public getTime(): number {
    this.update();
    return this.currentTimeSeconds;
  }

  public setTime(seconds: number): void {
    this.currentTimeSeconds = Math.max(0, seconds);
    this.lastUpdatePerformanceTime = performance.now();
  }

  public setSpeed(speed: number): void {
    this.update();
    this.playbackRate = Math.max(0.1, Math.min(16.0, speed));
  }

  public getSpeed(): number {
    return this.playbackRate;
  }

  private update(): void {
    if (!this.isRunning) return;
    const now = performance.now();
    const deltaMs = now - this.lastUpdatePerformanceTime;
    this.currentTimeSeconds += (deltaMs / 1000) * this.playbackRate;
    this.lastUpdatePerformanceTime = now;
  }
}

export class Player {
  private registry: PluginRegistry = new PluginRegistry();
  private clock: Clock = new Clock();
  private state: PlayerState = 'idle';
  private eventListeners: Map<string, Set<(payload?: unknown) => void>> = new Map();
  private config: Map<string, unknown> = new Map();
  private durationSeconds: number = 0;
  private volumeLevel: number = 1.0;
  private isMuted: boolean = false;

  constructor(initialConfig?: Record<string, unknown>) {
    if (initialConfig) {
      for (const [k, v] of Object.entries(initialConfig)) {
        this.config.set(k, v);
      }
    }

    const ctx: PluginContext = {
      player: this,
      emit: (evt, data) => this.emit(evt, data),
      on: (evt, fn) => this.on(evt, fn),
      getConfig: (key, def) => (this.config.has(key) ? (this.config.get(key) as any) : def)
    };
    this.registry.setContext(ctx);
  }

  public async use(plugin: MediaPlugin): Promise<this> {
    await this.registry.register(plugin);
    return this;
  }

  public async load(source: string | unknown): Promise<void> {
    this.setState('loading');
    try {
      this.emit('loadstart', { source });
      this.setState('paused');
    } catch (err) {
      this.setState('error');
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  public play(): void {
    if (this.state === 'playing') return;
    this.clock.start();
    this.setState('playing');
    this.emit('play');
  }

  public pause(): void {
    if (this.state !== 'playing') return;
    this.clock.pause();
    this.setState('paused');
    this.emit('pause');
  }

  public seek(timeSeconds: number): void {
    const prev = this.state;
    this.setState('seeking');
    this.clock.setTime(timeSeconds);
    this.emit('seeking', { currentTime: timeSeconds });
    this.emit('timeupdate', timeSeconds);
    this.setState(prev === 'playing' ? 'playing' : 'paused');
  }

  public getCurrentTime(): number {
    return this.clock.getTime();
  }

  public getDuration(): number {
    return this.durationSeconds;
  }

  public setDuration(duration: number): void {
    this.durationSeconds = duration;
    this.emit('durationchange', duration);
  }

  public setPlaybackRate(rate: number): void {
    this.clock.setSpeed(rate);
    this.emit('ratechange', rate);
  }

  public setVolume(volume: number): void {
    this.volumeLevel = Math.max(0, Math.min(1, volume));
    this.emit('volumechange', { volume: this.volumeLevel, muted: this.isMuted });
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.emit('volumechange', { volume: this.volumeLevel, muted: this.isMuted });
  }

  public getState(): PlayerState {
    return this.state;
  }

  public on(event: string, handler: (payload?: unknown) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  public off(event: string, handler: (payload?: unknown) => void): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  public emit(event: string, payload?: unknown): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      for (const h of handlers) {
        try {
          h(payload);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      }
    }
    this.registry.dispatchEvent(event, payload);
  }

  private setState(state: PlayerState): void {
    this.state = state;
    this.emit('statechange', state);
  }

  public async destroy(): Promise<void> {
    this.clock.pause();
    await this.registry.destroyAll();
    this.eventListeners.clear();
    this.setState('idle');
  }
}
