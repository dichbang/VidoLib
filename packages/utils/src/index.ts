/**
 * BitStreamReader provides low-level bit-wise and byte-wise reading
 * from ArrayBuffers or Uint8Arrays with strict bounds checking.
 */
export class BitStreamReader {
  private buffer: Uint8Array;
  private bytePos: number = 0;
  private bitPos: number = 0;

  constructor(buffer: ArrayBuffer | Uint8Array) {
    this.buffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  }

  public get byteLength(): number {
    return this.buffer.byteLength;
  }

  public get position(): number {
    return this.bytePos;
  }

  public seek(offset: number): void {
    if (offset < 0 || offset > this.buffer.byteLength) {
      throw new RangeError(`Seek offset ${offset} out of bounds (0-${this.buffer.byteLength})`);
    }
    this.bytePos = offset;
    this.bitPos = 0;
  }

  public readUint8(): number {
    if (this.bytePos >= this.buffer.byteLength) throw new RangeError('Unexpected End of Stream');
    return this.buffer[this.bytePos++];
  }

  public readUint16BE(): number {
    const val = (this.readUint8() << 8) | this.readUint8();
    return val >>> 0;
  }

  public readUint24BE(): number {
    const val = (this.readUint8() << 16) | (this.readUint8() << 8) | this.readUint8();
    return val >>> 0;
  }

  public readUint32BE(): number {
    const b0 = this.readUint8();
    const b1 = this.readUint8();
    const b2 = this.readUint8();
    const b3 = this.readUint8();
    return ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
  }

  public readUint64BE(): bigint {
    const high = BigInt(this.readUint32BE());
    const low = BigInt(this.readUint32BE());
    return (high << 32n) | low;
  }

  public readBytes(length: number): Uint8Array {
    if (length < 0 || this.bytePos + length > this.buffer.byteLength) {
      throw new RangeError(`Cannot read ${length} bytes at position ${this.bytePos} (buffer length ${this.buffer.byteLength})`);
    }
    const result = this.buffer.subarray(this.bytePos, this.bytePos + length);
    this.bytePos += length;
    return result;
  }

  public readString(length: number, encoding: 'ascii' | 'utf8' = 'ascii'): string {
    const bytes = this.readBytes(length);
    if (encoding === 'utf8' && typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(bytes);
    }
    return String.fromCharCode.apply(null, Array.from(bytes));
  }

  public readBits(bitsCount: number): number {
    if (bitsCount <= 0 || bitsCount > 32) {
      throw new RangeError(`readBits requires 1 to 32 bits, got ${bitsCount}`);
    }
    let value = 0;
    for (let i = 0; i < bitsCount; i++) {
      if (this.bytePos >= this.buffer.byteLength) throw new RangeError('Unexpected End of Stream');
      const bit = (this.buffer[this.bytePos] >> (7 - this.bitPos)) & 1;
      value = (value << 1) | bit;
      this.bitPos++;
      if (this.bitPos === 8) {
        this.bitPos = 0;
        this.bytePos++;
      }
    }
    return value >>> 0;
  }

  public skipBytes(count: number): void {
    this.seek(this.bytePos + count);
  }
}

/**
 * RingBuffer provides a zero-copy memory-bounded ring buffer for high-throughput streaming media.
 */
export class RingBuffer {
  private buffer: Uint8Array;
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;

  constructor(public readonly capacity: number) {
    this.buffer = new Uint8Array(capacity);
  }

  public get availableRead(): number {
    return this.count;
  }

  public get availableWrite(): number {
    return this.capacity - this.count;
  }

  public write(data: Uint8Array): number {
    const toWrite = Math.min(data.length, this.availableWrite);
    if (toWrite <= 0) return 0;

    const firstChunk = Math.min(toWrite, this.capacity - this.tail);
    this.buffer.set(data.subarray(0, firstChunk), this.tail);

    if (toWrite > firstChunk) {
      this.buffer.set(data.subarray(firstChunk, toWrite), 0);
    }

    this.tail = (this.tail + toWrite) % this.capacity;
    this.count += toWrite;
    return toWrite;
  }

  public read(output: Uint8Array): number {
    const toRead = Math.min(output.length, this.count);
    if (toRead <= 0) return 0;

    const firstChunk = Math.min(toRead, this.capacity - this.head);
    output.set(this.buffer.subarray(this.head, this.head + firstChunk), 0);

    if (toRead > firstChunk) {
      output.set(this.buffer.subarray(this.head + firstChunk, this.head + toRead), firstChunk);
    }

    this.head = (this.head + toRead) % this.capacity;
    this.count -= toRead;
    return toRead;
  }

  public clear(): void {
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }
}

/**
 * Structured Logger for media-runtime debugging.
 */
export class Logger {
  constructor(private namespace: string) {}

  public debug(msg: string, ...args: unknown[]): void {
    console.debug(`[media-runtime:${this.namespace}] ${msg}`, ...args);
  }

  public info(msg: string, ...args: unknown[]): void {
    console.info(`[media-runtime:${this.namespace}] ${msg}`, ...args);
  }

  public warn(msg: string, ...args: unknown[]): void {
    console.warn(`[media-runtime:${this.namespace}] ${msg}`, ...args);
  }

  public error(msg: string, ...args: unknown[]): void {
    console.error(`[media-runtime:${this.namespace}] ${msg}`, ...args);
  }
}
