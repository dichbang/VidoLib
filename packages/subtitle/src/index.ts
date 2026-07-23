import { SubtitlePacket } from '@media-runtime/core';

export class SRTParser {
  public static parse(srtText: string): SubtitlePacket[] {
    const packets: SubtitlePacket[] = [];
    const blocks = srtText.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 3) continue;
      const timeLine = lines[1];
      const match = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      if (match) {
        const startTime = this.parseTimestamp(match[1]);
        const endTime = this.parseTimestamp(match[2]);
        const text = lines.slice(2).join('\n');
        packets.push({ startTime, endTime, text });
      }
    }
    return packets;
  }

  private static parseTimestamp(ts: string): number {
    const parts = ts.replace(',', '.').split(':');
    const h = parseFloat(parts[0]);
    const m = parseFloat(parts[1]);
    const s = parseFloat(parts[2]);
    return h * 3600 + m * 60 + s;
  }
}

export class VTTParser {
  public static parse(vttText: string): SubtitlePacket[] {
    const clean = vttText.replace(/^WEBVTT.*?\n/i, '');
    return SRTParser.parse(clean.replace(/\./g, ','));
  }
}

export class ASSParser {
  public static parse(assText: string): SubtitlePacket[] {
    const packets: SubtitlePacket[] = [];
    const lines = assText.split('\n');
    for (const line of lines) {
      if (line.startsWith('Dialogue:')) {
        const parts = line.substring(9).split(',');
        if (parts.length >= 10) {
          const start = parts[1].trim();
          const end = parts[2].trim();
          const rawText = parts.slice(9).join(',');
          packets.push({
            startTime: this.parseTimestamp(start),
            endTime: this.parseTimestamp(end),
            text: rawText.replace(/\{[^}]+\}/g, ''), // Plain text
            styledMarkup: rawText // Preserve ASS styling tags {\k50}, {\pos(x,y)}, etc.
          });
        }
      }
    }
    return packets;
  }

  private static parseTimestamp(ts: string): number {
    const parts = ts.split(':');
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
}

export class SubtitleRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context for SubtitleRenderer');
    this.ctx = ctx;
  }

  public renderSubtitles(packets: SubtitlePacket[], currentTimeSeconds: number): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const active = packets.filter(p => currentTimeSeconds >= p.startTime && currentTimeSeconds <= p.endTime);
    if (active.length === 0) return;

    this.ctx.font = '24px sans-serif';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.textAlign = 'center';

    let y = this.canvas.height - 40;
    for (const sub of active) {
      const text = sub.text;
      this.ctx.strokeText(text, this.canvas.width / 2, y);
      this.ctx.fillText(text, this.canvas.width / 2, y);
      y -= 30;
    }
  }
}
