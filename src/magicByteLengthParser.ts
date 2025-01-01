/* eslint-disable no-cond-assign */
interface MagicByteLengthParserOptions {
  /** The delimiter on which an incoming block of data is considered to start */
  magicByte: number;
}

type PushFn = (data: Buffer) => void;

export class MagicByteLengthParser {
  buffer: Buffer;

  delimiter: number;

  constructor({ magicByte }: MagicByteLengthParserOptions = { magicByte: 0x82 }) {
    if (magicByte === undefined) {
      throw new TypeError('"magicByte" is undefined');
    }

    this.buffer = Buffer.alloc(0);
    this.delimiter = magicByte;
  }

  transform(chunk: Buffer, pushFn: PushFn) {
    let data = Buffer.concat([this.buffer, chunk]);
    let position;
    while ((position = data.indexOf(this.delimiter)) !== -1) {
      // We need to at least be able to read the length byte
      if (data.length < position + 2) break;
      const nextLength = data[position + 1];
      // Make sure we have enough bytes to meet this length
      const expectedEnd = position + nextLength + 2;
      if (data.length < expectedEnd) break;
      pushFn(data.subarray(position + 2, expectedEnd));
      data = data.subarray(expectedEnd);
    }
    this.buffer = data;
  }

  flush(pushFn: PushFn) {
    pushFn(this.buffer);
    this.buffer = Buffer.alloc(0);
  }
}
