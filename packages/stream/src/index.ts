export interface MediaStreamSource {
  readonly type: string;
  readonly byteLength?: number;
  getStream(startByte?: number, endByte?: number): ReadableStream<Uint8Array>;
  readChunk(offset: number, size: number): Promise<Uint8Array>;
}

export class HTTPRangeSource implements MediaStreamSource {
  public readonly type: string = 'http-range';
  private cachedSize?: number;

  constructor(
    public readonly url: string,
    private headers: Record<string, string> = {}
  ) {}

  public async getByteLength(): Promise<number> {
    if (this.cachedSize !== undefined) return this.cachedSize;
    const res = await fetch(this.url, { method: 'HEAD', headers: this.headers });
    const cl = res.headers.get('content-length');
    if (cl) {
      this.cachedSize = parseInt(cl, 10);
      return this.cachedSize;
    }
    return 0;
  }

  public get byteLength(): number | undefined {
    return this.cachedSize;
  }

  public async readChunk(offset: number, size: number): Promise<Uint8Array> {
    const end = offset + size - 1;
    const rangeHeader = { ...this.headers, Range: `bytes=${offset}-${end}` };
    const res = await fetch(this.url, { headers: rangeHeader });
    if (!res.ok && res.status !== 206) {
      throw new Error(`HTTP fetch failed with status ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  public getStream(startByte: number = 0, endByte?: number): ReadableStream<Uint8Array> {
    const url = this.url;
    const headers = { ...this.headers };

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const range = endByte !== undefined ? `bytes=${startByte}-${endByte}` : `bytes=${startByte}-`;
        const res = await fetch(url, { headers: { ...headers, Range: range } });
        if (!res.body) {
          controller.error(new Error('Fetch body is null'));
          return;
        }

        const reader = res.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) controller.enqueue(value);
        }
        controller.close();
      }
    });
  }
}

export class BlobSource implements MediaStreamSource {
  public readonly type: string = 'blob';

  constructor(public readonly blob: Blob) {}

  public get byteLength(): number {
    return this.blob.size;
  }

  public async readChunk(offset: number, size: number): Promise<Uint8Array> {
    const slice = this.blob.slice(offset, offset + size);
    const buf = await slice.arrayBuffer();
    return new Uint8Array(buf);
  }

  public getStream(startByte: number = 0, endByte?: number): ReadableStream<Uint8Array> {
    const slice = this.blob.slice(startByte, endByte);
    if (typeof slice.stream === 'function') {
      return slice.stream();
    }
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const buf = await slice.arrayBuffer();
        controller.enqueue(new Uint8Array(buf));
        controller.close();
      }
    });
  }
}

export class FileSource extends BlobSource {
  override readonly type: string = 'file';
  constructor(file: File) {
    super(file);
  }
}

export class WebSocketSource implements MediaStreamSource {
  public readonly type: string = 'websocket';

  constructor(public readonly url: string) {}

  public async readChunk(): Promise<Uint8Array> {
    throw new Error('Random-access readChunk is not supported on WebSocket streams.');
  }

  public getStream(): ReadableStream<Uint8Array> {
    const url = this.url;
    return new ReadableStream<Uint8Array>({
      start(controller) {
        const ws = new WebSocket(url);
        ws.binaryType = 'arraybuffer';
        ws.onmessage = (evt) => {
          if (evt.data instanceof ArrayBuffer) {
            controller.enqueue(new Uint8Array(evt.data));
          }
        };
        ws.onerror = (err) => controller.error(err);
        ws.onclose = () => controller.close();
      }
    });
  }
}

export class WebRTCDataChannelSource implements MediaStreamSource {
  public readonly type: string = 'webrtc';

  constructor(public readonly channel: RTCDataChannel) {}

  public async readChunk(): Promise<Uint8Array> {
    throw new Error('Random-access readChunk is not supported on WebRTC DataChannel streams.');
  }

  public getStream(): ReadableStream<Uint8Array> {
    const channel = this.channel;
    return new ReadableStream<Uint8Array>({
      start(controller) {
        channel.binaryType = 'arraybuffer';
        channel.onmessage = (evt) => {
          if (evt.data instanceof ArrayBuffer) {
            controller.enqueue(new Uint8Array(evt.data));
          }
        };
        channel.onerror = (err) => controller.error(err);
        channel.onclose = () => controller.close();
      }
    });
  }
}

export class S3Source extends HTTPRangeSource {
  override readonly type: string = 's3';
  constructor(endpointUrl: string, bucket: string, key: string, authHeaders?: Record<string, string>) {
    super(`${endpointUrl}/${bucket}/${key}`, authHeaders);
  }
}

export class IPFSSource extends HTTPRangeSource {
  override readonly type: string = 'ipfs';
  constructor(cid: string, gatewayUrl: string = 'https://ipfs.io/ipfs') {
    super(`${gatewayUrl}/${cid}`);
  }
}
