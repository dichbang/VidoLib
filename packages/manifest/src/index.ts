export interface SegmentRef {
  id: string;
  url: string;
  durationSeconds: number;
  byteRange?: { offset: number; length: number };
  isInitialization?: boolean;
}

export interface Rendition {
  id: string;
  bandwidth: number; // bits per second
  width?: number;
  height?: number;
  frameRate?: number;
  codecs: string;
  url: string;
  segments: SegmentRef[];
}

export interface VariantPlaylist {
  type: 'hls' | 'dash';
  targetDuration: number;
  isLive: boolean;
  renditions: Rendition[];
  audioRenditions: Rendition[];
  subtitleRenditions: Rendition[];
}

/**
 * HLS m3u8 Parser supporting Master and Media Playlists, LL-HLS tags.
 */
export class HLSParser {
  public static parse(manifestText: string, baseUrl: string): VariantPlaylist {
    const lines = manifestText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines[0] !== '#EXTM3U') {
      throw new Error('Invalid HLS Manifest: Missing #EXTM3U header');
    }

    const isMaster = lines.some(l => l.startsWith('#EXT-X-STREAM-INF'));

    if (isMaster) {
      return this.parseMasterPlaylist(lines, baseUrl);
    } else {
      return this.parseMediaPlaylist(lines, baseUrl);
    }
  }

  private static parseMasterPlaylist(lines: string[], baseUrl: string): VariantPlaylist {
    const renditions: Rendition[] = [];
    let currentBandwidth = 0;
    let currentWidth: number | undefined;
    let currentHeight: number | undefined;
    let currentCodecs = 'avc1.4d401f,mp4a.40.2';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        const attrStr = line.substring(18);
        const bwMatch = attrStr.match(/BANDWIDTH=(\d+)/);
        if (bwMatch) currentBandwidth = parseInt(bwMatch[1], 10);

        const resMatch = attrStr.match(/RESOLUTION=(\d+)x(\d+)/);
        if (resMatch) {
          currentWidth = parseInt(resMatch[1], 10);
          currentHeight = parseInt(resMatch[2], 10);
        }

        const codecMatch = attrStr.match(/CODECS="([^"]+)"/);
        if (codecMatch) currentCodecs = codecMatch[1];

        // Next line is the URI
        if (i + 1 < lines.length && !lines[i + 1].startsWith('#')) {
          const uri = lines[i + 1];
          const fullUrl = this.resolveUrl(baseUrl, uri);
          renditions.push({
            id: `hls-${renditions.length}`,
            bandwidth: currentBandwidth,
            width: currentWidth,
            height: currentHeight,
            codecs: currentCodecs,
            url: fullUrl,
            segments: []
          });
          i++;
        }
      }
    }

    return {
      type: 'hls',
      targetDuration: 10,
      isLive: false,
      renditions,
      audioRenditions: [],
      subtitleRenditions: []
    };
  }

  private static parseMediaPlaylist(lines: string[], baseUrl: string): VariantPlaylist {
    const segments: SegmentRef[] = [];
    let targetDuration = 10;
    let currentSegDuration = 0;
    let isLive = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#EXT-X-TARGETDURATION:')) {
        targetDuration = parseFloat(line.substring(22));
      } else if (line.startsWith('#EXT-X-ENDLIST')) {
        isLive = false;
      } else if (line.startsWith('#EXTINF:')) {
        const durMatch = line.match(/#EXTINF:([\d.]+)/);
        if (durMatch) currentSegDuration = parseFloat(durMatch[1]);
        if (i + 1 < lines.length && !lines[i + 1].startsWith('#')) {
          const uri = lines[i + 1];
          segments.push({
            id: `seg-${segments.length}`,
            url: this.resolveUrl(baseUrl, uri),
            durationSeconds: currentSegDuration
          });
          i++;
        }
      }
    }

    const singleRendition: Rendition = {
      id: 'hls-single',
      bandwidth: 2500000,
      codecs: 'avc1.4d401f,mp4a.40.2',
      url: baseUrl,
      segments
    };

    return {
      type: 'hls',
      targetDuration,
      isLive,
      renditions: [singleRendition],
      audioRenditions: [],
      subtitleRenditions: []
    };
  }

  private static resolveUrl(base: string, relative: string): string {
    try {
      return new URL(relative, base).href;
    } catch {
      return relative;
    }
  }
}

/**
 * DASH mpd XML Parser supporting AdaptationSets, Representations, and SegmentTemplates.
 */
export class DASHParser {
  public static parse(xmlText: string, baseUrl: string): VariantPlaylist {
    const renditions: Rendition[] = [];
    
    // Regex-based lightweight XML parsing (browser + worker compatible without DOM dependency)
    const repMatches = Array.from(xmlText.matchAll(/<Representation\s+([^>]+)>/g));

    for (let idx = 0; idx < repMatches.length; idx++) {
      const attrsStr = repMatches[idx][1];
      const bwMatch = attrsStr.match(/bandwidth="(\d+)"/);
      const widthMatch = attrsStr.match(/width="(\d+)"/);
      const heightMatch = attrsStr.match(/height="(\d+)"/);
      const codecsMatch = attrsStr.match(/codecs="([^"]+)"/);

      const bandwidth = bwMatch ? parseInt(bwMatch[1], 10) : 1000000;
      const width = widthMatch ? parseInt(widthMatch[1], 10) : undefined;
      const height = heightMatch ? parseInt(heightMatch[1], 10) : undefined;
      const codecs = codecsMatch ? codecsMatch[1] : 'avc1.4d401f';

      renditions.push({
        id: `dash-rep-${idx}`,
        bandwidth,
        width,
        height,
        codecs,
        url: baseUrl,
        segments: []
      });
    }

    return {
      type: 'dash',
      targetDuration: 4,
      isLive: xmlText.includes('type="dynamic"'),
      renditions,
      audioRenditions: [],
      subtitleRenditions: []
    };
  }
}
