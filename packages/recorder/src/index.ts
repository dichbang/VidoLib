export interface RecorderOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
}

export class MediaRecorderPipeline {
  private mediaRecorder?: MediaRecorder;
  private recordedChunks: Blob[] = [];

  constructor(private stream: MediaStream, private options: RecorderOptions = {}) {}

  public start(): void {
    const mimeType = this.options.mimeType || 'video/webm;codecs=vp9,opus';
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
      videoBitsPerSecond: this.options.videoBitsPerSecond || 2_500_000
    });

    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(1000); // 1-second slice interval
  }

  public async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder was not started.'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const finalBlob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || 'video/webm'
        });
        resolve(finalBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  public download(filename: string = 'recording.webm', blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
