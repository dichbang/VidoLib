export interface WorkerMessage<T = unknown> {
  type: 'demux' | 'decode' | 'packet' | 'frame' | 'error';
  payload: T;
}

export class WorkerPipelineHost {
  private worker?: Worker;

  constructor(workerScriptUrl?: string) {
    if (typeof Worker !== 'undefined' && workerScriptUrl) {
      this.worker = new Worker(workerScriptUrl, { type: 'module' });
    }
  }

  public sendPacket(packetData: Uint8Array, transfer: boolean = true): void {
    if (!this.worker) return;
    const message: WorkerMessage<{ data: Uint8Array }> = {
      type: 'packet',
      payload: { data: packetData }
    };
    if (transfer && packetData.buffer instanceof ArrayBuffer) {
      this.worker.postMessage(message, [packetData.buffer]);
    } else {
      this.worker.postMessage(message);
    }
  }

  public onFrame(handler: (frame: unknown) => void): void {
    if (!this.worker) return;
    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      if (event.data.type === 'frame') {
        handler(event.data.payload);
      }
    };
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}
