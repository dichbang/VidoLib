export interface VideoFilterSettings {
  brightness?: number; // 0.0 to 2.0 (default 1.0)
  contrast?: number;   // 0.0 to 2.0 (default 1.0)
  saturate?: number;   // 0.0 to 2.0 (default 1.0)
  blurPx?: number;     // 0 to 20
  chromaKeyGreen?: boolean; // Green screen removal
}

export class VideoFilterProcessor {
  private ctx: CanvasRenderingContext2D;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context for VideoFilterProcessor');
    this.ctx = ctx;
  }

  public applyFilters(imageSource: CanvasImageSource, settings: VideoFilterSettings): void {
    const filters: string[] = [];

    if (settings.brightness !== undefined) filters.push(`brightness(${settings.brightness})`);
    if (settings.contrast !== undefined) filters.push(`contrast(${settings.contrast})`);
    if (settings.saturate !== undefined) filters.push(`saturate(${settings.saturate})`);
    if (settings.blurPx !== undefined && settings.blurPx > 0) filters.push(`blur(${settings.blurPx}px)`);

    this.ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';
    this.ctx.drawImage(imageSource, 0, 0, this.canvas.width, this.canvas.height);

    if (settings.chromaKeyGreen) {
      this.removeGreenScreen();
    }
  }

  public addWatermark(watermarkText: string, position: 'bottom-right' | 'top-right' = 'bottom-right'): void {
    this.ctx.save();
    this.ctx.font = 'bold 18px sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 4;

    const x = position === 'bottom-right' ? this.canvas.width - 150 : this.canvas.width - 150;
    const y = position === 'bottom-right' ? this.canvas.height - 20 : 30;

    this.ctx.fillText(watermarkText, x, y);
    this.ctx.restore();
  }

  private removeGreenScreen(): void {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Green screen keying threshold
      if (g > 100 && g > r * 1.4 && g > b * 1.4) {
        data[i + 3] = 0; // Make pixel transparent
      }
    }

    this.ctx.putImageData(imgData, 0, 0);
  }
}
