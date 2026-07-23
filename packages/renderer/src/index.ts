export interface FrameRenderer {
  readonly backendName: string;
  render(frame: any, width: number, height: number): void;
  resize(width: number, height: number): void;
  destroy(): void;
}

export class Canvas2DRenderer implements FrameRenderer {
  public readonly backendName = 'canvas2d';
  private ctx: CanvasRenderingContext2D;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context from canvas');
    this.ctx = ctx;
  }

  public render(frame: any, width: number, height: number): void {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.resize(width, height);
    }
    if (frame instanceof VideoFrame) {
      this.ctx.drawImage(frame, 0, 0, width, height);
      frame.close();
    } else if (frame instanceof ImageBitmap || frame instanceof HTMLImageElement || frame instanceof HTMLCanvasElement) {
      this.ctx.drawImage(frame, 0, 0, width, height);
    }
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public destroy(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

export class WebGLRenderer implements FrameRenderer {
  public readonly backendName = 'webgl';
  private gl: WebGLRenderingContext;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl as WebGLRenderingContext;
    this.initGL();
  }

  private initGL(): void {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  public render(frame: any, width: number, height: number): void {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.resize(width, height);
    }
    this.gl.viewport(0, 0, width, height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    if (frame && typeof frame.close === 'function') {
      frame.close();
    }
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public destroy(): void {}
}

export class WebGPURenderer implements FrameRenderer {
  public readonly backendName = 'webgpu';

  constructor(private canvas: HTMLCanvasElement) {}

  public static async isSupported(): Promise<boolean> {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  public render(frame: any, width: number, height: number): void {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.resize(width, height);
    }
    if (frame && typeof frame.close === 'function') {
      frame.close();
    }
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public destroy(): void {}
}

export class AutoRendererFactory {
  public static async create(canvas: HTMLCanvasElement): Promise<FrameRenderer> {
    if (await WebGPURenderer.isSupported()) {
      try { return new WebGPURenderer(canvas); } catch {}
    }
    try { return new WebGLRenderer(canvas); } catch {}
    return new Canvas2DRenderer(canvas);
  }
}
