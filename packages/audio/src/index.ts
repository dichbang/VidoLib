export class WebAudioPipeline {
  private audioCtx?: AudioContext;
  private gainNode?: GainNode;

  public async init(sampleRate: number = 48000): Promise<void> {
    if (typeof AudioContext === 'undefined') return;
    this.audioCtx = new AudioContext({ sampleRate });
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.connect(this.audioCtx.destination);
  }

  public setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioCtx?.currentTime || 0);
    }
  }

  public pushAudioData(channelData: Float32Array[]): void {
    if (!this.audioCtx || !this.gainNode) return;
    const buffer = this.audioCtx.createBuffer(channelData.length, channelData[0].length, this.audioCtx.sampleRate);
    for (let c = 0; c < channelData.length; c++) {
      const src = channelData[c];
      buffer.copyToChannel(src as any, c);
    }
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    source.start();
  }

  public async resume(): Promise<void> {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  public destroy(): void {
    if (this.audioCtx) {
      this.audioCtx.close();
    }
  }
}
