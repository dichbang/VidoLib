import { MediaPlugin, PluginContext } from '@media-runtime/plugins';

export interface MediaMetadataConfig {
  title: string;
  artist?: string;
  album?: string;
  artwork?: { src: string; sizes?: string; type?: string }[];
}

export class MediaSessionPlugin implements MediaPlugin {
  public readonly name = 'media-session-plugin';
  public readonly category = 'os-integration';
  public readonly version = '1.0.0';

  constructor(private metadata?: MediaMetadataConfig) {}

  public init(ctx: PluginContext): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    if (this.metadata) {
      this.updateMetadata(this.metadata);
    }

    const player = ctx.player as any;

    navigator.mediaSession.setActionHandler('play', () => player.play());
    navigator.mediaSession.setActionHandler('pause', () => player.pause());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) player.seek(details.seekTime);
    });

    ctx.on('statechange', (state) => {
      if ('playbackState' in navigator.mediaSession) {
        if (state === 'playing') navigator.mediaSession.playbackState = 'playing';
        else if (state === 'paused') navigator.mediaSession.playbackState = 'paused';
        else navigator.mediaSession.playbackState = 'none';
      }
    });

    ctx.on('timeupdate', (time: any) => {
      if ('setPositionState' in navigator.mediaSession) {
        try {
          navigator.mediaSession.setPositionState({
            duration: player.getDuration() || 0,
            position: time || 0,
            playbackRate: 1
          });
        } catch {}
      }
    });
  }

  public updateMetadata(meta: MediaMetadataConfig): void {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && typeof MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new MediaMetadata(meta);
    }
  }
}

export class PictureInPicturePlugin implements MediaPlugin {
  public readonly name = 'pip-plugin';
  public readonly category = 'os-integration';
  public readonly version = '1.0.0';

  public init(): void {}

  public async requestPiP(videoElement: HTMLVideoElement): Promise<void> {
    if (document.pictureInPictureEnabled && videoElement !== document.pictureInPictureElement) {
      await videoElement.requestPictureInPicture();
    }
  }

  public async exitPiP(): Promise<void> {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
  }
}

export class CastPlugin implements MediaPlugin {
  public readonly name = 'cast-plugin';
  public readonly category = 'os-integration';
  public readonly version = '1.0.0';

  public init(): void {}

  public async startCasting(streamUrl: string): Promise<void> {
    console.log(`Initiating Chromecast session for stream: ${streamUrl}`);
  }
}
