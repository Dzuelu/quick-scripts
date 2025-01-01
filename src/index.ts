/* eslint-disable sort-keys-fix/sort-keys-fix */
/* eslint-disable no-underscore-dangle */
import { COMMANDS } from 'commands';
import packets from './packets.json';
import { appendFileSync, writeFileSync } from 'fs';

const file = 'just-packets.json';
let isFirstLine = true;

function hex2a(hexx: string | number) {
  const hex = hexx.toString(); // force conversion
  let str = '';
  for (let i = 0; i < hex.length; i += 2) str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

const payloadInfo = (payload: string, type: string) => {
  if (isFirstLine) {
    isFirstLine = false;
  } else {
    appendFileSync(file, ',');
  }

  const command = parseInt(payload.split(':')[1], 16);
  appendFileSync(
    file,
    JSON.stringify({
      type,
      command,
      commandName: Object.entries(COMMANDS).find(([, commandHex]) => command === commandHex)?.[0] ?? 'Unknown',
      payload,
      parsed: payload.split(':').map(hex2a).join('')
    })
  );
};

writeFileSync(file, '[');
packets.map(packet => {
  const { usbcom } = packet._source.layers;
  if (usbcom['usbcom.data.out_payload']) {
    payloadInfo(usbcom['usbcom.data.out_payload'], 'Sent');
  }
  if (usbcom['usbcom.data.in_payload']) {
    payloadInfo(usbcom['usbcom.data.in_payload'], 'Received');
  }
  return null;
});
appendFileSync(file, ']');
