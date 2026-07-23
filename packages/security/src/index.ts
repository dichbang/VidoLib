import { ContainerDemuxer } from '@media-runtime/containers';

export interface FuzzResult {
  iterations: number;
  crashes: number;
  unboundedAllocations: number;
  errors: Array<{ iteration: number; message: string }>;
}

export class ByteMutator {
  public static mutate(input: Uint8Array, mutationRate: number = 0.05): Uint8Array {
    const mutated = new Uint8Array(input);
    const count = Math.ceil(mutated.length * mutationRate);

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * mutated.length);
      const mode = Math.random();

      if (mode < 0.33) {
        mutated[idx] = Math.floor(Math.random() * 256);
      } else if (mode < 0.66) {
        mutated[idx] ^= 0xFF;
      } else {
        mutated[idx] = 0xFF;
      }
    }
    return mutated;
  }
}

export class FuzzTarget {
  public static run(demuxer: ContainerDemuxer, seedSample: Uint8Array, iterations: number = 1000): FuzzResult {
    let crashes = 0;
    let unboundedAllocations = 0;
    const errors: Array<{ iteration: number; message: string }> = [];

    for (let i = 0; i < iterations; i++) {
      const mutated = ByteMutator.mutate(seedSample);
      try {
        demuxer.demux(mutated);
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (
          msg.includes('exceeds maximum safety limit') ||
          msg.includes('Security') ||
          msg.includes('RangeError') ||
          msg.includes('End of Stream') ||
          msg.includes('out of bounds')
        ) {
          // Expected input validation catch
        } else {
          crashes++;
          errors.push({ iteration: i, message: msg });
        }
      }
    }

    return { iterations, crashes, unboundedAllocations, errors };
  }
}

export const CSP_RECOMMENDED_DIRECTIVES = `
# media-runtime Recommended Content Security Policy (CSP)
default-src 'self';
script-src 'self' 'wasm-unsafe-eval' blob:;
worker-src 'self' blob:;
connect-src 'self' https: wss: ipfs:;
media-src 'self' blob: data:;
img-src 'self' blob: data:;
`;
