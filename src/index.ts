/* eslint-disable sort-keys-fix/sort-keys-fix */
/* eslint-disable no-underscore-dangle */
import { COMMANDS } from 'commands';
import packets from './packets.json';
import { appendFileSync, writeFileSync } from 'fs';
import { MagicByteLengthParser } from 'magicByteLengthParser';

type PayloadType = 'Sent' | 'Received';

// const file = 'just-packets.json';
const file = 'magic-packets.json';
let isFirstLine = true;

// function hex2a(hexx: number): string {
//   const hex = hexx.toString(); // force conversion
//   let str = '';
//   for (let i = 0; i < hex.length; i += 2) str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
//   return str;
// }

const payloadInfo = (payload: Buffer, type: string) => {
  if (isFirstLine) {
    isFirstLine = false;
  } else {
    appendFileSync(file, ',');
  }

  const command = payload[1];
  appendFileSync(
    file,
    JSON.stringify({
      type,
      command,
      commandName: Object.entries(COMMANDS).find(([, commandHex]) => command === commandHex)?.[0] ?? 'Unknown',
      payload: payload.join(':'),
      parsed: payload.toString('utf-8')
    })
  );
};

const readPackets = new MagicByteLengthParser();
const writePackets = new MagicByteLengthParser();

const pushFn = (type: PayloadType) => (payload: Buffer) => payloadInfo(payload, type);

const handlePayload = (type: PayloadType, str: string) => {
  const payload = Buffer.from(str.replaceAll(':', ''), 'hex');
  (type === 'Sent' ? writePackets : readPackets).transform(payload, pushFn(type));
};

writeFileSync(file, '[');
packets.map(packet => {
  const { usbcom } = packet._source.layers;
  if (usbcom['usbcom.data.out_payload']) {
    handlePayload('Sent', usbcom['usbcom.data.out_payload']);
  }
  if (usbcom['usbcom.data.in_payload']) {
    handlePayload('Received', usbcom['usbcom.data.in_payload']);
  }
  return null;
});
appendFileSync(file, ']');
