import { MediaPlugin, PluginContext } from '@vidolib/plugins';

export type KeySystem =
  | 'com.widevine.alpha'
  | 'com.microsoft.playready'
  | 'com.apple.fps.1_0';

export interface LicenseRequestHook {
  (url: string, keyMessage: Uint8Array): Promise<Uint8Array>;
}

export interface DRMConfig {
  keySystem: KeySystem;
  licenseUrl: string;
  certificateUrl?: string;
  onRequestLicense?: LicenseRequestHook;
  headers?: Record<string, string>;
}

export interface KeySessionStatus {
  sessionId: string;
  status: 'usable' | 'expired' | 'output-restricted' | 'internal-error';
}

export class EMEPlugin implements MediaPlugin {
  public readonly name = 'eme-drm-plugin';
  public readonly category = 'drm';
  public readonly version = '1.0.0';

  private mediaKeys?: MediaKeys;
  private activeSessions: Map<string, MediaKeySession> = new Map();

  constructor(private config: DRMConfig) {}

  public async init(ctx: PluginContext): Promise<void> {
    ctx.on('encrypted', (eventData) => this.handleEncryptedEvent(eventData));
  }

  public async initializeMediaKeys(mediaElement: HTMLMediaElement): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.requestMediaKeySystemAccess) {
      throw new Error('EME MediaKeySystemAccess API is not supported in this browser.');
    }

    const configs: MediaKeySystemConfiguration[] = [{
      initDataTypes: ['cenc', 'keyids', 'sinf'],
      videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.4d401f"' }],
      audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }]
    }];

    const access = await navigator.requestMediaKeySystemAccess(this.config.keySystem, configs);
    this.mediaKeys = await access.createMediaKeys();
    await mediaElement.setMediaKeys(this.mediaKeys);
  }

  private async handleEncryptedEvent(eventData: any): Promise<void> {
    if (!this.mediaKeys) return;

    const session = this.mediaKeys.createSession();
    this.activeSessions.set(session.sessionId, session);

    session.addEventListener('message', async (event: MediaKeyMessageEvent) => {
      const message = new Uint8Array(event.message);
      let response: Uint8Array;

      if (this.config.onRequestLicense) {
        response = await this.config.onRequestLicense(this.config.licenseUrl, message);
      } else {
        const res = await fetch(this.config.licenseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream', ...this.config.headers },
          body: message as any
        });
        response = new Uint8Array(await res.arrayBuffer());
      }

      await session.update(response as any);
    });

    await session.generateRequest(eventData.initDataType || 'cenc', eventData.initData);
  }

  public async destroy(): Promise<void> {
    for (const session of this.activeSessions.values()) {
      await session.close();
    }
    this.activeSessions.clear();
  }
}
